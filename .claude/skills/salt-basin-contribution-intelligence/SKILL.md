---
name: salt-basin-contribution-intelligence
description: Repeatable multi-session driver for the "Contribution Intelligence System" master build prompt — evidence-based reconstruction, classification, attribution, lineage tracking, and economic valuation of human-vs-AI work, starting from real Claude session data. Use when Betsy invokes /contribution-intelligence, references "Contribution Intelligence," "the contribution intelligence system," "human vs. AI attribution," "the session intelligence agent," or asks to reconstruct/measure who or what materially contributed to a piece of work.
---

# Salt Basin Contribution Intelligence

This skill drives Betsy's "Contribution Intelligence System" master build prompt — a 21-section (plus preamble) brief for a configurable system that reconstructs how humans, AI models, AI agents, and system processes collaboratively create work, starting with real Claude session data. It is explicitly **not** a time-tracking product, an AI usage dashboard, a token consumption dashboard, or a human-vs-AI productivity calculator — see the non-negotiables below.

This is a **sibling** to `salt-basin-master-build` and `salt-basin-pre-build`, not a replacement or a duplicate. It builds a distinct product capability (Contribution Intelligence) rather than the spatial/Channel Rod operating environment. The two are connected in one direction: `salt-basin-master-build` invokes this skill at the end of every loop to capture that loop's own session as real Contribution Intelligence input (see that skill's workflow step 8) — so as this skill's phases land, the master build's own sessions become the system's first real dataset, per §XXI's instruction to build against real data rather than synthetic.

## Non-negotiables (apply on every invocation, no exceptions)

- **Not a time-tracking product, AI usage dashboard, token dashboard, or human-vs-AI productivity calculator.** If a phase's output reduces to one of those, it has drifted from the spec — go back to the preamble's list of what the system *must* model instead.
- **Never collapse a raw source event into its classified Contribution Event.** The raw event is immutable evidence, stored separately; the Contribution Event is a versioned, reprocessable semantic interpretation of it (§I).
- **Never flatten a shared-class contribution (reasoning, synthesis, design, architecture, etc.) into an undifferentiated "50% human / 50% AI."** Reconstruct the individual sub-contributions inside the interaction (§II, §III) — that differentiation is the entire point of the methodology.
- **Never state inferred time or cost as an observed fact.** Every report must distinguish OBSERVED / INFERRED / ESTIMATED / ALLOCATED / CALCULATED (§VII), and economic comparisons must use "estimated equivalent traditional effort" / "observed human-plus-AI effort" language rather than an unqualified "AI saved X hours" (§X).
- **Never silently rewrite historical attribution.** Create a new attribution version and preserve prior ones (§XX) — attribution changes are append-only, mirroring this repo's own append-only schema conventions in CLAUDE.md.
- **Do not flatter Betsy or auto-label her inputs as strategic/innovative.** Every contribution classification must be defensible from observed behavior in the raw session evidence (§IV) — this is a forensic methodology, not a productivity-porn dashboard.
- **Do not require centralizing all raw source content** to make the multi-human/multi-agent channel model work. Governed semantic projection — classification, evidence reference, authorized semantic output, lineage metadata — is explicitly allowed to leave sensitive raw content in its native source (§XIV).
- **Claude is the first source adapter, not a permanent architectural assumption.** Interface signatures (§XIX) must stay source-agnostic even though the first working vertical slice only implements the Claude adapter.
- **Inspect the real repo before designing anything** (§XXI). Do not rebuild functionality this codebase already has — check for overlap with `oauth_connections`/`data_entitlements` (member/org data-access model), the EIDOS 9-layer schema (`server/lib/eidos.js`), and any existing cost-tracking or agent-log surfaces before adding new tables.
- Follow CLAUDE.md's deployment-safety invariants exactly: append-only block registry, additive-only shared config rows, schema-versioned JSON, seed/bootstrap never touches member rows. This applies even though Contribution Intelligence is a new capability — new tables are additive, never a rewrite of existing member-facing schema.

## Files

- `reference/master-build-prompt.md` — the full verbatim 21-section brief (plus preamble). Read only the section(s) relevant to the current phase rather than the whole document, unless the user asks for a full pass.
- `reference/phases.md` — static definition of the 8 build phases, which spec sections each covers, their dependencies, and the explicit "first working vertical slice" acceptance bar from §XXI (which cuts across Phases 1–6, not a separate phase).
- `docs/salt-basin-contribution-intelligence-progress.md` (repo root, not under this skill directory) — the **mutable** state: phase statuses, open decisions, and a changelog. Read first, update last, on every invocation.

## Workflow for every invocation

1. Read `docs/salt-basin-contribution-intelligence-progress.md` first. Check the open-decisions table — if the phase you're about to run is blocked on one that's still unanswered, stop and ask Betsy rather than proceeding on a default.
2. Determine which phase to run:
   - If the user named one (`/contribution-intelligence phase 3`, `/contribution-intelligence taxonomy`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked` (with its blocker now resolved) and whose dependencies (see the phase table) are satisfied.
3. Read only the master-prompt sections that phase's row in `reference/phases.md` cites — via Grep/Read, not the whole document.
4. Do the actual build work:
   a. For Phase 1 specifically, start with the §XXI inspection checklist against the real repo (`server/db.js`, `server/lib/eidos.js`, `server/lib/oauthProviders.js`, existing agent/analytics code) before writing any new schema — record findings in the progress tracker so later phases don't re-derive them.
   b. For every phase, build the actual structural artifact the phase's row describes (schema, engine, adapter interface, dashboard) against real data where real data exists — per §XXI, don't fabricate contribution metrics where real Claude session evidence is available; synthetic data is allowed only for clearly labeled dev/test scenarios.
   c. Version every classification, estimate, and attribution per §XX (method, version, confidence, evidence, timestamps, created_by/updated_by) — this isn't optional scaffolding to add later, it's part of the phase's own acceptance bar.
5. Update `docs/salt-basin-contribution-intelligence-progress.md`: set the phase's status, add a changelog entry (date, what changed structurally, what's still open), and update the open-decisions table if Betsy answered one during this invocation.
6. Report back concisely: which phase ran, what structurally changed, what's still open or blocked, and what phase is next.

## Scope discipline

Eight phases, each independently reviewable. Don't try to satisfy all 21 spec sections in one turn. Phase 4 (Session Reconstruction & Automatic Tracking) and Phase 5 (Cost Ledger & Traditional Build Comparator) are the most likely to be too large for one turn — if so, say so and propose splitting rather than doing a shallow pass. Phase 8 (domain extensions to sales/marketing/business-unit) should not be started speculatively — build it only once there's a concrete dataset in that domain to apply the methodology to, per the "real evidence over synthetic metrics" rule.
