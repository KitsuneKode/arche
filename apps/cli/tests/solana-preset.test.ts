import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { projectDefaultsForPreset } from '../src/registry/preset-config'
import type { Preset, ProjectConfig } from '../src/types/schemas'

function configForPreset(destinationDir: string, preset: Preset): ProjectConfig {
  return {
    projectName: preset,
    destinationDir,
    family: 'solana',
    bundles: [],
    packageManager: 'bun',
    database: 'none',
    vectorDatabase: 'none',
    orm: 'none',
    backend: 'none',
    runtime: 'bun',
    addons: [],
    example: 'none',
    testing: 'bun',
    deployment: 'none',
    includeShowcase: false,
    includeWorker: false,
    includeDocker: false,
    includeCi: true,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
    preset,
    ...projectDefaultsForPreset(preset),
  }
}

describe('solana preset output', () => {
  it('scaffolds solana-program with Anchor program and generated client/config packages', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-solana-program-'))
    const destinationDir = join(tmpRoot, 'program')

    try {
      const result = await createProject({
        config: configForPreset(destinationDir, 'solana-program'),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'programs/core/Cargo.toml'))).toBe(true)
      expect(existsSync(join(destinationDir, 'programs/core/src/lib.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'packages/solana-config/src/index.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'packages/solana-client/src/index.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web'))).toBe(false)
      expect(existsSync(join(destinationDir, 'apps/mobile'))).toBe(false)

      const anchor = readFileSync(join(destinationDir, 'Anchor.toml'), 'utf8')
      expect(anchor).toContain('[programs.localnet]')
      expect(anchor).toContain('solana_program_core')

      const cargoWorkspace = readFileSync(join(destinationDir, 'Cargo.toml'), 'utf8')
      expect(cargoWorkspace).toContain('[profile.release]')
      expect(cargoWorkspace).toContain('overflow-checks = true')

      const programCargo = readFileSync(join(destinationDir, 'programs/core/Cargo.toml'), 'utf8')
      expect(programCargo).toContain('[features]')
      expect(programCargo).toContain('idl-build = ["anchor-lang/idl-build"]')

      const rootPackage = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8'))
      expect(rootPackage.packageManager).toStartWith('bun@')
      expect(rootPackage.workspaces.packages).toContain('packages/*')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)

  it('scaffolds solana-product with web, mobile, program, client, and config boundaries', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-solana-product-'))
    const destinationDir = join(tmpRoot, 'product')

    try {
      const result = await createProject({
        config: configForPreset(destinationDir, 'solana-product'),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'programs/core/src/lib.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'packages/solana-client/src/index.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'packages/solana-config/src/index.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web/package.json'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web/app/page.tsx'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/mobile/package.json'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/mobile/App.tsx'))).toBe(true)

      const webPage = readFileSync(join(destinationDir, 'apps/web/app/page.tsx'), 'utf8')
      expect(webPage).toStartWith("'use client'")
      expect(webPage).toContain('@solana/wallet-adapter-react')
      expect(webPage).toContain('@solana-product/solana-client')
      expect(webPage).not.toContain('@arche-template/')

      const mobilePackage = JSON.parse(
        readFileSync(join(destinationDir, 'apps/mobile/package.json'), 'utf8'),
      )
      expect(mobilePackage.main).toBe('index.js')
      expect(existsSync(join(destinationDir, 'apps/mobile/index.js'))).toBe(true)

      const mobileApp = readFileSync(join(destinationDir, 'apps/mobile/App.tsx'), 'utf8')
      expect(mobileApp).toContain('Solana Mobile Wallet Adapter')
      expect(mobileApp).toContain('@solana-product/solana-client')
      expect(mobileApp).not.toContain('@arche-template/')

      const client = readFileSync(
        join(destinationDir, 'packages/solana-client/src/index.ts'),
        'utf8',
      )
      expect(client).toContain('@solana-product/solana-config')
      expect(client).not.toContain('@arche-template/')

      const architecture = readFileSync(
        join(destinationDir, '.docs/architecture/generated-project.md'),
        'utf8',
      )
      expect(architecture).toContain('## Where things go')
      expect(architecture).toContain('packages/solana-client')
      expect(architecture).toContain('Wallet UI stays in the app')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)

  it('scaffolds solana-web without the mobile app', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-solana-web-'))
    const destinationDir = join(tmpRoot, 'web')

    try {
      const result = await createProject({
        config: configForPreset(destinationDir, 'solana-web'),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'programs/core/src/lib.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web/app/page.tsx'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/mobile'))).toBe(false)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)

  it('scaffolds solana-mobile without the web app', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-solana-mobile-'))
    const destinationDir = join(tmpRoot, 'mobile')

    try {
      const result = await createProject({
        config: configForPreset(destinationDir, 'solana-mobile'),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'programs/core/src/lib.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/mobile/App.tsx'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/mobile/index.js'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web'))).toBe(false)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})
