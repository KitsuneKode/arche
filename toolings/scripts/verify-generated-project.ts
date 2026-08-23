#!/usr/bin/env bun
import {
  buildGeneratedComboCases,
  buildGeneratedProjectCases,
  type GeneratedProjectCommand,
  type GeneratedProjectCase,
  verifyGeneratedCombo,
  verifyGeneratedProject,
} from '@kitsunekode/arche/generated-project-verifier'
import {
  PackageManagerSchema,
  PresetSchema,
  FamilySchema,
  type Family,
  type PackageManager,
  type Preset,
} from '@kitsunekode/arche/schemas'

interface CliOptions {
  presets?: Preset[]
  packageManagers?: PackageManager[]
  commands: GeneratedProjectCommand[]
  configOverrides?: Partial<import('@kitsunekode/arche/schemas').ProjectConfig>
  keepOutput: boolean
  json: boolean
  skipMissingTools: boolean
  comboMatrix: boolean
  comboFamilies?: Family[]
  comboIds?: string[]
}

const COMMANDS = [
  'install',
  'lint',
  'typecheck',
  'test',
  'build',
  'cargo-check',
  'anchor-build',
  'smoke',
] as const satisfies readonly GeneratedProjectCommand[]

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function parsePresetList(value: string): Preset[] {
  return splitList(value).map((preset) => PresetSchema.parse(preset))
}

function parsePackageManagerList(value: string): PackageManager[] {
  return splitList(value).map((pm) => PackageManagerSchema.parse(pm))
}

