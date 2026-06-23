# Plan 017: Deepen template AGENTS.md

> **Status**: DONE — architecture completion pass Phase E  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- `templates/next/AGENTS.md` — env, health route, boundaries, commands (≤40 lines)
- Other scoped templates (`lib`, `cli`, `worker`, `mobile`, `tui`, `convex`) already at lean-but-useful bar
- `generators/agent-docs.ts` — tanstack key dirs for generated projects

## Verification

- `bun run repo:doctor:strict` exit 0 (AGENTS line budget)
