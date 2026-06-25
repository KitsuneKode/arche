import { z } from 'zod'

// =============================================================================
// Family Model
// =============================================================================

export const FamilySchema = z.enum([
  'fullstack',
  'next',
  'backend',
  'rust',
  'solana',
  'convex',
  'worker',
  'lib',
  'cli',
  'tui',
  'tanstack',
  'mobile',
  'polyglot',
])
export type Family = z.infer<typeof FamilySchema>

export const BundleSchema = z.enum(['product', 'realtime', 'growth', 'infra', 'ai'])
export type Bundle = z.infer<typeof BundleSchema>

export const PackageManagerSchema = z.enum(['bun', 'pnpm', 'npm'])
export type PackageManager = z.infer<typeof PackageManagerSchema>

export const PresetSchema = z.enum([
  'typescript-fullstack',
  'next-app',
  'rust-api',
  'rust-fullstack',
  'convex-product',
  'solana-program',
  'solana-web',
  'solana-mobile',
  'solana-product',
  'tui-app',
  'tanstack-start',
  'customize',
  'experiments',
])
export type Preset = z.infer<typeof PresetSchema>

/** Package managers supported by new recipe-based presets. */
export const StablePackageManagerSchema = z.enum(['bun', 'pnpm'])
export type StablePackageManager = z.infer<typeof StablePackageManagerSchema>

// =============================================================================
// Core Schemas (kept for backward compat with generators)
// =============================================================================

export const TestingSchema = z.enum(['bun', 'none']).describe('Testing framework setup')
export type TestingMode = z.infer<typeof TestingSchema>

export const DeploymentSchema = z
  .enum(['vercel-railway', 'none'])
  .describe('Deployment documentation to generate')
export type DeploymentMode = z.infer<typeof DeploymentSchema>

export const CleanupTargetSchema = z
  .enum(['showcase', 'seed', 'worker', 'tests', 'readme', 'live'])
  .describe('Template sections that can be removed')
export type CleanupTarget = z.infer<typeof CleanupTargetSchema>

// =============================================================================
// Database Schemas
// =============================================================================

export const DatabaseSchema = z.enum(['postgres', 'sqlite', 'none']).describe('Primary database')
export type DatabaseType = z.infer<typeof DatabaseSchema>

export const VectorDatabaseSchema = z
  .enum(['pgvector', 'pinecone', 'none'])
  .describe('Vector database for embeddings')
export type VectorDatabaseType = z.infer<typeof VectorDatabaseSchema>

export const ORMSchema = z
  .enum(['prisma', 'drizzle', 'none'])
  .describe('Object-relational mapper (Prisma or Drizzle)')
export type ORMType = z.infer<typeof ORMSchema>

// =============================================================================
// Backend Schemas
// =============================================================================

export const BackendSchema = z
  .enum([
    'express-bun',
    'hono-bun',
    'fastify-node',
    'go-fiber',
    'rust-axum',
    'rust-actix',
    'python-fastapi',
    'none',
  ])
  .describe('Backend framework and runtime')
export type BackendType = z.infer<typeof BackendSchema>

export const RuntimeSchema = z.enum(['bun', 'node', 'workers']).describe('JavaScript runtime')
export type RuntimeType = z.infer<typeof RuntimeSchema>

// =============================================================================
// Example Templates
// =============================================================================

export const ExampleSchema = z
  .enum(['none', 'todo', 'chat', 'game', 'ai', 'posts'])
  .describe('Example application to scaffold')
export type ExampleType = z.infer<typeof ExampleSchema>

export const RustAuthSchema = z
  .enum(['none', 'placeholder'])
  .describe('Rust family auth style (placeholder CurrentUser extractor)')
export type RustAuthStyle = z.infer<typeof RustAuthSchema>

// =============================================================================
// Next.js Presets
// =============================================================================

export const NextPresetSchema = z
  .enum(['auth', 'docs', 'analytics', 'storage'])
  .describe('Next.js family presets')
