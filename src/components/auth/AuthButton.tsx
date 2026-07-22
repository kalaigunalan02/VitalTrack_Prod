import React from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'outline' | 'ghost'

interface AuthButtonProps {
  icon?: React.ReactNode
  label: string
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  busy?: boolean
  badge?: string
  title?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-bg hover:bg-brand-light',
  outline: 'bg-surface2 text-white border border-border hover:bg-white/5',
  ghost: 'bg-transparent text-muted border border-border hover:text-white hover:bg-white/5',
}

export function AuthButton({
  icon,
  label,
  onClick,
  variant = 'outline',
  disabled = false,
  busy = false,
  badge,
  title,
  type = 'button',
  fullWidth = true,
}: AuthButtonProps) {
  const isDisabled = disabled || busy
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-label={title ?? label}
      className={`relative flex items-center justify-center gap-3 rounded-lg px-4 py-3.5 font-semibold transition-colors min-h-[52px] ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
    >
      {busy ? <Loader2 size={20} className="animate-spin" /> : icon}
      <span>{label}</span>
      {badge && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-muted">
          {badge}
        </span>
      )}
    </button>
  )
}
