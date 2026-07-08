# Salt Basin Net Works Platform — Functional-to-Technical Mapping

**Version:** 1.0 · **Date:** 2026-07-03

**Companion documents:** [FUNCTIONAL_DESIGN_SPEC.md](FUNCTIONAL_DESIGN_SPEC.md) · [TECHNICAL_DESIGN_SPEC.md](TECHNICAL_DESIGN_SPEC.md)

---

## How to Use This Document

Each row connects a functional capability (a business rule or user flow, numbered exactly as in the Functional Design Spec) to the concrete technical artifacts that implement it: routes, tables, components, and libraries, all cited with the same names used in the Technical Design Spec. Use this document to answer "where does this behavior live in the code?" or, in reverse, "what user-facing behavior does this route/table exist to support?"

Section numbers below (§4.x) match the Functional Design Spec's subsystem numbering exactly.

---

## §4.1 Core CMS & Draft/Publish

| Functional Item | Technical Implementation |
|---|---|
| R1 — draft/published pair for every site & config | `site_state`/`config_state` (`id ∈ {draft,published}`), `member_sites`/`member_configs` (composite PK `(user_id,kind)`) — Technical §2.1 |
| R2 — publish copies draft → published atomically (app-level) | `POST /api/site/publish`, `POST /api/member-site/publish` — Technical §2.2 |
| R3 — page/section status (live/draft/soon) | `section.status` / `page.status` fields inside the `site_state.data` JSON blob; enforced in `publicView()` and in `RenderSection`'s `StatusBanner` — Technical §2.1, §2.5 |
| R4 — public API never leaks draft content | `publicView(site)` server-side filter in `server/routes/site.js`; `GET /api/site/published`, `GET /api/member-site/by-slug/:slug` — Technical §2.2, §2.5 |
| R5 — unique page slugs | Client-side check in `AdminShell.jsx` `addPage()`; slug derivation + collision rejection |
| R6 — always ≥1 page | `AdminShell.jsx` blocks deleting the last page (UI-level guard, no server-side enforcement) |
| R7 — field source-type metadata (`fieldMeta`) | `src/data/capabilityTags.js` (`MERGED_FIELD_DEFAULTS`, `TAG_CATEGORIES`), rendered/edited via `FieldMetaEditor` inside `EditorPane.jsx` — Technical §2.4 |
| R8 — auditable fields log before/after | `field_audit_log` table; `POST/GET /api/field-audit` (`server/routes/fieldAudit.js`); fired from `EditorPane.jsx`'s `patchField()` |
| R9 — dead links auto-hidden on public site | `isLiveHref(href, liveSlugs)` in `src/components/blocks/index.jsx` — Technical §2.3 |
| Flow: Add a Page | `AdminShell.jsx` `addPage()` → in-memory draft mutation → `PUT /api/site/draft` (or `/api/member-site/draft`) on Save |
| Flow: Add a Section | `AdminShell.jsx` `addSection()` seeding default `fields`/`fieldMeta`, `SectionTemplateModal.jsx` for the picker UI |
| Flow: Edit Content | `EditorPane.jsx` (field rendering, `FieldMetaEditor`), `ConfigPanel.jsx` for config-level fields |
| Flow: Preview/Save/Publish | `PreviewPane.jsx` (mode='preview' render), bottom `PublishBar` in `AdminShell.jsx` (dirty-state diffing via `deepEqual(savedSite, draft)`) |
| Block catalog (20 types) | `REGISTRY` map in `src/components/blocks/index.jsx` — Technical §2.3 |
| Scenario #1 (missing `pages` in body) | 400 validation in `server/routes/site.js` `PUT /draft` handler |
| Scenario #2 (publish with 0 pages) | 409 guard in `POST /api/site/publish` |
| Scenario #5 (concurrent edits, last-write-wins) | No locking mechanism by design; forensic record via `field_lineage`/`data_snapshots` (§4.10 mapping below) |
| Scenario #10 (new member auto-seeded draft) | `defaultMemberSite()` called from `GET /api/member-site/draft` when no row exists |
| Scenario #12 (admin-nav duplicate tab IDs rejected) | Validation block inside `PUT /api/config/admin-nav` in `server/routes/config.js` |

