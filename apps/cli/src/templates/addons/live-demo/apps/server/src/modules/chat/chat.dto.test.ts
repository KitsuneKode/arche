import { describe, expect, it } from 'bun:test'

import { sendMessageSchema } from './chat.dto'

describe('chat.dto validation', () => {
  it('rejects messages longer than 280 characters', () => {
    const result = sendMessageSchema.safeParse({ content: 'x'.repeat(281) })
    expect(result.success).toBe(false)
  })
})