export type NextPreset = z.infer<typeof NextPresetSchema>

// =============================================================================
// Composite Schemas
// =============================================================================

export const ProjectConfigSchema = z.object({
  projectName: z.string().min(1),
  destinationDir: z.string().min(1),
  /** Top-level preset used by the capability-registry create flow. */
  preset: PresetSchema.optional(),
  // NEW: family model
  family: FamilySchema.default('fullstack'),
  bundles: z.array(BundleSchema).default(['product']),
  packageManager: PackageManagerSchema.default('bun'),
  // EXISTING (kept for backward compat with generators)
  database: DatabaseSchema.default('postgres'),
  vectorDatabase: VectorDatabaseSchema.default('none'),
  orm: ORMSchema.default('prisma'),
  backend: BackendSchema.default('express-bun'),
  runtime: RuntimeSchema.default('bun'),
  example: ExampleSchema.default('none'),
  testing: TestingSchema.default('bun'),
  deployment: DeploymentSchema.default('vercel-railway'),
  includeShowcase: z.boolean().default(false),
  includeWorker: z.boolean().default(false),
  /** Interactive live demo (Relay Run, chat, proof ladder). Default: off — minimal scaffold. */
  includeLiveDemo: z.boolean().default(false),
  includeDocker: z.boolean().default(true),
  includeCi: z.boolean().default(true),
  initializeGit: z.boolean().default(true),
  installDependencies: z.boolean().default(true),
  // Family-specific (flattened for dispatch)
  presets: z.array(NextPresetSchema).default([]),
  /** Rust family: optional CurrentUser extractor stub */
  rustAuth: RustAuthSchema.default('placeholder'),
})
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

export const CLIArgsSchema = z.object({
  projectName: z.string().optional(),
  family: FamilySchema.optional(),
  preset: PresetSchema.optional(),
  bundles: z.array(BundleSchema).optional(),
  packageManager: PackageManagerSchema.optional(),
  yes: z.boolean().default(false),
  help: z.boolean().default(false),
  version: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  // Existing flags
  install: z.boolean().optional(),
  git: z.boolean().optional(),
  includeShowcase: z.boolean().optional(),
  includeWorker: z.boolean().optional(),
  includeLiveDemo: z.boolean().optional(),
  testing: TestingSchema.optional(),
  includeDocker: z.boolean().optional(),
  includeCi: z.boolean().optional(),
  deployment: DeploymentSchema.optional(),
  database: DatabaseSchema.optional(),
  orm: ORMSchema.optional(),
  backend: BackendSchema.optional(),
  example: ExampleSchema.optional(),
  // Family-specific flags
  presets: z.array(NextPresetSchema).optional(),
  dir: z.string().optional(),
  // Internal: subcommand dispatch
  _command: z.string().optional(),
  _jsonConfig: z.any().optional(),
  _addFeature: z.string().optional(),
  _addDir: z.string().optional(),
  _completionShell: z.enum(['bash', 'zsh']).optional(),
})
export type CLIArgs = z.infer<typeof CLIArgsSchema>

// =============================================================================
// Family Helpers
// =============================================================================

export const FAMILY_LABELS: Record<Family, string> = {
  fullstack: 'Full-stack TypeScript monorepo',
  next: 'Standalone Next.js app',
  backend: 'API-only service',
  rust: 'Rust API service',
  solana: 'Solana program',
  convex: 'Next.js + Convex',
  worker: 'Background job worker',
  lib: 'Generic TypeScript package',
  cli: 'CLI package',
  tui: 'Terminal UI app (OpenTUI)',
  tanstack: 'TanStack Start full-stack app',
  mobile: 'Expo mobile app',
  polyglot: 'Multi-language monorepo',
}

export const BUNDLE_LABELS: Record<Bundle, string> = {
  product: 'Auth + DB + API',
  realtime: 'WebSocket + Worker + Docs',
  growth: 'Analytics + Feature Flags + A/B',
  infra: 'Monitoring + Storage + CI/Deploy',
  ai: 'AI examples + Helpers + Docs',
}

