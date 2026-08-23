#!/usr/bin/env bun
import { access } from 'fs/promises'
import { basename, dirname, relative, resolve } from 'path'
import { syncTemplateAgents } from './sync-template-agents'
import { syncWebCore } from './sync-web-core'

type Severity = 'error' | 'warn' | 'info'

interface Finding {
  severity: Severity
  code: string
  path: string
  message: string
  suggestion?: string
}

interface CliOptions {
  json: boolean
  quiet: boolean
  strict: boolean
}

const ROOT = process.cwd()
const IGNORE_SEGMENTS = ['node_modules', '.git', '.turbo', '.next', 'dist', 'build', 'out']
const DOC_GLOBS = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/*.md',
  'apps/*/README.md',
  'apps/*/AGENTS.md',
  'packages/*/README.md',
  'packages/*/AGENTS.md',
  'toolings/*/README.md',
  'toolings/*/AGENTS.md',
  'tests/README.md',
  'tests/AGENTS.md',
] as const
const KNOWN_DOC_PATH_PREFIXES = [
  'apps/',
  'packages/',
  'toolings/',
  'tests/',
  'docs/',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'package.json',
  'turbo.json',
  '.husky/',
] as const

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage: bun toolings/scripts/repo-doctor.ts [options]

Audit the repo for stale scaffolding, broken package exports, and doc drift.

Options:
  --json      Print findings as JSON
  --quiet     Print only the summary
  --strict    Exit with code 1 when warnings or errors are found
  -h, --help  Show this message
`)
    process.exit(0)
  }

  return {
    json: argv.includes('--json'),
    quiet: argv.includes('--quiet'),
    strict: argv.includes('--strict'),
  }
}

function isIgnored(path: string): boolean {
  return IGNORE_SEGMENTS.some((segment) => path.split('/').includes(segment))
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function collectFiles(globPattern: string): Promise<string[]> {
  const matches: string[] = []
  for await (const match of new Bun.Glob(globPattern).scan('.')) {
    if (!isIgnored(match)) {
      matches.push(match)
    }
  }
  return matches.sort()
}

function severityRank(severity: Severity): number {
  return severity === 'error' ? 0 : severity === 'warn' ? 1 : 2
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>()
  return findings.filter((finding) => {
    const key = `${finding.severity}:${finding.code}:${finding.path}:${finding.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function checkBoilerplateDocs(): Promise<Finding[]> {
  const findings: Finding[] = []
  const patterns = [
    {
      code: 'boilerplate-next-readme',
      pattern: 'create-next-app',
      message: 'Contains stock Next.js scaffold text that does not describe this repo.',
    },
    {
      code: 'boilerplate-bun-readme',
      pattern: 'This project was created using `bun init`',
      message: 'Contains stock Bun scaffold text that does not describe this workspace.',
    },
  ] as const

  for (const globPattern of DOC_GLOBS) {
    const files = await collectFiles(globPattern)
    for (const path of files) {
      const text = await Bun.file(path).text()
      for (const entry of patterns) {
        if (text.includes(entry.pattern)) {
          findings.push({
            severity: 'warn',
            code: entry.code,
            path,
            message: entry.message,
            suggestion:
              'Replace the file with a short workspace-specific redirect or real instructions.',
          })
        }
      }
    }
  }

  return findings
}

async function checkPlaceholderFiles(): Promise<Finding[]> {
  const candidates: Array<{
    path: string
    pattern: string
    code: string
    message: string
    suggestion: string
    severity?: Severity
  }> = [
    {
      path: 'tests/src/index.ts',
      pattern: "console.log('Hello via Bun!')",
      code: 'placeholder-test-entry',
      message: 'Still contains the Bun scaffold placeholder instead of real tests.',
      suggestion: 'Replace it with real Bun tests or remove the workspace.',
    },
    {
      path: 'apps/worker/src/index.ts',
      pattern: 'worker started',
      code: 'placeholder-worker',
      message: 'Worker entrypoint still looks like placeholder logic.',
      suggestion: 'Implement a real worker loop or remove the workspace.',
      severity: 'info',
    },
  ] as const

  const findings: Finding[] = []
  for (const candidate of candidates) {
    if (!(await fileExists(candidate.path))) continue
    const text = await Bun.file(candidate.path).text()
    if (text.includes(candidate.pattern)) {
      findings.push({
        severity: candidate.severity ?? 'warn',
        code: candidate.code,
        path: candidate.path,
        message: candidate.message,
        suggestion: candidate.suggestion,
      })
    }
  }
  return findings
}

async function checkTrackedGitkeepFiles(): Promise<Finding[]> {
  const files = await collectFiles('**/.gitkeep')
  return files.map((path) => ({
    severity: 'info' as const,
    code: 'placeholder-gitkeep',
    path,
    message: 'Tracked placeholder directory marker.',
    suggestion: 'Remove it if the folder is no longer intentionally scaffolded.',
  }))
}

async function checkSuspiciousPaths(): Promise<Finding[]> {
  const directories = await collectFiles('tests/src/**')
  const findings: Finding[] = []
  for (const path of directories) {
    if (basename(path) === 'webocket') {
      findings.push({
        severity: 'warn',
        code: 'suspicious-path-name',
        path,
        message: 'Directory name looks like a typo of "websocket".',
        suggestion:
          'Rename or remove the directory before real tests accumulate under the wrong path.',
      })
    }
  }
  return findings
}

function readExportTargets(currentPath: string, value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') {
    found.push(value)
    return found
  }

  if (!value || typeof value !== 'object') {
    return found
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    readExportTargets(currentPath, nested, found)
  }

  return found
}

