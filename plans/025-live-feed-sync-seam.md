# Plan 025: Deepen Live chat sync into a LiveFeed module

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e125e4c..HEAD -- apps/web/lib/live-chat-sync-policy.ts apps/web/lib/live-chat-sync.ts apps/web/components/live/use-chat-stream.ts apps/web/components/live/live-chat.tsx`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (optional after plan 024)
- **Category**: tech-debt
- **Planned at**: commit `e125e4c`, 2026-06-24

## Why this matters

Live chat sync logic is split across policy (`live-chat-sync-policy.ts`), URL helper (`live-chat-sync.ts`), hook (`use-chat-stream.ts`), and UI (`live-chat.tsx`). Each caller must understand Vercel serverless (polling) vs Render Docker (SSE) behaviour. A deep LiveFeed module concentrates deployment policy and gives tests a single seam with mock adapters.

## Current state

- `apps/web/lib/live-chat-sync-policy.ts` — `isChatSseEnabled()` reads `NEXT_PUBLIC_ENABLE_CHAT_SSE` and `NODE_ENV`
- `apps/web/lib/live-chat-sync.ts` — re-exports policy + `chatStreamUrl()`
- `apps/web/components/live/use-chat-stream.ts` — EventSource + fallback invalidation
- `apps/web/components/live/live-chat.tsx` — tRPC `chat.list` query with conditional `refetchInterval`
- `apps/web/lib/live-chat-sync.test.ts` — tests policy only

Exemplar pattern for client hooks: `apps/web/lib/client-mounted.ts` + its test.

## In scope

- New `apps/web/lib/live-feed/` (or `apps/web/lib/live-feed.ts` if small):
  - `createLiveFeed({ apiUrl, onMessages, queryClient })` returning `{ start, stop, mode: 'sse' | 'poll' }`
  - Internal adapters: `sseAdapter`, `pollingAdapter` using existing policy
- Refactor `use-chat-stream.ts` to thin wrapper over LiveFeed
- Refactor `live-chat.tsx` to use hook only (no direct policy imports)
- Tests: `live-feed.test.ts` with mocked EventSource and fake timers for poll interval

## Out of scope

- Server-side Redis pub/sub for SSE (speculative; polling is correct for Vercel)
- Proof ladder refactor
- CLI template sync (separate follow-up if templates gain live demo)

## Steps

### 1. Characterization tests (current behaviour)

Add `apps/web/lib/live-feed.characterization.test.ts` (or extend `live-chat-sync.test.ts`) asserting:

- `isChatSseEnabled()` false when `NODE_ENV=production` and flag unset
- `isChatSseEnabled()` true when `NEXT_PUBLIC_ENABLE_CHAT_SSE=true`

Run: `bun test apps/web/lib/live-chat-sync.test.ts` — must pass before refactor.

### 2. Implement LiveFeed module

Create module with interface:

```typescript
export type LiveFeedMode = 'sse' | 'poll'

export function resolveLiveFeedMode(): LiveFeedMode {
  return isChatSseEnabled() ? 'sse' : 'poll'
}

export function createLiveFeed(options: {
  streamUrl: string
  onInvalidate: () => void
  pollIntervalMs?: number
}): { start: () => void; stop: () => void; mode: LiveFeedMode }
```

- SSE path: reuse EventSource logic from `use-chat-stream.ts`
- Poll path: `setInterval` calling `onInvalidate` at 3000ms (match current `live-chat.tsx`)

### 3. Wire hook and UI

- `use-chat-stream.ts` calls `createLiveFeed` only
- `live-chat.tsx` removes direct `isChatSseEnabled` import; `refetchInterval` derived from hook's `mode`

### 4. Verification

```bash
bun test apps/web/lib/
bun run ci:min
```

Manual: local dev with SSE on; production build with polling (`NODE_ENV=production`).

## STOP conditions

- If refactoring breaks hydration on `/live` — revert hook change and report
- If `live-chat.tsx` still imports policy directly after step 3 — incomplete

## Done criteria

- [ ] Single import path for deployment-aware sync from UI (`useChatStream` only)
- [ ] `live-feed.test.ts` covers both adapters with mocks
- [ ] `bun run ci:min` green
- [ ] No `isChatSseEnabled` import in `live-chat.tsx`

## Maintenance note

When adding Render Docker docs, only LiveFeed policy + env docs need updating. Future Redis SSE adapter plugs in behind `createLiveFeed` without UI changes.
