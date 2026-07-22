import React from 'react'

export function Chip({
  active,
  onClick,
  children,
  colorClass = 'border-brand text-brand bg-brand/10',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  colorClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
        active ? colorClass : 'border-border text-muted bg-surface2 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}
