import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthButton } from '../components/auth/AuthButton'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Reset-password state: when the user returns from the email recovery link,
  // Supabase establishes a recovery session. We detect it and show the new-
  // password form instead of the email-request form.
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    // Supabase puts the auth event + type in the URL hash after a recovery
    // redirect. detectSessionInUrl (set in supabase.ts) handles establishing
    // the session; here we just check whether a session now exists.
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // A recovery redirect lands the user here with an active session.
        // (Distinguish from a normal login session is not strictly necessary —
        // if they're on /forgot-password with a session, they came from a
        // recovery link because the normal flow would have routed to dashboard.)
        setIsRecoverySession(true)
      }
    })
  }, [])

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? 'Could not send reset email.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    setBusy(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message)
      setResetDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Could not update password.')
    } finally {
      setBusy(false)
    }
  }

  // --- Recovery session: set a new password ---
  if (isRecoverySession && !resetDone) {
    return (
      <AuthLayout>
        <Link to="/login" className="flex items-center gap-2 text-muted text-sm mb-8 w-fit hover:text-white">
          <ArrowLeft size={16} /> Back to login
        </Link>
        <h2 className="text-2xl font-bold mb-1">Set a new password</h2>
        <p className="text-muted mb-8">Enter your new password below.</p>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="label" htmlFor="newpw">New Password</label>
            <div className="relative">
              <input
                id="newpw"
                type={showPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input pr-11"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="confirmpw">Confirm Password</label>
            <input
              id="confirmpw"
              type={showPw ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="input"
            />
          </div>
          {error && <p role="alert" className="text-danger text-sm">{error}</p>}
          <AuthButton type="submit" label={busy ? 'Updating…' : 'Update Password'} variant="primary" busy={busy} />
        </form>
      </AuthLayout>
    )
  }

  if (resetDone) {
    return (
      <AuthLayout>
        <h2 className="text-2xl font-bold mb-2">Password updated</h2>
        <p className="text-brand text-sm bg-brand/10 border border-brand/30 rounded-lg p-4 mb-6">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link to="/login" className="btn-primary w-full text-center">Back to Login</Link>
      </AuthLayout>
    )
  }

  // --- Default: request a reset email ---
  return (
    <AuthLayout>
      <Link to="/login" className="flex items-center gap-2 text-muted text-sm mb-8 w-fit hover:text-white">
        <ArrowLeft size={16} /> Back to login
      </Link>
      <h2 className="text-2xl font-bold mb-1">Reset password</h2>
      <p className="text-muted mb-8">We'll send you a reset link</p>

      {sent ? (
        <p className="text-brand text-sm bg-brand/10 border border-brand/30 rounded-lg p-4">
          Check your email — if an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label className="label" htmlFor="reset-email">Email Address</label>
            <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
          </div>
          {error && <p role="alert" className="text-danger text-sm">{error}</p>}
          <AuthButton type="submit" label={busy ? 'Sending…' : 'Send Reset Link'} variant="primary" busy={busy} />
        </form>
      )}
    </AuthLayout>
  )
}
