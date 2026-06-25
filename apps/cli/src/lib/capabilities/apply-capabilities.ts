import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { LIVE_DEMO_MANIFEST } from './manifests'
import type { CapabilityManifest } from './types'

async function pathExists(filePath: string): Promise<boolean> {
  try {
    const { stat } = await import('node:fs/promises')
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function removePaths(destinationDir: string, paths: string[]): Promise<string[]> {
  const removed: string[] = []
  for (const relativePath of paths) {
    const fullPath = join(destinationDir, relativePath)
    if (!(await pathExists(fullPath))) {
      continue
    }
    await rm(fullPath, { recursive: true, force: true })
    removed.push(relativePath)
  }
  return removed
}

async function patchHomepageLiveCta(destinationDir: string): Promise<string | null> {
  const homePage = join(destinationDir, 'apps/web/app/page.tsx')
  try {
    const content = await readFile(homePage, 'utf8')
    const withoutLiveCta = content
      .replace(/\s*<Link href="\/live"[^>]*>[\s\S]*?<\/Link>\s*/g, '\n')
      .replace(/import Link from 'next\/link'\n/, '')
    if (withoutLiveCta !== content) {
      await writeFile(homePage, withoutLiveCta)
      return 'apps/web/app/page.tsx (live CTA removed)'
    }
  } catch {
    // homepage not present
  }
  return null
}

async function patchNextConfigPlayRedirect(destinationDir: string): Promise<string | null> {
  const configPath = join(destinationDir, 'apps/web/next.config.js')
  try {
    const content = await readFile(configPath, 'utf8')
    const patched = content
      .replace(/\s*{\s*source:\s*'\/play'[\s\S]*?},\n?/g, '\n')
      .replace(/\n\s*\/\/ Live demo redirect[\s\S]*?\n/g, '\n')
    if (patched !== content) {
      await writeFile(configPath, patched)
      return 'apps/web/next.config.js (play redirect removed)'
    }
  } catch {
    // config not present
  }
  return null
}

async function patchAppRouterForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  const appRouterPath = join(destinationDir, serverDir, 'src/modules/trpc/app.router.ts')
  try {
    let content = await readFile(appRouterPath, 'utf8')
    const next = content
      .replace(/import { chatRouter } from '\.\.\/chat\/chat\.trpc'\n/, '')
      .replace(/import { demoRouter } from '\.\.\/demo\/demo\.trpc'\n/, '')
      .replace(/import { gameRouter } from '\.\.\/game\/game\.trpc'\n/, '')
      .replace(/import { latticeRouter } from '\.\.\/lattice\/lattice\.trpc'\n/, '')
      .replace(/\n  chat: chatRouter,/, '')
      .replace(/\n  game: gameRouter,/, '')
      .replace(/\n  lattice: latticeRouter,/, '')
      .replace(/\n  demo: demoRouter,/, '')
    if (next !== content) {
      await writeFile(appRouterPath, next)
      patched.push(`${serverDir}/src/modules/trpc/app.router.ts`)
    }
  } catch {
    // router not present
  }
  return patched
}

async function patchExpressAppForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  const appPath = join(destinationDir, serverDir, 'src/app.ts')
  try {
    let content = await readFile(appPath, 'utf8')
    const next = content
      .replace(/import { chatRoutes } from '\.\/modules\/chat\/chat\.routes'\n/, '')
      .replace(/import { liveRoutes } from '\.\/modules\/live\/live\.routes'\n/, '')
      .replace(/\napp\.use\('\/api\/chat', chatRoutes\)/, '')
      .replace(/\napp\.use\('\/api\/live', liveRoutes\)/, '')
    if (next !== content) {
      await writeFile(appPath, next)
      patched.push(`${serverDir}/src/app.ts`)
    }
  } catch {
    // app not present
  }
  return patched
}

