import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, UserRound } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthButton } from '../components/auth/AuthButton'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Standard 4-color Google "G" mark.
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

// Monochrome Apple logo (filled).
function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.58-1.81 3.14-.46 7.78 1.3 10.33.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.12zM14.6 4.59c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
    </svg>
  )
}

export default function Login() {
  const { signInGuest, session } = useAuth()
  const navigate = useNavigate()
  const [busyProvider, setBusyProvider] = useState<null | 'google' | 'apple' | 'guest'>(null)
  const [error, setError] = useState('')

  // If an OAuth redirect lands back here with a valid session, go to dashboard.
  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true })
  }, [session, navigate])

  // Google/Apple OAuth: hands off to the provider, then redirects back here.
  // Requires the provider to be configured in Supabase Dashboard →
  // Authentication → Providers (see README "OAuth setup").
  async function signInWithOAuth(provider: 'google' | 'apple') {
    setError('')
    if (!isSupabaseConfigured) {
      setError('Cloud backend is not configured. See the README to set up Supabase.')
      return
    }
    setBusyProvider(provider)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (oauthError) {
        // Most common cause: provider not enabled in Supabase dashboard yet.
        setError(
          provider === 'google'
            ? 'Google sign-in is not configured. Enable it in Supabase → Authentication → Providers (see README).'
            : 'Apple sign-in is not configured. Enable it in Supabase → Authentication → Providers (see README).'
        )
        setBusyProvider(null)
      }
      // If no error, the browser is redirecting to the provider — leave busy on.
    } catch {
      setError('Could not start sign-in. Please try again.')
      setBusyProvider(null)
    }
  }

  async function handleGuest() {
    setError('')
    setBusyProvider('guest')
    try {
      await signInGuest()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setBusyProvider(null)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to VitalTrack</h2>
        <p className="text-muted text-sm leading-relaxed">
          Track your health records securely across all your devices.
        </p>
      </div>

      <div className="space-y-3">
        {/* 1. Google OAuth — temporarily disabled (provider not yet configured). */}
        <AuthButton
          icon={<GoogleIcon />}
          label="Continue with Google"
          disabled
          badge="Coming soon"
          title="Google sign-in is coming soon."
        />

        {/* 2. Apple OAuth — temporarily disabled (provider not yet configured). */}
        <AuthButton
          icon={<AppleIcon />}
          label="Continue with Apple"
          disabled
          badge="Coming soon"
          title="Apple sign-in is coming soon."
        />

        {/* 3. Email — multi-step flow */}
        <AuthButton
          icon={<Mail size={20} />}
          label="Continue with Email"
          variant="primary"
          onClick={() => navigate('/auth/email')}
        />

        {/* 4. Guest — local-only session. Disabled in production (demo account
            stays in the DB, just no UI entry point for real users). */}
        {import.meta.env.VITE_APP_ENV !== 'production' && (
          <>
            <AuthButton
              icon={<UserRound size={20} />}
              label={busyProvider === 'guest' ? 'Signing in…' : 'Continue as Guest'}
              variant="ghost"
              busy={busyProvider === 'guest'}
              onClick={handleGuest}
            />
          </>
        )}
      </div>

      {import.meta.env.VITE_APP_ENV !== 'production' && (
        <p className="text-center text-xs text-muted mt-3">
          Guest mode: data stays on this device.
        </p>
      )}

      {error && (
        <p role="alert" className="text-danger text-sm mt-4 text-center">
          {error}
        </p>
      )}
    </AuthLayout>
  )
}
