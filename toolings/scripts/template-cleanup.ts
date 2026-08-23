#!/usr/bin/env bun
import { access, mkdir, rm } from 'fs/promises'
import { dirname, resolve } from 'path'
import { applyLiveDemoRemoval } from '@kitsunekode/arche/capabilities/apply'

type CleanupTarget = 'showcase' | 'seed' | 'worker' | 'tests' | 'readme' | 'live'
type ActionType = 'remove' | 'write'

interface CleanupAction {
  type: ActionType
  path: string
  description: string
  content?: string
}

interface CleanupOptions {
  dryRun: boolean
  yes: boolean
  targets: CleanupTarget[]
}

const DEFAULT_TARGETS: CleanupTarget[] = ['showcase', 'seed', 'worker', 'tests', 'readme']
const ALL_TARGETS: CleanupTarget[] = [...DEFAULT_TARGETS, 'live']

const STARTER_LAYOUT = `import { Suspense } from 'react'
import { Toaster } from 'sonner'
import '@arche-template/ui/globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { RouteTopLoader } from '@/components/shell/route-top-loader'

export const metadata: Metadata = {
  title: {
    default: 'App',
    template: '%s | App',
  },
  description: 'Application built from the monorepo starter.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <RouteTopLoader />
        </Suspense>
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="bottom-right" className="font-sans" />
      </body>
    </html>
  )
}
`

const STARTER_PAGE = `const NEXT_STEPS = [
  'Rename the root package scope and product copy.',
  'Replace auth providers and environment variables with your own values.',
  'Build your first feature in apps/web and packages/trpc.',
]

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.24em] text-neutral-400 uppercase">
            Starter Ready
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Your product starts here.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg">
            The showcase routes were removed so this app can become a clean product surface.
            Keep the shared packages, wire your real domain logic, and ship.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/20 md:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">Recommended next steps</h2>
            <ul className="space-y-3 text-sm leading-6 text-neutral-300">
              {NEXT_STEPS.map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              Starter notes
            </h2>
            <p className="text-sm leading-6 text-neutral-300">
              Keep shared packages for auth, database, and API contracts. Replace the homepage,
              metadata, and starter copy with your product-specific experience next.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
`

const STARTER_SEED = `import { prisma } from '../index'

async function main() {
  console.log('No default seed data configured.')
  console.log('Add your own records to packages/store/src/scripts/seed.ts when ready.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
`

function buildStarterReadme(projectName: string): string {
  return `# ${projectName}

Monorepo starter built with Bun, Turborepo, Next.js, Express, Better Auth, Prisma, and tRPC.

## Quick Start

\`\`\`sh
bun install
bun dev
\`\`\`

## Common Commands

- \`bun dev\`
- \`bun run build\`
- \`bun run lint\`
- \`bun run check-types\`
- \`bun run db:generate\`
- \`bun run db:migrate\`
- \`bun run db:seed\`

## Cleanup And Maintenance

- \`bun run repo:doctor\`
- \`bun run template:clean:dry\`
- \`bun run template:clean\`
- \`bun run commit:check\`

Update this README, the agent docs, and product metadata once the starter is customized.
`
}

