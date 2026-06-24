# Generated-project verification matrix

This matrix records evidence for preset support claims. A route is labeled **Stable**
only when `presetHasStableEvidence` passes for that preset in
`packages/registry/src/verification-matrix.ts` — route-specific columns, not every
column in the table below.

The code-level guard is re-exported by `apps/cli`. The generated-output harness lives in
`apps/cli/src/lib/generated-project-verifier.ts` (`bun run verify:generated`).

## Status key

- `yes` — verified by current tests or generated-output checks.
- `no` — not verified for this preset.
- `n/a` — column does not apply to this preset (omitted on the public site table when no preset has `yes`).

## Current evidence

| Preset                 | Structure | Bun | pnpm | Install | Lint | Typecheck | Build | Docs | Agent | Rust | Solana | Convex | TUI | Smoke |
| ---------------------- | --------- | --- | ---- | ------- | ---- | --------- | ----- | ---- | ----- | ---- | ------ | ------ | --- | ----- |
| `typescript-fullstack` | yes       | yes | yes  | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | n/a    | n/a    | n/a | n/a   |
| `next-app`             | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | n/a    | n/a    | n/a | yes   |
| `rust-api`             | yes       | yes | no   | no      | no   | no        | no    | yes  | yes   | yes  | n/a    | n/a    | n/a | n/a   |
| `rust-fullstack`       | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | yes  | n/a    | n/a    | n/a | n/a   |
| `convex-product`       | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | n/a    | yes    | n/a | n/a   |
| `solana-program`       | yes       | yes | no   | yes     | no   | yes       | no    | yes  | yes   | n/a  | yes    | n/a    | n/a | n/a   |
| `solana-web`           | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | yes    | n/a    | n/a | n/a   |
| `solana-mobile`        | yes       | yes | no   | yes     | no   | yes       | no    | yes  | yes   | n/a  | yes    | n/a    | n/a | n/a   |
| `solana-product`       | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | yes    | n/a    | n/a | n/a   |
| `tui-app`              | yes       | yes | no   | yes     | no   | yes       | yes   | yes  | yes   | n/a  | n/a    | n/a    | yes | n/a   |
| `tanstack-start`       | yes       | yes | no   | yes     | yes  | yes       | yes   | yes  | yes   | n/a  | n/a    | n/a    | n/a | yes   |
| `customize`            | no        | no  | no   | no      | no   | no        | no    | no   | no    | n/a  | n/a    | n/a    | n/a | n/a   |
| `experiments`          | no        | no  | no   | no      | no   | no        | no    | no   | no    | n/a  | n/a    | n/a    | n/a | n/a   |

## Stable presets (2026-06)

Graduated in `packages/registry` when `presetHasStableEvidence` is true:

`typescript-fullstack`, `next-app`, `rust-api`, `rust-fullstack`, `convex-product`,
`solana-program`, `solana-web`, `solana-mobile`, `solana-product`, `tui-app`,
`tanstack-start`.

`customize` and `experiments` remain non-stable.

## Stable graduation (code guard)

`presetHasStableEvidence` checks **route-specific** column subsets — for example
`rust-api` does not require JS monorepo Install/Lint/Build columns. See
`packages/registry/src/verification-matrix.ts` for the exact key lists per preset.

Before any new preset becomes `Stable`, add generated-project checks that prove
the columns your route advertises, then extend `presetHasStableEvidence`.

## Current proof sources

- TypeScript fullstack structure and Bun/pnpm catalog output:
  `apps/cli/tests/workspace-output.test.ts`.
- Standalone JavaScript package-manager pinning:
  `apps/cli/tests/workspace-output.test.ts`.
- Rust API structure:
  `apps/cli/tests/rust-scaffold.test.ts`.
- Rust-backed fullstack structure and Cargo workspace:
  `apps/cli/tests/preset-scaffold.test.ts`.
- Rust generated Cargo workspace check:
  `bun run verify:generated -- --preset=rust-api,rust-fullstack --run=cargo-check`.
- Convex product structure and agent context:
  `apps/cli/tests/convex-preset.test.ts`.
- Solana program/web/mobile/product structure and Bun workspace output:
  `apps/cli/tests/solana-preset.test.ts`.
- Solana generated Anchor build:
  `bun run verify:generated -- --preset=solana-program,solana-web,solana-mobile,solana-product --run=anchor-build`.
- Curated generated-project structure verification harness:
  `apps/cli/tests/generated-project-verifier.test.ts` and
  `bun run verify:generated`.
- Fullstack combo matrix:
  `apps/cli/tests/e2e-scaffold.test.ts` and
  `bun toolings/scripts/verify-generated-project.ts --combo-matrix`.
- Agent-context output:
  `apps/cli/tests/agent-context.test.ts` and `apps/cli/tests/add.test.ts`.
- Preset support-label guard:
  `packages/registry/tests/truthfulness.test.ts`.
