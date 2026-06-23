import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderInternalDocsIndex, renderPlansIndex } from '../render/docs/agent-context'
import { renderTurboJson } from '../render/turbo/render-turbo-json'
import { applyJavaScriptPackageManagerFoundation } from '../render/workspace/foundation'
import type { Family, ProjectConfig, CleanupTarget } from '../types/schemas'
import {
  familySupportsBundles,
  familySupportsMonorepoTransforms,
  familySupportsRenameScope,
  familySupportsTemplateCleanup,
} from '../types/schemas'
import { buildCleanupTargets } from './cleanup-targets'
import {
  renderDockerCompose,
  renderDockerComposeProd,
  renderGithubActionsWorkflow,
  renderNginxConfig,
  buildServerEnv,
  buildWebEnv,
  renderDeploymentGuide,
  applyBackendTransform,
  applyRustFamilyTransform,
  applyRustScaffoldTransform,
  applySolanaScaffoldTransform,
  renderGitignore,
  applyDatabaseTransform,
  applyOrmTransform,
  buildGeneratedArchitectureMd,
  buildRootAgentsMd,
  buildReadme,
  buildShowcaseMdx,
  writeSkillConfigs,
  applyBundleTransforms,
  renderRustEnvExample,
  renderServiceApiWebLayout,
  renderServiceApiWebPage,
  renderServiceApiWebProviders,
  renderServiceApiWebQueryClient,
} from './generators'
import { adaptScripts, pmInstallParts } from './pm'
import { buildReproducibleCommand } from './reproducible'
import { sanitizeProjectName as _sanitizeProjectName } from './slug'

export { buildCleanupTargets } from './cleanup-targets'
export { sanitizeProjectName } from './slug'
export { buildReproducibleCommand } from './reproducible'
import { runCommand, tryCommand } from './spawn'
import { readWebCoreFile, WEB_CORE_BOUNDARY_FILES } from './web-core'

export interface ScaffoldResult {
  destinationDir: string
  packageName: string
  cleanupTargets: CleanupTarget[]
  generatedFiles: string[]
  installResult: 'skipped' | 'succeeded' | 'failed'
  installError?: string
}

const EXCLUDED_SEGMENTS = new Set([
  '.git',
  '.bun-tmp',
  '.turbo',
  '.vercel',
  '.source',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'target',
  '.claude',
  '.cursor',
  '.vscode',
  '.opencode',
  '.codebuddy',
  'logs',
])

/** Path segments that must never appear in scaffold output (manifest copy included). */
const SECRET_OR_LOCAL_ARTIFACT_SEGMENTS = new Set(['.vercel', 'logs'])

// Files that should not appear in scaffolded output
const EXCLUDED_FILES = new Set([
  'turbo.json',
  'bun.lock',
  // Root agent files are regenerated so CLAUDE.md can point at canonical AGENTS.md.
  'AGENTS.md',
  'CLAUDE.md',
  'CONTEXT.md',
  'docs/cli-development.md',
  'docs/archive',
  // Never copy actual .env files — only .env.example
  '.env',
  'apps/server/.env',
  'apps/web/.env',
  'apps/worker/.env',
  'packages/auth/.env',
  'packages/store/.env',
  'apps/server/.env.example',
  'apps/web/.env.example',
])

// Node.js compatible path resolution (works in both Node and Bun)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Detect if running from bundled dist or source
// Source: apps/cli/src/lib/scaffold.ts
// Bundled: apps/cli/dist/index.js with templates published at apps/cli/src/templates
const isBundled = __dirname.includes('/dist') || !__dirname.includes('/src/')
const PACKAGE_DIR = resolve(__dirname, isBundled ? '..' : '../..')

/** Map family to a package-owned template source directory. */
function resolveTemplateSource(family: Family): string {
  if (family.startsWith('_')) {
    throw new Error(`Family "${family}" is an internal template source, not scaffoldable.`)
  }
  const candidates = [
    resolve(__dirname, '../templates', family),
    join(PACKAGE_DIR, 'src', 'templates', family),
  ]

  for (const familyDir of candidates) {
    if (existsSync(familyDir)) return familyDir
  }

  throw new Error(
    `Missing scaffold template for family "${family}". ` +
      `The published package must include src/templates/${family}.`,
  )
}

