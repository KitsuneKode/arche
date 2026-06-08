/**
 * ORM generator
 *
 * Post-scaffold transformations for non-default ORM selections.
 * The template ships with Prisma as the default. When Drizzle is selected,
 * this generator replaces the entire Prisma setup with Drizzle equivalents:
 * - TypeScript schema definitions (pgTable/sqliteTable)
 * - Drizzle client initialization
 * - drizzle.config.ts
 * - Better Auth drizzleAdapter
 * - Rewritten tRPC routers using Drizzle query API
 *
 * Runs AFTER applyDatabaseTransform (which may have already switched to
 * SQLite schema), but BEFORE rename-scope (so all @arche-template/ imports
 * get caught by the scope rename).
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { ProjectConfig } from '../../types/schemas'

// =============================================================================
// Drizzle schema definitions (database-aware)
// =============================================================================

function drizzleSchemaPostgres(): string {
  return `import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Better Auth models ─────────────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Application models ─────────────────────────────────────────────────────

export const post = pgTable('post', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const message = pgTable('message', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// ─── Relations ──────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(post),
  messages: many(message),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const postRelations = relations(post, ({ one }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
}))

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}))
`
}

function drizzleSchemaSqlite(): string {
  return `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ─── Better Auth models ─────────────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ─── Application models ─────────────────────────────────────────────────────

export const post = sqliteTable('post', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const message = sqliteTable('message', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// ─── Relations ──────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(post),
  messages: many(message),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const postRelations = relations(post, ({ one }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
}))

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}))
`
}

// =============================================================================
// Drizzle store index (database-aware)
// =============================================================================

function drizzleStoreIndexPostgres(): string {
  return `import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  db: NodePgDatabase<typeof schema> | undefined
  pool: Pool | undefined
}

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL!,
  })

const db = globalForDb.db ?? drizzle({ client: pool, schema })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
  globalForDb.pool = pool
}

export async function closeDb(): Promise<void> {
  await pool.end()
}

export { db }
export * from './schema'
`
}

function drizzleStoreIndexSqlite(): string {
  return `import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  db: BunSQLiteDatabase<typeof schema> | undefined
  sqlite: Database | undefined
}

const sqlite =
  globalForDb.sqlite ??
  new Database(process.env.DATABASE_URL?.replace('file:', '') ?? 'dev.db')

const db = globalForDb.db ?? drizzle({ client: sqlite, schema })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
  globalForDb.sqlite = sqlite
}

export function closeDb(): void {
  sqlite.close()
}

export { db }
export * from './schema'
`
}

// =============================================================================
// Drizzle config
// =============================================================================

function drizzleConfigPostgres(): string {
  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`
}

function drizzleConfigSqlite(): string {
  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace('file:', '') ?? 'dev.db',
  },
})
`
}

// =============================================================================
// Package.json patch
// =============================================================================

function drizzleStorePackageJsonPatch(database: 'postgres' | 'sqlite'): {
  removeDeps: string[]
  removeDevDeps: string[]
  addDeps: Record<string, string>
  addDevDeps: Record<string, string>
  scriptOverrides: Record<string, string>
} {
  const base = {
    removeDeps: ['@prisma/adapter-pg', '@prisma/client'],
    removeDevDeps: ['prisma'],
    addDeps: {
      'drizzle-orm': '^0.39.0',
    } as Record<string, string>,
    addDevDeps: {
      'drizzle-kit': '^0.30.0',
    },
    scriptOverrides: {
      'db:generate': 'bunx drizzle-kit generate',
      'db:migrate': 'bunx drizzle-kit migrate',
      'db:studio': 'bunx drizzle-kit studio',
      'db:push': 'bunx drizzle-kit push',
      'db:deploy': 'bunx drizzle-kit migrate',
      'db:reset': 'bunx drizzle-kit push --force',
      'db:seed': 'bun run src/scripts/seed.ts',
    },
  }

  if (database === 'postgres') {
    base.addDeps.pg = '^8.19.0'
    base.addDevDeps['@types/pg'] = '^8.11.0'
  } else {
    base.removeDeps.push('pg')
    base.removeDevDeps.push('@types/pg')
  }

  return base
}

// =============================================================================
// Auth adapter swap
// =============================================================================

function drizzleAuthPatch(database: 'postgres' | 'sqlite'): string {
  return `import { db } from '@arche-template/store'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: '${database === 'postgres' ? 'pg' : 'sqlite'}',
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
// tRPC context rewrite
// =============================================================================

/** Rewrite apps/server/src/modules/trpc/trpc.ts for Drizzle (Express backend) */
function drizzleTrpcContextExpress(): string {
  return `import { auth, fromNodeHeaders } from '@arche-template/auth/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@arche-template/store'
import { logger } from '../../common/logger.js'
import superjson from 'superjson'
import { ZodError } from 'zod'

export const createTRPCContext = async ({
  req,
  res: _res,
}: trpcExpress.CreateExpressContextOptions) => {
  const headers = fromNodeHeaders(req.headers)
  const session = await auth.api.getSession({ headers })
  return { session, db }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (process.env.NODE_ENV === 'development') {
    const delay = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const result = await next()
  const elapsed = Date.now() - start

  if (elapsed > 1000) {
    logger.warn(\`Slow tRPC procedure: \${path} took \${elapsed}ms\`)
  }

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
`
}

