'use client'

import { RelayChatPanel } from '@/components/live/relay-chat-panel'

export function RelayChatSidebar({
  signedIn,
  userId,
  onSignInClick,
}: {
  signedIn: boolean
  userId?: string
  onSignInClick?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border border-zinc-800 bg-black">
      <RelayChatPanel signedIn={signedIn} userId={userId} onSignInClick={onSignInClick} />
    </div>
  )
}
