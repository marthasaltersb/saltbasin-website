# Member Portal Crystal Navigation & Agentic Team Layer

Version: v1
Status: Concept and phased requirements — not yet buildable in this codebase
Owner: Salt Basin Net Works

## Product One-Liner

Extend the homepage's configurable, data-driven block model into every layer of the member portal — member admin, member public view, org admin, and org end-user — so each logged-in person sees one seamless experience: a permission-scoped 3D navigation crystal that routes them to a curated agentic team, live or point-in-time organization data, and (for paid tiers) a board-ready interactive PDF with its own embedded Q&A agent.

## Read First — This Extends Existing Specs, It Doesn't Replace Them

Most of the reasoning substrate this doc needs already exists in three places. This doc is the seam between them, not a fourth invention:

1. **[salt-basin-hos-journey-methodology.md](salt-basin-hos-journey-methodology.md)** already defines: the Metadata Crystal Model (Atom → Joint → Molecule → Capability Cluster → Stage Gate), a full Agent Hierarchy (Portfolio → Enterprise → Customer → Deal → Journey Data Rod → Branch → Stage → Joint Agent → Rod Staff), a five-level Rod Cache Hierarchy for time-scoped/point-in-time answers (L0 live → L5 historical lineage archive), a Security & Zero-Copy Context model ("agents are the security boundary, not raw tables"), and **Contribution Intelligence** (already-named: per-participant contribution tracking with estimated downstream value). Sections referenced below assume that doc as background.
2. **[salt-basin-metadata-model-canonical]** (memory) — the *shipped* vocabulary is 3-tier only (Atom/Joint/Molecule). The 5-tier crystal geometry above (adding Capability Cluster + Stage Gate) is retired as a *data model* but is exactly the right geometry for literal 3D navigation UI. **Decision this doc makes:** the crystal nav reuses the 5-tier geometry as a pure navigation/UI metaphor — it does not resurrect it as the canonical metadata vocabulary. A crystal "node" the user clicks is not required to be a formal Capability Cluster row in the database; it's a UI affordance that happens to route to one.
3. **CLAUDE.md** (this repo) — the existing three-layer platform model, draft/publish pattern, `REGISTRY` block system, `AdminShell` `scope` prop, and the deployment-safety invariants (append-only block registry, schema-versioned JSON, seed never touches member rows). Every new view below inherits these invariants; none of them are being relaxed.

## What's Actually New Here

Cross-referencing the above against the user's ask, four things are genuinely new and need their own spec:

1. Applying the config-driven block/data-model pattern (currently: public site + member site, admin scope vs. member scope) to **two more scopes**: org-admin and org-end-user.
2. Turning the crystal motif into **literal, clickable, permission-filtered navigation** — not a diagram.
3. An explicit **member-database vs. org-database separation** decision (the journey methodology doc discusses federated *external* source systems, not Salt Basin's own first-party org data).
4. A **Board Presentation Output**: a downloadable interactive PDF, metadata-scoped, with an embedded BestyStaff agent that answers only from that document's own baked-in metadata — this is a new output type, not covered anywhere else.

---

## 1. Four Portal Scopes, One Component Set

### Current state

`AdminShell` already switches between `scope: 'admin'` and `scope: 'member'`, routing to different API prefixes (`/api/site/*` vs `/api/member-site/*`) while reusing the same `EditorPane` / `PreviewPane` / `ConfigPanel` / `Sidebar` components.

### Extension

Add two more scope values: `'org-admin'` and `'org-user'`. Same component set, two more API prefixes:

| Scope | Who | Site JSON table | Config JSON table |
|---|---|---|---|
| `admin` | Betsy | `site_state` | `config_state` |
| `member` | Individual member | `member_sites` (`user_id + kind`) | `member_configs` (`user_id + kind`) |
| `org-admin` | `org_memberships.role = 'admin'` | **new:** `org_sites` (`org_id + kind`) | **new:** `org_configs` (`org_id + kind`) |
| `org-user` | `org_memberships.role IN ('member','viewer')` | reads `org_sites` (published only) | reads `org_configs` (published only) |

`org-admin` gets the full draft/publish editor (same pattern as member scope, just org-owned instead of user-owned). `org-user` is **read-only against published state** — no draft access, no editor UI — because an org end-user's job is to consume the org's configured view, not configure it. This mirrors how the public `/u/:slug` site already works relative to a member's own editor.

`REGISTRY` in `blocks/index.jsx` stays append-only and shared across all four scopes per the existing invariant — an org-specific block type is just another entry, never a fork of the registry.

### Open question (flag, don't resolve here)

Does an org's `org_sites`/`org_configs` pair need its *own* schema-versioning discipline identical to `member_sites.data.version` / `member_configs.data.schemaVersion`? Almost certainly yes, for the same reason — but the migration story (who runs an org-level migration, org-admin or Betsy) isn't decided yet. Deferred to the build session that implements `org_sites`.

---

## 2. Data Separation: Member DB vs. Org DB

**Decision (per Betsy, this session):** logical separation now, physically portable later. Org-scoped data lives in its own tables within the *current* Supabase/Postgres instance, but every org table is designed so it could be lifted into a second `DATABASE_URL` later without a redesign — not by accident of naming, but by construction:

- Every org-scoped table's primary access path is `org_id` (never joined implicitly through a member's `user_id`). A future split just means: stand up a second Postgres, copy the org-prefixed tables, point a second `db` adapter instance at it, and swap the query layer's connection per table group. No schema redesign, because nothing in an org table's own definition depends on a same-database join to `users` or `personal_profiles` — cross-database references (e.g. "which user is this org-admin") go through `org_memberships`, which itself would need to pick a side in a real split (this doc's default: `org_memberships` stays in the member database, since it's fundamentally "which member has access," and org tables reference `user_id` as an opaque foreign key, not a joinable one, once split).
- No `SELECT ... JOIN` across an org table and a member-only table (`personal_profiles`, `member_sites`, `member_configs`, `resume_*`) in application code. Always two queries, joined in JS. This is slightly more verbose today; it's what makes the future split a connection-string change instead of a rewrite.
- New tables, all `org_`-prefixed: `org_sites`, `org_configs`, `org_agent_teams`, `org_data_entitlement_scopes` (see §3), `org_board_outputs` (see §5).

