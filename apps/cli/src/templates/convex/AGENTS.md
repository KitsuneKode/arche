# Convex + Next.js Template

## Fast Routing

- App routes: `app/`
- Convex backend: `convex/`
- Auth config: `convex/auth.ts`, `convex/auth.config.ts`
- Schema: `convex/schema.ts`

## Commands

```bash
bun run dev       # start Next.js + Convex dev
bun run lint      # oxlint
bun run check-types # tsc --noEmit (run `bun run convex:codegen` after `convex dev` links a deployment)
```

## Conventions

- Mutations return `Promise` — no `async` wrapper needed for single-awaited calls.
- Queries go in `convex/`; component data-fetching uses `useQuery` from `convex/react`.
- Environment variables: prefix client-facing vars with `NEXT_PUBLIC_`.
