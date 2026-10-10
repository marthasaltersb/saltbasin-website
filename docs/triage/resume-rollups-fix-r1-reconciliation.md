# Reconciliation: resume-rollups, fix round 1

Branch `release-loop/resume-rollups-fix-r1` (head ee3dc2b). Release 2026-10-02-application-packages-resume. No code changed by this agent.

| # | Item | Kind | Status |
|---|------|------|--------|
| 1 | Boot log `check_for_column_name_collision` | informational | resolved |
| 2 | `check-interface-parity --strict` not run | requirement_gap (part) / process | unresolved |
| 3 | Known limitation: Career Rollup "Group by" and an empty-Career-Master member not walked in a browser | requirement_gap (coverage) | unresolved |
| 4 | Known limitation: Expert count differs between capability bar and proficiency tile | informational | resolved (documented) |

## 1. Boot-log collision message
Re-ran: fresh database, `node server/index.js` on port 5610. The log holds entries with `severity: 'NOTICE'`, `code: '42701'`, message `column "..." of relation "leads" already exists, skipping`, routine `check_for_column_name_collision`. It is Postgres' notice for `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` on a column that already exists, which bootstrap issues idempotently every boot. It is not an error. The server then logged "listening on port 5610" and the scheduler lines. Not caused by this branch (leads columns). Optional cleanup, not required: set the postgres client's `onnotice` to a no-op to quiet the log.

## 2. Parity gate
Ran `node scripts/check-interface-parity.mjs --strict` on the branch: exits with "FAIL (--strict): gaps remain", 28 of 56 capabilities have MCP gaps (3 UI gaps), mostly outside this feature (outreach, resume outputs, cover letters, agent hub). Plain mode lists the same gaps and the self-test passes per the fix agent. For THIS feature:
- Rollup rows (KPI tiles, buckets, groups, atom groupings, definitions, overrides) have UI, API and MCP. Fine.
- `career-proficiency-read` (`GET /api/career/proficiency`, `/rollup-preview/:key`, `/rollups`, group "Resume rollups", `server/lib/capabilityParity.js:88`) has `mcp: null` with a gap note. This is a rollup capability without an MCP tool, which interface parity v3 fails as `MCP_GAP`. Unresolved requirement gap.
- `career-intake` and `career-mappings` (lines 93-94) are other Career Master features that this branch only newly listed; they belong to their own features' releases. Informational, not this feature's gap. (RR1-5 in round 1 was about rollups only.)

Step: MCP_GAP (interface parity). Root cause: fix r1 added tools for rollups, definitions and overrides but left the read-only proficiency / rollup-preview / legacy rollups routes as a recorded gap. Files: `server/routes/careerMaster.js`, `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json`, `server/lib/capabilityParity.js`. Proposed fix: extract bodies of `GET /proficiency`, `GET /rollup-preview/:key`, `GET /rollups` into exported functions, add append-only `career.read` tools (for example `career_proficiency_read`, `career_rollup_preview_read`, `career_rollups_read`), update manifest and the parity row, then rerun `check-interface-parity.mjs` and confirm no gap remains in group "Resume rollups".

## 3. Not walked in the browser (change spec Known limitations)
The Career Rollup block's "Group by" option in the Site editor (baseline coverage gap B5, proposed [J9.6]) and a second member with an empty Career Master (honest empty state) were never driven as a user. Unresolved until a validator walks them; the spec amendments proposed in `docs/triage/resume-rollups-round-1.md` (J9.5, J9.6, J12.2) still need reviewer decisions. Fix agent action: none in code unless the walk fails; re-validate round 2 should include both.

## 4. Other listed limitations
- "N Expert" evidence count vs the proficiency-engine tile can differ: documented, intended; no action.
- Fixed narrative labels on Case Study / Strategic Operator hero cards, multi-bucket counting, last row not removable: documented behaviour. No owner direction conflict found; the fix adds no admin-navigation entry points (changes are in the World Shell > Career Master panel and MCP).

## Verified from fix r1 (not re-listed as failures)
RR1-1 (footer wraps, `RollupGroupingsPanel.jsx`) and RR1-5 (eight rollup MCP tools) are present in the branch; the parity file lists them. RR1-3 and RR1-4 from round 1 are not mentioned in the fix agent's report or in the fix notes; I did not verify them, so confirm they are fixed or still open before round 2.
