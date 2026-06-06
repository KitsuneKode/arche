# Portfolio sync (kitsunekode.in)

Arche can generate portfolio-ready projects for [kitsunekode.in](https://kitsunekode.in).

## What gets generated

When you scaffold with `--showcase` (fullstack only):

- `SHOWCASE.mdx` at the project root — plain markdown frontmatter, no custom React imports
- `package.json` → `portfolio` field on **scaffolded** projects (`type`, `tags`, `featured`) — not on this template repo root

## Frontmatter contract

```yaml
---
title: my-app
type: fullstack
tags: ['fullstack', 'express-bun', 'postgres', 'prisma']
featured: false
created: 2026-05-19
updated: 2026-05-19
generator: '@kitsunekode/arche@0.1.0'
portfolio: https://kitsunekode.in
---
```

## After scaffolding

1. Fill in `SHOWCASE.mdx` sections (overview, architecture, features).
2. Push to GitHub.
3. Portfolio webhook picks up changes (configure revalidation URL in your portfolio project).

## arche.json

Scaffolded projects include `arche.json` with a reproducible command:

```sh
npx @kitsunekode/arche create my-app fullstack --yes ...
```

Schema URL: `https://kitsunekode.in/schemas/arche.json`
