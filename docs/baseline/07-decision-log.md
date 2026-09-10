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

### DEC-006 — Three distinct scoring/threshold concepts from the 2026-09-10 resume-product package are not yet reconciled

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

*(This log grows as Stage 2/3 surface more conflicts. Entries are never removed — a resolved entry keeps its evidence and gets a `RESOLVED` status plus the decision, so the trail stays intact per the traceability requirement in Stage 6.)*
