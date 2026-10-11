# Triage: graphify-data-model-map, round 1

Reproduction: code and spec read in a fresh worktree at integration head 27e5372. No code changed, no spec edited.

## J1.1 (mobile) - class spec_error

- Root cause: the step text says the breadcrumb reads `Sun › Journeys › Data model map` at both widths. The shared World Shell breadcrumb collapses a trail of more than two crumbs on a phone: `src/components/WorldBreadcrumbs.jsx` line 67 (`collapsed = narrow && crumbs.length > 2`) renders `… › <current>` plus a "Show full trail" button (line 81). The Data model map trail has three crumbs, so it collapses at 390px.
- The product matches the change spec and owner direction. The collapse is documented in the file header (line 4) and in `docs/training/world-shell-layers.md` line 12, which says the phone collapses to `… › <current>` and the full trail shows after tapping "…". The validator confirmed the expanded list reads Sun, Journeys, Data model map. Desktop passes.
- Both sides:
  - Step as written: "the breadcrumb Sun › Journeys › Data model map" (no phone exception).
  - Product and the shared standard: on a phone the trail is `… › Data model map`, and "…" reveals the full trail in the same order as desktop.
- Proposed fix: none in code. Amend the step (below). The amendment goes to the amendment reviewer, not a fix agent.

## Validator observations

- E.3 leading blank line: `die()` in `scripts/graphify-data-model.mjs` (line 34) prints `\n` before `graphify-data-model:`. The step said output "beginning" with that text and was scored pass. Nothing to do. Optionally tighten the wording to "the first non-blank line", but it is not worth an amendment on its own.
- J8.5 on a phone, red in-page alert off-screen after Save grouping: the red toast was visible and the step passed. This is a UX weakness, not a spec failure. The page could scroll the alert into view on error. Not a coverage_gap worth a new step; mention it to the build owner as a possible small polish.
- `npm run seed` printing PostgreSQL NOTICE objects: cosmetic, pre-existing, no action.
- `npm start` without `NODE_ENV=production` not serving dist/: harness note, class environment, no product defect. Validators should run with `NODE_ENV=production`.
- J8 also run at 1280px: no action.
- No new coverage_gap steps proposed.
