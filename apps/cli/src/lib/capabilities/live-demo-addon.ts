import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LIVE_DEMO_REMOVE_PATHS } from './manifests'

const isBundled =
  typeof __dirname !== 'undefined' && (__dirname.includes('/dist') || !__dirname.includes('/src/'))
const PACKAGE_DIR = resolve(
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url)),
  isBundled ? '..' : '../..',
)

/** Resolve the live-demo addon template directory. */
export function resolveLiveDemoAddonSource(): string {
  const candidates = [
    resolve(
      typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url)),
      '../../templates/addons/live-demo',
    ),
    join(PACKAGE_DIR, 'src', 'templates', 'addons', 'live-demo'),
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  throw new Error(
    'Missing live-demo addon template at src/templates/addons/live-demo. ' +
      'Run template sync or ensure the addon is published with the CLI package.',
  )
}

/** Additional overlay files (not in remove list) applied when live-demo is enabled. */
const LIVE_DEMO_OVERLAY_PATHS = [
  'packages/auth/package.json',
  'packages/auth/src/index.ts',
  'packages/auth/src/client.ts',
  'packages/backend-common/package.exports.live-demo.json',
  'packages/backend-common/src/env.ts',
  'packages/store/prisma/schema.prisma',
  'packages/store/src/scripts/seed.ts',
  'apps/server/src/server.ts',
  'apps/server/src/common/middleware/rate-limit.ts',
  'apps/server/src/modules/common/public-dto.ts',
  'apps/server/src/modules/trpc/app.router.ts',
  'apps/server/src/app.ts',
  'apps/server/src/modules/auth/auth.routes.ts',
  'apps/worker/src/index.ts',
  'apps/worker/src/schedule.ts',
  'apps/worker/src/jobs/cleanup.ts',
  'apps/web/tsconfig.json',
  'apps/web/package.deps.live-demo.json',
] as const

async function copyAddonTree(sourceDir: string, destinationDir: string): Promise<string[]> {
  const copied: string[] = []
  const allPaths = [...LIVE_DEMO_REMOVE_PATHS, ...LIVE_DEMO_OVERLAY_PATHS]
  for (const relativePath of allPaths) {
    const sourcePath = join(sourceDir, relativePath)
    if (!existsSync(sourcePath)) continue
    const destPath = join(destinationDir, relativePath)
    await mkdir(dirname(destPath), { recursive: true })
    await cp(sourcePath, destPath, { recursive: true, force: true })
    copied.push(relativePath)
  }
  return copied
}

const LIVE_DEMO_HOMEPAGE_CTA = `
          <Link href="/live" className="live-link-button">
            Open live proof run →
          </Link>`

async function patchHomepageLiveCtaAdd(destinationDir: string): Promise<string | null> {
  const homePage = join(destinationDir, 'apps/web/app/page.tsx')
  try {
    let content = await readFile(homePage, 'utf8')
    if (content.includes('href="/live"')) return null
    if (!content.includes("import Link from 'next/link'")) {
      content = content.replace(
        /^(import type \{ Metadata \} from 'next'\n)/m,
        "$1import Link from 'next/link'\n",
      )
    }
    const next = content.replace(
      /(<div className="actions"[^>]*>[\s\S]*?)(<\/div>)/,
      `$1${LIVE_DEMO_HOMEPAGE_CTA}\n        $2`,
    )
    if (next !== content) {
      await writeFile(homePage, next)
      return 'apps/web/app/page.tsx (live CTA added)'
    }
  } catch {
    // homepage not present
  }
  return null
}

async function patchPackageJsonExports(
  destinationDir: string,
  packageJsonRelative: string,
  exportsFragmentRelative: string,
): Promise<string | null> {
  const fragmentPath = join(destinationDir, exportsFragmentRelative)
  if (!existsSync(fragmentPath)) return null

  const packageJsonPath = join(destinationDir, packageJsonRelative)
  try {
    const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      exports?: Record<string, string>
    }
    const fragment = JSON.parse(await readFile(fragmentPath, 'utf8')) as Record<string, string>
    const exports = { ...pkg.exports, ...fragment }
    const next = JSON.stringify({ ...pkg, exports }, null, 2) + '\n'
    const current = await readFile(packageJsonPath, 'utf8')
    if (next === current) return null
    await writeFile(packageJsonPath, next)
    return `${packageJsonRelative} (live-demo exports merged)`
  } catch {
    return null
  }
}

async function patchWebPackageDependencies(destinationDir: string): Promise<string | null> {
  const fragmentPath = join(destinationDir, 'apps/web/package.deps.live-demo.json')
  if (!existsSync(fragmentPath)) return null

  const packageJsonPath = join(destinationDir, 'apps/web/package.json')
  try {
    const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>
    }
    const fragment = JSON.parse(await readFile(fragmentPath, 'utf8')) as Record<string, string>
    const dependencies = { ...pkg.dependencies, ...fragment }
    const next = JSON.stringify({ ...pkg, dependencies }, null, 2) + '\n'
    const current = await readFile(packageJsonPath, 'utf8')
    if (next === current) return null
    await writeFile(packageJsonPath, next)
    return 'apps/web/package.json (live-demo dependencies merged)'
  } catch {
    return null
  }
}

async function copyUiPackage(sourceDir: string, destinationDir: string): Promise<string | null> {
  const sourcePath = join(sourceDir, 'packages/ui')
  if (!existsSync(sourcePath)) return null
  const destPath = join(destinationDir, 'packages/ui')
  await cp(sourcePath, destPath, { recursive: true, force: true })
  return 'packages/ui'
}

/** Copy live-demo addon files onto a scaffolded project. */
export async function applyLiveDemoAddon(destinationDir: string): Promise<string[]> {
  const sourceDir = resolveLiveDemoAddonSource()
  const copied = await copyAddonTree(sourceDir, destinationDir)
  const cta = await patchHomepageLiveCtaAdd(destinationDir)
  if (cta) copied.push(cta)
  const backendExports = await patchPackageJsonExports(
    destinationDir,
    'packages/backend-common/package.json',
    'packages/backend-common/package.exports.live-demo.json',
  )
  if (backendExports) copied.push(backendExports)
  const webDeps = await patchWebPackageDependencies(destinationDir)
  if (webDeps) copied.push(webDeps)
  const uiPackage = await copyUiPackage(sourceDir, destinationDir)
  if (uiPackage) copied.push(uiPackage)
  return copied
}
