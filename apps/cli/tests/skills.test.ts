import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSkillRecommendations, writeSkillConfigs } from '../src/lib/generators/skills'
import type { ProjectConfig } from '../src/types/schemas'

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'test-app',
    destinationDir: '/tmp/test-app',
    family: 'fullstack',
    bundles: ['product'],
    packageManager: 'bun',
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    example: 'none',
    testing: 'bun',
    deployment: 'vercel-railway',
    includeShowcase: false,
    includeWorker: false,
    includeLiveDemo: false,
    includeDocker: true,
    includeCi: true,
    initializeGit: true,
    installDependencies: true,
    presets: [],
    rustAuth: 'placeholder',
    ...overrides,
  }
}

describe('buildSkillRecommendations', () => {
  it('returns non-empty string for fullstack config', () => {
    const result = buildSkillRecommendations(makeConfig())
    expect(result).toBeTruthy()
    expect(result).toContain('next-best-practices')
  })

  it('includes prisma skill when orm is prisma', () => {
    const result = buildSkillRecommendations(makeConfig({ orm: 'prisma' }))
    expect(result).toContain('prisma')
  })

  it('includes drizzle skill when orm is drizzle', () => {
    const result = buildSkillRecommendations(makeConfig({ orm: 'drizzle' }))
    expect(result).toContain('drizzle')
  })

  it('includes vercel-ai-sdk when ai bundle is selected', () => {
    const result = buildSkillRecommendations(makeConfig({ bundles: ['product', 'ai'] }))
    expect(result).toContain('vercel-ai-sdk')
  })

  it('includes supabase skill for postgres database', () => {
    const result = buildSkillRecommendations(makeConfig({ database: 'postgres' }))
    expect(result).toContain('supabase')
  })

  it('returns empty string for simple family without matching skills', () => {
    const result = buildSkillRecommendations(
      makeConfig({ family: 'rust', backend: 'none', database: 'none', orm: 'none', bundles: [] }),
    )
    expect(result).toBe('')
  })
})

describe('writeSkillConfigs', () => {
  it('writes skills.json to .opencode directory', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'arche-skills-test-'))
    try {
      writeSkillConfigs(tmpDir, makeConfig())
      const skillsPath = join(tmpDir, '.opencode/skills.json')
      expect(existsSync(skillsPath)).toBe(true)
      const content = JSON.parse(readFileSync(skillsPath, 'utf8'))
      expect(content.version).toBe('0.1.0')
      expect(Array.isArray(content.skills)).toBe(true)
      expect(content.skills.length).toBeGreaterThan(0)
      expect(content.skills[0]).toHaveProperty('source')
      expect(content.skills[0]).toHaveProperty('name')
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('does not write file when no skills match', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'arche-skills-empty-'))
    try {
      writeSkillConfigs(
        tmpDir,
        makeConfig({ family: 'rust', backend: 'none', database: 'none', orm: 'none', bundles: [] }),
      )
      const skillsPath = join(tmpDir, '.opencode/skills.json')
      expect(existsSync(skillsPath)).toBe(false)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('writes only opencode skills by default', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'arche-skills-agent-'))
    try {
      writeSkillConfigs(tmpDir, makeConfig())
      const content = JSON.parse(readFileSync(join(tmpDir, '.opencode/skills.json'), 'utf8'))
      for (const skill of content.skills) {
        expect(skill.name).toBeTruthy()
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
