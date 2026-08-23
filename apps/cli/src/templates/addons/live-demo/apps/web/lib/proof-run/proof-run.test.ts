import { describe, expect, it } from 'bun:test'

import { passedRungIds, PROOF_RUNGS, runProofRungs } from './proof-run'

const baseCtx = {
  apiReachable: true,
  fetchHealth: async () => ({
    ok: true,
    status: 200,
    database: 'connected' as const,
    schema: 'ready' as const,
  }),
  fetchHello: async () => 'Hi Arche from TRPC',
  fetchPosts: async () => [{ id: '1' }],
  fetchChatMessages: async () => [],
  fetchLeaderboard: async () => [],
  fetchMyBest: async () => null,
  verifyChatSend: async () => {},
  verifyGameScore: async () => {},
  fetchSecretMessage: async () => 'secret',
  createDraftPost: async () => {},
}

describe('runProofRungs', () => {
  it('locks auth rungs when guest', async () => {
    const results = await runProofRungs({
      ...baseCtx,
      fetchSession: async () => ({ user: undefined }),
    })

    expect(results.find((r) => r.id === 'relay-write')?.state).toBe('locked')
    expect(passedRungIds(results)).toContain('session')
  })

  it('registry matches expected rung count', () => {
    expect(PROOF_RUNGS).toHaveLength(12)
  })
})
