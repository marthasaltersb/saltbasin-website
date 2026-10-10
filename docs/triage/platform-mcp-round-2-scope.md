# platform-mcp round 2 scope review

Integration head: f76786c. Reviewed 2026-10-10. No code changed. docs/triage/scope-review.json has no platform-mcp entries, so every item was decided here.

Base for pre_existing check: the feature's first merge is 20b2769 (code commit b77049b). The MCP server, MCP_SCOPES, mcpToolRegistry.js, CapabilitiesPanel.jsx and check-interface-parity.mjs all first appear in b77049b, so none of these items can exist without the feature. A base build is not meaningful (nothing to reproduce); git history is the evidence.

| id | scope | owner |
|---|---|---|
| platform-mcp-r2-T1 | this_feature | platform-mcp |
| platform-mcp-r2-T2 | this_feature | platform-mcp |
| platform-mcp-r2-T3 | this_feature | platform-mcp |
| platform-mcp-r2-T4 | this_feature | platform-mcp |
| platform-mcp-r2-T5 | this_feature | platform-mcp |

- T1: release.loop.read/write were added to MCP_SCOPES by 8ff2cb3 (in-app-release-loop fix). Platform-mcp's own rule requires every capability to ship its tool in the same change, so the growth is the feature working as designed. The step is platform-mcp's own spec and pins four scopes. Needs a spec amendment (recount at f76786c). The registry stays append-only; no code change.
- T2: the registry grew from 10 to 110 tools (qr-gated-outputs 27e4fda, in-app-release-loop 8ff2cb3, A3 gap closure). tools/list is correct. The step pins the 10-tool list. Re-propose amendment A4 with recounted values (96 for a token with career.read, career.write, outputs.approve). Spec amendment, no code change.
- T3: defect. src/components/admin/CapabilitiesPanel.jsx (created in b77049b) has no empty-state branch: with "Gaps only" and zero gaps, `groups` is empty and nothing renders. Confirmed by reading the file. Approved amendment A3 correctly requires the no-gaps message. Fix: render a message when rows is empty (and data is loaded).
- T4: scripts/check-interface-parity.mjs (b77049b) prints "Gaps:" only when gaps.length is non-zero. With 72 of 72 complete this is correct behaviour; the step was written while 28 gaps existed. Spec amendment (no "Gaps:" heading when none).
- T5: --strict exits 0 when gaps.length is 0, which follows the change spec and triage B5; J10.4 in the same baseline requires the import capability ready in all three interfaces, so the old J11.2 expectation is stale and self-contradictory. Re-propose A4 with first line "72 of 72" recounted at f76786c. Spec amendment, no code change.

Process note: T1, T2, T4, T5 are all one cause (baseline v1 predates gap closure and later features adding tools). One consolidated amendment, approved by a reviewer other than the proposer, is the right route; no one edits docs/training/** or baselines directly.