function buildStarterRootAgentsMd(options: {
  includeWorker: boolean
  includeTests: boolean
}): string {
  const workerRouting = options.includeWorker ? `- Worker background jobs: \`apps/worker\`\n` : ''

  const testsMap = options.includeTests ? `- \`tests\`: Test workspace\n` : ''

  return `# Agent Navigation

## Read Order

1. Open the nearest local \`AGENTS.md\` in the workspace you are touching.
2. Use \`docs/README.md\` for the global map and command/env overview.
3. Use \`docs/architecture.md\` for cross-workspace flow.

## Fast Routing

- Auth: \`packages/auth\`, \`packages/trpc/src/trpc.ts\`, \`apps/server/src/app.ts\`
- tRPC routers and context: \`packages/trpc\`
- Prisma schema, migrations, seed data: \`packages/store\`
- Shared UI and shadcn setup: \`packages/ui\`
- Client env/config loading: \`packages/common\`
- Server and worker env/logger/redis: \`packages/backend-common\`
- Next.js app shell and providers: \`apps/web\`
- Express bootstrap and route mounts: \`apps/server\`
${workerRouting}- Repo tooling: \`toolings/*\`
${testsMap}
## Repo Reality

- \`apps/web\` contains the app frontend wiring.
- \`apps/server\` mounts Better Auth at \`/api/auth/*splat\` and tRPC at
  \`/api/trpc\`.
${options.includeWorker ? '- `apps/worker` is mostly a stub today.\n' : ''}${options.includeTests ? '- `tests` contains repo tooling tests, but not full app-level coverage yet.\n' : ''}- Prefer \`AGENTS.md\` plus \`docs/\` over individual package \`README.md\` files.

## Update Rules

- Update the nearest local \`AGENTS.md\` when ownership, entrypoints, commands,
  cleanup notes, or file layout materially change.
- Update \`docs/architecture.md\` only when a change crosses workspace
  boundaries.
- Keep docs as current-state summaries. Do not append task journals.

## Hygiene Commands

- \`bun run repo:doctor\`
  Audit stale scaffolding, broken exports, and doc drift.
- \`bun run template:clean:dry\`
  Preview the opinionated start-fresh cleanup plan.
- \`bun run template:clean\`
  Apply the recommended cleanup to a cloned project.
`
}

function buildStarterClaudeMd(): string {
  return `# Claude Navigation

Use \`AGENTS.md\` as the canonical repo map.

## Read Order

1. Open the nearest local \`AGENTS.md\`.
2. Open \`docs/README.md\` for the global map.
3. Open \`docs/architecture.md\` for cross-workspace flow.

## Important Notes

- Prefer \`AGENTS.md\` over the existing package and app \`README.md\` files.
- When architecture or commands change, update the nearest local \`AGENTS.md\`
  and any affected shared doc in \`docs/\`.
- Use \`bun run repo:doctor\` before release or after large cleanup passes.
`
}

