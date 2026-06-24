import { SiteFrame, SiteShell } from '@/components/arche/site-primitives'

export default function LiveLoading() {
  return (
    <SiteShell>
      <SiteFrame>
        <div className="border-b border-zinc-800 p-16">
          <div className="h-8 w-48 animate-pulse bg-zinc-900" />
          <div className="mt-6 h-4 w-full max-w-xl animate-pulse bg-zinc-900" />
        </div>
        <div className="grid gap-8 p-6 md:p-16 lg:grid-cols-2">
          <div className="h-96 animate-pulse border border-zinc-800 bg-zinc-950" />
          <div className="h-96 animate-pulse border border-zinc-800 bg-zinc-950" />
        </div>
      </SiteFrame>
    </SiteShell>
  )
}