/** Monorepo families have the full apps/packages/ structure */
function isMonorepoFamily(family: Family): boolean {
  return family === 'fullstack' || family === 'polyglot'
}

/** Families that should strip the web workspace */
function shouldStripWeb(family: Family): boolean {
  return family === 'backend'
}

/** Families that should strip the server workspace */
function shouldStripServer(family: Family): boolean {
  return family === 'next' || family === 'mobile' || family === 'tanstack'
}

function backendUsesServiceApi(backend: ProjectConfig['backend']): boolean {
  return (
    backend === 'rust-axum' ||
    backend === 'rust-actix' ||
    backend === 'go-fiber' ||
    backend === 'python-fastapi'
  )
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function isSubPath(parent: string, child: string): boolean {
  const rel = relative(parent, child)
  if (!rel || rel === '..') return false
  return !rel.startsWith('..') && !rel.startsWith('/')
}

async function ensureDestinationAvailable(
  destinationDir: string,
  sourceDir: string,
): Promise<void> {
  if (isSubPath(sourceDir, destinationDir)) {
    throw new Error(
      `Destination directory must be outside the template source.\n` +
        `  Source: ${sourceDir}\n` +
        `  Destination: ${destinationDir}\n` +
        `Tip: Use a path one level above the monorepo, e.g. ~/projects/my-app`,
    )
  }

  if (!(await pathExists(destinationDir))) return

  const entries = await readdir(destinationDir)
  if (entries.length > 0) {
    throw new Error(`Destination directory is not empty: ${destinationDir}`)
  }
}

export async function rollbackDestination(
  destinationDir: string,
  existedBefore: boolean,
): Promise<void> {
  try {
    if (!(await pathExists(destinationDir))) return
    if (existedBefore) {
      for (const entry of await readdir(destinationDir)) {
        await rm(join(destinationDir, entry), { recursive: true, force: true })
      }
    } else {
      await rm(destinationDir, { recursive: true, force: true })
    }
  } catch {
    // Best-effort cleanup; surface the original error to the caller.
  }
}

function isSecretEnvFile(fileName: string): boolean {
  return fileName.startsWith('.env') && !fileName.endsWith('.example')
}

function shouldCopyPath(relativePath: string, extraExclude?: string[]): boolean {
  if (!relativePath) return true

  const segments = relativePath.split('/').filter(Boolean)
  if (segments[0] === 'apps' && segments[1] === 'cli') return false
  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) return false
  if (segments.some((segment) => SECRET_OR_LOCAL_ARTIFACT_SEGMENTS.has(segment))) return false
  if (EXCLUDED_FILES.has(relativePath)) return false
  if (
    extraExclude?.some(
      (pattern) => relativePath === pattern || relativePath.startsWith(`${pattern}/`),
    )
  ) {
    return false
  }

  const fileName = segments.at(-1) ?? ''
  if (isSecretEnvFile(fileName)) return false

  return true
}

interface ArcheFilesManifest {
  version: string
  include: string[]
  exclude?: string[]
}

async function loadManifest(sourceDir: string): Promise<ArcheFilesManifest | null> {
  const manifestPath = join(sourceDir, '.archefiles.json')
  try {
    const raw = await readFile(manifestPath, 'utf8')
    return JSON.parse(raw) as ArcheFilesManifest
  } catch {
    return null
  }
}

function manifestRelativePath(includeRoot: string, pathInsideInclude: string): string {
  if (!pathInsideInclude) return includeRoot
  return `${includeRoot}/${pathInsideInclude}`
}

