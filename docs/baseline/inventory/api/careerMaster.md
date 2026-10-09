# API — server/routes/careerMaster.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-career-master | GET | `/api/career/master` | `server/routes/careerMaster.js:595` | none detected |  |
| TE-API-GET-api-career-rollups | GET | `/api/career/rollups` | `server/routes/careerMaster.js:607` | none detected |  |
| TE-API-GET-api-career-catalogs | GET | `/api/career/catalogs` | `server/routes/careerMaster.js:619` | inline: requireUser |  |
| TE-API-GET-api-career-atom-rollups | GET | `/api/career/atom-rollups` | `server/routes/careerMaster.js:644` | none detected |  |
| TE-API-GET-api-career-public-rollup-slug-displayKey | GET | `/api/career/public-rollup/:slug/:displayKey` | `server/routes/careerMaster.js:666` | none detected |  |
| TE-API-GET-api-career-consent-status | GET | `/api/career/consent-status` | `server/routes/careerMaster.js:704` | inline: requireUser |  |
| TE-API-POST-api-career-consent | POST | `/api/career/consent` | `server/routes/careerMaster.js:712` | inline: requireUser |  |
| TE-API-GET-api-career-intake-documents | GET | `/api/career/intake-documents` | `server/routes/careerMaster.js:737` | inline: requireUser |  |
| TE-API-POST-api-career-intake-documents | POST | `/api/career/intake-documents` | `server/routes/careerMaster.js:751` | inline: requireUser |  |
| TE-API-POST-api-career-intake-documents-linkedin-pull | POST | `/api/career/intake-documents/linkedin-pull` | `server/routes/careerMaster.js:840` | inline: requireUser |  |
| TE-API-GET-api-career-intake-runs | GET | `/api/career/intake-runs` | `server/routes/careerMaster.js:885` | inline: requireUser |  |
| TE-API-POST-api-career-intake-runs | POST | `/api/career/intake-runs` | `server/routes/careerMaster.js:899` | inline: requireUser |  |
| TE-API-POST-api-career-intake-runs-id-run | POST | `/api/career/intake-runs/:id/run` | `server/routes/careerMaster.js:960` | inline: requireUser |  |
| TE-API-POST-api-career-sync-site-metadata | POST | `/api/career/sync-site-metadata` | `server/routes/careerMaster.js:1021` | inline: requireUser |  |
| TE-API-GET-api-career-semantic-template | GET | `/api/career/semantic-template` | `server/routes/careerMaster.js:1052` | inline: requireUser |  |
| TE-API-POST-api-career-semantic-import | POST | `/api/career/semantic-import` | `server/routes/careerMaster.js:1064` | inline: requireUser |  |
| TE-API-POST-api-career-resume-analysis | POST | `/api/career/resume-analysis` | `server/routes/careerMaster.js:1079` | inline: requireUser |  |
| TE-API-POST-api-career-mappings-classify | POST | `/api/career/mappings/classify` | `server/routes/careerMaster.js:1099` | inline: requireUser |  |
| TE-API-GET-api-career-mappings-lineage | GET | `/api/career/mappings/lineage` | `server/routes/careerMaster.js:1144` | inline: requireUser |  |
| TE-API-POST-api-career-mappings-commit | POST | `/api/career/mappings/commit` | `server/routes/careerMaster.js:1157` | inline: requireUser |  |
| TE-API-POST-api-career-bounded-agent-action | POST | `/api/career/bounded-agent/action` | `server/routes/careerMaster.js:1303` | inline: requireUser |  |
| TE-API-GET-api-career-experience-definitions | GET | `/api/career/experience-definitions` | `server/routes/careerMaster.js:1364` | router: requireUser; inline: requireUser |  |
| TE-API-PUT-api-career-experience-definitions-type-key | PUT | `/api/career/experience-definitions/:type/:key` | `server/routes/careerMaster.js:1385` | router: requireUser; inline: requireUser |  |
| TE-API-DELETE-api-career-experience-definitions-type-key | DELETE | `/api/career/experience-definitions/:type/:key` | `server/routes/careerMaster.js:1408` | router: requireUser; inline: requireUser |  |
| TE-API-GET-api-career-proficiency-assertions | GET | `/api/career/proficiency-assertions` | `server/routes/careerMaster.js:1417` | router: requireUser |  |
| TE-API-PUT-api-career-proficiency-assertions-entityType-entityId-periodKey | PUT | `/api/career/proficiency-assertions/:entityType/:entityId/:periodKey` | `server/routes/careerMaster.js:1435` | router: requireUser |  |
| TE-API-DELETE-api-career-proficiency-assertions-entityType-entityId-periodKey | DELETE | `/api/career/proficiency-assertions/:entityType/:entityId/:periodKey` | `server/routes/careerMaster.js:1469` | router: requireUser |  |
| TE-API-GET-api-career-rollup-preview-key | GET | `/api/career/rollup-preview/:key` | `server/routes/careerMaster.js:1475` | router: requireUser |  |
| TE-API-POST-api-career-seed | POST | `/api/career/seed` | `server/routes/careerMaster.js:1500` | router: requireUser |  |
| TE-API-GET-api-career-jobs | GET | `/api/career/jobs` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1348) |
| TE-API-POST-api-career-jobs | POST | `/api/career/jobs` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1348) |
| TE-API-PATCH-api-career-jobs-id | PATCH | `/api/career/jobs/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1348) |
| TE-API-DELETE-api-career-jobs-id | DELETE | `/api/career/jobs/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1348) |
| TE-API-GET-api-career-skills | GET | `/api/career/skills` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1349) |
| TE-API-POST-api-career-skills | POST | `/api/career/skills` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1349) |
| TE-API-PATCH-api-career-skills-id | PATCH | `/api/career/skills/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1349) |
| TE-API-DELETE-api-career-skills-id | DELETE | `/api/career/skills/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1349) |
| TE-API-GET-api-career-tools | GET | `/api/career/tools` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1350) |
| TE-API-POST-api-career-tools | POST | `/api/career/tools` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1350) |
| TE-API-PATCH-api-career-tools-id | PATCH | `/api/career/tools/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1350) |
| TE-API-DELETE-api-career-tools-id | DELETE | `/api/career/tools/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1350) |
| TE-API-GET-api-career-engagements | GET | `/api/career/engagements` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1351) |
| TE-API-POST-api-career-engagements | POST | `/api/career/engagements` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1351) |
| TE-API-PATCH-api-career-engagements-id | PATCH | `/api/career/engagements/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1351) |
| TE-API-DELETE-api-career-engagements-id | DELETE | `/api/career/engagements/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1351) |
| TE-API-GET-api-career-domains | GET | `/api/career/domains` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1352) |
| TE-API-POST-api-career-domains | POST | `/api/career/domains` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1352) |
| TE-API-PATCH-api-career-domains-id | PATCH | `/api/career/domains/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1352) |
| TE-API-DELETE-api-career-domains-id | DELETE | `/api/career/domains/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1352) |
| TE-API-GET-api-career-certifications | GET | `/api/career/certifications` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1353) |
| TE-API-POST-api-career-certifications | POST | `/api/career/certifications` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1353) |
| TE-API-PATCH-api-career-certifications-id | PATCH | `/api/career/certifications/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1353) |
| TE-API-DELETE-api-career-certifications-id | DELETE | `/api/career/certifications/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1353) |
| TE-API-GET-api-career-deals | GET | `/api/career/deals` | `server/routes/careerMaster.js:442` | router: requireUser | via factory makeResourceRouter (mounted line 1354) |
| TE-API-POST-api-career-deals | POST | `/api/career/deals` | `server/routes/careerMaster.js:449` | router: requireUser | via factory makeResourceRouter (mounted line 1354) |
| TE-API-PATCH-api-career-deals-id | PATCH | `/api/career/deals/:id` | `server/routes/careerMaster.js:479` | router: requireUser | via factory makeResourceRouter (mounted line 1354) |
| TE-API-DELETE-api-career-deals-id | DELETE | `/api/career/deals/:id` | `server/routes/careerMaster.js:504` | router: requireUser | via factory makeResourceRouter (mounted line 1354) |
| TE-API-GET-api-career-meta-options | GET | `/api/career/meta-options` | `server/routes/careerMaster.js:442` | router: requireUser; sub-mount: requireAdmin | via factory makeResourceRouter (mounted line 1355) |
| TE-API-POST-api-career-meta-options | POST | `/api/career/meta-options` | `server/routes/careerMaster.js:449` | router: requireUser; sub-mount: requireAdmin | via factory makeResourceRouter (mounted line 1355) |
| TE-API-PATCH-api-career-meta-options-id | PATCH | `/api/career/meta-options/:id` | `server/routes/careerMaster.js:479` | router: requireUser; sub-mount: requireAdmin | via factory makeResourceRouter (mounted line 1355) |
| TE-API-DELETE-api-career-meta-options-id | DELETE | `/api/career/meta-options/:id` | `server/routes/careerMaster.js:504` | router: requireUser; sub-mount: requireAdmin | via factory makeResourceRouter (mounted line 1355) |
