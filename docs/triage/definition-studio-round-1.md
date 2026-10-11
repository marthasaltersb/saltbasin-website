# Triage — definition-studio, round 1 (2026-10-10)

Source: `docs/test-results/definition-studio/round-1.md` (33 PASS, 2 PASS-WITH-NOTE, 2 FAIL, 0 BLOCKED).

| Step | Finding | Whose | Decision |
| --- | --- | --- | --- |
| [J3.3] | The canvas save-state badge (bottom right, fixed) covers the **Save specification** button in the step settings; only a sliver is clickable. Saving itself works. | Build (Definition Studio port) | Fix: badge moved to the bottom left with `pointer-events: none` (`prototypes/definition-studio/definition-studio.html`). Re-validate J3. |
| [J3.1] | Expected `FLOW-L2-FIELD-024`, saw `FLOW-L2-FIELD-023`. | Spec | The prototype's FIELD_DEFS has 22 fields (the pain-points field became per-step pain rows), so 023 is correct. Spec version 1 had not been baselined; corrected in place, recorded in the change spec's fix notes. |
| [J3.2] | Label shows in capitals ("EVIDENCE REQUIRED"). | — | Page style; the spec allows letter case to follow the page style. No change. |
| [J4.4] | Duplicate-name message shows inline and as a toast. | — | Platform convention (inline `role="alert"` plus toast). No change. |
| (note) | One console 404 in a J4 run, not reproducible, URL not captured. | — | Seen once during the build as well; every request logged in later runs returned non-404. Watch in round 2. |
