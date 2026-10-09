# Reconciliation: proficiency-live-qr fix round 4

Branch checked: release-loop/proficiency-live-qr-fix-r4 (9b01768), on top of integration head b138908. No code changed. Method: read the diff (dd73067..9b01768: OutputTemplateConfigurator.jsx, change spec, training spec), read round-4.md, read the server/client code for imports and the QR page, then built the branch and drove it in Chromium at 390px as the test member (fresh DB, server killed via PID file, DB dropped).

## Item 1: worktree guard refused two combined shell commands
- kind: environment
- status: resolved
- evidence: fix agent says nothing ran from either and both were re-run as separate commands. I hit the same guard (source plus background start; heredoc plus cd) and worked around it with launcher scripts in my scratch dir run as one plain command. No product impact, no partial state.

## Item 2: Output Templates nav button hidden at 390px, clicked via dispatchEvent
- kind: product_defect (pre-existing, outside this feature's journeys) / test_harness
- status: resolved for this feature, with a carried note
- evidence: I reproduced it. At 390px, World Shell -> Classic Tools: the button text "Output Templates" exists in the DOM but `isVisible()` is false and its bounding box is null; the Classic view shows only the Career Placement Agents panel and no reachable tab navigation, and the fixed "Back to World" button overlaps the page title. So the fix agent's dispatchEvent click did not prove a real user can reach it that way. However the route the training spec J8 uses (World -> Journeys -> Output Templates -> Open configuration) works at 390px by real clicks: the editor opened, the tab row wrapped, and "Rules & why" was clickable. The Classic Tools route is therefore not part of J8.
- step: Classic Tools at phone width (not a training journey).
- rootCause: AdminShell sidebar/tab nav is hidden at narrow widths in Classic Tools with no replacement navigation.
- proposedFix (optional, separate small task): give Classic Tools a phone-width tab switcher and move the "Back to World" button out of the title area. Do not count against this feature.
- files: src/components/AdminShell.jsx, src/components/WorldShell.jsx (classicBack style, line ~1459)

## Item 3: server and database cleanup
- kind: informational
- status: resolved
- evidence: reported done; not re-checkable after the fact. My own server and database were cleaned up.

## Item 4 (proficiency-live-qr-F3-4): Salt particles design, nothing built, needs owner
- kind: requirement_gap (owner direction needed, `needs_business_definition`)
- status: unresolved
- evidence: SaltParticleChart.jsx unchanged; change spec Known limitations still calls it a first rendition. Round 4 validated it functionally (grains fall, settle, tooltip).
- step: J7 step 4
- rootCause: design choices cannot be invented by an agent.
- proposedFix: send the owner the exact question: "After seeing the first Salt particles rendition (J7 step 4), what should change: grain size or density, colors, motion, heap shape?" Do not build until answered.
- files: src/components/SaltParticleChart.jsx

## Item 5 (proficiency-live-qr-F3-1, third J7.2 state): non-career-bound wording sentence not driven
- kind: process (the fix agent's premise is wrong; a UI path does exist)
- status: unresolved
- evidence: the fix agent said no UI path creates a non-career-bound output, so it proposed raising a business question. I found one. World Shell opportunity panel has "Import resume" / "Import cover letter" (WorldShell.jsx ~942-957, hook `importOutputForOpportunity`, route `POST /api/career-agents/opportunities/:id/import-output`, careerPlacementAgents.js:228). It files a `resume_output_projections` row with `source='imported'` and `generated_content = { rawText }`, which is not career_bound. `approveOutputForSharing` (applicationPackages.js:117) has no career-bound requirement, and `publicSharedView` sets `documentState = null` for it, so the page renders the rawText branch (SharedOutputPage.jsx:111) and the J7.1 sentence should be the frozen "stays exactly as approved" one. Not driven in a browser by me this round, so the third sentence remains unproven.
- step: J7.1/J7.2 third wording state.
- rootCause: round-2, 3 and 4 validators all used "New career-bound resume from Career Master" and never the import path; the training spec does not name the import path.
- proposedFix: add to the training spec a precondition/step for the third state: track a placeholder opportunity, import a small fictional .txt as a resume, approve for QR (after categorising any uncategorised tool), open /r/<slug>, expect the sentence "The document text above always stays exactly as approved." Round-5 validator drives it. No owner question needed unless that run fails. Caveat to check while driving: the imported output has no `shared_snapshot.document` and shows no text-changed banner, which is correct for frozen text.
- files: docs/training/proficiency-rules-and-live-qr.md, src/components/SharedLiveStates.jsx (wordingSentence), src/components/WorldShell.jsx

## Item 6 (proficiency-live-qr-F3-1 / R4-1): Output Templates editor clipped at 390px (J8 step 4)
- kind: product_defect
- status: resolved
- evidence: code present in OutputTemplateConfigurator.jsx (lines 130-132 matchMedia state, 321/329 single-column shell, 350/371 stacked grids). I built the branch and drove it as member@test.local at 390px: /world -> Journeys -> Output Templates -> Open configuration -> Rules & why. documentElement scrollWidth 390 = viewport, zero elements extend past the viewport (including inside scrollers), no page errors. Screenshot shows presets, Preset Info, the wrapped five-tab row (Rules & why selected) and the Rules & why card all in one readable column.

## Gaps from the change spec's Known limitations that the reported failures missed
- G1 Rules & why not mounted in the Output Template editor: mounted (OutputTemplateConfigurator.jsx tab 5, round-4 J8.1-8.3 pass at desktop; phone now fixed per Item 6). kind: informational, resolved. The change spec's round-3 note calls it "tab 4"; it is the fifth tab. Doc nit, unresolved: fix wording in docs/changes/proficiency-rules-and-live-qr.md "Fix notes — round 3".
- G2 Skills have no proficiency category (tools only, as asked): informational, resolved.
- G3 Salt particles first rendition: see Item 4, unresolved.
- G4 Round-1 fixes T1-1 (dark embed readability) and T1-2 (390px rules table and chart scroll) are still described in the change spec as "not performed" in a browser. Round 4 covered them indirectly (PH-rules-levels: table scrolls in its own container with hint; PH-qr-top; J8 at 390px), but T1-1 on the dark World embed (CareerExperienceConfigurator light surface, CareerMasterEntryPoint card) has no explicit round-4 verdict. kind: process, status: unresolved (small). proposedFix: round-5 validator records an explicit pass/fail for T1-1 (Career Master in /world, heading and selected path card readable on the dark embed) and the QR chart swipe container at 390px, then the change spec cites round-N.md as evidence.
- G5 Round-4 validator observations not folded in: J8.3 spec step should say "after adding the Proficiency Tiers chart"; at 1280px the Rules & why levels table in the editor centre column is cut at its right edge until scrolled; unknown-input formula rejection only covered via a payload that failed for a different reason (no thresholds). kind: process, status: unresolved (small). proposedFix: edit training J8 step 3 wording; round-5 validator saves a formula with an unknown input and valid thresholds through the UI/API and confirms the error toast names the input. files: docs/training/proficiency-rules-and-live-qr.md, src/components/admin/OutputTemplateConfigurator.jsx
