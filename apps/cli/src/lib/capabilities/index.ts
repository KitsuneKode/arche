export type { CapabilityId, CapabilityManifest } from './types'
export {
  CAPABILITY_MANIFESTS,
  LIVE_DEMO_MANIFEST,
  LIVE_DEMO_REMOVE_PATHS,
  getManifest,
} from './manifests'
export {
  applyCapabilityRemoval,
  applyLiveDemoContentPatches,
  applyLiveDemoRemoval,
  removeLiveDemoPathsOnly,
} from './apply-capabilities'
export { applyLiveDemoAddon, resolveLiveDemoAddonSource } from './live-demo-addon'
