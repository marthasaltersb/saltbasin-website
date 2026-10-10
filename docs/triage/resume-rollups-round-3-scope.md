# Scope review: resume-rollups, round 3

Base: 2477b4a (first parent of the earliest resume-rollups merge c2ccaa3). No code changed. scope-review.json has no entry for RR1-3 or RR1-4, so the round-2 decision (docs/triage/resume-rollups-round-2-scope.md, code-level only) is reused and now backed by a runtime reproduction, which round 2 lacked.

Method: checked out 2477b4a, booted the server on a fresh database (sb_rl_scp_7700_3, port 7706), created the test member with scripts/create-test-member.mjs, and probed the API as that member. Fictional rows only: one career job for the admin ("Fictional Admin Co") and one for the member ("Fictional Member Co"). Server stopped and database dropped afterwards.

## RR1-3 -> pre_existing
Reproduced on the base commit.
- Base `src/lib/resumeUrls.js` has no `owner` handling, and base `MyResumePanel.jsx` builds `/output/resume?layout=...` without `owner=me`. These are the lines the item names.
- Runtime, signed in as the member: `GET /api/career/master` (no owner, as Output.jsx sends when `useOutputOwnerSlug()` is '') returned only "Fictional Admin Co". `GET /api/career/master?owner=me` returned only "Fictional Member Co". So at the base a member who opens their resume from My Resume already sees the platform owner's career data, for the whole output and not only the new tiles.
- The feature added the tiles and rollup configuration. It did not introduce the link construction and its request (configurable rollups) did not include reworking My Resume's output links. J12.1 merely exposes the older gap.
- Fix files named in the item are right (`src/lib/resumeUrls.js`, `src/components/admin/MyResumePanel.jsx`).

## RR1-4 -> pre_existing
Reproduced on the base commit.
- Runtime at base: `GET /api/output-templates/preset-default/public` returns 404 for a member with no saved presets.
- Base `MyResumePanel.jsx` already synthesises `{id:'preset-default'}`, base `Output.jsx` already fetches `/api/output-templates/<id>/public`, and base `outputTemplates.js` already 404s on a missing or non-portfolioVisible row. Console noise only; unrelated to rollups.

## Notes
- Both items recur from round 1 and were not fixed in earlier fix rounds. Being pre_existing means they are outside this feature's pass criteria, but the E.4 and J12.1 steps cannot pass until a fix lands (the reviewer assigns who fixes).
- Process: running `create-test-member.mjs` at the same moment as the server's first boot on a fresh database crashed the script with a `pg_type_typname_nsp_index` duplicate key (concurrent bootstrap race). Rerunning after the server had finished booting worked. Start the server, wait for "listening", then run the script.
