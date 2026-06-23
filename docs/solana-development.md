# Solana development (Arche scaffolds)

Arche generates Solana + Anchor monorepos from presets `solana-program`, `solana-web`, `solana-mobile`, and `solana-product`. Each scaffold includes an Anchor 0.32 program, shared TypeScript packages, and optional Next.js / Expo apps.

## Presets

| Preset           | Output                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| `solana-program` | programs/core, solana-config + solana-client packages, Anchor integration tests |
| `solana-web`     | Program + packages + web app (wallet adapter)                                   |
| `solana-mobile`  | Program + packages + Expo mobile app (MWA deps)                                 |
| `solana-product` | Web + mobile + program                                                          |

```sh
bun run dev:cli -- my-dapp --yes --preset=solana-web --dir=../projects
```

## Generated layout

- programs/core/src/lib.rs — Anchor program (Counter: `initialize`, `increment`)
- solana-config package — cluster + program id constants
- solana-client package — `createCoreProgram()` using `@coral-xyz/anchor` and a checked-in IDL stub
- `docs/solana-development.md` — Solana toolchain and quick start (also see this doc for toolchain links)
- `.github/workflows/ci.yml` — TypeScript lint/typecheck + `anchor build` job

After `anchor build`, copy target/idl JSON into the solana-client package idl folder for typed clients in apps.

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.anza.xyz/cli/install)
- [Anchor 0.32+](https://www.anchor-lang.com/docs/installation) (`avm install 0.32.1 && avm use 0.32.1`)
- Bun (default package manager for generated workspaces)

## Local workflow

```sh
solana-test-validator          # separate terminal
bun install
anchor keys list
bun run anchor:build           # compile program + emit IDL
bun run anchor:test            # Anchor test runner (integration tests)
bun run dev                    # web/mobile when included
```

Sync program ids after deploy: `anchor keys sync`.

## Verification (maintainers)

Structure and Bun workspace output: `bun test apps/cli/tests/solana-preset.test.ts`.

Optional Anchor build gate (requires Solana + Anchor on the host):

```sh
bun run verify:generated -- --preset=solana-program,solana-web,solana-mobile,solana-product --run=anchor-build
```

## References

- [Anchor book](https://book.anchor-lang.com/)
- [Solana docs](https://solana.com/docs)
- [Solana cookbook](https://solanacookbook.com/)
- [Wallet adapter](https://github.com/anza-xyz/wallet-adapter)
- [Mobile Wallet Adapter](https://docs.solanamobile.com/developers/mobile-wallet-adapter)
