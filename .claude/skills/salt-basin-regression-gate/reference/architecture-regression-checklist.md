# Architecture Regression Checklist

Run after the interaction/functional testing above. Confirm the build has **not**:

- Reintroduced Journey terminology where Channel/Channel Rod terminology is now canonical (note: as of
  this writing `src/lib/journeyEngine/*`, `server/routes/journeyRods.js`, and `journey_data_rods` are the
  live shipped vocabulary and a Journey→Channel rename is an unresolved Betsy decision per
  `docs/salt-basin-master-build-progress.md` — don't flag the existing shipped naming itself as a
  regression, flag *new* code that diverges from whatever the current resolved vocabulary is)
- Created duplicate Member user types
- Hardcoded Organization Admin as an identity type (org-admin capability must derive from
  `data_entitlements` / role+tier, not a fixed identity enum)
- Broken Member-private vs. Organization-private scope
- Flattened divergent source truth (collapsed multiple sources into one where divergence was meaningful)
- Removed effective dating
- Removed lineage
- Bypassed Agent Boundaries
- Converted configuration into hardcoded logic (a registry-driven value replaced by an inline
  conditional/switch — cross-reference `salt-basin-config-audit`)
- Reduced the 3D renderer to decorative visualization (scene composition must remain configurable and
  semantically driven, not a static background)
- Introduced unapproved Salt Basin colors
- Introduced brown hues
- Overused pink
- Lost the rotating 3D perspective as the primary brand anchor

For each item, don't just answer yes/no — cite the specific file/line that proves the check, or name the
absence of evidence if you can't confirm it either way.

## Foundation reconciliation (final step)

1. Read `docs/salt-basin-foundation-source-of-truth.md`.
2. If the build introduced a new canonical architecture decision (a naming choice, a scope rule, a new
   entity relationship), update the Foundation to reflect it — this keeps the Foundation authoritative
   instead of stale.
3. If the build conflicts with the Foundation, do **not** silently overwrite the Foundation. Identify the
   conflict explicitly and preserve it as an unresolved decision in
   `docs/salt-basin-master-build-progress.md`'s flagged-conflicts section, unless Betsy gives an explicit
   instruction in this conversation that resolves it.
