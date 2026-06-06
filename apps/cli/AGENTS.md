# Bootstrap CLI (`@kitsunekode/arche`)

## Purpose

Bootstrap CLI for scaffolding repositories from this template. The legacy
family flow remains while the capability-registry/recipe foundation is wired
into verified presets.

## Read First

- `src/index.ts` — entry, arg parsing, prompts
- `src/lib/scaffold.ts` — pipeline orchestrator
- `src/lib/generators/` — per-feature transforms
- `src/types/schemas.ts` — Zod schemas + compatibility checks
- `src/registry/` — preset candidates, support status, capability validation
- `src/recipe/` — recipe schema and replay command support
- `src/render/` — workspace and generated context renderers

## Scaffold Pipeline

Copy template → update package.json → family transform → addon/bundle transforms → rename scope → template cleanup → generate env/docker/CI/deployment/agent context → git init → install

## Owns

- CLI prompts and arg parsing
- Template copy and customization
- Family transforms
- Bundle/addon transforms
- Generated files (Docker, CI, env, deployment, agent-docs, showcase)
- Recipe/capability foundations and support-status truthfulness

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

## When to Update

New options, changed pipeline, or modified generated output. Internal design:
`.docs/product/cli-capability-registry.md`. Public CLI reference remains under
`docs/`.
