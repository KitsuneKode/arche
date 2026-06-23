# Plan 003: Single-source the workspace AGENTS.md files (live repo is canonical; template copies are synced)

> **Executor instructions**: Follow step by step, verifying each step. Honor
> STOP conditions. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/templates/fullstack apps/server/AGENTS.md packages`
> If any in-scope file changed since `d199cac`, re-run the mapping command in
> "Current state" before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 001 (the repo-doctor budget check lands first; this plan adds a sibling drift check)
- **Category**: tech-debt / dx
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

Eight workspace `AGENTS.md` files exist twice in the repo — once in the live monorepo and once, byte-for-byte identical, inside the fullstack template at `apps/cli/src/templates/fullstack/`. Every edit to a workspace doc must currently be made in two places or the template silently drifts from the live repo it is supposed to mirror. This plan establishes the live files as canonical and adds a sync script (with a `--check` mode wired into CI) so the duplication is mechanical and drift becomes a failing check instead of a latent bug.

## Current state

The fullstack template mirrors the live repo. These 8 pairs are byte-identical at `d199cac` (verified). Mapping is `apps/cli/src/templates/fullstack/<path>` ↔ `<path>`:

```
apps/server/AGENTS.md
apps/worker/AGENTS.md
packages/auth/AGENTS.md
packages/backend-common/AGENTS.md
packages/common/AGENTS.md
packages/store/AGENTS.md
packages/trpc/AGENTS.md
toolings/typescript-config/AGENTS.md
```

Reproduce the mapping (run this to confirm before editing):

```bash
for t in $(find apps/cli/src/templates/fullstack -name AGENTS.md | sort); do
  live=${t#apps/cli/src/templates/fullstack/}
  if [ -f "$live" ]; then diff -q "$live" "$t" >/dev/null && echo "IDENTICAL $live" || echo "DIFFERS $live"; else echo "NO-LIVE $t"; fi
done
```

Notes:

- The live repo has additional `AGENTS.md` files (`apps/web`, `apps/cli`, `packages/ui`, `tests`) that have **no** fullstack-template counterpart — leave those out of the sync set.
- The fullstack template does NOT contain `apps/web/AGENTS.md` — do not add one.
- Existing tooling-scripts conventions live in `toolings/scripts/` (e.g. `repo-doctor.ts`, `rename-scope.ts`, `template-cleanup.ts`). New scripts use `#!/usr/bin/env bun`, `Bun.Glob`, and `Bun.file(path).text()` (see `repo-doctor.ts:86-94`).

## Commands you will need

| Purpose          | Command                                                | Expected                            |
| ---------------- | ------------------------------------------------------ | ----------------------------------- |
| Run sync (write) | `bun toolings/scripts/sync-template-agents.ts`         | copies live → template, exit 0      |
| Run sync (check) | `bun toolings/scripts/sync-template-agents.ts --check` | exit 0 when in sync, 1 when drifted |
| Doctor strict    | `bun run repo:doctor:strict`                           | exit 0                              |
| CLI tests        | `bun test apps/cli/tests`                              | all pass                            |
| Format check     | `bun run format:check`                                 | exit 0                              |

## Scope

**In scope**:

- `toolings/scripts/sync-template-agents.ts` (create)
- `package.json` (add a script `agents:sync` and `agents:sync:check`)
- `.github/workflows/ci.yml` OR `toolings/scripts/repo-doctor.ts` (wire the `--check`; prefer adding a doctor check so it runs in the existing `repo:doctor:strict` CI step — see Step 3)
- `toolings/scripts/AGENTS.md` (one line documenting the new script under "Owns"/"Common Tasks")

**Out of scope**:

- The _content_ of any `AGENTS.md` (Plans 001/002 own content).
- Live `AGENTS.md` files that have no template counterpart.
- The template-cleanup / rename-scope scripts.

## Git workflow

- Branch: `advisor/003-single-source-workspace-agents`
- Conventional commits, e.g. `chore(tooling): sync template AGENTS.md from live workspaces`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Create the sync script

Create `toolings/scripts/sync-template-agents.ts`. It must:

- Define the canonical sync set as the list of 8 relative paths above (or derive it: find every `apps/cli/src/templates/fullstack/**/AGENTS.md`, strip the prefix, and include only those whose live counterpart exists).
- Default mode: for each pair, copy the live file's contents over the template file (`await Bun.write(templatePath, await Bun.file(livePath).text())`).
- `--check` mode: compare contents; collect drifted pairs; if any differ, print them and `process.exit(1)`; else `process.exit(0)`.
- Use `#!/usr/bin/env bun` and `import.meta.main` guard like `repo-doctor.ts:398-400`.

**Verify**: `bun toolings/scripts/sync-template-agents.ts --check` → exit 0 (they're already in sync). Then deliberately edit one template file by one char, re-run `--check` → exit 1 listing that file, then run the writer to restore, `--check` → exit 0 again.

### Step 2: Add package.json scripts

Add to root `package.json` `scripts`:

- `"agents:sync": "bun toolings/scripts/sync-template-agents.ts"`
- `"agents:sync:check": "bun toolings/scripts/sync-template-agents.ts --check"`

**Verify**: `bun run agents:sync:check` → exit 0.

### Step 3: Wire the drift check into CI

Add a new check to `toolings/scripts/repo-doctor.ts` named `checkTemplateAgentsSync(): Promise<Finding[]>` that performs the same content comparison as `--check` and returns a `warn` (code `template-agents-drift`) per drifted pair. Register it in `collectRepoDoctorFindings()` (`:337-345`). This makes drift fail the existing `repo:doctor:strict` CI step (`.github/workflows/ci.yml:102-103`) — no new CI job needed.

(Alternative if you prefer a dedicated step: add `- name: AGENTS sync check / run: bun run agents:sync:check` to `ci.yml` after the Repo doctor step. Pick ONE; do not do both.)

**Verify**: `bun run repo:doctor:strict` → exit 0 in-sync; after a deliberate one-char template edit, → exit 1 reporting `template-agents-drift`; restore and confirm exit 0.

### Step 4: Document the script

Add one bullet to `toolings/scripts/AGENTS.md` under "Owns" (e.g. "sync of canonical workspace `AGENTS.md` into the fullstack template (`sync-template-agents.ts`)") and one "Common Task" line. Keep additions to ≤ 3 lines (respect the budget check from Plan 001).

**Verify**: `bun run format:check` → exit 0; `wc -l toolings/scripts/AGENTS.md` still ≤ 40.

## Test plan

- Add `tests/src/toolings/sync-template-agents.test.ts` (model after the existing `tests/src/toolings/*.test.ts` — read one first). Cover: (a) export the comparison function and assert it returns no drift against the real tree; (b) assert it detects drift when given a mismatched pair fixture.
- Verification: `bun test tests/src/toolings` → all pass.

## Done criteria

ALL must hold:

- [ ] `toolings/scripts/sync-template-agents.ts` exists with default + `--check` modes
- [ ] `bun run agents:sync:check` exits 0
- [ ] Drift is caught: a one-char edit to any of the 8 template files makes `repo:doctor:strict` (or the dedicated step) exit 1
- [ ] `bun run repo:doctor:strict` exits 0 on the clean tree
- [ ] `bun test apps/cli/tests` still passes (no scaffold-output regression)
- [ ] `bun test tests/src/toolings` passes with the new test
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- The mapping command in "Current state" reports any `DIFFERS` at `d199cac` (the files already drifted — report which, do not blindly overwrite).
- `tests/src/toolings/` has no existing test to model after.
- Wiring into repo-doctor would require touching unrelated check logic.

## Maintenance notes

- After this lands, workspace `AGENTS.md` edits should be made to the **live** file only; `bun run agents:sync` propagates to the template; the check enforces it.
- If a new workspace with an `AGENTS.md` is added to the fullstack template, add its live counterpart and the pair is picked up automatically (if you derived the set) or add it to the explicit list.
- Reviewer: confirm the sync direction is live → template (never the reverse), so the canonical source is unambiguous.
