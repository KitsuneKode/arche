# Web perf & SSR hardening

> **For agentic workers:** Execute tasks in order. Each task has verification gates.
> Base commit: `91a1c4a`. Do not load `docs/archive/planning/` as current behavior.

**Goal:** Make Arche marketing surfaces (docs, blog, examples, families) render
useful HTML on first paint, shrink client bundles, and remove motion patterns that
hide content until JavaScript loads.

**Architecture:** Keep `cacheComponents: true` (PPR) on `apps/web`. Prefer server
components for static MDX embeds. Scope `motion` to `/` only. Leave `/live`
client-heavy by design (tRPC, auth, proof ladder).

**Tech stack:** Next.js App Router, React 19, fumadocs-mdx, Vercel `arche-landing`.

**Authority:** `apps/web/AGENTS.md`, `.docs/product/web-brand-ui-brief.md`,
`.docs/decisions/0002-redis-client-boundaries.md` (no Redis changes in this plan).

---

## Context — what was already fixed (2026-06-24)

| Area                         | Commit                 | Status                               |
| ---------------------------- | ---------------------- | ------------------------------------ |
| Docs TOC `[object Object]`   | `053737f`, `91a1c4a`   | SSR TOC from MDX headings            |
| `/examples` static highlight | `053737f`              | `'use cache'` on Shiki               |
| Blog index prerender         | `053737f`              | sync `getPublishedBlogSummariesSync` |
| `/families` table invisible  | `91a1c4a`              | removed motion stagger               |
| Matrix readability           | `91a1c4a`              | `summary` columns on marketing       |
| `/live` CORS + prefetch      | `0b470dd` + Vercel env | API env on `arche-template-server`   |

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

- [ ] Split `DocsSidebar` into `docs-sidebar-nav.tsx` (server, static links) +
      `docs-sidebar-active.tsx` (client, highlights current path)
- [ ] Pass `pathname` from layout via `headers().get('x-pathname')` middleware **only if**
      needed; prefer `useSelectedLayoutSegment` in small client wrapper

**Verify:** View-source on `/docs/getting-started` shows sidebar link labels in HTML.

---

## Task 5 — Production deploy checklist

- [ ] Push to `main` → Vercel `arche-landing` auto-deploy
- [ ] Hard-refresh: `/docs/getting-started`, `/docs/guides/verification-and-presets`,
      `/examples`, `/blog`, `/families`
- [ ] Confirm `api.arche.kitsunelabs.xyz/health` → `database: connected`
- [ ] Smoke: `RUN_LIVE_DEMO_SMOKE=1 bun test apps/web` (if env configured)

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
