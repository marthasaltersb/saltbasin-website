# API — server/routes/memberConfig.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-member-config-page-types | GET | `/api/member-config/page-types` | `server/routes/memberConfig.js:47` | inline: requireUser |  |
| TE-API-GET-api-member-config-draft | GET | `/api/member-config/draft` | `server/routes/memberConfig.js:81` | inline: requireUser |  |
| TE-API-PUT-api-member-config-draft | PUT | `/api/member-config/draft` | `server/routes/memberConfig.js:101` | inline: requireUser,requireMemberFeature; handler: requireMemberFeature |  |
| TE-API-POST-api-member-config-publish | POST | `/api/member-config/publish` | `server/routes/memberConfig.js:137` | inline: requireUser,requireMemberFeature; handler: requireMemberFeature |  |