---

## §4.2 Authentication & Account Security

| Functional Item | Technical Implementation |
|---|---|
| R1 — rate-limited auth endpoints | `server/lib/rateLimit.js` (in-process Map, 10/15min/IP) applied to `/api/auth/login`, `/reset-request`, `/email-recover` — Technical §3.3 |
| R2 — no enumeration on reset/recovery | `POST /api/auth/reset-request`, `POST /api/auth/email-recover` always return `{ok:true}` regardless of match — Technical §3.2 |
| R3 — single-use, 1hr reset token; kills all sessions | `password_reset_tokens` table (`used_at`, `expires_at`); `POST /api/auth/reset-confirm` deletes `sessions WHERE user_id=?` on success — Technical §3.1, §3.2 |
| R4 — 8-char minimum password | Inline validation in `server/routes/auth.js` (`change-password`, `reset-confirm`) and `server/routes/members.js` (`signup`) |
| R5 — secondary email verification (6-digit/15min) | `user_emails` table; `POST/GET /api/members/me/emails*` — Technical §3.1, §3.2 |
| R6 — reCAPTCHA v3 gating | `server/lib/recaptcha.js`; actions `forgot_password`, `forgot_email`, `signup` — Technical §3.3 |
| R7 — 14-day session, cookie `sb_admin` | `sessions` table; `getUserFromCookie()` in `server/auth.js` — Technical §3.1, §3.3 |
| Flow: Sign Up | `POST /api/members/signup` → `createMember()` in `server/routes/members.js` → auto-slug + `member_profiles` row + auto-login |
| Flow: Log In | `POST /api/auth/login`; role-based client redirect in `src/App.jsx` (`RequireAdmin`, `MemberDashboard`) |
| Flow: Forgot Password | `POST /api/auth/reset-request` → email via `server/lib/email.js` → `ResetPasswordPage.jsx` → `POST /api/auth/reset-confirm` |
| Flow: Forgot Which Email | `POST /api/auth/email-recover` → `leads.phone → converted_user_id` lookup |
| Flow: Secondary Email Verification | `POST /api/members/me/emails`, `POST /api/members/me/emails/:id/verify`, `/resend` |
| Scenario #1 (rate limit trip) | 429 + `Retry-After` header from `server/lib/rateLimit.js` |
| Scenario #5 (reset kills 3 sessions) | `DELETE FROM sessions WHERE user_id=$1` in `reset-confirm` handler |
| Scenario #7 (can't delete primary email) | Guard clause in `DELETE /api/members/me/emails/:id` |

---

## §4.3 Identity: Personal & Org Profiles, Product Licensing

| Functional Item | Technical Implementation |
|---|---|
| R1 — auto-created personal profile | `personal_profiles` table; auto-insert in `GET /api/profiles/me/personal` handler — Technical §3.1, §3.2 |
| R2 — single owner at org creation | `org_memberships` row inserted with `role='owner'` inside `POST /api/profiles/me/orgs` |
| R3 — role-gated org management | Role check middleware in `server/routes/profiles.js` before PATCH/DELETE on `/orgs/:orgId*` |
| R4 — personal↔org linking | `personal_org_links` table; `POST/DELETE /api/profiles/me/personal/link-org/:orgId` |
| R5 — licenses scoped to user/org, soft-revoked | `product_licenses` + `data_entitlements` tables; `POST/DELETE /api/profiles/admin/licenses*` (DELETE sets `is_active=false`) |
| R6 — invite doesn't leak email existence | `POST /api/profiles/orgs/:orgId/members` always returns `{ok:true}` |
| Flow: Create an Organization | `POST /api/profiles/me/orgs` — auto-slug generation with collision loop |
| Flow: Invite a Team Member | `POST /api/profiles/orgs/:orgId/members`; role stored in `org_memberships` |
| Flow: Grant a Product License | `POST /api/profiles/admin/licenses`; visible via `GET /api/profiles/me/licenses` (filters `is_active AND expires_at > now`) |
| Scenario #1 (403 role check) | Role comparison against `owner`/`admin` before mutating endpoints |
| Scenario #4 (past-dated expiry accepted) | No validation on `expires_at`; filtering happens at read-time in `GET /me/licenses` |

