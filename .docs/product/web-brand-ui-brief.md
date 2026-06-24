# Arche Web Brand/UI Brief

This is the durable handoff for public web work. It defines what the site must
communicate and how a UI agent should work without changing CLI behavior or
inventing support claims.

## Authority order

Read only the context required for the slice:

1. Root `AGENTS.md`, then `apps/web/AGENTS.md`.
2. Root `PRODUCT.md` for purpose, personality, anti-goals, and accessibility.
3. This brief for website scope and implementation order, plus root
   `DESIGN.md` for the active visual system.
4. `.docs/product/verification-matrix.md` before writing any preset/status
   claim.
5. The route/components being edited and one matching active plan.

Source code and verification evidence override old prose. Never load
`docs/archive/planning/` as current behavior.

## Product truth

Arche is a personal project-vault and scaffold CLI. It is meant to start
serious projects quickly while generating context that keeps later agentic
coding grounded.

Current promises the site may make:

- Bun is the default package manager and pnpm is first-class.
- Generated projects can include canonical agent context: `AGENTS.md`,
  `CLAUDE.md -> AGENTS.md`, `.docs/`, `.plans/`, and `arche.json`.
- TypeScript fullstack, Rust API, Rust-backed fullstack, and Solana foundations
  exist as generated shapes.
- Package scopes in generated monorepos derive from the project name.
- CI/package/release foundations exist in this source repo.

Claims the site must not make:

- Do not call a preset **Stable** unless `presetHasStableEvidence` passes in `packages/registry` (the site reads the same registry as the CLI).
- Do not use **Production Ready** or similar adjectives — use matrix-backed support labels only.
- Do not say remote Turborepo caching is enabled by default. The repo supports
  CI cache credentials; they are not an automatic generated-project promise.
- Do not describe `.cursor/rules/` or `.claude/rules/` as generated context.
- Do not describe Arche as only a TypeScript/Express/Prisma template.

## Verified public-content drift

These are corrections, not optional design opinions:

