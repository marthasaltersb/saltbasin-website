# Triage: career-bound-outputs, round 1

## cbo-r1-phone-editor (defect, already fixed)
- Step: Phone width (390px) career-bound output editor dialog.
- Reproduction: the round-1 screenshot (PHONE-editor_390-2.png, taken 2026-10-08 15:33) shows the two-column layout at 390px.
- Root cause: `S.wrap` in `src/components/admin/CareerBoundOutputEditor.jsx` was a fixed two-column inline grid, `minmax(0, 1.1fr) minmax(0, 1fr)`. Inline styles cannot carry media queries, so it never stacked on phones. The inputs and the preview shrank to about 60px.
- Status: fixed in commit 3472137 (15:57, after the screenshot). `wrap` is now `repeat(auto-fit, minmax(min(100%, 360px), 1fr))`, which stacks below about 740px.
- Verification: round-2 J10.1 at 390px passed. Title and Dates inputs were 330px wide, Preview sat below Experience at 363px, and there was no horizontal scroll. At 1200px the columns sit side by side.
- Proposed fix: none needed. Re-validate the phone journey.
- Recurrence: none (no earlier triage items).
