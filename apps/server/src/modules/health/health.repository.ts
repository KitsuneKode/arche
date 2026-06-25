import { prisma } from '../../db/index.js'

type SchemaColumnRow = { exists: boolean }

export const healthRepository = {
  async pingDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`
  },

  /** Live-demo queries require user.isAnonymous; missing column means migrations are pending. */
  async isLiveDemoSchemaReady(): Promise<boolean> {
    const rows = await prisma.$queryRaw<SchemaColumnRow[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user'
          AND column_name = 'isAnonymous'
      ) AS "exists"
    `
    return rows[0]?.exists === true
  },
}
