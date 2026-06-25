#!/usr/bin/env bun
/**
 * Compare fullstack template package.json pins against workspace-catalog.json
 * for dependencies that foundation.ts rewrites to catalog: at scaffold time.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

import workspaceCatalog from '../catalog/workspace-catalog.json' with { type: 'json' }

const REPO_ROOT = join(import.meta.dir, '../..')
const TEMPLATE_ROOT = join(REPO_ROOT, 'apps/cli/src/templates/fullstack')

type JsonPackage = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function dependencyGroups(pkg: JsonPackage): Array<Record<string, string> | undefined> {
  return [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]
}

function normalizeVersion(value: string): string {
  return value.replace(/^[~^]/, '')
}

async function collectPackageJsonFiles(directory: string, files: string[] = []): Promise<string[]> {
  for (const entry of await readdir(directory)) {
    if (entry === 'node_modules' || entry === '.git') continue
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

const drift: Array<{ file: string; dependency: string; value: string; catalog: string }> = []

for (const filePath of await collectPackageJsonFiles(TEMPLATE_ROOT)) {
  const pkg = JSON.parse(await readFile(filePath, 'utf8')) as JsonPackage
  for (const group of dependencyGroups(pkg)) {
    if (!group) continue
    for (const [dependency, value] of Object.entries(group)) {
      if (value.startsWith('workspace:')) continue
      const catalogVersion = workspaceCatalog[dependency as keyof typeof workspaceCatalog]
      if (!catalogVersion) continue
      if (value === 'catalog:') continue
      if (normalizeVersion(value) !== normalizeVersion(catalogVersion)) {
        drift.push({
          file: relative(REPO_ROOT, filePath),
          dependency,
          value,
          catalog: catalogVersion,
        })
      }
    }
  }
}

// Template root should not declare runtime dependencies mirrored on server
const templateRootPath = join(TEMPLATE_ROOT, 'package.json')
const templateRoot = JSON.parse(await readFile(templateRootPath, 'utf8')) as JsonPackage
if (templateRoot.dependencies && Object.keys(templateRoot.dependencies).length > 0) {
  drift.push({
    file: relative(REPO_ROOT, templateRootPath),
    dependency: '(root dependencies)',
    value: `${Object.keys(templateRoot.dependencies).length} entries`,
    catalog: 'none — move to child workspaces',
  })
}

let exitCode = 0

if (drift.length > 0) {
  exitCode = 1
  console.error('Template dependency drift from workspace catalog:')
  for (const row of drift) {
    console.error(`  ${row.file}: ${row.dependency} = ${row.value} (catalog: ${row.catalog})`)
  }
} else {
  console.log('Template dependency pins OK')
}

process.exit(exitCode)
