# API — server/routes/governance.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-governance-pending | GET | `/api/governance/pending` | `server/routes/governance.js:15` | handler: requireAdmin,getUserFromCookie |  |
| TE-API-GET-api-governance-overrides | GET | `/api/governance/overrides` | `server/routes/governance.js:40` | handler: getUserFromCookie |  |
| TE-API-POST-api-governance-pending | POST | `/api/governance/pending` | `server/routes/governance.js:62` | handler: getUserFromCookie |  |
| TE-API-POST-api-governance-pending-id-approve | POST | `/api/governance/pending/:id/approve` | `server/routes/governance.js:84` | handler: getUserFromCookie |  |
| TE-API-POST-api-governance-pending-id-reject | POST | `/api/governance/pending/:id/reject` | `server/routes/governance.js:121` | handler: getUserFromCookie |  |
