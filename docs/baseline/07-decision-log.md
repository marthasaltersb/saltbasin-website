# Decision Log

Conflicting or ambiguous facts found during discovery, and material product decisions as they arise during reconciliation. Entries are never silently resolved in favor of "existing code" or "newer prose" — each stays open until you resolve it, per the governing instruction that neither an author's identity nor the existence of code establishes which conflicting requirement is correct.

Status values: `OPEN` (needs your decision or confirmation), `RESOLVED` (decision recorded, with who/when), `INFORMATIONAL` (a drift worth knowing about but not a product decision — e.g. stale documentation).

---

### DEC-001 — `CLAUDE.md` states "No test runner is configured"; the repository has one

**Status:** INFORMATIONAL — flagged for you; does not block anything, but `CLAUDE.md` is stale on this point.

**Evidence:**
- `CLAUDE.md`: *"No test runner is configured. Verification is done via the `/verify` skill against the running app."*
- `package.json` (SRC-CFG-02): `"test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"`, plus `jest.config.js` (SRC-CFG-04) explicitly configuring native-ESM Jest scoped to `server/**/*.test.js`.
- 8 files under `tests/*.test.js` using Node's built-in `node:test` runner (`npm run test:scenarios`, `test:crystal-orbit`, `test:bestystaff` each target one of these).
- 5 files under `server/lib/**/*.test.js` intended for the Jest runner (`agentStudioGovernance.test.js`, `seo.test.js`, `cronMatch.test.js`, and two under `server/lib/agents/`).

