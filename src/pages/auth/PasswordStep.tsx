import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthButton } from '../../components/auth/AuthButton'
import { useAuth } from '../../context/AuthContext'

interface EmailLocationState {
  email?: string
}

export default function PasswordStep() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn } = useAuth()

  // Email is handed off from the EmailStep via router state; fall back to a
  // query param, and if neither is present, send the user back to email entry.
  const email = (location.state as EmailLocationState | null)?.email
    ?? new URLSearchParams(location.search).get('email')
    ?? ''

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!email) {
    // No email context — can't sign in. Return to email step.
    navigate('/auth/email', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password) return setError('Please enter your password.')
    setBusy(true)
    try {
      await signIn(email, password, true)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password.')
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

        {error && <p role="alert" className="text-danger text-sm">{error}</p>}

        <AuthButton type="submit" label={busy ? 'Signing in…' : 'Sign In'} variant="primary" busy={busy} />
      </form>
    </AuthLayout>
  )
}
