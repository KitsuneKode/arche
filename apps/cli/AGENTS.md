# Bootstrap CLI (`@kitsunekode/arche`)

## Purpose

Bootstrap CLI for scaffolding repositories from this template. Preset status
and verification evidence live in `packages/registry`; regression coverage uses
the fullstack combo matrix (`e2e-scaffold.test.ts` + `verify:generated --combo-matrix`).

## Read First

- `src/index.ts` — entry, arg parsing, prompts
- `src/lib/scaffold.ts` — pipeline orchestrator
- `src/lib/generators/` — per-feature transforms
- `src/types/schemas.ts` — Zod schemas + compatibility checks
- `src/registry/` — preset candidates, support status, capability validation
- `src/render/` — workspace and generated context renderers

## Scaffold Pipeline

Copy template → update package.json → family transform → addon/bundle transforms → rename scope → template cleanup → generate env/docker/CI/deployment/agent context → git init → install

## Owns

- CLI prompts and arg parsing
- Template copy and customization
- Family transforms
- Bundle/addon transforms
- Generated files (Docker, CI, env, deployment, agent-docs, showcase)
- Preset registry and support-status truthfulness (`packages/registry`)

## Context Output

- Generate one canonical `AGENTS.md`.
- Generate `CLAUDE.md` as a symlink to `AGENTS.md`.
- Generate scoped internal context under `.docs/` and planning guidance under
  `.plans/`.
- Do not generate duplicate `CONTEXT.md` instruction/context surfaces.

## Quick Commands

- `bun run dev:cli -- my-app` — dev mode
- `bun run build` — build for npm
- `bun test` — run tests

## Rust presets (`rust-api`, `rust-fullstack`)

- Template: `src/templates/rust/` (module-first Axum: `routes → handler → service → repository`)
- `rust-api`: copies template to project root; `rust-fullstack`: copies into `services/api` via `applyRustServiceApiScaffold()` in `generators/rust.ts`
- SQLx migrations run on startup when `DATABASE_URL` is set (`migrate` feature on sqlx)
- CI: `renderRustCi()` — fmt, clippy, `cargo test`; postgres adds optional `sqlx prepare --check`
- Verify: `bun run verify:generated -- --preset=rust-api,rust-fullstack --run=cargo-check`

## Solana presets (`solana-*`)

- Generator: `generators/solana.ts` (string scaffold, not template copy)
- Anchor 0.32 Counter program, `packages/solana-config` + `packages/solana-client` (IDL stub + `@coral-xyz/anchor`)
- Web: wallet adapter page; mobile: Expo + MWA protocol dep (not Expo Router yet)
- CI: `renderSolanaCi()` — TS lint/typecheck + `anchor build` job (no `repo:doctor`)
- Public doc: `docs/solana-development.md`; per-project `docs/solana-getting-started.md`
- Verify: `bun test apps/cli/tests/solana-preset.test.ts`; optional `--run=anchor-build`

## When to Update

New options, changed pipeline, or modified generated output. Internal design:
`.docs/product/cli-capability-registry.md`. Public CLI reference remains under
`docs/`.
