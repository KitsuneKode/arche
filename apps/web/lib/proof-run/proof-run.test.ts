import { describe, expect, it } from 'bun:test'

import { passedRungIds, PROOF_RUNGS, runProofRungs } from './proof-run'

describe('runProofRungs', () => {
  it('locks auth rungs when guest', async () => {
    const results = await runProofRungs({
      apiReachable: true,
      fetchHealth: async () => ({ ok: true, status: 200, database: 'connected' }),
      fetchHello: async () => 'Hi Arche from TRPC',
      fetchPosts: async () => [{ id: '1' }],
      fetchChatMessages: async () => [],
      fetchSession: async () => ({ user: undefined }),
      sendChatMessage: async () => {},
      fetchSecretMessage: async () => 'secret',
      createDraftPost: async () => {},
    })

    expect(results.find((r) => r.id === 'relay-write')?.state).toBe('locked')
    expect(passedRungIds(results)).toContain('session')
  })

  it('registry matches expected rung count', () => {
    expect(PROOF_RUNGS).toHaveLength(10)
  })
})
