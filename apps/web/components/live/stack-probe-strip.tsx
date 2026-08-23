import type { RouterOutputs } from '@arche-template/trpc'

type StackSnapshot = RouterOutputs['demo']['stackSnapshot']

export function StackProbeStrip({ snapshot }: { snapshot: StackSnapshot }) {
  const healthLabel =
    snapshot.health.database === 'connected'
      ? snapshot.health.schema === 'ready'
        ? 'DB ready'
        : 'Migrations pending'
      : 'DB offline'

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-2 font-mono text-[10px] tracking-wide text-zinc-500 md:px-8">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-amber-400/90 uppercase">SSR snapshot</span>
        <span>{healthLabel}</span>
        <span>redis {snapshot.redis}</span>
        <span>sync {snapshot.capabilities.liveSync}</span>
        <span>{snapshot.feeds.chatMessageCount} chat</span>
        <span>{snapshot.feeds.publishedPostCount} posts</span>
        <span>{snapshot.feeds.leaderboardEntryCount} scores</span>
        <span className="text-zinc-600">{snapshot.fetchedAt}</span>
      </p>
    </div>
  )
}
