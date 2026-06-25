'use client'

import { PostsPanel } from '@/components/live/posts-panel'
import { SessionPanel } from '@/components/live/session-panel'

type DrawerTab = 'posts' | 'you' | null

export function LiveDemoFooter({
  signedIn,
  isRegistered = signedIn,
  tab,
  onTabChange,
  onSignedIn,
}: {
  signedIn: boolean
  isRegistered?: boolean
  tab: DrawerTab
  onTabChange: (tab: DrawerTab) => void
  onSignedIn?: () => void
}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950/50 px-2 py-1.5 font-mono text-[10px] tracking-widest uppercase">
        <span className="px-1 text-zinc-600">More</span>
        <button
          type="button"
          onClick={() => onTabChange(tab === 'posts' ? null : 'posts')}
          className={`border px-2.5 py-1 ${
            tab === 'posts' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'
          }`}
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => onTabChange(tab === 'you' ? null : 'you')}
          className={`border px-2.5 py-1 ${
            tab === 'you' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'
          }`}
        >
          You{signedIn ? '' : ' · sign in'}
        </button>
      </div>

      {tab === 'posts' ? (
        <div className="mt-2 max-h-[min(40vh,320px)] overflow-y-auto border border-zinc-800">
          <PostsPanel isRegistered={isRegistered} />
        </div>
      ) : null}
      {tab === 'you' ? (
        <div className="mt-2 max-h-[min(40vh,320px)] overflow-y-auto border border-zinc-800">
          <SessionPanel onSignedIn={onSignedIn} />
        </div>
      ) : null}
    </div>
  )
}
