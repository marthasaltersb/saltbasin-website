# Salt Basin Net Works — Changelog

All significant builds, capability additions, architectural decisions, and patch notes.
Historical versions are preserved below in reverse-chronological order.

---

## [Session 9] — 2026-07-07 · Contribution Intelligence Reconciliation (v0.18.1 – v0.18.5)

### Summary
Director flagged that Build Summary's hours "could not be right" and asked for the
Contribution Intelligence Methodology to be run against real session data instead of hand
estimates. What followed was a full, multi-pass reconciliation: real JSONL burst analysis
across every backlog item, a from-scratch cost-formula fix, real Anthropic billing
classification, a redesign of how supervision hours get weighted, and a real 4-way pricing
breakdown of Betsy's contribution types — each pass surfacing and fixing the previous
pass's gaps. Full detail lives in `server/data/patchNotes.js` (v0.18.1 through v0.18.5);
this entry is the roll-up.

### What changed, in order

- **v0.18.1 — Real session-log analysis.** Built `scripts/analyze-contribution-sessions.mjs`,
  the reproducible JSONL burst-analysis tool. Corrected the 9 backlog items from v0.18
  (hand-estimated ~4× too high) against real session data.
- **v0.18.2 — Full backlog reconciliation.** Closed the remaining ~101-item gap: burst-level
  correlation (not just createdAt-in-date-range, which is misleading for sessions resumed
  across days), a search across every Claude project directory on the machine for sessions
  filed under the wrong cwd, and recovery of a session whose transcript no longer exists via
  the Claude Desktop app's own session index. Found and merged three duplicate "epic"
  backlog items along the way. `hoursTotal`: 93.4 → 32.1.
- **v0.18.3 — Cost formula + fee-type + PLM item + upsert flow.** `costUsdClaude` and
  `traditionalCostUsd` had been computed from two disconnected legacy formulas
  (`$0.02/Claude-minute`, `~$375/hr`) never tied to a documented rate. Replaced with the real
  `RATE_CONFIGS_2026` rates ($115/hr Claude, $175/hr traditional). Classified every item's
  Anthropic billing fee type (subscription vs. ad-hoc overage) against real receipts found
  via Gmail search. Credited the Codex-built PLM/EIDOS Operating Model dashboard. Fixed
  `POST /api/backlog/items` to upsert by `externalRef` instead of always inserting. **A
  migration bug crashed production for ~15 minutes during this release** — a broken foreign
  key silently aborted an entire multi-statement column migration, and a later write to one
  of the missing columns crashed the whole Node process. Fixed both the immediate cause and
  the systemic fragility (isolated every migration statement; added a process-level
  `unhandledRejection` handler).
- **v0.18.4 — Active Supervision redesign.** Director noted her hours (5.5 total) felt
  implausibly low given continuous presence during every build session. Root cause: the
  oversight-weight formula scored a whole session's *average* turn density, so long stretches
  of watching Claude execute — present, not typing every few minutes — got scored as
  low-oversight when they were full presence. Replaced with a per-burst weight (1.0 active
  back-and-forth / 0.75 steady engagement / 0.5 long watched stretch / 0 confirmed-autonomous).
  `hoursBetsy`: 5.5 → 15.3. Added a "Why the Director's Hours Aren't Interchangeable" section
  to Build Summary, pulling the real contribution-type definitions live from the methodology.
- **v0.18.5 — Strategic Direction / Domain Authoring pricing + documentation sweep.**
  Priced the two Betsy contribution types that had never been tracked with real hours, by
  classifying actual turn content within existing sessions (burst-level, not per-turn — an
  earlier per-turn-gap approach undercounted by an order of magnitude and was discarded).
  Found and fixed a second synthetic-turn contamination bug in the human-turn filter
  (auto-generated context-compaction summaries and task-notification messages were being
  counted as if typed by a human) — corrected on production. Credited a previously
  zero-hours session that produced the platform's own spec documents. Then audited every
  documentation surface for figures this whole arc should have updated but didn't: the
  client/member-facing `/output/methodology` page (still showing "28× leverage across 35.4
  active hours" to anyone who viewed it — the highest-priority fix, since it's the one
  external-facing page that had drifted), a landmine in `server/data/backlog/seed.js` that
  would have silently resurrected the old cost formula on any future re-seed, and stale
  formula references in `TECHNICAL_DESIGN_SPEC.md` / `FUNCTIONAL_TECHNICAL_MAPPING.md`.

