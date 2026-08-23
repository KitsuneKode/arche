import { describe, expect, it } from 'bun:test'

import { buildPublicFeedWhere } from './chat.repository'

describe('buildPublicFeedWhere', () => {
  it('excludes proof messages and smoke test senders', () => {
    const where = buildPublicFeedWhere()
    expect(where.kind).toEqual({ notIn: ['proof'] })
    expect(where.NOT).toEqual({
      sender: {
        OR: [{ name: 'Live Smoke' }, { email: { startsWith: 'smoke+' } }],
      },
    })
  })
})
