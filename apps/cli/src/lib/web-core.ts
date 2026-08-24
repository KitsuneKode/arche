import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const WEB_CORE_DIR = existsSync(join(__dir, '../templates/_web-core'))
  ? join(__dir, '../templates/_web-core')
  : join(__dir, '../src/templates/_web-core')

export interface WebCoreVersions {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

export function webCorePath(relative: string): string {
  return join(WEB_CORE_DIR, relative)
}

export function readWebCoreFile(relative: string): string {
  return readFileSync(webCorePath(relative), 'utf8')
}

export const WEB_CORE_BOUNDARY_FILES = [
  'app/error.tsx',
  'app/loading.tsx',
  'app/not-found.tsx',
] as const

export function readWebCoreVersions(): WebCoreVersions {
  return JSON.parse(readWebCoreFile('versions.json')) as WebCoreVersions
}
