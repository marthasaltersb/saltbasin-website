# API — server/routes/eidos.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-eidos-rod-types | GET | `/api/eidos/rod-types` | `server/routes/eidos.js:19` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-rod-types-id | PUT | `/api/eidos/rod-types/:id` | `server/routes/eidos.js:22` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-rod-types-id | DELETE | `/api/eidos/rod-types/:id` | `server/routes/eidos.js:31` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-ports | GET | `/api/eidos/ports` | `server/routes/eidos.js:38` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-ports-key | PUT | `/api/eidos/ports/:key` | `server/routes/eidos.js:41` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-ports-key | DELETE | `/api/eidos/ports/:key` | `server/routes/eidos.js:58` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-ports-portId-source-objects | GET | `/api/eidos/ports/:portId/source-objects` | `server/routes/eidos.js:63` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-ports-portId-source-objects-key | PUT | `/api/eidos/ports/:portId/source-objects/:key` | `server/routes/eidos.js:66` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-source-objects-sourceObjectId-fields | GET | `/api/eidos/source-objects/:sourceObjectId/fields` | `server/routes/eidos.js:75` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-source-objects-sourceObjectId-fields-key | PUT | `/api/eidos/source-objects/:sourceObjectId/fields/:key` | `server/routes/eidos.js:78` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-affinity-rules | GET | `/api/eidos/affinity-rules` | `server/routes/eidos.js:89` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-affinity-rules-clusterKey-moleculeKey | PUT | `/api/eidos/affinity-rules/:clusterKey/:moleculeKey` | `server/routes/eidos.js:92` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-affinity-rules-clusterKey-moleculeKey | DELETE | `/api/eidos/affinity-rules/:clusterKey/:moleculeKey` | `server/routes/eidos.js:109` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-settlement-states-rodId | GET | `/api/eidos/settlement-states/:rodId` | `server/routes/eidos.js:116` | inline: requireAdmin |  |
| TE-API-POST-api-eidos-settlement-states-rodId-compute | POST | `/api/eidos/settlement-states/:rodId/compute` | `server/routes/eidos.js:119` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-accounting-policies | GET | `/api/eidos/accounting-policies` | `server/routes/eidos.js:126` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-accounting-policies-key | PUT | `/api/eidos/accounting-policies/:key` | `server/routes/eidos.js:129` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-accounting-policies-key | DELETE | `/api/eidos/accounting-policies/:key` | `server/routes/eidos.js:141` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-gl-accounts | GET | `/api/eidos/gl-accounts` | `server/routes/eidos.js:147` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-gl-accounts-key | PUT | `/api/eidos/gl-accounts/:key` | `server/routes/eidos.js:150` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-gl-accounts-key | DELETE | `/api/eidos/gl-accounts/:key` | `server/routes/eidos.js:162` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-accounting-topologies | GET | `/api/eidos/accounting-topologies` | `server/routes/eidos.js:168` | inline: requireAdmin |  |
| TE-API-PUT-api-eidos-accounting-topologies-key | PUT | `/api/eidos/accounting-topologies/:key` | `server/routes/eidos.js:171` | inline: requireAdmin |  |
| TE-API-DELETE-api-eidos-accounting-topologies-key | DELETE | `/api/eidos/accounting-topologies/:key` | `server/routes/eidos.js:184` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-journal-entries | GET | `/api/eidos/journal-entries` | `server/routes/eidos.js:190` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-journal-entries-id | GET | `/api/eidos/journal-entries/:id` | `server/routes/eidos.js:197` | inline: requireAdmin |  |
| TE-API-POST-api-eidos-journal-entries | POST | `/api/eidos/journal-entries` | `server/routes/eidos.js:203` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-reciprocal-requirements-topologyId | GET | `/api/eidos/reciprocal/requirements/:topologyId` | `server/routes/eidos.js:223` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-reciprocal-comparisons-rodId | GET | `/api/eidos/reciprocal/comparisons/:rodId` | `server/routes/eidos.js:226` | inline: requireAdmin |  |
| TE-API-GET-api-eidos-reciprocal-divergences-rodId | GET | `/api/eidos/reciprocal/divergences/:rodId` | `server/routes/eidos.js:229` | inline: requireAdmin |  |
| TE-API-POST-api-eidos-reciprocal-divergences-compute | POST | `/api/eidos/reciprocal/divergences/compute` | `server/routes/eidos.js:232` | inline: requireAdmin |  |
