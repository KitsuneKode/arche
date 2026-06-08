> **Historical audit (2026-03).** Superseded by the combo-matrix verifier and [template-variants.md](../template-variants.md). Do not treat as current behavior.

# Arche CLI — Staff-Engineer Audit & Remediation Plan

> Generated from end-to-end testing of every scaffold variant, runtime probes
> of generated servers, and a staff-level review of `apps/cli` architecture.
> See [docs/cli-development.md](./cli-development.md) and
> [docs/template-variants.md](./template-variants.md) for the existing public docs.

---

## 1. Executive summary

The CLI's **scaffolding architecture is solid and the default
`fullstack` (Express + Prisma + Postgres + Better Auth) path is staff-grade**.
The server starts, tRPC procedures run, Better Auth sessions resolve,
`protectedProcedure` returns 401 correctly, Zod input validation fires,
and the timing middleware logs.

But **5 of 11 generated variants are broken at scaffold time**, the **web
app has no React Query integration** (the single biggest gap), and the
**MCP server, recipe schema, `add` subcommand, and `planScaffold` dry-run
are all partially wired dead code** that should either be completed or
deleted.

The 298 unit tests pass because they assert file presence and string
content — they never run `bun install`, `tsc --noEmit`, or `bun run build`
on a generated project. Adding one end-to-end smoke test would have caught
all five broken variants.

### Build matrix (verified)

| Family × Option                                  | `bun install` | `check-types`                         | `lint`             | `build` | Verdict                                     |
| ------------------------------------------------ | ------------- | ------------------------------------- | ------------------ | ------- | ------------------------------------------- |
| `fullstack` (pg + prisma + express)              | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `fullstack --backend=hono-bun`                   | ✅            | ✅                                    | ✅                 | ✅      | **Green** (combo matrix CI)                 |
| `fullstack --orm=drizzle`                        | ✅            | ✅                                    | ✅                 | ✅      | **Green** (combo matrix CI)                 |
| `fullstack --database=sqlite`                    | ✅            | ✅                                    | ✅                 | ✅      | **Green** (Prisma 7 better-sqlite3 adapter) |
| `fullstack --backend=rust-axum` (`services/api`) | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `fullstack --worker`                             | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `rust`                                           | n/a           | ✅ (`cargo check`, 8 dead-code warns) | n/a                | ✅      | **Green**                                   |
| `rust-fullstack` (preset)                        | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `convex-product` (preset)                        | ✅            | ✅                                    | ❌ (next-env.d.ts) | ✅      | **Lint false-positive**                     |
| `polyglot`                                       | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `next`                                           | ✅            | ✅                                    | ❌ (next-env.d.ts) | ✅      | **Lint false-positive**                     |
| `backend`                                        | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |
| `lib` / `cli` / `worker` / `mobile`              | ✅            | ✅                                    | ✅                 | ✅      | **Green**                                   |

### Runtime probe of the default path (verified)

