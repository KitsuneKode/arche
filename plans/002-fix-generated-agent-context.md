# Plan 002: Make generated agent-context lean and accurate (no phantom sections, no dup blocks, correct PM)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP condition" occurs, stop and report. When done, update this plan's row
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d199cac..HEAD -- apps/cli/src/lib/generators/agent-docs.ts apps/cli/src/render/docs/agent-context.ts apps/cli/src/lib/scaffold.ts`
> If any in-scope file changed since `d199cac`, compare the "Current state"
> excerpts to the live code; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs / dx
- **Planned at**: commit `d199cac`, 2026-06-23

## Why this matters

Every scaffolded project ships ~480 lines of agent context. Some of it is wrong or self-contradictory: the generated `.docs/README.md` advertises `capabilities/`, `reference/`, `decisions/` sections and the generated `.plans/README.md` advertises `active/`, `completed/`, `archive/` directories that the scaffolder **never creates**; the generated root `AGENTS.md` tells pnpm/npm projects to run `bun run ...`; it embeds a JSX comment (`{/* ... */}`) in Markdown; and the "Where things go" layering rules are duplicated between the generated `AGENTS.md` and `.docs/architecture/generated-project.md`. A scaffold tool whose product promise is "the project explains itself to humans and agents" (`PRODUCT.md`) cannot ship context that points at files that don't exist. This plan makes generated context accurate and smaller.

## Current state

Files:

- `apps/cli/src/lib/generators/agent-docs.ts` — builds the generated root `AGENTS.md` (`buildRootAgentsMd`, `:195-276`) and `.docs/architecture/generated-project.md` (`buildGeneratedArchitectureMd`, `:278+`). Helpers: `placementGuide` (`:60-111`), `commandsForFamily` (`:113-150`), `agentPrompt` (`:152-193`).
- `apps/cli/src/render/docs/agent-context.ts` — `renderInternalDocsIndex()` (the generated `.docs/README.md`) and `renderPlansIndex()` (the generated `.plans/README.md`). Full file is only 30 lines.
- `apps/cli/src/lib/scaffold.ts` — writes the generated context at `:912-930` (only `.docs/README.md`, `.docs/architecture/generated-project.md`, `.plans/README.md`; no subdirectories).

Problem excerpts (confirmed at `d199cac`):

Phantom `.docs` sections — generator lists 4 sections, scaffold writes 1:

```1:15:apps/cli/src/render/docs/agent-context.ts
export function renderInternalDocsIndex(): string {
  return `# Internal docs

This directory is for durable maintainer and agent context.

Do not load this whole tree by default.

## Sections

- architecture/
- capabilities/
- reference/
- decisions/
`
}
```

```912:930:apps/cli/src/lib/scaffold.ts
  // Agent context uses one canonical instruction file plus scoped internal docs.
  await writeGeneratedFile(
    destinationDir,
    'AGENTS.md',
    buildRootAgentsMd({ ...options, projectName: packageName }),
  )
  generatedFiles.push('AGENTS.md')
  await writeGeneratedClaudeSymlink(destinationDir)
  generatedFiles.push('CLAUDE.md')
  await writeGeneratedFile(destinationDir, '.docs/README.md', renderInternalDocsIndex())
  generatedFiles.push('.docs/README.md')
  await writeGeneratedFile(
    destinationDir,
    '.docs/architecture/generated-project.md',
    buildGeneratedArchitectureMd(options),
  )
