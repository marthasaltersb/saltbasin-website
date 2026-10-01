# API — server/routes/memberSite.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-member-site-draft | GET | `/api/member-site/draft` | `server/routes/memberSite.js:125` | inline: requireUser; handler: requireMemberFeature |  |
| TE-API-PUT-api-member-site-draft | PUT | `/api/member-site/draft` | `server/routes/memberSite.js:130` | inline: requireUser,requireMemberFeature; handler: requireMemberFeature |  |
| TE-API-POST-api-member-site-publish | POST | `/api/member-site/publish` | `server/routes/memberSite.js:170` | inline: requireUser,requireMemberFeature; handler: requireMemberFeature |  |
| TE-API-GET-api-member-site-featured | GET | `/api/member-site/featured` | `server/routes/memberSite.js:223` | none detected |  |
| TE-API-GET-api-member-site-by-slug-slug | GET | `/api/member-site/by-slug/:slug` | `server/routes/memberSite.js:254` | none detected |  |
| TE-API-POST-api-member-site-by-slug-slug-unlock | POST | `/api/member-site/by-slug/:slug/unlock` | `server/routes/memberSite.js:285` | none detected |  |
| TE-API-GET-api-member-site-by-slug-slug-resume-url | GET | `/api/member-site/by-slug/:slug/resume-url` | `server/routes/memberSite.js:308` | none detected |  |
