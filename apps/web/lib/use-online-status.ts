'use client'

import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const apply = () => setOnline(navigator.onLine)
    apply()
    window.addEventListener('online', apply)
    window.addEventListener('offline', apply)
    return () => {
      window.removeEventListener('online', apply)
      window.removeEventListener('offline', apply)
    }
  }, [])

  return online
}
