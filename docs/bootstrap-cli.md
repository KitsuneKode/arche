# Arche CLI

The bootstrap CLI lives in `apps/cli` and publishes as `@kitsunekode/arche` with
the `arche` and `create-arche` binaries.

## Run it

Published route, after release:

```sh
npx @kitsunekode/arche create my-app
bunx @kitsunekode/arche create my-app
create-arche my-app
```

Development route from this repository:

```sh
bun run dev:cli -- my-app --yes --dir=../projects
```

Use `--dir` to scaffold outside this template repository.

## Interactive flow

```sh
bun run dev:cli -- my-app --dir=../projects
```

The prompt starts with a preset-led "Starting point" menu. Stable routes will
appear first once their verification matrix is complete. Until then, target
graduated presets are labeled `Stable` in the registry; `customize` remains `Requires validation`.

## Preset examples

```sh
# TypeScript fullstack defaults
bun run dev:cli -- my-app --yes --preset=typescript-fullstack --dir=../projects

# Rust API
bun run dev:cli -- my-api --yes --preset=rust-api --dir=../projects

# Next.js web plus Rust API service
bun run dev:cli -- my-product --yes --preset=rust-fullstack --dir=../projects

# pnpm package-manager output
bun run dev:cli -- my-app --yes --preset=typescript-fullstack --pm=pnpm --dir=../projects

# Preview planned writes without creating files
bun run dev:cli -- my-app --yes --dry-run --dir=../projects
```

## Supported preset IDs

| Preset                 | Current status      | Notes                                      |
| ---------------------- | ------------------- | ------------------------------------------ |
| `typescript-fullstack` | Stable              | TypeScript monorepo (Bun + pnpm verified)  |
| `rust-api`             | Stable              | Module-first Axum API + SQLx + cargo-check |
| `rust-fullstack`       | Stable              | Next.js + `services/api` live REST demo    |
| `convex-product`       | Stable              | Next.js + Convex offline typecheck         |
| `solana-program`       | Stable              | Anchor 0.32 program + anchor build         |
| `solana-web`           | Stable              | Program + Next.js wallet adapter dApp      |
| `solana-mobile`        | Stable              | Program + Expo mobile boundary             |
| `solana-product`       | Stable              | Web + mobile + program monorepo            |
| `customize`            | Requires validation | Capability composition path                |
| `experiments`          | Experimental        | Explicit opt-in unstable route             |

## Common flags

| Flag                                  | Description                                                        |
| ------------------------------------- | ------------------------------------------------------------------ |
| `--yes`                               | Use non-interactive defaults                                       |
| `--dir=<path>`                        | Output parent directory or exact project path                      |
| `--family=<name>`                     | Legacy family selection                                            |
| `--preset=<id>`                       | Preset starting point                                              |
| `--pm=bun\|pnpm\|npm`                 | Package manager: Bun default, pnpm first-class, npm experimental   |
| `--backend=<name>`                    | Backend override for fullstack only (ignored for `convex-product`) |
| `--database=<postgres\|sqlite\|none>` | Database selection                                                 |
| `--orm=<prisma\|drizzle\|none>`       | ORM selection                                                      |
| `--showcase` / `--no-showcase`        | Keep or remove showcase content                                    |
| `--worker` / `--no-worker`            | Keep or remove worker workspace                                    |
| `--docker` / `--no-docker`            | Generate or skip Docker files                                      |
| `--ci` / `--no-ci`                    | Generate or skip GitHub Actions CI                                 |
| `--deployment=<mode>`                 | Deployment docs mode                                               |
| `--dry-run`                           | Preview planned files                                              |

## Subcommands

```sh
arche create-json '{"projectName":"my-app","destinationDir":"/tmp/my-app","family":"fullstack"}'
arche validate '{"projectName":"my-app","database":"sqlite","orm":"prisma"}'
arche add agent-docs ./my-app
arche history
arche mcp
```

`create-json` and `validate` are useful for agent/tool integration. `mcp`
starts the stdio MCP server for AI-agent usage.

## Generated context

Every generated project writes:

```text
AGENTS.md
CLAUDE.md -> AGENTS.md
.docs/README.md
.docs/architecture/generated-project.md
.plans/README.md
arche.json
```

Use `AGENTS.md` as the canonical agent instruction file. Do not add
`.cursor/rules/` or `.claude/rules/`.

## Package manager policy

Bun and pnpm are first-class. npm exists for compatibility testing but is not a
stable default. Monorepos use native catalog output:

- Bun: `package.json` `workspaces.catalog`.
- pnpm: `pnpm-workspace.yaml` `catalog:`.

Shared catalog versions come from `toolings/catalog/workspace-catalog.json`.
Root `turbo.json` is rendered (not copied) with transit nodes, optional `db:*`
tasks, and Fumadocs `mdx:generate` when the fullstack web app is included. See
[package-managers capability](../.docs/capabilities/package-managers.md).

## Publication status

The package now has local and CI package dry-run checks, but live publishing is
still disabled. See [publishing.md](./publishing.md) for the OIDC trusted
publishing route and the remaining release gates.
