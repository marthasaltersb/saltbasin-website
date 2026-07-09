# Handover — Member Security Hardening, Claude Connector Plan, Org Identity Graph

**Date:** 2026-07-09
**Commit:** `1b4843c` (pushed to `origin/main`)
**Scope of this handover:** a security/multi-tenant-scaling audit ahead of onboarding real members, credential-encryption fixes, rate limiting, a plan for a Claude/MCP connector (not yet built beyond Phase 1–1.5), and a data-model change to org membership roles + a personal↔org identity graph. **Read section 5 before touching `server/db.js`** — another concurrent session on this machine has unstaged work mixed into that file (career-master multi-tenancy retrofit, output-templates nav injection) that this session deliberately did not commit.

---

## 1. Why this work happened

Betsy is preparing to roll out real members onto the platform and flagged two things up front: the security/multi-tenant model needed a pass before that rollout, and OAuth/credential exposure was a specific concern. That turned into a security audit, which surfaced a genuine finding (plaintext BYO credentials), which led to fixing it and building a proper UI for it. Mid-session, Betsy also asked for a Claude connector (members editing their site from their own Claude) and, separately, an expansion of the member data model (Member Organizations, admin seats, identity graph). Both of those got scoped down from a much larger initial ask — see sections 3 and 4 for what was deliberately deferred and why.

---

## 2. What was built this session

### 2a. Security audit findings + fixes
- Audited `auth.js`, `oauth.js`, `memberSite.js`, `memberConfig.js`, `profiles.js`, `resumeAccess.js`, `portfolioRequests.js`, `careerMaster.js` for tenant-isolation gaps. **Baseline was solid** — consistent `requireUser` + `WHERE user_id = $1` scoping, bcrypt + rate-limited auth, no email enumeration, OAuth tokens already AES-256-GCM encrypted.
- **Real finding:** `integrations.anthropicKey` (BYO Claude API key) and `integrations.memberDbs[].url` (member-supplied external Postgres connection strings, **with embedded passwords**) were stored as **plaintext JSON** in `member_configs.data` — unlike OAuth tokens, which are encrypted.
  - **Fixed for `anthropicKey`:** now AES-256-GCM encrypted into `integrations.anthropicKeyEnc` via the existing `server/lib/crypto.js` helpers. `GET /api/member-config/draft` never returns the key or the blob — only `anthropicKeyConfigured: true/false`. `PUT` only touches the stored key when the client explicitly sends a new value or an empty string to clear it; omitting the field leaves it untouched. `memberAgent.js`'s `getAnthropicKey()`, `get_config` tool, and `update_config_path` guard were all updated to match.
  - **NOT yet fixed:** `integrations.memberDbs[].url` is still plaintext. Same encryption pattern applies — this is the natural next task if you're continuing the credential-hardening thread. Search `memberDbs` in `server/routes/memberAgent.js` and `src/components/admin/ConfigPanel.jsx` (`MemberDbsCard`) as the starting points.
- Added rate limiting (`server/lib/rateLimit.js`, already existed for login/reset) to `/api/members/signup` (10/15min/IP) and `/api/member-agent/chat` (20/min/IP, since LLM calls cost money per token).
- Documented deploy-safety invariants in `CLAUDE.md` and inline: block registry (`src/components/blocks/index.jsx REGISTRY`) is append-only; `member_sites`/`member_configs` JSON now carries a `version`/`schemaVersion` field (stamped defensively on write, even for pre-existing rows); `seed.js`/`db.js bootstrap()` must never touch member rows (verified true, comment added so it stays true).

### 2b. "Connect Claude" UI (BYO API key, productized)
- Betsy asked for members to connect their own Claude from **within** the Salt Basin site. Important constraint surfaced and confirmed with her: **there is no public, supported OAuth flow for third-party sites to authenticate against a member's Claude.ai Pro/Max subscription** — the OAuth mechanism Claude Code uses internally is not a documented third-party integration, and building on it would mean reverse-engineering an undocumented Anthropic-internal flow. Flagged this explicitly rather than guessing at endpoints/client IDs. Betsy agreed to the supported alternative: encrypt + productize the existing metered-API-key field (see 2a above for the encryption; this section is the UI).
- `src/components/admin/ConfigPanel.jsx` — new `ClaudeConnectionCard` replaces the old raw password `<Field>` bound directly to plaintext. Shows Connected/Not-connected state, Connect/Update-key/Remove actions, never pre-fills a previously-saved key. Matches the visual pattern of the existing `MemberDbsCard`/`ConnectedAppsCard` in the same file.

