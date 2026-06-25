import { describe, expect, it } from 'bun:test'

import { guestDisplayName, resolveDisplayName } from '@arche-template/auth/guest-display-name'

describe('guest display name', () => {
  it('formats guest names from user id suffix', () => {
    expect(guestDisplayName('cluser1234567890ab')).toBe('Guest · 567890ab')
  })

  it('uses guest label for anonymous users', () => {
    expect(resolveDisplayName({ id: 'cluser1234567890ab', name: 'temp', isAnonymous: true })).toBe(
      'Guest · 567890ab',
    )
  })

  it('keeps registered names', () => {
    expect(resolveDisplayName({ id: 'user-1', name: 'Ada', isAnonymous: false })).toBe('Ada')
  })
})