| Location                                           | Current drift                                                | Required truth                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/page.tsx`                            | `Status: Production Ready`                                   | Use a factual label such as `Preset-led scaffolding` or `Validation tracked`.                                                                      |
| `apps/web/app/page.tsx`                            | Hero copy only promises the TypeScript monorepo              | Describe TypeScript, Rust, and Solana starting points without claiming stability.                                                                  |
| `apps/web/components/arche/feature-grid.tsx`       | Says remote caching is enabled by default                    | Say Turbo task orchestration/caching is configured; avoid remote-cache promise.                                                                    |
| `apps/web/components/arche/feature-grid.tsx`       | Says it ships Cursor rules                                   | Say it generates canonical agent context (`AGENTS.md`, `.docs/`, `.plans/`, `arche.json`).                                                         |
| `apps/web/components/arche/architecture-graph.tsx` | `Next.js 15 UI`                                              | Use `Next.js 16 web` or avoid version copy.                                                                                                        |
| `apps/web/app/families/page.tsx`                   | Claims `11 distinct starter templates` without support state | Present presets/capabilities and show evidence-backed status.                                                                                      |
| `apps/web/app/docs/page.tsx`                       | `Zero to Production` and published-command implication       | Frame this as getting started; distinguish repository development commands from eventual npm distribution.                                         |
| `apps/web/app/layout.tsx`                          | Metadata should reflect Arche’s full purpose and OG image    | Resolved: file-based `opengraph-image.tsx` + `twitter-image.tsx`; layout has no duplicate `og:image` arrays; static `og-image.png` is backup only. |
| `apps/web/public/brand/template-*`                 | Legacy Kitsune Stack template marks                          | Superseded by `arche-mark.svg`, `arche-logo.svg`, `og-image.png`; remove `template-*` when no longer referenced.                                   |

## Website information architecture

### Home

Primary job: tell a developer what Arche generates, show one truthful command,
and route them to presets or docs.

Required content:

- One concrete statement of purpose.
- A CLI example that uses an implemented command path.
- Three evidence anchors: agent context, package-manager support, and
  TypeScript/Rust/Solana preset breadth.
- A visible status sentence linked conceptually to verification, not a false
  green badge.

### Families / Presets

Primary job: help a user choose a starting point.

- Prefer preset rows or comparison bands over an unqualified generic family
  catalog.
- Surface the same status vocabulary as the registry:
  `Requires validation` and `Experimental` until evidence changes.
- Explain what each route generates, not just framework logos.

### Docs / CLI

Primary job: move from interest to a correct local command.

- Show development-from-source commands separately from eventual installed CLI
  commands.
- Explain generated agent context and scope rename behavior.
- Link to package-manager stance, verification, and deployment guidance.
- Never present repository maintenance utilities as commands automatically
  available inside every generated scaffold unless they are generated there.

### Examples / Showcase / Blog / Live

Secondary surfaces. They may demonstrate generated architecture, but must reuse
the same vocabulary and support status rules rather than inventing claims.

- **`/examples`** — static registry snippets; no live API calls.
- **`/live`** — real proof-run ladder + relay lobby against a running API; demo-only, bounded, and honest when offline. Distinct from `/examples`.

### Design lab

`/__design-lab` is personal preview space only. Keep it unlinked, noindexed,
excluded from sitemap, and clearly not authentication.

## Visual direction

The site is a brand surface for a technical tool. Use the direction already
approved in `PRODUCT.md`: precise, capable, intentional.

- Show useful artifacts: terminal output, generated file trees, a preset
  comparison, and verification language.
- Keep personality restrained: a precise Arche mark or small KitsuneKode
  signature, not mascot-led illustration.
- Avoid generic SaaS card grids, decorative gradient text, glass panels, and
  status theater.
- Motion must communicate sequence or state and respect reduced motion.
- Public surfaces target WCAG 2.2 AA.

Root `DESIGN.md` is now the compact active design source for public web work.
It keeps the current dark, squared, code-forward language, while removing
legacy `solar-*` and glass token families from the approved direction. Old
`apps/web/public/brand/template-*` files remain legacy assets until a real mark
replacement lands.

## Design-system decision gate

Before broad styling changes beyond the current system, the UI agent must:

1. Audit actual public pages, components, token files, fonts, and assets.
2. Propose a compact system: color strategy, theme, typography, surfaces,
   focus states, terminal treatment, status badges, and Arche mark direction.
3. Explicitly list old tokens/assets to delete or migrate.
4. Get direction approval.
5. Then update root `DESIGN.md` from the approved target system and implement
   against it.

The current approved baseline is dark, squared, grid-led, and code-forward.
It may be refined or replaced, but broad changes must update `DESIGN.md` and
keep public claims evidence-backed.

## OG and icon direction

Create an Arche mark that works at favicon size and social-card size.

- Candidate mark language: arch/gateway, seed/crystal, or precise monogram.
- Avoid fox/mascot-first branding unless extremely restrained.
- OG image should include `Arche`, a truthful line such as `Project scaffolds
with memory`, and a valid compact command.
- Track generated raster assets with a note describing prompt, date, and
  intended usage.
- Do not reference `/brand/og-image.png` in metadata until that asset exists.

## Implementation slices

### Slice W1: Truthful copy and metadata

Goal: remove claims that conflict with current implementation evidence.

Touch:

- `apps/web/app/page.tsx`
- `apps/web/components/arche/feature-grid.tsx`
- `apps/web/components/arche/architecture-graph.tsx`
- `apps/web/app/families/page.tsx`
- `apps/web/app/docs/page.tsx`
- `apps/web/app/docs/cli/page.tsx`
- `apps/web/app/layout.tsx`

Do not redesign the whole visual system in this slice. Add focused tests or
content assertions for public support/status wording where practical.

Verify:

```bash
bun test apps/web/app/route-discovery.test.ts
bun run --cwd apps/web lint
bun run --cwd apps/web check-types
bun run build:docs
```

### Slice W2: Approved design system and brand assets

Goal: turn approved direction into tokens and assets, without preserving stale
template branding.

Touch after visual approval:

- `DESIGN.md` (new canonical approved visual system)
- `packages/ui/src/styles/globals.css`
- `apps/web/public/brand/*`
- `apps/web/app/icon.svg`
- `apps/web/app/apple-icon.png`
- `apps/web/app/layout.tsx`

Require a real OG asset before metadata references it. Remove legacy
`template-*`, unused `solar-*`, and unused glass tokens only once replacements
are wired and verified.

### Slice W3: Landing hierarchy implementation

Goal: make the home page communicate the product in one scan.

Touch:

- `apps/web/app/page.tsx`
- `apps/web/components/arche/navbar.tsx`
- `apps/web/components/arche/animated-terminal.tsx`
- `apps/web/components/arche/feature-grid.tsx`
- `apps/web/components/arche/architecture-graph.tsx`

Keep the hero evidence-led: command, output shape, and status clarity. Do not
turn every claim into another identical feature card.

### Slice W4: Preset and docs experience

Goal: make selection and usage documentation match the CLI registry.

Touch:

- `apps/web/app/families/page.tsx`
- `apps/web/components/arche/family-table.tsx`
- `apps/web/app/docs/**`
- `apps/web/components/arche/command-table.tsx`
- `apps/web/components/arche/stack-diagram.tsx`

Prefer data derived from, or directly synchronized with, the CLI support model
over handwritten parallel claims. At minimum, add tests that fail when the
public labels contradict the internal verification vocabulary.

### Slice W5: Polish and release check

Goal: finish responsive, accessibility, SEO, and content validation after
substantive pages are stable.

- Verify keyboard navigation and reduced motion.
- Check compact/mobile navigation and long command overflow.
- Audit metadata, social previews, robots, and sitemap.
- Build docs and run repo verification before committing.

## UI-agent operating contract

- Edit only the files named by the current slice unless a dependency is
  necessary and reported.
- Do not modify CLI generation, support status, or verification evidence to
  make website wording easier.
- If website copy and `.docs/product/verification-matrix.md` disagree, fix the
  website copy.
- Preserve the hidden-design-lab discovery controls.
- Add tests for claim-bearing or route-discovery behavior before broad visual
  refinement.
- Use scoped commits, one finished slice per commit.

## Paste-ready UI agent brief

```text
Work on Arche public web Slice W1 only: truthful copy and metadata.

Read first:
- AGENTS.md
- PRODUCT.md
- apps/web/AGENTS.md
- .docs/product/web-brand-ui-brief.md
- .docs/product/verification-matrix.md

Allowed files:
- apps/web/app/page.tsx
- apps/web/components/arche/feature-grid.tsx
- apps/web/components/arche/architecture-graph.tsx
- apps/web/app/families/page.tsx
- apps/web/app/docs/page.tsx
- apps/web/app/docs/cli/page.tsx
- apps/web/app/layout.tsx
- focused apps/web tests if required

Do:
- remove unsupported Production Ready/Stable claims
- describe TypeScript, Rust, and Solana foundations truthfully
- correct stale generated-context, Turbo cache, and Next.js version copy
- avoid pointing metadata at a missing OG asset

Do not:
- redesign the visual system
- edit CLI behavior, registry status, or verification evidence
- expose or link /__design-lab

Verify:
- bun test apps/web/app/route-discovery.test.ts
- bun run --cwd apps/web lint
- bun run --cwd apps/web check-types
- bun run build:docs

Report changed files, corrected claims, verification output, and what remains
for Slice W2.
```

## Completion checklist

- Public status claims agree with the verification matrix.
- Commands shown are actually implemented or explicitly labeled as future
  publication usage.
- The generated agent-context story matches generated files.
- No hidden route becomes discoverable through navigation or sitemap.
- A final visual system is written only after its direction is approved.
- Docs build, web lint/typecheck, route-discovery tests, and repo doctor pass.