/** Rewrite apps/server/src/modules/trpc/trpc.ts for Drizzle (Hono/fetch backend) */
function drizzleTrpcContextFetch(): string {
  return `import { initTRPC, TRPCError } from '@trpc/server'
import { auth, fromNodeHeaders } from '@arche-template/auth/server'
import { db } from '@arche-template/store'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { logger } from '../../common/logger.js'

/**
 * tRPC context for fetch-based backends (Hono, etc.)
 * Accepts web-standard Headers instead of Express req/res.
 */
export const createTRPCContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers })
  return { session, db }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (process.env.NODE_ENV === 'development') {
    const delay = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const result = await next()
  const elapsed = Date.now() - start

  if (elapsed > 1000) {
    logger.warn(\`Slow tRPC procedure: \${path} took \${elapsed}ms\`)
  }

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
`
}

// =============================================================================
// tRPC router rewrites (Prisma -> Drizzle query API)
// =============================================================================

function drizzlePostRouter(): string {
  return `import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { db, post as postTable } from '@arche-template/store'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const postRouter = {
  list: publicProcedure.query(async () => {
    return db.query.post.findMany({
      where: eq(postTable.published, true),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      with: { author: true },
    })
  }),
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return db.query.post.findFirst({
      where: eq(postTable.id, input.id),
      with: { author: true },
    })
  }),
  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return db.query.post.findFirst({
      where: eq(postTable.slug, input.slug),
      with: { author: true },
    })
  }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      slug: z.string().min(1),
      published: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await db.insert(postTable).values({
        ...input,
        published: input.published ?? false,
        authorId: ctx.session.user.id,
      }).returning()
      return created
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.post.findFirst({
        where: eq(postTable.id, input.id),
      })
      if (!existing || existing.authorId !== ctx.session.user.id) throw new Error('Unauthorized')
      const { id, ...data } = input
      const [updated] = await db.update(postTable).set(data).where(eq(postTable.id, id)).returning()
      return updated
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.post.findFirst({
        where: eq(postTable.id, input.id),
      })
      if (!existing || existing.authorId !== ctx.session.user.id) throw new Error('Unauthorized')
      const [deleted] = await db.delete(postTable).where(eq(postTable.id, input.id)).returning()
      return deleted
    }),
} satisfies TRPCRouterRecord
`
}

function drizzleChatRouter(): string {
  return `import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { db, message as messageTable } from '@arche-template/store'
import { z } from 'zod'

export const chatRouter = {
  list: publicProcedure.query(async () => {
    return db.query.message.findMany({
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      limit: 50,
      with: { sender: true },
    })
  }),
  send: protectedProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await db.insert(messageTable).values({
        content: input.content,
        senderId: ctx.session.user.id,
      }).returning()
      return created
    }),
} satisfies TRPCRouterRecord
`
}

