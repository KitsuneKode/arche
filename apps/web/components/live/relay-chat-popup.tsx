'use client'

import { useEffect, useRef, useState } from 'react'

import { useLiveRoom } from '@/components/live/live-room-context'
import { RelayChatPanel } from '@/components/live/relay-chat-panel'
import { useLiveChat } from '@/components/live/use-live-chat'

export function RelayChatPopup({
  signedIn,
  userId,
  onSignInClick,
}: {
  signedIn: boolean
  userId?: string
  onSignInClick?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDialogElement>(null)
  const { setRelayChatOpen } = useLiveRoom()
  const { messagesQuery } = useLiveChat({ signedIn, userId, useSharedRoom: true })

  const latestId = messagesQuery.data?.at(-1)?.id ?? null
  const unread = !open && latestId !== null && latestId !== lastSeenId && lastSeenId !== null

  useEffect(() => {
    setRelayChatOpen(open)
    return () => setRelayChatOpen(false)
  }, [open, setRelayChatOpen])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      setLastSeenId(latestId)
      panelRef.current?.querySelector<HTMLElement>('[data-latest-message]')?.focus()
    }
  }, [open, latestId])

  useEffect(() => {
    if (lastSeenId === null && latestId) setLastSeenId(latestId)
  }, [lastSeenId, latestId])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 z-50 flex items-center gap-2 border border-amber-500/60 bg-black px-4 py-3 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-lg hover:border-amber-400"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        #relay
        {unread ? (
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-black">
            new
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          />
          <dialog
            ref={panelRef}
            open
            aria-label="Relay chat"
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 relative flex h-[min(55vh,520px)] w-full max-w-md flex-col border border-zinc-700 bg-black p-0 shadow-2xl md:h-[min(72vh,640px)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2">
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                Room chat
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-mono text-xs text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <RelayChatPanel
              signedIn={signedIn}
              userId={userId}
              onSignInClick={onSignInClick}
              showHeader={false}
            />
          </dialog>
        </div>
      ) : null}
    </>
  )
}
