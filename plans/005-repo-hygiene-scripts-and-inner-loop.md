# Plan 005: Remove dead/broken scripts, pin the package-manager guard, and add a real inner-loop + CI-parity command

> **Executor instructions**: Follow step by step, verifying each. Honor STOP
> conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- package.json packages/common/package.json docs/ci.md`
> If any in-scope file changed since `d199cac`, re-read it and compare to the
> excerpts below; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (do Step 5 parity after 004 if both are in flight, to avoid conflicting `package.json` edits)
- **Category**: tech-debt / dx
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The root script surface has dead and broken entries that mislead contributors: `repo:doctor:ci` is an exact alias of `repo:doctor:strict`; `docker:run` is missing its image argument and fails if invoked; `packages/common` ships `"test": "echo ... && exit 1"` which always fails. There is also no fast per-workspace inner-loop command (only multi-minute ladders), and local `bun run ci` does not match what GitHub actually runs, producing false-green confidence before push. Fixing these is low-risk and makes the repo feel trustworthy to a senior engineer.

## Current state

Dead/broken scripts in root `package.json`:

```32:34:package.json
    "repo:doctor": "bun toolings/scripts/repo-doctor.ts",
    "repo:doctor:strict": "bun toolings/scripts/repo-doctor.ts --strict",
    "repo:doctor:ci": "bun toolings/scripts/repo-doctor.ts --strict",
```

```62:63:package.json
    "docker:build": "docker build -f apps/server/Dockerfile .",
    "docker:run": "docker run --rm -p 8080:8080 -e ENABLE_REDIS=false",
```

```60:60:package.json
    "preinstall": "npx only-allow bun",
```

Failing placeholder test script:

```19:20:packages/common/package.json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
```

Local `ci` vs GitHub: the `ci` script omits the scaffold-verify steps GitHub runs (see `package.json:17` vs `.github/workflows/ci.yml:93-99`). `apps/web/AGENTS.md` documents a fast filtered loop but no root script wraps it.

NOT dead (do not touch): the `transit` task in `turbo.json:27-29` is the intentional Turborepo "transit node" used by `lint`/`check-types` `dependsOn` (`:37,43`) to force topological ordering. Leave it.

## Commands you will need

| Purpose          | Command                        | Expected                             |
| ---------------- | ------------------------------ | ------------------------------------ |
| Doctor strict    | `bun run repo:doctor:strict`   | exit 0                               |
| Inner loop (cli) | `bun run check:cli`            | exit 0, fast                         |
| Inner loop (web) | `bun run check:web`            | exit 0                               |
| CI parity        | `bun run ci:full`              | mirrors GitHub steps                 |
| Format check     | `bun run format:check`         | exit 0                               |
| Grep refs        | `git grep -n "repo:doctor:ci"` | shows remaining references to update |

## Scope

**In scope**:

- root `package.json` (scripts)
- `packages/common/package.json` (remove failing test stub)
- `docs/commands.md` and `docs/ci.md` (update references to any removed/renamed script — only the lines that name them)

**Out of scope**:

- `turbo.json` `transit` task (by-design).
- `postinstall`/`db:generate` behavior — deferred (see Maintenance notes; changing it risks breaking typecheck/build that depend on the Prisma client).
- The six `ci*` variants — keep them; this plan ADDS `ci:full` and inner-loop scripts rather than collapsing the existing set (collapsing is churn-heavy and breaks docs/hooks).

## Git workflow

- Branch: `advisor/005-repo-hygiene`
- Conventional commits, e.g. `chore: remove dead scripts and add inner-loop commands`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Remove the `repo:doctor:ci` alias

Delete the `repo:doctor:ci` line from `package.json`. Then `git grep -n "repo:doctor:ci"` and update each reference (e.g. `docs/commands.md`, `docs/ci.md`) to use `repo:doctor:strict`. Confirm no workflow references it (it isn't used in `.github/workflows/`).

**Verify**: `git grep -n "repo:doctor:ci"` → no matches.

### Step 2: Fix or remove `docker:run`

`docker:build` builds an untagged image, so `docker:run` cannot reference one cleanly. Either (A) add a tag to both: `docker:build` → `docker build -f apps/server/Dockerfile -t arche-server .` and `docker:run` → `docker run --rm -p 8080:8080 -e ENABLE_REDIS=false arche-server`; or (B) remove `docker:run`. Prefer (A).

**Verify**: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` (valid JSON) and `bun run docker:build --help` is not required to run docker — just confirm the script string references a tag that `docker:run` reuses.

