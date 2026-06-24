# Web perf & SSR hardening

> **For agentic workers:** Execute tasks in order. Each task has verification gates.
> Base commit: `1437811` (MDX SSR + motion scope). Docs crash fix + sidebar SSR shipped next.
> Do not load `docs/archive/planning/` as current behavior.

**Goal:** Make Arche marketing surfaces (docs, blog, examples, families) render
useful HTML on first paint, shrink client bundles, and remove motion patterns that
hide content until JavaScript loads.

**Architecture:** Keep `cacheComponents: true` (PPR) on `apps/web`. Prefer server
components for static MDX embeds. Scope `motion` to `/` only. `/live` and `/play`
use static shells with client islands under `(sandbox)` TRPC provider (no route-level
`loading.tsx` or server prefetch that blocks PPR stream).

**Tech stack:** Next.js App Router, React 19, fumadocs-mdx, Vercel `arche-landing`.

**Authority:** `apps/web/AGENTS.md`, `.docs/product/web-brand-ui-brief.md`,
`.docs/decisions/0002-redis-client-boundaries.md` (no Redis changes in this plan).

---

## Context — what was already fixed (2026-06-24)

| Area                          | Commit                          | Status                                                                                                         |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Docs TOC `[object Object]`    | `053737f`, `91a1c4a`            | SSR TOC from MDX headings                                                                                      |
| `/examples` static highlight  | `053737f`                       | `'use cache'` on Shiki                                                                                         |
| Blog index prerender          | `053737f`                       | sync `getPublishedBlogSummariesSync`                                                                           |
| `/families` table invisible   | `91a1c4a`                       | removed motion stagger                                                                                         |
| Matrix readability            | `91a1c4a`                       | `summary` columns on marketing                                                                                 |
| `/live` CORS + prefetch       | `0b470dd` + Vercel env          | API env on `arche-template-server`                                                                             |
| MDX motion SSR blockers       | `1437811`                       | server embeds, no opacity:0                                                                                    |
| Motion scoped to `/`          | `1437811`                       | `MotionRoot` on landing only                                                                                   |
| Route loader pathname-only    | `1437811`                       | no searchParams bailout                                                                                        |
| Docs TOC crash (React #185)   | `1cb4947`                       | props vs DOM split + stable snapshot                                                                           |
| Docs error boundary           | `1cb4947`                       | `app/docs/error.tsx`                                                                                           |
| Docs sidebar SSR              | `1cb4947`                       | server nav + `DocsSidebarLink`                                                                                 |
| `/live` PPR infinite skeleton | `9de01ab`, `dc10805`, `e9aaeb4` | sync shell + client health; no Suspense hydrator                                                               |
| `/play` Relay showcase        | `9de01ab`, `e9aaeb4`            | chat + Stack Ping reference route                                                                              |
| `/live` + `/play` health UX   | 2026-06-25                      | client health probe (8s first fetch, retries); demo renders immediately — no async RSC bridge (PPR blank slot) |

---

## Findings (vetted) — ordered by leverage

### P0 — SSR blockers (content hidden until JS)

| #   | Finding                                      | Evidence                                                   | Fix                            |
| --- | -------------------------------------------- | ---------------------------------------------------------- | ------------------------------ |
| 1   | MDX command tables fade in with `opacity: 0` | `command-tables.tsx` `m.div initial={{ opacity: 0 }}`      | Server component, no motion    |
| 2   | Stack diagram hidden until in-view           | `stack-diagram.tsx` `m.pre initial={{ opacity: 0 }}`       | Server `pre` + static HTML     |
| 3   | Agent context map nodes hidden               | `agent-context-map.tsx` `initial={{ opacity: 0, y: 8 }}`   | Static positioned divs         |
| 4   | Example code panels fade in                  | `code-example-client.tsx` `m.div initial={{ opacity: 0 }}` | Plain `div` (tabs stay client) |
| 5   | Capability matrix unnecessary client         | `capability-matrix-table.tsx` `'use client'` only          | Remove directive               |

### P1 — Bundle & navigation UX

| #   | Finding                                  | Evidence                          | Fix                                      |
| --- | ---------------------------------------- | --------------------------------- | ---------------------------------------- |
| 6   | `LazyMotion` on every route              | `providers.tsx` wraps root layout | `MotionRoot` on `/` only                 |
| 7   | `useSearchParams` in route loader        | `route-top-loader.tsx`            | `usePathname` only for complete signal   |
| 8   | Docs sidebar client-only for active link | `docs-sidebar.tsx`                | Phase 2: server nav + thin active client |

### P2 — Still out of reach / deferred

| #   | Finding                            | Why deferred                                                             |
| --- | ---------------------------------- | ------------------------------------------------------------------------ |
| 9   | Full static `/live`                | Requires guest SSR data + tRPC RSC patterns; intentionally interactive   |
| 10  | Navbar server component            | Needs mobile menu state; acceptable client island                        |
| 11  | Docs TOC scroll-spy without client | IntersectionObserver needs client; SSR titles already fixed              |
| 12  | Disable PPR globally               | Would regress OG/metadata caching; tune per-route instead                |
| 13  | Vercel monorepo root deploy        | Use existing `arche-landing` project + git push; no CLI deploy from root |

---

## Task 1 — Remove motion SSR blockers from MDX embeds

- [x] `command-tables.tsx` → server, plain rows
- [x] `stack-diagram.tsx` → server, plain `pre`
- [x] `agent-context-map.tsx` → server, static nodes
- [x] `capability-matrix-table.tsx` → server
- [x] `code-example-client.tsx` → remove inner motion (keep Tabs client)

**Verify:**

```bash
bun run --cwd apps/web check-types
bun run --cwd apps/web lint
bun test apps/web
```

**Done when:** `curl -s https://arche.kitsunelabs.xyz/docs/getting-started | rg "Quick loop"` and
page source includes command table text without waiting for hydration.

---

## Task 2 — Scope motion bundle to landing

- [x] Remove `LazyMotion` from `providers.tsx`
- [x] Add `components/arche/motion-root.tsx`
- [x] Wrap animated sections on `app/page.tsx` only

**Verify:**

```bash
bun run --cwd apps/web build
# Confirm docs/blog chunks do not pull motion (inspect build trace or grep .next)
```

**Done when:** `/docs/*` and `/blog` do not require `motion` chunk for MDX content.

---

## Task 3 — Route loader without searchParams bailout

- [x] `route-top-loader.tsx` uses `usePathname()` only for route completion

**Verify:** Blog HTML should not include `BAILOUT_TO_CLIENT_SIDE_RENDERING` from loader
(loader is `ssr: false` dynamic — confirm no regression in nav progress bar).

---

## Task 4 — Docs sidebar active state (optional follow-up)

- [x] Split `DocsSidebar` into server component + `DocsSidebarLink` (client, `usePathname`)
- [x] Sidebar sections extracted to `lib/docs-sidebar-sections.ts`

**Verify:** View-source on `/docs/getting-started` shows sidebar link labels in HTML.

---

## Task 5 — Production deploy checklist

- [x] Push to `main` → Vercel `arche-landing` auto-deploy (`1cb4947`, `e9aaeb4`)
- [x] Hard-refresh smoke: `/docs/getting-started` (200, "Quick loop", no `[object Object]`),
      `/docs/guides/verification-and-presets`, `/examples`, `/blog`, `/families` (200)
- [x] `/live` headless smoke (`e9aaeb4`): hero in first HTML (~28 KB), PROOF RUN hydrates
      within 3s, no `Connection closed.`
- [x] `/play` headless smoke: Relay hero + chat/ping panels hydrate within 3s
- [ ] Confirm `api.arche.kitsunelabs.xyz/health` → `database: connected`
- [ ] Smoke: `RUN_LIVE_DEMO_SMOKE=1 bun test apps/web` (if env configured)

### Docs TOC crash fix (P0, 2026-06-24)

- [x] `DocsTocRailFromProps` — no DOM subscription when SSR `tocItems` provided
- [x] `stableTocItems` cache for DOM scrape path (`lib/toc-snapshot.ts`)
- [x] Removed remount `key` on `DocsTocRailInner`
- [x] `app/docs/error.tsx` for graceful recovery
- [x] Unit tests: `docs-toc.test.ts`, `toc-title.test.ts`

---

## Task 6 — Metrics baseline (post-ship)

Record Lighthouse / Web Vitals on:

- `/` (acceptable LCP delay from terminal animation)
- `/docs/getting-started` (target: LCP text, no layout shift from empty tables)
- `/examples` (target: static code visible in HTML)

---

## Out of scope

- CLI preset verification matrix changes (`packages/registry`)
- `arche-template-server` API changes
- New content / blog posts
- Replacing fumadocs with another docs engine

---

## Dependency graph

```
Task 1 ─┬─► Task 5 (deploy)
Task 2 ─┤
Task 3 ─┘
Task 4 (optional, after 1)
Task 6 (after 5)
```
