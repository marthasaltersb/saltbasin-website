# API — server/routes/commerce.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-commerce-products | GET | `/api/commerce/products` | `server/routes/commerce.js:115` | none detected |  |
| TE-API-GET-api-commerce-my-access | GET | `/api/commerce/my-access` | `server/routes/commerce.js:131` | inline: requireUser |  |
| TE-API-POST-api-commerce-checkout | POST | `/api/commerce/checkout` | `server/routes/commerce.js:153` | inline: requireUser |  |
| TE-API-POST-api-commerce-request-custom-scoping | POST | `/api/commerce/request-custom-scoping` | `server/routes/commerce.js:306` | inline: requireUser |  |
| TE-API-POST-api-commerce-onboarding-runs | POST | `/api/commerce/onboarding-runs` | `server/routes/commerce.js:348` | inline: requireUser |  |
| TE-API-GET-api-commerce-onboarding-runs | GET | `/api/commerce/onboarding-runs` | `server/routes/commerce.js:386` | inline: requireUser |  |
| TE-API-POST-api-commerce-message-betsy-start | POST | `/api/commerce/message-betsy/start` | `server/routes/commerce.js:404` | inline: requireUser |  |
| TE-API-GET-api-commerce-admin-products | GET | `/api/commerce/admin/products` | `server/routes/commerce.js:430` | inline: requireAdmin |  |
