export type BPClass = 'Normal' | 'Elevated' | 'Stage 1 High' | 'Stage 2 High' | 'Hypertensive Crisis'

export function classifyBP(systolic: number, diastolic: number): BPClass {
  if (systolic > 180 || diastolic > 120) return 'Hypertensive Crisis'
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 High'
  if (systolic >= 130 || diastolic >= 80) return 'Stage 1 High'
  if (systolic >= 120 && diastolic < 80) return 'Elevated'
  if (systolic < 120 && diastolic < 80) return 'Normal'
  return 'Elevated'
}

export const bpClassColor: Record<BPClass, string> = {
  Normal: 'text-brand bg-brand/15 border-brand/30',
  Elevated: 'text-warn bg-warn/15 border-warn/30',
  'Stage 1 High': 'text-orange-400 bg-orange-400/15 border-orange-400/30',
  'Stage 2 High': 'text-danger bg-danger/15 border-danger/30',
  'Hypertensive Crisis': 'text-red-500 bg-red-500/20 border-red-500/40',
}

export const bpDotColor: Record<BPClass, string> = {
  Normal: 'bg-brand',
  Elevated: 'bg-warn',
  'Stage 1 High': 'bg-orange-400',
  'Stage 2 High': 'bg-danger',
  'Hypertensive Crisis': 'bg-red-500',
}
