# Publishing Arche

Arche publishes from `apps/cli` as `@kitsunekode/arche`.

Live publishing is guarded. The release workflow can create Changesets version
PRs, but `bun run release` skips npm publish unless
`NPM_TRUSTED_PUBLISHING_ENABLED=true`.

## Local package check

```sh
bun run pkg:check
```

This runs CLI typecheck, lint, tests, builds `apps/cli/dist/index.js`, and runs
`npm pack --dry-run` from `apps/cli`.

For a smaller package-only check:

```sh
bun run --cwd apps/cli pack:dry-run
```

## CI package check

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs format check,
Turbo lint/types/build (affected or full on `main`/`prod`), smoke builds for web
and CLI, tests, `pkg:check`, and `repo:doctor:strict`.

[`.github/workflows/release.yml`](../.github/workflows/release.yml) runs only after
CI succeeds on a **push to `main`** and executes Changesets only (no duplicate verify).

## Trusted publishing direction

Use npm Trusted Publishing with GitHub Actions OIDC instead of long-lived npm
tokens.

Official references:

- npm trusted publishers:
  <https://docs.npmjs.com/trusted-publishers>
- npm provenance:
  <https://docs.npmjs.com/generating-provenance-statements>

Before enabling live publish:

1. Verify package contents with `bun run pkg:check`.
2. Verify generated projects with `bun run verify:generated` (also weekly in CI).
3. Run opt-in Rust and Solana generated gates:
   `bun run verify:generated -- --preset=rust-api,rust-fullstack --run=cargo-check`
   and
   `bun run verify:generated -- --preset=solana-program,solana-web,solana-mobile,solana-product --run=anchor-build`.
4. Configure `@kitsunekode/arche` on npm as a trusted publisher for this GitHub
   repository and the exact publish workflow filename (`release.yml`).
5. Set the repository variable `NPM_TRUSTED_PUBLISHING_ENABLED=true`.
6. Keep `permissions.id-token: write` and no `NPM_TOKEN`.

npm Trusted Publishing requires npm CLI `11.5.1` or newer and Node `22.14.0` or
newer, so release CI uses Node 24 and updates npm before publish steps.

Current workflow shape:

```yaml
name: Release

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.head_branch == 'main' &&
      github.event.workflow_run.event == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ github.event.workflow_run.head_sha }}
          fetch-depth: 0
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: package.json
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
      - run: npm install -g npm@latest
      - run: bun install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: bun run version:packages
          publish: bun run release
```

Trusted publishing automatically provides provenance for supported npm publish
flows, so do not add a long-lived npm automation token unless npm's OIDC route
is unavailable.
