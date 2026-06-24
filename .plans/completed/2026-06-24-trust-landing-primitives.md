# Plan 022: Landing hero truthfulness + site-primitives consolidation

> **Shipped**: 2026-06-24 via [trust-wave orchestration](./2026-06-24-trust-wave-orchestration.md). Verified: `animated-terminal.test.ts`, `__design-lab` production guard, `ci:min` green.

> **Executor instructions**: Follow DESIGN.md and PRODUCT.md. Honor STOP conditions.
>
> **Drift check**: `git diff --stat 9958c37..HEAD -- apps/web/app/page.tsx apps/web/components/arche/animated-terminal.tsx apps/web/components/arche/site-primitives.tsx`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (pairs with Plan 020 messaging)
- **Category**: direction / docs
- **Planned at**: commit `9958c37`, 2026-06-24

## Why this matters

The landing page is the trust surface. `AnimatedTerminal` shows fictional interactive prompts (Rust workspace during `typescript-fullstack --yes`), a "Validating generated project" step that is not default CLI output, and version **v3.0.0** while CLI is **0.2.0**. `app/page.tsx` duplicates `GridBackdrop` inline instead of using `HeroBlock`/`GridBackdrop` from `site-primitives.tsx`, violating DESIGN.md component rules and scattering layout knowledge.

## Current state

Landing bypasses primitives:

```24:26:apps/web/app/page.tsx
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(...)]" />
```

`GridBackdrop` already exists at `site-primitives.tsx:38-44`.

Terminal fiction:

```14:21:apps/web/components/arche/animated-terminal.tsx
  { text: '? Package manager', type: 'prompt', delay: 600 },
  ...
  { text: '? Add Rust workspace foundations?', type: 'prompt', delay: 500 },
  { text: '⠋ Validating generated project...', type: 'loading', delay: 800 },
```

```116:116:apps/web/components/arche/animated-terminal.tsx
          <div className="opacity-50">v3.0.0</div>
```

CLI version: `apps/cli/package.json` → `"version": "0.2.0"`.

**Design intent** (DESIGN.md): show commands and evidence, not cosplay. Accent amber = guarded/needs validation. Square geometry, Oxanium + Fira Code.

## Interface design checkpoint

- **Intent**: Developer evaluating whether to trust Arche before first scaffold; must see honest CLI behavior and verification labels
- **Palette**: black/zinc surfaces, amber watch pill, emerald only for verified evidence
- **Depth**: borders-only, hard shadows per DESIGN.md
- **Signature**: square CTA blocks, terminal with real `--yes` output (no fake prompts)

## Scope

**In scope**:

- `apps/web/components/arche/animated-terminal.tsx` — truthful script
- `apps/web/app/page.tsx` — use `GridBackdrop`, consider `HeroBlock`
- `apps/web/components/arche/animated-terminal.test.tsx` (create) — version and step content
- `apps/web/app/public-copy.test.ts` — if new banned patterns needed
- Production guard for `apps/web/app/__design-lab/` layout (optional slice — `notFound()` when `NODE_ENV==='production'`)

**Out of scope**:

- FeatureGrid, ArchitectureGraph content overhaul
- OG shell refactor (noted as follow-up)

## Steps

### Step 1: Rewrite terminalSteps from real `--yes` flow

Capture actual output from:
`bun run dev:cli -- /tmp/arche-truth-demo --yes --preset=typescript-fullstack --dir=/tmp`

Use non-interactive steps only: command, scope rename, files written, done message. Remove Rust prompt and "Validating generated project" unless `--verify` flag is shown separately with label "optional verify flag".

Add `aria-label="Illustrative terminal output"` on container.

**Verify**: `bun test apps/web/components/arche/animated-terminal.test.ts` — no "v3.0.0", no "Add Rust workspace"

### Step 2: Version label

Read version from `@kitsunekode/arche` package.json at build time via import or env, or omit version chip. Never hard-code wrong semver.

**Verify**: terminal header matches `apps/cli/package.json` major.minor or is absent

### Step 3: Consolidate landing hero layout

Replace inline grid gradient with `<GridBackdrop />`. Optionally wrap hero copy in `<HeroBlock>` matching families page pattern.

**Verify**: `grep 'linear-gradient(to_right,#ffffff0a' apps/web/app/page.tsx` → no match (moved to primitive)

### Step 4: Add Stable preset count eyebrow (optional)

Small factual line: "N presets Stable per verification matrix" from registry import — not marketing fluff.

**Verify**: count matches `PRESETS.filter(p => p.status==='stable').length`

### Step 5: Design-lab production guard (optional)

In `apps/web/app/__design-lab/layout.tsx`, call `notFound()` when `process.env.NODE_ENV === 'production'`.

**Verify**: `grep notFound apps/web/app/__design-lab/layout.tsx` → match

## Test plan

- New `animated-terminal.test.ts` — step strings, version
- `public-copy.test.ts` still passes
- `bun test apps/web` full suite

## Done criteria

- [ ] Terminal shows non-interactive `--yes` flow only
- [ ] No false CLI version in hero
- [ ] Landing uses GridBackdrop primitive
- [ ] `bun run ci:min` passes
- [ ] Trust wave orchestrator run log → landing-primitives DONE

## STOP conditions

- Real CLI output format changed significantly — re-capture transcript, update steps

## Maintenance notes

When CLI UX changes for `--yes`, update terminalSteps in same PR. Consider extracting steps from a fixture file generated by a script.
