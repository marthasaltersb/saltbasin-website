# Module coverage — element → module assignment

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


Every inventoried element is assigned to one module by `scripts/baseline/module-map.json` (first matching pattern wins). This is the **completeness boundary** for the current-state specification: an element is "accounted for" when it is assigned to a module; `UNASSIGNED` elements are listed in full below and must be classified (map updated) or explicitly excluded before the inventory is called complete. Tables include those declared outside `bootstrap()` (see db-schema.md).

| Module | Name | Endpoints | Tables | UI routes | Source files | Lines of source |
|---|---|---|---|---|---|---|
| MOD-01 | Platform runtime, deployment & operations | 2 | 0 | 0 | 14 | 7582 |
| MOD-02 | Authentication, sessions & identity | 18 | 11 | 6 | 19 | 2056 |
| MOD-03 | Platform CMS — admin site & config (draft/publish) | 17 | 3 | 1 | 28 | 11308 |
| MOD-04 | Member sites, profiles & member config | 66 | 10 | 4 | 20 | 4222 |
| MOD-05 | Public rendering — section blocks, themes & design tokens | 0 | 0 | 0 | 17 | 10073 |
| MOD-06 | SEO & structured data | 0 | 0 | 0 | 3 | 226 |
| MOD-07 | Output documents, resume & output templates | 17 | 4 | 19 | 13 | 8442 |
| MOD-08 | Leads, CRM & BestyStaff intake | 33 | 11 | 1 | 16 | 5375 |
| MOD-09 | Email delivery & notifications | 5 | 2 | 0 | 5 | 986 |
| MOD-10 | Integrations — OAuth, data sources, uploads, Jira | 13 | 8 | 0 | 8 | 1455 |
| MOD-11 | Commerce, licensing, entitlements & services | 20 | 17 | 0 | 11 | 1854 |
| MOD-12 | Organizations & org portal | 12 | 5 | 1 | 4 | 459 |
| MOD-13 | Member financial connections | 8 | 4 | 0 | 3 | 255 |
| MOD-14 | Career — Career Master, Channel Rod, reconciliation, reasoning, placement agents | 96 | 16 | 0 | 38 | 8080 |
| MOD-15 | Commercial opportunity pipeline & Lead-to-Revenue diagnostics | 13 | 6 | 0 | 13 | 42276 |
| MOD-16 | Journey Rod / Channel substrate — EIDOS, Genesis, scenarios, lineage, methodology | 76 | 28 | 0 | 66 | 8282 |
| MOD-17 | 3D worlds, crystal design system & experience engine | 8 | 9 | 2 | 43 | 9634 |
| MOD-18 | Agents — agent hub, member agent, dispatcher, governance | 29 | 18 | 0 | 26 | 4293 |
| MOD-19 | Platform lifecycle management — backlog, QA, deployment & contribution intelligence | 47 | 23 | 0 | 20 | 7953 |
| MOD-20 | Analytics, events & audit | 8 | 5 | 0 | 7 | 695 |
| MOD-21 | Content pipeline, publications & HERQ | 35 | 8 | 0 | 18 | 3446 |
| MOD-22 | Network Relationship Management (NRM) | 10 | 4 | 0 | 2 | 685 |
| MOD-23 | FinBridgeCo & accounting | 5 | 6 | 0 | 2 | 219 |
| MOD-24 | Metric intelligence | 7 | 3 | 0 | 3 | 268 |
| MOD-25 | Global standards | 7 | 3 | 0 | 2 | 298 |
| MOD-26 | Proposal experience, Lonetree MVP & business-definition experience | 40 | 7 | 0 | 20 | 5269 |
| MOD-27 | Legal & notice pages | 0 | 0 | 3 | 3 | 595 |
| UNASSIGNED | — | 0 | 0 | 0 | 0 | 0 |

## UNASSIGNED elements (0)

None.

## MOD-01 — Platform runtime, deployment & operations

**Endpoints (2):** `TE-API-GET-api-health`, `TE-API-POST-api-agent-edit`

**Tables (0):** —

**UI routes (0):** —

**Source files (14):** `TE-SRV-db`, `TE-SRV-index`, `TE-SRV-lib-cronMatch`, `TE-SRV-lib-simplePdf`, `TE-SRV-lib-snapshot`, `TE-SRV-lib-vectorize`, `TE-SRV-lib-zipStore`, `TE-CMP-App`, `TE-CMP-components-UxRuntimeAuditProbe`, `TE-CMP-config-ux-uxRepairRegistry`, `TE-CMP-lib-api`, `TE-CMP-lib-toast`, `TE-CMP-lib-uxRuntimeAudit`, `TE-CMP-main`

## MOD-02 — Authentication, sessions & identity

**Endpoints (18):** `TE-API-POST-api-auth-sso-discover`, `TE-API-GET-api-auth-sso-callback`, `TE-API-POST-api-auth-login`, `TE-API-POST-api-auth-logout`, `TE-API-GET-api-auth-me`, `TE-API-GET-api-auth-password-policy`, `TE-API-GET-api-auth-authentication-routes`, `TE-API-POST-api-auth-totp-setup`, `TE-API-POST-api-auth-totp-enable`, `TE-API-DELETE-api-auth-totp`, `TE-API-GET-api-auth-password-reset-preferences`, `TE-API-PUT-api-auth-password-reset-preferences`, `TE-API-POST-api-auth-change-password`, `TE-API-GET-api-auth-landing-gate-status`, `TE-API-POST-api-auth-landing-gate-unlock`, `TE-API-POST-api-auth-reset-request`, `TE-API-POST-api-auth-reset-confirm`, `TE-API-POST-api-auth-email-recover`

**Tables (11):** `TE-DB-consent_actions`, `TE-DB-landing_sessions`, `TE-DB-organization_authentication_policies`, `TE-DB-organization_sso_login_states`, `TE-DB-password_reset_tokens`, `TE-DB-sessions`, `TE-DB-user_authentication_routes`, `TE-DB-user_emails`, `TE-DB-user_password_history`, `TE-DB-user_password_reset_preferences`, `TE-DB-users`

**UI routes (6):** `TE-UIR-login`, `TE-UIR-admin-login`, `TE-UIR-test-login`, `TE-UIR-reset-token`, `TE-UIR-first-login-password`, `TE-UIR-signup`

**Source files (19):** `TE-SRV-auth`, `TE-SRV-data-seed`, `TE-SRV-lib-consentRegistry`, `TE-SRV-lib-crypto`, `TE-SRV-lib-organizationSso`, `TE-SRV-lib-passwordPolicy`, `TE-SRV-lib-passwordPolicyRules`, `TE-SRV-lib-rateLimit`, `TE-SRV-lib-recaptcha`, `TE-SRV-lib-totp`, `TE-SRV-routes-auth`, `TE-CMP-components-FirstLoginPasswordPage`, `TE-CMP-components-LandingGate`, `TE-CMP-components-ResetPasswordPage`, `TE-CMP-components-SignupPage`, `TE-CMP-components-admin-CareerConsentGate`, `TE-CMP-components-admin-LoginPage`, `TE-CMP-components-admin-TestLoginRedirect`, `TE-CMP-lib-recaptcha`

## MOD-03 — Platform CMS — admin site & config (draft/publish)

**Endpoints (17):** `TE-API-GET-api-site-resume-url`, `TE-API-GET-api-site-published`, `TE-API-GET-api-site-draft`, `TE-API-PUT-api-site-draft`, `TE-API-POST-api-site-publish`, `TE-API-GET-api-config-public`, `TE-API-GET-api-config-draft`, `TE-API-PUT-api-config-draft`, `TE-API-GET-api-config-admin-nav`, `TE-API-PUT-api-config-admin-nav`, `TE-API-GET-api-config-page-types`, `TE-API-PUT-api-config-page-types`, `TE-API-POST-api-config-test-email`, `TE-API-GET-api-config-envelopes`, `TE-API-GET-api-config-envelopes-id`, `TE-API-PUT-api-config-envelopes-id`, `TE-API-DELETE-api-config-envelopes-id`

**Tables (3):** `TE-DB-config_state`, `TE-DB-detail_pages`, `TE-DB-site_state`

**UI routes (1):** `TE-UIR-root`

**Source files (28):** `TE-SRV-data-defaultSite`, `TE-SRV-lib-configEnvelope`, `TE-SRV-lib-methodologyEnvelopes`, `TE-SRV-routes-config`, `TE-SRV-routes-configEnvelopes`, `TE-SRV-routes-site`, `TE-CMP-components-BackLink`, `TE-CMP-components-Breadcrumbs`, `TE-CMP-components-PublicFooter`, `TE-CMP-components-PublicNav`, `TE-CMP-components-PublicSite`, `TE-CMP-components-SaltBasinHome`, `TE-CMP-components-SiteConfigView`, `TE-CMP-components-admin-AdminShell`, `TE-CMP-components-admin-ConfigPanel`, `TE-CMP-components-admin-EditorPane`, `TE-CMP-components-admin-FlexColumnsEditor`, `TE-CMP-components-admin-IconLibraryPanel`, `TE-CMP-components-admin-IconPickerField`, `TE-CMP-components-admin-ImageUploadField`, `TE-CMP-components-admin-PageLayoutView`, `TE-CMP-components-admin-PageTypeManagerPanel`, `TE-CMP-components-admin-PreviewPane`, `TE-CMP-components-admin-ProfileHub`, `TE-CMP-components-admin-SectionLayoutFields`, `TE-CMP-components-admin-SectionTemplateModal`, `TE-CMP-components-admin-Sidebar`, `TE-CMP-components-admin-adminStyles`

