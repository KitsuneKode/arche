# Public docs

These docs explain how to use this repository and the Arche scaffold CLI.
Agents should start with root [AGENTS.md](../AGENTS.md), then use this index
for public/user-facing docs and [`.docs/README.md`](../.docs/README.md) for
internal architecture context.

## CLI

| Need                       | Doc                                            |
| -------------------------- | ---------------------------------------------- |
| Create projects with Arche | [bootstrap-cli.md](./bootstrap-cli.md)         |
| Repository commands        | [commands.md](./commands.md)                   |
| CLI development internals  | [cli-development.md](./cli-development.md)     |
| Package/publish readiness  | [publishing.md](./publishing.md)               |
| Branding/repo rename       | [rebranding.md](./rebranding.md)               |
| Portfolio `SHOWCASE.mdx`   | [portfolio-sync.md](./portfolio-sync.md)       |
| Template variants          | [template-variants.md](./template-variants.md) |

## App template operations

| Need                     | Doc                                                        |
| ------------------------ | ---------------------------------------------------------- |
| Deployment hub           | [deployment.md](./deployment.md)                           |
| Production playbook      | [production-playbook.md](./production-playbook.md)         |
| Environment matrix       | [deployment-env.md](./deployment-env.md)                   |
| CI                       | [ci.md](./ci.md)                                           |
| CI coverage gaps         | [ci-gaps.md](./ci-gaps.md)                                 |
| Secrets hygiene          | [security-secrets.md](./security-secrets.md)               |
| Vercel                   | [deployment-vercel.md](./deployment-vercel.md)             |
| Vercel (Arche reference) | [deployment-vercel-arche.md](./deployment-vercel-arche.md) |
| Render                   | [deployment-render.md](./deployment-render.md)             |
| Railway                  | [deployment-railway.md](./deployment-railway.md)           |
| Local env                | [env.md](./env.md)                                         |
| Architecture             | [architecture.md](./architecture.md)                       |
| Troubleshooting          | [troubleshooting.md](./troubleshooting.md)                 |

Historical docs live in [archive/](./archive/). Planning-era docs are not
current implementation sources.

## Workspace map

- `apps/cli` - `@kitsunekode/arche` scaffold CLI.
- `apps/web` - Next.js documentation/marketing app plus hidden design lab.
- `apps/server` - TypeScript API template source.
- `apps/worker` - optional worker template source.
- `packages/auth` - Better Auth template package.
- `packages/store` - Prisma/store template package.
- `packages/trpc` - client contract template package.
- `packages/backend-common` - env, logging, Redis helpers.
- `packages/ui` - shared UI components.
- `toolings/*` - shared config and repo scripts.

Target generated-project layouts, including future API, database-package,
Rust-service, and Solana-program naming, are tracked in
[`.docs/architecture/generated-projects.md`](../.docs/architecture/generated-projects.md).

## Quick commands

```sh
bun install
bun dev
bun run dev:cli -- my-app --yes --dir=../projects
bun test apps/cli/tests
bun run verify:generated
bun run repo:doctor
```
