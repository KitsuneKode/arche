# Plan 012: Add an OpenTUI terminal-app template (new `tui` family + `tui-app` preset)

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. This adds a NEW scaffold template the CLI produces FOR USERS — it
> does NOT add OpenTUI to our own `arche` CLI (our CLI keeps `@clack/prompts`,
> stays lean, no native deps in the published bundle). Start with the feasibility
> gate (Step 0); if it fails, STOP before building the template. Update this
> plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/types/schemas.ts apps/cli/src/lib/scaffold.ts apps/cli/src/lib/generators/agent-docs.ts packages/registry/src apps/cli/src/lib/generated-project-verifier.ts apps/cli/src/templates/cli`
> If any changed since `d199cac`, re-read the excerpts below; on mismatch, STOP.
>
> **Library docs**: OpenTUI moves fast. Before writing template code, fetch
> current docs via Context7 (`@opentui/react`, `@opentui/core`) or the official
> docs at https://opentui.com — confirm the exact renderer/JSX API for the
> installed version. Pin the versions you actually verify.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED (native dependency in the GENERATED project; our CLI unaffected)
- **Depends on**: none (independent). Mirrors the structure of Plan 010 — read 010 for the family/preset wiring pattern if helpful.
- **Coordinates with**: 010, 011 (all touch `packages/registry/src` — sequence edits)
- **Category**: direction (new template) / DX
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The user wants OpenTUI delivered as a **scaffold template/preset** — a first-class "Terminal UI app" the CLI generates for users — not as chrome for our own CLI. This is the smart framing: the native Zig core (`@opentui/core`) lands only in the _generated_ project (where the user installs it on their own platform), so our published `arche` CLI stays a lean single-file bundle with no native dependency. It also fills a real gap: the existing `cli` family scaffolds a trivial `console.log('Hello')` stub; there's no opinionated path for building a modern interactive terminal app. A `tui` family built on `@opentui/react` gives users a React-based TUI starter with the same quality bar as the other families.

## Current state (verified at d199cac)

Families are a fixed enum, each mapping 1:1 to a template directory via `resolveTemplateSource(family) → src/templates/<family>`:

```7:19:apps/cli/src/types/schemas.ts
export const FamilySchema = z.enum([
  'fullstack',
  'next',
  'backend',
  'rust',
  'solana',
  'convex',
  'worker',
  'lib',
  'cli',
  'mobile',
  'polyglot',
])
```

`FAMILY_LABELS` is an exhaustive `Record<Family, string>` (adding a family forces a label here, which is good — the compiler enforces it):

```198:210:apps/cli/src/types/schemas.ts
export const FAMILY_LABELS: Record<Family, string> = {
  fullstack: 'Full-stack TypeScript monorepo',
  next: 'Standalone Next.js app',
  ...
  cli: 'CLI package',
  mobile: 'Expo mobile app',
  polyglot: 'Multi-language monorepo',
}
```

The existing `cli` template is the structural exemplar to copy (standalone package, `.archefiles.json` allowlist, `.oxlintrc.json`, `AGENTS.md`, `tsconfig.json`, `package.json` with `@acme/*` placeholder name, `src/`):

```1:17:apps/cli/src/templates/cli/package.json
{
  "name": "@acme/cli",
  "private": true,
  "bin": {
    "acme": "./dist/index.js"
  },
  "type": "module",
  "scripts": {
    "build": "tsc",
    "check-types": "tsc --noEmit",
    "start": "node dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^22",
    "typescript": "^5"
  }
}
```

```1:11:apps/cli/src/templates/cli/.archefiles.json
{
  "version": "0.2.0",
  "include": [
    ".env.example",
    ".oxlintrc.json",
    "AGENTS.md",
    "package.json",
    "tsconfig.json",
    "src/index.ts"
  ]
}
```

The agent-docs generator has a per-family `dirs` switch and a per-family description block (you must add a `tui` branch to both — see `apps/cli/src/lib/generators/agent-docs.ts`, the `family === 'cli'`/`'lib'` branches around lines 48–52 and the description map around line 361).

The e2e combo verifier lists one case per family (add a `tui` case):

```119:120:apps/cli/src/lib/generated-project-verifier.ts
  { id: 'lib', family: 'lib', packageManager: 'bun', expectedFiles: ['package.json'] },
  { id: 'cli', family: 'cli', packageManager: 'bun', expectedFiles: ['package.json'] },
```

OpenTUI facts (confirmed 2026-06, re-verify at execution): `@opentui/react` ~0.3.x depends on `@opentui/core` (native Zig) + `react` (+ transitive `react-reconciler ^0.33.0`). Install: `bun add @opentui/react @opentui/core react`. tsconfig needs `jsx: react-jsx`, `jsxImportSource: @opentui/react`, `lib: [ESNext, DOM]`, `moduleResolution: bundler`. Entry pattern:

```tsx
import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
const renderer = await createCliRenderer(/* opts */)
createRoot(renderer).render(<App />)
```

Intrinsics are lowercase (`box`, `text`, `scrollbox`, `input`); hooks `useKeyboard`, `useRenderer`, `useTerminalDimensions`.

## Commands you will need

| Purpose                 | Command                                                                 | Expected                            |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| CLI typecheck           | `bun run --cwd apps/cli check-types`                                    | exit 0                              |
| Registry typecheck      | `bun run --cwd packages/registry check-types`                           | exit 0                              |
| CLI tests               | `bun test apps/cli/tests`                                               | all pass                            |
| Scaffold `tui` + verify | scaffold to temp, `bun install && bun run check-types && bun run build` | succeed (see Step 0 for run caveat) |
| Format check            | `bun run format:check`                                                  | exit 0                              |

## Scope

**In scope**:

- NEW `apps/cli/src/templates/tui/**` (the template)
- `apps/cli/src/types/schemas.ts` — add `'tui'` to `FamilySchema` + `FAMILY_LABELS` (+ any exhaustive family helper that the compiler flags)
- `apps/cli/src/lib/generators/agent-docs.ts` — add a `tui` `dirs` branch + description block
- `packages/registry/src/presets.ts` + `verification-matrix.ts` + `preset-config.ts` — add a `tui-app` preset with evidence-based status
- `apps/cli/src/lib/generated-project-verifier.ts` — add a `tui` combo case
- Tests under `apps/cli/tests` and/or `packages/registry`
- Publishing allowlist: ensure `apps/cli/package.json` `files` already ships `src/templates` (it does — confirm); the new dir is covered.

**Out of scope**:

- Adding OpenTUI to our own `apps/cli` runtime (explicitly NOT this — keep `@clack/prompts`)
- Any backend/web wiring in the `tui` template (it's a standalone terminal app)
- Running an interactive TUI in CI (cannot — verify structure/install/typecheck/build only)

## Git workflow

- Branch: `advisor/012-opentui-tui-template`
- Conventional commits, e.g. `feat(cli): add OpenTUI terminal-app template (tui family + tui-app preset)`.
- Do NOT push/PR unless instructed.

## Steps

### Step 0: Feasibility gate (do this BEFORE building the template)

In a throwaway temp dir, create a minimal package, `bun add @opentui/react @opentui/core react`, write the smoke entry (`createCliRenderer` + `createRoot().render(<text>hello</text>)`), and confirm:

1. `@opentui/core` provides a prebuilt binary for the CI verification platform (linux x64 at minimum — the platform `bun test` runs on). Record availability for mac/win/arm64 too.
2. `bun install` succeeds and `tsc --noEmit` (with the opentui jsx config) typechecks.
3. The smoke entry at least **imports and constructs** the renderer under the target runtime (full interactive run isn't required/possible in CI).

**Verify**: install + typecheck succeed and a binary exists for the verify platform. **STOP and report** if the native binary is unavailable for the platform our CI verifies on, or if install/typecheck cannot be made to pass — the template can't be verified and shouldn't ship blind.

### Step 1: Build the `tui` template

Create `apps/cli/src/templates/tui/` modeled on `templates/cli`, opinionated and runnable:

- `package.json` (placeholder `@acme/tui`, `type: module`): deps `@opentui/react`, `@opentui/core`, `react` (pin to the versions verified in Step 0); devDeps `@types/react`, `typescript`, `@types/node`. Scripts: `dev` (e.g. `bun run src/index.tsx` — bun runs TSX directly), `build`, `check-types`, `start`, `lint`/`lint:fix` (oxlint, local `.oxlintrc.json`). Choose the runtime that actually builds/runs cleanly in Step 0; prefer bun-first to match the repo.
- `tsconfig.json`: opentui JSX config (`jsx: react-jsx`, `jsxImportSource: @opentui/react`, `lib: [ESNext, DOM]`, `moduleResolution: bundler`, `strict`).
- `src/index.tsx`: the renderer bootstrap (`createCliRenderer` + `createRoot`).
- `src/app.tsx`: a small, genuinely useful starter — e.g. a keyboard-navigable list/detail view using `box`/`text`/`scrollbox` + `useKeyboard`, with a clean quit handler that restores the terminal. Opinionated but minimal; no filler.
- `AGENTS.md` (follow the `templates/cli/AGENTS.md` shape: Purpose / Read First / Owns), `.oxlintrc.json`, `.env.example` (if relevant), `public`/assets only if needed.
- `.archefiles.json`: allowlist every file you added (mirror the `cli` template's allowlist exactly — files NOT listed won't be copied/published).

**Verify**: scaffold `tui` to a temp dir; `bun install && bun run check-types && bun run build` succeed.

### Step 2: Register the family

- `schemas.ts`: add `'tui'` to `FamilySchema` and a `FAMILY_LABELS` entry (e.g. `tui: 'Terminal UI app (OpenTUI)'`). Fix any other exhaustive `Record<Family, …>` or `switch` the compiler now flags (let `bun run --cwd apps/cli check-types` guide you — do NOT silence with `default`/`as`).
- `agent-docs.ts`: add a `family === 'tui'` branch to the `dirs` list (`src` — entrypoint/render bootstrap; `src/app.tsx` — root component) and a `tui` description block in the family description map. Claim ONLY what the template ships.

**Verify**: `bun run --cwd apps/cli check-types` → exit 0; scaffold `tui`, open generated `AGENTS.md`, confirm listed dirs exist.

### Step 3: Register a truthful `tui-app` preset

Mirror Plan 010's registry pattern:

- `presets.ts`: add `'tui-app'` to `PresetId` + a `PRESETS` entry with `capabilities: ['tui']` (add a `tui` capability term if the vocabulary requires it) and `status` set from real evidence (Step 4) — `stable` only if install+typecheck+build pass in CI, else `experimental`/`beta`.
- `verification-matrix.ts`: add a `tui-app` row with only-true evidence; add a `presetHasStableEvidence` branch. If you add a `tui`-specific column, ensure it's true for ≥1 preset (don't create a dead column — see Plan 011).
- `preset-config.ts`: `projectDefaultsForPreset('tui-app')` → `{ family: 'tui', packageManager: 'bun', ... }`.
- `schemas.ts`: add `'tui-app'` to `PresetSchema` if top-level presets must be enumerated there (keep `PresetId`/`PresetSchema` consistent).

**Verify**: `bun run --cwd packages/registry check-types` and `--cwd apps/cli check-types` → exit 0.

### Step 4: Add e2e verification

Add a `tui` combo case to `FAMILY_COMBO_CASES`:

```ts
{ id: 'tui', family: 'tui', packageManager: 'bun', expectedFiles: ['src/index.tsx', 'src/app.tsx', 'package.json'] },
```

Ensure it runs `install`, `typecheck`, `build` (NOT an interactive run). If the combo suite is gated behind `SCAFFOLD_E2E=1` (Plan 004), verify with that flag set. If the native install is too heavy/flaky for the default combo, keep the case but document that its command-level verification runs only under `SCAFFOLD_E2E=1`.

**Verify**: `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts` (or the combo entrypoint) → `tui` case passes install/typecheck/build.

### Step 5: Surface it in docs/spec

Update `apps/cli/CLI-SPEC.md` (and any family table the web reads, if applicable) to list the `tui` family / `tui-app` preset with an accurate description. Keep wording honest about status.

## Test plan

- `apps/cli/tests`: a `tui` structure test (scaffold to temp, assert template files exist, assert `package.json` declares `@opentui/react`/`@opentui/core`/`react`, assert generated `AGENTS.md` lists only existing dirs).
- The e2e combo `tui` case (Step 4) is the install/build guarantee.
- `packages/registry`: assert `tui-app` is in `PRESETS`, its `capabilities` are backed by matrix evidence, and `presetHasStableEvidence('tui-app')` matches its `status` (reuse/extend the invariant test from Plan 011 if present).
- Verification: `bun run ci:min:affected` (or `ci:min`) → exit 0.

## Done criteria

ALL must hold:

- [ ] Feasibility gate passed (prebuilt binary for the verify platform; install + typecheck OK) — or plan stopped at Step 0 with a report
- [ ] `templates/tui` scaffolds an opinionated OpenTUI app that installs, typechecks, and builds
- [ ] `tui` added to `FamilySchema` + `FAMILY_LABELS` (+ any compiler-flagged exhaustive map)
- [ ] agent-docs has truthful `tui` dirs + description; generated `AGENTS.md` lists only existing dirs
- [ ] `tui-app` preset registered with evidence-based `status` and honest `capabilities` + matrix row + `presetHasStableEvidence` branch + `preset-config` mapping
- [ ] e2e `tui` combo case verifies files + install/typecheck/build
- [ ] CLI-SPEC (and family table if applicable) list `tui`/`tui-app` accurately
- [ ] `apps/cli` + `packages/registry` typecheck exit 0
- [ ] `bun test apps/cli/tests` + `bun test packages/registry` pass; `SCAFFOLD_E2E=1` `tui` green
- [ ] `bun run format:check` exits 0
- [ ] OUR `apps/cli` runtime still uses only `@clack/prompts`/`picocolors` (no `@opentui/*` added to `apps/cli/package.json` deps)
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- Step 0 fails (no prebuilt binary for the verify platform, or install/typecheck can't pass) — STOP and report; do not ship an unverifiable template.
- Adding `tui`/`tui-app` to the enums cascades into exhaustive checks you can't satisfy without touching unrelated families/presets — STOP and report the surface.
- You find yourself adding `@opentui/*` to `apps/cli/package.json` (our CLI) — STOP; that's explicitly out of scope. The native dep belongs only in the generated `tui` project.
- The generated TUI requires running an interactive terminal to verify correctness — that's expected; do NOT attempt to drive an interactive session in CI. Structure + install + typecheck + build is the bar.

## Maintenance notes

- Keep OpenTUI versions pinned to what CI verifies; bump deliberately (native core + reconciler move together).
- The native dependency lives ONLY in generated `tui` projects. Guard this in review: any `@opentui/*` entry appearing in `apps/cli/package.json` is a regression.
- If OpenTUI's renderer/JSX API changes (it's pre-1.0), the template entry/app and the tsconfig jsx settings are the things to update; the family/preset wiring is stable.
- Reviewer: confirm `.archefiles.json` lists every template file (an omitted file silently won't ship), and that generated docs claim nothing the template doesn't include.

```

```
