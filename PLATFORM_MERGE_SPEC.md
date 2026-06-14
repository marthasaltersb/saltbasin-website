# SALT BASIN NET WORKS — UNIFIED PLATFORM MERGE SPECIFICATION
## v1.0 · June 2026 · Canonical Build Reference

> **Purpose:** This document is the authoritative specification for migrating the existing Salt Basin Net Works platform to a unified foundational architecture that absorbs the HERQ Configurable Output Platform, defines all application-specific models, and adds all new applications specified by Betsy Salter. It supersedes all prior session artifacts, JSON specs, and partial specs wherever they conflict. Every future build session must read this document first.

---

## TABLE OF CONTENTS

1. [Architecture Decision Log — What Must Not Change](#1-architecture-decision-log)
2. [Unified Foundational Layer — Data Model Migration](#2-unified-foundational-layer)
3. [Tech Stack Resolution — SB Wins](#3-tech-stack-resolution)
4. [Brand System — Two Modes, Zero Blending](#4-brand-system)
5. [Global Standards Repository](#5-global-standards-repository)
6. [Governance Layer](#6-governance-layer)
7. [Unified Object Model — Mapped to SB Patterns](#7-unified-object-model)
8. [Database Schema — New Tables & Migrations](#8-database-schema)
9. [Application Map — All Applications](#9-application-map)
10. [App: HERQ Content Manager](#10-app-herq-content-manager)
11. [App: Services Proposal Manager](#11-app-services-proposal-manager)
12. [App: Global Standard Content Manager](#12-app-global-standard-content-manager)
13. [App: Network Relationship Manager (NRM)](#13-app-network-relationship-manager)
14. [App: Customer Relationship Manager (CRM)](#14-app-customer-relationship-manager)
15. [App: Platform Lifecycle Management](#15-app-platform-lifecycle-management)
16. [App: FinBridgeCo Manager (Placeholder)](#16-app-finbridgeco-manager)
17. [App: Resume Output Generator (Enhanced)](#17-app-resume-output-generator)
18. [App: Platform Analytics Hub](#18-app-platform-analytics-hub)
19. [Member Network — Website Profile & Resume Package](#19-member-network)
20. [Organization Accounts](#20-organization-accounts)
21. [Content Manager Shell — Admin Sub-Application Router](#21-content-manager-shell)
22. [Public Site — Resources Page](#22-public-site-resources-page)
23. [Email Notification System](#23-email-notification-system)
24. [SVG Asset Library Integration](#24-svg-asset-library-integration)
25. [Atomic Component System — Application-Specific Models](#25-atomic-component-system)
26. [Route Map — All Routes](#26-route-map)
27. [Admin Shell — Updated Tab Registry](#27-admin-shell-updated-tab-registry)
28. [Build Sequence — Phases](#28-build-sequence)
29. [What Is Undefined](#29-what-is-undefined)

---

## 1. ARCHITECTURE DECISION LOG

These decisions are LOCKED. Inherited from HERQ session (ADR-001–007) and confirmed against existing Salt Basin constraints.

| ADR | Decision | Source |
|-----|----------|--------|
| ADR-001 | Global Standards Repository is the single source of truth for domains, capabilities, systems, audiences, data slices, labels | HERQ |
| ADR-002 | Application-specific labels are applied via mapping — the standard definition never changes | HERQ |
| ADR-003 | Atomic design system: Atoms → Molecules → Organisms → Templates | HERQ |
| ADR-004 | User overrides create Pending Standard status — they do not become standards automatically | HERQ |
| ADR-005 | A Published Output must exist before a Pending Standard can be reviewed for merge | HERQ |
| ADR-006 | Unified Object Model — all applications share the same underlying object primitives | HERQ |
| ADR-007 | Global Standards Visualizer is a standalone application within the platform | HERQ |
| ADR-008 | Salt Basin tech stack (React + Vite + Express + PostgreSQL) is preserved. HERQ spec assumed Next.js greenfield — that decision is overridden here. All HERQ architecture maps into the existing SB stack. | SB+HERQ merge |
| ADR-009 | Draft/publish content model (existing SB pattern) IS the implementation of HERQ's exportStatus lifecycle (draft → preview → published → archived). These are the same concept under two names. | SB+HERQ merge |
| ADR-010 | SB's existing BacklogPanel + QA system IS the implementation of app.platformLifecycle (PLM-001–009). Enhance, do not rebuild. | SB+HERQ merge |
| ADR-011 | HERQ Content Manager lives entirely within the SB admin layer as a sub-application under Content Manager. It is not a separate deployment. | This spec |
| ADR-012 | The Network Relationship Manager (NRM) replaces and extends NetWorksPanel. It is the SB-admin and member equivalent of what external users would call a CRM. The Customer Relationship Manager (CRM) is a separate application available to org-admin members and SB admin. | This spec |
| ADR-013 | HERQ branding (Salter Momentum™ / Mode 2) is applied ONLY to the HERQ Content Manager sub-application. All other applications use Salt Basin Strategic Operator branding (Mode 1) plus their own application-specific atomic model. | This spec |
| ADR-014 | BestyStaff name is fixed. Never rename it. | HERQ |
| ADR-015 | Zero.Post is a framework reference document, never a content post. | HERQ |
| ADR-016 | All downloads, page visits, clicks, and near-downloads are tracked in the Platform Analytics Hub. Members and Betsy receive daily email digests of their traffic. | This spec |

---

## 2. UNIFIED FOUNDATIONAL LAYER

### What Changes Underneath Salt Basin

The existing SB architecture has three content layers (site sections/blocks, config, member sites). The HERQ Unified Object Model requires a **fourth foundational layer** that sits beneath all of these: the **Global Standards Repository + Unified Object Model**.

The migration does NOT touch existing SB tables or break existing functionality. It adds a new infrastructure layer that new applications reference.

### Layer Stack (bottom-up)

```
┌─────────────────────────────────────────────────────────────────┐
│  layer.analytics          — event tracking, digest generation   │
├─────────────────────────────────────────────────────────────────┤
│  layer.platformLifecycle  — backlog, releases, versions         │
│  (existing BacklogPanel + QA — enhanced, not replaced)          │
├─────────────────────────────────────────────────────────────────┤
│  layer.outputConfigurator — build, preview, publish             │
│  (existing EditorPane + PreviewPane — extended for new apps)    │
├─────────────────────────────────────────────────────────────────┤
│  layer.atomicRepository   — atoms/molecules/organisms           │
│  (existing blocks/index.jsx + new app-specific block registries) │
├─────────────────────────────────────────────────────────────────┤
│  layer.applicationMappings — app-specific label maps            │
│  (new: platform_applications + app_object_label_maps tables)    │
├─────────────────────────────────────────────────────────────────┤
│  layer.unifiedObjectModel — shared object primitives            │
│  (new: unified_content_items + unified_outputs tables)          │
├─────────────────────────────────────────────────────────────────┤
│  layer.globalStandards    — single source of truth              │
│  (new: global_standards + pending_standards tables)             │
└─────────────────────────────────────────────────────────────────┘
```

### Mapping HERQ Objects → SB Patterns

| HERQ Concept | Existing SB Equivalent | Migration Action |
|---|---|---|
| `unifiedContentItem` | Site section `{ id, type, content }` | Add `unified_content_items` table; site sections remain for public site rendering; new apps use unified items |
| `unifiedOutput` | Published site state JSON | Add `unified_outputs` table; existing publish flow is one instance of this pattern |
| `exportStatus: draft→preview→published→archived` | SB `kind: 'draft'|'published'` | Extend with `preview` and `archived` status where applicable |
| `atomicSet` | `blocks/index.jsx` REGISTRY | Each app gets its own block registry module; REGISTRY remains the SB public-site registry |
| `globalStandards` | `capabilityTags.js` (180+ tags) | Migrate capabilityTags into `global_standards` table; JS file becomes a read-only seed reference |
| `governance / pendingStandard` | None (new) | New tables: `pending_standards`, `standard_overrides` |
| `app.platformLifecycle` | BacklogPanel + QA | Same thing — add PLM-specific output generators |
| `seriesVersion` | None | New: `herq_series_versions` table |
| `post` | None | New: `herq_posts` table (implements `unifiedContentItem`) |
| `commentInsight` | `lead_messages` (partial analog) | New: `herq_comment_insights` table |
| `researchInput` | None | New: `herq_research_inputs` table |
| `emotionalWeather` | None | New: `emotional_weather_states` table (Phase 2+) |

---

## 3. TECH STACK RESOLUTION

**SB stack is canonical. No migration.**

| Layer | Technology | Decision |
|-------|-----------|----------|
| Frontend | React 19 + React Router 7, Vite 6 | Keep — all HERQ components port to JSX |
| Backend | Express.js | Keep |
| Database | PostgreSQL 15+ (Supabase) via `postgres` npm | Keep |
| Auth | bcryptjs + cookie sessions (`sb_admin`) | Keep |
| AI | Anthropic Claude SDK | Keep + extend for content generation |
| Email | Brevo | Keep + add daily digest capability |
| CSS | CSS custom properties under `--sb-*` prefix | Extend with `--herq-*` tokens for HERQ brand mode |
| Styling | Inline style objects (adminStyles.js pattern) | Keep + add herqStyles.js for HERQ mode |
| No TypeScript | JS/JSX throughout | Keep — no TS migration |
| No tests | Verify skill + manual QA | Keep |

**What HERQ spec assumed but SB overrides:**
- Next.js App Router → React Router 7 (routes defined in App.jsx)
- TypeScript → plain JS/JSX
- Neo4j graph model → PostgreSQL with relational joins + JSONB
- Monorepo packages/ structure → single repo, modular by `src/apps/` folder

---

## 4. BRAND SYSTEM

### Mode 1 — Strategic Operator (Salt Basin)

Applied to: saltbasin.net public site, all admin panels, member dashboards, HandoverOS, BestyStaff, CRM, NRM, Services Proposal Manager, Global Standard Content Manager, FinBridgeCo Manager, Analytics Hub, Resume Generator.

```css
/* Existing SB CSS variables — preserved exactly */
--sb-navy:   #1B2A3B;   /* background */
--sb-cream:  #F5F0E8;   /* primary text */
--sb-gold:   #C4843A;   /* accent / headlines */
--sb-teal:   #4A7C8E;   /* secondary */

/* Typography */
--font-display: 'Cormorant Garamond', serif;
--font-sub:     'Jost', sans-serif;
--font-body:    'DM Sans', sans-serif;
```

### Mode 2 — Salter Momentum™ / HERQ

Applied to: HERQ Content Manager sub-application ONLY.

```css
/* Add to index.css under [data-brand-mode="herq"] selector */
--herq-bg:       #F5F0E8;
--herq-text:     #1A1A1A;
--herq-accent:   #E8407A;   /* Hot Pink */
--herq-teal:     #4A7C8E;
--herq-pink:     #FF6B9D;
--herq-yellow:   #FFE08A;
--herq-purple:   #C7B7FF;
--herq-mint:     #CDEEDC;
--herq-sky:      #BDE4FF;
--herq-orange:   #FFD6A5;
```

**Implementation:** HERQ Content Manager component sets `data-brand-mode="herq"` on its root wrapper. All other admin panels remain in the default (Strategic Operator) mode. Never allow these to bleed.

---

## 5. GLOBAL STANDARDS REPOSITORY

### What It Is

The single source of truth for all vocabulary shared across every application. No application maintains its own domain list, capability list, or audience list.

### Migration from capabilityTags.js

The existing `src/data/capabilityTags.js` (180+ tags) is the seed data for the Global Standards Repository. It does not go away — it remains as the bootstrap seed. At runtime, the `global_standards` table is authoritative.

### Standard Types (13 total)

```
domain · capability · industry · audience · system
techStackComponent · dataSlice · userGroup · status
label · metric · outputType · releaseType
```

### New DB Tables

```sql
CREATE TABLE global_standards (
  id          TEXT PRIMARY KEY,          -- e.g. domain.revenue-operations
  type        TEXT NOT NULL,             -- domain | capability | audience | ...
  slug        TEXT NOT NULL,
  display_name TEXT NOT NULL,
  short_label  TEXT,
  description  TEXT,
  parent_id    TEXT REFERENCES global_standards(id),
  status       TEXT DEFAULT 'active',    -- active | deprecated | pending
  metadata     JSONB DEFAULT '{}',       -- metricCode, colorToken, model refs, etc.
  created_at   BIGINT,
  updated_at   BIGINT
);

CREATE TABLE pending_standards (
  id              TEXT PRIMARY KEY,
  proposed_value  TEXT NOT NULL,
  standard_type   TEXT NOT NULL,
  app_id          TEXT,
  context_ref_id  TEXT,   -- ID of the object where override was made
  proposed_by_user_id INTEGER REFERENCES users(id),
  status          TEXT DEFAULT 'pending',  -- pending | approved | rejected
  review_notes    TEXT,
  published_output_id TEXT,   -- GOV-005: must have a published output before review
  created_at      BIGINT,
  reviewed_at     BIGINT,
  reviewed_by_user_id INTEGER REFERENCES users(id)
);

CREATE TABLE standard_overrides (
  id             TEXT PRIMARY KEY,
  standard_id    TEXT REFERENCES global_standards(id),
  override_value TEXT NOT NULL,
  app_id         TEXT,
  context_ref_id TEXT,
  user_id        INTEGER REFERENCES users(id),
  pending_standard_id TEXT REFERENCES pending_standards(id),
  created_at     BIGINT
);
```

### Seeding

Seed script migrates `capabilityTags.js` entries into `global_standards` at first boot. Each existing tag becomes a standard with `type = 'capability'` or `type = 'metric'`, preserving `metricCode`, `model`, and `colorToken` in the `metadata` JSONB column.

---

## 6. GOVERNANCE LAYER

Implements HERQ GOV-001 through GOV-010, mapped to the existing SB draft/publish pattern.

### Governance Flow

```
Global Standard
    ↓
User Override (permitted — GOV-001)
    ↓
Pending Standard created automatically (GOV-003)
    ↓
Draft/Preview output built with local override (GOV-008)
    ↓
User publishes output (GOV-007 trigger)
    ↓
Review process available to Betsy (SB admin)
    ↓
Approved → Merged into global_standards table
Rejected → Local override remains, pending_standard closed
```

### Preview vs. Published (ADR-005 / GOV-006 / GOV-007)

| Export Type | Governance Event |
|-------------|-----------------|
| Preview | No merge review triggered. Overrides remain local. |
| Published | Merge review eligible for any Pending Standards linked to this output. |
| Archived | Locked. No changes. |

This maps to the existing SB `kind: 'draft' | 'published'` pattern. Preview is a new third state to add for applicable apps (HERQ content, services proposals, global standards content).

---

## 7. UNIFIED OBJECT MODEL

Maps HERQ's abstract objects to concrete SB database rows and React components.

### Core Objects

#### `platform_applications` (new table)
```sql
CREATE TABLE platform_applications (
  id              TEXT PRIMARY KEY,   -- app.herq | app.nrm | app.crm | app.finbridgeco | ...
  display_name    TEXT NOT NULL,
  slug            TEXT NOT NULL,
  purpose         TEXT,
  brand_mode      TEXT DEFAULT 'strategic',  -- strategic | herq
  admin_only      BOOLEAN DEFAULT false,
  object_label_map JSONB DEFAULT '{}',
  atomic_set_id   TEXT,
  status          TEXT DEFAULT 'active',
  created_at      BIGINT
);
```

#### `unified_content_items` (new table)

The shared content primitive. HERQ posts, services proposals, global standard definitions, and other cross-app content all instantiate this object.

```sql
CREATE TABLE unified_content_items (
  id              TEXT PRIMARY KEY,
  app_id          TEXT NOT NULL,
  type            TEXT NOT NULL,      -- post | proposal | definition | standard-entry | ...
  title           TEXT NOT NULL,
  topic           TEXT,
  summary         TEXT,
  body            JSONB,              -- structured body; varies by type
  domain_refs     TEXT[],             -- global_standards IDs
  capability_refs TEXT[],
  audience_refs   TEXT[],
  system_refs     TEXT[],
  data_slice_refs TEXT[],
  source_refs     JSONB,
  export_status   TEXT DEFAULT 'draft',  -- draft | preview | published | archived
  export_status_updated_at BIGINT,
  series_ref      TEXT,               -- for HERQ posts: herq_series_versions.id
  output_refs     TEXT[],
  created_by      INTEGER REFERENCES users(id),
  updated_by      INTEGER REFERENCES users(id),
  created_at      BIGINT,
  updated_at      BIGINT,
  metadata        JSONB DEFAULT '{}'
);
```

#### `unified_outputs` (new table)

A configured, publishable output. Can be a HERQ one-pager, a services proposal PDF, a resume package, a global standard explainer, etc.

```sql
CREATE TABLE unified_outputs (
  id              TEXT PRIMARY KEY,
  app_id          TEXT NOT NULL,
  template_ref    TEXT,
  title           TEXT NOT NULL,
  purpose         TEXT,
  source_item_ids TEXT[],             -- unified_content_items references
  config          JSONB DEFAULT '{}', -- template configuration snapshot
  export_status   TEXT DEFAULT 'draft',
  published_link  TEXT,
  published_at    BIGINT,
  created_by      INTEGER REFERENCES users(id),
  updated_at      BIGINT,
  version_history JSONB DEFAULT '[]'  -- array of config snapshots
);
```

### Application Object Label Map

The same unified object carries different labels per application. This is implemented as the `object_label_map` JSONB in `platform_applications`.

| Unified Object | app.herq | app.nrm | app.crm | app.services | app.globalStandards | app.finbridgeco |
|---|---|---|---|---|---|---|
| `unifiedContentItem` | HERQ Post | Contact Record | Lead/Opportunity | Service Proposal | Standard Definition | Product Config |
| `series` | HERQ Series | Contact Group | Pipeline Stage | Proposal Category | Standard Category | Module |
| `audience` | Target Audience | Network Segment | Prospect Type | Client Type | Stakeholder Group | User Persona |
| `domain` | Problem Domain | Relationship Domain | Revenue Domain | Service Domain | Domain | Financial Domain |
| `capability` | Capability | Relationship Capability | Sales Capability | Service Capability | Capability | Product Capability |
| `output` | HERQ Output | NRM Report | CRM Report | Proposal PDF | Standards Explainer | Config Report |
| `template` | HERQ Template | Contact Template | Deal Template | Proposal Template | Standards Model | Product Template |

---

## 8. DATABASE SCHEMA — NEW TABLES & MIGRATIONS

All new columns use `ADD COLUMN IF NOT EXISTS` in `db.js bootstrap()`. New tables added to the bootstrap sequence.

### New Tables (full list)

```
platform_applications
global_standards
pending_standards
standard_overrides
unified_content_items
unified_outputs
herq_series_versions
herq_posts                  (extends unified_content_items for HERQ-specific fields)
herq_research_inputs
herq_comment_insights
herq_zero_post_refs
nrm_contacts
nrm_contact_groups
nrm_reference_requests
nrm_reference_request_notes
crm_leads                   (extends/replaces existing leads table — see migration note)
crm_organizations_leads     (lead-to-org association)
services_proposals
services_proposal_access
analytics_events            (replaces/extends page_events — see migration note)
analytics_daily_digests
finbridgeco_configs
content_manager_config      (admin config for sub-applications under Content Manager)
```

### Migration Notes

**`leads` table → `crm_leads`**
The existing `leads` table stays as-is (backward compatible). New CRM functionality uses `crm_leads` which adds: `org_id`, `pipeline_stage`, `owner_user_id`, `source_app_id`, `type` (inbound | outbound | referral), and full audit trail. Existing lead capture forms continue writing to `leads`; the CRM view reads from both via a unified view.

**`page_events` table → `analytics_events`**
Existing `page_events` stays. New `analytics_events` table adds: `app_id`, `member_user_id`, `event_type` (visit | click | download | near-download | form-submit | resume-view | pdf-preview | pdf-download), `object_type`, `object_id`, `session_id`, `ip_hash`, `user_agent_hash`, `referrer_domain`. The analytics hub reads from both tables.

**`member_oauth_connections` → migrate to `oauth_connections`**
Tracked as a follow-up (CLAUDE.md already notes this). Not blocking merge spec.

### Schema for Key New Tables

```sql
-- HERQ Series Versions
CREATE TABLE herq_series_versions (
  id                    TEXT PRIMARY KEY,   -- series.base | series.hazard | ...
  acronym               TEXT DEFAULT 'HERQ',
  series_title          TEXT NOT NULL,
  classification_type   TEXT,               -- baseFramework | acronymVariation
  definition            TEXT,
  default_color_token   TEXT,
  status                TEXT DEFAULT 'active',
  target_audience_refs  TEXT[],
  zero_post_eligible    BOOLEAN DEFAULT true,
  created_at            BIGINT,
  updated_at            BIGINT
);

-- NRM Contacts
CREATE TABLE nrm_contacts (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),  -- if they are a member
  first_name      TEXT,
  last_name       TEXT,
  email           TEXT,
  org_name        TEXT,
  role_title      TEXT,
  relationship_type TEXT,   -- member | prospect | reference | partner | lead
  opted_in        BOOLEAN DEFAULT false,
  contact_group_ids TEXT[],
  domain_refs     TEXT[],
  notes           TEXT,
  last_contacted_at BIGINT,
  created_at      BIGINT,
  updated_at      BIGINT,
  owner_user_id   INTEGER REFERENCES users(id)
);

-- NRM Reference Requests
CREATE TABLE nrm_reference_requests (
  id              TEXT PRIMARY KEY,
  requester_name  TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_org   TEXT,
  target_member_user_id INTEGER REFERENCES users(id),
  context         TEXT,
  status          TEXT DEFAULT 'new',  -- new | acknowledged | fulfilled | declined
  created_at      BIGINT,
  updated_at      BIGINT
);

-- Services Proposal Access (lead-gated)
CREATE TABLE services_proposal_access (
  id              TEXT PRIMARY KEY,
  proposal_id     TEXT REFERENCES unified_content_items(id),
  user_id         INTEGER REFERENCES users(id),  -- null if org member lead
  org_name        TEXT,
  request_context TEXT,
  lead_id         TEXT,                          -- crm_leads reference
  granted         BOOLEAN DEFAULT true,          -- auto-grant initially
  granted_at      BIGINT,
  created_at      BIGINT
);

-- Analytics Events
CREATE TABLE analytics_events (
  id              BIGSERIAL PRIMARY KEY,
  event_type      TEXT NOT NULL,   -- visit | click | download | near-download | form-submit | resume-view | pdf-preview | pdf-download
  app_id          TEXT,
  object_type     TEXT,            -- page | resume | proposal | post | output
  object_id       TEXT,
  member_user_id  INTEGER REFERENCES users(id),   -- whose content was viewed
  visitor_user_id INTEGER REFERENCES users(id),   -- null if anonymous
  session_id      TEXT,
  ip_hash         TEXT,
  referrer_domain TEXT,
  metadata        JSONB DEFAULT '{}',
  occurred_at     BIGINT NOT NULL
);

-- FinBridgeCo Config (placeholder)
CREATE TABLE finbridgeco_configs (
  id              TEXT PRIMARY KEY,
  config_key      TEXT NOT NULL,
  config_value    JSONB NOT NULL,
  description     TEXT,
  updated_by      INTEGER REFERENCES users(id),
  updated_at      BIGINT
);
```

---

## 9. APPLICATION MAP — ALL APPLICATIONS

| App ID | Display Name | Shell Location | Users | Brand Mode | Status |
|--------|-------------|----------------|-------|------------|--------|
| `app.herq` | HERQ Content Manager | Admin → Content Manager → HERQ | SB admin only | HERQ (Mode 2) | Build Phase 1 |
| `app.services` | Services Proposal Manager | Admin → Content Manager → Services | SB admin publish; org-admin view | Strategic Operator | Build Phase 1 |
| `app.globalStandards` | Global Standard Content Manager | Admin → Content Manager → Standards | SB admin only | Strategic Operator | Build Phase 2 |
| `app.nrm` | Network Relationship Manager | Admin → NRM; Member → NRM (read) | SB admin full; members read | Strategic Operator | Build Phase 1 |
| `app.crm` | Customer Relationship Manager | Admin → CRM; Org-admin → CRM | SB admin + org-admin | Strategic Operator | Build Phase 2 |
| `app.plm` | Platform Lifecycle Management | Admin → Backlog/QA (existing) | SB admin manage; members read | Strategic Operator | Existing + enhance |
| `app.finbridgeco` | FinBridgeCo Manager | Admin → FinBridgeCo | SB admin only | Strategic Operator | Build Phase 2 (placeholder) |
| `app.resume` | Resume Output Generator | Admin → My Resume; Member → My Resume | All users | Strategic Operator | Existing + enhance |
| `app.analytics` | Platform Analytics Hub | Admin → Analytics; Member → Analytics | All users (own data) | Strategic Operator | Build Phase 1 |
| `app.memberSite` | Member Website CMS | Admin shell (member scope) | All members | Strategic Operator | Existing |
| `app.publicSite` | Salt Basin Public Site CMS | Admin shell (admin scope) | SB admin only | Strategic Operator | Existing |

---

## 10. APP: HERQ CONTENT MANAGER

### Shell Location

Admin → Content Manager (tab) → HERQ (sub-tab)

This is the ONLY application that uses HERQ/Salter Momentum™ branding (Mode 2). Its root container renders with `data-brand-mode="herq"`.

### Sub-Panels

1. **Framework Panel** — Zero.Post pinned reference card (not a content post); HERQ mission/definition; framework metadata editor
2. **Series Panel** — 5 series versions (seeded); series status, color token, audience assignments; link to posts per series
3. **Post Tracker** — All HERQ posts as a filterable knowledge repository; filter hierarchy: Audience → Industry → Domain → Capability → Series → Topic → Question → Status → Comments; columns: Post Sequence · Series · Topic · Question · Target Audience · Domain · Capability · Status · Release Date · Published Link · Comments/Insights
4. **Post Editor** — Create/edit individual posts; all HERQ post fields from the spec; draft/preview/publish lifecycle with governance gates
5. **Research Library** — Research inputs linked to posts; verification status tracking
6. **Comment Insights** — Comment and market observations linked to posts/series
7. **Output Builder** — Produce HERQ one-pager outputs from post data; templates: HERQFramework · HERQSeriesTracker · HERQSeriesPostOnePager; export status: draft → preview → published
8. **Visual Library** — SVG asset browser (95 v4 assets); semantic tag filtering; caption/label/legend editor per asset; render mode selector (icon | legend | table | process)

### HERQ-Specific Rules

- HERQ-003/004: Zero.Post pinned separately; never in post tracker list
- HERQ-005: Post editor enforces `referencesZeroPost: true` on every new post
- HERQ-002: Posts can belong to multiple series simultaneously
- GOV-006: Preview outputs do NOT trigger pending standard merge review
- GOV-007: Published outputs DO trigger pending standard merge review

### Data Objects

```
herq_series_versions → seeded with 5 series
herq_posts → implements unified_content_items
herq_research_inputs
herq_comment_insights
herq_zero_post_refs → single record
unified_outputs (app_id = 'app.herq')
```

### Route

```
/admin → Content Manager tab → HERQ sub-tab
/output/herq/:outputId  → published HERQ one-pager (public-facing output)
/resources/herq/:slug   → published post page on saltbasin.net
```

---

## 11. APP: SERVICES PROPOSAL MANAGER

### Shell Location

Admin → Content Manager (tab) → Services (sub-tab)

### Purpose

Configure and publish service proposal outputs. Organization admin members can view published proposals. Non-org members submit an access request to view (providing org name), which creates a lead record and auto-grants access initially.

### Access Model

```
SB Admin → full create/edit/publish access
Org Admin Members → view published proposals (gated by org membership)
Network Members (non-org) → submit request to view
  → provides org name
  → system creates lead record in crm_leads (type: 'org-lead')
  → system creates organization_profiles record if org not found
  → access auto-granted immediately (change this rule later)
  → services_proposal_access record created
Anonymous → request to view form shown; redirected to member signup if not member
```

### Sub-Panels

1. **Proposal List** — all service proposals with export status filter
2. **Proposal Editor** — rich content editor with section blocks; maps to unified_content_items; Salt Basin branding; configurable template
3. **Proposal Output** — rendered output preview + publish to `/services/:slug`
4. **Access Manager** — list of who has access to each proposal; org-name and lead context visible

### Proposal Content Model

Maps `unifiedContentItem` with:
- `type: 'proposal'`
- `app_id: 'app.services'`
- `body` JSONB contains: engagement overview, scope, outcomes, investment, timeline, appendix sections
- `audience_refs` from global_standards
- `domain_refs` from global_standards

### Routes

```
/admin → Content Manager → Services
/services/:slug → published proposal (org-gated, request-access gate for non-org members)
/api/services/proposals
/api/services/proposals/:id/request-access
```

### Email Triggers

- Betsy receives email on every access request submission (includes requester name, email, org name)
- System auto-grants access and sends confirmation email to requester

---

## 12. APP: GLOBAL STANDARD CONTENT MANAGER

### Shell Location

Admin → Content Manager (tab) → Standards (sub-tab)

### Purpose

Author and publish global standard content: lead-to-cash domain definitions, process flow definitions, governance definitions, architecture perspectives, and other thought leadership. Published under `/resources` on saltbasin.net.

### Sub-Panels

1. **Standards Library** — browse/filter global_standards table; view usage across apps
2. **Content Editor** — create unified_content_items of type `definition | process-flow | governance | architecture-perspective`; Salt Basin Strategic Operator branding
3. **Pending Standards Queue** — review override proposals generated anywhere in the platform (GOV-004)
4. **Published Resources** — all published content mapped to `/resources/standards/:slug`

### Object Label Map (app.globalStandards)

| Unified Object | Label |
|---|---|
| `unifiedContentItem` | Standard Definition |
| `series` | Standard Category |
| `output` | Standards Explainer |

### Routes

```
/admin → Content Manager → Standards
/resources/standards/:slug   → published definition page
/resources → master resources index (HERQ + Standards + future)
/api/global-standards/content
/api/global-standards/pending-review
```

---

## 13. APP: NETWORK RELATIONSHIP MANAGER (NRM)

### Shell Location

SB Admin → NRM tab
Member Dashboard → NRM tab (read + own records)

### Purpose

The NRM is Betsy's professional relationship tracking layer. It is the SB equivalent of what external users call a CRM — but for managing the member network, reference requests, contacts, and eventually company and member-to-member relationships.

Any reference requests submitted via the public site or member public profiles flow into the NRM. Any members who have opted-in to network visibility appear in the SB admin NRM view.

### Sub-Panels (SB Admin View)

1. **Network Map** — all NRM contacts; filter by type (member | prospect | reference | partner | lead); domain and capability filters from global_standards
2. **Reference Requests** — intake queue for all reference requests submitted via public forms; status tracking (new → acknowledged → fulfilled | declined); email notification on every new submission
3. **Contact Record** — full profile per contact; linked member user if applicable; org affiliation; domain/capability tags; notes; interaction history
4. **Member Network** — all members with opted-in visibility; link to their public profile; capability and domain tags visible
5. **Relationship Actions** — future: define explicit relationship types between contacts/members/orgs

### Sub-Panels (Member View — Read + Own)

1. **My Network** — contacts the member has added (scoped to their account)
2. **My Reference Requests** — requests submitted for the member; status tracking
3. **Opted-in Members** — directory of other members who have opted in to network visibility (read-only)

### Data Objects

```
nrm_contacts (owner_user_id scoping: admin sees all, member sees own)
nrm_reference_requests (target_member_user_id for member-scoped view)
nrm_contact_groups
```

### Routes

```
/admin → NRM tab
/member → NRM tab
/api/nrm/contacts
/api/nrm/reference-requests
/api/nrm/contacts/:id
```

### Email Triggers

- Betsy receives email for every reference request intake form submission
- Member receives email when a reference request targeting them is submitted

---

## 14. APP: CUSTOMER RELATIONSHIP MANAGER (CRM)

### Shell Location

SB Admin → CRM tab
Member Dashboard (Org Admin only) → CRM tab

### Purpose

Full CRM for managing organizational relationships. Available to SB admin as a platform-wide view, and to org-admin members scoped to their organization. Leads from the services proposal access requests flow directly into the CRM.

### Sub-Panels

1. **Pipeline** — visual pipeline board by stage; drag leads between stages
2. **Leads** — full list of crm_leads; filter by source, org, stage, owner
3. **Organizations** — organization_profiles with associated leads and contacts
4. **Lead Record** — contact info, org, source, interactions, notes, access permissions granted
5. **Reports** — pipeline summary, source attribution, domain breakdowns

### Lead Sources That Feed CRM

- Services proposal access requests → `type: 'org-lead'`
- Public site lead capture forms → `type: 'inbound'`
- Member reference requests → `type: 'referral'` (when applicable)
- Manual entry

### Routes

```
/admin → CRM tab
/member → CRM tab (org-admin only; gated by org_memberships role = 'admin')
/api/crm/leads
/api/crm/organizations
/api/crm/pipeline
```

---

## 15. APP: PLATFORM LIFECYCLE MANAGEMENT

### Shell Location

Admin → Backlog tab (existing — enhanced)
Admin → QA tab (existing — enhanced)
Member Dashboard → Platform tab (read-only view)

### What Already Exists

The existing BacklogPanel, BacklogDrawer, and QAPanel are the implementation of PLM-001 through PLM-009. They are not rebuilt. These enhancements are added:

### Enhancements

1. **PLM Read View for Members** — members see a curated read-only dashboard showing: current version/build number, total capabilities delivered, active backlog summary, recent release notes, roadmap overview. This is the platform lifecycle management output visible to all members (as specified by user). No edit access.
2. **Release Output Generator** — produces a formatted release summary document (unified_output) from backlog items tagged to a deployment; appends comparison notes to prior release.
3. **Full Picture Output** — generates a to-date platform architecture + backlog + deployments + stats aggregation as a unified_output. Refreshed on each release.
4. **Version History Panel** — timeline view of all build_progress_snapshots with comparison notes between releases.

### Member Route

```
/member → Platform tab → read-only PLM summary view
/api/member/plm/summary
/api/member/plm/releases
```

---

## 16. APP: FINBRIDGECO MANAGER (PLACEHOLDER)

### Shell Location

Admin → FinBridgeCo tab

### Purpose

Placeholder admin configuration layer for the FinBridgeCo product. Betsy will iterate on this to define application-specific features, use cases, and context object model. The handoveros spec file (which references FinBridgeCo context objects and functionalities) is the seed reference for what this becomes.

### Phase 1 Deliverable (Placeholder)

A single admin panel with:
1. **Config Panel** — reads/writes `finbridgeco_configs` table as key-value config entries; admin can add/edit/delete config keys
2. **Module Definitions** — freeform text area per module (seeded from handoveros spec file content: product context, use cases, capabilities)
3. **Status Overview** — shows `product_licenses` entries for `product_id = 'finbridgeco'`; count of licensed orgs/users
4. **Notes / Backlog Link** — free text spec notes area linked to backlog items tagged `finbridgeco`

### Application-Specific Object Model (from handoveros spec)

The FinBridgeCo application-specific atomic model will be defined in `src/apps/finbridgeco/` and map the following unified objects:

| Unified Object | FinBridgeCo Label |
|---|---|
| `unifiedContentItem` | Product Config |
| `series` | Module |
| `audience` | User Persona |
| `domain` | Financial Domain |
| `capability` | Product Capability |
| `output` | Config Report |

Full model definition deferred to Betsy's iteration sessions on this panel.

### Routes

```
/admin → FinBridgeCo tab
/api/admin/finbridgeco/configs
/api/admin/finbridgeco/modules
```

---

## 17. APP: RESUME OUTPUT GENERATOR (ENHANCED)

### What Already Exists

`MyResumePanel.jsx` (admin + member scope), `Output.jsx` (`/output/resume/:slug`), existing resume blocks in `blocks/index.jsx`.

### Enhancements Required

#### 1. "View Resume PDF" Button on Career Timeline

The public-facing `/u/:slug` profile page's career timeline (ResumeBlock) must display a "View Resume PDF" button. This opens the resume PDF preview at `/output/resume/:slug`.

**Access rules for the PDF preview:**
- Anyone can view the preview on the page (no gate)
- The **Download** button inside the preview IS gated:
  - User must be logged in as a member
  - If not a member: show signup prompt
  - If a member: show a reason-for-download modal (free text field: "Why are you downloading this resume?")
  - Reason is saved in `analytics_events` with `event_type: 'pdf-download'` and the reason text in `metadata`

#### 2. Download Tracking

All resume-related events tracked in `analytics_events`:
- `resume-view` — someone views the /u/:slug profile page (career timeline section visible)
- `pdf-preview` — someone opens the PDF preview
- `near-download` — someone clicks Download but abandons (doesn't complete reason modal)
- `pdf-download` — successful download with reason captured
- `form-submit` — any contact or reference form submitted from a member's profile

#### 3. PDF Output Page

The `/output/resume/:slug` page uses existing print-isolation pattern (`visibility: hidden` on body, `visibility: visible` on root). Add:
- "View Resume PDF" button in the career timeline public view linking here
- Download button (gated as above)
- Reason capture modal (member-only)

### Routes

```
/u/:slug                   → public profile (existing; add View Resume PDF button)
/output/resume/:slug       → resume PDF preview (existing; add download gate + reason modal)
/api/member/resume/download-request   → records reason + triggers download
```

---

## 18. APP: PLATFORM ANALYTICS HUB

### Shell Location

Admin → Analytics tab
Member Dashboard → Analytics tab (scoped to their content)

### Purpose

Central hub for all platform tracking events. Every visit, click, download, near-download, form submission, and page view is tracked. Betsy and each member receive daily email digests of their traffic.

### Event Types Tracked

| Event Type | Trigger |
|---|---|
| `visit` | Any page visit (public site, member profile, output page) |
| `click` | Any CTA or link click tracked in public pages |
| `resume-view` | Career timeline section visible on member profile |
| `pdf-preview` | Resume PDF preview page opened |
| `near-download` | Download button clicked, reason modal opened but abandoned |
| `pdf-download` | Download completed with reason captured |
| `form-submit` | Any intake form submitted (contact, reference request, lead capture, proposal access) |
| `proposal-view` | Services proposal page viewed |
| `resource-view` | Resources page article viewed |
| `member-signup` | New member account created |

### Admin Analytics Sub-Panels

1. **Platform Overview** — total events by type across all members; daily/weekly/monthly trend charts
2. **Member Traffic** — per-member event breakdown; top visited profiles; most downloaded resumes
3. **Content Performance** — HERQ posts, proposals, and resources ranked by views
4. **Lead Attribution** — which pages/events produced lead records
5. **Download Log** — full log of all pdf-downloads with reasons; searchable

### Member Analytics Sub-Panels

1. **My Profile Traffic** — visits to /u/:slug over time
2. **My Resume Downloads** — who downloaded, when, and their stated reason (member sees reason; not personal data of downloader)
3. **My Form Submissions** — contact and reference request forms submitted to them
4. **My Content Views** — if member has published content (proposals view, etc.)

### Daily Digest Email

Sent daily to Betsy AND to each member (if they have had any events in the past 24 hours):

```
Subject: [Salt Basin] Your daily traffic — {date}

Summary for {name}:
- Profile visits: {n}
- Resume views: {n}
- PDF previews: {n}
- Downloads: {n}
- Form submissions: {n}

[View full analytics dashboard]
```

Digest generation: Brevo scheduled send via a nightly cron job or Render scheduled task. Fallback: stdout log if Brevo key absent.

### Routes

```
/admin → Analytics tab
/member → Analytics tab
/api/analytics/events         → POST (ingest events from frontend)
/api/analytics/admin/summary
/api/analytics/admin/member/:userId
/api/admin/analytics/digest-preview
/api/member/analytics/summary
```

### Frontend Event Tracking

All events fired via `src/lib/analytics.js` (new file):
```js
track(eventType, { objectType, objectId, metadata })
// → POST /api/analytics/events
// → automatically includes session_id, referrer
```

---

## 19. MEMBER NETWORK — WEBSITE PROFILE & RESUME PACKAGE

### What Already Exists

Members have full draft/publish control of their `/u/:slug` public profile site, including all section blocks. `MyResumePanel` exists for resume building. Templates exist in `memberTemplates.js`.

### Enhancements

1. **Resume PDF package** — "View Resume PDF" button on career timeline (see §17)
2. **Download gate + reason capture** — (see §17)
3. **Opted-in Network Visibility** — members can toggle a setting to appear in the NRM network directory. Toggle in member config panel. Writes to `member_profiles.opted_in_network = true`.
4. **Reference Request Block** — already exists (`ReferencesRequestBlock`). Wire to `nrm_reference_requests` table. Betsy receives email on every submission. Member receives email when a request for them is received.
5. **Analytics tab** — in member dashboard (see §18)
6. **PLM read view tab** — in member dashboard (see §15)

---

## 20. ORGANIZATION ACCOUNTS

### Setup Flow

```
1. User must have a personal member account (personal_profiles row)
2. Member navigates to: Member Dashboard → Profile → Organizations → "Create Organization"
3. Fills in: org name, type (LLC | Corp | Partnership | Sole Prop), industry, description
4. System creates: organization_profiles row + org_memberships row (role = 'admin')
5. Optional: link personal profile to org via personal_org_links (for self-employed)
6. Org profile published when admin publishes it
```

### Org Admin Capabilities

- Full org profile editor (same draft/publish model as member site)
- CRM access (scoped to their org's leads)
- View published services proposals (org-admin access auto-granted)
- Ability to invite other members to their org (via org_memberships)

### Future Capabilities (not in scope now)

- Org public profile page (`/org/:slug`)
- Product application modules gated by `product_licenses` scoped to org
- Company-to-company relationships in NRM

---

## 21. CONTENT MANAGER SHELL — ADMIN SUB-APPLICATION ROUTER

### Shell Architecture

Content Manager is a new top-level admin tab that hosts three sub-applications. It renders a sub-tab navigation bar and delegates rendering to the active sub-app.

```
Admin Shell
└── Content Manager tab (componentId: 'contentManager')
    ├── HERQ sub-tab (HerqContentManagerPanel)   [brand-mode="herq"]
    ├── Services sub-tab (ServicesProposalPanel) [brand-mode="strategic"]
    └── Standards sub-tab (GlobalStandardsPanel) [brand-mode="strategic"]
```

### Implementation

New component: `src/components/admin/ContentManagerShell.jsx`

- Reads sub-tab state from URL hash or local state
- Passes `appId` prop to each sub-panel
- HERQ sub-panel wraps its content in `<div data-brand-mode="herq">`
- Other sub-panels render normally in Strategic Operator mode

### Admin Nav Seed Update

Add to `db.js` bootstrap admin_nav seed:

```json
{
  "id": "content-manager",
  "label": "Content Manager",
  "componentId": "contentManager",
  "icon": "layers",
  "adminOnly": true
}
```

---

## 22. PUBLIC SITE — RESOURCES PAGE

### New Public Route: `/resources`

A public-facing page on saltbasin.net under the existing public site CMS structure. This is NOT authenticated. It aggregates published content from:
1. HERQ posts (`unified_content_items` where `app_id = 'app.herq'` and `export_status = 'published'`)
2. Global Standard definitions (`unified_content_items` where `app_id = 'app.globalStandards'` and `export_status = 'published'`)

### Structure

```
/resources                    → index: HERQ section + Standards section
/resources/herq/:slug         → individual HERQ post (Salter Momentum™ brand mode)
/resources/standards/:slug    → individual standard definition (Strategic Operator mode)
```

### Block in Public Site State

Add a `resources` page to the default site state JSON with a new block type: `ResourcesIndexBlock`. This block renders two tabbed sections: HERQ Content | Standards Library. Each pulls from published unified_content_items.

### Services Page Link

The existing services page (`/services`) links to published service proposals at `/services/:slug` with the proposal access gate in place.

---

## 23. EMAIL NOTIFICATION SYSTEM

### Betsy Receives Emails For

| Trigger | Subject |
|---------|---------|
| Any intake form submission (contact, lead, reference request, proposal access) | [Salt Basin] New [form type] from [name] |
| Daily traffic digest | [Salt Basin] Your daily traffic — {date} |
| New member signup | [Salt Basin] New member: [name] |
| Services proposal access request | [Salt Basin] Proposal access request — [org name] |

### Each Member Receives Emails For

| Trigger | Subject |
|---------|---------|
| Reference request submitted for them | [Salt Basin] Reference request from [requester] |
| Daily traffic digest (if events > 0) | [Salt Basin] Your daily traffic — {date} |

### Email Templates

All sent via Brevo. Uses existing `server/lib/email.js` pattern. Add template IDs per email type. Fallback to stdout stub if `BREVO_API_KEY` absent.

### Daily Digest Cron

Implemented as a Render scheduled task or a server-side cron on the Express server. Runs nightly at 6:00 AM ET. Queries `analytics_events` for last 24 hours grouped by `member_user_id`. Sends digest to each member with events. Always sends to Betsy (even if no events).

---

## 24. SVG ASSET LIBRARY INTEGRATION

### Where SVGs Live

```
public/svg/herq/v4/          → 95 configurable SVG files (from HERQ_SVG_Asset_Library_v4_Configurable.zip)
```

Copy all 95 v4 SVG files from the zip into `public/svg/herq/v4/`. These are served as static assets.

### Component Pattern

New component: `src/apps/herq/components/HerqSvg.jsx`

```jsx
// Each SVG is an inline SVG component, not an <img> tag (ADR from HERQ spec)
// Props:
// id: string (one of 95 asset IDs)
// size: number
// caption: string (optional)
// legendLabel: string (REQUIRED)
// legendDescription: string (optional)
// renderMode: 'icon' | 'legend' | 'table' | 'process'
// domainRefs: string[]
// capabilityRefs: string[]
// audienceRefs: string[]
```

SVG files are imported dynamically or bundled per asset. The HERQ Visual Library panel in the HERQ Content Manager provides a browser for all 95 assets with filter by category and semantic tags.

### SVG Asset Registry

Seeded into `global_standards` table with `type = 'svg-asset'` and metadata including category, render modes, semantic tag defaults. This enables cross-app asset referencing (SVG-005).

---

## 25. ATOMIC COMPONENT SYSTEM — APPLICATION-SPECIFIC MODELS

### Existing Pattern

`src/components/blocks/index.jsx` — master REGISTRY of 30+ block types for the SB public site.

### Extension Pattern

Each application gets its own block module. The master REGISTRY remains for the public site. App-specific registries are imported only within their admin panels.

```
src/apps/
├── herq/
│   ├── components/
│   │   ├── HerqSvg.jsx
│   │   ├── HerqPostTracker.jsx
│   │   ├── HerqSeriesPanel.jsx
│   │   ├── HerqFrameworkPanel.jsx
│   │   ├── HerqOutputBuilder.jsx
│   │   └── HerqVisualLibrary.jsx
│   └── blocks/
│       └── index.jsx         → HERQ-specific atomic components (atoms/molecules/organisms)
├── nrm/
│   └── components/
│       ├── NrmContactList.jsx
│       ├── NrmContactRecord.jsx
│       └── NrmReferenceQueue.jsx
├── crm/
│   └── components/
│       ├── CrmPipeline.jsx
│       ├── CrmLeadRecord.jsx
│       └── CrmOrgView.jsx
├── services/
│   └── components/
│       ├── ServiceProposalList.jsx
│       ├── ServiceProposalEditor.jsx
│       └── ServiceProposalAccess.jsx
├── finbridgeco/
│   └── components/
│       ├── FinBridgeCoConfigPanel.jsx
│       ├── FinBridgeCoModules.jsx
│       └── FinBridgeCoStatus.jsx
└── analytics/
    └── components/
        ├── AnalyticsOverview.jsx
        ├── MemberTrafficPanel.jsx
        └── ContentPerformancePanel.jsx
```

### HERQ Atomic Set (atomicSet.herq)

Implements HERQ ADR-003 within JSX. Build in order:

**Atoms:** `HerqIcon` (SVG wrapper) · `HerqWeatherBadge` · `HerqStatusChip` · `HerqSeriesTag` · `HerqAudienceTag` · `HerqDomainTag` · `HerqLegendLabel` · `HerqCaption`

**Molecules:** `HerqLegendItem` · `HerqIconTile` · `HerqLinkCard` · `HerqSeriesCard` · `HerqPostRow` · `HerqFilterChip`

**Organisms:** `HerqSeriesPanel` · `HerqPostTracker` · `HerqFrameworkPanel` · `HerqVisualLibrary` · `HerqOutputPreview`

**Templates:** `HerqOnePager` · `HerqSeriesTracker` · `HerqFrameworkOutput`

---

## 26. ROUTE MAP — ALL ROUTES

### Public Routes (no auth)

```
/                          → landing / public home
/u/:slug                   → member public profile (add View Resume PDF button)
/output/resume/:slug       → resume PDF (preview free; download gated)
/output/herq/:outputId     → published HERQ one-pager
/resources                 → resources index
/resources/herq/:slug      → published HERQ post
/resources/standards/:slug → published standard definition
/services                  → services page (existing; links to proposals)
/services/:slug            → services proposal (org-gated or request-access)
/signup                    → member signup
/reset-password            → password reset
```

### Admin Routes (SB admin only)

```
/admin                     → admin shell (scope=admin)
/admin#content-manager     → content manager tab
/admin#nrm                 → network relationship manager
/admin#crm                 → customer relationship manager
/admin#analytics           → analytics hub
/admin#backlog             → platform lifecycle management (existing)
/admin#qa                  → QA panel (existing)
/admin#finbridgeco         → FinBridgeCo manager
/admin#networks            → existing NetWorksPanel (migrate to NRM over time)
/admin#leads               → existing leads (feeds CRM)
/admin#my-resume           → resume builder
/admin#profile             → profile hub (existing)
```

### Member Routes

```
/member                    → member dashboard
/member#site               → my website CMS
/member#resume             → my resume builder
/member#nrm                → my network (contacts + reference requests)
/member#analytics          → my analytics
/member#platform           → platform lifecycle read view
/member#profile            → my profile hub
```

### API Routes (new)

```
POST /api/analytics/events
GET  /api/analytics/admin/summary
GET  /api/analytics/admin/member/:userId
GET  /api/analytics/member/summary

GET  /api/nrm/contacts
POST /api/nrm/contacts
GET  /api/nrm/contacts/:id
PUT  /api/nrm/contacts/:id
GET  /api/nrm/reference-requests
POST /api/nrm/reference-requests
PUT  /api/nrm/reference-requests/:id/status

GET  /api/crm/leads
POST /api/crm/leads
GET  /api/crm/leads/:id
PUT  /api/crm/leads/:id
GET  /api/crm/organizations
GET  /api/crm/pipeline

GET  /api/services/proposals
POST /api/services/proposals
GET  /api/services/proposals/:id
PUT  /api/services/proposals/:id
POST /api/services/proposals/:id/publish
POST /api/services/proposals/:id/request-access

GET  /api/herq/series
GET  /api/herq/posts
POST /api/herq/posts
GET  /api/herq/posts/:id
PUT  /api/herq/posts/:id
GET  /api/herq/outputs
POST /api/herq/outputs
PUT  /api/herq/outputs/:id/publish

GET  /api/global-standards
GET  /api/global-standards/content
POST /api/global-standards/content
GET  /api/global-standards/pending-review
PUT  /api/global-standards/pending-review/:id

GET  /api/admin/finbridgeco/configs
POST /api/admin/finbridgeco/configs
PUT  /api/admin/finbridgeco/configs/:id
DELETE /api/admin/finbridgeco/configs/:id

GET  /api/member/plm/summary
GET  /api/member/plm/releases

GET  /api/member/analytics/summary
POST /api/member/resume/download-request
```

---

## 27. ADMIN SHELL — UPDATED TAB REGISTRY

Updates to `AdminShell.jsx` `TAB_COMPONENTS` registry and the `admin_nav` config seed in `db.js`.

### Updated Admin Nav (admin scope)

```json
[
  { "id": "content",        "label": "Site",             "componentId": "content",        "icon": "layout" },
  { "id": "config",         "label": "Config",           "componentId": "config",         "icon": "settings" },
  { "id": "content-manager","label": "Content Manager",  "componentId": "contentManager", "icon": "layers",   "adminOnly": true },
  { "id": "nrm",            "label": "Network",          "componentId": "nrm",            "icon": "network" },
  { "id": "crm",            "label": "CRM",              "componentId": "crm",            "icon": "briefcase","adminOnly": true },
  { "id": "analytics",      "label": "Analytics",        "componentId": "analytics",      "icon": "bar-chart" },
  { "id": "leads",          "label": "Leads",            "componentId": "leads",          "icon": "users" },
  { "id": "backlog",        "label": "Backlog",          "componentId": "backlog",        "icon": "list",     "adminOnly": true },
  { "id": "qa",             "label": "QA",               "componentId": "qa",             "icon": "check-square","adminOnly": true },
  { "id": "finbridgeco",    "label": "FinBridgeCo",      "componentId": "finbridgeco",    "icon": "bridge",   "adminOnly": true },
  { "id": "my-resume",      "label": "My Resume",        "componentId": "myResume",       "icon": "file-text" },
  { "id": "profile",        "label": "Profile",          "componentId": "profile",        "icon": "user" },
  { "id": "networks",       "label": "Net Works",        "componentId": "networks",       "icon": "globe" }
]
```

### Updated Member Nav (member scope)

```json
[
  { "id": "site",       "label": "My Site",     "componentId": "content",   "icon": "layout" },
  { "id": "my-resume",  "label": "My Resume",   "componentId": "myResume",  "icon": "file-text" },
  { "id": "nrm",        "label": "Network",     "componentId": "memberNrm", "icon": "network" },
  { "id": "analytics",  "label": "Analytics",   "componentId": "memberAnalytics","icon": "bar-chart" },
  { "id": "platform",   "label": "Platform",    "componentId": "memberPlm", "icon": "activity" },
  { "id": "profile",    "label": "Profile",     "componentId": "profile",   "icon": "user" }
]
```

---

## 28. BUILD SEQUENCE — PHASES

### Phase 1 — Foundational Layer + Core Applications

Priority: Get global standards, NRM, HERQ shell, analytics, and resume PDF working.

**1A — DB Foundation**
- Add all new tables to `db.js bootstrap()` (idempotent IF NOT EXISTS)
- Seed `platform_applications` table with all app IDs
- Migrate `capabilityTags.js` into `global_standards` table
- Seed `herq_series_versions` with 5 HERQ series
- Add `analytics_events` table

**1B — Analytics Event Tracking**
- Create `src/lib/analytics.js` (client-side track() function)
- Create `server/routes/analytics.js` (POST event ingest, GET summaries)
- Wire track() calls to: public profile visits, resume PDF page, download attempts, form submissions
- Add `analytics` tab to Admin Shell and Member Shell (basic event log for now)

**1C — Resume PDF Enhancement**
- Add "View Resume PDF" button to career timeline block (`/u/:slug` page)
- Add download gate to `/output/resume/:slug` (member auth check + reason modal)
- Wire download reason capture to `analytics_events`
- Email notification to Betsy on each download

**1D — NRM Core**
- Create `server/routes/nrm.js`
- Create `src/apps/nrm/` components
- Wire existing `ReferencesRequestBlock` form to `nrm_reference_requests` table
- Add NRM tab to Admin Shell; add read-only Member NRM tab
- Email notifications for reference requests

**1E — Content Manager Shell + HERQ Sub-Application**
- Create `ContentManagerShell.jsx` with sub-tab routing
- Add Content Manager tab to Admin Shell
- Build HERQ sub-application: Framework Panel, Series Panel, Post Tracker, Post Editor (basic), Visual Library (asset browser)
- Copy 95 v4 SVGs to `public/svg/herq/v4/`
- Build `HerqSvg.jsx` component
- Seed HERQ series data
- HERQ brand mode CSS variables

**1F — Services Proposal Manager**
- Create services proposals as `unified_content_items` with `app_id = 'app.services'`
- Services sub-tab in Content Manager Shell
- Proposal editor + preview + publish
- `/services/:slug` public route with access gate
- Request-access flow → creates lead in `crm_leads`
- Email notifications to Betsy on access requests

**1G — Resources Page**
- Add `/resources` page to public site CMS state
- `ResourcesIndexBlock` component
- Wire to published HERQ posts + published standard definitions

### Phase 2 — CRM, Global Standards, FinBridgeCo, Analytics Enhancement

**2A — CRM**
- `server/routes/crm.js`
- `src/apps/crm/` components (pipeline, lead record, org view)
- Admin CRM tab
- Org-admin member CRM access gate

**2B — Global Standard Content Manager**
- Standards sub-tab in Content Manager Shell
- Content editor for standard definitions and process flows
- Pending Standards queue UI (GOV-004 review interface)
- `/resources/standards/:slug` public route

**2C — FinBridgeCo Manager Placeholder**
- `src/apps/finbridgeco/` components
- Admin FinBridgeCo tab
- Config key-value editor, module notes, license status

**2D — Analytics Enhancement**
- Daily digest email (Brevo scheduled send or server cron)
- Admin analytics sub-panels (content performance, lead attribution, download log)
- Member analytics sub-panels (full breakdown)

**2E — PLM Member Read View**
- Read-only Platform tab in member dashboard
- PLM summary API scoped for members

**2F — Organization Accounts**
- Org creation flow in member profile
- Org profile editor
- Org admin role gating

### Phase 3 — Governance Layer + Output Configurator

**3A — Governance**
- Pending Standards creation on any override
- Review queue in Global Standards Content Manager
- GOV-005 published output prerequisite enforcement

**3B — Output Configurator**
- HERQ one-pager output builder with full template system
- Drag-and-drop section configurator
- Preview → Publish governance gates

**3C — Emotional Weather (future)**
- `emotional_weather_states` table
- Manual entry panel in admin
- Slack/Calendar integration (Phase 3+)

---

## 29. WHAT IS UNDEFINED

These areas require further specification from Betsy before building:

| Area | Status |
|------|--------|
| FinBridgeCo application-specific model | Placeholder built; full model deferred to iteration sessions |
| Emotional Weather system integrations (Slack, Calendar) | Architecture defined in HERQ spec; integrations not in scope yet |
| AI Backfill Agents | Future; architecture referenced in EW-010 |
| Graph database (Neo4j) | Referenced in HERQ spec as future; not in scope; PostgreSQL with JSONB handles Phase 1–3 |
| Org public profile page (/org/:slug) | Future; org structure exists but public page deferred |
| Company-to-company NRM relationships | Future; currently member-to-contact |
| Member-to-member direct connections | Future |
| HERQ Output Configurator (drag-and-drop) | Phase 3; basic editor in Phase 1 |
| Global Standards full domain/capability hierarchy | Seed data from capabilityTags.js; full catalog extension is ongoing |
| Services proposal auto-grant rule change | Currently auto-grant; will change per Betsy's instruction |
| Product licenses for HandoverOS feature gating | product_licenses table exists; UI gating defined; full HandoverOS UI undefined |
| BestyStaff agent UI | Referenced in architecture; not in this spec's scope |

---

## APPENDIX A — EXISTING SB FEATURES PRESERVED

All existing functionality is preserved unchanged. This spec adds only — it does not remove.

| Feature | Status |
|---------|--------|
| Public site CMS (draft/publish) | Preserved |
| All existing block types (30+) | Preserved |
| Member site CMS | Preserved |
| Member templates | Preserved |
| Login / signup / password reset | Preserved |
| OAuth connections (14 providers) | Preserved |
| Existing leads panel | Preserved (feeds new CRM) |
| Backlog + QA panels | Preserved (enhanced with PLM outputs) |
| NetWorksPanel | Preserved (NRM is additive; migrate incrementally) |
| ProfileHub | Preserved (org account creation added) |
| MyResumePanel | Preserved (enhanced with PDF gate + analytics) |
| ScrumAgentPanel | Preserved |
| BestyStaff agent | Preserved |
| Brevo email | Preserved + extended with new notification types |
| Audit log | Preserved |
| Field audit | Preserved |
| Build progress snapshots | Preserved |
| Jira integration | Preserved |

---

## APPENDIX B — FILE LOCATIONS FOR NEW CODE

```
src/apps/                          → all new application components
src/apps/herq/                     → HERQ Content Manager
src/apps/nrm/                      → Network Relationship Manager
src/apps/crm/                      → Customer Relationship Manager
src/apps/services/                 → Services Proposal Manager
src/apps/finbridgeco/              → FinBridgeCo Manager (placeholder)
src/apps/analytics/                → Analytics Hub
src/lib/analytics.js               → client-side event tracking
src/components/admin/ContentManagerShell.jsx
src/components/admin/NrmPanel.jsx
src/components/admin/CrmPanel.jsx
src/components/admin/AnalyticsPanel.jsx
src/components/admin/FinBridgeCoPanel.jsx
src/components/member/MemberNrmPanel.jsx
src/components/member/MemberAnalyticsPanel.jsx
src/components/member/MemberPlmPanel.jsx
public/svg/herq/v4/               → 95 HERQ SVG assets
server/routes/analytics.js
server/routes/nrm.js
server/routes/crm.js
server/routes/services.js
server/routes/herq.js
server/routes/globalStandards.js
server/routes/finbridgeco.js
server/data/herqSeed.js            → HERQ series + series data seed
server/data/globalStandardsSeed.js → capabilityTags.js → global_standards migration
```

---

*Specification version 1.0 — June 2026*  
*Produced by: Betsy Salter + Claude Sonnet 4.6*  
*Source material: Existing Salt Basin codebase v0.13 + HERQ session artifacts (18 phases) + HERQ_CONSOLIDATED_PACKAGE_June2026.zip*
