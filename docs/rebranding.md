# Rebranding checklist (Arche / KitsuneKode)

Use this when aligning display branding without breaking workspace package names.

## Brand (canonical)

| Item        | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| Product     | **Arche** — "The beginning of every project"                         |
| CLI         | `npx @kitsunekode/arche create` / `@kitsunekode/arche`               |
| Site        | [arche.kitsunelabs.xyz](https://arche.kitsunelabs.xyz)               |
| Portfolio   | [kitsunekode.in](https://kitsunekode.in)                             |
| GitHub repo | [github.com/KitsuneKode/arche](https://github.com/KitsuneKode/arche) |
| Vercel web  | `arche` → `https://arche-kitsunekode.vercel.app`                     |
| Vercel API  | `arche-api` → `https://arche-api-kitsunekode.vercel.app`             |

## Recommendation

Repository is **`KitsuneKode/arche`**. Use **`arche-cli`** only if the web/docs
app later moves into a separate repo.

Suggested GitHub description:

> Personal project-vault and scaffold CLI for TypeScript monorepos, Rust
> services, Solana apps, and agent-ready project context.

Suggested topics:

```text
cli, scaffolding, turborepo, bun, pnpm, nextjs, rust, solana, better-auth, trpc, project-template
```

## Safe to change (done or ongoing)

- [x] README title and tagline
- [x] `apps/web` metadata (`app/layout.tsx`), landing copy, navbar
- [x] CLI help (`apps/cli/src/index.ts`), `package.json` description for `@kitsunekode/arche`
- [x] Deployment hub and three-path guides
- [x] `apps/server` root JSON title (`Arche API`)
- [x] Generated scaffold README / deployment text via CLI generators
- [x] `docs/README.md` intro

## Source of truth

| Item                     | Value                | Reason                                                                                              |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------- |
| Root `package.json` name | `arche-template`     | Canonical source-template package name. Generated projects replace it with the chosen project slug. |
| Internal workspace scope | `@arche-template/*`  | Source template packages. Generated projects are renamed by the CLI to `@<project-name>/*`.         |
| Public CLI package       | `@kitsunekode/arche` | User-facing npm package. Keep this separate from source template workspaces.                        |
| GitHub repo target       | `kitsunekode/arche`  | Recommended canonical repo name for docs, package metadata, and site links.                         |

## Package-scope rule

Keep **`@arche-template/*`** inside this source repo. Keep `@kitsunekode/arche`
reserved for the published CLI. This makes the difference clear:

- `@kitsunekode/arche` - user-facing npm package.
- `@arche-template/web`, `@arche-template/server`, etc. - source template
  workspaces inside this repo.
- `@my-app/web`, `@my-app/server`, etc. - generated project workspaces after
  `rename-scope` runs.

`rename-scope` defaults to migrating `@arche-template/*` to the root
`package.json` name. It also accepts explicit flags:

```bash
bun toolings/scripts/rename-scope.ts --from @arche-template --to @my-app
```

## GitHub brand uploads (one-time)

After `bun run brand:export`:

| File                             | GitHub setting                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `docs/assets/arche-mark-512.png` | Repository → **Settings** → **General** → **Social preview** / profile image (512×512)  |
| `docs/assets/social-preview.png` | Repository → **Settings** → **General** → **Social preview** (1280×640 Open Graph card) |

The README hero uses `docs/assets/readme-banner.png` (committed; no dashboard upload).

Canonical SVG: `apps/web/public/brand/arche-mark.svg` (matches navbar `BrandMark`).

## Optional follow-ups

1. [x] GitHub repo renamed to `arche`; description and homepage URL set.
2. [ ] Rename Vercel projects `template-web` → `arche`, `template-server` →
       `arche-api`; update env URLs per [deployment-vercel-arche.md](./deployment-vercel-arche.md).
3. [x] Arche mark assets in `apps/web/public/brand/` and `docs/assets/`.
4. [x] OG + export pipeline (`bun run brand:export`).
5. Set production `NEXT_PUBLIC_SITE_*` on Vercel for [arche.kitsunelabs.xyz](https://arche.kitsunelabs.xyz).
6. Replace remaining `template-nextjs` strings in archive docs only when archive
   cleanup becomes worth the noise.

## Verify after edits

```bash
bun run repo:doctor
bun test
bun run format:check
```
