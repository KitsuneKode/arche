# Plan 004: Stop verifying the scaffold matrix three times per CI run; slim pkg:check

> **Executor instructions**: Follow step by step, verifying each step. Honor
> STOP conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- .github/workflows/ci.yml apps/cli/tests/e2e-scaffold.test.ts package.json apps/cli/package.json`
> If any in-scope file changed since `d199cac`, re-read it and compare to the
> excerpts below; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf / dx (CI)
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The CI job verifies the generated-project matrix **three times** in one run: `bun test` executes the `e2e-scaffold` combo suite (~17 full install/typecheck/lint/build scaffolds), then `verify:generated:fullstack` scaffolds fullstack again, then the `--combo-matrix` step runs the same ~17 combos a second time. Under `CI=true` the e2e suite runs serially with a 10-minute-per-case cap inside a 30-minute job — the dominant cause of slow and timeout-flaky CI. Separately, `pkg:check` re-runs lint, typecheck, and the CLI test suite that the turbo `lint`/`check-types` and root `bun test` steps already ran. This plan makes the heavy scaffold matrix run **once**, keeps `bun test` fast, and removes the redundant work — directly serving "no CI failures" and a pipeline a senior engineer respects.

## Current state

CI job steps (the triple verification):

```82:99:.github/workflows/ci.yml
      - name: Tests
        run: bun test

      - name: Build
        env:
          TURBO_SCM_BASE: ${{ steps.turbo-base.outputs.base }}
        run: bunx turbo run build ${{ steps.turbo-mode.outputs.affected }}

      - name: CLI package check
        run: bun run pkg:check

      - name: Verify scaffolded fullstack installs and builds
        run: bun run verify:generated:fullstack

      - name: Verify fullstack combo matrix
        env:
          SCAFFOLD_E2E_SERIAL: '1'
        run: bun toolings/scripts/verify-generated-project.ts --combo-matrix --run=install,typecheck,lint,build
        timeout-minutes: 25
```

The `bun test` step runs this combo suite (heavy) because it is a normal Bun test file:

```21:26:apps/cli/tests/e2e-scaffold.test.ts
const comboCases = buildGeneratedComboCases()
const runComboSerial = process.env.SCAFFOLD_E2E_SERIAL === '1' || process.env.CI === 'true'
const comboDescribe = runComboSerial ? describe.serial : describe

