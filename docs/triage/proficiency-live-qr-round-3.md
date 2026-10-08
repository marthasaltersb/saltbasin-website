# Triage: proficiency-live-qr, round 3

Release 2026-10-02-proficiency-live-qr. No code changed. One failure from the validator; method: code and spec reading against the integration head (dda1b70) plus the validator's round-3 report (PH-tabs.png). No server started.

## T3-1 Phone 390px: tab row wraps one per row, spec says two lines (spec_error, recurrence of T2-3)
- Observed: all five workspace tabs visible, clickable, no horizontal scroll; they wrap onto five lines.
- Code: `src/components/admin/CareerExperienceConfigurator.jsx:172` now has `display:'flex', flexWrap:'wrap', gap:'.45rem'` (the T2-3 fix). Each button has `padding:.6rem .9rem` and a label such as "2 · Assess proficiency"; in the roughly 285px card no two buttons fit in one row, so wrapping yields one per row. This is correct wrap behaviour.
- Spec: `docs/training/proficiency-rules-and-live-qr.md:7` says "At 390px wide the tab row wraps onto two lines; all five stay reachable." The "two lines" figure was a guess made when the T2-3 fix was written; the real count depends on the card width inside the World Shell.
- Classification: spec_error. The underlying T2-3 defect (tabs unreachable) stays fixed; only the wording is wrong. No business rule is missing.
- Fix (spec only): change the sentence on line 7 to "At 390px wide the tab row wraps (one tab per row); all five stay reachable." Also change the expected result of any phone-width journey step that repeats "two lines". Do not change the product.

## Notes
- Out of scope, noted by the validator: at 390px the Definitions workspace "Definition" input runs to the card edge and is clipped on the right (pre-existing, outside this feature's steps). Not a failure of this release; if wanted, a separate small fix is `minWidth:0` / `width:100%` on that input.
- Round-2 items T2-1, T2-2 and T2-4 passed in round 3 per the validator report; nothing carried over.
