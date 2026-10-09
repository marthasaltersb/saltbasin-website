# chart-gallery round 2 scope review

Base = a5e7883 (first parent of merge 8430eae, the earliest chart-gallery merge). Decided by code history on the base; no live base build was run (the base has no UI that can place a career chart in the preview, so the clipping cannot be exercised there).

| id | scope | evidence |
|---|---|---|
| CG-R1-1 | this_feature | Reused from docs/triage/scope-review.json. position:sticky live-preview column added by 6dd06e5. Fix branch release-loop/chart-gallery-fix-r1 (dc6b5f0) is not an ancestor of HEAD (git merge-base --is-ancestor), so it was never merged. |
| CG-R1-2 | this_feature | Reused from scope-review.json. Spec line 77 requires the HTTP status in the failed-load alert; the proficiency loader was wired by the gallery build; api.js request() omits the status. |
| CG-R2-1 | this_feature | min-width:500px in src/lib/careerCharts.js came from cffa621 (proficiency-live-qr, made for phone-width scroll in a full-width container). It becomes a defect only in the 380px preview column the gallery added: a5e7883's OutputTemplateConfigurator.jsx has no career-chart block, picker or preview (grep finds only bar-chart-h/v), so on the base the chart cannot appear in the preview and the clipping cannot be reproduced. The request is a chart visible beside the live preview, so the feature must make it fit (for example the preview wrapper allows horizontal scroll or the gallery drops the min-width). The spec step J2 2.1 should also assert the SVG's right edge is inside the column, not only text in the DOM. Not other_feature: the min-width is correct in its original context. |
