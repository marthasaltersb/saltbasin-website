# Salt Basin Website Intelligence — Progress Tracker

## Phase status

| # | Phase | Status | Last run | Notes |
|---|---|---|---|---|
| 1 | Platform Inspection & Methodology Definition | done | 2026-07-16 | Main public runtime and published configuration inspected; methodology and architecture inventory created. Member-site `/u/:slug` visual inspection confirmed impossible (not merely unattempted) — queried `member_sites` directly, zero `kind='published'` rows exist. Closed as done rather than left permanently blocked: the shared-component architecture (`RenderSection`/`REGISTRY` used identically for admin and member scope) is already verified via code + the live admin site, so Phase 2+ isn't actually gated on a member choosing to publish. Revisit the member-site visual check opportunistically once one exists. |
| 2 | Source Adapter Architecture & Page Inventory | done | 2026-07-16 | `WebsiteSourceAdapter` + `WebsitePageInventory` built as real code (not schema-only) against the real published `site_state` row. See findings below. |
| 3 | Current-State Analysis & Public Narrative Model | not started | — | — |
| 4 | Audience Intelligence Model | not started | — | — |
| 5 | Information Architecture, Page & Section Intelligence | not started | — | — |
| 6 | Content Rendering & Infographic Intelligence | not started | — | — |
| 7 | Visual Direction & Page Composition Engine | not started | — | — |
| 8 | Content Generation, Lineage & Voice Preservation | not started | — | — |
| 9 | Configuration Update Agent, Changeset, Sync & Dependency Graph | not started | — | — |
| 10 | Preview/Comparison Workspace, Metrics & Validation Engine | not started | — | — |
| 11 | Salt Basin Application + Personal Brand & Org Admin Extension | not started | — | — |
| 12 | Agentic Chat Interface & Agent-to-Agent Workflow | not started | — | — |
| 13 | Vertical Slice Demonstration & Definition of Done Reconciliation | not started | — | — |

## Phase 1 architecture inventory

| Surface | Classification | Finding / constraint |
|---|---|---|
| React/Vite routing | reusable, technically constrained | React Router serves Salt Basin at `/` and member profiles at `/u/:slug/*`; the client is an SPA. |
| Express API | reusable | Supplies published/draft site configuration and member configuration. |
| Page model | configuration-driven | Live admin API currently returns a versioned keyed-page object; repository guidance also documents array-shaped pages. Adapters must normalize both shapes without destructive migration. |
| Section model | configuration-driven | Sections carry identity, type, status, presentation values, content fields, and optional field metadata. |
| Block registry | reusable, append-only | `REGISTRY` resolves `section.type`; unknown types fall back to text. Existing keys may not be renamed or removed. |
| Public rendering | reusable, brand-aware | `PublicSite` and `PublicProfile` share `RenderSection`; member routes scope links and configuration by slug. |
| Brand/theme | configuration-driven, brand-aware | `brand.css` defines approved `--sb-*` tokens and named themes; page and section `data-theme` values select them. |
| Admin editing | reusable | `AdminShell`, `EditorPane`, `PreviewPane`, and config panels already implement shared admin/member editing patterns. |
| Storage/database | configuration-driven | Postgres adapter stores draft/published JSON pairs and identity-scoped member records. |
| Authentication | technically constrained | Admin/member mutation APIs require async cookie-backed authentication; public published reads are intentionally unauthenticated. |
| Assets/images/icons | mixed | Blocks accept configured media fields, while several bespoke blocks and icon choices remain component-defined. Future recommendations must distinguish reusable bindings from hardcoded presentation. |
| Charts/infographics/3D | reusable but heterogeneous | Recharts, Three.js spatial components, journey renderers, and bespoke blocks exist but do not yet share one semantic infographic registry. |
| SEO/structured data | constrained | No unified page-level configuration and validation pipeline was identified in the inspected public render surfaces. |
| AI/agents | reusable patterns | EIDOS, member-agent, scenario, and BestyStaff services provide route/service conventions, but no Website Intelligence orchestration exists yet. |
| Responsive/accessibility | mixed | Existing blocks provide local responsive behavior; no central configuration validator currently guarantees fallbacks, headings, contrast, or reduced motion. |

