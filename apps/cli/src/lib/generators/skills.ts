import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ProjectConfig } from '../../types/schemas'

interface SkillMapping {
  condition: (config: ProjectConfig) => boolean
  source: string
  skill: string
  description: string
  agent: string
}

const RECOMMENDED_SKILLS: SkillMapping[] = [
  {
    condition: (c) => c.family === 'fullstack' || c.family === 'next' || c.family === 'convex',
    source: 'vercel/next.js',
    skill: 'next-best-practices',
    description: 'Next.js conventions and best practices',
    agent: 'opencode',
  },
  {
    condition: (c) => c.family === 'fullstack' || c.family === 'next' || c.family === 'convex',
    source: 'vercel/next.js',
    skill: 'next-cache-components',
    description: 'Next.js cache components (PPR, use cache)',
    agent: 'opencode',
  },
  {
    condition: (c) => c.backend !== 'none' || c.family === 'fullstack',
    source: 'better-auth',
    skill: 'better-auth',
    description: 'Better Auth configuration and patterns',
    agent: 'opencode',
  },
  {
    condition: (c) => c.orm === 'prisma',
    source: 'prisma',
    skill: 'prisma',
    description: 'Prisma ORM schema and query patterns',
    agent: 'opencode',
  },
  {
    condition: (c) => c.orm === 'drizzle',
    source: 'drizzle-orm',
    skill: 'drizzle',
    description: 'Drizzle ORM schema and query patterns',
    agent: 'opencode',
  },
  {
    condition: (c) => c.bundles?.includes('ai'),
    source: 'vercel/ai-sdk',
    skill: 'vercel-ai-sdk',
    description: 'Vercel AI SDK usage',
    agent: 'opencode',
  },
  {
    condition: (c) => c.database === 'postgres',
    source: 'supabase/supabase',
    skill: 'supabase',
    description: 'Supabase and PostgreSQL patterns',
    agent: 'opencode',
  },
]

/** Generate a .cursorrules or .claude.md with skill recommendations based on config */
export function buildSkillRecommendations(config: ProjectConfig): string {
  const matching = RECOMMENDED_SKILLS.filter((s) => s.condition(config)).map(
    (s) => `  - \`${s.source}/${s.skill}\`: ${s.description}`,
  )

  if (matching.length === 0) return ''

  return `# Recommended Skills

Add these skills for agent-assisted development:

\`\`\`bash
${matching.map((_, i) => `# skill ${i + 1}`).join('\n')}
\`\`\`

${matching.join('\n')}
`
}

/** Write skill configuration files to the scaffolded project */
export function writeSkillConfigs(destinationDir: string, config: ProjectConfig): string[] {
  const matching = RECOMMENDED_SKILLS.filter((s) => s.condition(config))
  if (matching.length === 0) return []

  const opencodeSkills = matching.filter((s) => s.agent === 'opencode')
  const generatedFiles: string[] = []
  if (opencodeSkills.length > 0) {
    const configDir = join(destinationDir, '.opencode')
    if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
    writeFileSync(
      join(configDir, 'skills.json'),
      JSON.stringify(
        {
          version: '0.1.0',
          skills: opencodeSkills.map((s) => ({
            source: s.source,
            name: s.skill,
          })),
        },
        null,
        2,
      ) + '\n',
    )
    generatedFiles.push('.opencode/skills.json')
  }

  return generatedFiles
}