### 2c. Claude/MCP connector — plan only, Phase 1 partially done
Full plan lives at the path shown at the end of the plan-mode step (search for "Claude Connector for Member Sites" — it wasn't saved into the repo, only to the Claude Code plan-file location, so if that session's local plan file is gone, the phases below are the durable record).

- **Phase 1 (deployment-safety guardrails) — done.** See 2a's last bullet.
- **Phase 2 (extract `memberAgent.js`'s tool logic into `server/lib/memberTools.js`) — NOT done.** This is the next concrete step if you're picking the connector back up: `memberAgent.js` currently inlines `TOOLS`, `executeTool`, `readConfig`/`readSite`/`writeSite`/`writeConfig`, and the guardrail checks. Move them to a shared module parameterized by `userId` so both the existing chat agent and the future MCP connector enforce identical guardrails from one place.
- **Phase 3 (OAuth 2.1 authorization server, Salt Basin as the OAuth server for Claude's custom-connector flow) — NOT done.** New tables (`mcp_oauth_clients`, `mcp_authorization_codes`, `mcp_access_tokens`), RFC 7591 dynamic client registration, PKCE, consent screen reusing the existing `sb_admin` session/login.
- **Phase 4 (MCP connector endpoint using `@modelcontextprotocol/sdk`, draft-only writes, no publish tool) — NOT done.**
- **Phase 5 (member-facing "Connected Apps" panel to view/revoke MCP tokens) — NOT done**, follow-on.

### 2d. Org membership role restructuring + admin-seat guardrail
Betsy's ask: Member Organizations must always have at least one admin seat. Her clarification on role naming turned into a much bigger topic (see section 4) that was deliberately scoped out — what shipped is the well-defined part:
- `org_memberships.role` vocabulary changed from `owner | admin | member | viewer` to **`admin | member | viewer`** — no `owner`. Rationale (Betsy's words): an org admin already has full management rights, and equity/ownership-stake relationships between orgs (portfolio companies, debt covenants) are a *separate* concept from platform admin rights, not a membership role.
- `server/db.js` — one-shot idempotent migration at every boot: `UPDATE org_memberships SET role = 'admin' WHERE role = 'owner'`. Also fixed the Salt Basin Net Works org seed (used to grant Betsy `'owner'`, now `'admin'`).
- `server/routes/profiles.js` — new `wouldLeaveOrgWithoutAdmin(orgId, userId, newRole)` helper, wired into: role-change (`PATCH .../members/:userId`), remove-member (`DELETE .../members/:userId`), and re-invite (`POST .../members`, since `ON CONFLICT DO UPDATE SET role` could silently demote an existing admin). All three now 400 with `"This org must always have at least one Admin…"` if the action would leave zero admins. Org creation grants `'admin'`; org deletion and org-settings-edit now check `role === 'admin'` (was `['owner','admin']`).
- `src/components/admin/ProfileHub.jsx` — `ORG_ROLES` no longer includes `'owner'`; `canManage` checks `myRole === 'admin'`; Remove/role-select controls are disabled (with a tooltip) on the last remaining admin as UX sugar — **the server is the actual enforcement point**, this is just to avoid a confusing round-trip error.

### 2e. Identity graph (personal profile ↔ org profiles)
- `GET /api/profiles/me/personal` now returns `linkedOrgs` — a join of the pre-existing `personal_org_links` table against `organization_profiles` and the user's `org_memberships.role`. This table and its link/unlink endpoints (`POST`/`DELETE /me/personal/link-org/:orgId`) already existed but had no UI.
- `src/components/admin/ProfileHub.jsx` — new `IdentityGraphCard` on the Personal tab: lists linked orgs, lets the member link any org they already belong to (via `/me/orgs`) or unlink one.

### 2f. Signup — personal + work email capture
- `src/components/SignupPage.jsx` — relabeled the primary field "Personal Email (recommended for login)", added an optional "Work Email" field. On successful signup, fires a best-effort follow-up `POST /api/members/me/emails` (`type: 'work'`) using the session cookie signup just set — reuses the pre-existing multi-email/verification system (`user_emails` table, 6-digit code flow) rather than building new plumbing.

---

## 3. Deliberately deferred: ownership stakes + debt-covenant visibility

When asked to clarify the "Admin" role concept, Betsy revealed a much bigger domain: individuals/orgs can hold **equity ownership stakes** in other Member Organizations (portfolio companies) at varying percentages, and **debt covenant relationships/terms** between orgs should drive **what data is visible to whom** when logged in. This is a cap-table-style ownership graph plus a relationship-based access-control layer — financially/legally sensitive, and genuinely a separate subsystem from "does this org have an admin." Explicitly scoped out of this session with Betsy's agreement (she chose "split it" over describing the full model inline). **Do not build this from inference** — it needs its own dedicated design conversation covering: what fields an ownership-stake record needs (percentage, instrument type, effective date), what a covenant record needs (financial ratios, reporting/information rights), and precisely which fields/views become visible or hidden based on those relationships.

---

## 4. Also deferred / ruled out
- **Subscription-OAuth ("log in with your Claude.ai account")** — ruled out as infeasible for a third-party product; see 2b. Don't revisit this unless Anthropic publishes a supported flow.
- **`memberDbs[].url` encryption** — same plaintext-credential class of bug as `anthropicKey`, not yet fixed (see 2a).
- **Connector Phases 2–5** — not built, see 2c.

---

## 5. Concurrent-session hazard in `server/db.js`

This is a shared working directory — another Claude Code session was actively editing `server/db.js` at the same time as this one (visible via `node --watch` hot-reload messages mid-session). That session's changes (a "career master multi-tenancy retrofit" adding `user_id` to `career_*` tables + backfill, and an "Output Templates" admin-nav tab injection) are **still sitting unstaged in the working tree** — this session deliberately did not commit them, since they aren't this session's work to vouch for or push. The committed diff for `db.js` was hand-extracted to include only the four hunks this session actually wrote (member_sites comment, org_memberships role comment + migration, seed `owner`→`admin` fix).

**Before you next touch `db.js`:** run `git status` / `git diff -- server/db.js` first. If those unstaged career-master/output-template hunks are still there, they're real in-progress work from another session (or the same person's other tab) — don't discard them, but don't assume they're finished/reviewed either. Ask Betsy which session owns that thread if unclear.

Also uncommitted/untracked at push time (not touched by this session, left alone): `.claude/launch.json`, several `docs/salt-basin-*` and `docs/salt-basin-business-definition-*` files, `server/data/defaultSite.js`, `server/index.js`, `server/routes/careerMaster.js`, `server/routes/outputTemplates.js`, `server/routes/portfolioRequests.js`, `src/brand.css`, `src/components/Output.jsx`, `src/components/PortfolioRequestFlow.jsx`, `src/components/PublicProfile.jsx`, `src/components/PublicSite.jsx`, `src/components/admin/AdminShell.jsx`, `src/components/admin/HerqPanel.jsx`, `src/lib/outputBlocks.js`, plus several untracked files (`server/lib/rollupMetrics.js`, `server/routes/bestyStaff.js`, `src/components/admin/OutputTemplateConfigurator.jsx`, `src/lib/bestyStaffScript.js`, `src/lib/resumeDensity.js`) and some loose root-level files/zips that look like manual drops, not code (`AlgebraTriggerNometryFF07.04.26.zip`, `Tempsite.json`, various `backlog-*.json`, `output/`, `outputs/`, `tmp/`).

---

## 6. Verification status — be honest about this with Betsy

No test runner exists in this repo (per `CLAUDE.md`); verification is via `/verify` against the running app. This session verified:
- All edited server files pass `node --check` (syntax only).
- The shared dev server (port 3001, another session's) stayed alive and responded 200 after every hot-reload.
- Rate limiting was **functionally confirmed**: 12 rapid `POST /api/members/signup` calls returned `429` starting at the 8th (combined with earlier test calls hitting the 10/15min cap) — this is real, observed behavior, not just code review.
- The frontend bundle compiled with zero console errors on `/login` and `/signup` after every JSX change (`ProfileHub.jsx`, `ConfigPanel.jsx`, `SignupPage.jsx`).

**What was NOT verified — no test member account was available this session:**
- The actual save/load round-trip of the encrypted `anthropicKeyEnc` field (Connect Claude card) was never clicked through live.
- The identity-graph link/unlink UI was never clicked through live.
- The admin-seat guardrail (disabled Remove button, 400 on last-admin removal) was never exercised against a real multi-member org.
- The signup work-email capture was never run end-to-end (signup is currently invite-only; `PUBLIC_MEMBER_SIGNUP_ENABLED` was left as-is).

**First thing the next session should do:** get a real member login (or flip `PUBLIC_MEMBER_SIGNUP_ENABLED` briefly) and click through all four of the above before considering this work done.

---

## 7. Suggested next steps, in order
1. Click-test everything in section 6.
2. Encrypt `integrations.memberDbs[].url` (same pattern as `anthropicKey` — see 2a).
3. Resolve the `db.js` concurrent-session situation (section 5) before either session does more schema work there.
4. If continuing the connector: Phase 2 (extract `memberTools.js`) is next, then Phase 3 (OAuth server) — treat Phase 3 as its own security-review checkpoint before wiring Phase 4's live write access through it.
5. Ownership-stake / debt-covenant system (section 3) needs its own dedicated design session whenever Betsy is ready to spec it out.
