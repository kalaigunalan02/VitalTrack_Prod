import React from 'react'
import { VERSION, GIT_HASH, BUILD_TIME } from '../../version'

/**
 * Discreet build-version tag, shown so you can confirm the running deploy is
 * the latest commit. Format: v1.0.0 · c71b274 · Jul 22 15:30
 *
 * All three values are injected at build time (scripts/version.mjs), so they
 * change on every build automatically.
 */
function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function Version({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-[10px] text-muted/60 font-mono ${className}`}
      title={`Version ${VERSION} · commit ${GIT_HASH} · built ${BUILD_TIME}`}
    >
      v{VERSION} · {GIT_HASH} · {fmtTime(BUILD_TIME)}
    </span>
  )
}
