# Plan 008: Make `--dry-run` truthful by deriving it from the real pipeline (delete the parallel planner)

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/lib/scaffold.ts apps/cli/src/lib/plan-scaffold.ts apps/cli/src/lib/generated-project-verifier.ts`
> If any changed since `d199cac`, compare excerpts below to live code; on mismatch, STOP.
>
> **Sequencing**: Best done AFTER Plan 007 (atomic rollback), since this routes
> dry-run through the real `scaffoldProject`; rollback keeps a failed dry-run
> from leaving temp residue. If 007 isn't done yet, this still works (the
> `finally` here removes the temp dir), but note the dependency.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 007 (soft — recommended order)
- **Category**: bug (correctness) / architecture (remove shallow duplicate)
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

`--dry-run` is supposed to preview exactly what a real run writes. It does not. Dry-run returns a **hand-maintained, hard-coded file list** (`plan-scaffold.ts`) that has drifted badly from the real generator:

- **Phantom path**: dry-run claims realtime writes `packages/trpc/src/routers/realtime.ts`; the real generator writes `apps/server/src/modules/realtime/realtime.trpc.ts` and patches `apps/server/src/modules/trpc/app.router.ts` (`bundles.ts:146-147`).
- **Missing real outputs**: dry-run never lists `turbo.json`, the package-manager foundation files (`workspaceFiles` from `applyJavaScriptPackageManagerFoundation`), `.gitignore`, removed/pruned artifacts, or any rust/solana generated files — all of which the real run records (`scaffold.ts:837-848`, `:946-947`).
- **Wrong conditions**: dry-run gates the deployment guide on `deployment !== 'none'`, but the real run also emits it for the `convex` family and `convex-product` preset (`scaffold.ts:950-957`).
- **Polyglot gap**: dry-run only models `apps/server`/`apps/web` env files; the real run emits `apps/api/.env*` for polyglot (`scaffold.ts:857`).

This is the classic **shallow duplicate**: two adapters of the same "what will exist" interface, maintained by hand, guaranteed to drift. Apply the deletion test — delete `plan-scaffold.ts` and route dry-run through the one real code path, and correctness concentrates in a single place. The repo already proves this pattern works: `generated-project-verifier.ts` scaffolds for real into a temp dir and cleans up.

## Current state

Dry-run dispatch returns the parallel planner:

```754:760:apps/cli/src/lib/scaffold.ts
export async function scaffoldProject(
  options: ProjectConfig,
  dryRun = false,
): Promise<ScaffoldResult> {
  if (dryRun) {
    return planScaffold(options)
  }
```

The real generated-file list (none of which `planScaffold` mirrors faithfully):

```837:848:apps/cli/src/lib/scaffold.ts
  const generatedFiles: string[] = [
    'arche.json',
    ...bundleFiles,
    ...rustGeneratedFiles,
    ...solanaGeneratedFiles,
    ...sanitizedArtifacts.map((file) => `${file} (removed)`),
    ...removedArtifacts.map((file) => `${file} (removed)`),
    ...cleanupFiles.map((file) => `${file} (removed)`),
    ...prunedFiles.map((file) => `${file} (removed)`),
    ...workspaceFiles,
    ...turboFiles,
  ]
```

Proven temp-dir scaffold-and-clean pattern (the exemplar to copy):

```505:553:apps/cli/src/lib/generated-project-verifier.ts
export async function verifyGeneratedProject(
  options: VerifyGeneratedProjectOptions,
): Promise<GeneratedProjectVerificationResult> {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-generated-verify-'))
  const destinationDir = join(tmpRoot, `${options.preset}-${options.packageManager}`)
  ...
  try {
    const result = await createProject({
      config: configForCase(destinationDir, options),
      dryRun: false,
    })
    ...
  } finally {
    if (!options.keepOutput) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }
}
```

## Commands you will need

| Purpose                   | Command                                                                                                                                                                  | Expected                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| CLI typecheck             | `bun run --cwd apps/cli check-types`                                                                                                                                     | exit 0                                                |
| CLI lint                  | `bun run --cwd apps/cli lint`                                                                                                                                            | exit 0                                                |
| CLI tests                 | `bun test apps/cli/tests`                                                                                                                                                | all pass                                              |
| Dry-run smoke (fullstack) | `bun run --cwd apps/cli dev -- /tmp/arche-dr --yes --family fullstack --dry-run` (or the repo's documented dev invocation — check `apps/cli/package.json` scripts first) | prints a file list, writes nothing to `/tmp/arche-dr` |
| Format check              | `bun run format:check`                                                                                                                                                   | exit 0                                                |

## Scope

**In scope**:

- `apps/cli/src/lib/scaffold.ts` (replace the `if (dryRun)` branch with a faithful temp-scaffold)
- `apps/cli/src/lib/plan-scaffold.ts` (DELETE)
- `apps/cli/src/lib/create.ts` and any re-exports of `planScaffold` (the `export { planScaffold }` at `scaffold.ts:61`) — remove dead exports
- `apps/cli/tests/` (add a dry-run fidelity test)

**Out of scope**:

- The real generation logic (do not change what gets written — only how dry-run computes its preview).
- Install/git behavior.

## Git workflow

- Branch: `advisor/008-dry-run-fidelity`
- Conventional commits, e.g. `fix(cli): make --dry-run reflect the real scaffold output`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Route dry-run through the real pipeline into a temp dir

Replace the `if (dryRun) return planScaffold(options)` branch with a real scaffold into an isolated temp directory, then clean it up and return the result re-pointed at the user's intended destination. Pattern (adapt imports — `mkdtempSync`, `rmSync` from `node:fs`, `tmpdir` from `node:os`, `join` from `node:path` are already used by the verifier):

```ts
if (dryRun) {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-dry-run-'))
  const tmpDest = join(tmpRoot, basename(options.destinationDir) || 'app')
  try {
    const result = await scaffoldProject(
      { ...options, destinationDir: tmpDest, installDependencies: false, initializeGit: false },
      false, // real run, but in a throwaway dir
    )
    return {
      ...result,
      destinationDir: options.destinationDir, // report the user's intended path
      installResult: 'skipped',
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true })
  }
}
```

Notes for the executor:

- This recurses once with `dryRun=false`; that is intentional and terminates (the inner call does not re-enter the branch).
- Force `installDependencies:false` and `initializeGit:false` so dry-run is fast and side-effect-free regardless of the user's config.
- Keep `generatedFiles` exactly as the real run produced them (paths are relative to the destination, so they read correctly for the user's real path).

### Step 2: Delete the parallel planner and its exports

- Delete `apps/cli/src/lib/plan-scaffold.ts`.
- Remove `import { planScaffold } from './plan-scaffold'` (`scaffold.ts:53`) and the re-export `export { planScaffold } from './plan-scaffold'` (`scaffold.ts:61`).
- Search the CLI for any other `planScaffold` references and remove/redirect them (none expected outside `scaffold.ts`).

**Verify**: `bun run --cwd apps/cli check-types` → exit 0 (no dangling imports).

### Step 3: Confirm dry-run writes nothing to the user's destination

Run the dry-run smoke command against a path that does not exist; afterward that path must still not exist (only the temp dir was used, and it's removed).

**Verify**: dry-run prints a file list; the target path is absent; CLI exit 0.

### Step 4: Add a fidelity test

See Test plan.

**Verify**: `bun test apps/cli/tests` → all pass.

## Test plan

- New file `apps/cli/tests/dry-run-fidelity.test.ts` (model after an existing scaffold/verifier test — read one first):
  - For a representative matrix of configs (at minimum: `fullstack` default, `fullstack` with a `realtime` bundle, `polyglot`, and one standalone family like `next` or `backend`):
    1. Call `scaffoldProject(config, true)` → capture `dryFiles = result.generatedFiles`.
    2. Call `createProject({ config: { ...config, destinationDir: <temp> }, dryRun: false })` into a temp dir → read the **real** `result.generatedFiles` as `realFiles`; `rmSync` the temp dir.
    3. Assert `new Set(dryFiles)` deep-equals `new Set(realFiles)` (order-insensitive). Because dry-run now IS a real run, this should hold by construction — the test locks it against future regressions (e.g. someone reintroducing a hand-list).
  - Assert dry-run leaves no files at `config.destinationDir`.
- Verification: `bun test apps/cli/tests` → all pass; `bun run ci:min:affected` (or `ci:min`) → exit 0.

## Done criteria

ALL must hold:

- [ ] `scaffoldProject(options, true)` computes `generatedFiles` by running the real pipeline in a temp dir and removing it
- [ ] Dry-run reports `destinationDir` as the user's intended path and `installResult: 'skipped'`
- [ ] Dry-run writes nothing to the user's destination
- [ ] `plan-scaffold.ts` deleted; no remaining `planScaffold` references
- [ ] New fidelity test asserts dry-run file set equals real file set across ≥4 configs
- [ ] `bun run --cwd apps/cli check-types` exits 0
- [ ] `bun run --cwd apps/cli lint` exits 0
- [ ] `bun test apps/cli/tests` passes
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files (incl. deletion)
- [ ] `plans/README.md` row updated

## STOP conditions

- Excerpts don't match live code at `d199cac`.
- Running the real pipeline in dry-run has an unavoidable side effect outside the temp dir (e.g. a generator writes to an absolute path derived from something other than `destinationDir`) — STOP and report; that's a separate bug.
- The recursion in Step 1 does not terminate or causes a stack issue — STOP; the inner call MUST pass `dryRun=false`.

## Maintenance notes

- There is now ONE source of truth for "what gets written." Any new generator automatically shows up in dry-run with zero extra work — that is the whole point; do not reintroduce a hand-maintained list.
- The fidelity test is the guardrail: if someone re-adds a parallel planner, the set-equality test catches the first divergence.
- Perf: dry-run now does real disk I/O (no install) into a temp dir. This is acceptably fast and is the price of truthfulness; if it ever matters, optimize by sharing the verifier's temp harness, not by forking the file list again.
- Reviewer: confirm `installDependencies:false`/`initializeGit:false` are forced in the dry-run branch so a user's `--install`/git settings can't trigger side effects during a preview.
