'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  useChatPortalTarget,
  useGameFullscreenActive,
  useLiveRoom,
} from '@/components/live/live-room-context'
import { RelayChatPanel } from '@/components/live/relay-chat-panel'
import { useLiveChat } from '@/components/live/use-live-chat'

function RelayChatOverlay({
  panelRef,
  signedIn,
  guestPostEnabled,
  userId,
  onSignInClick,
  onClose,
  inGameFullscreen,
}: {
  panelRef: React.RefObject<HTMLDialogElement | null>
  signedIn: boolean
  guestPostEnabled: boolean
  userId?: string
  onSignInClick?: () => void
  onClose: () => void
  inGameFullscreen: boolean
}) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex ${
        inGameFullscreen
          ? 'items-center justify-center p-4'
          : 'items-end justify-end p-4 md:items-center'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close chat"
        onClick={onClose}
      />
      <dialog
        ref={panelRef}
        open
        aria-label="Relay chat"
        className={`motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 relative flex flex-col border border-zinc-700 bg-black p-0 shadow-2xl ${
          inGameFullscreen
            ? 'h-[min(70vh,640px)] w-full max-w-lg'
            : 'h-[min(55vh,520px)] w-full max-w-md md:h-[min(72vh,640px)]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Room chat
            {inGameFullscreen ? (
              <span className="ml-2 text-amber-400/80">· game paused</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <RelayChatPanel
          signedIn={signedIn}
          guestPostEnabled={guestPostEnabled}
          userId={userId}
          onSignInClick={onSignInClick}
          showHeader={false}
        />
      </dialog>
    </div>
  )
}

export function RelayChatPopup({
  signedIn,
  guestPostEnabled = false,
  userId,
  onSignInClick,
}: {
  signedIn: boolean
  guestPostEnabled?: boolean
  userId?: string
  onSignInClick?: () => void
}) {
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDialogElement>(null)
  const portalTarget = useChatPortalTarget()
  const inGameFullscreen = useGameFullscreenActive()
  const { relayChatOpen, openRelayChat, closeRelayChat } = useLiveRoom()
  const { messagesQuery } = useLiveChat({ signedIn, guestPostEnabled, userId, useSharedRoom: true })

  const latestId = messagesQuery.data?.at(-1)?.id ?? null
  const unread =
    !relayChatOpen && latestId !== null && latestId !== lastSeenId && lastSeenId !== null

  useEffect(() => {
    if (!relayChatOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRelayChat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [relayChatOpen, closeRelayChat])

  useEffect(() => {
    if (relayChatOpen) {
      setLastSeenId(latestId)
      panelRef.current?.querySelector<HTMLElement>('[data-latest-message]')?.focus()
    }
  }, [relayChatOpen, latestId])

  useEffect(() => {
    if (lastSeenId === null && latestId) setLastSeenId(latestId)
  }, [lastSeenId, latestId])

  const overlay =
    relayChatOpen && portalTarget ? (
      <RelayChatOverlay
        panelRef={panelRef}
        signedIn={signedIn}
        guestPostEnabled={guestPostEnabled}
        userId={userId}
        onSignInClick={onSignInClick}
        onClose={closeRelayChat}
        inGameFullscreen={inGameFullscreen}
      />
    ) : null

  return (
    <>
      {!inGameFullscreen ? (
        <button
          type="button"
          onClick={openRelayChat}
          className="fixed right-4 bottom-24 z-50 flex items-center gap-2 border border-amber-500/60 bg-black px-4 py-3 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-lg hover:border-amber-400"
          aria-expanded={relayChatOpen}
          aria-haspopup="dialog"
        >
          #relay
          {unread ? (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-black">
              new
            </span>
          ) : null}
        </button>
      ) : null}

      {overlay && portalTarget ? createPortal(overlay, portalTarget) : null}
    </>
  )
}
