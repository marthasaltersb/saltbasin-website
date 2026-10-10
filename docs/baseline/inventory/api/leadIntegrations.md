# API — server/routes/leadIntegrations.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-lead-integrations-ingest-provider | POST | `/api/lead-integrations/ingest/:provider` | `server/routes/leadIntegrations.js:73` | router: requireIntegrationKey |  |
| TE-API-GET-api-lead-integrations-leads-publicId | GET | `/api/lead-integrations/leads/:publicId` | `server/routes/leadIntegrations.js:97` | router: requireIntegrationKey |  |
| TE-API-POST-api-lead-integrations-sync-provider-publicId | POST | `/api/lead-integrations/sync/:provider/:publicId` | `server/routes/leadIntegrations.js:128` | router: requireIntegrationKey |  |
