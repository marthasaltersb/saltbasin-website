# Scope review: qr-gated-outputs, round 3

Base: e0ea466 (commit before the feature's first commit d78bcda; the earliest merge aa14653's first parent already contains the feature). Fresh database booted on e0ea466 on port 5118; DB dropped, process stopped, worktree returned to the integration head. No code changed.

| Id | Scope | Evidence |
|---|---|---|
| T1 / F2-2 | pre_existing | `Read-only — no edits...` exists at e0ea466 (MyResumePanel.jsx:922, blame 9b5ad4f). Contrary to the older scope-review.json entry (this_feature), the string predates the feature (same finding as round 2). It still needs a code fix to a hyphen to match the frozen step. |
| T5 / F2-3 | pre_existing | `authLimiter` em-dash message exists at e0ea466 (server/routes/auth.js:28, a875b9b). Login limiter is outside this feature's request. Early trip after 6 attempts is expected shared-limiter behaviour, not a defect. |
| F2-1 | process_note | Fix round 2 did not run browser validation; loop process item. J2.1, J3.3, J7.1, J8.3 need re-validation. |
| F2-5 | pre_existing | Reproduced on e0ea466 with a fresh database: boot logs 33 `column ... already exists, skipping` NOTICEs (code 42701, check_for_column_name_collision) plus the known journey_data_rods "table may not exist yet" warnings. Harmless Postgres notices; db.js has no change from this feature. Matches the CLAUDE.md known fresh-DB ordering bug. |
| F2-6 | this_feature | DocumentBlocksView.jsx and headerContact.js were created by this feature (d78bcda, 73505f4); header.contact separator is its own rendering. Needs browser verification. |
| F2-7 | pre_existing | In-app package import is not in the request ("fictional package import", script). Script-only since d78bcda. Reuse scope-review.json qr-gated-outputs-B9. |
| F2-8 | this_feature | "Clickable QR in PDF/docx" is in the request. stamp-application-package-docx.py, sync-site-with-application-package.mjs and the docx path were added by d78bcda and are untested. Reuse B10. |
| F2-9 | pre_existing | Mobile menu / hidden Classic Tools predates the feature (eb62057) and phone navigation is not in the request. Reuse B8 and round 2 G1. |
| F2-10 | this_feature | The platform MCP registry now exists (b77049b), with application_output_approve_for_qr, but no tool for revoke, which is in this feature's request. (Import has no MCP tool either, but import is out of scope per F2-7.) The "platform-mcp not built" cause is stale. |
| F2-11 | this_feature | Spec's own preconditions/where-things-are (reuse B7). Needs an amendment, not a direct edit. |
| F2-12 | this_feature | Spec's own fixture gap for J10.3/E.1/E.2/E.4 (round 2 G2). Needs an amendment. |

Notes: docs/training/** and baselines are frozen; F2-11 and F2-12 go through docs/spec-amendments/qr-gated-outputs/.
