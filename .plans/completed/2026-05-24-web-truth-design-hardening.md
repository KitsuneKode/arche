# Arche Web Truth and Design Hardening Plan

> **Superseded 2026-06-24** by [trust-wave orchestration](active/2026-06-24-trust-wave-orchestration.md).
> W0/W2 partial outcomes are recorded in that orchestrator baseline. Remaining W1–W4
> work continues in the four trust-wave child plans.

> **For agentic workers:** Do not execute this file. Use `.plans/active/2026-06-24-trust-*.md`.

**Goal:** Turn the current public website into an accurate, distinctive Arche
product surface without allowing visual polish to preserve stale claims.

**Architecture:** Stable product intent lives in `PRODUCT.md`; website-specific
truth and UI guardrails live in `.docs/product/web-brand-ui-brief.md`.
Implementation proceeds from copy correctness to an approved design system,
then landing/docs polish and final accessibility/SEO checks.

**Truth source:** `.docs/product/verification-matrix.md` owns public status
claims until all promoted preset evidence is green.

## Slice Status

| Slice | Purpose                                                   | Status                                    |
| ----- | --------------------------------------------------------- | ----------------------------------------- |
| W0    | Repair shared UI lint warnings and establish handoff docs | Complete                                  |
| W1    | Correct public copy and metadata drift                    | Superseded → trust-content-truthfulness   |
| W2    | Approve and encode design system/assets                   | Partial → trust-landing-primitives        |
| W3    | Rebuild landing hierarchy against approved system         | Superseded → trust-landing-primitives     |
| W4    | Bring presets/docs UX in line with registry truth         | Superseded → trust-matrix-table + content |
| W5    | Accessibility, responsive, metadata, and build polish     | Pending (post wave)                       |

## W0: Shared UI and handoff foundation

- [x] Reproduce `packages/ui` accessibility warnings with
      `bun run --cwd packages/ui lint -- --deny-warnings`.
- [x] Make `Label` expose `htmlFor` on its rendered semantic element.
- [x] Remove unnecessary `role="group"` from the generic `Field` wrapper;
      grouped controls use `FieldSet`.
- [x] Add `PRODUCT.md` for durable brand/product truth.
- [x] Expand `.docs/product/web-brand-ui-brief.md` with drift findings, slices,
      agent constraints, and a paste-ready W1 prompt.
- [x] Run verification and commit this foundation slice.

## W1–W5

See trust-wave child plans for remaining execution.

## Verification Contract

For web/UI slices:

```bash
bun run --cwd packages/ui lint
bun test apps/web/app/route-discovery.test.ts
bun run --cwd apps/web lint
bun run --cwd apps/web check-types
bun run build:docs
bun run repo:doctor
```

For the final web milestone, additionally run:

```bash
bun run ci
bun run build:affected
```
