import React, { useMemo, useState } from 'react'
import { Download, Activity, Moon, Dumbbell } from 'lucide-react'
import { useData } from '../context/DataContext'
import { classifyBP, bpClassColor } from '../lib/classification'
import { sleepDuration } from '../lib/summary'

type RangeKey = '7' | '30' | '90' | 'custom'

export default function Reports() {
  const { records, activeProfile } = useData()
  const [range, setRange] = useState<RangeKey>('30')
  const [format, setFormat] = useState<'JSON' | 'CSV'>('JSON')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { start, end, days } = useMemo(() => {
    const end = new Date()
    let start = new Date()
    if (range === 'custom' && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd), days: undefined }
    }
    const n = range === '7' ? 7 : range === '90' ? 90 : 30
    start.setDate(end.getDate() - n)
    return { start, end, days: n }
  }, [range, customStart, customEnd])

  const inRange = useMemo(
    () => records.filter((r) => {
      const d = new Date(r.date + 'T00:00:00')
      return d >= start && d <= end
    }),
    [records, start, end]
  )

  const bp = inRange.filter((r) => r.category === 'blood')
  const avg = (key: string) => (bp.length ? Math.round(bp.reduce((s, r) => s + r.fields[key], 0) / bp.length) : 0)
  const avgSys = avg('systolic')
  const avgDia = avg('diastolic')
  const avgPulse = avg('pulse')
  const highSys = bp.length ? Math.max(...bp.map((r) => r.fields.systolic)) : 0
  const lowSys = bp.length ? Math.min(...bp.map((r) => r.fields.systolic)) : 0
  const highDia = bp.length ? Math.max(...bp.map((r) => r.fields.diastolic)) : 0
  const lowDia = bp.length ? Math.min(...bp.map((r) => r.fields.diastolic)) : 0
  const avgClass = bp.length ? classifyBP(avgSys, avgDia) : null

  const sleepRecs = inRange.filter((r) => r.category === 'sleep')
  const avgSleep = sleepRecs.length ? sleepRecs.reduce((s, r) => s + sleepDuration(r.fields.bedTime, r.fields.wakeTime), 0) / sleepRecs.length : 0
  const totalExercise = inRange.filter((r) => r.category === 'exercise').reduce((s, r) => s + Number(r.fields.duration || 0), 0)

  function exportReport() {
    const payload = {
      patient: activeProfile,
      period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
      records: inRange,
      summary: { avgSys, avgDia, avgPulse, totalReadings: bp.length, highSys, lowSys, highDia, lowDia, avgSleep, totalExercise },
    }
    let blob: Blob, filename: string
    if (format === 'JSON') {
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      filename = 'vitaltrack-report.json'
    } else {
      const rows = ['date,time,category,systolic,diastolic,pulse']
      inRange.filter((r) => r.category === 'blood').forEach((r) => rows.push(`${r.date},${r.time},blood,${r.fields.systolic},${r.fields.diastolic},${r.fields.pulse}`))
      blob = new Blob([rows.join('\n')], { type: 'text/csv' })
      filename = 'vitaltrack-report.csv'
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-bold text-lg mb-4">Report Configuration</h3>
        <p className="label">Date Range</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {(['7', '30', '90', 'custom'] as RangeKey[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-lg text-sm border ${range === r ? 'bg-symptom/20 border-symptom text-symptom' : 'border-border text-muted bg-surface2'}`}>
              {r === 'custom' ? 'Custom' : `Last ${r} Days`}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-5 max-w-md">
            <div><label className="label">Start</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input" /></div>
            <div><label className="label">End</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input" /></div>
          </div>
        )}
        <p className="label">Export Format</p>
        <div className="flex gap-2 mb-6">
          {(['JSON', 'CSV'] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={`px-6 py-2 rounded-lg text-sm border ${format === f ? 'bg-symptom/20 border-symptom text-symptom' : 'border-border text-muted bg-surface2'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={exportReport} className="btn bg-symptom text-bg hover:opacity-90">
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg mb-4">Patient Information</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <Info label="Name" value={activeProfile?.fullName || '—'} />
          <Info label="DOB" value={activeProfile?.dob || '—'} />
          <Info label="Blood Type" value={activeProfile?.bloodType || '—'} />
          <Info label="Conditions" value={activeProfile?.medicalConditions || '—'} />
          <Info label="Doctor" value={activeProfile?.doctorName || '—'} />
          <Info label="Doctor Phone" value={activeProfile?.doctorPhone || '—'} />
        </div>
      </div>

      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-brand" />
          <span>
            Report period: <b>{start.toLocaleDateString()}</b> to <b>{end.toLocaleDateString()}</b>
          </span>
        </div>
        <span className="text-muted font-mono">{days ?? Math.round((+end - +start) / 86400000)} days of data</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-danger rounded-full" />
          <h3 className="font-bold text-lg">Blood Pressure Summary</h3>
          {avgClass && <span className={`px-3 py-1 rounded-full text-xs border ${bpClassColor[avgClass]}`}>Avg: {avgClass}</span>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Stat label="Average Systolic" value={avgSys} unit="mmHg" color="text-danger" />
          <Stat label="Average Diastolic" value={avgDia} unit="mmHg" color="text-info" />
          <Stat label="Average Pulse" value={avgPulse} unit="bpm" color="text-brand" />
          <Stat label="Total Readings" value={bp.length} unit="BP events" color="text-white" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Highest Systolic" value={highSys} unit="mmHg peak" color="text-danger" />
          <Stat label="Lowest Systolic" value={lowSys} unit="mmHg min" color="text-brand" />
          <Stat label="Highest Diastolic" value={highDia} unit="mmHg peak" color="text-danger" />
          <Stat label="Lowest Diastolic" value={lowDia} unit="mmHg min" color="text-brand" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-sleep rounded-full" />
            <h3 className="font-bold text-lg">Sleep Summary</h3>
          </div>
          <div className="card flex items-center gap-4">
            <Moon size={28} className="text-sleep" />
            <div>
              <p className="text-3xl font-bold">{avgSleep.toFixed(1)}<span className="text-lg text-muted">h</span></p>
              <p className="text-muted text-sm">Average per night</p>
              {avgSleep >= 7 && <p className="text-brand text-sm mt-1">↗ Meeting 7h goal</p>}
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-brand rounded-full" />
            <h3 className="font-bold text-lg">Exercise Summary</h3>
          </div>
          <div className="card flex items-center gap-4">
            <Dumbbell size={28} className="text-brand" />
            <div>
              <p className="text-3xl font-bold">{totalExercise}<span className="text-lg text-muted"> min</span></p>
              <p className="text-muted text-sm">Total exercise time</p>
              {totalExercise >= 150 && <p className="text-brand text-sm mt-1">↗ Meeting WHO guidelines</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-sm">{label}</p>
      <p className="font-semibold mt-1">{value}</p>
    </div>
  )
}

function Stat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="card">
      <p className="text-muted text-sm mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-muted text-sm mt-1">{unit}</p>
    </div>
  )
}
