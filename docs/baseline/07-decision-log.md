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

*(This log grows as Stage 2/3 surface more conflicts. Entries are never removed — a resolved entry keeps its evidence and gets a `RESOLVED` status plus the decision, so the trail stays intact per the traceability requirement in Stage 6.)*
