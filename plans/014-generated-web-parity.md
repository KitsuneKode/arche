# Plan 014: Generated web parity (Solana / rust-fullstack)

> **Status**: DONE — architecture completion pass Phase B  
> **Planned at**: commit `d199cac`, 2026-06-23

## Delivered

- `generators/solana.ts` — emits `_web-core` boundaries, `next.config.js`, oxlint baseline, version pins
- `scaffold.ts` — `pruneServiceApiFullstack()` writes web-core boundaries for service-api fullstack web
- `generated-project-verifier.ts` — `WEB_BOUNDARY_FILES` on `rust-fullstack`, `solana-web`, `solana-product`

## Verification

- `SCAFFOLD_E2E=1` solana + rust-axum + fullstack-rust-axum combos green
