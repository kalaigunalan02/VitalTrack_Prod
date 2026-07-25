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
    // accountExists() returns:
    //   true  = exists, false = confirmed new, null = unknown (fn missing/errored)
    let exists: boolean | null = null
    try {
      exists = await accountExists(email.trim())
    } catch {
      exists = null // unknown — default to the password screen
    }

    // TEMP DIAGNOSTIC LOG (requirement §9): shows the lookup result + decision.
    console.log('[auth] email =', email.trim(), '| lookup =', exists, '| knownNew =', exists === false)

    // Route to the password screen when the user exists OR we can't tell.
    // Only route to registration when we're CERTAIN the account is new
    // (exists === false). This is the cross-device fix: an existing user on a
    // new device always reaches the password screen, never registration.
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