### Step 3: Remove the failing `test` stub in packages/common

Delete the `"test": "echo ... && exit 1"` line from `packages/common/package.json` (the package has no tests; a failing stub is worse than none, and would break a future global `turbo run test`).

**Verify**: `bun run --cwd packages/common check-types` → exit 0; `node -e "JSON.parse(require('fs').readFileSync('packages/common/package.json','utf8'))"` → no error.

### Step 4: Pin the package-manager guard

`preinstall` uses `npx only-allow bun`, which fetches `only-allow` from npm on every fresh install (flaky offline). Add `only-allow` to root `devDependencies` and change the script to `bunx only-allow bun`. (Use the latest version via the package manager; do not invent a version string.)

**Verify**: `bun pm ls 2>/dev/null | grep only-allow` OR confirm `only-allow` appears in `package.json` devDependencies after `bun add -D only-allow`.

### Step 5: Add inner-loop and CI-parity scripts

Add to root `package.json` `scripts`:

- `"check:cli": "bun run format:check && bunx turbo run lint check-types --filter=@kitsunekode/arche && bun test apps/cli/tests"`
- `"check:web": "bun run format:check && bunx turbo run lint check-types --filter=@arche-template/web && bun test apps/web"`
- `"ci:full": "bun run ci && bun toolings/scripts/verify-generated-project.ts --combo-matrix --run=install,typecheck,lint,build"`

`ci:full` mirrors what GitHub runs (full ladder + the scaffold combo matrix) so a green `ci:full` means a green CI. (If Plan 004 has already landed, `ci:full` is the single source of CI parity; keep it consistent with the remaining combo step there.)

**Verify**: `bun run check:cli` → exit 0 (fast, CLI-only). `bun run check:web` → exit 0. Do NOT need to run `ci:full` fully here (it's long), but confirm it parses: `bun run ci:full --help` is not meaningful; instead `git grep -n "ci:full" package.json` shows it defined.

### Step 6: Point docs at the new inner loop

In `docs/commands.md` add a short "Inner loop" line referencing `check:cli` / `check:web`, and in `docs/ci.md` note that `bun run ci:full` mirrors GitHub CI. Keep additions minimal (≤ 6 lines total) and accurate.

**Verify**: `bun run format:check` → exit 0.

## Test plan

- This is a scripts/docs change; no product tests. Optionally extend `tests/src/toolings/` with a test asserting `package.json` has no `repo:doctor:ci` key and that `packages/common/package.json` has no failing `test` script — guards against regression.
- Verification: `bun test tests/src/toolings` → all pass.

## Done criteria

ALL must hold:

- [ ] `git grep -n "repo:doctor:ci"` → no matches
- [ ] `docker:build` and `docker:run` share a real image tag (or `docker:run` removed)
- [ ] `packages/common/package.json` has no failing `test` script
- [ ] `only-allow` is a declared devDependency and `preinstall` uses `bunx`
- [ ] `check:cli`, `check:web`, `ci:full` scripts exist and `check:cli`/`check:web` exit 0
- [ ] `bun run repo:doctor:strict` exits 0
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- The excerpts don't match `package.json` at `d199cac`.
- Removing `repo:doctor:ci` reveals a workflow reference (it shouldn't) — report it instead of editing workflows blindly.
- `bun add -D only-allow` cannot resolve (offline) — report; do not hand-pin a guessed version.

## Maintenance notes

- **Deferred (own investigation):** the root `postinstall` runs `db:generate` on every `bun install` (including CI and consumer clones). Skipping it in CI risks breaking `check-types`/`build` for store-dependent packages unless a turbo `dependsOn: ["db:generate"]` is added first. Treat as a separate plan; do not change here.
- The six `ci*` variants remain intentionally; if you later collapse them, sweep `docs/`, `.husky/`, and `AGENTS.md` together.
- Reviewer: confirm `ci:full` stays in sync with `.github/workflows/ci.yml` whenever the workflow changes (consider asserting parity in a test later).
