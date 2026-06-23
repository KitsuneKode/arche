import { PRESETS, type PresetId } from './presets'
import type { SupportStatus } from './support-status'

export type PublicPresetId = PresetId

export interface PublicPresetRow {
  id: PublicPresetId
  label: string
  status: SupportStatus
  description: string
  capabilities: string[]
  shape: string
  goodFor: string
}

const DISPLAY_BY_ID: Record<
  Exclude<PresetId, 'customize' | 'experiments'>,
  Pick<PublicPresetRow, 'shape' | 'goodFor'>
> = {
  'typescript-fullstack': {
    shape: 'Next.js web + Express API + tRPC + Better Auth + Prisma',
    goodFor: 'Default production app foundation',
  },
  'next-app': {
    shape: 'Standalone Next.js App Router with env validation and boundaries',
    goodFor: 'Frontend-only apps without a bundled backend',
  },
  'rust-api': {
    shape: 'Cargo workspace with service and worker slots',
    goodFor: 'Engine services, background work, and future polyglot scale',
  },
  'rust-fullstack': {
    shape: 'Next.js web + Axum API + shared deployment docs',
    goodFor: 'Teams that want Rust on the API with a typed web client',
  },
  'convex-product': {
    shape: 'Next.js + Convex functions + Better Auth stubs',
    goodFor: 'Realtime apps, serverless backend, no Prisma/Neon ops',
  },
  'solana-program': {
    shape: 'Anchor program + generated client boundaries',
    goodFor: 'On-chain program work with explicit client contracts',
  },
  'solana-web': {
    shape: 'Next.js dApp + program + wallet adapter direction',
    goodFor: 'Web3 apps with web wallet flows',
  },
  'solana-mobile': {
    shape: 'Expo mobile + program + mobile wallet boundary',
    goodFor: 'Mobile-first Solana products',
  },
  'solana-product': {
    shape: 'Web + mobile + program + shared Solana config',
    goodFor: 'Full product surface across web, mobile, and chain',
  },
  'tui-app': {
    shape: 'OpenTUI renderer + React terminal UI starter',
    goodFor: 'Interactive CLI tools and terminal dashboards',
  },
  'tanstack-start': {
    shape: 'TanStack Start + Vite + Nitro server with file routes',
    goodFor: 'Full-stack React apps without Next.js',
  },
}

function toPublicRow(
  preset: (typeof PRESETS)[number],
  display: Pick<PublicPresetRow, 'shape' | 'goodFor'>,
): PublicPresetRow {
  return {
    id: preset.id,
    label: preset.label,
    status: preset.status,
    description: preset.description,
    capabilities: preset.capabilities,
    shape: display.shape,
    goodFor: display.goodFor,
  }
}

/** Presets shown on /families (excludes customize/experiments entry points). */
export const PUBLIC_PRESET_ROWS: PublicPresetRow[] = PRESETS.filter(
  (preset) => preset.id !== 'customize' && preset.id !== 'experiments',
).map((preset) => toPublicRow(preset, DISPLAY_BY_ID[preset.id as keyof typeof DISPLAY_BY_ID]))

export const PUBLIC_PRESET_ENTRY_ROWS: PublicPresetRow[] = [
  ...PUBLIC_PRESET_ROWS,
  {
    id: 'customize',
    label: 'Customize',
    status: 'requiresValidation',
    description: 'Build from supported capabilities with compatibility validation.',
    capabilities: [],
    shape: 'Capability picker with validation gates',
    goodFor: 'Teams that need a bespoke mix of bundles and backends',
  },
  {
    id: 'experiments',
    label: 'Experiments',
    status: 'experimental',
    description: 'Explicit opt-in for proof-gated or unstable stack routes.',
    capabilities: [],
    shape: 'Experimental routes only',
    goodFor: 'Trying unstable generators with clear expectations',
  },
]

export function devScaffoldCommand(presetId: PresetId): string {
  return `bun run dev:cli -- my-app --preset=${presetId} --yes`
}
