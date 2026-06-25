import { useEffect, useState } from 'react'

/** True after the component has mounted — use to gate client-only UI (localStorage, relative times). */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

/** Stable HH:MM:SS (UTC) — identical output on server and client for the same instant. */
export function formatUtcClockTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().slice(11, 19)
}

export function formatRelativeTime(iso: string | null, now = Date.now()) {
  if (!iso) return 'no activity'
  const diff = now - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
