import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import workspaceCatalog from '../../../../../toolings/catalog/workspace-catalog.json' with { type: 'json' }
import type { ProjectConfig } from '../../types/schemas'
import { renderPnpmWorkspaceYaml } from './pnpm'

export const DEFAULT_WORKSPACE_CATALOG: Record<string, string> = workspaceCatalog

const DEFAULT_TOOLCHAIN = {
  bun: '1.3.11',
  node: '24.13.1',
  pnpm: '10.12.1',
} as const

/** Align fresh installs with the dogfood lockfile (BullMQ + Better Auth). ORMs: Prisma/Drizzle only. */
const SCAFFOLD_DEPENDENCY_OVERRIDES: Record<string, string> = {
  ioredis: '5.10.1',
  'better-auth': '1.6.11',
}

type JsonPackage = {
  packageManager?: string
  workspaces?: string[] | { packages: string[]; catalog?: Record<string, string> }
  engines?: Record<string, string>
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  overrides?: Record<string, string>
  pnpm?: { overrides?: Record<string, string> }
}

function normalizeTurboScripts(scripts: Record<string, string> | undefined): void {
  if (!scripts) return

  for (const [name, command] of Object.entries(scripts)) {
    const filtered = /^turbo -F ([^ ]+) ([^ ]+)(.*)$/.exec(command)
    if (filtered) {
      scripts[name] = `turbo run ${filtered[2]} --filter=${filtered[1]}${filtered[3]}`
      continue
    }

    const task = /^turbo (db:[^ ]+)$/.exec(command)
    if (task) scripts[name] = `turbo run ${task[1]}`
  }
}

function dependencyGroups(pkg: JsonPackage): Array<Record<string, string> | undefined> {
  return [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]
}

function applyCatalogReferences(pkg: JsonPackage, catalog: Record<string, string>): void {
  for (const group of dependencyGroups(pkg)) {
    if (!group) continue
    for (const dependency of Object.keys(catalog)) {
      if (group[dependency] && !group[dependency].startsWith('workspace:')) {
        group[dependency] = 'catalog:'
      }
    }
  }
}

async function collectUsedCatalogDependencies(
  directory: string,
  used = new Set<string>(),
): Promise<Set<string>> {
  for (const entry of await readdir(directory)) {
    if (entry === 'node_modules' || entry === '.git') continue
    const filePath = join(directory, entry)
    const info = await stat(filePath)

    if (info.isDirectory()) {
      await collectUsedCatalogDependencies(filePath, used)
      continue
    }
    if (entry !== 'package.json') continue

    const pkg = JSON.parse(await readFile(filePath, 'utf8')) as JsonPackage
    for (const group of dependencyGroups(pkg)) {
      if (!group) continue
      for (const dependency of Object.keys(group)) {
        if (DEFAULT_WORKSPACE_CATALOG[dependency]) used.add(dependency)
      }
    }
  }

  return used
}

async function updatePackageJsonFiles(
  directory: string,
  catalog: Record<string, string>,
): Promise<void> {
  for (const entry of await readdir(directory)) {
    if (entry === 'node_modules' || entry === '.git') continue
    const filePath = join(directory, entry)
    const info = await stat(filePath)

    if (info.isDirectory()) {
      await updatePackageJsonFiles(filePath, catalog)
      continue
    }
    if (entry !== 'package.json') continue

    const pkg = JSON.parse(await readFile(filePath, 'utf8')) as JsonPackage
    applyCatalogReferences(pkg, catalog)
    await writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n')
  }
}

async function directoryExists(directory: string): Promise<boolean> {
  try {
    return (await stat(directory)).isDirectory()
  } catch {
    return false
  }
}

async function workspacePackages(destinationDir: string, root: JsonPackage): Promise<string[]> {
  const packages = Array.isArray(root.workspaces)
    ? root.workspaces
    : (root.workspaces?.packages ?? ['apps/*', 'packages/*', 'toolings/*'])

  if (
    (await directoryExists(join(destinationDir, 'services'))) &&
    !packages.includes('services/*')
  ) {
    return [...packages, 'services/*']
  }

  return packages
}

export async function applyJavaScriptPackageManagerFoundation(
  destinationDir: string,
  packageManager: ProjectConfig['packageManager'],
  monorepo: boolean,
): Promise<string[]> {
  if (packageManager === 'npm') return []

  const packageJsonPath = join(destinationDir, 'package.json')
  const root = JSON.parse(await readFile(packageJsonPath, 'utf8')) as JsonPackage
  normalizeTurboScripts(root.scripts)
  root.engines = {
    ...root.engines,
    bun: `^${DEFAULT_TOOLCHAIN.bun}`,
    node: `^${DEFAULT_TOOLCHAIN.node}`,
  }

  const generatedFiles: string[] = []
  if (!monorepo) {
    root.packageManager =
      packageManager === 'bun' ? `bun@${DEFAULT_TOOLCHAIN.bun}` : `pnpm@${DEFAULT_TOOLCHAIN.pnpm}`
    if (packageManager === 'pnpm' && root.scripts?.preinstall?.includes('only-allow bun')) {
      delete root.scripts.preinstall
    }
    await writeFile(packageJsonPath, JSON.stringify(root, null, 2) + '\n')
    return generatedFiles
  }

  const packages = await workspacePackages(destinationDir, root)
  const usedDependencyNames = await collectUsedCatalogDependencies(destinationDir)
  const catalog = Object.fromEntries(
    Object.entries(DEFAULT_WORKSPACE_CATALOG).filter(([dependency]) =>
      usedDependencyNames.has(dependency),
    ),
  )

  if (packageManager === 'bun') {
    root.workspaces = Object.keys(catalog).length > 0 ? { packages, catalog } : { packages }
    root.packageManager = `bun@${DEFAULT_TOOLCHAIN.bun}`
  } else {
    delete root.workspaces
    if (root.scripts?.preinstall?.includes('only-allow bun')) {
      delete root.scripts.preinstall
    }
    root.packageManager = `pnpm@${DEFAULT_TOOLCHAIN.pnpm}`
    await writeFile(
      join(destinationDir, 'pnpm-workspace.yaml'),
      renderPnpmWorkspaceYaml({ packages, catalog }),
    )
    generatedFiles.push('pnpm-workspace.yaml')
  }

  applyCatalogReferences(root, catalog)
  root.overrides = { ...root.overrides, ...SCAFFOLD_DEPENDENCY_OVERRIDES }
  if (packageManager === 'pnpm') {
    root.pnpm = {
      ...root.pnpm,
      overrides: { ...root.pnpm?.overrides, ...SCAFFOLD_DEPENDENCY_OVERRIDES },
    }
  }
  await writeFile(packageJsonPath, JSON.stringify(root, null, 2) + '\n')
  await updatePackageJsonFiles(destinationDir, catalog)

  return generatedFiles
}
