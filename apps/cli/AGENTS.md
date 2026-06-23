# Bootstrap CLI (`@kitsunekode/arche`)

## Purpose

Bootstrap CLI for scaffolding repositories from this template. Preset status
and verification evidence live in `packages/registry`; regression coverage uses
the fullstack combo matrix (`e2e-scaffold.test.ts` + `verify:generated --combo-matrix`).

## Read First

- `src/index.ts`, `src/lib/scaffold.ts`, `src/types/schemas.ts`
- `src/lib/generators/`, `src/registry/`, `src/render/`

## Scaffold Pipeline

Copy template → package.json → family transform → bundles → rename scope → cleanup → env/docker/CI/agent context → git → install

## Owns

CLI prompts, template copy, family/bundle transforms, generated output (Docker, CI, env, agent-docs), preset registry truthfulness.

## Context Output

One canonical `AGENTS.md`; `CLAUDE.md` symlink; scoped `.docs/` and `.plans/` when generated. No duplicate `CONTEXT.md`.

## Quick Commands

- `bun run dev:cli -- my-app` — dev mode
- `bun run build` — build for npm
- `bun test` — run tests

## Rust presets (`rust-api`, `rust-fullstack`)

Template: `src/templates/rust/` (Axum module-first). `rust-fullstack` nests API under services/api via `generators/rust.ts`. Verify: `bun run verify:generated -- --preset=rust-api,rust-fullstack --run=cargo-check`

## Solana presets (`solana-*`)

Generator: `generators/solana.ts` (string scaffold). Anchor Counter + solana-config/solana-client workspaces when selected; wallet web page; Expo mobile stub. CI: `renderSolanaCi()`. Doc: `docs/solana-development.md`. Verify: `bun test apps/cli/tests/solana-preset.test.ts`

## When to Update

New options, changed pipeline, or modified generated output. Internal design:
`.docs/product/cli-capability-registry.md`. Public CLI reference remains under
`docs/`.
