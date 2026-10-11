# release-scope round 4: scope review

Base commit (first parent of the earliest release-scope merge d8ebe98): d97a8ee. Checked by static comparison of base and head (git show / git log); no server was started, no database created. No code or spec was changed.

docs/triage/scope-review.json has no release-scope entries, so nothing was reused. Round 1 and 2 decisions (T2-5 this_feature) were reused where the id matches.

| id | scope | owner |
|---|---|---|
| release-scope-R4-1 | this_feature | release-scope |
| release-scope-T2-5 | this_feature | release-scope |
| release-scope-F3-4 | this_feature | release-scope |
| release-scope-F3-5 | this_feature | release-scope |
| release-scope-F3-6 | this_feature | release-scope |
| release-scope-F3-7 | this_feature | release-scope |
| release-scope-F3-8 | pre_existing | none |

## R4-1 (this_feature, spec error)
`release_tracker_set_scope` exists only since fix r3 (8d80080, release-scope). It correctly requires `release.write` (mcpToolRegistry.js `adm()` default, RI = 'release.write'); mcpServer returns 403 scope_not_granted for a read-only token. Step J2.7 creates TOKEN_A with only `release.read`, so it can never pass. The product is right and the spec step is wrong. Propose an amendment: tick `release.read` and `release.write` for TOKEN_A (or keep read-only as a negative check that expects 403 scope_not_granted).

## T2-5 (this_feature, spec error)
TrackerLayers.jsx renders `added <added.at first 10 chars>` per entry, which is correct. J5.3 hard-codes `added 2026-10-10`, but a feature added later (single-experience-world-shell, 2026-10-11) legitimately shows its own date. Same family as the earlier round-2 T2-5 (same id reused). Propose an amendment: expect each note's date to equal the first 10 characters of that entry's `added.at` from `show --json`.

## F3-4 (this_feature, defect)
`server/lib/releaseScopeChange.js` and `ScopeCard.jsx` were both created by 8d80080 (fix r3 of this feature) and do not exist at d97a8ee, so it cannot reproduce without this feature. The code writes docs/release-log/active-release.features.json on the server's local disk, which is ephemeral on a deployed server and never committed, yet the card says it will appear after repo sync. This feature added the surface, so it owns the misleading promise. Fix: either state honestly that on a deployed server the change is not durable (and block or warn), or persist it through a durable path.

## F3-5 (this_feature, defect)
Same origin (8d80080). Moving scope changes counts, scoring and what the loop launches. The new card, route and MCP tool apply it immediately with no preview of downstream impact and no approval step, which the CLAUDE.md "Global change standard" requires. This feature introduced the change surface, so it owns the gap. Fix: add an impact preview (counts, scores, launch list) and one approval, with the source action recorded on the history row.

## F3-6 (this_feature, defect)
The CLAUDE.md release-scope paragraph still says "Changing scope has no platform screen or MCP tool yet (open parity question for the owner)". That became false when fix r3 added the screen, API and MCP tools. The paragraph belongs to this feature. Fix: update it to describe the card, `/api/release-tracker/scope` and `release_tracker_*_scope`.

## F3-7 (this_feature, defect)
Same origin (8d80080). `releaseScopeChange.js` shares one set of error messages between the CLI and the API/MCP; the `flags` argument defaults to nothing, but messages like "Use \"add\" for a new feature" and the flag wording read as CLI text to API and MCP callers (reported symptom: CLI-style text for unknown or duplicate keys). This feature wrote that shared function, so it owns the wording. Fix: caller-appropriate message text (name the field and the API/MCP action, not a CLI command).

## F3-8 (pre_existing)
The split-bugs measurement in `scripts/release-tracker-sync.mjs` `stored()` (max of the snapshot document and the bugs document, ignoring the `tracker/bugs-2` split) is in the base d97a8ee already (the same LIMIT and Math.max lines are present there), and release-scope's diff does not touch it. It is not part of the release-scope request (scope on tracker surfaces and in the cut). It was already recorded as pre-existing and informational in docs/triage/release-scope-fix-r1-reconciliation.md and fix-r2. Effect is only that the sync warns and trims detail that would fit. Carry it as a pre-existing tracker limitation.

## Failed or refused commands
- One compound git command (several `git cat-file`, `git show`, `git log` joined in a loop) was refused by the worktree sandbox before running. Nothing changed. It was re-run as separate plain commands.
- Full reproduction on a fresh base build was not done; for F3-4 to F3-7 the code does not exist at the base, and for F3-8 the base source contains the same logic, so static evidence was conclusive.
