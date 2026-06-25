import { prisma } from '../../db/index.js'

export type LatticeTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

type Db = LatticeTx | typeof prisma

function client(db?: LatticeTx): Db {
  return db ?? prisma
}

export const latticeRepository = {
  findAllCells(db?: LatticeTx) {
    return client(db).latticeCell.findMany({ orderBy: { id: 'asc' } })
  },

  unlockCell(cellId: string, at: Date, db?: LatticeTx) {
    return client(db).latticeCell.update({
      where: { id: cellId },
      data: { unlockedAt: at },
    })
  },

  findOpenRound(db?: LatticeTx) {
    return client(db).latticeRound.findFirst({
      where: { status: 'open' },
      orderBy: { roundNumber: 'asc' },
      include: { votes: true },
    })
  },

  createRound(
    data: {
      roundNumber: number
      cellAId: string
      cellBId: string
      startsAt: Date
      endsAt: Date
    },
    db?: LatticeTx,
  ) {
    return client(db).latticeRound.create({
      data: { ...data, status: 'open' },
      include: { votes: true },
    })
  },

  tryResolveRound(roundId: string, winnerId: string, db?: LatticeTx) {
    return client(db).latticeRound.updateMany({
      where: { id: roundId, status: 'open' },
      data: { status: 'resolved', winnerId },
    })
  },

  upsertVote(roundId: string, userId: string, choice: 'a' | 'b') {
    return prisma.latticeVote.upsert({
      where: { roundId_userId: { roundId, userId } },
      create: { roundId, userId, choice },
      update: { choice },
    })
  },

  nextRoundNumber(db: LatticeTx) {
    return client(db)
      .latticeRound.aggregate({ _max: { roundNumber: true } })
      .then(
        (result: { _max: { roundNumber: number | null } }) => (result._max.roundNumber ?? 0) + 1,
      )
  },

  findRecentResolvedPairs(limit: number, db?: LatticeTx) {
    return client(db).latticeRound.findMany({
      where: { status: 'resolved' },
      orderBy: { roundNumber: 'desc' },
      take: limit,
      select: { cellAId: true, cellBId: true },
    })
  },
}
