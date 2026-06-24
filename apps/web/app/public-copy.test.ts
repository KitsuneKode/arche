import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const appRoot = import.meta.dir

const publicCopyFiles = [
  'layout.tsx',
  'page.tsx',
  'families/page.tsx',
  'live/page.tsx',
  '../components/live/live-demo.tsx',
  '../components/live/proof-ladder.tsx',
  '../components/arche/animated-terminal.tsx',
  '../components/arche/architecture-graph.tsx',
  '../components/arche/feature-grid.tsx',
  '../components/arche/family-table.tsx',
  '../components/arche/stack-diagram.tsx',
  '../components/arche/code-example.tsx',
]

const bannedClaims = [
  'Status: Production Ready',
  'Production Ready',
  'Zero to Production',
  'Next.js 15',
  'remote cache enabled by default',
  'rules for Cursor',
  '11 distinct starter templates',
]

const bannedArchitectureClaims = [
  'In packages/trpc, you define your procedures',
  'packages/trpc (shared routers)',
  'Define Routers',
]

describe('public website copy', () => {
  it('does not publish stale capability or asset claims', () => {
    const combinedCopy = publicCopyFiles
      .map((file) => readFileSync(join(appRoot, file), 'utf8'))
      .join('\n')

    for (const claim of bannedClaims) {
      expect(combinedCopy).not.toContain(claim)
    }
  })

  it('does not describe packages/trpc as the router definition layer', () => {
    const combinedCopy = publicCopyFiles
      .map((file) => readFileSync(join(appRoot, file), 'utf8'))
      .join('\n')

    for (const claim of bannedArchitectureClaims) {
      expect(combinedCopy).not.toContain(claim)
    }
  })
})
