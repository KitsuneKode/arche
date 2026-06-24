# Improvement plans — index

Advisory plans for the Arche scaffolding CLI monorepo. Each plan is **self-contained** and executor-ready: a model with zero context from the planning session can follow it. Plans never run unless you execute them.

- **Base commit (plans 001–019)**: `d199cac`
- **Base commit (plans 020+)**: `9958c37`
- **Authoring date**: 2026-06-23 (001–019), 2026-06-24 (020+)
- **How to execute**: drive the whole set via **[000 — execution roadmap](000-execution-roadmap.md)** (subagent orchestration, dependency/file-collision ordering, verification gates, fix-issues loop). To run a single plan standalone, read it top-to-bottom, run its drift check first, follow steps in order, honor STOP conditions. Update the **Status** column here when done.
- **Verification ladder referenced by plans**: `bun run ci:min` (format:check → turbo lint check-types → bun test → turbo build). Per-package fast loops noted inside plans.

## Themes

- **A — Agent context (lean + truthful)**: 001, 002, 003
- **E — CI / DX / hygiene**: 004, 005, 006
- **B — Scaffold reliability**: 007, 008
- **C/DIR — Web core & deep Next**: 009, 010
- **D — Registry/docs truthfulness**: 011
- **DIR — New OpenTUI scaffold template**: 012
- **Architecture completion (post-012)**: 013–019

## Recommended execution order

Within a theme, ascending. Across themes, the low-risk hygiene/context wins (001–006) land first; reliability (007–008) next; template depth (009→010) and truthfulness (011) after; the spike (012) last/independent.

```
001 → 002 → 003        (agent context; 003 depends on 001/002 conventions)
004 → 005 → 006        (CI/DX/deps; mostly independent, sequence package.json edits)
007 → 008              (008 best after 007; 008 routes dry-run through the real pipeline)
009 → 010              (010 requires 009 Phase 1; both touch registry — coordinate with 011)
011                    (independent; coordinate registry edits with 010)
012                    (independent; touches registry — sequence with 010/011)
```

## Status table

| #   | Plan                                                                                                       | Theme | Priority | Effort   | Risk | Depends on        | Status |
| --- | ---------------------------------------------------------------------------------------------------------- | ----- | -------- | -------- | ---- | ----------------- | ------ |
| 000 | [Execution roadmap (orchestration)](000-execution-roadmap.md)                                              | meta  | P0       | —        | —    | governs 001–012   | DONE   |
| 001 | [Lean canonical AGENTS.md + doctor enforcement](001-lean-canonical-agents-md.md)                           | A     | P1       | S        | LOW  | —                 | DONE   |
| 002 | [Fix generated agent-context output](002-fix-generated-agent-context.md)                                   | A     | P1       | M        | LOW  | —                 | DONE   |
| 003 | [Single-source workspace AGENTS.md (template↔live)](003-single-source-workspace-agents.md)                 | A     | P2       | M        | LOW  | 001, 002          | DONE   |
| 004 | [CI scaffold-verify dedup + slim pkg:check](004-ci-scaffold-verify-dedup.md)                               | E     | P1       | S        | MED  | —                 | DONE   |
| 005 | [Repo hygiene: dead scripts, inner loop, install side-effects](005-repo-hygiene-scripts-and-inner-loop.md) | E     | P2       | S        | LOW  | —                 | DONE   |
| 006 | [Dependency declaration hygiene](006-dependency-declaration-hygiene.md)                                    | E     | P2       | M        | MED  | — (seq. with 005) | DONE   |
| 007 | [Atomic scaffold with rollback](007-atomic-scaffold-rollback.md)                                           | B     | P1       | M        | MED  | —                 | DONE   |
| 008 | [Dry-run fidelity (delete parallel planner)](008-dry-run-fidelity.md)                                      | B     | P1       | M        | MED  | 007 (soft)        | DONE   |
| 009 | [Shared web core (align now, extract by design)](009-shared-web-core.md)                                   | C     | P2       | M+design | MED  | —                 | DONE   |
| 010 | [Deep first-class `next` template](010-deep-next-template.md)                                              | DIR   | P2       | L        | MED  | 009               | DONE   |
| 011 | [Registry & docs truthfulness](011-registry-docs-truthfulness.md)                                          | D     | P2       | M        | LOW  | — (coord 010)     | DONE   |
| 012 | [OpenTUI terminal-app template (`tui` family + `tui-app` preset)](012-opentui-tui-template.md)             | DIR   | P3       | L        | MED  | — (coord 010/011) | DONE   |
| 013 | [`_web-core` single source + sync script](013-web-core-single-source.md)                                   | C     | P1       | M        | MED  | 009               | DONE   |
| 014 | [Generated web parity (Solana / rust-fullstack)](014-generated-web-parity.md)                              | C     | P1       | M        | LOW  | 013               | DONE   |
| 015 | [Runtime smoke verification](015-runtime-smoke-verification.md)                                            | B     | P1       | M        | MED  | 014               | DONE   |
| 016 | [CI / e2e consistency + pnpm coverage](016-ci-e2e-pnpm-consistency.md)                                     | E     | P1       | S        | LOW  | 015               | DONE   |
| 017 | [Deepen template AGENTS.md](017-template-agent-docs-depth.md)                                              | A     | P2       | S        | LOW  | 001               | DONE   |
| 018 | [TanStack Start family + preset](018-tanstack-start-family.md)                                             | DIR   | P2       | L        | MED  | 013               | DONE   |
| 019 | [Architecture completion final gate](019-architecture-completion-gate.md)                                  | meta  | P0       | S        | LOW  | 013–018           | DONE   |

**Plans 020–023 shipped** via [trust-wave orchestration](../.plans/completed/2026-06-24-trust-wave-orchestration.md) (2026-06-24).

