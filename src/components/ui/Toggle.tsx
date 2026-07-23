import React from 'react'

/**
 * Accessible on/off toggle switch (iOS-style).
 *
 * Uses a native <input type="checkbox"> for accessibility + keyboard support,
 * visually restyled. The thumb is centered with fl/transform so it stays on
 * the track at every scale (the previous hand-rolled switch mis-positioned
 * the thumb because absolute translate-x values didn't match the track width).
 */
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={`relative inline-flex items-center shrink-0 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      {/* Track */}
      <span className="w-11 h-6 rounded-full bg-white/15 peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 transition-colors" />
      {/* Thumb (sits absolutely, nudged by checked state) */}
      <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </label>
  )
}
