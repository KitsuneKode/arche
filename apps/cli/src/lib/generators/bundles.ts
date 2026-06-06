import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ProjectConfig } from '../../types/schemas'

function patchTrpcAppRouter(dest: string): string[] {
  const appPath = join(dest, 'apps/server/src/modules/trpc/app.router.ts')
  try {
    let content = readFileSync(appPath, 'utf8')
    if (content.includes('realtimeRouter')) return []
    content = content.replace(
      "import { userRouter } from '../user/user.trpc'",
      "import { userRouter } from '../user/user.trpc'\nimport { realtimeRouter } from '../realtime/realtime.trpc'",
    )
    content = content.replace(
      '  chat: chatRouter,',
      '  chat: chatRouter,\n  realtime: realtimeRouter,',
    )
    writeFileSync(appPath, content)
    return ['apps/server/src/modules/trpc/app.router.ts']
  } catch {
    return []
  }
}

function backendUsesServiceApi(config: ProjectConfig): boolean {
  return (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  )
}

function productBundle(dest: string, config: ProjectConfig): string[] {
  const files: string[] = []
  const gettingStarted = join(dest, 'docs/getting-started.md')
  const serviceApi = backendUsesServiceApi(config)
  mkdirSync(dirname(gettingStarted), { recursive: true })
  writeFileSync(
    gettingStarted,
    serviceApi
      ? `# Getting Started

This project was scaffolded with the **product** bundle using a service API backend.

## Core workspaces

- \`apps/web\` — Next.js frontend
- \`services/api\` — ${config.backend === 'rust-actix' ? 'Rust Actix Web' : 'Rust Axum'} API

## Commands

\`\`\`bash
bun install
bun run dev:web
bun run dev:api
\`\`\`

See \`AGENTS.md\` and \`.docs/architecture/generated-project.md\` for architecture details.
`
      : `# Getting Started

This project was scaffolded with the **product** bundle (auth, database, API).

## Core workspaces

- \`apps/web\` — Next.js frontend
- \`apps/server\` — Express API + tRPC + Better Auth
- \`packages/store\` — Database (Prisma/Drizzle)
- \`packages/trpc\` — API contract (re-exports server router)
- \`packages/auth\` — Better Auth configuration

## Commands

\`\`\`bash
bun install
bun dev
\`\`\`

See \`AGENTS.md\` and \`.docs/architecture/generated-project.md\` for architecture details.
`,
  )
  files.push('docs/getting-started.md')

  const markerDir = join(dest, '.arche')
  mkdirSync(markerDir, { recursive: true })
  writeFileSync(join(markerDir, 'product-bundle'), 'applied\n')
  files.push('.arche/product-bundle')

  return files
}

function realtimeBundle(dest: string): string[] {
  const files: string[] = []
  const wsDir = join(dest, 'apps/server/src/ws')

  mkdirSync(wsDir, { recursive: true })
  writeFileSync(
    join(wsDir, 'handler.ts'),
    `import type { ServerWebSocket } from 'bun'

const clients = new Set<ServerWebSocket<unknown>>()

export function handleWsOpen(ws: ServerWebSocket<unknown>): void {
  clients.add(ws)
  ws.send(JSON.stringify({ type: 'connected', clientCount: clients.size }))
}

export function handleWsMessage(ws: ServerWebSocket<unknown>, message: string): void {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

export function handleWsClose(ws: ServerWebSocket<unknown>): void {
  clients.delete(ws)
}
`,
  )
  files.push('apps/server/src/ws/handler.ts')

  const realtimeDir = join(dest, 'apps/server/src/modules/realtime')
  mkdirSync(realtimeDir, { recursive: true })
  writeFileSync(
    join(realtimeDir, 'realtime.trpc.ts'),
    `import type { TRPCRouterRecord } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { EventEmitter } from 'node:events'
import { publicProcedure } from '../trpc/trpc.js'

const ee = new EventEmitter()

export const realtimeRouter = {
  onEvent: publicProcedure.subscription(() => {
    return observable<string>((emit) => {
      const handler = (data: string) => emit.next(data)
      ee.on('event', handler)
      return () => ee.off('event', handler)
    })
  }),
} satisfies TRPCRouterRecord
`,
  )
  files.push('apps/server/src/modules/realtime/realtime.trpc.ts')
  files.push(...patchTrpcAppRouter(dest))

  return files
}

