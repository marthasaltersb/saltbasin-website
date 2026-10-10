# API — server/routes/leads.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-leads-credential-reset | POST | `/api/leads/credential-reset` | `server/routes/leads.js:207` | none detected |  |
| TE-API-GET-api-leads-actor-context | GET | `/api/leads/actor-context` | `server/routes/leads.js:217` | none detected |  |
| TE-API-POST-api-leads-touch | POST | `/api/leads/touch` | `server/routes/leads.js:247` | none detected |  |
| TE-API-PATCH-api-leads-id-stage-gates | PATCH | `/api/leads/:id/stage-gates` | `server/routes/leads.js:310` | inline: requireAdmin |  |
| TE-API-POST-api-leads-intake-email | POST | `/api/leads/intake-email` | `server/routes/leads.js:326` | none detected |  |
| TE-API-GET-api-leads-verify-email | GET | `/api/leads/verify-email` | `server/routes/leads.js:348` | none detected |  |
| TE-API-POST-api-leads | POST | `/api/leads` | `server/routes/leads.js:361` | none detected |  |
| TE-API-POST-api-leads-public-publicId-unlock | POST | `/api/leads/public/:publicId/unlock` | `server/routes/leads.js:615` | none detected |  |
| TE-API-POST-api-leads-public-publicId-logout | POST | `/api/leads/public/:publicId/logout` | `server/routes/leads.js:642` | handler: requireLeadAuth |  |
| TE-API-POST-api-leads-public-publicId-pledge | POST | `/api/leads/public/:publicId/pledge` | `server/routes/leads.js:652` | handler: requireLeadAuth |  |
| TE-API-POST-api-leads-public-publicId-convert | POST | `/api/leads/public/:publicId/convert` | `server/routes/leads.js:678` | none detected |  |
| TE-API-GET-api-leads-public-publicId | GET | `/api/leads/public/:publicId` | `server/routes/leads.js:898` | none detected |  |
| TE-API-POST-api-leads-public-publicId-contact-emails | POST | `/api/leads/public/:publicId/contact-emails` | `server/routes/leads.js:974` | none detected |  |
| TE-API-POST-api-leads-public-publicId-contact-emails-id-resend-verification | POST | `/api/leads/public/:publicId/contact-emails/:id/resend-verification` | `server/routes/leads.js:994` | none detected |  |
| TE-API-PATCH-api-leads-public-publicId-contact-emails-id | PATCH | `/api/leads/public/:publicId/contact-emails/:id` | `server/routes/leads.js:1005` | none detected |  |
| TE-API-PATCH-api-leads-public-publicId | PATCH | `/api/leads/public/:publicId` | `server/routes/leads.js:1031` | none detected |  |
| TE-API-POST-api-leads-public-publicId-chat | POST | `/api/leads/public/:publicId/chat` | `server/routes/leads.js:1051` | none detected |  |
| TE-API-GET-api-leads | GET | `/api/leads` | `server/routes/leads.js:1060` | inline: requireAdmin |  |
| TE-API-POST-api-leads-admin-create | POST | `/api/leads/admin-create` | `server/routes/leads.js:1086` | inline: requireAdmin |  |
| TE-API-PATCH-api-leads-id-job | PATCH | `/api/leads/:id/job` | `server/routes/leads.js:1130` | inline: requireAdmin |  |
| TE-API-DELETE-api-leads-id | DELETE | `/api/leads/:id` | `server/routes/leads.js:1147` | inline: requireAdmin |  |
