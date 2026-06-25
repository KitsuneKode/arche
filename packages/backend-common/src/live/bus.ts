/**
 * Live event bus adapter — in-process today; Redis pub/sub when ENABLE_REDIS=true (future).
 */
export type LiveBusEvent = {
  type: string
  [key: string]: unknown
}

export function publishLiveEvent(_event: LiveBusEvent): void {
  // No-op at package level; server uses in-process EventEmitter in live.events.ts
}

export function subscribeLiveBusEvents(_listener: (event: LiveBusEvent) => void): () => void {
  return () => {}
}
