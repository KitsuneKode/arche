import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

function runScript(config: ProjectConfig, script: string): string {
  if (config.packageManager === 'npm') return `npm run ${script}`
  return `${config.packageManager} run ${script}`
}

function installCommand(config: ProjectConfig): string {
  return config.packageManager === 'npm' ? 'npm install' : `${config.packageManager} install`
}

function quickStart(config: ProjectConfig): string {
  if (config.family === 'rust') {
    return 'cp .env.example .env\ncargo run'
  }
  const devCommand = config.packageManager === 'bun' ? 'bun dev' : runScript(config, 'dev')
  if (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  ) {
    const webCommand =
      config.packageManager === 'bun' ? 'bun dev:web' : runScript(config, 'dev:web')
    const apiCommand =
      config.packageManager === 'bun' ? 'bun dev:api' : runScript(config, 'dev:api')
    return `${installCommand(config)}\n# Terminal 1\n${webCommand}\n# Terminal 2\n${apiCommand}`
  }
  return `${installCommand(config)}\n${devCommand}`
}

export function buildReadme(config: ProjectConfig): string {
  const name = sanitizeProjectName(config.projectName)
  const preset = config.preset ?? config.family

  return `# ${name}

Scaffolded with [@arche/create](https://github.com/KitsuneKode/arche) (\`${preset}\`).

## Quick start

\`\`\`bash
${quickStart(config)}
\`\`\`

## Commands

| Command | Description |
| ------- | ----------- |
| \`${runScript(config, 'dev')}\` | Start development (or \`cargo run\` for Rust-only) |
| \`${runScript(config, 'build')}\` | Build |
| \`${runScript(config, 'lint')}\` | Lint when the scaffold includes a lint script |
| \`${runScript(config, 'check-types')}\` | Typecheck when the scaffold includes a typecheck script |

## Project context

- \`AGENTS.md\` — agent entrypoint
- \`.docs/architecture/generated-project.md\` — architecture notes
- \`arche.json\` — scaffold choices and replay command

${config.includeShowcase && config.family === 'fullstack' ? 'Fill in `SHOWCASE.mdx` when you are ready for portfolio sync.\n' : ''}`
}