async function patchAuthRoutesForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  const authRoutesPath = join(destinationDir, serverDir, 'src/modules/auth/auth.routes.ts')
  try {
    let content = await readFile(authRoutesPath, 'utf8')
    const next = content
      .replace(
        /import \{ anonymousSignInRateLimit \} from '\.\.\/\.\.\/common\/middleware\/rate-limit'\n/,
        '',
      )
      .replace(/\nauthRouter\.post\('\/sign-in\/anonymous'[\s\S]*?\n\)/, '')
      .replace(/\n  anonymousSignInRateLimit,/, '')
    if (next !== content) {
      await writeFile(authRoutesPath, next)
      patched.push(`${serverDir}/src/modules/auth/auth.routes.ts`)
    }
  } catch {
    // auth routes not present
  }
  return patched
}

async function patchCoreAuthPackage(destinationDir: string): Promise<string[]> {
  const patched: string[] = []
  const authIndex = join(destinationDir, 'packages/auth/src/index.ts')
  const authClient = join(destinationDir, 'packages/auth/src/client.ts')
  const coreAuthIndex = `import { prisma } from '@arche-template/store'
import { betterAuth } from 'better-auth'
export { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [],
  emailAndPassword: {
    enabled: true,
    autoSignIn: process.env.NODE_ENV !== 'production',
  },
  socialProviders: {
    //   github: {
    //     clientId: process.env.GITHUB_CLIENT_ID as string,
    //     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    //   },
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID as string,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    //   },
  },
})
`
  const coreAuthClient = `import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
`
  try {
    await writeFile(authIndex, coreAuthIndex)
    patched.push('packages/auth/src/index.ts')
  } catch {
    // auth package not present
  }
  try {
    await writeFile(authClient, coreAuthClient)
    patched.push('packages/auth/src/client.ts')
  } catch {
    // client not present
  }
  return patched
}

async function patchCorePrismaSchema(destinationDir: string): Promise<string[]> {
  const schemaPath = join(destinationDir, 'packages/store/prisma/schema.prisma')
  const coreSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]
  posts         Post[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  slug      String   @unique
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("post")
}
`
  try {
    await writeFile(schemaPath, coreSchema)
    return ['packages/store/prisma/schema.prisma']
  } catch {
    return []
  }
}

async function patchWorkerScheduleForLiveDemoRemoval(destinationDir: string): Promise<string[]> {
  const schedulePath = join(destinationDir, 'apps/worker/src/schedule.ts')
  const indexPath = join(destinationDir, 'apps/worker/src/index.ts')
  const cleanupPath = join(destinationDir, 'apps/worker/src/jobs/cleanup.ts')
  const patched: string[] = []
  try {
    const content = await readFile(schedulePath, 'utf8')
    if (!content.includes('stale-anonymous-users')) return []
    const next = `/** Repeatable jobs — add schedules when background work is needed. */
export async function registerSchedules(): Promise<void> {
  // No default schedules. Add repeatable BullMQ jobs here when needed.
}
`
    await writeFile(schedulePath, next)
    patched.push('apps/worker/src/schedule.ts')
  } catch {
    // schedule not present
  }

  try {
    const cleanup = `import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type CleanupJobData = {
  task?: string
}

