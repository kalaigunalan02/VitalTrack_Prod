import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await requestPasswordReset(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthLayout>
      <Link to="/login" className="flex items-center gap-2 text-muted text-sm mb-8 w-fit">
        <ArrowLeft size={16} /> Back to login
      </Link>
      <h2 className="text-2xl font-bold mb-1">Reset password</h2>
      <p className="text-muted mb-8">We'll send you a reset link</p>

      {sent ? (
        <p className="text-brand text-sm bg-brand/10 border border-brand/30 rounded-lg p-4">
          Check your email — if an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
