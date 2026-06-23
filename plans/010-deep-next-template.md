# Plan 010: Make `next` a first-class, opinionated, verified template (baseline depth)

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. This plan deepens the BASELINE `next` template only; the four
> feature-presets (`auth`/`docs`/`analytics`/`storage`) are explicitly OUT of
> scope here — their fate is decided in Plan 011. Update this plan's row in
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/templates/next packages/registry/src apps/cli/src/lib/generated-project-verifier.ts`
> If any changed since `d199cac`, re-read the files below; on mismatch, STOP.
>
> **Sequencing**: REQUIRES Plan 009 Phase 1 (foundation conventions aligned).
> Coordinate registry edits with Plan 011 (both touch `packages/registry/src`).

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: 009 (hard)
- **Coordinates with**: 011 (shared files in `packages/registry/src`)
- **Category**: direction (template depth) / DX
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The user wants `next` to be a real, opinionated starting point a senior engineer would actually use — not a stub. Today `templates/next` is bare: a one-`<div>` layout, an empty `next.config.js`, a homepage, and nothing else. There is no env validation, no error/loading/not-found boundaries, no SEO/metadata baseline, no sample data route, no design tokens, no README. It IS already exercised by the e2e verifier (the `next` combo case checks only `app/layout.tsx`), so the harness exists — it just verifies almost nothing. This plan makes the baseline deep (the things every Next app needs, wired correctly once) and makes the verification prove install + typecheck + lint + build, so its "stable" status is evidence-based rather than asserted.

## Current state (verified at d199cac)

Bare template (entire `app/` is layout + page + styles):

```9:15:apps/cli/src/templates/next/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

The e2e `next` case verifies only that `app/layout.tsx` exists (no commands by default here):

```98:98:apps/cli/src/lib/generated-project-verifier.ts
  { id: 'next', family: 'next', packageManager: 'bun', expectedFiles: ['app/layout.tsx'] },
```

Registry has NO `next` preset at all — `PRESETS` lists fullstack/rust/convex/solana/customize/experiments only (`packages/registry/src/presets.ts:23-106`), so `next` is reachable only via `--family next`, never surfaced as a first-class preset in the matrix or web.

## Conventions to follow

- Match the existing template code style (functional components, `Readonly<{children}>` typing as in the fullstack web `layout.tsx`, 2-space indent, no semicolons per oxfmt — run `format` to confirm).
- Env validation: use `@t3-oss/env-nextjs` exactly as the fullstack web does — read `apps/cli/src/templates/fullstack/apps/web/env.ts` and mirror its structure. Declare the dependency in `templates/next/package.json` (standalone; pin to the version the fullstack web uses).
- Keep everything **backend-agnostic** — the baseline `next` template has no tRPC/auth/db. Those are family/preset concerns.

## Commands you will need

| Purpose                 | Command                                                                                 | Expected    |
| ----------------------- | --------------------------------------------------------------------------------------- | ----------- |
| CLI typecheck           | `bun run --cwd apps/cli check-types`                                                    | exit 0      |
| Registry typecheck      | `bun run --cwd packages/registry check-types`                                           | exit 0      |
| CLI tests               | `bun test apps/cli/tests`                                                               | all pass    |
| Scaffold + build `next` | scaffold to temp, `bun install && bun run lint && bun run check-types && bun run build` | all succeed |
| Format check            | `bun run format:check`                                                                  | exit 0      |

## Scope

**In scope**:

- `apps/cli/src/templates/next/**` — add baseline depth files
- `packages/registry/src/presets.ts` — add a `next-app` preset entry
- `packages/registry/src/verification-matrix.ts` — add `next-app` evidence row
- `packages/registry/src/preset-config.ts` (or wherever `projectDefaultsForPreset` lives) — map `next-app` → `{ family: 'next', ... }`
- `apps/cli/src/types/schemas.ts` — add `next-app` to `PresetSchema` (the top-level preset enum) IF the registry preset must be selectable
- `apps/cli/src/lib/generated-project-verifier.ts` — strengthen the `next` case (expectedFiles + commands)

**Out of scope**:

- The four `NextPreset` features (`auth`/`docs`/`analytics`/`storage`) — Plan 011 decides implement-vs-remove
- `templates/fullstack/apps/web` (reference only)
- Backend/db/auth wiring of any kind into the baseline

## Git workflow

- Branch: `advisor/010-deep-next-template`
- Conventional commits, e.g. `feat(cli): deepen baseline next template; verify install/build`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add the baseline depth files to `templates/next`

Add, matching repo style and keeping backend-agnostic:

