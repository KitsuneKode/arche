import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rollbackDestination } from '../src/lib/scaffold'

describe('rollbackDestination', () => {
  it('removes a created destination directory on rollback', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-rollback-'))
    const dest = join(tmpRoot, 'app')
    mkdirSync(dest, { recursive: true })
    writeFileSync(join(dest, 'nested.txt'), 'x')
    await rollbackDestination(dest, false)
    expect(existsSync(dest)).toBe(false)
    rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('leaves a pre-existing empty directory empty after rollback', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-rollback-'))
    const dest = join(tmpRoot, 'app')
    mkdirSync(dest, { recursive: true })
    writeFileSync(join(dest, 'file.txt'), 'x')
    await rollbackDestination(dest, true)
    const entries = await Array.fromAsync(new Bun.Glob('*').scan(dest))
    expect(entries).toHaveLength(0)
    rmSync(tmpRoot, { recursive: true, force: true })
  })
})
