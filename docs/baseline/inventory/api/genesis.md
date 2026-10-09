# API — server/routes/genesis.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-genesis-summary | GET | `/api/genesis/summary` | `server/routes/genesis.js:51` | router: requireAdmin |  |
| TE-API-GET-api-genesis-catalog-layer-table | GET | `/api/genesis/catalog/:layer/:table` | `server/routes/genesis.js:62` | router: requireAdmin |  |
| TE-API-GET-api-genesis-catalog-layer | GET | `/api/genesis/catalog/:layer` | `server/routes/genesis.js:74` | router: requireAdmin |  |
| TE-API-GET-api-genesis-configurations | GET | `/api/genesis/configurations` | `server/routes/genesis.js:80` | router: requireAdmin |  |
| TE-API-PUT-api-genesis-configurations | PUT | `/api/genesis/configurations` | `server/routes/genesis.js:86` | router: requireAdmin |  |
| TE-API-POST-api-genesis-evaluate | POST | `/api/genesis/evaluate` | `server/routes/genesis.js:105` | router: requireAdmin |  |
| TE-API-GET-api-genesis-overlaps-summary | GET | `/api/genesis/overlaps/summary` | `server/routes/genesis.js:121` | router: requireAdmin |  |
| TE-API-GET-api-genesis-overlaps | GET | `/api/genesis/overlaps` | `server/routes/genesis.js:140` | router: requireAdmin |  |
| TE-API-PATCH-api-genesis-overlaps-id | PATCH | `/api/genesis/overlaps/:id` | `server/routes/genesis.js:159` | router: requireAdmin |  |
| TE-API-GET-api-genesis-overlaps-id-recommendation | GET | `/api/genesis/overlaps/:id/recommendation` | `server/routes/genesis.js:190` | router: requireAdmin |  |
| TE-API-POST-api-genesis-overlaps-id-resolution-preview | POST | `/api/genesis/overlaps/:id/resolution-preview` | `server/routes/genesis.js:196` | router: requireAdmin |  |
| TE-API-POST-api-genesis-overlaps-id-resolution-decision | POST | `/api/genesis/overlaps/:id/resolution-decision` | `server/routes/genesis.js:209` | router: requireAdmin |  |
