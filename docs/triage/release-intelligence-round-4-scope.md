# release-intelligence round 4 scope review

## release-intelligence-RI-R1-1 -> this_feature

- The import script (`scripts/import-release-logs.mjs`) and `importRepository()` in `server/lib/releaseLogImporter.js` were created by this feature. Neither exists on the base before the feature merged, so the failure cannot be reproduced without it. Under the rule "if you cannot reproduce on the base, it is this_feature", this is this_feature.
- The importer's job is to walk `docs/release-log/` and exit 0 on a rerun. It does not do that. The `generatedFiles` skip list (`releaseIntelligenceConfig.js:31`) matches only exact top-level names (`release-tracker.md`, `updates.md`). It misses the 0.2.0 cut's `HANDOVER-0.3.0.md` and the frozen `releases/0.2.0/*.md` files (`release-tracker.md`, `updates.md`).
- The no-Date refusal is correct (required by E.3). The defect is the importer's classification of non-log files, which is this feature's own code.
- The 0.2.0 cut (commit 7d76341, release-loop-tooling) only added the files the importer should have tolerated. It did not change importer behaviour, so the owner is not another feature.
- No code was changed and nothing was committed.
