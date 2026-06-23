# TanStack Start app

## Purpose

Full-stack React app on TanStack Start (Router + Vite + Nitro).

## Read First

- `vite.config.ts` — `tanstackStart()` before `@vitejs/plugin-react`
- `src/router.tsx` — router factory wired to generated `routeTree.gen.ts`
- `src/routes/__root.tsx` — document shell (`HeadContent`, `Scripts`, `Outlet`)
- `src/routes/index.tsx` — home route
- `src/routes/api/health.ts` — JSON health server route

## Commands

```bash
bun run dev          # vite dev
bun run build        # vite build (generates route tree)
bun run check-types  # tsc --noEmit
bun run lint         # oxlint
```

## Owns

- File-based routes under `src/routes/`
- Server routes and server functions (add via TanStack Start patterns)
- Client UI in route components

## Update When

Routes, Vite/Nitro config, or TanStack Start plugin versions change.
