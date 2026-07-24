/**
 * Centralized health-record input validation.
 *
 * All physiological ranges are defined ONCE here and reused by every form
 * (and the data layer) so invalid values can never be saved. Ranges are
 * deliberately permissive "obviously invalid" guards — they prevent nonsense
 * like 5000 mmHg or -90, not diagnostic thresholds. See the project README's
 * validation section for the rationale per field.
 */

export const HEALTH_LIMITS = {
  bloodPressure: {
    systolic: { min: 50, max: 300 },
    diastolic: { min: 20, max: 200 },
    pulse: { min: 20, max: 250 },
  },
  exercise: {
    duration: { min: 1, max: 1440 }, // minutes (up to 24h)
  },
  water: {
    amount: { min: 0, max: 5000 }, // ml per entry
  },
  stress: {
    level: { min: 0, max: 10 },
  },
} as const

/**
 * Validate a single numeric field. Returns an error message string or null
 * if valid. Empty-but-allowed fields return null (use `required` for those).
 */
export function validateNumeric(
  raw: string,
  range: { min: number; max: number },
  label: string,
  required = true
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return required ? `${label} is required` : null
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return `${label} must be a number`
  if (num < range.min || num > range.max) {
    return `${label} must be between ${range.min} and ${range.max}`
  }
  return null
}

/**
 * Validate a complete blood pressure reading, including the systolic >
 * diastolic relationship. Returns an object of field-keyed error messages
 * (empty string = valid) plus a combined hasErrors flag.
 */
export interface BPErrors {
  systolic: string
  diastolic: string
  pulse: string
  relationship: string
}

export function validateBloodPressure(
  systolicRaw: string,
  diastolicRaw: string,
  pulseRaw: string
): { errors: BPErrors; hasErrors: boolean } {
  const systolic = validateNumeric(systolicRaw, HEALTH_LIMITS.bloodPressure.systolic, 'Systolic') ?? ''
  const diastolic = validateNumeric(diastolicRaw, HEALTH_LIMITS.bloodPressure.diastolic, 'Diastolic') ?? ''
  const pulse = validateNumeric(pulseRaw, HEALTH_LIMITS.bloodPressure.pulse, 'Pulse') ?? ''

  // Relationship check only when both are individually valid numbers.
  let relationship = ''
  const sys = Number(systolicRaw)
  const dia = Number(diastolicRaw)
  if (Number.isFinite(sys) && Number.isFinite(dia) && sys <= dia) {
    relationship = 'Systolic pressure must be greater than diastolic pressure.'
  }

  const errors: BPErrors = { systolic, diastolic, pulse, relationship }
  const hasErrors = Boolean(systolic || diastolic || pulse || relationship)
  return { errors, hasErrors }
}
