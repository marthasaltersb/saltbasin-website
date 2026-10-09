# API endpoint inventory

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.

592 endpoint definitions across 65 files; 64 router mounts in `server/index.js`.


## How to read the guard column

Guard evidence is a **static pattern match**, recorded so a reviewer can see *why* an endpoint is believed protected — it is not proof of enforcement:

- `mount:` middleware passed in `app.use(prefix, …)`
- `router:` a `router.use(guard)` registered *above* the route in its file (Express applies it only to later routes)
- `inline:` middleware argument in the route definition
- `handler:` a guard-like call in the first ~14 lines of the handler body (e.g. local `requireAuth(req,res)`)
- `none detected` — **no guard pattern found**. Means: needs manual review. Many are intentionally public (published site, BestyStaff intake, output routes); some may not be. It does **not** by itself mean the endpoint is unprotected.

Global middleware applied to every request after `/api/auth`: `enforceRequiredPasswordChange` (server/index.js:131), `enforceCurrentCareerTerms` (server/index.js:132).

## Router files

| Router file | Mount prefix(es) | Endpoints | No guard detected | Detail |
|---|---|---|---|---|
| `server/index.js` | (app) | 3 | 3 | [api/index.md](api/index.md) |
| `server/routes/agent.js` | /api/agent | 16 | 0 | [api/agent.md](api/agent.md) |
| `server/routes/agentHub.js` | /api/agent-hub | 8 | 0 | [api/agentHub.md](api/agentHub.md) |
| `server/routes/analytics.js` | /api/analytics | 5 | 1 | [api/analytics.md](api/analytics.md) |
| `server/routes/auth.js` | /api/auth | 18 | 8 | [api/auth.md](api/auth.md) |
| `server/routes/backlog.js` | /api/backlog | 16 | 0 | [api/backlog.md](api/backlog.md) |
| `server/routes/backlogOutputs.js` | /api/backlog-outputs | 4 | 0 | [api/backlogOutputs.md](api/backlogOutputs.md) |
| `server/routes/bestyStaff.js` | /api/agent/bestystaff | 1 | 1 | [api/bestyStaff.md](api/bestyStaff.md) |
| `server/routes/bestyStaffCareer.js` | /api/agent/bestystaff-career | 1 | 0 | [api/bestyStaffCareer.md](api/bestyStaffCareer.md) |
| `server/routes/careerMaster.js` | /api/career | 61 | 4 | [api/careerMaster.md](api/careerMaster.md) |
| `server/routes/careerPlacementAgents.js` | /api/career-agents | 31 | 0 | [api/careerPlacementAgents.md](api/careerPlacementAgents.md) |
| `server/routes/careerReasoningAdmin.js` | /api/career-reasoning-admin | 2 | 0 | [api/careerReasoningAdmin.md](api/careerReasoningAdmin.md) |
| `server/routes/careerReconciliation.js` | /api/career-reconciliation | 2 | 0 | [api/careerReconciliation.md](api/careerReconciliation.md) |
| `server/routes/commerce.js` | /api/commerce | 8 | 1 | [api/commerce.md](api/commerce.md) |
| `server/routes/commercialOpportunities.js` | /api/commercial-opportunities | 4 | 0 | [api/commercialOpportunities.md](api/commercialOpportunities.md) |
| `server/routes/config.js` | /api/config | 8 | 0 | [api/config.md](api/config.md) |
| `server/routes/configEnvelopes.js` | /api/config-envelopes | 4 | 0 | [api/configEnvelopes.md](api/configEnvelopes.md) |
| `server/routes/contentAttachments.js` | /api/content-attachments | 4 | 0 | [api/contentAttachments.md](api/contentAttachments.md) |
| `server/routes/contentPublications.js` | /api/content-publications | 8 | 0 | [api/contentPublications.md](api/contentPublications.md) |
| `server/routes/dataSources.js` | /api/data-sources | 1 | 1 | [api/dataSources.md](api/dataSources.md) |
| `server/routes/deploymentIntelligence.js` | /api/deployment-intelligence | 3 | 0 | [api/deploymentIntelligence.md](api/deploymentIntelligence.md) |
| `server/routes/eidos.js` | /api/eidos | 31 | 0 | [api/eidos.md](api/eidos.md) |
| `server/routes/events.js` | /api/events | 1 | 1 | [api/events.md](api/events.md) |
| `server/routes/experience.js` | /api/experience | 2 | 2 | [api/experience.md](api/experience.md) |
| `server/routes/feedback.js` | /api/feedback | 11 | 0 | [api/feedback.md](api/feedback.md) |
| `server/routes/fieldAudit.js` | /api/field-audit | 2 | 0 | [api/fieldAudit.md](api/fieldAudit.md) |
| `server/routes/finbridgeco.js` | /api/finbridgeco | 5 | 0 | [api/finbridgeco.md](api/finbridgeco.md) |
| `server/routes/genesis.js` | /api/genesis | 12 | 0 | [api/genesis.md](api/genesis.md) |
| `server/routes/globalStandards.js` | /api/standards | 7 | 2 | [api/globalStandards.md](api/globalStandards.md) |
| `server/routes/governance.js` | /api/governance | 5 | 0 | [api/governance.md](api/governance.md) |
| `server/routes/herq.js` | /api/herq | 19 | 1 | [api/herq.md](api/herq.md) |
| `server/routes/jira.js` | /api/jira | 5 | 0 | [api/jira.md](api/jira.md) |
| `server/routes/journeyRods.js` | /api/journey-rods | 24 | 0 | [api/journeyRods.md](api/journeyRods.md) |
| `server/routes/l2rDiagnostics.js` | /api/l2r-diagnostics | 9 | 0 | [api/l2rDiagnostics.md](api/l2rDiagnostics.md) |
| `server/routes/leadIntegrations.js` | /api/lead-integrations | 3 | 0 | [api/leadIntegrations.md](api/leadIntegrations.md) |
| `server/routes/leads.js` | /api/leads | 21 | 14 | [api/leads.md](api/leads.md) |
| `server/routes/lineage.js` | /api/lineage | 4 | 0 | [api/lineage.md](api/lineage.md) |
| `server/routes/lonetreeMvp.js` | /api/lonetree-mvp | 19 | 0 | [api/lonetreeMvp.md](api/lonetreeMvp.md) |
| `server/routes/memberAgent.js` | /api/members/me/agent | 1 | 0 | [api/memberAgent.md](api/memberAgent.md) |
| `server/routes/memberConfig.js` | /api/member-config | 4 | 0 | [api/memberConfig.md](api/memberConfig.md) |
| `server/routes/memberEntitlements.js` | /api/member-entitlements | 1 | 0 | [api/memberEntitlements.md](api/memberEntitlements.md) |
| `server/routes/memberFinancial.js` | /api/member-financial | 8 | 0 | [api/memberFinancial.md](api/memberFinancial.md) |
| `server/routes/memberSite.js` | /api/member-site | 7 | 4 | [api/memberSite.md](api/memberSite.md) |
| `server/routes/memberTemplates.js` | /api/member-templates | 4 | 0 | [api/memberTemplates.md](api/memberTemplates.md) |
| `server/routes/members.js` | /api/members | 33 | 2 | [api/members.md](api/members.md) |
| `server/routes/methodologyStats.js` | /api/methodology-stats | 1 | 0 | [api/methodologyStats.md](api/methodologyStats.md) |
| `server/routes/metricIntelligence.js` | /api/metric-intelligence | 7 | 0 | [api/metricIntelligence.md](api/metricIntelligence.md) |
| `server/routes/notifications.js` | /api/notifications | 5 | 0 | [api/notifications.md](api/notifications.md) |
| `server/routes/nrm.js` | /api/nrm | 10 | 2 | [api/nrm.md](api/nrm.md) |
| `server/routes/oauth.js` | /api/oauth | 6 | 1 | [api/oauth.md](api/oauth.md) |
| `server/routes/orgPortal.js` | /api/org-portal | 12 | 0 | [api/orgPortal.md](api/orgPortal.md) |
| `server/routes/outputTemplates.js` | /api/output-templates | 7 | 2 | [api/outputTemplates.md](api/outputTemplates.md) |
| `server/routes/portfolioRequests.js` | /api/portfolio-requests | 7 | 5 | [api/portfolioRequests.md](api/portfolioRequests.md) |
| `server/routes/presence.js` | /api/presence | 3 | 0 | [api/presence.md](api/presence.md) |
| `server/routes/profiles.js` | /api/profiles | 17 | 0 | [api/profiles.md](api/profiles.md) |
| `server/routes/proposalExperience.js` | /api/proposal-experience | 21 | 0 | [api/proposalExperience.md](api/proposalExperience.md) |
| `server/routes/publicationPipelines.js` | /api/publication-pipelines | 4 | 0 | [api/publicationPipelines.md](api/publicationPipelines.md) |
| `server/routes/qa.js` | /api/qa | 13 | 0 | [api/qa.md](api/qa.md) |
| `server/routes/resumeAccess.js` | /api/resume | 6 | 3 | [api/resumeAccess.md](api/resumeAccess.md) |
| `server/routes/resumeOutputs.js` | /api/resume-outputs | 4 | 0 | [api/resumeOutputs.md](api/resumeOutputs.md) |
| `server/routes/scenarios.js` | /api/scenarios | 4 | 0 | [api/scenarios.md](api/scenarios.md) |
| `server/routes/services.js` | /api/services | 10 | 3 | [api/services.md](api/services.md) |
| `server/routes/site.js` | /api/site | 5 | 1 | [api/site.md](api/site.md) |
| `server/routes/uploads.js` | /api/uploads | 1 | 0 | [api/uploads.md](api/uploads.md) |
| `server/routes/worldVariantStudio.js` | /api/admin/world-variant-studio | 3 | 0 | [api/worldVariantStudio.md](api/worldVariantStudio.md) |