**Why it matters:** the reconciliation objective explicitly asks for "reusable tests" and a "test catalog," and Stage 6 asks that every future bug/requirement get a regression test "using the repository's appropriate existing framework where practical." There are, in fact, **two** existing frameworks in simultaneous use (Node's built-in runner for `tests/*`, Jest for `server/lib/**`), and `CLAUDE.md` describes neither. See `10-test-catalog.md` for what each currently verifies (all pure-logic/config-registry checks — none are browser/user-journey tests).

**Open question for you:** should `CLAUDE.md` be updated to reflect this, and should new tests default to Jest (per `jest.config.js`'s own comment: "React components under `src/` need jsdom + `@testing-library/react`, a separate future addition — not added here")? This documentation program will not silently pick one — flagging for your call before Stage 5 test authoring starts.

---

### DEC-002 — `.env.example` omits variables `CLAUDE.md` documents as required

**Status:** OPEN

**Evidence:**
- `CLAUDE.md` "Key env vars" lists 8 items as real: `DATABASE_URL`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `APP_BASE_URL`, `BREVO_API_KEY`, `ANTHROPIC_API_KEY`, plus 14 OAuth provider `{PROVIDER}_CLIENT_ID`/`{PROVIDER}_CLIENT_SECRET` pairs (28 more variables).
- `.env.example` (SRC-CFG-01) declares only 5: `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `PORT`.
- Missing from the template entirely: `DATABASE_URL` (the Supabase connection string — without this the app per `CLAUDE.md`'s own architecture description cannot reach its database at all), `TOKEN_ENCRYPTION_KEY` (required for OAuth token encryption per `server/lib/crypto.js`), `APP_BASE_URL`, `BREVO_API_KEY`, and all 28 OAuth credential variables.

**Why it matters:** anyone (including the "export locally" workflow discussed earlier in this session) following `.env.example` alone would get a server that cannot start correctly, per `CLAUDE.md`'s own description of what's "required." This is either (a) `.env.example` is stale and should be brought up to date, or (b) some of these are genuinely optional with undocumented fallback behavior and `CLAUDE.md`'s "required" framing is what's stale, or (c) `DATABASE_URL` is deliberately omitted from the template for a reason not recorded anywhere inspected so far.

**Decision needed:** which of (a)/(b)/(c), and should `.env.example` be corrected as part of this program's hygiene pass or left alone. Not resolved — no action taken.

---

### DEC-003 — No staging/preview environment exists; `main` deploys straight to production on every push, gated only by build success

**Status:** OPEN (raised with you earlier this session; formally logged here as it directly affects Stage 5's "suitable test environment" requirement)

**Evidence:** `render.yaml` (`branch: main`), `DEPLOY.md` ("Push to `main` on GitHub. Both Render and Netlify auto-deploy from `main` on every push"), and `.github/workflows/scheduled-production-promotion.yml` (SRC-CI-03), which squash-merges labeled PRs straight to `main` after `npm ci && npm run build` — **no `npm test` step in that gate**.

**Why it matters:** Stage 5 of the governing objective requires exercising the running application "through its real browser interface" and explicitly says to prevent test actions from modifying production user data, and to use a suitable test environment "when authorized and feasible." Today there is no non-production environment to run that verification against — only local dev (`npm run dev` against whatever `DATABASE_URL` the developer points at) and production itself.

**Decision needed:** for Stage 5, will verification run against (a) local dev only, (b) a new staging Render/Netlify environment + separate database to be provisioned, or (c) production with tightly scoped, clearly-labeled test accounts/data and explicit safeguards against real side effects (emails, purchases). Not resolved.

---

### DEC-004 — `migrations/` directory's relationship to `server/db.js`'s boot-time migration mechanism is unconfirmed

**Status:** OPEN (Stage 2 item, logged now since it surfaced during Stage 1)

**Evidence:** `CLAUDE.md` states schema migrations run "at every boot via idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` calls at the bottom of `db.js bootstrap()`." Separately, a `migrations/` directory exists containing one dated `.sql` file (`20260809_member_crystal_worlds.sql`) and three non-SQL artifacts (a migration report, a data summary, a terminology-migration registry).

**Why it matters:** if `migrations/*.sql` is a second, separate mechanism from the `db.js bootstrap()` one, it needs its own entry in the technical-element register and its own invocation path needs to be found (is it run manually? by a script? not yet wired up?). If it's a historical record only, that should be stated so it isn't mistaken for an active mechanism.

**Decision needed:** none from you yet — this is queued for direct code inspection in Stage 2 before it needs your input.

---

---

### DEC-005 — No known localization/multi-language field architecture exists yet; NEW-006 requires one

**Status:** OPEN (Stage 2 investigation needed before Stage 4 target-spec design)

**Evidence:** `NEW-006` (see `05-new-requirement-register.md`, from live dictation SRC-LIVE-01) requires that every field be able to hold/derive an English-translated value regardless of the language used to provide input, with the original-language input retained as evidence. Per `CLAUDE.md`, section content today lives in untyped `section.fields` objects with no documented localization concept, and no i18n/locale table or mechanism has been found anywhere in this pass's directory listings of `server/db.js`, `server/lib/`, or `src/`. This is not a confirmed absence (Stage 2 hasn't read file contents yet) — but no evidence of one exists so far either.

**Why it matters:** this is a real, potentially wide-reaching data-model decision — single canonical value + translation audit log, vs. genuine per-locale value storage, vs. something else — with backward-compatibility implications across every existing member's `section.fields` data (per this repo's own deployment-safety invariant: schema-versioned JSON, no silent reinterpretation of old data).

**Decision needed:** none from the user yet — queued as a Stage 2 investigation (confirm whether any i18n mechanism exists at all) before this becomes a Stage 4 target-spec design decision.

---

## Status updates from the 2026-10-01 Stage 2 pass (revision `e0ea466`)

These updates add evidence without removing the original entries above.

