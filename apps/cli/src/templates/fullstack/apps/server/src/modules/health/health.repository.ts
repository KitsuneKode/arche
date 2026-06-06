import { prisma } from '../../db/index.js'

export const healthRepository = {
  async pingDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`
  },
}
