import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
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
  return `[programs.localnet]
${program} = "${PROGRAM_ID}"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "anchor test"
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
anchor-lang = "0.30"
`
}

function programLibRs(config: ProjectConfig): string {
  const moduleName = `${rustName(config.projectName)}_core`
  return `use anchor_lang::prelude::*;

declare_id!("${PROGRAM_ID}");

#[program]
pub mod ${moduleName} {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
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

function packageTsconfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      include: ['src/**/*.ts'],
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

function solanaClientIndex(config: ProjectConfig): string {
  const scope = workspaceScope(config.projectName)
  return `import { CORE_PROGRAM_ID, CORE_PROGRAM_NAME, SOLANA_CLUSTER } from '${scope}/solana-config'

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

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { getCoreProgramConfig } from '${scope}/solana-client'

export default function Page() {
  const config = getCoreProgramConfig()

  return (
    <ConnectionProvider endpoint="http://127.0.0.1:8899">
      <WalletProvider wallets={[]} autoConnect={false}>
        <main>
          <h1>Solana Web dApp</h1>
          <p>Program: {config.programName}</p>
          <p>Cluster: {config.cluster}</p>
        </main>
      </WalletProvider>
    </ConnectionProvider>
  )
}
`
}

function webLayoutTsx(): string {
  return `import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
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
        [`${scope}/solana-config`]: 'workspace:*',
      }),
    ],
    ['packages/solana-client/tsconfig.json', packageTsconfigJson()],
    ['packages/solana-client/src/index.ts', solanaClientIndex(config)],
  ]

  if (includesWeb(config)) {
    writes.push(
      ['apps/web/package.json', webPackageJson(config)],
      ['apps/web/tsconfig.json', webTsconfigJson()],
      ['apps/web/next.config.js', nextConfig()],
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
