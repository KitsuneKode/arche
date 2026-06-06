# CI and docs — known gaps

Living checklist of what CI **does** cover vs what docs or release checklists still expect manually. Not archived planning — update when gaps close.

## Covered in GitHub Actions today

| Check                                                                                                            | Workflow                                     |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Format, lint, types, test, build, smoke web+CLI, pkg check, fullstack scaffold install/build, repo doctor strict | `ci.yml` → job **Verify**                    |
| Secret scan (push/PR + weekly)                                                                                   | `gitleaks.yml`                               |
| Generated preset structure (weekly)                                                                              | `verify-generated-weekly.yml`                |
| Changesets version PR / guarded publish                                                                          | `release.yml` (after CI push to `main` only) |

## Not in CI (run locally or add later)

| Item                                                         | Why it matters            | Today                                                                                     |
| ------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `verify:generated` with `--run=cargo-check` / `anchor-build` | Slow tool gates           | Manual per [publishing.md](./publishing.md); weekly job is structure-only for all presets |
| `verify:generated:fullstack` with `--pm=pnpm`                | pnpm fullstack build gate | CI runs bun only; run pnpm manually before release                                        |
| Playwright / E2E                                             | Full app flows            | [e2e-testing.md](./e2e-testing.md) is a **guide**; no Playwright config in this repo      |
| `bun run test:deploy`                                        | Live Render/Vercel smoke  | Opt-in; [deploy-smoke.md](./deploy-smoke.md)                                              |
| Performance / load workflows                                 | Baseline docs             | Example YAML in docs only — **not** in `.github/workflows/`                               |

## Open Graph assets

- **Primary:** Next file routes (`opengraph-image.tsx`, `twitter-image.tsx`) using `arche-mark.svg`.
- **Backup:** [`apps/web/public/brand/og-image.png`](../apps/web/public/brand/og-image.png) kept on disk; not listed in `layout` metadata (avoids duplicate `og:image` tags).
- **Reference board:** [`docs/assets/brand/arche-brand-kit.png`](../docs/assets/brand/arche-brand-kit.png).
- **Sync static OG:** `bun run brand:export-og` after changing mark or OG layout.

## Doc drift to avoid

- Do not claim CI runs `bun run ci` as a single script — the workflow runs steps explicitly with branch-aware Turbo flags.
- Do not claim Playwright runs in CI until a workflow and config exist.
- Scaffold-generated projects get their own `.github/workflows/ci.yml` from the CLI — not identical to this template repo.
