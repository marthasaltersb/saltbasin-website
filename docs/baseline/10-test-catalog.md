# Test Catalog

This document has two parts: **Part A** is a real inventory of tests that exist today (evidence-backed, Stage 1). **Part B** — the acceptance-scenario catalog called for by the objective's Stage 5 — is a **pending stub**: it cannot be populated without either (a) reconciled target requirements from the new design documents, or (b) an explicit decision to first catalog scenarios for existing, undisputed behavior only. Neither has happened yet.

No test below is described as verifying anything beyond what its own assertions check. Passing a unit test on a pure function is not evidence that the corresponding user-facing behavior works end-to-end in a browser — that distinction matters throughout this document.

## Part A — Existing automated tests (as of inspected revision)

### `node:test` suite — run via `npm run test:scenarios`, `test:crystal-orbit`, `test:bestystaff` (see `package.json`)

| Test ID | File | What it actually asserts | What it does NOT verify |
|---|---|---|---|
| T-EXIST-01 | `tests/agentContextRegistry.test.js` | `resolveAgentContextPolicy('bestystaff_lead_intake_v1')` returns expected `agentId`/`sourceIds`; `renderContextCacheKey` output format; that the context cache rejects a policy with no configured positive freshness window | Any live agent behavior, any UI, any actual cache backend |
| T-EXIST-02 | `tests/bestystaff-auth-proposal.test.js` | Gate-sequence ordering (`relationship, primary_email, captcha, context_consent, ...`), CAPTCHA placement, lead-intent classification (`career`/`b2b`/`other`) is deterministic for given strings, password policy rules, TOTP generation/verification round-trip | The actual BestyStaff intake UI, real email delivery, real CAPTCHA rendering, real login flow |
| T-EXIST-03 | `tests/crystal-orbit-chat.test.js` | A **fixture catalog** (`tests/fixtures/crystal-orbit-chat-scenarios.json`) covers required capability areas (`entry, orbit, world, organization, journey, career, lineage, visual, scoring, responsive, account, email, security, regression`) and that all `p0`-priority scenarios declare reproducible viewports | This is a check that the *scenario catalog is complete/well-formed* — it does **not** execute those scenarios against a running app or browser. `npm run verify:crystal-orbit:live` (a separate script, not yet content-reviewed — SRC-TEST-03) may be the piece that does that; unconfirmed. |
| T-EXIST-04 | `tests/financialPolicyRegistry.test.js` | Default scope for personal financial connections is `MEMBER_PRIVATE`; secured debt is never silently reclassified as unsecured | No live financial-connection flow, no OAuth, no real data |
| T-EXIST-05 | `tests/metricVisualEncodingRegistry.test.js` | Visual-encoding registry validation passes; specific metric→visual-channel mappings (`distance_from_query_context` → `QUERY_RELEVANCE`, `rod_fill` → `STAGE_COMPLETENESS`); monotonicity of `resolveQueryDistance` | No rendered 3D scene, no visual regression, no actual pixel output |
| T-EXIST-06 | `tests/queryConvergence.test.js` | Composite methodology weight sets each sum to 1; a specific weighted-relevance calculation given fixed inputs | No integration with the rest of the app |
| T-EXIST-07 | `tests/rodMathematics.test.js` | Composite weight sets sum to 1 (except `channelMaturity`, deliberately independent); a specific `calculateRodPosition` result given fixed stage/requirement inputs | No integration with the rest of the app |
| T-EXIST-08 | `tests/scenarios.test.js` | The 2,400-scenario registry loads with unique IDs; signature order-independence; exact/nearest resolution determinism and boundedness; novel-combination handling creates a pending-review observation, not a fabricated permanent ID; metric-dependency lookups use governed `MET-\d{3}` IDs | No UI, no persistence beyond the in-memory registry under test |

### Jest suite — run via `npm test` (native ESM, `server/**/*.test.js` only per `jest.config.js`)

| Test ID | File | Status |
|---|---|---|
| T-EXIST-09 | `server/lib/agents/crystalWorldAuditAgent.test.js` | Located; content not yet read into this catalog (Stage 2 follow-up) |
| T-EXIST-10 | `server/lib/agents/staticHeuristics.test.js` | Located; content not yet read |
| T-EXIST-11 | `server/lib/seo.test.js` | Located; content not yet read |
| T-EXIST-12 | `server/lib/cronMatch.test.js` | Located; content not yet read |
| T-EXIST-13 | `server/lib/agentStudioGovernance.test.js` | Located; content not yet read |

### Standalone verification scripts (not part of either test runner)

| ID | File | Status |
|---|---|---|
| T-EXIST-14 | `scripts/verify-metric-intelligence.mjs` | Located via `package.json` `verify:metrics`; content not yet read |
| T-EXIST-15 | `scripts/verify-crystal-orbit-chat.mjs` (+ `--live` variant) | Located; content not yet read. The `--live` flag name suggests this may be the piece that actually drives a running app — unconfirmed |
| T-EXIST-16 | `scripts/verify-besty-auth-proposal.mjs` | Located; content not yet read |

## Coverage gap — stated plainly

**Zero of the tests inventoried above drive a real browser against a running instance of the application as a logged-in user.** Every `node:test`/Jest test found in this pass verifies pure functions, configuration registries, or fixture-catalog completeness/shape — not rendered UI, not navigation, not persistence-after-refresh, not visual appearance, not authentication flows as a user would experience them. This is exactly the gap Stage 5 of the governing objective is meant to close. Whether `scripts/verify-crystal-orbit-chat.mjs --live` or the repo's `/verify` skill (referenced in `CLAUDE.md`) already does some of this is an open question for Stage 2 — not yet confirmed either way, so it is not claimed here as either existing coverage or a gap.

## Part B — Acceptance-scenario catalog (Stage 5)

**Pending.** Per the governing objective, acceptance scenarios must be grounded in reconciled requirements ("visual expectations... grounded in approved design references or explicit tokens," "where the intended appearance is unspecified, record the missing criterion"). Writing scenario tables now, before the new design documents exist, would mean asserting behavior nobody has confirmed is the intended target — the objective explicitly prohibits treating an unreviewed current screen as proof of intended design. This section will be populated module-by-module as target behavior is decided in Stage 4.

No test in this document is described as "passed" unless it was actually executed and its output observed. None have been re-run in this pass; the assertions above are read from source, not from an executed run.
