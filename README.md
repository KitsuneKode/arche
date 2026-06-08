<p align="center">
  <a href="https://arche.kitsunelabs.xyz">
    <img src="docs/assets/readme-banner.png" alt="Arche — project origin system" width="1200" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/KitsuneKode/arche/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/KitsuneKode/arche/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
  <img src="https://img.shields.io/badge/package%20manager-Bun-default?logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/release-guarded-orange" alt="Release guarded" />
  <img src="https://img.shields.io/badge/presets-requires%20validation-yellow" alt="Preset status" />
</p>

<p align="center">
  <strong>Project origin system</strong> — personal scaffold CLI and template vault for TypeScript monorepos, Rust services, and Solana foundations.
</p>

<p align="center">
  <a href="https://arche.kitsunelabs.xyz">Site</a> ·
  <a href="https://github.com/KitsuneKode/arche">GitHub</a> ·
  <a href="docs/README.md">Docs</a> ·
  <a href="docs/bootstrap-cli.md">CLI</a>
</p>

---

Arche is KitsuneKode’s preset-led way to start real projects without re-wiring the boring parts: workspace shape, package-manager catalogs, agent context, deployment notes, and a reproducible `arche.json`. It began as a full-stack TypeScript template and is now a vault plus `@kitsunekode/arche` CLI.

**Honest status:** foundations are implemented; preset promotion to “stable” waits on the [verification matrix](.docs/product/verification-matrix.md). No preset is marketed as production-ready until that matrix passes.

## Use the CLI (the fun part)

Published route (after npm release):

```sh
npx @kitsunekode/arche create my-app
# or
bunx @kitsunekode/arche create my-app
```

From this repository while developing:

```sh
bun run dev:cli -- my-app --yes --dir=../projects
```

Scaffold **outside** this template repo when writing real output.

```mermaid
flowchart LR
  dev[Developer] --> cli["arche create"]
  cli --> copy[Template copy]
  copy --> turbo[Rendered turbo.json]
  copy --> ctx[AGENTS.md + arche.json]
  ctx --> app[Your monorepo]
```

### Terminal block (matches the site)

```sh
bun run dev:cli -- my-app --yes --preset=typescript-fullstack --dir=../projects
```

More examples:

```sh
# Interactive
bun run dev:cli -- my-app --dir=../projects

# Rust API
bun run dev:cli -- my-api --yes --preset=rust-api --dir=../projects

# pnpm catalogs
bun run dev:cli -- my-app --yes --preset=typescript-fullstack --pm=pnpm --dir=../projects

# Dry run
bun run dev:cli -- my-app --yes --dry-run --dir=../projects
```

## Presets (pick your fighter)

| Preset                 | Status              | Output today                          |
| ---------------------- | ------------------- | ------------------------------------- |
| `typescript-fullstack` | Stable              | Next.js + TypeScript API monorepo     |
| `rust-api`             | Stable              | Axum API, module-first layout         |
| `rust-fullstack`       | Stable              | Next.js web + `services/api` Rust API |
| `convex-product`       | Stable              | Next.js + Convex backend              |
| `solana-program`       | Stable              | Anchor 0.32 program + TS client       |
| `solana-web`           | Stable              | Web dApp + wallet adapters            |
| `solana-mobile`        | Stable              | Expo + mobile wallet boundary         |
| `solana-product`       | Stable              | Web + mobile + program monorepo       |
| `customize`            | Requires validation | Explicit composition                  |
| `experiments`          | Experimental        | Opt-in unstable routes                |

## Repository layout

```mermaid
flowchart TB
  subgraph apps [apps]
    cli[cli — @kitsunekode/arche]
    web[web — docs + design lab]
    server[server — API template]
    worker[worker — optional jobs]
  end
  subgraph packages [packages]
    auth[auth]
    store[store]
    trpc[trpc]
    ui[ui]
  end
  cli --> apps
  cli --> packages
```

```text
apps/
  cli/       @kitsunekode/arche CLI
  web/       documentation / marketing + design lab
  server/    TypeScript API template source
  worker/    optional worker template

packages/
  auth/  backend-common/  store/  trpc/  ui/

toolings/
  catalog/   workspace-catalog.json
  scripts/   repo maintenance + brand:export
```

## Development

```sh
bun install
bun run dev:cli -- my-app --yes --dir=/tmp/arche-output
bun test apps/cli/tests
bun run verify:generated
bun run ci
bun run brand:export   # README banner, GitHub icons, OG (needs web build)
```

## Docs grid

| Topic                      | Link                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| Doc index                  | [docs/README.md](docs/README.md)                                             |
| CLI reference              | [docs/bootstrap-cli.md](docs/bootstrap-cli.md)                               |
| Commands                   | [docs/commands.md](docs/commands.md)                                         |
| Deployment hub             | [docs/deployment.md](docs/deployment.md)                                     |
| Env matrix                 | [docs/deployment-env.md](docs/deployment-env.md)                             |
| Verification matrix        | [.docs/product/verification-matrix.md](.docs/product/verification-matrix.md) |
| Rebranding / GitHub assets | [docs/rebranding.md](docs/rebranding.md)                                     |

## Design lab (not a secret base)

Unlinked previews live at `/__design-lab` — `noindex`, excluded from the sitemap, not auth-gated. Fine for experiments; don’t treat it as private infrastructure.

---

<p align="center">
  Built by <a href="https://kitsunekode.in">KitsuneKode</a> ·
  <a href="https://arche.kitsunelabs.xyz">arche.kitsunelabs.xyz</a>
</p>
