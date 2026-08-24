import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

function usesServiceApi(config: ProjectConfig): boolean {
  return (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  )
}

function keyDirs(config: ProjectConfig): string[] {
  const { family, includeWorker } = config
  const dirs: string[] = []

  if (family === 'fullstack') {
    dirs.push('`apps/web` — Next.js frontend')
    if (usesServiceApi(config)) {
      dirs.push('`services/api` — Service-owned backend')
    } else {
      dirs.push('`apps/server` — API server')
      dirs.push('`packages/auth` — Better Auth configuration')
      dirs.push('`packages/store` — Database schema and client')
      dirs.push('`packages/common` — Shared TypeScript helpers')
    }
    if (includeWorker) dirs.push('`apps/worker` — Background job processing')
  } else if (family === 'next') {
    dirs.push('`app` — Next.js App Router pages and boundaries')
    dirs.push('`components` — Reusable React components')
    dirs.push('`env.ts` — Validated public environment variables')
  } else if (family === 'backend') {
    dirs.push('`src` — API source')
  } else if (family === 'convex') {
    dirs.push('`app` — Next.js App Router pages')
    dirs.push('`convex` — Convex functions and schema')
  } else if (family === 'rust') {
    dirs.push('`src/app.rs` — Axum router composition')
    dirs.push(
      '`src/modules/<feature>/` — routes, handler, service, repository, dto, mapper, policy',
    )
    dirs.push('`src/common` patterns live in `error.rs`, `config.rs`, `state.rs`, `middleware/`')
    dirs.push('`migrations/` — SQL migrations (when sqlx enabled)')
  } else if (family === 'worker') {
    dirs.push('`src` — Worker source')
    dirs.push('`src/queue.ts` — Queue definitions')
  } else if (family === 'lib') {
    dirs.push('`src` — Package source')
  } else if (family === 'cli') {
    dirs.push('`src` — CLI source')
    dirs.push('`CHANGELOG.md` — Release notes')
  } else if (family === 'tui') {
    dirs.push('`src/index.tsx` — Renderer bootstrap')
    dirs.push('`src/app.tsx` — Root TUI component')
  } else if (family === 'tanstack') {
    dirs.push('`src/routes` — File-based TanStack Router routes')
    dirs.push('`src/routes/api/health.ts` — Deploy health endpoint')
  } else if (family === 'solana') {
    dirs.push('`programs/core` — Anchor program')
    dirs.push('`packages/solana-config` — Cluster and program constants')
    dirs.push('`packages/solana-client` — IDL/client boundary for apps')
    if (config.preset === 'solana-web' || config.preset === 'solana-product') {
      dirs.push('`apps/web` — Next.js dApp and wallet adapter boundary')
    }
    if (config.preset === 'solana-mobile' || config.preset === 'solana-product') {
      dirs.push('`apps/mobile` — Expo app and mobile wallet adapter boundary')
    }
  } else if (family === 'mobile') {
    dirs.push('`app` — Expo Router screens')
    dirs.push('`components` — Reusable components')
  }

  return dirs
}

function placementGuide(config: ProjectConfig): string[] {
  if (config.family === 'rust') {
    return [
      '`routes.rs` wires paths and methods only.',
      '`handler.rs` owns framework extraction and response conversion.',
      '`service.rs` owns business rules and stays framework-agnostic.',
      '`repository.rs` owns SQLx/database access.',
      '`dto.rs`, `mapper.rs`, and `policy.rs` own contracts, response shaping, and permission checks.',
    ]
  }

  if (config.family === 'solana') {
    return [
      'Program instructions and accounts go in `programs/core/src/lib.rs` until the program needs modules.',
      'Cluster/program IDs go in `packages/solana-config`; app code should not duplicate them.',
      'IDL and transaction/client helpers go in `packages/solana-client`.',
      'Wallet UI stays in the app (`apps/web` or `apps/mobile`); program logic stays out of UI components.',
      'Add indexers, APIs, or workers only as explicit services when the product needs them.',
    ]
  }

  if (config.family === 'fullstack') {
    const serverRoot = usesServiceApi(config)
      ? '`services/api`'
      : '`apps/server/src/modules/<feature>`'
    return [
      `Feature code belongs in ${serverRoot}; keep framework entrypoints thin.`,
      'Business logic belongs in services/use-cases, not route handlers.',
      'Database access belongs in repositories/queries.',
      'API contracts and validation belong in DTO/schema files.',
      'Permission decisions belong in policies; response shaping belongs in mappers.',
      'Use PATCH for partial updates. Use PUT only for full replacement.',
      'Do not return raw database objects directly; map them into response DTOs.',
    ]
  }

  return [
    'Keep entrypoints thin and move reusable behavior into focused modules.',
    'Split files when validation, persistence, permissions, or response shaping start mixing.',
  ]
}