### Current figures (as of this entry)
`hoursClaude` 27.7 · `hoursBetsy` 14.9 (Strategic Direction 5.19 / Domain Authoring 1.44 /
Active Supervision remainder 8.31) · `costUsdClaude` $3,190.10 · `traditionalCostUsd` $7,469 ·
`aiSavingsMultiple` 2.3× · real Anthropic spend to date $325 ($60 subscription + $265 ad-hoc
overage — a materially different number from the modeled $115/hr value of the hours, both
shown but easy to conflate).

### Known gaps (see `contributionMethodology.js` `knownGaps` for full detail)
Off-session Strategic Direction/Domain Authoring work (specs and decisions made entirely
outside Claude sessions) hasn't been searched for yet. The pre-2026-06-07 orphaned-session
batch has no surviving transcript, so its hours remain entirely Active Supervision by
default. A "cost basis hours" concept for Claude (value-equivalent hours distinct from
wall-clock hours) and maintenance/license cost tracking for ongoing/agent-based work were
both requested and deliberately not built — they need real design work with Betsy, not a
guessed multiplier.

---

## [Session 8] — 2026-07-06 · Home Page Restructure, Data-Driven Nav, Contribution Intelligence

### Summary
Home page reorganized into a paired-column layout (site purpose / founder / exec dashboard /
mission), the three separate Consulting pages merged into one with a per-section nav-link
toggle, and the public nav rewritten to be fully data-driven — no hardcoded nav array left
anywhere in the codebase. Dense resume-style text (career timeline, case studies) converted to
hover/tap-expandable dashboard tiles. Retroactively applied the Contribution Intelligence
Methodology (§ below) to this and the preceding four sessions of undocumented work.

### Capabilities Added / Changed

#### Home Page Restructure
- **Row 1** (`aboutIntro` section): left column now carries the "About This Site" purpose
  statement (living portfolio / source of truth / real-time output engine / build sandbox);
  right column carries "Face of the Founder" (name, photo, blurb, CTAs) plus a "How I Work"
  callout moved up from the old Professional Experience section.
- **Row 2** (`execDashboard` section, new block type): Executive Summary redesigned as a
  dashboard — large stat tiles (years of experience, industries served), narrative paragraphs,
  and achievement highlights rendered as a card grid instead of a bulleted wall of text. Paired
  with the Salt Basin Mission card (moved here from the old `aboutIntro` right column).
- Career Timeline and Case Studies added to Home directly below the dashboard row (previously
  only reachable via the now-removed "Meet the Founder" page).
- Industries Served (`industryWheel`) trimmed to just the wheel + tech-capability panel;
  the categorized-domains + niche-solutions panels split into a new `domainsNiche` block type.

#### Consulting Pages Merged
- The three separate pages (Domains & Niche Expertise, Services, Self-Service Assessments)
  collapsed into one `Consulting` page with three sections. "Meet the Founder" removed
  entirely — its content now lives on Home.
- `/output/resume`, `/output/case-study/:slug`, `/output/domains` updated to read from the Home
  page's `aboutIntro` + `execDashboard` sections instead of the removed founder page.

#### Data-Driven Public Nav (breaking change to `PublicNav.jsx`)
- Replaced the hardcoded `NAV` array with a nav built at render time from live page + section
  data: one top-level item per published page (ordered by `page.order`), with a dropdown built
  from any section flagged `navSubPage: true` on that page, anchored to `section.id`.
- New "Show as a sub-page link in the nav" checkbox + Nav Label override added to EditorPane's
  Section Settings — adding a page or flipping this toggle updates the visitor-facing nav with
  no code change required.
