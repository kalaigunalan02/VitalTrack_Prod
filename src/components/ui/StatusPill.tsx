import React from 'react'
import { BPClass, bpClassColor } from '../../lib/classification'

export function StatusPill({ label }: { label: BPClass | string }) {
  const cls = bpClassColor[label as BPClass] ?? 'text-muted bg-white/5 border-white/10'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}