async function copyWithManifest(
  destinationDir: string,
  sourceDir: string,
  manifest: ArcheFilesManifest,
): Promise<void> {
  const extraExclude = manifest.exclude ?? []

  for (const relativePath of manifest.include) {
    const srcPath = join(sourceDir, relativePath)
    const destPath = join(destinationDir, relativePath)
    try {
      const srcStat = await stat(srcPath)
      if (srcStat.isDirectory()) {
        await cp(srcPath, destPath, {
          recursive: true,
          filter: (sourcePath) => {
            const pathInsideInclude =
              sourcePath === srcPath ? '' : sourcePath.slice(srcPath.length + 1)
            return shouldCopyPath(
              manifestRelativePath(relativePath, pathInsideInclude),
              extraExclude,
            )
          },
        })
      } else {
        if (!shouldCopyPath(relativePath, extraExclude)) continue
        await mkdir(dirname(destPath), { recursive: true })
        await cp(srcPath, destPath)
      }
    } catch {
      console.warn(`[arche] Template manifest include missing in source: ${relativePath}`)
    }
  }
}

/** Defense-in-depth: strip local deploy artifacts and secret env files after template copy. */
async function sanitizeScaffoldArtifacts(destinationDir: string): Promise<string[]> {
  const removed: string[] = []

  async function removePath(relativePath: string): Promise<void> {
    const fullPath = join(destinationDir, relativePath)
    if (!(await pathExists(fullPath))) return
    await rm(fullPath, { recursive: true, force: true })
    removed.push(relativePath)
  }

  async function walk(dir: string, relativeDir = ''): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      const relativePath = relativeDir ? `${relativeDir}/${entry}` : entry
      if (SECRET_OR_LOCAL_ARTIFACT_SEGMENTS.has(entry)) {
        await removePath(relativePath)
        continue
      }
      if (isSecretEnvFile(entry)) {
        await removePath(relativePath)
        continue
      }

      const fullPath = join(dir, entry)
      let info
      try {
        info = await stat(fullPath)
      } catch {
        continue
      }
      if (info.isDirectory()) {
        await walk(fullPath, relativePath)
      }
    }
  }

  await walk(destinationDir)
  return removed
}

async function copyTemplate(destinationDir: string, sourceDir: string): Promise<void> {
  // Check for inclusion manifest
  const manifest = await loadManifest(sourceDir)
  if (manifest) {
    await copyWithManifest(destinationDir, sourceDir, manifest)
    return
  }

  // Fallback for local development templates without a manifest.
  await cp(sourceDir, destinationDir, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = sourcePath === sourceDir ? '' : sourcePath.slice(sourceDir.length + 1)
      return shouldCopyPath(relativePath)
    },
  })
}

async function removeGeneratedArtifacts(destinationDir: string): Promise<string[]> {
  const removed: string[] = []
  const generatedSegments = new Set([
    '.next',
    '.source',
    '.turbo',
    'dist',
    'build',
    'out',
    'coverage',
    'target',
  ])

  async function walk(dir: string, relativeDir = ''): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      const relativePath = relativeDir ? `${relativeDir}/${entry}` : entry
      const fullPath = join(dir, entry)
      if (generatedSegments.has(entry)) {
        await rm(fullPath, { recursive: true, force: true })
        removed.push(relativePath)
        continue
      }

      let info
      try {
        info = await stat(fullPath)
      } catch {
        continue
      }
      if (info.isDirectory()) {
        await walk(fullPath, relativePath)
      }
    }
  }

  await walk(destinationDir)
  return removed
}

// Scripts that reference the CLI workspace and should not appear in scaffolded output
const TEMPLATE_MAINTAINER_SCRIPTS = new Set([
  'dev:cli',
  'build:cli',
  'brand:export-og',
  'brand:export',
  'pkg:check',
  'changeset',
  'changeset:status',
  'version:packages',
  'release',
  'release:publish',
  'secret-scan',
  'secret-scan:staged',
  'verify:generated',
  'template:clean:dry',
  'template:clean',
  'commit:check',
  'rename-scope',
  'rename-scope:dry',
  'rename-scope:verbose',
  'prepare',
  'lint-staged',
])

