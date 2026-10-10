# API — server/routes/globalStandards.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-standards | GET | `/api/standards` | `server/routes/globalStandards.js:21` | handler: getUserFromCookie |  |
| TE-API-GET-api-standards-id | GET | `/api/standards/:id` | `server/routes/globalStandards.js:37` | none detected |  |
| TE-API-POST-api-standards | POST | `/api/standards` | `server/routes/globalStandards.js:48` | handler: requireAdmin |  |
| TE-API-PUT-api-standards-id | PUT | `/api/standards/:id` | `server/routes/globalStandards.js:67` | handler: requireAdmin |  |
| TE-API-DELETE-api-standards-id | DELETE | `/api/standards/:id` | `server/routes/globalStandards.js:86` | handler: requireAdmin |  |
| TE-API-POST-api-standards-id-publish | POST | `/api/standards/:id/publish` | `server/routes/globalStandards.js:98` | handler: requireAdmin |  |
| TE-API-GET-api-standards-public-list | GET | `/api/standards/public/list` | `server/routes/globalStandards.js:110` | none detected |  |
