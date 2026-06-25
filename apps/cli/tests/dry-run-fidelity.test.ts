import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { scaffoldProject } from '../src/lib/scaffold'
import type { ProjectConfig } from '../src/types/schemas'

function baseConfig(destinationDir: string): ProjectConfig {
  return {
    projectName: 'dry-run-app',
    destinationDir,
    family: 'next',
    bundles: ['product'],
    packageManager: 'bun',
    database: 'none',
    vectorDatabase: 'none',
    orm: 'none',
    backend: 'none',
    runtime: 'bun',
    example: 'none',
    testing: 'bun',
    deployment: 'vercel-railway',
    includeShowcase: false,
    includeWorker: false,
    includeLiveDemo: false,
    includeDocker: false,
    includeCi: false,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
  }
}

describe('dry-run fidelity', () => {
  it('does not write to the user destination path', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-dry-run-user-'))
    const userDest = join(tmpRoot, 'user-dest')
    const config = baseConfig(userDest)
    await scaffoldProject(config, true)
    expect(existsSync(userDest)).toBe(false)
    rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('matches real scaffold generatedFiles for next', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-dry-run-fidelity-'))
    const realDest = join(tmpRoot, 'real')
    const config = baseConfig(realDest)

    const dry = await scaffoldProject(config, true)
    const real = await createProject({ config, dryRun: false })
    expect(real.success).toBe(true)
    if (!real.success || !real.result) throw new Error('real scaffold failed')

    const drySet = new Set(dry.generatedFiles)
    const realSet = new Set(real.result.generatedFiles)
    expect(drySet).toEqual(realSet)

    rmSync(tmpRoot, { recursive: true, force: true })
  })
})
