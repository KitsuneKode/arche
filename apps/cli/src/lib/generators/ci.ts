/**
 * GitHub Actions CI workflow generator
 *
 * Generates .github/workflows/ci.yml adapted to runtime and testing config.
 */

import type { ProjectConfig } from '../../types/schemas'

import { renderRustCi } from './rust'
import { renderSolanaCi } from './solana'

function renderPackageManagerSteps(config: ProjectConfig): string {
  switch (config.packageManager) {
    case 'pnpm':
      return `      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install
`
    case 'npm':
      return `      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm install
`
    case 'bun':
      return `      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install
`
  }
}

function runScript(config: ProjectConfig, script: string): string {
  return config.packageManager === 'npm'
    ? `npm run ${script}`
    : `${config.packageManager} run ${script}`
}

function runTest(config: ProjectConfig): string {
  return config.packageManager === 'npm' ? 'npm test --' : `${config.packageManager} test`
}

function renderConvexCi(config: ProjectConfig): string {
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

${renderPackageManagerSteps(config)}

      - name: Lint
        run: ${runScript(config, 'lint')}

      - name: Typecheck
        run: ${runScript(config, 'check-types')}
`.trimEnd()
}

function renderStandaloneCi(config: ProjectConfig): string {
  const lintStep =
    config.family === 'backend' || config.family === 'convex'
      ? `      - name: Lint
        run: ${runScript(config, 'lint')}

`
      : ''
  const typecheckStep = `      - name: Typecheck
        run: ${runScript(config, 'check-types')}

`
  const buildStep =
    config.family === 'mobile'
      ? ''
      : `      - name: Build
        run: ${runScript(config, 'build')}
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

${renderPackageManagerSteps(config)}

${lintStep}${typecheckStep}${buildStep}`.trimEnd() + '\n'
  )
}

export function renderGithubActionsWorkflow(config: ProjectConfig): string {
  if (config.family === 'rust') {
    return renderRustCi(config)
  }

  if (config.family === 'convex') {
    return `${renderConvexCi(config)}\n`
  }

  if (config.family === 'solana') {
    return renderSolanaCi(config)
  }

  if (config.family !== 'fullstack' && config.family !== 'polyglot') {
    return renderStandaloneCi(config)
  }

  const testStep =
    config.testing !== 'none'
      ? `      - name: Run tests
        run: ${runTest(config)} tests/src
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

${renderPackageManagerSteps(config)}

      - name: Lint
        run: ${runScript(config, 'lint')}

      - name: Typecheck
        run: ${runScript(config, 'check-types')}

      - name: Repo doctor
        run: ${runScript(config, 'repo:doctor:strict')}

${testStep}`.trimEnd() + '\n'
  )
}
