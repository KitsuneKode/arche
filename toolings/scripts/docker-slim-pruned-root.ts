#!/usr/bin/env bun
/**
 * Strip repo-only devDependencies from turbo-pruned root package.json before Docker install.
 * Keeps only what the server builder stage needs (turbo + typescript).
 */
import { readFile, writeFile } from 'node:fs/promises'

const rootPath = process.argv[2] ?? 'package.json'
const raw = await readFile(rootPath, 'utf8')
const pkg = JSON.parse(raw) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

const KEEP_DEV = new Set(['turbo', 'typescript', '@arche-template/typescript-config'])

if (pkg.devDependencies) {
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).filter(([name]) => KEEP_DEV.has(name)),
  )
  if (Object.keys(pkg.devDependencies).length === 0) {
    delete pkg.devDependencies
  }
}

if (pkg.dependencies) {
  delete pkg.dependencies.zod
  if (Object.keys(pkg.dependencies).length === 0) {
    delete pkg.dependencies
  }
}

for (const script of ['prepare', 'preinstall', 'postinstall'] as const) {
  delete pkg.scripts?.[script]
}

await writeFile(rootPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log('Slimmed root package.json for Docker install')