- **DEC-001 → superseded in part by DEC-006.** The two-framework finding stands, and it is now known that `npm test` **fails** at this revision (see DEC-006).
- **DEC-002 → still OPEN, widened.** The generated [env-vars inventory](./inventory/env-vars.md) lists 78 names (`.env.example` declares 5). Additionally: `SESSION_SECRET` is described in CLAUDE.md as the cookie-signing secret but is only read by `server/routes/analytics.js:20`, since session cookies are unsigned random tokens. Base URLs are split between `APP_BASE_URL` and `PUBLIC_BASE_URL`, each with hard-coded `https://saltbasin.net` fallbacks (`server/routes/auth.js:32,203`).
- **DEC-003 → still OPEN, new evidence.** A local verification environment is **feasible**. The repo's own bootstrap ran against a throwaway Postgres 16, the production build served locally, and a real Chromium login through `/login` succeeded (see [11](./11-verification-and-release-records.md) VR-2026-10-01-01). Separately, `src/components/admin/TestLoginRedirect.jsx` (`/test/login`) expects a `VITE_TEST_BASE_URL` "replica deployment", which is not declared anywhere, so someone intended a hosted test environment.
- **DEC-004 → RESOLVED as a finding (2026-10-01, by direct inspection; no user decision needed for the fact itself).** `migrations/20260809_member_crystal_worlds.sql` is **not** applied by any code path and its 8 tables are referenced by **no** code. It is neither the boot mechanism nor a wired second mechanism. A **third** mechanism was also found: lazy runtime DDL (`server/lib/backlogIntelligenceSchema.js`, 12 tables). See MOD-01 REQ-01-002. Whether the orphan SQL file is an abandoned design or future work is a product question, now tracked in DEC-019.
- **DEC-005 → still OPEN.** Confirmed: no i18n catalog, locale preference, or `fieldMeta.translations` consumer exists in code. CLAUDE.md's "Internationalization / translation model (design-stage — not yet implemented)" section (added 2026-09-05) records the intended shape, and it is design intent, not implementation.

---

### DEC-006 — `npm test` fails at this revision; tests run nowhere in CI

**Status:** OPEN

**Evidence (executed 2026-10-01):** `npm test` (Jest, `testMatch: server/**/*.test.js`) → 3 suites pass (22 tests), **2 suites fail** with "Your test suite must contain at least one test": `server/lib/agentStudioGovernance.test.js` and `server/lib/agents/crystalWorldAuditAgent.test.js` are written for `node:test`, but Jest's pattern picks them up. Run with `node --test`, they pass (3 + 4). Four further `node:test` files under `src/lib/*.test.js` are run by **no** npm script (they pass when run directly). No GitHub workflow runs any test (REQ-01-009).

**Decision needed:** choose one runner per location (or exclude `node:test` files from Jest), add a single `npm test` that runs everything, and decide whether a test gate belongs in the promotion workflow. Also: which framework hosts Stage 5 browser tests. Playwright 1.56 is available in this environment globally, but it is not a project dependency.

### DEC-007 — Outbound email authorization gate blocks most transactional email

**Status:** OPEN (material)

