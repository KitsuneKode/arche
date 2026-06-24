# Plans

Plans are for approved work, execution notes, and shipped outcomes. They are not
general documentation and should not be loaded by default.

## Active work

- [Web perf & SSR hardening](active/2026-06-24-web-perf-ssr-hardening.md) — motion scope,
  MDX SSR embeds, route loader. Base commit `91a1c4a`.

Trust wave shipped 2026-06-24. See [completed trust-wave orchestration](completed/2026-06-24-trust-wave-orchestration.md).

## Directories

- `active/` - approved work that is not fully shipped.
- `completed/` - shipped work with verification notes and outcome.
- `archive/` - obsolete or speculative plans.

## Lifecycle

1. Create an active plan only after the design is approved.
2. Keep the plan focused on one implementation slice.
3. Update it when scope or verification changes.
4. Move it to `completed/` after the work ships.
5. Move obsolete or abandoned plans to `archive/`.

Never treat `archive/` as current behavior.
