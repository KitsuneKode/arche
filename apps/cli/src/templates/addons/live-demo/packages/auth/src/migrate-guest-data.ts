import { prisma } from '@arche-template/store'

export type GuestMigrationTx = {
  relayRunScore: {
    findFirst: (args: {
      where: { userId: string }
      orderBy: { score: 'desc' }
      select: { score: true }
    }) => Promise<{ score: number } | null>
    deleteMany: (args: { where: { userId: string; score: { lt: number } } }) => Promise<unknown>
    updateMany: (args: { where: { userId: string }; data: { userId: string } }) => Promise<unknown>
  }
  message: {
    updateMany: (args: {
      where: { senderId: string }
      data: { senderId: string }
    }) => Promise<unknown>
  }
}

export async function migrateGuestDataWithTx(
  tx: GuestMigrationTx,
  fromId: string,
  toId: string,
): Promise<void> {
  if (fromId === toId) return

  const targetBest = await tx.relayRunScore.findFirst({
    where: { userId: toId },
    orderBy: { score: 'desc' },
    select: { score: true },
  })

  if (targetBest) {
    await tx.relayRunScore.deleteMany({
      where: { userId: fromId, score: { lt: targetBest.score } },
    })
  }

  await tx.message.updateMany({
    where: { senderId: fromId },
    data: { senderId: toId },
  })

  await tx.relayRunScore.updateMany({
    where: { userId: fromId },
    data: { userId: toId },
  })
}

export async function migrateGuestData(fromId: string, toId: string): Promise<void> {
  if (fromId === toId) return

  await prisma.$transaction(async (tx) => migrateGuestDataWithTx(tx, fromId, toId))
}

export async function deleteStaleAnonymousUsers(olderThanDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
  const result = await prisma.user.deleteMany({
    where: {
      isAnonymous: true,
      createdAt: { lt: cutoff },
    },
  })
  return result.count
}
