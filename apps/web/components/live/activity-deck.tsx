'use client'

import { useState } from 'react'

import { LiveChat } from '@/components/live/live-chat'
import { PostsPanel } from '@/components/live/posts-panel'
import { SessionPanel } from '@/components/live/session-panel'

export type ActivityTab = 'chat' | 'posts' | 'you'

const TABS: { id: ActivityTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'posts', label: 'Posts' },
  { id: 'you', label: 'You' },
]

export function ActivityDeck({
  signedIn,
  isRegistered = signedIn,
  guestPostEnabled = false,
  userId,
  onSignedIn,
  tab: controlledTab,
  onTabChange,
}: {
  signedIn: boolean
  isRegistered?: boolean
  guestPostEnabled?: boolean
  userId?: string
  onSignedIn?: () => void
  tab?: ActivityTab
  onTabChange?: (tab: ActivityTab) => void
}) {
  const [internalTab, setInternalTab] = useState<ActivityTab>('chat')
  const tab = controlledTab ?? internalTab

  const setTab = (next: ActivityTab) => {
    if (onTabChange) onTabChange(next)
    else setInternalTab(next)
  }

  return (
    <div className="flex h-full min-h-0 flex-col border border-zinc-800 bg-black">
      <div className="flex shrink-0 border-b border-zinc-800 bg-zinc-950 font-mono text-[10px] tracking-widest uppercase">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 px-2 py-2 transition-colors ${
              tab === item.id ? 'bg-black text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {item.label}
            {item.id === 'you' && !isRegistered ? (
              <span className="ml-1 text-zinc-600 normal-case">· in</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'chat' ? (
          <LiveChat signedIn={signedIn} guestPostEnabled={guestPostEnabled} userId={userId} />
        ) : null}
        {tab === 'posts' ? (
          <div className="h-full overflow-y-auto">
            <PostsPanel isRegistered={isRegistered} />
          </div>
        ) : null}
        {tab === 'you' ? (
          <div className="h-full overflow-y-auto">
            <SessionPanel onSignedIn={onSignedIn} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