## MOD-04 — Member sites, profiles & member config

**Endpoints (66):** `TE-API-POST-api-members-signup`, `TE-API-GET-api-members-me-profile`, `TE-API-PUT-api-members-me-profile`, `TE-API-POST-api-members-me-profile-publish`, `TE-API-GET-api-members-me-emails`, `TE-API-GET-api-members-me-email-delivery-preference`, `TE-API-PUT-api-members-me-email-delivery-preference`, `TE-API-POST-api-members-me-emails`, `TE-API-POST-api-members-me-emails-id-verify`, `TE-API-POST-api-members-me-emails-id-resend`, `TE-API-DELETE-api-members-me-emails-id`, `TE-API-GET-api-members-slug`, `TE-API-GET-api-members`, `TE-API-GET-api-members-me-audit`, `TE-API-GET-api-members-me-consents`, `TE-API-GET-api-members-me-stats`, `TE-API-GET-api-members-admin-audit`, `TE-API-GET-api-members-admin-stats`, `TE-API-GET-api-members-me-resume-presets`, `TE-API-GET-api-members-me-resume-url`, `TE-API-PUT-api-members-me-resume-presets`, `TE-API-GET-api-members-me-network-settings`, `TE-API-PUT-api-members-me-network-settings`, `TE-API-POST-api-members-me-connections-request`, `TE-API-GET-api-members-me-connections`, `TE-API-GET-api-members-me-connection-requests`, `TE-API-POST-api-members-me-connections-id-accept`, `TE-API-POST-api-members-me-connections-id-decline`, `TE-API-GET-api-members-me-connection-status-slug`, `TE-API-POST-api-members-me-messages`, `TE-API-GET-api-members-me-messages`, `TE-API-GET-api-members-me-messages-thread-userId`, `TE-API-GET-api-members-me-messages-unread-count`, `TE-API-GET-api-member-site-draft`, `TE-API-PUT-api-member-site-draft`, `TE-API-POST-api-member-site-publish`, `TE-API-GET-api-member-site-featured`, `TE-API-GET-api-member-site-by-slug-slug`, `TE-API-POST-api-member-site-by-slug-slug-unlock`, `TE-API-GET-api-member-site-by-slug-slug-resume-url`, `TE-API-GET-api-member-config-page-types`, `TE-API-GET-api-member-config-draft`, `TE-API-PUT-api-member-config-draft`, `TE-API-POST-api-member-config-publish`, `TE-API-GET-api-member-templates`, `TE-API-GET-api-member-templates-slug`, `TE-API-POST-api-member-templates-seed`, `TE-API-POST-api-member-templates-slug-apply`, `TE-API-POST-api-members-me-agent`, `TE-API-GET-api-profiles-me-personal`, `TE-API-PATCH-api-profiles-me-personal`, `TE-API-GET-api-profiles-me-orgs`, `TE-API-POST-api-profiles-me-orgs`, `TE-API-GET-api-profiles-orgs-orgId`, `TE-API-PATCH-api-profiles-orgs-orgId`, `TE-API-DELETE-api-profiles-orgs-orgId`, `TE-API-POST-api-profiles-orgs-orgId-members`, `TE-API-PATCH-api-profiles-orgs-orgId-members-userId`, `TE-API-DELETE-api-profiles-orgs-orgId-members-userId`, `TE-API-POST-api-profiles-me-personal-link-org-orgId`, `TE-API-DELETE-api-profiles-me-personal-link-org-orgId`, `TE-API-GET-api-profiles-me-licenses`, `TE-API-GET-api-profiles-admin-orgs`, `TE-API-GET-api-profiles-admin-licenses`, `TE-API-POST-api-profiles-admin-licenses`, `TE-API-DELETE-api-profiles-admin-licenses-id`

**Tables (10):** `TE-DB-member_configs`, `TE-DB-member_connections`, `TE-DB-member_json_store`, `TE-DB-member_messages`, `TE-DB-member_profiles`, `TE-DB-member_site_unlocks`, `TE-DB-member_sites`, `TE-DB-member_templates`, `TE-DB-personal_org_links`, `TE-DB-personal_profiles`

**UI routes (4):** `TE-UIR-member`, `TE-UIR-u-slug`, `TE-UIR-u-slug`, `TE-UIR-admin`

**Source files (20):** `TE-SRV-data-defaultMemberConfig`, `TE-SRV-data-defaultMemberProfile`, `TE-SRV-data-defaultMemberSite`, `TE-SRV-data-memberTemplates`, `TE-SRV-lib-memberAccess`, `TE-SRV-lib-memberDbConnections`, `TE-SRV-lib-memberStaffTemplates`, `TE-SRV-lib-memberVisibilityRegistry`, `TE-SRV-routes-memberAccess`, `TE-SRV-routes-memberConfig`, `TE-SRV-routes-memberSite`, `TE-SRV-routes-memberTemplates`, `TE-SRV-routes-members`, `TE-SRV-routes-profiles`, `TE-CMP-components-MemberCrystalOrbit`, `TE-CMP-components-MemberDashboard`, `TE-CMP-components-PublicProfile`, `TE-CMP-components-admin-MemberAccessPanel`, `TE-CMP-components-admin-MemberPanels`, `TE-CMP-data-memberWorldRegistry`

## MOD-05 — Public rendering — section blocks, themes & design tokens

**Endpoints (0):** —

**Tables (0):** —

**UI routes (0):** —

**Source files (17):** `TE-CMP-components-CrystalMark`, `TE-CMP-components-CrystalMarkField`, `TE-CMP-components-blocks-CareerProspectBlocks`, `TE-CMP-components-blocks-ColumnWidgets`, `TE-CMP-components-blocks-MetadataModelBlock`, `TE-CMP-components-blocks-ProductExperienceBlocks`, `TE-CMP-components-blocks-SectionShell`, `TE-CMP-components-blocks-blockUtils`, `TE-CMP-components-blocks-index`, `TE-CMP-data-capabilityTags`, `TE-CMP-data-elementRegistry`, `TE-CMP-lib-brandIconData`, `TE-CMP-lib-brandIcons`, `TE-CMP-lib-iconRegistry`, `TE-CMP-lib-mergeFieldRegistry`, `TE-CMP-lib-outputBlocks`, `TE-CMP-lib-vendorLogos`

## MOD-06 — SEO & structured data

**Endpoints (0):** —

**Tables (0):** —

**UI routes (0):** —

**Source files (3):** `TE-SRV-lib-seo`, `TE-SRV-lib-seoMiddleware`, `TE-CMP-lib-useSeoHead`

## MOD-07 — Output documents, resume & output templates

**Endpoints (17):** `TE-API-POST-api-resume-temp-access`, `TE-API-GET-api-resume-validate-temp-token`, `TE-API-POST-api-resume-temp-download-request`, `TE-API-GET-api-resume-member-reason-check`, `TE-API-POST-api-resume-member-reason`, `TE-API-POST-api-resume-member-download-request`, `TE-API-GET-api-output-templates`, `TE-API-GET-api-output-templates-primary`, `TE-API-GET-api-output-templates-portfolio`, `TE-API-GET-api-output-templates-id-public`, `TE-API-POST-api-output-templates`, `TE-API-PUT-api-output-templates-id`, `TE-API-DELETE-api-output-templates-id`, `TE-API-GET-api-resume-outputs`, `TE-API-POST-api-resume-outputs`, `TE-API-GET-api-resume-outputs-id-staleness`, `TE-API-PATCH-api-resume-outputs-id-status`

**Tables (4):** `TE-DB-output_templates`, `TE-DB-resume_member_reasons`, `TE-DB-resume_output_projections`, `TE-DB-resume_temp_access`

**UI routes (19):** `TE-UIR-output-resume`, `TE-UIR-output-case-study-slug`, `TE-UIR-output-proposal-type`, `TE-UIR-output-one-pager`, `TE-UIR-output-build-summary`, `TE-UIR-output-tech-stack`, `TE-UIR-output-product-one-pager`, `TE-UIR-output-patch-notes`, `TE-UIR-output-domains`, `TE-UIR-output-portfolio-appendix`, `TE-UIR-output-case-study-portfolio`, `TE-UIR-output-career-master-database`, `TE-UIR-output-portfolio`, `TE-UIR-output-resume-portfolio`, `TE-UIR-output-full-portfolio`, `TE-UIR-output-strategic-operator`, `TE-UIR-output-methodology`, `TE-UIR-output-l2r-model`, `TE-UIR-output-business-definition-experience`

