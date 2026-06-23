# Plan 001: Trim the canonical AGENTS.md to its own policy and enforce a line budget in repo:doctor

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- AGENTS.md toolings/scripts/repo-doctor.ts docs/context-maintenance.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs / dx
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

The repo's own policy (`docs/context-maintenance.md`) says agent-context files must be short, path-heavy, and must **not** duplicate long shared explanations. The canonical root `AGENTS.md` violates this: it is 126 lines, ~62 of which (the "Before push" CI ladder, `:22-83`) restate `docs/ci.md`, and it triplicates the deploy Path A/B/C matrix that already lives in `docs/deployment.md`. Because this file is loaded on every agent session (and injected twice — `CLAUDE.md` is a symlink and both paths are registered as always-applied rules), the redundancy is paid constantly. Trimming it to navigation + repo-specific invariants, and adding a `repo:doctor` guard so it cannot regrow, directly serves the maintainer's #1 goal ("minimize AGENTS.md with useless information").

## Current state

- `AGENTS.md` — canonical root agent guide, **126 lines**. Structure today:
  - `:1-3` title + "How to navigate" intro
  - `:5-11` "Core priorities" — generic prose ("Performance first / Reliability first / Maintainability"), no repo-specific paths.
  - `:13-20` "How to navigate" (4-step loading order) — KEEP (this is the canonical copy).
  - `:22-83` "Before push (required)" — full CI ladder with `ci:min` / `ci` tables, duplicates `docs/ci.md`.
  - `:86-98` "Stack map" table + tRPC procedure path — KEEP the tRPC invariant; the table partly duplicates workspace ownership.
  - `:100-112` "Production default" + "Deploy (production)" Path A/B/C — duplicates `docs/deployment.md`.
  - `:114-116` "Commands" — points at `docs/commands.md` (good, keep as a pointer).
  - `:118-127` "Do not load by default" + "Portfolio / CLI" + "Web/brand work" — KEEP (short pointers).
- `docs/context-maintenance.md` — the policy this plan enforces. Quote it for the executor:
  - `:47-50`: "Anti-Patterns — Do not mirror the entire repo tree. Do not duplicate long shared explanations across many files."
  - `:29-37`: local AGENTS files "should stay short".
  - `:53`: "`CLAUDE.md` is a symlink to canonical `AGENTS.md`." (Do NOT convert it to a file.)
- `toolings/scripts/repo-doctor.ts` — the repo auditor. It already composes findings in `collectRepoDoctorFindings()` (`:336-352`) from check functions like `checkDocPathDrift` and `checkBoilerplateDocs`. There is **no** check for AGENTS.md length or duplicated shared blocks. `--strict` exits 1 on `warn`+`error` (`:391-393`).
- `docs/ci.md` and `docs/deployment.md` exist and are the canonical homes for the CI ladder and deploy matrix respectively (the root file should link to them, not restate them).

Excerpt — the CI block to remove from `AGENTS.md` (`:22-36`, continues to `:83`):

````22:36:AGENTS.md
## Before push (required)

**Do not push until the minimum ladder passes** — including production **build**. On `main`, `prod`, or `develop`, run the full CI ladder instead.

