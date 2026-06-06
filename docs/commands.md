# Commands

## Repository development

- `bun install` - Install workspace dependencies and run postinstall generation.
- `bun dev` - Run all workspace dev tasks through Turbo.
- `bun run dev:web` - Run the Next.js app.
- `bun run dev:server` - Run the TypeScript API server.
- `bun run dev:worker` - Run the worker.
- `bun run dev:cli -- <args>` - Run the Arche CLI from source.

## CLI development

- `bun run dev:cli -- my-app --yes --dir=../projects` - Scaffold from source.
- `bun run dev:cli -- completion bash` - Print Bash completion.
- `bun run dev:cli -- completion zsh` - Print Zsh completion.
- `bun run build:cli` - Build `@kitsunekode/arche`.
- `bun run pkg:check` - Typecheck, lint, test, build, and npm-pack dry-run the CLI package.
- `bun run --cwd apps/cli pack:dry-run` - Build the CLI and inspect the npm package contents without publishing.
- `bun test apps/cli/tests` - Run CLI tests.
- `bun run --cwd apps/cli check-types` - Typecheck the CLI package.
- `bun run --cwd apps/cli lint` - Lint the CLI package.
- `bun run verify:generated` - Generate the curated preset matrix into temp dirs and verify structure without installing dependencies.
- `bun run verify:generated -- --preset=typescript-fullstack --pm=bun,pnpm` - Verify selected preset/package-manager structure.
- `bun run verify:generated -- --preset=solana-product --run=cargo-check,anchor-build` - Opt into slower generated-project tool gates.

## Web development

- `bun run --cwd apps/web mdx:generate` - Regenerate Fumadocs `.source/` (also runs on `postinstall` and before `check-types`).
- `bun run --cwd apps/web check-types` - Typecheck the web app.
- `bun run --cwd apps/web lint` - Lint the web app.
- `bun test apps/web/app/route-discovery.test.ts` - Check hidden design-lab route discovery controls.

## Build and checks

- `bun run ci:min` - Minimum pre-push ladder: format, lint/types, test, **build** (all packages).
- `bun run ci:min:affected` - Same minimum ladder with Turbo `--affected` (needs a valid merge base).
- `bun run ci` - Full local CI ladder (format, turbo lint/types, test, build, pkg:check, repo doctor).
- `bun run ci:affected` - Same ladder with Turbo `--affected` (needs a valid merge base).
- `bun run secret-scan` - Full-repo gitleaks scan (requires gitleaks CLI).
- `bun run secret-scan:staged` - Scan staged files only (same as pre-commit).
- `SKIP_GITLEAKS=1` - Emergency pre-commit skip for staged gitleaks only (see [security-secrets.md](./security-secrets.md)).
- `bun run brand:export-og` - Regenerate `apps/web/public/brand/og-image.png` from `/opengraph-image`.
- `bun run build` - Build the workspace.
- `bun run build:affected` - Build changed packages and dependents through Turbo.
- `bun run build:docs` - Build the web/docs app.
- `bun run lint` - Lint packages through Turbo.
- `bun run lint:affected` - Lint changed packages and dependents through Turbo.
- `bun run check-types` - Run workspace type checks.
- `bun run check-types:affected` - Typecheck changed packages and dependents through Turbo.
- `bun run format` - Format with Oxfmt.
- `bun run format:check` - Check formatting.
- `bun run repo:doctor` - Audit stale scaffolding, broken exports, placeholder files, and doc drift.
- `bun run repo:doctor:strict` - Fail on warnings and errors for CI or pre-release checks.
- `bun run repo:doctor:ci` - Alias for strict doctor (matches CI).
- `bun run verify:generated` - Fast generated-project structure verification for the preset matrix.

## Database

- `bun run db:generate` - Generate Prisma client.
- `bun run db:migrate` - Run Prisma migrate dev via Turbo.
- `bun run db:seed` - Seed the database.
- `bun run db:studio` - Open Prisma Studio.

## Template operations

- `bun run rename-scope:dry` - Preview package-name replacement.
- `bun run rename-scope` - Apply scope rename across the repo.
- `bun run rename-scope:verbose` - Apply scope rename with verbose logging.
- `bun toolings/scripts/rename-scope.ts --from @arche-template --to @acme` - Explicitly rename one internal scope to another.
- `bun run template:clean:dry` - Preview cleanup for showcase code and optional workspaces.
- `bun run template:clean` - Apply the recommended cleanup plan.

## Deployment smoke

- `bun run test:deploy` - Live API smoke against the default Render target.
- `bun run test:deploy:all` - Smoke Render and template Vercel URLs where accessible.

These commands hit live services only when the required environment variables
are set and deployment protection allows access.

## Commit validation

- `bun run commit:check` - Validate the most recent commit message.
- `bun run changeset` - Create a Changesets release note for `@kitsunekode/arche`.
- `bun run changeset:status` - Check pending changesets.
- `bun run version:packages` - Apply Changesets version updates.
- `bun run release` - Guarded publish entrypoint; skips npm unless trusted publishing is enabled.

Preferred format:

```text
type(scope): short imperative summary
```

Example:

```text
feat(cli): add solana program preset
```
