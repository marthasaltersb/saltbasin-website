# Scope review: output-version-history, round 1

Base for reproduction: first parent of the earliest merge f3171a8 (the commit before the feature merged). No code changed; no browser rebuild was run. T1 was proven by code inspection of that base commit (below), everything else by existing classifications in docs/triage/scope-review.json and git history.

| Id | Scope | Owner | Evidence |
|---|---|---|---|
| T1 (My Resume at 390px) | pre_existing | - | At the base commit, src/brand.css already contains the `.sb-admin-mobile-drawer` rules (13 matches) and hides `.sb-admin-topbar-actions` at max-width 900px; no JSX in src renders any `sb-admin-mobile-*` class. The CSS came from eb62057 (2026-08-09, "world-scoped agent orbits and LLM governance"), long before this feature. The feature only adds a Version history button inside existing panels and did not touch AdminShell.jsx or the topbar. Not reproduced in a browser; the cause is visible in the base source. |
| T1 (Career Master / My Resume at 390px) | pre_existing | - | Same root cause and same commit as above. |
| T3 (unreadable version not producible) | this_feature | - | The step is in this feature's own training spec (docs/training/output-version-history.md). Product behaviour matches the spec, but the step cannot be performed through the interface, so the spec must change by amendment. |
| T4 (foreign output id) | this_feature | - | Same: spec step in this feature's own spec is API-only by nature; the 404 behaviour in server/routes/resumeOutputs.js is correct. Needs an amendment marking it API-only. |
| T5 (MCP tool missing) | pre_existing | - | server/lib/mcpToolRegistry.js has no history in git and does not exist. The platform MCP server is a separate feature (platform-mcp, not in the other_feature owner list). definition.json interfaceParity says to record the gap and assign it to platform-mcp until the server exists. Not part of this feature's request. |
| T6 (chart-only change shows no diff) | this_feature | - | Request asks for block-level tracked changes. toDiffItems in src/lib/outputVersionDiff.js is the feature's own code (e2752fd), same basis as output-version-history-B10 in scope-review.json. |
| T7 (no entry in OutputTemplateConfigurator) | this_feature | - | Request says reachable from the output editor; entry points were chosen by this feature (e2752fd). Same as output-version-history-B11. |
| T8 (spec wording stale) | this_feature | - | Spec preconditions use riley.member and public signup; the spec is the feature's own. Same as output-version-history-B14; "HEADER fields" label is likewise this spec's wording. |
| T9 (drafts not frozen) | this_feature | - | versionBody() in server/lib/outputVersionHistory.js resolves drafts live; same as output-version-history-B8 (this_feature). The rule needs an owner decision (spec J3.1/J5.3 say live, the request implies a reproducible body), so it also stays needs_business_definition. The underlying design that has no stored draft body belongs to career-bound-outputs (see B9), but the history feature's choice to read it live is its own. |

Process notes: none.
