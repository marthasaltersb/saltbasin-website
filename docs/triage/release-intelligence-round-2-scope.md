# Scope review - release-intelligence round 2

Reviewed 2026-10-10 on integration head c020576. No code changed, nothing committed.

## RI-R1-7 (MCP_GAP) -> this_feature

- docs/triage/scope-review.json has no entry for this id, so there was no earlier decision to reuse.
- The 17 release-intelligence routes without an MCP tool belong to the capability this feature adds (`server/routes/releaseIntelligence.js`, first added in e4f85ca). They cannot be pre-existing. The base commit before the feature's first merge has no release-intelligence routes at all. There is nothing on the base to reproduce the gap against.
- It does not belong to another feature.
  - The platform-mcp commit b77049b (2026-10-09) shipped only the seed registry. That registry includes `release_tracker_read`, which is the one tool the feature does have.
  - docs/changes/platform-mcp.md does not promise MCP tools for every release-intelligence route.
  - CLAUDE.md says "A new capability ships with its tool in the same change." The owning feature carries the tools for its own routes.
- The round-1 reason for deferring (registry not on the branch) no longer applies. definition.json interfaceParity says a capability with no MCP tool fails MCP_GAP once the platform MCP server exists, and it does now.
- The training spec docs/training/release-intelligence.md has no MCP steps (0 mentions of "mcp"). The fix therefore needs a spec amendment through docs/spec-amendments/release-intelligence/. The amendment reviewer must approve it. Fix agents must not edit the frozen spec or baseline.
- `server/routes/releaseIntelligence.js` is missing from `GOVERNED_ROUTE_FILES` in `server/lib/capabilityParity.js`. This lets `check-interface-parity` pass while the gap exists. That omission also belongs to this feature.

Owner: release-intelligence.