/** Default cleanup handler — extend when you add retention or housekeeping jobs. */
export async function runCleanup(job: Job<CleanupJobData>): Promise<void> {
  logger.info('Cleanup job received (no default tasks configured)', {
    payload: { jobId: job.id, task: job.data.task ?? 'none' },
  })
}
`
    await writeFile(cleanupPath, cleanup)
    patched.push('apps/worker/src/jobs/cleanup.ts')
  } catch {
    // cleanup job not present
  }

  try {
    const indexContent = await readFile(indexPath, 'utf8')
    const nextIndex = indexContent
      .replace(
        /logger\.error\('Failed to schedule cleanup jobs'/,
        "logger.error('Failed to register worker schedules'",
      )
      .replace(/ensureCleanupSchedule/g, 'registerSchedules')
    if (nextIndex !== indexContent) {
      await writeFile(indexPath, nextIndex)
      patched.push('apps/worker/src/index.ts')
    }
  } catch {
    // worker entry not present
  }

  return patched
}

async function patchServerLatticeRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const serverPath = join(destinationDir, serverDir, 'src/server.ts')
  try {
    let content = await readFile(serverPath, 'utf8')
    if (!content.includes('LATTICE_ROUND_ENGINE')) return []
    const next = content
      .replace(
        /\nfunction isLatticeRoundEngineEnabled\(\): boolean \{\n  return process\.env\.LATTICE_ROUND_ENGINE\?\.trim\(\) === 'true'\n\}\n/,
        '\n',
      )
      .replace(
        /\n  const latticeEngineEnabled[\s\S]*?logger\.info\('Relay Lattice round engine started'\)\n  \}/,
        '',
      )
    if (next !== content) {
      await writeFile(serverPath, next)
      return [`${serverDir}/src/server.ts`]
    }
  } catch {
    // server bootstrap not present
  }
  return []
}

async function patchRateLimitForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const rateLimitPath = join(destinationDir, serverDir, 'src/common/middleware/rate-limit.ts')
  try {
    const content = await readFile(rateLimitPath, 'utf8')
    if (!content.includes('anonymousSignInRateLimit') && !content.includes('chatStreamRateLimit')) {
      return []
    }
    const next = content
      .replace(
        /\n\/\*\* Stricter cap for anonymous session creation[\s\S]*?message: \{ error: 'Too many guest sessions\. Please try again later\.' \},\n\}\)\n/,
        '\n',
      )
      .replace(
        /\nexport const chatStreamRateLimit[\s\S]*?export const liveStreamRateLimit = chatStreamRateLimit\n?/,
        '\n',
      )
    if (next !== content) {
      await writeFile(rateLimitPath, next)
      return [`${serverDir}/src/common/middleware/rate-limit.ts`]
    }
  } catch {
    // rate limit not present
  }
  return []
}

async function patchPublicDtoForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const publicDtoPath = join(destinationDir, serverDir, 'src/modules/common/public-dto.ts')
  const corePublicDto = `type PublicUserShape = {
  id: string
  name: string | null
  image: string | null
}

type UserWithOptionalFields = {
  id: string
  name: string | null
  image: string | null
  email?: string | null
  emailVerified?: boolean | null
}

export function toPublicUser(user: UserWithOptionalFields | null): PublicUserShape | null {
  if (!user) return null
  const trimmed = user.name?.trim()
  return { id: user.id, name: trimmed || 'User', image: user.image }
}
`
  try {
    const content = await readFile(publicDtoPath, 'utf8')
    if (!content.includes('toPublicMessage') && !content.includes('isAnonymous')) return []
    await writeFile(publicDtoPath, corePublicDto)
    return [`${serverDir}/src/modules/common/public-dto.ts`]
  } catch {
    return []
  }
}

async function patchEnvForLiveDemoRemoval(destinationDir: string): Promise<string[]> {
  const envPath = join(destinationDir, 'packages/backend-common/src/env.ts')
  try {
    let content = await readFile(envPath, 'utf8')
    if (!content.includes('DEMO_AUTO_SIGN_IN')) return []
    const next = content
      .replace(
        /\n    \/\/ Marketing \/live demo:[\s\S]*?\n    DEMO_AUTO_SIGN_IN: envBooleanSchema\(false\)\.default\(false\),\n/,
        '\n',
      )
      .replace(/\n    DEMO_AUTO_SIGN_IN: envBooleanSchema\(false\)\.default\(false\),\n/, '\n')
    if (next !== content) {
      await writeFile(envPath, next)
      return ['packages/backend-common/src/env.ts']
    }
  } catch {
    // env not present
  }
  return []
}

async function patchEnvExampleForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const envExamplePath = join(destinationDir, serverDir, '.env.example')
  try {
    let content = await readFile(envExamplePath, 'utf8')
    const original = content
    for (const key of LIVE_DEMO_MANIFEST.removeEnvKeys ?? []) {
      content = content.replace(new RegExp(`\\n#.*${key}[\\s\\S]*?\\n${key}=.*\\n`, 'm'), '\n')
      content = content.replace(new RegExp(`\\n${key}=.*\\n`, 'g'), '\n')
      content = content.replace(new RegExp(`\\n#.*${key}[\\s\\S]*?\\n#${key}=.*\\n`, 'm'), '\n')
    }
    content = content.replace(/\n# Relay Lattice:[\s\S]*?\n#LATTICE_ROUND_ENGINE=false\n?/, '\n')
    if (content !== original) {
      await writeFile(envExamplePath, content)
      return [`${serverDir}/.env.example`]
    }
  } catch {
    // env example not present
  }
  return []
}

