# Plan 015: Runtime smoke verification

> **Status**: DONE — architecture completion pass Phase C  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- `generated-project-smoke.ts` — async HTTP probes (next `/api/health`, backend `/health`, fullstack server `/health` 200|503, tanstack `/api/health`)
- `GeneratedProjectCommand` includes `smoke`; `COMMAND_TIMEOUT_MS.smoke`; async `executeGeneratedCommand`
- `verify-generated-project.ts` — `--run=smoke`; combo smoke for next/backend/tanstack
- `verification-matrix.ts` — `runtimeSmoke` evidence key (`next-app`, `tanstack-start`)
- `e2e-scaffold.test.ts` — smoke in `commandsForCombo` for next/backend/tanstack

## Verification

- `bun toolings/scripts/verify-generated-project.ts --preset=tanstack-start --run=install,typecheck,lint,build,smoke` PASS
