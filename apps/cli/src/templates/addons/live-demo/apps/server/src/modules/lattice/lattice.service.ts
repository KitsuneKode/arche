import { logger } from '../../common/logger'
import { prisma } from '../../db/index'
import { chatService } from '../chat/chat.service'
import type { LatticeStatePublic } from '../live/live.dto'
import { emitLiveEvent } from '../live/live.events'
import { isLatticeOpenRoundRace, isLatticeSchemaMissing } from './lattice-errors'
import { CLASH_PAIRS, cellLabel, ROUND_DURATION_MS } from './lattice.deck'
import { latticeRepository, type LatticeTx } from './lattice.repository'
import { pickRoundWinner } from './lattice.tally'

const EMPTY_LATTICE_STATE: LatticeStatePublic = {
  now: new Date().toISOString(),
  cells: [],
  round: null,
  ready: false,
}

let latticeSchemaMissingLogged = false

function logLatticeSchemaMissingOnce(): void {
  if (latticeSchemaMissingLogged) return
  latticeSchemaMissingLogged = true
  logger.warn(
    'Relay Lattice tables are missing — round engine paused. Run database migrations on the API host (bun run db:deploy).',
  )
}

async function withLatticeSchema<T>(fn: () => Promise<T>): Promise<T | typeof EMPTY_LATTICE_STATE> {
  try {
    return await fn()
  } catch (error) {
    if (isLatticeSchemaMissing(error)) return EMPTY_LATTICE_STATE
    throw error
  }
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

async function pickNextPair(tx: LatticeTx): Promise<[string, string]> {
  const recent = await latticeRepository.findRecentResolvedPairs(3, tx)
  const recentKeys = new Set(recent.map((round) => pairKey(round.cellAId, round.cellBId)))

  const available = CLASH_PAIRS.filter(([a, b]) => !recentKeys.has(pairKey(a, b)))
  const pool = available.length > 0 ? available : CLASH_PAIRS
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]!
}

async function buildPublicState(userId?: string): Promise<LatticeStatePublic> {
  const [cells, openRound] = await Promise.all([
    latticeRepository.findAllCells(),
    latticeRepository.findOpenRound(),
  ])

  const roundRow = openRound
  let myVote: 'a' | 'b' | null = null
  let votesA = 0
  let votesB = 0

  if (roundRow) {
    const tallies = pickRoundWinner(roundRow.cellAId, roundRow.cellBId, roundRow.votes)
    votesA = tallies.votesA
    votesB = tallies.votesB
    if (userId) {
      const mine = roundRow.votes.find((vote) => vote.userId === userId)
      if (mine?.choice === 'a' || mine?.choice === 'b') myVote = mine.choice
    }
  }

  return {
    now: new Date().toISOString(),
    ready: true,
    cells: cells.map((cell) => ({
      id: cell.id,
      label: cell.label,
      unlocked: cell.unlockedAt !== null,
      unlockedAt: cell.unlockedAt?.toISOString() ?? null,
    })),
    round: roundRow
      ? {
          id: roundRow.id,
          roundNumber: roundRow.roundNumber,
          status: roundRow.status as 'open' | 'resolved',
          startsAt: roundRow.startsAt.toISOString(),
          endsAt: roundRow.endsAt.toISOString(),
          cellA: { id: roundRow.cellAId, label: cellLabel(roundRow.cellAId) },
          cellB: { id: roundRow.cellBId, label: cellLabel(roundRow.cellBId) },
          votesA,
          votesB,
          myVote,
          winnerId: roundRow.winnerId,
        }
      : null,
  }
}

async function broadcastState() {
  const state = await buildPublicState()
  emitLiveEvent({ type: 'lattice:state', state })
}

type PendingChat = { content: string }

async function createNextRoundInTx(tx: LatticeTx, pending: PendingChat[]) {
  const stillOpen = await latticeRepository.findOpenRound(tx)
  if (stillOpen) return

  const roundNumber = await latticeRepository.nextRoundNumber(tx)
  const [cellAId, cellBId] = await pickNextPair(tx)
  const startsAt = new Date()
  const endsAt = new Date(startsAt.getTime() + ROUND_DURATION_MS)

  try {
    await latticeRepository.createRound({ roundNumber, cellAId, cellBId, startsAt, endsAt }, tx)
    pending.push({
      content: `Clash #${roundNumber}: ${cellLabel(cellAId)} vs ${cellLabel(cellBId)} — pick a side!`,
    })
  } catch (error) {
    if (isLatticeOpenRoundRace(error)) return
    throw error
  }
}

/** Single-writer tick: advisory lock + at most one open round in the database. */
async function runEngineTick(): Promise<void> {
  const pending: PendingChat[] = []
  let shouldBroadcast = false

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(867530901)`

    const openRound = await latticeRepository.findOpenRound(tx)

    if (openRound && openRound.endsAt.getTime() <= Date.now()) {
      const { votesA, votesB, winnerId, tieBreak } = pickRoundWinner(
        openRound.cellAId,
        openRound.cellBId,
        openRound.votes,
      )
      const updated = await latticeRepository.tryResolveRound(openRound.id, winnerId, tx)
      if (updated.count > 0) {
        await latticeRepository.unlockCell(winnerId, new Date(), tx)
        const loserId = winnerId === openRound.cellAId ? openRound.cellBId : openRound.cellAId
        const score = tieBreak ? `${votesA}–${votesB}, coin flip` : `${votesA}–${votesB}`
        pending.push({
          content: `Clash #${openRound.roundNumber} resolved — ${cellLabel(winnerId)} wins (${score}) over ${cellLabel(loserId)}. Cell lit on the grid.`,
        })
        await createNextRoundInTx(tx, pending)
        shouldBroadcast = true
      }
      return
    }

    if (!openRound) {
      await createNextRoundInTx(tx, pending)
      shouldBroadcast = pending.length > 0
    }
  })

  for (const message of pending) {
    await chatService.postSystemMessage(message.content)
  }
  if (shouldBroadcast) await broadcastState()
}

export const latticeService = {
  async getPublicState(userId?: string) {
    return withLatticeSchema(() => buildPublicState(userId))
  },

  async resolveRoundIfDue() {
    await runEngineTick()
  },

  async castVote(userId: string, roundId: string, choice: 'a' | 'b') {
    const result = await withLatticeSchema(async () => {
      await runEngineTick()

      const openRound = await latticeRepository.findOpenRound()
      if (!openRound || openRound.id !== roundId) {
        throw new Error('This clash is no longer open')
      }
      if (openRound.endsAt.getTime() <= Date.now()) {
        throw new Error('Voting closed for this clash')
      }

      await latticeRepository.upsertVote(roundId, userId, choice)
      const state = await buildPublicState(userId)
      emitLiveEvent({ type: 'lattice:state', state })
      return state
    })

    if (result.ready === false) {
      throw new Error('Relay Lattice is not ready — run database migrations on the API host')
    }
    return result
  },

  async tickEngine() {
    try {
      await runEngineTick()
    } catch (error) {
      if (isLatticeSchemaMissing(error)) {
        logLatticeSchemaMissingOnce()
        return
      }
      logger.error('Relay Lattice tickEngine failed', { error })
    }
  },
}
