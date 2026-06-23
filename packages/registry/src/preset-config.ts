import { PRESETS, type PresetId } from './presets'
import { SUPPORT_LABELS } from './support-status'

export interface PresetProjectDefaults {
  family?: string
  bundles?: string[]
  backend?: string
  database?: string
  orm?: string
  example?: string
  rustAuth?: string
  includeShowcase?: boolean
  includeWorker?: boolean
  includeDocker?: boolean
  includeCi?: boolean
  deployment?: string
}

export function projectDefaultsForPreset(preset: PresetId): PresetProjectDefaults {
  switch (preset) {
    case 'typescript-fullstack':
      return {
        family: 'fullstack',
        bundles: ['product'],
        backend: 'express-bun',
        database: 'postgres',
        orm: 'prisma',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: true,
        includeCi: true,
        deployment: 'vercel-railway',
      }
    case 'next-app':
      return {
        family: 'next',
        bundles: [],
        backend: 'none',
        database: 'none',
        orm: 'none',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: false,
        includeCi: false,
        deployment: 'none',
      }
    case 'tui-app':
      return {
        family: 'tui',
        bundles: [],
        backend: 'none',
        database: 'none',
        orm: 'none',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: false,
        includeCi: false,
        deployment: 'none',
      }
    case 'tanstack-start':
      return {
        family: 'tanstack',
        bundles: [],
        backend: 'none',
        database: 'none',
        orm: 'none',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: false,
        includeCi: false,
        deployment: 'none',
      }
    case 'rust-api':
      return {
        family: 'rust',
        bundles: ['product'],
        backend: 'rust-axum',
        database: 'postgres',
        orm: 'none',
        example: 'posts',
        rustAuth: 'placeholder',
        includeDocker: true,
        includeCi: true,
        deployment: 'vercel-railway',
      }
    case 'rust-fullstack':
      return {
        family: 'fullstack',
        bundles: ['product'],
        backend: 'rust-axum',
        database: 'postgres',
        orm: 'none',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: true,
        includeCi: true,
        deployment: 'vercel-railway',
      }
    case 'convex-product':
      return {
        family: 'convex',
        bundles: [],
        backend: 'none',
        database: 'none',
        orm: 'none',
        includeShowcase: false,
        includeWorker: false,
        includeDocker: false,
        includeCi: true,
        deployment: 'none',
      }
    case 'solana-program':
    case 'solana-web':
    case 'solana-mobile':
    case 'solana-product':
      return {
        family: 'solana',
        bundles: [],
        backend: 'none',
        database: 'none',
        orm: 'none',
        includeDocker: false,
        includeCi: true,
        deployment: 'none',
      }
    case 'customize':
    case 'experiments':
      return {}
  }
}

export function presetMenuOptions() {
  return PRESETS.map((preset) => ({
    label: preset.label,
    value: preset.id,
    hint: `${SUPPORT_LABELS[preset.status]} - ${preset.description}`,
  }))
}
