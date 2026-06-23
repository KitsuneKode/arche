import { describe, expect, it } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { PRESETS } from '../src/registry/presets'
import { FamilySchema, PresetSchema } from '../src/types/schemas'

const cliEntry = join(import.meta.dir, '../src/index.ts')

describe('CLI help', () => {
  it('lists every scaffold family', () => {
    const result = spawnSync('bun', ['run', cliEntry, '--help'], { encoding: 'utf8' })
    expect(result.status).toBe(0)
    for (const family of FamilySchema.options) {
      expect(result.stdout).toContain(family)
    }
  })

  it('lists stable presets in the preset hint', () => {
    const result = spawnSync('bun', ['run', cliEntry, '--help'], { encoding: 'utf8' })
    expect(result.status).toBe(0)
    for (const preset of PRESETS.filter((entry) => entry.status === 'stable')) {
      expect(result.stdout).toContain(preset.id)
    }
    expect(result.stdout).toContain('customize')
    expect(PresetSchema.safeParse('tui-app').success).toBe(true)
    expect(PresetSchema.safeParse('tanstack-start').success).toBe(true)
  })
})