## Scoping decisions

- Salt Basin-owned websites are crawled from `site_state`/`member_sites`; HTTP/DOM crawling is reserved for external origins.
- The live page model discrepancy (keyed object observed via API versus array form documented in repository guidance) is handled by `normalizePages()` in `server/lib/websiteIntelligence/sourceAdapters.js` (Phase 2), not by rewriting current data.
- **Correction to `CLAUDE.md`'s documented section shape**: the live `site_state` data stores section content under `section.fields`, not `section.content`. Confirmed two ways — the real published row (`section.fields = { script, heading, ... }`) and `src/components/blocks/index.jsx`, where every block does `const f = section.fields || {}` (51 occurrences, 0 occurrences of `section.content`). `fieldMeta` (the lineage/evidence metadata object) does exist as a documented key but is unused in the current published data (0 of 23 live sections carry it). Every Phase 2+ artifact in this build targets `section.fields`, and this discrepancy should be corrected in `CLAUDE.md` directly rather than carried forward as tribal knowledge.
- No published member site exists (`member_sites` has zero `kind='published'` rows) — confirmed by direct query, not assumed. `adaptMemberSiteState()` in Phase 2 is built and correct against the real table shape but has nothing real to run against yet; it returns `null` rather than fabricating a member page inventory.

## Phase 2 — real page inventory (published `site_state`, source hash `ad8a8b9524be52ff`, effective 2026-07-12T03:56:53.659Z)

Built by `server/lib/websiteIntelligence/sourceAdapters.js` (`adaptSaltBasinSiteState`, `adaptMemberSiteState`, `adaptFoundationSourceOfTruth`, `adaptBrandGuide`) and `server/lib/websiteIntelligence/pageInventory.js` (`buildPageInventory`). Runnable read-only via `node scripts/website-intelligence-inventory.mjs [draft|published]`.

| page_id | sections | CTAs | content_depth (chars) | content_confidence (field fill-rate) | duplication_score |
|---|---|---|---|---|---|
| home | 13 | 2 | 3,456 | 1.00 | 0.00 |
| resources | 4 | 0 | 981 | 1.00 | 0.00 |
| creative | 3 | 0 | 1,109 | 1.00 | 0.00 |
| consulting | 3 | 0 | 1,727 | 0.92 | 0.00 |

