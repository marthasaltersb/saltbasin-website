# API — server/routes/l2rDiagnostics.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-l2r-diagnostics-domains | GET | `/api/l2r-diagnostics/domains` | `server/routes/l2rDiagnostics.js:14` | inline: requireAdmin |  |
| TE-API-GET-api-l2r-diagnostics-domains-domainKey-capabilities | GET | `/api/l2r-diagnostics/domains/:domainKey/capabilities` | `server/routes/l2rDiagnostics.js:18` | inline: requireAdmin |  |
| TE-API-GET-api-l2r-diagnostics-scenarios-scenarioKey | GET | `/api/l2r-diagnostics/scenarios/:scenarioKey` | `server/routes/l2rDiagnostics.js:27` | inline: requireAdmin |  |
| TE-API-GET-api-l2r-diagnostics | GET | `/api/l2r-diagnostics` | `server/routes/l2rDiagnostics.js:37` | inline: requireAdmin |  |
| TE-API-POST-api-l2r-diagnostics | POST | `/api/l2r-diagnostics` | `server/routes/l2rDiagnostics.js:46` | inline: requireAdmin |  |
| TE-API-GET-api-l2r-diagnostics-id | GET | `/api/l2r-diagnostics/:id` | `server/routes/l2rDiagnostics.js:56` | inline: requireAdmin |  |
| TE-API-GET-api-l2r-diagnostics-id-landscape | GET | `/api/l2r-diagnostics/:id/landscape` | `server/routes/l2rDiagnostics.js:66` | inline: requireAdmin |  |
| TE-API-POST-api-l2r-diagnostics-id-observations | POST | `/api/l2r-diagnostics/:id/observations` | `server/routes/l2rDiagnostics.js:75` | inline: requireAdmin |  |
| TE-API-POST-api-l2r-diagnostics-id-findings | POST | `/api/l2r-diagnostics/:id/findings` | `server/routes/l2rDiagnostics.js:86` | inline: requireAdmin |  |
