# Worker Notes

## Purpose

Background job processing with BullMQ — email, webhooks, and scheduled cleanup.

## Read First

- `src/index.ts` — entrypoint, worker bootstrap
- `src/queue.ts` — BullMQ queue definitions
- `src/jobs/` — job handler implementations

## Owns

- BullMQ queue definitions
- Job processor implementations
- Worker-specific Redis connection (via `@arche-template/backend-common/redis/bull`)

## Job Types

- `email` — transactional emails (Resend/SendGrid)
- `webhook` — async webhook processing (Stripe, GitHub, custom)
- `cleanup` — periodic cleanup (expired sessions, old logs)

## Common Tasks

- Add a new job: create handler in `src/jobs/`, add to `queue.ts`, wire in `index.ts`
- Change Redis config: update in `src/queue.ts`

## Dev

- `bun run dev` — hot-reload worker
- `bun run build` — compile for production

## Cleanup Notes

- Remove this workspace if the product does not use background jobs.

## Update When

New job types, changed queue config, or Redis wiring changes.
