# Changelog

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
