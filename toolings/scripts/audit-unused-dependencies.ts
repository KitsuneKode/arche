#!/usr/bin/env bun
/**
 * Flag likely unused dependencies in dogfood workspaces by matching package.json
 * entries against import usage in each workspace's source tree.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const WORKSPACE_ROOTS = ['apps', 'packages'] as const

/** Packages used only via CSS, PostCSS, tooling config, or scripts — not TS imports. */
const IMPORT_ALLOWLIST = new Set([
  'shadcn',
  'tailwindcss',
  'tw-animate-css',
  '@tailwindcss/postcss',
  'server-only',
  'client-only',
  'oxlint',
  '@t3-oss/env-core',
  '@t3-oss/env-nextjs',
  '@turbo/gen',
  'react-dom',
  'pg',
  'prisma',
  '@prisma/client',
  '@prisma/adapter-pg',
])

/** Workspace packages and runtime peers — resolved via workspace protocol. */
function isWorkspaceDep(value: string): boolean {
  return value.startsWith('workspace:')
}

type JsonPackage = {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function collectSourceFiles(directory: string, files: string[] = []): Promise<string[]> {
  for (const entry of await readdir(directory)) {
    if (
      entry === 'node_modules' ||
      entry === '.next' ||
      entry === 'dist' ||
      entry === '.turbo' ||
      entry === '.source'
    ) {
      continue
    }
    const filePath = join(directory, entry)
    const info = await stat(filePath)
    if (info.isDirectory()) {
      await collectSourceFiles(filePath, files)
      continue
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs|mdx|css)$/.test(entry)) {
      files.push(filePath)
    }
  }
  return files
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPackageReferenced(packageName: string, sources: string[], contents: string[]): boolean {
  if (IMPORT_ALLOWLIST.has(packageName)) return true

  const scoped = packageName.startsWith('@')
  const patterns = scoped
    ? [
        new RegExp(`from ['"]${escapeRegExp(packageName)}`),
        new RegExp(`require\\(['"]${escapeRegExp(packageName)}`),
        new RegExp(`import\\(['"]${escapeRegExp(packageName)}`),
      ]
    : [
        new RegExp(`from ['"]${escapeRegExp(packageName)}`),
        new RegExp(`require\\(['"]${escapeRegExp(packageName)}`),
        new RegExp(`import\\(['"]${escapeRegExp(packageName)}`),
      ]

  for (const content of contents) {
    for (const pattern of patterns) {
      if (pattern.test(content)) return true
    }
  }

  // @types/* — check if base package is referenced
  if (packageName.startsWith('@types/')) {
    const base = packageName.slice('@types/'.length)
    return isPackageReferenced(base, sources, contents)
  }

  return false
}

const findings: Array<{ file: string; dependency: string; section: string }> = []

for (const workspace of WORKSPACE_ROOTS) {
  const root = join(REPO_ROOT, workspace)
  for (const entry of await readdir(root)) {
    const pkgDir = join(root, entry)
    const pkgJsonPath = join(pkgDir, 'package.json')
    try {
      await stat(pkgJsonPath)
    } catch {
      continue
    }

    const pkg = JSON.parse(await readFile(pkgJsonPath, 'utf8')) as JsonPackage
    const srcDir = join(pkgDir, 'src')
    const appDir = join(pkgDir, 'app')
    const libDir = join(pkgDir, 'lib')
    const trpcDir = join(pkgDir, 'trpc')

    const sourceRoots = [srcDir, appDir, libDir, trpcDir]
    const sourceFiles: string[] = []
    for (const dir of sourceRoots) {
      try {
        if ((await stat(dir)).isDirectory()) {
          await collectSourceFiles(dir, sourceFiles)
        }
      } catch {
        // optional dirs
      }
    }

    // Package-root TS files (e.g. apps/web/env.ts)
    for (const fileEntry of await readdir(pkgDir)) {
      if (/\.(ts|tsx|js|jsx|mjs)$/.test(fileEntry)) {
        sourceFiles.push(join(pkgDir, fileEntry))
      }
    }

    // apps/web also has top-level app/, lib/, etc. at package root
    if (workspace === 'apps' && entry === 'web') {
      for (const dir of ['app', 'lib', 'components', 'content']) {
        const extra = join(pkgDir, dir)
        try {
          if ((await stat(extra)).isDirectory()) {
            await collectSourceFiles(extra, sourceFiles)
          }
        } catch {
          // skip
        }
      }
    }

    const contents = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))
    const sections: Array<[string, Record<string, string> | undefined]> = [
      ['dependencies', pkg.dependencies],
      ['devDependencies', pkg.devDependencies],
    ]

    for (const [section, group] of sections) {
      if (!group) continue
      for (const [dependency, value] of Object.entries(group)) {
        if (dependency.startsWith('@arche-template/')) continue
        if (dependency.startsWith('@kitsunekode/')) continue
        if (isWorkspaceDep(value)) continue
        if (dependency === 'typescript' && section === 'devDependencies') continue
        if (section === 'devDependencies' && dependency.startsWith('@types/')) continue
        if (IMPORT_ALLOWLIST.has(dependency)) continue
        if (!isPackageReferenced(dependency, sourceFiles, contents)) {
          findings.push({
            file: relative(REPO_ROOT, pkgJsonPath),
            dependency,
            section,
          })
        }
      }
    }
  }
}

let exitCode = 0

if (findings.length > 0) {
  console.warn('Likely unused dependencies (verify before removing):')
  for (const row of findings) {
    console.warn(`  ${row.file} [${row.section}] ${row.dependency}`)
  }
  exitCode = 1
} else {
  console.log('Unused dependency scan OK')
}

process.exit(exitCode)
