# Reconciliation - career-bound-outputs fix round 2 (branch release-loop/career-bound-outputs-fix-r2, commit 95c2adf)

Checked by reading code on the branch, `npx vite build` (passes), and the round-2 test result `docs/test-results/career-bound-outputs/round-2.md`. Not re-driven in a browser.

| # | Item | Kind | Status |
|---|---|---|---|
| 1 | Sandbox-refused commands re-run; no partial state | environment | resolved |
| 2 | Walk script duplicates on non-fresh DB; DB reset and dropped | test_harness | resolved |
| F1-4 | Template overrides stored on the preset | owner_direction_conflict / requirement_gap | unresolved |
| F1-7 | Trailer Opus vs Sonnet | process | unresolved |
| F1-8 | Validation agent must write round-N.md | process | unresolved (for the round-3 validator) |
| G1 | Save changes looks enabled when disabled | product_defect | unresolved |
| G2 | Reconciliation dialog has no visible title | product_defect (minor) | unresolved |
| G3 | Convert button stays enabled after conversion | product_defect (minor) | unresolved |
| G4 | Contrast sweep of other light cards not exhaustive | requirement_gap | unresolved |
| G5 | Skill/tool/cert overrides invisible in the default resume layout | requirement_gap | unresolved (owner to accept or build) |

## Resolved

### 1. Refused commands (environment)
Evidence: harness sandbox behaviour only; the branch has no change from it. Git tree at 95c2adf is clean and builds.

### 2. Duplicate rows on a reused DB (test_harness)
Evidence: the walk script re-seeded Career Master rows; the training spec says "freshly seeded database". No product code involved.

## Unresolved

### F1-4. Overrides live on the preset (owner_direction_conflict / requirement_gap)
- Step: Output Templates > Sections > "Career Master wording for this output only" (J9).
- Evidence: `src/components/Output.jsx:1295` applies `config.masterOverrides` from the template config; `OutputTemplateConfigurator.jsx:525-572` writes it there; the change spec's last Known limitation says it applies "to every view of that preset, not to a separate saved document". The request asked for per-OUTPUT overrides, so two documents made from one preset cannot differ. The fix agent made no change, so it is open.
- Root cause: the override was attached to the preset because template outputs have no saved per-document row.
- Files: src/lib/masterOverrides.js, src/components/Output.jsx, src/components/admin/OutputTemplateConfigurator.jsx, server/lib/outputRendering.js.
- Proposed fix: owner decides. If per-document is required, store `masterOverrides` on the generated `resume_output_projections` row (additive JSONB column or inside `generated_content`), apply it in render and PDF, and keep the preset-level map only as a default. If the preset is acceptable, record that in the change spec as an accepted design and close it.

### F1-7. Commit trailer conflict (process)
- Evidence: `git log` on the branch: 95c2adf carries "Claude Sonnet 5.5"; the task rule requires "Claude Opus 5.5" and earlier commits use it. This was also unresolved at the build reconciliation (item 9). This round's task text again says Opus.
- Root cause: the fix agent followed the session attribution reminder over the task text.
- Proposed fix: the orchestrator, not an agent, decides. The task text rule is the stated release rule, so amend the trailer locally on 95c2adf (and the build commit if wanted) to Opus 5.5. Never push.

### F1-8. Round-N test result file (process)
- Evidence: `docs/test-results/career-bound-outputs/` has only round-2.md. The round-3 validator must write round-3.md; the fix agent correctly did not.
- Proposed fix: the next validation agent writes `docs/test-results/career-bound-outputs/round-3.md` per definition.json.

### G1. Save changes looks enabled when disabled (product_defect)
- Step: J1.2, round-2 Observations.
- Evidence: `CareerBoundOutputEditor.jsx:145` sets `disabled`, but `S.btn` (line ~27) has no disabled opacity or cursor style, so the gold button looks active. Not touched by fix round 2.
- Files: src/components/admin/CareerBoundOutputEditor.jsx.
- Proposed fix: in `S.btn` (or on the button) apply `opacity: 0.5; cursor: not-allowed` when disabled; add a check to J1.2 and re-validate.

### G2. Career Sources to Review dialog has no visible title (product_defect, minor)
- Step: J6.10, J11.2.
- Evidence: `MyResumePanel.jsx:1113-1118` names the dialog only through `aria-label`.
- Proposed fix: add a visible heading "Career Sources to Review" in the dialog header next to Close.

### G3. Convert button still enabled after conversion (product_defect, minor)
- Step: J6.10 observation.
- Evidence: `CareerReconciliationPanel.jsx:309` disables only on `busyId` or `openTasks`; nothing marks an already-converted package. Repeated clicks may create duplicate outputs.
- Proposed fix: have the `convertible` list in `server/lib/careerBound.js` report an existing converted output per package and show "Already converted - open" instead of an enabled Convert button.

### G4. Contrast sweep not exhaustive (requirement_gap)
- Evidence: change spec fix notes round 2: "Sweep of other light-card tools reachable from World Shell was not exhaustive". The root cause (World Shell cream text inherited into light dialogs, `WorldShell.jsx` left unchanged) is worked around surface by surface. The `OutputTemplateConfigurator.jsx` and the editor now set `#1b2a3b`, verified in code; the round-2 failures J1.2a and J9.0 are therefore addressed in code but not re-validated in a browser.
- Proposed fix: re-run J1, J9, J10 with the Legibility check; separately set a dark default colour on the World Shell's light-dialog portal or the embed container so new embeds do not inherit cream text.

### G5. Skills/tools/certifications overrides do not show in the default resume (requirement_gap)
- Evidence: change spec Known limitations: "The resume layout prints only jobs, so skill/tool/certification overrides show only where a chosen layer renders those names." `masterOverrides.js` and `Output.jsx` (tools at 620/2940) do apply the patched names, but a member who overrides a skill name and sees no change in the default resume will think it is broken.
- Proposed fix: owner decides whether to accept. If not, add a visible note in the card saying which layers print the item, or render skills/tools in the resume layout.

## Verified fine
- Fix r2 contrast change is in the branch (`CareerBoundOutputEditor.jsx:17`, `OutputTemplateConfigurator.jsx:64,74`), and the build passes.
- Skills/tools/certifications override card and `applyMasterOverrides` support all four lists, additive, absent on existing templates.
- Spec ordering (J7 before J8) is binding in training spec v3.
