---
name: salt-basin-resume-product
description: Repeatable multi-session driver for the "Salt Basin Resume Product" spec — a Career Master Foundation of user-attested career records, evidence-graded transferable-skill translation, configurable resume/cover-letter templates, and a human-vs-AI contribution ledger, culminating in Betsy's own finished Osaic application. Use when Betsy invokes /salt-basin-resume-product, references "the resume product," "the Career Master Foundation," "the transferable-skill spec," "the Osaic application," or asks to advance the career/job-application build.
---

# Salt Basin Resume Product

This skill drives the "Salt Basin Resume Product" package supplied 2026-09-10: a source-grounded career-content system where every resume/cover-letter/job-title recommendation traces back to user-attested or document-supported evidence, carries an explicit review-gating threshold, and records human vs. AI contribution separately from factual provenance. It exists so Betsy can actually apply for jobs — including her own real Osaic application — using output the Salt Basin website itself produces, not so a generic "AI resume builder" gets bolted on.

This is a **sibling** to `salt-basin-pre-build` and `salt-basin-master-build`, not a replacement. It does not build Member identity or the 3D world — it builds the career/resume subsystem those already assume exists via `CLAUDE.md`'s "Career Channel Rod" and "Career Placement Agents" sections.

## Non-negotiables (apply on every invocation, no exceptions)

- **Never treat AI-generated wording as upgraded evidence.** The evidence-state vocabulary — user-attested / document-supported / externally verified / AI-proposed interpretation / disputed-unresolved — is load-bearing. An AI paraphrase of a user-attested fact stays user-attested in provenance; only the wording is AI-authored. User approval of wording is never independent verification of the underlying fact.
- **Never invent a missing career fact, credential, metric, or years-of-experience figure** to close a gap, even when asked to "make it stronger" or when a score is low. Below-threshold evidence gets a request for the user's own transfer rationale (a concrete situation/action/scope/result), never a fabricated bridge.
- **Never collapse the three distinct scoring concepts into one number.** (1) opportunity-priority ranking (S03 §7's existing 15/15/15/15/15/10/5/10 model — likely already `server/lib/careerOpportunityRollups.js`), (2) requirement-level demonstrated-transfer coverage (the spec's own proposed 75/50 rubric), (3) the review-gating threshold Betsy dictated directly (90%/75% — recommend-review vs. require-more-evidence bands). These answer different questions. See `docs/baseline/07-decision-log.md` DEC-006, still OPEN — do not silently pick one as canonical or display an unlabeled "match" gauge.
- **Reuse-first, always.** Before creating any new table for Career Master records, run the `salt-basin-channel-journey-architecture` skill against this phase's scope — `journey_data_rods` (`rod_type='career_master'`), `careerAtomRegistry.js`, and `careerOpportunityRollups.js` already exist per `CLAUDE.md`'s Career Channel Rod / Career Placement Agents sections and are the most likely home for this data. Do not assume the resume-product spec's own proposed schema (§3's Person/Employment/Achievement/Skill/... tables) requires new tables until that audit says so.
- **Never let this skill's scope absorb the platform-wide asks logged as DEC-007/008/009** (free-trial gating model, self-hosted in-platform Claude access, the "no recurring LLM cost after initial calls" architecture goal). Those are real and important but are separate, larger decisions — flag them, don't build them here.
- **Never finalize Betsy's own Osaic application materials** (`Osaic-Application-Review-Draft.md` → an actually-submittable DOCX/PDF/TXT) while `docs/baseline/07-decision-log.md` DEC-010 (the R01–R12 career-fact conflicts) is still OPEN, or without the exact Osaic posting/requisition. A draft stays a draft.
- Follow `CLAUDE.md`'s deployment-safety invariants: append-only block registry, additive-only shared config rows, schema-versioned JSON, seed/bootstrap never touches member rows. Run `salt-basin-config-audit` before and after structural work in every phase — thresholds, template families, and the evidence-state vocabulary belong in configuration, not hardcoded constants.

## Files

- `docs/baseline/intake/2026-09-10-salt-basin-resume-product/` — the full supplied package: `Resume-Product-Specification-v0.2.md` (deliverables D01–D11, Career Master schema, weighting model, negative-scenario rules, template families), `Source-Review-and-Career-Foundation.md` (S01–S09 inventory, R01–R12 reconciliation register, C01–C14 claim set), `Reusable-Production-Prompt.md` (Betsy's saved driver prompt), `Osaic-Application-Review-Draft.md` (draft personal application content), `Sources/` (originals). Read the specific document a phase needs, not the whole package.
- `docs/baseline/05-new-requirement-register.md` — NEW-018 through NEW-031, all still `Pending` (unvalidated by Betsy's own read-back). Do not treat any of them as confirmed requirements without checking this register's current status first.
- `docs/baseline/07-decision-log.md` — DEC-006 through DEC-010, all OPEN as of 2026-09-10. Check before every phase; several phases are blocked on one of these.
- `reference/phases.md` — static definition of this skill's phases and which spec sections/deliverables each covers.
- `docs/salt-basin-resume-product-progress.md` (repo root) — the **mutable** state: phase statuses, open blockers, changelog. Read first, update last, on every invocation.
- `CLAUDE.md`'s "Career Channel Rod" and "Career Placement Agents / Weekly Research & Outreach pipeline" sections — the existing shipped systems this skill must extend, not duplicate: `journey_data_rods`, `careerAtomRegistry.js`, `careerAtomMigration.js`, `careerOpportunityRollups.js`, `journey_rod_evidence` (source_tier column), `journey_current_definitions` (scoring/cadence Currents).
- `.claude/skills/salt-basin-channel-journey-architecture/SKILL.md` — invoke before any new Career Master table, per the reuse-first non-negotiable above.
- `.claude/skills/salt-basin-config-audit/SKILL.md` — invoked at the start and end of every phase's structural work.

## Workflow for every invocation

1. Read `docs/salt-basin-resume-product-progress.md` first. Check open blockers — if the phase about to run is blocked on a DEC-00x entry that's still OPEN, stop and say so rather than proceeding on an assumed default.
2. Determine which phase to run:
   - If the user named one (`/salt-basin-resume-product phase 2`, `/salt-basin-resume-product career-master`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked` (with its blocker now resolved).
3. Read only the spec section(s) that phase's row in `reference/phases.md` cites — via Grep/Read on the intake package, not the whole package.
4. Before structural work: run `salt-basin-channel-journey-architecture` in pre-implementation mode if the phase touches Career Master storage; run `salt-basin-config-audit` in pre-implementation mode regardless.
5. Do the actual build work: inspect current schema/routes (`server/db.js`, `server/routes/career*.js`, `server/lib/careerAtomRegistry.js`, `server/lib/careerOpportunityRollups.js`) → identify what's genuinely missing vs. already covered → extend additively → wire routes → wire UI where the phase calls for it. Make the structural change, not just a written plan.
6. Run `salt-basin-config-audit` again in post-implementation mode against the actual diff.
7. Update `docs/salt-basin-resume-product-progress.md`: phase status, changelog entry, and any newly-surfaced blocker (add it to `07-decision-log.md` too if it's a real open decision, following that document's format).
8. Report back concisely: which phase ran, what structurally changed, what's still blocked, what phase is next.

## Scope discipline

Seven phases (see `reference/phases.md`), each independently reviewable. Phase 7 (finalizing Betsy's actual Osaic materials) is deliberately last and gated on DEC-010 and the real posting — don't let pressure to "just finish the resume" skip the reconciliation phases ahead of it. If a phase's scope is still too large for one turn, say so and propose splitting it rather than doing a shallow pass across the whole phase.
