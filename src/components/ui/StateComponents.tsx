import React from 'react'
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function LoadingState({ message = 'Loading...', size = 'md', fullScreen = false }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-brand`} />
      {message && <p className="text-muted text-sm">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="py-8">{content}</div>
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  fullScreen?: boolean
}

export function ErrorState({ message, onRetry, onDismiss, fullScreen = false }: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md">
      <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-danger" />
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">Something went wrong</h3>
        <p className="text-muted text-sm">{message}</p>
      </div>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn-outline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
        {content}
      </div>
    )
  }

  return <div className="py-8">{content}</div>
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-surface2 border border-border flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'success'
}

export function ErrorBanner({ message, onDismiss, type = 'error' }: ErrorBannerProps) {
  const typeClasses = {
    error: 'bg-danger/15 border-danger/40 text-danger',
    warning: 'bg-warn/15 border-warn/40 text-warn',
    success: 'bg-brand/15 border-brand/40 text-brand',
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${typeClasses[type]} mb-4`}>
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 hover:opacity-70 transition-opacity"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  const baseClasses = "card border border-border rounded-2xl p-6"
  const hoverClasses = hoverable ? "cursor-pointer hover:bg-white/5 transition-colors" : ""
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: React.ReactNode
  color?: string
  onClick?: () => void
}

export function StatCard({ label, value, unit, change, icon, color = 'text-white', onClick }: StatCardProps) {
  return (
    <Card hoverable={!!onClick} onClick={onClick} className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        {icon && <div className="p-2 rounded-lg bg-white/5">{icon}</div>}
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            change.type === 'increase' ? 'text-brand' : 'text-danger'
          }`}>
            <span>{change.type === 'increase' ? '↑' : '↓'}</span>
            <span>{Math.abs(change.value)}%</span>
            <span className="text-muted">vs {change.period}</span>
          </div>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-muted text-sm mt-1">
          {label}
          {unit && <span className="ml-1">{unit}</span>}
        </p>
      </div>
    </Card>
  )
}

interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  showLabel?: boolean
}

export function ProgressRing({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = '#4ADE80',
  showLabel = true 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - (progress * circumference)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.3s ease'
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  showLabel?: boolean
  label?: string
}

export function ProgressBar({ value, max, color = '#4ADE80', showLabel = true, label }: ProgressBarProps) {
  const progress = Math.min(value / max, 1) * 100

  return (
    <div className="space-y-2">
      {(showLabel || label) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted">{label}</span>}
          {showLabel && <span className="font-medium">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs whitespace-nowrap ${positionClasses[position]}`}>
          {content}
          <div className="absolute w-2 h-2 bg-surface border border-border transform rotate-45" 
               style={{
                 [position === 'top' ? 'bottom' : 'top']: '-4px',
                 left: '50%',
                 marginLeft: '-4px'
               }} />
        </div>
      )}
    </div>
  )
}