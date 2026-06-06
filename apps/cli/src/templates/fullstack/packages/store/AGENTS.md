# Store Package Notes

## Purpose

`packages/store` owns Prisma schema, migrations, client generation, and seed
data.

## Read First

- `prisma/schema.prisma`
- `src/index.ts`
- `src/scripts/seed.ts`
- `prisma.config.ts`
- `package.json`

## Owns

- Prisma datasource and models
- generated Prisma client output under `src/generated`
- migration history under `prisma/migrations`
- demo seed content

## Common Tasks

- schema changes:
  `prisma/schema.prisma`
- runtime Prisma client setup:
  `src/index.ts`
- seed content changes:
  `src/scripts/seed.ts`
- command changes:
  `package.json`

## Cleanup Notes

- `src/scripts/seed.ts` contains template-branded posts and demo data.
- Replace or remove demo content when starting a real product.

## Update When

Update this file when models, migrations workflow, generated client location,
or seed strategy changes.
