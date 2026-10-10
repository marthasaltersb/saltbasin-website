# API — server/routes/lineage.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-lineage-snapshots | GET | `/api/lineage/snapshots` | `server/routes/lineage.js:18` | handler: requireAdmin |  |
| TE-API-GET-api-lineage-snapshots-id-fields | GET | `/api/lineage/snapshots/:id/fields` | `server/routes/lineage.js:38` | handler: requireAdmin |  |
| TE-API-GET-api-lineage-field | GET | `/api/lineage/field` | `server/routes/lineage.js:60` | handler: requireAdmin |  |
| TE-API-GET-api-lineage-entities | GET | `/api/lineage/entities` | `server/routes/lineage.js:83` | handler: requireAdmin |  |
