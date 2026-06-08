import { describe, expect, it } from 'bun:test'
import { presetMenuOptions, projectDefaultsForPreset } from '../src/registry/preset-config'

describe('preset config defaults', () => {
  it('maps the TypeScript fullstack preset to the production TypeScript monorepo path', () => {
    expect(projectDefaultsForPreset('typescript-fullstack')).toMatchObject({
      family: 'fullstack',
      backend: 'express-bun',
      database: 'postgres',
      orm: 'prisma',
      bundles: ['product'],
      deployment: 'vercel-railway',
    })
  })

  it('maps Rust API to the native Rust family with SQLx defaults', () => {
    expect(projectDefaultsForPreset('rust-api')).toMatchObject({
      family: 'rust',
      backend: 'rust-axum',
      database: 'postgres',
      orm: 'none',
      example: 'posts',
      rustAuth: 'placeholder',
    })
  })

  it('maps convex-product to the convex family without monorepo database options', () => {
    expect(projectDefaultsForPreset('convex-product')).toMatchObject({
      family: 'convex',
      backend: 'none',
      database: 'none',
      orm: 'none',
      bundles: [],
      includeDocker: false,
      includeWorker: false,
    })
  })

  it('maps Rust fullstack to a fullstack monorepo with Rust API ownership', () => {
    expect(projectDefaultsForPreset('rust-fullstack')).toMatchObject({
      family: 'fullstack',
      backend: 'rust-axum',
      database: 'postgres',
      orm: 'none',
      includeWorker: false,
    })
  })

  it('keeps Customize and Experiments as menu routes, not hidden scaffold defaults', () => {
    expect(projectDefaultsForPreset('customize')).toEqual({})
    expect(projectDefaultsForPreset('experiments')).toEqual({})
  })

  it('builds honest preset menu hints from support status', () => {
    expect(presetMenuOptions()[0]).toEqual({
      label: 'TypeScript Fullstack',
      value: 'typescript-fullstack',
      hint: 'Stable - Next.js plus TypeScript API, contracts, auth, database, and deployment foundations.',
    })
    expect(presetMenuOptions().at(-1)).toEqual({
      label: 'Experiments',
      value: 'experiments',
      hint: 'Experimental - Explicit opt-in for proof-gated or unstable stack routes.',
    })
  })
})
