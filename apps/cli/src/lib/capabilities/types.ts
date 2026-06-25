export type CapabilityId = 'core' | 'worker' | 'showcase' | 'seed' | 'live-demo'

export type CapabilityManifest = {
  id: CapabilityId
  /** When true, scaffold keeps these paths unless explicitly stripped. */
  includedByDefault: boolean
  /** Paths relative to project root to remove when capability is not selected. */
  removePaths: string[]
  removePackageScripts?: string[]
  removeEnvKeys?: string[]
}
