# Plan 013: `_web-core` single source + sync script

> **Status**: DONE — architecture completion pass Phase A  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- `apps/cli/src/templates/_web-core/` — shared `versions.json`, `next.config.js`, App Router boundaries, style tokens, `.oxlintrc.json`, `tsconfig.standalone.json`
- `apps/cli/src/lib/web-core.ts` — read helpers for generators
- `toolings/scripts/sync-web-core.ts` — default sync + `--check` (semantic tsconfig compare)
- Root scripts `web-core:sync` / `web-core:sync:check`; `checkWebCoreSync()` in `repo-doctor`
- Targets: `next`, `convex`, `fullstack/apps/web` (styles only), `polyglot/apps/web`
- `_`‑prefixed template families excluded from scaffold output
- Tests: `tests/src/toolings/sync-web-core.test.ts`, extended `web-core-conventions.test.ts`

## Verification

- `bun run web-core:sync:check` exit 0
- `bun run repo:doctor:strict` exit 0
- `bun test apps/cli/tests` green
