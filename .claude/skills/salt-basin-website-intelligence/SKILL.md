---
name: salt-basin-website-intelligence
description: Repeatable multi-session driver for the "Master Build Prompt — Autonomous Website Intelligence, Public Site Design, and Configuration Engine" — analyzes an existing public website and organization context, reconstructs its public narrative, proposes a future-state information architecture, and turns that reasoning into governed, versioned site_state/member_sites configuration (never hardcoded JSX). Use when Betsy invokes /website-intelligence, references "the website intelligence engine," "the website intelligence prompt," "analyze my public website," "the public narrative model," "the information architecture engine," or asks the system to reason about what the public site should communicate and update the site configuration accordingly.
---

# Salt Basin Website Intelligence and Configuration Engine

This skill drives Betsy's "Master Build Prompt — Autonomous Website Intelligence, Public Site Design, and
Configuration Engine" — a 30-section (I–XXX) brief that builds a governed pipeline turning an existing
public website plus organization context into an analyzed narrative, a proposed information architecture,
generated evidence-aware content, and real configuration changes to the site the existing platform already
renders.

This is a **sibling** to `salt-basin-master-build`, `salt-basin-pre-build`, `salt-basin-contribution-intelligence`,
`salt-basin-visual-metrics`, and `salt-basin-world-variants`, not a replacement for any of them. It doesn't
invent a new website — it reasons about the public *communication* layer of the site those other skills are
building (and the site that already exists at `saltbasin.net` and under `/u/:slug`), and it must produce its
output as `site_state` / `member_sites` configuration, using the existing `REGISTRY` in
`src/components/blocks/index.jsx`, not new hardcoded pages.

## Non-negotiables (apply on every invocation, no exceptions)

- **Configuration-driven output only.** Every proposed page or section must resolve to real
  `site_state.pages[].sections[]` (or `member_sites` equivalent) JSON using an existing or newly-registered
  `REGISTRY` component key. Never hand back raw JSX as the deliverable for a proposed page.
- **Draft/published invariants from `CLAUDE.md` are absolute.** The engine may create or update a
  `PROPOSED_CONFIGURATION` or `DRAFT_SITE`; it must never write to a published row without going through the
  platform's existing publish workflow. `pages_to_archive` means removed from the "add section" picker /
  navigation, never deleted from the append-only `REGISTRY`.
- **Never fabricate evidence.** No invented customer counts, revenue, metrics, partnerships, case studies,
  adoption numbers, patents, or certifications. Claims without real evidence get ASPIRATIONAL/VISION framing
  ("designed to support"), never FACTUAL framing ("currently supports").
- **Preserve Betsy's actual voice and the Foundation Source of Truth.** Don't rewrite a distinctive phrase to
  sound more generic. Every narrative or product claim must reconcile with (never contradict)
  `docs/salt-basin-foundation-source-of-truth.md`.
- **The system is not a copywriter, template picker, or HTML generator.** A findings list, strategy memo, or
  sitemap alone never satisfies a phase — the structural artifact (model, registry, engine code, or
  configuration diff) has to land, mirroring the same rule `salt-basin-visual-metrics` applies to its own
  phases.
- **No opaque composite scores.** Every metric this skill introduces (Narrative/Audience/Evidence/Visual
  Communication Coverage, etc.) must answer one specifically named question — never a generic "Website
  Score."
- **Run `salt-basin-config-audit`** against any new weighted rendering-recommendation or metric formula this
  skill introduces, same discipline `salt-basin-visual-metrics` already applies.
- **"Crawling" this repo's own site means reading `site_state`/`member_sites`, not scraping HTTP.** For the
  vertical slice and Salt Basin application phases, the "existing website" already lives in this app's own
  Postgres rows and `PublicSite.jsx` renderer — treat that as the primary source, and reserve an actual HTTP
  `WebsiteSourceAdapter` for genuinely external sites (a member's prior non-Salt-Basin site, a competitor,
  etc.) if that ever comes up.

## Files

- `reference/master-build-prompt.md` — the full verbatim 30-section brief (I–XXX plus the framing preamble).
  Read only the section(s) relevant to the current phase rather than the whole document.
- `reference/phases.md` — static definition of the 13 build phases, which spec sections each covers, their
  dependencies, and the cross-cutting rules that apply to all of them.
- `docs/salt-basin-website-intelligence-progress.md` (repo root, not under this skill directory) — the
  **mutable** state: phase statuses, findings tables as they're produced, and a changelog. Read first, update
  last, on every invocation.

## Workflow for every invocation

1. Read `docs/salt-basin-website-intelligence-progress.md` first — later phases build on earlier phases'
   real findings (page inventory, narrative model, audience profiles), don't re-derive them from scratch.
