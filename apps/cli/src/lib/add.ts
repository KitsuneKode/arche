import { constants } from 'node:fs'
import { access, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { renderInternalDocsIndex, renderPlansIndex } from '../render/docs/agent-context'
import type { ProjectConfig } from '../types/schemas'
import { checkCompatibility } from '../types/schemas'
import { validateConfig } from './create'
import { buildGeneratedArchitectureMd, buildRootAgentsMd } from './generators/agent-docs'
import { renderGithubActionsWorkflow } from './generators/ci'
import { renderDockerCompose, renderDockerComposeProd } from './generators/docker'
import { buildServerEnv } from './generators/env'

export interface ProjectConfigFile {
  $schema: string
  version: string
  createdAt: string
  family: string
  packageManager: string
  choices: Record<string, unknown>
  reproducible: string
}

export interface AddOptions {
  feature: string
  destinationDir: string
  params?: Record<string, string>
}

export interface AddResult {
  success: boolean
  feature: string
  errors: string[]
  warnings: string[]
  generatedFiles: string[]
}

const VALID_FEATURES = [
  'docker',
  'ci',
  'websocket',
  'worker',
  'analytics',
  'email',
  's3',
  'payments',
] as const

const BLOCKED_FEATURES_BY_FAMILY: Partial<Record<ProjectConfig['family'], string[]>> = {
  convex: ['docker', 'worker', 'websocket'],
  next: ['worker', 'websocket'],
  mobile: ['docker', 'ci', 'worker', 'websocket'],
}

async function readProjectConfig(destinationDir: string): Promise<ProjectConfigFile | null> {
  const configPath = join(destinationDir, 'arche.json')
  try {
    await access(configPath, constants.F_OK)
  } catch {
    return null
  }

  try {
    const raw = await readFile(configPath, 'utf8')
    const cleaned = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    return JSON.parse(cleaned) as ProjectConfigFile
  } catch {
    return null
  }
}

function buildProjectConfig(
  baseDir: string,
  feature: string,
  config: ProjectConfigFile | null,
): ProjectConfig {
  const family = (config?.family as ProjectConfig['family']) || 'fullstack'
  const pm = (config?.packageManager as ProjectConfig['packageManager']) || 'bun'

  return {
    projectName: 'existing-project',
    destinationDir: baseDir,
    family,
    bundles: ['product'],
    packageManager: pm,
    backend: (config?.choices?.backend as ProjectConfig['backend']) || 'express-bun',
    database: (config?.choices?.database as ProjectConfig['database']) || 'postgres',
    orm: (config?.choices?.orm as ProjectConfig['orm']) || 'prisma',
    vectorDatabase: 'none',
    runtime: 'bun',
    example: 'none',
    testing: (config?.choices?.testing as ProjectConfig['testing']) || 'bun',
    deployment: (config?.choices?.deployment as ProjectConfig['deployment']) || 'vercel-railway',
    includeDocker: feature === 'docker' || (config?.choices?.includeDocker as boolean) || false,
    includeCi: feature === 'ci' || (config?.choices?.includeCi as boolean) || false,
    includeShowcase: false,
    includeWorker: feature === 'worker',
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
  }
}

async function writeGeneratedFile(
  baseDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const filePath = join(baseDir, relativePath)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
}

async function writeGeneratedClaudeSymlink(baseDir: string): Promise<void> {
  const filePath = join(baseDir, 'CLAUDE.md')
  await rm(filePath, { force: true })
  await symlink('AGENTS.md', filePath)
}

async function patchRootWorkspaces(baseDir: string, packageDir: string): Promise<void> {
  const pkgPath = join(baseDir, 'package.json')
  try {
    await access(pkgPath, constants.F_OK)
  } catch {
    return
  }

  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
    workspaces?: string[]
  }
  if (!Array.isArray(pkg.workspaces)) return

  const hasGlob = pkg.workspaces.some((entry) => entry.includes('*'))
  if (hasGlob) return

  if (!pkg.workspaces.includes(packageDir)) {
    pkg.workspaces.push(packageDir)
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
}

async function addDockerCompose(baseDir: string, config: ProjectConfig): Promise<string[]> {
  const files: string[] = []
  await writeGeneratedFile(baseDir, 'docker-compose.yml', renderDockerCompose(config))
  files.push('docker-compose.yml')
  await writeGeneratedFile(baseDir, 'docker-compose.prod.yml', renderDockerComposeProd(config))
  files.push('docker-compose.prod.yml')
  return files
}

async function addCi(baseDir: string, config: ProjectConfig): Promise<string[]> {
  const files: string[] = []
  await writeGeneratedFile(baseDir, '.github/workflows/ci.yml', renderGithubActionsWorkflow(config))
  files.push('.github/workflows/ci.yml')
  return files
}

async function addEnvFiles(baseDir: string, config: ProjectConfig): Promise<string[]> {
  const files: string[] = []
  const serverEnv = buildServerEnv(config)
  await writeGeneratedFile(baseDir, 'apps/server/.env.example', serverEnv)
  files.push('apps/server/.env.example')
  return files
}

async function addAgentDocs(baseDir: string, config: ProjectConfig): Promise<string[]> {
  const files: string[] = []
  await writeGeneratedFile(baseDir, 'AGENTS.md', buildRootAgentsMd(config))
  files.push('AGENTS.md')
  await writeGeneratedClaudeSymlink(baseDir)
  files.push('CLAUDE.md')
  await writeGeneratedFile(baseDir, '.docs/README.md', renderInternalDocsIndex())
  files.push('.docs/README.md')
  await writeGeneratedFile(
    baseDir,
    '.docs/architecture/generated-project.md',
    buildGeneratedArchitectureMd(config),
  )
  files.push('.docs/architecture/generated-project.md')
  await writeGeneratedFile(baseDir, '.plans/README.md', renderPlansIndex())
  files.push('.plans/README.md')
  return files
}

async function addWebsocketStub(baseDir: string, _config: ProjectConfig): Promise<string[]> {
  const files: string[] = []
  const wsDir = 'packages/websocket'
  const content = `// WebSocket server stub
import { WebSocketServer } from 'ws'

export function createWSServer(port = 3002) {
  const wss = new WebSocketServer({ port })
  console.log(\`WebSocket server running on port \${port}\`)
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      ws.send(\`Echo: \${data}\`)
    })
  })
  return wss
}
`
  await writeGeneratedFile(baseDir, `${wsDir}/src/index.ts`, content)
  files.push(`${wsDir}/src/index.ts`)

  const pkgJson = JSON.stringify(
    {
      name: '@app/websocket',
      private: true,
      type: 'module',
      scripts: { dev: 'tsx watch src/index.ts', build: 'tsc' },
      dependencies: { ws: '^8' },
      devDependencies: { '@types/ws': '^8', tsx: '^4', typescript: '^5' },
    },
    null,
    2,
  )
  await writeGeneratedFile(baseDir, `${wsDir}/package.json`, pkgJson + '\n')
  files.push(`${wsDir}/package.json`)

  const tsconfig = JSON.stringify(
    {
      extends: '@arche-template/typescript-config/backend.json',
      include: ['src'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2,
  )
  await writeGeneratedFile(baseDir, `${wsDir}/tsconfig.json`, tsconfig + '\n')
  files.push(`${wsDir}/tsconfig.json`)
  await patchRootWorkspaces(baseDir, wsDir)

  return files
}

async function addFeatureStub(
  baseDir: string,
  feature: string,
  _config: ProjectConfig,
): Promise<string[]> {
  const dir = `packages/${feature}`
  const content = `// ${feature} stub — add your implementation here\nexport const placeholder = true\n`
  await writeGeneratedFile(baseDir, `${dir}/src/index.ts`, content)

  const pkgJson = JSON.stringify(
    {
      name: `@app/${feature}`,
      private: true,
      type: 'module',
      scripts: { dev: 'tsx watch src/index.ts', build: 'tsc' },
      devDependencies: { tsx: '^4', typescript: '^5' },
    },
    null,
    2,
  )
  await writeGeneratedFile(baseDir, `${dir}/package.json`, pkgJson + '\n')
  await patchRootWorkspaces(baseDir, dir)

  return [`${dir}/src/index.ts`, `${dir}/package.json`]
}

const FEATURE_HANDLERS: Record<
  string,
  (baseDir: string, config: ProjectConfig) => Promise<string[]>
> = {
  docker: addDockerCompose,
  ci: addCi,
  env: addEnvFiles,
  'agent-docs': addAgentDocs,
  websocket: addWebsocketStub,
  worker: async (baseDir, config) => addFeatureStub(baseDir, 'worker', config),
  analytics: async (baseDir, config) => addFeatureStub(baseDir, 'analytics', config),
  email: async (baseDir, config) => addFeatureStub(baseDir, 'email', config),
  s3: async (baseDir, config) => addFeatureStub(baseDir, 's3', config),
  payments: async (baseDir, config) => addFeatureStub(baseDir, 'payments', config),
}

/**
 * Add a feature to an existing scaffolded project.
 * Requires arche.json to detect current config.
 */
export async function addFeature(options: AddOptions): Promise<AddResult> {
  const { feature, destinationDir } = options
  const generatedFiles: string[] = []
  const warnings: string[] = []

  if (
    !VALID_FEATURES.includes(feature as (typeof VALID_FEATURES)[number]) &&
    !FEATURE_HANDLERS[feature]
  ) {
    return {
      success: false,
      feature,
      errors: [
        `Unknown feature: "${feature}". Valid: ${[...VALID_FEATURES, ...Object.keys(FEATURE_HANDLERS)].join(', ')}`,
      ],
      warnings: [],
      generatedFiles: [],
    }
  }

  try {
    await access(destinationDir, constants.F_OK)
  } catch {
    return {
      success: false,
      feature,
      errors: [`Destination directory does not exist: ${destinationDir}`],
      warnings: [],
      generatedFiles: [],
    }
  }

  const configFile = await readProjectConfig(destinationDir)
  if (!configFile) {
    warnings.push('No arche.json found. Using fullstack defaults.')
  }

  const family = (configFile?.family as ProjectConfig['family']) || 'fullstack'
  const blocked = BLOCKED_FEATURES_BY_FAMILY[family] ?? []
  if (blocked.includes(feature)) {
    return {
      success: false,
      feature,
      errors: [`Feature "${feature}" is not compatible with family "${family}".`],
      warnings: [],
      generatedFiles: [],
    }
  }

  const config = buildProjectConfig(destinationDir, feature, configFile)
  const compatibility = checkCompatibility(config)
  const validation = validateConfig(config)
  const errors = [...compatibility.errors, ...validation.errors]
  const allWarnings = [...compatibility.warnings, ...validation.warnings, ...warnings]

  if (errors.length > 0) {
    return {
      success: false,
      feature,
      errors,
      warnings: allWarnings,
      generatedFiles: [],
    }
  }

  const handler = FEATURE_HANDLERS[feature]
  if (handler) {
    const files = await handler(destinationDir, config)
    generatedFiles.push(...files)
  }

  if (configFile) {
    configFile.choices = {
      ...configFile.choices,
      addons: [...((configFile.choices.addons as string[]) || []), feature],
    }
    await writeGeneratedFile(
      destinationDir,
      'arche.json',
      JSON.stringify(configFile, null, 2) + '\n',
    )
    generatedFiles.push('arche.json (updated)')
  }

  allWarnings.push('Run `bun install` in the project root to link new workspace packages.')

  return {
    success: true,
    feature,
    errors: [],
    warnings: allWarnings,
    generatedFiles,
  }
}
