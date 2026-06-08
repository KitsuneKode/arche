import { describe, expect, it } from 'bun:test'
import {
  validateProjectName,
  checkCompatibility,
  CLIArgsSchema,
  ProjectConfigSchema,
  TestingSchema,
  DeploymentSchema,
  DatabaseSchema,
  FamilySchema,
  PresetSchema,
  StablePackageManagerSchema,
  hasBackendOptions,
  hasDatabaseOptions,
  hasOrmOptions,
  hasPresetOptions,
  familySupportsWorker,
  familySupportsShowcase,
} from '../src/types/schemas'

describe('validateProjectName', () => {
  it('accepts valid project names', () => {
    expect(validateProjectName('my-app')).toEqual({ valid: true })
    expect(validateProjectName('cool-project-123')).toEqual({ valid: true })
    expect(validateProjectName('app')).toEqual({ valid: true })
  })

  it('rejects empty names', () => {
    const result = validateProjectName('')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('rejects names with only special characters', () => {
    const result = validateProjectName('---')
    expect(result.valid).toBe(false)
  })
})

describe('checkCompatibility', () => {
  it('returns no warnings or errors for default config', () => {
    const result = checkCompatibility({
      database: 'postgres',
      orm: 'prisma',
    })
    expect(result.warnings).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('errors when pgvector is used without postgres', () => {
    const result = checkCompatibility({
      database: 'sqlite',
      vectorDatabase: 'pgvector',
    })
    expect(result.errors.some((e: string) => e.includes('pgvector'))).toBe(true)
  })

  it('warns when chat example is used without websocket addon', () => {
    const result = checkCompatibility({
      example: 'chat',
    })
    expect(result.warnings.some((w: string) => w.includes('arche add websocket'))).toBe(true)
  })

  it('errors when fastify-node backend is requested', () => {
    const result = checkCompatibility({
      family: 'fullstack',
      backend: 'fastify-node',
    })
    expect(result.errors.some((e: string) => e.includes('Fastify'))).toBe(true)
  })

  it('errors when ORM is set but database is none', () => {
    const result = checkCompatibility({
      database: 'none',
      orm: 'prisma',
    })
    expect(result.errors.some((e: string) => e.includes('requires a database'))).toBe(true)
  })

  it('warns about reel time bundle without worker', () => {
    const result = checkCompatibility({
      example: 'todo',
      bundles: ['realtime'],
      includeWorker: false,
      family: 'fullstack',
    })
    expect(result.warnings.some((w: string) => w.includes('Realtime bundle'))).toBe(true)
  })

  it('warns when family is next and backend is set', () => {
    const result = checkCompatibility({
      family: 'next',
      backend: 'express-bun',
      database: 'postgres',
    })
    expect(result.warnings.some((w: string) => w.includes('Backend selection'))).toBe(true)
  })

  it('does not warn when family is rust and database is postgres', () => {
    const result = checkCompatibility({
      family: 'rust',
      database: 'postgres',
      example: 'posts',
    })
    expect(result.warnings.some((w: string) => w.includes('Database selection'))).toBe(false)
  })

  it('warns when rust posts example is used without a database', () => {
    const result = checkCompatibility({
      family: 'rust',
      database: 'none',
      example: 'posts',
    })
    expect(result.warnings.some((w: string) => w.includes('Posts example'))).toBe(true)
  })

  it('no warnings for fullstack with backend and database', () => {
    const result = checkCompatibility({
      family: 'fullstack',
      backend: 'express-bun',
      database: 'postgres',
      orm: 'prisma',
    })
    expect(result.warnings.filter((w: string) => w.includes('only applicable'))).toEqual([])
  })

  it('errors when npm package manager is selected', () => {
    const result = checkCompatibility({
      packageManager: 'npm',
    })
    expect(result.errors.some((e: string) => e.includes('npm'))).toBe(true)
  })

  it('errors when fullstack has database none', () => {
    const result = checkCompatibility({
      family: 'fullstack',
      database: 'none',
    })
    expect(result.errors.some((e: string) => e.includes('database'))).toBe(true)
  })
})

describe('Zod schemas', () => {
  describe('new preset schemas', () => {
    it('parses approved preset candidates', () => {
      expect(PresetSchema.parse('rust-fullstack')).toBe('rust-fullstack')
      expect(PresetSchema.parse('solana-product')).toBe('solana-product')
    })

    it('keeps stable package managers to Bun and pnpm', () => {
      expect(StablePackageManagerSchema.parse('bun')).toBe('bun')
      expect(StablePackageManagerSchema.parse('pnpm')).toBe('pnpm')
      expect(() => StablePackageManagerSchema.parse('npm')).toThrow()
    })
  })

  describe('TestingSchema', () => {
    it('accepts valid values', () => {
      expect(TestingSchema.parse('bun')).toBe('bun')
      expect(TestingSchema.parse('none')).toBe('none')
    })

    it('rejects invalid values', () => {
      expect(() => TestingSchema.parse('jest')).toThrow()
    })
  })

  describe('DeploymentSchema', () => {
    it('accepts valid values', () => {
      expect(DeploymentSchema.parse('vercel-railway')).toBe('vercel-railway')
      expect(DeploymentSchema.parse('none')).toBe('none')
    })
  })

  describe('DatabaseSchema', () => {
    it('accepts valid database types', () => {
      expect(DatabaseSchema.parse('postgres')).toBe('postgres')
      expect(DatabaseSchema.parse('sqlite')).toBe('sqlite')
      expect(() => DatabaseSchema.parse('mongodb')).toThrow()
      expect(DatabaseSchema.parse('none')).toBe('none')
    })
  })

  describe('CLIArgsSchema', () => {
    it('parses minimal args', () => {
      const result = CLIArgsSchema.parse({})
      expect(result.yes).toBe(false)
      expect(result.help).toBe(false)
      expect(result.version).toBe(false)
    })

    it('parses full args', () => {
      const result = CLIArgsSchema.parse({
        projectName: 'my-app',
        yes: true,
        install: true,
        git: true,
        testing: 'bun',
        deployment: 'vercel-railway',
      })
      expect(result.projectName).toBe('my-app')
      expect(result.yes).toBe(true)
      expect(result.testing).toBe('bun')
    })
  })

  describe('ProjectConfigSchema', () => {
    it('applies defaults correctly', () => {
      const result = ProjectConfigSchema.parse({
        projectName: 'test-app',
        destinationDir: '/tmp/test-app',
      })
      expect(result.database).toBe('postgres')
      expect(result.orm).toBe('prisma')
      expect(result.backend).toBe('express-bun')
      expect(result.runtime).toBe('bun')
      expect(result.testing).toBe('bun')
      expect(result.deployment).toBe('vercel-railway')
      expect(result.includeShowcase).toBe(false)
      expect(result.includeWorker).toBe(false)
      expect(result.includeDocker).toBe(true)
      expect(result.includeCi).toBe(true)
      expect(result.initializeGit).toBe(true)
      expect(result.installDependencies).toBe(true)
    })
  })

  describe('Family helpers', () => {
    const allFamilies = FamilySchema.options

    describe('hasBackendOptions', () => {
      it('returns true only for fullstack', () => {
        expect(hasBackendOptions('fullstack')).toBe(true)
        expect(hasBackendOptions('backend')).toBe(false)
        expect(hasBackendOptions('polyglot')).toBe(false)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'fullstack') continue
          expect(hasBackendOptions(f)).toBe(false)
        }
      })
    })

    describe('hasDatabaseOptions', () => {
      it('returns true only for fullstack', () => {
        expect(hasDatabaseOptions('fullstack')).toBe(true)
        expect(hasDatabaseOptions('backend')).toBe(false)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'fullstack') continue
          expect(hasDatabaseOptions(f)).toBe(false)
        }
      })
    })

    describe('hasOrmOptions', () => {
      it('returns true only for fullstack', () => {
        expect(hasOrmOptions('fullstack')).toBe(true)
        expect(hasOrmOptions('polyglot')).toBe(false)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'fullstack') continue
          expect(hasOrmOptions(f)).toBe(false)
        }
      })
    })

    describe('hasPresetOptions', () => {
      it('returns true only for next', () => {
        expect(hasPresetOptions('next')).toBe(true)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'next') continue
          expect(hasPresetOptions(f)).toBe(false)
        }
      })
    })

    describe('familySupportsWorker', () => {
      it('returns true only for fullstack', () => {
        expect(familySupportsWorker('fullstack')).toBe(true)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'fullstack') continue
          expect(familySupportsWorker(f)).toBe(false)
        }
      })
    })

    describe('familySupportsShowcase', () => {
      it('returns true only for fullstack', () => {
        expect(familySupportsShowcase('fullstack')).toBe(true)
      })

      it('returns false for all other families', () => {
        for (const f of allFamilies) {
          if (f === 'fullstack') continue
          expect(familySupportsShowcase(f)).toBe(false)
        }
      })
    })
  })
})