function commandsForFamily(config: ProjectConfig, pm: string): string[] {
  const run = pm === 'bun' ? 'bun run' : pm === 'pnpm' ? 'pnpm' : 'npm run'

  const cmds: string[] = [
    `- \`${pm} dev\` — Start development`,
    `- \`${run} build\` — Build all packages`,
    `- \`${run} lint\` — Lint all packages`,
    `- \`${run} check-types\` — Type check all packages`,
  ]

  if (config.family === 'fullstack' && !usesServiceApi(config) && config.database !== 'none') {
    cmds.push(`- \`${run} db:generate\` — Generate database client`)
    cmds.push(`- \`${run} db:migrate\` — Run database migrations`)
  }

  if (config.family === 'rust') {
    return [
      '- `cargo run` — Start API',
      '- `cargo test` — Tests',
      '- `cargo fmt` — Format',
      '- `cargo clippy -- -D warnings` — Lint',
      '- `sqlx migrate run` — Apply migrations (when database enabled)',
    ]
  }

  if (config.family === 'solana') {
    return [
      `- \`${pm} install\` — Install JavaScript workspace dependencies`,
      `- \`${run} build\` — Build generated apps/packages`,
      `- \`${run} lint\` — Lint generated apps/packages`,
      `- \`${run} check-types\` — Type check generated apps/packages`,
      '- `anchor build` — Build Anchor program',
      '- `anchor test` — Run Anchor tests when local validator tooling is available',
    ]
  }

  return cmds
}

function packageManagerRun(pm: string): string {
  return pm === 'bun' ? 'bun run' : pm === 'pnpm' ? 'pnpm' : 'npm run'
}

function agentPrompt(config: ProjectConfig, pm: string): string[] {
  const prompts: string[] = [
    'Before making changes, read the relevant files listed under Key Directories.',
    'Update the relevant .docs topic and this AGENTS.md when adding new endpoints, packages, or auth flows.',
  ]

  if (config.family === 'rust') {
    prompts.push(
      'New features: add `src/modules/<name>/` with routes → handler → service → repository; keep handlers thin.',
    )
    prompts.push('Never return `model` structs from handlers — map to DTOs in `mapper.rs`.')
    prompts.push('PATCH DTOs use `Option` fields; reject empty patches in the service layer.')
  }

  if (config.family === 'fullstack') {
    const run = packageManagerRun(pm)
    prompts.push(
      `Run \`${run} lint\`, \`${run} check-types\`, and \`${run} build\` before handoff.`,
    )
    prompts.push(
      'Update SHOWCASE.mdx when showcase content exists and significant UX changes land.',
    )
    if (usesServiceApi(config)) {
      prompts.push(
        'When adding service API routes: keep handlers thin, validate DTOs at the boundary, and update the web health/status integration when the contract changes.',
      )
    } else {
      prompts.push(
        'When adding a new tRPC procedure: create the feature router and compose it in `apps/server/src/modules/trpc/app.router.ts`.',
      )
      if (config.database !== 'none') {
        prompts.push(
          'When modifying the Prisma schema: run db:generate and db:migrate, then update the store docs.',
        )
      }
    }
  }

  if (config.family === 'solana') {
    prompts.push('Run `anchor build` after program changes when Anchor is available locally.')
    prompts.push('Keep wallet adapter setup in apps; keep program/client constants in packages.')
  }

  return prompts
}

export function buildRootAgentsMd(config: ProjectConfig): string {
  const name = sanitizeProjectName(config.projectName)
  const pm = config.packageManager ?? 'bun'
  const dirs = keyDirs(config)
  const cmds = commandsForFamily(config, pm)
  const prompts = agentPrompt(config, pm)
  const placements = placementGuide(config)

  return `---
navigation:
  entry: AGENTS.md
  version: generated
  generator: '@kitsunekode/arche@0.1.0'
  stack:
    family: ${config.family}
    backend: ${config.backend}
    database: ${config.database}
    orm: ${config.orm}
    pm: ${pm}
---

# ${name}

## Quick Start

\`\`\`bash
${pm} install
${pm} dev
\`\`\`

## Loading order

1. Use docs/README.md for public commands and user-facing docs.
2. Use .docs/README.md for internal architecture and capability context.
3. Load one task-specific .docs topic, not the whole tree.
4. Load one matching .plans/active file when present for approved in-flight work.
5. Never treat .plans/archive as current behavior.

## Stack

- **Family**: ${config.family}
- **Runtime**: ${config.runtime}
${config.backend !== 'none' ? `- **Backend**: ${config.backend}\n` : ''}${config.database !== 'none' ? `- **Database**: ${config.database}\n` : ''}${config.orm !== 'none' ? `- **ORM**: ${config.orm}\n` : ''}${config.presets.length > 0 ? `- **Presets**: ${config.presets.join(', ')}\n` : ''}
## Key Directories

${dirs.map((d) => `- ${d}`).join('\n')}

## Where Things Go

${placements.map((item) => `- ${item}`).join('\n')}
${
  config.family === 'fullstack' && !usesServiceApi(config)
    ? `
## Data fetching (tRPC)

- **Server Components / server actions:** \`const api = await trpcCaller()\` from \`apps/web/trpc/caller.ts\`.
- **Client components:** \`useTRPC\` from \`apps/web/trpc/client.tsx\` (HTTP).
- **Prefetch + hydrate:** \`prefetch()\` + \`HydrateClient\` in \`apps/web/trpc/server.tsx\`.
`
    : ''
}
## Commands

