'use client'

import { RelayChat } from '@/components/play/relay-chat'
import { StackPing } from '@/components/play/stack-ping'
import { useApiReachable } from '@/lib/use-api-reachable'

export function PlayPanels() {
  const healthQuery = useApiReachable()

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <RelayChat />
      <div className="space-y-4">
        <StackPing />
        <div className="border border-zinc-800 bg-zinc-950/50 p-4 font-mono text-[10px] text-zinc-500">
          <p className="tracking-widest text-zinc-400 uppercase">Stack signals</p>
          <ul className="mt-3 space-y-1">
            <li>tRPC · chat.list + auth.getSession</li>
            <li>SSE with polling fallback</li>
            <li>
              API health:{' '}
              {healthQuery.isPending ? 'checking…' : healthQuery.data ? 'connected' : 'offline'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
