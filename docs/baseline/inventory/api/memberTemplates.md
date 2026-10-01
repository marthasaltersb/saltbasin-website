# API — server/routes/memberTemplates.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-member-templates | GET | `/api/member-templates` | `server/routes/memberTemplates.js:40` | inline: requireUser |  |
| TE-API-GET-api-member-templates-slug | GET | `/api/member-templates/:slug` | `server/routes/memberTemplates.js:45` | inline: requireUser |  |
| TE-API-POST-api-member-templates-seed | POST | `/api/member-templates/seed` | `server/routes/memberTemplates.js:51` | inline: requireAdmin |  |
| TE-API-POST-api-member-templates-slug-apply | POST | `/api/member-templates/:slug/apply` | `server/routes/memberTemplates.js:78` | inline: requireUser |  |
