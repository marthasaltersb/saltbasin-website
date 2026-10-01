# Verification & Release Records

Per Stage 6, each future patch release records here: registered sources and requirement IDs affected, updated definitions/mappings/tasks, new or updated scenarios (with a reproduction for bugs), actual run results with evidence, remaining gaps, and release linkage.

**Rule:** nothing in this documentation area counts as "passed" unless a record here shows an executed run with evidence. Records describe what was observed. They never extrapolate beyond the steps actually run.

No release has been processed through this program yet. The records below are **discovery-stage verification runs** with no release linkage. They establish facts about the current state and do not accept any target requirement.

## Record format

| Field | Meaning |
|---|---|
| Record ID | `VR-<date>-<nn>` |
| Revision | Commit inspected/run |
| Environment | Where it ran (never production unless explicitly authorized) |
| Scope | Scenario/test IDs and requirement IDs |
| Procedure | What was done, including deviations |
| Result | Observed outcome per step |
| Evidence | Files under `evidence/<date>/` |
| Gaps | What this run does **not** establish |
| Release linkage | Release/PR, or "none (discovery)" |

---

### VR-2026-10-01-01 — Local verification environment feasibility probe

| Field | Value |
|---|---|
| Revision | `e0ea466` (branch `claude/compassionate-wozniak-7vx4jr`, identical to `main` at session start) |
| Environment | Throwaway PostgreSQL 16 cluster on the session container (`/var/tmp/sb-baseline-pg`, port 55432, database `sb_baseline`). Server `NODE_ENV=production PORT=3901` with no `BREVO_API_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_*`, or `RECAPTCHA_SECRET_KEY`, so no external side effects were possible. Chromium 1194 via globally installed Playwright 1.56.1. **Not production. No production credential was used or available.** |
| Scope | REQ-01-001, REQ-01-002, REQ-01-008, REQ-01-010, REQ-02-001, REQ-02-011, REQ-02-016, REQ-08-001, REQ-09-002 |
| Procedure | 1. `npm ci --ignore-scripts`. 2. Imported `server/db.js` (runs `bootstrap()`) twice against the empty database and compared catalog counts. 3. Ran `ensureSeeded()` with scratch `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD`. 4. `npx vite build` (the `postbuild` hook was deliberately skipped). 5. Started `server/index.js`. 6. `curl` `/api/health`, `/`, `/api/auth/me`. 7. Chromium: opened `/`, then `/login`, filled email and password, submitted, then read `/api/auth/me`. 8. `POST /api/leads` with a scratch email. |
| Result | Step 2: both runs succeeded with identical catalog (191 tables, 2,128 columns, 488 indexes, 1,894 constraints, 0 views/functions/triggers/policies). Only Postgres "already exists, skipping" notices. Step 3: admin created with `must_change_password=false`. Step 4: exit 0. Step 6: health `{"ok":true,"db":"ok"}`, `/` 200, `/api/auth/me` → `{"user":null}`. Step 7: login succeeded, landed on `/world`, `/api/auth/me` returned the admin. Browser console showed failed external CDN loads (sandbox proxy). Step 8: 200 with `password` and `token` in the body. Server logged `[email] blocked pending recipient confirmation` for the lead confirmation and the new-lead alert. |
| Evidence | `evidence/2026-10-01/VR-01-public-home.png`, `VR-01-login.png`, `VR-01-admin-after-login-world.png` |
| Gaps | Not a test. Not repeatable without the setup steps (Stage 5 should script them). Did not exercise the `postbuild` hook, external integrations, or production topology (Netlify front, Render origin). The screenshots are **observations, not visual baselines**: no approved reference exists (DEC-016). |
| Release linkage | none (discovery) |

### VR-2026-10-01-02 — AT-04-001 reproduction: draft member content in public API

| Field | Value |
|---|---|
| Revision | `e0ea466` |
| Environment | As VR-2026-10-01-01 |
| Scope | AT-04-001 → REQ-04-005, REQ-05-002. Incidentally observed: REQ-02-006, REQ-02-007, REQ-02-014, REQ-04-004, REQ-08-003, REQ-08-010, REQ-14-005 |
| Procedure | 1. Attempted product member creation: `POST /api/members/signup` → 403 invite-only. Lead conversion of the scratch lead: unlock, add contact email (`verificationSent:true`, but the email was blocked and only a token hash is stored), convert → 409 verify-email-first. 2. **Deviation:** created Member A with `createMember()` directly on the scratch DB and inserted a `member_profiles` row (`slug member-a`, `unlisted`). 3. Via API as Member A: login (`mustChangePassword:true`) → any call 428 `password_change_required` → change password → 428 `career_terms_required` → consent with 4 acknowledgements → `POST /api/career/jobs` → `{id:1}` → added one `live` and one `draft` text section with `heading` markers → save → publish `{ok:true}`. 4. Anonymous `curl` of `/api/member-site/by-slug/member-a`. 5. Anonymous Chromium visit to `/u/member-a`, capturing the page's own network response. |
| Result | Step 4: response contained `PUBLIC-MARKER` **and** `DRAFT-MARKER-7f3a` (with `"status":"draft"`). Step 5: rendered text contained `PUBLIC-MARKER`, did **not** contain `DRAFT-MARKER-7f3a`, while the page's own network response contained it. **Finding reproduced.** A first attempt used field `body`, which `TextBlock` does not render, and was corrected to `heading`. |
| Evidence | `evidence/2026-10-01/AT-04-001-step2-public-page.png`, `AT-04-001-step3-anonymous-api-excerpt.json` (scratch fixture data only) |
| Gaps | Variants not run (placeholder status, draft page, other visibility modes, platform-site comparison). The run was a throwaway script, not a committed automated test. Member creation bypassed the product path (deviation 2). |
| Release linkage | none (discovery) |

### VR-2026-10-01-03 — Existing automated test suites

| Field | Value |
|---|---|
| Revision | `e0ea466` |
| Environment | Session container, Node v22.22.0 |
| Scope | T-EXIST-01 … T-EXIST-20 (see [10](./10-test-catalog.md) Part A) |
| Procedure | `node --test <file>` for each of the 14 `node:test` files. Then `npm test` (Jest) with `DATABASE_URL` pointed at the scratch DB. |
| Result | node:test: 14 files, 72 tests, all pass. `npm test`: 3 suites / 22 tests pass, **2 suites fail to run** (node:test files matched by Jest's `testMatch`). Overall `npm test` **failed**. |
| Evidence | Console output summarized in [10](./10-test-catalog.md). Raw logs were not retained in the repo. |
| Gaps | All are pure-function/registry tests. None exercises a browser, HTTP route, or database. |
| Release linkage | none (discovery) |
