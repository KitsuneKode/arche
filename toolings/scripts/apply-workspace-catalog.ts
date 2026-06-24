/**
 * Dogfood the Bun/pnpm workspace catalog in this monorepo.
 * Versions live in toolings/catalog/workspace-catalog.json; packages use catalog:.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import workspaceCatalog from '../catalog/workspace-catalog.json' with { type: 'json' }

const REPO_ROOT = join(import.meta.dir, '../..')
const WORKSPACE_GLOBS = ['apps/*', 'packages/*', 'toolings/*', 'tests/*'] as const

type JsonPackage = {
  workspaces?: string[] | { packages: string[]; catalog?: Record<string, string> }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
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
    if (entry === 'node_modules' || entry === '.git' || entry === 'src') continue
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
        if (workspaceCatalog[dependency as keyof typeof workspaceCatalog]) used.add(dependency)
      }
    }
  }

  return used
}

async function updatePackageJsonFiles(
  directory: string,
  catalog: Record<string, string>,
  updated: string[],
): Promise<void> {
  for (const entry of await readdir(directory)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'src') continue
    const filePath = join(directory, entry)
    const info = await stat(filePath)

    if (info.isDirectory()) {
      await updatePackageJsonFiles(filePath, catalog, updated)
      continue
    }
    if (entry !== 'package.json') continue

    const raw = await readFile(filePath, 'utf8')
    const pkg = JSON.parse(raw) as JsonPackage
    const before = JSON.stringify(pkg)
    applyCatalogReferences(pkg, catalog)
    const after = JSON.stringify(pkg)
    if (before !== after) {
      await writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n')
      updated.push(relative(REPO_ROOT, filePath))
    }
  }
}

const usedDependencyNames = new Set<string>()
for (const workspace of ['apps', 'packages', 'toolings', 'tests'] as const) {
  await collectUsedCatalogDependencies(join(REPO_ROOT, workspace), usedDependencyNames)
}

const rootPath = join(REPO_ROOT, 'package.json')
const root = JSON.parse(await readFile(rootPath, 'utf8')) as JsonPackage
for (const group of dependencyGroups(root)) {
  if (!group) continue
  for (const dependency of Object.keys(group)) {
    if (workspaceCatalog[dependency as keyof typeof workspaceCatalog]) {
      usedDependencyNames.add(dependency)
    }
  }
}

const catalog = Object.fromEntries(
  Object.entries(workspaceCatalog).filter(([dependency]) => usedDependencyNames.has(dependency)),
)

root.workspaces = { packages: [...WORKSPACE_GLOBS], catalog }
applyCatalogReferences(root, catalog)
await writeFile(rootPath, JSON.stringify(root, null, 2) + '\n')

const updated: string[] = ['package.json']
for (const workspace of ['apps', 'packages', 'toolings', 'tests'] as const) {
  await updatePackageJsonFiles(join(REPO_ROOT, workspace), catalog, updated)
}

console.log(`Applied workspace catalog (${Object.keys(catalog).length} entries)`)
for (const file of updated) console.log(`  ${file}`)
