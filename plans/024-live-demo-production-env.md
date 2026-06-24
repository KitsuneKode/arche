# Plan 024: Production live demo auth and smoke test alignment

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e125e4c..HEAD -- tests/src/live-demo-smoke.test.ts docs/deployment-vercel-arche.md`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (live sandbox shipped at `d9c0092` / `e125e4c`)
- **Category**: dx
- **Planned at**: commit `e125e4c`, 2026-06-24

## Why this matters

The `/live` marketing demo on Vercel + Render requires frictionless sign-up for proof-run rungs 7–10. Production API currently returns `token: null` and `emailVerified: false` on sign-up unless `DEMO_AUTO_SIGN_IN=true` is set on the API host. Smoke test #6 times out at 5s against production because the full sign-up → sign-in → chat.send → getSecretMessage chain can exceed the default Bun test timeout when email verification is required.

## Current state

- `packages/auth/src/index.ts` — `autoSignIn: process.env.NODE_ENV !== 'production' || process.env.DEMO_AUTO_SIGN_IN === 'true'`
- `docs/deployment-vercel-arche.md` — documents `DEMO_AUTO_SIGN_IN=true` for arche-api but custom domain `api.arche.kitsunelabs.xyz` may not have it set
- `tests/src/live-demo-smoke.test.ts` — test 6 has no explicit timeout; test 8 uses `NEXT_PUBLIC_APP_URL` (defaults to localhost)

Production verification (2026-06-24):

- `https://arche.kitsunelabs.xyz/live` → 200, SSR includes Proof run + Live chat
- `https://api.arche.kitsunelabs.xyz/health` → OK
- `https://api.arche.kitsunelabs.xyz/api/chat/stream` → 200 (long-lived SSE)
- Smoke with production URLs: 10/11 pass; only test 6 times out

## In scope

- `tests/src/live-demo-smoke.test.ts` — increase timeout for test 6; document env vars in file header
- `docs/deployment-vercel-arche.md` — add note for custom domain (`arche.kitsunelabs.xyz`) env parity

## Out of scope

- Vercel/Render dashboard env changes (human operator step — documented in plan)
- LiveFeed architecture refactor (see plan 025)
- Source changes to auth package behaviour

## Steps

### 1. Harden smoke test for production

In `tests/src/live-demo-smoke.test.ts`:

- Update the file header comment to document:
  ```bash
  RUN_LIVE_DEMO_SMOKE=1 \
    NEXT_PUBLIC_API_URL=https://api.arche.kitsunelabs.xyz \
    NEXT_PUBLIC_APP_URL=https://arche.kitsunelabs.xyz \
    bun test tests/src/live-demo-smoke.test.ts
  ```
- On test 6 (`sign-up, chat.send, getSecretMessage when authenticated`), add `{ timeout: 15_000 }` as the third argument to `it(...)`.
- On test 4 (`chat.list returns messages`), change `expect(messages.length).toBeGreaterThan(0)` to allow empty feed on fresh DBs: `expect(Array.isArray(messages)).toBe(true)` and keep the email-redaction assertions when length > 0.

**Verify**:

```bash
RUN_LIVE_DEMO_SMOKE=1 NEXT_PUBLIC_API_URL=https://api.arche.kitsunelabs.xyz NEXT_PUBLIC_APP_URL=https://arche.kitsunelabs.xyz bun test tests/src/live-demo-smoke.test.ts
```

Expected: all tests pass (or test 6 passes within 15s).

### 2. Document custom-domain env checklist

In `docs/deployment-vercel-arche.md`, after the env matrix, add a short **Custom domain** subsection:

- Web: `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` = `https://arche.kitsunelabs.xyz`
- API: `BETTER_AUTH_URL` / public origin = `https://api.arche.kitsunelabs.xyz`
- API: `FRONTEND_URL` = web origin
- API: `DEMO_AUTO_SIGN_IN=true` for marketing demo
- Web: leave `NEXT_PUBLIC_ENABLE_CHAT_SSE` unset (polling on Vercel); set `true` only for Render Docker API

**Verify**: `bun run ci:min` passes.

## STOP conditions

- If `auth.getSecretMessage` returns persistent 401 with a valid session cookie in manual curl — stop; auth middleware regression, not env.
- If production `/live` returns 404 — stop; deployment not propagated, not a code fix.

## Done criteria

- [ ] `bun run ci:min` green
- [ ] Production smoke command in step 1 passes 11/11
- [ ] Operator has set `DEMO_AUTO_SIGN_IN=true` on production API (manual Vercel/Render dashboard)

## Maintenance note

Any new proof rung that requires auth should use the same smoke env vars. Re-run production smoke after API env changes.
