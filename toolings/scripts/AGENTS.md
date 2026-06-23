# Tooling Scripts Notes

## Purpose

`toolings/scripts` holds one-off repo utility scripts.

## Read First

- `README.md`
- `rename-scope.ts`

## Owns

- scope migration from `@arche-template/*` to the root package name, including package metadata, imports, Turbo filters, Dockerfiles, and config files
- repo redundancy and drift auditing
- sync of canonical workspace `AGENTS.md` into the fullstack template (`sync-template-agents.ts`)
- staged secret scan for Husky (`gitleaks-staged.sh`; requires gitleaks CLI)
- static OG export from dynamic route (`export-og-image.ts`; `bun run brand:export-og`)
- start-fresh cleanup automation
- lint and typecheck coverage for repo maintenance scripts

## Common Tasks

- preview scope replacement:
  `bun run rename-scope:dry`
- apply scope replacement:
  `bun run rename-scope`
- explicit source/target scope:
  `bun toolings/scripts/rename-scope.ts --from @arche-template --to @acme`
- audit stale scaffolding and drift:
  `bun run repo:doctor`
- keep fullstack template AGENTS.md in sync:
  `bun run agents:sync:check`, `bun run agents:sync`
- strip template baggage from a cloned project:
  `bun run template:clean:dry`, `bun run template:clean`
- inspect replacement behavior:
  `rename-scope.ts`, `repo-doctor.ts`, `template-cleanup.ts`

## Notes

- These are bootstrap tools, not runtime dependencies.
- They are especially relevant right after cloning the template.

## Update When

Update this file when repo bootstrap scripts are added, removed, or renamed.