function buildStarterDocsReadme(options: {
  includeWorker: boolean
  includeTests: boolean
}): string {
  const workerEntry = options.includeWorker
    ? `
- \`apps/worker\`
  Worker scaffold. Logging and Redis helpers exist, but \`src/index.ts\` is still
  placeholder logic.
`
    : ''

  const testsEntry = options.includeTests
    ? `
- \`tests\`
  Test workspace for repo tooling and future broader coverage.
`
    : ''

  const workerCmd = options.includeWorker
    ? `- \`bun run dev:worker\`
  Run only the worker.\n`
    : ''

  return `# Repository Docs

Start here before searching the repo.

## How To Navigate

1. Open the nearest local \`AGENTS.md\`.
2. Use this file for the global map, commands, and env names.
3. Use \`docs/architecture.md\` if the change crosses workspaces.

## Workspace Map

- \`apps/web\`
  Next.js App Router frontend. Runtime wiring lives in
  \`app/layout.tsx\`, \`components/providers.tsx\`, \`trpc/client.tsx\`,
  \`trpc/server.tsx\`, and \`utils/config.ts\`.

- \`apps/server\`
  Express service. \`src/app.ts\` mounts Better Auth, JSON middleware, tRPC, and
  \`/health\`. \`src/server.ts\` handles process startup and clustering.
${workerEntry}
- \`packages/auth\`
  Better Auth server and client wrappers. Server setup lives in \`src/index.ts\`.
  Client setup lives in \`src/client.ts\`.

- \`packages/trpc\`
  Shared tRPC context, procedure helpers, middleware, and routers. Real app
  router lives in \`src/routers/_app.ts\`.

- \`packages/store\`
  Prisma schema, migrations, generated client output, and seed data.

- \`packages/common\`
  Shared config-loading utilities and client logger.

- \`packages/backend-common\`
  Shared backend config, winston logger setup, and Bun Redis helper.

- \`packages/ui\`
  Shared UI components, styles, and shadcn generator config.

- \`toolings/typescript-config\`
  Shared TS base configs extended by apps and packages.

- \`toolings/scripts\`
  Repo utility scripts for scope migration, redundancy auditing, and cleanup.
${testsEntry}
## Task Routing

- Auth changes:
  \`packages/auth\`, \`packages/trpc/src/trpc.ts\`, \`apps/server/src/app.ts\`
- API/router changes:
  \`packages/trpc\`, \`apps/server/src/app.ts\`, \`apps/web/trpc/*\`
- Database and schema changes:
  \`packages/store/prisma/schema.prisma\`, \`packages/store/src/index.ts\`,
  \`packages/store/src/scripts/seed.ts\`
- Shared frontend primitives:
  \`packages/ui/src/components\`, \`packages/ui/src/styles/globals.css\`
- Web app shell or providers:
  \`apps/web/app/layout.tsx\`, \`apps/web/components/providers.tsx\`,
  \`apps/web/trpc/*\`
- Tooling changes:
  \`toolings/*\` and the local \`AGENTS.md\` there

## Common Commands

- \`bun install\`
  Install workspace dependencies and trigger Prisma generate via \`postinstall\`.
- \`bun dev\`
  Run all workspace dev tasks through Turbo.
- \`bun run dev:web\`
  Run only the Next.js app.
- \`bun run dev:server\`
  Run only the Express server.
${workerCmd}- \`bun run build\`
  Build the workspace.
- \`bun run lint\`
  Lint code and markdown.
- \`bun run check-types\`
  Run workspace type checks.
- \`bun run db:generate\`
  Generate Prisma client.
- \`bun run db:migrate\`
  Run Prisma migrate dev via Turbo.
- \`bun run db:seed\`
  Seed the database.
- \`bun run db:studio\`
  Open Prisma Studio.
- \`bun run rename-scope:dry\`
  Preview replacing package scope names with the root package name.
- \`bun run rename-scope\`
  Apply the scope rename across the repo.
- \`bun run repo:doctor\`
  Audit the repo for stale scaffolding, broken exports, placeholder files, and
  doc drift.
- \`bun run repo:doctor:strict\`
  Fail on warnings and errors for CI or pre-release checks.
- \`bun run template:clean:dry\`
  Preview the cleanup plan for removing showcase code and optional workspaces.
- \`bun run template:clean\`
  Apply the recommended cleanup plan.
- \`bun run commit:check\`
  Validate the most recent commit message against the repo commit convention.

## Environment Names

- Client:
  \`NEXT_PUBLIC_APP_URL\`, \`NEXT_PUBLIC_API_URL\`, \`NODE_ENV\`
- Server:
  \`PORT\`, \`FRONTEND_URL\`, \`DATABASE_URL\`, \`REDIS_URL\`,
  \`BETTER_AUTH_URL\`, \`BETTER_AUTH_SECRET\`, \`NODE_ENV\`
- Optional social auth:
  \`GITHUB_CLIENT_ID\`, \`GITHUB_CLIENT_SECRET\`, \`GOOGLE_CLIENT_ID\`,
  \`GOOGLE_CLIENT_SECRET\`

\`apps/server/.env.example\` is the safe example source for the backend keys.

## Commit Convention

Commit messages are linted with Conventional Commits via Husky and commitlint.

- Preferred format:
  \`type(scope): short imperative summary\`
- Common types:
  \`feat\`, \`fix\`, \`refactor\`, \`docs\`, \`chore\`, \`test\`, \`build\`, \`ci\`
- Example:
  \`feat(auth): add GitHub provider configuration\`
`
}