Notes:
- `content_confidence` here is *structural field fill-rate* (are a section's own `fields` populated), not evidence-based claim confidence — that distinction is deliberate (see code comments) and must not collapse into Phase 3's narrative-confidence metric later.
- `duplication_score` is a structural section-type-signature match only (0.00 across all four pages — no two pages share an identical section-type sequence). It is not a content-similarity model; Phase 3's Content Quality analysis covers semantic duplication.
- `page_type`, `navigation_level`, `inferred_audiences`, `inferred_page_purpose`, `inferred_primary_message`/`secondary_messages`, `media_assets`, `SEO_metadata`, and `structured_data` are intentionally left `null`/`[]` — inferring them is Phase 3 (narrative/audience analysis) and Phase 5 (page typing) work, not Phase 2's. A page inventory that pre-guessed these would let later phases skip the actual analysis the master prompt requires.
- Only 3 of 3 CTAs total across the whole site are on the homepage hero; `resources`, `creative`, and `consulting` have zero structured CTA fields (`cta1`/`cta2`-style keys) despite `creative-decor` and `services`/`assessments` sections having CTA-shaped content under differently-named fields (`cta1`, `s1Cta`, `a1Price`, etc.) — the `CTA_FIELD_PATTERN` regex only catches the `cta{N}Label`/`cta{N}Link` naming convention `home-hero` uses. This is a **known Phase 2 gap**, not a claim that those pages lack CTAs: Phase 3's Content Quality / CTA analysis should widen the CTA-detection convention rather than trust this list as exhaustive.
- No weighted or configurable formula was introduced this phase (`duplication_score` and `content_confidence` are both plain ratios with no tunable weights), so `salt-basin-config-audit` was not run — flagging that decision rather than skipping silently, per the skill's own rule.

## Configurability gaps (outside the numbered phase sequence)

Phase 1/2 inspection surfaced three real architecture gaps beyond the core 13-phase pipeline (see `HANDOVER_website_intelligence_engine.md`). Status:

| Gap | Status | Notes |
|---|---|---|
| Unified SEO / structured-data layer | **done** (2026-07-16) | See changelog entry below. |
| CTA field standardization | not started | ~20 block components, needs a non-breaking migration path. |
| Shared infographic/chart/3D registry | not started | This one **is** Phase 6 of the numbered sequence. |

## Changelog

- **2026-07-16 — Unified SEO / structured-data layer built.** Added an optional, additive `page.seo` key (`{ title, description, canonical, ogImage, noIndex }`) to the page shape in both `site_state` and `member_sites` — no schema version bump, no migration, absent on every pre-existing page. Built `server/lib/seo.js` (shared `buildSeoTags()`/`injectSeoIntoHtml()`, framework-free, cross-imported by both server and client the same way `src/components/PublicSite.jsx` already imports `server/data/defaultSite.js`), `src/lib/useSeoHead.js` (client-side `<head>` updates on route change — no new dependency, no `react-helmet-async`), and `server/lib/seoMiddleware.js` (prod-only Express middleware, registered ahead of `express.static` in `server/index.js`, that rewrites the served HTML's `<head>` per-request so link-unfurling bots that don't execute JS — Slack, Twitter/X, LinkedIn, iMessage — see real per-page data; falls through via `next()` on any error). Wired the client hook into both `PublicSite.jsx` and `PublicProfile.jsx`, which required moving each component's page-lookup above its existing loading/error early returns to satisfy React's rules of hooks (the same gotcha `CLAUDE.md` already documents from the `EditorPane.jsx` blank-screen bug). Added a "SEO & Sharing" card to `EditorPane.jsx`'s page-settings branch. JSON-LD is auto-generated only (Organization on home, WebPage elsewhere) from existing page fields — no new free-text schema field, per explicit user choice, so it can't go stale or contain invalid JSON. No weighted/scoring formula was introduced (`buildSeoTags` is plain fallback logic, same as Phase 2's `duplication_score`/`content_confidence`), so `salt-basin-config-audit` was not run — flagging that decision rather than skipping silently, per the skill's own rule. This is configurability-gap work, not a numbered phase — Phase 3 (Current-State Analysis & Public Narrative Model) is still next in the core pipeline.
- **2026-07-12 — Phase 1 initial pass.** Confirmed healthy local Vite/Express runtimes, inspected the real published Salt Basin configuration and renderer architecture, created `docs/website-intelligence-methodology.md`, and recorded the platform inventory. No published member was available, so the required real `/u/:slug` inspection could not be completed without fabricating data. No published or draft configuration was mutated.
- **2026-07-16 — Skill + command created; Phase 1 closed; Phase 2 built and run.** Created `.claude/commands/website-intelligence.md` and `.claude/skills/salt-basin-website-intelligence/` (SKILL.md + verbatim 30-section master prompt + 13-phase breakdown). Confirmed via direct DB query that zero member sites are published, closing Phase 1's open item as a verified fact rather than an assumption; reclassified Phase 1 `done`. Built Phase 2's `WebsiteSourceAdapter` (`server/lib/websiteIntelligence/sourceAdapters.js`) and `WebsiteAnalysisAgent`/`WebsitePageInventory` (`server/lib/websiteIntelligence/pageInventory.js`) as real code, ran it against the real published `site_state` (4 pages, 23 sections), and recorded the output above. Discovered and documented a real discrepancy between `CLAUDE.md` (`section.content`) and the live data/code (`section.fields`). No published or draft configuration was read-write mutated — this phase is read-only. Next: Phase 3 (Current-State Analysis & Public Narrative Model), which is the first phase requiring actual judgment (narrative clarity, content quality, audience inference) rather than structural extraction.
