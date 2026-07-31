# Runtime Config Audit — "Everything Editable Without an Engineer" (2026-07-12)

Triggered by Betsy: "everything needs to be editable without an engineer in this product," raised while
discussing Rod Maturity's weight configurability. Full-codebase inventory pass via `salt-basin-config-audit`
— **classification only, nothing converted in this pass** (Betsy chose "full audit first" over piloting or
single-item conversion).

## Why this matters more than it looks

Every `Object.freeze` registry built or extended this session (`metricDefinitionRegistry.js`,
`rodMathematicsMethodology.js`, `queryConvergenceMethodology.js`, `metricVisualEncodingRegistry.js`,
`worldVariantRegistry.js`) — and repeatedly praised in this session's own audit notes as "follows the
existing convention, no findings" — is itself only editable by an engineer today. That convention (a
versioned, centralized, non-hardcoded-in-a-component JS object) satisfies the *"not hardcoded in a
component"* bar this repo's `salt-basin-config-audit` skill has been enforcing, but not the higher bar
Betsy just set: *editable without a code deploy.* These are two different bars. This audit re-evaluates
every static registry in the codebase against the higher one.

## The reusable pattern already exists — use it, don't invent a new one

`config_state` / `member_configs` (`server/db.js`): generic `id + JSONB data + updated_at` rows, already
used for `admin_nav` and `page_type_definitions`, with draft/publish precedent elsewhere in the platform.
**`server/lib/currentRegistry.js` is already proof this works** — its actual tunable Current-definition data
already lives in a DB table (`journey_current_definitions`) with org-override support; the JS file is only
the fixed two-value scope enum plus a generic evaluator function. That's the target shape for every
`SHOULD BECOME CONFIGURATION` item below, not a one-off.

**What's missing:** a generic admin UI for editing an arbitrary config row's JSON safely (with schema
validation, not raw textarea JSON). Every admin-editable surface today (`NrmPanel`, `GlobalStandardsPanel`,
`PageTypeManagerPanel`, `ConfigPanel`) is a bespoke panel built for that one thing. This is the real gap —
storage isn't the problem, editing UI is.

**What's also missing:** server-side write-path validation. `rodMathematics.js`'s weighted composites are
only checked by `tests/rodMathematics.test.js`'s `'configured composite weights are normalized'` test — a
CI-time guard, not a runtime one. Once these become editable via an admin form, an invalid write (weights
not summing to 1, a metric encoding pointing at a channel already claimed) must be rejected server-side,
not just caught by a test suite nobody runs against production data.

## Classification legend

- **SHOULD BECOME CONFIGURATION** — the real conversion candidates.
- **INTENTIONAL PLATFORM CONSTANT** — same for every Member/Org/product by design; state why.
- **FOUNDATION-LOCKED BRAND RULE** — fixed by the Foundation Source of Truth; cite the source.
- **TEMPORARY PROTOTYPE DEBT** — known-hardcoded placeholder/demo content, a step worse than a legitimate
  constant (needs its own remediation, not just a migration).

## Priority tiers for `SHOULD BECOME CONFIGURATION` items

### P0 — weighted composites (highest business value, already proven pattern this session)

| File | What | Notes |
|---|---|---|
| `src/config/metrics/rodMathematicsMethodology.js` | `rodMaturity`, `stageCompleteness`, `stageReadiness`, `atomDensity`, `coherence`, `alignment` weights | Exactly the case just proven with Reconciliation Maturity — a weight change today requires an engineer edit + redeploy + manually re-running the test. |
| `src/config/metrics/queryConvergenceMethodology.js` | `relevance`/`confidence`/`stability` weights, all three `bands` (threshold + label) | Same pattern, plus the band labels ("Core Context," "Strongly Related," ...) are copy a non-engineer would want to reword. |
| `src/scenarios/scenarioRegistry.js` | `DEFAULT_ATOM_WEIGHTS` | Same weighted-config shape, scenario-matching similarity weights. |

### P1 — business process definitions and policy (high value, needs governance thought)

