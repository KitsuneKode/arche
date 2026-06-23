# Plan 011: Make the registry and generated docs tell the truth (capabilities, matrix, next presets)

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. Several items here are "decide remove-vs-implement" — default to
> the truthful-now option (remove/soften the claim) unless told otherwise, since
> implementing the missing feature is a separate, larger effort. Update this
> plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- packages/registry/src apps/cli/src/lib/generators/agent-docs.ts apps/cli/src/types/schemas.ts apps/cli/CLI-SPEC.md`
> If any changed since `d199cac`, re-read the excerpts below; on mismatch, STOP.
>
> **Coordinates with**: Plan 010 (also edits `packages/registry/src`). If 010 is
> in flight, sequence edits to the same files to avoid conflicts.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (soft-coordinate with 010)
- **Category**: docs / correctness (truthfulness)
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

`PRODUCT.md` makes truthfulness a core promise: the tool must only claim what it can prove. Several claims are currently false, which is exactly the credibility hit that makes a senior engineer distrust a scaffolder:

1. **`deployment` capability is unverifiable.** Four presets declare a `deployment` capability, but the verification matrix sets `deployment: false` for **every** preset — nothing ever proves it.
2. **The `Test` column is dead.** `generatedTest` is a matrix column shown in the UI, but no preset sets it `true`; it's always empty/false.
3. **`convex-product` overclaims auth.** It declares the `auth` capability and `convexBackend: true`, but its own description says "Better Auth integration **stubs**." Capability says "has auth"; reality says "stub."
4. **The `next` family advertises presets it does not generate.** The schema itself warns "Next.js presets (auth, docs, analytics, storage) are not generated yet," yet the generated `AGENTS.md` for `next` prints "Auth: Better Auth", "Docs: Fumadocs", and a `lib/auth` entry point whenever those presets are selected — documenting files that are never created.

## Current state (verified at d199cac)

Capability vs matrix mismatch — declared `deployment`:

```24:31:packages/registry/src/presets.ts
    id: 'typescript-fullstack',
    label: 'TypeScript Fullstack',
    status: 'stable',
    description:
      'Next.js plus TypeScript API, contracts, auth, database, and deployment foundations.',
    capabilities: ['web', 'api', 'database', 'auth', 'deployment'],
```

…but `deployment` is never set true (the `NONE` base has `deployment: false` and no preset overrides it):

```21:37:packages/registry/src/verification-matrix.ts
const NONE: PresetVerificationEvidence = {
  structure: false,
  ...
  convexBackend: false,
  deployment: false,
}
```

Dead `Test` column (declared, never set true anywhere in `PRESET_VERIFICATION_MATRIX`):

```144:146:packages/registry/src/verification-matrix.ts
  { key: 'generatedTypecheck' as const, label: 'Typecheck' },
  { key: 'generatedTest' as const, label: 'Test' },
  { key: 'generatedBuild' as const, label: 'Build' },
```

`convex-product` auth claim vs "stubs":

```47:53:packages/registry/src/presets.ts
    id: 'convex-product',
    label: 'Convex + Next.js',
    status: 'stable',
    description:
      'Next.js app with Convex backend, schema, sample functions, and Better Auth integration stubs.',
    capabilities: ['web', 'convex', 'auth', 'deployment'],
```

The schema already KNOWS next presets aren't generated:

```423:427:apps/cli/src/types/schemas.ts
  if (config.presets && config.presets.length > 0 && config.family === 'next') {
    warnings.push(
      'Next.js presets (auth, docs, analytics, storage) are not generated yet — selection is recorded for future use.',
    )
  }
```

…but the generated docs claim them anyway:

```365:366:apps/cli/src/lib/generators/agent-docs.ts
- **Frontend**: Next.js (App Router)
${config.presets.includes('auth') ? '- **Auth**: Better Auth\n' : ''}${config.presets.includes('docs') ? '- **Docs**: Fumadocs\n' : ''}- **Runtime**: Bun
```

```372:372:apps/cli/src/lib/generators/agent-docs.ts
${config.presets.includes('auth') ? '- Auth config: `lib/auth`\n' : ''}
```

…and the directory list does too:

```32:32:apps/cli/src/lib/generators/agent-docs.ts
    if (config.presets.includes('auth')) dirs.push('`lib/auth` — Auth configuration')