**Source files (13):** `TE-SRV-lib-coverLetterTargeting`, `TE-SRV-lib-outputRendering`, `TE-SRV-lib-resumePresets`, `TE-SRV-lib-resumeProjection`, `TE-SRV-lib-resumeTargeting`, `TE-SRV-routes-outputTemplates`, `TE-SRV-routes-resumeAccess`, `TE-SRV-routes-resumeOutputs`, `TE-CMP-components-Output`, `TE-CMP-components-admin-MyResumePanel`, `TE-CMP-components-admin-OutputTemplateConfigurator`, `TE-CMP-lib-resumeDensity`, `TE-CMP-lib-resumeUrls`

## MOD-08 — Leads, CRM & BestyStaff intake

**Endpoints (33):** `TE-API-POST-api-leads-credential-reset`, `TE-API-GET-api-leads-actor-context`, `TE-API-POST-api-leads-touch`, `TE-API-PATCH-api-leads-id-stage-gates`, `TE-API-POST-api-leads-intake-email`, `TE-API-GET-api-leads-verify-email`, `TE-API-POST-api-leads`, `TE-API-POST-api-leads-public-publicId-unlock`, `TE-API-POST-api-leads-public-publicId-logout`, `TE-API-POST-api-leads-public-publicId-pledge`, `TE-API-POST-api-leads-public-publicId-convert`, `TE-API-GET-api-leads-public-publicId`, `TE-API-POST-api-leads-public-publicId-contact-emails`, `TE-API-POST-api-leads-public-publicId-contact-emails-id-resend-verification`, `TE-API-PATCH-api-leads-public-publicId-contact-emails-id`, `TE-API-PATCH-api-leads-public-publicId`, `TE-API-POST-api-leads-public-publicId-chat`, `TE-API-GET-api-leads`, `TE-API-POST-api-leads-admin-create`, `TE-API-PATCH-api-leads-id-job`, `TE-API-DELETE-api-leads-id`, `TE-API-POST-api-lead-integrations-ingest-provider`, `TE-API-GET-api-lead-integrations-leads-publicId`, `TE-API-POST-api-lead-integrations-sync-provider-publicId`, `TE-API-POST-api-agent-bestystaff`, `TE-API-POST-api-agent-bestystaff-career`, `TE-API-POST-api-portfolio-requests`, `TE-API-PATCH-api-portfolio-requests-id-notes`, `TE-API-PATCH-api-portfolio-requests-id-lead`, `TE-API-GET-api-portfolio-requests-lookup`, `TE-API-GET-api-portfolio-requests-my-history`, `TE-API-POST-api-portfolio-requests-id-attachments`, `TE-API-GET-api-portfolio-requests`

**Tables (11):** `TE-DB-account_records`, `TE-DB-customer_agent_memory`, `TE-DB-lead_activity`, `TE-DB-lead_email_addresses`, `TE-DB-lead_email_verifications`, `TE-DB-lead_emails`, `TE-DB-lead_messages`, `TE-DB-lead_sessions`, `TE-DB-lead_visits`, `TE-DB-leads`, `TE-DB-portfolio_requests`

**UI routes (1):** `TE-UIR-lead-publicId`

**Source files (16):** `TE-SRV-lib-bestyStaffGateDefinitions`, `TE-SRV-lib-customerMemory`, `TE-SRV-lib-emailDomain`, `TE-SRV-lib-qualificationGateCheckers`, `TE-SRV-routes-bestyStaff`, `TE-SRV-routes-bestyStaffCareer`, `TE-SRV-routes-leadIntegrations`, `TE-SRV-routes-leads`, `TE-SRV-routes-portfolioRequests`, `TE-CMP-components-BestyStaffContactSection`, `TE-CMP-components-LeadView`, `TE-CMP-components-PortfolioRequestFlow`, `TE-CMP-components-admin-LeadsPanel`, `TE-CMP-components-admin-NetWorksPanel`, `TE-CMP-lib-bestyStaffAttribution`, `TE-CMP-lib-bestyStaffScript`

## MOD-09 — Email delivery & notifications

**Endpoints (5):** `TE-API-GET-api-notifications`, `TE-API-PATCH-api-notifications-id-read`, `TE-API-POST-api-notifications-read-all`, `TE-API-GET-api-notifications-tasks`, `TE-API-PATCH-api-notifications-tasks-id`

**Tables (2):** `TE-DB-email_delivery_preferences`, `TE-DB-notifications`

**UI routes (0):** —

**Source files (5):** `TE-SRV-lib-email`, `TE-SRV-lib-notificationEngine`, `TE-SRV-routes-notifications`, `TE-CMP-components-admin-InboxPanel`, `TE-CMP-components-admin-NotificationBell`

## MOD-10 — Integrations — OAuth, data sources, uploads, Jira

**Endpoints (13):** `TE-API-GET-api-data-sources-key-rollup`, `TE-API-GET-api-jira-config`, `TE-API-PUT-api-jira-config`, `TE-API-POST-api-jira-test`, `TE-API-GET-api-jira-projects`, `TE-API-POST-api-jira-import`, `TE-API-GET-api-oauth-provider-connect`, `TE-API-GET-api-oauth-provider-callback`, `TE-API-POST-api-oauth-supabase-pat`, `TE-API-GET-api-oauth-connections`, `TE-API-PATCH-api-oauth-connections-provider`, `TE-API-DELETE-api-oauth-connections-provider`, `TE-API-POST-api-uploads`

**Tables (8):** `TE-DB-data_ports`, `TE-DB-data_snapshots`, `TE-DB-jira_config`, `TE-DB-member_oauth_connections`, `TE-DB-oauth_connections`, `TE-DB-port_source_fields`, `TE-DB-port_source_objects`, `TE-DB-temp_attachments`

**UI routes (0):** —

**Source files (8):** `TE-SRV-lib-dataSourceRegistry`, `TE-SRV-lib-oauthProviders`, `TE-SRV-routes-dataSources`, `TE-SRV-routes-jira`, `TE-SRV-routes-oauth`, `TE-SRV-routes-uploads`, `TE-CMP-components-admin-AttachmentList`, `TE-CMP-components-admin-UploadDataScreen`

## MOD-11 — Commerce, licensing, entitlements & services

**Endpoints (20):** `TE-API-POST-api-commerce-webhook`, `TE-API-GET-api-services-proposals`, `TE-API-POST-api-services-proposals`, `TE-API-GET-api-services-proposals-id`, `TE-API-PUT-api-services-proposals-id`, `TE-API-POST-api-services-proposals-id-publish`, `TE-API-POST-api-services-proposals-id-request-access`, `TE-API-GET-api-services-proposals-id-access`, `TE-API-GET-api-services-leads`, `TE-API-DELETE-api-services-proposals-id`, `TE-API-GET-api-services-public`, `TE-API-GET-api-commerce-products`, `TE-API-GET-api-commerce-my-access`, `TE-API-POST-api-commerce-checkout`, `TE-API-POST-api-commerce-request-custom-scoping`, `TE-API-POST-api-commerce-onboarding-runs`, `TE-API-GET-api-commerce-onboarding-runs`, `TE-API-POST-api-commerce-message-betsy-start`, `TE-API-GET-api-commerce-admin-products`, `TE-API-GET-api-member-entitlements`

**Tables (17):** `TE-DB-capability_groups`, `TE-DB-commerce_offerings`, `TE-DB-commerce_payments`, `TE-DB-data_entitlements`, `TE-DB-deliverable_packages`, `TE-DB-entitlement_renewals`, `TE-DB-member_capability_allocations`, `TE-DB-member_feature_grants`, `TE-DB-member_subscription_seats`, `TE-DB-member_subscriptions`, `TE-DB-offering_features`, `TE-DB-platform_applications`, `TE-DB-product_licenses`, `TE-DB-product_onboarding_runs`, `TE-DB-rate_configs`, `TE-DB-services_proposal_access`, `TE-DB-tier_workarounds`

**UI routes (0):** —

**Source files (11):** `TE-SRV-lib-customerEntitlements`, `TE-SRV-lib-memberProvisioning`, `TE-SRV-lib-provisioningPolicyRegistry`, `TE-SRV-lib-usageTracking`, `TE-SRV-routes-commerce`, `TE-SRV-routes-memberEntitlements`, `TE-SRV-routes-services`, `TE-CMP-components-admin-MemberEntitlementsPanel`, `TE-CMP-components-admin-MemberProductsPanel`, `TE-CMP-components-admin-ServicesPanel`, `TE-CMP-data-platformModules`

## MOD-12 — Organizations & org portal

**Endpoints (12):** `TE-API-GET-api-org-portal-orgId-consent-status`, `TE-API-POST-api-org-portal-orgId-consent`, `TE-API-GET-api-org-portal-orgId-context`, `TE-API-GET-api-org-portal-orgId-auth-policy`, `TE-API-PUT-api-org-portal-orgId-auth-policy`, `TE-API-PUT-api-org-portal-orgId-members-userId-capabilities-capabilityKey`, `TE-API-GET-api-org-portal-orgId-page-types`, `TE-API-GET-api-org-portal-orgId-r-path`, `TE-API-PUT-api-org-portal-orgId-r-path`, `TE-API-GET-api-org-portal-orgId-documents`, `TE-API-GET-api-org-portal-orgId-documents-id`, `TE-API-POST-api-org-portal-orgId-publish`

