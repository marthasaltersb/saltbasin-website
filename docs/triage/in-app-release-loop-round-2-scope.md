# Scope review: in-app-release-loop, round 2

Method: read docs/triage/scope-review.json and the round-1 scope file, then verified the base tree directly. The earliest merge of in-app-release-loop is 50b5c98 (2026-10-09 16:39); its first parent already contains `server/lib/mcpToolRegistry.js` (platform-mcp, b77049b, merged 20b2769 at 16:36, three minutes earlier). No browser reproduction needed: the claim is decidable from the base tree. No code changed.

| Id | Scope | Owner |
| --- | --- | --- |
| T2 (round 1) | this_feature | in-app-release-loop |

## T2 (round 1): this_feature
Spec step E.8 in docs/training/in-app-release-loop.md (baseline v1, line 709 of the v1 JSON) asserts `server/lib/mcpToolRegistry.js` is absent and assigns an MCP gap to platform-mcp. On the base commit the file already exists, so the step was wrong when written. It is not caused by platform-mcp: its registry worked and was merged before this feature. After fix round 1 (8ff2cb3, merged 3e4bcc1) this feature itself registers the 13 `release_loop_*` tools, which the change spec (docs/changes/in-app-release-loop.md line 65) requires and definition.json `interfaceParity` demands once the platform MCP server exists. So the step contradicts the feature's own spec and delivered code. This agrees with the round-1 scope decision (docs/triage/in-app-release-loop-round-1-scope.md, T2). Note: the "T2" id in docs/triage/scope-review.json belongs to qr-gated-outputs and is unrelated.

Resolution path: a spec_error, so only an approved amendment (docs/spec-amendments/in-app-release-loop/, which does not exist yet, so none has been filed or decided; that is why it recurred) can change it. Proposed amendment for E.8: run `ls server/lib/mcpToolRegistry.js` and expect it to print the path; then check `tools/list` (or the manifest server/data/mcpToolManifest.json) contains the `release_loop_*` tools. The amendment must be approved by a reviewer other than the proposer. No agent other than the amendment reviewer edits the spec or baseline.
