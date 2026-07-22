import React from 'react'
import { NavLink } from 'react-router-dom'
import { Heart, LayoutGrid, PlusCircle, History, FileText, Settings as SettingsIcon, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { EnvBadge } from '../ui/EnvBadge'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/add-record', label: 'Add Record', icon: PlusCircle },
  { to: '/history', label: 'History', icon: History },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar() {
  const { account, signOut } = useAuth()
  const { activeProfile } = useData()

  return (
    <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col border-r border-border bg-bg h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center">
          <Heart size={20} className="text-brand" />
        </div>
        <div>
          <div className="font-bold leading-tight flex items-center gap-2">
            VitalTrack <EnvBadge />
          </div>
          <div className="text-xs text-muted leading-tight">Health Monitor</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-brand/15 text-brand' : 'text-muted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center">
            <User size={16} className="text-muted" />
          </div>
          <div className="min-w-0">
            <div className="text-sm truncate">{activeProfile?.fullName ?? 'User'}</div>
            <div className="text-xs text-muted truncate">{account?.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-2 px-2 py-2 text-sm text-muted hover:text-white w-full"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
