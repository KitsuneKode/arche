import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const TEMPLATE_PREFIX = join(ROOT, 'apps/cli/src/templates/fullstack')

async function fileExists(path: string): Promise<boolean> {
  try {
    await Bun.file(path).arrayBuffer()
    return true
  } catch {
    return false
  }
}

export async function collectTemplateAgentsPairs(): Promise<
  Array<{ live: string; template: string; relative: string }>
> {
  const pairs: Array<{ live: string; template: string; relative: string }> = []
  for await (const match of new Bun.Glob('**/AGENTS.md').scan(TEMPLATE_PREFIX)) {
    const relative = match
    const live = join(ROOT, relative)
    const template = join(TEMPLATE_PREFIX, relative)
    if (await fileExists(live)) {
      pairs.push({ live, template, relative })
    }
  }
  return pairs
}

export async function syncTemplateAgents(options: { check: boolean }): Promise<string[]> {
  const drifted: string[] = []
  const pairs = await collectTemplateAgentsPairs()

  for (const { live, template, relative } of pairs) {
    const liveText = await Bun.file(live).text()
    const templateText = await Bun.file(template).text()
    if (liveText !== templateText) {
      drifted.push(relative)
      if (!options.check) {
        await Bun.write(template, liveText)
      }
    }
  }

  return drifted
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check')
  const drifted = await syncTemplateAgents({ check })

  if (drifted.length === 0) {
    if (!check) {
      console.log('Template AGENTS.md files are in sync.')
    }
    process.exit(0)
  }

  for (const path of drifted) {
    console.error(check ? `DRIFT: ${path}` : `SYNCED: ${path}`)
  }
  process.exit(check ? 1 : 0)
}

if (import.meta.main) {
  await main()
}
