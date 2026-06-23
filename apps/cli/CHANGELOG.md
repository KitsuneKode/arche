# Changelog

## 0.2.0

### Minor Changes

- d199cac: Teach dual-path tRPC in fullstack scaffolds (`trpc/caller.ts` for in-process RSC, HTTP proxy in `trpc/server.tsx`), document the pattern in generated agent context, and remove `trpc.hello!` non-null assertions from the homepage demo.

  Harden combo-matrix verification with per-combo timeouts, serial e2e in CI (`SCAFFOLD_E2E_SERIAL`), and a Hono homepage copy regression test. Re-export `createCaller` from generated `packages/trpc` for Express presets.

## 0.1.0

First public release of `@kitsunekode/arche`.

### Added

- Package-owned scaffolding templates included in the published CLI tarball.
- TypeScript fullstack scaffold with Next.js, Express, tRPC, Better Auth, Prisma/Drizzle, Docker, CI, and agent context.
- Connected fullstack homepage that calls the generated tRPC backend contract.
- Rust API and Rust-backed fullstack presets with service-owned backend boundaries.
- Polyglot scaffold with web/API/worker workspaces and REST health integration.
- Solana, Convex, Next.js, backend, worker, library, CLI, and mobile scaffold families.
- Shell completions, scaffold history, reproducible `arche.json`, generated docs, and release verification scripts.

### Fixed

- Removed stale tRPC/Prisma/Auth artifacts from service-backed fullstack output.
- Pruned unused frontend packages from the default fullstack scaffold.
- Aligned local web API defaults on `http://localhost:3001`.
- Prevented local deploy artifacts, secret env files, build output, and package-manager residue from leaking into generated projects.
- Added generated-project install/typecheck/build verification for release safety.
