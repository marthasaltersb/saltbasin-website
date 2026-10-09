# API — server/routes/memberFinancial.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-member-financial-providers | GET | `/api/member-financial/providers` | `server/routes/memberFinancial.js:22` | router: inline-mw(getUserFromCookie) |  |
| TE-API-DELETE-api-member-financial-connections-connectionId | DELETE | `/api/member-financial/connections/:connectionId` | `server/routes/memberFinancial.js:30` | router: inline-mw(getUserFromCookie) |  |
| TE-API-GET-api-member-financial-connections | GET | `/api/member-financial/connections` | `server/routes/memberFinancial.js:39` | router: inline-mw(getUserFromCookie) |  |
| TE-API-POST-api-member-financial-connections | POST | `/api/member-financial/connections` | `server/routes/memberFinancial.js:45` | router: inline-mw(getUserFromCookie) |  |
| TE-API-POST-api-member-financial-connections-connectionId-accounts | POST | `/api/member-financial/connections/:connectionId/accounts` | `server/routes/memberFinancial.js:58` | router: inline-mw(getUserFromCookie) |  |
| TE-API-POST-api-member-financial-shares | POST | `/api/member-financial/shares` | `server/routes/memberFinancial.js:69` | router: inline-mw(getUserFromCookie) |  |
| TE-API-GET-api-member-financial-organizations-orgId-shares | GET | `/api/member-financial/organizations/:orgId/shares` | `server/routes/memberFinancial.js:81` | router: inline-mw(getUserFromCookie) |  |
| TE-API-DELETE-api-member-financial-shares-shareId | DELETE | `/api/member-financial/shares/:shareId` | `server/routes/memberFinancial.js:88` | router: inline-mw(getUserFromCookie) |  |
