import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface HistoryEntry {
  timestamp: string
  projectName: string
  destinationDir: string
  family: string
  backend: string
  database: string
  orm: string
  reproducible: string
}

function historyDir(): string {
  return process.env.ARCHE_HISTORY_DIR || join(homedir(), '.arche')
}

function historyFile(): string {
  return join(historyDir(), 'history.json')
}

function ensureHistoryDir(): void {
  const dir = historyDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function readHistory(): HistoryEntry[] {
  ensureHistoryDir()
  const file = historyFile()
  if (!existsSync(file)) return []
  try {
    const raw = readFileSync(file, 'utf8')
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  ensureHistoryDir()
  writeFileSync(historyFile(), JSON.stringify(entries, null, 2) + '\n')
}

/** Record a scaffold in the local history store */
export function recordHistory(entry: HistoryEntry): void {
  const entries = readHistory()
  entries.unshift(entry)
  // Keep last 50 entries
  writeHistory(entries.slice(0, 50))
}

/** Best-effort history recording for the scaffold success path. */
export function tryRecordHistory(entry: HistoryEntry): boolean {
  try {
    recordHistory(entry)
    return true
  } catch {
    return false
  }
}

/** Get recent scaffold history */
export function getHistory(limit = 10): HistoryEntry[] {
  return readHistory().slice(0, limit)
}

/** Print history to stdout */
export function printHistory(limit = 10): void {
  const entries = getHistory(limit)
  if (entries.length === 0) {
    console.log('No scaffold history found.')
    return
  }
  console.log(`Recent scaffolds (last ${entries.length}):\n`)
  for (const entry of entries) {
    console.log(
      `  ${entry.timestamp.slice(0, 10)} ${entry.projectName.padEnd(20)} ${entry.family.padEnd(10)} ${entry.reproducible}`,
    )
  }
}
