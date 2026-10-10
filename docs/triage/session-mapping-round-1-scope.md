# session-mapping round 1 scope review

## T1 - this_feature
MCP_GAP: no session_mapping_* tools. The platform-mcp registry (b77049b, 2026-10-09 16:34) landed before the session-mapping build commit (31e7ba8, 17:22), and definition v3 requires a capability's MCP tool in the same change. The feature was asked to ship the capability, so the missing tool, manifest entry and capabilityParity row are its own gap. Not reproducible as "pre-existing": the 13 routes in server/routes/sessionMapping.js only exist because of this feature. No spec amendment needed (no frozen step depends on MCP).

## T2 - pre_existing
The DATABASE_URL throw in server/db.js is present before the feature (31e7ba8^ has the same check at the same place), and dotenv reads only .env (only .env.example is checked in). The hook behaves as specified: exits 0, logs to hook-failures.jsonl, and Scan server transcripts recovers it. Configuration state, not a code defect; no fix owed by this feature.
