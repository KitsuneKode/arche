import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { createProject, validateConfig, getSchema } from './lib/create'
import type { ProjectConfig, Family } from './types/schemas'
import {
  BackendSchema,
  BundleSchema,
  DeploymentSchema,
  FamilySchema,
  PresetSchema,
} from './types/schemas'
import { PKG_NAME, PKG_VERSION } from './version'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string
  method: string
  params?: Record<string, unknown>
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

function send(response: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(response) + '\n')
}

function rpcError(id: number | string | null, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

const TOOLS = [
  {
    name: 'arche_plan_project',
    description: 'Validate a project config without writing files. Returns warnings and errors.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        family: { type: 'string', enum: FamilySchema.options, default: 'fullstack' },
        backend: {
          type: 'string',
          enum: ['express-bun', 'hono-bun', 'none'],
          default: 'express-bun',
        },
        database: {
          type: 'string',
          enum: ['postgres', 'sqlite', 'none'],
          default: 'postgres',
        },
        orm: { type: 'string', enum: ['prisma', 'drizzle', 'none'], default: 'prisma' },
        packageManager: { type: 'string', enum: ['bun', 'pnpm', 'npm'], default: 'bun' },
        includeDocker: { type: 'boolean', default: true },
        includeCi: { type: 'boolean', default: true },
        testing: { type: 'string', enum: ['bun', 'none'], default: 'bun' },
      },
    },
  },
  {
    name: 'arche_create_project',
    description:
      'Scaffold a project from a full explicit config. Requires projectName and outputs to ./<projectName>.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Project name (slugified)' },
        destinationDir: {
          type: 'string',
          description: 'Output directory (defaults to ./<projectName>)',
        },
        family: { type: 'string', enum: FamilySchema.options, default: 'fullstack' },
        backend: {
          type: 'string',
          enum: BackendSchema.options,
          default: 'express-bun',
        },
        database: {
          type: 'string',
          enum: ['postgres', 'sqlite', 'none'],
          default: 'postgres',
        },
        orm: { type: 'string', enum: ['prisma', 'drizzle', 'none'], default: 'prisma' },
        packageManager: { type: 'string', enum: ['bun', 'pnpm', 'npm'], default: 'bun' },
        preset: { type: 'string', enum: PresetSchema.options },
        bundles: {
          type: 'array',
          items: { type: 'string', enum: BundleSchema.options },
        },
        includeWorker: { type: 'boolean', default: false },
        includeDocker: { type: 'boolean', default: true },
        includeCi: { type: 'boolean', default: true },
        deployment: { type: 'string', enum: DeploymentSchema.options, default: 'vercel-railway' },
        install: { type: 'boolean', default: true },
        git: { type: 'boolean', default: true },
        testing: { type: 'string', enum: ['bun', 'none'], default: 'bun' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'arche_get_schema',
    description: 'Returns the full JSON Schema of the project config for agent introspection.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'arche_get_guidance',
    description: 'Returns guidance on how agents should use this CLI tool.',
    inputSchema: {
      type: 'object',
      properties: {
        family: {
          type: 'string',
          enum: FamilySchema.options,
          description: 'Optional: get family-specific guidance',
        },
      },
    },
  },
]

function handleToolsList(id: number | string): void {
  send({
    jsonrpc: '2.0',
    id,
    result: { tools: TOOLS },
  })
}