/** Interactive / transform options apply only to the full monorepo template. */
export function hasBackendOptions(family: Family): boolean {
  return family === 'fullstack'
}

export function hasDatabaseOptions(family: Family): boolean {
  return family === 'fullstack'
}

export function hasOrmOptions(family: Family): boolean {
  return family === 'fullstack'
}

/** Rust family: postgres, sqlite, or API-only (none). */
export function hasRustDatabaseOptions(family: Family): boolean {
  return family === 'rust'
}

export function rustUsesSqlx(config: Pick<ProjectConfig, 'family' | 'database'>): boolean {
  return (
    config.family === 'rust' && (config.database === 'postgres' || config.database === 'sqlite')
  )
}

export function familySupportsMonorepoTransforms(family: Family): boolean {
  return family === 'fullstack'
}

export function familySupportsRenameScope(family: Family): boolean {
  return family === 'fullstack'
}

export function familySupportsTemplateCleanup(family: Family): boolean {
  return family === 'fullstack'
}

export function familySupportsBundles(family: Family): boolean {
  return family === 'fullstack'
}

export function hasPresetOptions(family: Family): boolean {
  return family === 'next'
}

export function familySupportsWorker(family: Family): boolean {
  return family === 'fullstack'
}

export function familySupportsShowcase(family: Family): boolean {
  return family === 'fullstack'
}

export function isRustFrameworkBackend(backend: ProjectConfig['backend'] | undefined): boolean {
  return backend === 'rust-axum' || backend === 'rust-actix'
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' }
  }

  const slugified = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._ -]/g, '')
    .replace(/[._ ]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slugified) {
    return { valid: false, error: 'Project name must contain at least one alphanumeric character' }
  }

  return { valid: true }
}

