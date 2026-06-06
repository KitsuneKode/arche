import { spawnSync, type SpawnSyncReturns } from 'node:child_process'

export interface RunCommandOptions {
  cwd: string
  silent?: boolean
}

/**
 * Execute a command synchronously with cross-platform compatibility.
 * Uses shell on Windows for proper command resolution.
 *
 * @throws Error if the command fails (non-zero exit code)
 */
export function runCommand(command: string[], options: RunCommandOptions): void {
  const [cmd, ...args] = command
  if (!cmd) {
    throw new Error('Command cannot be empty')
  }
  const result: SpawnSyncReturns<Buffer> = spawnSync(cmd, args, {
    cwd: options.cwd,
    stdio: options.silent ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    throw new Error(`Failed to execute command: ${result.error.message}`)
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim()
    const errorMessage = stderr || `Command exited with code ${result.status}`
    throw new Error(`Command failed: ${command.join(' ')}\n${errorMessage}`)
  }
}

/**
 * Execute a command and return the output.
 * Always runs silently (captures output instead of inheriting).
 */
export function runCommandWithOutput(
  command: string[],
  options: Omit<RunCommandOptions, 'silent'>,
): string {
  const [cmd, ...args] = command
  if (!cmd) {
    throw new Error('Command cannot be empty')
  }
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    throw new Error(`Failed to execute command: ${result.error.message}`)
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim()
    const errorMessage = stderr || `Command exited with code ${result.status}`
    throw new Error(`Command failed: ${command.join(' ')}\n${errorMessage}`)
  }

  return result.stdout?.toString().trim() ?? ''
}

/**
 * Try to run a command, returning success status without throwing.
 * Useful for optional commands like git initialization.
 */
export function tryCommand(command: string[], options: RunCommandOptions): boolean {
  try {
    runCommand(command, { ...options, silent: true })
    return true
  } catch {
    return false
  }
}
