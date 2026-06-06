# tRPC Package

Client-facing API contract for web and workers.

- Start with [AGENTS.md](./AGENTS.md).
- Implementation: `apps/server/src/modules/<feature>/*.trpc.ts`
- Composition: `apps/server/src/modules/trpc/app.router.ts`
- This package re-exports `AppRouter`, `createCaller`, and middleware from `@arche-template/server/trpc`.
