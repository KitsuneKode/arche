# CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

Runs on `push` to `main`, `prod`, and `develop`, and on pull requests. One job installs once, then runs the verification ladder.

| Step         | Command                                                                         | Purpose                        |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------ |
| Format       | `bun run format:check`                                                          | Oxfmt repo formatting          |
| Lint + types | `bunx turbo run lint check-types` (+ `--affected` on PRs / `develop`)           | Turbo lint and TypeScript      |
| Tests        | `bun test`                                                                      | CLI, tooling, and unit tests   |
| Build        | `bunx turbo run build` (+ `--affected` on PRs / `develop`)                      | Build packages                 |
| Smoke        | `bunx turbo run build --filter=@arche-template/web --filter=@kitsunekode/arche` | Always build web + CLI         |
| Package      | `bun run pkg:check`                                                             | CLI pack dry-run               |
| Repo doctor  | `bun run repo:doctor:strict`                                                    | Doc/path drift (warnings fail) |

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

If using required checks, require at least **`Verify`** (CI) and **`Gitleaks`**. Release does not need to be required for every PR.

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

## What CI does not run

See [ci-gaps.md](./ci-gaps.md) for E2E, deploy smoke, and doc drift to avoid.
