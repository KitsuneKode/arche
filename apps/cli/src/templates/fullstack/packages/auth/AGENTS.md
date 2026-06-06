# Auth Package Notes

## Purpose

`packages/auth` wraps Better Auth for both server and client use.

## Read First

- `src/index.ts`
- `src/client.ts`
- `package.json`

## Owns

- Better Auth server instance
- Prisma adapter wiring
- Better Auth client setup for the frontend
- auth export surface:
  `@arche-template/auth/server` and `@arche-template/auth/client`

## Common Tasks

- auth provider changes:
  `src/index.ts`
- frontend auth client changes:
  `src/client.ts`
- export surface changes:
  `package.json`

## Cleanup Notes

- Social providers are scaffolded but commented out.
- Replace placeholder provider settings before shipping real OAuth flows.

## Update When

Update this file when enabled auth methods, provider config, or export paths
change.
