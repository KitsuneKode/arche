# UI Package Notes

## Purpose

`packages/ui` holds the shared UI component library, shadcn configuration, global styles, and icon components used across apps.

## Read First

- `src/components/` — available components
- `globals.css` — global Tailwind styles
- `components.json` — shadcn configuration

## Owns

- shadcn component registry and generator setup
- global CSS (`globals.css`) imported by `apps/web`
- shared React components (icons, layout primitives)
- tailwind integration through postcss config

## Common Tasks

- add a shadcn component:
  `bunx --bun shadcn@latest add <component> --c packages/ui`
- add a shared UI component:
  create `src/components/<name>.tsx`
- change global styles:
  edit `globals.css`

## Cleanup Notes

- This package is a core workspace worth keeping even when stripping template showcase content.
- Existing package README is boilerplate; prefer this file.
