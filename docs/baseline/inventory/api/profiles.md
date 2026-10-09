# API — server/routes/profiles.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-profiles-me-personal | GET | `/api/profiles/me/personal` | `server/routes/profiles.js:36` | handler: requireAuth |  |
| TE-API-PATCH-api-profiles-me-personal | PATCH | `/api/profiles/me/personal` | `server/routes/profiles.js:72` | handler: requireAuth |  |
| TE-API-GET-api-profiles-me-orgs | GET | `/api/profiles/me/orgs` | `server/routes/profiles.js:105` | handler: requireAuth |  |
| TE-API-POST-api-profiles-me-orgs | POST | `/api/profiles/me/orgs` | `server/routes/profiles.js:123` | handler: requireAuth |  |
| TE-API-GET-api-profiles-orgs-orgId | GET | `/api/profiles/orgs/:orgId` | `server/routes/profiles.js:180` | handler: requireAuth |  |
| TE-API-PATCH-api-profiles-orgs-orgId | PATCH | `/api/profiles/orgs/:orgId` | `server/routes/profiles.js:203` | handler: requireAuth |  |
| TE-API-DELETE-api-profiles-orgs-orgId | DELETE | `/api/profiles/orgs/:orgId` | `server/routes/profiles.js:228` | handler: requireAuth |  |
| TE-API-POST-api-profiles-orgs-orgId-members | POST | `/api/profiles/orgs/:orgId/members` | `server/routes/profiles.js:244` | handler: requireAuth |  |
| TE-API-PATCH-api-profiles-orgs-orgId-members-userId | PATCH | `/api/profiles/orgs/:orgId/members/:userId` | `server/routes/profiles.js:295` | handler: requireAuth |  |
| TE-API-DELETE-api-profiles-orgs-orgId-members-userId | DELETE | `/api/profiles/orgs/:orgId/members/:userId` | `server/routes/profiles.js:312` | handler: requireAuth |  |
| TE-API-POST-api-profiles-me-personal-link-org-orgId | POST | `/api/profiles/me/personal/link-org/:orgId` | `server/routes/profiles.js:333` | handler: requireAuth |  |
| TE-API-DELETE-api-profiles-me-personal-link-org-orgId | DELETE | `/api/profiles/me/personal/link-org/:orgId` | `server/routes/profiles.js:352` | handler: requireAuth |  |
| TE-API-GET-api-profiles-me-licenses | GET | `/api/profiles/me/licenses` | `server/routes/profiles.js:368` | handler: requireAuth |  |
| TE-API-GET-api-profiles-admin-orgs | GET | `/api/profiles/admin/orgs` | `server/routes/profiles.js:391` | handler: requireAuth |  |
| TE-API-GET-api-profiles-admin-licenses | GET | `/api/profiles/admin/licenses` | `server/routes/profiles.js:409` | handler: requireAuth |  |
| TE-API-POST-api-profiles-admin-licenses | POST | `/api/profiles/admin/licenses` | `server/routes/profiles.js:429` | handler: requireAuth |  |
| TE-API-DELETE-api-profiles-admin-licenses-id | DELETE | `/api/profiles/admin/licenses/:id` | `server/routes/profiles.js:455` | handler: requireAuth |  |