async function handleToolsCall(
  id: number | string,
  name: string,
  args: Record<string, unknown>,
): Promise<void> {
  switch (name) {
    case 'arche_plan_project': {
      const config = buildConfig(args)
      const result = validateConfig(config)
      send({
        jsonrpc: '2.0',
        id,
        result: {
          valid: result.valid,
          warnings: result.warnings,
          errors: result.errors,
          plannedConfig: {
            projectName: args.projectName || 'unnamed',
            family: args.family || 'fullstack',
            backend: args.backend || 'express-bun',
            database: args.database || 'postgres',
            orm: args.orm || 'prisma',
          },
        },
      })
      break
    }

    case 'arche_create_project': {
      if (!args.projectName || typeof args.projectName !== 'string') {
        rpcError(id, -32602, 'projectName is required')
        return
      }
      const projectName = args.projectName
      const destinationDir =
        (args.destinationDir as string) || resolve(process.cwd(), projectName as string)
      const config = buildConfig({ ...args, projectName, destinationDir })
      const result = await createProject({ config, dryRun: false })
      if (result.success) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            success: true,
            destinationDir: result.result?.destinationDir,
            packageName: result.result?.packageName,
            generatedFiles: result.result?.generatedFiles,
            warnings: result.warnings,
          },
        })
      } else {
        send({
          jsonrpc: '2.0',
          id,
          result: { success: false, errors: result.errors, warnings: result.warnings },
        })
      }
      break
    }

    case 'arche_get_schema': {
      send({
        jsonrpc: '2.0',
        id,
        result: getSchema(),
      })
      break
    }

    case 'arche_get_guidance': {
      const family = args.family as string | undefined
      send({
        jsonrpc: '2.0',
        id,
        result: {
          tool: '@kitsunekode/arche',
          version: PKG_VERSION,
          family: family || 'all',
          guidance: [
            'Use arche_plan_project first to validate config before creating.',
            'arche_create_project requires projectName. It scaffolds into ./<projectName>.',
            'Use arche_get_schema to introspect available options at any time.',
            'Set install=false for agent safety (long-running bun install).',
            'Family determines template source: fullstack (full monorepo), next (standalone Next.js), backend (Express API), etc.',
            'For non-fullstack families, only projectName and family are required; other options are ignored.',
          ],
        },
      })
      break
    }

    default:
      rpcError(id, -32601, `Tool not found: ${name}`)
  }
}

function buildConfig(args: Record<string, unknown>): ProjectConfig {
  return {
    projectName: (args.projectName as string) || '',
    destinationDir:
      (args.destinationDir as string) ||
      resolve(process.cwd(), (args.projectName as string) || 'project'),
    family: (args.family as Family) || 'fullstack',
    backend: (args.backend as ProjectConfig['backend']) || 'express-bun',
    database: (args.database as ProjectConfig['database']) || 'postgres',
    orm: (args.orm as ProjectConfig['orm']) || 'prisma',
    packageManager: (args.packageManager as ProjectConfig['packageManager']) || 'bun',
    includeDocker: args.includeDocker !== false,
    includeCi: args.includeCi !== false,
    initializeGit: args.git !== false,
    installDependencies: args.install !== false,
    testing: (args.testing as ProjectConfig['testing']) || 'bun',
    deployment: (args.deployment as ProjectConfig['deployment']) || 'vercel-railway',
    example: 'none',
    vectorDatabase: 'none',
    runtime: 'bun',
    includeShowcase: false,
    includeWorker: args.includeWorker === true,
    includeLiveDemo: false,
    bundles: (args.bundles as ProjectConfig['bundles']) ?? ['product'],
    presets: [],
    preset: args.preset as ProjectConfig['preset'],
    rustAuth: 'placeholder',
  }
}

function handleInitialize(id: number | string | null): void {
  send({
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: PKG_NAME, version: PKG_VERSION },
    },
  })
}

export function startMcpServer(): void {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false })

  rl.on('line', async (line: string) => {
    let request: JsonRpcRequest
    try {
      request = JSON.parse(line.trim())
    } catch {
      return
    }

    if (request.jsonrpc !== '2.0' || !request.method) return
    const id = request.id ?? null

    switch (request.method) {
      case 'initialize':
        handleInitialize(id)
        break
      case 'tools/list':
        handleToolsList(id)
        break
      case 'tools/call':
        await handleToolsCall(
          id,
          String(request.params?.name ?? ''),
          (request.params?.arguments as Record<string, unknown>) ?? {},
        )
        break
      case 'notifications/initialized':
      case 'notifications/cancelled':
        break
      default:
        rpcError(id, -32601, `Method not found: ${request.method}`)
    }
  })
}
