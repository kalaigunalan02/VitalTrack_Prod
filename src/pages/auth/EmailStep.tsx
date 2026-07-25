import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthButton } from '../../components/auth/AuthButton'
import { accountExists } from '../../lib/storage'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EmailStep() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email is required.')
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.')

    setBusy(true)
    let exists: boolean | null = null
    try {
      // accountExists() queries the check-email edge function in cloud mode.
      // If the function isn't deployed (or errors), it returns false — but we
      // treat that as "unknown", not "definitely new", and default to the
      // password screen so existing users aren't wrongly sent to registration.
      exists = await accountExists(email.trim())
    } catch {
      exists = null // unknown — treat as existing (safer default)
    }

    // Route to the password screen when the user exists OR we can't tell.
    // Only route to registration when we're certain the account is new.
    // This fixes the cross-device bug: an existing user on a new device always
    // reaches the password screen.
    navigate('/auth/password', { state: { email: email.trim(), knownNew: exists === false } })
    setBusy(false)
  }

  return (
    <AuthLayout>
      <Link to="/login" className="flex items-center gap-2 text-muted text-sm mb-8 w-fit hover:text-white">
        <ArrowLeft size={16} /> Back to login
      </Link>
      <h2 className="text-2xl font-bold mb-1">Continue with Email</h2>
      <p className="text-muted mb-8">Enter your email to sign in or create an account.</p>

      <form onSubmit={handleContinue} className="space-y-5">
        <div>
          <label className="label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        {error && <p role="alert" className="text-danger text-sm">{error}</p>}

        <AuthButton type="submit" label={busy ? 'Checking…' : 'Continue'} variant="primary" busy={busy} />
      </form>

      <p className="text-center text-muted text-sm mt-6">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register', { state: { email: email.trim() } })}
          className="text-brand font-medium hover:underline"
        >
          Create one
        </button>
      </p>
    </AuthLayout>
  )
}