- `app/error.tsx` (client error boundary), `app/loading.tsx`, `app/not-found.tsx`.
- `env.ts` — env validation via `@t3-oss/env-nextjs` (mirror fullstack web `env.ts`); declare the dep in `package.json`.
- A metadata/SEO baseline: extend `app/layout.tsx` `metadata` (title template, description, `metadataBase`, OpenGraph defaults) — or a small `app/metadata.ts` helper imported by the layout.
- A sample route that proves the App Router works end-to-end without a backend: `app/api/health/route.ts` returning `{ status: 'ok' }` (Route Handler) — simplest verifiable feature.
- Design tokens in `app/styles.css` (CSS variables for color/space/radius/typography) and use them in the homepage so the starting UI is intentional, not empty.
- A real `README.md` for the generated project (what's included, how to run, where to add routes/data) — keep it short and accurate (no claims of features not present).

**Verify**: scaffold `next` to temp; `bun install && bun run lint && bun run check-types && bun run build` all succeed.

### Step 2: Register a truthful `next-app` preset

- `presets.ts`: add `'next-app'` to `PresetId` and a `PRESETS` entry: `{ id: 'next-app', label: 'Next.js App', status: <evidence-based>, description: 'Opinionated standalone Next.js App Router starter with env validation, error/loading boundaries, SEO baseline, and design tokens.', capabilities: ['web'] }`. Set `status` per the verification evidence you actually produce in Step 3 — `stable` ONLY if install+lint+typecheck+build all pass in CI; otherwise `experimental`/`beta`. Do NOT claim capabilities the baseline lacks (no `auth`/`api`/`database`/`deployment`).
- `verification-matrix.ts`: add a `'next-app'` row to `PRESET_VERIFICATION_MATRIX` with only the evidence that's真 true (`structure`, `bun`, `generatedInstall`, `generatedLint`, `generatedTypecheck`, `generatedBuild`, `docs`, `agentContext` as proven). Add a `presetHasStableEvidence` branch for `next-app` requiring those keys.
- `preset-config.ts`: map `next-app` → defaults `{ family: 'next', packageManager: 'bun', ... }` so `projectDefaultsForPreset('next-app')` works (model after an existing single-family preset mapping).
- `schemas.ts`: add `'next-app'` to `PresetSchema` if a top-level preset must be in that enum (check how `PresetSchema` and `PresetId` relate — keep them consistent).

**Verify**: `bun run --cwd packages/registry check-types` → exit 0; `bun run --cwd apps/cli check-types` → exit 0.

### Step 3: Strengthen the e2e `next` verification

Update the `next` combo case to assert the new files and run real commands:

```ts
{
  id: 'next',
  family: 'next',
  packageManager: 'bun',
  expectedFiles: ['app/layout.tsx', 'app/error.tsx', 'app/not-found.tsx', 'env.ts', 'app/api/health/route.ts'],
},
```

Ensure the combo runner executes `install`, `lint`, `typecheck`, `build` for this case (follow how `FULLSTACK_COMBO_CASES` get their commands — read the combo runner around `runGeneratedComboMatrix`/`mkdtempSync(... 'arche-generated-combo-')`). If the combo suite is gated behind `SCAFFOLD_E2E=1` (Plan 004), run it with that flag set to confirm green.

**Verify**: `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts` (or the combo entrypoint) → the `next` case passes install/lint/typecheck/build.

### Step 4: Confirm agent-docs reflect reality for baseline `next`

The generated `AGENTS.md` for `next` lists `app`, `components`, and (only if `auth` preset selected) `lib/auth`. Since this plan adds no `components/` dir by default, either add a minimal `components/` (with one example component used by the homepage) OR remove the `components` claim from `agent-docs.ts` for the `next` family. Pick the option that keeps docs truthful; prefer adding a real `components/` with one used component (more useful baseline).

**Verify**: scaffold `next`, open generated `AGENTS.md`, confirm every listed directory exists.

## Test plan

- Extend `apps/cli/tests/` with a `next` structure test (model after an existing family structure test): scaffold `next` to temp, assert the new files exist, assert `env.ts` imports `@t3-oss/env-nextjs`, assert no phantom dirs in generated `AGENTS.md`.
- The e2e combo `next` case (Step 3) is the build-level guarantee.
- Registry: add/extend a test asserting `next-app` appears in `PRESETS`, its `capabilities` ⊆ what the matrix proves, and `presetHasStableEvidence('next-app')` matches its declared `status`.
- Verification: `bun run ci:min:affected` (or `ci:min`) → exit 0; `SCAFFOLD_E2E=1` combo → `next` green.

## Done criteria

ALL must hold:

- [ ] `templates/next` includes error/loading/not-found, `env.ts` (validated), SEO metadata baseline, a health Route Handler, design tokens, and a truthful README
- [ ] Scaffolded `next` passes `install` + `lint` + `check-types` + `build`
- [ ] `next-app` preset added to registry with evidence-based `status` and honest `capabilities`
- [ ] `verification-matrix.ts` has a `next-app` row matching reality + a `presetHasStableEvidence` branch
- [ ] `projectDefaultsForPreset('next-app')` returns a `next`-family config
- [ ] e2e `next` case verifies the new files and runs install/lint/typecheck/build
- [ ] Generated `AGENTS.md` for `next` lists only directories that exist
- [ ] `bun run --cwd apps/cli check-types` and `--cwd packages/registry check-types` exit 0
- [ ] `bun test apps/cli/tests` passes; `SCAFFOLD_E2E=1` combo `next` green
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- Plan 009 Phase 1 is NOT done (foundation not aligned) — STOP; do that first.
- Adding `next-app` to `PresetId`/`PresetSchema` cascades into exhaustive `switch`/matrix checks you can't satisfy without touching out-of-scope presets — STOP and report the surface.
- The baseline build fails for a reason tied to a feature you'd need a backend for — STOP; the baseline must stay backend-agnostic.
- You find yourself implementing `auth`/`docs`/`analytics`/`storage` presets — STOP; that's Plan 011's decision, not this plan.

## Maintenance notes

- The baseline `next` is now the proving ground for the shared web core (Plan 009 Phase 2). When the core lands, this template should consume it.
- Keep `next-app` status honest: if a future change breaks the build, the e2e case fails and the status must drop — do not hard-code `stable`.
- Reviewer: confirm zero backend/auth/db deps leaked into `templates/next/package.json`.
