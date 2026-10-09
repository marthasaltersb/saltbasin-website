# API — server/routes/auth.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-auth-sso-discover | POST | `/api/auth/sso/discover` | `server/routes/auth.js:34` | none detected |  |
| TE-API-GET-api-auth-sso-callback | GET | `/api/auth/sso/callback` | `server/routes/auth.js:52` | none detected |  |
| TE-API-POST-api-auth-login | POST | `/api/auth/login` | `server/routes/auth.js:77` | none detected |  |
| TE-API-POST-api-auth-logout | POST | `/api/auth/logout` | `server/routes/auth.js:104` | handler: getUserFromCookie |  |
| TE-API-GET-api-auth-me | GET | `/api/auth/me` | `server/routes/auth.js:113` | handler: getUserFromCookie |  |
| TE-API-GET-api-auth-password-policy | GET | `/api/auth/password-policy` | `server/routes/auth.js:118` | none detected |  |
| TE-API-GET-api-auth-authentication-routes | GET | `/api/auth/authentication-routes` | `server/routes/auth.js:120` | inline: requireUser |  |
| TE-API-POST-api-auth-totp-setup | POST | `/api/auth/totp/setup` | `server/routes/auth.js:125` | inline: requireUser |  |
| TE-API-POST-api-auth-totp-enable | POST | `/api/auth/totp/enable` | `server/routes/auth.js:132` | inline: requireUser |  |
| TE-API-DELETE-api-auth-totp | DELETE | `/api/auth/totp` | `server/routes/auth.js:142` | inline: requireUser |  |
| TE-API-GET-api-auth-password-reset-preferences | GET | `/api/auth/password-reset-preferences` | `server/routes/auth.js:147` | inline: requireUser |  |
| TE-API-PUT-api-auth-password-reset-preferences | PUT | `/api/auth/password-reset-preferences` | `server/routes/auth.js:152` | inline: requireUser |  |
| TE-API-POST-api-auth-change-password | POST | `/api/auth/change-password` | `server/routes/auth.js:161` | inline: requireUser; handler: isLandingUnlocked |  |
| TE-API-GET-api-auth-landing-gate-status | GET | `/api/auth/landing-gate/status` | `server/routes/auth.js:169` | handler: isLandingUnlocked |  |
| TE-API-POST-api-auth-landing-gate-unlock | POST | `/api/auth/landing-gate/unlock` | `server/routes/auth.js:179` | none detected |  |
| TE-API-POST-api-auth-reset-request | POST | `/api/auth/reset-request` | `server/routes/auth.js:205` | none detected |  |
| TE-API-POST-api-auth-reset-confirm | POST | `/api/auth/reset-confirm` | `server/routes/auth.js:260` | none detected |  |
| TE-API-POST-api-auth-email-recover | POST | `/api/auth/email-recover` | `server/routes/auth.js:308` | none detected |  |
