import React, { useState } from 'react'
import { ChevronDown, HelpCircle, Heart, Menu } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { EnvBadge } from '../ui/EnvBadge'

interface TopbarProps {
  title: string
  onOpenMenu?: () => void
}

export function Topbar({ title, onOpenMenu }: TopbarProps) {
  const { profiles, activeProfile } = useData()
  const { setActiveProfile } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center justify-between px-4 lg:px-10 py-4 lg:py-6 border-b border-border sticky top-0 bg-bg/95 backdrop-blur z-10">
      {/* Mobile/tablet: hamburger + brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onOpenMenu}
          className="p-1.5 -ml-1 text-muted hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center">
            <Heart size={16} className="text-brand" />
          </div>
          <span className="font-bold leading-none flex items-center gap-2">
            VitalTrack <EnvBadge />
          </span>
        </div>
      </div>

      {/* Desktop: page title */}
      <h1 className="hidden lg:block text-xl lg:text-2xl font-bold">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 bg-surface border border-border rounded-full pl-2 pr-3 py-1.5"
        >
          <div className="w-7 h-7 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold">
            {activeProfile?.fullName?.[0] ?? '?'}
          </div>
          <span className="text-sm">{activeProfile?.fullName ?? 'Profile'}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl overflow-hidden shadow-xl z-20">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProfile(p.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 ${
                  p.id === activeProfile?.id ? 'text-brand' : 'text-white'
                }`}
              >
                {p.fullName} {p.isSelf && <span className="text-muted text-xs">(Self)</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

export function HelpFab() {
  return (
    <button className="fixed bottom-5 right-5 w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted hover:text-white z-10">
      <HelpCircle size={18} />
    </button>
  )
}