**Tables (5):** `TE-DB-org_configs`, `TE-DB-org_document_projections`, `TE-DB-org_memberships`, `TE-DB-org_sites`, `TE-DB-organization_profiles`

**UI routes (1):** `TE-UIR-org-orgId`

**Source files (4):** `TE-SRV-lib-orgDocumentProjection`, `TE-SRV-routes-orgPortal`, `TE-CMP-components-OrgPortal`, `TE-CMP-components-admin-OrgDocumentsPanel`

## MOD-13 — Member financial connections

**Endpoints (8):** `TE-API-GET-api-member-financial-providers`, `TE-API-DELETE-api-member-financial-connections-connectionId`, `TE-API-GET-api-member-financial-connections`, `TE-API-POST-api-member-financial-connections`, `TE-API-POST-api-member-financial-connections-connectionId-accounts`, `TE-API-POST-api-member-financial-shares`, `TE-API-GET-api-member-financial-organizations-orgId-shares`, `TE-API-DELETE-api-member-financial-shares-shareId`

**Tables (4):** `TE-DB-external_financial_connections`, `TE-DB-financial_account_definitions`, `TE-DB-financial_consents`, `TE-DB-financial_output_shares`

**UI routes (0):** —

**Source files (3):** `TE-SRV-lib-financialPolicyRegistry`, `TE-SRV-routes-memberFinancial`, `TE-CMP-components-admin-MemberFinancialPanel`

## MOD-14 — Career — Career Master, Channel Rod, reconciliation, reasoning, placement agents

**Endpoints (96):** `TE-API-GET-api-career-master`, `TE-API-GET-api-career-rollups`, `TE-API-GET-api-career-catalogs`, `TE-API-GET-api-career-atom-rollups`, `TE-API-GET-api-career-public-rollup-slug-displayKey`, `TE-API-GET-api-career-consent-status`, `TE-API-POST-api-career-consent`, `TE-API-GET-api-career-intake-documents`, `TE-API-POST-api-career-intake-documents`, `TE-API-POST-api-career-intake-documents-linkedin-pull`, `TE-API-GET-api-career-intake-runs`, `TE-API-POST-api-career-intake-runs`, `TE-API-POST-api-career-intake-runs-id-run`, `TE-API-POST-api-career-sync-site-metadata`, `TE-API-GET-api-career-semantic-template`, `TE-API-POST-api-career-semantic-import`, `TE-API-POST-api-career-resume-analysis`, `TE-API-POST-api-career-mappings-classify`, `TE-API-GET-api-career-mappings-lineage`, `TE-API-POST-api-career-mappings-commit`, `TE-API-POST-api-career-bounded-agent-action`, `TE-API-GET-api-career-experience-definitions`, `TE-API-PUT-api-career-experience-definitions-type-key`, `TE-API-DELETE-api-career-experience-definitions-type-key`, `TE-API-GET-api-career-proficiency-assertions`, `TE-API-PUT-api-career-proficiency-assertions-entityType-entityId-periodKey`, `TE-API-DELETE-api-career-proficiency-assertions-entityType-entityId-periodKey`, `TE-API-GET-api-career-rollup-preview-key`, `TE-API-POST-api-career-seed`, `TE-API-GET-api-career-jobs`, `TE-API-POST-api-career-jobs`, `TE-API-PATCH-api-career-jobs-id`, `TE-API-DELETE-api-career-jobs-id`, `TE-API-GET-api-career-skills`, `TE-API-POST-api-career-skills`, `TE-API-PATCH-api-career-skills-id`, `TE-API-DELETE-api-career-skills-id`, `TE-API-GET-api-career-tools`, `TE-API-POST-api-career-tools`, `TE-API-PATCH-api-career-tools-id`, `TE-API-DELETE-api-career-tools-id`, `TE-API-GET-api-career-engagements`, `TE-API-POST-api-career-engagements`, `TE-API-PATCH-api-career-engagements-id`, `TE-API-DELETE-api-career-engagements-id`, `TE-API-GET-api-career-domains`, `TE-API-POST-api-career-domains`, `TE-API-PATCH-api-career-domains-id`, `TE-API-DELETE-api-career-domains-id`, `TE-API-GET-api-career-certifications`, `TE-API-POST-api-career-certifications`, `TE-API-PATCH-api-career-certifications-id`, `TE-API-DELETE-api-career-certifications-id`, `TE-API-GET-api-career-deals`, `TE-API-POST-api-career-deals`, `TE-API-PATCH-api-career-deals-id`, `TE-API-DELETE-api-career-deals-id`, `TE-API-GET-api-career-meta-options`, `TE-API-POST-api-career-meta-options`, `TE-API-PATCH-api-career-meta-options-id`, `TE-API-DELETE-api-career-meta-options-id`, `TE-API-GET-api-career-reconciliation-tasks`, `TE-API-POST-api-career-reconciliation-tasks-id-resolve`, `TE-API-GET-api-career-reasoning-admin-candidates`, `TE-API-POST-api-career-reasoning-admin-candidates-id-decide`, `TE-API-GET-api-career-agents-agent-hub`, `TE-API-GET-api-career-agents-opportunities`, `TE-API-POST-api-career-agents-opportunities`, `TE-API-POST-api-career-agents-opportunities-id-scores`, `TE-API-POST-api-career-agents-import`, `TE-API-POST-api-career-agents-research`, `TE-API-POST-api-career-agents-opportunities-id-import-output`, `TE-API-POST-api-career-agents-opportunities-id-generate-resume`, `TE-API-POST-api-career-agents-opportunities-id-resume-outputs`, `TE-API-GET-api-career-agents-opportunities-id-resume-outputs`, `TE-API-GET-api-career-agents-resume-outputs-id-view`, `TE-API-GET-api-career-agents-resume-outputs-id-download-pdf`, `TE-API-POST-api-career-agents-resume-outputs-export-zip`, `TE-API-POST-api-career-agents-resume-outputs-email`, `TE-API-POST-api-career-agents-opportunities-id-approve`, `TE-API-POST-api-career-agents-opportunities-id-advance-stage`, `TE-API-POST-api-career-agents-opportunities-id-generate-cover-letter`, `TE-API-POST-api-career-agents-opportunities-id-cover-letter-outputs`, `TE-API-POST-api-career-agents-verify-pipeline`, `TE-API-POST-api-career-agents-auto-queue-outputs`, `TE-API-POST-api-career-agents-generate-resume-queue`, `TE-API-GET-api-career-agents-schedule`, `TE-API-POST-api-career-agents-schedule`, `TE-API-GET-api-career-agents-verification-current`, `TE-API-PUT-api-career-agents-verification-current`, `TE-API-GET-api-career-agents-opportunities-id-outreach`, `TE-API-POST-api-career-agents-opportunities-id-outreach-start`, `TE-API-POST-api-career-agents-opportunities-id-outreach-research-contacts`, `TE-API-POST-api-career-agents-opportunities-id-outreach-draft-message`, `TE-API-POST-api-career-agents-opportunities-id-outreach-messages`, `TE-API-POST-api-career-agents-outreach-id-merge-outcome`

**Tables (16):** `TE-DB-career_certifications`, `TE-DB-career_deals`, `TE-DB-career_domains`, `TE-DB-career_engagements`, `TE-DB-career_experience_definitions`, `TE-DB-career_intake_documents`, `TE-DB-career_intake_runs`, `TE-DB-career_jobs`, `TE-DB-career_meta_options`, `TE-DB-career_proficiency_assertions`, `TE-DB-career_reasoning_approvals`, `TE-DB-career_reasoning_cache_candidates`, `TE-DB-career_reconciliation_tasks`, `TE-DB-career_skills`, `TE-DB-career_source_mappings`, `TE-DB-career_tools`

**UI routes (0):** —

**Source files (38):** `TE-SRV-data-career-seed`, `TE-SRV-lib-careerAtomMigration`, `TE-SRV-lib-careerAtomRegistry`, `TE-SRV-lib-careerAtomRollups`, `TE-SRV-lib-careerBondingEngine`, `TE-SRV-lib-careerFileRetention`, `TE-SRV-lib-careerOpportunityRollups`, `TE-SRV-lib-careerOutreachRollups`, `TE-SRV-lib-careerPipelineImport`, `TE-SRV-lib-careerProficiencyRollups`, `TE-SRV-lib-careerReasoningCompiler`, `TE-SRV-lib-careerReconciliation`, `TE-SRV-lib-careerResearchAgent`, `TE-SRV-lib-careerResumeExtraction`, `TE-SRV-lib-careerSemanticImport`, `TE-SRV-lib-careerSemanticTemplate`, `TE-SRV-lib-careerVerificationAgent`, `TE-SRV-lib-hiringManagerResearchAgent`, `TE-SRV-lib-outreachDraftAgent`, `TE-SRV-lib-trajectory`, `TE-SRV-routes-careerMaster`, `TE-SRV-routes-careerPlacementAgents`, `TE-SRV-routes-careerReasoningAdmin`, `TE-SRV-routes-careerReconciliation`, `TE-CMP-components-admin-BoundedCareerAgentPanel`, `TE-CMP-components-admin-CareerExperienceConfigurator`, `TE-CMP-components-admin-CareerIntakePanel`, `TE-CMP-components-admin-CareerMappingPreview`, `TE-CMP-components-admin-CareerMasterEntryPoint`, `TE-CMP-components-admin-CareerMasterPanel`, `TE-CMP-components-admin-CareerOrbit`, `TE-CMP-components-admin-CareerPlacementAgentsPanel`, `TE-CMP-components-admin-CareerReasoningCompilerPanel`, `TE-CMP-components-admin-CareerReconciliationPanel`, `TE-CMP-components-admin-ChooseYourPathScreen`, `TE-CMP-components-admin-JourneyReviewScreens`, `TE-CMP-lib-careerMaster`, `TE-CMP-lib-hooks-useCareerPlacementAgents`

