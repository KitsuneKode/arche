# Common Package Notes

## Purpose

`packages/common` holds small cross-runtime helpers, mainly config loading and
shared types.

## Read First

- `src/utils/config-loader.ts`
- `src/utils/client-logger.ts`
- `src/types/zod-schema.ts`
- `src/index.ts`

## Owns

- generic `ConfigLoader`
- env parsing helpers
- client-side config accessors
- shared type exports

## Common Tasks

- client env changes:
  `src/utils/config-loader.ts`
- shared type additions:
  `src/types/*`
- client logging changes:
  `src/utils/client-logger.ts`

## Notes

- `src/index.ts` currently re-exports the zod schema types only.
- Client config for the web app is created in `src/utils/config-loader.ts`.

## Update When

Update this file when config APIs, shared type exports, or client env names
change.