${cmds.join('\n')}

## Agent Protocol

<!-- These instructions are for AI agents modifying this project. -->

- Use this file and the nearest workspace \`AGENTS.md\` — do not add \`.cursor/rules/\`, \`.claude/rules/\`, or duplicate instruction directories.

${prompts.map((p) => `- ${p}`).join('\n')}

## Maintenance

When modifying this project as an agent:
1. Read the relevant file first — don't guess
2. Run lint + typecheck after changes
3. Update this file if directory structure changes
4. Keep SHOWCASE.mdx in sync with the project's actual state
`
}

export function buildGeneratedArchitectureMd(config: ProjectConfig): string {
  const name = sanitizeProjectName(config.projectName)
  const family = config.family
  const serviceApi = usesServiceApi(config)

  const descriptions: Record<string, string> = {
    fullstack: serviceApi
      ? `A full-stack monorepo scaffolded with @kitsunekode/arche.

## Architecture

- **Frontend**: Next.js (App Router) in \`apps/web\`
- **Backend**: ${config.backend} in \`services/api\`
- **Database**: ${config.database}${config.orm !== 'none' ? ` via ${config.orm}` : ''}
- **Auth boundary**: Keep auth/session verification explicit at the service boundary
- **JavaScript workspace**: Turborepo with Bun/pnpm package-manager support
- **Rust workspace**: Cargo workspace at \`Cargo.toml\` with \`services/api\`

## Key Entry Points

- Rust API startup: \`services/api/src/main.rs\`
- Rust API config: \`services/api/src/config.rs\`
- Rust API routes: \`services/api/src/routes.rs\`
- Frontend shell: \`apps/web/app/layout.tsx\` and \`apps/web/app/page.tsx\`
- Frontend API status integration: \`apps/web/app/page.tsx\` reads \`NEXT_PUBLIC_API_URL\`

## Environment Variables

See \`services/api/.env.example\` and \`apps/web/.env.example\` for required variables.

## Layering

See "Where Things Go" in AGENTS.md for layering rules.`
      : `A full-stack TypeScript monorepo scaffolded with @kitsunekode/arche.

## Architecture

- **Frontend**: Next.js (App Router) in \`apps/web\`
- **Backend**: ${config.backend} in \`apps/server\`
- **Database**: ${config.database} via ${config.orm}
- **Auth**: Better Auth with session-based authentication
- **API Layer**: tRPC for end-to-end type safety
- **Shared types**: \`packages/common\` for cross-workspace helpers
- **Monorepo**: Turborepo with Bun as package manager

## Key Entry Points

- Server app setup: \`apps/server/src/app.ts\`
- tRPC context and procedures: \`apps/server/src/modules/trpc/trpc.ts\`
- Database schema: \`packages/store/prisma/schema.prisma\`${config.orm === 'drizzle' ? '\n- Database schema: `packages/store/src/schema.ts`' : ''}
- Auth configuration: \`packages/auth/src/index.ts\`
- Frontend shell: \`apps/web/app/layout.tsx\` and \`apps/web/app/page.tsx\`
- tRPC client hooks: \`apps/web/trpc/client.tsx\`
- HTTP prefetch + hydration: \`apps/web/trpc/server.tsx\`
- In-process RSC / server actions: \`apps/web/trpc/caller.ts\` (\`trpcCaller\` via \`createCaller\`)

## Data fetching (tRPC)

- **Server Components / server actions:** \`const api = await trpcCaller()\` then \`api.<router>.<proc>()\` — in-process, no HTTP loopback.
- **Client components:** hooks via \`useTRPC\` from \`@/trpc/client\` (HTTP to \`NEXT_PUBLIC_API_URL\`).
- **Prefetch + hydrate:** \`prefetch()\` + \`HydrateClient\` for client-bound queries (HTTP; safe when API is offline during build).

## Environment Variables

See \`apps/server/.env.example\` and \`apps/web/.env.example\` for required variables.

## Layering

See "Where Things Go" in AGENTS.md for layering rules.`,
    next: `A standalone Next.js application scaffolded with @kitsunekode/arche.

## Architecture

- **Frontend**: Next.js (App Router)
- **Env validation**: \`@t3-oss/env-nextjs\` in \`env.ts\`
- **Boundaries**: \`app/error.tsx\`, \`app/loading.tsx\`, \`app/not-found.tsx\`
- **Sample API**: \`GET /api/health\` Route Handler
- **Runtime**: Bun

## Key Entry Points

- App layout: \`app/layout.tsx\`
- App pages: \`app/\` (App Router directories)
- Env validation: \`env.ts\`
- Shared UI: \`components/\`

## Environment Variables

See \`.env.example\` at the project root.`,
    backend: `An API service scaffolded with @kitsunekode/arche.

## Architecture

- **Backend**: ${config.backend}
- **Database**: ${config.database} via ${config.orm}
- **Auth**: Better Auth
- **Runtime**: Bun

## Key Entry Points

- Server setup: \`src/app.ts\`
- Database schema: \`prisma/schema.prisma\`
- Auth configuration: \`packages/auth/src/index.ts\`

## Environment Variables

See \`.env.example\` for required variables.`,
    rust: `A Rust API service scaffolded with @kitsunekode/arche.

## Architecture

Layered modules under \`src/modules/<feature>/\`:

\`\`\`
routes → handler → service → repository → db
              ↓         ↓
            dto      policy / mapper
\`\`\`

- **routes.rs** — URL + HTTP method wiring only (no DB, no business rules)
- **handler.rs** — HTTP extraction/response (Axum types allowed here only)
- **service.rs** — business logic; framework-agnostic inputs
- **repository.rs** — sqlx queries only
- **dto.rs** — API request/response shapes (serde)
- **model.rs** — internal/DB records (never return directly)
- **mapper.rs** — model → response DTO
- **policy.rs** — pure permission checks

## HTTP semantics

- POST create, GET read/list, PATCH partial update, DELETE remove
- Do not use PUT unless implementing full replacement

## Errors

Use \`AppError\` and consistent JSON: \`{ "error": { "code", "message" } }\`

## Key entry points

- \`src/main.rs\` — startup
- \`src/app.rs\` — router + middleware
- \`src/state.rs\` — shared AppState (pool + config)
- \`src/modules/health\` — health check
${config.example === 'posts' ? '- `src/modules/posts` — example CRUD module\n' : ''}
## Environment

See \`.env.example\` (\`PORT\`, \`DATABASE_URL\`, \`RUST_LOG\`).`,
    convex: `A Next.js + Convex application scaffolded with @kitsunekode/arche.

## Architecture

- **Frontend**: Next.js (App Router)
- **Backend**: Convex (serverless)
- **Auth**: Better Auth with Convex integration
- **Real-time**: Built-in Convex subscriptions

## Key Entry Points

- Convex functions: \`convex/\`
- Convex schema: \`convex/schema.ts\`
- App pages: \`app/\``,
    solana: `A Solana project scaffolded with @kitsunekode/arche.

## Architecture

- **Program**: Anchor program in \`programs/core\`
- **Config**: shared cluster and program constants in \`packages/solana-config\`
- **Client**: IDL/protocol helpers in \`packages/solana-client\`
${config.preset === 'solana-web' || config.preset === 'solana-product' ? '- **Web**: Next.js dApp in `apps/web` with wallet-adapter boundary\n' : ''}${config.preset === 'solana-mobile' || config.preset === 'solana-product' ? '- **Mobile**: Expo app in `apps/mobile` with Solana Mobile Wallet Adapter boundary\n' : ''}
## Where things go

- Program instructions and accounts go in \`programs/core/src/lib.rs\` until the program needs modules.
- Cluster/program IDs go in \`packages/solana-config\`; app code should not duplicate them.
- IDL and transaction/client helpers go in \`packages/solana-client\`.
- Wallet UI stays in the app; program logic stays out of UI components.
- Add indexers, APIs, or workers only as explicit services when the product needs them.

## Commands

- \`anchor build\` — Build the program
- \`anchor test\` — Run Anchor tests when local validator tooling is available`,
    tui: `A terminal UI application scaffolded with @kitsunekode/arche.

## Architecture

- **Renderer**: OpenTUI (\`@opentui/core\` + \`@opentui/react\`)
- **UI**: React components with lowercase OpenTUI intrinsics (\`box\`, \`text\`, \`scrollbox\`)
- **Runtime**: Bun

## Key Entry Points

- Renderer bootstrap: \`src/index.tsx\`
- Root component: \`src/app.tsx\`

## Commands

- \`bun dev\` — Run the TUI directly with Bun
- \`bun run build\` — Compile to \`dist/\`
- \`bun run start\` — Run the compiled entrypoint`,
  }

  const description =
    descriptions[family] ?? `A ${family} project scaffolded with @kitsunekode/arche.`

  return `# ${name} — Context

${description}
`
}
