# API — server/routes/orgPortal.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-org-portal-orgId-consent-status | GET | `/api/org-portal/:orgId/consent-status` | `server/routes/orgPortal.js:53` | router: requireUser |  |
| TE-API-POST-api-org-portal-orgId-consent | POST | `/api/org-portal/:orgId/consent` | `server/routes/orgPortal.js:68` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-context | GET | `/api/org-portal/:orgId/context` | `server/routes/orgPortal.js:92` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-auth-policy | GET | `/api/org-portal/:orgId/auth-policy` | `server/routes/orgPortal.js:93` | router: requireUser |  |
| TE-API-PUT-api-org-portal-orgId-auth-policy | PUT | `/api/org-portal/:orgId/auth-policy` | `server/routes/orgPortal.js:98` | router: requireUser |  |
| TE-API-PUT-api-org-portal-orgId-members-userId-capabilities-capabilityKey | PUT | `/api/org-portal/:orgId/members/:userId/capabilities/:capabilityKey` | `server/routes/orgPortal.js:106` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-page-types | GET | `/api/org-portal/:orgId/page-types` | `server/routes/orgPortal.js:114` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-r-path | GET | `/api/org-portal/:orgId/${r.path}` | `server/routes/orgPortal.js:116` | router: requireUser |  |
| TE-API-PUT-api-org-portal-orgId-r-path | PUT | `/api/org-portal/:orgId/${r.path}` | `server/routes/orgPortal.js:117` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-documents | GET | `/api/org-portal/:orgId/documents` | `server/routes/orgPortal.js:125` | router: requireUser |  |
| TE-API-GET-api-org-portal-orgId-documents-id | GET | `/api/org-portal/:orgId/documents/:id` | `server/routes/orgPortal.js:133` | router: requireUser |  |
| TE-API-POST-api-org-portal-orgId-publish | POST | `/api/org-portal/:orgId/publish` | `server/routes/orgPortal.js:143` | router: requireUser |  |
