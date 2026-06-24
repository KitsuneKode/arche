'use client'

import { useState } from 'react'

import { LiveChat } from '@/components/live/live-chat'
import { PostsPanel } from '@/components/live/posts-panel'
import { SessionPanel } from '@/components/live/session-panel'

type Tab = 'chat' | 'posts' | 'you'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'posts', label: 'Posts' },
  { id: 'you', label: 'You' },
]

export function ActivityDeck({
  signedIn,
  userId,
  onSignedIn,
}: {
  signedIn: boolean
  userId?: string
  onSignedIn?: () => void
}) {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className="space-y-0">
      <div className="flex border border-b-0 border-zinc-800 bg-zinc-950 font-mono text-[10px] tracking-widest uppercase">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 px-4 py-3 transition-colors ${
              tab === item.id ? 'bg-black text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'chat' ? <LiveChat signedIn={signedIn} userId={userId} /> : null}
      {tab === 'posts' ? <PostsPanel signedIn={signedIn} /> : null}
      {tab === 'you' ? <SessionPanel onSignedIn={onSignedIn} /> : null}
    </div>
  )
}
