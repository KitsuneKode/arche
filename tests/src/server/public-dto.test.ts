import { describe, expect, it } from 'bun:test'

import { toPublicMessage, toPublicUser } from '../../../apps/server/src/modules/common/public-dto'

describe('public-dto', () => {
  it('strips email from public user shape', () => {
    expect(
      toPublicUser({
        id: 'u1',
        name: 'Demo',
        image: null,
        email: 'secret@example.com',
        emailVerified: true,
      }),
    ).toEqual({ id: 'u1', name: 'Demo', image: null })
  })

  it('redacts sender email from public messages', () => {
    const message = toPublicMessage({
      id: 'm1',
      content: 'hello',
      senderId: 'u1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      sender: {
        id: 'u1',
        name: 'Demo',
        image: null,
        email: 'secret@example.com',
      },
    })

    expect(message.sender).toEqual({ id: 'u1', name: 'Demo', image: null })
    expect(JSON.stringify(message)).not.toContain('secret@example.com')
  })
})

describe('chat.dto validation', () => {
  it('rejects messages longer than 280 characters', async () => {
    const { sendMessageSchema } = await import('../../../apps/server/src/modules/chat/chat.dto')
    const result = sendMessageSchema.safeParse({ content: 'x'.repeat(281) })
    expect(result.success).toBe(false)
  })
})