/** Content-driven live-demo patches shared by scaffold cleanup and alternate backends. */
export async function applyLiveDemoContentPatches(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  const homepagePatch = await patchHomepageLiveCta(destinationDir)
  if (homepagePatch) patched.push(homepagePatch)
  const redirectPatch = await patchNextConfigPlayRedirect(destinationDir)
  if (redirectPatch) patched.push(redirectPatch)
  patched.push(...(await patchAppRouterForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchExpressAppForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchAuthRoutesForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchServerLatticeRemoval(destinationDir, serverDir)))
  patched.push(...(await patchRateLimitForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchPublicDtoForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchEnvForLiveDemoRemoval(destinationDir)))
  patched.push(...(await patchEnvExampleForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await patchWorkerScheduleForLiveDemoRemoval(destinationDir)))

  const authIndexPath = join(destinationDir, 'packages/auth/src/index.ts')
  try {
    const authContent = await readFile(authIndexPath, 'utf8')
    const hasGuestAuth =
      authContent.includes('anonymous(') ||
      authContent.includes('migrateGuestData') ||
      authContent.includes('deleteStaleAnonymousUsers')
    const usesDrizzle = authContent.includes('drizzleAdapter')
    if (hasGuestAuth && !usesDrizzle) {
      patched.push(...(await patchCoreAuthPackage(destinationDir)))
    }
  } catch {
    // auth package not present
  }

  const schemaPath = join(destinationDir, 'packages/store/prisma/schema.prisma')
  try {
    const schemaContent = await readFile(schemaPath, 'utf8')
    const hasLiveDemoModels =
      schemaContent.includes('model Message') ||
      schemaContent.includes('model LatticeCell') ||
      schemaContent.includes('isAnonymous')
    if (hasLiveDemoModels) {
      patched.push(...(await patchCorePrismaSchema(destinationDir)))
    }
  } catch {
    // schema not present
  }

  return patched
}

/** Remove live-demo paths only (no auth/schema/router patches). For alternate stacks after transforms. */
export async function removeLiveDemoPathsOnly(destinationDir: string): Promise<string[]> {
  return removePaths(destinationDir, LIVE_DEMO_MANIFEST.removePaths)
}

/** Remove live-demo capability files and patch core modules for a minimal scaffold. */
export async function applyLiveDemoRemoval(destinationDir: string): Promise<string[]> {
  const removed = await removePaths(destinationDir, LIVE_DEMO_MANIFEST.removePaths)
  removed.push(...(await applyLiveDemoContentPatches(destinationDir)))
  return removed
}

/** Apply a capability manifest removal (paths only — use specialized helpers for live-demo). */
export async function applyCapabilityRemoval(
  destinationDir: string,
  manifest: CapabilityManifest,
): Promise<string[]> {
  if (manifest.id === 'live-demo') {
    return applyLiveDemoRemoval(destinationDir)
  }
  return removePaths(destinationDir, manifest.removePaths)
}
