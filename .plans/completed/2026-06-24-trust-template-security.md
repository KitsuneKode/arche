# Plan 023: Harden fullstack template demo API (auth, enumeration, drafts, admin)

> **Shipped**: 2026-06-24 via [trust-wave orchestration](./2026-06-24-trust-wave-orchestration.md). Verified: `bun test apps/cli/tests` 338 pass, `ci` green, fullstack template synced.

> **Executor instructions**: This template ships to generated projects — fix source AND generator output paths where duplicated.
>
> **Drift check**: `git diff --stat 9958c37..HEAD -- apps/server/src/modules/ packages/auth/ apps/web/trpc/ apps/cli/src/lib/generators/orm.ts apps/cli/src/templates/fullstack/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `9958c37`, 2026-06-24

## Why this matters

The fullstack template is a starting point many users deploy. Current demo endpoints leak user emails publicly, expose draft posts, leave Bull Board unauthenticated when Redis is on, misconfigure auth client baseURL for split deploy, and ship a `createUser` mutation that only looks up by email.

## Current state

Public user list:

```9:9:apps/server/src/modules/user/user.trpc.ts
  getAllUser: publicProcedure.query(() => userService.listAll()),
```

Broken createUser:

```11:13:apps/server/src/modules/user/user.trpc.ts
  createUser: protectedProcedure
    .input(createUserSchema)
    .mutation(async (opts) => userService.findByEmail(opts.input.email)),
```

Auth client uses web URL:

```12:14:packages/auth/src/client.ts
createAuthClient({ baseURL: env.NEXT_PUBLIC_APP_URL })
```

Bull Board unguarded: `apps/server/src/modules/admin/admin.routes.ts` mounted at `/admin/queues`.

Draft posts on public procedures: `apps/server/src/modules/post/post.trpc.ts` — verify no `published` filter.

Generator duplicates user router: `apps/cli/src/lib/generators/orm.ts` (~765+).

## Commands

| Purpose        | Command                                                               | Expected |
| -------------- | --------------------------------------------------------------------- | -------- |
| Server tests   | `bun test apps/server`                                                | pass     |
| Integration    | `bun run ci:min`                                                      | pass     |
| Generated sync | check if fullstack template copies from apps/server or generator only |

## Scope

**In scope**:

- `apps/server/src/modules/user/user.trpc.ts` + service/repository as needed
- `apps/server/src/modules/post/post.trpc.ts` + post.service/repository
- `apps/server/src/modules/admin/admin.routes.ts` + `app.ts` mount guard
- `packages/auth/src/client.ts` + `packages/auth/src/index.ts` (trustedOrigins if needed)
- `apps/server/src/vercel-handler.ts` — `validateEnvironment('server')`
- `apps/web/trpc/server.tsx` — credentials on httpLink OR document trpcCaller-only for RSC
- `apps/cli/src/lib/generators/orm.ts` — mirror fixes in generated Drizzle scaffold
- `apps/cli/src/templates/fullstack/packages/auth/src/client.ts` if exists separately
- Tests: `apps/server/src/modules/user/*.test.ts`, post tests, admin route test

**Out of scope**:

- Production deployment config changes on live hosts
- Removing demo features entirely (prefer gating)

## Steps

### Step 1: Remove or protect getAllUser

Option A (recommended): delete `getAllUser` from public API; keep `getUser` demo stub only.
Option B: `protectedProcedure` + admin role policy.

Update any web demo pages that called `getAllUser`.

**Verify**: `grep getAllUser apps/server` — only removed or protected

### Step 2: Fix or rename createUser

Either implement create via repository or rename to `findUserByEmail` with matching schema.

**Verify**: `bun test apps/server` — add test that createUser behavior matches name

### Step 3: Gate draft posts

In post service: public `byId`/`bySlug` return null when `!published`. Add `ownerPreview` protected procedure if needed for dashboard.

Strip author email from public author object.

**Verify**: test — draft slug returns NOT_FOUND for public caller

### Step 4: Protect Bull Board

Wrap admin routes with session check + admin role, OR mount only when `NODE_ENV !== 'production'` OR `ENABLE_BULL_BOARD=true` with explicit env warning in docs.

**Verify**: test or manual — `/admin/queues` returns 401 without session when Redis enabled

### Step 5: Fix auth client baseURL

Use `NEXT_PUBLIC_API_URL` (fallback to app URL only when documented same-origin). Update `docs/deployment-env.md` and generated template copy.

Add `trustedOrigins: [serverEnv.FRONTEND_URL]` to betterAuth config if required by Better Auth docs for split origin.

**Verify**: `grep NEXT_PUBLIC_APP_URL packages/auth/src/client.ts` → only as fallback comment or removed

### Step 6: Vercel handler validation

Call `validateEnvironment('server')` at top of `vercel-handler.ts`.

**Verify**: grep validateEnvironment in vercel-handler.ts

### Step 7: RSC tRPC credentials

Add `credentials: 'include'` to server.tsx httpLink and forward cookies from `headers()`, OR remove HTTP prefetch path for protected routes in favor of trpcCaller.

**Verify**: test or comment in server.tsx explaining choice

### Step 8: Sync generator/template

Apply same user/post/admin/auth patterns to `orm.ts` generator output and fullstack template copies.

**Verify**: `bun test apps/cli/tests` — generator snapshot tests if present

## Done criteria

- [ ] No public user enumeration endpoint
- [ ] createUser fixed or renamed
- [ ] Draft posts not public
- [ ] Bull Board gated
- [ ] Auth client points at API origin
- [ ] `bun run ci:min` passes
- [ ] Trust wave orchestrator run log → template-security DONE

## STOP conditions

- Better Auth version API differs for trustedOrigins — read packages/auth version docs, report if blocked
- Web demo pages require getAllUser — replace with seeded static demo data first

## Maintenance notes

Any new public tRPC procedure needs published-filter and auth review. Document admin queue access in `apps/server/README.md`.