const TEMPLATE_MAINTAINER_DEV_DEPS = new Set([
  '@changesets/cli',
  '@commitlint/cli',
  '@commitlint/config-conventional',
  'husky',
  'lint-staged',
])

async function updateRootPackageJson(
  destinationDir: string,
  packageName: string,
  options: ProjectConfig,
): Promise<void> {
  const packageJsonPath = join(destinationDir, 'package.json')
  try {
    await access(packageJsonPath)
  } catch {
    // Non-JS families (rust, solana) have no package.json — nothing to update
    return
  }
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as Record<string, unknown>
  packageJson.name = packageName

  // Strip CLI-only scripts that reference the excluded CLI workspace
  if (packageJson.scripts && typeof packageJson.scripts === 'object') {
    const scripts = packageJson.scripts as Record<string, unknown>
    for (const key of TEMPLATE_MAINTAINER_SCRIPTS) {
      delete scripts[key]
    }
  }

  if (packageJson.devDependencies && typeof packageJson.devDependencies === 'object') {
    const devDeps = packageJson.devDependencies as Record<string, unknown>
    for (const key of TEMPLATE_MAINTAINER_DEV_DEPS) {
      delete devDeps[key]
    }
  }

  // Portfolio metadata for kitsunekode.in auto-discovery
  packageJson.portfolio = {
    type: options.family,
    tags: [options.backend || 'none', options.database || 'none', options.orm || 'none'],
    featured: false,
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
}

async function patchJsonFile(
  filePath: string,
  patch: (value: Record<string, unknown>) => void,
): Promise<void> {
  try {
    const json = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
    patch(json)
    await writeFile(filePath, JSON.stringify(json, null, 2) + '\n')
  } catch {
    // File is absent in some families.
  }
}

function removeKeys(record: unknown, keys: string[]): void {
  if (!record || typeof record !== 'object') return
  const target = record as Record<string, unknown>
  for (const key of keys) delete target[key]
}

function removeWorkspacePackages(record: unknown, packageNames: string[]): void {
  if (!record || typeof record !== 'object') return
  const target = record as Record<string, unknown>
  for (const key of Object.keys(target)) {
    if (packageNames.some((packageName) => key.endsWith(`/${packageName}`))) {
      delete target[key]
    }
  }
}

function removeWorkspacePathAliases(record: unknown, packageNames: string[]): void {
  if (!record || typeof record !== 'object') return
  const target = record as Record<string, unknown>
  for (const key of Object.keys(target)) {
    const normalized = key.replace(/\/\*$/, '')
    if (packageNames.some((packageName) => normalized.endsWith(`/${packageName}`))) {
      delete target[key]
    }
  }
}

async function replaceWorkspaceScope(destinationDir: string, packageName: string): Promise<void> {
  const oldScope = '@arche-template'
  const newScope = `@${packageName}`
  const textFilePattern =
    /\.(css|js|json|jsx|md|mdx|mjs|prisma|ts|tsx|yaml|yml)$|(^|\/)(Dockerfile|AGENTS\.md|README\.md|CLAUDE\.md)$/

  async function walk(dir: string): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue
      const fullPath = join(dir, entry)
      const info = await stat(fullPath)
      if (info.isDirectory()) {
        await walk(fullPath)
        continue
      }

      const relativePath = relative(destinationDir, fullPath)
      if (!textFilePattern.test(relativePath)) continue

      const original = await readFile(fullPath, 'utf8')
      if (!original.includes(oldScope)) continue
      await writeFile(fullPath, original.replaceAll(oldScope, newScope))
    }
  }

  await walk(destinationDir)
}