function buildStarterArchitectureMd(options: { includeWorker: boolean }): string {
  const workerDep = options.includeWorker
    ? `- \`apps/worker\` depends on auth, backend-common, common, and store.\n`
    : ''

  const workerStatus = options.includeWorker
    ? `- \`apps/worker\` has logging and Redis wiring but no real background job system.\n`
    : ''

  return `# Architecture

This file describes the real runtime flow across workspaces so agents can avoid
guessing from folder names alone.

## Request Flow

1. \`apps/web\` loads shared global styles from the UI package in
   \`app/layout.tsx\`.
2. \`apps/web/components/providers.tsx\` mounts \`next-themes\` and the shared tRPC
   React provider.
3. \`apps/web/trpc/client.tsx\` builds the browser tRPC client against
   \`NEXT_PUBLIC_API_URL + /api/trpc\`.
4. \`apps/server/src/app.ts\` exposes:
   - Better Auth at \`/api/auth/*splat\`
   - tRPC at \`/api/trpc\`
   - health check at \`/health\`
5. Routers in \`packages/trpc/src/routers\` call Prisma directly through the
   store package.
6. \`packages/store\` reads \`packages/store/prisma/schema.prisma\`, generated
   client output, and migrations.

## Workspace Dependencies

- \`apps/web\` depends on auth, common, store, trpc, and ui.
- \`apps/server\` depends on auth, backend-common, and trpc.
${workerDep}- \`packages/auth\` uses Better Auth with the Prisma adapter from store.
- \`packages/trpc\` centralizes context, middleware, and routers and depends on
  auth, store, common, and backend-common.
- \`packages/backend-common\` holds backend env validation, Redis, and logging.
- \`packages/common\` holds the generic \`ConfigLoader\` plus client-side config.

## Config Surfaces

- Client config is validated in \`packages/common/src/utils/config-loader.ts\`.
- \`apps/web/utils/config.ts\` is a thin wrapper around the shared client config.
- Backend env validation lives in
  \`packages/backend-common/src/utils/config.ts\`.
- \`apps/server/src/utils/config.ts\` and \`packages/trpc/src/utils/config.ts\`
  both re-export backend config.

## Current Scaffold Status

${workerStatus}- \`packages/backend-common/src/index.ts\` is effectively empty; most meaningful
  imports use subpath exports.
`
}

function buildStarterWebAgentsMd(): string {
  return `# Web App Notes

## Purpose

\`apps/web\` is the Next.js App Router frontend.

## Read First

- \`app/layout.tsx\`
- \`app/page.tsx\`
- \`components/providers.tsx\`
- \`trpc/client.tsx\`
- \`trpc/server.tsx\`
- \`utils/config.ts\`

## Owns

- App Router pages and layouts
- tRPC client and server-side caller helpers
- theme/providers setup

## Common Tasks

- Product shell or metadata changes:
  \`app/layout.tsx\`, \`app/page.tsx\`
- Data fetching and typed API usage:
  \`trpc/*\`
- Shared provider setup:
  \`components/providers.tsx\`

## Update When

Update this file when route topology, provider wiring, or tRPC client setup
changes.
`
}

function buildDocCleanupActions(targets: CleanupTarget[]): CleanupAction[] {
  const actions: CleanupAction[] = []

  const includeWorker = !targets.includes('worker')
  const includeTests = !targets.includes('tests')

  // Always remove CLI-only docs (these should not exist in scaffolded output)
  actions.push(
    {
      type: 'remove',
      path: 'docs/archive',
      description: 'Remove archived template docs (not relevant post-scaffold)',
    },
    {
      type: 'remove',
      path: 'docs/cli-development.md',
      description: 'Remove CLI development docs (not relevant post-scaffold)',
    },
  )

  // Rewrite root AGENTS.md to remove stale refs
  actions.push({
    type: 'write',
    path: 'AGENTS.md',
    description: 'Rewrite root AGENTS.md to reflect post-scaffold repo shape',
    content: buildStarterRootAgentsMd({ includeWorker, includeTests }),
  })

  // Rewrite CLAUDE.md to remove stale refs
  actions.push({
    type: 'write',
    path: 'CLAUDE.md',
    description: 'Rewrite CLAUDE.md to reflect post-scaffold repo shape',
    content: buildStarterClaudeMd(),
  })

  // Rewrite docs/README.md
  actions.push({
    type: 'write',
    path: 'docs/README.md',
    description: 'Rewrite docs/README.md to reflect post-scaffold workspace map',
    content: buildStarterDocsReadme({ includeWorker, includeTests }),
  })

  // Rewrite docs/architecture.md
  actions.push({
    type: 'write',
    path: 'docs/architecture.md',
    description: 'Rewrite architecture doc to remove template-only surface references',
    content: buildStarterArchitectureMd({ includeWorker }),
  })

  // Rewrite apps/web/AGENTS.md if showcase is being removed
  if (targets.includes('showcase')) {
    actions.push({
      type: 'write',
      path: 'apps/web/AGENTS.md',
      description: 'Rewrite web AGENTS.md to remove showcase references',
      content: buildStarterWebAgentsMd(),
    })
  }

  return actions
}

