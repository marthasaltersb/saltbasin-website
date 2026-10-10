# Triage: proficiency-live-qr, round 8

Release 2026-10-02-application-packages-resume. One failure: J8.4. It is the same root cause as T6-3 (recurred a third time since round 6), so the id is reused. No code was changed and nothing was committed. I did not re-run the browser; the code at the cited lines is unchanged since round 7 (last commit touching the file: 390e1ef), and the validator's measurements match what the code produces.

| Id | Step | Class | One line |
|---|---|---|---|
| T6-3 (recurred, round 8) | J8.4 | needs_business_definition | Levels and why table scrolls inside a captioned scroller at 390px; owner has not answered since round 5 |

## T6-3 (recurred): J8.4 Levels and why table at 390px

Root cause: `src/components/admin/ProficiencyRulesPanel.jsx:409-410`. The table sits in a wrapper with `overflowX: 'scroll'` and `minWidth: 940`. Line 408 adds a caption telling the viewer to swipe. In a 239px scroller at 390px the columns How it was used, Decided by, Points behind it, Methodology alone and Your override are hidden. The page itself does not scroll sideways (scrollWidth 390) and the editor stacks in one column, so those halves of J8.4 pass. The clause "no sideways panning inside ... its scroller" can only be satisfied by turning the table into cards at phone width. The formula editor already does this with `useNarrow()` (round 6 fix T6-1), so the build is small.

No owner answer exists in the repo: nothing in `docs/spec-amendments/proficiency-live-qr/` (only A1, A2, neither about J8.4), and the release log still lists it as owner question 3. Because there is no decision, this is neither a defect nor a spec_error yet. A REJECTED amendment would make it a defect; none exists.

Exact question for the owner: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable (the same behaviour Career Master already has, accepted in round 4), so J8.4 is reworded to allow it? Or must the table stack as cards at phone width, so no panning at all is needed?"

If accept: spec_error amendment on J8.4.
- before: "...no sideways panning inside the page or its scroller to read the Rules & why panel."
- after: "...no sideways panning of the page itself; the Levels and why table may scroll inside its own captioned scroller (the caption names the columns it hides: How it was used, Decided by, Points behind it, Methodology alone, Your override)."
- traces to: the round-4 acceptance of Career Master's table and change spec T1-2.

If stack: defect. Fix in the rows rendering of `ProficiencyRulesPanel.jsx` (about lines 396-420): below 900px render each skill or tool as a labelled card using the existing `useNarrow()` hook, and drop the swipe caption in that mode. No spec change.

## Validator observations (decisions)

- A2 verified (J6.4 passes): nothing to do.
- MCP `technology_category_set` rejects `category:null` with 400 "category is required" while its schema advertises null clearing. The website dropdown cannot clear either, so there is no UI/MCP mismatch, but the tool description is wrong. Not a baseline step. Suggest a coverage_gap only if the owner wants clearing supported; otherwise fix the schema text. No amendment filed; needs an owner choice (can a category be cleared once set?).
- Hyphen vs em dash between the approval toast and the cancel toast: inconsistent but spec-compliant; product decision, nothing to do.
- No click path from `/member` to `/world`: not a step; nothing to do.
- E.1 empty QR page still mentions career charts: spec-compliant; nothing to do.
- "Journeys card list" second button: not a product failure.
- E.3 unknown-input half reachable only by API or MCP: covered by the spec as written; nothing to do.
- Report-path write blocked by the worktree guard: environment note, no product impact.