## MOD-15 — Commercial opportunity pipeline & Lead-to-Revenue diagnostics

**Endpoints (13):** `TE-API-GET-api-commercial-opportunities-agent-hub`, `TE-API-GET-api-commercial-opportunities-opportunities`, `TE-API-POST-api-commercial-opportunities-opportunities`, `TE-API-POST-api-commercial-opportunities-opportunities-id-scores`, `TE-API-GET-api-l2r-diagnostics-domains`, `TE-API-GET-api-l2r-diagnostics-domains-domainKey-capabilities`, `TE-API-GET-api-l2r-diagnostics-scenarios-scenarioKey`, `TE-API-GET-api-l2r-diagnostics`, `TE-API-POST-api-l2r-diagnostics`, `TE-API-GET-api-l2r-diagnostics-id`, `TE-API-GET-api-l2r-diagnostics-id-landscape`, `TE-API-POST-api-l2r-diagnostics-id-observations`, `TE-API-POST-api-l2r-diagnostics-id-findings`

**Tables (6):** `TE-DB-client_basin_templates`, `TE-DB-entities`, `TE-DB-persons`, `TE-DB-relationships`, `TE-DB-revenue_journey_contacts`, `TE-DB-revenue_journeys`

**UI routes (0):** —

**Source files (13):** `TE-SRV-data-l2rCapabilityHierarchySeed`, `TE-SRV-data-leadToRevenueModel`, `TE-SRV-lib-commercialOpportunityRollups`, `TE-SRV-lib-l2rDiagnosticEngagement`, `TE-SRV-lib-l2rDiagnosticRegistry`, `TE-SRV-lib-opportunityPipelineRegistry`, `TE-SRV-routes-commercialOpportunities`, `TE-SRV-routes-l2rDiagnostics`, `TE-CMP-components-OpportunityAgentOrbitWorld`, `TE-CMP-components-admin-CommercialOpportunityPanel`, `TE-CMP-components-admin-L2rDiagnosticPanel`, `TE-CMP-lib-hooks-useCommercialOpportunities`, `TE-CMP-lib-hooks-useOpportunityPipeline`

## MOD-16 — Journey Rod / Channel substrate — EIDOS, Genesis, scenarios, lineage, methodology

**Endpoints (76):** `TE-API-POST-api-journey-rods-scenario-library-apply`, `TE-API-GET-api-journey-rods-me`, `TE-API-GET-api-journey-rods-catalog`, `TE-API-POST-api-journey-rods`, `TE-API-GET-api-journey-rods-lead-leadId`, `TE-API-GET-api-journey-rods-stage-gates`, `TE-API-PUT-api-journey-rods-stage-gates-rodType-stageKey`, `TE-API-GET-api-journey-rods-path`, `TE-API-PUT-api-journey-rods-molecules-key`, `TE-API-PUT-api-journey-rods-clusters-key`, `TE-API-PUT-api-journey-rods-scenarios-key`, `TE-API-GET-api-journey-rods-currents`, `TE-API-PUT-api-journey-rods-currents-key`, `TE-API-GET-api-journey-rods-scenarios-generate-preview`, `TE-API-POST-api-journey-rods-scenarios-generate`, `TE-API-PUT-api-journey-rods-scenarios-key-gates-stageKey`, `TE-API-POST-api-journey-rods-rodId-actors`, `TE-API-GET-api-journey-rods-rodId-threshold-profile`, `TE-API-PUT-api-journey-rods-rodId-threshold-profile`, `TE-API-POST-api-journey-rods-rodId-evidence`, `TE-API-POST-api-journey-rods-rodId-evaluate`, `TE-API-GET-api-journey-rods-decisions-pending`, `TE-API-GET-api-journey-rods-rodId`, `TE-API-POST-api-journey-rods-decisions-id-resolve`, `TE-API-GET-api-eidos-rod-types`, `TE-API-PUT-api-eidos-rod-types-id`, `TE-API-DELETE-api-eidos-rod-types-id`, `TE-API-GET-api-eidos-ports`, `TE-API-PUT-api-eidos-ports-key`, `TE-API-DELETE-api-eidos-ports-key`, `TE-API-GET-api-eidos-ports-portId-source-objects`, `TE-API-PUT-api-eidos-ports-portId-source-objects-key`, `TE-API-GET-api-eidos-source-objects-sourceObjectId-fields`, `TE-API-PUT-api-eidos-source-objects-sourceObjectId-fields-key`, `TE-API-GET-api-eidos-affinity-rules`, `TE-API-PUT-api-eidos-affinity-rules-clusterKey-moleculeKey`, `TE-API-DELETE-api-eidos-affinity-rules-clusterKey-moleculeKey`, `TE-API-GET-api-eidos-settlement-states-rodId`, `TE-API-POST-api-eidos-settlement-states-rodId-compute`, `TE-API-GET-api-eidos-accounting-policies`, `TE-API-PUT-api-eidos-accounting-policies-key`, `TE-API-DELETE-api-eidos-accounting-policies-key`, `TE-API-GET-api-eidos-gl-accounts`, `TE-API-PUT-api-eidos-gl-accounts-key`, `TE-API-DELETE-api-eidos-gl-accounts-key`, `TE-API-GET-api-eidos-accounting-topologies`, `TE-API-PUT-api-eidos-accounting-topologies-key`, `TE-API-DELETE-api-eidos-accounting-topologies-key`, `TE-API-GET-api-eidos-journal-entries`, `TE-API-GET-api-eidos-journal-entries-id`, `TE-API-POST-api-eidos-journal-entries`, `TE-API-GET-api-eidos-reciprocal-requirements-topologyId`, `TE-API-GET-api-eidos-reciprocal-comparisons-rodId`, `TE-API-GET-api-eidos-reciprocal-divergences-rodId`, `TE-API-POST-api-eidos-reciprocal-divergences-compute`, `TE-API-GET-api-methodology-stats-summary`, `TE-API-GET-api-lineage-snapshots`, `TE-API-GET-api-lineage-snapshots-id-fields`, `TE-API-GET-api-lineage-field`, `TE-API-GET-api-lineage-entities`, `TE-API-GET-api-scenarios-summary`, `TE-API-GET-api-scenarios-scenarioId`, `TE-API-POST-api-scenarios-resolve-atoms`, `TE-API-GET-api-scenarios-scenarioId-dependencies`, `TE-API-GET-api-genesis-summary`, `TE-API-GET-api-genesis-catalog-layer-table`, `TE-API-GET-api-genesis-catalog-layer`, `TE-API-GET-api-genesis-configurations`, `TE-API-PUT-api-genesis-configurations`, `TE-API-POST-api-genesis-evaluate`, `TE-API-GET-api-genesis-overlaps-summary`, `TE-API-GET-api-genesis-overlaps`, `TE-API-PATCH-api-genesis-overlaps-id`, `TE-API-GET-api-genesis-overlaps-id-recommendation`, `TE-API-POST-api-genesis-overlaps-id-resolution-preview`, `TE-API-POST-api-genesis-overlaps-id-resolution-decision`

**Tables (28):** `TE-DB-divergence_states`, `TE-DB-economic_composition_requirements`, `TE-DB-field_lineage`, `TE-DB-genesis_configurations`, `TE-DB-genesis_object_overlaps`, `TE-DB-historical_observations`, `TE-DB-journey_atom_affinity_rules`, `TE-DB-journey_current_definitions`, `TE-DB-journey_data_rods`, `TE-DB-journey_gate_definitions`, `TE-DB-journey_metadata_clusters`, `TE-DB-journey_metadata_molecules`, `TE-DB-journey_rod_actors`, `TE-DB-journey_rod_decisions`, `TE-DB-journey_rod_entity_links`, `TE-DB-journey_rod_events`, `TE-DB-journey_rod_evidence`, `TE-DB-journey_rod_person_links`, `TE-DB-journey_rod_settlement_states`, `TE-DB-journey_rod_threshold_profiles`, `TE-DB-journey_rod_tributary_links`, `TE-DB-journey_rod_types`, `TE-DB-journey_scenarios`, `TE-DB-journey_stage_gates`, `TE-DB-reciprocity_comparisons`, `TE-DB-scenario_definition_versions`, `TE-DB-scenario_imports`, `TE-DB-scenario_observations`

**UI routes (0):** —

