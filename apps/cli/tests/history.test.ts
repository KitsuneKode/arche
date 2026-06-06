import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getHistory, tryRecordHistory } from '../src/lib/history'

const entry = {
  timestamp: '2026-06-05T00:00:00.000Z',
  projectName: 'history-app',
  destinationDir: '/tmp/history-app',
  family: 'fullstack',
  backend: 'express-bun',
  database: 'postgres',
  orm: 'prisma',
  reproducible: 'arche create history-app fullstack --yes',
}

describe('scaffold history', () => {
  it('records history in the configured history directory', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-history-'))
    const previous = process.env.ARCHE_HISTORY_DIR
    process.env.ARCHE_HISTORY_DIR = tmpRoot

    try {
      expect(tryRecordHistory(entry)).toBe(true)
      expect(existsSync(join(tmpRoot, 'history.json'))).toBe(true)
      expect(getHistory(1)[0]).toMatchObject({ projectName: 'history-app' })

      const raw = readFileSync(join(tmpRoot, 'history.json'), 'utf8')
      expect(JSON.parse(raw)).toHaveLength(1)
    } finally {
      if (previous === undefined) {
        delete process.env.ARCHE_HISTORY_DIR
      } else {
        process.env.ARCHE_HISTORY_DIR = previous
      }
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('does not throw when history storage is unavailable', () => {
    const previous = process.env.ARCHE_HISTORY_DIR
    process.env.ARCHE_HISTORY_DIR = '/proc/arche-history-denied'

    try {
      expect(tryRecordHistory(entry)).toBe(false)
    } finally {
      if (previous === undefined) {
        delete process.env.ARCHE_HISTORY_DIR
      } else {
        process.env.ARCHE_HISTORY_DIR = previous
      }
    }
  })
})