```

## Commands you will need

| Purpose                                    | Command                                                         | Expected |
| ------------------------------------------ | --------------------------------------------------------------- | -------- |
| Registry typecheck                         | `bun run --cwd packages/registry check-types`                   | exit 0   |
| Registry tests                             | `bun test packages/registry` (or the repo's registry test path) | pass     |
| CLI typecheck                              | `bun run --cwd apps/cli check-types`                            | exit 0   |
| CLI tests                                  | `bun test apps/cli/tests`                                       | pass     |
| Web typecheck (matrix UI consumes columns) | `bun run --cwd apps/web check-types`                            | exit 0   |
| Format check                               | `bun run format:check`                                          | exit 0   |

## Scope

**In scope**:

- `packages/registry/src/presets.ts` (capabilities/descriptions)
- `packages/registry/src/verification-matrix.ts` (columns/evidence/`presetHasStableEvidence`)
- `apps/cli/src/lib/generators/agent-docs.ts` (next-family doc honesty)
- `apps/cli/CLI-SPEC.md` (wording: "stub template" → accurate status)
- Tests under `packages/registry` and/or `apps/cli/tests` (invariant guards)
- Any web component that renders the matrix columns IF a column is removed (`apps/web/components/arche/verification-matrix-table.tsx` / `capability-matrix-table.tsx`) — only to keep it compiling

**Out of scope**:

- Implementing real deployment verification, a real test gate, real next presets, or real Convex auth (those are future build plans). This plan makes claims match reality, not the other way around.

## Git workflow

- Branch: `advisor/011-registry-docs-truthfulness`
- Conventional commits, e.g. `fix(registry): align declared capabilities with verification evidence`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Reconcile the `deployment` capability (D1)

Default (truthful-now): **remove `'deployment'`** from every preset's `capabilities` in `presets.ts` and **remove the `Deploy` column** (`{ key: 'deployment', label: 'Deploy' }`) from `VERIFICATION_MATRIX_COLUMNS`, plus the `deployment` field from `PresetVerificationEvidence`/`NONE` if nothing else reads it. (Generated projects still GET deployment docs/config; the point is the _capability matrix_ must not claim verified deployment it never checks.)

- IF you find an actual deployment verification step feeding the matrix, instead set the evidence true for the presets it covers — but only with real evidence. Absent that, remove the claim.

**Verify**: `bun run --cwd packages/registry check-types` and `--cwd apps/web check-types` → exit 0 (fix the matrix table component if it referenced the removed column).

### Step 2: Resolve the dead `Test` column (D2)

Default (truthful-now): **remove** `generatedTest` from `VERIFICATION_MATRIX_COLUMNS` and from `PresetVerificationEvidence`/`NONE` (it is never set true; a perpetually-empty column misleads).

- IF a generated-test command actually runs in the combo verifier and could feed this, instead wire one preset's `generatedTest: true` from that evidence. Absent a real test gate, remove.

**Verify**: registry + web typecheck exit 0.

### Step 3: Soften `convex-product`'s auth claim (D3)

In `presets.ts`, change `convex-product` so it does not claim a verified `auth` capability while only shipping stubs. Either drop `'auth'` from `capabilities` and keep the honest "Better Auth integration stubs" wording, or rename the capability to an explicit stub marker if the capability vocabulary supports it. Keep `'convex'` (that IS verified via `convexBackend: true`). Do NOT touch the convex template's generated code.

**Verify**: registry typecheck + tests exit 0.

### Step 4: Make generated `next` docs honest (D4)

In `agent-docs.ts`, the `next` family must not document features it doesn't generate. Default (truthful-now): **remove** the `config.presets.includes('auth')`/`includes('docs')` branches that print "Auth: Better Auth", "Docs: Fumadocs", and the `lib/auth` entries (lines ~32, ~366, ~372). Replace the next architecture block with what's actually scaffolded (after Plan 010: App Router, env validation, error/loading boundaries, health route, design tokens — keep it accurate to whatever exists at execution time; if Plan 010 isn't merged yet, document only the bare baseline that exists).

- IF Plan 011 is executed AFTER the four presets are actually implemented (they aren't at `d199cac`), keep the claims and instead ensure the files exist. At `d199cac` they don't — so remove the claims.

**Verify**: scaffold `next` with `--presets auth,docs` (or the equivalent), open generated `AGENTS.md`, confirm it claims no `lib/auth`/Fumadocs/Better Auth and lists only existing dirs.

### Step 5: Fix CLI-SPEC wording

In `apps/cli/CLI-SPEC.md`, update language calling `next`/`backend` "stub templates" to reflect their real status after the changes (e.g. `next` = baseline standalone app; if Plan 010 landed, "first-class"). Keep it accurate to the merged state.

### Step 6: Add truthfulness invariant tests

Add a registry test (model after existing registry tests) asserting:

- Every capability in any preset's `capabilities` is "backed" — i.e. maps to a matrix evidence key that is `true` for that preset, OR is in a small documented allow-list of non-matrix capabilities (e.g. `web`). No capability may silently lack evidence.
- Every column in `VERIFICATION_MATRIX_COLUMNS` is `true` for at least one preset (no dead columns).
- For each preset, declared `status` is consistent with `presetHasStableEvidence`.

**Verify**: `bun test packages/registry` → pass (and the new test fails if someone re-adds an unbacked capability — prove by temporarily re-adding `deployment` and seeing it fail, then revert).

## Test plan

- New/extended registry test (Step 6) is the core guard.
- New `apps/cli/tests` assertion: generated `next` `AGENTS.md` contains no `lib/auth`, `Fumadocs`, or `Better Auth` strings when next presets are selected (locks D4).
- Verification: `bun run ci:min:affected` (or `ci:min`) → exit 0.

## Done criteria

ALL must hold:

- [ ] No preset declares `deployment` unless the matrix proves it (default: claim + column removed)
- [ ] No dead `Test` column (default: removed) — or it's true for ≥1 preset with real evidence
- [ ] `convex-product` no longer claims verified `auth` while shipping stubs
- [ ] Generated `next` docs claim no ungenerated features (no `lib/auth`/Fumadocs/Better Auth)
- [ ] CLI-SPEC wording matches real template status
- [ ] Invariant test rejects unbacked capabilities and dead columns
- [ ] `packages/registry`, `apps/cli`, `apps/web` typecheck exit 0
- [ ] `bun test packages/registry` and `bun test apps/cli/tests` pass
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- Removing the `deployment`/`generatedTest` column breaks a web component or test in a way that implies the column IS fed by real evidence somewhere — STOP and report; the claim might be real.
- The capability vocabulary is consumed by compatibility-validation logic (`customize` flow) such that removing `deployment` breaks validation — STOP and report the coupling before editing.
- Plan 010 has already implemented real next presets by the time you run this — then DON'T remove the doc claims; verify the files exist instead.

## Maintenance notes

- The invariant test is the durable win: it makes "claims must match evidence" a CI-enforced rule, so future capability additions can't drift back into marketing.
- When deployment/test/next-preset features are actually built, re-add the capability + matrix evidence together (the test forces this pairing).
- Reviewer: grep the diff for any capability string added without a matching matrix key.
