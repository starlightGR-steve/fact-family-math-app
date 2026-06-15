# fact-family-math-app — CLAUDE.md

## ⚠️ This is a LIVE production app

This app is deployed and has real customers using it. Treat every change as
production-impacting. Make the smallest change that satisfies the request,
prefer reversible edits, and confirm before anything outward-facing. Do not
refactor structure, layout, or functionality as a side effect of a styling task.

## Read the kit first

Before doing ANY design, styling, font, or color work, read:

    playful-scholar-kit/CLAUDE.md

That submodule is the single source of truth for the Playful Scholar design
system (tokens, Tailwind class names, typography, ADA rules). Do not duplicate
or hardcode hex values here — reference the kit's tokens/classes.

Kit quick pointers:
- `playful-scholar-kit/tokens.css` — canonical color/font/spacing tokens
- `playful-scholar-kit/tailwind.config.js` — Tailwind class mappings
- `playful-scholar-kit/PlayfulScholar_DesignSystem_v2_7_VisualReference.html` — rendered reference

## Current retrofit scope: FONT + COLORS ONLY

The active work (branch `nicole/kit-retrofit`) is limited to bringing this app's
**font and colors** into line with the kit. Out of scope — do NOT change:
- App structure, layout, or component hierarchy
- Functionality / behavior / state / data flow
- The card-based UI: tabs stay cards, they do not become pills
- The existing background treatment

If a kit rule would require a structural/behavioral change, STOP and ask rather
than implementing it under the font+colors banner.

## Role rules (Nicole / Steve workflow)

- **Nicole** prototypes only; experiments live on a `nicole/<feature-name>` branch.
- **Steve** integrates approved designs into `/src/` with API wiring and deploys.
- **Nicole never modifies `/src/` directly.**
- When the spec is ambiguous, ask before guessing.