function parseTargets(argv: string[]): CleanupTarget[] {
  const removeArg = argv.find((entry) => entry.startsWith('--remove='))
  if (!removeArg) return DEFAULT_TARGETS

  const selected = removeArg
    .slice('--remove='.length)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) as CleanupTarget[]

  if (selected.length === 0) {
    throw new Error('At least one cleanup target is required when using --remove=')
  }

  const invalid = selected.filter((entry) => !ALL_TARGETS.includes(entry))
  if (invalid.length > 0) {
    throw new Error(`Unknown cleanup target(s): ${invalid.join(', ')}`)
  }

  return [...new Set(selected)]
}

function parseArgs(argv: string[]): CleanupOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage: bun toolings/scripts/template-cleanup.ts [options]

Strip the template showcase and optional workspaces from a cloned project.

Options:
  --dry-run               Preview changes without writing files
  --yes                   Apply changes without confirmation prompt
  --remove=a,b,c          Choose from showcase,seed,worker,tests,readme,live
  -h, --help              Show this message

Examples:
  bun toolings/scripts/template-cleanup.ts --dry-run
  bun toolings/scripts/template-cleanup.ts --remove=showcase,seed --yes
  bun toolings/scripts/template-cleanup.ts --yes
`)
    process.exit(0)
  }

  return {
    dryRun: argv.includes('--dry-run'),
    yes: argv.includes('--yes'),
    targets: parseTargets(argv),
  }
}

function buildLiveDemoActions(): CleanupAction[] {
  return [
    {
      type: 'remove',
      path: '(live-demo manifest)',
      description:
        'Apply unified live-demo removal (routes, guest auth, demo schema) via capability manifest',
    },
  ]
}

function buildShowcaseActions(): CleanupAction[] {
  return [
    { type: 'remove', path: 'apps/web/app/demo', description: 'Remove demo routes' },
    { type: 'remove', path: 'apps/web/app/landing', description: 'Remove landing routes' },
    { type: 'remove', path: 'apps/web/app/blog', description: 'Remove template blog routes' },
    { type: 'remove', path: 'apps/web/components/demos', description: 'Remove demo components' },
    {
      type: 'remove',
      path: 'apps/web/components/landing',
      description: 'Remove landing components',
    },
    {
      type: 'remove',
      path: 'apps/web/components/landing-premium',
      description: 'Remove premium landing components',
    },
    {
      type: 'remove',
      path: 'apps/web/components/sections',
      description: 'Remove marketing sections',
    },
    {
      type: 'remove',
      path: 'apps/web/components/ui/animated-gradient.tsx',
      description: 'Remove showcase-only UI helper',
    },
    {
      type: 'remove',
      path: 'apps/web/components/ui/code-block.tsx',
      description: 'Remove showcase-only code block component',
    },
    {
      type: 'remove',
      path: 'apps/web/components/ui/feature-card.tsx',
      description: 'Remove showcase-only feature card component',
    },
    {
      type: 'remove',
      path: 'apps/web/components/ui/section-wrapper.tsx',
      description: 'Remove showcase-only section wrapper',
    },
    {
      type: 'remove',
      path: 'apps/web/components/shell/design-toggle.tsx',
      description: 'Remove template design toggle',
    },
    {
      type: 'remove',
      path: 'apps/web/components/shell/link-pending-indicator.tsx',
      description: 'Remove landing-only link indicator',
    },
    {
      type: 'remove',
      path: 'apps/web/components/shell/navbar-switcher.tsx',
      description: 'Remove showcase navbar switcher',
    },
    {
      type: 'remove',
      path: 'apps/web/lib/animations.ts',
      description: 'Remove showcase animation helpers',
    },
    { type: 'remove', path: 'apps/web/lib/demo-data.ts', description: 'Remove showcase demo data' },
    {
      type: 'remove',
      path: 'apps/web/lib/scroll.ts',
      description: 'Remove showcase scroll helper',
    },
    {
      type: 'remove',
      path: 'apps/web/lib/site-design.ts',
      description: 'Remove template design state helper',
    },
    { type: 'remove', path: 'apps/web/public/brand', description: 'Remove template brand assets' },
    {
      type: 'remove',
      path: 'apps/web/app/opengraph-image.tsx',
      description: 'Remove template social image route',
    },
    {
      type: 'remove',
      path: 'apps/web/app/twitter-image.tsx',
      description: 'Remove template Twitter image route',
    },
    {
      type: 'remove',
      path: 'apps/web/app/social-image.tsx',
      description: 'Remove template social image route',
    },
    {
      type: 'write',
      path: 'apps/web/app/layout.tsx',
      description: 'Replace layout metadata with a starter version',
      content: STARTER_LAYOUT,
    },
    {
      type: 'write',
      path: 'apps/web/app/page.tsx',
      description: 'Replace marketing homepage with a starter page',
      content: STARTER_PAGE,
    },
  ]
}

async function detectProjectName(): Promise<string> {
  const rootPackage = (await Bun.file('package.json').json()) as { name?: string }
  const rawName = rootPackage.name?.trim() || 'app'
  return rawName.startsWith('@') ? rawName.slice(1) : rawName
}

export async function buildCleanupPlan(targets: CleanupTarget[]): Promise<CleanupAction[]> {
  const actions: CleanupAction[] = []

  if (targets.includes('live')) {
    actions.push(...buildLiveDemoActions())
  }

  if (targets.includes('showcase')) {
    actions.push(...buildShowcaseActions())
  }

  if (targets.includes('seed')) {
    actions.push({
      type: 'write',
      path: 'packages/store/src/scripts/seed.ts',
      description: 'Replace template-branded seed data with a starter seed script',
      content: STARTER_SEED,
    })
  }

  if (targets.includes('worker')) {
    actions.push({
      type: 'remove',
      path: 'apps/worker',
      description: 'Remove the optional worker workspace',
    })
  }

  if (targets.includes('tests')) {
    actions.push({
      type: 'remove',
      path: 'tests',
      description: 'Remove the optional tests workspace',
    })
  }

  if (targets.includes('readme')) {
    actions.push({
      type: 'write',
      path: 'README.md',
      description: 'Replace the template-branded root README with a starter README',
      content: buildStarterReadme(await detectProjectName()),
    })
  }

  // Documentation cleanup: rewrite/remove docs that reference stale
  // template surfaces, the CLI workspace, or removed targets.
  actions.push(...buildDocCleanupActions(targets))

  return actions
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function applyAction(action: CleanupAction, dryRun: boolean): Promise<void> {
  if (action.path === '(live-demo manifest)') {
    if (!dryRun) {
      await applyLiveDemoRemoval(process.cwd())
    }
    return
  }

  const absolutePath = resolve(action.path)
  const exists = await pathExists(action.path)

  if (action.type === 'remove') {
    if (!exists) return
    if (!dryRun) {
      await rm(absolutePath, { recursive: true, force: true })
    }
    return
  }

  if (!dryRun) {
    const parent = dirname(absolutePath)
    await mkdir(parent, { recursive: true })
    await Bun.write(absolutePath, action.content ?? '')
  }
}

function printPlan(actions: CleanupAction[], options: CleanupOptions): void {
  console.log('Template Cleanup Plan')
  console.log(`Mode: ${options.dryRun ? 'dry-run' : 'write'}`)
  console.log(`Targets: ${options.targets.join(', ')}`)
  console.log('')

  for (const action of actions) {
    console.log(`- [${action.type}] ${action.path}`)
    console.log(`  ${action.description}`)
  }

  console.log('')
  console.log('After cleanup, review AGENTS/docs files so they describe your new repo shape.')
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (!options.dryRun && !options.yes) {
    console.error('Refusing to modify files without --yes. Run with --dry-run first if needed.')
    process.exit(1)
  }

  const actions = await buildCleanupPlan(options.targets)
  printPlan(actions, options)

  for (const action of actions) {
    await applyAction(action, options.dryRun)
  }
}

if (import.meta.main) {
  await main()
}