## Route files present but not mounted in server/index.js

- `server/routes/memberAccess.js`

## Endpoints with no guard pattern detected (62) — review list

| Element ID | Method | Path | Location |
|---|---|---|---|
| TE-API-POST-api-commerce-webhook | POST | `/api/commerce/webhook` | `server/index.js:108` |
| TE-API-GET-api-health | GET | `/api/health` | `server/index.js:203` |
| TE-API-POST-api-agent-edit | POST | `/api/agent/edit` | `server/index.js:217` |
| TE-API-POST-api-auth-sso-discover | POST | `/api/auth/sso/discover` | `server/routes/auth.js:34` |
| TE-API-GET-api-auth-sso-callback | GET | `/api/auth/sso/callback` | `server/routes/auth.js:52` |
| TE-API-POST-api-auth-login | POST | `/api/auth/login` | `server/routes/auth.js:77` |
| TE-API-GET-api-auth-password-policy | GET | `/api/auth/password-policy` | `server/routes/auth.js:118` |
| TE-API-POST-api-auth-landing-gate-unlock | POST | `/api/auth/landing-gate/unlock` | `server/routes/auth.js:179` |
| TE-API-POST-api-auth-reset-request | POST | `/api/auth/reset-request` | `server/routes/auth.js:205` |
| TE-API-POST-api-auth-reset-confirm | POST | `/api/auth/reset-confirm` | `server/routes/auth.js:260` |
| TE-API-POST-api-auth-email-recover | POST | `/api/auth/email-recover` | `server/routes/auth.js:308` |
| TE-API-GET-api-site-resume-url | GET | `/api/site/resume-url` | `server/routes/site.js:30` |
| TE-API-POST-api-leads-credential-reset | POST | `/api/leads/credential-reset` | `server/routes/leads.js:207` |
| TE-API-GET-api-leads-actor-context | GET | `/api/leads/actor-context` | `server/routes/leads.js:217` |
| TE-API-POST-api-leads-touch | POST | `/api/leads/touch` | `server/routes/leads.js:247` |
| TE-API-POST-api-leads-intake-email | POST | `/api/leads/intake-email` | `server/routes/leads.js:326` |
| TE-API-GET-api-leads-verify-email | GET | `/api/leads/verify-email` | `server/routes/leads.js:348` |
| TE-API-POST-api-leads | POST | `/api/leads` | `server/routes/leads.js:361` |
| TE-API-POST-api-leads-public-publicId-unlock | POST | `/api/leads/public/:publicId/unlock` | `server/routes/leads.js:615` |
| TE-API-POST-api-leads-public-publicId-convert | POST | `/api/leads/public/:publicId/convert` | `server/routes/leads.js:678` |
| TE-API-GET-api-leads-public-publicId | GET | `/api/leads/public/:publicId` | `server/routes/leads.js:898` |
| TE-API-POST-api-leads-public-publicId-contact-emails | POST | `/api/leads/public/:publicId/contact-emails` | `server/routes/leads.js:974` |
| TE-API-POST-api-leads-public-publicId-contact-emails-id-resend-verification | POST | `/api/leads/public/:publicId/contact-emails/:id/resend-verification` | `server/routes/leads.js:994` |
| TE-API-PATCH-api-leads-public-publicId-contact-emails-id | PATCH | `/api/leads/public/:publicId/contact-emails/:id` | `server/routes/leads.js:1005` |
| TE-API-PATCH-api-leads-public-publicId | PATCH | `/api/leads/public/:publicId` | `server/routes/leads.js:1031` |
| TE-API-POST-api-leads-public-publicId-chat | POST | `/api/leads/public/:publicId/chat` | `server/routes/leads.js:1051` |
| TE-API-POST-api-members-signup | POST | `/api/members/signup` | `server/routes/members.js:59` |
| TE-API-GET-api-members-slug | GET | `/api/members/:slug` | `server/routes/members.js:241` |
| TE-API-GET-api-member-site-featured | GET | `/api/member-site/featured` | `server/routes/memberSite.js:223` |
| TE-API-GET-api-member-site-by-slug-slug | GET | `/api/member-site/by-slug/:slug` | `server/routes/memberSite.js:254` |
| TE-API-POST-api-member-site-by-slug-slug-unlock | POST | `/api/member-site/by-slug/:slug/unlock` | `server/routes/memberSite.js:285` |
| TE-API-GET-api-member-site-by-slug-slug-resume-url | GET | `/api/member-site/by-slug/:slug/resume-url` | `server/routes/memberSite.js:308` |
| TE-API-GET-api-data-sources-key-rollup | GET | `/api/data-sources/:key/rollup` | `server/routes/dataSources.js:11` |
| TE-API-POST-api-agent-bestystaff | POST | `/api/agent/bestystaff` | `server/routes/bestyStaff.js:345` |
| TE-API-POST-api-events-page-view | POST | `/api/events/page-view` | `server/routes/events.js:12` |
| TE-API-GET-api-oauth-provider-callback | GET | `/api/oauth/:provider/callback` | `server/routes/oauth.js:106` |
| TE-API-POST-api-analytics-events | POST | `/api/analytics/events` | `server/routes/analytics.js:29` |
| TE-API-POST-api-nrm-reference-requests | POST | `/api/nrm/reference-requests` | `server/routes/nrm.js:154` |
| TE-API-GET-api-nrm-marketplace-search | GET | `/api/nrm/marketplace/search` | `server/routes/nrm.js:223` |
| TE-API-GET-api-herq-posts | GET | `/api/herq/posts` | `server/routes/herq.js:47` |
| TE-API-GET-api-services-proposals-id | GET | `/api/services/proposals/:id` | `server/routes/services.js:62` |
| TE-API-POST-api-services-proposals-id-request-access | POST | `/api/services/proposals/:id/request-access` | `server/routes/services.js:126` |
| TE-API-GET-api-services-public | GET | `/api/services/public` | `server/routes/services.js:232` |
| TE-API-GET-api-standards-id | GET | `/api/standards/:id` | `server/routes/globalStandards.js:37` |
| TE-API-GET-api-standards-public-list | GET | `/api/standards/public/list` | `server/routes/globalStandards.js:110` |
| TE-API-POST-api-resume-temp-access | POST | `/api/resume/temp-access` | `server/routes/resumeAccess.js:18` |
| TE-API-GET-api-resume-validate-temp-token | GET | `/api/resume/validate-temp/:token` | `server/routes/resumeAccess.js:65` |
| TE-API-POST-api-resume-temp-download-request | POST | `/api/resume/temp-download-request` | `server/routes/resumeAccess.js:80` |
| TE-API-GET-api-output-templates-portfolio | GET | `/api/output-templates/portfolio` | `server/routes/outputTemplates.js:89` |
| TE-API-GET-api-output-templates-id-public | GET | `/api/output-templates/:id/public` | `server/routes/outputTemplates.js:117` |
| TE-API-GET-api-career-master | GET | `/api/career/master` | `server/routes/careerMaster.js:595` |
| TE-API-GET-api-career-rollups | GET | `/api/career/rollups` | `server/routes/careerMaster.js:607` |
| TE-API-GET-api-career-atom-rollups | GET | `/api/career/atom-rollups` | `server/routes/careerMaster.js:644` |
| TE-API-GET-api-career-public-rollup-slug-displayKey | GET | `/api/career/public-rollup/:slug/:displayKey` | `server/routes/careerMaster.js:666` |
| TE-API-POST-api-portfolio-requests | POST | `/api/portfolio-requests` | `server/routes/portfolioRequests.js:285` |
| TE-API-PATCH-api-portfolio-requests-id-notes | PATCH | `/api/portfolio-requests/:id/notes` | `server/routes/portfolioRequests.js:321` |
| TE-API-PATCH-api-portfolio-requests-id-lead | PATCH | `/api/portfolio-requests/:id/lead` | `server/routes/portfolioRequests.js:346` |
| TE-API-GET-api-portfolio-requests-lookup | GET | `/api/portfolio-requests/lookup` | `server/routes/portfolioRequests.js:392` |
| TE-API-POST-api-portfolio-requests-id-attachments | POST | `/api/portfolio-requests/:id/attachments` | `server/routes/portfolioRequests.js:430` |
| TE-API-GET-api-commerce-products | GET | `/api/commerce/products` | `server/routes/commerce.js:115` |
| TE-API-GET-api-experience-reference-prototype | GET | `/api/experience/reference-prototype` | `server/routes/experience.js:8` |
| TE-API-GET-api-experience-reference-prototype-key-visual | GET | `/api/experience/reference-prototype/key-visual` | `server/routes/experience.js:12` |