- Admin Pages sidebar simplified to a flat list (one row per page) — it now matches the nav
  exactly, since page-level nav grouping was retired in favor of the section-level toggle for
  the admin/platform site (member sites still use `page.navGroup` for their own nav).

#### Dashboard-Tile Text Pattern (`ExpandableTile`)
- New shared component: clamps text to 3 lines, expands to full text in a raised overlay on
  hover or tap. Applied to Career Timeline's per-job bullets and Case Studies' labeled fields
  (Problem Statement, Methods & Approach, Impact & Outcomes, etc.) so dense copy reads as a
  scannable grid rather than a paragraph wall — no underlying content was shortened or removed.

### Contribution Intelligence — Retroactive Application

Applying `server/data/contributionMethodology.js` (built in a prior session, June 2026) to this
session and the four preceding it (Sessions/versions v0.12–v0.17 + lead pledge flow + today):

| Contribution type | Contributor | Rate (2026) | Where it showed up this session |
|---|---|---|---|
| Strategic Direction | Betsy Salter | $225/hr | Deciding the Home page's final section pairing (site intro ↔ founder, dashboard ↔ mission), retiring the founder page, choosing hover-expand over click-through for dense text |
| Domain Authoring | Betsy Salter | $225/hr | The "About This Site" purpose copy, the nav-grouping mental model ("Pages should match nav exactly") |
| Active Supervision | Betsy Salter | $225/hr | Multiple rounds of correction on section placement and pairing before landing on the final layout — the exact "how AI course-corrects toward a director's intent" pattern the methodology tracks |
| Code Generation | Claude (Anthropic) | $115/hr (quality-adjusted) | Component rewrites (`AboutIntroBlock`, `ExecDashboardBlock`, `DomainsNicheBlock`, `PublicNav.jsx`), five DB migration scripts, `ExpandableTile`, Output.jsx field-merge compatibility layer |

**Honesty note on precision:** the methodology's headline metrics (active hours, turn density,
leverage multiple) require session-JSONL burst analysis, which was run once for the June 2026
platform build (`35.4 active hours, 3,880 turns, 28× leverage` — see
`server/data/contributionMethodology.js`). That analysis had not been re-run for
Sessions/versions v0.12 through this entry; the table above was a qualitative attribution by
contribution type, not a re-measured hour count.
**Update (Session 9, 2026-07-07):** this was re-run for real, and the June figures were not
just unverified but wrong — see the Session 9 entry above. Current corrected figures:
`hoursClaude` 27.7, `hoursBetsy` 14.9, `aiSavingsMultiple` 2.3× (not 28×, which conflated a
cost-savings ratio with an unverified engineer-equivalent-effort leverage claim). Do not cite
`35.4`/`3,880`/`28×` anywhere going forward.

---

## [v0.17 → v0.13] — 2026-06-11 to 2026-07-05 · Platform Merge, Resume Generator, IP Artifacts, Lead Pledge

*(Backfilled retroactively — see git log for exact commit-level detail; this range was built
across several sessions that predate this changelog being kept current.)*

- **v0.13 — Resume, Templates & Profile Depth**: resume generator groundwork, section template
  modal, field settings system + 9 new block types, sidebar scroll fixes, guided link picker
  for action buttons (site pages / anchors / output routes), My Resume tab added to admin shell.
- **v0.14 — Platform merge**: HERQ, NRM, Services, Standards, Governance, Analytics, and Lineage
  sub-apps added; resume auth gate regression fixed.
- **v0.15 — Resume generator**: 4 layout templates, agent diff view, Domains output page;
  Connections, Messaging, Job Leads, Inbox; Networks panel and section-picker scope fixes
  (admin sees admin+member pages, members see only their own).
- **v0.16 — Lead email management**, auth login fix; **v0.16.1** — CTA visibility rules, build
  metrics, deploy process documentation.
