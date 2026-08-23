# Product

## Register

brand

## Users

Arche is for KitsuneKode and developers with similar habits: people starting
real TypeScript, Convex, Rust, or Solana projects who want dependable foundations and
use coding agents as part of daily implementation.

They arrive wanting to understand what can be generated today, select a
credible starting point quickly, and trust that the resulting project explains
itself to both humans and agents.

## Product Purpose

Arche is a personal project-vault and scaffold CLI. It removes repeated setup
work by producing coherent workspace structure, package-manager metadata,
deployment guidance, and compact agent context (`AGENTS.md`, `.docs/`,
`.plans/`, and `arche.json`).

The public site exists to establish trust, explain the CLI, and make the
verified routes easy to evaluate. It must never sell an unverified preset as
production-ready.

Maintainer note: live dogfood code under `apps/*` and `packages/*` is canonical.
Refresh CLI templates with `bun run template:extract` (then
`bun run template:sync:check`) after shared runtime changes.

## Brand Personality

Precise, capable, intentional.

Arche should feel like well-made technical equipment: direct enough for daily
work, opinionated enough to be memorable, and calm enough to trust with a new
codebase.

## Anti-references

- Generic SaaS landing pages built from interchangeable rounded cards and
  decorative gradients.
- Terminal cosplay that replaces product evidence with noise.
- Claims such as "production ready" or "stable" before the verification matrix
  supports them.
- Mascot-first or novelty branding that obscures the serious scaffold tool.
- Documentation pages that advertise stale stacks, commands, or generated
  context.

## Design Principles

1. Show generated evidence: commands, project layouts, context files, and
   verification status explain Arche better than broad marketing claims.
2. Make capability status legible: verified, requires validation, and
   experimental routes must be visually distinct and factually accurate.
3. Keep the tool serious and personal: a small KitsuneKode signature is
   welcome, but reliability is the identity.
4. Prefer navigable documentation over context overload: each surface should
   lead to the next relevant fact instead of repeating every detail.
5. Treat the CLI and the website as one contract: wording must match source
   code, generated output, and the verification matrix.

## Accessibility & Inclusion

Target WCAG 2.2 AA for public surfaces. Preserve keyboard visibility, semantic
controls, readable contrast, reduced-motion behavior, responsive layouts, and
plain-language support labels. Motion may reinforce state or structure, but it
must not be required to understand content.
