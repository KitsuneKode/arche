import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const WEB_CORE = join(ROOT, 'apps/cli/src/templates/_web-core')

const SHARED_COPY_FILES = [
  { from: 'next.config.js', to: 'next.config.js' },
  { from: 'app/error.tsx', to: 'app/error.tsx' },
  { from: 'app/loading.tsx', to: 'app/loading.tsx' },
  { from: 'app/not-found.tsx', to: 'app/not-found.tsx' },
] as const

interface WebTarget {
  id: string
  root: string
  syncOxlint: boolean
  syncTsconfig: boolean
  tsconfigPaths?: Record<string, string[]>
}

const WEB_TARGETS: WebTarget[] = [
  {
    id: 'next',
    root: 'apps/cli/src/templates/next',
    syncOxlint: true,
    syncTsconfig: true,
  },
  {
    id: 'convex',
    root: 'apps/cli/src/templates/convex',
    syncOxlint: false,
    syncTsconfig: true,
    tsconfigPaths: { '@/*': ['./app/*'] },
  },
  {
    id: 'fullstack-web',
    root: 'apps/cli/src/templates/fullstack/apps/web',
    syncOxlint: false,
    syncTsconfig: false,
  },
  {
    id: 'polyglot-web',
    root: 'apps/cli/src/templates/polyglot/apps/web',
    syncOxlint: false,
    syncTsconfig: true,
    tsconfigPaths: { '@/*': ['./*'] },
  },
]

const PIN_SECTIONS = ['dependencies', 'devDependencies'] as const

function readCore(relative: string): string {
  return readFileSync(join(WEB_CORE, relative), 'utf8')
}

function readVersions(): {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
} {
  return JSON.parse(readCore('versions.json')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
}

function mergeTokensIntoStyles(current: string, tokens: string): string {
  const rootBlock = tokens.trim()
  const rootRegex = /:root\s*\{[\s\S]*?\}\s*/

  if (rootRegex.test(current)) {
    return current.replace(rootRegex, `${rootBlock}\n\n`)
  }

  return `${rootBlock}\n\n${current}`
}

function buildStandaloneTsconfig(paths: Record<string, string[]>): string {
  const base = JSON.parse(readCore('tsconfig.standalone.json')) as {
    compilerOptions: Record<string, unknown>
    include: string[]
    exclude: string[]
  }
  base.compilerOptions.paths = paths
  return `${JSON.stringify(base, null, 2)}\n`
}

function applyPackagePins(
  pkgPath: string,
  versions: ReturnType<typeof readVersions>,
  check: boolean,
): string[] {
  const drifted: string[] = []
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }

  let changed = false
  for (const section of PIN_SECTIONS) {
    const pins = versions[section]
    const bucket = pkg[section]
    if (!bucket) continue
    for (const [key, value] of Object.entries(pins)) {
      if (!(key in bucket)) continue
      if (bucket[key] !== value) {
        drifted.push(`${pkgPath.replace(`${ROOT}/`, '')}:${section}.${key}`)
        if (!check) {
          bucket[key] = value
          changed = true
        }
      }
    }
  }

  if (changed && !check) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  return drifted
}

function syncFilePair(targetRoot: string, from: string, to: string, check: boolean): string | null {
  const source = readCore(from)
  const dest = join(ROOT, targetRoot, to)
  if (!existsSync(dest)) {
    if (!check) writeFileSync(dest, source)
    return `${targetRoot}/${to}`
  }
  const current = readFileSync(dest, 'utf8')
  if (current === source) return null
  if (!check) writeFileSync(dest, source)
  return `${targetRoot}/${to}`
}

function syncStylesTokens(targetRoot: string, check: boolean): string | null {
  const dest = join(ROOT, targetRoot, 'app/styles.css')
  if (!existsSync(dest)) return null
  const tokens = readCore('app/styles.tokens.css')
  const current = readFileSync(dest, 'utf8')
  const merged = mergeTokensIntoStyles(current, tokens)
  if (current === merged) return null
  if (!check) writeFileSync(dest, merged)
  return `${targetRoot}/app/styles.css`
}

function normalizeJson(text: string): string {
  return JSON.stringify(JSON.parse(text))
}

function syncTsconfigForTarget(target: WebTarget, check: boolean): string | null {
  const paths = target.tsconfigPaths ?? { '@/*': ['./*'] }
  const dest = join(ROOT, target.root, 'tsconfig.json')
  const expected = buildStandaloneTsconfig(paths)
  if (!existsSync(dest)) {
    if (!check) writeFileSync(dest, expected)
    return `${target.root}/tsconfig.json`
  }
  const current = readFileSync(dest, 'utf8')
  if (normalizeJson(current) === normalizeJson(expected)) return null
  if (!check) writeFileSync(dest, expected)
  return `${target.root}/tsconfig.json`
}

export async function syncWebCore(options: { check: boolean }): Promise<string[]> {
  const drifted: string[] = []
  const versions = readVersions()

  for (const target of WEB_TARGETS) {
    for (const file of SHARED_COPY_FILES) {
      const result = syncFilePair(target.root, file.from, file.to, options.check)
      if (result) drifted.push(result)
    }

    if (target.syncOxlint) {
      const result = syncFilePair(target.root, '.oxlintrc.json', '.oxlintrc.json', options.check)
      if (result) drifted.push(result)
    }

    const pkgPath = join(ROOT, target.root, 'package.json')
    drifted.push(...applyPackagePins(pkgPath, versions, options.check))

    const stylesResult = syncStylesTokens(target.root, options.check)
    if (stylesResult) drifted.push(stylesResult)

    if (target.syncTsconfig) {
      const result = syncTsconfigForTarget(target, options.check)
      if (result) drifted.push(result)
    }
  }

  return [...new Set(drifted)]
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check')
  const drifted = await syncWebCore({ check })

  if (drifted.length === 0) {
    if (!check) console.log('Web core templates are in sync.')
    process.exit(0)
  }

  for (const path of drifted) {
    console.error(check ? `DRIFT: ${path}` : `SYNCED: ${path}`)
  }
  process.exit(check ? 1 : 0)
}

if (import.meta.main) {
  await main()
}
