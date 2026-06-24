# Trust wave orchestration — quality-gated execution

> **Completed**: 2026-06-24. All four child plans shipped; see § Run log.

## Baseline

- **Integration branch**: `advisor/trust-wave` (work landed on working tree at `9958c37`)
- **Stamped at**: `9958c37ecaa290a3ea41c5220784d350b9992d94`
- **Prior shipped** (from superseded May web plan — do not re-do):
  - W0: UI lint, `PRODUCT.md`, web brief foundation
  - W2 partial: `DESIGN.md`, brand assets direction
  - W3 partial: home/families hierarchy, `public-copy.test.ts`
- **Baseline `ci:min`**: green (2026-06-24)

## Roles

| Role                 | May edit code?       | Responsibility                                           |
| -------------------- | -------------------- | -------------------------------------------------------- |
| **Orchestrator**     | No                   | Schedule, merge, run log                                 |
| **Executor**         | Yes (one child plan) | Isolated branch `advisor/trust-{slug}-exec`              |
| **Verifier**         | No                   | Re-run Done criteria; scope ⊆ in-scope                   |
| **Tester**           | No                   | `ci:min` + lane extras after each merge                  |
| **Quality reviewer** | No                   | `code-reviewer` (web); `security-review` (security plan) |

Max **2 send-backs** per child plan; then BLOCKED.

## Child plans (serial order)

| Step | Slug                   | Plan file                                                                            |
| ---- | ---------------------- | ------------------------------------------------------------------------------------ |
| 1    | `matrix-table`         | [2026-06-24-trust-matrix-table.md](2026-06-24-trust-matrix-table.md)                 |
| 2    | `landing-primitives`   | [2026-06-24-trust-landing-primitives.md](2026-06-24-trust-landing-primitives.md)     |
| 3    | `content-truthfulness` | [2026-06-24-trust-content-truthfulness.md](2026-06-24-trust-content-truthfulness.md) |
| 4    | `template-security`    | [2026-06-24-trust-template-security.md](2026-06-24-trust-template-security.md)       |

## Shared-file matrix

| Resource                                                                 | Owner step |
| ------------------------------------------------------------------------ | ---------- |
| `apps/web/components/**/verification-matrix*`, `registry-evidence-table` | 1          |
| `apps/web/app/page.tsx`, `animated-terminal.tsx`, `__design-lab`         | 2          |
| `README.md`, `apps/web/content/**`, `.docs/product/**`, `display.ts`     | 3          |
| `apps/server/**`, `packages/auth/**`, `orm.ts` generator                 | 4          |

## Executor dispatch prompt

```
Repo: /home/kitsunekode/Projects/templates/template-nextjs-express-trpc-bettera-auth-monorepo
Base branch: advisor/trust-wave (current tip)
Work branch: advisor/trust-{slug}-exec

1. Read fully: .plans/active/2026-06-24-trust-{slug}.md
2. Run drift check; STOP on mismatch
3. Implement step by step; honor STOP conditions
4. Run Done criteria; paste command output
5. Do NOT merge to advisor/trust-wave; do NOT push

Report: branch, git diff --stat, files changed, pass/fail per Done criterion
```

## Verifier checklist (before merge)

- [ ] Every Done criterion re-run on executor branch — green
- [ ] `git diff --name-only advisor/trust-wave..advisor/trust-{slug}-exec` ⊆ plan In scope
- [ ] No secrets in docs
- [ ] Steps 1–3: `bun test apps/web/app/public-copy.test.ts` passes
- [ ] Step 4: no new public PII endpoints without justification

## Tester wave gate (after each merge)

```bash
bun install && bun run ci:min
```

| After step | Extra                                                        |
| ---------- | ------------------------------------------------------------ |
| 1 matrix   | `bun test apps/web`                                          |
| 2 landing  | `bun test apps/web/components/arche` + `public-copy.test.ts` |
| 3 content  | `bun test packages/registry` + `bun test apps/web`           |
| 4 security | `bun test apps/server` + `bun test apps/cli/tests`           |

## Quality reviewer triggers

| After            | Reviewer                                     |
| ---------------- | -------------------------------------------- |
| Steps 1–3 merged | `code-reviewer` — truthfulness, DESIGN.md    |
| Step 4 merged    | `security-review` — IDOR, admin, auth origin |

## Final acceptance (after step 4)

```bash
bun install --frozen-lockfile
bun run ci
bun test apps/web/app/public-copy.test.ts
bun test packages/registry/tests/truthfulness.test.ts
bun run repo:doctor:strict
```

### Integrity checklist

- [x] README badge/table/prose — one Stable story
- [x] `/families` matrix — no `no` flood for N/A columns (`registry-evidence-table`)
- [x] Landing terminal — real `--yes` flow; version from `apps/cli/package.json`
- [x] Walkthroughs — no hard-coded outdated Requires validation labels
- [x] web-brand-ui-brief — allows Stable when matrix proves it
- [x] No "production" in `display.ts` goodFor
- [x] getAllUser removed; drafts gated on public post routes; Bull Board production-gated; auth → API URL
- [x] `__design-lab` notFound in production

**Final acceptance (2026-06-24)**: `bun run ci` green, `repo:doctor:strict` 0 errors, truthfulness tests pass.

## STOP conditions (orchestrator)

- Baseline `ci:min` red without signed-off pre-fix
- Executor edits out-of-scope files
- Merge conflict between steps — re-sequence
- security-review blocks step 4

## Wave 3 candidates (out of scope)

Scaffold pipeline phases, web-core manifest unification, project-shape predicate — do not scope-creep.

## Run log

| Step     | Child plan           | Executor branch | Verifier | Tester | Reviewer | Status |
| -------- | -------------------- | --------------- | -------- | ------ | -------- | ------ |
| baseline | —                    | —               | —        | ci:min | —        | PASS   |
| 1        | matrix-table         | inline          | inline   | ci:min | inline   | DONE   |
| 2        | landing-primitives   | inline          | inline   | ci:min | inline   | DONE   |
| 3        | content-truthfulness | inline          | inline   | ci:min | inline   | DONE   |
| 4        | template-security    | inline          | inline   | ci:min | inline   | DONE   |
| final    | acceptance           | —               | —        | ci     | —        | PASS   |

**Verification notes**: Shared `registry-evidence-table`; landing terminal + design-lab guard; README/walkthrough/registry copy sweep; server auth/post/Bull Board hardening synced to fullstack template. `bun test apps/cli/tests` 338 pass.
