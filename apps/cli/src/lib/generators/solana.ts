import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

const PROGRAM_ID = '11111111111111111111111111111111'

function rustName(projectName: string): string {
  return sanitizeProjectName(projectName).replace(/-/g, '_')
}

function packageScope(projectName: string): string {
  return sanitizeProjectName(projectName)
}

function workspaceScope(projectName: string): string {
  return `@${sanitizeProjectName(projectName)}`
}

function solanaPreset(config: ProjectConfig): NonNullable<ProjectConfig['preset']> {
  return config.preset && config.preset.startsWith('solana-') ? config.preset : 'solana-program'
}

function includesWeb(config: ProjectConfig): boolean {
  const preset = solanaPreset(config)
  return preset === 'solana-web' || preset === 'solana-product'
}

function includesMobile(config: ProjectConfig): boolean {
  const preset = solanaPreset(config)
  return preset === 'solana-mobile' || preset === 'solana-product'
}

function rootPackageJson(config: ProjectConfig): string {
  const scope = packageScope(config.projectName)
  return JSON.stringify(
    {
      name: scope,
      private: true,
      type: 'module',
      scripts: {
        dev: 'turbo run dev',
        build: 'turbo run build',
        lint: 'turbo run lint',
        'check-types': 'turbo run check-types',
        test: 'turbo run test',
        'anchor:build': 'anchor build',
        'anchor:test': 'anchor test',
      },
      workspaces: ['apps/*', 'packages/*'],
      devDependencies: {
        '@coral-xyz/anchor': '^0.32.1',
        '@types/bun': '1.3.14',
        turbo: '^2.9.14',
        typescript: '^6.0.3',
        oxlint: '^1.65.0',
      },
    },
    null,
    2,
  )
}

function anchorToml(config: ProjectConfig): string {
  const program = `${rustName(config.projectName)}_core`
  return `[toolchain]
anchor_version = "0.32.1"

[programs.localnet]
${program} = "${PROGRAM_ID}"

[programs.devnet]
${program} = "${PROGRAM_ID}"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "anchor test"

[test]
startup_wait = 10000
`
}

function cargoWorkspaceToml(): string {
  return `[workspace]
members = ["programs/core"]
resolver = "2"

[profile.release]
overflow-checks = true
`
}

function programCargoToml(config: ProjectConfig): string {
  const crateName = `${sanitizeProjectName(config.projectName)}-core`
  const libName = `${rustName(config.projectName)}_core`
  return `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"

[lib]
name = "${libName}"
crate-type = ["cdylib", "lib"]

[features]
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = "0.32"
`
}

function programLibRs(config: ProjectConfig): string {
  const moduleName = `${rustName(config.projectName)}_core`
  return `use anchor_lang::prelude::*;

declare_id!("${PROGRAM_ID}");

#[program]
pub mod ${moduleName} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        msg!("Counter initialized");
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.saturating_add(1);
        Ok(())
    }
}

#[account]
pub struct Counter {
    pub count: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}
`
}

function packageJson(name: string, dependencies: Record<string, string> = {}): string {
  return JSON.stringify(
    {
      name,
      version: '0.1.0',
      private: true,
      type: 'module',
      exports: { '.': './src/index.ts' },
      scripts: {
        build: 'tsc --noEmit',
        lint: 'oxlint',
        'check-types': 'tsc --noEmit',
        test: 'bun test',
      },
      dependencies,
      devDependencies: {
        typescript: '^6.0.3',
        oxlint: '^1.65.0',
      },
    },
    null,
    2,
  )
}

function packageTsconfigJson(options?: { resolveJsonModule?: boolean }): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        ...(options?.resolveJsonModule ? { resolveJsonModule: true } : {}),
      },
      include: ['src/**/*.ts', 'src/**/*.json'],
    },
    null,
    2,
  )
}

function webTsconfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'preserve',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        allowJs: true,
      },
      include: ['app/**/*.ts', 'app/**/*.tsx', 'next.config.js'],
    },
    null,
    2,
  )
}

function mobileTsconfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      include: ['App.tsx'],
    },
    null,
    2,
  )
}

