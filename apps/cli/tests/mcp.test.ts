import { describe, expect, it } from 'bun:test'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const CLI_SRC = resolve(import.meta.dirname, '../src/index.ts')

interface JsonRpcResponse {
  jsonrpc: string
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

async function mcpExchange(requests: Record<string, unknown>[]): Promise<JsonRpcResponse[]> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('bun', ['run', CLI_SRC, 'mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const timeout = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error('MCP test timed out'))
    }, 10000)

    const responses: JsonRpcResponse[] = []
    const rl = createInterface({ input: proc.stdout })

    rl.on('line', (line) => {
      const trimmed = line.trim()
      if (trimmed) responses.push(JSON.parse(trimmed) as JsonRpcResponse)
    })

    proc.on('error', (error) => {
      clearTimeout(timeout)
      rl.close()
      reject(error)
    })

    proc.on('close', () => {
      clearTimeout(timeout)
      rl.close()
      resolvePromise(responses)
    })

    for (const request of requests) {
      proc.stdin.write(`${JSON.stringify(request)}\n`)
    }
    proc.stdin.end()
  })
}

describe('MCP Server', () => {
  it('responds to initialize request', async () => {
    const responses = await mcpExchange([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
    ])

    const initResp = responses[0]
    expect(initResp.jsonrpc).toBe('2.0')
    expect(initResp.id).toBe(1)
    expect(initResp.result).toBeDefined()
    const result = initResp.result as Record<string, unknown>
    expect(result.protocolVersion).toBe('2024-11-05')
    expect(result.serverInfo).toBeDefined()
    const serverInfo = result.serverInfo as Record<string, unknown>
    expect(serverInfo.name).toBe('@kitsunekode/arche')
    expect(typeof serverInfo.version).toBe('string')
  })

  it('does not send unsolicited initialize on startup', async () => {
    const responses = await mcpExchange([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }])
    expect(responses).toHaveLength(1)
    expect(responses[0]?.id).toBe(1)
  })

  it('responds to tools/list', async () => {
    const responses = await mcpExchange([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }])

    const listResp = responses[0]
    expect(listResp.jsonrpc).toBe('2.0')
    expect(listResp.id).toBe(1)
    expect(listResp.result).toBeDefined()
    const result = listResp.result as Record<string, unknown>
    expect(result.tools).toBeDefined()
    const tools = result.tools as Record<string, unknown>[]
    expect(tools.length).toBeGreaterThanOrEqual(4)
    const toolNames = tools.map((t) => t.name)
    expect(toolNames).toContain('arche_plan_project')
    expect(toolNames).toContain('arche_create_project')
    expect(toolNames).toContain('arche_get_schema')
    expect(toolNames).toContain('arche_get_guidance')
  })

  it('responds to arche_get_schema', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'arche_get_schema', arguments: {} },
      },
    ])

    const schemaResp = responses[0]
    expect(schemaResp.jsonrpc).toBe('2.0')
    expect(schemaResp.id).toBe(2)
    expect(schemaResp.result).toBeDefined()
    const result = schemaResp.result as Record<string, unknown>
    expect(result.properties).toBeDefined()
    expect(result.properties).toHaveProperty('projectName')
    expect(result.properties).toHaveProperty('family')
    const properties = result.properties as Record<string, Record<string, unknown>>
    expect(properties.packageManager.support).toEqual({
      bun: 'stable',
      pnpm: 'stable',
      npm: 'experimental',
    })
    expect(result.required).toContain('projectName')
  })

  it('responds to arche_get_guidance', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'arche_get_guidance', arguments: {} },
      },
    ])

    const guidanceResp = responses[0]
    expect(guidanceResp.jsonrpc).toBe('2.0')
    expect(guidanceResp.id).toBe(3)
    expect(guidanceResp.result).toBeDefined()
    const result = guidanceResp.result as Record<string, unknown>
    expect(result.guidance).toBeDefined()
    expect(Array.isArray(result.guidance)).toBe(true)
    expect(result.tool).toBe('@kitsunekode/arche')
  })

  it('responds to arche_get_guidance with family', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'arche_get_guidance', arguments: { family: 'next' } },
      },
    ])

    const resp = responses[0]
    expect(resp.id).toBe(4)
    const result = resp.result as Record<string, unknown>
    expect(result.family).toBe('next')
  })

  it('responds to arche_plan_project', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'arche_plan_project',
          arguments: { projectName: 'test-project', family: 'backend' },
        },
      },
    ])

    const resp = responses[0]
    expect(resp.id).toBe(5)
    const result = resp.result as Record<string, unknown>
    expect(result.valid).toBeDefined()
    expect(result.plannedConfig).toBeDefined()
    const planned = result.plannedConfig as Record<string, unknown>
    expect(planned.projectName).toBe('test-project')
    expect(planned.family).toBe('backend')
  })

  it('returns error for unknown tool', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
      },
    ])

    const resp = responses[0]
    expect(resp.id).toBe(6)
    expect(resp.error).toBeDefined()
    expect(resp.error?.code).toBe(-32601)
    expect(resp.error?.message).toContain('unknown_tool')
  })

  it('returns error for unknown method', async () => {
    const responses = await mcpExchange([{ jsonrpc: '2.0', id: 7, method: 'unknown_method' }])

    const resp = responses[0]
    expect(resp.id).toBe(7)
    expect(resp.error).toBeDefined()
    expect(resp.error?.code).toBe(-32601)
  })

  it('requires projectName for arche_create_project', async () => {
    const responses = await mcpExchange([
      {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'arche_create_project', arguments: {} },
      },
    ])

    const resp = responses[0]
    expect(resp.id).toBe(8)
    expect(resp.error).toBeDefined()
    expect(resp.error?.message).toContain('projectName')
  })
})
