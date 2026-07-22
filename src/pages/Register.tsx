import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthButton } from '../components/auth/AuthButton'
import { useAuth } from '../context/AuthContext'

interface EmailLocationState {
  email?: string
}

// Password requirements per the auth spec.
const rules = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'A number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'A special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function strengthLabel(passed: number) {
  if (passed <= 1) return { label: 'Weak', color: 'text-danger', bar: 'bg-danger', width: '20%' }
  if (passed === 2) return { label: 'Fair', color: 'text-warn', bar: 'bg-warn', width: '40%' }
  if (passed === 3) return { label: 'Good', color: 'text-info', bar: 'bg-info', width: '60%' }
  if (passed === 4) return { label: 'Strong', color: 'bg-brand', bar: 'bg-brand', width: '80%' }
  return { label: 'Very strong', color: 'text-brand', bar: 'bg-brand', width: '100%' }
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Email may be pre-filled when arriving from the Email flow.
  const initialEmail = (location.state as EmailLocationState | null)?.email ?? ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const passedRules = useMemo(() => rules.filter((r) => r.test(password)), [password])
  const passedCount = passedRules.length
  const allPassed = passedCount === rules.length
  const strength = strengthLabel(passedCount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!allPassed) return setError('Please meet all password requirements.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await signUp(email, password, fullName)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold mb-1">Create account</h2>
      <p className="text-muted mb-8">Start monitoring your health today</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="fullName">Full Name</label>
          <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email Address</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="input pr-11"
              aria-describedby="password-rules"
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full transition-all ${strength.bar}`} style={{ width: strength.width }} />
                </div>
                <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
              </div>
            </div>
          )}

          <ul id="password-rules" className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {rules.map((r) => {
              const ok = r.test(password)
              return (
                <li key={r.key} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-brand' : 'text-muted'}`}>
                  {ok ? <Check size={12} /> : <X size={12} />} {r.label}
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm Password</label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="input pr-11"
            />
            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p role="alert" className="text-danger text-sm">{error}</p>}

        <AuthButton type="submit" label={busy ? 'Creating account…' : 'Create Account'} variant="primary" busy={busy} />
      </form>

      <p className="text-center text-muted text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