function solanaConfigIndex(config: ProjectConfig): string {
  return `export const SOLANA_CLUSTER = 'localnet'
export const CORE_PROGRAM_ID = '${PROGRAM_ID}'
export const CORE_PROGRAM_NAME = '${rustName(config.projectName)}_core'
`
}

function solanaClientIdlStub(): string {
  return JSON.stringify(
    {
      address: PROGRAM_ID,
      metadata: { name: 'core', version: '0.1.0', spec: '0.1.0' },
      instructions: [
        {
          name: 'initialize',
          discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
          accounts: [],
          args: [],
        },
        {
          name: 'increment',
          discriminator: [11, 18, 104, 9, 104, 174, 59, 33],
          accounts: [],
          args: [],
        },
      ],
      accounts: [],
      types: [],
    },
    null,
    2,
  )
}

function solanaClientIndex(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return `import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey, type Commitment } from '@solana/web3.js'
import type { Wallet } from '@coral-xyz/anchor'
import { CORE_PROGRAM_ID, CORE_PROGRAM_NAME, SOLANA_CLUSTER } from '${scope}/solana-config'
import idl from './idl/core.json'

export interface CoreProgramConfig {
  cluster: string
  programId: string
  programName: string
}

export function getCoreProgramConfig(): CoreProgramConfig {
  return {
    cluster: SOLANA_CLUSTER,
    programId: CORE_PROGRAM_ID,
    programName: CORE_PROGRAM_NAME,
  }
}

export function getProgramId(): PublicKey {
  return new PublicKey(CORE_PROGRAM_ID)
}

/** Replace \`src/idl/core.json\` with \`target/idl/*.json\` after \`anchor build\`. */
export function createCoreProgram(
  connection: Connection,
  wallet: Wallet,
  commitment: Commitment = 'confirmed',
): Program<Idl> {
  const provider = new AnchorProvider(connection, wallet, { commitment })
  return new Program(idl as Idl, provider)
}
`
}

function webPackageJson(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return JSON.stringify(
    {
      name: `${scope}/solana-web`,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'next dev --port 3000',
        build: 'next build',
        lint: 'oxlint',
        'check-types': 'tsc --noEmit',
      },
      dependencies: {
        '@solana/wallet-adapter-base': '^0.9.27',
        '@solana/wallet-adapter-react': '^0.15.39',
        '@solana/wallet-adapter-wallets': '^0.19.37',
        '@solana/web3.js': '^1.98.4',
        [`${scope}/solana-client`]: 'workspace:*',
        next: '^16.2.6',
        react: '^19.2.6',
        'react-dom': '^19.2.6',
      },
      devDependencies: {
        '@types/node': '^25.9.0',
        '@types/react': '19.2.14',
        '@types/react-dom': '19.2.3',
        typescript: '^6.0.3',
        oxlint: '^1.65.0',
      },
    },
    null,
    2,
  )
}

function webPageTsx(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return `'use client'

import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { getCoreProgramConfig, getProgramId } from '${scope}/solana-client'

const LOCALNET_RPC = 'http://127.0.0.1:8899'

const services = [
  ['Program', 'Anchor Counter on localnet'],
  ['Client', 'Generated @coral-xyz/anchor boundary'],
  ['Wallet', 'Phantom + Solflare adapters'],
] as const

function SolanaContent() {
  const config = getCoreProgramConfig()
  const programId = getProgramId().toBase58()

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Generated by Arche</p>
        <h1>Your Solana dApp base is ready.</h1>
        <p className="lede">
          Anchor program, typed client package, and wallet adapters in one workspace. Build the
          program, sync the IDL, then send transactions from this page.
        </p>
        <div className="actions" aria-label="Local commands">
          <code>bun run anchor:build</code>
          <code>bun run anchor:test</code>
        </div>
      </section>

      <section className="status" aria-label="Program status">
        <div>
          <span className="dot online" />
          <p className="eyebrow">Program</p>
          <h2>
            <code>{config.programName}</code> on {config.cluster}
          </h2>
        </div>
        <code>{programId}</code>
      </section>

      <section className="grid" aria-label="Generated services">
        {services.map(([name, detail]) => (
          <article key={name} className="card">
            <span>{name}</span>
            <h2>{detail}</h2>
          </article>
        ))}
      </section>
    </main>
  )
}

export default function Page() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  return (
    <ConnectionProvider endpoint={LOCALNET_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <SolanaContent />
      </WalletProvider>
    </ConnectionProvider>
  )
}
`
}