This reuses the *existing* entitlement substrate rather than inventing a new one — `product_licenses` (user × org × product × tier) and `data_entitlements` (`scope` JSONB: `capabilities`, `providers`, `maxRows`, `allowExport`) already model exactly "what can this licensed user see within this org." Nothing new needed at the licensing layer; the crystal nav (§3) is a UI consumer of `data_entitlements`, not a new permission system.

---

## 3. The Crystal as Literal Navigation

### Geometry → UI mapping

Reusing the retired-as-data-model, kept-as-metaphor 5-tier geometry from the journey methodology doc:

| Crystal tier | Navigation meaning |
|---|---|
| Capability Cluster (outer facets) | Top-level nav sections a member sees — e.g. "Pipeline," "Revenue Recognition," "Contract Evidence" |
| Stage Gate (facet subdivisions) | Sub-views within a section, gated by data completeness/confidence exactly as journey methodology already defines |
| Molecule (inner nodes) | The actual clickable destination — a job, a case study, a capability record, a Journey Data Rod |
| Joint (edges between nodes) | Visual connective lines; clicking a joint surfaces the *relationship* (an agent-narrated explanation), not a record |
| Atom (smallest visible detail) | Only surfaced on drill-in, never as a top-level nav target |

### Per-member curation

The crystal a given member sees is generated, not hand-configured, from:

```
crystal(user) = f(
  org_memberships[user] → which orgs, which role,
  data_entitlements[license] → which capabilities/providers/rows this license permits,
  product_licenses.tier → which agent tiers and outputs are unlocked (§4, §5),
  active org_configs / member_configs → which sections are actually published
)
```

Two members in the same org with different `data_entitlements.scope` see structurally different crystals — same underlying org data graph, different visible facets. This is enforced the same way the journey methodology doc's Security section already specifies: **agents are the security boundary, not raw tables** — the crystal's node list is itself produced by a scoped agent call (or a scoped query standing in for one, pre-agent-build), never by fetching all org data and hiding nodes client-side.

### Point-in-time selection

"At what point in time is the data they're looking for" maps directly onto the existing **Rod Cache Hierarchy** (L0 Live → L5 Historical Lineage Archive) and the **Time as a First-Class Dimension** fields (`effective_from/through`, `stage_entered_at`, etc.) already specified. The crystal UI needs a time selector that resolves to a cache level, not a new time-series store. New UI, no new data model.

### Agent-level and view selection

"Which agent level and organization view" maps directly onto the existing Agent Hierarchy (Portfolio → Enterprise → Customer → Deal → Rod → Branch → Stage → Joint → Staff). The crystal's tier/facet the member clicks *is* the agent-level selector — clicking into "Deal" facet hands the conversation to the Deal Agent, not a generic assistant re-deriving context. This is why the crystal and the agentic team are one interaction, not two: **the crystal node selected determines which agent answers next.**

### What's undefined here

- Actual 3D rendering technology (Three.js/react-three-fiber vs. a stylized 2D/SVG "crystal-coded" approximation for v1) — not decided. Given "no TypeScript, no build complexity beyond Vite" as an existing constraint, a v1 that fakes the crystal look in SVG (reusing the existing `--sb-*` token system) before committing to a full WebGL library is the lower-risk starting point, but this is Betsy's call when build starts.
- Whether `org_agent_teams` needs its own table now or can be derived entirely from `product_licenses` + `data_entitlements` at request time. Leaning toward "derived, no new table" until a concrete case shows up where a team needs state that outlives a single session.

---

## 4. Agentic Teams Per Organization

No new agent-hierarchy concept is needed — journey methodology's Portfolio→Enterprise→Customer→Deal→Rod→Branch→Stage→Joint→Staff hierarchy already is "a dedicated agentic team curated to each org." What this doc adds is the **curation rule**: which levels of that hierarchy actually get instantiated for a given org is a function of `product_licenses.tier` and `data_entitlements.scope.capabilities`, evaluated at conversation start, not pre-provisioned. A `standard` tier license might only ever reach Deal-level agents; `enterprise` unlocks Portfolio/Enterprise-level rollup agents. This keeps the existing three-tier licensing model (`standard | professional | enterprise`) doing real work instead of adding a parallel "agent tier" concept.

