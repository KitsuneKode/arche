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
  if (family === 'tui') {
    return ['install', 'typecheck', 'build']
  }
  if (family === 'tanstack') {
    return ['install', 'typecheck', 'lint', 'build', 'smoke']
  }
  if (family === 'lib' || family === 'cli' || family === 'worker') {
    return ['install', 'typecheck', 'lint']
  }
  if (family === 'mobile') {
    return ['install', 'typecheck', 'lint']
  }
  if (family === 'next' || family === 'backend') {
    return ['install', 'typecheck', 'lint', 'build', 'smoke']
  }
  return ['install', 'typecheck', 'lint', 'build']
}

const comboCases = buildGeneratedComboCases()
const runHeavyCombos = process.env.SCAFFOLD_E2E === '1'
const comboDescribe = runHeavyCombos
  ? process.env.SCAFFOLD_E2E_SERIAL === '1'
    ? describe.serial
    : describe
  : describe.skip

comboDescribe('e2e scaffold combo matrix', () => {
  for (const combo of comboCases) {
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