function parseCommandList(value: string): GeneratedProjectCommand[] {
  return splitList(value)
    .filter((command) => command !== 'structure')
    .map((command) => {
      if (!COMMANDS.includes(command as GeneratedProjectCommand)) {
        throw new Error(`Unknown generated-project command: ${command}`)
      }
      return command as GeneratedProjectCommand
    })
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage: bun toolings/scripts/verify-generated-project.ts [options]

Generate scaffold presets into temporary directories and optionally run their
generated commands. Default mode verifies structure only.

Options:
  --preset=<ids>       Comma-separated preset ids. Defaults to the curated matrix.
  --pm=<managers>      Comma-separated package managers. Filters default cases or combines with --preset.
  --run=<commands>     Comma-separated commands: structure, ${COMMANDS.join(', ')}.
                       "structure" is always checked and does not run external commands.
  --keep               Keep temporary generated project directories.
  --json               Print JSON results.
  --no-skip-tools      Fail instead of skipping missing cargo/anchor/package-manager tools.
  --combo-matrix       Verify fullstack combo + standalone family matrix (install/typecheck/lint/build).
  --combo-family=<ids> With --combo-matrix: comma-separated families (e.g. fullstack,next).
  --combo-id=<ids>     With --combo-matrix: comma-separated combo case ids (e.g. fullstack-default).
  --config-json=<json> Partial ProjectConfig overrides (e.g. '{"includeLiveDemo":true}').
  -h, --help           Show this message.

Examples:
  bun run verify:generated
  bun run verify:generated -- --preset=typescript-fullstack --pm=bun,pnpm
  bun run verify:generated -- --preset=solana-product --run=cargo-check,anchor-build
  bun run verify:generated:combo-fullstack
  bun run verify:generated -- --preset=typescript-fullstack --pm=bun --config-json='{"includeLiveDemo":true,"includeWorker":true}' --run=install,typecheck
`)
    process.exit(0)
  }

  const options: CliOptions = {
    commands: [],
    keepOutput: argv.includes('--keep'),
    json: argv.includes('--json'),
    skipMissingTools: !argv.includes('--no-skip-tools'),
    comboMatrix: argv.includes('--combo-matrix'),
  }

  for (const arg of argv) {
    if (arg.startsWith('--preset=')) {
      options.presets = parsePresetList(arg.slice('--preset='.length))
    }
    if (arg.startsWith('--pm=')) {
      options.packageManagers = parsePackageManagerList(arg.slice('--pm='.length))
    }
    if (arg.startsWith('--run=')) {
      options.commands = parseCommandList(arg.slice('--run='.length))
    }
    if (arg.startsWith('--combo-family=')) {
      options.comboFamilies = splitList(arg.slice('--combo-family='.length)).map((family) =>
        FamilySchema.parse(family),
      )
    }
    if (arg.startsWith('--combo-id=')) {
      options.comboIds = splitList(arg.slice('--combo-id='.length))
    }
    if (arg.startsWith('--config-json=')) {
      options.configOverrides = JSON.parse(
        arg.slice('--config-json='.length),
      ) as CliOptions['configOverrides']
    }
  }

  return options
}

function selectCases(options: CliOptions): GeneratedProjectCase[] {
  if (options.presets) {
    const packageManagers = options.packageManagers ?? ['bun']
    return options.presets.flatMap((preset) =>
      packageManagers.map((packageManager) => ({ preset, packageManager })),
    )
  }

  const cases = buildGeneratedProjectCases()
  if (!options.packageManagers) return cases

  return cases.filter((testCase) => options.packageManagers?.includes(testCase.packageManager))
}

function printTextResult(
  result: Awaited<ReturnType<typeof verifyGeneratedProject>>,
  keepOutput: boolean,
): void {
  const status = result.success ? 'PASS' : 'FAIL'
  console.log(`${status} ${result.preset} (${result.packageManager})`)

  if (result.missingFiles.length > 0) {
    console.log(`  missing: ${result.missingFiles.join(', ')}`)
  }

  for (const command of result.commands) {
    console.log(`  ${command.status}: ${command.argv.join(' ')}`)
    if (command.status === 'failed' && command.output) {
      console.log(command.output)
    }
  }

  console.log(`  output: ${keepOutput ? result.destinationDir : 'removed (use --keep to inspect)'}`)
}

function comboCommands(
  family: string,
  override: GeneratedProjectCommand[],
): GeneratedProjectCommand[] {
  if (override.length > 0) return override
  if (family === 'rust') return ['cargo-check']
  if (family === 'tui') return ['install', 'typecheck', 'build']
  if (family === 'tanstack') return ['install', 'typecheck', 'lint', 'build', 'smoke']
  if (family === 'lib' || family === 'cli' || family === 'worker' || family === 'mobile') {
    return ['install', 'typecheck', 'lint']
  }
  if (family === 'next' || family === 'backend') {
    return ['install', 'typecheck', 'lint', 'build', 'smoke']
  }
  return ['install', 'typecheck', 'lint', 'build']
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  if (options.comboMatrix) {
    let comboCases = buildGeneratedComboCases()
    if (options.comboFamilies?.length) {
      comboCases = comboCases.filter((testCase) => options.comboFamilies!.includes(testCase.family))
    }
    if (options.comboIds?.length) {
      comboCases = comboCases.filter((testCase) => options.comboIds!.includes(testCase.id))
    }
    if (comboCases.length === 0) {
      throw new Error('No combo cases matched --combo-family / --combo-id filters')
    }
    const comboResults = []

    for (const testCase of comboCases) {
      const result = await verifyGeneratedCombo({
        ...testCase,
        commands: comboCommands(testCase.family, options.commands),
        keepOutput: options.keepOutput,
        skipMissingTools: options.skipMissingTools,
      })
      comboResults.push(result)
      if (!options.json) {
        const status = result.success ? 'PASS' : 'FAIL'
        console.log(`${status} ${result.id} (${result.family})`)
        if (result.missingFiles.length > 0) {
          console.log(`  missing: ${result.missingFiles.join(', ')}`)
        }
        for (const command of result.commands) {
          console.log(`  ${command.status}: ${command.argv.join(' ')}`)
          if (command.status === 'failed' && command.output) {
            console.log(command.output.slice(0, 2000))
          }
        }
      }
    }

    if (options.json) {
      console.log(JSON.stringify(comboResults, null, 2))
    }

    if (comboResults.some((result) => !result.success)) {
      process.exit(1)
    }
    return
  }

  const cases = selectCases(options)
  const results = []

  for (const testCase of cases) {
    const result = await verifyGeneratedProject({
      ...testCase,
      commands: options.commands,
      configOverrides: options.configOverrides,
      keepOutput: options.keepOutput,
      skipMissingTools: options.skipMissingTools,
    })
    results.push(result)
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    for (const result of results) {
      printTextResult(result, options.keepOutput)
    }
  }

  if (results.some((result) => !result.success)) {
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
