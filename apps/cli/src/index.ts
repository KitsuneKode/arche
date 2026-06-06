#!/usr/bin/env node
import { relative, resolve } from 'node:path'
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import pc from 'picocolors'
import { addFeature } from './lib/add'
import { renderCompletion } from './lib/completions'
import { createProject, validateConfig } from './lib/create'
import { tryRecordHistory, printHistory } from './lib/history'
import { buildReproducibleCommand } from './lib/reproducible'
import { scaffoldProject } from './lib/scaffold'
import { resolveDestinationDir, sanitizeProjectName } from './lib/slug'
import { startMcpServer } from './mcp'
import { packageManagerMenuOptions } from './registry/capabilities'
import { presetMenuOptions, projectDefaultsForPreset } from './registry/preset-config'
import type { Bundle, CLIArgs, Family, Preset, ProjectConfig } from './types/schemas'
import {
  BUNDLE_LABELS,
  checkCompatibility,
  FAMILY_LABELS,
  FamilySchema,
  hasBackendOptions,
  hasDatabaseOptions,
  hasOrmOptions,
  hasRustDatabaseOptions,
  familySupportsBundles,
  familySupportsShowcase,
  familySupportsWorker,
  PresetSchema,
} from './types/schemas'

const PKG_NAME = '@arche/create'
const PKG_VERSION = '0.2.0'
const SITE_URL = 'https://arche.kitsunelabs.xyz'

const SUBCOMMANDS = new Set([
  'mcp',
  'create-json',
  'validate',
  'add',
  'history',
  'completion',
  'create',
])

/** Support `arche create my-app` and legacy `arche my-app` / `create-arche my-app`. */
function normalizeArgv(argv: string[]): string[] {
  if (argv[0] === 'create') {
    return argv.slice(1)
  }
  if (argv.length === 0) return argv
  if (argv[0] && !SUBCOMMANDS.has(argv[0]) && !argv[0].startsWith('-')) {
    return argv
  }
  return argv
}

function printHelp(): void {
  console.log(`
${pc.cyan('arche')} / ${pc.cyan(PKG_NAME)} v${PKG_VERSION}

${pc.bold('Usage:')}
  npx arche create [project-name] [family] [options]
  bunx arche create [project-name] [family] [options]
  npx create-arche [project-name] [family] [options]

${pc.bold('Families:')}
  fullstack    Full-stack TypeScript monorepo (default)
  next        Standalone Next.js app
  backend     API-only service
  rust        Rust API service
  solana      Solana program
  convex      Next.js + Convex
  worker      Background job worker
  lib         Generic TypeScript package
  cli         CLI package
  mobile      Expo mobile app
  polyglot    Multi-language monorepo

${pc.bold('Options:')}
  --yes              Skip prompts, use defaults
  --dir=<path>       Output parent directory (default: current directory)
  --output=<path>    Alias for --dir
  --family=<name>    Project family (or pass as second positional argument)
  --preset=<name>    Starting point: typescript-fullstack, rust-api, rust-fullstack, solana-program, customize
  --pm=<pm>          Package manager: bun (default), pnpm (stable), npm (experimental)
  --bundle=<b>       Feature bundle: product, realtime, growth, infra, ai
  --git              Initialize git repository (default: yes)
  --no-git           Skip git initialization
  --install          Run bun install (default: yes)
  --no-install       Skip dependency installation
  --showcase         Keep landing/demo content (default: no)
  --no-showcase      Strip showcase content
  --worker           Keep background worker workspace (default: no)
  --no-worker        Remove worker workspace
  --docker           Generate docker-compose.yml (default: yes)
  --no-docker        Skip Docker file generation
  --ci               Generate GitHub Actions workflow (default: yes)
  --no-ci            Skip CI generation
  --tests=<mode>     Testing setup: bun, none (default: bun)
  --deployment=<m>   Deployment guide: vercel-railway, none (default: vercel-railway)
  --dry-run           Preview without writing files
  --backend=<b>      Backend: express-bun, hono-bun, rust-axum, rust-actix, go-fiber, python-fastapi, none
  --database=<d>     Database: postgres, sqlite, mongodb, none (default: postgres)
  --orm=<o>          ORM: prisma, drizzle, none (default: prisma)
  -v, --version      Show version number
  -h, --help         Show this help message

${pc.bold('Subcommands:')}
  mcp                Start MCP server for AI agent integration (stdio)
  create-json <json> Non-interactive create from JSON config
  validate <json>    Validate config without writing files
  add <feature> [dir] Add feature to existing project (docker, ci, websocket, etc.)
  history            Show recent scaffold activity
  completion <shell> Print shell completion for bash or zsh

${pc.bold('Examples:')}
  ${pc.dim('# Interactive mode')}
  npx arche create my-app

  ${pc.dim('# Scaffold outside the template repo')}
  npx arche create my-app --yes --dir=/tmp/projects

  ${pc.dim('# Non-interactive with JSON')}
  npx arche create-json '{"projectName":"my-app","destinationDir":"/tmp/my-app","family":"fullstack"}'

  ${pc.dim('# Validate without writing')}
  npx ${PKG_NAME} validate '{"projectName":"my-app","database":"mongodb","orm":"prisma"}'

  ${pc.dim('# Dry-run — preview files')}
  npx ${PKG_NAME} my-app --yes --dry-run

  ${pc.dim('# Specify family')}
  npx arche create my-app backend --bundle=product --yes

  ${pc.dim('# Skip Docker and CI')}
  npx ${PKG_NAME} my-app --no-docker --no-ci

${pc.bold('Documentation:')}
  ${SITE_URL}
`)
}

