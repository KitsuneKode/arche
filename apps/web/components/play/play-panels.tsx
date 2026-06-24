'use client'

import { RelayChat } from '@/components/play/relay-chat'
import { StackPing } from '@/components/play/stack-ping'
import { useApiReachable } from '@/lib/use-api-reachable'

export function PlayPanels() {
  const healthQuery = useApiReachable()
  const confirmedOffline =
    healthQuery.isFetched && healthQuery.data?.reachable === false && !healthQuery.isFetching

  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-2">
      {healthQuery.isPending ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase lg:col-span-2">
          Connecting to demo API…
        </p>
      ) : null}
      <RelayChat />
      <StackPing />
      {confirmedOffline ? (
        <p className="font-mono text-[10px] text-amber-400/80 lg:col-span-2">
          Demo API appears offline — chat and pings may fail until the API is reachable.
        </p>
      ) : null}
    </div>
  )
}
