---
'@kitsunekode/arche': minor
---

Teach dual-path tRPC in fullstack scaffolds (`trpc/caller.ts` for in-process RSC, HTTP proxy in `trpc/server.tsx`), document the pattern in generated agent context, and remove `trpc.hello!` non-null assertions from the homepage demo.

Harden combo-matrix verification with per-combo timeouts, serial e2e in CI (`SCAFFOLD_E2E_SERIAL`), and a Hono homepage copy regression test. Re-export `createCaller` from generated `packages/trpc` for Express presets.
