# API — server/routes/site.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-site-resume-url | GET | `/api/site/resume-url` | `server/routes/site.js:30` | none detected |  |
| TE-API-GET-api-site-published | GET | `/api/site/published` | `server/routes/site.js:54` | handler: isLandingUnlocked |  |
| TE-API-GET-api-site-draft | GET | `/api/site/draft` | `server/routes/site.js:68` | inline: requireAdmin; handler: getUserFromCookie |  |
| TE-API-PUT-api-site-draft | PUT | `/api/site/draft` | `server/routes/site.js:73` | inline: requireAdmin; handler: getUserFromCookie |  |
| TE-API-POST-api-site-publish | POST | `/api/site/publish` | `server/routes/site.js:97` | inline: requireAdmin; handler: getUserFromCookie |  |