```

Hardcoded `bun run` in the fullstack agent prompt (while `commandsForFamily` correctly parameterizes the PM at `:114`):

```166:170:apps/cli/src/lib/generators/agent-docs.ts
  if (config.family === 'fullstack') {
    prompts.push('Run `bun run lint`, `bun run check-types`, and `bun run build` before handoff.')
    prompts.push(
      'Update SHOWCASE.mdx when showcase content exists and significant UX changes land.',
    )
```

JSX comment in generated Markdown:

```262:262:apps/cli/src/lib/generators/agent-docs.ts
{/* These instructions are for AI agents modifying this project. */}
```

Duplicated layering rules — `placementGuide` fullstack bullets (`:96-104`) are repeated verbatim in `buildGeneratedArchitectureMd`'s "Where things go" (`:308-317` for service-API, `:351-360` for TS fullstack).

PM helper that already does the right thing (reuse it):

```113:114:apps/cli/src/lib/generators/agent-docs.ts
function commandsForFamily(config: ProjectConfig, pm: string): string[] {
  const run = pm === 'bun' ? 'bun run' : pm === 'pnpm' ? 'pnpm' : 'npm run'
```

Repo convention: there are existing generator tests — `apps/cli/tests/agent-context.test.ts` (confirm with `ls apps/cli/tests`). Model new assertions after it.

## Commands you will need

| Purpose       | Command                              | Expected |
| ------------- | ------------------------------------ | -------- |
| CLI typecheck | `bun run --cwd apps/cli check-types` | exit 0   |
| CLI lint      | `bun run --cwd apps/cli lint`        | exit 0   |
| CLI tests     | `bun test apps/cli/tests`            | all pass |
| Format check  | `bun run format:check`               | exit 0   |

## Scope

**In scope**:

- `apps/cli/src/lib/generators/agent-docs.ts`
- `apps/cli/src/render/docs/agent-context.ts`
- `apps/cli/src/lib/scaffold.ts` (only the agent-context write block `:912-930`, to create lifecycle dirs OR to trim the index — see Step 4)
- `apps/cli/tests/agent-context.test.ts` (add assertions)

**Out of scope**:

- The repo's own root `AGENTS.md` (Plan 001).
- Workspace template `AGENTS.md` files (Plan 003).
- Any change to family/preset behavior or the scaffold pipeline beyond the context writes.

## Git workflow

- Branch: `advisor/002-fix-generated-agent-context`
- Conventional commits, e.g. `fix(cli): make generated agent context accurate and lean`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Make the generated `.docs/README.md` list only what is scaffolded

In `agent-context.ts`, change `renderInternalDocsIndex()` so the "Sections" list contains only `architecture/` (the only directory the scaffold creates). Keep it ≤ 12 lines.

**Verify**: `bun run --cwd apps/cli check-types` → exit 0.

### Step 2: Either create `.plans` lifecycle dirs or soften the generated index

Two acceptable approaches — pick the simpler (A):

**(A)** In `renderPlansIndex()`, change the wording so it does not claim `active/`/`completed/`/`archive/` exist; instead say "Create `active/` when you start approved work." OR
**(B)** In `scaffold.ts` after `:929`, `mkdir` `.plans/active`, `.plans/completed`, `.plans/archive` each with a `.gitkeep`, and keep the index as-is.

Also in `agent-docs.ts` `buildRootAgentsMd` "Loading order" (`:225-231`), make step 4 say "Load one matching `.plans/active/` file **when present**" so greenfield projects aren't sent to a missing path.

**Verify**: `bun run --cwd apps/cli check-types` → exit 0.

### Step 3: Parameterize the fullstack handoff commands and remove the JSX comment

- In `agentPrompt` (`:166-170`), replace the hardcoded `bun run lint/check-types/build` line with the PM-aware form. Compute `run` the same way `commandsForFamily` does (`pm === 'bun' ? 'bun run' : pm === 'pnpm' ? 'pnpm' : 'npm run'`) — pass `pm`/`run` into `agentPrompt` (add a parameter) or inline the same expression. Result for pnpm must read `Run \`pnpm lint\`, \`pnpm check-types\`, and \`pnpm build\` before handoff.`
- In `buildRootAgentsMd` (`:262`), replace the JSX comment `{/* ... */}` with an HTML comment `<!-- These instructions are for AI agents modifying this project. -->` or remove the line.

**Verify**: `bun run --cwd apps/cli check-types` → exit 0. Then a quick scaffold smoke (Step 5) will confirm output.

### Step 4: De-duplicate the layering rules

The "Where Things Go" list in the generated `AGENTS.md` (from `placementGuide`) and the "Where things go" list in `buildGeneratedArchitectureMd` (`:308-317`, `:351-360`) are identical. Keep the list **only** in the generated `AGENTS.md`. In `buildGeneratedArchitectureMd`, replace each "Where things go" block with a one-line pointer: `See "Where Things Go" in AGENTS.md for layering rules.`

**Verify**: `bun run --cwd apps/cli check-types` → exit 0.

### Step 5: Smoke-scaffold and inspect generated output

Run a real scaffold into a temp dir for two package managers and confirm the fixes:

```bash
TMP=$(mktemp -d)
bun run dev:cli -- "$TMP/app-bun" fullstack --yes --pm=bun --no-install
bun run dev:cli -- "$TMP/app-pnpm" fullstack --yes --pm=pnpm --no-install
```

(If those exact flags differ, run `bun run dev:cli -- --help` and adapt; the goal is a non-interactive fullstack scaffold per PM.)

**Verify**:

- `grep -R "{/\*" "$TMP/app-bun/AGENTS.md"` → no matches (no JSX comment).
- `grep -c "pnpm" "$TMP/app-pnpm/AGENTS.md"` → ≥ 1 and `grep "bun run" "$TMP/app-pnpm/AGENTS.md"` → no matches in the handoff line.
- `cat "$TMP/app-bun/.docs/README.md"` lists only `architecture/`.
- Every directory named in `.docs/README.md` and `.plans/README.md` actually exists under the scaffold (`for d in $(...); do test -d ...; done`), OR the index wording no longer asserts they exist.
- Clean up: `rm -rf "$TMP"`.

## Test plan

- In `apps/cli/tests/agent-context.test.ts`, add cases:
  - `buildRootAgentsMd({...family:'fullstack', packageManager:'pnpm'})` → string contains `pnpm lint` and does NOT contain `bun run lint`.
  - `buildRootAgentsMd(...)` → does NOT contain `{/*`.
  - `renderInternalDocsIndex()` → does NOT contain `capabilities/`, `reference/`, or `decisions/`.
  - `buildGeneratedArchitectureMd({...family:'fullstack'})` → contains at most one occurrence of `Use PATCH for partial updates` across the combined AGENTS+architecture output (assert it's absent from the architecture doc).
- Verification: `bun test apps/cli/tests` → all pass including new cases.

## Done criteria

ALL must hold:

- [ ] `renderInternalDocsIndex()` lists only `architecture/`
- [ ] Generated `.plans` index / loading order no longer asserts missing dirs (or the dirs are created)
- [ ] Generated fullstack `AGENTS.md` uses the project's PM in the handoff line (verified for pnpm)
- [ ] No `{/* */}` in any generated Markdown
- [ ] Layering rules appear once (in generated `AGENTS.md`), not in the architecture doc
- [ ] `bun run --cwd apps/cli check-types` exits 0
- [ ] `bun run --cwd apps/cli lint` exits 0
- [ ] `bun test apps/cli/tests` passes with new cases
- [ ] `bun run format:check` exits 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` row updated

## STOP conditions

- The excerpts in "Current state" don't match the code at `d199cac`.
- `apps/cli/tests/agent-context.test.ts` does not exist and there is no analogous generator test to model after.
- The smoke scaffold cannot run non-interactively (flags differ and `--help` doesn't reveal an equivalent) — report the actual flags instead of guessing repeatedly.

## Maintenance notes

- Plan 003 reduces the workspace `AGENTS.md` files copied into scaffolds; the per-scaffold context size will drop further then.
- If new `.docs/` sub-sections are later generated, re-expand `renderInternalDocsIndex()` to match — keep generator and scaffold writes in lockstep (that lockstep is the root cause of this finding).
- Reviewer: confirm the architecture doc still has unique value (entry points, env vars) after removing the duplicated layering list.
