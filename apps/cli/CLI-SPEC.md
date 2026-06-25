# Arche CLI — Portfolio extension spec

## Context

The Arche CLI (`apps/cli`, `@kitsunekode/arche`, `npx @kitsunekode/arche create`) bootstraps projects from this monorepo. This spec describes portfolio integration with [kitsunekode.in](https://kitsunekode.in).

## Portfolio-ready output

Default `fullstack` scaffolds are **minimal** (core stack only: Next.js, Express, tRPC, Better Auth, Prisma). Optional capabilities:

| Flag          | What it adds                                                            |
| ------------- | ----------------------------------------------------------------------- |
| `--live-demo` | Interactive `/live` sandbox (Relay Run, chat, proof ladder, guest auth) |
| `--showcase`  | `SHOWCASE.mdx` portfolio metadata (not runtime demo code)               |
| `--worker`    | Background worker workspace                                             |

The dogfood site in this repo (`apps/web`) is a rich landing/docs/preview surface. Generated projects do not inherit marketing routes unless you add them.

When scaffolding fullstack with `--showcase`:

1. **`SHOWCASE.mdx`** — plain markdown + frontmatter (no custom component imports)
2. **`package.json#portfolio`** — type, tags, featured flag
3. **`arche.json`** — reproducible command + choices

See [docs/portfolio-sync.md](../../docs/portfolio-sync.md).

## CLI flow

```
$ npx @kitsunekode/arche create my-project fullstack

? Include interactive live demo (/live, Relay Run, chat)? (y/N)
? Include showcase portfolio metadata (SHOWCASE.mdx)? (y/N)
? Include the background worker workspace? (y/N)
? Package manager › bun

Scaffolding my-project...
  ✓ arche.json
  ✓ minimal core (default)
  ✓ live-demo addon (when --live-demo)
  ✓ SHOWCASE.mdx (when showcase enabled)
```

## Families

| Family                                                   | Description                      | Transforms / bundles    |
| -------------------------------------------------------- | -------------------------------- | ----------------------- |
| fullstack                                                | Monorepo (Next + Express + tRPC) | Full pipeline + bundles |
| next                                                     | Standalone Next.js               | First-class baseline    |
| tanstack                                                 | TanStack Start (Vite + Nitro)    | Copy manifest only      |
| tui                                                      | Terminal UI (OpenTUI + React)    | Copy manifest only      |
| backend                                                  | API-only                         | Baseline service stub   |
| rust, solana, convex, worker, lib, cli, mobile, polyglot | Specialized templates            | Copy manifest only      |

## Status

- Implemented: `SHOWCASE.mdx` generator, portfolio metadata, `--showcase` flag
- Planned: optional GitHub Action for portfolio revalidation webhook