async function pruneServiceApiFullstack(destinationDir: string): Promise<string[]> {
  const removed: string[] = []
  const removePath = async (relativePath: string) => {
    await rm(join(destinationDir, relativePath), { recursive: true, force: true })
    removed.push(relativePath)
  }

  for (const relativePath of [
    'apps/web/trpc',
    'packages/auth',
    'packages/store',
    'packages/trpc',
    'packages/backend-common',
    'packages/common',
  ]) {
    await removePath(relativePath)
  }

  await patchJsonFile(join(destinationDir, 'package.json'), (pkg) => {
    const scripts = pkg.scripts as Record<string, unknown> | undefined
    if (scripts) {
      scripts.build = 'turbo run build'
      scripts['check-types'] = 'turbo run check-types'
    }
    removeKeys(pkg.dependencies, ['compression', 'express-rate-limit'])
    removeKeys(pkg.devDependencies, ['@types/compression'])
    removeKeys(pkg.scripts, [
      'db:seed',
      'db:studio',
      'db:generate',
      'db:migrate',
      'dev:server',
      'dev:worker',
      'postinstall',
      'test:deploy',
      'test:deploy:all',
    ])
  })

  await patchJsonFile(join(destinationDir, 'apps/web/package.json'), (pkg) => {
    removeWorkspacePackages(pkg.dependencies, ['auth', 'store', 'trpc', 'common', 'server'])
    removeKeys(pkg.dependencies, [
      '@arche-template/auth',
      '@arche-template/store',
      '@arche-template/trpc',
      '@arche-template/common',
      '@arche-template/server',
      '@trpc/client',
      '@trpc/server',
      '@trpc/tanstack-react-query',
      'superjson',
      'client-only',
      'server-only',
      'zod',
    ])
  })

  await patchJsonFile(join(destinationDir, 'apps/web/tsconfig.json'), (tsconfig) => {
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown> | undefined
    const paths = compilerOptions?.paths as Record<string, unknown> | undefined
    removeWorkspacePathAliases(paths, ['auth', 'store', 'trpc', 'common', 'server'])
    removeKeys(paths, [
      '@arche-template/store/*',
      '@arche-template/auth/*',
      '@arche-template/trpc/*',
      '@arche-template/common/*',
      '@arche-template/server/*',
    ])
  })

  await rm(join(destinationDir, 'apps/web/env.ts'), { force: true })

  await mkdir(join(destinationDir, 'apps/web/trpc'), { recursive: true })
  await writeFile(
    join(destinationDir, 'apps/web/trpc/query-client.ts'),
    renderServiceApiWebQueryClient(),
  )
  await writeFile(
    join(destinationDir, 'apps/web/app/providers.tsx'),
    renderServiceApiWebProviders(),
  )
  await writeFile(join(destinationDir, 'apps/web/app/layout.tsx'), renderServiceApiWebLayout())
  await writeFile(join(destinationDir, 'apps/web/app/page.tsx'), renderServiceApiWebPage())
  for (const relativePath of WEB_CORE_BOUNDARY_FILES) {
    await writeFile(join(destinationDir, 'apps/web', relativePath), readWebCoreFile(relativePath))
  }
  await writeFile(
    join(destinationDir, 'apps/web/next.config.js'),
    readWebCoreFile('next.config.js'),
  )
  await rm(join(destinationDir, 'apps/web/app/trpc-status.tsx'), { force: true })

  return removed
}

async function applyGeneratedCleanup(
  destinationDir: string,
  cleanupTargets: CleanupTarget[],
): Promise<string[]> {
  const removed: string[] = []
  const targets = new Set(cleanupTargets)

  async function removePath(relativePath: string): Promise<void> {
    if (!(await pathExists(join(destinationDir, relativePath)))) return
    await rm(join(destinationDir, relativePath), { recursive: true, force: true })
    removed.push(relativePath)
  }

  if (targets.has('worker')) {
    await removePath('apps/worker')
    await patchJsonFile(join(destinationDir, 'package.json'), (pkg) => {
      removeKeys(pkg.scripts, ['dev:worker'])
    })
  }

  if (targets.has('seed')) {
    await patchJsonFile(join(destinationDir, 'package.json'), (pkg) => {
      removeKeys(pkg.scripts, ['db:seed'])
    })
  }

  if (targets.has('tests')) {
    await removePath('tests')
  }

  if (targets.has('showcase')) {
    await removePath('SHOWCASE.mdx')
  }

  return removed
}

