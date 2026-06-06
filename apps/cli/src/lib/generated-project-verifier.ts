import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { projectDefaultsForPreset } from '../registry/preset-config'
import type { PackageManager, Preset, ProjectConfig } from '../types/schemas'
import { createProject } from './create'

export type GeneratedProjectCommand =
  | 'install'
  | 'lint'
  | 'typecheck'
  | 'test'
  | 'build'
  | 'cargo-check'
  | 'anchor-build'

export interface GeneratedProjectCase {
  preset: Preset
  packageManager: PackageManager
}

export interface VerifyGeneratedProjectOptions extends GeneratedProjectCase {
  commands?: GeneratedProjectCommand[]
  keepOutput?: boolean
  skipMissingTools?: boolean
}

export interface GeneratedProjectCommandResult {
  command: GeneratedProjectCommand
  argv: string[]
  status: 'passed' | 'failed' | 'skipped'
  output: string
}

export interface GeneratedProjectVerificationResult {
  preset: Preset
  packageManager: PackageManager
  destinationDir: string
  missingFiles: string[]
  commands: GeneratedProjectCommandResult[]
  success: boolean
}

const DEFAULT_CASES: GeneratedProjectCase[] = [
  { preset: 'typescript-fullstack', packageManager: 'bun' },
  { preset: 'typescript-fullstack', packageManager: 'pnpm' },
  { preset: 'rust-api', packageManager: 'bun' },
  { preset: 'rust-fullstack', packageManager: 'bun' },
  { preset: 'solana-program', packageManager: 'bun' },
  { preset: 'solana-web', packageManager: 'bun' },
  { preset: 'solana-mobile', packageManager: 'bun' },
  { preset: 'solana-product', packageManager: 'bun' },
  { preset: 'convex-product', packageManager: 'bun' },
]

const EXPECTED_FILES: Record<Preset, string[]> = {
  'typescript-fullstack': [
    'package.json',
    'apps/web/package.json',
    'apps/server/package.json',
    'packages/store/package.json',
    'AGENTS.md',
    '.docs/architecture/generated-project.md',
  ],
  'rust-api': ['Cargo.toml', 'src/main.rs', 'src/modules/mod.rs', 'AGENTS.md'],
  'rust-fullstack': [
    'package.json',
    'apps/web/package.json',
    'services/api/Cargo.toml',
    'Cargo.toml',
    'AGENTS.md',
  ],
  'solana-program': [
    'package.json',
    'Anchor.toml',
    'Cargo.toml',
    'programs/core/Cargo.toml',
    'programs/core/src/lib.rs',
    'packages/solana-config/src/index.ts',
    'packages/solana-client/src/index.ts',
    'AGENTS.md',
  ],
  'solana-web': [
    'package.json',
    'Anchor.toml',
    'programs/core/src/lib.rs',
    'apps/web/app/page.tsx',
    'packages/solana-client/src/index.ts',
    'AGENTS.md',
  ],
  'solana-mobile': [
    'package.json',
    'Anchor.toml',
    'programs/core/src/lib.rs',
    'apps/mobile/App.tsx',
    'packages/solana-client/src/index.ts',
    'AGENTS.md',
  ],
  'solana-product': [
    'package.json',
    'Anchor.toml',
    'programs/core/src/lib.rs',
    'apps/web/app/page.tsx',
    'apps/mobile/App.tsx',
    'packages/solana-client/src/index.ts',
    'AGENTS.md',
  ],
  'convex-product': [
    'package.json',
    'convex.json',
    'convex/schema.ts',
    'convex/posts.ts',
    'app/page.tsx',
    'app/providers.tsx',
    'AGENTS.md',
    '.docs/architecture/generated-project.md',
  ],
  customize: [],
  experiments: [],
}

const COMMAND_TIMEOUT_MS: Record<GeneratedProjectCommand, number> = {
  install: 180_000,
  lint: 120_000,
  typecheck: 180_000,
  test: 180_000,
  build: 300_000,
  'cargo-check': 300_000,
  'anchor-build': 300_000,
}

function configForCase(destinationDir: string, testCase: GeneratedProjectCase): ProjectConfig {
  const defaults = projectDefaultsForPreset(testCase.preset)

  return {
    projectName: `arche-${testCase.preset}-${testCase.packageManager}`,
    destinationDir,
    family: 'fullstack',
    bundles: ['product'],
    packageManager: testCase.packageManager,
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    addons: [],
    example: 'none',
    testing: 'bun',
    deployment: 'vercel-railway',
    includeShowcase: false,
    includeWorker: false,
    includeDocker: true,
    includeCi: true,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
    preset: testCase.preset,
    ...defaults,
  }
}

