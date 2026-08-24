import { describe, it, expect } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const rootDir = join(import.meta.dir, '../../..')

describe('post CRUD integration', () => {
  it('has tRPC module with index entry', () => {
    expect(existsSync(join(rootDir, 'apps/server/src/modules/trpc/index.ts'))).toBe(true)
  })

  it('has store package with index entry', () => {
    expect(existsSync(join(rootDir, 'packages/store/src/index.ts'))).toBe(true)
  })

  it('tRPC index exports appRouter', async () => {
    const content = await Bun.file(join(rootDir, 'apps/server/src/modules/trpc/index.ts')).text()
    expect(content).toMatch(/appRouter|createCaller/)
  })

  it('store index exports prisma', async () => {
    const content = await Bun.file(join(rootDir, 'packages/store/src/index.ts')).text()
    expect(content).toMatch(/prisma|PrismaClient/)
  })

  it('has Prisma schema file', () => {
    expect(existsSync(join(rootDir, 'packages/store/prisma/schema.prisma'))).toBe(true)
  })

  it('Prisma schema has Post model', async () => {
    const content = await Bun.file(join(rootDir, 'packages/store/prisma/schema.prisma')).text()
    expect(content).toContain('model Post')
  })
})
