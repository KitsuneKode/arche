import { describe, expect, it } from 'bun:test'

import { createThemedSprites, getThemeColors, invalidateSpriteCache } from './sprites'

describe('relay-run sprites', () => {
  it('returns theme colors palette with consistent keys', () => {
    const colors = getThemeColors()
    expect(colors.bgTop).toBeDefined()
    expect(colors.bgBottom).toBeDefined()
    expect(colors.amber).toBeDefined()
    expect(colors.emerald).toBeDefined()
    expect(colors.foreground).toBeDefined()
  })

  it('creates and caches themed sprites', () => {
    invalidateSpriteCache()
    const sprites1 = createThemedSprites()
    expect(sprites1.birdFrameA.width).toBeGreaterThan(0)
    expect(sprites1.birdFrameB.height).toBeGreaterThan(0)
    expect(sprites1.pipeBody.width).toBeGreaterThan(0)
    expect(sprites1.pipeCap.width).toBeGreaterThan(0)
    expect(sprites1.groundTile.width).toBeGreaterThan(0)
    expect(sprites1.gridTile.width).toBeGreaterThan(0)

    // Cached instance matches
    const sprites2 = createThemedSprites()
    expect(sprites2).toBe(sprites1)

    // Invalidation clears cache
    invalidateSpriteCache()
    const sprites3 = createThemedSprites()
    expect(sprites3).not.toBe(sprites1)
  })
})
