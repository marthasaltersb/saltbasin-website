# API — server/routes/config.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-config-public | GET | `/api/config/public` | `server/routes/config.js:46` | handler: isLandingUnlocked |  |
| TE-API-GET-api-config-draft | GET | `/api/config/draft` | `server/routes/config.js:60` | inline: requireAdmin |  |
| TE-API-PUT-api-config-draft | PUT | `/api/config/draft` | `server/routes/config.js:65` | inline: requireAdmin |  |
| TE-API-GET-api-config-admin-nav | GET | `/api/config/admin-nav` | `server/routes/config.js:83` | inline: requireAdmin |  |
| TE-API-PUT-api-config-admin-nav | PUT | `/api/config/admin-nav` | `server/routes/config.js:88` | inline: requireAdmin |  |
| TE-API-GET-api-config-page-types | GET | `/api/config/page-types` | `server/routes/config.js:122` | inline: requireAdmin |  |
| TE-API-PUT-api-config-page-types | PUT | `/api/config/page-types` | `server/routes/config.js:127` | inline: requireAdmin |  |
| TE-API-POST-api-config-test-email | POST | `/api/config/test-email` | `server/routes/config.js:149` | inline: requireAdmin |  |