function parseArgs(argv: string[]): CLIArgs {
  const parsed: CLIArgs = { yes: false, help: false, version: false, dryRun: false }
  let positionalCount = 0

  // Check for subcommands
  if (argv[0] === 'mcp') {
    parsed._command = 'mcp'
    return parsed
  }
  if (argv[0] === 'create-json' && argv[1]) {
    parsed._command = 'create-json'
    try {
      parsed._jsonConfig = JSON.parse(argv[1])
    } catch {
      parsed._jsonConfig = { projectName: 'invalid' }
    }
    if (argv.includes('--dry-run')) parsed.dryRun = true
    return parsed
  }
  if (argv[0] === 'validate' && argv[1]) {
    parsed._command = 'validate'
    try {
      parsed._jsonConfig = JSON.parse(argv[1])
    } catch {
      parsed._jsonConfig = {}
    }
    return parsed
  }
  if (argv[0] === 'add' && argv[1]) {
    parsed._command = 'add'
    parsed._addFeature = argv[1]
    parsed._addDir = argv[2] || '.'
    if (argv.includes('--dry-run')) parsed.dryRun = true
    return parsed
  }
  if (argv[0] === 'history') {
    parsed._command = 'history'
    return parsed
  }
  if (argv[0] === 'completion') {
    parsed._command = 'completion'
    if (argv[1] === 'bash' || argv[1] === 'zsh') {
      parsed._completionShell = argv[1]
    }
    return parsed
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }
    if (arg === '--version' || arg === '-v') {
      parsed.version = true
      continue
    }

    if (!arg.startsWith('-')) {
      positionalCount++
      if (positionalCount === 1) {
        parsed.projectName = arg
      } else if (positionalCount === 2) {
        const result = FamilySchema.safeParse(arg)
        if (result.success) {
          parsed.family = result.data
        }
      }
      continue
    }

    if (arg === '--yes') parsed.yes = true
    if (arg === '--install') parsed.install = true
    if (arg === '--no-install') parsed.install = false
    if (arg === '--git') parsed.git = true
    if (arg === '--no-git') parsed.git = false
    if (arg === '--showcase') parsed.includeShowcase = true
    if (arg === '--no-showcase') parsed.includeShowcase = false
    if (arg === '--worker') parsed.includeWorker = true
    if (arg === '--no-worker') parsed.includeWorker = false
    if (arg === '--docker') parsed.includeDocker = true
    if (arg === '--no-docker') parsed.includeDocker = false
    if (arg === '--ci') parsed.includeCi = true
    if (arg === '--no-ci') parsed.includeCi = false
    if (arg === '--dry-run') parsed.dryRun = true

    if (arg.startsWith('--tests='))
      parsed.testing = arg.slice('--tests='.length) as CLIArgs['testing']
    if (arg.startsWith('--deployment='))
      parsed.deployment = arg.slice('--deployment='.length) as CLIArgs['deployment']
    if (arg.startsWith('--backend='))
      parsed.backend = arg.slice('--backend='.length) as CLIArgs['backend']
    if (arg.startsWith('--database='))
      parsed.database = arg.slice('--database='.length) as CLIArgs['database']
    if (arg.startsWith('--orm=')) parsed.orm = arg.slice('--orm='.length) as CLIArgs['orm']
    if (arg.startsWith('--example='))
      parsed.example = arg.slice('--example='.length) as CLIArgs['example']
    if (arg.startsWith('--pm=') || arg.startsWith('--package-manager=')) {
      const val = arg.startsWith('--pm=')
        ? arg.slice('--pm='.length)
        : arg.slice('--package-manager='.length)
      parsed.packageManager = val as CLIArgs['packageManager']
    }
    if (arg.startsWith('--bundle=')) {
      const val = arg.slice('--bundle='.length)
      parsed.bundles = val.split(',').filter(Boolean) as CLIArgs['bundles']
    }
    if (arg.startsWith('--family=')) {
      const val = arg.slice('--family='.length)
      const result = FamilySchema.safeParse(val)
      if (result.success) parsed.family = result.data
    }
    if (arg.startsWith('--preset=')) {
      const result = PresetSchema.safeParse(arg.slice('--preset='.length))
      if (result.success) parsed.preset = result.data
    }
    if (arg.startsWith('--dir=')) {
      parsed.dir = arg.slice('--dir='.length)
    }
    if (arg.startsWith('--output=')) {
      parsed.dir = arg.slice('--output='.length)
    }
  }

  return parsed
}

