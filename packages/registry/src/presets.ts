import type { SupportStatus } from './support-status'

export type PresetId =
  | 'typescript-fullstack'
  | 'rust-api'
  | 'rust-fullstack'
  | 'convex-product'
  | 'solana-program'
  | 'solana-web'
  | 'solana-mobile'
  | 'solana-product'
  | 'customize'
  | 'experiments'

export interface PresetDefinition {
  id: PresetId
  label: string
  status: SupportStatus
  description: string
  capabilities: string[]
}

export const PRESETS: PresetDefinition[] = [
  {
    id: 'typescript-fullstack',
    label: 'TypeScript Fullstack',
    status: 'stable',
    description:
      'Next.js plus TypeScript API, contracts, auth, database, and deployment foundations.',
    capabilities: ['web', 'api', 'database', 'auth', 'deployment'],
  },
  {
    id: 'rust-api',
    label: 'Rust API',
    status: 'stable',
    description: 'Axum API with Cargo workspace, SQLx-ready persistence, and Rust quality gates.',
    capabilities: ['api', 'database', 'deployment'],
  },
  {
    id: 'rust-fullstack',
    label: 'Rust Fullstack',
    status: 'stable',
    description:
      'Next.js frontend plus module-first Axum API (`services/api`) with SQLx migrations and shared Cargo workspace.',
    capabilities: ['web', 'api', 'database', 'deployment'],
  },
  {
    id: 'convex-product',
    label: 'Convex + Next.js',
    status: 'stable',
    description:
      'Next.js app with Convex backend, schema, sample functions, and Better Auth integration stubs.',
    capabilities: ['web', 'convex', 'auth', 'deployment'],
  },
  {
    id: 'solana-program',
    label: 'Solana Program',
    status: 'stable',
    description:
      'Anchor 0.32 Counter program, TypeScript client (`@coral-xyz/anchor`), IDL stub, and getting-started docs.',
    capabilities: ['solana-program', 'generated-client', 'anchor-tests'],
  },
  {
    id: 'solana-web',
    label: 'Solana Web dApp',
    status: 'stable',
    description: 'Next.js dApp with Anchor program and generated Solana client.',
    capabilities: ['web', 'solana-program', 'generated-client', 'web-wallet'],
  },
  {
    id: 'solana-mobile',
    label: 'Solana Mobile dApp',
    status: 'stable',
    description:
      'Expo app with Anchor program, generated client, and Mobile Wallet Adapter dependency boundary.',
    capabilities: ['mobile', 'solana-program', 'generated-client', 'mobile-wallet'],
  },
  {
    id: 'solana-product',
    label: 'Solana Product',
    status: 'stable',
    description: 'Web, mobile, program, generated client, and shared Solana configuration.',
    capabilities: [
      'web',
      'mobile',
      'solana-program',
      'generated-client',
      'web-wallet',
      'mobile-wallet',
    ],
  },
  {
    id: 'customize',
    label: 'Customize',
    status: 'requiresValidation',
    description: 'Build from supported capabilities with compatibility validation.',
    capabilities: [],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    status: 'experimental',
    description: 'Explicit opt-in for proof-gated or unstable stack routes.',
    capabilities: [],
  },
]

export const PRESET_IDS = PRESETS.map((preset) => preset.id)
