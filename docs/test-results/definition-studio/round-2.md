# Test results — Definition Studio — round 2

- Feature: `definition-studio`
- Training spec: `docs/training/definition-studio.md`, version 1 as corrected by the coordinator ([J3.1] now expects
  `FLOW-L2-FIELD-023`); date 2026-10-10
- Scope (coordinator instruction): re-validate [J3.1] (grey line of the existing field), [J3.2], [J3.3] in full; check the
  save-state badge against the step-settings buttons at 1440 and 1920 widths; regression [J1.5], [J1.6], [E.5]; log every
  HTTP ≥ 400 response's URL (page `response` event, all frames). Code changes since round 1: the canvas save-state badge
  was moved to the bottom left and made click-through.
- Validator: release-loop validation agent; no code or spec edits
- Environment: as round 1 (Vite http://localhost:5173, Express http://localhost:3001, Playwright Chromium 1194 headless,
  `ANTHROPIC_API_KEY` unset, external fonts/CDN blocked). Database still holds round-1 data (settings v4, Career
  `flow:default` v3, PRODUCT-L0-001, MCP token "Studio probe").
- Sign-in: no form sign-in; the existing admin cookie jar `/var/tmp/sbstudio/jar` was loaded into the browser context.
- Script: `/var/tmp/sbstudio/validate/r2.mjs`; screenshots `/var/tmp/sbstudio/validate/r2-*.png`
- HTTP responses ≥ 400 seen across all three browser sessions (1440, 1920, 390), any frame: **none**. Console/page errors
  other than blocked CDN/fonts: none.

## Results

| Step | Result | Evidence |
|---|---|---|
| [J3.1] | PASS | The existing field's grey line reads "FLOW-L2-FIELD-023 · API name evidence_required". The "(fixed once saved)" suffix only appears on unsaved new items. Round 1 already showed it as "FLOW-L2-FIELD-023 · API name evidence_required (fixed once saved)" before saving, which matches the corrected text. |
| [J3.2] | PASS | ⚙ Configure → New step: step settings open with field "EVIDENCE REQUIRED" (upper case from page style) and hint "What proves this step happened" (value from round 1: "Signed intake form"). `r2-j3-2-1440.png` |
| [J3.3] | PASS | Typed **Countersigned intake form**; a normal `click()` on **Save specification** worked first time, with nothing intercepting it; status "Saved."; closed, reloaded the page, reopened the Career canvas, ⚙ Configure New step → "Countersigned intake form". `r2-j3-3-1440.png` |
| Badge overlap 1440x900 | PASS | Badge at (12,628) 248x28, `pointer-events: none`. No geometric overlap with **✦ Ask agent to draft** (938,622), **Save specification** (1215,622), **Close ✕**, or the status text. Clickable area 95% / 96% / 91% (the rest is button border and rounded corners, not the badge). |
| Badge overlap 1920x1080 | PASS | Badge at (12,808), `pointer-events: none`. No overlap with Ask agent (946,802), Save specification (1223,802), Close or status. Clickable 95% / 96% / 91%. `r2-j3-2-1920.png` |
| [J1.5] (regression) | PASS | Badge at bottom left (left 12px, bottom 12px). Placed an **Event** shape and the badge went from "Saved to Salt Basin · version 3" to "Saved to Salt Basin · version 4". `r2-j1-5.png` |
| [J1.6] (regression) | PASS | After reload: Start, New step, Decision?, Hand-off, Event are all back; the arrow is still drawn; badge "Saved to Salt Basin · version 4" |
| [E.5] (regression) | PASS | 390px: horizontal overflow 0 px on Canvas and Studio settings; 0 elements past the viewport; with no unsaved changes the save bar is `position: static` and sits right before "Settings history". `r2-e5-settings-bar.png` |

**Totals (this round's scope):** PASS 8 · PASS-WITH-NOTE 0 · FAIL 0 · BLOCKED 0

Round-1 FAILs [J3.1] and [J3.3] are now resolved. Every other step id keeps its round-1 result (not re-run, per the coordinator's scope).

## Failures and notes

No failures.

- The "Saving…" state wasn't captured in [J1.5]; the save finished between 500 ms samples. The spec only requires the
  final "Saved to Salt Basin · version N".
- Saving the step specification in [J3.3] did not raise the document version (it stayed at 4). That fits the change spec's
  rule that autosaves by the same person within 10 minutes fold into one draft version, and the value survived reload.
- With the badge at the bottom left, it now sits over the lower-left corner of the canvas grid (in `r2-j3-3-1440.png`
  it is near the Start shape). Because it is click-through, shapes underneath can still be clicked; at most it covers
  them visually. Not scored.
- Fictional data added this round: an **Event** shape on the Career canvas (`flow:default` version 4) and the Evidence
  required value "Countersigned intake form" on New step.