async function promptIfNeeded<T>(value: T | undefined, prompt: () => Promise<T>): Promise<T> {
  if (value !== undefined) return value
  return prompt()
}

const FAMILIES: Family[] = [
  'fullstack',
  'next',
  'backend',
  'rust',
  'solana',
  'convex',
  'worker',
  'lib',
  'cli',
  'mobile',
  'polyglot',
]

const BUNDLES: Bundle[] = ['product', 'realtime', 'growth', 'infra', 'ai']

async function main(): Promise<void> {
  const args = parseArgs(normalizeArgv(process.argv.slice(2)))

  if (args.version) {
    console.log(PKG_VERSION)
    process.exit(0)
  }

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  // --- Subcommands ---

  // arche mcp — start MCP server for AI agent integration
  if (args._command === 'mcp') {
    startMcpServer()
    return
  }

  // arche create-json <json-string> — non-interactive JSON config
  if (args._command === 'create-json' && args._jsonConfig) {
    const raw = args._jsonConfig as ProjectConfig
    const { projectName, destinationDir } = raw.destinationDir
      ? {
          projectName: sanitizeProjectName(raw.projectName || 'project'),
          destinationDir: resolve(raw.destinationDir),
        }
      : resolveDestinationDir(raw.projectName || 'project', args.dir)
    const config = { ...raw, projectName, destinationDir } as ProjectConfig
    const result = await createProject({
      config: { ...config, destinationDir },
      dryRun: args.dryRun,
    })
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.success ? 0 : 1)
  }

  // arche validate — validate config without writing
  if (args._command === 'validate' && args._jsonConfig) {
    const result = validateConfig(args._jsonConfig as Partial<ProjectConfig>)
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.valid ? 0 : 1)
  }

  // arche history — show scaffold history
  if (args._command === 'history') {
    printHistory()
    process.exit(0)
  }

  // arche completion <bash|zsh> — print shell completion script
  if (args._command === 'completion') {
    if (!args._completionShell) {
      console.error('Usage: arche completion <bash|zsh>')
      process.exit(1)
    }
    console.log(renderCompletion(args._completionShell))
    process.exit(0)
  }

  // arche add <feature> [dir] — add feature to existing project
  if (args._command === 'add' && args._addFeature) {
    const result = await addFeature({
      feature: args._addFeature,
      destinationDir: resolve(process.cwd(), args._addDir || '.'),
    })
    if (result.success) {
      console.log(`Added "${result.feature}":\n  ${result.generatedFiles.join('\n  ')}`)
      process.exit(0)
    } else {
      console.error(`Failed: ${result.errors.join(', ')}`)
      if (result.warnings.length) console.warn(`Warnings: ${result.warnings.join(', ')}`)
      process.exit(1)
    }
  }

  intro(
    `${pc.cyan('Arche')} ${pc.dim(`v${PKG_VERSION}`)} — production-ready scaffolds\n${pc.dim(SITE_URL)}`,
  )

  // --- Project name ---

  const rawProjectName = await promptIfNeeded(args.projectName, async () => {
    const value = await text({
      message: 'Project name',
      placeholder: 'my-arche-app',
      defaultValue: 'my-arche-app',
      validate: (input) => {
        try {
          sanitizeProjectName(input ?? '')
          return undefined
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      },
    })
    if (isCancel(value)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }
    return String(value)
  })

  const { projectName, destinationDir } = resolveDestinationDir(rawProjectName, args.dir)

  const preset: Preset | undefined = args.yes
    ? args.preset
    : await promptIfNeeded(args.preset, async () => {
        const value = await select({
          message: 'Starting point',
          initialValue: 'typescript-fullstack',
          options: presetMenuOptions(),
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value as Preset
      })
  const presetDefaults = preset ? projectDefaultsForPreset(preset) : {}

  // --- Family selection ---

  const defaultFamily = args.family ?? presetDefaults.family
  const family: Family = args.yes
    ? (defaultFamily ?? 'fullstack')
    : defaultFamily
      ? defaultFamily
      : await promptIfNeeded(args.family, async () => {
          const value = await select({
            message: 'Project family',
            options: FAMILIES.map((f) => ({
              label: f,
              value: f,
              hint: FAMILY_LABELS[f],
            })),
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as Family
        })

  // --- Family-specific prompts ---

  let backend: ProjectConfig['backend'] = 'express-bun'
  let database: ProjectConfig['database'] = 'postgres'
  let orm: ProjectConfig['orm'] = 'prisma'
  let presets: ProjectConfig['presets'] = []
  let includeShowcase = false
  let includeWorker = false
  const rustFramework: ProjectConfig['backend'] = 'rust-axum'
  let rustDatabase: ProjectConfig['database'] = 'postgres'
  let rustExample: ProjectConfig['example'] = 'posts'
  let rustAuth: ProjectConfig['rustAuth'] = 'placeholder'

  if (family === 'rust') {
    rustDatabase = args.yes
      ? (args.database ?? presetDefaults.database ?? 'postgres')
      : await promptIfNeeded(args.database, async () => {
          const value = await select({
            message: 'Database (sqlx)',
            initialValue: 'postgres',
            options: [
              { label: 'PostgreSQL', value: 'postgres', hint: 'recommended' },
              { label: 'SQLite', value: 'sqlite', hint: 'file-based, good for local dev' },
              { label: 'None', value: 'none', hint: 'API-only, no sqlx' },
            ],
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as ProjectConfig['database']
        })

    rustExample = args.yes
      ? args.example === 'none'
        ? 'none'
        : (presetDefaults.example ?? 'posts')
      : await promptIfNeeded(args.example === 'none' ? 'none' : undefined, async () => {
          const value = await confirm({
            message: 'Include example posts module (routes → handler → service → repository)?',
            initialValue: true,
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value ? ('posts' as const) : ('none' as const)
        })

    rustAuth = args.yes
      ? (presetDefaults.rustAuth ?? 'placeholder')
      : await promptIfNeeded(undefined, async () => {
          const value = await select({
            message: 'Auth scaffold',
            initialValue: 'placeholder',
            options: [
              {
                label: 'Placeholder CurrentUser',
                value: 'placeholder' as const,
                hint: 'Bearer demo header for learning',
              },
              { label: 'None', value: 'none' as const, hint: 'no auth helpers' },
            ],
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as ProjectConfig['rustAuth']
        })
  }

  if (hasBackendOptions(family)) {
    backend = args.yes
      ? (args.backend ?? presetDefaults.backend ?? 'express-bun')
      : await promptIfNeeded(args.backend, async () => {
          const value = await select({
            message: 'Backend framework',
            initialValue: 'express-bun',
            options: [
              {
                label: 'Express (Bun)',
                value: 'express-bun',
                hint: 'production-ready, current default',
              },
              { label: 'Hono (Bun)', value: 'hono-bun', hint: 'lightweight, edge-ready' },
              {
                label: 'Rust (Axum)',
                value: 'rust-axum' as const,
                hint: 'experimental — replaces apps/server with services/api',
              },
              {
                label: 'Rust (Actix Web)',
                value: 'rust-actix' as const,
                hint: 'experimental — Actix in services/api',
              },
            ],
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as ProjectConfig['backend']
        })

    database = args.yes
      ? (args.database ?? presetDefaults.database ?? 'postgres')
      : await promptIfNeeded(args.database, async () => {
          const value = await select({
            message: 'Database',
            initialValue: 'postgres',
            options: [
              { label: 'PostgreSQL', value: 'postgres', hint: 'recommended for production' },
              { label: 'SQLite', value: 'sqlite', hint: 'zero-config, file-based' },
              { label: 'MongoDB', value: 'mongodb', hint: 'document database' },
              { label: 'None', value: 'none', hint: 'API-only or external DB' },
            ],
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as ProjectConfig['database']
        })

    orm = args.yes
      ? (args.orm ?? presetDefaults.orm ?? 'prisma')
      : await promptIfNeeded(args.orm, async () => {
          const ormOptions =
            database === 'none'
              ? [{ label: 'None', value: 'none' as const, hint: 'no database selected' }]
              : database === 'mongodb'
                ? [
                    {
                      label: 'Prisma',
                      value: 'prisma' as const,
                      hint: 'type-safe, MongoDB support',
                    },
                    { label: 'None', value: 'none' as const, hint: 'raw queries' },
                  ]
                : [
                    {
                      label: 'Prisma',
                      value: 'prisma' as const,
                      hint: 'type-safe, migration support',
                    },
                    { label: 'Drizzle', value: 'drizzle' as const, hint: 'lightweight, SQL-first' },
                    { label: 'None', value: 'none' as const, hint: 'raw queries' },
                  ]
          const value = await select({
            message: 'ORM',
            initialValue: database === 'none' ? 'none' : 'prisma',
            options: ormOptions,
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as ProjectConfig['orm']
        })
  }

  presets = args.presets ?? []

  // --- Bundle selection ---

  const bundles: Bundle[] = familySupportsBundles(family)
    ? args.yes
      ? (args.bundles ?? presetDefaults.bundles ?? ['product'])
      : await promptIfNeeded(args.bundles, async () => {
          const value = await multiselect({
            message: 'Feature bundles (additive)',
            options: BUNDLES.map((b) => ({
              label: b,
              value: b,
              hint: BUNDLE_LABELS[b],
            })),
            initialValues: ['product'],
            required: false,
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value as Bundle[]
        })
    : []

  // --- Project structure prompts ---

  if (familySupportsShowcase(family)) {
    includeShowcase = args.yes
      ? (args.includeShowcase ?? presetDefaults.includeShowcase ?? false)
      : await promptIfNeeded(args.includeShowcase, async () => {
          const value = await confirm({
            message: 'Keep showcase landing routes and demo content?',
            initialValue: false,
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value
        })
  }

  if (familySupportsWorker(family)) {
    includeWorker = args.yes
      ? (args.includeWorker ?? presetDefaults.includeWorker ?? false)
      : await promptIfNeeded(args.includeWorker, async () => {
          const value = await confirm({
            message: 'Include the background worker workspace?',
            initialValue: false,
          })
          if (isCancel(value)) {
            cancel('Project creation cancelled.')
            process.exit(0)
          }
          return value
        })
  }

  const packageManager = args.yes
    ? (args.packageManager ?? 'bun')
    : await promptIfNeeded(args.packageManager, async () => {
        const value = await select({
          message: 'Package manager',
          initialValue: 'bun',
          options: packageManagerMenuOptions(),
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value as ProjectConfig['packageManager']
      })

  const testing = args.yes
    ? (args.testing ?? 'bun')
    : await promptIfNeeded(args.testing, async () => {
        const value = await select({
          message: 'Testing setup',
          initialValue: 'bun',
          options: [
            { label: 'Bun tests workspace', value: 'bun', hint: 'keep starter script tests' },
            { label: 'None', value: 'none', hint: 'remove the tests workspace' },
          ],
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value as ProjectConfig['testing']
      })

  const includeDocker = args.yes
    ? (args.includeDocker ?? presetDefaults.includeDocker ?? true)
    : await promptIfNeeded(args.includeDocker, async () => {
        const dockerHint =
          database === 'postgres'
            ? 'Generate a local Docker Compose file for PostgreSQL and Redis?'
            : database === 'mongodb'
              ? 'Generate a local Docker Compose file for MongoDB and Redis?'
              : 'Generate a local Docker Compose file for Redis?'
        const value = await confirm({
          message: dockerHint,
          initialValue: true,
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value
      })

  const includeCi = args.yes
    ? (args.includeCi ?? presetDefaults.includeCi ?? true)
    : await promptIfNeeded(args.includeCi, async () => {
        const value = await confirm({
          message: 'Generate a GitHub Actions CI workflow?',
          initialValue: true,
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value
      })

  const deployment = args.yes
    ? (args.deployment ?? presetDefaults.deployment ?? 'vercel-railway')
    : await promptIfNeeded(args.deployment, async () => {
        const value = await select({
          message: 'Deployment guide',
          initialValue: 'vercel-railway',
          options: [
            {
              label: 'Vercel + Railway guide',
              value: 'vercel-railway',
              hint: 'recommended split for this stack',
            },
            { label: 'None', value: 'none', hint: 'skip deployment notes' },
          ],
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value as ProjectConfig['deployment']
      })

  const initializeGit = args.yes
    ? (args.git ?? true)
    : await promptIfNeeded(args.git, async () => {
        const value = await confirm({
          message: 'Initialize a fresh git repository in the generated project?',
          initialValue: true,
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value
      })

  const installDependencies = args.yes
    ? (args.install ?? family !== 'rust')
    : await promptIfNeeded(args.install, async () => {
        const installCmd =
          packageManager === 'pnpm'
            ? 'pnpm install'
            : packageManager === 'npm'
              ? 'npm install'
              : 'bun install'
        const value = await confirm({
          message: `Run ${installCmd} after generation?`,
          initialValue: true,
        })
        if (isCancel(value)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }
        return value
      })

  const options: ProjectConfig = {
    destinationDir,
    projectName,
    preset,
    family,
    bundles,
    packageManager,
    backend:
      family === 'rust'
        ? rustFramework
        : family === 'backend'
          ? 'express-bun'
          : hasBackendOptions(family)
            ? backend
            : 'none',
    database: hasRustDatabaseOptions(family)
      ? rustDatabase
      : hasDatabaseOptions(family)
        ? database
        : 'none',
    orm: hasOrmOptions(family) ? orm : 'none',
    vectorDatabase: 'none',
    runtime: 'bun',
    addons: [],
    example: family === 'rust' ? rustExample : 'none',
    rustAuth: family === 'rust' ? rustAuth : 'placeholder',
    includeShowcase,
    includeWorker,
    testing,
    includeDocker,
    includeCi,
    deployment,
    initializeGit,
    installDependencies,
    presets,
  }

  const { warnings, errors } = checkCompatibility(options)

  if (errors.length > 0) {
    cancel(`Incompatible options:\n${errors.map((e) => `  ${pc.red('x')} ${e}`).join('\n')}`)
    process.exit(1)
  }

  if (warnings.length > 0) {
    note(warnings.map((w) => `${pc.yellow('!')} ${w}`).join('\n'), 'Compatibility warnings')
  }

  note(
    [
      `Project: ${pc.bold(projectName)}`,
      `Output: ${destinationDir}`,
      `Family: ${options.family}`,
      `Bundles: ${options.bundles.join(', ') || 'none'}`,
      `Package manager: ${options.packageManager}`,
      family === 'rust' || hasBackendOptions(family) ? `Backend: ${options.backend}` : null,
      hasDatabaseOptions(family) ? `Database: ${options.database}` : null,
      hasOrmOptions(family) ? `ORM: ${options.orm}` : null,
      presets.length > 0 ? `Presets: ${presets.join(', ')}` : null,
      `Testing: ${options.testing}`,
      `Docker: ${options.includeDocker ? 'generate' : 'skip'}`,
      `CI: ${options.includeCi ? 'generate' : 'skip'}`,
      `Deployment guide: ${options.deployment}`,
      `Install deps: ${options.installDependencies ? 'yes' : 'no'}`,
    ]
      .filter(Boolean)
      .join('\n'),
    'Bootstrap plan',
  )

  const step = spinner()
  step.start('Generating project...')

  try {
    const result = await scaffoldProject(options, args.dryRun)
    if (args.dryRun) {
      step.stop('Dry-run complete — no files written.')
      note(JSON.stringify({ plannedFiles: result.generatedFiles }, null, 2), 'Dry-run plan')
      process.exit(0)
    }
    step.stop('Project generated successfully.')

    // History is a convenience; creation must still succeed in read-only homes and CI.
    tryRecordHistory({
      timestamp: new Date().toISOString(),
      projectName,
      destinationDir,
      family: options.family,
      backend: options.backend,
      database: options.database,
      orm: options.orm,
      reproducible: buildReproducibleCommand(options),
    })

    note(
      [
        `Path: ${result.destinationDir}`,
        `Scope: @${result.packageName}`,
        `Cleanup targets: ${result.cleanupTargets.join(', ') || 'none'}`,
        `Generated files: ${result.generatedFiles.join(', ') || 'none'}`,
      ].join('\n'),
      'Result',
    )

    const cdPath = relative(process.cwd(), result.destinationDir) || '.'
    const installHint =
      options.packageManager === 'pnpm'
        ? 'pnpm install'
        : options.packageManager === 'npm'
          ? 'npm install'
          : 'bun install'
    const repro = buildReproducibleCommand(options)
    const devCmd =
      options.family === 'rust'
        ? 'cargo run'
        : options.backend === 'rust-axum' || options.backend === 'rust-actix'
          ? `${options.packageManager === 'npm' ? 'npm' : options.packageManager} run dev:web\n  ${options.packageManager === 'npm' ? 'npm' : options.packageManager} run dev:api`
          : options.family === 'backend'
            ? `${options.packageManager === 'npm' ? 'npm' : options.packageManager} run dev`
            : `${options.packageManager === 'npm' ? 'npm' : options.packageManager} run dev`
    outro(
      `${pc.green('Project ready.')}\n\n` +
        `${pc.bold('Next steps')}\n` +
        `  cd ${cdPath}\n` +
        `${options.installDependencies ? '' : `  ${installHint}\n`}` +
        `  ${devCmd}\n\n` +
        `${pc.dim('Reproduce this scaffold:')}\n` +
        `  ${repro}`,
    )
  } catch (error) {
    step.stop('Project generation failed.')
    cancel(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(pc.red('Fatal error:'), error)
  process.exit(1)
})
