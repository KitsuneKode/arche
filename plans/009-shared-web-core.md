# Plan 009: Establish a single canonical "web core" for Next.js templates (align now, extract deliberately)

> **Executor instructions**: This plan has a SAFE phase (do it) and a DESIGN
> phase (STOP and report — do NOT build it without sign-off). Follow Phase 1
> fully; for Phase 2, produce the written proposal and STOP. Honor all STOP
> conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/templates/next apps/cli/src/templates/fullstack/apps/web`
> If either changed since `d199cac`, re-read the files named below before editing; on mismatch, STOP.
>
> **Sequencing**: This is the foundation for Plan 010 (deep `next`). Do 009 first.

## Status

- **Priority**: P2
- **Effort**: M (Phase 1) + design (Phase 2)
- **Risk**: MED
- **Depends on**: none
- **Blocks**: 010
- **Category**: architecture (remove duplicated web foundation) / direction
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The Next.js "web foundation" — `next.config`, `tsconfig`, root `layout`, base `styles`, and `package.json` script/version conventions — is **copied independently** into every web-bearing template: `templates/next`, `templates/fullstack/apps/web`, `templates/convex`, `templates/solana/**` (web), `templates/rust/**` (web). These copies have already drifted:

- `templates/next/next.config.js` is CommonJS (`module.exports`) and empty; `templates/fullstack/apps/web/next.config.js` is the maintained one.
- `templates/next/package.json` is `@acme/web`, loose pins (`next: "^16"`, `react: "^19"`), no `lint`/`type: module`, no shared tsconfig; `templates/fullstack/apps/web/package.json` is `@arche-template/web`, pinned (`next: ^16.2.6`), `type: module`, `dev: next dev --turbopack`, `lint: oxlint`, extends `@arche-template/typescript-config`.
- `templates/next/tsconfig.json` is a hand-rolled standalone config (`target: ES2017`), not the shared base.

This is the classic **shallow duplicate**: N adapters of one "Next.js app foundation" interface, maintained by hand, guaranteed to drift. Apply the deletion test — a single web core concentrates these conventions in one place (locality), so a fix or a Next.js version bump lands once instead of five times. Plan 010 (making `next` first-class) should build on that core, not on the current stub.

This plan does the **safe, high-certainty** part now (align the `next` stub to the canonical conventions + add a drift guard), and **specifies but does not build** the deeper extraction (a real shared-core seam), because choosing the seam (template-overlay vs generator) is a design decision with tradeoffs that must be grilled with the maintainer first (architecture skill: surface and grill, don't unilaterally refactor).

## Current state (verified at d199cac)

Canonical (keep as the reference) — `templates/fullstack/apps/web/package.json`:

```5:37:apps/cli/src/templates/fullstack/apps/web/package.json
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "oxlint -c ../../.oxlintrc.json",
    "lint:fix": "oxlint --fix",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    ...
    "next": "^16.2.6",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    ...
  },
  "devDependencies": {
    "@arche-template/typescript-config": "workspace:*",
    "@types/node": "^25.9.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "typescript": "^6.0.3"
  }
```

Stub (drifted) — `templates/next/package.json`:

```1:20:apps/cli/src/templates/next/package.json
{
  "name": "@acme/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "check-types": "tsc --noEmit",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

Stub `next.config.js` (CJS vs the canonical ESM) and stub `tsconfig.json` (standalone `ES2017`) are likewise out of line — see the files directly.

> **Note**: `templates/next` is a STANDALONE app (not a workspace member), so it cannot use `workspace:*` deps or `oxlint -c ../../.oxlintrc.json` (no monorepo root above it). Align _conventions and pins_ to canonical, but keep paths/deps appropriate for a standalone app (it ships its own `.oxlintrc.json` — confirmed present at `templates/next/.oxlintrc.json`). This nuance is exactly why a naive "share the files" approach is wrong and Phase 2 needs design.

## Commands you will need

| Purpose                         | Command                                                                                                                                                       | Expected                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| CLI typecheck                   | `bun run --cwd apps/cli check-types`                                                                                                                          | exit 0                  |
| CLI tests                       | `bun test apps/cli/tests`                                                                                                                                     | all pass                |
| Scaffold `next` to temp & build | `bun run --cwd apps/cli dev -- /tmp/arche-next --yes --family next` then in it `bun install && bun run build` (or use the generated-project verifier harness) | install + build succeed |
| Format check                    | `bun run format:check`                                                                                                                                        | exit 0                  |

## Scope

**Phase 1 (in scope)**:

- `apps/cli/src/templates/next/package.json` (align name handling, pins, scripts, `type: module`)
- `apps/cli/src/templates/next/next.config.js` (match canonical ESM/Turbopack conventions; standalone-appropriate)
- `apps/cli/src/templates/next/tsconfig.json` (align compiler options to canonical, standalone-appropriate — no workspace `extends`)
- `apps/cli/tests/` (add a web-core convention drift-guard test)

**Phase 2 (DESIGN ONLY — do not implement)**:

- A written proposal section appended to THIS plan (or a new `plans/009-web-core-design-notes.md`) describing the shared-core seam options.

**Out of scope (both phases)**:

- `templates/fullstack/apps/web` (it is the reference; do not change it here)
- Adding deep `next` features (that is Plan 010)
- Changing `resolveTemplateSource`/`copyTemplate` (any composition mechanism is Phase 2 design, not built here)

## Git workflow

- Branch: `advisor/009-shared-web-core`
- Conventional commits, e.g. `refactor(cli): align next template foundation to canonical web conventions`.
- Do NOT push/PR unless instructed.

## Steps — Phase 1 (build)

### Step 1: Align `templates/next/package.json` conventions

Match the canonical web app's conventions while keeping it standalone:

- Add `"type": "module"` and `"version": "0.1.0"`, `"private": true`.
- Pin versions to the canonical values (`next: ^16.2.6`, `react: ^19.2.6`, `react-dom: ^19.2.6`, `@types/react: 19.2.14`, `@types/react-dom: 19.2.3`, `typescript: ^6.0.3`, add `@types/node: ^25.9.0`).
- Scripts: `dev: next dev --turbopack`, `build`, `start`, `check-types`, and `lint: oxlint -c .oxlintrc.json` / `lint:fix: oxlint --fix` (standalone path — the file is local).
- Leave `name` as the template placeholder the scaffold rewrites (confirm how standalone templates get their name — if the scaffold renames standalone package names, keep the placeholder it expects; if not, `@acme/web` is the documented placeholder — verify against `replaceWorkspaceScope`/rename logic before changing).

**Verify**: `bun run --cwd apps/cli check-types` → exit 0.

### Step 2: Align `next.config.js` and `tsconfig.json`

- Bring `next.config.js` in line with the canonical file's format and any baseline options (keep it standalone — no monorepo `transpilePackages`).
- Align `tsconfig.json` compiler options to the canonical (`moduleResolution: bundler`, the `next` plugin, `paths`, strictness) but keep it self-contained (no workspace `extends` that doesn't exist for a standalone app).

**Verify**: scaffold `next` into a temp dir, `bun install && bun run build` succeeds.

### Step 3: Add a drift-guard test

Add `apps/cli/tests/web-core-conventions.test.ts` that reads both `templates/next/package.json` and `templates/fullstack/apps/web/package.json` and asserts the SHARED conventions agree: identical version pins for `next`/`react`/`react-dom`/`@types/react`/`@types/react-dom`/`typescript`, both have `type: module`, both have a `--turbopack` dev script, both expose `check-types`/`lint`. Assert ONLY the intentionally-shared keys (not standalone-vs-workspace differences). This locks the alignment so the two cannot silently drift again.

**Verify**: `bun test apps/cli/tests` → all pass; deliberately bump one pin in the stub and confirm the test fails, then revert.

## Steps — Phase 2 (DESIGN — STOP after writing)

Append a "Shared web-core design" section to this plan covering:

1. **The interface**: enumerate exactly which files/conventions are truly shared across all web-bearing templates vs which are family-specific (e.g. fullstack adds `trpc/`, `env.ts`, provider in `layout`).
2. **Seam options**, each with tradeoffs:
   - **(a) Template-overlay composition**: a `templates/_web-core/` fragment copied first, then family files overlaid in `copyTemplate`. Pro: files stay files. Con: needs a new composition step + ordering/conflict rules; touches the copy pipeline.
   - **(b) Web-foundation generator**: a `renderWebFoundation(options)` module emitting the shared files (like existing generators). Pro: matches current generator pattern, one source. Con: converts files→strings (loses file-level diffability).
   - **(c) Status quo + drift guards**: keep copies, expand the Step 3 guard to all web templates. Pro: zero risk. Con: still N copies.
3. **Recommendation** with reasoning, and the migration order (which template adopts the core first to make it a _real_ seam — two adapters minimum).
4. **STOP**: present this to the maintainer for grilling before any implementation. Do not build (a) or (b).

## Test plan

- Phase 1: the drift-guard test above; plus a scaffold-and-build smoke for `next`.
- Phase 2: none (design only).
- Verification: `bun run ci:min:affected` (or `ci:min`) → exit 0.

## Done criteria

Phase 1 (ALL must hold):

- [ ] `templates/next` foundation (`package.json`, `next.config.js`, `tsconfig.json`) aligned to canonical conventions, kept standalone-appropriate
- [ ] Scaffolded `next` project installs and builds
- [ ] Drift-guard test added and passing (and proven to fail on a deliberate pin mismatch)
- [ ] `bun run --cwd apps/cli check-types` exits 0
- [ ] `bun test apps/cli/tests` passes
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files

Phase 2:

- [ ] Design section written with the three seam options, a recommendation, and migration order
- [ ] STOPPED for maintainer sign-off (no composition/generator code written)
- [ ] `plans/README.md` row updated

## STOP conditions

- The `next` template name/rename handling is unclear (does the scaffold rewrite `@acme/web`?) — confirm via the rename logic before changing `name`; if still unclear, STOP.
- Aligning pins breaks the `next` build (a pinned version is incompatible standalone) — STOP and report the specific version conflict.
- Anyone asks you to implement Phase 2 seam (a) or (b) as part of THIS plan — decline; it requires sign-off.

## Maintenance notes

- The drift guard is the cheap insurance: until a true shared core exists, it's what keeps the copies honest. Extend it to other web templates (convex, solana-web) opportunistically.
- When Plan 010 adds deep `next` features, they should slot onto these aligned conventions, not reintroduce stub-isms.
- Reviewer: confirm no change leaked into `templates/fullstack/apps/web` (it's the reference, not a target here).

## Shared web-core design (Phase 2 — design only)

### 1. The interface

**Shared across all web-bearing templates**

- `package.json` conventions: `type: module`, pinned `next`/`react`/`typescript`, `--turbopack` dev script, `lint` + `check-types` scripts
- `next.config.js` ESM export shape and baseline options
- `tsconfig.json` compiler strictness, `moduleResolution: bundler`, Next plugin, `@/*` paths
- Root `layout.tsx` metadata patterns and `Readonly<{ children }>` typing
- `.oxlintrc.json` baseline, `.env.example` public URL vars

**Family-specific (not shared)**

- `env.ts` wiring (standalone `@t3-oss/env-nextjs` vs workspace `@arche-template/common/env`)
- tRPC/auth/db providers and packages (`fullstack` only)
- Convex `convex/` tree, Solana wallet pages, showcase routes, worker workspaces

### 2. Seam options

**(a) Template-overlay composition** — copy `templates/_web-core/` first, overlay family files.

- Pro: files stay diffable in git; one physical source for pins/config.
- Con: new copy-pipeline ordering/conflict rules; every family adoption is a migration.

**(b) Web-foundation generator** — `renderWebFoundation(options)` emits shared files (like existing generators).

- Pro: matches current generator pattern; one TypeScript source of truth.
- Con: files become strings; harder to eyeball template drift without tests.

**(c) Status quo + drift guards** — keep per-family copies, expand guards (as in Phase 1 `web-core-conventions.test.ts`).

- Pro: zero pipeline risk; already partially implemented.
- Con: still N copies; guards must be extended to convex/solana-web templates manually.

### 3. Recommendation

Prefer **(c) now, (a) when a second standalone web family needs the same foundation**. The `next` + `fullstack/apps/web` drift guard is cheap and proven. When convex-web or another standalone Next surface needs the same pins, introduce `templates/_web-core/` overlay with explicit merge rules rather than a generator — keeps templates inspectable while concentrating pins once.

**Migration order:** (1) `templates/next` (done), (2) any future standalone Next preset, (3) optionally extract convex web app shell, (4) only then consider generator emission for dynamic variants.

### 4. STOP

Do not implement (a) or (b) without maintainer sign-off on the seam choice and migration order above.
