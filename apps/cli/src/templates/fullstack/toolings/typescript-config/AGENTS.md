# TypeScript Config Notes

## Purpose

`toolings/typescript-config` provides the base TS configs extended by the apps
and packages.

## Read First

- `base.json`
- `backend.json`
- `nextjs.json`
- `react-library.json`
- `package.json`

## Owns

- shared compiler defaults
- backend-oriented TS config
- Next.js TS config
- shared React library TS config

## Common Tasks

- compiler baseline changes:
  `base.json`
- backend package TS changes:
  `backend.json`
- Next.js TS changes:
  `nextjs.json`
- shared UI/library TS changes:
  `react-library.json`

## Update When

Update this file when config inheritance, compiler defaults, or package export
usage changes.
