'use client'

import { cn } from '@arche-template/ui/lib/utils'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

const INCREMENT_INTERVAL_MS = 160
const HIDE_DELAY_MS = 220
const MAX_PROGRESS_BEFORE_COMPLETE = 88

export function RouteTopLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams.toString()}`
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const isPendingRef = useRef(false)
  const visibleRef = useRef(false)
  const previousRouteKeyRef = useRef<string | null>(null)
  const intervalRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)

  visibleRef.current = visible

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (isPendingRef.current) return

    isPendingRef.current = true
    clearTimers()
    setVisible(true)
    setProgress(12)

    intervalRef.current = window.setInterval(() => {
      setProgress((previous) => {
        if (previous >= MAX_PROGRESS_BEFORE_COMPLETE) return previous
        const increment = Math.max(1.5, (MAX_PROGRESS_BEFORE_COMPLETE - previous) * 0.12)
        return Math.min(MAX_PROGRESS_BEFORE_COMPLETE, previous + increment)
      })
    }, INCREMENT_INTERVAL_MS)
  }, [clearTimers])

  const complete = useCallback(() => {
    if (!isPendingRef.current && !visibleRef.current) return

    isPendingRef.current = false

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setProgress(100)
    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as Element | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      const current = new URL(window.location.href)
      const next = new URL(anchor.href, window.location.href)

      if (next.origin !== current.origin) return

      const isSameDestination =
        next.pathname === current.pathname &&
        next.search === current.search &&
        next.hash === current.hash
      if (isSameDestination) return

      const isHashOnlyNavigation =
        next.pathname === current.pathname &&
        next.search === current.search &&
        next.hash !== current.hash
      if (isHashOnlyNavigation) return

      start()
    }

    const onPopState = () => start()

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [start])

  const completeOnRouteChange = useEffectEvent(() => {
    complete()
  })

  useEffect(() => {
    const previous = previousRouteKeyRef.current
    previousRouteKeyRef.current = routeKey
    if (previous === null || previous === routeKey) return
    completeOnRouteChange()
  }, [routeKey])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[95] transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="relative h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-[#d7ae7f] via-[#f2d6b1] to-[#67c8ba] shadow-[0_0_18px_rgba(103,200,186,0.45)] transition-[width] duration-180 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 h-[3px] w-16 -translate-x-full bg-[#67c8ba] blur-[5px] transition-[left] duration-180 ease-out"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  )
}
