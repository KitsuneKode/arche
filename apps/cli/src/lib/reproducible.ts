import type { ProjectConfig } from '../types/schemas'
import {
  familySupportsMonorepoTransforms,
  familySupportsShowcase,
  familySupportsWorker,
  isRustFrameworkBackend,
} from '../types/schemas'

/** CLI command that reproduces a scaffold with the same options. */
export function buildReproducibleCommand(
  config: Pick<
    ProjectConfig,
    | 'projectName'
    | 'family'
    | 'backend'
    | 'database'
    | 'orm'
    | 'packageManager'
    | 'includeShowcase'
    | 'includeWorker'
    | 'bundles'
    | 'testing'
    | 'includeDocker'
    | 'includeCi'
    | 'deployment'
    | 'example'
  >,
): string {
  const parts = ['npx', '@kitsunekode/arche', 'create', config.projectName, config.family, '--yes']

  if (config.packageManager && config.packageManager !== 'bun') {
    parts.push(`--pm=${config.packageManager}`)
  }
  if (config.family === 'rust') {
    if (config.database && config.database !== 'postgres') {
      parts.push(`--database=${config.database}`)
    }
    if (config.example === 'none') parts.push('--example=none')
  } else if (familySupportsMonorepoTransforms(config.family)) {
    if (config.backend !== 'express-bun') parts.push(`--backend=${config.backend}`)
    if (config.database !== 'postgres') parts.push(`--database=${config.database}`)
    if (config.orm !== 'prisma') parts.push(`--orm=${config.orm}`)
  } else if (isRustFrameworkBackend(config.backend)) {
    parts.push(`--backend=${config.backend}`)
  }
  if (config.bundles?.length) {
    const extra = config.bundles.filter((b) => b !== 'product')
    if (extra.length) parts.push(`--bundle=${extra.join(',')}`)
  }
  if (config.testing === 'none') parts.push('--tests=none')
  if (!config.includeDocker) parts.push('--no-docker')
  if (!config.includeCi) parts.push('--no-ci')
  if (config.deployment === 'none') parts.push('--deployment=none')
  if (familySupportsShowcase(config.family) && config.includeShowcase) parts.push('--showcase')
  if (familySupportsWorker(config.family) && config.includeWorker) parts.push('--worker')

  return parts.join(' ')
}
