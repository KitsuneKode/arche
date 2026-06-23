# Plan 018: TanStack Start family + preset

> **Status**: DONE — architecture completion pass Phase F  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- `tanstack` family + `tanstack-start` preset (schema, registry, display, verification-matrix)
- `apps/cli/src/templates/tanstack/` — Vite + TanStack Start + Nitro, file routes, `GET /api/health`, committed `routeTree.gen.ts`
- Verifier: preset case, family combo, `EXPECTED_FILES`, smoke probe
- `CLI-SPEC.md` families table updated

## Feasibility

- Template `bun install && bun run build` green before registration
- Generated verify: install/lint/typecheck/build/smoke green

## Verification

- `SCAFFOLD_E2E=1` tanstack combo green