async function removeAutoInstallArtifacts(destinationDir: string): Promise<void> {
  await rm(join(destinationDir, '.bun-tmp'), { recursive: true, force: true })
  await rm(join(destinationDir, '.turbo'), { recursive: true, force: true })
}

async function writeGeneratedFile(
  destinationDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const filePath = join(destinationDir, relativePath)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
}

async function writeGeneratedClaudeSymlink(destinationDir: string): Promise<void> {
  const filePath = join(destinationDir, 'CLAUDE.md')
  await rm(filePath, { force: true })
  try {
    await symlink('AGENTS.md', filePath)
  } catch {
    await writeFile(filePath, 'See AGENTS.md\n')
  }
}

function buildArcheConfig(options: ProjectConfig): string {
  const config = {
    $schema: 'https://kitsunekode.in/schemas/arche.json',
    version: '0.1.0',
    createdAt: new Date().toISOString(),
    family: options.family,
    preset: options.preset,
    packageManager: options.packageManager,
    choices: {
      backend: options.backend,
      database: options.database,
      orm: options.orm,
      bundles: options.bundles,
      testing: options.testing,
      deployment: options.deployment,
      includeWorker: options.includeWorker,
      includeShowcase: options.includeShowcase,
      presets: options.presets,
      example: options.example,
      rustAuth: options.rustAuth,
    },
    reproducible: buildReproducibleCommand(options),
  }
  return JSON.stringify(config, null, 2) + '\n'
}

async function adaptPackageManagerScripts(
  destinationDir: string,
  pm: ProjectConfig['packageManager'],
): Promise<void> {
  if (pm === 'bun') return

  async function walk(dir: string): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue
      const full = join(dir, entry)
      const st = await stat(full)
      if (st.isDirectory()) {
        await walk(full)
        continue
      }
      if (entry !== 'package.json') continue
      try {
        const raw = await readFile(full, 'utf8')
        const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }
        if (!pkg.scripts) continue
        pkg.scripts = adaptScripts(pkg.scripts, pm)
        await writeFile(full, JSON.stringify(pkg, null, 2) + '\n')
      } catch {
        // skip invalid package.json
      }
    }
  }

  await walk(destinationDir)
}

