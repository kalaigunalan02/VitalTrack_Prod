import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Calendar as CalIcon, Table as TableIcon, Search, ChevronLeft, ChevronRight, ChevronDown, Pencil } from 'lucide-react'
import { useData } from '../context/DataContext'
import { classifyBP, bpDotColor } from '../lib/classification'
import { recordSummary, categoryLabel, sleepDuration } from '../lib/summary'
import { Heart, Utensils, Dumbbell, Moon, AlertTriangle, Brain, Pill, Droplets } from 'lucide-react'
import { Category, HealthRecord } from '../types'

const categoryIcon: Record<Category, any> = {
  blood: Heart, meal: Utensils, exercise: Dumbbell, sleep: Moon,
  symptoms: AlertTriangle, stress: Brain, medication: Pill, water: Droplets,
}
const categoryColor: Record<Category, string> = {
  blood: 'text-danger', meal: 'text-meal', exercise: 'text-brand', sleep: 'text-sleep',
  symptoms: 'text-symptom', stress: 'text-warn', medication: 'text-info', water: 'text-water',
}

type View = 'timeline' | 'calendar' | 'table'

function groupByDate(records: HealthRecord[]) {
  const map = new Map<string, HealthRecord[]>()
  for (const r of records) {
    if (!map.has(r.date)) map.set(r.date, [])
    map.get(r.date)!.push(r)
  }
  return [...map.entries()]
    .map(([date, recs]) => ({ date, records: recs.sort((a, b) => (a.time < b.time ? -1 : 1)) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

function dayClassification(recs: HealthRecord[]) {
  const bp = recs.filter((r) => r.category === 'blood')
  if (!bp.length) return null
  const last = bp[bp.length - 1]
  return classifyBP(last.fields.systolic, last.fields.diastolic)
}

export default function History() {
  const { records } = useData()
  const [view, setView] = useState<View>('timeline')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter((r) => recordSummary(r).toLowerCase().includes(q) || categoryLabel[r.category].toLowerCase().includes(q))
  }, [records, search])

  return (
    <div className="space-y-6">
      <div className="inline-flex bg-surface border border-border rounded-xl p-1">
        <TabButton active={view === 'timeline'} onClick={() => setView('timeline')} icon={<List size={16} />} label="Timeline" />
        <TabButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalIcon size={16} />} label="Calendar" />
        <TabButton active={view === 'table'} onClick={() => setView('table')} icon={<TableIcon size={16} />} label="Table" />
      </div>

      {view !== 'calendar' && (
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === 'table' ? 'Search...' : 'Search entries...'} className="input pl-11" />
        </div>
      )}

      {view === 'timeline' && <TimelineView records={filtered} />}
      {view === 'calendar' && <CalendarView records={records} />}
      {view === 'table' && <TableView records={filtered} />}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-surface2 text-white' : 'text-muted hover:text-white'}`}>
      {icon} {label}
    </button>
  )
}

