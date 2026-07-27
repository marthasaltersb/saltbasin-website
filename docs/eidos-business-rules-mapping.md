# EIDOS — Business Rules Mapping

Maps Salt Basin's pre-existing methodology/architecture documentation onto
the EIDOS 9-layer schema (`docs/eidos-operating-model-playbook.md`), so
prior design work isn't re-derived from scratch and so gaps between "what
was designed" and "what's shipped" are explicit rather than silently lost.

## `docs/salt-basin-hos-journey-methodology.md` → L6 Journey Rods

The methodology doc defines HOS™ (Highway Operating System) as three
parallel, interdependent Journey Data Rods (Revenue, Customer, Member) plus
eight **extended/aspirational** rods it names but never schemas: Fund Deal,
Portfolio Company, Contract Obligation, Financial Transaction, Resource
Contribution, Confidence Reconciliation, Product Definition, Value Creation.
Its own status section is explicit that only the 3-rod-type schema shipped —
the rest was conceptual vocabulary.

**Mapping**: `journey_rod_types` now gives all 11 a real row —
`revenue_lifecycle`/`member`/`customer` seeded active (matching what's
shipped), the 8 extended types seeded `is_active: false` (draft, matching
the doc's own "not yet built" framing). Turning one on is now a config
change (`PUT /api/eidos/rod-types/:id`, or the admin UI), not a schema
migration — the methodology doc's aspirational list is fully represented,
just gated off until there's real evaluation logic worth pointing at each
new type.

The doc's continuous 0.000–1.000 maturity curve (not categorical status) and
L1 (journey token/domain) → L2 (scenario) → L3 (end-to-end journey instance)
hierarchy map directly onto the already-shipped `journey_scenarios` (L2) →
`journey_data_rods` (L3, one instance per lead/user/org) → `stage_score`
(the continuous maturity value) — no schema change needed there, this
mapping already existed before this build.

## `docs/salt-basin-business-definition-ontology-schema-v1.json` → L2–L4, L7

This JSON Schema is a **richer, aspirational design target** — it was never
wired to the live `journey_metadata_molecules`/`journey_scenarios`/
`journey_gate_definitions` tables (different field names throughout:
`scenarioId` vs. `scenario_key`, `metadataChip` vs. `molecule`, etc.). It's
the shape the live schema should grow toward, not something already
connected to it.

| Ontology JSON concept | EIDOS mapping |
|---|---|
| `domains` | No new table — conceptually a grouping over `journey_rod_types`; revisit if rod types grow enough to need real domain grouping. |
| `journeys` (with `standardStages`, `defaultStageWeights`) | `journey_scenarios` + `journey_stage_gates`, already shipped, minus the ontology's richer per-stage weighting (`journey_rod_threshold_profiles.combinations[].members[].weight` already covers per-dimension weighting; per-stage weighting is a gap). |
| `scenarios` (with `entryCriteria`/`exitCriteria`/`happyPath`/`exceptions`/`relevanceScore`/`confidenceScore`) | `journey_scenarios` covers the identity/selection fields; the richer narrative fields (happy path, exceptions, confidence score) are **not** in the live schema — a real gap, not yet closed by this build. |
| `stageGates` (with `businessRuleIds`, `revenueOutput`/`customerOutput`/`memberOutput` cross-rod references) | `journey_gate_definitions` covers required-clusters/molecules/dimensions/actors and `dependency_rules`; cross-rod output references and a dedicated business-rule id list are **not** modeled — this is the ontology's most valuable unbuilt piece, since it's exactly what would let a Revenue-rod gate reference a Customer-rod output. |
| `metadataChips` (hierarchical, parent/child) | `journey_metadata_molecules` is flat, no parent/child. The new `journey_atom_affinity_rules` table covers *cross-cluster* relationships (an atom's affinity to a semantic field) but not *within-atom* hierarchy (a chip's own sub-chips). Not closed by this build. |
| `businessRules` (plain-language + deterministic logic, test cases) | **No live equivalent anywhere**, before or after this build. This is the largest real gap — `journey_gate_definitions.dependency_rules` is the closest thing (structured predicate rules), but there's no place to record the plain-language business rule a `dependency_rule` implements, or test cases for it. |
| `dataElements` (field-level lineage/mapping) | `port_source_fields` (new, L1) covers this for Port-sourced fields specifically; the ontology's version is broader (any data element, not just port-sourced). Partial coverage. |
| `productDefinitions` (pricing/billing/recognition rules) | `accounting_policies` + `accounting_topology_definitions` (new, L7) cover the accounting-policy half; the ontology's product-specific allowed-structures list (allowed contract structures, billing frequencies, payment methods) has no live equivalent — would need a `product_definitions` table if this becomes a real requirement. |
| `billingObligationAllocations` | No live equivalent. Would sit at L7, referencing `accounting_topology_definitions` + a future `product_definitions` table. |
| `systemsMap` | Covered by `data_ports` + `port_source_objects` + `port_source_fields` (new, L1), though the ontology's version also tracks `migrationStatus`/`reportingDependency`, which the live schema doesn't yet. |

**Net**: this build closes the ontology's L1 (systems map) and L7 (accounting
policy shape) gaps completely, and L2/L4 (atoms, gates) partially. The
biggest remaining gap is `businessRules` — a real rules-with-plain-language
layer — which has no home in either the old or new schema and should be the
next thing scoped if this ontology is going to become fully live.

## `docs/salt-basin-agent-api-pricing-architecture-spec.md` → L7 Accounting

Defines the "Salt Basin Contribution Intelligence API" commercial packaging:
metered billable capability calls, a connector overlay, advisory and
enterprise governance tiers. This is the vocabulary a real accounting
integration should plug into rather than reinvent — a billable capability
call is, structurally, exactly the kind of event `journal_entries.source_type`
should be able to name (e.g. `source_type: 'billable_capability_call'`)
once usage-based billing actually posts to the ledger. Not wired up in this
build; flagged here so the next person doesn't invent a second usage-event
vocabulary.

## `docs/salt-basin-member-portal-crystal-agentic-layer-v1.md` → L8, agent boundaries

Two pieces of this doc are directly relevant:

- **The 4-scope table** (`admin`/`member`/`org-admin`/`org-user`, each with
  their own site/config table pair) is the pattern this build's global/
  org-scoped `org_id` column generalizes from — see
  `eidos-operating-model-playbook.md`'s "Global vs. scoped configuration"
  section. That doc's own open question (whether `org_sites`/`org_configs`
  need the same `version`/`schemaVersion` JSON-versioning discipline as
  `member_sites`/`member_configs`) applies equally to every new EIDOS table
  here — deferred, not yet decided, in both places.
- **The Agent Hierarchy** (Portfolio → Enterprise → Customer → Deal →
  Journey Data Rod → Branch → Stage → Joint Agent → Rod Staff) and **5-level
  Rod Cache Hierarchy** (L0 live → L5 historical lineage archive) are the
  conceptual ancestors of L8's Reciprocal Inference layer and of the
  `AGENT_BOUNDARY` entity described in the DSM data-model schema (not yet
  implemented — see the claim-tree doc's Invention 3, "State-Topological
  Agent Instantiation," whose status is itself unconfirmed in the latest
  pressure-test round). No schema changes made here; flagged so the two
  documents' agent-hierarchy language doesn't drift further apart before
  either gets built.
