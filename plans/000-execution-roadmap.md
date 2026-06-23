# Plan 000: Execution roadmap — drive all 12 plans to done with subagents

> **What this is**: the orchestration plan that sequences plans 001–012, runs
> each as an isolated executor subagent, verifies after every step, integrates,
> and ends on a full green CI. It encodes the dependency order AND the
> shared-file serialization so two subagents never edit the same file at once.
>
> **Who runs this**: an ORCHESTRATOR (the controlling agent). The orchestrator
> does NOT hand-edit product code — it dispatches executor subagents, reviews
> their diffs like a tech lead, and integrates. Read each child plan before
> dispatching it; the child plans are self-contained.
>
> **Base commit**: all plans stamped at `d199cac`. Create an integration branch
> from it: `git switch -c advisor/integration d199cac`.

## Status

- **Priority**: P0 (meta)
- **Depends on**: nothing; governs 001–012
- **Planned at**: commit `d199cac`, 2026-06-23

## 0. Roles & mechanics

- **Orchestrator** (you): owns the schedule, dispatches subagents, reviews diffs, runs verification gates, integrates to `advisor/integration`, updates the status table in `plans/README.md`. Never edits product source directly.
- **Executor subagent**: one per plan. Runs in an **isolated git worktree/branch** (use the `best-of-n-runner` subagent, or a `generalPurpose` subagent following the `using-git-worktrees` skill). It implements exactly one plan, runs that plan's own verification, and reports back its branch, diff summary, and done-criteria results.
- **Reviewer** (orchestrator, optionally a fresh `code-reviewer` subagent): re-runs the plan's done criteria, checks scope, reads the diff, renders a verdict before integration.

**Integration model**: each executor branches off the CURRENT `advisor/integration` tip (so it sees prior merged work), not off `d199cac`. After review passes, the orchestrator fast-forwards/merges that branch into `advisor/integration` and runs the wave gate. This keeps drift checks meaningful and lets later plans build on earlier ones.

## 1. STOP-gate: baseline must be green first

Before dispatching anything:

```bash
git switch -c advisor/integration d199cac
bun install
bun run ci:min   # format:check → turbo lint check-types → bun test → turbo build
```

- If `ci:min` is **green**: proceed.
- If **red**: do NOT start. Capture the failure. Either (a) it's pre-existing and unrelated → record it as a known-baseline failure that every later gate must tolerate identically, or (b) it blocks verification → write a tiny "baseline fix" as a pre-step and get sign-off. **Never** let executors run against a red baseline — they'll mis-attribute failures.

Record the baseline result at the top of the run log you keep in this file's "Run log" section.

## 2. Shared-file serialization matrix (the hard constraints)

Two plans that touch the same file MUST NOT run concurrently. Groups that share a file (→ run serially in the listed order):

| Shared resource                                  | Plans (serial order)  |
| ------------------------------------------------ | --------------------- |
| `apps/cli/src/lib/scaffold.ts`                   | 002 → 007 → 008       |
| root `package.json`                              | 004 → 005 → 006 → 003 |
| `.github/workflows/ci.yml`                       | 004 → 003             |
| `toolings/scripts/repo-doctor.ts`                | 001 → 003             |
| `apps/cli/src/lib/generators/agent-docs.ts`      | 002 → 010 → 011 → 012 |
| `packages/registry/src/*`                        | 010 → 011 → 012       |
| `apps/cli/src/types/schemas.ts`                  | 010 → 011 → 012       |
| `apps/cli/src/lib/generated-project-verifier.ts` | 010 → 012             |
| `apps/cli/CLI-SPEC.md`                           | 011 → 012             |
| `apps/cli/src/templates/next/**`                 | 009 → 010             |
| `packages/common/package.json`                   | 005 → 006             |

Hard dependency edges (beyond files): **003** needs 001+002 done; **008** after 007; **010** after 009; the agent-docs chain forces **002 before 010/011/012**.

## 3. Execution schedule

