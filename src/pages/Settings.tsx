import React, { useState } from 'react'
import { User, Bell, Download as DownloadIcon, Lock, Plus, Pencil, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Profile } from '../types'
import { Version } from '../components/ui/Version'
import { Toggle } from '../components/ui/Toggle'

type Tab = 'profiles' | 'notifications' | 'backup' | 'security'

const emptyProfile = (accountId: string): Profile => ({
  id: '',
  accountId,
  fullName: '',
  relationship: 'Self',
  dob: '',
  gender: '',
  height: '',
  weight: '',
  bloodType: 'Unknown',
  medicalConditions: '',
  doctorName: '',
  doctorPhone: '',
  emergencyContact: '',
  notes: '',
  isSelf: false,
  isDefault: false,
})

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profiles')

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profiles', label: 'Profiles', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup', icon: DownloadIcon },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-6 border-b border-border overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 pb-3 text-sm border-b-2 transition-colors shrink-0 ${
              tab === id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profiles' && <ProfilesTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'backup' && <BackupTab />}
      {tab === 'security' && <SecurityTab />}

      <div className="pt-6 border-t border-border">
        <Version />
      </div>
    </div>
  )
}

function ProfilesTab() {
  const { profiles, saveProfile, deleteProfile } = useData()
  const { session } = useAuth()
  const [form, setForm] = useState<Profile>(emptyProfile(session?.accountId ?? ''))
  const [editingId, setEditingId] = useState<string | null>(null)

  function startNew() {
    setForm(emptyProfile(session?.accountId ?? ''))
    setEditingId('new')
  }

  function startEdit(p: Profile) {
    setForm(p)
    setEditingId(p.id)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) return
    const toSave: Profile = { ...form, id: form.id || `prof_${Math.random().toString(36).slice(2, 9)}`, accountId: session?.accountId ?? '' }
    await saveProfile(toSave)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-muted">Manage profiles for each family member</p>
        <button onClick={startNew} className="btn-primary w-full sm:w-auto">
          <Plus size={18} /> Add Profile
        </button>
      </div>

      {editingId && (
        <form onSubmit={handleSave} className="card space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Smith" className="input" />
            </div>
            <div>
              <label className="label">Relationship</label>
              <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="input">
                <option>Self</option><option>Spouse</option><option>Child</option><option>Parent</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="label">Height</label>
              <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="5'10&quot;" className="input" />
            </div>
            <div>
              <label className="label">Weight</label>
              <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="170 lbs" className="input" />
            </div>
            <div>
              <label className="label">Blood Type</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="input">
                {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Medical Conditions</label>
              <input value={form.medicalConditions} onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })} placeholder="e.g. Hypertension" className="input" />
            </div>
            <div>
              <label className="label">Doctor Name</label>
              <input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Dr. Sarah Chen" className="input" />
            </div>
            <div>
              <label className="label">Doctor Phone</label>
              <input value={form.doctorPhone} onChange={(e) => setForm({ ...form, doctorPhone: e.target.value })} placeholder="(555) 000-0000" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Emergency Contact</label>
            <input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Name — Phone" className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." className="input min-h-[80px] resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">✓ Save Profile</button>
            <button type="button" onClick={() => setEditingId(null)} className="btn-outline">✕ Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-brand/15 text-brand flex items-center justify-center font-bold">{p.fullName[0]}</div>
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {p.fullName}
                  {p.isSelf && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted">Self</span>}
                  {p.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-brand/15 text-brand">Default</span>}
                </p>
                <p className="text-muted text-sm">
                  {[p.dob && `DOB: ${p.dob}`, p.bloodType && `Blood: ${p.bloodType}`, p.doctorName && `Dr. ${p.doctorName}`].filter(Boolean).join('   ')}
                  {p.medicalConditions && <><br />{p.medicalConditions}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => startEdit(p)} className="text-muted hover:text-white"><Pencil size={16} /></button>
              {!p.isSelf && <button onClick={() => deleteProfile(p.id)} className="text-muted hover:text-danger"><Trash2 size={16} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [settings, setSettings] = useState({ medication: true, dailyLog: true, weeklyReport: false, trendAlerts: true })
  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'medication', label: 'Medication reminders', desc: 'Get notified at your scheduled dose times' },
    { key: 'dailyLog', label: 'Daily logging reminder', desc: 'A nudge each evening if you haven\'t logged today' },
    { key: 'weeklyReport', label: 'Weekly summary email', desc: 'A digest of your trends sent every Monday' },
    { key: 'trendAlerts', label: 'Trend alerts', desc: 'Alert me if readings trend unusually high' },
  ]
  return (
    <div className="card space-y-5 max-w-2xl">
      {items.map((i) => (
        <div key={i.key} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{i.label}</p>
            <p className="text-muted text-sm">{i.desc}</p>
          </div>
          <Toggle
            checked={settings[i.key]}
            onChange={(v) => setSettings((s) => ({ ...s, [i.key]: v }))}
            label={i.label}
          />
        </div>
      ))}
    </div>
  )
}

function BackupTab() {
  const { records, profiles } = useData()
  function exportAll() {
    const blob = new Blob([JSON.stringify({ profiles, records }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vitaltrack-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="card max-w-2xl space-y-4">
      <p className="text-muted">Your data is automatically synced to the cloud as you log it. You can also manually export or import a full backup.</p>
      <div className="flex gap-3">
        <button onClick={exportAll} className="btn-outline">Export all data</button>
        <label className="btn-outline cursor-pointer">
          Import data
          <input type="file" accept="application/json" className="hidden" />
        </label>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="card max-w-2xl space-y-5">
      <div>
        <label className="label">Current Password</label>
        <input type="password" className="input" placeholder="••••••••" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="label">New Password</label><input type="password" className="input" placeholder="••••••••" /></div>
        <div><label className="label">Confirm New Password</label><input type="password" className="input" placeholder="••••••••" /></div>
      </div>
      <button className="btn-primary">Update Password</button>
      <div className="pt-5 border-t border-border">
        <p className="font-medium mb-1">Active sessions</p>
        <p className="text-muted text-sm mb-3">Sign out everywhere except this device.</p>
        <button className="btn-outline">Sign out of all devices</button>
      </div>
      <div className="pt-5 border-t border-border">
        <p className="font-medium mb-1 text-danger">Delete account</p>
        <p className="text-muted text-sm mb-3">Permanently deletes your account and all associated data.</p>
        <button className="btn bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25">Delete Account</button>
      </div>
    </div>
  )
}
