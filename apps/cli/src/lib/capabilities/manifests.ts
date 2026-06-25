import type { CapabilityId, CapabilityManifest } from './types'

/** Paths removed when live-demo is not selected (relative to project root). */
export const LIVE_DEMO_REMOVE_PATHS = [
  'apps/web/app/live',
  'apps/web/app/(sandbox)',
  'apps/web/app/(auth)',
  'apps/web/components/live',
  'apps/web/components/play',
  'apps/web/components/sandbox',
  'apps/web/lib/live-feed',
  'apps/web/lib/live-chat-sync.ts',
  'apps/web/lib/live-chat-sync-policy.ts',
  'apps/web/lib/proof-run',
  'apps/web/lib/proof-run-storage.ts',
  'apps/web/lib/client-mounted.ts',
  'apps/web/lib/api-health.ts',
  'apps/web/lib/use-api-reachable.ts',
  'apps/web/lib/use-online-status.ts',
  'apps/web/lib/ensure-guest-session.ts',
  'apps/web/lib/guest-session.ts',
  'apps/web/lib/relay-run',
  'apps/web/lib/og/routes/live-opengraph.meta.ts',
  'apps/web/lib/og/routes/live-opengraph.image.tsx',
  'apps/web/content/docs/guides/live-demo.mdx',
  'apps/server/src/modules/live',
  'apps/server/src/modules/lattice',
  'apps/server/src/modules/chat',
  'apps/server/src/modules/game',
  'apps/server/src/modules/demo',
  'packages/backend-common/src/demo-policy.ts',
  'packages/backend-common/src/live',
  'packages/auth/src/guest-display-name.ts',
  'packages/auth/src/guest-display-name.test.ts',
  'packages/auth/src/migrate-guest-data.ts',
  'packages/auth/src/migrate-guest-data.test.ts',
  'packages/store/prisma/migrations/20260625140000_relay_run_score',
  'packages/store/prisma/migrations/20260625150000_user_is_anonymous',
  'packages/store/prisma/migrations/20260625050000_relay_lattice',
  'packages/store/prisma/migrations/20260625120000_lattice_single_open_round',
] as const

export const LIVE_DEMO_MANIFEST: CapabilityManifest = {
  id: 'live-demo',
  includedByDefault: false,
  removePaths: [...LIVE_DEMO_REMOVE_PATHS],
  removeEnvKeys: ['DEMO_AUTO_SIGN_IN', 'NEXT_PUBLIC_ENABLE_CHAT_SSE', 'LATTICE_ROUND_ENGINE'],
}

export const SHOWCASE_MANIFEST: CapabilityManifest = {
  id: 'showcase',
  includedByDefault: false,
  removePaths: ['SHOWCASE.mdx'],
  removePackageScripts: ['db:seed'],
}

export const WORKER_MANIFEST: CapabilityManifest = {
  id: 'worker',
  includedByDefault: false,
  removePaths: ['apps/worker'],
  removePackageScripts: ['dev:worker'],
}

export const CAPABILITY_MANIFESTS: Record<CapabilityId, CapabilityManifest> = {
  core: {
    id: 'core',
    includedByDefault: true,
    removePaths: [],
  },
  showcase: SHOWCASE_MANIFEST,
  seed: {
    id: 'seed',
    includedByDefault: false,
    removePaths: [],
    removePackageScripts: ['db:seed'],
  },
  worker: WORKER_MANIFEST,
  'live-demo': LIVE_DEMO_MANIFEST,
}

export function getManifest(id: CapabilityId): CapabilityManifest {
  return CAPABILITY_MANIFESTS[id]
}
