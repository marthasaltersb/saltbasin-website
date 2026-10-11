# Triage: release-scope, round 4

Both failures are spec_error. Product matches code and owner direction; steps are wrong. No code changed, no spec edited.

## release-scope-R4-1 (J2.7) spec_error
- Root cause: `server/lib/mcpToolRegistry.js:909` `adm()` defaults `scope = RI = 'release.write'` (line 78). `release_tracker_set_scope` (line ~950) passes no scope, so it requires release.write. `server/lib/mcpServer.js:84` correctly returns 403 `scope_not_granted` for a token without it. Step creates TOKEN_A with only release.read, so the first call can never succeed. Validator confirmed read+write tokens give exactly the expected three outcomes.
- Amendment: change "with the `release.read` scope ticked" to "with the `release.read` and `release.write` scopes ticked", and "TOKEN_B the same for member@test.local". Traces to: release-scope A4 (J2.7 written from code), mcpToolRegistry scope rule, F2-3 interface parity.
- Not a defect: admin-only scopes being tickable by a member at token creation (observation) is separate; see observations.

## release-scope-R4-2 (J5.3) spec_error (recurrence of release-scope-T2-5 root: step hardcodes a value tied to a moving release file)
- Root cause: `src/components/releaseTracker/TrackerLayers.jsx:39-40` prints `added {f.added.at.slice(0,10)}` per entry, which is correct. `single-experience-world-shell` has `added.at` 2026-10-11T01:33:42Z, so a literal "added 2026-10-10" is false. A3 tied counts to `show --json` but left the date literal.
- Amendment: before "each with `added 2026-10-10`", after "each with `added <YYYY-MM-DD>` where the date is the first 10 characters of that entry's `added.at` in `show --json`". Also the trailing "At 2026-10-10T21:05Z these were 9 notes, 6 counted, 3 backlog" is an illustration only; keep as such. Traces to: A1/A3 (counts tied to show --json), change spec release-scope (added {at,...}).
- J6.2 unaffected.

## Observations (validator list)
- Member can tick admin-only release scopes at token creation, failing only at call time: no business rule violated; propose as a later enhancement, no step (needs owner interest). Not a coverage_gap for this feature.
- Other observations (MCP address from APP_BASE_URL, narrow phone column, tracker nav hang, duplicate paste) are environment/harness or cosmetic; no step.
- Phone note spacing (6px gaps, no card separation) vs J6.2 "space between them": passed; no change.
