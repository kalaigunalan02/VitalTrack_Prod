import React from 'react'

/**
 * Small "[DEV]" badge shown only in development builds (VITE_APP_ENV ===
 * 'development'). Never rendered in production.
 */
export function EnvBadge() {
  if (import.meta.env.VITE_APP_ENV !== 'development') return null
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-warn/20 text-warn border border-warn/40">
      Dev
    </span>
  )
}
