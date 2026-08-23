# CLI Development Guide

This document is for developers working on the `@kitsunekode/arche` CLI itself, not for
users bootstrapping projects with the CLI.

## Overview

The CLI lives in `apps/cli` and is designed to:

1. Prompt for the **project family** (fullstack, next, backend, etc.)
2. Prompt for family-specific options (backend/database/orm for fullstack, presets for next)
3. Prompt for **feature bundles** (product, realtime, growth, infra, AI)
4. Copy the template source for the selected family
5. Apply family-specific transforms
6. Generate additional files (Docker, CI, env examples, deployment docs)
7. Optionally initialize git and install dependencies

### Family Model

The CLI uses a family-first approach. Each family represents a distinct project
archetype with its own template source, defaults, and transforms:

| Family      | Description                    | Transforms | Bundles | rename-scope |
| ----------- | ------------------------------ | ---------- | ------- | ------------ |
| `fullstack` | Full-stack TypeScript monorepo | Yes        | Yes     | Yes          |
| `next`      | Standalone Next.js app         | No         | No      | No           |
| `backend`   | API-only service               | No         | No      | No           |
| `rust`      | Axum API (module-first)        | Yes (sqlx) | No      | No           |
| `solana`    | Solana program                 | No         | No      | No           |
| `convex`    | Next.js + Convex               | No         | No      | No           |
| `worker`    | Background job worker          | No         | No      | No           |
| `lib`       | Generic TypeScript package     | No         | No      | No           |
| `cli`       | CLI package                    | No         | No      | No           |
| `mobile`    | Expo mobile app                | No         | No      | No           |
| `polyglot`  | Multi-language monorepo        | No         | No      | No           |

**Rust family** (`templates/rust/`): standalone project with `routes → handler → service → repository`.
Prompts cover database (postgres | sqlite | none), optional `posts` example module, and auth placeholder.
See `src/lib/generators/rust.ts` and `.archefiles.json`.

```bash
npx @kitsunekode/arche create my-api rust --yes --dir=/tmp/projects
cd /tmp/projects/my-api && cargo run
```

## Local Development

### Running the CLI in Development

```bash
# From repository root
bun run dev:cli -- my-test-app --yes --dir=../projects

# Or directly from apps/cli
cd apps/cli
bun run dev -- my-test-app --yes --dir=/tmp/projects
```

### Building the CLI

```bash
cd apps/cli
bun run build

# Output: apps/cli/dist/index.js
```

### Testing with `bun link`

```bash
cd apps/cli
bun run link    # Builds and links globally

# Test from anywhere
cd /tmp
npx @kitsunekode/arche create test-project --dir=/tmp/projects

# Aliases
create-arche test-project --dir=/tmp/projects
npx @kitsunekode/arche create test-project --dir=/tmp/projects
```

To unlink:

```bash
cd apps/cli
bun unlink
```

## Architecture

### File Structure

```text
apps/cli/
├── src/
│   ├── index.ts              # Entry point, family dispatch, prompts
│   ├── lib/
│   │   ├── scaffold.ts       # Core scaffolding logic (family-aware)
│   │   ├── spawn.ts          # Cross-platform subprocess execution
│   │   └── generators/
│   │       ├── index.ts      # Barrel export
│   │       ├── backend.ts    # Backend transforms (Express, Hono)
│   │       ├── database.ts   # Database transforms (SQLite, Postgres)
│   │       ├── orm.ts        # ORM transforms (Prisma, Drizzle)
│   │       ├── docker.ts     # Config-aware Docker Compose
│   │       ├── env.ts        # Config-aware .env files
│   │       ├── ci.ts         # Config-aware GitHub Actions CI
│   │       ├── deployment.ts # Config-aware deployment guide
│   │       ├── readme.ts     # Family-aware README generator
│   │       ├── agent-docs.ts # Architecture context content
│   │       └── showcase.ts   # SHOWCASE.mdx (fullstack only)
│   ├── types/
│   │   └── schemas.ts        # Zod schemas, family/bundle types, validators
│   ├── registry/             # Re-exports from packages/registry (presets)
│   └── templates/            # Shipped family templates (canonical for npm)
│       ├── fullstack/        # Minimal TS monorepo (extracted from live)
│       ├── addons/live-demo/ # Optional capability overlay
│       ├── _web-core/        # Shared Next.js foundation
│       ├── polyglot/         # Thin Turbo multi-language shell
│       └── …                 # next, backend, rust, solana, convex, …
├── tests/
│   ├── scaffold*.test.ts     # Scaffold + generator tests
│   └── e2e-scaffold.test.ts  # Combo matrix
├── dist/                     # Built CLI bundle (templates stay under src/)
├── package.json
└── tsconfig.json
```