**Source files (66):** `TE-SRV-data-contributionTaxonomy`, `TE-SRV-data-genesisOverlapSeeds`, `TE-SRV-data-scenarioLibrary`, `TE-SRV-lib-approvalGate`, `TE-SRV-lib-collaborationRegistry`, `TE-SRV-lib-currentRegistry`, `TE-SRV-lib-documentAtomRegistry`, `TE-SRV-lib-documentAtomSync`, `TE-SRV-lib-documentStructureParser`, `TE-SRV-lib-eidos`, `TE-SRV-lib-eidosBonding`, `TE-SRV-lib-genesisCatalog`, `TE-SRV-lib-journeyEvidenceHelpers`, `TE-SRV-lib-journeyRods`, `TE-SRV-lib-lineage`, `TE-SRV-lib-molecule`, `TE-SRV-lib-riverbedRegistry`, `TE-SRV-lib-rollupMetrics`, `TE-SRV-lib-scenarioGenerator`, `TE-SRV-lib-scenarioLibraryApply`, `TE-SRV-lib-tributaryRegistry`, `TE-SRV-routes-eidos`, `TE-SRV-routes-genesis`, `TE-SRV-routes-journeyRods`, `TE-SRV-routes-lineage`, `TE-SRV-routes-methodologyStats`, `TE-SRV-routes-scenarios`, `TE-CMP-components-DefinitionStudioJourney`, `TE-CMP-components-RiverSystemMap`, `TE-CMP-components-admin-EidosOperatingModelPanel`, `TE-CMP-components-admin-GenesisFoundationPanel`, `TE-CMP-components-admin-LineagePanel`, `TE-CMP-components-admin-MethodologyConfigPanel`, `TE-CMP-components-admin-OverlapResolutionJourney`, `TE-CMP-config-architecture-layerRegistry`, `TE-CMP-config-architecture-objectTypeRegistry`, `TE-CMP-config-journeys-journeyDefinitions`, `TE-CMP-config-metrics-maturityModel`, `TE-CMP-config-metrics-metricCategoryRegistry`, `TE-CMP-config-metrics-metricDefinitionRegistry`, `TE-CMP-config-metrics-queryContextRegistry`, `TE-CMP-config-metrics-queryConvergenceMethodology`, `TE-CMP-config-metrics-queryRelevanceNarrative`, `TE-CMP-config-metrics-rodMathematicsMethodology`, `TE-CMP-data-handoverOsScenarioLibrary`, `TE-CMP-lib-journeyEngine-atomGeometry`, `TE-CMP-lib-journeyEngine-basin`, `TE-CMP-lib-journeyEngine-bonding`, `TE-CMP-lib-journeyEngine-divergence`, `TE-CMP-lib-journeyEngine-genesis`, `TE-CMP-lib-journeyEngine-layout`, `TE-CMP-lib-journeyEngine-lineage`, `TE-CMP-lib-journeyEngine-maturity`, `TE-CMP-lib-journeyEngine-maturityEngine`, `TE-CMP-lib-journeyEngine-mockAgentProvider`, `TE-CMP-lib-journeyEngine-pathColor`, `TE-CMP-lib-journeyEngine-queryConvergence`, `TE-CMP-lib-journeyEngine-rodHash`, `TE-CMP-lib-journeyEngine-rodMathematics`, `TE-CMP-lib-maturityScoring`, `TE-CMP-lib-riverSystemMap`, `TE-CMP-lib-semanticMigrationAdapter`, `TE-CMP-scenarios-fixtureGenerator`, `TE-CMP-scenarios-scenarioObservation`, `TE-CMP-scenarios-scenarioRegistry`, `TE-CMP-scenarios-scenarioSignature`

## MOD-17 — 3D worlds, crystal design system & experience engine

**Endpoints (8):** `TE-API-PUT-api-presence-rodId-heartbeat`, `TE-API-GET-api-presence-rodId`, `TE-API-DELETE-api-presence-rodId`, `TE-API-POST-api-admin-world-variant-studio-generate`, `TE-API-POST-api-admin-world-variant-studio-validate`, `TE-API-GET-api-admin-world-variant-studio-default-spec`, `TE-API-GET-api-experience-reference-prototype`, `TE-API-GET-api-experience-reference-prototype-key-visual`

**Tables (9):** `TE-DB-checkpoint_presence`, `TE-DB-experience_agent_bindings`, `TE-DB-experience_journey_gates`, `TE-DB-experience_journeys`, `TE-DB-experience_orbits`, `TE-DB-experience_worlds`, `TE-DB-member_home_experience`, `TE-DB-member_journey_collaborators`, `TE-DB-member_journey_instances`

**UI routes (2):** `TE-UIR-world`, `TE-UIR-experience-reference`

**Source files (43):** `TE-SRV-lib-worldVariantSeedAgent`, `TE-SRV-routes-experience`, `TE-SRV-routes-presence`, `TE-SRV-routes-worldVariantStudio`, `TE-CMP-components-CrystalOfficeScene`, `TE-CMP-components-CrystalRoomScene`, `TE-CMP-components-CrystalSolarSystem`, `TE-CMP-components-CrystalWorldCityScene`, `TE-CMP-components-FlowingJourneyDeck`, `TE-CMP-components-PlanetAtmosphereView`, `TE-CMP-components-ReferenceExperiencePage`, `TE-CMP-components-SaltBasinCrystal`, `TE-CMP-components-SpatialJourneyWorld`, `TE-CMP-components-WorldShell`, `TE-CMP-components-admin-WorldVariantStudioPanel`, `TE-CMP-config-experience-cameraRegistry`, `TE-CMP-config-experience-characterRegistry`, `TE-CMP-config-experience-dashboardDefinitionRegistry`, `TE-CMP-config-experience-experienceGenome`, `TE-CMP-config-experience-experienceKnowledgeGraph`, `TE-CMP-config-experience-experienceManifest`, `TE-CMP-config-experience-motionRegistry`, `TE-CMP-config-experience-referenceJourneyManifest`, `TE-CMP-config-visual-journeyWorldExperience`, `TE-CMP-config-visual-lonetreeProposalNarrative`, `TE-CMP-config-visual-lonetreeProspectExperience`, `TE-CMP-config-visual-metricVisualEncodingRegistry`, `TE-CMP-config-visual-visualSemanticRegistry`, `TE-CMP-config-visual-worldCompositionRegistry`, `TE-CMP-config-visual-worldRegistry`, `TE-CMP-config-visual-worldVariantComponentProfiles`, `TE-CMP-config-visual-worldVariantEncodingProfiles`, `TE-CMP-config-visual-worldVariantGenerativeSeed`, `TE-CMP-config-visual-worldVariantRegistry`, `TE-CMP-data-crystalExperienceConfig`, `TE-CMP-data-dealJourneyExperience`, `TE-CMP-data-journeyWorldConfig`, `TE-CMP-lib-crystalGeometry`, `TE-CMP-lib-experienceAssetPipeline`, `TE-CMP-lib-experienceCompiler`, `TE-CMP-lib-experienceEngine-lonetreeExperience`, `TE-CMP-lib-sceneManifest`, `TE-CMP-lib-worldIslands`

## MOD-18 — Agents — agent hub, member agent, dispatcher, governance

**Endpoints (29):** `TE-API-GET-api-agent-threads`, `TE-API-POST-api-agent-threads`, `TE-API-GET-api-agent-context-profiles`, `TE-API-POST-api-agent-context-profiles`, `TE-API-GET-api-agent-knowledge`, `TE-API-PATCH-api-agent-knowledge-id`, `TE-API-GET-api-agent-code-runs`, `TE-API-POST-api-agent-code-runs`, `TE-API-POST-api-agent-code-runs-id-approve`, `TE-API-POST-api-agent-code-runs-id-reject`, `TE-API-GET-api-agent-code-runs-id-events`, `TE-API-GET-api-agent-backlog-reconciliation`, `TE-API-POST-api-agent-backlog-reconciliation`, `TE-API-GET-api-agent-threads-id-messages`, `TE-API-DELETE-api-agent-threads-id`, `TE-API-POST-api-agent-chat`, `TE-API-GET-api-governance-pending`, `TE-API-GET-api-governance-overrides`, `TE-API-POST-api-governance-pending`, `TE-API-POST-api-governance-pending-id-approve`, `TE-API-POST-api-governance-pending-id-reject`, `TE-API-GET-api-agent-hub-definitions`, `TE-API-POST-api-agent-hub-definitions`, `TE-API-PATCH-api-agent-hub-definitions-id`, `TE-API-DELETE-api-agent-hub-definitions-id`, `TE-API-POST-api-agent-hub-definitions-id-run-now`, `TE-API-GET-api-agent-hub-runs`, `TE-API-GET-api-agent-hub-runs-id`, `TE-API-PATCH-api-agent-hub-findings-id`

**Tables (18):** `TE-DB-agent_approval_workflows`, `TE-DB-agent_code_run_events`, `TE-DB-agent_code_runs`, `TE-DB-agent_context_profiles`, `TE-DB-agent_definitions`, `TE-DB-agent_hub_definitions`, `TE-DB-agent_hub_run_findings`, `TE-DB-agent_hub_runs`, `TE-DB-agent_knowledge_records`, `TE-DB-agent_llm_usage`, `TE-DB-agent_messages`, `TE-DB-agent_run_log`, `TE-DB-agent_schedules`, `TE-DB-agent_session_participants`, `TE-DB-agent_threads`, `TE-DB-agent_work_stage_events`, `TE-DB-member_agent_messages`, `TE-DB-user_tasks`

