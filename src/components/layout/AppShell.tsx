import React, { useState } from 'react'
import { Navigate, Outlet, useLocation, NavLink } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar, HelpFab } from './Topbar'
import { useAuth } from '../../context/AuthContext'
import { LayoutGrid, PlusCircle, History, FileText, Settings as SettingsIcon, X, LogOut } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/add-record': 'Add Record',
  '/history': 'History',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

const mobileNav = [
  { to: '/dashboard', icon: LayoutGrid },
  { to: '/add-record', icon: PlusCircle },
  { to: '/history', icon: History },
  { to: '/reports', icon: FileText },
  { to: '/settings', icon: SettingsIcon },
]

// Drawer nav (mobile/tablet). Mirrors Sidebar.tsx items; duplicated rather
// than shared so the drawer keeps its own styling/close behavior.
const drawerNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/add-record', label: 'Add Record', icon: PlusCircle },
  { to: '/history', label: 'History', icon: History },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function AppShell() {
  const { session, loading, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />

  const title = titles[location.pathname] ?? 'VitalTrack'

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0 safe-bottom">
        <Topbar title={title} onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 lg:px-10 py-6 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
      <HelpFab />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 max-w-[100vw] bg-surface border-t border-border flex items-center justify-around py-2 z-20"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {mobileNav.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `min-w-0 flex-1 flex justify-center p-3 rounded-lg ${isActive ? 'text-brand' : 'text-muted'}`}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      {/* Mobile/tablet drawer — covers lg and below (phones + tablets) */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-bg border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <span className="font-bold">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="text-muted hover:text-white" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1" onClick={() => setMenuOpen(false)}>
              {drawerNav.map(({ to, label, icon: Icon }) => (
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
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm text-muted hover:text-white w-full"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
