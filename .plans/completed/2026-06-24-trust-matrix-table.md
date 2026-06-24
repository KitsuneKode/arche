# Plan 021: Unify verification matrix table presentation (/families vs /docs)

> **Shipped**: 2026-06-24 via [trust-wave orchestration](./2026-06-24-trust-wave-orchestration.md). Verified: `registry-evidence-table.test.ts`, `ci:min` green.

> **Executor instructions**: Follow step by step. Honor STOP conditions.
>
> **Drift check**: `git diff --stat 9958c37..HEAD -- apps/web/components/arche/verification-matrix-table.tsx apps/web/components/docs/verification-matrix-table.tsx packages/registry/src/verification-matrix.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (coordinate copy with Plan 020)
- **Category**: tech-debt / docs
- **Planned at**: commit `9958c37`, 2026-06-24

## Why this matters

`/families` uses `apps/web/components/arche/verification-matrix-table.tsx` which shows every column and renders false as **no**. `/docs` uses `apps/web/components/docs/verification-matrix-table.tsx` which filters empty columns and renders false as **—**. Stable presets like `rust-api` legitimately lack `generatedInstall`/`generatedLint` keys but pass `presetHasStableEvidence` — so /families makes Stable presets look broken, contradicting the page copy at `apps/web/app/families/page.tsx:30`.

## Current state

Arche table (shows `no`):

```10:18:apps/web/components/arche/verification-matrix-table.tsx
function cellMark(value: boolean) {
  return value ? (
    <span className="text-emerald-400" aria-label="verified">yes</span>
  ) : (
    <span className="text-zinc-600" aria-label="not verified">no</span>
  )
}
```

Docs table (filters columns, shows `—`):

```21:27:apps/web/components/docs/verification-matrix-table.tsx
  const columns = VERIFICATION_MATRIX_COLUMNS.filter((col) =>
    PRESETS.some((preset) => {
      const evidence = PRESET_VERIFICATION_MATRIX[preset.id]
      return evidence[key]
    }),
  )
```

Caption overstates "every column green":

```33:34:apps/web/components/docs/verification-matrix-table.tsx
        <strong className="text-white">Stable</strong> only when every required column is green for
        that route.
```

## Commands

| Purpose   | Command                                                   | Expected |
| --------- | --------------------------------------------------------- | -------- |
| Web tests | `bun test apps/web`                                       | pass     |
| Typecheck | `bunx turbo run check-types --filter=@arche-template/web` | pass     |

## Scope

**In scope**:

- New shared: `apps/web/components/arche/registry-evidence-table.tsx` (or `lib/registry-evidence-table.tsx`)
- Refactor `apps/web/components/arche/verification-matrix-table.tsx` — thin wrapper
- Refactor `apps/web/components/docs/verification-matrix-table.tsx` — thin wrapper with prose caption
- Update caption to cite route-specific `presetHasStableEvidence` (link to verification-and-presets.mdx)
- Tests in `apps/web/components/arche/verification-matrix-table.test.tsx` or extend existing

**Out of scope**:

- Changing `PRESET_VERIFICATION_MATRIX` evidence values
- Plan 020 MDX prose (except caption text in docs wrapper)

## Steps

### Step 1: Create shared RegistryEvidenceTable

Props:

- `presetFilter?: (id) => boolean` — arche excludes customize/experiments
- `columnPolicy: 'all' | 'nonempty'` — arche uses nonempty like docs
- `absentGlyph: 'dash' | 'no'` — prefer **dash** everywhere for non-applicable
- `variant: 'marketing' | 'docs'` — styling only

Export helper `columnsForPresets(presets)` from shared module.

**Verify**: `bunx turbo run check-types --filter=@arche-template/web` → exit 0

### Step 2: Wire both call sites

`/families` → use `columnPolicy='nonempty'`, `absentGlyph='dash'`. Docs MDX map unchanged export name.

**Verify**: visual/manual — rust-api row should not show red "no" flood for N/A columns

### Step 3: Fix caption

Docs caption: "Stable when `presetHasStableEvidence` passes for that preset's route (not every column applies to every stack)."

**Verify**: `grep 'every required column is green' apps/web` → no matches

### Step 4: Add regression test

Test that for `rust-api`, table does not render `no` for columns where no preset has true (filtered out).

**Verify**: `bun test apps/web` → pass

## Done criteria

- [ ] Single implementation for matrix rendering
- [ ] /families and /docs use consistent column filtering and absent glyph
- [ ] Caption matches `presetHasStableEvidence` semantics
- [ ] `bun test apps/web` passes
- [ ] Trust wave orchestrator run log → matrix-table DONE

## STOP conditions

- Registry exports change column keys — adapt shared module, do not fork logic again

## Maintenance notes

Any new `VERIFICATION_MATRIX_COLUMNS` entry automatically flows through shared table. Review /families and /docs after registry changes.
