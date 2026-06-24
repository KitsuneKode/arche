# CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

Runs on `push` to `main`, `prod`, and `develop`, and on pull requests. Three jobs run **in parallel** after install (shared cache key):

| Job                   | Steps                                                      | Purpose                  |
| --------------------- | ---------------------------------------------------------- | ------------------------ |
| **Verify (fast)**     | format → lint/types → test → build → pkg:check             | Monorepo quality gate    |
| **Verify (scaffold)** | `--combo-matrix` (install/typecheck/lint/build per preset) | Generated project parity |
| **Verify (extras)**   | pnpm next-app build + `repo:doctor:strict`                 | PM coverage + doc drift  |

Legacy single-job ladder (for local scripts):

| Step         | Command                                                               | Purpose                        |
| ------------ | --------------------------------------------------------------------- | ------------------------------ |
| Format       | `bun run format:check`                                                | Oxfmt repo formatting          |
| Lint + types | `bunx turbo run lint check-types` (+ `--affected` on PRs / `develop`) | Turbo lint and TypeScript      |
| Tests        | `bun test`                                                            | CLI, tooling, and unit tests   |
| Build        | `bunx turbo run build` (+ `--affected` on PRs / `develop`)            | Build packages                 |
| Package      | `bun run pkg:check`                                                   | CLI pack dry-run               |
| Repo doctor  | `bun run repo:doctor:strict`                                          | Doc/path drift (warnings fail) |

Turbo uses `TURBO_SCM_BASE` (PR base SHA, previous push SHA, or `git rev-parse HEAD^1`) for `--affected`. On **push to `main` or `prod`**, lint/types/build run on the **full workspace** (no `--affected`).

Release ([`.github/workflows/release.yml`](../.github/workflows/release.yml)) runs only after CI succeeds on a **`push` to `main`** (`head_branch == main`, `event == push`). No manual dispatch. Changesets commits set `HUSKY=0` and skip staged gitleaks in CI (full-repo gitleaks already ran on the push).

Weekly generated verification: [`.github/workflows/verify-generated-weekly.yml`](../.github/workflows/verify-generated-weekly.yml).

## Secret scanning

Three layers (defense in depth):

| Layer      | When                                 | What                                                                  |
| ---------- | ------------------------------------ | --------------------------------------------------------------------- |
| Pre-commit | Every commit (local)                 | Staged files via Husky → `toolings/scripts/gitleaks-staged.sh`        |
| CI         | Push/PR to `main`, `prod`, `develop` | [`.github/workflows/gitleaks.yml`](../.github/workflows/gitleaks.yml) |
| Weekly     | Mondays 06:00 UTC                    | Same workflow (`schedule`) — full history; not cancelled by pushes    |

Install the [gitleaks CLI](https://github.com/gitleaks/gitleaks#installing) for local hooks. Emergency skip: `SKIP_GITLEAKS=1` (see [security-secrets.md](security-secrets.md)).

```bash
bun run secret-scan:staged   # staged only (same as pre-commit)
bun run secret-scan          # full repo
```

## Branch protection

If using required checks, require **Verify (fast)**, **Verify (scaffold)**, **Verify (extras)**, and **Gitleaks**. Release does not need to be required for every PR.

## Local parity

Full workspace:

```bash
bun run ci
```

Affected-only (closer to PR CI when you have a merge base):

```bash
bun run ci:affected
```

Strict doctor (matches CI):

```bash
bun run repo:doctor:strict
```

Full CI parity (ladder + scaffold combo matrix):

```bash
bun run ci:full
```

**Do not run the full combo matrix on a laptop unless you have spare RAM and time.**
It scaffolds ~18 projects serially (each `install` + `typecheck` + `lint` + `build`), which can take 15–30 minutes and spike memory. CI runs it in the **Verify (scaffold)** job on GitHub runners.

For local template changes, prefer targeted checks:

```bash
# Single default fullstack preset (fastest meaningful check)
bun run verify:generated:fullstack

# All 6 fullstack combo variants (covers express/hono/rust/worker/sqlite/drizzle)
bun run verify:generated:combo-fullstack

# One combo case after a targeted fix
bun toolings/scripts/verify-generated-project.ts --combo-matrix --combo-id=fullstack-rust-axum --run=install,typecheck,lint,build
```

The **combo matrix** exists because the CLI generates many project shapes from templates. Dogfood `apps/web` can be correct while generated scaffolds drift (stale routes, orphaned imports after `stripLiveDemoWeb`). CI catches that drift before release.

## What CI does not run

See [ci-gaps.md](./ci-gaps.md) for E2E, deploy smoke, and doc drift to avoid.
