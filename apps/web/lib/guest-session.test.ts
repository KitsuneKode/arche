import { describe, expect, it } from 'bun:test'

import { isRegisteredUser } from '@/lib/guest-session'

describe('guest-session', () => {
  it('treats anonymous users as not registered', () => {
    expect(isRegisteredUser({ user: { id: 'u1', isAnonymous: true } })).toBe(false)
    expect(isRegisteredUser({ user: { id: 'u1', isAnonymous: false } })).toBe(true)
    expect(isRegisteredUser(null)).toBe(false)
  })
})
