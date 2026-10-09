# API — server/routes/members.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-members-signup | POST | `/api/members/signup` | `server/routes/members.js:59` | none detected |  |
| TE-API-GET-api-members-me-profile | GET | `/api/members/me/profile` | `server/routes/members.js:99` | inline: requireUser |  |
| TE-API-PUT-api-members-me-profile | PUT | `/api/members/me/profile` | `server/routes/members.js:111` | inline: requireUser |  |
| TE-API-POST-api-members-me-profile-publish | POST | `/api/members/me/profile/publish` | `server/routes/members.js:127` | inline: requireUser |  |
| TE-API-GET-api-members-me-emails | GET | `/api/members/me/emails` | `server/routes/members.js:142` | inline: requireUser |  |
| TE-API-GET-api-members-me-email-delivery-preference | GET | `/api/members/me/email-delivery-preference` | `server/routes/members.js:149` | inline: requireUser |  |
| TE-API-PUT-api-members-me-email-delivery-preference | PUT | `/api/members/me/email-delivery-preference` | `server/routes/members.js:154` | inline: requireUser |  |
| TE-API-POST-api-members-me-emails | POST | `/api/members/me/emails` | `server/routes/members.js:163` | inline: requireUser |  |
| TE-API-POST-api-members-me-emails-id-verify | POST | `/api/members/me/emails/:id/verify` | `server/routes/members.js:190` | inline: requireUser |  |
| TE-API-POST-api-members-me-emails-id-resend | POST | `/api/members/me/emails/:id/resend` | `server/routes/members.js:215` | inline: requireUser |  |
| TE-API-DELETE-api-members-me-emails-id | DELETE | `/api/members/me/emails/:id` | `server/routes/members.js:229` | inline: requireUser |  |
| TE-API-GET-api-members-slug | GET | `/api/members/:slug` | `server/routes/members.js:241` | none detected |  |
| TE-API-GET-api-members | GET | `/api/members` | `server/routes/members.js:249` | inline: requireAdmin |  |
| TE-API-GET-api-members-me-audit | GET | `/api/members/me/audit` | `server/routes/members.js:281` | inline: requireUser |  |
| TE-API-GET-api-members-me-consents | GET | `/api/members/me/consents` | `server/routes/members.js:295` | inline: requireUser |  |
| TE-API-GET-api-members-me-stats | GET | `/api/members/me/stats` | `server/routes/members.js:304` | inline: requireUser |  |
| TE-API-GET-api-members-admin-audit | GET | `/api/members/admin/audit` | `server/routes/members.js:343` | inline: requireAdmin |  |
| TE-API-GET-api-members-admin-stats | GET | `/api/members/admin/stats` | `server/routes/members.js:367` | inline: requireAdmin |  |
| TE-API-GET-api-members-me-resume-presets | GET | `/api/members/me/resume-presets` | `server/routes/members.js:400` | inline: requireUser |  |
| TE-API-GET-api-members-me-resume-url | GET | `/api/members/me/resume-url` | `server/routes/members.js:408` | inline: requireUser |  |
| TE-API-PUT-api-members-me-resume-presets | PUT | `/api/members/me/resume-presets` | `server/routes/members.js:418` | inline: requireUser |  |
| TE-API-GET-api-members-me-network-settings | GET | `/api/members/me/network-settings` | `server/routes/members.js:440` | inline: requireUser |  |
| TE-API-PUT-api-members-me-network-settings | PUT | `/api/members/me/network-settings` | `server/routes/members.js:448` | inline: requireUser |  |
| TE-API-POST-api-members-me-connections-request | POST | `/api/members/me/connections/request` | `server/routes/members.js:474` | inline: requireUser |  |
| TE-API-GET-api-members-me-connections | GET | `/api/members/me/connections` | `server/routes/members.js:505` | inline: requireUser |  |
| TE-API-GET-api-members-me-connection-requests | GET | `/api/members/me/connection-requests` | `server/routes/members.js:522` | inline: requireUser |  |
| TE-API-POST-api-members-me-connections-id-accept | POST | `/api/members/me/connections/:id/accept` | `server/routes/members.js:538` | inline: requireUser |  |
| TE-API-POST-api-members-me-connections-id-decline | POST | `/api/members/me/connections/:id/decline` | `server/routes/members.js:546` | inline: requireUser |  |
| TE-API-GET-api-members-me-connection-status-slug | GET | `/api/members/me/connection-status/:slug` | `server/routes/members.js:555` | inline: requireUser |  |
| TE-API-POST-api-members-me-messages | POST | `/api/members/me/messages` | `server/routes/members.js:571` | inline: requireUser |  |
| TE-API-GET-api-members-me-messages | GET | `/api/members/me/messages` | `server/routes/members.js:591` | inline: requireUser |  |
| TE-API-GET-api-members-me-messages-thread-userId | GET | `/api/members/me/messages/thread/:userId` | `server/routes/members.js:607` | inline: requireUser |  |
| TE-API-GET-api-members-me-messages-unread-count | GET | `/api/members/me/messages/unread-count` | `server/routes/members.js:625` | inline: requireUser |  |
