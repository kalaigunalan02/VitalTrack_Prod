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
    try {
      const exists = await accountExists(email.trim())
      // Existing user → password; new user → registration (pre-filled email).
      const target = exists ? '/auth/password' : '/register'
      navigate(target, { state: { email: email.trim() } })
    } catch {
      setError('Could not check account. Please try again.')
    } finally {
      setBusy(false)
    }
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
    </AuthLayout>
  )
}
