# Plan 007: Make scaffolding atomic — clean up the destination if the pipeline fails partway

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/lib/scaffold.ts`
> If `scaffold.ts` changed since `d199cac`, compare the excerpts below to the
> live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug (reliability)
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

`scaffoldProject` copies the entire template and then runs ~15 mutating steps (transforms, pruning, generated files) with **no rollback**. Any throw after the first copy — a transform error, a `JSON.parse` failure, a `symlink` failure on Windows, a full disk — leaves a half-written project tree. The next run then fails with "Destination directory is not empty," so the user must manually delete the wreckage. For a tool whose entire job is creating clean projects, a failed run must leave **no trace**, not a corrupted directory. This makes the generation phase atomic: on failure, the destination is restored to its pre-run state.

## Current state

`ensureDestinationAvailable` guarantees the destination is absent or empty before any write:

```183:202:apps/cli/src/lib/scaffold.ts
async function ensureDestinationAvailable(
  destinationDir: string,
  sourceDir: string,
): Promise<void> {
  if (isSubPath(sourceDir, destinationDir)) {
    throw new Error(
      `Destination directory must be outside the template source.\n` +
        `  Source: ${sourceDir}\n` +
        `  Destination: ${destinationDir}\n` +
        `Tip: Use a path one level above the monorepo, e.g. ~/projects/my-app`,
    )
  }

  if (!(await pathExists(destinationDir))) return

  const entries = await readdir(destinationDir)
  if (entries.length > 0) {
    throw new Error(`Destination directory is not empty: ${destinationDir}`)
  }
}
```

The unguarded mutating pipeline (no try/finally around it):

```766:773:apps/cli/src/lib/scaffold.ts
  const templateSource = resolveTemplateSource(family)
  await ensureDestinationAvailable(destinationDir, templateSource)
  await copyTemplate(destinationDir, templateSource)
  const sanitizedArtifacts = await sanitizeScaffoldArtifacts(destinationDir)
  const removedArtifacts = await removeGeneratedArtifacts(destinationDir)
  await updateRootPackageJson(destinationDir, packageName, options)
```

Install failure is already non-fatal (caught, recorded as `installResult: 'failed'`):

```967:979:apps/cli/src/lib/scaffold.ts
  if (options.installDependencies && !dryRun && family !== 'rust') {
    try {
      runCommand(pmInstallParts(pm), { cwd: destinationDir, silent: true })
      installResult = 'succeeded'
    } catch (error) {
      installResult = 'failed'
      installError = error instanceof Error ? error.message : String(error)
    } finally {
      await removeAutoInstallArtifacts(destinationDir)
    }
  }
