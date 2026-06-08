# Generated-project verification matrix

This matrix records evidence for preset support claims. A route can only be
called `Stable` after its advertised package-manager/runtime routes pass the
relevant generated-project checks.

The code-level guard lives in
`packages/registry/src/verification-matrix.ts` (re-exported by `apps/cli`).
The generated-output harness lives in
`apps/cli/src/lib/generated-project-verifier.ts` and is exposed through
`bun run verify:generated`.

## Status key

- `yes` - verified by current tests or generated-output checks.
- `no` - not yet verified.
- `n/a` - not applicable to the preset.

## Current evidence

| Preset                 | Structure | Bun | pnpm | Install | Lint | Typecheck | Test | Build | Docs/agent | Rust gates | Solana gates | Convex | Deploy |
| ---------------------- | --------- | --- | ---- | ------- | ---- | --------- | ---- | ----- | ---------- | ---------- | ------------ | ------ | ------ |
| `typescript-fullstack` | yes       | yes | yes  | yes     | yes  | yes       | no   | yes   | yes        | n/a        | n/a          | n/a    | no     |
| `rust-api`             | yes       | yes | no   | yes     | n/a  | yes       | no   | n/a   | yes        | yes        | n/a          | n/a    | no     |
| `rust-fullstack`       | yes       | yes | no   | yes     | yes  | yes       | no   | yes   | yes        | yes        | n/a          | n/a    | no     |
| `convex-product`       | yes       | yes | no   | yes     | yes  | yes       | no   | yes   | yes        | n/a        | n/a          | yes    | no     |
| `solana-program`       | yes       | yes | no   | yes     | n/a  | yes       | no   | n/a   | yes        | n/a        | yes          | n/a    | no     |
| `solana-web`           | yes       | yes | no   | yes     | yes  | yes       | no   | yes   | yes        | n/a        | yes          | n/a    | no     |
| `solana-mobile`        | yes       | yes | no   | yes     | n/a  | yes       | no   | n/a   | yes        | n/a        | yes          | n/a    | no     |
| `solana-product`       | yes       | yes | no   | yes     | yes  | yes       | no   | yes   | yes        | n/a        | yes          | n/a    | no     |
| `customize`            | no        | no  | no   | no      | no   | no        | no   | no    | no         | n/a        | n/a          | n/a    | no     |
| `experiments`          | no        | no  | no   | no      | no   | no        | no   | no    | no         | n/a        | n/a          | n/a    | no     |

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
- Fullstack combo matrix (default, hono, drizzle, sqlite, rust-axum, worker):
  `apps/cli/tests/e2e-scaffold.test.ts` and
  `bun toolings/scripts/verify-generated-project.ts --combo-matrix`.
- Agent-context output:
  `apps/cli/tests/agent-context.test.ts` and `apps/cli/tests/add.test.ts`.
- Preset support-label guard:
  `apps/cli/tests/registry.test.ts` and
  `apps/cli/tests/verification-matrix.test.ts`.

## Stable presets (2026-06)

Graduated to `Stable` in `packages/registry`: `typescript-fullstack`, `rust-api`,
`rust-fullstack`, `convex-product`, and all `solana-*` presets. Proof: e2e combo
matrix, `bun run verify:generated`, and `bun toolings/scripts/smoke-scaffold-manual.ts`.
`customize` and `experiments` remain non-stable.

## Stable graduation requirements

Before any preset becomes `Stable`, add generated-project checks that prove:

- the project can be generated from the preset and package manager;
- dependencies can be installed or the route has a documented no-install mode;
- lint/typecheck/test/build commands pass where the generated project advertises
  them;
- Rust routes pass Cargo workspace checks and Rust quality gates;
- Solana routes generate the expected Anchor/client/mobile/web boundaries and
  pass available local Solana/Anchor checks;
- Convex routes generate Next.js + `convex/` boundaries and pass Convex dev/deploy
  checks where advertised;
- deployment docs/config match the generated shape;
- generated `AGENTS.md`, `.docs`, `.plans`, and `arche.json` remain accurate.
