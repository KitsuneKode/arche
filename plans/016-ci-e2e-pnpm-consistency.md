# Plan 016: CI / e2e consistency + pnpm coverage

> **Status**: DONE — architecture completion pass Phase D  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- CI: `Verify next-app with pnpm` (`--preset=next-app --pm=pnpm --run=install,build`)
- `comboCommands()` tui parity — `install,typecheck,build` (no lint mismatch vs e2e harness)
- `ci-config.test.ts` — asserts pnpm step and documents combo-matrix as CI gate (no `SCAFFOLD_E2E` on that step)

## Verification

- `bun test apps/cli/tests/ci-config.test.ts` green
- `bun run ci:min` green
