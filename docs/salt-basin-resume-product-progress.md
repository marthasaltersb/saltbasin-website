# Salt Basin Resume Product — progress

Mutable state for the `salt-basin-resume-product` skill. Read first, update last, on every invocation.

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Reconciliation & reuse audit | RECON-001 resolved (extend); reconciliation matrix populated; R01–R12 and NEW-018–031 read-back with Betsy still outstanding but no longer blocking |
| 2 | Career Master Foundation | not started — RECON-001 (extend) now unblocks this |
| 3 | Scoring & review-gating engine | in progress — personal-configuration infrastructure built and wired to opportunity ranking (concept 1 of the 4 in DEC-006 v2); concepts 2–4 (resume-to-job, source-confidence, review-gating) not yet built |
| 4 | Configurable templates & exports | not started |
| 5 | Contribution ledger & employer preview | not started |
| 6 | Disclosure, application & outcome tracking | not started |
| 7 | Betsy's actual Osaic materials | blocked — see Open blockers |

## Open blockers

- **DEC-006 v2** (`docs/baseline/07-decision-log.md`) — four scoring concepts confirmed distinct (opportunity ranking / resume-to-job / source-confidence / review-gating); the general per-user configuration mechanism is resolved and built (NEW-032), but concepts 2–4 still need their own Currents designed. Not a hard blocker on Phase 3 continuing — opportunity ranking (concept 1) is done.
- **RECON-009** (`06-reconciliation-matrix.md`) — still unanswered: does the existing admin-curated shared-reasoning cache (`TE-CAREER-08`) satisfy Betsy's explicit member-opt-in requirement (NEW-022/023), or does a member-facing consent gate need to sit in front of it? Not addressed in her 2026-09-10 message answering RECON-001.
- **DEC-007** — free-trial gating model undecided. Out of this skill's scope; noted so it isn't silently assumed.
- **DEC-008** — self-hosted in-platform Claude Code access request. Out of this skill's scope.
- **DEC-009** — deterministic-vs-LLM classification per D01–D11 deliverable not yet done. Relevant to Phase 3/4 design but not blocking Phase 1's reconciliation work.
- **DEC-010** — R01–R12 personal career-fact conflicts open. Blocks Phase 7 outright.
- NEW-018 through NEW-031 (`docs/baseline/05-new-requirement-register.md`) are all still `Pending` — none has been read back to Betsy for confirmation yet.

## Changelog

### 2026-09-10 (latest) — RECON-001 resolved; personal scoring-configuration infrastructure built (NEW-032)

Betsy resolved RECON-001 (extend the existing Career Master, data-model enhancements allowed) and clarified DEC-006 to four distinct scoring concepts, then dictated a cross-cutting requirement: every methodology with a weight/threshold/formula needs a personal configuration seam — Salt Basin default, per-user override, never affecting other users, logged as NEW-032. Also asked whether to provision a graph database now for the eventual "graph on top of Supabase" plan — recommended not yet (DEC-012); the existing `entities`/`persons`/`relationships` + Tributary-registry model already provides graph-shaped modeling on Postgres, and Apache AGE (a Postgres extension) is the recommended next step over an external graph DB, only if a concrete need for it surfaces.

**Built for real this pass** (schema + backend + a working UI control, not just a plan):
- `journey_current_definitions` gained an additive `owner_user_id` column plus corrected unique indexes (the old `idx_current_def_key_global` would have collided a platform default with any personal override — replaced with `owner_user_id IS NULL` in its predicate, and a new `idx_current_def_key_user` added), in `server/db.js`'s bootstrap migrations.
- `server/lib/currentRegistry.js`: `resolveCurrentTemplate`/`getCurrent` now resolve 3-tier (platform → org → personal owner), mirroring `agent_definitions`' existing `resolveAgentRoster()` precedence. Added `setPersonalScoringWeights()` (validates: only existing dimensions, none missing, weights sum to 1.0 ± 0.01) and `clearPersonalScoringWeights()`. Fixed a jsonb-double-encoding risk while doing this (this codebase's own documented `db` adapter gotcha) by parsing `port_stages`/`minimum_carry`/`transition_rules`/`tributary_trigger_rules` before re-inserting them.
- `server/lib/careerOpportunityRollups.js`: all 4 call sites now resolve `career_match_scoring_v1` with the calling member's own `ownerUserId`, so a personal override actually takes effect when their opportunities are scored.
- `server/routes/careerPlacementAgents.js`: `GET/PUT/DELETE /api/career-agents/scoring-preferences` (member-scoped).
- `src/lib/api.js`, `src/lib/hooks/useCareerPlacementAgents.js`, `src/components/admin/CareerPlacementAgentsPanel.jsx`: a real "Opportunity Scoring Weights" control — shows Salt Basin default vs. your custom weights, lets a member reweight the 8 existing dimensions (must sum to 100%), save, or reset to default.