function commandArgv(command: GeneratedProjectCommand, packageManager: PackageManager): string[] {
  switch (command) {
    case 'install':
      return packageManager === 'npm' ? ['npm', 'install'] : [packageManager, 'install']
    case 'lint':
      return packageManager === 'npm' ? ['npm', 'run', 'lint'] : [packageManager, 'run', 'lint']
    case 'typecheck':
      return packageManager === 'npm'
        ? ['npm', 'run', 'check-types']
        : [packageManager, 'run', 'check-types']
    case 'test':
      return packageManager === 'npm' ? ['npm', 'test'] : [packageManager, 'run', 'test']
    case 'build':
      return packageManager === 'npm' ? ['npm', 'run', 'build'] : [packageManager, 'run', 'build']
    case 'cargo-check':
      return ['cargo', 'check', '--workspace']
    case 'anchor-build':
      return ['anchor', 'build']
  }
}

function hasTool(binary: string): boolean {
  return spawnSync('which', [binary], { encoding: 'utf8' }).status === 0
}

function readPackageScripts(cwd: string): Record<string, string> | undefined {
  const packageJsonPath = join(cwd, 'package.json')
  if (!existsSync(packageJsonPath)) return undefined

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>
  }

  return packageJson.scripts ?? {}
}

function commandApplicability(
  cwd: string,
  command: GeneratedProjectCommand,
): { applicable: true } | { applicable: false; reason: string } {
  if (command === 'cargo-check') {
    return existsSync(join(cwd, 'Cargo.toml'))
      ? { applicable: true }
      : { applicable: false, reason: 'Skipped because Cargo.toml is not present.' }
  }

  if (command === 'anchor-build') {
    return existsSync(join(cwd, 'Anchor.toml'))
      ? { applicable: true }
      : { applicable: false, reason: 'Skipped because Anchor.toml is not present.' }
  }

  const scripts = readPackageScripts(cwd)
  if (!scripts) {
    return {
      applicable: false,
      reason: 'Skipped because package.json is not present.',
    }
  }

  if (command === 'install') return { applicable: true }

  const scriptNameByCommand: Partial<Record<GeneratedProjectCommand, string>> = {
    lint: 'lint',
    typecheck: 'check-types',
    test: 'test',
    build: 'build',
  }
  const scriptName = scriptNameByCommand[command]

  if (scriptName && !scripts[scriptName]) {
    return {
      applicable: false,
      reason: `Skipped because package.json has no "${scriptName}" script.`,
    }
  }

  return { applicable: true }
}

function runCommand(
  cwd: string,
  command: GeneratedProjectCommand,
  packageManager: PackageManager,
  skipMissingTools: boolean,
): GeneratedProjectCommandResult {
  const argv = commandArgv(command, packageManager)
  const binary = argv[0] ?? command
  const applicability = commandApplicability(cwd, command)

  if (!applicability.applicable) {
    return {
      command,
      argv,
      status: 'skipped',
      output: applicability.reason,
    }
  }

  if (skipMissingTools && !hasTool(binary)) {
    return {
      command,
      argv,
      status: 'skipped',
      output: `Skipped because ${binary} is not available on PATH.`,
    }
  }

  const result = spawnSync(binary, argv.slice(1), {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
    timeout: COMMAND_TIMEOUT_MS[command],
  })
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()

  return {
    command,
    argv,
    status: result.status === 0 && !result.error ? 'passed' : 'failed',
    output:
      result.error?.name === 'TimeoutError'
        ? `${output}\nCommand timed out after ${COMMAND_TIMEOUT_MS[command]}ms.`.trim()
        : output,
  }
}

export function buildGeneratedProjectCases(): GeneratedProjectCase[] {
  return [...DEFAULT_CASES]
}

export async function verifyGeneratedProject(
  options: VerifyGeneratedProjectOptions,
): Promise<GeneratedProjectVerificationResult> {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-generated-verify-'))
  const destinationDir = join(tmpRoot, `${options.preset}-${options.packageManager}`)
  const commands = options.commands ?? []
  const skipMissingTools = options.skipMissingTools ?? true

  try {
    const result = await createProject({
      config: configForCase(destinationDir, options),
      dryRun: false,
    })

    if (!result.success) {
      return {
        preset: options.preset,
        packageManager: options.packageManager,
        destinationDir,
        missingFiles: [`createProject failed: ${result.errors.join('; ')}`],
        commands: [],
        success: false,
      }
    }

    const missingFiles = EXPECTED_FILES[options.preset].filter(
      (file) => !existsSync(join(destinationDir, file)),
    )
    const commandResults =
      missingFiles.length > 0
        ? []
        : commands.map((command) =>
            runCommand(destinationDir, command, options.packageManager, skipMissingTools),
          )
    const commandsPassed = commandResults.every((command) => command.status !== 'failed')

    return {
      preset: options.preset,
      packageManager: options.packageManager,
      destinationDir,
      missingFiles,
      commands: commandResults,
      success: missingFiles.length === 0 && commandsPassed,
    }
  } finally {
    if (!options.keepOutput) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }
}

export function readGeneratedPackageManager(destinationDir: string): string | undefined {
  const packageJsonPath = join(destinationDir, 'package.json')
  if (!existsSync(packageJsonPath)) return undefined

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    packageManager?: string
  }
  return packageJson.packageManager
}
