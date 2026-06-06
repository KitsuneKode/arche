import type { ProjectConfig } from '../types/schemas'
import {
  familySupportsBundles,
  familySupportsShowcase,
  familySupportsTemplateCleanup,
} from '../types/schemas'
import { buildCleanupTargets } from './cleanup-targets'
import type { ScaffoldResult } from './scaffold'
import { sanitizeProjectName } from './slug'

/** Planned output files for dry-run (no filesystem writes). */
export function planScaffold(options: ProjectConfig): ScaffoldResult {
  const family = options.family
  const monorepo = family === 'fullstack' || family === 'polyglot'
  const fullstack = family === 'fullstack'
  const generatedFiles: string[] = [
    'arche.json',
    'README.md',
    'AGENTS.md',
    'CLAUDE.md',
    '.docs/README.md',
    '.docs/architecture/generated-project.md',
    '.plans/README.md',
  ]

  if (fullstack) {
    generatedFiles.push(
      'apps/server/.env.example',
      'apps/server/.env',
      'apps/web/.env.example',
      'apps/web/.env',
    )
    if (options.packageManager === 'pnpm') {
      generatedFiles.push('pnpm-workspace.yaml')
    }
  }

  if (options.includeDocker) {
    generatedFiles.push('docker-compose.yml')
    if (monorepo) {
      generatedFiles.push('docker-compose.prod.yml', 'nginx/nginx.conf')
    }
  }

  if (options.includeCi) {
    generatedFiles.push('.github/workflows/ci.yml')
  }

  if (familySupportsShowcase(family) && options.includeShowcase) {
    generatedFiles.push('SHOWCASE.mdx')
  }

  if (options.deployment !== 'none') {
    generatedFiles.push('docs/deployment.md')
  }

  if (familySupportsBundles(family)) {
    for (const bundle of options.bundles) {
      if (bundle === 'realtime') {
        generatedFiles.push(
          'apps/server/src/ws/handler.ts',
          'packages/trpc/src/routers/realtime.ts',
        )
      }
      if (bundle === 'growth') {
        generatedFiles.push('packages/analytics/package.json', 'packages/analytics/src/index.ts')
      }
      if (bundle === 'infra') {
        generatedFiles.push('packages/monitoring/package.json', 'packages/monitoring/src/index.ts')
      }
      if (bundle === 'ai') {
        generatedFiles.push('packages/ai/package.json', 'packages/ai/src/index.ts')
      }
      if (bundle === 'product') {
        generatedFiles.push('docs/getting-started.md', '.arche/product-bundle')
      }
    }
  }

  generatedFiles.push('.opencode/skills.json')

  return {
    destinationDir: options.destinationDir,
    packageName: sanitizeProjectName(options.projectName),
    cleanupTargets: familySupportsTemplateCleanup(family) ? buildCleanupTargets(options) : [],
    generatedFiles,
    installResult: 'skipped',
  }
}