2. Determine which phase to run:
   - If the user named one (`/website-intelligence phase 5`, `/website-intelligence narrative`,
     `/website-intelligence vertical-slice`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked`
     (with its blocker now resolved) and whose dependencies are satisfied.
3. Read only the master-prompt sections that phase's row in `reference/phases.md` cites — via Grep/Read, not
   the whole document.
4. Do the actual work:
   a. For Phase 1 specifically, run the app and inspect the real rendered output at `/admin/*` and at least
      one `/u/:slug` member site before designing anything — do not redesign from source files alone (this
      mirrors the master prompt's own explicit instruction in §I).
   b. For every phase, build the real structural artifact against real repo data — Betsy's actual
      `site_state` pages, `docs/salt-basin-foundation-source-of-truth.md`'s claims, the real `REGISTRY` keys
      — never a synthetic/hypothetical example standing in for the deliverable.
   c. Run `salt-basin-config-audit` against any new weighted formula, scoring model, or config surface this
      phase adds.
5. Update `docs/salt-basin-website-intelligence-progress.md`: set the phase's status, append/update the
   relevant findings table (page inventory, narrative model, audience profiles, metrics, etc.), add a
   changelog entry (date, what changed structurally, what's still open).
6. Report back concisely: which phase ran, what structurally changed (models built, registries created,
   config diffs produced), what's still open or blocked, and what phase is next.

## Cross-references into the existing codebase

| Concept from the prompt | Where it maps in this repo today |
|---|---|
| Page/section content model | `site_state` (admin, draft/published) and `member_sites` (member, `user_id + kind`) in `server/db.js`; shape is `{ pages: [{ slug, sections: [{ id, type, status, content, fieldMeta }] }] }` per `CLAUDE.md`. |
| Component registry | `REGISTRY` map in `src/components/blocks/index.jsx`, dispatched by `RenderSection` on `section.type`. Append-only per `CLAUDE.md` — this skill's Page Composition Engine (Phase 7) must target this, never bypass it. |
| Public renderer | `src/components/PublicSite.jsx` for `/u/:slug`; admin preview via `EditorPane`/`PreviewPane` in `src/components/admin/`. |
| Field-level evidence/lineage | `src/data/capabilityTags.js` — `SOURCE_TYPES`, `MERGED_FIELD_DEFAULTS`, `TAG_CATEGORIES`, consumed as `section.fieldMeta[fieldKey]` (`sourceType`, `mergedFrom`, `sources`, `capabilityTags`, `description`). Phase 8's `GeneratedContentUnit` lineage should extend this, not duplicate it. |
| Brand configuration | `src/brand.css` (`--sb-*` CSS variables), `src/components/admin/adminStyles.js`. Phase 7's Visual Direction Engine reads these as APPROVED BRAND VALUE, never invents new ones. |
| Draft → publish workflow / APIs | Admin: `/api/site/*`, `/api/config/*` (`server/routes/site.js`). Member: `/api/member-site/*`, `/api/member-config/*` (`server/routes/memberSite.js`, `memberConfig.js`). Phase 9's `WebsiteConfigurationAgent` must route through these, respecting the `draft`/`published` pair. |
| Existing 3D / infographic-capable components | `SpatialJourneyWorld.jsx`, `CrystalMarkField.jsx`, `CrystalOfficeScene.jsx`, `CrystalRoomScene.jsx`, `src/lib/journeyEngine/*` — real candidates for Phase 6's Infographic Registry (SEQUENCE + RELATIONSHIP + TIME patterns) before inventing new visual components. |
| Foundation / canonical terms | `docs/salt-basin-foundation-source-of-truth.md` — the authoritative source for what's real vs. aspirational; Phase 11 and Phase 13 must reconcile into this doc, never contradict it. |
| Existing AI/agent services | `server/lib/eidos.js`, `server/routes/eidos.js`, `server/routes/memberAgent.js`, `server/lib/scenarioGenerator.js` — patterns to follow for Phase 12's bounded sub-agents rather than inventing a new agent-orchestration convention. |
| Member/org model | `personal_profiles` → `org_memberships` → `organization_profiles`, `personal_org_links`, `product_licenses`/`data_entitlements` — Phase 11's Personal Brand + Org Admin extension must key off these, not a new identity model. |

## Scope discipline

Thirteen phases across 30 spec sections. Phase 5 (Information Architecture, Page & Section Intelligence) and
Phase 9 (Configuration Agent, Changeset, Sync & Dependency Graph) are each too large for one turn if taken
whole — `reference/phases.md` already notes natural splits. Say so and split rather than doing a shallow pass
across an entire phase's sub-models at once. Phase 13 (vertical slice + Definition of Done) should not be
attempted until Phases 1–12 have real (not merely designed) artifacts behind them — running it early just
produces the "written strategy document" outcome the master prompt explicitly forbids.
