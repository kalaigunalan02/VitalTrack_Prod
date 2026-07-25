import React, { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthButton } from '../../components/auth/AuthButton'
import { useAuth } from '../../context/AuthContext'

interface EmailLocationState {
  email?: string
  knownNew?: boolean
}

export default function PasswordStep() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const email = (location.state as EmailLocationState | null)?.email
    ?? new URLSearchParams(location.search).get('email')
    ?? ''
  // If the email step was certain this account doesn't exist yet, bounce to
  // registration immediately (only happens when the edge function is deployed
  // and confirmed the email is new).
  const knownNew = (location.state as EmailLocationState | null)?.knownNew === true

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // IMPORTANT: use <Navigate> for redirects during render. Calling navigate()
  // during render throws "Cannot update a component while rendering" → black
  // screen. <Navigate> is the React-Router-blessed way to redirect. These
  // returns come AFTER all hooks so the Rules of Hooks are preserved.
  if (knownNew) {
    // TEMP DIAGNOSTIC LOG (requirement §9)
    console.log('[auth] password screen → redirect to /register (knownNew=true, confirmed new email)')
    return <Navigate to="/register" replace state={{ email }} />
  }
  if (!email) {
    console.log('[auth] password screen → redirect to /auth/email (no email in state)')
    return <Navigate to="/auth/email" replace />
  }
  console.log('[auth] password screen rendered for', email, '| knownNew =', knownNew)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password) return setError('Please enter your password.')
    setBusy(true)
    try {
      await signIn(email, password, true)
      navigate('/dashboard')
    } catch {
      // Supabase returns the same "invalid credentials" error whether the
      // account doesn't exist OR the password is wrong (by design, for
      // security). So we can't auto-branch here. Show the error and offer a
      // clear path to register in case the user is actually new.
      setError('Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={() => navigate('/auth/email')}
        className="flex items-center gap-2 text-muted text-sm mb-8 w-fit hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-2xl font-bold mb-1">Enter your password</h2>
      <p className="text-muted mb-2 break-all">
        Signing in as <span className="text-white font-medium">{email}</span>
      </p>
      <p className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/auth/email')}
          className="text-brand text-sm hover:underline"
        >
          Use a different email
        </button>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <Link to="/forgot-password" className="text-brand text-sm hover:underline">Forgot password?</Link>
        </div>

        {error && (
          <div role="alert" className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-3">
            <p>{error}</p>
            <p className="mt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register', { state: { email } })}
                className="text-brand font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        )}

        <AuthButton type="submit" label={busy ? 'Signing in…' : 'Sign In'} variant="primary" busy={busy} />
      </form>
    </AuthLayout>
  )
}
