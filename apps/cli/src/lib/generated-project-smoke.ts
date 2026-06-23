import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import type { GeneratedProjectCommandResult } from './generated-project-verifier'

const SMOKE_TIMEOUT_MS = 120_000

/** Ask the OS for an available TCP port (small TOCTOU window, good enough for smoke). */
function findFreePort(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        const { port } = address
        server.close(() => resolve(String(port)))
      } else {
        server.close(() => reject(new Error('Could not determine a free port')))
      }
    })
  })
}

async function waitForResponse(
  url: string,
  acceptStatuses: number[],
  timeoutMs = 30_000,
): Promise<Response> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (acceptStatuses.includes(response.status)) return response
    } catch {
      // server still booting
    }
    await sleep(500)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function probeHttp(
  label: string,
  startArgv: string[],
  cwd: string,
  healthUrl: string,
  env: Record<string, string> = {},
  acceptStatuses = [200],
): Promise<GeneratedProjectCommandResult> {
  const argv = ['smoke', ...startArgv]
  // detached: own process group so we can SIGTERM the whole tree (bun -> next/node)
  const proc: ChildProcess = spawn(startArgv[0]!, startArgv.slice(1), {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  // Accumulate output via listeners so we never block awaiting stream end on failure.
  let stdout = ''
  let stderr = ''
  proc.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8')
  })
  proc.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8')
  })
  let exitInfo = ''
  proc.on('exit', (code, signal) => {
    if (code !== null && code !== 0) exitInfo = `process exited early with code ${code}`
    else if (signal && signal !== 'SIGTERM') exitInfo = `process exited early via ${signal}`
  })

  try {
    const response = await waitForResponse(healthUrl, acceptStatuses, SMOKE_TIMEOUT_MS)
    return {
      command: 'smoke',
      argv,
      status: 'passed',
      output: `${label}: ${healthUrl} -> ${response.status}`,
    }
  } catch (error) {
    return {
      command: 'smoke',
      argv,
      status: 'failed',
      output: [error instanceof Error ? error.message : String(error), exitInfo, stdout, stderr]
        .filter(Boolean)
        .join('\n'),
    }
  } finally {
    killTree(proc)
  }
}

function killTree(proc: ChildProcess): void {
  if (proc.pid === undefined || proc.killed) return
  try {
    // Negative pid targets the whole process group (detached leader).
    process.kill(-proc.pid, 'SIGTERM')
  } catch {
    try {
      proc.kill('SIGTERM')
    } catch {
      // already gone
    }
  }
}

export function smokeApplicability(
  cwd: string,
):
  | { applicable: true; kind: 'next' | 'backend' | 'fullstack-server' | 'tanstack' }
  | { applicable: false; reason: string } {
  if (existsSync(join(cwd, 'app/api/health/route.ts'))) {
    return { applicable: true, kind: 'next' }
  }
  if (existsSync(join(cwd, 'src/routes/api/health.ts'))) {
    return { applicable: true, kind: 'tanstack' }
  }
  if (
    existsSync(join(cwd, 'src/server.ts')) &&
    existsSync(join(cwd, 'src/modules/health/health.routes.ts'))
  ) {
    return { applicable: true, kind: 'backend' }
  }
  if (existsSync(join(cwd, 'apps/server/src/server.ts'))) {
    return { applicable: true, kind: 'fullstack-server' }
  }
  return { applicable: false, reason: 'Skipped because no HTTP smoke target was detected.' }
}

export async function runSmokeProbe(cwd: string): Promise<GeneratedProjectCommandResult> {
  const applicability = smokeApplicability(cwd)
  if (!applicability.applicable) {
    return {
      command: 'smoke',
      argv: ['smoke'],
      status: 'skipped',
      output: applicability.reason,
    }
  }

  const port = await findFreePort()

  switch (applicability.kind) {
    case 'next':
      return probeHttp(
        'next',
        ['bun', 'run', 'start', '--', '-p', port],
        cwd,
        `http://127.0.0.1:${port}/api/health`,
        {
          NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
          CI: 'true',
        },
      )
    case 'backend':
      return probeHttp('backend', ['bun', 'run', 'dev'], cwd, `http://127.0.0.1:${port}/health`, {
        PORT: port,
        FRONTEND_URL: `http://127.0.0.1:3000`,
      })
    case 'fullstack-server':
      return probeHttp(
        'fullstack-server',
        ['bun', 'run', 'dev'],
        join(cwd, 'apps/server'),
        `http://127.0.0.1:${port}/health`,
        {
          PORT: port,
          DATABASE_URL: 'postgres://user:password@localhost:5432/smoke',
          BETTER_AUTH_SECRET: `smoke-test-${'a'.repeat(21)}`,
          ENABLE_REDIS: 'false',
          FRONTEND_URL: 'http://127.0.0.1:3000',
          BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
          CI: 'true',
        },
        [200, 503],
      )
    case 'tanstack':
      return probeHttp(
        'tanstack',
        ['bun', 'run', 'start'],
        cwd,
        `http://127.0.0.1:${port}/api/health`,
        { PORT: port, CI: 'true' },
      )
  }
}
