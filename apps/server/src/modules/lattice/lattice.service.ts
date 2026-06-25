import { logger } from '../../common/logger'
import { chatService } from '../chat/chat.service.js'
import type { LatticeStatePublic } from '../live/live.dto.js'
import { emitLiveEvent } from '../live/live.events.js'
import { isLatticeSchemaMissing } from './lattice-errors.js'
import { CLASH_PAIRS, cellLabel, ROUND_DURATION_MS } from './lattice.deck.js'
import { latticeRepository } from './lattice.repository.js'

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

async function pickNextPair(): Promise<[string, string]> {
  const recent = await latticeRepository.findRecentResolvedPairs(3)
  const recentKeys = new Set(recent.map((round) => pairKey(round.cellAId, round.cellBId)))

  const available = CLASH_PAIRS.filter(([a, b]) => !recentKeys.has(pairKey(a, b)))
  const pool = available.length > 0 ? available : CLASH_PAIRS
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]!
}

function tallyVotes(
  votes: Array<{ choice: string }>,
  cellAId: string,
  cellBId: string,
): { votesA: number; votesB: number; winnerId: string } {
  let votesA = 0
  let votesB = 0
  for (const vote of votes) {
    if (vote.choice === 'a') votesA += 1
    else if (vote.choice === 'b') votesB += 1
  }
  const winnerId = votesA >= votesB ? cellAId : cellBId
  return { votesA, votesB, winnerId }
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
    const tallies = tallyVotes(roundRow.votes, roundRow.cellAId, roundRow.cellBId)
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

async function startNextRound() {
  const [cellAId, cellBId] = await pickNextPair()
  const roundNumber = (await latticeRepository.countRounds()) + 1
  const startsAt = new Date()
  const endsAt = new Date(startsAt.getTime() + ROUND_DURATION_MS)
  const round = await latticeRepository.createRound({
    roundNumber,
    cellAId,
    cellBId,
    startsAt,
    endsAt,
  })

  await chatService.postSystemMessage(
    `Clash #${round.roundNumber}: ${cellLabel(cellAId)} vs ${cellLabel(cellBId)} — pick a side!`,
  )
  await broadcastState()
}

async function resolveOpenRound() {
  const openRound = await latticeRepository.findOpenRound()
  if (!openRound) return false
  if (openRound.endsAt.getTime() > Date.now()) return false

  const { votesA, votesB, winnerId } = tallyVotes(
    openRound.votes,
    openRound.cellAId,
    openRound.cellBId,
  )

  await latticeRepository.resolveRound(openRound.id, winnerId)
  await latticeRepository.unlockCell(winnerId, new Date())

  const winnerLabel = cellLabel(winnerId)
  const loserLabel = cellLabel(
    winnerId === openRound.cellAId ? openRound.cellBId : openRound.cellAId,
  )
  await chatService.postSystemMessage(
    `Clash #${openRound.roundNumber} resolved — ${winnerLabel} wins (${votesA}–${votesB}) over ${loserLabel}. Cell lit on the grid.`,
  )

  await startNextRound()
  return true
}

export const latticeService = {
  async getPublicState(userId?: string) {
    return withLatticeSchema(async () => {
      await latticeService.resolveRoundIfDue()
      await latticeService.ensureOpenRound()
      return buildPublicState(userId)
    })
  },

  async ensureOpenRound() {
    const open = await latticeRepository.findOpenRound()
    if (open) return open
    await startNextRound()
    return latticeRepository.findOpenRound()
  },

  async resolveRoundIfDue() {
    let resolved = false
    // Resolve at most one round per call to avoid runaway loops
    const openRound = await latticeRepository.findOpenRound()
    if (openRound && openRound.endsAt.getTime() <= Date.now()) {
      resolved = await resolveOpenRound()
    }
    return resolved
  },

  async castVote(userId: string, roundId: string, choice: 'a' | 'b') {
    const result = await withLatticeSchema(async () => {
      await latticeService.resolveRoundIfDue()

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
      const resolved = await latticeService.resolveRoundIfDue()
      if (!resolved) {
        const open = await latticeRepository.findOpenRound()
        if (!open) await latticeService.ensureOpenRound()
      }
    } catch (error) {
      if (isLatticeSchemaMissing(error)) {
        logLatticeSchemaMissingOnce()
        return
      }
      logger.error('Relay Lattice tickEngine failed', { error })
    }
  },
}