Two equivalent options. Use **3.A (sequential backbone)** for maximum safety/simplicity, or **3.B (optimized waves)** to parallelize disjoint lanes. Both honor §2.

### 3.A Sequential backbone (default, safest)

Run one plan at a time, integrate + gate after each:

```
001 → 002 → 007 → 008 → 004 → 005 → 006 → 003 → 009 → 010 → 011 → 012
```

Rationale: 001/002 first (context + agent-docs base); 007/008 take `scaffold.ts` after 002's small block lands; the root-`package.json` chain 004→005→006→003; then the templates/registry chain 009→010→011→012.

### 3.B Optimized waves (parallel where file-sets are disjoint)

- **Wave 1 (parallel)**: `001`, `009` — disjoint (repo-doctor/AGENTS vs templates/next).
- **Wave 2 (single)**: `002` — must land before lane S and the registry lane (shares `scaffold.ts` + `agent-docs.ts`).
- **Wave 3 (parallel, 2 lanes)**:
  - Lane S: `007 → 008` (scaffold.ts)
  - Lane P: `004 → 005 → 006` (root package.json + workspaces)
    These two lanes are disjoint (`scaffold.ts` vs `package.json`).
- **Wave 4 (single)**: `003` — needs 001, 002, and the root `package.json` from lane P.
- **Wave 5 (serial lane)**: `010 → 011 → 012` (registry + agent-docs + schemas). `010` also needs `009` (Wave 1).
- **Soft sync**: do `004` (Wave 3) before the e2e steps of `010`/`012`, because `004` establishes the `SCAFFOLD_E2E=1` gating those cases rely on.

After EVERY wave, run the wave gate (§5) on `advisor/integration` before starting the next.

## 4. Per-plan dispatch protocol

For each plan, dispatch ONE executor subagent with a prompt of this exact shape (fill the braces):

```
You are executing ONE implementation plan in an isolated git worktree. Do not
touch anything outside the plan's scope.

Repo: /home/kitsunekode/Projects/templates/template-nextjs-express-trpc-bettera-auth-monorepo
Base branch to start from: advisor/integration (current tip)
Create your work branch: advisor/{NNN}-exec

1. Read the plan in full: plans/{NNN}-{slug}.md
2. Run the plan's "Drift check" first. If it reports a mismatch, STOP and report — do not improvise.
3. Implement the plan step by step. Honor every STOP condition.
4. Run the plan's own verification commands and its "Done criteria". Paste results.
5. Do NOT commit to advisor/integration, do NOT push, do NOT open a PR.
6. Report back: your branch name, `git diff --stat` vs advisor/integration, the
   full list of files changed, and pass/fail for each Done criterion with the
   command output that proves it.

Hard rules: only files in the plan's "In scope" may change. If you discover the
plan is wrong or blocked, STOP and report rather than working around it.
```

Notes:

- For plans that ADD native or heavy deps in generated projects (012) or change the install graph (006), let the executor run installs **inside its worktree only**.
- For 012, the executor must complete **Step 0 (feasibility gate)** and STOP-report if it fails — do not let it build the template blind.

## 5. Review & verification gates

### Per-plan review (before integrating that plan's branch)

The orchestrator (or a `code-reviewer` subagent) MUST:

1. Re-run the plan's **Done criteria** commands on the executor's branch — confirm green, don't trust the report.
2. Check **scope**: `git diff --name-only advisor/integration..advisor/{NNN}-exec` ⊆ the plan's "In scope". Reject any out-of-scope file, however plausible.
3. Read the diff for correctness against the plan's intent (not just "tests pass").
4. Verdict: **integrate**, **send back** (resume the executor with the specific failure), or **abort** (see §6).

### Integration

On pass: merge/ff `advisor/{NNN}-exec` into `advisor/integration`. Resolve no conflicts blindly — if a merge conflicts, the §2 ordering was violated; re-sequence.

### Wave gate (after each backbone step / each wave)

On `advisor/integration`:

