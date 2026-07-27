# EIDOS Operating Model — Playbook

## What EIDOS is

EIDOS is the operating name for what `docs/salt-basin-foundation-source-of-truth.md`
already documents as **"MESS Platforms"** — the Tier 4 product suite under
**MES Solutions, LLC** (Tier 4, under Salt Basin Net Works, LLC) that houses
**Salt Basin MRS** (Measurement Rendering Systems, the flagship platform),
**SaltTide™**, **SaltBridge**, **SaltChannels**, **Salt Covenant Solutions**,
the **Revenue Intelligence** suite, and **RLMM™**.

In Betsy's own words: *"the MESS platform, the Measurable Entity Success
Systems platform that houses the Salt Basin MRS architecture, governance, and
movement through the Enterprise Ecosystem — leveraged easily for small to
medium businesses or mid-market private equity, setting those orgs up for
Measurable Enterprise Scaling Solutions."*

> **Naming note (draft, pending brand-governance confirmation):** "Measurable
> Entity Success Systems" and "Measurable Enterprise Scaling Solutions" are
> new phrasings, close to but not identical to the already-tracked MESS
> expansion ("Measured Enterprise Scaling Solutions," MES Solutions LLC's
> tracked acronym). Salt Basin's naming system deliberately reuses acronyms
> with multiple valid expansions depending on context — this is recorded as
> an *additional* draft expansion in that same spirit, not a correction to
> what's already documented. Confirm before treating it as final.

EIDOS is the *operating model* — the actual data architecture, governance
rules, and evidence engine — that MRS and the rest of MESS Platforms run on.
It is not a separate product a client buys; it's the substrate underneath
the products they do buy.

## The 9-layer model

EIDOS is built from Salt Basin's Divergent State Mechanics (DSM) research —
see `docs/salt-basin-divergent-state-mechanics-claim-tree.md` for the
patent-track framing of the same architecture. The layers:

| Layer | What it governs | Where it lives in this codebase |
|---|---|---|
| L0 Identity + Governance | Every object's temporal/security/lineage envelope | `created_at`/`updated_at`/`metadata` on every table |
| L1 Ports | Governed interfaces to external source systems (Salesforce, SAP, Stripe, ...) | `data_ports`, `port_source_objects`, `port_source_fields` |
| L2 Evidence Atoms | The smallest governed assertion — a field, a fact, a data point | `journey_metadata_molecules` (definitions), `journey_rod_evidence` (instances) |
| L3 Semantic Fields | Which atoms cluster together, and how strongly (affinity) vs. how compatibly (alignment) | `journey_metadata_clusters`, `journey_atom_affinity_rules` |
| L4 Compositions | The gate logic that decides when a cluster of atoms is "enough" | `journey_scenarios`, `journey_gate_definitions` |
| L5 Settlement | How corroborated a molecule's contribution to *one specific rod* is | `journey_rod_settlement_states` |
| L6 Journey Rods | The persistent temporal state projection axis itself | `journey_data_rods`, `journey_rod_types`, `journey_stage_gates`, `journey_rod_threshold_profiles` |
| L7 Accounting | Policies, GL accounts, and journal entries as a second projection of the same evidence | `accounting_policies`, `gl_accounts`, `accounting_topology_definitions`, `journal_entries`, `journal_entry_lines` |
| L8 Reciprocal Inference | Divergence between the journey projection and the accounting-implied projection | `economic_composition_requirements`, `reciprocity_comparisons`, `divergence_states` |

**Everything above L1 already had a real, running implementation before this
build** — `server/lib/journeyRods.js`'s `evaluateJourneyRod()` is the actual
evidence/gate/scenario engine, in production, for the three shipped rod
types (`revenue_lifecycle`, `member`, `customer`). This playbook's job was to
extend that system with the layers it was missing (Ports, Settlement,
Accounting, Reciprocal Inference) and give the whole thing — old and new — a
real admin configuration surface, which did not exist before this build.

