import React, { createContext, useContext, useEffect, useState } from 'react'
import { Account, Session } from '../types'
import * as storage from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  account: Account | null
  loading: boolean
  error: string | null

  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>
  signInDemo: () => Promise<void>
  signInGuest: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  setActiveProfile: (profileId: string) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

// Persist a session to local React state. (storage.getSession already writes
// it to localStorage; this just mirrors into React.)
function rememberSession(s: Session | null): Session | null {
  return s
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hydrate session on mount. getSession is async (Supabase) but resolves fast
  // from localStorage in fallback mode.
  useEffect(() => {
    let mounted = true
    storage.getSession().then((s) => {
      if (!mounted) return
      setSession(rememberSession(s))
      if (s) {
        storage.getAccount(s.accountId).then((acct) => {
          if (mounted) setAccount(acct ?? null)
        })
      }
      setLoading(false)
    })

    // When Supabase is configured, listen for auth changes (login/logout/token
    // refresh in other tabs) so React state stays in sync.
    let unsub: (() => void) | undefined
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, supaSession) => {
        if (!mounted) return
        if (!supaSession?.user) {
          setSession(null)
          setAccount(null)
        } else {
          storage.getSession().then((s) => {
            if (mounted) setSession(s)
          })
        }
      })
      unsub = () => data.subscription.unsubscribe()
    }

    return () => {
      mounted = false
      unsub?.()
    }
  }, [])

  async function runAuth(fn: () => Promise<Session>): Promise<void> {
    try {
      setError(null)
      setLoading(true)
      const sessionData = await fn()
      setSession(sessionData)
      const acct = await storage.getAccount(sessionData.accountId)
      setAccount(acct ?? null)
    } catch (err) {
      setError(errMsg(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signIn = (email: string, password: string, rememberMe: boolean) =>
    runAuth(() => storage.signIn(email, password, rememberMe))

  const signInDemo = () => runAuth(() => storage.signInDemo())
  // Guest mode: same local seeded account as the demo. Local-only (no cloud
  // sync), as required by the auth spec.
  const signInGuest = signInDemo

  const signUp = (email: string, password: string, fullName: string) =>
    runAuth(() => storage.signUp(email, password, fullName))

  const signOut = async () => {
    await storage.signOut()
    setSession(null)
    setAccount(null)
  }

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null)
      await storage.requestPasswordReset(email)
    } catch (err) {
      setError(errMsg(err))
      throw err
    }
  }

  const setActiveProfile = (profileId: string) => {
    setSession((prev) => {
      if (!prev) return prev
      const updated = { ...prev, activeProfileId: profileId }
      void storage.setActiveProfile(profileId)
      return updated
    })
  }

  const clearError = () => setError(null)

  const value: AuthContextValue = {
    session,
    account,
    loading,
    error,
    signIn,
    signInDemo,
    signInGuest,
    signUp,
    signOut,
    requestPasswordReset,
    setActiveProfile,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
