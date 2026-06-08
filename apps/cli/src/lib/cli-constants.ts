import {
  BackendSchema,
  DatabaseSchema,
  DeploymentSchema,
  FamilySchema,
  ORMSchema,
  PackageManagerSchema,
  PresetSchema,
  TestingSchema,
} from '../types/schemas'

export const CLI_COMMANDS = [
  'create',
  'create-json',
  'validate',
  'add',
  'history',
  'mcp',
  'completion',
] as const

/** Package managers offered in shell completion (npm rejected at validate time). */
export const CLI_COMPLETION_PACKAGE_MANAGERS = PackageManagerSchema.options.filter(
  (pm) => pm !== 'npm',
)

export const CLI_FAMILIES = [...FamilySchema.options] as const
export const CLI_PRESETS = [...PresetSchema.options] as const
export const CLI_BACKENDS = [...BackendSchema.options] as const
export const CLI_DATABASES = [...DatabaseSchema.options] as const
export const CLI_ORMS = [...ORMSchema.options] as const
export const CLI_DEPLOYMENTS = [...DeploymentSchema.options] as const
export const CLI_TESTING_MODES = [...TestingSchema.options] as const

export const CLI_OPTIONS = [
  '--yes',
  '--dir=',
  '--output=',
  '--family=',
  '--preset=',
  '--pm=',
  '--package-manager=',
  '--bundle=',
  '--git',
  '--no-git',
  '--install',
  '--no-install',
  '--showcase',
  '--no-showcase',
  '--worker',
  '--no-worker',
  '--docker',
  '--no-docker',
  '--ci',
  '--no-ci',
  '--tests=',
  '--deployment=',
  '--dry-run',
  '--backend=',
  '--database=',
  '--orm=',
  '--version',
  '--help',
] as const