| File | What | Notes |
|---|---|---|
| `src/config/journeys/journeyDefinitions.js` | `JOURNEY_DEFINITIONS` stage names/sequences | An org customizing their Revenue/Customer/Member lifecycle stages is a real scenario, not hypothetical. `TRIBUTARY_RULES`/`CONFLUENCE_RULES`'s policy *keys* stay code (fixed vocabulary of implemented behaviors); which rule attaches where should be config. |
| `server/lib/provisioningPolicyRegistry.js` | Stage labels, TTLs, module descriptions | File's own comments already say this should be "reconfigure[able]... without a code change" — an unused org-override seam already exists, waiting for real config. |
| `server/lib/consentRegistry.js` | Consent wording, versions, acknowledgement text | Legal/UX copy that needs re-versioning without an engineer — arguably the highest-*risk* item to leave code-only (legal review shouldn't require a PR). |
| `server/lib/memberStaffTemplates.js` | BestyStaff agent `instructions` (behavioral prose), `purpose`/`name` | High value (this is literally how the AI staff behaves) but also higher risk — editing agent instructions needs guardrails so a bad edit doesn't break agent safety/authority boundaries. Do this one carefully, not first. |
| `src/data/platformLifecycleConfig.js` | Stage `progress` %, per-gate weights, dimension weights | Real business-tuning knobs. Separately: `businessValue`/`riskReduction` priority-to-score mappings are hardcoded **inside function bodies**, not even in the exported config object — worse than the rest, flagged as its own remediation step below. |
| `src/data/businessDefinitionExperienceConfig.js` | `intakeDefaults`, `validationJourneyPolicy.freeJourneyAllowance`, actor/UX copy | "5 free validations" is a pricing/policy lever that currently needs a deploy to change. |
| `src/data/handoverOsScenarioLibrary.js` | Edge-case labels/risk descriptions, `1.25`/`6` scoring constants | Domain-expert content Betsy would want to add to based on client feedback. |

### P2 — presentation/visual config (lower risk, still real)

| File | What | Notes |
|---|---|---|
| `src/config/visual/metricVisualEncodingRegistry.js` | Channel↔metric mappings, `ATOM_RENDER_PROFILE` ranges | The "one channel = one metric" *rule* stays code-enforced regardless of where the mapping data lives. |
| `src/config/visual/worldVariantRegistry.js` | Variant `description`/`worldFamily` | Adding/hiding a variant without an engineer is the literal premise of this whole conversation. |
| `src/config/visual/visualSemanticRegistry.js` | `colorRule` assignment, `meaning` copy | `GEOMETRY_REGISTRY` grammar keys stay code (fixed rendering vocabulary). |
| `src/config/visual/worldRegistry.js` | `WORLD_REGISTRY` entries, `choreography` params | Lower priority — Phase 1 of `salt-basin-world-variants` found this registry is cosmetically wired only (zero rendering consumers) — converting inert config is cheap but low-value until it's actually load-bearing. |
| `src/config/metrics/queryContextRegistry.js` | `QUERY_CONTEXT_REGISTRY` dimensions/tiers, `QUERY_INTERACTION_REGISTRY` UI copy | |
| `src/config/metrics/queryRelevanceNarrative.js` | `RELEVANCE_COMPONENT_LABELS` | Small map; the sentence-generation *function* stays code. |
| `src/config/metrics/metricDefinitionRegistry.js`, `metricCategoryRegistry.js` | `definition`/`businessQuestionAnswered`/`directionalityDescription`/`archetypeQuestion` copy | The metric *identities* (which 11 metrics exist, §III) are FOUNDATION-LOCKED, not editable — only the explanatory copy should move. |
| `src/data/crystalExperienceConfig.js` | `dataDensity.fieldWeights`, `maturity` band labels/thresholds | Camera/movement/lighting numbers stay code (rendering-engineering, not business). |
| `server/lib/collaborationRegistry.js` | `PRESENCE_TTL_MS` | Visibility predicate *functions* stay code. |
| `server/lib/agentContextRegistry.js` | `freshnessThresholdMs` per agent policy | |
| `server/lib/financialPolicyRegistry.js` | `experience` block copy, provider `sortOrder` | `DATA_SCOPES`/`liabilityByAccountClass` are compliance-grade taxonomy — arguably FOUNDATION-LOCKED given financial/security stakes, not casually editable. |
| `src/data/platformModules.js` | Module labels/descriptions, `GROUP_TO_MODULE` map | File's own comment already frames this as needing easy retuning. |
| `src/data/capabilityTags.js` | `SOURCE_TYPES.*.color` hex values only | Everything else here is KEEP — tied to formal HandoverOS `metricCode`s, not casually renamable. |
| `server/lib/dataSourceRegistry.js` | `label`, `LIMIT 20` | Low priority — each entry is bound to a real `fetch` implementation, not separable data. |

## INTENTIONAL PLATFORM CONSTANT / FOUNDATION-LOCKED — explicitly staying code

| File | Why |
|---|---|
| `src/config/architecture/objectTypeRegistry.js`, `layerRegistry.js` | The EIDOS 11-layer architecture is fixed Foundation model — a structural constant, not a business variable. |
| `src/data/elementRegistry.js` | File's own header: "An element is NOT a business concept" — controlled vocabulary (enums) referenced by validation/rendering logic; adding a value has real downstream code implications. |
| `src/data/backlogFieldSchema.js` | Database-column-shaped schema tied to real `backlog_items` columns and cited spec sections — changing it requires a matching code change regardless. |
| `server/lib/tributaryRegistry.js`, `currentRegistry.js` (the enum/evaluator part) | Structural schema/wiring — which entity types may legally connect, and the fixed scope enum. |
| `server/lib/oauthProviders.js` | **Explicitly not safe to make freely editable** — every entry is wired to real OAuth endpoint logic, provider-specific branching, and required secrets. Cosmetic fields (`icon`/`description`) look editable but aren't separable from the integration code without breaking it. |
| `server/lib/dataSourceRegistry.js` (fetch logic), `contextCache.js` | Executable logic / generic mechanism, no embedded business values. |
| `src/lib/websiteIntelligence.js` | `WEBSITE_SOURCE_TYPES` — small fixed enum. |
| Rendering-engineering numbers (`crystalExperienceConfig.js` camera/movement, `visualSemanticRegistry.js` geometry grammar) | Tuning the renderer, not the business — an engineer's call, not a product one. |

## TEMPORARY PROTOTYPE DEBT — worse than "should become config," needs its own step

- **`src/data/platformLifecycleConfig.js`** — `businessValue`/`riskReduction` priority-to-score mappings are
  hardcoded *inside function bodies*, not in the exported config object at all. Migrating the object isn't
  enough here; these need to be pulled out into config first before they're even visible as a knob.
- **`src/data/journeyWorldConfig.js`** — `SEED_LEADS` and demo evidence strings (fake approval-workflow
  text, invented deal names) are synthetic placeholder content masquerading as real seed data. Already
  informally flagged earlier this session; formalizing it here.
- **`src/data/businessDefinitionExperienceConfig.js`** — hardcoded example `maturity`/`confidence` scores
  "look like real metrics but are static placeholders" (Agent A's finding) — risk of being mistaken for
  live data by anyone auditing the UI, not just an engineering convenience issue.

## P0 — built 2026-07-12 (the "repeatable engine," per Betsy's framing)

Betsy: "let's start on P0... I meant envelope as a repeatable engine" — build one reusable mechanism, pilot
it on P0, extend it to P1/P2 later rather than a bespoke build per registry.

**Built:**
- `server/lib/configEnvelope.js` — the generic engine: `defineConfigEnvelope`, `resolveConfigEnvelope`,
  `writeConfigEnvelope`, `resetConfigEnvelope`. Storage is `config_state` (existing table, rows namespaced
  `envelope:<id>`). Modeled directly on `provisioningPolicyRegistry.js`'s already-proven "default until a
  real override exists" shape — no new scoping mechanism invented. Org-level overrides deliberately not
  built (no org has asked to diverge yet, matching that same file's stated restraint).
- `server/lib/methodologyEnvelopes.js` — registers all three P0 registries against the engine
  (`rod-mathematics-methodology`, `query-convergence-methodology`, `scenario-atom-weights`), each with a
  real validator (weights-sum-to-1 for the two methodology envelopes, non-negative-number check for the
  scenario weights, which are independent multipliers by design, not a partition).
- `server/routes/configEnvelopes.js` — one generic `GET/PUT/DELETE /api/config-envelopes/:id` surface for
  every registered envelope, admin-auth-gated. Adding a 4th envelope later needs zero new route code.
- `src/components/admin/MethodologyConfigPanel.jsx` — one generic admin panel (JSON editor + inline
  validation-error display + reset-to-default) driven entirely by what the server has registered. Wired
  into `AdminShell.jsx`'s `TAB_COMPONENTS` and the `system` nav group ("Methodology Config"), with an
  additive `admin_nav` migration in `server/db.js` (same one-shot-injection pattern already used for
  Career Master/Output Templates).
- **Closed the loop, not just plumbing**: `SpatialJourneyWorld.jsx`'s one live Rod Coherence call site now
  fetches the resolved `rod-mathematics-methodology` envelope once on mount and passes it through — a saved
  admin edit changes real rendered behavior, not just a database row nothing reads.

**Verified**, since no admin login credentials were available for this shared dev database (only seeds an
admin when zero users exist): exercised the engine directly against the live Postgres — registered
envelopes list correctly; resolves to the shipped default with no override; an invalid write (weights
summing to 1.5) is rejected with a specific error and never persisted; a valid write persists and resolves
back correctly; reset reverts to default; the `admin_nav` migration landed for real (`system` view's tabs
now include `methodology-config`); the HTTP route is mounted and returns 401 without a session. Test
suites re-run clean: 20/20 (`rodMathematics`, `queryConvergence`, `metricVisualEncodingRegistry`).

## What's still open

- **P1/P2 not started** — this pass built and proved the engine on P0 only. Extending it to a P1 item
  (`consentRegistry.js`, `provisioningPolicyRegistry.js`, `journeyDefinitions.js`, ...) should now be a
  matter of writing a validator and calling `defineConfigEnvelope` — the engine, route, and panel are
  already generic and don't need new code to onboard another registry.
- **Org-level override storage** — still deliberately not built. Add it (a second lookup keyed by `org_id`
  before falling back to the platform row) only when a real org asks to diverge, per the same restraint
  `provisioningPolicyRegistry.js` already models.
- **Browser click-through of `MethodologyConfigPanel.jsx` itself** — not done; verified structurally
  (component code, `AdminShell` wiring, live nav-injection query) and via the engine directly, not by
  clicking Save in the actual UI. Worth a real click-through once admin credentials are available.
