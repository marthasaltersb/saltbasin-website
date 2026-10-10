# API — server/routes/backlog.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-backlog | GET | `/api/backlog` | `server/routes/backlog.js:164` | router: requireAdmin |  |
| TE-API-GET-api-backlog-groups | GET | `/api/backlog/groups` | `server/routes/backlog.js:178` | router: requireAdmin |  |
| TE-API-POST-api-backlog-groups | POST | `/api/backlog/groups` | `server/routes/backlog.js:185` | router: requireAdmin |  |
| TE-API-PATCH-api-backlog-groups-id | PATCH | `/api/backlog/groups/:id` | `server/routes/backlog.js:197` | router: requireAdmin |  |
| TE-API-GET-api-backlog-items-id | GET | `/api/backlog/items/:id` | `server/routes/backlog.js:217` | router: requireAdmin |  |
| TE-API-POST-api-backlog-items | POST | `/api/backlog/items` | `server/routes/backlog.js:239` | router: requireAdmin |  |
| TE-API-PATCH-api-backlog-items-id | PATCH | `/api/backlog/items/:id` | `server/routes/backlog.js:287` | router: requireAdmin |  |
| TE-API-DELETE-api-backlog-items-id | DELETE | `/api/backlog/items/:id` | `server/routes/backlog.js:307` | router: requireAdmin |  |
| TE-API-POST-api-backlog-items-id-clone | POST | `/api/backlog/items/:id/clone` | `server/routes/backlog.js:316` | router: requireAdmin |  |
| TE-API-GET-api-backlog-quality-coverage | GET | `/api/backlog/quality-coverage` | `server/routes/backlog.js:327` | router: requireAdmin |  |
| TE-API-POST-api-backlog-seed | POST | `/api/backlog/seed` | `server/routes/backlog.js:337` | router: requireAdmin |  |
| TE-API-GET-api-backlog-summary | GET | `/api/backlog/summary` | `server/routes/backlog.js:440` | router: requireAdmin |  |
| TE-API-GET-api-backlog-snapshots | GET | `/api/backlog/snapshots` | `server/routes/backlog.js:602` | router: requireAdmin |  |
| TE-API-POST-api-backlog-snapshot | POST | `/api/backlog/snapshot` | `server/routes/backlog.js:633` | router: requireAdmin |  |
| TE-API-GET-api-backlog-patch-notes | GET | `/api/backlog/patch-notes` | `server/routes/backlog.js:681` | router: requireAdmin |  |
| TE-API-GET-api-backlog-methodology | GET | `/api/backlog/methodology` | `server/routes/backlog.js:691` | router: requireAdmin |  |
