# Generated project architecture

Generated projects should be useful immediately, but honest about what is
stable. A scaffold option is `Stable` only after the generated project passes
the advertised install, check, test, build, and capability-specific verification
matrix for every first-class route it claims to support.

## Maintainer extract (this repo)

When changing shared runtime code in the dogfood monorepo, refresh CLI templates:

```bash
bun run template:extract
bun run template:sync:check
```

Generated fullstack web must depend on `@scope/trpc` (client contract), not `@scope/server`.
`packages/trpc` re-exports from the server package — that package→app inversion is intentional.

## Core rules

- Framework entrypoints stay thin.
- Business logic belongs in services or use-cases.
- Database access belongs in repositories, queries, or DB packages/crates.
- API contracts and validation belong in DTO, schema, or contract files.
- Permission decisions belong in policies.
- Response shaping belongs in mappers.
- Services and use-cases stay framework-agnostic.
- `PATCH` means partial update.
- `PUT` means full replacement.
- Raw database objects are never returned directly as API responses.
- Split files when responsibilities mix, but avoid empty-layer ceremony in tiny
  modules.

## TypeScript fullstack layout

```text
apps/
  web/
  api/
  docs/
  worker/

packages/
  auth/
  contracts/
  db/
  env/
  ui/

tooling/
  typescript/
  testing/
```

`apps/api` owns HTTP and tRPC entrypoints. `packages/db` exists only when the
TypeScript backend owns persistence. `packages/contracts` owns data shapes that
cross app, process, or worker boundaries. `packages/env` owns typed environment
validation.

## Rust layout

```text
apps/
  web/
  docs/

services/
  api/
  indexer/
  worker-*/

crates/
  use-cases/
  domain/
  db/
  contracts/
  env/
  auth/
```

Rust services are Cargo workspace members. `services/api` owns Axum startup,
routes, extractors, and dependency wiring. Use-cases do not import Axum request
or response types. `crates/db` is the default Rust persistence owner.

Rust and TypeScript do not share one ORM package. If Rust owns persistence, web
apps and TypeScript packages talk to the Rust API or generated contracts.

## Solana layout

```text
apps/
  web/
  mobile/

programs/
  core/

packages/
  solana-client/
  solana-config/

services/
  indexer/
```

`programs/core` owns Anchor programs and IDL generation. `packages/solana-client`
is generated protocol/client code, not product business logic. Web owns web
wallet UX. Mobile owns Solana Mobile Wallet Adapter UX. Off-chain APIs and
indexers are explicit capabilities, not default clutter.
