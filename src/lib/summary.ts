import { HealthRecord } from '../types'

// Builds the one-line journal summary text shown in Add Record / History / Timeline.
export function recordSummary(r: HealthRecord): string {
  const f = r.fields
  switch (r.category) {
    case 'blood':
      return `${f.systolic}/${f.diastolic} mmHg · ${f.pulse} bpm`
    case 'meal':
      return `${f.type}${f.notes ? ' · ' + f.notes : ''}`
    case 'exercise':
      return `${f.exerciseType} · ${f.duration}min · ${f.intensity?.toLowerCase()}`
    case 'sleep': {
      const hrs = sleepDuration(f.bedTime, f.wakeTime)
      return `${hrs.toFixed(1)}h sleep · ${f.quality?.toLowerCase()}`
    }
    case 'symptoms':
      return `${(f.symptoms || []).join(', ')} · ${f.severity}`
    case 'stress':
      return `Level ${f.level}/10`
    case 'medication':
      return `${f.medicineName || 'Medication'}${f.dosage ? ' · ' + f.dosage : ''}${f.taken ? ' · taken' : ''}`
    case 'water':
      return `${f.amount}ml`
    default:
      return ''
  }
}

export const categoryLabel: Record<string, string> = {
  blood: 'Bp',
  meal: 'Meal',
  exercise: 'Exercise',
  sleep: 'Sleep',
  symptoms: 'Symptoms',
  stress: 'Stress',
  medication: 'Medication',
  water: 'Water',
}

export function sleepDuration(bedTime: string, wakeTime: string): number {
  if (!bedTime || !wakeTime) return 0
  const [bh, bm] = bedTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bedMinutes = bh * 60 + bm
  let wakeMinutes = wh * 60 + wm
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60
  return (wakeMinutes - bedMinutes) / 60
}
