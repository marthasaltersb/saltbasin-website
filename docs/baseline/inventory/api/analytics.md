# API — server/routes/analytics.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-analytics-events | POST | `/api/analytics/events` | `server/routes/analytics.js:29` | none detected |  |
| TE-API-GET-api-analytics-admin-summary | GET | `/api/analytics/admin/summary` | `server/routes/analytics.js:68` | handler: requireAdmin |  |
| TE-API-GET-api-analytics-admin-member-userId | GET | `/api/analytics/admin/member/:userId` | `server/routes/analytics.js:124` | handler: requireAdmin |  |
| TE-API-GET-api-analytics-member-summary | GET | `/api/analytics/member/summary` | `server/routes/analytics.js:153` | handler: getUserFromCookie |  |
| TE-API-POST-api-analytics-member-resume-download | POST | `/api/analytics/member/resume-download` | `server/routes/analytics.js:190` | handler: getUserFromCookie |  |
