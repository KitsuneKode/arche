import type { CleanupTarget, Family, ProjectConfig } from '../types/schemas'

function shouldDefaultStripWorker(family: Family): boolean {
  return family !== 'fullstack'
}

export function buildCleanupTargets(
  options: Pick<
    ProjectConfig,
    'includeShowcase' | 'includeWorker' | 'includeLiveDemo' | 'testing' | 'family'
  >,
): CleanupTarget[] {
  const targets = new Set<CleanupTarget>(['readme'])

  if (!options.includeShowcase || options.family !== 'fullstack') {
    targets.add('showcase')
    targets.add('seed')
  }

  if (options.family === 'fullstack' && !options.includeLiveDemo) {
    targets.add('live')
  }

  if (!options.includeWorker) {
    targets.add('worker')
  }

  if (shouldDefaultStripWorker(options.family)) {
    targets.add('worker')
  }

  if (options.testing === 'none') {
    targets.add('tests')
  }

  return [...targets]
}
