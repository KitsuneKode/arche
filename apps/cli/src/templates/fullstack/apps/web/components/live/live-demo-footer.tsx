'use client'

import { useState } from 'react'

import { PostsPanel } from '@/components/live/posts-panel'
import { SessionPanel } from '@/components/live/session-panel'

type DrawerTab = 'posts' | 'you' | null

export function LiveDemoFooter({
  signedIn,
  onSignedIn,
  onOpenYou,
}: {
  signedIn: boolean
  onSignedIn?: () => void
  onOpenYou?: () => void
}) {
  const [tab, setTab] = useState<DrawerTab>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-widest uppercase">
        <button
          type="button"
          onClick={() => setTab(tab === 'posts' ? null : 'posts')}
          className={`border px-4 py-2 ${
            tab === 'posts' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'
          }`}
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => {
            const next = tab === 'you' ? null : 'you'
            setTab(next)
            if (next === 'you') onOpenYou?.()
          }}
          className={`border px-4 py-2 ${
            tab === 'you' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'
          }`}
        >
          You
        </button>
      </div>

      {tab === 'posts' ? <PostsPanel signedIn={signedIn} /> : null}
      {tab === 'you' ? <SessionPanel onSignedIn={onSignedIn} /> : null}
    </div>
  )
}