export async function scaffoldProject(
  options: ProjectConfig,
  dryRun = false,
): Promise<ScaffoldResult> {
  if (dryRun) {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-dry-run-'))
    const tmpDest = join(tmpRoot, basename(options.destinationDir) || 'app')
    try {
      const result = await scaffoldProject(
        {
          ...options,
          destinationDir: tmpDest,
          installDependencies: false,
          initializeGit: false,
        },
        false,
      )
      return {
        ...result,
        destinationDir: options.destinationDir,
        installResult: 'skipped',
      }
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }

  const packageName = _sanitizeProjectName(options.projectName)
  const destinationDir = resolve(options.destinationDir)
  const family = options.family
  const pm = options.packageManager ?? 'bun'

  const templateSource = resolveTemplateSource(family)
  await ensureDestinationAvailable(destinationDir, templateSource)
  const destExistedBefore = await pathExists(destinationDir)

  let generatedFiles: string[] = []
  let cleanupTargets: CleanupTarget[] = []

  try {
    await copyTemplate(destinationDir, templateSource)
    const sanitizedArtifacts = await sanitizeScaffoldArtifacts(destinationDir)
    const removedArtifacts = await removeGeneratedArtifacts(destinationDir)
    await updateRootPackageJson(destinationDir, packageName, options)

    let rustGeneratedFiles: string[] = []
    let solanaGeneratedFiles: string[] = []
    if (family === 'rust') {
      await applyRustFamilyTransform(destinationDir, options)
      rustGeneratedFiles = await applyRustScaffoldTransform(destinationDir, options)
    }

    if (family === 'solana') {
      solanaGeneratedFiles = await applySolanaScaffoldTransform(destinationDir, options)
    }

    if (familySupportsMonorepoTransforms(family)) {
      await applyBackendTransform(destinationDir, options)
      if (options.orm !== 'drizzle') {
        await applyDatabaseTransform(destinationDir, options)
      }
      await applyOrmTransform(destinationDir, options)
    }

    cleanupTargets = buildCleanupTargets(options)
    const cleanupFiles = familySupportsTemplateCleanup(family)
      ? await applyGeneratedCleanup(destinationDir, cleanupTargets)
      : []

    const prunedFiles =
      family === 'fullstack' && backendUsesServiceApi(options.backend)
        ? await pruneServiceApiFullstack(destinationDir)
        : []

    // Write arche.json for reproducibility
    await writeGeneratedFile(destinationDir, 'arche.json', buildArcheConfig(options))

    const bundleFiles = familySupportsBundles(family)
      ? applyBundleTransforms(destinationDir, options)
      : []

    await adaptPackageManagerScripts(destinationDir, pm)

    const workspaceFiles =
      family !== 'rust'
        ? await applyJavaScriptPackageManagerFoundation(
            destinationDir,
            pm,
            isMonorepoFamily(family) || family === 'solana',
          )
        : []

    const turboFiles: string[] = []
    if (isMonorepoFamily(family) || family === 'solana') {
      const includeDbTasks =
        (family === 'fullstack' && !backendUsesServiceApi(options.backend)) ||
        family === 'polyglot' ||
        (family === 'backend' && options.database !== 'none')
      const includeMdxGenerate = false
      const extraBuildOutputs = family === 'polyglot' ? ['target/**'] : undefined
      await writeGeneratedFile(
        destinationDir,
        'turbo.json',
        renderTurboJson({ includeDbTasks, includeMdxGenerate, extraBuildOutputs }),
      )
      turboFiles.push('turbo.json')
    }

    generatedFiles = [
      'arche.json',
      ...bundleFiles,
      ...rustGeneratedFiles,
      ...solanaGeneratedFiles,
      ...sanitizedArtifacts.map((file) => `${file} (removed)`),
      ...removedArtifacts.map((file) => `${file} (removed)`),
      ...cleanupFiles.map((file) => `${file} (removed)`),
      ...prunedFiles.map((file) => `${file} (removed)`),
      ...workspaceFiles,
      ...turboFiles,
    ]

    const monorepo = isMonorepoFamily(family)
    const hasServer = !shouldStripServer(family) && !backendUsesServiceApi(options.backend)
    const hasWeb = !shouldStripWeb(family)

    // Server env: only for monorepo families (standalone templates ship their own .env)
    if (hasServer && monorepo) {
      const serverEnvContent = buildServerEnv(options)
      const serverDir = family === 'polyglot' ? 'apps/api' : 'apps/server'
      await writeGeneratedFile(destinationDir, `${serverDir}/.env.example`, serverEnvContent)
      generatedFiles.push(`${serverDir}/.env.example`)
      await writeGeneratedFile(destinationDir, `${serverDir}/.env`, serverEnvContent)
      generatedFiles.push(`${serverDir}/.env`)
    }

    if (monorepo && backendUsesServiceApi(options.backend)) {
      const serverEnvContent =
        options.backend === 'rust-axum' || options.backend === 'rust-actix'
          ? renderRustEnvExample(options)
          : buildServerEnv(options)
      await writeGeneratedFile(destinationDir, 'services/api/.env.example', serverEnvContent)
      generatedFiles.push('services/api/.env.example')
      await writeGeneratedFile(destinationDir, 'services/api/.env', serverEnvContent)
      generatedFiles.push('services/api/.env')
    }

    // Web env: only for monorepo families
    if (hasWeb && monorepo) {
      const webEnvContent = buildWebEnv()
      await writeGeneratedFile(destinationDir, 'apps/web/.env.example', webEnvContent)
      generatedFiles.push('apps/web/.env.example')
      await writeGeneratedFile(destinationDir, 'apps/web/.env', webEnvContent)
      generatedFiles.push('apps/web/.env')
    }

    // Docker Compose (config-aware: adapts to database selection)
    if (options.includeDocker) {
      await writeGeneratedFile(destinationDir, 'docker-compose.yml', renderDockerCompose(options))
      generatedFiles.push('docker-compose.yml')

      if (monorepo) {
        await writeGeneratedFile(
          destinationDir,
          'docker-compose.prod.yml',
          renderDockerComposeProd(options),
        )
        generatedFiles.push('docker-compose.prod.yml')

        await writeGeneratedFile(destinationDir, 'nginx/nginx.conf', renderNginxConfig(options))
        generatedFiles.push('nginx/nginx.conf')
      }
    }

    // GitHub Actions CI (config-aware: adapts to testing/runtime)
    if (options.includeCi) {
      await writeGeneratedFile(
        destinationDir,
        '.github/workflows/ci.yml',
        renderGithubActionsWorkflow(options),
      )
      generatedFiles.push('.github/workflows/ci.yml')
    }

    // Agent context uses one canonical instruction file plus scoped internal docs.
    await writeGeneratedFile(
      destinationDir,
      'AGENTS.md',
      buildRootAgentsMd({ ...options, projectName: packageName }),
    )
    generatedFiles.push('AGENTS.md')
    await writeGeneratedClaudeSymlink(destinationDir)
    generatedFiles.push('CLAUDE.md')
    await writeGeneratedFile(destinationDir, '.docs/README.md', renderInternalDocsIndex())
    generatedFiles.push('.docs/README.md')
    await writeGeneratedFile(
      destinationDir,
      '.docs/architecture/generated-project.md',
      buildGeneratedArchitectureMd(options),
    )
    generatedFiles.push('.docs/architecture/generated-project.md')
    await writeGeneratedFile(destinationDir, '.plans/README.md', renderPlansIndex())
    generatedFiles.push('.plans/README.md')

    // Agent skill configuration
    const skillFiles = writeSkillConfigs(destinationDir, options)
    generatedFiles.push(...skillFiles)

    // SHOWCASE.mdx (portfolio-ready) — only fullstack has showcase
    if (options.includeShowcase && family === 'fullstack') {
      await writeGeneratedFile(destinationDir, 'SHOWCASE.mdx', buildShowcaseMdx(options))
      generatedFiles.push('SHOWCASE.mdx')
    }

    // Project README
    await writeGeneratedFile(destinationDir, 'README.md', buildReadme(options))
    generatedFiles.push('README.md')

    await writeGeneratedFile(destinationDir, '.gitignore', renderGitignore(options))
    generatedFiles.push('.gitignore')

    // Deployment guide (config-aware: adapts to backend/database/docker)
    const includeDeploymentGuide =
      options.deployment !== 'none' ||
      options.family === 'convex' ||
      options.preset === 'convex-product'
    if (includeDeploymentGuide) {
      await writeGeneratedFile(destinationDir, 'docs/deployment.md', renderDeploymentGuide(options))
      generatedFiles.push('docs/deployment.md')
    }

    if (familySupportsRenameScope(family)) {
      await replaceWorkspaceScope(destinationDir, packageName)
    }
  } catch (error) {
    await rollbackDestination(destinationDir, destExistedBefore)
    throw error
  }

  if (options.initializeGit) {
    tryCommand(['git', 'init', '-b', 'main'], { cwd: destinationDir })
  }

  let installResult: ScaffoldResult['installResult'] = 'skipped'
  let installError: string | undefined
  if (options.installDependencies && !dryRun && family !== 'rust') {
    try {
      runCommand(pmInstallParts(pm), { cwd: destinationDir, silent: true })
      installResult = 'succeeded'
    } catch (error) {
      installResult = 'failed'
      installError = error instanceof Error ? error.message : String(error)
    } finally {
      await removeAutoInstallArtifacts(destinationDir)
    }
  }

  return {
    destinationDir,
    packageName,
    cleanupTargets: familySupportsTemplateCleanup(family) ? cleanupTargets : [],
    generatedFiles,
    installResult,
    installError,
  }
}
