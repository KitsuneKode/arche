# Plan 020: Post-graduation content truthfulness sweep (docs, blog, README, maintainer matrix)

> **Shipped**: 2026-06-24 via [trust-wave orchestration](./2026-06-24-trust-wave-orchestration.md). Verified: `content-truthfulness.test.ts`, `truthfulness.test.ts`, `public-copy.test.ts`, `ci` green.

> **Executor instructions**: Follow step by step. Run every verification command.
> Honor STOP conditions. Update status in `.plans/active/2026-06-24-trust-wave-orchestration.md` run log when done.
>
> **Drift check (run first)**: `git diff --stat 9958c37..HEAD -- README.md docs/ apps/web/content/ .docs/product/ packages/registry/src/display.ts`
> On mismatch with excerpts below, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `9958c37`, 2026-06-24

## Why this matters

Plans 001–019 and registry graduation promoted eleven presets to **Stable** with `presetHasStableEvidence` tests. Human-facing prose did not follow: README badges still say "requires validation", walkthroughs hard-code outdated labels, philosophy.mdx omits Stable, three new presets are missing from public tables, and `display.ts` still says "production app foundation" — violating `PRODUCT.md` and `DESIGN.md` content rules.

## Current state

README contradiction:

```11:12:README.md
  <img src="https://img.shields.io/badge/release-guarded-orange" alt="Release guarded" />
  <img src="https://img.shields.io/badge/presets-requires%20validation-yellow" alt="Preset status" />
```

```85:94:README.md
| `typescript-fullstack` | Stable              | ...
```

Philosophy omits Stable label:

```11:11:apps/web/content/docs/philosophy.mdx
- **Honest labels** — presets say **Requires validation** or **Experimental** until the verification matrix proves more.
```

Registry display violates product rules:

```20:22:packages/registry/src/display.ts
  'typescript-fullstack': {
    shape: 'Next.js web + Express API + tRPC + Better Auth + Prisma',
    goodFor: 'Default production app foundation',
```

Walkthrough still says Requires validation (example):

```8:8:apps/web/content/docs/guides/walkthrough-typescript-fullstack.mdx
**Support label:** Requires validation
```

Web brief forbids Stable claims the site now makes:

```38:40:.docs/product/web-brand-ui-brief.md
Claims the site must not make yet:
- No preset is `Stable` or `Production Ready` until the verification matrix
```

Human matrix missing `next-app`, `tui-app`, `tanstack-start` — check `.docs/product/verification-matrix.md` against `packages/registry/src/presets.ts`.

Getting started leads with npm while release is guarded:

```6:6:apps/web/content/docs/getting-started.mdx
Use the published npm package (`@kitsunekode/arche`) for new projects
```

**Convention**: Status labels come from `formatSupportStatus` / registry — never hand-type "Stable" in MDX without a registry pointer. Match voice in `PRODUCT.md` and `DESIGN.md` (no "production ready" adjectives).

## Commands you will need

| Purpose           | Command                                     | Expected |
| ----------------- | ------------------------------------------- | -------- |
| Registry tests    | `bun test packages/registry`                | all pass |
| Web tests         | `bun test apps/web`                         | all pass |
| Public copy guard | `bun test apps/web/app/public-copy.test.ts` | all pass |
| Format            | `bun run format:check`                      | exit 0   |
| Min CI            | `bun run ci:min`                            | exit 0   |

## Scope

**In scope**:

- `README.md` — badges, honest-status paragraph, preset table (add `next-app`, `tui-app`, `tanstack-start`)
- `docs/bootstrap-cli.md` — preset table sync
- `.docs/product/verification-matrix.md` — regenerate from code registry
- `.docs/product/web-brand-ui-brief.md` — update "must not make yet" section
- `packages/registry/src/display.ts` — reword `goodFor` strings (audit all presets)
- `apps/web/content/docs/philosophy.mdx`
- `apps/web/content/docs/getting-started.mdx`
- `apps/web/content/docs/guides/walkthrough-*.mdx` (typescript-fullstack, rust, solana, convex-product)
- `apps/web/content/blog/changelog-0-2-1.mdx`, `choosing-a-preset.mdx`
- `apps/web/content/docs/presets.mdx` — scaffold examples if missing presets
- Optional: add `apps/web/tests/content-truthfulness.test.ts` — grep guard for "Requires validation" in walkthroughs without registry component

