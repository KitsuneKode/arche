import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const walkthroughDir = join(import.meta.dir, '../content/docs/guides')

describe('content truthfulness', () => {
  it('walkthroughs do not hard-code outdated support labels', () => {
    const files = [
      'walkthrough-typescript-fullstack.mdx',
      'walkthrough-rust.mdx',
      'walkthrough-solana.mdx',
      'walkthrough-convex-product.mdx',
    ]

    for (const file of files) {
      const text = readFileSync(join(walkthroughDir, file), 'utf8')
      expect(text).not.toMatch(/\*\*Support label:\*\* Requires validation/)
    }
  })
})
