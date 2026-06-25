#!/usr/bin/env bun
/**
 * Audit workspace dependency hygiene: catalog drift and unused catalog entries.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

import workspaceCatalog from '../catalog/workspace-catalog.json' with { type: 'json' }

const REPO_ROOT = join(import.meta.dir, '../..')
const WORKSPACE_ROOTS = ['apps', 'packages', 'toolings', 'tests'] as const

type JsonPackage = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function dependencyGroups(pkg: JsonPackage): Array<Record<string, string> | undefined> {
  return [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]
}

async function collectPackageJsonFiles(directory: string, files: string[] = []): Promise<string[]> {
  for (const entry of await readdir(directory)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'src' || entry === 'dist')
      continue
    const filePath = join(directory, entry)
    const info = await stat(filePath)
    if (info.isDirectory()) {
      await collectPackageJsonFiles(filePath, files)
      continue
    }
    if (entry === 'package.json') files.push(filePath)
  }
  return files
}

const usedCatalog = new Set<string>()
const versionDrift: Array<{ file: string; dependency: string; value: string }> = []

for (const workspace of WORKSPACE_ROOTS) {
  const root = join(REPO_ROOT, workspace)
  for (const filePath of await collectPackageJsonFiles(root)) {
    const pkg = JSON.parse(await readFile(filePath, 'utf8')) as JsonPackage
    for (const group of dependencyGroups(pkg)) {
      if (!group) continue
      for (const [dependency, value] of Object.entries(group)) {
        if (value.startsWith('workspace:')) continue
        const catalogVersion = workspaceCatalog[dependency as keyof typeof workspaceCatalog]
        if (!catalogVersion) continue
        usedCatalog.add(dependency)
        if (value !== 'catalog:' && value !== catalogVersion) {
          versionDrift.push({
            file: relative(REPO_ROOT, filePath),
            dependency,
            value,
          })
        }
      }
    }
  }
}

const rootPkg = JSON.parse(await readFile(join(REPO_ROOT, 'package.json'), 'utf8')) as JsonPackage
for (const group of dependencyGroups(rootPkg)) {
  if (!group) continue
  for (const [dependency, value] of Object.entries(group)) {
    if (workspaceCatalog[dependency as keyof typeof workspaceCatalog]) {
      usedCatalog.add(dependency)
      if (
        value !== 'catalog:' &&
        value !== workspaceCatalog[dependency as keyof typeof workspaceCatalog]
      ) {
        versionDrift.push({ file: 'package.json', dependency, value })
      }
    }
  }
}

const unusedCatalog = Object.keys(workspaceCatalog).filter(
  (dependency) => !usedCatalog.has(dependency),
)

let exitCode = 0

if (versionDrift.length > 0) {
  exitCode = 1
  console.error('Catalog drift (pin with catalog: or update workspace-catalog.json):')
  for (const row of versionDrift) {
    console.error(`  ${row.file}: ${row.dependency} = ${row.value}`)
  }
}

if (unusedCatalog.length > 0) {
  console.warn('Unused catalog entries (safe to remove from workspace-catalog.json):')
  for (const dependency of unusedCatalog) {
    console.warn(`  ${dependency}`)
  }
}

if (exitCode === 0 && versionDrift.length === 0) {
  console.log(`Dependency audit OK (${usedCatalog.size} catalog entries in use)`)
}

process.exit(exitCode)