function drizzleSeedTs(): string {
  return `import { db, post, user } from '../index'

async function main() {
  console.log('Seeding database...')

  const [demoUser] = await db
    .insert(user)
    .values({
      id: 'user_demo_123',
      email: 'demo@example.com',
      name: 'Kitsune Team',
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning()

  const authorId = demoUser?.id ?? 'user_demo_123'

  await db
    .insert(post)
    .values({
      title: 'Welcome to your Arche stack',
      slug: 'welcome-arche-stack',
      content: 'Replace this seed with your own demo content.',
      published: true,
      authorId,
    })
    .onConflictDoNothing()

  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
`
}

async function patchServerPackageJsonForDrizzle(packageJsonPath: string): Promise<void> {
  const raw = await readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(raw) as Record<string, unknown>
  const deps = (pkg.dependencies ?? {}) as Record<string, string>
  deps['drizzle-orm'] = '^0.39.0'
  pkg.dependencies = deps
  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
}

function drizzleServerDbIndex(): string {
  return `export { closeDb, db } from '@arche-template/store'
`
}

function drizzleHealthRepository(database: 'postgres' | 'sqlite'): string {
  const ping =
    database === 'postgres' ? `await db.execute(sql\`SELECT 1\`)` : `await db.run(sql\`SELECT 1\`)`
  return `import { sql } from 'drizzle-orm'
import { db } from '../../db/index.js'

export const healthRepository = {
  async pingDatabase(): Promise<void> {
    ${ping}
  },
}
`
}

async function patchServerShutdownForDrizzle(destinationDir: string): Promise<void> {
  const serverPath = join(destinationDir, 'apps/server/src/server.ts')
  if (!existsSync(serverPath)) return

  let content = await readFile(serverPath, 'utf8')
  content = content.replace(
    "import { prisma } from './db/index.js'",
    "import { closeDb } from './db/index.js'",
  )
  content = content.replace(
    `  onShutdown(async () => {
    logger.info('Closing Prisma connection...')
    await prisma.$disconnect()
  })`,
    `  onShutdown(async () => {
    logger.info('Closing database connection...')
    await closeDb()
  })`,
  )
  await writeFile(serverPath, content)
}

function drizzleUserRouter(): string {
  return `import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { db, user } from '@arche-template/store'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const userRouter = {
  getUser: publicProcedure.query(() => {
    return { id: '1', name: 'Bilbo' }
  }),
  getAllUser: publicProcedure.query(async () => {
    return db.query.user.findMany()
  }),
  createUser: protectedProcedure
    .input(z.object({ email: z.string().email(), name: z.string().min(5) }))
    .mutation(async (opts) => {
      return db.query.user.findMany({
        where: eq(user.email, opts.input.email),
      })
    }),
} satisfies TRPCRouterRecord
`
}

// =============================================================================
// Helpers
// =============================================================================

