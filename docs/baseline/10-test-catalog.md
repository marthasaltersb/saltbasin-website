# Test Catalog

Two parts. **Part A** inventories the automated tests that exist and records results that were **actually executed** (with date and revision). **Part B** is the acceptance-scenario catalog for Stage 5. It stays mostly pending: scenarios for intended behavior need decided target requirements (08), and visual scenarios need approved design references (DEC-016). Part B contains only reproduction scenarios for factual questions raised during discovery. One of them, AT-04-001, was executed. It reproduced a finding about current behavior. It does not accept any target requirement.

A passing unit test on a pure function is **not** evidence that the user-facing behavior works in a browser. No scenario in Part B has been executed, so none is described as passed.

Generated companion: [inventory/tests.md](./inventory/tests.md) lists every test file, its runner, and its case names (`TE-TST-*` IDs).

## Part A — Existing automated tests

### Execution record — 2026-10-01, revision `e0ea466`, local Node v22.22.0

| Test ID | File | Runner | Result (2026-10-01) | Covers | Does not cover |
|---|---|---|---|---|---|
| T-EXIST-01 | `tests/agentContextRegistry.test.js` | node:test | 2/2 pass | Agent context policy resolution, cache key format, freshness-window rejection | Live agent behavior, UI |
| T-EXIST-02 | `tests/bestystaff-auth-proposal.test.js` | node:test | 10/10 pass | BestyStaff gate ordering, CAPTCHA placement, intent classification, password policy, TOTP round-trip (pure functions) | Intake UI, email, real CAPTCHA, login endpoint |
| T-EXIST-03 | `tests/crystal-orbit-chat.test.js` | node:test | 3/3 pass | Scenario **catalog** completeness/shape | Does not execute the scenarios |
| T-EXIST-04 | `tests/financialPolicyRegistry.test.js` | node:test | 4/4 pass | Default member-private scope; secured-debt classification | Financial endpoints (MOD-13) |
| T-EXIST-05 | `tests/metricVisualEncodingRegistry.test.js` | node:test | 4/4 pass | Visual-encoding registry validation and monotonicity | Rendered scenes |
| T-EXIST-06 | `tests/queryConvergence.test.js` | node:test | 7/7 pass | Weight sums; fixed-input relevance calculation | Integration |
| T-EXIST-07 | `tests/rodMathematics.test.js` | node:test | 18/18 pass | Weight sums; `calculateRodPosition` | Integration |
| T-EXIST-08 | `tests/scenarios.test.js` | node:test | 9/9 pass | 2,400-scenario registry determinism and governance | UI, persistence |
| T-EXIST-09 | `server/lib/agents/crystalWorldAuditAgent.test.js` | node:test | 4/4 pass with `node --test`; **fails under `npm test`** (Jest: "must contain at least one test") | Crystal world audit agent heuristics | — |
| T-EXIST-10 | `server/lib/agents/staticHeuristics.test.js` | Jest | pass (part of 22 Jest tests) | Static heuristics | — |
| T-EXIST-11 | `server/lib/seo.test.js` | Jest | pass | `buildSeoTags` / injection (MOD-06) | Middleware in request path; Netlify topology (DEC-018) |
| T-EXIST-12 | `server/lib/cronMatch.test.js` | Jest | pass | Cron expression matching | Scheduler runtime |
| T-EXIST-13 | `server/lib/agentStudioGovernance.test.js` | node:test | 3/3 pass with `node --test`; **fails under `npm test`** | Agent studio governance rules | — |
| T-EXIST-17 | `src/lib/experienceAssetPipeline.test.js` | node:test | 2/2 pass (run directly; **no npm script runs it**) | Asset pipeline | — |
| T-EXIST-18 | `src/lib/experienceCompiler.test.js` | node:test | 1/1 pass (run directly; no npm script) | Experience compiler | — |
| T-EXIST-19 | `src/lib/sceneManifest.test.js` | node:test | 3/3 pass (run directly; no npm script) | Scene manifest | — |
| T-EXIST-20 | `src/lib/uxRuntimeAudit.test.js` | node:test | 2/2 pass (run directly; no npm script) | UX runtime audit | — |

**`npm test` overall: FAILED** (exit non-zero: 3 Jest suites/22 tests passed, 2 suites errored). See DEC-006. The node:test total across the 14 node:test files is 72 passing tests, run file by file. No test runs in CI (REQ-01-009).