BestyStaff remains the fixed, named front door (per ADR-014 in the platform merge spec) — the hierarchy agents are what BestyStaff delegates to, not a replacement brand.

---

## 5. Board Presentation Output (Mature/Paid Members)

### What it is

A new output type — `board_output` — alongside the existing `/output/*` routes (resume, case study, one-pager, etc.), which already use the print-isolation pattern (`visibility: hidden` on `<body>`, `visibility: visible` on the root). A board output is the same pattern, extended with two things no existing output has: **baked-in metadata for an embedded agent to reason over**, and **gating by product tier**.

### Gate

Available to licenses where `product_licenses.tier IN ('professional', 'enterprise')` (reusing the existing tier vocabulary — "Mature or Paid Members" maps onto tiers already defined in `product_licenses`, not a new membership concept). Enforced server-side at generation time, same pattern as every other authed route in this codebase (`requireAuth` + a tier check, not a client-side gate).

### What gets baked into the document's metadata

Everything the embedded Board Presentation Agent is allowed to answer from must be **in the document at generation time** — this is explicitly not a live-query agent, per the requirement that it "answer questions from the board document metadata only." At generation time, snapshot:

- Every figure shown, plus its full rollup/disaggregation path (which atoms→joints→molecules→capability clusters composed it) — this reuses the Path Color Registry concept from the crystal model, since a rollup path already has a canonical identity there.
- Source system attribution per figure (which `oauth_connections.provider` / source system a number traced back to).
- Timeline lineage: `created_at`/`stage_entered_at`/`duration`/`aging_variance` fields already specified under "Time as a First-Class Dimension" — this is what answers "how long did it take to populate this."
- Contribution Intelligence entries relevant to the figures shown (already-named concept — per-participant contribution to a deal/definition, with estimated downstream value).
- Any flagged risk/disclosure context attached to a figure or Journey Rod that isn't rendered as visible document text — e.g. a Material Weakness Library entry, a low-confidence Joint, or a stale/conflicting atom — surfaced by the agent on request even though it isn't printed on the page.

### Embedded agent behavior

- **Page/stat jump** — the agent's answer can include a page or section reference the PDF viewer scrolls/jumps to; requires the interactive PDF shell (not a flat print PDF) to expose a jump API, which is new frontend work, not a PDF-format trick.
- **Scope discipline** — if a board member asks something the baked-in metadata can't answer (e.g. a figure never included in this document), the agent says so explicitly rather than reaching out to live systems. This is the one place in the platform where an agent is *intentionally* not the live security-boundary agent from §3 — it's a sealed, portable artifact, which is the whole point of something "downloadable."
- **Identity** — this is a BestyStaff variant (`BestyStaff Board Presentation Agent`), consistent with ADR-014 (BestyStaff name is fixed, never renamed) — it's a mode/persona, not a new brand.

### What's undefined here

- Interactive PDF technology: a real embedded-agent PDF (chat UI baked into the PDF itself) isn't a standard PDF capability — likely means the "PDF" is actually an HTML/JS interactive document *exported as* a PDF for the flat/printable case, with a richer HTML viewer being the "real" interactive experience and a traditional PDF being the fallback for offline/print. Needs a decision before any engineering estimate.
- How a snapshot is regenerated when underlying data changes — is a board output a point-in-time artifact that's simply superseded by a new one (most likely, consistent with the platform's event-based cache invalidation elsewhere), or does it need in-place updates? Leaning toward "immutable snapshot, generate a new one," deferred to build.

---

## Build Sequence (Phases)

1. **Portal scope extension** (§1) — `org_sites`/`org_configs` tables, `org-admin`/`org-user` scopes wired into `AdminShell`, reusing every existing component. No new UI paradigm, lowest risk, unlocks everything else having somewhere to render.
2. **Crystal nav v1** (§3) — SVG/2D approximation first, driven by `data_entitlements` + `org_memberships`, no WebGL commitment yet. Point-in-time selector wired to existing cache-level concept once Rod Cache Hierarchy has a real implementation (currently conceptual — this phase may be gated behind that work landing first).
3. **Agentic team curation rule** (§4) — tier-driven hierarchy depth, once there's an actual agent hierarchy implementation to gate (currently conceptual in the journey methodology doc; this phase depends on that build landing, not just this spec).
4. **Board Presentation Output** (§5) — depends on Phases 1–3 existing (it consumes org data, entitlements, and agent reasoning), plus a resolved decision on interactive-PDF technology. Last phase, not because it matters least, but because it's the one output type nothing else here works without first.

## Public-Safe Positioning

Public-facing materials can describe the vision (a personalized, permission-aware navigation experience backed by a real agentic team, with board-ready outputs for mature clients). They should not imply any of §1–§5 is live functionality yet — none of it is; this document is the requirements gate before any of it becomes a backlog item.
