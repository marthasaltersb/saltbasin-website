# career-bound-outputs round 4 scope review

Integration head reviewed: a21aaec. Pre-feature base: ed0024d (first parent of merge 76083cc, career-bound-outputs build).

| Id | Scope | Evidence |
|---|---|---|
| T4-1 | this_feature | Line 549 `onClick={revert}` was introduced by 4a70228 (round 3 fix, this feature); `revert` is declared at line 586 inside a map callback. At base ed0024d, OutputTemplateConfigurator.jsx has 0 references to ovPicks/masterOverrides, so the override UI does not exist there and the crash cannot reproduce without this feature. The four T4-1 steps share this one cause. |
| T3-5 | this_feature | Line 595 `onClick={() => setField(null)}` came from 95c2adf (this feature's fix r2); the override UI is this feature's (9df7a85/95c2adf). Base has no override rows to revert. Same wrong-button mistake as T4-1. |
| F3-2 | this_feature | Spec error in this feature's training spec: sync-failure UI is implemented as the change spec says, but no browser user can trigger it. Needs an amendment (not a direct edit). |
| F3-3 | this_feature | Spec wording error in this feature's training spec ("red box" vs the amber warnBox). CareerReconciliationPanel.jsx was added by ba89744/9df7a85 for this feature. Needs an amendment. |
| F3-5 | this_feature | Request says packages enter Career Master via the reconciliation queue, a new capability; interface-parity rule requires an MCP tool and a capabilityParity row. None exist; careerReconciliation.js and the output-override routes are not in GOVERNED_ROUTE_FILES. |
| F3-4 | this_feature | Converted-row state in CareerReconciliationPanel.jsx is this feature's UI (recurrence of F2-8, already this_feature). Coverage gap: needs an amendment adding a step. |
