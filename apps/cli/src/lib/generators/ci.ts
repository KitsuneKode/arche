/**
 * GitHub Actions CI workflow generator
 *
 * Generates .github/workflows/ci.yml adapted to runtime and testing config.
 */

import type { ProjectConfig } from '../../types/schemas'

import { renderRustCi } from './rust'

function renderConvexCi(): string {
  return `name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run check-types
`.trimEnd()
}

function renderStandaloneCi(config: ProjectConfig): string {
  const lintStep =
    config.family === 'backend' || config.family === 'convex'
      ? `      - name: Lint
        run: bun run lint

`
      : ''
  const typecheckStep =
    config.family === 'backend' || config.family === 'convex'
      ? `      - name: Typecheck
        run: bun run check-types

`
      : ''
  const buildStep =
    config.family === 'worker' || config.family === 'mobile'
      ? ''
      : `      - name: Build
        run: bun run build
`

  return (
    `name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

${lintStep}${typecheckStep}${buildStep}`.trimEnd() + '\n'
  )
}

export function renderGithubActionsWorkflow(config: ProjectConfig): string {
  if (config.family === 'rust') {
    return renderRustCi(config)
  }

  if (config.family === 'convex') {
    return `${renderConvexCi()}\n`
  }

  if (config.family !== 'fullstack' && config.family !== 'polyglot' && config.family !== 'solana') {
    return renderStandaloneCi(config)
  }

  const testStep =
    config.testing !== 'none'
      ? `      - name: Run tests
        run: bun test tests/src
`
      : ''

  return (
    `name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run check-types

      - name: Repo doctor
        run: bun run repo:doctor:strict

${testStep}`.trimEnd() + '\n'
  )
}
