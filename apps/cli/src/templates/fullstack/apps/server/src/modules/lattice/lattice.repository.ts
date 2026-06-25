import { prisma } from '../../db/index.js'

export const latticeRepository = {
  findAllCells() {
    return prisma.latticeCell.findMany({ orderBy: { id: 'asc' } })
  },

  unlockCell(cellId: string, at: Date) {
    return prisma.latticeCell.update({
      where: { id: cellId },
      data: { unlockedAt: at },
    })
  },

  findOpenRound() {
    return prisma.latticeRound.findFirst({
      where: { status: 'open' },
      orderBy: { roundNumber: 'desc' },
      include: { votes: true },
    })
  },

  findLatestRound() {
    return prisma.latticeRound.findFirst({
      orderBy: { roundNumber: 'desc' },
      include: { votes: true },
    })
  },

  createRound(data: {
    roundNumber: number
    cellAId: string
    cellBId: string
    startsAt: Date
    endsAt: Date
  }) {
    return prisma.latticeRound.create({
      data: { ...data, status: 'open' },
      include: { votes: true },
    })
  },

  resolveRound(roundId: string, winnerId: string) {
    return prisma.latticeRound.update({
      where: { id: roundId },
      data: { status: 'resolved', winnerId },
      include: { votes: true },
    })
  },

  upsertVote(roundId: string, userId: string, choice: 'a' | 'b') {
    return prisma.latticeVote.upsert({
      where: { roundId_userId: { roundId, userId } },
      create: { roundId, userId, choice },
      update: { choice },
    })
  },

  countRounds() {
    return prisma.latticeRound.count()
  },

  findRecentResolvedPairs(limit: number) {
    return prisma.latticeRound.findMany({
      where: { status: 'resolved' },
      orderBy: { roundNumber: 'desc' },
      take: limit,
      select: { cellAId: true, cellBId: true },
    })
  },
}