GitHub Actions [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the full ladder; failed pushes block the branch and waste review time.

### Minimum ladder (every push)

From the repo root:

```bash
bun run ci:min
````

````

Excerpt — how repo-doctor aggregates checks (the place to register a new check):

```336:345:toolings/scripts/repo-doctor.ts
export async function collectRepoDoctorFindings(): Promise<Finding[]> {
  return dedupeFindings(
    [
      ...(await checkBoilerplateDocs()),
      ...(await checkPlaceholderFiles()),
      ...(await checkTrackedGitkeepFiles()),
      ...(await checkSuspiciousPaths()),
      ...(await checkPackageExports()),
      ...(await checkDocPathDrift()),
````

## Commands you will need

| Purpose              | Command                       | Expected on success                      |
| -------------------- | ----------------------------- | ---------------------------------------- |
| Format check         | `bun run format:check`        | exit 0                                   |
| Format fix           | `bun run format`              | rewrites files                           |
| Repo doctor          | `bun run repo:doctor`         | prints findings, exit 0 if no error/warn |
| Repo doctor (strict) | `bun run repo:doctor:strict`  | exit 0 only when no warn/error           |
| Doctor unit tests    | `bun test tests/src/toolings` | all pass                                 |

## Scope

**In scope** (the only files you should modify):

- `AGENTS.md` (trim)
- `toolings/scripts/repo-doctor.ts` (add one check function)
- `tests/src/toolings/repo-doctor.test.ts` (add a test for the new check — confirm this path exists first with `ls tests/src/toolings`; if the test file name differs, match the existing convention)

**Out of scope** (do NOT touch):

- `CLAUDE.md` — it is a symlink to `AGENTS.md`; leave it.
- `docs/ci.md`, `docs/deployment.md`, `docs/commands.md` — they are the canonical homes; do not edit them in this plan.
- Any workspace `apps/*/AGENTS.md` or `packages/*/AGENTS.md` — handled by Plan 003.
- The generator `apps/cli/src/lib/generators/agent-docs.ts` — handled by Plan 002.

## Git workflow

- Branch: `advisor/001-lean-canonical-agents-md`
- Commit style: conventional commits (repo convention, e.g. `docs: trim root AGENTS.md to navigation + invariants`). Example from `git log`: `docs: add audit-cli redirect stub and CLI release changeset`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite `AGENTS.md` to a short navigation + invariants file

Replace the file contents so it keeps ONLY: title, "How to navigate" (the 4-step loading order at `:13-20`), a compact "Repo-specific invariants" list (tRPC procedure path from `:98`, the production-default one-liner), a "Commands" pointer to `docs/commands.md`, a "Before push" pointer to `docs/ci.md`, a "Deploy" pointer to `docs/deployment.md`, and the existing "Do not load by default" / "Portfolio / CLI" / "Web/brand work" pointers. Target **≤ 45 lines**.

The target shape (produce something equivalent — exact wording may vary, but every removed section must become a one-line link, not be deleted outright):

```markdown
# Agent guide (canonical)

Read this file first, then the nearest local `AGENTS.md` for the workspace you edit.

## How to navigate

1. Nearest `AGENTS.md` (app or package you touch).
2. [docs/README.md](docs/README.md) — public/manual docs and commands.
3. [`.docs/README.md`](.docs/README.md) + one task-specific topic when implementing.
4. One matching [`.plans/active/`](.plans/active/) plan for approved in-flight work.

## Repo-specific invariants

- tRPC procedures live in `apps/server/src/modules/<feature>/*.trpc.ts`, composed in `apps/server/src/modules/trpc/app.router.ts`.
- `packages/trpc` is the client contract only — it re-exports `AppRouter`/`createCaller` from the server.
- Production default: Vercel web + Render Docker API + Neon + Upstash.
- Prefer correctness and robustness over short-term convenience.

## Before push

Run `bun run ci:min` (full `bun run ci` on `main`/`prod`). Ladder details: [docs/ci.md](docs/ci.md).

## Commands

See [docs/commands.md](docs/commands.md).

## Deploy

Hub: [docs/deployment.md](docs/deployment.md); env matrix: [docs/deployment-env.md](docs/deployment-env.md).

## Stack map

| Workspace                                   | Role                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `apps/web`                                  | Next.js App Router; tRPC client + `trpcCaller` for RSC   |
| `apps/server`                               | Express, Better Auth, modules in `src/modules/*`         |
| `apps/worker`                               | Background jobs (Redis/BullMQ when enabled)              |
| `packages/{trpc,store,auth,backend-common}` | client contract / Prisma / Better Auth / serverEnv+Redis |

## Do not load by default

Historical planning lives under [docs/archive/planning/](docs/archive/planning/) — not implementation sources.

## Portfolio / CLI / brand

Scaffold CLI: [apps/cli/CLI-SPEC.md](apps/cli/CLI-SPEC.md). Brand/web copy: read [PRODUCT.md](PRODUCT.md) first.
```

**Verify**: `wc -l AGENTS.md` → 45 or fewer. Then `bun run format:check` → exit 0 (run `bun run format` first if it complains).

### Step 2: Add an AGENTS.md line-budget + duplicate-CI-block check to repo-doctor

In `toolings/scripts/repo-doctor.ts`, add a new async check function `checkAgentsDocBudget(): Promise<Finding[]>` and register it inside `collectRepoDoctorFindings()` (the array at `:337-345`). The check must:

- Collect `AGENTS.md`, `apps/*/AGENTS.md`, `packages/*/AGENTS.md`, `toolings/*/AGENTS.md`, `tests/AGENTS.md` (reuse the existing `collectFiles` + `DOC_GLOBS`-style globs).
- For the **root** `AGENTS.md`, emit a `warn` with code `agents-md-too-long` if it exceeds **45** non-empty lines.
- For any workspace `AGENTS.md`, emit a `warn` with code `agents-md-too-long` if it exceeds **40** non-empty lines.
- Emit a `warn` with code `agents-md-duplicates-ci-ladder` for any `AGENTS.md` that contains the heading text `### Minimum ladder` or the literal `bun run ci:min:affected` followed by a code fence (i.e. restating the ladder rather than linking `docs/ci.md`). Keep the detection simple and string-based, matching the style of `checkBoilerplateDocs` (`:110-145`).

Follow the existing `Finding` shape (`:7-13`) and the `severity/code/path/message/suggestion` pattern used by sibling checks.

**Verify**: `bun run repo:doctor` → runs without throwing; after Step 1 the root file is under budget so `agents-md-too-long` is NOT reported for `AGENTS.md`. Temporarily revert `AGENTS.md` (or test against a fixture) to confirm the check _would_ fire — see Test plan.

### Step 3: Confirm strict doctor still passes

**Verify**: `bun run repo:doctor:strict` → exit 0. If it now reports pre-existing unrelated warnings that were already failing before this plan, that is a STOP condition (do not fix unrelated findings here).

## Test plan

- Add a unit test in `tests/src/toolings/repo-doctor.test.ts` (match the existing test file's structure — read it first) that calls `checkAgentsDocBudget` (export it) against two in-memory/fixture strings: one 120-line doc containing `### Minimum ladder` → expect a `agents-md-too-long` and a `agents-md-duplicates-ci-ladder` finding; one 20-line doc with only links → expect zero findings.
- If the existing doctor tests call `collectRepoDoctorFindings()` against the real tree, ensure your trimmed `AGENTS.md` keeps that suite green.
- Verification: `bun test tests/src/toolings` → all pass, including the new cases.

## Done criteria

ALL must hold:

- [ ] `wc -l AGENTS.md` ≤ 45
- [ ] `AGENTS.md` no longer contains the string `### Minimum ladder` or `## Before push (required)` block; instead links `docs/ci.md`
- [ ] `AGENTS.md` still contains the tRPC invariant (`apps/server/src/modules/<feature>/*.trpc.ts`) and the "How to navigate" 4 steps
- [ ] `bun run format:check` exits 0
- [ ] `bun run repo:doctor:strict` exits 0
- [ ] `bun test tests/src/toolings` passes, with new cases for `checkAgentsDocBudget`
- [ ] `git status` shows only the in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- `AGENTS.md` at `d199cac` does not match the section map in "Current state" (it drifted).
- `bun run repo:doctor:strict` was already failing before your changes on unrelated findings.
- `tests/src/toolings/` does not exist or has no repo-doctor test to model after.
- Removing the CI/deploy sections would orphan information not present in `docs/ci.md` / `docs/deployment.md` (verify those docs contain the equivalent before deleting).

## Maintenance notes

- The 45/40-line budgets are deliberately generous; tighten later if desired.
- Plan 003 will make workspace `AGENTS.md` files single-sourced; the budget check added here will also guard those.
- A reviewer should confirm no unique, load-bearing instruction was deleted rather than relocated to a linked doc.
