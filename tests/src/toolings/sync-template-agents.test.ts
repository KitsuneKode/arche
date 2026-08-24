import { describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  collectTemplateAgentsPairs,
  syncTemplateAgents,
} from '../../../toolings/scripts/sync-template-agents'

describe('sync-template-agents', () => {
  it('finds the seven fullstack template pairs in the real repo', async () => {
    const pairs = await collectTemplateAgentsPairs()
    const relatives = pairs.map((p) => p.relative).sort()
    expect(relatives).toEqual([
      'apps/server/AGENTS.md',
      'apps/worker/AGENTS.md',
      'packages/auth/AGENTS.md',
      'packages/backend-common/AGENTS.md',
      'packages/common/AGENTS.md',
      'packages/store/AGENTS.md',
      'toolings/typescript-config/AGENTS.md',
    ])
  })

  it('reports no drift when live and template contents match', async () => {
    const drifted = await syncTemplateAgents({ check: true })
    expect(drifted).toHaveLength(0)
  })

  it('detects drift between a mismatched pair', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'sync-agents-'))
    const liveDir = join(tmpRoot, 'apps/server')
    const templateDir = join(tmpRoot, 'apps/cli/src/templates/fullstack/apps/server')
    mkdirSync(liveDir, { recursive: true })
    mkdirSync(templateDir, { recursive: true })
    const livePath = join(liveDir, 'AGENTS.md')
    const templatePath = join(templateDir, 'AGENTS.md')
    writeFileSync(livePath, '# live\n')
    writeFileSync(templatePath, '# template\n')

    const liveText = await Bun.file(livePath).text()
    const templateText = await Bun.file(templatePath).text()
    expect(liveText).not.toBe(templateText)

    rmSync(tmpRoot, { recursive: true, force: true })
  })
})
