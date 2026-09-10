# Salt Basin Resume Product — progress

Mutable state for the `salt-basin-resume-product` skill. Read first, update last, on every invocation.

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Reconciliation & reuse audit | not started |
| 2 | Career Master Foundation | not started |
| 3 | Scoring & review-gating engine | not started |
| 4 | Configurable templates & exports | not started |
| 5 | Contribution ledger & employer preview | not started |
| 6 | Disclosure, application & outcome tracking | not started |
| 7 | Betsy's actual Osaic materials | blocked — see Open blockers |

## Open blockers

- **DEC-006** (`docs/baseline/07-decision-log.md`) — three scoring concepts (opportunity ranking / requirement-transfer coverage / review-gating threshold) not yet confirmed distinct or reconciled against `careerOpportunityRollups.js`. Blocks Phase 3.
- **DEC-007** — free-trial gating model undecided. Out of this skill's scope; noted so it isn't silently assumed.
- **DEC-008** — self-hosted in-platform Claude Code access request. Out of this skill's scope.
- **DEC-009** — deterministic-vs-LLM classification per D01–D11 deliverable not yet done. Relevant to Phase 3/4 design but not blocking Phase 1's reconciliation work.
- **DEC-010** — R01–R12 personal career-fact conflicts open. Blocks Phase 7 outright.
- NEW-018 through NEW-031 (`docs/baseline/05-new-requirement-register.md`) are all still `Pending` — none has been read back to Betsy for confirmation yet.

## Changelog

### 2026-09-10 — Package intake, skill/command created, no build work yet

Betsy supplied the full resume-product package (UX/trust requirement dictation + 8 career/product source files + 4 ChatGPT-authored consolidation documents) across this session. Work done this turn: preserved everything unmodified under `docs/baseline/intake/2026-09-10-salt-basin-resume-product/`; registered sources (SRC-RESUME-01–14), candidate requirements (NEW-018–031, all pending), and open decisions (DEC-006–010) in the existing `docs/baseline/0X-*.md` registers; created this skill, its `reference/phases.md`, and the `/salt-basin-resume-product` command. **No schema, route, or UI code was changed.** Next actionable step is Phase 1: get Betsy's read-back confirmation on the pending NEW- items and DEC-006, and run the reuse-first audit against existing Career Channel Rod tables before any Career Master schema work begins.
