# API — server/routes/oauth.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-oauth-provider-connect | GET | `/api/oauth/:provider/connect` | `server/routes/oauth.js:33` | handler: requireAuth |  |
| TE-API-GET-api-oauth-provider-callback | GET | `/api/oauth/:provider/callback` | `server/routes/oauth.js:106` | none detected |  |
| TE-API-POST-api-oauth-supabase-pat | POST | `/api/oauth/supabase/pat` | `server/routes/oauth.js:177` | handler: requireAuth |  |
| TE-API-GET-api-oauth-connections | GET | `/api/oauth/connections` | `server/routes/oauth.js:216` | handler: requireAuth |  |
| TE-API-PATCH-api-oauth-connections-provider | PATCH | `/api/oauth/connections/:provider` | `server/routes/oauth.js:261` | handler: requireAuth |  |
| TE-API-DELETE-api-oauth-connections-provider | DELETE | `/api/oauth/connections/:provider` | `server/routes/oauth.js:277` | handler: requireAuth |  |
