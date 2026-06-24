'use client'

import { RelayChat } from '@/components/play/relay-chat'
import { StackPing } from '@/components/play/stack-ping'
import { useApiReachable } from '@/lib/use-api-reachable'

export function PlayPanels() {
  const healthQuery = useApiReachable()

  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-2">
      <RelayChat />
      <StackPing />
      {healthQuery.isError || healthQuery.data === false ? (
        <p className="font-mono text-[10px] text-amber-400/80 lg:col-span-2">
          Demo API appears offline — chat and pings may fail until{' '}
          <code className="text-zinc-400">NEXT_PUBLIC_API_URL</code> is reachable.
        </p>
      ) : null}
    </div>
  )
}
