import type { PresetId } from './presets'

export interface PresetVerificationEvidence {
  structure: boolean
  bun: boolean
  pnpm: boolean
  generatedInstall: boolean
  generatedLint: boolean
  generatedTypecheck: boolean
  generatedTest: boolean
  generatedBuild: boolean
  docs: boolean
  agentContext: boolean
  cargoWorkspace: boolean
  rustQualityGates: boolean
  solanaProgram: boolean
  convexBackend: boolean
  deployment: boolean
}

const NONE: PresetVerificationEvidence = {
  structure: false,
  bun: false,
  pnpm: false,
  generatedInstall: false,
  generatedLint: false,
  generatedTypecheck: false,
  generatedTest: false,
  generatedBuild: false,
  docs: false,
  agentContext: false,
  cargoWorkspace: false,
  rustQualityGates: false,
  solanaProgram: false,
  convexBackend: false,
  deployment: false,
}

export const PRESET_VERIFICATION_MATRIX = {
  'typescript-fullstack': {
    ...NONE,
    structure: true,
    bun: true,
    pnpm: true,
    generatedInstall: true,
    generatedLint: true,
    generatedTypecheck: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
  },
  'rust-api': {
    ...NONE,
    structure: true,
    bun: true,
    docs: true,
    agentContext: true,
    cargoWorkspace: true,
    rustQualityGates: true,
  },
  'rust-fullstack': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    cargoWorkspace: true,
    rustQualityGates: true,
  },
  'convex-product': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    convexBackend: true,
  },
  'solana-program': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    solanaProgram: true,
  },
  'solana-web': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    solanaProgram: true,
  },
  'solana-mobile': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    solanaProgram: true,
  },
  'solana-product': {
    ...NONE,
    structure: true,
    bun: true,
    generatedInstall: true,
    generatedTypecheck: true,
    generatedLint: true,
    generatedBuild: true,
    docs: true,
    agentContext: true,
    solanaProgram: true,
  },
  customize: NONE,
  experiments: NONE,
} satisfies Record<PresetId, PresetVerificationEvidence>

export const VERIFICATION_MATRIX_COLUMNS = [
  { key: 'structure' as const, label: 'Structure' },
  { key: 'bun' as const, label: 'Bun' },
  { key: 'pnpm' as const, label: 'pnpm' },
  { key: 'generatedInstall' as const, label: 'Install' },
  { key: 'generatedLint' as const, label: 'Lint' },
  { key: 'generatedTypecheck' as const, label: 'Typecheck' },
  { key: 'generatedTest' as const, label: 'Test' },
  { key: 'generatedBuild' as const, label: 'Build' },
  { key: 'docs' as const, label: 'Docs' },
  { key: 'agentContext' as const, label: 'Agent context' },
  { key: 'cargoWorkspace' as const, label: 'Rust' },
  { key: 'solanaProgram' as const, label: 'Solana' },
  { key: 'convexBackend' as const, label: 'Convex' },
  { key: 'deployment' as const, label: 'Deploy' },
]

const JS_MONOREPO_STABLE_KEYS: (keyof PresetVerificationEvidence)[] = [
  'structure',
  'bun',
  'generatedInstall',
  'generatedLint',
  'generatedTypecheck',
  'generatedBuild',
  'docs',
  'agentContext',
]

function hasEvidence(
  evidence: PresetVerificationEvidence,
  keys: (keyof PresetVerificationEvidence)[],
): boolean {
  return keys.every((key) => evidence[key])
}

/** True when generated-project evidence supports labeling a preset `Stable`. */
export function presetHasStableEvidence(preset: PresetId): boolean {
  const evidence = PRESET_VERIFICATION_MATRIX[preset]

  if (preset === 'customize' || preset === 'experiments') {
    return false
  }

  if (preset === 'typescript-fullstack') {
    return hasEvidence(evidence, [...JS_MONOREPO_STABLE_KEYS, 'pnpm'])
  }

  if (preset === 'rust-api') {
    return hasEvidence(evidence, [
      'structure',
      'bun',
      'docs',
      'agentContext',
      'cargoWorkspace',
      'rustQualityGates',
    ])
  }

  if (preset === 'rust-fullstack') {
    return (
      hasEvidence(evidence, JS_MONOREPO_STABLE_KEYS) &&
      evidence.cargoWorkspace &&
      evidence.rustQualityGates
    )
  }

  if (preset === 'convex-product') {
    return hasEvidence(evidence, JS_MONOREPO_STABLE_KEYS) && evidence.convexBackend
  }

  if (preset.startsWith('solana-')) {
    return hasEvidence(evidence, JS_MONOREPO_STABLE_KEYS) && evidence.solanaProgram
  }

  return false
}