**Plans 024–025** — live sandbox deployment hardening (2026-06-24, base `e125e4c`).

| #   | Plan                                                                           | Theme | Priority | Effort | Risk | Depends on | Status |
| --- | ------------------------------------------------------------------------------ | ----- | -------- | ------ | ---- | ---------- | ------ |
| 024 | [Production live demo auth + smoke alignment](024-live-demo-production-env.md) | dx    | P1       | S      | LOW  | —          | DONE   |
| 025 | [LiveFeed sync seam](025-live-feed-sync-seam.md)                               | arch  | P2       | M      | MED  | —          | DONE   |

| #   | Plan (shipped)       | Location                                                                                                                    | Status |
| --- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| 020 | Content truthfulness | [`.plans/completed/2026-06-24-trust-content-truthfulness.md`](../.plans/completed/2026-06-24-trust-content-truthfulness.md) | DONE   |
| 021 | Matrix table         | [`.plans/completed/2026-06-24-trust-matrix-table.md`](../.plans/completed/2026-06-24-trust-matrix-table.md)                 | DONE   |
| 022 | Landing primitives   | [`.plans/completed/2026-06-24-trust-landing-primitives.md`](../.plans/completed/2026-06-24-trust-landing-primitives.md)     | DONE   |
| 023 | Template security    | [`.plans/completed/2026-06-24-trust-template-security.md`](../.plans/completed/2026-06-24-trust-template-security.md)       | DONE   |

Status values: `TODO` → `IN PROGRESS` → `DONE` (or `BLOCKED` / `STALE`).

## Wave 2 (020+) — DONE

Shipped 2026-06-24. See **[trust-wave orchestration](../.plans/completed/2026-06-24-trust-wave-orchestration.md)** and four child plans in `.plans/completed/`. Historical numbering 020–023 preserved in filenames.

## Plan 009 Phase 2 — resolved

Plan 009 Phase 1 (align + drift guard) shipped earlier. **Phase 2** (extract a real shared-core seam) is **resolved** by Plan 013: `apps/cli/src/templates/_web-core/` + `sync-web-core.ts` + `repo-doctor` enforcement.

## What each plan delivers (one line)

- **001**: Trim root `AGENTS.md` (126→≤45 lines), replace duplicated CI/deploy with links, add `repo:doctor` line-budget + duplicate-CI-block checks.
- **002**: Make generated `.docs`/`.plans`/`AGENTS.md` lean and accurate (no phantom sections, parameterized package-manager commands, no JSX comments).
- **003**: Live workspace `AGENTS.md` becomes canonical; `agents:sync` script + `repo:doctor` drift check keep template copies byte-identical.
- **004**: Gate heavy e2e scaffold combo behind `SCAFFOLD_E2E=1`, drop redundant CI scaffold-verify step, slim `pkg:check`.
- **005**: Remove dead `repo:doctor:ci`, fix `docker:run` tag, delete failing `packages/common` test stub, pin `only-allow`, add `check:cli`/`check:web`/`ci:full`.
- **006**: Declare `@t3-oss/env-*` in the workspaces that import them; drop redundant root runtime deps (keep `zod`, `sharp`).
- **007**: Wrap the generation phase so a mid-pipeline failure rolls the destination back to empty/absent; resilient symlink fallback.
- **008**: Route `--dry-run` through the real pipeline into a temp dir and delete the drifted `plan-scaffold.ts`; fidelity test locks it.
- **009**: Align the `next` stub foundation to canonical web conventions + drift guard now; **Phase 2 resolved in Plan 013** (`_web-core` extraction shipped).
- **010**: Give `next` real baseline depth (env validation, error/loading/not-found, SEO, health route, tokens, README), register a truthful `next-app` preset, verify install/lint/typecheck/build.
- **011**: Remove unverifiable claims (`deployment` capability, dead `Test` column), soften `convex-product` auth claim, stop generated `next` docs claiming ungenerated presets; add an invariant test.
- **012**: New `tui` family + `tui-app` preset that scaffolds an opinionated OpenTUI terminal app FOR USERS (native dep lives only in generated projects; our CLI stays lean). Feasibility gate first, then build + verify + register.
- **013**: `_web-core` canonical source, `web-core:sync` / `--check`, repo-doctor drift gate, convex/polyglot/next alignment.
- **014**: Solana + service-api fullstack generators emit `_web-core` web boundaries; verifier expects boundary files on rust/solana web presets.
- **015**: Async runtime smoke command (HTTP boot probe) for next, backend, fullstack server, tanstack; `runtimeSmoke` matrix column.
- **016**: CI pnpm verify for next-app; tui comboCommands parity; ci-config tests document the canonical gate.
- **017**: Deeper `next/AGENTS.md`; tanstack dirs in generated agent context.
- **018**: `tanstack` family + `tanstack-start` preset (Vite, TanStack Start, Nitro, health route, full verify).
- **019**: Final format/ci/e2e/repo-doctor gate; closes architecture completion pass.

## Considered and rejected (do not re-audit)

- **`transit` task in `turbo.json`** — flagged as dead code by an audit subagent; it is an intentional Turborepo transit node enforcing topological ordering for `lint`/`check-types`. Not dead. Excluded from all plans.
- **`CLAUDE.md` as a byte duplicate of `AGENTS.md`** — it is a symlink, not a copy. The real issue (both paths injected as separate always-applied rules) is a Cursor workspace config matter, not a repo edit; the actionable lever (content bloat) is handled by Plan 001.
- **Removing root `zod`/`sharp`** — `zod` has many importers and `sharp` is used by a root-run script (`toolings/scripts/export-brand-assets.ts`); kept at root in Plan 006.