```bash
bun install
bun run ci:min   # must match or beat the recorded baseline
```

- For plans that added scaffold combo cases (010, 012): also run `SCAFFOLD_E2E=1 bun test apps/cli/tests/e2e-scaffold.test.ts` (or the combo entrypoint) and confirm the new family/preset case is green.
- Update the status table in `plans/README.md`: TODO → DONE for the integrated plan.

### Final acceptance gate (after 012)

```bash
bun install --frozen-lockfile
bun run ci            # full ladder incl. pkg:check + repo:doctor:strict
SCAFFOLD_E2E=1 bun test apps/cli/tests   # full scaffold matrix
bun run repo:doctor   # warnings OK locally; no new errors
```

All green = the run is complete. Then summarize what shipped.

## 6. Fix-issues loop & abort criteria

- **Send-back (preferred)**: if a plan's done criteria fail or review finds a scope/correctness issue, resume that SAME executor with the precise failure + command output. Cap at 2 send-backs; after that, the orchestrator investigates directly and either patches forward (within scope) or marks the plan BLOCKED.
- **Cross-plan breakage**: if integrating plan N reds a gate that plan N-1 left green, the conflict is between N and an earlier change. Bisect: re-run the failing command on N's branch pre-merge. Fix in N's scope if possible; if it requires editing an out-of-scope file, STOP and re-plan (don't silently widen scope).
- **Abort a plan** (mark BLOCKED in `plans/README.md`, continue with independents) when: its drift check fails irrecoverably, a STOP condition fires that needs human judgment, or it depends on a BLOCKED plan. Blocking 003 blocks nothing else; blocking 009 blocks 010; blocking 002 blocks 010/011/012; blocking 007 blocks 008.
- **Never**: force-merge over conflicts, disable a failing test to make a gate pass, push, or open PRs without explicit instruction.

## 7. "Make sure things are where they need to be" — final integrity checks

Beyond CI, confirm the user-visible outcomes the plans promised:

- [ ] Root `AGENTS.md` ≤ the budget 001 set; `repo:doctor` enforces it.
- [ ] A freshly scaffolded `fullstack` project's `AGENTS.md`/`.docs`/`.plans` are lean and reference only files that exist (002).
- [ ] Template `AGENTS.md` copies match live workspaces (003 drift check passes).
- [ ] CI has ONE scaffold-verify path; heavy combo gated by `SCAFFOLD_E2E=1` (004).
- [ ] `bun install --frozen-lockfile` is green; root manifest holds only tooling + root-script deps (006).
- [ ] A deliberately-failed scaffold leaves no partial directory (007); `--dry-run` lists exactly what a real run writes (008 fidelity test).
- [ ] `next` scaffolds an opinionated app that installs+builds; `next-app` preset status is evidence-based (009, 010).
- [ ] No registry capability/column claims something unverified; generated `next` docs claim no ungenerated features (011).
- [ ] `tui` family + `tui-app` preset scaffold an OpenTUI app that installs+typechecks+builds; `@opentui/*` appears ONLY in generated projects, never in `apps/cli/package.json` (012).

## 8. Run log (orchestrator fills this in)

| Step     | Plan | Executor branch | Review verdict | Wave gate        | Status |
| -------- | ---- | --------------- | -------------- | ---------------- | ------ |
| baseline | —    | —               | —              | ci:min: \_\_\_\_ |        |
| 1        | 001  |                 |                |                  |        |
| 2        | 002  |                 |                |                  |        |
| …        |      |                 |                |                  |        |

Keep appending. This log + the `plans/README.md` status table are the source of truth for "what's done."

## STOP conditions (orchestrator level)

- Baseline `ci:min` is red and the cause isn't a trivial, signed-off pre-step — STOP.
- An executor wants to edit a file outside its plan's scope — reject; STOP and re-plan rather than widen scope.
- A merge conflict appears between two plans — the §2 order was broken; STOP, re-sequence, redo.
- 012's feasibility gate (Step 0) fails — STOP that plan; the rest proceed.