**Evidence:** `server/lib/email.js:71-82` (commit `dfc422d`, 2026-08-10, "Require confirmation for outbound email"). Sends without an authorization mode are skipped. Seven senders pass none (MOD-09 REQ-09-002): lead confirmation (which carries the lead's password), lead email verification, new-lead alert to the owner, contact-form-to-member, member entitlement welcome, both daily digests, and the admin test email. **Runtime probe:** creating a lead locally logged `[email] blocked pending recipient confirmation` for both the visitor confirmation and the owner alert.

**Further runtime evidence (2026-10-01):** adding a contact email to a lead returned `verificationSent:true` while the verification email was blocked. Only a hash of the token is stored, so the email can never be verified, and lead → member conversion then failed with 409 "Verify at least one email address before becoming a member." Direct signup is invite-only by default (DEC-011), so **no new member can be created through the product** at this revision (REQ-08-010, REQ-08-003), unless an untraced path such as BestyStaff's `convert_lead_to_member` tool bypasses this.

**Why it matters:** if unintended, no new members can join, the owner is not alerted to new leads, leads cannot recover credentials (REQ-08-004), and the admin test-email diagnostic cannot detect the problem (REQ-03-010). If intended, these senders need a recipient-confirmation flow that does not exist yet.

**Decision needed:** for each sender, should it send automatically (and under which authorization mode), require explicit confirmation, or stay disabled?

### DEC-008 — Platform roles are undefined; `users.role` defaults to `'admin'`

**Status:** OPEN

**Evidence:** Declared catalog: `users.role TEXT DEFAULT 'admin'`, no CHECK constraint. Code compares against `admin` and `member` only. All four current insert sites set `role` explicitly, so no live defect is shown, but a future insert that omits `role` would create an administrator. `org_memberships.role` is a separate, also unenumerated, vocabulary.

**Decision needed:** the authoritative role list (platform and org), and whether the default should change to the least-privileged role with a CHECK constraint. That would be a schema change, with migration implications to be specified in 08.

### DEC-009 — Unthrottled credential and unlock endpoints

**Status:** OPEN

**Evidence:** In-process limiter (10/15 min/IP) covers `/api/auth/login`, `/reset-request`, `/sso/discover` only. No limiter on: `/api/auth/landing-gate/unlock` (plain-text password compare), `/api/auth/email-recover` (comment claims "upstream" limiting, but none is declared), `/api/member-site/by-slug/:slug/unlock`, `/api/leads/public/:publicId/unlock`. reCAPTCHA is skipped entirely when `RECAPTCHA_SECRET_KEY` is unset. `PATCH /api/portfolio-requests/:id/notes` accepts sequential ids without a token for 1 hour. The limiter is per-process and resets on restart.

**Decision needed:** acceptable brute-force posture per endpoint, and whether limits must survive restarts.

### DEC-010 — Bootstrap admin fallback credentials

**Status:** OPEN

**Evidence:** `server/data/seed.js:29-34` creates the first admin with `ADMIN_INITIAL_PASSWORD` or a hard-coded literal (`server/data/seed.js:30`), and **without** `must_change_password` (runtime probe confirmed `mustChangePassword:false`). This only fires when `users` is empty. `render.yaml` prompts for the variable (`sync:false`).

**Decision needed:** fail boot when the variable is unset in production, and/or force a password change for the bootstrap admin.

### DEC-011 — Two signup paths

**Status:** OPEN

**Evidence:** `/signup` redirects to the BestyStaff intake (`src/App.jsx:SignupRoute`), and lead conversion creates members. `POST /api/members/signup` (public) still creates members directly via `createMember`. `SignupPage.jsx` is kept unreferenced on purpose.

**Runtime 2026-10-01:** `POST /api/members/signup` returned 403 "Member creation is currently invite-only." because `PUBLIC_MEMBER_SIGNUP_ENABLED` is unset, so the direct API is already gated by default. The live value of the variable is unknown.

**Decision needed:** confirm lead conversion as the canonical path, and whether `PUBLIC_MEMBER_SIGNUP_ENABLED` should ever be true in production.

### DEC-012 — CMS editing semantics: last-write-wins, coupled config publish, no restore

**Status:** OPEN

**Evidence:** Draft saves replace the whole document with no version check (REQ-03-001, REQ-04-003). Publishing the site also publishes config (REQ-03-003). Config edits are not lineage-captured (REQ-03-002). Lineage endpoints are read-only, so there is no restore or rollback.

**Decision needed:** whether concurrent editing, separate config publish, and version restore are target requirements. They interact with NEW-008 ("append-only edit/version log — never silent overwrite") in the 2026-09-05 intake.

### DEC-013 — Workspace scopes beyond `admin`/`member`

**Status:** OPEN (documentation)

**Evidence:** `MemberDashboard.jsx` selects among three AdminShell scopes: `org-admin` (with `?org=`), `admin` (requires `?scope=admin` and admin role), and `member`. CLAUDE.md documents two. Admin login lands on `/world` (runtime probe), not on the admin CMS.

**Decision needed:** confirm the intended scope set and entry points so navigation acceptance tests can be written.

### DEC-014 — Member site editing ends after the 90-day trial unless paid or sponsored

**Status:** OPEN (material product rule)

**Evidence:** REQ-04-001/002. Site and config save/publish require feature `member_site`. Non-admins auto-receive a 90-day `member_career_foundation` trial including it, and afterwards get HTTP 402. Publishing also requires at least one Career Master entry (REQ-04-004). Only the trial offering is seeded. The live offering catalog is unknown.

**Decision needed:** confirm the intended post-trial behavior, including whether an already-published site stays live and readable. Code leaves published sites readable, but this hasn't been verified at runtime.

### DEC-015 — Member public data exposure rules

**Status:** OPEN (privacy)

**Evidence:**
- (a) `/api/member-site/by-slug/:slug` returns draft- and placeholder-status pages and sections in JSON, hidden only by the browser (REQ-04-005). The platform site strips them server-side (REQ-03-004).
- (b) Public member config uses a deny-list, removing only `integrations` (REQ-04-006).
- (c) `GET /api/members/:slug` serves the legacy published profile with no visibility-mode check (REQ-04-007).
- (d) The featured banner falls back to the member's **email** as display name (REQ-04-009).
- (e) The resume-URL resolver ignores visibility mode (REQ-04-010).
- (f) Password-mode sites fail open when no password is set (REQ-04-005).

**Runtime 2026-10-01:** (a) **reproduced** by AT-04-001 on the local scratch environment.

**Decision needed:** confirm the intended public data contract for member sites: what an anonymous visitor may receive for each visibility mode. (b)–(e) are static evidence only.

### DEC-016 — No approved visual design reference

**Status:** OPEN (blocks visual acceptance criteria)

**Evidence:** Design tokens and 6 themes exist ([design-tokens.md](./inventory/design-tokens.md)), but there is no breakpoint scale (13 ad-hoc widths), no approved screenshots or mockups for any screen, and no layout specs. Repo folders `brand-assets/` (82 SVG files) and `pptx_analysis/` (59 extracted PowerPoint XML parts and 1 JPEG) exist, but neither is yet assessed as an approved design reference. The runtime screenshot of `/world` shows overlapping island labels at 1280×800, recorded as an observation and not a defect, because there's nothing to judge it against.

**Decision needed:** which artifacts are approved visual references, per screen, so Stage 5 visual baselines aren't generated from unreviewed screens.

### DEC-017 — Are `/output/*` documents public?

**Status:** OPEN

**Evidence:** CLAUDE.md says output routes "are not authed — they read from published state or URL params". In code, 5 outputs depend on admin-only `/api/backlog/*`, and the resume output reads the member's **draft** when `owner=me` (REQ-07-001).

**Decision needed:** intended audience per output route.

### DEC-018 — Hosting topology consequences

**Status:** OPEN

**Evidence:**
- (a) `saltbasin.net` is served by Netlify, which rewrites non-API paths to static `index.html`, so the server-side SEO injection on Render (REQ-06-002) is not in the public request path (depends on live DNS, unverified).
- (b) All scheduled jobs are in-process on a single free-plan Render service (REQ-01-007).
- (c) A "keepalive workflow" referenced in `server/index.js:205` does not exist in `.github/workflows`.
- (d) DEPLOY.md says Netlify proxies `/uploads/*`, but `netlify.toml` does not.

**Decision needed:** whether link-unfurl SEO is a requirement (if so, the topology or the injection point must change), and the reliability expectation for scheduled jobs.

### DEC-019 — CLAUDE.md statements contradicted by code at `e0ea466`

**Status:** OPEN (documentation corrections; none applied, since this pass changed no existing guidance)

**Evidence:**
1. "No test runner is configured" → two runners exist (DEC-001/006).
2. "Fresh database fails on `organization_profiles` FK ordering" → did not reproduce: bootstrap succeeded twice on empty Postgres 16.
3. "`npm run seed` re-seeds admin user + backlog items" → seeds platform site/config rows and the admin only.
4. "`SESSION_SECRET` — cookie signing secret" → not used for cookies.
5. "Blocks accept `{section, config, mode, memberSlug}`" → blocks receive `{section, config, memberSlug, liveSlugs}`.
6. "`AdminShell` `scope` prop `'admin'` or `'member'`" → also `org-admin`.
7. "`/output/*` routes are not authed — they read from published state or URL params" → partially false (DEC-017).
8. Schema-mechanism description omits lazy runtime DDL and the unapplied `migrations/` SQL file.

**Decision needed:** approve correcting CLAUDE.md (a documentation-only task), and decide the orphan migration file's fate.

### DEC-020 — Row-level security and Supabase API exposure

**Status:** OPEN (security; requires live inspection)

**Evidence:** The repository declares no RLS policies and enables RLS on no table (declared catalog). All authorization lives in Express. On Supabase, `public`-schema tables without RLS are readable and writable through the project's auto-generated REST/GraphQL APIs by anyone holding the anon key, unless those APIs are disabled or RLS was enabled outside the repo.

**Decision needed:** authorize **read-only** live inspection of `pg_class.relrowsecurity`, `pg_policies`, and API exposure settings (metadata only, no row data). This is the single most valuable live check, and it needs explicit authorization.

### DEC-021 — Stripe stub grants paid access when no key is configured

**Status:** OPEN

**Evidence:** REQ-11-003. With `STRIPE_SECRET_KEY` unset, checkout grants a license immediately and records the payment as `stub`. Nothing restricts this to non-production. `render.yaml` does not declare the key, and its live presence is unknown.

**Decision needed:** whether stub checkout must be disabled when `NODE_ENV=production`.

## Resume-product decisions (merged from the 2026-09-10 `clever-bohr` branch)

> **ID collision:** these entries were written on a parallel branch and reuse IDs (DEC-006 and up) that the entries above already use for different decisions. Within this section, and in the resume-product rows of `06-reconciliation-matrix.md` and the "Resume Product" section of `CLAUDE.md`, a DEC ID refers to the entry in this section. Renumber them when this log is next reconciled.

### DEC-006 — Scoring/threshold concepts from the 2026-09-10 resume-product package: now four, not three (v2)

**Status:** OPEN — refined and partially resolved, 2026-09-10 (same day, later)

**v2 update:** Betsy clarified directly that there are **four** distinct scoring concepts, not three — the original framing below missed that "requirement-level transfer coverage" was actually conflating two different questions. The four:
1. **Opportunity ranking** — is this external job opportunity worth pursuing overall (`career_match_scoring_v1`, confirmed identical to S03 §7 — see original entry below).
2. **Resume-output-to-job scoring** — does *this specific resume's wording* match *this specific job description's* requirements. Not yet built.
3. **Source/evidence-confidence scoring** — how solid is the underlying Career Master claim itself (user-attested vs. document-supported vs. verified; `source_tier`/`affinity` already partially exist per `TE-CAREER-05`/`TE-CAREER-09`). Not yet built as its own scored Current.
4. **Review-gating bands** — Betsy's dictated 90%/75% bands governing when a recommendation needs review before delivery (`NEW-019`). Not yet built.

**Also resolved 2026-09-10:** every one of these — indeed every Salt Basin methodology with a weight, threshold, or formula — must expose a personal configuration seam: Salt Basin ships a default, any individual user can override their own copy, and a user's override never changes any other user's value or the platform default. Built as an additive `owner_user_id` column + 3-tier resolution on `journey_current_definitions` (mirroring `agent_definitions`' existing precedence), wired first to concept 1 (`career_match_scoring_v1`) via `setPersonalScoringWeights()`/`GET,PUT,DELETE /api/career-agents/scoring-preferences` and a real UI control in `CareerPlacementAgentsPanel.jsx`. Concepts 2–4 need their own Currents built on this same seam when they're designed — this resolves the "how does per-user configurability work" question in general, not just for concept 1.

**Decision needed now:** none blocking — the general mechanism is resolved and built. Still open: which of concepts 2–4 to design/build next, and their exact formulas (this doc doesn't invent those without Betsy's input, same as always).

---

### DEC-006 (original entry, 2026-09-10 earlier the same day) — Three distinct scoring/threshold concepts from the 2026-09-10 resume-product package are not yet reconciled

**Status:** OPEN

**Evidence:** `SRC-RESUME-01` (Betsy's live dictation) sets 90%/75% bands governing *when a recommendation needs review before delivery*. `SRC-RESUME-11` (`Resume-Product-Specification-v0.2.md` §4) separately proposes 75/50 thresholds for *requirement-level demonstrated-transfer coverage* — a different question, already flagged with a cross-reference note inside that document at intake. `SRC-RESUME-06`/`SRC-RESUME-12` (`Source-Review-and-Career-Foundation.md`) further describes an existing 15/15/15/15/15/10/5/10 *career-opportunity ranking* model from S03 §7, which that document itself suggests may already be implemented as `server/lib/careerOpportunityRollups.js` per `CLAUDE.md`'s "Career Placement Agents" section — not yet verified by direct code comparison.

**Why it matters:** the supplied specification explicitly warns against exactly this failure mode — "a final display must explain whether 80 means an opportunity ranking or demonstrated requirement coverage... do not show a single unlabeled 'match' gauge." Building UI before these three are confirmed distinct risks recreating that anti-pattern with Betsy's own real product.

**Decision needed:** confirm all three stay separate, separately-labeled values; confirm whether `careerOpportunityRollups.js` is in fact S03 §7's model (code comparison, not yet done). Not resolved.

---

### DEC-007 — Free-trial gating model for the resume/career product is undecided

**Status:** OPEN

**Evidence:** Betsy, live dictation, 2026-09-10, prior to any file upload: "we need to decide whether or not the free trial is... gated based on time or number of jobs that they wanna research or... is based on... features or functionality or a combination of all of the above. So... that's what we need to determine." No supplied document proposes a specific mechanism.

**Why it matters:** determines pricing-page copy, entitlement-check code (likely `product_licenses`/`data_entitlements` per `CLAUDE.md`'s Profile system), and how the "no repeat LLM cost after initial calls" goal (DEC-009) gets technically enforced during a trial.

**Decision needed:** which axis — time-boxed, usage-count, feature-gated, or a defined combination — from Betsy directly. Not proposed here as a default; not resolved.

---

### DEC-008 — Self-hosted, in-platform build/agent-access request is a separate, large architectural ask, not resume-product scope

**Status:** OPEN

**Evidence:** Betsy's live dictation, 2026-09-10, before any file upload: she wants to "run my product out of my own platform and move out of Claude code," with a mechanism for her, specifically and temporarily, to call the Claude Code/API from inside Salt Basin itself — scoped to what's already built and cached before calling any further API — so she can test and debug the platform's real UX without an external Claude Code session's usage limits interrupting the work. Separately, she wants an API spec so a user's own external Claude/Codex/ChatGPT agent can authenticate to Salt Basin and call its APIs, plus a later roadmap item letting users connect their own model credentials as an opt-in paid feature. This overlaps materially with the existing `docs/salt-basin-agent-api-pricing-architecture-spec.md` (2026-07-09 — metered "Contribution Intelligence API," BYO-model-provider commercial posture) and with the still-unbuilt "Agent Boundary" gap `CLAUDE.md`'s Career Placement Agents section already names.

**Why it matters:** this is a platform-wide capability the resume product would eventually sit on top of, not a resume-product UX requirement itself. Treating it as in-scope for the resume-product intake would blur two very differently sized efforts.

**Decision needed:** none yet — flagged so it is not quietly absorbed into resume-product scope. Reconciling it against the existing agent-API-pricing spec is a prerequisite for any design work, and is itself a separate, later exercise.

---

### DEC-009 — "Self-serve with no recurring LLM cost after initial calls" is a stated goal with no defined mechanism

**Status:** OPEN

**Evidence:** Betsy's live dictation, 2026-09-10: the eventual self-serve product should not require "additional cost on Salt Basin or on the user for calling a language model" once context/memory is established, and the system should be "extremely transparent" about which features need an LLM call versus which run from cached context.

**Why it matters:** this shapes the entire architecture of `SRC-RESUME-11`'s transferable-skill scoring and Career Master reuse model — whether §4's scoring is deterministic code against stored evidence records (no recurring LLM call) or an LLM judgment call made fresh each time. The specification as supplied does not yet say, per-deliverable, which of D01–D11 are deterministic-code output, a one-time cached LLM call, or a recurring LLM call.

**Decision needed:** a deterministic-vs-LLM classification for each D01–D11 deliverable in `Resume-Product-Specification-v0.2.md` §8. Not supplied by any source yet; not resolved.

---

### DEC-010 — R01–R12 personal career-fact conflicts block finalizing Betsy's actual Osaic application materials

**Status:** OPEN

**Evidence:** `docs/baseline/intake/2026-09-10-salt-basin-resume-product/Source-Review-and-Career-Foundation.md` registers twelve specific unresolved conflicts in Betsy's own supplied source documents — among them Streamforce founder-vs-partner title (R01), Accenture start month (R02), the exact Osaic posting/title (R03), unreconciled employer/client/engagement headline counts (R06), and current certification status (R08). Full list and evidence locators are in that document, not duplicated here.

**Why it matters:** `Osaic-Application-Review-Draft.md` in the same package is explicitly a draft, not submittable, until these resolve.

**Decision needed:** Betsy's direct answers to R01–R12, in that document. Not a Claude-side determination; not resolved.

---

### DEC-011 — Major pre-existing overlap found: "Career Foundation Sourcing & Reconciliation, Phase 2" (2026-08-10) already implements much of the newly-supplied Career Master spec

**Status:** OPEN — reconciliation needed before any new schema/UI work on the resume product

**Evidence:** Direct code read, 2026-09-10, while starting Phase 1 of `salt-basin-resume-product`. `server/routes/careerReconciliation.js` + `server/lib/careerReconciliation.js` + `src/components/admin/CareerReconciliationPanel.jsx` implement a real, shipped conflict/ambiguous-mapping review queue (`career_reconciliation_tasks`: `task_type`, `entry_type`, `atom_key`, `evidence_refs`, `reasoning`, `status`, `resolution`) across multiple source imports (resume, LinkedIn export, Indeed export, Fiverr export). `server/db.js`'s `career_intake_documents` table already has a `source_truth_status` column (`CareerIntakePanel.jsx`'s `SOURCE_TRUTH` options: `source_of_truth` / `primary_validated` / `user_attested` / `synthetic_scenario`) — an evidence-provenance vocabulary that overlaps with, but is not identical to, `SRC-RESUME-11`'s proposed user-attested/document-supported/externally-verified/AI-proposed-interpretation/disputed states (no direct `synthetic_scenario` or `disputed` analog either direction). Separately, `server/routes/careerReasoningAdmin.js` + `server/lib/careerReasoningCompiler.js` implement an admin-approved "reasoning pattern candidate" cache (writes to `journey_current_definitions` as `career_reasoning_cache_approval`) — a real, shipped mechanism for reusing a previously-approved transfer-reasoning pattern instead of re-deriving it, which may already be (or be extendable into) the mechanism DEC-009 asks for.

**Why it matters:** this is not a green-field build. Treating `Resume-Product-Specification-v0.2.md` §3's proposed Career Master schema, or §4's scoring model, as net-new would duplicate a real, working system built five weeks earlier under different names. The reuse-first non-negotiable in `.claude/skills/salt-basin-resume-product/SKILL.md` already anticipated this in general terms; this entry records the specific, concrete overlap found.

**Decision needed:** none from Betsy yet — this is a Stage-2-style code-audit finding, queued for a full side-by-side comparison (existing `SOURCE_TRUTH`/`career_reconciliation_tasks`/`careerReasoningCompiler` vocabulary and flow vs. the new spec's evidence-state model and D01-D11 deliverables) before Phase 2 of the resume-product build writes any new table or route. Not resolved — comparison not yet done to completion, only the overlap's existence is confirmed.

---

### DEC-012 — Graph database on top of Supabase: recommend not provisioning one yet

**Status:** RESOLVED (recommendation given 2026-09-10; Betsy asked directly whether to "download the graph database now")

**Context:** Betsy's RECON-001 decision (extend the existing Career Master) came with a stated eventual intent to run a graph database on top of the Supabase/Postgres backend, and she asked whether to provision one now.

**Recommendation:** not yet. This codebase already implements graph-shaped modeling directly on Postgres — `entities`/`persons`/`relationships` master-data tables, `journey_rod_entity_links`/`journey_rod_person_links` join tables, and `tributaryRegistry.js`'s `createJourneyTributary`/`linkJourneyTributary` (hierarchical, peer, and reference relationship kinds) per `CLAUDE.md`'s Career Placement Agents section — this is a working, if lightweight, graph layer, not absent. Adding a separate graph-database product now would mean: a new infrastructure dependency and ongoing cost (in direct tension with Betsy's own "no recurring cost" goal, DEC-009), a second source of truth to keep in sync with Postgres, and — with no concrete query need identified yet that the existing tables/joins/recursive CTEs can't serve — a speculative build ahead of evidence, the same anti-pattern this whole document set is built to avoid.

**If/when a real need emerges** (e.g., a specific multi-hop traversal or graph-algorithm query that plain joins genuinely can't express efficiently), evaluate **Apache AGE** (a graph extension that runs inside Postgres/Supabase) before reaching for an external graph-database product — it stays inside the existing database, infrastructure, and backup story rather than adding a second system.

**Decision needed:** none — Betsy can revisit if a concrete graph-query need surfaces that the current model can't serve.

---

*(This log grows as Stage 2/3 surface more conflicts. Entries are never removed — a resolved entry keeps its evidence and gets a `RESOLVED` status plus the decision, so the trail stays intact per the traceability requirement in Stage 6.)*
