/**
 * Database generator
 *
 * Post-scaffold transformations for non-default database selections.
 * The template ships with PostgreSQL + Prisma as the default. When a
 * different database is selected, this generator rewrites the relevant
 * store and auth package files.
 */

import { readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { ProjectConfig } from '../../types/schemas'

// =============================================================================
// SQLite (via Prisma with libsql adapter)
// =============================================================================

function sqlitePrismaSchema(): string {
  return `datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated"
}

// ─── Better Auth models ─────────────────────────────────────────────────────

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  posts         Post[]
  messages      Message[]
  relayRunScores RelayRunScore[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

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
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt

  @@map("verification")
}

// ─── Application models ─────────────────────────────────────────────────────

model Post {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("post")
}

model Message {
  id        String   @id @default(cuid())
  content   String
  kind      String   @default("user")
  createdAt DateTime @default(now())
  senderId  String
  sender    User     @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@map("message")
}

model LatticeCell {
  id         String    @id
  label      String
  unlockedAt DateTime?

  @@map("lattice_cell")
}

model LatticeRound {
  id          String        @id @default(cuid())
  roundNumber Int
  cellAId     String
  cellBId     String
  winnerId    String?
  status      String
  startsAt    DateTime
  endsAt      DateTime
  votes       LatticeVote[]

  @@map("lattice_round")
}

model LatticeVote {
  id      String       @id @default(cuid())
  roundId String
  userId  String
  choice  String
  round   LatticeRound @relation(fields: [roundId], references: [id], onDelete: Cascade)

  @@unique([roundId, userId])
  @@map("lattice_vote")
}

model RelayRunScore {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  score     Int
  createdAt DateTime @default(now())

  @@index([score(sort: Desc), createdAt(sort: Desc)])
  @@index([userId, score(sort: Desc)])
  @@map("relay_run_score")
}
`
}

function sqliteStoreIndex(): string {
  return `import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client'

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma, prisma as db }
`
}

function sqliteStorePackageJsonPatch(): {
  removeDeps: string[]
  addDeps: Record<string, string>
} {
  return {
    removeDeps: ['@prisma/adapter-pg', 'pg'],
    addDeps: {
      '@prisma/adapter-better-sqlite3': '^7.8.0',
      'better-sqlite3': '^11.8.1',
    },
  }
}

function sqlitePrismaConfig(): string {
  return `import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
})
`
}

function sqliteAuthPatch(): string {
  return `import { prisma } from '@arche-template/store'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [],
  socialProviders: {},
})

export { toNodeHandler, fromNodeHeaders }
export type Session = typeof auth.$Infer.Session
`
}

// =============================================================================
// Helpers
// =============================================================================

async function writeFile_(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

async function patchStorePackageJson(
  packageJsonPath: string,
  patch: {
    removeDeps: string[]
    addDeps: Record<string, string>
    scriptOverrides?: Record<string, string>
  },
): Promise<void> {
  const raw = await readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(raw) as Record<string, unknown>

  const deps = (pkg.dependencies ?? {}) as Record<string, string>
  for (const name of patch.removeDeps) delete deps[name]
  Object.assign(deps, patch.addDeps)
  pkg.dependencies = deps

  if (patch.scriptOverrides) {
    const scripts = (pkg.scripts ?? {}) as Record<string, string>
    Object.assign(scripts, patch.scriptOverrides)
    pkg.scripts = scripts
  }

  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Apply database-specific transformations to the scaffolded project.
 * Called after template copy and cleanup, before env/docker/ci generation.
 */
export async function applyDatabaseTransform(
  destinationDir: string,
  config: ProjectConfig,
): Promise<void> {
  if (config.database === 'postgres') return // default, no transformation needed

  if (config.database === 'sqlite') {
    // 1. Rewrite Prisma schema for SQLite
    await writeFile_(
      join(destinationDir, 'packages/store/prisma/schema.prisma'),
      sqlitePrismaSchema(),
    )

    // 2. Rewrite store index (no pg adapter needed)
    await writeFile_(join(destinationDir, 'packages/store/src/index.ts'), sqliteStoreIndex())

    // 3. Rewrite prisma.config.ts (no URL needed for SQLite file)
    await writeFile_(join(destinationDir, 'packages/store/prisma.config.ts'), sqlitePrismaConfig())

    // 4. Remove old migrations (provider-locked to postgres)
    await rm(join(destinationDir, 'packages/store/prisma/migrations'), {
      recursive: true,
      force: true,
    })

    // 5. Patch store package.json (remove pg deps)
    await patchStorePackageJson(
      join(destinationDir, 'packages/store/package.json'),
      sqliteStorePackageJsonPatch(),
    )

    // 6. Update auth to use sqlite provider
    await writeFile_(join(destinationDir, 'packages/auth/src/index.ts'), sqliteAuthPatch())

    return
  }

  if (config.database === 'none') {
    // Rewrite store index to export a minimal Prisma client placeholder
    await writeFile_(
      join(destinationDir, 'packages/store/src/index.ts'),
      `// No database configured — placeholder export
// Add a database or ORM via the CLI: create-arche --database=postgres
export const prisma = null as unknown as import('./generated/client').PrismaClient
`,
    )

    // Remove Prisma artifacts that require a datasource
    await rm(join(destinationDir, 'packages/store/prisma/migrations'), {
      recursive: true,
      force: true,
    })

    // Rewrite auth to error at startup if used without a database
    await writeFile_(
      join(destinationDir, 'packages/auth/src/index.ts'),
      `// Auth requires a database. Scaffold with --database=postgres or --database=sqlite.
export const auth = null as never
export const toNodeHandler = null as never
export const fromNodeHeaders = null as never
`,
    )

    const rootPkgPath = join(destinationDir, 'package.json')
    try {
      const raw = await readFile(rootPkgPath, 'utf8')
      const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }
      if (pkg.scripts) {
        delete pkg.scripts.postinstall
        delete pkg.scripts['db:generate']
        delete pkg.scripts['db:migrate']
        delete pkg.scripts['db:seed']
        await writeFile(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n')
      }
    } catch {
      // non-monorepo families have no root db scripts
    }

    return
  }
}