function webLayoutTsx(): string {
  return `import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './styles.css'

export const metadata: Metadata = {
  title: 'Arche Scaffold',
  description: 'Solana web dApp generated by Arche.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
}

async function readScaffoldHomeStyles(): Promise<string> {
  const generatorDir = dirname(fileURLToPath(import.meta.url))
  return readFile(join(generatorDir, '../../templates/fullstack/apps/web/app/styles.css'), 'utf8')
}

function nextConfig(): string {
  return `const nextConfig = {}

export default nextConfig
`
}

function mobilePackageJson(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return JSON.stringify(
    {
      name: `${scope}/solana-mobile`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: 'index.js',
      scripts: {
        dev: 'expo start',
        build: 'expo export',
        lint: 'oxlint',
        'check-types': 'tsc --noEmit',
      },
      dependencies: {
        '@solana-mobile/mobile-wallet-adapter-protocol-web3js': '^2.2.1',
        '@solana/web3.js': '^1.98.4',
        [`${scope}/solana-client`]: 'workspace:*',
        expo: '^54.0.0',
        react: '^19.2.6',
        'react-native': '^0.81.0',
      },
      devDependencies: {
        '@types/react': '19.2.14',
        typescript: '^6.0.3',
        oxlint: '^1.65.0',
      },
    },
    null,
    2,
  )
}

function mobileAppTsx(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return `import { Text, View } from 'react-native'
import { getCoreProgramConfig } from '${scope}/solana-client'

export default function App() {
  const config = getCoreProgramConfig()

  return (
    <View>
      <Text>Solana Mobile Wallet Adapter boundary</Text>
      <Text>{config.programName}</Text>
    </View>
  )
}
`
}

function anchorTestTs(config: ProjectConfig): string {
  const program = `${rustName(config.projectName)}_core`
  return `import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { describe, expect, it } from 'bun:test'

describe('${program}', () => {
  it('builds an Anchor provider against localnet', () => {
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
    const program = anchor.workspace.${program} as Program
    expect(program.programId).toBeInstanceOf(PublicKey)
    expect(SystemProgram.programId).toBeDefined()
  })
})
`
}

function solanaGettingStartedMd(config: ProjectConfig): string {
  const program = `${rustName(config.projectName)}_core`
  return `# Solana development (${sanitizeProjectName(config.projectName)})

## Prerequisites

- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor 0.32+](https://www.anchor-lang.com/docs/installation) (\`avm install 0.32.1 && avm use 0.32.1\`)
- Bun (workspace package manager)

## Quick start

\`\`\`bash
solana-test-validator   # separate terminal
bun install
anchor keys list        # verify program id
bun run anchor:build    # compile program + emit IDL to target/idl/
bun run anchor:test     # run tests/tests/core.ts
\`\`\`

## Program layout

- \`programs/core/src/lib.rs\` — Anchor program (\`${program}\`)
- \`packages/solana-config\` — cluster + program id constants
- \`packages/solana-client\` — TypeScript client boundary (\`@coral-xyz/anchor\`)

After \`anchor build\`, copy \`target/idl/*.json\` into \`packages/solana-client/src/idl/\` for typed clients in apps.

## References

- [Anchor book](https://book.anchor-lang.com/)
- [Solana cookbook](https://solanacookbook.com/)
- [Wallet adapter](https://github.com/anza-xyz/wallet-adapter)
`
}

function mobileIndexJs(): string {
  return `import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)
`
}

function appJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      expo: {
        name: sanitizeProjectName(config.projectName),
        slug: sanitizeProjectName(config.projectName),
        scheme: sanitizeProjectName(config.projectName),
      },
    },
    null,
    2,
  )
}