async function checkPackageExports(): Promise<Finding[]> {
  const findings: Finding[] = []
  const packageJsonFiles = await collectFiles('**/package.json')

  for (const path of packageJsonFiles) {
    const data = (await Bun.file(path).json()) as Record<string, unknown>
    if (!data.exports || typeof data.exports !== 'object') continue

    const packageDir = dirname(path)
    for (const target of readExportTargets(path, data.exports)) {
      if (!target.startsWith('./')) continue
      const resolvedPath = resolve(packageDir, target)
      const targetExists = target.includes('*')
        ? (await collectFiles(relative(ROOT, resolvedPath))).length > 0
        : await fileExists(resolvedPath)

      if (!targetExists) {
        findings.push({
          severity: 'error',
          code: 'broken-package-export',
          path,
          message: `Export target "${target}" does not exist.`,
          suggestion: 'Fix or remove the export before publishing or importing the package.',
        })
      }
    }
  }

  return findings
}

function extractCandidateDocPaths(text: string): string[] {
  const matches = text.match(/`([^`]+)`/g) ?? []
  return matches
    .map((entry) => entry.slice(1, -1).trim())
    .filter((entry) => {
      if (!entry) return false
      if (entry.startsWith('http://') || entry.startsWith('https://')) return false
      if (entry.includes('*') || entry.includes('{') || entry.includes('}')) return false
      if (entry.startsWith('@')) return false
      if (entry.includes(' ')) return false
      return KNOWN_DOC_PATH_PREFIXES.some((prefix) => entry.startsWith(prefix))
    })
}

async function resolveDocPath(docPath: string, sourceFile: string): Promise<boolean> {
  const rootRelative = resolve(ROOT, docPath)
  if (await fileExists(rootRelative)) return true

  const sourceRelative = resolve(dirname(resolve(ROOT, sourceFile)), docPath)
  if (await fileExists(sourceRelative)) return true

  return false
}

const ARCHIVED_DEPLOY_DOC = 'docs/deployment-platforms.md'

async function checkActiveDeployDocLinks(): Promise<Finding[]> {
  const findings: Finding[] = []
  const activeDocs = await collectFiles('docs/*.md')
  for (const path of activeDocs) {
    if (path.startsWith('docs/archive/')) continue
    const text = await Bun.file(path).text()
    if (text.includes(ARCHIVED_DEPLOY_DOC) && !text.includes('archive/deployment-platforms')) {
      findings.push({
        severity: 'warn',
        code: 'archived-deploy-doc-link',
        path,
        message: `Links to moved file "${ARCHIVED_DEPLOY_DOC}".`,
        suggestion: 'Use docs/deployment.md or docs/archive/deployment-platforms.md.',
      })
    }
  }
  return findings
}

async function checkDocPathDrift(): Promise<Finding[]> {
  const findings: Finding[] = []
  const docFiles = await Promise.all(DOC_GLOBS.map((globPattern) => collectFiles(globPattern)))
  const uniqueFiles = [...new Set(docFiles.flat())]

  for (const path of uniqueFiles) {
    const text = await Bun.file(path).text()
    const candidates = [...new Set(extractCandidateDocPaths(text))]
    for (const candidate of candidates) {
      if (!(await resolveDocPath(candidate, path))) {
        findings.push({
          severity: 'warn',
          code: 'stale-doc-path',
          path,
          message: `References "${candidate}" but that path does not exist.`,
          suggestion: 'Update or remove the stale path reference.',
        })
      }
    }
  }

  return findings
}

function countNonEmptyLines(text: string): number {
  return text.split('\n').filter((line) => line.trim().length > 0).length
}

function duplicatesCiLadder(text: string): boolean {
  return text.includes('### Minimum ladder') || text.includes('bun run ci:min:affected')
}

export async function checkAgentsDocBudget(): Promise<Finding[]> {
  const findings: Finding[] = []
  const globs = [
    'AGENTS.md',
    'apps/*/AGENTS.md',
    'packages/*/AGENTS.md',
    'toolings/*/AGENTS.md',
    'tests/AGENTS.md',
  ] as const

  for (const globPattern of globs) {
    const files = await collectFiles(globPattern)
    for (const path of files) {
      const text = await Bun.file(path).text()
      const lineCount = countNonEmptyLines(text)
      const isRoot = path === 'AGENTS.md'
      const lineLimit = isRoot ? 45 : 40

      if (lineCount > lineLimit) {
        findings.push({
          severity: 'warn',
          code: 'agents-md-too-long',
          path,
          message: `AGENTS.md has ${lineCount} non-empty lines (budget: ${lineLimit}).`,
          suggestion:
            'Trim to navigation + invariants; link to docs/ instead of restating shared content.',
        })
      }

      if (duplicatesCiLadder(text)) {
        findings.push({
          severity: 'warn',
          code: 'agents-md-duplicates-ci-ladder',
          path,
          message: 'Restates the CI ladder instead of linking docs/ci.md.',
          suggestion: 'Replace the ladder block with a one-line pointer to docs/ci.md.',
        })
      }
    }
  }

  return findings
}

export async function checkWebCoreSync(): Promise<Finding[]> {
  const drifted = await syncWebCore({ check: true })
  return drifted.map((path) => ({
    severity: 'warn' as const,
    code: 'web-core-drift',
    path,
    message: 'Web template file differs from canonical _web-core source.',
    suggestion: 'Edit apps/cli/src/templates/_web-core/, then run `bun run web-core:sync`.',
  }))
}

export async function checkTemplateAgentsSync(): Promise<Finding[]> {
  const drifted = await syncTemplateAgents({ check: true })
  return drifted.map((path) => ({
    severity: 'warn' as const,
    code: 'template-agents-drift',
    path,
    message: 'Template AGENTS.md differs from the live workspace file.',
    suggestion: 'Edit the live AGENTS.md, then run `bun run agents:sync`.',
  }))
}

async function checkDependencyCatalog(): Promise<Finding[]> {
  const proc = Bun.spawnSync({
    cmd: ['bun', 'toolings/scripts/audit-dependencies.ts'],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (proc.exitCode === 0) return []

  const output = `${proc.stdout.toString()}\n${proc.stderr.toString()}`.trim()
  return [
    {
      severity: 'error',
      code: 'catalog-drift',
      path: 'toolings/catalog/workspace-catalog.json',
      message: 'Workspace dependency versions drift from the Bun catalog.',
      suggestion: `Run \`bun run catalog:apply\` and commit. Details:\n${output}`,
    },
  ]
}