Verified: `node --check` on every changed server file, and a full `npm install && npm run build` (matching Render's exact build command) — both clean. **Not verified against a live database** — no DB credentials in this session; this needs exercising in a real running app before being called done per this program's own Stage 5 rule.

Wired to opportunity ranking (concept 1 of DEC-006 v2's four) only. Concepts 2–4 (resume-to-job scoring, source-confidence scoring, review-gating bands) need their own `journey_current_definitions` Currents built on this same seam.

### 2026-09-10 (later still) — Phase 1 reconciliation matrix populated (RECON-001–013)

Completed the side-by-side comparison DEC-011 called for: read `careerAtomRegistry.js`, `careerReconciliation.js`, `careerReasoningCompiler.js`, `careerOpportunityRollups.js`, `careerAtomMigration.js` in full, plus the `career_intake_documents`/`career_intake_runs`/`career_source_mappings`/`career_reconciliation_tasks`/`career_reasoning_approvals`/`career_reasoning_cache_candidates` table schemas. Registered 12 technical elements (`TE-CAREER-01` through `12`) in `04-technical-element-register.md` and 13 reconciliation rows (`RECON-001` through `013`) in `06-reconciliation-matrix.md`.

**Headline finding: `TE-CAREER-10`'s live `career_match_scoring_v1` weights (0.15/0.15/0.15/0.15/0.15/0.10/0.05/0.10) are byte-for-byte identical to `SRC-RESUME-06`/S03 §7's described model — confirms DEC-006/DEC-011's hypothesis directly, not just by inference.** Several NEW- items are already fully built and just need confirming, not building (NEW-020 user-testimony-as-evidence, NEW-026 applied-vs-generated distinction). Two are genuine, real conflicts needing Betsy's decision, not further code reading: RECON-001 (extend vs. replace the existing Atom-shaped Career Master with the spec's proposed record types) and RECON-009 (the existing shared-reasoning cache is admin-curated, not member-opt-in-gated, which doesn't match `SRC-RESUME-03`'s explicit-member-consent requirement). A few rows (RECON-010, calendar integration) are honest gaps or not-yet-checked, not confirmed absences.

No schema, route, or UI code was changed this pass — still read-only investigation, per the reuse-first non-negotiable. Phase 1 is not yet complete: R01–R12 (career-fact conflicts) and the NEW-018–031 read-back with Betsy are still outstanding before Phase 2 (Career Master Foundation build) can start on RECON-001's decision.

### 2026-09-10 (later same day) — Phase 1 started: reuse audit found major pre-existing overlap

Began the reuse-first audit before writing any Career Master schema/UI. Found a real, shipped "Career Foundation Sourcing & Reconciliation, Phase 2" system (2026-08-10) that already implements a conflict/ambiguous-mapping review queue (`career_reconciliation_tasks`, `CareerReconciliationPanel.jsx`), an evidence-provenance vocabulary on uploaded documents (`career_intake_documents.source_truth_status`, `CareerIntakePanel.jsx`'s `SOURCE_TRUTH`), and an admin-approved reasoning-pattern cache (`careerReasoningAdmin.js`/`careerReasoningCompiler.js`) that may already address the "no recurring LLM cost" goal (DEC-009). Logged as `DEC-011`. **This changes Phase 1's remaining work**: a full side-by-side comparison of this existing system against the new spec's evidence-state model and D01–D11 deliverables is required before Phase 2 (Career Master Foundation) writes anything new — not yet done to completion. No schema/route/UI code changed this pass; this was a read-only code audit.

Also diagnosed (separately from this skill, at Betsy's request) why Render deploys have been failing: confirmed via GitHub's own Render Deploy Monitor workflow logs that the latest deploy (`dep-dag1lp7avr4c73clbj60`, commit `3cdcf70`, 2026-09-08) is still `update_failed` as of now, and no new deploy has been attempted since (no push to `main`, no manual retry). Local `npm install && npm run build` reproduces cleanly with no errors — the build step itself is not the problem. `node server/index.js` crashes immediately without `DATABASE_URL`, confirming that's a hard requirement at boot; this session has no live Render/Supabase access to see the actual runtime error Render logged, or to confirm whether the configured `DATABASE_URL`/Supabase project is still valid and unpaused.

### 2026-09-10 — Package intake, skill/command created, no build work yet

Betsy supplied the full resume-product package (UX/trust requirement dictation + 8 career/product source files + 4 ChatGPT-authored consolidation documents) across this session. Work done this turn: preserved everything unmodified under `docs/baseline/intake/2026-09-10-salt-basin-resume-product/`; registered sources (SRC-RESUME-01–14), candidate requirements (NEW-018–031, all pending), and open decisions (DEC-006–010) in the existing `docs/baseline/0X-*.md` registers; created this skill, its `reference/phases.md`, and the `/salt-basin-resume-product` command. **No schema, route, or UI code was changed.** Next actionable step is Phase 1: get Betsy's read-back confirmation on the pending NEW- items and DEC-006, and run the reuse-first audit against existing Career Channel Rod tables before any Career Master schema work begins.
