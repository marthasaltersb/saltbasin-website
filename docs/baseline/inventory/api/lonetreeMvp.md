# API — server/routes/lonetreeMvp.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-lonetree-mvp-prospect-package | GET | `/api/lonetree-mvp/prospect-package` | `server/routes/lonetreeMvp.js:62` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-complete-proposal-package | GET | `/api/lonetree-mvp/complete-proposal-package` | `server/routes/lonetreeMvp.js:67` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-prospect-html | GET | `/api/lonetree-mvp/prospect-html` | `server/routes/lonetreeMvp.js:72` | handler: requireAdmin,requirePlatformAdmin |  |
| TE-API-GET-api-lonetree-mvp-proposal-config | GET | `/api/lonetree-mvp/proposal-config` | `server/routes/lonetreeMvp.js:77` | handler: requireAdmin,requirePlatformAdmin |  |
| TE-API-GET-api-lonetree-mvp-admin-prospects | GET | `/api/lonetree-mvp/admin/prospects` | `server/routes/lonetreeMvp.js:82` | handler: requirePlatformAdmin |  |
| TE-API-GET-api-lonetree-mvp-admin-prospects-userId-proposal-config | GET | `/api/lonetree-mvp/admin/prospects/:userId/proposal-config` | `server/routes/lonetreeMvp.js:95` | handler: requirePlatformAdmin |  |
| TE-API-PUT-api-lonetree-mvp-admin-prospects-userId-proposal-config-draft | PUT | `/api/lonetree-mvp/admin/prospects/:userId/proposal-config/draft` | `server/routes/lonetreeMvp.js:103` | handler: requirePlatformAdmin |  |
| TE-API-POST-api-lonetree-mvp-admin-prospects-userId-proposal-config-publish | POST | `/api/lonetree-mvp/admin/prospects/:userId/proposal-config/publish` | `server/routes/lonetreeMvp.js:114` | handler: requirePlatformAdmin |  |
| TE-API-GET-api-lonetree-mvp-summary | GET | `/api/lonetree-mvp/summary` | `server/routes/lonetreeMvp.js:131` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-reconciliation | GET | `/api/lonetree-mvp/reconciliation` | `server/routes/lonetreeMvp.js:154` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-fund-economics | GET | `/api/lonetree-mvp/fund-economics` | `server/routes/lonetreeMvp.js:161` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-signals | GET | `/api/lonetree-mvp/signals` | `server/routes/lonetreeMvp.js:168` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-hypotheses | GET | `/api/lonetree-mvp/hypotheses` | `server/routes/lonetreeMvp.js:191` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-theses | GET | `/api/lonetree-mvp/theses` | `server/routes/lonetreeMvp.js:214` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-value-creation | GET | `/api/lonetree-mvp/value-creation` | `server/routes/lonetreeMvp.js:236` | handler: requireAdmin |  |
| TE-API-PATCH-api-lonetree-mvp-value-creation-initiativeId-advance | PATCH | `/api/lonetree-mvp/value-creation/:initiativeId/advance` | `server/routes/lonetreeMvp.js:251` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-trace-ev-drivers | GET | `/api/lonetree-mvp/trace-ev-drivers` | `server/routes/lonetreeMvp.js:270` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-demonstration | GET | `/api/lonetree-mvp/demonstration` | `server/routes/lonetreeMvp.js:277` | handler: requireAdmin |  |
| TE-API-GET-api-lonetree-mvp-trace-metric | GET | `/api/lonetree-mvp/trace/:metric` | `server/routes/lonetreeMvp.js:286` | handler: requireAdmin |  |
