import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon, Heart, Utensils, Dumbbell, Moon,
  AlertTriangle, Brain, Pill, Droplets, Plus, Trash2, Pencil, X,
} from 'lucide-react'
import { Category, HealthRecord } from '../types'
import { useData } from '../context/DataContext'
import { recordSummary, categoryLabel } from '../lib/summary'
import { Chip } from '../components/ui/Chip'
import {
  HEALTH_LIMITS,
  validateBloodPressure,
  validateNumeric,
} from '../lib/healthValidation'

const categories: { id: Category; label: string; icon: any; color: string; activeClass: string }[] = [
  { id: 'blood', label: 'Blood', icon: Heart, color: 'text-danger', activeClass: 'border-danger bg-danger/10 text-danger' },
  { id: 'meal', label: 'Meal', icon: Utensils, color: 'text-meal', activeClass: 'border-meal bg-meal/10 text-meal' },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'text-brand', activeClass: 'border-brand bg-brand/10 text-brand' },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: 'text-sleep', activeClass: 'border-sleep bg-sleep/10 text-sleep' },
  { id: 'symptoms', label: 'Symptoms', icon: AlertTriangle, color: 'text-symptom', activeClass: 'border-symptom bg-symptom/10 text-symptom' },
  { id: 'stress', label: 'Stress', icon: Brain, color: 'text-warn', activeClass: 'border-warn bg-warn/10 text-warn' },
  { id: 'medication', label: 'Medication', icon: Pill, color: 'text-info', activeClass: 'border-info bg-info/10 text-info' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-water', activeClass: 'border-water bg-water/10 text-water' },
]

