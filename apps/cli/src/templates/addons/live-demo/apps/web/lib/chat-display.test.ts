import { describe, expect, it } from 'bun:test'

import { formatChatSenderLabel } from '@/lib/chat-display'

describe('formatChatSenderLabel', () => {
  it('labels the current user as You', () => {
    expect(
      formatChatSenderLabel(
        { senderId: 'user-1', sender: { id: 'user-1', name: 'Ada', image: null } },
        'user-1',
      ),
    ).toBe('You')
  })

  it('shows guest id suffix for anonymous senders', () => {
    expect(
      formatChatSenderLabel({
        senderId: 'cluser1234567890ab',
        sender: { id: 'cluser1234567890ab', name: 'Guest · 567890ab', image: null },
      }),
    ).toBe('Guest · 567890ab')
  })

  it('falls back to guest label when sender name is missing', () => {
    expect(
      formatChatSenderLabel({
        senderId: 'cluser1234567890ab',
        sender: null,
      }),
    ).toBe('Guest · 567890ab')
  })
})
