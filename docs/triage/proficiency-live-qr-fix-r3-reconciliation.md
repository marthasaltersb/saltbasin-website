# Reconciliation: proficiency-live-qr fix round 3

Branch checked: release-loop/proficiency-live-qr-fix-r3 (c464731), read against integration head. No code changed. Method: read the diff (ccbf12b..c464731 touches only the change spec and the training spec), grepped mount points, read docs/test-results/proficiency-live-qr/round-3.md. No server or browser started here.

## Item 1: no server booted, no browser walk this round
- kind: process
- status: unresolved
- evidence: the r3 diff is two docs files only (19 insertions, 1 deletion); no src/ change. The round-3 validator (val-4500-5, commit fe28090) already drove T2-1 (dark banner, green/gold stripe) and T2-3 (five tabs at 390px) in a browser, and T2-4 for two of three states. But Journey 8 (added in r3) has not been run by anyone, and the third wording state is unexercised.
- step: J8 (Rules & why inside Output Template editor); J7.2 third sentence (non-career-bound, frozen text).
- rootCause: r3 only changed docs; the new journey and the frozen-text state have no browser evidence.
- proposedFix: round-4 validator drives J8 in /world -> Output Templates (including the 390px tab wrap) and J7.2 third state. If a non-career-bound output with document content cannot be produced in the UI (round 2 and 3 both hit this), record needs_business_definition for the owner rather than guessing.
- files: src/components/admin/OutputTemplateConfigurator.jsx, src/components/SharedLiveStates.jsx, docs/training/proficiency-rules-and-live-qr.md

## Item 2: first call used a lowercase tool name, retried, nothing left partial
- kind: informational
- status: resolved
- evidence: no state left behind; r3 commit is clean and contains only the two docs files.

## Item 3 (proficiency-live-qr-F2-1): J7.1, J7.2, 390px tabs not browser-run
- kind: process
- status: resolved for J7.1, 390px tabs and two of three J7.2 sentences; third J7.2 state carried to Item 1
- evidence: round-3.md fix verdict table: T2-1 PASS (bg rgb(27,42,59), stripe green/gold), T2-3 PASS (five tabs reachable at 390px), T2-4 PASS for career-bound unchanged and changed states.

## Item 4 (proficiency-live-qr-F2-4): salt particle design waits on owner feedback
- kind: requirement_gap (owner direction needed)
- status: unresolved
- evidence: SaltParticleChart.jsx unchanged; ChartViews.jsx:3 and the change spec's Known limitations still call it a "first rendition". Round 3 J7.4 passes functionally (grains fall, settle, tooltip) but design is not signed off.
- step: J7.4
- rootCause: design choices (grain size/density, colors, motion, heap shape) need the owner; cannot be invented.
- proposedFix: send the owner the exact question: "After seeing the first Salt particles rendition (J7 step 4), what should change: grain size or density, colors, motion, heap shape?" Do not build until answered. Mark needs_business_definition in the release log.
- files: src/components/SaltParticleChart.jsx

## Gaps from the change spec's Known limitations that the reported failures missed
- G1 Rules & why not mounted in the Output Template editor: product code is present (OutputTemplateConfigurator.jsx:18 import, :549 mount; WorldShell.jsx:51 renders the hub), so the gap is closed in code. Status: unresolved only for verification (see Item 1, J8 never browser-run). kind: process.
- G2 skills have no proficiency category: informational, resolved (tools only, as asked).
- G3 salt-particle first rendition: see Item 4.
- G4 (process, unresolved, small): the change spec fix notes for round 2 (lines 82, 84) still say "Checked by rendering ... in the browser" / "Checked by build and layout at 390px". Round 3 later verified those, so the claims are now true, but the notes should cite round-3.md as the evidence. Also the round-1 notes T1-1 (dark embed readability) and T1-2 (390px table/chart scroll) have no browser evidence in round-3.md (grep finds none); the round-4 validator should cover them. files: docs/changes/proficiency-rules-and-live-qr.md