const symptomOptions = ['Headache', 'Dizziness', 'Chest Pain', 'Fatigue', 'Shortness of Breath', 'Blurred Vision', 'Palpitations', 'Nausea', 'Sweating']

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' })
}
function fmtFullDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AddRecord() {
  const [params] = useSearchParams()
  const { records, addRecord, updateRecord, deleteRecord } = useData()
  const [date, setDate] = useState(params.get('date') || new Date().toISOString().slice(0, 10))
  const [active, setActive] = useState<Category>('blood')
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null)

  // Resolve a deep-linked ?edit=<id> (e.g. coming from History) into edit mode.
  useEffect(() => {
    const editId = params.get('edit')
    if (!editId) return
    const rec = records.find((r) => r.id === editId)
    if (rec) {
      setEditingRecord(rec)
      setActive(rec.category)
      setDate(rec.date)
    }
  }, [params, records])

  // Guard: if the record being edited is deleted/removed elsewhere, exit edit mode.
  useEffect(() => {
    if (editingRecord && !records.some((r) => r.id === editingRecord.id)) {
      setEditingRecord(null)
    }
  }, [records, editingRecord])

  const dayRecords = useMemo(
    () => records.filter((r) => r.date === date).sort((a, b) => (a.time < b.time ? -1 : 1)),
    [records, date]
  )

  function shiftDate(delta: number) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().slice(0, 10))
    setEditingRecord(null)
  }

  function selectCategory(id: Category) {
    setActive(id)
    setEditingRecord(null)
  }

  function startEdit(record: HealthRecord) {
    setEditingRecord(record)
    setActive(record.category)
  }

  async function submit(fields: Record<string, any>, time: string, notes?: string) {
    await addRecord({ category: active, date, time, fields, notes })
  }

  async function update(fields: Record<string, any>, time: string, notes?: string) {
    if (!editingRecord) return
    await updateRecord({
      ...editingRecord,
      category: active,
      date,
      time,
      fields,
      notes: notes ?? editingRecord.notes,
    })
    setEditingRecord(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-bold flex items-center gap-2 justify-center">
            <CalIcon size={16} className="text-brand" /> {fmtDate(date)}
          </p>
          <p className="text-muted text-sm">{fmtFullDate(date)}</p>
        </div>
        <button onClick={() => shiftDate(1)} className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
            {categories.map((c) => {
              const Icon = c.icon
              const isActive = active === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 sm:py-4 px-1 rounded-xl border transition-colors min-w-0 ${
                    isActive ? c.activeClass : 'border-border bg-surface text-muted hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="text-xs sm:text-sm truncate w-full text-center">{c.label}</span>
                </button>
              )
            })}
          </div>

          <div className="card">
            <CategoryForm
              category={active}
              editing={editingRecord}
              onSubmit={submit}
              onUpdate={update}
              onCancel={() => setEditingRecord(null)}
            />
          </div>
        </div>

        <div className="card lg:sticky lg:top-24 min-w-0">
          <h3 className="font-bold mb-4">Today's Journal <span className="text-muted font-normal">({dayRecords.length} entries)</span></h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {dayRecords.length === 0 && <p className="text-muted text-sm py-6 text-center">No entries yet for this day.</p>}
            {dayRecords.map((r) => (
              <JournalRow
                key={r.id}
                record={r}
                isEditing={editingRecord?.id === r.id}
                onEdit={() => startEdit(r)}
                onDelete={() => deleteRecord(r.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function JournalRow({ record, isEditing, onEdit, onDelete }: { record: HealthRecord; isEditing: boolean; onEdit: () => void; onDelete: () => void }) {
  const meta = categories.find((c) => c.id === record.category)!
  const Icon = meta.icon
  return (
    <div className={`group flex items-start gap-3 bg-surface2 border rounded-lg px-4 py-3 ${isEditing ? 'border-brand/60' : 'border-border'}`}>
      <Icon size={16} className={`${meta.color} mt-0.5 shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono">
          <span className="text-muted">{record.time}</span>{' '}
          <span className="font-sans font-semibold">{categoryLabel[record.category]}</span>
        </p>
        <p className="text-muted text-sm truncate">{recordSummary(record)}</p>
      </div>
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 text-muted hover:text-brand transition-opacity shrink-0" aria-label="Edit entry">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity shrink-0" aria-label="Delete entry">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function CategoryForm({ category, editing, onSubmit, onUpdate, onCancel }: {
  category: Category
  editing?: HealthRecord | null
  onSubmit: (fields: Record<string, any>, time: string, notes?: string) => Promise<void>
  onUpdate?: (fields: Record<string, any>, time: string, notes?: string) => Promise<void>
  onCancel?: () => void
}) {
  // Only render the matching-category form in edit mode; otherwise switching
  // categories while editing would seed the wrong form. The parent clears
  // editing when the category changes, so this is a safety check.
  if (editing && editing.category !== category) return null
  // key forces a remount when entering/switching edit targets so the form's
  // useState initializers re-run with the record's values. Without it, a form
  // already mounted in create mode keeps its empty state when `editing` changes.
  const formKey = editing ? `edit-${editing.id}` : 'create'
  const common = { key: formKey, editing, onSubmit, onUpdate, onCancel }
  switch (category) {
    case 'blood':
      return <BloodForm {...common} />
    case 'meal':
      return <MealForm {...common} />
    case 'exercise':
      return <ExerciseForm {...common} />
    case 'sleep':
      return <SleepForm {...common} />
    case 'symptoms':
      return <SymptomsForm {...common} />
    case 'stress':
      return <StressForm {...common} />
    case 'medication':
      return <MedicationForm {...common} />
    case 'water':
      return <WaterForm {...common} />
  }
}

type FormProps = {
  editing?: HealthRecord | null
  onSubmit: (fields: Record<string, any>, time: string, notes?: string) => Promise<void>
  onUpdate?: (fields: Record<string, any>, time: string, notes?: string) => Promise<void>
  onCancel?: () => void
}

// Shared submit+cancel button row for edit mode (Update + Cancel) vs create (Add).
function FormActions({ editing, busy, addLabel, updateLabel, addClass, onCancel }: {
  editing?: HealthRecord | null
  busy: boolean
  addLabel: string
  updateLabel: string
  addClass: string
  onCancel?: () => void
}) {
  return (
    <div className="flex gap-3">
      <button disabled={busy} className={`flex-1 btn ${addClass}`}>
        {editing ? <><Pencil size={18} /> {updateLabel}</> : <><Plus size={18} /> {addLabel}</>}
      </button>
      {editing && (
        <button type="button" onClick={onCancel} className="btn-outline">
          <X size={18} /> Cancel
        </button>
      )}
    </div>
  )
}

function FormHeader({ icon, label, colorClass, editing }: { icon: React.ReactNode; label: string; colorClass: string; editing?: HealthRecord | null }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-5 border-b border-border">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>{icon}</div>
      <h3 className="font-bold text-lg">{label}</h3>
      {editing && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/5 text-muted">Editing</span>}
    </div>
  )
}

// Physiological ranges + validation live in src/lib/healthValidation.ts and
// are reused here so BP rules are defined once. The centralized validator also
// enforces systolic > diastolic.
const BP_RANGES = {
  systolic: { ...HEALTH_LIMITS.bloodPressure.systolic, label: 'Systolic' },
  diastolic: { ...HEALTH_LIMITS.bloodPressure.diastolic, label: 'Diastolic' },
  pulse: { ...HEALTH_LIMITS.bloodPressure.pulse, label: 'Pulse' },
}

function BloodForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [systolic, setSystolic] = useState(editing ? String(editing.fields.systolic ?? '') : '')
  const [diastolic, setDiastolic] = useState(editing ? String(editing.fields.diastolic ?? '') : '')
  const [pulse, setPulse] = useState(editing ? String(editing.fields.pulse ?? '') : '')
  const [mealContext, setMealContext] = useState(editing?.fields.mealContext ?? 'N/A')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  // Validation errors are only shown after the user attempts to submit, so the
  // form doesn't nag before they've started typing.
  const [showErrors, setShowErrors] = useState(false)

  // Centralized validation includes the systolic > diastolic relationship.
  const { errors, hasErrors } = validateBloodPressure(systolic, diastolic, pulse)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    // Surface inline errors instead of silently bailing out; the native
    // `required` popups are unreliable on mobile.
    if (hasErrors) {
      setShowErrors(true)
      return
    }
    const fields = { systolic: Number(systolic), diastolic: Number(diastolic), pulse: Number(pulse), mealContext }
    setBusy(true)
    if (editing && onUpdate) {
      await onUpdate(fields, time, notes)
    } else {
      await onSubmit(fields, time, notes)
      setSystolic(''); setDiastolic(''); setPulse(''); setNotes(''); setTime(nowTime())
      setShowErrors(false)
    }
    setBusy(false)
  }

  const fieldErr = (msg: string) =>
    showErrors && msg ? <p className="text-danger text-xs mt-1.5" role="alert">{msg}</p> : null
  const inputClass = (msg: string) => `input ${showErrors && msg ? 'input-error' : ''}`

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Heart size={18} className="text-danger" />} label="Blood Pressure" colorClass="bg-danger/15 text-danger" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div>
          <label className="label">Meal Context</label>
          <select value={mealContext} onChange={(e) => setMealContext(e.target.value)} className="input">
            <option>N/A</option><option>Before Meal</option><option>After Meal</option><option>Fasting</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">Systolic</label>
          <input type="number" inputMode="numeric" min={BP_RANGES.systolic.min} max={BP_RANGES.systolic.max} placeholder="120" value={systolic} onChange={(e) => { setSystolic(e.target.value); setShowErrors(false) }} className={inputClass(errors.systolic)} />
          {fieldErr(errors.systolic)}
        </div>
        <div>
          <label className="label">Diastolic</label>
          <input type="number" inputMode="numeric" min={BP_RANGES.diastolic.min} max={BP_RANGES.diastolic.max} placeholder="80" value={diastolic} onChange={(e) => { setDiastolic(e.target.value); setShowErrors(false) }} className={inputClass(errors.diastolic)} />
          {fieldErr(errors.diastolic)}
        </div>
        <div>
          <label className="label">Pulse</label>
          <input type="number" inputMode="numeric" min={BP_RANGES.pulse.min} max={BP_RANGES.pulse.max} placeholder="72" value={pulse} onChange={(e) => { setPulse(e.target.value); setShowErrors(false) }} className={inputClass(errors.pulse)} />
          {fieldErr(errors.pulse)}
        </div>
      </div>
      {showErrors && errors.relationship && (
        <p className="text-danger text-xs -mt-1 mb-4" role="alert">{errors.relationship}</p>
      )}
      <div className="mb-5"><label className="label">Notes (optional)</label><textarea placeholder="Any observations..." value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" /></div>
      <FormActions editing={editing} busy={busy} addLabel="Add BP Reading" updateLabel="Update BP Reading" addClass="bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25" onCancel={onCancel} />
    </form>
  )
}

function MealForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [type, setType] = useState(editing?.fields.type ?? 'Breakfast')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const fields = { type }
    if (editing && onUpdate) {
      await onUpdate(fields, time, notes)
    } else {
      await onSubmit(fields, time, notes)
      setNotes(''); setTime(nowTime())
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Utensils size={18} className="text-meal" />} label="Meal / Snack" colorClass="bg-meal/15 text-meal" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Coffee</option>
          </select>
        </div>
      </div>
      <div className="mb-5"><label className="label">Notes (optional)</label><textarea placeholder="What did you have?" value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" /></div>
      <FormActions editing={editing} busy={busy} addLabel="Add Meal Entry" updateLabel="Update Meal Entry" addClass="bg-meal/15 text-meal border border-meal/40 hover:bg-meal/25" onCancel={onCancel} />
    </form>
  )
}

function ExerciseForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [exerciseType, setExerciseType] = useState(editing?.fields.exerciseType ?? 'Walking')
  const [duration, setDuration] = useState(editing ? String(editing.fields.duration ?? '30') : '30')
  const [intensity, setIntensity] = useState(editing?.fields.intensity ?? 'Moderate')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const durationError = validateNumeric(duration, HEALTH_LIMITS.exercise.duration, 'Duration')

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    if (durationError) { setShowErrors(true); return }
    setBusy(true)
    const fields = { exerciseType, duration: Number(duration), intensity }
    if (editing && onUpdate) {
      await onUpdate(fields, time, notes)
    } else {
      await onSubmit(fields, time, notes)
      setNotes(''); setTime(nowTime())
      setShowErrors(false)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Dumbbell size={18} className="text-brand" />} label="Exercise" colorClass="bg-brand/15 text-brand" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div>
          <label className="label">Exercise Type</label>
          <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} className="input">
            <option>Walking</option><option>Running</option><option>Cycling</option><option>Strength Training</option><option>Yoga</option><option>Swimming</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Duration (min)</label>
          <input type="number" inputMode="numeric" min={HEALTH_LIMITS.exercise.duration.min} max={HEALTH_LIMITS.exercise.duration.max} required value={duration} onChange={(e) => { setDuration(e.target.value); setShowErrors(false) }} className={`input ${showErrors && durationError ? 'input-error' : ''}`} />
          {showErrors && durationError && <p className="text-danger text-xs mt-1.5" role="alert">{durationError}</p>}
        </div>
        <div>
          <label className="label">Intensity</label>
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)} className="input">
            <option>Light</option><option>Moderate</option><option>Vigorous</option>
          </select>
        </div>
      </div>
      <div className="mb-5"><label className="label">Notes (optional)</label><textarea placeholder="How did it feel?" value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" /></div>
      <FormActions editing={editing} busy={busy} addLabel="Add Exercise" updateLabel="Update Exercise" addClass="bg-brand/15 text-brand border border-brand/40 hover:bg-brand/25" onCancel={onCancel} />
    </form>
  )
}

function SleepForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [bedTime, setBedTime] = useState(editing?.fields.bedTime ?? '22:30')
  const [wakeTime, setWakeTime] = useState(editing?.fields.wakeTime ?? '06:30')
  const [quality, setQuality] = useState(editing?.fields.quality ?? 'Good')
  const [busy, setBusy] = useState(false)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const fields = { bedTime, wakeTime, quality }
    if (editing && onUpdate) {
      await onUpdate(fields, editing.time, editing.notes)
    } else {
      await onSubmit(fields, wakeTime)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Moon size={18} className="text-sleep" />} label="Sleep" colorClass="bg-sleep/15 text-sleep" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Bed Time</label><input type="time" required value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="input" /></div>
        <div><label className="label">Wake Time</label><input type="time" required value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="input" /></div>
      </div>
      <div className="mb-5">
        <label className="label">Sleep Quality</label>
        <select value={quality} onChange={(e) => setQuality(e.target.value)} className="input">
          <option>Poor</option><option>Fair</option><option>Good</option><option>Excellent</option>
        </select>
      </div>
      <FormActions editing={editing} busy={busy} addLabel="Add Sleep Record" updateLabel="Update Sleep Record" addClass="bg-sleep/15 text-sleep border border-sleep/40 hover:bg-sleep/25" onCancel={onCancel} />
    </form>
  )
}

function SymptomsForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [timeOfDay, setTimeOfDay] = useState(editing?.fields.timeOfDay ?? 'Morning')
  const [selected, setSelected] = useState<string[]>(editing?.fields.symptoms ?? [])
  const [severity, setSeverity] = useState(editing?.fields.severity ?? 'Medium')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  function toggle(s: string) {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    if (!selected.length) return
    setBusy(true)
    const fields = { timeOfDay, symptoms: selected, severity }
    if (editing && onUpdate) {
      await onUpdate(fields, time, notes)
    } else {
      await onSubmit(fields, time, notes)
      setSelected([]); setNotes(''); setTime(nowTime())
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<AlertTriangle size={18} className="text-symptom" />} label="Symptoms" colorClass="bg-symptom/15 text-symptom" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div>
          <label className="label">Time of Day</label>
          <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="input">
            <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="label">Symptoms (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((s) => (
            <Chip key={s} active={selected.includes(s)} onClick={() => toggle(s)} colorClass="border-symptom text-symptom bg-symptom/10">
              {s}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="label">Severity</label>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input">
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
      </div>
      <div className="mb-5"><label className="label">Notes</label><textarea placeholder="Additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" /></div>
      <FormActions editing={editing} busy={busy} addLabel="Add Symptom Entry" updateLabel="Update Symptom Entry" addClass="bg-symptom/15 text-symptom border border-symptom/40 hover:bg-symptom/25" onCancel={onCancel} />
    </form>
  )
}

function StressForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [level, setLevel] = useState(editing?.fields.level ?? 5)
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const fields = { level }
    if (editing && onUpdate) {
      await onUpdate(fields, time, notes)
    } else {
      await onSubmit(fields, time, notes)
      setNotes(''); setTime(nowTime())
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Brain size={18} className="text-warn" />} label="Stress" colorClass="bg-warn/15 text-warn" editing={editing} />
      <div className="mb-4"><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
      <div className="mb-4">
        <label className="label">Stress Level: <span className="text-white font-bold">{level}/10</span></label>
        <input type="range" min={0} max={10} value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full accent-warn" />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Calm</span><span>Moderate</span><span>Extreme</span>
        </div>
      </div>
      <div className="mb-5"><label className="label">Notes (optional)</label><textarea placeholder="What's causing stress?" value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" /></div>
      <FormActions editing={editing} busy={busy} addLabel="Add Stress Entry" updateLabel="Update Stress Entry" addClass="bg-warn/15 text-warn border border-warn/40 hover:bg-warn/25" onCancel={onCancel} />
    </form>
  )
}

function MedicationForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [dosage, setDosage] = useState(editing?.fields.dosage ?? '')
  const [medicineName, setMedicineName] = useState(editing?.fields.medicineName ?? '')
  const [taken, setTaken] = useState(editing?.fields.taken ?? true)
  const [busy, setBusy] = useState(false)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    if (!medicineName) return
    setBusy(true)
    const fields = { dosage, medicineName, taken }
    if (editing && onUpdate) {
      await onUpdate(fields, time, editing.notes)
    } else {
      await onSubmit(fields, time)
      setDosage(''); setMedicineName(''); setTime(nowTime())
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Pill size={18} className="text-info" />} label="Medication" colorClass="bg-info/15 text-info" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div><label className="label">Dosage</label><input placeholder="e.g. 10mg" value={dosage} onChange={(e) => setDosage(e.target.value)} className="input" /></div>
      </div>
      <div className="mb-4"><label className="label">Medicine Name</label><input required placeholder="e.g. Lisinopril" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="input" /></div>
      <button type="button" onClick={() => setTaken((t: boolean) => !t)} className={`mb-5 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${taken ? 'border-brand text-brand bg-brand/10' : 'border-border text-muted'}`}>
        ✓ Taken
      </button>
      <FormActions editing={editing} busy={busy} addLabel="Add Medication" updateLabel="Update Medication" addClass="bg-info/15 text-info border border-info/40 hover:bg-info/25" onCancel={onCancel} />
    </form>
  )
}

function WaterForm({ editing, onSubmit, onUpdate, onCancel }: FormProps) {
  const [time, setTime] = useState(editing?.time ?? nowTime())
  const [amount, setAmount] = useState(editing ? String(editing.fields.amount ?? '250') : '250')
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const presets = [150, 250, 350, 500]

  const amountError = validateNumeric(amount, HEALTH_LIMITS.water.amount, 'Amount')

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    if (amountError) { setShowErrors(true); return }
    setBusy(true)
    const fields = { amount: Number(amount) }
    if (editing && onUpdate) {
      await onUpdate(fields, time, editing.notes)
    } else {
      await onSubmit(fields, time)
      setTime(nowTime())
      setShowErrors(false)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handle}>
      <FormHeader icon={<Droplets size={18} className="text-water" />} label="Water" colorClass="bg-water/15 text-water" editing={editing} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="label">Time</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
        <div>
          <label className="label">Amount (ml)</label>
          <input type="number" inputMode="numeric" min={HEALTH_LIMITS.water.amount.min} max={HEALTH_LIMITS.water.amount.max} required value={amount} onChange={(e) => { setAmount(e.target.value); setShowErrors(false) }} className={`input ${showErrors && amountError ? 'input-error' : ''}`} />
          {showErrors && amountError && <p className="text-danger text-xs mt-1.5" role="alert">{amountError}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {presets.map((p) => (
          <Chip key={p} active={Number(amount) === p} onClick={() => setAmount(String(p))} colorClass="border-water text-water bg-water/10">
            {p}ml
          </Chip>
        ))}
      </div>
      <FormActions editing={editing} busy={busy} addLabel="Add Water" updateLabel="Update Water" addClass="bg-water/15 text-water border border-water/40 hover:bg-water/25" onCancel={onCancel} />
    </form>
  )
}
