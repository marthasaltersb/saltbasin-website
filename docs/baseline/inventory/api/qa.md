# API — server/routes/qa.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-qa-scenarios | GET | `/api/qa/scenarios` | `server/routes/qa.js:115` | router: requireAdmin |  |
| TE-API-GET-api-qa-scenarios-id | GET | `/api/qa/scenarios/:id` | `server/routes/qa.js:134` | router: requireAdmin |  |
| TE-API-POST-api-qa-scenarios | POST | `/api/qa/scenarios` | `server/routes/qa.js:184` | router: requireAdmin |  |
| TE-API-PATCH-api-qa-scenarios-id | PATCH | `/api/qa/scenarios/:id` | `server/routes/qa.js:274` | router: requireAdmin |  |
| TE-API-DELETE-api-qa-scenarios-id | DELETE | `/api/qa/scenarios/:id` | `server/routes/qa.js:335` | router: requireAdmin |  |
| TE-API-POST-api-qa-scenarios-scenarioId-steps | POST | `/api/qa/scenarios/:scenarioId/steps` | `server/routes/qa.js:352` | router: requireAdmin |  |
| TE-API-PATCH-api-qa-steps-id | PATCH | `/api/qa/steps/:id` | `server/routes/qa.js:384` | router: requireAdmin |  |
| TE-API-DELETE-api-qa-steps-id | DELETE | `/api/qa/steps/:id` | `server/routes/qa.js:417` | router: requireAdmin |  |
| TE-API-POST-api-qa-runs | POST | `/api/qa/runs` | `server/routes/qa.js:446` | router: requireAdmin |  |
| TE-API-GET-api-qa-runs | GET | `/api/qa/runs` | `server/routes/qa.js:577` | router: requireAdmin |  |
| TE-API-GET-api-qa-runs-id | GET | `/api/qa/runs/:id` | `server/routes/qa.js:590` | router: requireAdmin |  |
| TE-API-GET-api-qa-defects | GET | `/api/qa/defects` | `server/routes/qa.js:601` | router: requireAdmin |  |
| TE-API-POST-api-qa-seed-code-context-journeys | POST | `/api/qa/seed-code-context-journeys` | `server/routes/qa.js:619` | router: requireAdmin |  |