---

## §4.4 OAuth & Third-Party Integrations

| Functional Item | Technical Implementation |
|---|---|
| R1 — redirect vs. server-to-server flows | `grantType: 'authorization_code' | 'client_credentials'` per provider in `server/lib/oauthProviders.js` — Technical §4.2 |
| R2 — tenant-URL-required providers | `requiresTenantUrl` flag + dynamic `authUrl`/`tokenUrl` construction in `buildAuthUrl()`/`exchangeCode()` |
| R3 — one connection per provider per user | UNIQUE `(user_id, provider)` on `member_oauth_connections`; `ON CONFLICT DO UPDATE` upsert in the callback handler |
| R4 — tokens always encrypted | `server/lib/crypto.js` AES-256-GCM; `access_token_enc`/`refresh_token_enc` columns — Technical §4.1, §4.4 |
| R5 — per-connection write toggle | `allow_write` column; `PATCH /api/oauth/connections/:provider` |
| R6 — silent refresh with graceful degradation | `getLiveToken()` internal function in `server/routes/oauth.js` — Technical §4.3 |
| R7 — disconnect is local-only | `DELETE /api/oauth/connections/:provider` — no provider-side revocation call |
| R8 — Supabase PAT fallback | `POST /api/oauth/supabase/pat`, verified against `api.supabase.com/v1/profile` |
| Flow: Connect a Standard Provider | `GET /api/oauth/:provider/connect` → `pendingStates` Map → provider redirect → `GET /api/oauth/:provider/callback` |
| Flow: Connect a Tenant-Scoped Provider | Same route, with `tenantUrl`/`accountId`/etc. as query params consumed by `buildAuthUrl()` |
| Flow: Connect a Server-to-Server Provider | Immediate `clientCredentialsToken()` call inside `/connect`, no redirect |
| Flow: Disconnect | `DELETE /api/oauth/connections/:provider` |
| Scenario #2 (double-connect race) | Mitigated (not prevented) by `ON CONFLICT (user_id,provider) DO UPDATE` — second callback wins |
| Scenario #3/4 (refresh success/failure) | `getLiveToken()`'s 60-second-buffer expiry check + refresh-or-null branch |

---

## §4.5 Member & Public Sites

| Functional Item | Technical Implementation |
|---|---|
| R1 — profile unreachable until first publish | `GET /api/member-site/by-slug/:slug` 404s if no `member_sites` row with `kind='published'` |
| R2 — public render reads published only | Same endpoint; never queries `kind='draft'` |
| R3 — Net Works showcase opt-in | `config.featured.displayOnHome` flag inside `member_configs.data`; surfaced via `GET /api/member-site/featured` |
| R4 — non-blocking page-view logging | `page_events` table insert inside `by-slug` handler (fire-and-forget, no client-visible failure) |
| Flow: Publish and View | `AdminShell.jsx` Publish action → `PublicProfile.jsx` rendering `RenderSection(mode='public')` |
| Scenario #3 (slug collision suffix) | Slug-uniqueness loop in `createMember()` / `member_profiles` insert path |

---

## §4.6 Lead Capture & Pledge Flow