| Request                                                       | Result                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /health`                                                 | `200`/`503` depending on DB; returns `{status, database}`                 |
| `GET /`                                                       | `200` with service metadata, links to `/health`, `/api/trpc`, `/api/auth` |
| `GET /api/trpc/hello?input={"json":{"name":"Test"}}`          | `200` `{"result":{"data":{"json":"Hi Test from TRPC"}}}` ✅               |
| `GET /api/auth/get-session`                                   | `200 null` (no session cookie) ✅                                         |
| `GET /api/trpc/auth.getSecretMessage` (protected, no session) | `401 UNAUTHORIZED` ✅                                                     |
| `POST /api/trpc/post.create` (protected, no session)          | `401 UNAUTHORIZED` ✅                                                     |

The tRPC procedures, the `protectedProcedure` middleware, Better Auth's
session lookup, the Zod input validation, and the timing middleware all
work as designed.

### Web app — what the scaffold does NOT have

- ❌ No `@tanstack/react-query`
- ❌ No `@trpc/react-query` (only `@trpc/client`)
- ❌ No `<TRPCProvider>` or `<QueryClientProvider>`
- ❌ No React hooks for tRPC (`trpc.hello.useQuery` etc.)
- ❌ No SSR/RSC data hydration (no `HydrationBoundary`, no `prefetch`)
- ❌ No React Query devtools
- ❌ No `authClient` wiring in any page

The web app uses raw `useEffect` + `useState` calling a plain
`createTRPCClient`. Users will reach for `trpc.hello.useQuery` and find
the import doesn't exist.

---

## 2. Findings — severity ranked

### 🔴 P0 — Scaffolds that produce non-functional projects

#### P0-1. Hono scaffold is incomplete (`--backend=hono-bun`)

**Repro:** `bunx arche create foo --family=fullstack --backend=hono-bun --yes`

**Symptoms** (all reproduced):

- `apps/server/src/server.ts` rewritten to `import { config } from './utils/config'` and
  `import { logger } from './utils/logger'` — but neither file is created.
  Build fails: `error: Could not resolve: "./utils/config"`.
- The Hono-rewritten `trpc.ts` does
  `import { logger } from '@arche-template/backend-common/logger'`, but that
  file exports `createLogger` and `backendLogger`, not `logger`. Typecheck fails:
  `error TS2305: Module '"@arche-template/backend-common/logger"' has no exported member 'logger'`.
- The Express-only `trpc.routes.ts` is **not deleted**. It still does
  `import { Router } from 'express'`. The Hono `package.json` has no
  `express` dep, so typecheck fails:
  `error TS2307: Cannot find module 'express'`.
- `vercel-handler.ts` uses `import.meta.require` (a Vite-specific escape
  hatch). Not supported in Bun or Hono runtime.
- The Hono `trpcContextFetch` imports `fromNodeHeaders` from
  `better-auth/node` but never calls it — dead import copied from
  the Express version.

**Root cause:** `applyBackendTransform` in
`apps/cli/src/lib/generators/backend.ts` rewrites `app.ts` and `server.ts`
to a Hono shape but does not delete `trpc.routes.ts`, does not delete
the unused `vercel-handler.ts`, and never creates the `./utils/*` shims
it imports.

**Fix sketch:**

```ts
// In applyBackendTransform for hono-bun branch:
await rm(join(destinationDir, serverDir, 'src/modules/trpc/trpc.routes.ts'))
await rm(join(destinationDir, serverDir, 'src/vercel-handler.ts'))
await writeFile_(
  join(destinationDir, serverDir, 'src/utils/config.ts'),
  `export { env as config } from '../common/env.js'`,
)
await writeFile_(
  join(destinationDir, serverDir, 'src/utils/logger.ts'),
  `export { logger } from '../common/logger.js'`,
)
```

And fix the `trpcContextFetch` to use web-standard headers only (drop
`fromNodeHeaders`), and import the logger from the local `common/logger.ts`
that already does the aliasing.

#### P0-2. Drizzle scaffold rewrites routers but leaves services on Prisma

**Repro:** `bunx arche create foo --family=fullstack --orm=drizzle --yes`

**Symptoms:**

- The transform rewrites:
  - `packages/store/src/index.ts` → exports `db` (correct)
  - `packages/auth/src/index.ts` → uses `drizzleAdapter` (correct)
  - `apps/server/src/modules/{post,chat,user}/*.trpc.ts` → uses
    `db.query.X` (correct, including `with: { author: true }` relations)
  - `packages/store/package.json` → adds `drizzle-orm` (correct)
- But it never touches:
  - `apps/server/src/modules/post/post.repository.ts`
  - `apps/server/src/modules/post/post.service.ts`
  - `apps/server/src/modules/chat/chat.repository.ts`
  - `apps/server/src/modules/user/user.repository.ts`
  - `packages/store/src/scripts/seed.ts`

All of those still do `import { prisma } from '../../db/index.js'` and
call `prisma.X.method()`. So at runtime, `chatRepository.findRecentMessages()`
becomes `prisma.message.findMany(...)` where `prisma` is `null` (Drizzle
mode) → `TypeError: Cannot read properties of null (reading 'findMany')`.

Additionally, the server's `package.json` is not updated to add
`drizzle-orm` as a direct dep, so `bun build` fails:
`error: Could not resolve: "drizzle-orm" at apps/server/src/modules/post/post.trpc.ts:4`.

**Root cause:** `applyOrmTransform` in
`apps/cli/src/lib/generators/orm.ts` only modifies the `.trpc.ts` files
but not the service/repository layer. The Drizzle path is half-finished.

**Fix sketch:** Extend `applyOrmTransform` to:

1. Rewrite `*.service.ts` and `*.repository.ts` to use Drizzle's RQB
   (`db.query.X.findMany({ with: { author: true } })`).
2. Rewrite `packages/store/src/scripts/seed.ts` to use `db.insert(...).values(...)`.
3. Add `drizzle-orm` to `apps/server/package.json#dependencies`.

#### P0-3. SQLite / MongoDB transforms: `new PrismaClient()` without the required adapter

**Repro:** `--database=sqlite` and `--database=mongodb`

**Symptoms (both reproduced):**

```
src/index.ts(9,3): error TS2554: Expected 1 arguments, but got 0.
new PrismaClient()
       ^
```

The pinned `prisma@7.8.0` (and `@prisma/client@7.8.0`) **requires** the
constructor to receive an adapter. The default Postgres path uses
`new PrismaPg(...)`; SQLite and MongoDB paths must pass an adapter too,
but they don't.

The `applyDatabaseTransform` flow:

- `mongoAuthPatch` and `sqliteAuthPatch` write the new auth file but do
  not write a new store index that wires a driver.
- The `mongoStoreIndex()` and `sqliteStoreIndex()` helpers in
  `database.ts` are defined but never called.

**Root cause:** The transforms are incomplete. The `database.ts` file
defines the right `index.ts` writers but the dispatch never calls them.

**Fix sketch:** In `applyDatabaseTransform`:

- `sqlite` branch: also call
  `await writeFile_(join(destinationDir, 'packages/store/src/index.ts'), sqliteStoreIndex())`.
- `mongodb` branch: write a new `packages/store/src/index.ts` that
  uses the Prisma MongoDB driver adapter.

Add the adapter deps (`@prisma/adapter-better-sqlite3` for SQLite,
`@prisma/adapter-mongodb` for Mongo) to `packages/store/package.json`.

#### P0-4. MCP server speaks before it's asked to

**Repro:** start the server with `bunx arche mcp` and connect from any
MCP client.

**Symptoms:** Server process starts but no tools list ever
materializes. JSON-RPC `Method not found: notifications/initialized` is
returned for the `initialized` notification, which is wrong — JSON-RPC
notifications must not return responses.

`startMcpServer` in `src/mcp.ts:242-254`:

```ts
export function startMcpServer(): void {
  const rl = createInterface(...)
  // Send initialize response
  send({ jsonrpc: '2.0', id: null, result: { protocolVersion: '2024-11-05', … } })
  rl.on('line', async (line) => {
    ...
    switch (request.method) {
      case 'initialize': break;  // ← no response
      case 'tools/list': handleToolsList(id)
      case 'tools/call': ...
      case 'notifications/initialized': break;  // ← falls through to default
      default: rpcError(id, -32601, `Method not found: ${request.method}`)
    }
  })
}
```

The MCP protocol requires: client → `initialize` request → server →
`initialize` response → client → `notifications/initialized` → server
→ (no response). The current code sends the response _before_ the
client has asked, and the `initialize` case is `break` (no response).

**Fix sketch:** Gate the initial `send(...)` on the first `initialize`
request and respond in the `case 'initialize':` branch with the proper
protocol response (serverInfo, capabilities, protocolVersion). Don't
respond to `notifications/initialized`.

The 4 advertised tools (`arche_plan_project`, `arche_create_project`,
`arche_get_schema`, `arche_get_guidance`) also need:

- A `notifications/cancelled` handler (JSON-RPC spec)
- `createCaller`, `bundles`, `includeShowcase`, `includeWorker`,
  `includeDocker`, `includeCi`, `deployment`, `preset` in the
  `arche_create_project` input schema
- A `version` parameter that reads `package.json#version` instead of
  hard-coding `'0.1.0'`

### 🟠 P1 — Architecture issues the unit tests don't cover

#### P1-1. No React Query integration in any web app

The web app has only `createTRPCClient` (vanilla client). No React Query,
no providers, no React hooks. Users will reach for `trpc.hello.useQuery`
and find the import doesn't exist.

**Fix:** Add `@trpc/react-query` and `@tanstack/react-query` to
`apps/web/package.json`. Create `apps/web/trpc/Provider.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } }),
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: (op) => process.env.NODE_ENV === 'development' }),
        httpBatchLink({ url: `${getBaseUrl()}/api/trpc`, transformer: superjson }),
      ],
    }),
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

Wire into `apps/web/app/layout.tsx`. Rewrite `app/page.tsx` to use
`trpc.hello.useQuery({ name: 'Arche' })` instead of `useEffect` + state.

Optionally also add the RSC pattern with `createTRPCOptionsProxy` +
`prefetch` + `HydrationBoundary` for App Router-native data fetching
(server-rendered data, hydrated client cache, no waterfall).

This same pattern should be applied regardless of backend:

- tRPC + React → `createTRPCReact` + React Query
- Hono RPC + React → `hc<AppType>` + React Query
- OpenAPI-generated fetch + React → typed `fetch` + React Query
- Plain REST + React → `fetch` + React Query with hand-rolled zod

React Query is the constant. It's the abstraction that handles caching,
dedupe, refetching, invalidation, optimistic updates, SSR hydration,
and devtools. The scaffold has zero of it.

#### P1-2. Drizzle's `seed.ts` is not updated when ORM switches

`packages/store/src/scripts/seed.ts` still does
`import { prisma } from '../index'`. When the user picks `--orm=drizzle`,
this is broken. Same root cause as P0-2.

#### P1-3. `convex-env.d.ts` triggers lint failure on first `next build`

`apps/cli/src/templates/convex/.oxlintrc.json` enables the `import` plugin
but does not disable `import/no-unassigned-import`. Next.js auto-generates
`next-env.d.ts` with `import "./.next/types/routes.d.ts";` and the lint
fails. Same in the `next` template.

**Fix:** Add to all `.oxlintrc.json` (or a shared base):

```json
{
  "ignorePatterns": ["next-env.d.ts", ".next/**", "dist/**", "node_modules/**", "*.tsbuildinfo"]
}
```

#### P1-4. Convex template's `next-env.d.ts` lint failure is reproducible

`convex.json` uses `"functions": "convex/"` and `_generated/server.ts` is
a hand-rolled stub. The stub hides real Convex type errors until the
user runs `convex codegen`, which then reveals a wall of type errors.

**Fix:** Either:

- Remove `_generated/server.ts` from the template and let `convex codegen`
  create it on first `bun run dev` (clean), or
- Run `convex codegen` as part of `bun run check-types` so the real
  types are checked.

Also, `convex/auth.config.ts` has `providers: []` and `convex/auth.ts`
defines `syncUser`/`getCurrentUser` but doesn't export an `auth` config.
Add a JWT provider stub for Better Auth in the auth.config and the
`auth` config export in `convex/auth.ts`.

#### P1-5. Worker Redis connect is at import time

`apps/cli/src/templates/fullstack/apps/worker/src/redis/index.ts`:

```ts
import { redisClient } from '@arche-template/backend-common/redis'
export const redis = redisClient()
await redis.connect() // ← top-level await
```

This is wrong. It will:

- Try to connect at module import time (before the worker's
  `validateEnvironment` runs).
- Throw immediately if `REDIS_URL` is missing.
- Conflict with the server's pattern, which correctly does
  `connectRedis()` inside `main()`.

**Fix:** Mirror `apps/server/src/db/redis.ts` — export `redis` and a
`connectRedis()` function, and call `connectRedis()` from the worker's
`main()` after env validation.

#### P1-6. npm package manager support is false

`checkCompatibility` (schemas.ts:319) emits only a warning for
`packageManager === 'npm'`. `applyJavaScriptPackageManagerFoundation`
returns `[]` (i.e. no-op) for npm, leaving the bun `catalog:` references
in every package.json. `npm install` cannot resolve `catalog:` syntax.
End result: `--pm=npm` produces a non-installable project.

**Fix:** Either error (not warn) in `checkCompatibility`, or actually
implement npm support without catalog references.

#### P1-7. The recipe schema is dead code

`src/recipe/schema.ts` defines `RecipeSchema` with fields like
`runtime.web`, `capabilities.auth.provider`, etc. `src/recipe/replay.ts`
builds a command like `--auth`, `--db postgres-prisma`, `--web-runtime`,
`--deploy` — **none of which exist** in `parseArgs` or `index.ts`. The
CLI uses a completely different schema. `buildRecipeReplayCommand` is
exported but never invoked. The `archefiles.json` references "recipe" in
its version field but no template actually emits a `recipe.json`.

**Fix:** Delete `src/recipe/` (recommended — it's 50 lines of dead code
that confuses readers) or wire it into a real `--recipe` flag.

#### P1-8. `add <feature>` is half-implemented

`addFeature` supports `docker`, `ci`, `env`, `agent-docs`, `websocket`,
`worker`, `analytics`, `email`, `s3`, `payments`. Problems:

- `addWebsocketStub` writes a `package.json` with `^8` versions of
  packages not in the workspace catalog, and the package isn't added
  to `workspaces.packages` so `bun install` ignores it.
- `analytics`, `email`, `s3`, `payments` share `addFeatureStub` which
  hard-codes the package name as `@app/<feature>` but **never
  re-records the package into the root `package.json` workspaces**.
  `bun install` will not install the package.
- The `add` flow does not run any compatibility check before adding.
- The Arche `add` command doesn't apply `ensureDestinationAvailable`
  before writing — a user can run `add docker /` and write into `/`.

**Fix:**

1. Apply `ensureDestinationAvailable` before writing.
2. Add the generated package to root `package.json#workspaces.packages`.
3. Refuse incompatible combinations (e.g. `add docker` for `convex` family).
4. Use `fs/promises` (the rest of the CLI is async; `addFeature` is sync).

#### P1-9. `package.json#addons` is a vestigial field

`addons: z.array(AddonSchema).default([])` is in `ProjectConfigSchema`
but never read by the rest of the pipeline. The CLI's `add` subcommand
mutates `addons` via `configFile.choices.addons` instead.

**Fix:** Remove `addons` from the schema, or actually wire it through the
scaffold pipeline (e.g. spawn an additional `applyAddons` step).

#### P1-10. The `convex` template's `app/page.tsx` doesn't use `useQuery`

`app/page.tsx` is a static page. The AGENTS.md claims
"component data-fetching uses `useQuery` from `convex/react`" but the
scaffolded code doesn't demonstrate that pattern. Add a working example.

#### P1-11. `convex.json` is wrong format

Convex 1.x with Better Auth requires a JWT provider config in
`auth.config.ts`. With `providers: []` no auth verification happens.
The template should include a commented-out Better Auth example.

#### P1-12. `convex/_generated/server.ts` is a hand-rolled stub

```ts
export function query<TConfig extends FunctionConfig>(config: TConfig): TConfig {
  return config
}
export function mutation<TConfig extends FunctionConfig>(config: TConfig): TConfig {
  return config
}
```

This passes typecheck and `next build`, but the moment the user runs
`bunx convex dev`, Convex regenerates the file with the real types and
the user hits a wall of type errors that were hidden by the stub.

**Fix:** Either delete the file and let codegen create it, or run
`convex codegen` as part of `check-types`.

#### P1-13. `convex` AGENTS.md documents files that don't exist

Template files: `app/{layout,page,providers}.tsx`,
`convex/{schema,posts,auth,auth.config,_generated/server}.ts`.
AGENTS.md mentions `seed.ts` (not in template), `useQuery` (not in
template), and `lib/auth` (not in template). Update the doc.

#### P1-14. `database=none` with `family=fullstack` is accepted but crashes at runtime

The `applyDatabaseTransform`'s `none` branch sets `auth` to `null as never`.
`auth.api.getSession({ headers })` in `trpc.ts` becomes
`null.api.getSession(...)` → `TypeError` on first request. The server
crashes on first tRPC call.

**Fix:** Forbid the combination in `checkCompatibility`:
`errors.push('database=none with family=fullstack requires backend=none or a non-Better-Auth backend')`.

#### P1-15. `convex` `convex.json` and `_generated/server.ts` are listed in `.archefiles.json`

After running `convex codegen`, the real `_generated/` is written and
the stub is overwritten. Re-scaffolding into an existing convex project
would clobber the real generated types with the stub. Either:

- Remove `_generated/server.ts` from `.archefiles.json`, or
- Document that `arche` doesn't re-scaffold into an existing project.

### 🟡 P2 — Code quality and design issues

#### P2-1. `addons` field is wired but never populated

See P1-9. Remove or wire it.

#### P2-2. `npm install` warning but no error

See P1-6. Either error or actually implement.

#### P2-3. `engine.node: '>=20.0.0'` vs `import ... with { type: 'json' }`

`foundation.ts` uses `import workspaceCatalog from '../../../../../toolings/catalog/workspace-catalog.json' with { type: 'json' }`.
That import attribute requires Node 22+ or Bun. The package.json declares
`engines.node: '>=20.0.0'`. **Mismatched, and silently broken on Node 20–21**.

#### P2-4. `clean` script uses a fragile `find … | xargs rm -rf`

```json
"clean": "find . -name node_modules -o -name .next -o -name .turbo -o -name dist -type d -prune | xargs rm -rf"
```

The `find` has incorrect operator precedence. Works "by accident" on
GNU find; doesn't work on BSD/macOS find (default on macOS). Use
`find -E` or move to a JS script.

#### P2-5. `archive` cleanup target is named `readme` but unused as a marker

`buildCleanupTargets` always includes `'readme'` but
`applyGeneratedCleanup` has no `if (targets.has('readme'))` branch. The
`'readme'` cleanup target is purely informational. Either rename to
`'original-readme'` or remove from the schema.

#### P2-6. `npm` path doesn't write `packageManager: npm@…` to root

`applyJavaScriptPackageManagerFoundation` early-returns `[]` for `npm`, so
`corepack` won't enforce the npm version. The README also says nothing
about corepack for `npm`.

#### P2-7. `t._config.isDev` in `trpc.ts` is the right call but `NODE_ENV` should be sourced from t3-env

`trpc.ts:40` uses `if (t._config.isDev)` (tRPC's built-in dev detection).
Fine, but elsewhere the codebase reads `env.NODE_ENV` from t3-env. Be
consistent.

#### P2-8. `replaceWorkspaceScope` is text-only and dangerous

`original.replaceAll(oldScope, newScope)` rewrites the scope in any
text file matching `textFilePattern`. Risk: if a user creates a project
with `--preset=customize` and `--family=convex`, the scope stays
`@arche-template` and downstream consumers get a project whose
`package.json#name` is `@arche-template/...` while its own internal
imports are `@arche-template/...` — invisible breakage.

#### P2-9. `copyTemplate` swallows errors silently

```ts
} catch {
  // Skip files that don't exist in the source
}
```

If `manifest.include` references 30 files and 5 are missing, the user
gets a scaffold with 5 silently missing files. At minimum, log a
warning.

#### P2-10. EXCLUDED_FILES path matching is exact-string

`'apps/server/.env.example'` blocks the exact path. A path like
`apps/server/.env.test/` (a directory) or `apps/server/.env.example.bak`
would slip through.

#### P2-11. `addFeature` uses sync `fs`

The rest of `apps/cli/src/lib/` is async. `addFeature` is sync. Use
`fs/promises`.

#### P2-12. `printHistory` uses `console.log`, not `@clack/prompts`

Inconsistent UI. Should use the clack prompt primitives for consistency.

#### P2-13. `PKG_VERSION` is hard-coded three times

`src/index.ts:43`, `src/mcp.ts:252`, `src/mcp.ts:193` all hard-code
`'0.1.0'`. Read from `import('../package.json', { with: { type: 'json' } })`
or build-time env var.

#### P2-14. `--bundle=product,realtime` is allowed but the plan note shows only `product`

`bundles.filter((b) => b !== 'product')` in `reproducible.ts:49` works
but the plan note in `index.ts:869` says `Bundles: product` even when
the user picked `product,realtime`, so the user sees no confirmation of
`realtime`.

#### P2-15. `completions.ts` and `parseArgs` declare options in two places

They drift. Generate completions from a single source.

#### P2-16. `convex.json` references files that don't exist (`seed.ts`)

`convex.json` is fine. The AGENTS.md is wrong. Update the doc.

#### P2-17. `convex` template has no `engines.bun` or `engines.node`

Inconsistent with fullstack template which has `engines.node: '>=20'`.

#### P2-18. `archefiles.json` `include` for convex lists `_generated/server.ts`

Re-scaffolding would clobber real generated types. See P1-15.

#### P2-19. `archefiles.json` for convex is missing the README

The README exists in the template; check the manifest.

#### P2-20. The `convex` template's `app/page.tsx` has no test for `useQuery`

Add a working example.

#### P2-21. `convex` `convex.json` uses old `"functions": "convex/"` — correct for Convex 1.x, but no comment explaining

Add a comment.

#### P2-22. `convex` `auth.ts` exports `syncUser`/`getCurrentUser` but no `auth` config

Add the `auth` config export per Convex Better Auth integration docs.

#### P2-23. The `polyglot` template's `apps/worker/src/index.ts` is a stub

```ts
const QUEUE_NAME = 'default'
console.log(`Worker started, listening on queue: ${QUEUE_NAME}`)
// Add your job processing logic here
```

Builds, lints, and runs but does nothing. A user reading the README
will think they've got a working worker.

#### P2-24. The fullstack `package.json` `docker:run` script is missing the image name

```json
"docker:run": "docker run --rm -p 8080:8080 -e ENABLE_REDIS=false"
```

The user has to substitute the image name. Footgun.

#### P2-25. The `trpc` package re-exports server-internal symbols

```ts
export {
  appRouter,
  createCaller,
  createTRPCContext,
  createCallerFactory,
} from '@arche-template/server/trpc'
```

A web app that imports these will pull in `apps/server` and Express
into the web bundle. Leaky boundary.

#### P2-26. The Hono `trpcContextFetch` re-declares `fromNodeHeaders` (unused)

Dead import. See P0-1.

#### P2-27. The Drizzle `chatRouter` `with: { sender: true }` works

Verified — the `drizzleSchemaPostgres` includes the right `relations()`
calls. But the services that the router calls don't use Drizzle (P0-2).

#### P2-28. `convex` lint script is just `oxlint` without `-c` flag

Picks up defaults, doesn't use the `.oxlintrc.json`. Other templates
explicitly use `-c ../../.oxlintrc.json`.

#### P2-29. The fullstack `postinstall` runs `db:generate` which has a chicken-and-egg with `prisma generate`

```json
"postinstall": "bun run db:generate"
```

Works in practice but brittle. Add `^db:generate` to turbo's
`build.dependsOn`.

#### P2-30. `convex` template's `convex/_generated/server.ts` uses `Record<string, any>` types

Fine for a stub, but the real Convex types are stricter. Remove the
stub.

#### P2-31. The `cleanup-targets.ts` has an unused branch

The second `targets.add('worker')` is a no-op if the first already added
it. Use a single explicit statement.

#### P2-32. `index.ts:455-469` has duplicated `args.yes` ternaries

Refactor to single conditional flow.

#### P2-33. `printHelp` is 80 lines of raw text

Generate from a single `HELP_TEXT` constant.

#### P2-34. The `convex` template's `app/page.tsx` doesn't show the Convex useQuery pattern

Add a working example.

#### P2-35. The Drizzle `drizzleStoreIndexPostgres` uses `drizzle({ connection: process.env.DATABASE_URL!, schema })` (synchronous)

Drizzle docs show using `drizzle({ client: ..., schema })` with a
`Client` instance for better control. The `connection` shorthand is
fine but limits future flexibility.

#### P2-36. The `apps/server/src/modules/admin/admin.service.ts` creates `Queue` instances on every call

Should cache them like `serverAdapter` is cached.

#### P2-37. The fullstack `package.json` `engines.node: '>=20'` vs `engines.bun` not set

`engines.bun` is only set in `foundation.ts`, not in the template. After
scaffold, the user's `package.json#engines` should have `bun: ^1.3.11`.

#### P2-38. The MCP `version` is hard-coded

`serverInfo: { name: '@kitsunekode/arche', version: '0.1.0' }` should
read from `package.json`.

#### P2-39. `convex` `convex.json` should be versioned

Add `"version": "1"` to track schema changes.

#### P2-40. `archefiles.json` for fullstack includes `toolings/typescript-config` but the `toolings/` dir is missing from several other manifests

Inconsistent.

#### P2-41. The `archefiles.json` `exclude: [".vercel", "logs"]` is correct but the path-based exclude (`EXCLUDED_FILES`) duplicates it

Two-tier filter (manifest + path-based) is correct but the
`EXCLUDED_FILES` set duplicates the `SECRET_OR_LOCAL_ARTIFACT_SEGMENTS`
set.

#### P2-42. The `convex` template's `app/page.tsx` is a static page

For a Convex-backed app, this is a regression. Should use `useQuery`.

#### P2-43. The fullstack `postinstall` script isn't removed for `database=none`

If a user picks `database=none`, `prisma generate` will fail (no
schema). The postinstall should be removed.

#### P2-44. The `polyglot` `apps/api/src/app.ts` uses Express but is meant to be replaced

Should have a comment saying "this is the stub; replace with Hono or
Axum".

#### P2-45. The `add` subcommand doesn't print a `cd` hint or run the install

After `add`, the user has to know to re-run `bun install`.

#### P2-46. The Drizzle `drizzleConfigSqlite` uses `dbCredentials.url` from env, but `drizzleStoreIndexSqlite` uses `process.env.DATABASE_URL?.replace('file:', '')`

Two different env conventions in the same flow. Standardize on one.

#### P2-47. The `chatRepository` in Drizzle mode still references `prisma`

See P0-2.

#### P2-48. The `convex` `convex.json` uses `"functions": "convex/"` but the AGENTS.md uses `convex/`

Match. Fine.

#### P2-49. The `seed.ts` in `packages/store/src/scripts/seed.ts` uses `prisma` only

If the user picks Drizzle, this file is broken (P0-2). Even if they
keep Prisma, the seed uses prisma client directly, not the store's
exported `prisma` symbol. Inconsistent.

#### P2-50. The `chat.repository.ts` uses `prisma.message.findMany`

Same issue.

---

## 3. Runtime probe of the default `fullstack` path

### What works (verified end-to-end)

I started the server with `bun run src/server.ts` and made real HTTP
calls. Everything tRPC-side is real and the auth flow is real:

| Request                                              | Result                                                  | Verdict            |
| ---------------------------------------------------- | ------------------------------------------------------- | ------------------ |
| `GET /health`                                        | `{"status":"ERROR","database":"disconnected"}` HTTP 503 | ✅ Correct (no DB) |
| `GET /`                                              | Service metadata, links, hints                          | ✅                 |
| `GET /api/trpc/hello?input={"json":{"name":"Test"}}` | `{"result":{"data":{"json":"Hi Test from TRPC"}}}`      | ✅                 |
| `GET /api/auth/get-session`                          | `null`                                                  | ✅                 |
| `GET /api/trpc/auth.getSecretMessage` (protected)    | `401 UNAUTHORIZED`                                      | ✅                 |
| `POST /api/trpc/post.create` (protected)             | `401 UNAUTHORIZED`                                      | ✅                 |

The tRPC procedures, the `protectedProcedure` middleware, Better Auth's
session lookup, the Zod input validation, and the timing middleware all
work as designed.

### What the web app can't do today

- ❌ No `useQuery` from tRPC (no React Query)
- ❌ No `useMutation` from tRPC
- ❌ No caching across navigations
- ❌ No loading/error/empty state boilerplate
- ❌ No SSR data hydration
- ❌ No optimistic updates
- ❌ No `authClient` sign-in/sign-up flow
- ❌ No React Query devtools

This is the single biggest gap. The server is excellent; the web app is
left at a 2020-era `useEffect` + `useState` pattern.

---

## 4. Test gap

The current 298 tests verify:

- File presence (`expect(existsSync(...)).toBe(true)`)
- Content substrings (`expect(content).toContain('cargo run')`)
- Pure-function output (CI YAML, env files, deployment guides)
- Schemas accept/reject certain values

They do **not** verify:

- `bun install` succeeds
- `bun run check-types` succeeds
- `bun run lint` succeeds
- `bun run build` succeeds
- The generated server responds to `GET /health`
- tRPC procedures actually work
- The web app can call the API

The five broken combinations all fail at `check-types` or `build` —
checks the existing tests never run.

### Add this test (single highest-ROI addition)

```ts
// apps/cli/tests/e2e-scaffold.test.ts
import { describe, expect, it } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const VARIANTS = [
  { family: 'fullstack', flags: [] },
  { family: 'fullstack', flags: ['--backend=hono-bun'] },
  { family: 'fullstack', flags: ['--orm=drizzle'] },
  { family: 'fullstack', flags: ['--database=sqlite'] },
  { family: 'fullstack', flags: ['--database=mongodb'] },
  { family: 'fullstack', flags: ['--backend=rust-axum'] },
  { family: 'fullstack', flags: ['--worker'] },
  { family: 'rust', flags: [] },
  { family: 'polyglot', flags: [] },
  { family: 'next', flags: [] },
  { family: 'convex', flags: [] },
  { family: 'backend', flags: [] },
  { family: 'lib', flags: [] },
  { family: 'cli', flags: [] },
  { family: 'worker', flags: [] },
  { family: 'mobile', flags: [] },
]

describe('e2e scaffold (install + check-types + lint + build)', () => {
  for (const { family, flags } of VARIANTS) {
    it(`${family} ${flags.join(' ')} builds`, () => {
      const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-e2e-'))
      const projectName = `e2e-${family}-${flags[0]?.replace('--', '').replace('=', '-') ?? 'default'}`
      const dest = join(tmpRoot, projectName)

      try {
        // 1. Scaffold
        const scaffold = spawnSync(
          'bunx',
          [
            './src/index.ts',
            'create',
            projectName,
            family,
            '--yes',
            ...flags,
            '--dir',
            tmpRoot,
            '--no-install',
            '--no-git',
          ],
          { cwd: 'apps/cli', encoding: 'utf8' },
        )
        expect(scaffold.status).toBe(0)

        // 2. Install
        if (family !== 'rust') {
          const install = spawnSync('bun', ['install'], { cwd: dest, encoding: 'utf8' })
          expect({ status: install.status, stderr: install.stderr }).toEqual({
            status: 0,
            stderr: expect.any(String), // 638 packages installed [Xs]
          })
        }

        // 3. Check types
        const typecheck = spawnSync(
          family === 'rust' ? 'cargo' : 'bunx',
          family === 'rust'
            ? ['check']
            : family === 'convex' ||
                family === 'next' ||
                family === 'mobile' ||
                family === 'lib' ||
                family === 'cli' ||
                family === 'worker' ||
                family === 'backend'
              ? ['tsc', '--noEmit']
              : ['turbo', 'run', 'check-types'],
          { cwd: dest, encoding: 'utf8' },
        )
        expect({ status: typecheck.status, stderr: typecheck.stderr }).toEqual({
          status: 0,
          stderr: expect.any(String),
        })

        // 4. Lint
        const lint = spawnSync(
          family === 'rust' ? 'cargo' : 'bunx',
          family === 'rust' ? ['clippy', '--', '-D', 'warnings'] : ['oxlint', '.'],
          { cwd: dest, encoding: 'utf8' },
        )
        // Allow lint failures on templates that don't have ignorePatterns set up
        if (family === 'convex' || family === 'next') {
          // Known issue: next-env.d.ts triggers lint failure
        } else {
          expect({ status: lint.status, stderr: lint.stderr }).toEqual({
            status: 0,
            stderr: expect.any(String),
          })
        }

        // 5. Build
        if (family === 'rust') {
          const cargo = spawnSync('cargo', ['build', '--release'], { cwd: dest, encoding: 'utf8' })
          expect({ status: cargo.status, stderr: cargo.stderr }).toEqual({
            status: 0,
            stderr: expect.any(String),
          })
        } else if (
          family !== 'mobile' &&
          family !== 'lib' &&
          family !== 'cli' &&
          family !== 'worker'
        ) {
          const build = spawnSync('bunx', ['turbo', 'run', 'build'], {
            cwd: dest,
            encoding: 'utf8',
          })
          expect({ status: build.status, stderr: build.stderr }).toEqual({
            status: 0,
            stderr: expect.any(String),
          })
        }
      } finally {
        rmSync(tmpRoot, { recursive: true, force: true })
      }
    }, 600_000) // 10 min timeout per variant
  }
})
```

This single test would have caught all five broken variants and would
now serve as a regression net.

---

## 5. Remediation plan

### Phase 1 — Make every scaffold actually work (P0)

**Owner: CLI team. Estimated: 2-3 days.**

1. **Fix the Hono transform** (P0-1) in
   `apps/cli/src/lib/generators/backend.ts`:
   - Delete `trpc.routes.ts` and `vercel-handler.ts` for the Hono path
   - Create `src/utils/config.ts` and `src/utils/logger.ts` (or rewrite
     `server.ts` to use the existing `common/logger.ts` path)
   - Fix the `logger` import in `trpcContextFetch`
   - Remove the unused `fromNodeHeaders` import

2. **Fix the Drizzle transform** (P0-2) in
   `apps/cli/src/lib/generators/orm.ts`:
   - Rewrite `*.repository.ts` and `*.service.ts` to use Drizzle's RQB
   - Rewrite `seed.ts` to use `db.insert(...).values(...)`
   - Add `drizzle-orm` to `apps/server/package.json#dependencies`

3. **Fix the SQLite/MongoDB transforms** (P0-3) in
   `apps/cli/src/lib/generators/database.ts`:
   - Call the existing `sqliteStoreIndex()` helper to write a
     Prisma-7-compatible `packages/store/src/index.ts` for SQLite
   - Write a new `mongoStoreIndex()` that uses the Prisma MongoDB driver
     adapter
   - Add the adapter deps to `packages/store/package.json`

4. **Fix the MCP server** (P0-4) in `src/mcp.ts`:
   - Gate the initial `send(...)` on the first `initialize` request
   - Don't respond to `notifications/initialized`
   - Add a `notifications/cancelled` handler
   - Read `version` from `package.json`

5. **Add the e2e scaffold test** (Section 4) to `apps/cli/tests/`.

6. **Run the e2e test in CI** as part of `bun run ci:min`.

### Phase 2 — Add the missing primitives (P1)

**Owner: CLI + web team. Estimated: 3-5 days.**

7. **Add React Query + tRPC React integration** (P1-1):
   - Add `@trpc/react-query` and `@tanstack/react-query` to
     `apps/web/package.json`
   - Create `apps/web/trpc/Provider.tsx` (client component) with
     `QueryClient` + `httpBatchLink`
   - Wire `TRPCProvider` into `apps/web/app/layout.tsx`
   - Rewrite `app/page.tsx` to use `trpc.X.useQuery` instead of `useEffect`
   - Optionally add the RSC pattern with `createTRPCOptionsProxy` +
     `prefetch` + `HydrationBoundary`

8. **Fix the worker Redis connect** (P1-5): move `await redis.connect()`
   out of top-level, mirror the server's pattern.

9. **Fix the Convex template** (P1-3, P1-4, P1-10, P1-11, P1-12, P1-13):
   - Add `ignorePatterns` to `.oxlintrc.json`
   - Remove the `_generated/server.ts` stub or wire it through
     `convex codegen`
   - Add a working `useQuery` example in `app/page.tsx`
   - Add JWT provider stub in `convex/auth.config.ts`
   - Export `auth` config in `convex/auth.ts`
   - Update AGENTS.md to match actual files

10. **Forbid `database=none` with `family=fullstack`** (P1-14): add
    error in `checkCompatibility`.

11. **Delete the recipe schema** (P1-7): dead code. Remove
    `src/recipe/replay.ts` and `src/recipe/schema.ts`.

12. **Fix the `add` subcommand** (P1-8): apply
    `ensureDestinationAvailable`, add the package to root workspaces,
    use `fs/promises`, refuse incompatible combinations.

13. **Decide on `addons` and `npm` support** (P1-9, P1-6): either
    wire them through or remove.

### Phase 3 — Architecture cleanup (P2)

**Owner: CLI team. Estimated: 1 week.**

14. **Cache BullMQ Queue instances in `admin.service.ts`** (P2-36).
15. **Replace `engines.node: '>=20.0.0'` with the actual minimum** (P2-3).
16. **Add `engines.bun` to the fullstack template's `package.json`** (P2-37).
17. **Standardize on `DATABASE_URL` for SQLite** (P2-46).
18. **Use `drizzle({ client, schema })` for the Postgres Drizzle path** (P2-35).
19. **Remove `convex/_generated/server.ts` from the archefiles manifest** (P1-15, P2-18).
20. **Move `clean` script to a JS file** (P2-4) for cross-platform.
21. **Fix `replaceWorkspaceScope` for `family=convex` cases** (P2-8).
22. **Log warnings in `copyTemplate` for missing manifest entries** (P2-9).
23. **Use `@clack/prompts` for `printHistory`** (P2-12).
24. **Read `PKG_VERSION` from `package.json` at build time** (P2-13).
25. **Generate completions from a single source of truth** (P2-15).
26. **Document the `family × preset` matrix in `apps/cli/AGENTS.md`** (no
    new code, just docs).
27. **Refactor `index.ts:455-469` to a single conditional flow** (P2-32).
28. **Generate `printHelp` from a constant** (P2-33).
29. **Tighten `EXCLUDED_FILES` matching** (P2-10).
30. **Update `chat.repository.ts` to use the same Prisma client symbol as `post.repository.ts`** (P2-50).
31. **Make `polyglot` `apps/worker/src/index.ts` a real worker** (P2-23).
32. **Document corepack for npm in the README** (P2-6).
33. **Add `engines.bun` to the fullstack template** (P2-37).
34. **Add `engines.bun` and `engines.node` to every non-monorepo template** (P2-17).
35. **Refactor `addFeature` to use `fs/promises`** (P2-11).
36. **Add `notices` for known template quirks** (e.g. next-env.d.ts lint
    failure, Drizzle service-layer rewrite).
37. **Add `engines` enforcement to turbo.json** so wrong-runtime installs fail.

### Phase 4 — Documentation

**Owner: Tech writer. Estimated: 1-2 days.**

38. **Update `docs/cli-development.md`** with the family × preset matrix.
39. **Update `docs/template-variants.md`** with the verified build matrix.
40. **Add `docs/architecture-decisions.md` entry for "no React Query
    in scaffold" → change to "React Query is the default client primitive"**.
41. **Document the service-api path (Rust/Go/Python) with OpenAPI codegen
    as the recommended typed-contract approach.**
42. **Document that the MCP server is currently in a pre-1.0 state
    with a known issue.** Or fix it first.

---

## 6. What is genuinely good (preserve)

- **Module-first architecture in `apps/server`**: routes →
  controller → service → repository → DTO/mapper/policy. Documented
  in AGENTS.md. Genuinely staff-level.
- **`tsc` exhaustive mode for the package graph**: `tsc --noEmit` runs
  at the root and in every workspace, orchestrated by turbo. Works.
- **`buildReproducibleCommand`** lives in one place, both the success
  outro and `arche.json` use it. Good.
- **`tryRecordHistory`**: best-effort, doesn't fail the scaffold if it
  can't write. Good failure mode.
- **`useGenerationSpinner` toggle** in `index.ts`: silently switches
  between spinner and non-spinner mode depending on whether `install`
  runs. Subtle but correct.
- **`shouldCopyPath` with manifest fallback**: two-tier filter
  (manifest + path-based) is a sensible layered defense.
- **`AGENTS.md` is generated, not copied**: each project gets a
  stack-specific AGENTS.md. Good.
- **`CLAUDE.md` → `AGENTS.md` symlink**: correct dual-emission for
  both Claude and opencode agents.
- **`replaceWorkspaceScope` runs only for families that need it**
  (`familySupportsRenameScope`). Good.
- **`apt-get install` + `rm -rf /var/lib/apt/lists/*` in
  `rustServiceDockerfile`**: standard, correct Docker hygiene.
- **`renderRustCi` uses `dtolnay/rust-toolchain@stable`**: correct
  toolchain pinning.
- **`pruneServiceApiFullstack`** correctly removes tRPC, auth, store,
  backend-common, common for the rust-axum service-api path — the
  most non-trivial bit of scaffolding done right.
- **`buildReadme`** handles every family and renders PM-aware dev
  commands.
- **The default Express+Prisma+Postgres server is rock solid at
  runtime.** I started it and probed it; tRPC works, auth works,
  protected procedures return 401, Zod validation fires.

---

## 7. The single highest-ROI change

**Add the e2e scaffold test (Section 4) and run it in CI.**

This single test would have caught all five P0 bugs. The current 298
tests pass with 100% green CI status while the CLI ships 5 broken
variants. The unit tests assert file presence and string content; the
e2e test would assert actual install + typecheck + lint + build
success.

```bash
# in .github/workflows/ci.yml (or a new workflow)
- name: e2e scaffold
  run: bun test apps/cli/tests/e2e-scaffold.test.ts
  timeout-minutes: 30
```

With this one test in place, the team can confidently refactor the
generators knowing the build matrix stays green.

---

## 8. Risk assessment

| Risk                                                                   | Severity | Mitigation                                           |
| ---------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| Phase 1 fix breaks other families                                      | High     | Add the e2e test first, fix under test               |
| React Query adds ~15KB to web bundle                                   | Low      | It's the standard, the user expects it               |
| Removing `convex/_generated/server.ts` breaks users' existing projects | Medium   | Document in changelog; ship as opt-in for v0.2       |
| Hono fix requires breaking change to web trpc client                   | Medium   | Behind a feature flag in the generator               |
| Removing the `recipe` schema breaks users reading the source           | Low      | Update `apps/cli/AGENTS.md` to say "no recipe layer" |
| Fixing `npm` support requires real work                                | Medium   | Punt to v0.3; error instead of warn for now          |

---

## 9. Acceptance criteria

The work in this document is complete when:

1. ✅ Every variant in the build matrix passes `bun install`,
   `check-types`, `lint`, and `build`.
2. ✅ The e2e scaffold test in `apps/cli/tests/` passes for all 16
   variants.
3. ✅ The web app's `package.json` lists `@trpc/react-query` and
   `@tanstack/react-query` as dependencies.
4. ✅ `apps/web/trpc/Provider.tsx` exists and is wired into the root
   layout.
5. ✅ `apps/web/app/page.tsx` uses `trpc.X.useQuery` (not `useEffect`).
6. ✅ The Hono scaffold builds and starts.
7. ✅ The Drizzle scaffold builds and starts.
8. ✅ The SQLite and MongoDB scaffolds typecheck.
9. ✅ The MCP server responds to a real `initialize` request.
10. ✅ The worker template's `redis/index.ts` does not connect at
    import time.
11. ✅ No dead code in `apps/cli/src/recipe/`.
12. ✅ The `add` subcommand refuses to write to dangerous destinations.
13. ✅ The `convex` template has a working `useQuery` example.
14. ✅ `oxlint` does not fail on auto-generated `next-env.d.ts`.

---

## 10. References

- [docs/cli-development.md](./cli-development.md) — existing CLI guide
- [docs/template-variants.md](./template-variants.md) — existing family matrix
- [docs/architecture.md](./architecture.md) — system architecture
- [docs/architecture-decisions.md](./architecture-decisions.md) — ADRs
- [apps/cli/AGENTS.md](../../apps/cli/AGENTS.md) — CLI internals
- [AGENTS.md](../../AGENTS.md) — repo entrypoint
- tRPC v11 docs (Context7 ID: `/trpc/trpc`)
- Next.js 16 App Router docs (Context7 ID: `/vercel/next.js`)
- Better Auth v1.6 docs (Context7 ID: `/better-auth/better-auth`)
- Prisma 7 docs (Context7 ID: `/prisma/prisma`)
- Drizzle ORM docs (Context7 ID: `/drizzle-team/drizzle-orm-docs`)
- Hono docs (Context7 ID: `/websites/hono_dev`)
- Model Context Protocol spec (Context7 ID:
  `/websites/modelcontextprotocol_io_specification_2025-06-18`)
- BullMQ docs (Context7 ID: `/taskforcesh/bullmq`)
- Oxlint docs (Context7 ID: `/websites/oxc_rs_guide_usage`)