async function writeFile_(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

export async function applySolanaScaffoldTransform(
  destinationDir: string,
  config: ProjectConfig,
): Promise<string[]> {
  const generated: string[] = []
  const scope = workspaceScope(config.projectName)

  await rm(join(destinationDir, 'src'), { recursive: true, force: true })
  await rm(join(destinationDir, 'Cargo.toml'), { force: true })

  const writes: Array<[string, string]> = [
    ['package.json', rootPackageJson(config)],
    ['Anchor.toml', anchorToml(config)],
    ['Cargo.toml', cargoWorkspaceToml()],
    ['programs/core/Cargo.toml', programCargoToml(config)],
    ['programs/core/src/lib.rs', programLibRs(config)],
    ['packages/solana-config/package.json', packageJson(`${scope}/solana-config`)],
    ['packages/solana-config/tsconfig.json', packageTsconfigJson()],
    ['packages/solana-config/src/index.ts', solanaConfigIndex(config)],
    [
      'packages/solana-client/package.json',
      packageJson(`${scope}/solana-client`, {
        '@coral-xyz/anchor': '^0.32.1',
        '@solana/web3.js': '^1.98.4',
        [`${scope}/solana-config`]: 'workspace:*',
      }),
    ],
    ['packages/solana-client/tsconfig.json', packageTsconfigJson({ resolveJsonModule: true })],
    ['packages/solana-client/src/idl/core.json', solanaClientIdlStub()],
    ['packages/solana-client/src/index.ts', solanaClientIndex(config)],
    ['tests/core.ts', anchorTestTs(config)],
    ['docs/solana-getting-started.md', solanaGettingStartedMd(config)],
  ]

  if (includesWeb(config)) {
    const scaffoldStyles = await readScaffoldHomeStyles()
    writes.push(
      ['apps/web/package.json', webPackageJson(config)],
      ['apps/web/tsconfig.json', webTsconfigJson()],
      ['apps/web/next.config.js', nextConfig()],
      ['apps/web/app/styles.css', scaffoldStyles],
      ['apps/web/app/layout.tsx', webLayoutTsx()],
      ['apps/web/app/page.tsx', webPageTsx(config)],
    )
  }

  if (includesMobile(config)) {
    writes.push(
      ['apps/mobile/package.json', mobilePackageJson(config)],
      ['apps/mobile/tsconfig.json', mobileTsconfigJson()],
      ['apps/mobile/app.json', appJson(config)],
      ['apps/mobile/index.js', mobileIndexJs()],
      ['apps/mobile/App.tsx', mobileAppTsx(config)],
    )
  }

  for (const [path, content] of writes) {
    await writeFile_(join(destinationDir, path), content)
    generated.push(path)
  }

  return generated
}

function packageManagerInstall(config: ProjectConfig): string {
  switch (config.packageManager) {
    case 'pnpm':
      return 'pnpm install'
    case 'npm':
      return 'npm install'
    case 'bun':
      return 'bun install'
  }
}

function runScript(config: ProjectConfig, script: string): string {
  return config.packageManager === 'npm'
    ? `npm run ${script}`
    : `${config.packageManager} run ${script}`
}

function renderPackageManagerSetup(config: ProjectConfig): string {
  switch (config.packageManager) {
    case 'pnpm':
      return `      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: pnpm/action-setup@v4
        with:
          version: 10
`
    case 'npm':
      return `      - uses: actions/setup-node@v4
        with:
          node-version: 22
`
    case 'bun':
      return `      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
`
  }
}

/** GitHub Actions workflow for Solana + Anchor monorepos (TS lint/typecheck + program build). */
export function renderSolanaCi(config: ProjectConfig): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

${renderPackageManagerSetup(config)}
      - name: Install dependencies
        run: ${packageManagerInstall(config)}

      - name: Lint
        run: ${runScript(config, 'lint')}

      - name: Typecheck
        run: ${runScript(config, 'check-types')}

  anchor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable

      - name: Install Solana CLI
        run: |
          sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> "$GITHUB_PATH"

      - name: Install Anchor 0.32.1
        run: |
          cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
          avm install 0.32.1
          avm use 0.32.1
          echo "$HOME/.avm/bin" >> "$GITHUB_PATH"

      - name: Build Anchor program
        run: anchor build
`
}