### Standalone verification scripts (not executed in this pass)

| ID | File | Status |
|---|---|---|
| T-EXIST-14 | `scripts/verify-metric-intelligence.mjs` | Not run. Content not reviewed |
| T-EXIST-15 | `scripts/verify-crystal-orbit-chat.mjs` (+ `--live`) | Not run. Partial read: includes static source-string checks against `server/db.js` (e.g. expects `CREATE TABLE IF NOT EXISTS email_delivery_preferences`) |
| T-EXIST-16 | `scripts/verify-besty-auth-proposal.mjs` | Not run |

### Coverage gap — stated plainly

Still **zero** automated tests drive a browser against a running instance as a logged-in user. All automated tests are pure-function or registry checks. The one browser interaction in this pass was a manual feasibility probe (recorded in [11](./11-verification-and-release-records.md)), not a test.

## Part B — Acceptance scenarios

### Scenario template (every Stage 5 scenario uses all of these fields)

Test ID · requirement IDs · mapping IDs · purpose and risk · environment · account role · tenant/ownership context · fixtures and initial data · viewport · preconditions · numbered user actions with the expected visible result after each · content, navigation, focus, keyboard, validation, loading, empty, error, success expectations · persistence after refresh/return · backend effects · visual expectations (grounded in an approved reference or explicit token, or "criterion missing — see DEC-016") · positive/negative/boundary/permission/recovery variants · evidence to capture · pass/fail criteria · cleanup · automation limits.

### Defined reproduction scenarios

#### AT-04-001

**Draft member content returned by the public site API (reproduction for DEC-015a)**

| Field | Value |
|---|---|
| Requirement IDs | REQ-04-005, REQ-05-002, REQ-03-004 |
| Mapping IDs | none yet (06 not started) |
| Purpose / risk | Establish whether an anonymous visitor can obtain a member's unpublished (draft/placeholder-status) section content from the public API. Privacy risk. |
| Environment | Local scratch environment (throwaway Postgres + `NODE_ENV=production` server). **Never production.** |
| Accounts | Member A (role `member`, fresh, created through the normal signup/conversion path); anonymous browser context |
| Fixtures | Member A has one Career Master entry (publish precondition, REQ-04-004) and a site whose page `home` contains one `live` section with text `PUBLIC-MARKER` and one `draft` section with text `DRAFT-MARKER-7f3a` |
| Viewport | 1280×800 (not visual) |
| Preconditions | Member A within trial (has `member_site`); visibility mode `unlisted` |
| Steps | 1. As Member A, sign in via `/login`, save the site draft, publish → UI reports success. 2. In a new anonymous context, open `/u/<slug>` → page shows `PUBLIC-MARKER`; `DRAFT-MARKER-7f3a` not visible. 3. In the same anonymous context, `GET /api/member-site/by-slug/<slug>` → inspect JSON. |
| Pass/fail | **Reproduced** if step 3's body contains `DRAFT-MARKER-7f3a`. **Not reproduced** if absent. Either outcome is recorded in 11 with the response body hash and screenshot of step 2. |
| Variants | Repeat with section status `placeholder`; repeat with page status `draft`; compare `GET /api/site/published` for the platform site (expected stripped per REQ-03-004). |
| Cleanup | Drop the scratch database. |
| Automation limits | Fully automatable (Playwright + HTTP). |
| **Execution 2026-10-01** | **REPRODUCED** on the local scratch environment (revision `e0ea466`). Deviation: Member A was created with the repo's `createMember()` directly on the scratch DB because the product's member-creation path is currently blocked (REQ-08-010, DEC-007). All later steps used the real API and a real Chromium page. Step 2: `PUBLIC-MARKER` visible and `DRAFT-MARKER-7f3a` not visible. Step 3: the anonymous response contained both. Evidence: `evidence/2026-10-01/AT-04-001-*`. Variants (placeholder, draft page, platform comparison) **not executed**. Run by a throwaway script, not yet a committed test. Record: [11](./11-verification-and-release-records.md) VR-2026-10-01-02. |

### Pending

All other Part B scenarios are blocked on target decisions (08) and approved visual references (DEC-016). Writing them now would assert behavior nobody has confirmed as intended.