## Global vs. scoped configuration

Every EIDOS definition table follows one rule: **global by default, org-scoped
by override.**

- A row with `org_id IS NULL` is the platform-wide default — visible and
  usable by every organization, editable only by a Salt Basin admin.
- A row with `org_id` set is that organization's override — it takes
  precedence over the global default for that org only, and typically an
  org's own admin (once org-scoped write access is built — see Non-goals)
  would manage it.
- Resolution is always "prefer the org-scoped row, fall back to global,"
  implemented via a partial unique index per table (`WHERE org_id IS NULL`
  and `WHERE org_id IS NOT NULL` as two separate uniqueness scopes on the
  same key) rather than a single flat unique constraint.

This mirrors — and is the same underlying pattern as — the existing
`config_state` (global) / `member_configs` (per-user) / `org_configs`
(per-org) triad already used for site/CMS configuration, and the
`journey_data_rods` table's own `lead_id`/`user_id`/`org_id` alternate-scope
columns.

**Rod-instance-scoped** configuration (narrower still — specific to one rod,
not a whole org) uses a third tier: `journey_rod_threshold_profiles`, which
already existed and now has a settlement-layer sibling.

## What's real vs. what's a stub (Phase 1 — broad-shallow)

This build deliberately covers every layer's *shape* — schema, CRUD API,
admin UI — before deeply implementing any one layer's *computation*. Real
today:

- Every table, every relationship, every global/scoped resolution rule.
- Full CRUD (list/create/update/delete) for every new resource, in the admin
  shell under **EIDOS Operating Model**.
- A basic, honest settlement-density computation (`server/lib/eidos.js`
  `computeRodSettlement`) — real math, not the full model described in the
  DSM claim-tree doc.
- A basic, honest divergence computation (`computeDivergenceBetweenRods`) —
  same caveat.

Deliberately deferred:

- Settlement density is **not** wired into `evaluateJourneyRod()`'s gate
  math — computing it is a manual/explicit action for now, not automatic.
- Accounting-topology inference (the "what economic world must exist to
  explain this journal entry" reasoning from DSM Invention 4) is not
  implemented — journal entries are recorded, not inferred against.
- Port query/sync execution — `data_ports` is governance metadata only. Real
  data still moves through `server/lib/oauthProviders.js`, untouched by this
  build.
- Org-scoped *write* access (an org's own admin editing their own override
  rows) — today, only Salt Basin admins can write any row, global or
  org-scoped; the `org_id` column exists and is queryable, but there's no
  org-admin-facing screen yet.

## Where to look

- `server/db.js` — schema, in a block headed "EIDOS Operating Model schema"
  (search for that string).
- `server/lib/eidos.js`, `server/lib/journeyRods.js` — computation and
  evaluation logic.
- `server/routes/eidos.js`, `server/routes/journeyRods.js` — API surface.
- `src/components/admin/EidosOperatingModelPanel.jsx` — the admin UI, under
  **EIDOS Operating Model** in the admin nav.
- `docs/eidos-business-rules-mapping.md` — how this maps onto Salt Basin's
  pre-existing business-rules documentation.
- `docs/salt-basin-divergent-state-mechanics-claim-tree.md` — the deeper
  technical/patent-track framing of the same architecture.

## Relationship to the public metadata model

`docs/salt-basin-metadata-model.md` (the shipped, public-facing 3-tier
Atom → Joint → Molecule vocabulary, where a Journey Data Rod is described as
"an example of a molecule") is a **different altitude**, deliberately kept
separate. EIDOS/DSM inverts that structurally — the Rod is the top-level
entity here, Molecule is a sub-cluster within it. Both are intentionally
correct at their own altitude: the public doc is simplified marketing
vocabulary; this playbook is the internal engineering/patent architecture
underneath it. Do not merge them without an explicit decision to do so.
