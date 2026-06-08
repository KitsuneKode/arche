import { describe, expect, it } from 'bun:test'
import {
  buildGeneratedComboCases,
  type GeneratedProjectCommand,
  verifyGeneratedCombo,
} from '../src/lib/generated-project-verifier'

function commandsForCombo(id: string, family: string): GeneratedProjectCommand[] {
  if (family === 'rust') {
    return ['cargo-check']
  }
  if (family === 'lib' || family === 'cli' || family === 'worker') {
    return ['install', 'typecheck', 'lint']
  }
  if (family === 'mobile') {
    return ['install', 'typecheck', 'lint']
  }
  return ['install', 'typecheck', 'lint', 'build']
}

describe('e2e scaffold combo matrix', () => {
  for (const combo of buildGeneratedComboCases()) {
    it(`${combo.id} (${combo.family}) passes generated-project verification`, async () => {
      const result = await verifyGeneratedCombo({
        ...combo,
        commands: commandsForCombo(combo.id, combo.family),
        skipMissingTools: true,
      })

      if (!result.success) {
        const details = [
          ...result.missingFiles.map((f) => `missing: ${f}`),
          ...result.commands
            .filter((c) => c.status === 'failed')
            .map((c) => `${c.command} failed: ${c.output.slice(0, 500)}`),
        ].join('\n')
        throw new Error(`${combo.id} failed:\n${details}`)
      }

      expect(result.success).toBe(true)
    }, 600_000)
  }
})