**UI routes (0):** —

**Source files (26):** `TE-SRV-lib-agentCadenceEnvelope`, `TE-SRV-lib-agentContextRegistry`, `TE-SRV-lib-agentDataPolicy`, `TE-SRV-lib-agentDispatcher`, `TE-SRV-lib-agentHubRunner`, `TE-SRV-lib-agentLlmUsage`, `TE-SRV-lib-agentRunGovernance`, `TE-SRV-lib-agentStudioGovernance`, `TE-SRV-lib-agents-codeReviewAgent`, `TE-SRV-lib-agents-contentResearchAgent`, `TE-SRV-lib-agents-crystalWorldAuditAgent`, `TE-SRV-lib-agents-staticHeuristics`, `TE-SRV-lib-autoQueueAgent`, `TE-SRV-lib-codeAgentContext`, `TE-SRV-lib-codeAgentRunner`, `TE-SRV-lib-contextCache`, `TE-SRV-lib-interactiveAgentLoop`, `TE-SRV-routes-agent`, `TE-SRV-routes-agentHub`, `TE-SRV-routes-governance`, `TE-SRV-routes-memberAgent`, `TE-CMP-components-admin-AgentHubConfigPanel`, `TE-CMP-components-admin-AgentOutputsPanel`, `TE-CMP-components-admin-CommandCenterPanel`, `TE-CMP-components-admin-GovernancePanel`, `TE-CMP-components-admin-ScrumAgentPanel`

## MOD-19 — Platform lifecycle management — backlog, QA, deployment & contribution intelligence

**Endpoints (47):** `TE-API-GET-api-backlog`, `TE-API-GET-api-backlog-groups`, `TE-API-POST-api-backlog-groups`, `TE-API-PATCH-api-backlog-groups-id`, `TE-API-GET-api-backlog-items-id`, `TE-API-POST-api-backlog-items`, `TE-API-PATCH-api-backlog-items-id`, `TE-API-DELETE-api-backlog-items-id`, `TE-API-POST-api-backlog-items-id-clone`, `TE-API-GET-api-backlog-quality-coverage`, `TE-API-POST-api-backlog-seed`, `TE-API-GET-api-backlog-summary`, `TE-API-GET-api-backlog-snapshots`, `TE-API-POST-api-backlog-snapshot`, `TE-API-GET-api-backlog-patch-notes`, `TE-API-GET-api-backlog-methodology`, `TE-API-GET-api-qa-scenarios`, `TE-API-GET-api-qa-scenarios-id`, `TE-API-POST-api-qa-scenarios`, `TE-API-PATCH-api-qa-scenarios-id`, `TE-API-DELETE-api-qa-scenarios-id`, `TE-API-POST-api-qa-scenarios-scenarioId-steps`, `TE-API-PATCH-api-qa-steps-id`, `TE-API-DELETE-api-qa-steps-id`, `TE-API-POST-api-qa-runs`, `TE-API-GET-api-qa-runs`, `TE-API-GET-api-qa-runs-id`, `TE-API-GET-api-qa-defects`, `TE-API-POST-api-qa-seed-code-context-journeys`, `TE-API-POST-api-feedback`, `TE-API-GET-api-feedback-mine`, `TE-API-POST-api-feedback-id-upvote`, `TE-API-GET-api-feedback`, `TE-API-PATCH-api-feedback-id`, `TE-API-POST-api-feedback-id-route`, `TE-API-GET-api-feedback-category-weights`, `TE-API-PATCH-api-feedback-category-weights-category`, `TE-API-GET-api-feedback-advisors`, `TE-API-POST-api-feedback-advisors`, `TE-API-DELETE-api-feedback-advisors-userId`, `TE-API-POST-api-deployment-intelligence-github`, `TE-API-POST-api-deployment-intelligence-id-evaluate-promotion`, `TE-API-POST-api-deployment-intelligence-id-promote-production`, `TE-API-GET-api-backlog-outputs`, `TE-API-POST-api-backlog-outputs-generate`, `TE-API-PATCH-api-backlog-outputs-id`, `TE-API-POST-api-backlog-outputs-id-image-jobs`

**Tables (23):** `TE-DB-backlog_components`, `TE-DB-backlog_contribution_links`, `TE-DB-backlog_deployment_components`, `TE-DB-backlog_deployment_items`, `TE-DB-backlog_deployments`, `TE-DB-backlog_items`, `TE-DB-backlog_output_image_jobs`, `TE-DB-backlog_output_publications`, `TE-DB-backlog_output_rule_configs`, `TE-DB-backlog_promotion_gates`, `TE-DB-backlog_reconciliation_runs`, `TE-DB-backlog_requirement_sources`, `TE-DB-build_progress_snapshots`, `TE-DB-contribution_events`, `TE-DB-feedback_advisors`, `TE-DB-feedback_category_weights`, `TE-DB-product_feedback`, `TE-DB-raw_events`, `TE-DB-test_run_step_results`, `TE-DB-test_runs`, `TE-DB-test_scenario_features`, `TE-DB-test_scenario_steps`, `TE-DB-test_scenarios`

**UI routes (0):** —

**Source files (20):** `TE-SRV-data-backlog-seed`, `TE-SRV-data-codeContextJourneyTests`, `TE-SRV-data-contributionMethodology`, `TE-SRV-data-patchNotes`, `TE-SRV-lib-backlogHistoryReconciler`, `TE-SRV-lib-backlogIntelligenceSchema`, `TE-SRV-lib-feedbackScoring`, `TE-SRV-routes-backlog`, `TE-SRV-routes-backlogOutputs`, `TE-SRV-routes-deploymentIntelligence`, `TE-SRV-routes-feedback`, `TE-SRV-routes-qa`, `TE-CMP-components-admin-BacklogDrawer`, `TE-CMP-components-admin-BacklogPanel`, `TE-CMP-components-admin-EmotionalWeatherPanel`, `TE-CMP-components-admin-FeedbackPanel`, `TE-CMP-components-admin-MemberPlmPanel`, `TE-CMP-components-admin-QAPanel`, `TE-CMP-data-backlogFieldSchema`, `TE-CMP-data-platformLifecycleConfig`

## MOD-20 — Analytics, events & audit

**Endpoints (8):** `TE-API-POST-api-events-page-view`, `TE-API-POST-api-field-audit`, `TE-API-GET-api-field-audit`, `TE-API-POST-api-analytics-events`, `TE-API-GET-api-analytics-admin-summary`, `TE-API-GET-api-analytics-admin-member-userId`, `TE-API-GET-api-analytics-member-summary`, `TE-API-POST-api-analytics-member-resume-download`

**Tables (5):** `TE-DB-analytics_events`, `TE-DB-audit_events`, `TE-DB-audit_log`, `TE-DB-field_audit_log`, `TE-DB-page_events`

**UI routes (0):** —

**Source files (7):** `TE-SRV-audit`, `TE-SRV-lib-audit`, `TE-SRV-routes-analytics`, `TE-SRV-routes-events`, `TE-SRV-routes-fieldAudit`, `TE-CMP-components-admin-AnalyticsPanel`, `TE-CMP-lib-analytics`

## MOD-21 — Content pipeline, publications & HERQ

**Endpoints (35):** `TE-API-GET-api-herq-series`, `TE-API-PUT-api-herq-series-id`, `TE-API-GET-api-herq-posts`, `TE-API-POST-api-herq-posts`, `TE-API-GET-api-herq-posts-id`, `TE-API-PUT-api-herq-posts-id`, `TE-API-DELETE-api-herq-posts-id`, `TE-API-GET-api-herq-research`, `TE-API-POST-api-herq-research`, `TE-API-PUT-api-herq-research-id`, `TE-API-GET-api-herq-items`, `TE-API-POST-api-herq-items`, `TE-API-PUT-api-herq-items-id`, `TE-API-DELETE-api-herq-items-id`, `TE-API-GET-api-herq-insights`, `TE-API-POST-api-herq-insights`, `TE-API-GET-api-herq-outputs`, `TE-API-POST-api-herq-outputs`, `TE-API-PUT-api-herq-outputs-id`, `TE-API-GET-api-publication-pipelines-agent-hub`, `TE-API-GET-api-publication-pipelines-items`, `TE-API-GET-api-publication-pipelines-schedule`, `TE-API-POST-api-publication-pipelines-schedule`, `TE-API-GET-api-content-attachments`, `TE-API-POST-api-content-attachments`, `TE-API-GET-api-content-attachments-id-download`, `TE-API-DELETE-api-content-attachments-id`, `TE-API-GET-api-content-publications`, `TE-API-GET-api-content-publications-dashboard`, `TE-API-POST-api-content-publications`, `TE-API-GET-api-content-publications-id`, `TE-API-PUT-api-content-publications-id`, `TE-API-DELETE-api-content-publications-id`, `TE-API-GET-api-content-publications-id-interactions`, `TE-API-POST-api-content-publications-id-interactions`

