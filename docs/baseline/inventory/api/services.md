# API — server/routes/services.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-services-proposals | GET | `/api/services/proposals` | `server/routes/services.js:29` | handler: requireAdmin |  |
| TE-API-POST-api-services-proposals | POST | `/api/services/proposals` | `server/routes/services.js:42` | handler: requireAdmin |  |
| TE-API-GET-api-services-proposals-id | GET | `/api/services/proposals/:id` | `server/routes/services.js:62` | none detected |  |
| TE-API-PUT-api-services-proposals-id | PUT | `/api/services/proposals/:id` | `server/routes/services.js:94` | handler: requireAdmin |  |
| TE-API-POST-api-services-proposals-id-publish | POST | `/api/services/proposals/:id/publish` | `server/routes/services.js:111` | handler: requireAdmin |  |
| TE-API-POST-api-services-proposals-id-request-access | POST | `/api/services/proposals/:id/request-access` | `server/routes/services.js:126` | none detected |  |
| TE-API-GET-api-services-proposals-id-access | GET | `/api/services/proposals/:id/access` | `server/routes/services.js:186` | handler: requireAdmin |  |
| TE-API-GET-api-services-leads | GET | `/api/services/leads` | `server/routes/services.js:203` | handler: requireAuth |  |
| TE-API-DELETE-api-services-proposals-id | DELETE | `/api/services/proposals/:id` | `server/routes/services.js:220` | handler: requireAuth |  |
| TE-API-GET-api-services-public | GET | `/api/services/public` | `server/routes/services.js:232` | none detected |  |