- **v0.17 — IP artifacts**: Contribution Intelligence Methodology (`contributionMethodology.js`),
  L2R (Lead-to-Revenue) model, integrations research gate; MES trademark corrected to full
  legal name; deploy crash fixed (DB migrations isolated from `sessions` column ALTERs).
- **Lead pledge flow**: "convert to member" replaced with a lower-friction pledge-interest flow.

---

## [Session 7] — 2026-06-09 · Integration Platform, Profile Hub, Data Architecture

### Summary
Largest single-session build. Added the full integration/OAuth layer, personal + organization
profile system, field source-type metadata engine, and locked down the three-layer platform
architecture (Betsy's site / member public sites / member admin).

### Capabilities Added

#### OAuth Integration Hub (14 providers)
- **Architecture**: AES-256-GCM encrypted token storage (`server/lib/crypto.js`). Tokens
  stored in `oauth_connections` table (scoped to personal or org profile), never in JSON config.
  Auto-refresh on expiry via `getLiveToken()` helper.
- **Providers added**:
  - Authorization-code flow: Microsoft (Excel/SharePoint/Dynamics), Salesforce, QuickBooks,
    LinkedIn, HubSpot, DealHub, Snowflake*, SAP*, Oracle*, Tableau*, Workday*
  - Client-credentials flow (no user redirect): Zuora, Marketo
  - Personal-access-token fallback: Supabase
  - (*) = tenant URL supplied by member at connect time
- **Routes**: `GET /api/oauth/:provider/connect` → redirect; `GET /api/oauth/:provider/callback`
  → token exchange + store; `POST /api/oauth/supabase/pat` → PAT fallback;
  `GET /api/oauth/connections` → list; `PATCH|DELETE /api/oauth/connections/:provider`
- **UI**: Connected Apps card in ConfigPanel → shows connected/available providers, write-access
  toggle per connection, Supabase PAT inline input

#### Personal + Organization Profile System
- **Schema**:
  - `personal_profiles` — 1:1 with users, auto-created at signup
  - `organization_profiles` — slug, name, org_type, industry, website
  - `org_memberships` — user↔org with roles (owner/admin/member/viewer)
  - `personal_org_links` — self-employed linking personal to LLC/org
  - `product_licenses` — grants user access to Salt Basin products (finbridgeco, handoveros)
  - `data_entitlements` — JSONB scope per license (capabilities, providers, maxRows)
  - `oauth_connections` — replaces `member_oauth_connections`, now scoped to profile
- **Routes** (`/api/profiles/`): personal profile CRUD, org CRUD, membership invite/remove/role,
  personal→org linking, license management (admin), platform-wide org/license views (admin)
- **ProfileHub UI** (`src/components/admin/ProfileHub.jsx`): new "Profiles" tab in member admin
  - Personal tab: profile card (name/bio/avatar/location/pronouns) + personal integration hub
    grouped by Social, Finance, Email & Calendar, Healthcare, AI Accounts, Freelance & Storefronts
  - Organizations tab: list/create orgs, drill into detail with Integrations/Members/Settings sub-tabs,
    invite by email, role management, org settings editor
  - Licenses tab (admin only): platform-wide license table

#### Field Source Type System
- **`src/data/capabilityTags.js`**: canonical capability tag registry (60+ tags across 8 categories)
  sourced from HandoverOS METRIC_DEFINITIONS + RevenueEngineOS domains
- **`SOURCE_TYPES`**: `user_input` | `merged` | `derived` | `direct` with color/label metadata
- **`MERGED_FIELD_DEFAULTS`**: canonical field→system-source mappings (e.g. hero.heading ← users.display_name)
- **EditorPane field badges**: every content field shows a colored source-type badge. Clicking opens
  inline `FieldMetaEditor` with type picker, merged-from path input, or multi-source derived builder
  (sourceKind, system, capability tag from registry, description). Stored in `section.fieldMeta[key]`.

#### Platform Stats, Audit Log, Member Agent
- **`page_events` table**: beacon on every public profile page load (hashed IP, member/page/referrer)
- **`audit_log` table**: actor, action, entity, summary, diff, IP hash — written on login/logout/publish/draft
- **`MemberStatsPanel`**: totals (views/leads/logins), top pages, 30-day bar chart
- **`MemberAuditPanel`**: paginated audit log, color-coded actions, load-more
- **`MemberAgentPanel`**: full chat UI with tool-call log, quick-start prompts, Shift+Enter newline
- **`/api/members/me/agent`**: agentic loop (Claude API, 8-tool-iteration cap), tools: get_site,
  get_config, update_section_fields, add_section, update_config_path, update_page,
  plus dynamic `query_db_${id}` per configured memberDbs. Write-guarded, schema-read-only.

#### Resume Generator
- **`ResumeGeneratorCard`** in ConfigPanel: From Preset or Custom Selection modes
- **`ResumeGenerateOverlay`**: full-screen preview with print-isolated CSS (`visibility: hidden` on body,
  `visibility: visible` on `#sb-resume-print-root`)

### Architectural Decisions
- **Three-layer platform model**:
  1. Betsy's site (`saltbasin.net`) — admin-only edit, top-level CMS
  2. Member public sites (`saltbasin.net/{slug}`) — member-controlled, admin can monitor + override
  3. Member admin dashboard — profile/org/integration management, data upload, product apps
- **OAuth scope binding**: connections are scoped to `profile_scope` (personal/org) + `profile_id`,
  enabling personal social/finance connections to be fully separate from org enterprise connections
- **Credential security**: raw connection URLs and OAuth tokens never stored in JSON config columns.
  All secrets go in `oauth_connections.access_token_enc` (AES-256-GCM, key from `TOKEN_ENCRYPTION_KEY` env var)
- **Legacy table preserved**: `member_oauth_connections` retained for backward compat during migration;
  new code writes to `oauth_connections`
- **Product license model**: FinBridgeCo / HandoverOS access controlled via `product_licenses` +
  `data_entitlements` — org admin decides which members see which capability scopes

### Env Vars Added (add to Render)
```
TOKEN_ENCRYPTION_KEY=<64 hex chars — see .env>
APP_BASE_URL=https://saltbasin.net

MICROSOFT_CLIENT_ID=       MICROSOFT_CLIENT_SECRET=
SALESFORCE_CLIENT_ID=      SALESFORCE_CLIENT_SECRET=
QUICKBOOKS_CLIENT_ID=      QUICKBOOKS_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=        LINKEDIN_CLIENT_SECRET=
SUPABASE_CLIENT_ID=        SUPABASE_CLIENT_SECRET=
WORKDAY_CLIENT_ID=         WORKDAY_CLIENT_SECRET=
SNOWFLAKE_CLIENT_ID=       SNOWFLAKE_CLIENT_SECRET=
TABLEAU_CLIENT_ID=         TABLEAU_CLIENT_SECRET=
ZUORA_CLIENT_ID=           ZUORA_CLIENT_SECRET=
DEALHUB_CLIENT_ID=         DEALHUB_CLIENT_SECRET=
MARKETO_CLIENT_ID=         MARKETO_CLIENT_SECRET=
HUBSPOT_CLIENT_ID=         HUBSPOT_CLIENT_SECRET=
SAP_CLIENT_ID=             SAP_CLIENT_SECRET=
ORACLE_CLIENT_ID=          ORACLE_CLIENT_SECRET=
```

### Files Changed
```
NEW  server/lib/crypto.js               AES-256-GCM encrypt/decrypt
NEW  server/lib/oauthProviders.js       14-provider OAuth config, buildAuthUrl, exchangeCode, refreshToken
NEW  server/lib/audit.js                audit() helper, hashIp()
NEW  server/routes/oauth.js             OAuth connect/callback/PAT/list/disconnect routes + getLiveToken()
NEW  server/routes/profiles.js          Personal + org profile CRUD, membership, licenses
NEW  server/routes/events.js            POST /api/events/page-view beacon
NEW  server/routes/memberAgent.js       Member AI agent loop
NEW  src/components/admin/ProfileHub.jsx  Personal/org profile UI + integration hub
NEW  src/components/admin/MemberPanels.jsx  Stats, audit, agent chat panels
NEW  src/data/capabilityTags.js         60+ capability tags, SOURCE_TYPES, MERGED_FIELD_DEFAULTS
MOD  server/db.js                       +personal_profiles, org_profiles, memberships, licenses,
                                         data_entitlements, oauth_connections, audit_log, page_events
MOD  server/index.js                    Mount oauth, profiles, events, memberAgent routers
MOD  src/components/admin/AdminShell.jsx  +Profiles tab, +agent/stats/audit panels
MOD  src/components/admin/ConfigPanel.jsx +ResumeGenerator, +ConnectedApps, +MemberDbs cards
MOD  src/components/admin/EditorPane.jsx  +FieldMetaEditor, +SourceBadge per field
MOD  src/components/blocks/index.jsx    ReferencesRequestBlock dual-mode (offer/request)
MOD  src/components/PublicProfile.jsx   Page-view beacon
MOD  server/routes/auth.js              Audit on login/logout
MOD  server/routes/memberSite.js        Audit on draft save / publish
MOD  server/routes/members.js           +/me/audit, /me/stats, /admin/audit, /admin/stats
MOD  server/lib/email.js                +reference source labels
```

### Bugs Fixed During Verification
1. `getUserFromCookie` imported from `./auth.js` → corrected to `../auth.js` in oauth.js + profiles.js
2. `requireAuth` declared `async` but all callers missing `await` → `user` was a Promise, `.id` undefined
3. Optional fields defaulted to `undefined` in INSERT/UPDATE — postgres driver rejects undefined; defaulted to `null`
4. `capabilityTags.js` — two curly-apostrophe characters in single-quoted JS strings broke Vite parser
5. EditorPane hooks (`useState`, `useMemo`) declared after early `if (!section) return` — violated rules of hooks, blank screen

---

## [Session 6] — 2026-06-08 · Nav Config, Resume Config, Multi-Email, Contact Routing

### Summary
Four member-facing features: multi-email address management with verification, nav page settings
(nav label, nav group, hide from nav), resume presets with print output, contact form routing.

### Capabilities Added
- **Multi-email**: members add work/personal/other emails with verification codes; contact form
  routes to the verified address matching the config
- **Nav config**: per-page nav label override, nav group dropdown (creates nested nav), hide-from-nav toggle
- **Resume presets**: save named resume configurations in config JSON; generate PDF-ready output
  with print CSS isolation
- **Page-level status**: Live / Draft / Soon per page, not just per section

### Files Changed
```
MOD  src/components/admin/EditorPane.jsx   Page settings panel, nav config fields
MOD  src/components/admin/ConfigPanel.jsx  Resume presets card
MOD  server/routes/members.js              +/me/emails CRUD + verify
MOD  server/lib/email.js                   Verification code emails
```

---

## [Session 5] — 2026-06-07 · Visual Blocks, Dynamic Lists, Case Studies

### Summary
New block types and dynamic list editors. RoleListEditor, DomainListEditor, CardListEditor,
CaseListEditor, StatListEditor, StepListEditor, ColListEditor, IconItemListEditor.

### Capabilities Added
- **Block types**: statGrid, process, columns, iconGrid, netWorksBanner, joinNetwork, scripture
- **Dynamic list editors**: all array-typed section fields get inline add/remove/reorder editors
  instead of flat key-value inputs
- **ReferencesRequestBlock**: dual-mode (offer a reference / request references) with tab switching,
  separate lead sources per mode, inline success state

### Architectural Decisions
- Block registry (`REGISTRY` in `blocks/index.jsx`) dispatches by `section.type`
- Array fields (`roles`, `domains`, `cards`, `cases`, `stats`, `steps`, `cols`, `items`) detected
  by key name in EditorPane, rendered with dedicated list editors
- Legacy single-string fields hidden when equivalent array is in use

---

## [Session 4] — 2026-06-07 · Autonomous Batch (Jira, QA, Build Progress)

### Summary
Autonomous session that merged three capability groups: Jira integration, QA test scenarios,
and build progress snapshots with charting.

### Capabilities Added
- **Jira**: sync backlog items to/from Jira issues; `jira_config` table; bidirectional status mapping
- **QA**: test_scenarios, test_scenario_steps, test_runs, test_run_step_results tables;
  scenario runner UI; per-step pass/fail capture
- **Build progress**: `build_progress_snapshots` table; auto-capture on publish;
  `BuildSummaryOutput` chart component with inline CSS bar charts

---

## [Session 3] — 2026-06-05 · Member Sites, Config, Agent Foundation

### Summary
Full member CMS: each member has their own draft/published site state, config JSON,
and the foundation of the profile agent.

### Capabilities Added
- **Member sites**: `member_sites` + `member_configs` tables; draft/publish per member;
  `PublicProfile.jsx` renders at `/m/:slug`
- **Section Add modal**: type dropdown with all block types (optgroups by category)
- **Config panel**: integrations card (Anthropic key, memberDbs), social config, color config
- **Member agent foundation**: scoped to member's own site/config data only

### Architectural Decisions
- Member slug derived from display_name at signup; stored in `users.member_slug`
- Config JSON path: `config.integrations`, `config.site`, `config.social`, `config.colors`
- Draft model mirrors top-level site: full JSON blob, promoted to `published_data` on publish

---

## [Session 2] — 2026-06-04 · Multi-Member, Leads, Landing Gate

### Summary
Expanded from single-admin site to multi-member platform. Added lead capture, landing gate,
and the member profile framework.

### Capabilities Added
- **Members**: member signup flow, member_profiles table, member-scoped admin
- **Leads**: lead capture forms, lead_messages, lead_emails, lead_activity tables;
  email routing via Resend
- **Landing gate**: password-protected pre-launch page; toggleable in admin
- **Detail pages**: click-through from cards to `/detail/:slug` pages

---

## [Session 1] — 2026-06-03 · Foundation

### Summary
Initial platform: Vite + React frontend, Express backend, Supabase/Postgres, cookie auth,
draft/publish model, block renderer.

### Capabilities Added
- **Auth**: bcrypt passwords, cookie sessions, admin/member roles
- **Site CMS**: `site_state` + `config_state` tables; draft/publish model;
  admin shell with sidebar page nav, section editor, preview pane
- **Block types**: hero, text, twoCol, cards, cta, contact, socialGrid, resume, domains
- **Config panel**: social links, brand colors, landing gate toggle
- **Deploy**: Render (backend) + Netlify (frontend); Supabase Postgres

### Architectural Decisions
- **Adapter pattern** for Postgres: `db.prepare(sql).get/all/run()` mimics node:sqlite API
  so query code is DB-agnostic
- **Draft/publish**: full JSON blob stored separately; publish copies draft → published;
  public site always reads published
- **Block registry**: `REGISTRY` map of `type → Component`; `RenderSection` dispatches;
  all blocks accept `{ section, config, mode, memberSlug }`
- **Vite proxy**: `/api` proxied to Express in dev; same-origin in prod

---

## Pending / Roadmap

- [ ] Data dictionary + mapping engine (centralized `member_field_registry` table, Excel upload,
      import-from-integration, visual field mapper, capability tag annotation)
- [ ] Betsy's monitoring layer: view any member's audit trail, push admin overrides to member sites
- [ ] FinBridgeCo / HandoverOS product app within member admin (license-gated)
- [ ] Merged field auto-population: auto-set `fieldMeta` for known merged defaults on profile create
- [ ] Agent system prompt update: reference capability tag vocabulary
- [ ] Charts library (deferred): pie/bar/financial charts for stats panels
- [ ] Member-initiated reference sending (planned, not built)
- [ ] OAuth provider app registration: Microsoft, Salesforce, QuickBooks, LinkedIn, HubSpot done first
      (most self-serve); Snowflake/SAP/Oracle/Workday require per-member IT setup
