'use client'

import { useSyncExternalStore, useState } from 'react'

const CONSENT_STORAGE_KEY = 'cookieConsent'
const CONSENT_CHANGE_EVENT = 'cookie-consent-change'

/**
 * Cookie consent banner component
 *
 * GDPR-compliant cookie consent banner.
 * Stores user preference in localStorage under `cookieConsent`.
 */
function subscribeToConsent(onStoreChange: () => void) {
  const handleChange = () => onStoreChange()

  window.addEventListener('storage', handleChange)
  window.addEventListener(CONSENT_CHANGE_EVENT, handleChange)

  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(CONSENT_CHANGE_EVENT, handleChange)
  }
}

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_STORAGE_KEY)
}

function getServerConsentSnapshot() {
  return 'unknown'
}

function notifyConsentChange() {
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

export function CookieConsent() {
  const storedConsent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  )
  const [dismissed, setDismissed] = useState(false)
  const isVisible = storedConsent === null && !dismissed

  const handleAccept = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    notifyConsentChange()
    setDismissed(true)
  }

  const handleReject = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected')
    notifyConsentChange()
    setDismissed(true)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 text-white p-4 border-t border-neutral-700">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            We use cookies to enhance your browsing experience and analyze traffic. By continuing,
            you accept our{' '}
            <a href="/privacy" className="underline hover:text-neutral-300">
              privacy policy
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 text-sm border border-neutral-600 rounded hover:bg-neutral-800 transition"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
