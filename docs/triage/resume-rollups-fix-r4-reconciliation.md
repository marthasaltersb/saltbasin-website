# Reconciliation: resume-rollups, fix round 4

Branch `release-loop/resume-rollups-fix-r4` (head 0ab0050). Release 2026-10-10-production-hardening-resume. No code changed by this agent. Verified by reading the diff against the integration head (3 files: Output.jsx, outputBlocks.js, change spec) and `npx vite build` (passes).

| # | Item | Kind | Status |
|---|------|------|--------|
| 1 | Compound bash commands refused by the worktree guard | process | resolved |
| 2 | First server start without NODE_ENV=production gave 404 for dist | environment | resolved |
| 3 | B11 fix (responsive tile grid) present in branch | informational | resolved |
| 4 | 1px horizontal overflow at 390px (scrollWidth 391), not investigated | product_defect (minor, unconfirmed) | unresolved |
| 5 | Career Rollup "Group by" in Site editor never walked (RR1-6 / B5, A2) | requirement_gap (coverage) | unresolved |
| 6 | Member-configurable column count (RR1-6 / A3 / J12.2) not built | requirement_gap | unresolved |
| 7 | Owner question: hand-set Expert counting toward "N Expert" | requirement_gap (needs_business_definition) | unresolved |
| 8 | E.3 wording / manual tile keeps value (RR2-2); P.1 "admin test user"; J4.1 wording amendments | process | unresolved |
| 9 | Known limitations documented as intended | informational | resolved |

## 1. Worktree guard refusals
Guard refuses `source`/heredoc/compound commands; fix agent re-ran them separately, no partial state. Nothing from this is in the branch (`git status` clean). Process only. No owner-direction conflict: nothing added to admin navigation, driven as the member test user via the World Shell.

## 2. NODE_ENV
`server/index.js:108` `isProd = process.env.NODE_ENV === 'production'`; the dist static/SPA handler is production-only, so Vite-built routes 404 without it on the API port by design. Harness/environment; the dev flow uses the Vite port. Server was reported killed and database dropped; nothing for the branch.

## 3. B11 fix verified in code
`src/components/Output.jsx` grid changed from `repeat(6, minmax(0, 1fr))` to `repeat(auto-fit, minmax(7.5rem, 1fr))`; `src/lib/outputBlocks.js` (HTML export, `exec-kpi-dashboard`) the same in the inline style. Round 4 validation failure J12.1 (mobile: six 34px columns for 8 tiles) is addressed by this. Build passes. Browser evidence (2 columns ~121px at 390px, 5 at 1280px) is the fix agent's; I did not re-drive it, and it used a 6-tile fixture, not the 8-tile fixture the validator used, so the 8-tile mobile case still needs the validator's re-run (round 5).

## 4. 1px overflow at 390px
Fix agent saw page scrollWidth 391 vs 390 viewport and did not investigate. Could be the grid, the header, or pre-existing. Step: J12.1 mobile. Files: `src/components/Output.jsx` (output page container and tile grid). proposedFix: in a 390px browser as the test member, find the element whose right edge exceeds 390 (`document.querySelectorAll('*')` with `getBoundingClientRect().right > 390`) and constrain it (`minWidth:0`, `overflow:hidden` or wrap). Validator re-run will show whether it matters.

## 5. Career Rollup "Group by" never walked (spec limitation 1)
Change spec Known limitations bullet 1. Code handles `atom:<key>` (`CareerProspectBlocks.jsx`, `EditorPane.jsx`) but no baseline step, so no validator drives it (A2 proposes [J9.6], review not applied). Files: `src/components/blocks/CareerProspectBlocks.jsx`, `src/components/admin/EditorPane.jsx`, `docs/spec-amendments/resume-rollups/A2.json`. proposedFix: amendment reviewer (not the proposer) decides A2; if approved, validator walks it at desktop and 390px. Fix agents must not edit the spec.

## 6. Configurable column count
Round 4 note: member-configurable column count (RR1-6/A3) untouched; A3 asserts a step for "column count configured" but neither the change spec nor the training spec defines such a setting. Needs a business definition (what is configured, per block or per output) before build; amendment A3 is a proposal only. Files: `docs/spec-amendments/resume-rollups/A3.json`, `src/components/Output.jsx`.

## 7. Open owner question (needs_business_definition)
"On the Capability Confidence bars, should a skill whose proficiency tier was set by hand to Expert count toward the 'N Expert' figure, or only skills whose tier is computed by the methodology?" Output shows `0 Expert · 2 skills` with a hand-set Expert; matches the change spec's limitation bullet 2. Must go to the owner, not guessed. Files: `src/components/Output.jsx` capability bar, `server/routes/careerMaster.js`.

## 8. Spec wording amendments (not code)
- E.3 "every tile as `—`" vs manual tile `Certified partners` keeping `5†` (RR2-2, failed in round 4 as AMBIGUOUS): the behaviour matches the change spec ("user-defined tile values are marked †"). Proposed wording in `docs/test-results/resume-rollups/round-4.md`.
- P.1 "admin test user" should read "member test user".
- J4.1 option list: add the "Choose a level…" placeholder.
Each needs an amendment approved by a reviewer other than the proposer in `docs/spec-amendments/resume-rollups/`; nobody edits `docs/training/*` directly.

## 9. Limitations documented as intended
Fixed hero-card narrative labels (Case Study / Strategic Operator), a role counting toward several buckets (capability groups are first-wins), last saved row of a type not removable (E.1 verifies the refusal), capability "N Expert" using the recorded tier versus the proficiency engine for the tile. Plus the round 4 observations outside the baseline (not scored): cramped 241px "Levels and why" scroll window on mobile, Connected Agents shows `localhost:5173/mcp`, unlabelled Career Master dialog inputs, pre-existing "Authored by" footer. Owner decides scheduling.
