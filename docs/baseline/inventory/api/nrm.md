# API — server/routes/nrm.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-nrm-contacts | GET | `/api/nrm/contacts` | `server/routes/nrm.js:29` | handler: requireAuth |  |
| TE-API-POST-api-nrm-contacts | POST | `/api/nrm/contacts` | `server/routes/nrm.js:54` | handler: requireAuth |  |
| TE-API-GET-api-nrm-contacts-id | GET | `/api/nrm/contacts/:id` | `server/routes/nrm.js:76` | handler: requireAuth |  |
| TE-API-PUT-api-nrm-contacts-id | PUT | `/api/nrm/contacts/:id` | `server/routes/nrm.js:91` | handler: requireAuth |  |
| TE-API-DELETE-api-nrm-contacts-id | DELETE | `/api/nrm/contacts/:id` | `server/routes/nrm.js:113` | handler: requireAuth |  |
| TE-API-GET-api-nrm-reference-requests | GET | `/api/nrm/reference-requests` | `server/routes/nrm.js:131` | handler: requireAuth |  |
| TE-API-POST-api-nrm-reference-requests | POST | `/api/nrm/reference-requests` | `server/routes/nrm.js:154` | none detected |  |
| TE-API-PUT-api-nrm-reference-requests-id-status | PUT | `/api/nrm/reference-requests/:id/status` | `server/routes/nrm.js:197` | handler: requireAdmin |  |
| TE-API-GET-api-nrm-marketplace-search | GET | `/api/nrm/marketplace/search` | `server/routes/nrm.js:223` | none detected |  |
| TE-API-GET-api-nrm-opted-in-members | GET | `/api/nrm/opted-in-members` | `server/routes/nrm.js:243` | handler: requireAuth |  |
