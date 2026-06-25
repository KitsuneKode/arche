import { describe, expect, it } from 'bun:test'

type TxCall = { model: string; action: string; args: unknown }

function createFakeTx(calls: TxCall[], options: { targetBest?: number }) {
  return {
    relayRunScore: {
      findFirst: async () =>
        options.targetBest === undefined ? null : { score: options.targetBest },
      deleteMany: async (args: unknown) => {
        calls.push({ model: 'relayRunScore', action: 'deleteMany', args })
        return { count: 1 }
      },
      updateMany: async (args: unknown) => {
        calls.push({ model: 'relayRunScore', action: 'updateMany', args })
        return { count: 1 }
      },
    },
    message: {
      updateMany: async (args: unknown) => {
        calls.push({ model: 'message', action: 'updateMany', args })
        return { count: 1 }
      },
    },
  }
}

describe('migrateGuestData', () => {
  it('reassigns messages and scores, dropping weaker guest scores first', async () => {
    const calls: TxCall[] = []
    const fakeTx = createFakeTx(calls, { targetBest: 120 })

    const { migrateGuestDataWithTx } = await import('./migrate-guest-data.js')
    await migrateGuestDataWithTx(fakeTx, 'guest-1', 'user-2')

    expect(calls).toEqual([
      {
        model: 'relayRunScore',
        action: 'deleteMany',
        args: { where: { userId: 'guest-1', score: { lt: 120 } } },
      },
      {
        model: 'message',
        action: 'updateMany',
        args: { where: { senderId: 'guest-1' }, data: { senderId: 'user-2' } },
      },
      {
        model: 'relayRunScore',
        action: 'updateMany',
        args: { where: { userId: 'guest-1' }, data: { userId: 'user-2' } },
      },
    ])
  })

  it('skips score dedupe when the target has no best yet', async () => {
    const calls: TxCall[] = []
    const fakeTx = createFakeTx(calls, {})

    const { migrateGuestDataWithTx } = await import('./migrate-guest-data.js')
    await migrateGuestDataWithTx(fakeTx, 'guest-1', 'user-2')

    expect(calls.map((call) => call.action)).toEqual(['updateMany', 'updateMany'])
  })

  it('no-ops when ids match', async () => {
    const calls: TxCall[] = []
    const fakeTx = createFakeTx(calls, { targetBest: 50 })

    const { migrateGuestDataWithTx } = await import('./migrate-guest-data.js')
    await migrateGuestDataWithTx(fakeTx, 'same-id', 'same-id')

    expect(calls).toEqual([])
  })
})