| Functional Item | Technical Implementation |
|---|---|
| R1 — merge duplicate submissions | `findActiveMatches({email,phone})` in `server/routes/leads.js`, `POST /api/leads` handler — Technical §5.2, §5.4 |
| R2 — public ID + generated password | `public_id`, `password_hash` columns on `leads`; delivered via response body + confirmation email |
| R3 — secondary contact emails | `lead_email_addresses` table; `POST/PATCH /api/leads/public/:publicId/contact-emails*` |
| R4 — idempotent pledge | `leads.pledged_at`; `POST /api/leads/public/:publicId/pledge` — **see Known Issue** (Technical §15 #1: references undefined `requireLeadAuth()`) |
| R5 — convert requires password re-entry + reCAPTCHA | `POST /api/leads/public/:publicId/convert`; bcrypt.compare against `leads.password_hash` |
| R6 — merges preserve history | `merged_into_id`, `merged_from_ids`, `prior_notes` (JSON) columns |
| R7 — submission rate limit | 5/60s/IP in-memory limiter inside `leads.js` |
| Flow: Submit a Lead Form | `POST /api/leads` |
| Flow: Revisit a Lead Record | `POST /api/leads/public/:publicId/unlock` (sets `sb_lead`, 90-day) → `GET /api/leads/public/:publicId` |
| Flow: Pledge Interest | `POST /api/leads/public/:publicId/pledge` |
| Flow: Convert to Member | `POST /api/leads/public/:publicId/convert` — creates `users` + `member_profiles`, sets `converted_user_id`, deletes `lead_sessions` row |
| Scenario #4 (merged lead → 410) | `merged_into_id IS NOT NULL` check in `GET /public/:publicId` |
| Scenario #6/7 (email collision on convert) | Dual check against `users.email` and verified `user_emails` before creating the new account |
| Scenario #10 (rate limit) | In-memory limiter in `leads.js`, distinct from the auth rate limiter in `server/lib/rateLimit.js` |

---

## §4.7 Resume & Output Documents

| Functional Item | Technical Implementation |
|---|---|
| R1 — client-side gating, not network-level | `Output.jsx` checks `GET /api/auth/me` on mount; renders `GatedPreview` vs. full content — Technical §5.4 |
| R2 — temp-access request creates/updates a lead | `POST /api/resume/temp-access` upserts into `leads` (source='resume-temp-access') and `resume_temp_access` |
| R3 — print-isolated CSS | `visibility:hidden`/`#sb-resume-print-root` + `@media print` rules in `Output.jsx` — Technical §5.4 |
| R4 — multiple named resume presets, one primary | `output_templates` table, UNIQUE partial index `(user_id,output_type) WHERE is_primary`; `MyResumePanel.jsx` |
| R5 — capture download reason | `resume_member_reasons`, `network_requests` tables; `POST /api/resume/member-reason`, `/member-download-request` |
| Flow: Visitor Requests Access | `POST /api/resume/temp-access` → email → `GET /api/resume/validate-temp/:token` |
| Flow: Member Views/Prints | Client-side print trigger + `resume_member_reasons` 24-hour-recency check via `GET /api/resume/member-reason-check` |
| Scenario #1/2 (expired/invalid token) | `GET /api/resume/validate-temp/:token` returns `{valid:false, reason}` |

---

## §4.8 Analytics

| Functional Item | Technical Implementation |
|---|---|
| R1 — every trackable action recorded | `analytics_events` table; `POST /api/analytics/events` — Technical §6.1, §6.2 |
| R2 — IP never stored raw | `ip_hash` = SHA-256(ip + `SESSION_SECRET`), 16-char prefix |
| R3 — member sees only own data | `GET /api/analytics/member/summary` scoped server-side to `req.user.id` vs. `GET /api/analytics/admin/summary` (unscoped) |
| R4 — non-blocking download-notification email | `POST /api/analytics/member/resume-download` sends email via `server/lib/email.js`, swallowing failures |
| Flow: Admin Reviews Platform Analytics | `AnalyticsPanel.jsx` (isAdmin=true) → `GET /api/analytics/admin/summary?days=` |
| Flow: Member Reviews Own Analytics | `AnalyticsPanel.jsx` (isAdmin=false) → `GET /api/analytics/member/summary?days=` |

---

## §4.9 Governance

| Functional Item | Technical Implementation |
|---|---|
| R1 — proposals never write directly to canonical set | `pending_standards` table, `review_status` gate — Technical §7.1, §7.2 |
| R2 — admin-only approve/reject | `POST /api/governance/pending/:id/approve`, `/reject` (requireAdmin) |
| R3 — escalated overrides | `standard_overrides.escalated_to_governance`; `GET /api/governance/overrides` |
| Flow: Propose a Standard | `POST /api/governance/pending` (any authenticated user) |
| Flow: Review a Proposal | `GovernancePanel.jsx` → approve/reject endpoints; approval either inserts or updates `global_standards` depending on `base_standard_id` |

---

## §4.10 Data Lineage

| Functional Item | Technical Implementation |
|---|---|
| R1 — automatic per-field capture on every save | `captureLineage()` in `server/lib/lineage.js`, invoked from `site.js`, `config.js`, `memberSite.js`, `herq.js` — Technical §8.3 |
| R2 — snapshot bundles a save event | `data_snapshots` row per save, `snapshot_hash` = SHA-256 of sorted `field_lineage.context_hash` values |
| R3 — full history per field | `GET /api/lineage/field?entity_type=&entity_id=&field_path=` |
| R4 — admin-only view | `LineagePanel.jsx`; all `/api/lineage/*` routes gated `requireAdmin` |
| Flow: Investigate a Change | `LineagePanel.jsx` entity picker (`GET /api/lineage/entities`) → waterfall (`GET /api/lineage/snapshots`) → field drill-down (`GET /api/lineage/snapshots/:id/fields`, `GET /api/lineage/field`) |

---

## §4.11 QA / Test Management

| Functional Item | Technical Implementation |
|---|---|
| R1 — scenario ↔ feature linkage, one primary | `test_scenario_features` junction, `is_primary` UNIQUE-partial-index per scenario — Technical §9.1, §9.2 |
| R2 — run logs per-step results | `test_runs` + `test_run_step_results` |
| R3 — failed step auto-creates defect | Defect-creation block inside `POST /api/qa/runs` handler in `server/routes/qa.js` — creates a `backlog_items` row (`kind='defect'`) |
| R4 — blocked step ≠ defect | Conditional in the same handler: only `result==='fail'` triggers defect creation |
| R5 — overall result priority (fail > blocked > pass) | Computation logic in `POST /api/qa/runs` |
| R6 — stale-edit rejection | `expectedUpdatedAt` optimistic-concurrency check in `PATCH /api/qa/scenarios/:id` → 409 on mismatch |
| Flow: Author a Test Scenario | `QAPanel.jsx` "+ Add Scenario" modal → `POST /api/qa/scenarios` |
| Flow: Log a Test Run | `QAPanel.jsx` "Log Test Run" modal → `POST /api/qa/runs` → response includes `createdDefects[]` |
| Scenario #3 (one fail → one defect) | Defect-creation loop keyed on `stepResults[].result==='fail'` |
| Scenario #5 (stale PATCH) | 409 response from optimistic-concurrency check |

---

## §4.12 Backlog / Requirements Management

| Functional Item | Technical Implementation |
|---|---|
| R1 — item kinds & capability grouping | `backlog_items.kind`, `capability_groups`, `parent_id` self-FK — Technical §10.1, §10.2 |
| R2 — effort/cost derivation | `hoursBetsy`/`hoursClaude` → `activitiesBetsy = CEIL(hoursBetsy×3)`, `activitiesClaude = CEIL(hoursClaude×6)`; `cost_usd_claude = hoursClaude × $115/hr`, `traditional_cost_usd = (hoursClaude+hoursBetsy) × $175/hr` — computed per-item (db.js migration backfill + reconcile-backlog-cost-fields.mjs), summed (not recomputed) in `GET /api/backlog/summary`. Rates are RATE_CONFIGS_2026 in contributionMethodology.js, corrected 2026-07-07 from the original $0.02/min and 2.5×$150/hr formulas. |
| R3 — soft delete only | `DELETE /api/backlog/items/:id` sets `status='archived'`, never a SQL DELETE |
| R4 — summary counts delivered only | `WHERE status IN ('deployed','completed')` filter inside the summary aggregation |
| R5 — daily + milestone snapshots | `build_progress_snapshots`, UNIQUE `(captured_date, capture_source)`; lazy insert in `GET /summary`, forced insert via `POST /api/backlog/snapshot` |
| Flow: Add a Backlog Item | `BacklogPanel.jsx` "+ Add Item" → `POST /api/backlog/items` |
| Flow: View Build Summary | Build-summary page → `GET /api/backlog/summary`, chart via `GET /api/backlog/snapshots` |
| Scenario #2 (seed no-op if populated) | `POST /api/backlog/seed` checks both tables are empty before inserting |

---

## §4.13 NRM (Network Relationship Manager)

| Functional Item | Technical Implementation |
|---|---|
| R1 — owner-scoped contact visibility | `WHERE owner_user_id=req.user.id` filter unless `requireAdmin` in `GET /api/nrm/contacts` — Technical §11.1, §11.2 |
| R2 — public, unauthenticated request intake | `POST /api/nrm/reference-requests` (no auth middleware) |
| R3 — directory opt-in/out | `member_profiles.opted_in_network`/`network_bio`; `GET /api/nrm/opted-in-members` |
| R4 — admin-only status advancement | `PUT /api/nrm/reference-requests/:id/status` (requireAdmin) |
| Flow: Manage Contacts | `NrmPanel.jsx` → `POST/PUT/DELETE /api/nrm/contacts*` |
| Flow: Submit/Receive Reference Request | Public intake form → `POST /api/nrm/reference-requests` → dual email notification (admin + target member) |

---

## §4.14 HERQ Content Manager

| Functional Item | Technical Implementation |
|---|---|
| R1 — 5 fixed series, post status lifecycle | `herq_series_versions` (seeded), `unified_content_items.export_status` — Technical §12.1, §12.2 |
| R2 — research/insights linkable to posts | `herq_research_inputs`, `herq_comment_insights` (array-of-ID linking, no FK) |
| R3 — outputs bundle posts, 20-version history | `unified_outputs.version_history` (JSONB array, FIFO cap 20) |
| Flow: Draft and Publish a Post | `HerqPanel.jsx` Post Tracker → `POST/PUT /api/herq/posts` |
| Flow: Build an Output | `HerqOutputConfigurator.jsx` → `POST/PUT /api/herq/outputs*` |
| Scenario #4 (version history FIFO) | Cap-and-trim logic inside `PUT /api/herq/outputs/:id` |

---

## §4.15 Services Proposal Manager

| Functional Item | Technical Implementation |
|---|---|
| R1 — draft/published + access-gated read | `unified_content_items` (`app_id='app.services'`), conditional auth check in `GET /api/services/proposals/:id` — Technical §12.2 |
| R2 — public access-request flow | `POST /api/services/proposals/:id/request-access` (public); inserts `services_proposal_access` + `leads` |
| R3 — dual email on request | `server/lib/email.js` calls inside the request-access handler |
| Flow: Draft & Publish a Proposal | `ServicesPanel.jsx` → `POST /api/services/proposals`, `POST /:id/publish` |
| Flow: Request Access | Public proposal summary view → request-access form → grant + lead + emails |
| Scenario #1 (403 without access grant) | Auth-gating branch inside `GET /api/services/proposals/:id` |

---

## §4.16 FinBridgeCo

| Functional Item | Technical Implementation |
|---|---|
| R1 — key/value config | `finbridgeco_configs` table; `GET/POST/PUT/DELETE /api/finbridgeco/configs*` — Technical §12.1, §12.2 |
| R2 — active-license summary | `GET /api/finbridgeco/status` (joins `product_licenses` filtered `product_id='finbridgeco' AND is_active`) |

---

## §4.17 AI Agents (BestyStaff Scrum Agent & Member Agent)

| Functional Item | Technical Implementation |
|---|---|
| R1 — Scrum Agent is conversation-only (no tools yet) | `POST /api/agent/chat` in `server/routes/agent.js` — direct Claude call, no tool schema — Technical §12.2 |
| R2 — Member Agent has 6 fixed tools + dynamic DB-query tools | `POST /api/members/me/agent` in `server/routes/memberAgent.js`; tool schema includes `get_site`, `get_config`, `update_section_fields`, `add_section`, `update_config_path`, `update_page`, `query_db_{id}` |
| R3 — sensitive config paths blocked from agent writes | Explicit exclusion of `integrations.memberDb.url`/`integrations.anthropicKey` from the `update_config_path` tool's writable-path validation |
| R4 — tool-call transparency & audit | Response includes `toolCalls[]`; every mutation also passes through the same audit path as manual edits |
| R5 — 8-iteration cap | Loop counter in `memberAgent.js`'s agentic loop |
| R6 — read-only external DB queries by default | Regex/keyword guard against INSERT/UPDATE/DELETE inside the dynamic `query_db_{id}` tool handler |
| Flow: Betsy Plans a Sprint | `ScrumAgentPanel.jsx` → `agent_threads`/`agent_messages` tables → `POST /api/agent/chat` |
| Flow: Member Edits via Chat | Member Dashboard chat UI → `POST /api/members/me/agent`, writing to the member's **draft** only (`member_sites` / `member_configs` `kind='draft'`) |
| Scenario #2 (8-iteration cap hit) | Hard-coded `MAX_TOOL_ITERATIONS = 8` constant in `memberAgent.js` |
| Scenario #4 (write query blocked) | Read-only enforcement regardless of the connection's own `allow_write` flag |

---

## §4.18 Global Standards Repository

| Functional Item | Technical Implementation |
|---|---|
| R1 — domain + lifecycle (draft/published/archived) | `global_standards.status` — Technical §7.1 |
| R2 — public feed shows published only | `GET /api/standards/public/list` filters `status='published'` |
| R3 — delete = archive | `DELETE /api/standards/:id` sets `status='archived'` |
| Flow: Define and Publish a Standard | `GlobalStandardsPanel.jsx` → `POST /api/standards` → `POST /api/standards/:id/publish` |

---

## §4.19 Uploads & Event Tracking

| Functional Item | Technical Implementation |
|---|---|
| R1 — image-only, 5MB cap | Multer `fileFilter` + `limits.fileSize` in `server/routes/uploads.js` — Technical §12.2 |
| R2 — random filename | `crypto.randomBytes(12).toString('hex')` + extension mapping in `uploads.js` |
| R3 — beacon never blocks the page | `POST /api/events/page-view` always returns 200; DB-write failures caught and logged only, in `server/routes/events.js` |

---

## §4.20 Additional Member Panels

| Functional Item | Technical Implementation |
|---|---|
| NetWorks admin directory | `NetWorksPanel.jsx` → `GET /api/members/admin/stats` and member listing queries |
| My Resume presets + AI tailoring | `MyResumePanel.jsx` → `output_templates` table, `POST /api/members/me/agent`-adjacent tailoring flow |
| Inbox (connections + messaging) | `InboxPanel.jsx` → `member_connections`, `member_messages` tables; `/api/members/me/connections*`, `/me/messages*` |
| Emotional Weather | `EmotionalWeatherPanel.jsx` (minimal current scope; no dedicated backend table documented) |
| Member PLM | `MemberPlmPanel.jsx` — member-scoped mirror of `BacklogPanel.jsx`, same `/api/backlog/*` routes scoped differently in the UI |

---

## §5 Cross-Cutting Rules — Where They're Enforced

| Cross-Cutting Rule | Representative Enforcement Points |
|---|---|
| Draft/publish separation | `site_state`/`config_state`/`member_sites`/`member_configs` (all `kind`-partitioned); `unified_outputs.export_status`; `global_standards.status`; `unified_content_items.export_status` |
| Email enumeration protection | `server/routes/auth.js` (`reset-request`, `email-recover`), `server/routes/profiles.js` (org member invite) |
| Non-blocking notifications | `server/lib/email.js` (Brevo-or-stub), called with swallowed try/catch from `leads.js`, `nrm.js`, `services.js`, `analytics.js` |
| Soft delete over hard delete | `backlog_items.status='archived'`, `product_licenses.is_active=false`, `global_standards.status='archived'`, `leads.merged_into_id` |
| Owner-scoped visibility | Per-route `WHERE owner_user_id=req.user.id` / `WHERE user_id=req.user.id` guards across `nrm.js`, `analytics.js`, `profiles.js`, `memberSite.js` |
| Audit-first mutation | `server/lib/audit.js` (`audit_log`), `server/audit.js` (`audit_events` for backlog/QA), `field_audit_log`, `field_lineage`/`data_snapshots` |

---

## §6 Reverse Index — Technical Artifact → Functional Section

For quick lookup when starting from code rather than from the spec:

| Technical Artifact | Functional Section |
|---|---|
| `server/routes/site.js`, `config.js`, `memberSite.js`, `memberConfig.js` | §4.1 |
| `server/auth.js`, `server/routes/auth.js` | §4.2 |
| `server/routes/profiles.js`, `members.js` (org/license portions) | §4.3 |
| `server/routes/oauth.js`, `jira.js`, `server/lib/oauthProviders.js`, `crypto.js` | §4.4 |
| `src/components/PublicProfile.jsx`, `PublicSite.jsx`, `MemberDashboard.jsx` | §4.5 |
| `server/routes/leads.js` | §4.6 |
| `server/routes/resumeAccess.js`, `outputTemplates.js`, `src/components/Output.jsx` | §4.7 |
| `server/routes/analytics.js` | §4.8 |
| `server/routes/governance.js` | §4.9 |
| `server/routes/lineage.js`, `server/lib/lineage.js` | §4.10 |
| `server/routes/qa.js` | §4.11 |
| `server/routes/backlog.js` | §4.12 |
| `server/routes/nrm.js` | §4.13 |
| `server/routes/herq.js` | §4.14 |
| `server/routes/services.js` | §4.15 |
| `server/routes/finbridgeco.js` | §4.16 |
| `server/routes/agent.js`, `memberAgent.js` | §4.17 |
| `server/routes/globalStandards.js` | §4.18 |
| `server/routes/uploads.js`, `events.js` | §4.19 |
| `src/components/admin/NetWorksPanel.jsx`, `MyResumePanel.jsx`, `InboxPanel.jsx`, `EmotionalWeatherPanel.jsx`, `MemberPlmPanel.jsx` | §4.20 |

---

## §7 Known Gaps Between Function and Implementation

These are places where the functional intent and the current technical implementation diverge — carried over from the Technical Design Spec's Known Issues (§15) and restated here in functional terms so they're visible to non-engineering readers:

1. **Lead pledge flow is broken as shipped.** The functional flow (§4.6, "Pledge Interest") describes a working idempotent pledge action; the route backing it (`POST /api/leads/public/:publicId/pledge`) calls an undefined helper function and will error at runtime. This needs a one-line fix before the flow can be considered functional.
2. **Two Services routes are under-permissioned.** `GET /api/services/leads` and `DELETE /api/services/proposals/:id` should require admin but currently only require login, meaning any member could view all sales leads or delete any proposal.
3. **Jira credentials aren't encrypted at rest**, unlike every other third-party credential on the platform.
4. **No spend guardrail on AI agent usage** — a single member or admin could, in principle, drive unbounded Claude API cost through repeated chat calls.