comboDescribe('e2e scaffold combo matrix', () => {
  for (const combo of comboCases) {
```

`pkg:check` re-runs work already done by turbo/test steps:

```26:26:package.json
    "pkg:check": "bun run --cwd apps/cli check-types && bun run --cwd apps/cli lint && bun test apps/cli/tests && bun run --cwd apps/cli pack:dry-run",
```

`verify:generated:fullstack` is a subset of the combo matrix's `fullstack-default` case:

```36:36:package.json
    "verify:generated:fullstack": "bun toolings/scripts/verify-generated-project.ts --preset=typescript-fullstack --pm=bun --run=install,typecheck,build",
```

`pack:dry-run` (the unique part of pkg:check — it validates the published `files` set):

```60:60:apps/cli/package.json
    "pack:dry-run": "bun run build && npm pack --dry-run",
```

The weekly workflow already runs the structure-only matrix independently (`.github/workflows/verify-generated-weekly.yml:33-34`), so deep coverage is not lost by trimming PR-time runs.

## Commands you will need

| Purpose                  | Command                                                                                              | Expected                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Fast tests (post-change) | `bun test`                                                                                           | passes WITHOUT running the 17 heavy combos |
| Heavy combo (explicit)   | `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts`                                        | runs the combos                            |
| Combo via script         | `bun toolings/scripts/verify-generated-project.ts --combo-matrix --run=install,typecheck,lint,build` | scaffolds + verifies                       |
| pkg:check                | `bun run pkg:check`                                                                                  | exit 0                                     |
| Format check             | `bun run format:check`                                                                               | exit 0                                     |

## Scope

**In scope**:

- `apps/cli/tests/e2e-scaffold.test.ts` (gate the heavy combo behind an env flag)
- `.github/workflows/ci.yml` (remove the redundant fullstack step; keep ONE combo step; ensure the combo step still runs the suite)
- `package.json` (slim `pkg:check`)

**Out of scope**:

- `.github/workflows/verify-generated-weekly.yml` — leave it (independent deep coverage).
- `toolings/scripts/verify-generated-project.ts` — do not change the verifier logic.
- `toolings/scripts/release-guard.ts` — it calls `pkg:check`; after slimming, that call becomes cheap automatically. Do not edit it here.
- The turbo `--affected` logic.

## Git workflow

- Branch: `advisor/004-ci-scaffold-verify-dedup`
- Conventional commits, e.g. `ci: run scaffold matrix once and slim pkg:check`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Gate the heavy combo suite behind an explicit env flag

In `apps/cli/tests/e2e-scaffold.test.ts`, make the combo `describe` run only when explicitly requested, so plain `bun test` (locally and in the CI `Tests` step) no longer pays for 17 scaffolds. Use Bun's `describe.skipIf`:

```ts
const runHeavyCombos = process.env.SCAFFOLD_E2E === '1'
const comboDescribe = runHeavyCombos
  ? process.env.SCAFFOLD_E2E_SERIAL === '1'
    ? describe.serial
    : describe
  : describe.skip
```

Keep the existing serial logic for when it IS enabled. Do not delete the suite.

**Verify**: `bun test apps/cli/tests/e2e-scaffold.test.ts` → reports the combo tests as skipped (fast). `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts` → runs them.

### Step 2: Make the CI combo step the single owner

In `.github/workflows/ci.yml`:

- **Delete** the `Verify scaffolded fullstack installs and builds` step (`:93-94`) — it is a subset of the combo matrix `fullstack-default`.
- Keep the `Verify fullstack combo matrix` step (`:96-100`). It calls the verifier script directly, so it does not depend on the test-env gate; leave its command as-is. (Optionally add `SCAFFOLD_E2E: '1'` to its env for consistency — harmless, since it doesn't go through `bun test`.)
- The `Tests` step (`:82-83`) stays but is now fast (combos skipped by Step 1).

**Verify (locally, since CI can't run here)**: `grep -c "verify:generated:fullstack" .github/workflows/ci.yml` → 0. `grep -c "combo-matrix" .github/workflows/ci.yml` → 1.

### Step 3: Slim pkg:check to its unique work

In root `package.json`, change `pkg:check` to drop the lint/typecheck/test that turbo `lint check-types` and the root `bun test` step already cover, keeping the packaging validation:

```
"pkg:check": "bun run --cwd apps/cli pack:dry-run",
```

Rationale: `pack:dry-run` is the only check unique to `pkg:check` (it builds and validates the published `files` set). Lint/types run via `bunx turbo run lint check-types`; CLI unit tests run via the root `bun test` step.

**Verify**: `bun run pkg:check` → exit 0 and prints an `npm notice` package contents listing. `git grep -n "pkg:check" -- .github package.json` to confirm remaining callers (CI `CLI package check` step, `release-guard.ts`) still make sense with the slim version.

### Step 4: Confirm the full local ladder still passes

**Verify**: `bun run ci:min` → exit 0 (fast now). Then run the heavy matrix once explicitly to ensure nothing regressed: `bun toolings/scripts/verify-generated-project.ts --combo-matrix --run=install,typecheck,lint,build` → all combos succeed (this may take several minutes; if a tool like cargo/anchor is missing, the verifier's `skipMissingTools` handles it — confirm it still reports success/skips, not failure).

## Test plan

- No new product tests required; this is a CI/test-gating change. The existing combo suite still exists and runs under `SCAFFOLD_E2E=1`.
- Add a one-line assertion to an existing CLI test (or a tiny new `apps/cli/tests/ci-config.test.ts`) that reads `.github/workflows/ci.yml` and asserts it contains exactly one `--combo-matrix` and zero `verify:generated:fullstack` references — this guards the dedup from silently regressing. (Optional but recommended.)
- Verification: `bun test apps/cli/tests` → all pass and finishes quickly (no 17-scaffold blowup).

## Done criteria

ALL must hold:

- [ ] Plain `bun test` does NOT execute the 17 combo scaffolds (they're skipped without `SCAFFOLD_E2E=1`)
- [ ] `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts` still runs them and passes
- [ ] `.github/workflows/ci.yml` has 0 occurrences of `verify:generated:fullstack` and exactly 1 `--combo-matrix` step
- [ ] `pkg:check` is `bun run --cwd apps/cli pack:dry-run` and exits 0
- [ ] `bun run ci:min` exits 0
- [ ] The combo matrix passes once when run explicitly
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- The CI excerpts don't match `ci.yml` at `d199cac`.
- Removing `verify:generated:fullstack` would drop coverage the combo matrix does NOT include (verify `fullstack-default` exists in `buildGeneratedComboCases()` first — it does at `d199cac`).
- The combo matrix fails for a reason unrelated to this change (a pre-existing scaffold bug) — report it; that is Plan 008/B-class territory, not this plan.

## Maintenance notes

- The heavy combo now runs in CI only via the dedicated `--combo-matrix` step and weekly. If you later remove that step, re-enable a gated run elsewhere or coverage drops to weekly-only.
- `release-guard.ts` calls `pkg:check`; it now does only `pack:dry-run`, which is the correct pre-publish gate. If release needs an independent full verification, add it explicitly in `release.yml`, not by re-fattening `pkg:check`.
- Reviewer: confirm the combo matrix `--run` set still includes `build` (the production gate) and that `skipMissingTools` behavior is unchanged.