async function writeFile_(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

async function patchPackageJson(
  packageJsonPath: string,
  patch: ReturnType<typeof drizzleStorePackageJsonPatch>,
): Promise<void> {
  const raw = await readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(raw) as Record<string, unknown>

  // Patch dependencies
  const deps = (pkg.dependencies ?? {}) as Record<string, string>
  for (const name of patch.removeDeps) delete deps[name]
  Object.assign(deps, patch.addDeps)
  pkg.dependencies = deps

  // Patch devDependencies
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
  for (const name of patch.removeDevDeps) delete devDeps[name]
  Object.assign(devDeps, patch.addDevDeps)
  pkg.devDependencies = devDeps

  // Patch scripts
  const scripts = (pkg.scripts ?? {}) as Record<string, string>
  Object.assign(scripts, patch.scriptOverrides)
  pkg.scripts = scripts

  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Apply ORM-specific transformations to the scaffolded project.
 * Called after applyDatabaseTransform and applyBackendTransform,
 * but before rename-scope.
 *
 * When Drizzle is selected:
 * - Replaces Prisma schema with TypeScript Drizzle schema
 * - Replaces store index with Drizzle client
 * - Creates drizzle.config.ts
 * - Rewrites auth to use drizzleAdapter
 * - Rewrites tRPC routers from Prisma to Drizzle query API
 * - Removes prisma/ directory entirely
 */
export async function applyOrmTransform(
  destinationDir: string,
  config: ProjectConfig,
): Promise<void> {
  if (config.orm === 'prisma' || config.orm === 'none') return

  if (config.orm === 'drizzle') {
    const database = config.database as 'postgres' | 'sqlite'

    // 1. Write Drizzle schema (database-aware)
    const schemaContent = database === 'sqlite' ? drizzleSchemaSqlite() : drizzleSchemaPostgres()
    await writeFile_(join(destinationDir, 'packages/store/src/schema.ts'), schemaContent)

    // 2. Write Drizzle store index (database-aware)
    const storeIndex =
      database === 'sqlite' ? drizzleStoreIndexSqlite() : drizzleStoreIndexPostgres()
    await writeFile_(join(destinationDir, 'packages/store/src/index.ts'), storeIndex)

    // 3. Write drizzle.config.ts (replaces prisma.config.ts)
    const drizzleConfig = database === 'sqlite' ? drizzleConfigSqlite() : drizzleConfigPostgres()
    await writeFile_(join(destinationDir, 'packages/store/drizzle.config.ts'), drizzleConfig)

    // 4. Remove Prisma artifacts
    await rm(join(destinationDir, 'packages/store/prisma'), { recursive: true, force: true })
    await rm(join(destinationDir, 'packages/store/prisma.config.ts'), { force: true })
    await rm(join(destinationDir, 'packages/store/src/generated'), { recursive: true, force: true })

    // 5. Patch store package.json
    await patchPackageJson(
      join(destinationDir, 'packages/store/package.json'),
      drizzleStorePackageJsonPatch(database),
    )

    // 6. Rewrite auth to use drizzleAdapter
    await writeFile_(join(destinationDir, 'packages/auth/src/index.ts'), drizzleAuthPatch(database))

    // 7. Determine if backend is fetch-based (Hono) or Express
    const isFetchBackend = config.backend === 'hono-bun'

    // 8. Rewrite tRPC context
    const trpcContext = isFetchBackend ? drizzleTrpcContextFetch() : drizzleTrpcContextExpress()
    await writeFile_(join(destinationDir, 'apps/server/src/modules/trpc/trpc.ts'), trpcContext)

    // 9. Rewrite feature tRPC routers (module-first)
    await writeFile_(
      join(destinationDir, 'apps/server/src/modules/post/post.trpc.ts'),
      drizzlePostRouter(),
    )
    await writeFile_(
      join(destinationDir, 'apps/server/src/modules/chat/chat.trpc.ts'),
      drizzleChatRouter(),
    )
    await writeFile_(
      join(destinationDir, 'apps/server/src/modules/user/user.trpc.ts'),
      drizzleUserRouter(),
    )

    // 10. Rewrite seed script for Drizzle
    await writeFile_(join(destinationDir, 'packages/store/src/scripts/seed.ts'), drizzleSeedTs())

    // 11. Rewrite server db re-export and health check for Drizzle
    await writeFile_(join(destinationDir, 'apps/server/src/db/index.ts'), drizzleServerDbIndex())
    await writeFile_(
      join(destinationDir, 'apps/server/src/modules/health/health.repository.ts'),
      drizzleHealthRepository(database),
    )
    await patchServerShutdownForDrizzle(destinationDir)

    // 12. Remove Prisma-based service/repository layers (routers use Drizzle directly)
    const prismaLayers = [
      'apps/server/src/modules/post/post.repository.ts',
      'apps/server/src/modules/post/post.service.ts',
      'apps/server/src/modules/chat/chat.repository.ts',
      'apps/server/src/modules/chat/chat.service.ts',
      'apps/server/src/modules/user/user.repository.ts',
      'apps/server/src/modules/user/user.service.ts',
    ]
    for (const relativePath of prismaLayers) {
      await rm(join(destinationDir, relativePath), { force: true })
    }

    // 13. Add drizzle-orm to server package for router imports
    await patchServerPackageJsonForDrizzle(join(destinationDir, 'apps/server/package.json'))

    return
  }
}
