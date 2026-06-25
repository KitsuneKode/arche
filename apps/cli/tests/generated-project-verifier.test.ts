import { describe, expect, it } from 'bun:test'
import {
  buildGeneratedProjectCases,
  verifyGeneratedProject,
} from '../src/lib/generated-project-verifier'

describe('generated project verifier', () => {
  it('keeps slow generated command gates out of the default case matrix', () => {
    expect(buildGeneratedProjectCases()).toEqual(
      expect.arrayContaining([
        { preset: 'typescript-fullstack', packageManager: 'bun' },
        { preset: 'typescript-fullstack', packageManager: 'pnpm' },
        { preset: 'rust-api', packageManager: 'bun' },
        { preset: 'rust-fullstack', packageManager: 'bun' },
        { preset: 'solana-product', packageManager: 'bun' },
      ]),
    )
  })

  it('verifies TypeScript fullstack structure without installing dependencies', async () => {
    const result = await verifyGeneratedProject({
      preset: 'typescript-fullstack',
      packageManager: 'bun',
      commands: [],
    })

    expect(result.success).toBe(true)
    expect(result.missingFiles).toEqual([])
    expect(result.commands).toEqual([])
  }, 60000)

  it('verifies Solana product structure without running Anchor gates', async () => {
    const result = await verifyGeneratedProject({
      preset: 'solana-product',
      packageManager: 'bun',
      commands: [],
    })

    expect(result.success).toBe(true)
    expect(result.missingFiles).toEqual([])
    expect(result.commands).toEqual([])
  }, 60000)

  it('skips JavaScript package commands for pure Rust presets', async () => {
    const result = await verifyGeneratedProject({
      preset: 'rust-api',
      packageManager: 'bun',
      commands: ['install', 'typecheck', 'build', 'cargo-check'],
    })

    expect(result.success).toBe(true)
    expect(result.commands.map((command) => [command.command, command.status])).toEqual([
      ['install', 'skipped'],
      ['typecheck', 'skipped'],
      ['build', 'skipped'],
      ['cargo-check', 'passed'],
    ])
  }, 120000)

  it('skips Anchor builds for presets without Anchor metadata', async () => {
    const result = await verifyGeneratedProject({
      preset: 'typescript-fullstack',
      packageManager: 'bun',
      commands: ['anchor-build'],
    })

    expect(result.success).toBe(true)
    expect(result.commands[0]).toMatchObject({
      command: 'anchor-build',
      status: 'skipped',
    })
  }, 60000)

  it('verifies live-demo fullstack structure without installing dependencies', async () => {
    const result = await verifyGeneratedProject({
      preset: 'typescript-fullstack',
      packageManager: 'bun',
      commands: [],
      configOverrides: { includeLiveDemo: true, includeWorker: true },
    })

    expect(result.success).toBe(true)
    expect(result.missingFiles).toEqual([])
  }, 60000)
})
