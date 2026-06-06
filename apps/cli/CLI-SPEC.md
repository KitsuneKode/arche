# Arche CLI — Portfolio extension spec

## Context

The Arche CLI (`apps/cli`, `@kitsunekode/arche`, `npx @kitsunekode/arche create`) bootstraps projects from this monorepo. This spec describes portfolio integration with [kitsunekode.in](https://kitsunekode.in).

## Portfolio-ready output

When scaffolding fullstack with `--showcase`:

1. **`SHOWCASE.mdx`** — plain markdown + frontmatter (no custom component imports)
2. **`package.json#portfolio`** — type, tags, featured flag
3. **`arche.json`** — reproducible command + choices

See [docs/portfolio-sync.md](../../docs/portfolio-sync.md).

## CLI flow

```
$ npx @kitsunekode/arche create my-project fullstack

? Include showcase landing routes and demo content? (y/N)
? Include the background worker workspace? (y/N)
? Package manager › bun

Scaffolding my-project...
  ✓ arche.json
  ✓ SHOWCASE.mdx (when showcase enabled)
  ✓ portfolio metadata in package.json
```

## Families

| Family                                                   | Description                      | Transforms / bundles    |
| -------------------------------------------------------- | -------------------------------- | ----------------------- |
| fullstack                                                | Monorepo (Next + Express + tRPC) | Full pipeline + bundles |
| next                                                     | Standalone Next.js               | Stub template           |
| backend                                                  | API-only                         | Stub template           |
| rust, solana, convex, worker, lib, cli, mobile, polyglot | Specialized stubs                | Copy manifest only      |

## Status

- Implemented: `SHOWCASE.mdx` generator, portfolio metadata, `--showcase` flag
- Planned: optional GitHub Action for portfolio revalidation webhook
