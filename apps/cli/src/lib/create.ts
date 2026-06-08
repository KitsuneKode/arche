import { PACKAGE_MANAGER_SUPPORT } from '../registry/capabilities'
import type { ProjectConfig } from '../types/schemas'
import { checkCompatibility, FamilySchema, ProjectConfigSchema } from '../types/schemas'
import { scaffoldProject as scaffold, type ScaffoldResult } from './scaffold'

export interface CreateOptions {
  config: ProjectConfig
  dryRun?: boolean
}

export interface CreateResult {
  success: boolean
  result?: ScaffoldResult
  errors: string[]
  warnings: string[]
  dryRun: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Validate a config without writing anything */
export function validateConfig(config: Partial<ProjectConfig>): ValidationResult {
  const { warnings, errors } = checkCompatibility(config)
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/** Create a project from config. Supports dry-run mode. */
export async function createProject(options: CreateOptions): Promise<CreateResult> {
  const { config: rawConfig, dryRun = false } = options
  const config = ProjectConfigSchema.parse(rawConfig)

  const { errors, warnings } = checkCompatibility(config)
  if (errors.length > 0) {
    return { success: false, errors, warnings, dryRun }
  }

  try {
    const result = await scaffold(config, dryRun)
    return { success: true, result, errors: [], warnings, dryRun: false }
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : String(err)],
      warnings,
      dryRun: false,
    }
  }
}

/** Get JSON Schema representation of the config schema for agent introspection */
export function getSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      projectName: { type: 'string', description: 'Project name (slugified)' },
      destinationDir: { type: 'string', description: 'Absolute path for output' },
      family: {
        type: 'string',
        enum: FamilySchema.options,
        description: 'Project family determines template source and transforms',
        default: 'fullstack',
      },
      backend: {
        type: 'string',
        enum: [
          'express-bun',
          'hono-bun',
          'fastify-node',
          'go-fiber',
          'rust-axum',
          'rust-actix',
          'python-fastapi',
          'none',
        ],
        description: 'Backend framework and runtime',
        default: 'express-bun',
      },
      database: {
        type: 'string',
        enum: ['postgres', 'sqlite', 'none'],
        description: 'Primary database',
        default: 'postgres',
      },
      orm: {
        type: 'string',
        enum: ['prisma', 'drizzle', 'none'],
        description: 'Object-relational mapper',
        default: 'prisma',
      },
      packageManager: {
        type: 'string',
        enum: ['bun', 'pnpm', 'npm'],
        description:
          'Package manager. Bun is default; pnpm is first-class; npm is rejected at validation.',
        default: 'bun',
        support: PACKAGE_MANAGER_SUPPORT,
      },
      testing: {
        type: 'string',
        enum: ['bun', 'none'],
        description: 'Testing setup',
        default: 'bun',
      },
      deployment: {
        type: 'string',
        enum: ['vercel-railway', 'none'],
        description: 'Deployment guide',
        default: 'vercel-railway',
      },
      includeDocker: { type: 'boolean', default: true },
      includeCi: { type: 'boolean', default: true },
      initializeGit: { type: 'boolean', default: true },
      installDependencies: { type: 'boolean', default: true },
      includeShowcase: { type: 'boolean', default: false },
      includeWorker: { type: 'boolean', default: false },
    },
    required: ['projectName', 'destinationDir'],
  }
}
