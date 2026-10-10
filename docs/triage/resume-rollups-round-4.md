# Triage: resume-rollups, round 4

Reproduction was by code reading and the validator's screenshots and `steps.jsonl`; no server was started and no code was changed.

| Id | Step | Class | Summary |
|---|---|---|---|
| B11 | J12.1 (mobile) | defect | Executive Summary tile grid is hardcoded to six columns, so at 390px each column is about 34px |
| RR2-2 (recurred) | E.3 | spec_error | The step says "every tile", but a manual (user-defined) tile is meant to keep the member's own value |

## B11 [J12.1 mobile] Tile grid unreadable at 390px (defect)

- Root cause, `src/components/Output.jsx:523`: `gridTemplateColumns: 'repeat(6, minmax(0, 1fr))'` has no narrow-width case. `minmax(0, ...)` lets the columns shrink to about 34px each at 390px, so values and labels clip.
- The same hardcoded count is in the HTML export builder, `src/lib/outputBlocks.js:535`: `grid-template-columns:repeat(6,1fr)`.
- J12.1 already requires the output to be readable on a phone (MOBILE_GAP rule), so no amendment is needed.
- The round-1 coverage gap RR1-6 and amendment A3 are about a member-configurable column count. That is not this bug and it stays with the owner.
- Fix:
  - Replace both with an auto-fit grid, for example `repeat(auto-fit, minmax(7.5rem, 1fr))`, so a 390px viewport shows two or three columns.
  - Keep wrapping, and keep the grid usable in print.
  - Check that the 8-tile fixture renders without clipping at 390px and at desktop width.
- Files: `src/components/Output.jsx`, `src/lib/outputBlocks.js`.

## RR2-2 [E.3] Empty Career Master and the manual tile (spec_error, recurred)

- Product behaviour is correct and matches the change spec and the module header:
  - `server/lib/resumeRollups.js` header (lines 16-19) and `case 'manual'` (lines 317-320) return the member's own value with `userDefined: true`.
  - `docs/changes/resume-rollups.md:23` lists `manual {manualValue}` as a metric. It is footnoted with the dagger by design, and it is the same member-entered value J12.1 expects (`CERTIFIED PARTNERS 5†`).
- The step text says "every tile as `—`", which contradicts that. All tiles computed from Career Master do show `—` with a reason, and no figure is invented.
- This is a recurrence. It was raised in round 2 as RR2-2 and is still open with no decision. No amendment covering E.3 exists in `docs/spec-amendments/resume-rollups/` (A1 to A3 cover J9.5, J9.6 and J12.2). Because no amendment has been rejected, this is spec_error rather than defect.
- No code fix.

## Validator observations

- Coverage_gap candidate, not worth a new step now: the Mobile "Levels and why" table scrolls inside a 241px window (table 940px). The steps stay satisfiable, so it is reported as an observation only.
- Not worth a step: the Career Rollup block picker has no baseline step (A2 was rejected for imprecision). A better-specified proposal could come later.
- Nothing for the baseline: MCP address shown as localhost, Career Master label association, footer author text, header hover menu. These are outside the feature and are noted for backlog.
- Validator-proposed P.1 (admin test user to member test user) and J4.1 (placeholder option) are not triaged as failures. They are left to the amendment reviewer.