```

So only the **generation** phase (copy → generated files, lines `767`–`962` before the git/install block) needs rollback. Because `ensureDestinationAvailable` proved the destination was empty/absent, full cleanup on failure is safe.

## Commands you will need

| Purpose       | Command                              | Expected |
| ------------- | ------------------------------------ | -------- |
| CLI typecheck | `bun run --cwd apps/cli check-types` | exit 0   |
| CLI lint      | `bun run --cwd apps/cli lint`        | exit 0   |
| CLI tests     | `bun test apps/cli/tests`            | all pass |
| Format check  | `bun run format:check`               | exit 0   |

## Scope

**In scope**:

- `apps/cli/src/lib/scaffold.ts` (wrap the generation phase; add a cleanup helper)
- `apps/cli/tests/` (add a rollback test — new file, e.g. `scaffold-rollback.test.ts`)

**Out of scope**:

- The install block (already handled).
- `planScaffold` / dry-run (Plan 008).
- Changing `ensureDestinationAvailable` semantics.

## Git workflow

- Branch: `advisor/007-atomic-scaffold-rollback`
- Conventional commits, e.g. `fix(cli): roll back destination on scaffold failure`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Record whether the destination pre-existed

In `scaffoldProject`, just before `copyTemplate`, capture `const destExistedBefore = await pathExists(destinationDir)`. (It can only be an empty dir or absent at this point, per `ensureDestinationAvailable`.)

### Step 2: Wrap the generation phase in try/catch with cleanup

Wrap everything from `await copyTemplate(...)` through the last generated-file write (the `.gitignore`/deployment block, before the `if (options.initializeGit)` block at `:963`) in a `try { ... } catch (error) { await rollbackDestination(destinationDir, destExistedBefore); throw error }`.

Add a helper:

```ts
async function rollbackDestination(destinationDir: string, existedBefore: boolean): Promise<void> {
  try {
    if (existedBefore) {
      // Was an empty dir we filled — remove our contents, keep the dir.
      for (const entry of await readdir(destinationDir)) {
        await rm(join(destinationDir, entry), { recursive: true, force: true })
      }
    } else {
      // We created it — remove it entirely.
      await rm(destinationDir, { recursive: true, force: true })
    }
  } catch {
    // Best-effort cleanup; surface the original error to the caller.
  }
}
```

Keep `git init` and `install` OUTSIDE the try/catch (they have their own handling; a failed install should not delete a successfully generated project — install failure is reported, not fatal).

### Step 3: Make the symlink write resilient (it's the most likely late throw)

`writeGeneratedClaudeSymlink` (`:685-688`) always calls `symlink('AGENTS.md', ...)`, which fails on Windows without privilege. Wrap it: try `symlink`; on failure, write a 1-line `CLAUDE.md` stub (`See AGENTS.md\n`) so the pipeline doesn't abort for a non-critical file. (This both prevents an unnecessary rollback and fixes a real Windows bug.)

**Verify**: `bun run --cwd apps/cli check-types` → exit 0.

### Step 4: Verify with a fault-injection test

See Test plan. Confirm that when a generation step throws, the destination ends up empty (if it pre-existed) or absent (if created).

**Verify**: `bun test apps/cli/tests` → all pass including the new rollback test.

## Test plan

- New file `apps/cli/tests/scaffold-rollback.test.ts` (model structure after an existing scaffold test such as `apps/cli/tests/e2e-scaffold.test.ts` or whichever unit test calls `scaffoldProject` — read one first):
  - **Created-dir case**: call `scaffoldProject` with a destination path that does NOT exist, but force a mid-pipeline failure. The simplest deterministic trigger: pass a config that makes a generator throw, OR temporarily point the destination at a path whose parent is writable but inject failure by stubbing. If injection is hard, assert the weaker but real guarantee: after a failed run (e.g. invalid template/family via a monkey-patched `resolveTemplateSource`), the destination directory does not exist afterward.
  - **Pre-existing-empty case**: create an empty temp dir, induce a failure, assert the dir still exists and is empty afterward.
  - **Happy path unchanged**: a normal `scaffoldProject` into a temp dir still returns `generatedFiles` and leaves the project in place.
- If clean fault-injection isn't feasible without broad refactoring, at minimum add a unit test for `rollbackDestination` directly (export it): seed a temp dir with files, call with `existedBefore=true` → dir empty; with `existedBefore=false` → dir gone.
- Verification: `bun test apps/cli/tests` → all pass.

## Done criteria

ALL must hold:

- [ ] The generation phase of `scaffoldProject` is wrapped so any throw triggers `rollbackDestination` then rethrows
- [ ] A created destination is removed entirely on failure; a pre-existing empty destination is left empty
- [ ] `git init` and `install` remain outside the rollback (install failure does not delete the project)
- [ ] `writeGeneratedClaudeSymlink` falls back to a stub file when symlink fails
- [ ] `bun run --cwd apps/cli check-types` exits 0
- [ ] `bun run --cwd apps/cli lint` exits 0
- [ ] `bun test apps/cli/tests` passes with new rollback test
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- The excerpts don't match `scaffold.ts` at `d199cac`.
- You cannot construct any failing-pipeline test even at the `rollbackDestination`-unit level — report rather than shipping rollback with zero coverage.
- Implementing rollback would require changing `ensureDestinationAvailable`'s contract (it must keep guaranteeing empty/absent) — STOP.

## Maintenance notes

- If a future change adds writes OUTSIDE the wrapped region, extend the try/catch to cover them, or they won't be rolled back.
- The cleanup is intentionally best-effort (swallows its own errors) so the user always sees the _original_ failure cause, not a cleanup error.
- Reviewer: confirm install-failure still leaves a usable project (rollback must not fire on install failure).