function growthBundle(dest: string): string[] {
  const files: string[] = []

  const analyticsDir = join(dest, 'packages/analytics/src')
  mkdirSync(analyticsDir, { recursive: true })
  writeFileSync(
    join(analyticsDir, 'index.ts'),
    `export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') {
    // Connect to your analytics provider
    console.log('[analytics]', name, properties)
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  console.log('[analytics] identify', userId, traits)
}
`,
  )
  files.push('packages/analytics/src/index.ts')

  writeFileSync(
    join(analyticsDir, '../package.json'),
    JSON.stringify(
      {
        name: '@acme/analytics',
        private: true,
        type: 'module',
        main: './src/index.ts',
        scripts: { build: 'tsc', dev: 'tsc --watch' },
        devDependencies: { typescript: '^5' },
      },
      null,
      2,
    ) + '\n',
  )
  files.push('packages/analytics/package.json')

  return files
}

function infraBundle(dest: string): string[] {
  const files: string[] = []

  const monitorDir = join(dest, 'packages/monitoring/src')
  mkdirSync(monitorDir, { recursive: true })
  writeFileSync(
    join(monitorDir, 'index.ts'),
    `export function initMonitoring(): void {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Initialize OpenTelemetry exporter
    console.log('[monitoring] OTEL configured')
  }
}

export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  console.log('[metric]', name, value, tags)
}
`,
  )
  files.push('packages/monitoring/src/index.ts')

  writeFileSync(
    join(monitorDir, '../package.json'),
    JSON.stringify(
      {
        name: '@acme/monitoring',
        private: true,
        type: 'module',
        main: './src/index.ts',
        scripts: { build: 'tsc', dev: 'tsc --watch' },
        devDependencies: { typescript: '^5' },
      },
      null,
      2,
    ) + '\n',
  )
  files.push('packages/monitoring/package.json')

  return files
}

function aiBundle(dest: string): string[] {
  const files: string[] = []

  const aiDir = join(dest, 'packages/ai/src')
  mkdirSync(aiDir, { recursive: true })
  writeFileSync(
    join(aiDir, 'index.ts'),
    `import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function generate(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt,
  })
  return text
}

export { openai, generateText }
`,
  )
  files.push('packages/ai/src/index.ts')

  writeFileSync(
    join(aiDir, '../package.json'),
    JSON.stringify(
      {
        name: '@acme/ai',
        private: true,
        type: 'module',
        main: './src/index.ts',
        scripts: { build: 'tsc', dev: 'tsc --watch' },
        dependencies: { ai: '^4.0.0', '@ai-sdk/openai': '^1.0.0' },
        devDependencies: { typescript: '^5' },
      },
      null,
      2,
    ) + '\n',
  )
  files.push('packages/ai/package.json')

  return files
}

const BUNDLE_HANDLERS: Record<string, (dest: string, config: ProjectConfig) => string[]> = {
  product: productBundle,
  realtime: (dest) => realtimeBundle(dest),
  growth: (dest) => growthBundle(dest),
  infra: (dest) => infraBundle(dest),
  ai: (dest) => aiBundle(dest),
}

/** Apply bundle transforms — generate additive packages and configs */
export function applyBundleTransforms(destinationDir: string, config: ProjectConfig): string[] {
  const generated: string[] = []

  for (const bundle of config.bundles) {
    const handler = BUNDLE_HANDLERS[bundle]
    if (handler) {
      const files = handler(destinationDir, config)
      generated.push(...files)
    }
  }

  return generated
}