async function checkUnusedDependencies(): Promise<Finding[]> {
  const proc = Bun.spawnSync({
    cmd: ['bun', 'toolings/scripts/audit-unused-dependencies.ts'],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (proc.exitCode === 0) return []

  const output = `${proc.stdout.toString()}\n${proc.stderr.toString()}`.trim()
  return [
    {
      severity: 'warn',
      code: 'unused-dependencies',
      path: 'package.json',
      message: 'Some workspace dependencies may be unused.',
      suggestion: `Run \`bun run deps:unused\` and remove or justify entries. Details:\n${output}`,
    },
  ]
}

async function checkTemplateDependencyPins(): Promise<Finding[]> {
  const proc = Bun.spawnSync({
    cmd: ['bun', 'toolings/scripts/audit-template-deps.ts'],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (proc.exitCode === 0) return []

  const output = `${proc.stdout.toString()}\n${proc.stderr.toString()}`.trim()
  return [
    {
      severity: 'warn',
      code: 'template-deps-drift',
      path: 'apps/cli/src/templates/fullstack',
      message: 'Fullstack template dependency pins drift from workspace catalog.',
      suggestion: `Align template package.json files with toolings/catalog/workspace-catalog.json. Details:\n${output}`,
    },
  ]
}

async function checkTemplateScaffoldOwnership(): Promise<Finding[]> {
  const proc = Bun.spawnSync({
    cmd: ['bun', 'toolings/scripts/sync-fullstack-template.ts', '--check'],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (proc.exitCode === 0) return []

  const output = `${proc.stdout.toString()}\n${proc.stderr.toString()}`.trim()
  return [
    {
      severity: 'error',
      code: 'template-scaffold-drift',
      path: 'apps/cli/src/templates/fullstack',
      message: 'Fullstack template or live-demo addon failed minimal ownership checks.',
      suggestion: `Run \`bun run template:extract\` then \`bun run template:sync:check\`. Details:\n${output}`,
    },
  ]
}

async function checkCrossWorkspaceRelativeImports(): Promise<Finding[]> {
  const findings: Finding[] = []
  const scopes = ['tests/src/**/*.{ts,tsx}', 'toolings/scripts/**/*.{ts,tsx}'] as const
  const pattern = /from\s+['"](?:\.\.\/)+apps\//

  for (const globPattern of scopes) {
    for await (const path of new Bun.Glob(globPattern).scan('.')) {
      if (isIgnored(path)) continue
      const text = await Bun.file(path).text()
      if (pattern.test(text)) {
        findings.push({
          severity: 'error',
          code: 'cross-workspace-relative-import',
          path,
          message: 'Relative import reaches into apps/ across workspace boundaries.',
          suggestion:
            'Import via a workspace package export (e.g. @kitsunekode/arche/*) or move shared code into packages/.',
        })
      }
    }
  }
  return findings
}

export async function collectRepoDoctorFindings(): Promise<Finding[]> {
  return dedupeFindings(
    [
      ...(await checkBoilerplateDocs()),
      ...(await checkPlaceholderFiles()),
      ...(await checkTrackedGitkeepFiles()),
      ...(await checkSuspiciousPaths()),
      ...(await checkPackageExports()),
      ...(await checkDocPathDrift()),
      ...(await checkActiveDeployDocLinks()),
      ...(await checkAgentsDocBudget()),
      ...(await checkTemplateAgentsSync()),
      ...(await checkWebCoreSync()),
      ...(await checkDependencyCatalog()),
      ...(await checkUnusedDependencies()),
      ...(await checkTemplateDependencyPins()),
      ...(await checkTemplateScaffoldOwnership()),
      ...(await checkCrossWorkspaceRelativeImports()),
    ].sort((a, b) => {
      const severityDiff = severityRank(a.severity) - severityRank(b.severity)
      if (severityDiff !== 0) return severityDiff
      return a.path.localeCompare(b.path)
    }),
  )
}

function printFindings(findings: Finding[], options: CliOptions): void {
  if (options.json) {
    console.log(JSON.stringify(findings, null, 2))
    return
  }

  const counts = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1
      return acc
    },
    { error: 0, warn: 0, info: 0 },
  )

  console.log('Repo Doctor')
  console.log(`Errors: ${counts.error}  Warnings: ${counts.warn}  Info: ${counts.info}`)

  if (options.quiet || findings.length === 0) {
    return
  }

  for (const finding of findings) {
    console.log('')
    console.log(`[${finding.severity.toUpperCase()}] ${finding.code}`)
    console.log(`Path: ${finding.path}`)
    console.log(finding.message)
    if (finding.suggestion) {
      console.log(`Suggestion: ${finding.suggestion}`)
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const findings = await collectRepoDoctorFindings()
  printFindings(findings, options)

  const hasBlockingFinding = findings.some((finding) =>
    options.strict ? finding.severity !== 'info' : finding.severity === 'error',
  )

  process.exit(hasBlockingFinding ? 1 : 0)
}

if (import.meta.main) {
  await main()
}
