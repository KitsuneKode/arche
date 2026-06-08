#!/usr/bin/env bun
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const TARGET_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist'])

async function walk(dir: string): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) return
      const fullPath = join(dir, entry.name)
      if (TARGET_DIRS.has(entry.name)) {
        await rm(fullPath, { recursive: true, force: true })
        return
      }
      await walk(fullPath)
    }),
  )
}

await walk(process.cwd())