function TimelineView({ records }: { records: HealthRecord[] }) {
  const groups = useMemo(() => groupByDate(records), [records])
  const [expanded, setExpanded] = useState<string | null>(groups[0]?.date ?? null)
  const navigate = useNavigate()

  if (!groups.length) return <p className="text-muted text-sm py-10 text-center">No entries found.</p>

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const bp = g.records.filter((r) => r.category === 'blood')
        const sleep = g.records.find((r) => r.category === 'sleep')
        const isOpen = expanded === g.date
        return (
          <div key={g.date} className="card">
            <button onClick={() => setExpanded(isOpen ? null : g.date)} className="w-full flex items-center justify-between text-left">
              <div>
                <p className="font-bold">{new Date(g.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-sm text-muted mt-1 flex flex-wrap gap-x-3">
                  {bp.length > 0 && <span className="text-orange-400">{bp[bp.length - 1].fields.systolic}/{bp[bp.length - 1].fields.diastolic}</span>}
                  {sleep && <span className="text-info">{sleepDuration(sleep.fields.bedTime, sleep.fields.wakeTime).toFixed(1)}h sleep</span>}
                  <span>{g.records.length} events</span>
                </p>
              </div>
              <ChevronDown size={18} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {g.records.map((r) => {
                  const Icon = categoryIcon[r.category]
                  return (
                    <div key={r.id} className="group flex items-center gap-3">
                      <span className="text-muted text-sm font-mono w-12 shrink-0">{r.time}</span>
                      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-sm ${categoryColor[r.category]}`}>
                        <Icon size={14} /> {r.time} <span className="text-white">{recordSummary(r)}</span>
                      </span>
                      <button
                        onClick={() => navigate(`/add-record?date=${r.date}&edit=${r.id}`)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-brand transition-opacity shrink-0"
                        aria-label="Edit entry"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CalendarView({ records }: { records: HealthRecord[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const byDate = useMemo(() => groupByDate(records), [records])
  const dateMap = new Map(byDate.map((g) => [g.date, g.records]))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayIso = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-bold text-lg">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const recs = dateMap.get(iso)
          const cls = recs ? dayClassification(recs) : null
          const isToday = iso === todayIso
          return (
            <div key={idx} className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-sm ${isToday ? 'bg-brand/15 border-brand/40' : 'bg-surface2 border-border'}`}>
              <span>{day}</span>
              {cls && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${bpDotColor[cls]}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-6 mt-6 text-sm text-muted">
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand" /> Normal BP</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warn" /> Elevated</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> High BP</span>
      </div>
    </div>
  )
}

function TableView({ records }: { records: HealthRecord[] }) {
  const [sortDesc, setSortDesc] = useState(true)
  const groups = useMemo(() => {
    const g = groupByDate(records)
    return sortDesc ? g : [...g].reverse()
  }, [records, sortDesc])

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border">
            <th className="pb-3 pr-4 cursor-pointer select-none" onClick={() => setSortDesc((s) => !s)}>
              Date {sortDesc ? '↓' : '↑'}
            </th>
            <th className="pb-3 pr-4">Systolic</th>
            <th className="pb-3 pr-4">Diastolic</th>
            <th className="pb-3 pr-4">Pulse</th>
            <th className="pb-3 pr-4">Classification</th>
            <th className="pb-3 pr-4">Sleep</th>
            <th className="pb-3 pr-4">Exercise</th>
            <th className="pb-3">Entries</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {groups.map((g) => {
            const bp = g.records.filter((r) => r.category === 'blood')
            const last = bp[bp.length - 1]
            const cls = last ? classifyBP(last.fields.systolic, last.fields.diastolic) : null
            const sleep = g.records.find((r) => r.category === 'sleep')
            const exerciseMin = g.records.filter((r) => r.category === 'exercise').reduce((s, r) => s + Number(r.fields.duration || 0), 0)
            return (
              <tr key={g.date} className="border-b border-border/50 hover:bg-white/5">
                <td className="py-3 pr-4 font-sans">{new Date(g.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="py-3 pr-4">{last ? last.fields.systolic : '—'}</td>
                <td className="py-3 pr-4">{last ? last.fields.diastolic : '—'}</td>
                <td className="py-3 pr-4">{last ? last.fields.pulse : '—'}</td>
                <td className="py-3 pr-4">
                  {cls && <span className="px-2 py-1 rounded-full text-xs bg-orange-400/15 text-orange-400 border border-orange-400/30 font-sans">{cls}</span>}
                </td>
                <td className="py-3 pr-4 text-info">{sleep ? `${sleepDuration(sleep.fields.bedTime, sleep.fields.wakeTime).toFixed(1)}h` : '—'}</td>
                <td className="py-3 pr-4 text-brand">{exerciseMin ? `${exerciseMin}m` : '—'}</td>
                <td className="py-3">{g.records.length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