export function checkCompatibility(config: Partial<ProjectConfig>): {
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  if (config.packageManager === 'npm') {
    errors.push(
      'npm is not supported for generated projects. Use bun or pnpm (catalog: references require a workspace catalog).',
    )
  }

  if (config.family === 'fullstack' && config.database === 'none') {
    errors.push(
      'database=none is not supported for fullstack. Use postgres or sqlite, or choose the next family for frontend-only.',
    )
  }

  if (config.backend === 'fastify-node') {
    errors.push('Fastify backend is not supported yet. Use express-bun or hono-bun.')
  }

  if (config.family === 'fullstack' && config.backend === 'none') {
    errors.push('Fullstack requires a backend. Use the next family for a frontend-only app.')
  }

  if (
    config.family === 'fullstack' &&
    (config.backend === 'go-fiber' || config.backend === 'python-fastapi')
  ) {
    errors.push(
      'Go and Python service backends are not stable fullstack outputs yet. Use polyglot or a dedicated backend service.',
    )
  }

  if (config.vectorDatabase === 'pgvector' && config.database !== 'postgres') {
    errors.push('pgvector requires PostgreSQL as the primary database.')
  }

  if (config.database === 'none' && config.orm && config.orm !== 'none') {
    errors.push(`ORM "${config.orm}" requires a database. Set database or use orm=none.`)
  }

  if (config.backend === 'none' && config.includeWorker) {
    warnings.push('Worker without a backend server may not be useful.')
  }

  if (config.example === 'chat') {
    warnings.push(
      'Chat example expects a WebSocket server — run `arche add websocket` after scaffold.',
    )
  }

  if (config.database === 'sqlite' && config.includeDocker) {
    warnings.push(
      'SQLite is file-based and does not need a Docker container. Docker will only include Redis.',
    )
  }

  if (config.includeLiveDemo && config.family === 'fullstack') {
    if (config.orm === 'drizzle') {
      errors.push(
        'live-demo requires Prisma (Express + Postgres). Drizzle scaffolds omit the live demo stack.',
      )
    }
    if (isRustFrameworkBackend(config.backend)) {
      errors.push(
        'live-demo requires the Express + Prisma fullstack backend. Rust API scaffolds omit the live demo stack.',
      )
    }
    if (config.backend === 'hono-bun') {
      warnings.push(
        'live-demo is tested with express-bun. Hono scaffolds may need manual wiring for chat SSE routes.',
      )
    }
  }

  // Family-specific validation
  if (config.family === 'solana' && config.backend !== 'none' && config.backend !== undefined) {
    warnings.push('Solana programs do not use a backend server. Backend will be ignored.')
  }

  if (config.preset === 'convex-product' || config.family === 'convex') {
    if (config.backend && config.backend !== 'none') {
      warnings.push('Convex routes do not use Express/Hono. Backend will be ignored.')
    }
    if (config.database && config.database !== 'none') {
      warnings.push('Convex routes use Convex storage. Database selection will be ignored.')
    }
    if (config.orm && config.orm !== 'none') {
      warnings.push('Convex routes do not use Prisma/Drizzle. ORM selection will be ignored.')
    }
    if (config.bundles && config.bundles.length > 0) {
      warnings.push('Monorepo bundles apply to fullstack only. Bundles will be ignored for Convex.')
    }
    if (config.includeWorker) {
      warnings.push('Convex routes do not include a BullMQ worker. Worker will be omitted.')
    }
    if (config.includeDocker) {
      warnings.push(
        'Convex routes do not ship Docker Compose for Postgres. Docker will be omitted.',
      )
    }
  }
  if (
    config.family === 'rust' &&
    config.backend &&
    config.backend !== 'none' &&
    !isRustFrameworkBackend(config.backend)
  ) {
    warnings.push(
      'Rust family only supports rust-axum or rust-actix as backend. Other values are ignored.',
    )
  }
  if (config.family === 'mobile' && config.backend === undefined) {
    // Mobile has its own concerns — no backend validation needed
  }

  // Bundle compatibility
  if (
    config.bundles?.includes('realtime') &&
    !config.includeWorker &&
    config.family === 'fullstack'
  ) {
    warnings.push('Realtime bundle works best with worker enabled (--worker).')
  }
  if (config.bundles?.includes('ai') && config.family !== 'fullstack' && config.family !== 'next') {
    warnings.push('AI bundle is designed for fullstack or next families.')
  }

  if (
    config.family === 'rust' &&
    config.example === 'posts' &&
    config.database !== 'postgres' &&
    config.database !== 'sqlite'
  ) {
    warnings.push(
      'Posts example module requires postgres or sqlite. Disable the example or pick a database.',
    )
  }

  if (config.presets && config.presets.length > 0 && config.family === 'next') {
    warnings.push(
      'Next.js presets (auth, docs, analytics, storage) are not generated yet — selection is recorded for future use.',
    )
  }

  // Backend + family validation
  const backendFamilies: Family[] = ['fullstack', 'backend']
  if (config.family && !backendFamilies.includes(config.family)) {
    const rustFrameworkOk = config.family === 'rust' && isRustFrameworkBackend(config.backend)
    if (config.backend && config.backend !== 'none' && !rustFrameworkOk) {
      warnings.push(
        `Backend selection is only applicable to the fullstack family. Ignored for ${config.family}.`,
      )
    }
    const rustDbOk = config.family === 'rust' && hasRustDatabaseOptions(config.family)
    if (config.database && config.database !== 'none' && !rustDbOk) {
      warnings.push(
        `Database selection is only applicable to the fullstack family. Ignored for ${config.family}.`,
      )
    }
    if (
      config.family === 'rust' &&
      config.database &&
      !['postgres', 'sqlite', 'none'].includes(config.database)
    ) {
      warnings.push(
        `Rust family supports postgres, sqlite, or none. "${config.database}" will be treated as none.`,
      )
    }
    if (config.orm && config.orm !== 'none') {
      warnings.push(
        `ORM selection is only applicable to the fullstack family. Ignored for ${config.family}.`,
      )
    }
  }

  return { warnings, errors }
}