Preset status and verification evidence live in `packages/registry` — see
`.docs/product/cli-capability-registry.md`. Families remain the template copy
unit; presets compose verified option sets on top.

### Key Design Decisions

1. **Node.js Compatible**: The CLI targets Node.js for maximum npm compatibility.
   Uses `child_process.spawnSync` instead of `Bun.spawnSync`.

2. **Single-File Bundle**: Dependencies are bundled into `dist/index.js` for
   faster installs and no version conflicts. Templates ship as `src/templates/`.

3. **Family + Preset Model**: Zod schemas in `src/types/schemas.ts` define
   families/bundles; `packages/registry` owns preset stability evidence.

4. **Live-canonical templates**: Dogfood `apps/*` / `packages/*` are edited first;
   `bun run template:extract` refreshes fullstack + live-demo addon trees.

5. **Oxfmt Formatting**: All source files are formatted with oxfmt. Run
   `bun run format` to format, `bun run format:check` to verify.

## Adding a New Family

1. Add the family name to `FamilySchema` in `src/types/schemas.ts`
2. Add labels and helper functions (`hasBackendOptions`, etc.)
3. Add the family to the prompt options in `src/index.ts`
4. Add template source under `apps/cli/src/templates/{family}/` (with
   `.archefiles.json` when selective copy is needed) or implement transforms
   in the scaffold pipeline
5. Register the preset in `packages/registry` with verification evidence before
   labeling it Stable
6. Add family-specific generator content in `readme.ts` and `agent-docs.ts`
7. Add a cleanup target if needed
8. Add scaffold coverage under `apps/cli/tests/`

## Adding a New Feature Bundle

1. Add the bundle name to `BundleSchema` in `src/types/schemas.ts`
2. Add labels to `BUNDLE_LABELS`
3. Add bundle-specific transforms in the scaffold pipeline
4. Add bundle-specific generated content in generators

## Testing

```bash
cd tests
bun test

# Run just the CLI tests
bun test src/cli/create-arche.test.ts
```

### Test Structure

- `src/cli/create-arche.test.ts` — Schema tests, family-aware generator
  output tests, and scaffold smoke tests (fullstack + backend)
- `src/toolings/` — Repo tooling script tests
- `src/integration/` — Runtime integration tests (in progress)

## Publishing to npm

Live publishing is not enabled from this repository yet. Use the package checks
first, then follow [publishing.md](./publishing.md) for the OIDC trusted
publishing route.

```bash
bun run pkg:check
bun run verify:generated
```

Do not publish with a long-lived `NPM_TOKEN`. The intended release path is npm
Trusted Publishing from GitHub Actions OIDC after the generated-project matrix
is complete.

### Version Strategy

- **Patch** (0.1.x): Bug fixes, documentation
- **Minor** (0.x.0): New features, new families, new options
- **Major** (x.0.0): Breaking changes to CLI interface or generated output

## Debugging

```bash
# See what files would be generated
bun run dev -- my-app --yes 2>&1 | head -50
```

### Common Issues

1. **"Destination directory is not empty"**: The CLI refuses to overwrite
   existing directories. Delete or use a new name.

2. **"Command failed: bun install"**: Bun must be installed in the target
   environment for post-scaffold install.

3. **Path resolution errors**: Ensure you're running from the monorepo root
   or the `apps/cli` directory.

## Roadmap

### Current (2026)

- [x] Family-first CLI architecture (11 families defined)
- [x] Canonical AGENTS.md, CLAUDE.md symlink, and scoped `.docs`/`.plans` context output
- [x] Feature bundle system (product, realtime, growth, infra, AI)
- [x] Oxfmt formatting standard
- [x] Scaffold smoke tests (fullstack + backend)
- [ ] Per-family template sources
- [ ] CI + pre-commit fully migrated to oxfmt

### Next

- [ ] Oxlint linting standard (replace ESLint)
- [ ] Fumadocs docs for monorepo family
- [ ] Example templates (todo, chat, game)
- [ ] `arche add` command for augmenting existing projects

## Related Documentation

- [template-variants.md](./template-variants.md) — Family definitions
- [architecture.md](./architecture.md) — Cross-workspace dependencies
- [master-plan.md](./master-plan.md) — Current build direction
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — Progress tracking
