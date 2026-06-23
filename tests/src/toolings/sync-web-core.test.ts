import { describe, expect, it } from 'bun:test'
import { syncWebCore } from '../../../toolings/scripts/sync-web-core'

describe('sync-web-core', () => {
  it('reports no drift against the real template tree', async () => {
    const drifted = await syncWebCore({ check: true })
    expect(drifted).toHaveLength(0)
  })
})
