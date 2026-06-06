/**
 * SHOWCASE.mdx generator — portfolio-ready markdown for kitsunekode.in sync.
 */

import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

function jsonLdBlock(name: string, description: string, created: string): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name,
      description,
      programmingLanguage: ['TypeScript'],
      dateCreated: created,
      dateModified: created,
    },
    null,
    2,
  )
}

export function buildShowcaseMdx(config: ProjectConfig): string {
  const name = sanitizeProjectName(config.projectName)
  const created = new Date().toISOString().slice(0, 10)
  const rawTags = [config.family, config.backend, config.database, config.orm]
  const tags = rawTags.filter((t): t is NonNullable<typeof t> => t != null && t !== 'none')
  const stack = tags.join(', ')

  return `---
title: ${name}
type: fullstack
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
featured: false
created: ${created}
updated: ${created}
generator: '@kitsunekode/arche@0.1.0'
portfolio: https://kitsunekode.in
---

# ${name}

> Fill in the overview below. The portfolio at [kitsunekode.in](https://kitsunekode.in) syncs this file from your GitHub repo.

## Overview

<!-- 2–3 sentences: what the project does and who it is for -->

## Tech stack

${stack}

## Architecture

<!-- Key directories, auth flow, deployment -->

## Key features

- 
- 
- 

## Getting started

\`\`\`bash
bun install
bun dev
\`\`\`

## JSON-LD (SEO)

\`\`\`json
${jsonLdBlock(name, '', created)}
\`\`\`

---

*Scaffolded with [Arche](https://arche.kitsunelabs.xyz) (\`npx @kitsunekode/arche create\`). Update \`updated\` in frontmatter when you edit this file.*
`
}
