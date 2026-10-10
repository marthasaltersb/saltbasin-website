# Scope review: qr-gated-outputs, round 2

Method: the earliest merge of the feature (aa14653) has a first parent (9e729b6) that already contains the feature's commits, so the true pre-feature base is the commit before the feature's first commit d78bcda ("Add QR-gated tailored application outputs with authorship metadata"): **e0ea466**. Checked with `git show e0ea466:<file>` and `git blame` (static reproduction of the wording; no behaviour depends on a build for these string/render facts). No docs/triage/scope-review.json entry exists for these ids.

| Id | Scope | Evidence |
|---|---|---|
| T1 | pre_existing | `Read-only — no edits...` is present at e0ea466 (MyResumePanel.jsx:922; blame 9b5ad4f0, 2026-08-09). The feature did not write or change it. Note: the frozen step expects a hyphen, so it still needs a fix, but the cause predates the feature. |
| T3 (x3 rows) | this_feature | The `Approved — private QR link created` toast is absent at e0ea466 and was introduced by d78bcda (blame d78bcdac, 2026-10-02), in the feature's own `approveForQr`. One edit clears J3.3, J7.1, J8.3. |
| T5 | pre_existing | `authLimiter` message with the em dash is present at e0ea466 (server/routes/auth.js:28, blame a875b9b, 2026-07-10). The login limiter is not part of this feature's request. |
| T2 | this_feature | `src/components/DocumentBlocksView.jsx` does not exist at e0ea466; created by d78bcda (blame line 94). `outputRendering.js:186` is also d78bcda. `documentBlocksEditor.js:28` is 7cc95edc (world-shell-opportunity-outputs, 2026-10-02) and shares the same `header.contact` shape, so fix all three with one shared normaliser (array -> join, string passthrough). |
| G1 | this_feature | The feature's training spec lacks a phone route to My Resume; World Shell > Journeys > My Resume works at 390px. The underlying hidden Classic Tools strip / missing mobile menu button is pre-existing platform behaviour (`sb-admin-mobile-menu-button` came in eb62057, 2026-08-09, before this feature) and not part of the request, so no code change is owed here. Only the spec's "Where things are" gap belongs to this feature (amendment, not a direct edit). |
| G2 | this_feature | The spec's own Draft-card steps (J10.3, E.1, E.2, E.4) need a fixture the spec does not give. Spec gap in this feature's document (amendment). |

Notes: docs/training/** and baselines are frozen; G1 and G2 go through docs/spec-amendments/qr-gated-outputs/ with a reviewer other than the proposer. No code was changed.