**Out of scope**:

- `/families` matrix UI (Plan 021)
- Landing terminal animation (Plan 022)
- Registry code changes to evidence keys
- `apps/cli/CLI-SPEC.md` unless preset table is duplicated there

## Steps

### Step 1: Sync README and bootstrap-cli preset tables

Add rows for `next-app`, `tui-app`, `tanstack-start` from `packages/registry/src/presets.ts`. Replace yellow "presets-requires validation" badge with accurate text, e.g. `8+ stable presets` or split badge: `release-guarded` + `matrix-driven status`. Rewrite line 30 honest-status to: presets with Stable label have passed `presetHasStableEvidence`; release/npm remains guarded.

**Verify**: `grep -c 'next-app' README.md docs/bootstrap-cli.md` → 1 each minimum

### Step 2: Regenerate human verification matrix

Update `.docs/product/verification-matrix.md` from `PRESET_VERIFICATION_MATRIX` and `PRESETS`. Include all eleven Stable presets. Clarify Stable means route-specific required keys per `presetHasStableEvidence`, not every column green. Remove or annotate dead Test/Deploy columns if not in code evidence.

**Verify**: `grep 'next-app' .docs/product/verification-matrix.md` → match

### Step 3: Fix registry display copy

Replace "production" adjectives in `DISPLAY_BY_ID.goodFor`. Use phrases like "default fullstack starting point", "typed web + API split", etc.

**Verify**: `grep -i production packages/registry/src/display.ts` → no matches

### Step 4: Refresh MDX walkthroughs and philosophy

Remove hard-coded "**Requires validation**" support labels. Replace with: "Status: see [Preset catalog](/docs/presets) or registry table below." For walkthroughs, add note that preset is Stable when registry says so. Update philosophy line 11 to describe three labels: Stable, Requires validation, Experimental.

Gate pnpm tabs in walkthroughs: only show pnpm when `PRESET_VERIFICATION_MATRIX[preset].pnpm === true` (may require small MDX component change in `package-manager-tabs.tsx` or manual removal from convex/rust walkthroughs).

**Verify**: `grep -r 'Requires validation' apps/web/content/docs/guides/walkthrough` → no hard-coded support labels (matrix explanation prose OK)

### Step 5: Update getting-started command order

Lead with `bun run dev:cli` from source; npm/npx as secondary with "when published (release guarded)" callout. Match README framing.

**Verify**: first command in WorkflowSteps is dev:cli or source path

### Step 6: Refresh web-brand-ui-brief and blog posts

Update brief section 38–41 to allow Stable when matrix proves it; list non-Stable presets (`customize`, `experiments`). Add historical disclaimer to changelog-0-2-1.mdx; fix capability list for convex-product. Extend choosing-a-preset cheat sheet with new presets.

**Verify**: `bun test apps/web/app/public-copy.test.ts` → pass

### Step 7: Optional content guard test

Add test that fails if walkthrough MDX contains `**Support label:** Requires validation` pattern.

**Verify**: `bun test apps/web` → pass

## Test plan

- Existing `packages/registry/tests/truthfulness.test.ts` must still pass
- `apps/web/app/public-copy.test.ts` — banned phrases
- New optional content-truthfulness test

## Done criteria

- [ ] README badge/table/prose tell one consistent Stable story
- [ ] Human verification matrix lists all public Stable presets
- [ ] No "production" in `display.ts` goodFor strings
- [ ] Walkthroughs do not hard-code outdated support labels
- [ ] web-brand-ui-brief allows graduated Stable claims
- [ ] `bun run ci:min` exits 0
- [ ] Trust wave orchestrator run log → content-truthfulness DONE

## STOP conditions

- `presetHasStableEvidence` logic changed since plan written — re-read `verification-matrix.ts` before editing Stable prose
- Registry demoted presets from Stable — match code, not this plan's assumptions
- pnpm gating requires MDX architecture change beyond scope — report back

## Maintenance notes

When adding a preset: update README, bootstrap-cli, human matrix, and any blog cheat sheets in the same PR as registry registration. Prefer registry-driven MDX components over static labels.
