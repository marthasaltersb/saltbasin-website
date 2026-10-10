# Reconciliation: resume-rollups, fix round 3

Branch `release-loop/resume-rollups-fix-r3` (head 9db4989). Release 2026-10-02-application-packages-resume. No code changed by this agent.

| # | Item | Kind | Status |
|---|------|------|--------|
| 1 | Two shell commands refused by the worktree guard | process | resolved |
| 2 | First server start lacked NODE_ENV=production, /member 404 | environment | resolved |
| 3 | Fixes RR1-3 and RR1-4 present (not reported as failures, verified) | informational | resolved |
| 4 | Known limitation: Career Rollup "Group by" in Site editor not walked in a browser (RR1-6 / B5) | requirement_gap (coverage) | unresolved |
| 5 | Open owner question: do hand-set Expert skills count toward "N Expert" | requirement_gap (needs_business_definition) | unresolved |
| 6 | Spec wording amendment P.1 ("admin test user") still pending | process | unresolved |
| 7 | Mobile output header clipped by Print button at 390px | product_defect (cosmetic) | unresolved |
| 8 | Known limitations documented as intended (fixed hero labels, multi-bucket counts, last row not removable) | informational | resolved |

## 1. Worktree guard refusals
The guard refuses `source` and compound commands; the fix agent re-ran them split or from a script file and reported success with no partial state. Nothing in the branch depends on it (git status of the branch holds only the three source files below). Process note only; no owner-direction conflict (everything was driven as the test member via the World Shell).

## 2. NODE_ENV
`server/index.js:104` sets `isProd` from `NODE_ENV === 'production'`, and the dist static/SPA handler (lines ~252-272) only serves `/member` when it is production. Without it Vite-built routes 404 on port 7710 by design. Environment/harness: the production server needs `NODE_ENV=production` plus a built `dist/`. Not a product defect. I ran `npx vite build` on the branch: it passes. Server and test DB were reported stopped and dropped.

## 3. Verified fixes in the branch (diff vs integration head)
- RR1-3 (J12.1): `src/lib/resumeUrls.js` adds `withOwnerMe()` and an `owner` option; `MyResumePanel.jsx` `presetPreviewUrl` passes `owner: 'me'`, initial `previewUrl`, layout buttons and highlight comparison use `withOwnerMe`. Public link (line 887) stays unqualified, as triage specified. Other callers of `/output/resume` (site blocks, SaltBasinHome) are public links and correctly stay owner-less. Build passes.
- RR1-4 (E.4): `server/routes/outputTemplates.js` `GET /:id/public` returns 200 `{ template: null }` for a missing or non-portfolio-visible preset.
Not re-driven in a browser by me (no server run); the fix agent reported browser evidence and the code matches the triage fix exactly. Note the header label expression in `MyResumePanel.jsx` (~line 1196) is now a fragile regex-based comparison; the label may fall back to "Resume" for preset URLs, cosmetic only.

## 4. Known limitation not covered: Career Rollup "Group by"
Change spec "Known limitations" bullet 1 (and bullet "a second member with an empty Career Master"): the second is covered by E.3 (Career Master emptied through the UI, round 3 passed). The Site editor "Group by" option is still never walked (coverage_gap RR1-6, no baseline step; amendment proposed in docs/triage/resume-rollups-round-1.md, still unapplied).
- Step: RR1-6 / B5 (proposed [J9.6]). rootCause: no baseline step exists, so validators do not drive it. Files: `src/components/blocks/CareerProspectBlocks.jsx`, site editor block picker (`src/components/admin/EditorPane.jsx`), `docs/spec-amendments/resume-rollups/`. proposedFix: reviewer (not proposer) approves a spec amendment adding a step to set Group by on a Career Rollup block in the member Site editor and confirm the public page groups accordingly; validator then walks it desktop and 390px.

## 5. Open owner question (needs_business_definition)
Spec limitation bullet 2 / round 2-3 observation B10: "On the Capability Confidence bars, should a skill whose proficiency tier was set by hand to Expert count toward 'N Expert', or only methodology-computed tiers?" Output shows `0 Expert · 2 skills` with a hand-set Expert. Matches the spec text; must go to the owner, not guessed. Files: `src/components/Output.jsx` capability bar, `server/routes/careerMaster.js` proficiency. proposedFix: ask the owner the exact question above; implement the answer.

## 6. Amendment P.1
Step "admin test user" should read "member test user" (screen exists only for members). Proposed in rounds 1-3, never decided. rootCause: spec wording. proposedFix: amendment reviewer (other than proposer) approves in `docs/spec-amendments/resume-rollups/`; nobody edits `docs/training/*` directly. The proposed J12.1 amendment was rejected by triage as unnecessary now that RR1-3 is fixed.

## 7. Mobile header clip
Output header "SALTBASIN.NET - RESUME - MODERN" is cut off by the Print button at 390px (round 3 observation, mobile-J12_1-output-view.png). Outside the baseline. Files: `src/components/Output.jsx` (output header). proposedFix: `flex-wrap` or truncate the header text at narrow widths. Owner decision whether to schedule it.

## 8. Other limitations
Fixed narrative labels on hero cards, a role counting toward several buckets, and last row of a type not removable are documented behaviour; E.1 verifies the last-row refusal. No admin-navigation entry points were added by this round, no owner-direction conflict.