**Tables (8):** `TE-DB-content_attachments`, `TE-DB-content_interactions`, `TE-DB-content_publications`, `TE-DB-herq_comment_insights`, `TE-DB-herq_research_inputs`, `TE-DB-herq_series_versions`, `TE-DB-unified_content_items`, `TE-DB-unified_outputs`

**UI routes (0):** —

**Source files (18):** `TE-SRV-lib-contentAttachmentRetention`, `TE-SRV-lib-publicationFlowEnvelopes`, `TE-SRV-lib-websiteIntelligence-pageInventory`, `TE-SRV-lib-websiteIntelligence-sourceAdapters`, `TE-SRV-routes-contentAttachments`, `TE-SRV-routes-contentPublications`, `TE-SRV-routes-herq`, `TE-SRV-routes-publicationPipelines`, `TE-CMP-components-admin-ContentItemsPanel`, `TE-CMP-components-admin-ContentManagerShell`, `TE-CMP-components-admin-HerqOutputConfigurator`, `TE-CMP-components-admin-HerqPanel`, `TE-CMP-components-admin-PublicationsCalendar`, `TE-CMP-components-admin-PublicationsDashboard`, `TE-CMP-components-admin-PublicationsPanel`, `TE-CMP-components-admin-WebsiteIntelligencePanel`, `TE-CMP-lib-hooks-usePublicationPipeline`, `TE-CMP-lib-websiteIntelligence`

## MOD-22 — Network Relationship Management (NRM)

**Endpoints (10):** `TE-API-GET-api-nrm-contacts`, `TE-API-POST-api-nrm-contacts`, `TE-API-GET-api-nrm-contacts-id`, `TE-API-PUT-api-nrm-contacts-id`, `TE-API-DELETE-api-nrm-contacts-id`, `TE-API-GET-api-nrm-reference-requests`, `TE-API-POST-api-nrm-reference-requests`, `TE-API-PUT-api-nrm-reference-requests-id-status`, `TE-API-GET-api-nrm-marketplace-search`, `TE-API-GET-api-nrm-opted-in-members`

**Tables (4):** `TE-DB-network_requests`, `TE-DB-nrm_contact_groups`, `TE-DB-nrm_contacts`, `TE-DB-nrm_reference_requests`

**UI routes (0):** —

**Source files (2):** `TE-SRV-routes-nrm`, `TE-CMP-components-admin-NrmPanel`

## MOD-23 — FinBridgeCo & accounting

**Endpoints (5):** `TE-API-GET-api-finbridgeco-configs`, `TE-API-POST-api-finbridgeco-configs`, `TE-API-PUT-api-finbridgeco-configs-id`, `TE-API-DELETE-api-finbridgeco-configs-id`, `TE-API-GET-api-finbridgeco-status`

**Tables (6):** `TE-DB-accounting_policies`, `TE-DB-accounting_topology_definitions`, `TE-DB-finbridgeco_configs`, `TE-DB-gl_accounts`, `TE-DB-journal_entries`, `TE-DB-journal_entry_lines`

**UI routes (0):** —

**Source files (2):** `TE-SRV-routes-finbridgeco`, `TE-CMP-components-admin-FinBridgeCoPanel`

## MOD-24 — Metric intelligence

**Endpoints (7):** `TE-API-GET-api-metric-intelligence-metrics`, `TE-API-POST-api-metric-intelligence-registry-sync`, `TE-API-GET-api-metric-intelligence-observations`, `TE-API-POST-api-metric-intelligence-pricing-usage-charge`, `TE-API-POST-api-metric-intelligence-changes-classify`, `TE-API-GET-api-metric-intelligence-metrics-arr-demo`, `TE-API-POST-api-metric-intelligence-calculate`

**Tables (3):** `TE-DB-metric_calculations`, `TE-DB-metric_definitions`, `TE-DB-metric_observations`

**UI routes (0):** —

**Source files (3):** `TE-SRV-lib-metricIntelligence`, `TE-SRV-routes-metricIntelligence`, `TE-CMP-components-admin-MetricIntelligencePanel`

## MOD-25 — Global standards

**Endpoints (7):** `TE-API-GET-api-standards`, `TE-API-GET-api-standards-id`, `TE-API-POST-api-standards`, `TE-API-PUT-api-standards-id`, `TE-API-DELETE-api-standards-id`, `TE-API-POST-api-standards-id-publish`, `TE-API-GET-api-standards-public-list`

**Tables (3):** `TE-DB-global_standards`, `TE-DB-pending_standards`, `TE-DB-standard_overrides`

**UI routes (0):** —

**Source files (2):** `TE-SRV-routes-globalStandards`, `TE-CMP-components-admin-GlobalStandardsPanel`

## MOD-26 — Proposal experience, Lonetree MVP & business-definition experience

**Endpoints (40):** `TE-API-GET-api-lonetree-mvp-prospect-package`, `TE-API-GET-api-lonetree-mvp-complete-proposal-package`, `TE-API-GET-api-lonetree-mvp-prospect-html`, `TE-API-GET-api-lonetree-mvp-proposal-config`, `TE-API-GET-api-lonetree-mvp-admin-prospects`, `TE-API-GET-api-lonetree-mvp-admin-prospects-userId-proposal-config`, `TE-API-PUT-api-lonetree-mvp-admin-prospects-userId-proposal-config-draft`, `TE-API-POST-api-lonetree-mvp-admin-prospects-userId-proposal-config-publish`, `TE-API-GET-api-lonetree-mvp-summary`, `TE-API-GET-api-lonetree-mvp-reconciliation`, `TE-API-GET-api-lonetree-mvp-fund-economics`, `TE-API-GET-api-lonetree-mvp-signals`, `TE-API-GET-api-lonetree-mvp-hypotheses`, `TE-API-GET-api-lonetree-mvp-theses`, `TE-API-GET-api-lonetree-mvp-value-creation`, `TE-API-PATCH-api-lonetree-mvp-value-creation-initiativeId-advance`, `TE-API-GET-api-lonetree-mvp-trace-ev-drivers`, `TE-API-GET-api-lonetree-mvp-demonstration`, `TE-API-GET-api-lonetree-mvp-trace-metric`, `TE-API-GET-api-proposal-experience-state`, `TE-API-GET-api-proposal-experience-versions`, `TE-API-GET-api-proposal-experience-admin-userId-versions`, `TE-API-GET-api-proposal-experience-feedback`, `TE-API-POST-api-proposal-experience-feedback`, `TE-API-POST-api-proposal-experience-feedback-publish`, `TE-API-POST-api-proposal-experience-admin-userId-versions`, `TE-API-POST-api-proposal-experience-admin-userId-compile`, `TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-deliver`, `TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-approve`, `TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-contract`, `TE-API-GET-api-proposal-experience-highways`, `TE-API-GET-api-proposal-experience-sections`, `TE-API-GET-api-proposal-experience-diagnostic`, `TE-API-GET-api-proposal-experience-opportunity`, `TE-API-GET-api-proposal-experience-evidence`, `TE-API-POST-api-proposal-experience-events-stage-viewed`, `TE-API-POST-api-proposal-experience-events-scenario-expanded`, `TE-API-POST-api-proposal-experience-events-evidence-opened`, `TE-API-GET-api-proposal-experience-document`, `TE-API-POST-api-proposal-experience-decision`

**Tables (7):** `TE-DB-proposal_approval_actions`, `TE-DB-proposal_collaborators`, `TE-DB-proposal_contracts`, `TE-DB-proposal_delivery_emails`, `TE-DB-proposal_feedback_entries`, `TE-DB-proposal_feedback_reminders`, `TE-DB-proposal_versions`

**UI routes (0):** —

**Source files (20):** `TE-SRV-lib-lonetreeDemoRegistry`, `TE-SRV-lib-lonetreeReconciliation`, `TE-SRV-lib-proposalDocumentProjection`, `TE-SRV-lib-proposalExperienceRegistry`, `TE-SRV-lib-proposalOperations`, `TE-SRV-routes-lonetreeMvp`, `TE-SRV-routes-proposalExperience`, `TE-SRV-scripts-addMemberWorkEmail`, `TE-SRV-scripts-convertBreckGolden`, `TE-SRV-scripts-provisionBreckRevenueJourney`, `TE-SRV-scripts-seedLoneTreeDemo`, `TE-SRV-scripts-seedLonetreeMvpFund`, `TE-SRV-scripts-seedProductResourcePages`, `TE-SRV-scripts-seedProposalExperience`, `TE-SRV-scripts-seedScenarioLibrary`, `TE-SRV-scripts-setBreckTempPassword`, `TE-CMP-components-BusinessDefinitionExperience`, `TE-CMP-components-admin-LonetreeMvpPanel`, `TE-CMP-components-admin-ProposalExperiencePanel`, `TE-CMP-data-businessDefinitionExperienceConfig`

## MOD-27 — Legal & notice pages

**Endpoints (0):** —

**Tables (0):** —

**UI routes (3):** `TE-UIR-data-notice`, `TE-UIR-privacy`, `TE-UIR-terms`

**Source files (3):** `TE-CMP-components-DataNotice`, `TE-CMP-components-PrivacyPolicy`, `TE-CMP-components-TermsOfService`
