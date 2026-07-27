# Reconciliation: Member Configuration + Member Organization Admin Configuration → Master Build Prompt

Source spec: `.claude/skills/salt-basin-master-build/reference/member-org-admin-config.md` (verbatim, 20 sections).
Target: `.claude/skills/salt-basin-master-build/reference/master-build-prompt.md` (verbatim, 97 sections).

This memo does the reconciliation the master prompt's own §1 and §93 demand before any of this gets built: read the new spec against the master prompt, against already-shipped schema, and against prior specs that solved overlapping problems — then classify what's aligned, what's new, and what conflicts.

## 1. How this spec fits into the master prompt's structure

This is not a competing architecture. It's the Member/Organization identity and authority layer that the master prompt assumes exists but never fully specifies. It slots into named anchor points:

| New spec section | Master prompt anchor | Relationship |
|---|---|---|
| §1 Canonical Member Identity | §22 Canonical Identity Graph | Direct implementation. §22 says "do not create unnecessary duplicate identities... use role Atoms and Molecules" but never gives the concrete Member/Organization worked example. This spec is that worked example. |
| §12 Member Financial Staff, §4 Resume Staff Agent, §2 Personal Brand Staff Agent | §31 Channel Rod Staff | Correct downstream use: all explicitly derive from the BestyStaff Template Framework and only become Channel Rod Staff once assigned to a Channel Rod — this restates §31's own rule (`BestyStaff Template → Agent Template Framework → Channel Rod Staff Configurations`) applied to Member-scoped agents. No conflict. |
| §10 "Personal financial data must not automatically become visible to a Member's Organization" | §32 Agent-Centric Security, §33 Distributed Source Security | Correctly scoped instance of §32's rule that read/write authority is per-agent, per-interacting-user — not inherited from a role like Organization Admin. This is the sharpest, most concrete test case §32 has been given so far. |
| §19 Agent Context Switching | §34 Agent Context Hierarchy, §35 Context Cache | Direct application: "Context caches must remain scope-aware" restates §35 verbatim, now with a worked example (Personal Finance Staff vs. Channel Rod Staff answering "how much debt" in two different scopes). |
| §5 Resume Output staleness notification | §42 Temporal Lineage Slider | Direct application of §42's rule that projected/stale state must never look like confirmed current truth — applied specifically to a Resume Output Projection rather than a generic Atom. |
| §5 Resume Output Projection | §48 Configuration Object Model | Should be modeled as one of §48's core `ConfigDocument`-family object types (draft/published/snapshot), not a bespoke one-off schema. |
| §16–§17 Organization Admin World, Member World | §50 World Scene Layers, §62 Camera & Navigation Controller | No new rendering concept required — these are new scene *content* running on machinery §50/§62 already specify. |
| §10 Personal Financial Channel Rods | §17 Channel Rods | Genuine, useful extension: §17's Channel Rod list (Revenue Lifecycle, Customer, Member, Product Definition, Pricing, Ownership, Financial Transaction, Value Creation, Career) is implicitly Organization-or-Revenue-scoped. This spec is the first to establish that a Channel Rod can be **Member-private** (Cash Liquidity, Spending, Unsecured Debt, Credit Health, Reimbursement). **Recommendation: promote this distinction into the Foundation registry as an explicit addition to §17**, not leave it as an implementation detail — it's a real gap in the canonical Channel Rod list, not just a new instance of it. |

## 2. Genuinely new concepts (not previously specified, worth adding to Foundation)

- **Member-vs-Organization identity separation as a named, canonical rule.** §22 gestures at role-based identity; this spec is the first place "Member Organization Admin is not a separate account type" is stated as an explicit architectural decision with a formula (`MEMBER CAPABILITY SET + ORG ADMIN MODULE ACCESS + ORG ADMIN VIEW ACCESS + ORG-SCOPED AGENT AUTHORITY`). Its own §20 explicitly asks for this to be written into the Foundation Source of Truth — do that, it's correct and non-controversial.
- **A canonical Data Scope enum**: `MEMBER_PRIVATE / MEMBER_PUBLIC / ORGANIZATION_PRIVATE / ORGANIZATION_SHARED / CROSS_ORGANIZATION_AUTHORIZED / PUBLIC`. The master prompt has no single equivalent — the closest are §61's draft/private/blocked filtering and the general "securityPolicyId" fields scattered through §10/§16/§17 Atom/Molecule/Channel Rod metadata. Nearly every object in the master prompt (Atoms §10, Molecules §16, Evidence §8) implicitly needs exactly this vocabulary and currently has none. **Recommendation: add this enum to the Foundation registry once, reference it everywhere**, rather than let each section invent its own ad hoc visibility values (the new spec itself already uses a *different*, narrower visibility enum in §3 — `PRIVATE / MEMBER_ONLY / ORGANIZATION_VISIBLE / SHARED_BY_LINK / PUBLIC` — for semantic-object-level visibility vs. §15's account/record-level Data Scope. These two enums are not the same thing and the spec doesn't reconcile them internally — flag this as an open item, see §5 below.)
- **Personal financial account modeling** (bank + unsecured debt). This is a genuinely new domain — the master prompt's Accounting Journal Entry Model (§43) is enterprise/commercial accounting, not consumer financial aggregation. It needs its own provider integration pattern (see §4 below).

## 3. Conflicts with already-shipped schema (must be resolved before building, not built over)

**A. `MemberIdentity` / `OrganizationMembership` vs. shipped `personal_profiles` / `organization_profiles` / `org_memberships` / `product_licenses` / `data_entitlements`.**

What's live today (`server/db.js`):
- `personal_profiles` — 1:1 with `users`, simple display fields + `metadata` JSONB.
- `organization_profiles` — one row per org, `org_type` enum.
- `org_memberships` — `user_id × org_id`, `role` = `admin | member | viewer`. Comment in the code is explicit: *"There is no 'owner' — equity/ownership-stake relationships between orgs are a separate concept from platform admin rights and are modeled elsewhere, not as a membership role."*
- `product_licenses` — `user_id × org_id × product_id`, `tier` = `standard | professional | enterprise`.
- `data_entitlements` — `license_id → scope` JSONB (`capabilities`, `providers`, `maxRows`, `allowExport`).

What the new spec proposes: `OrganizationMembership.authorityProfileIds[]`, `moduleAccessProfileIds[]`, `viewAccessProfileIds[]` as three separate first-class profile-ID arrays — a materially richer authorization model than the 3-value `role` string shipping today.

This is not a rename conflict like Journey/Channel — it's a **granularity conflict**. Per CLAUDE.md's deployment-safety invariant ("shared config rows members read are additive-only... existing keys never renamed or removed"), the correct move if this granularity is actually needed is to **add** new tables (`authority_profiles`, `module_access_profiles`, `view_access_profiles`) that `org_memberships` rows can reference, and treat `data_entitlements.scope` as the substrate these new profiles refine — not replace `org_memberships.role`.

But there's a real question of whether this granularity is needed *yet*: `org_memberships.role` has exactly three values today and no current product surface asks for more. Building three new profile-ID-array tables ahead of a concrete module system that reads them would be exactly the premature abstraction this codebase's own conventions warn against. **This needs a decision from Betsy, not a default**: is the module/view/authority-profile split real near-term product need, or can it wait until Loop 14 (§14's module list) has at least one module actually built and needing per-module gating?

**B. This spec's §13–§14 (Org Admin = Member + module/view/agent access, derived from entitlements) independently duplicates the Member Portal Crystal & Agentic Layer spec's four-scope model.**

`docs/salt-basin-member-portal-crystal-agentic-layer-v1.md` (memory: `member_portal_crystal_agentic_layer_spec`) already specifies:
- Four `AdminShell` scopes: `admin`, `member`, `org-admin` (`org_memberships.role = 'admin'`), `org-user` (`role IN ('member','viewer')`) — new tables `org_sites`/`org_configs` mirroring the existing `site_state`/`config_state` draft-publish pattern.
- A curation formula: `crystal(user) = f(org_memberships[user], data_entitlements[license], product_licenses.tier, active org_configs/member_configs)` — explicitly stated as *"reuses the existing entitlement substrate rather than inventing a new one."*

Both documents arrive at the same principle — org admin capability is derived from entitlements, not a separate account type — via two different mechanisms. The crystal-nav doc's mechanism is already grounded in shipped tables and has an explicit anti-new-table stance; this new spec's mechanism proposes new profile-ID arrays. **These need to be unified into one authorization mechanism before either is implemented.** Recommendation: default to the crystal-nav doc's mechanism (reuse `data_entitlements.scope`, extend its JSONB shape with `modules`/`views` keys if finer granularity turns out to be needed) unless Betsy has a specific reason the new spec's three-separate-profile-array model is required — it's the lower-risk, less-new-schema path and matches what's already half-built (`org_sites`/`org_configs` are still only a planned addition per that doc, not yet in `db.js`).

**C. Resume Output Projection (§4–§7) vs. shipped resume infrastructure.**

Already live: `resume_temp_access`, `resume_member_reasons` tables, a `member_kv`-style JSON blob keyed `resume_presets`, a registered app `app.resume` ("Resume Output Generator"), and a career/portfolio content table (~`server/db.js:2279-2312`, with a `resume_language` column) that already feeds "the public timeline, industry wheel, case studies, resume output templates" per its own comment.

The new spec's `ResumeOutputProjection` (with `careerAtomVersionIds`, `careerMoleculeVersionIds`, `queryRodHashId`, `lineageRootId`) assumes a versioned Career Atom/Molecule model that doesn't exist yet — the shipped system is preset/JSON-blob based, not Atom-lineage based. This isn't a contradiction, it's a **sequencing dependency**: `ResumeOutputProjection` can't be built for real until master prompt §77 (Career Channel Rod, Career Atoms/Molecules) exists as real schema, which itself hasn't been built. Don't attempt §4–§7 before §77's data model exists — building the projection interface first would just create another orphaned schema with nothing real underneath it, the same failure mode already flagged for the Journey→Channel rename.

**D. Financial account connections vs. `oauth_connections`.**

The 14 existing OAuth providers (`server/lib/oauthProviders.js`) are enterprise B2B SaaS grant flows (Salesforce, QuickBooks, Snowflake, Workday, etc.) — a fundamentally different auth pattern from consumer bank-account aggregation (Plaid-style Link flow, no client-credentials or standard OAuth redirect for most US banks). `ExternalFinancialConnection`/`FinancialAccountDefinition` should **follow the same architectural pattern** already established — `profile_scope`/`profile_id` scoping like `oauth_connections`, AES-256-GCM encryption via the existing `server/lib/crypto.js` for any stored token — but this requires a **new provider integration** (e.g., Plaid), not a new row type in the existing `oauthProviders.js` registry. Flag as new build work, not a reuse of what's shipped. Note also: entering the user's actual bank credentials anywhere is out of scope for me to ever do directly (financial credential entry is a prohibited action) — this reconciliation only concerns building the connection *infrastructure* (OAuth/Plaid Link flow code), not performing the linking on Betsy's behalf.

## 4. Where this spec is already internally clean

Unlike the live codebase, this spec is written entirely in canonical Channel vocabulary (`Channel Rod`, `Channel Rod Staff`, `Channel Configuration`) with zero `Journey` references — it's forward-compatible with the master prompt's §3 rename, once that rename is actually decided (see the already-flagged Journey/Channel conflict in `docs/salt-basin-master-build-progress.md`). No new terminology conflict here — this doc simply inherits the existing one: none of its §14 "Channel Rod Configuration" admin module can be built against real data until the Journey→Channel decision is made.

## 5. Open items requiring a Betsy decision (not defaulted here)

1. Is the three-way `authorityProfileIds` / `moduleAccessProfileIds` / `viewAccessProfileIds` split (§1 of the new spec) real near-term need, or should it collapse into extending `data_entitlements.scope` per the crystal-nav doc's existing, lower-risk mechanism? (§3A/§3B above)
2. This spec uses two different visibility enums in different sections — §3's semantic-object visibility (`PRIVATE / MEMBER_ONLY / ORGANIZATION_VISIBLE / SHARED_BY_LINK / PUBLIC`) and §15's account/record Data Scope (`MEMBER_PRIVATE / MEMBER_PUBLIC / ORGANIZATION_PRIVATE / ORGANIZATION_SHARED / CROSS_ORGANIZATION_AUTHORIZED / PUBLIC`). Are these meant to be the same taxonomy at two granularities, or genuinely two separate concerns (object-level sharing vs. record-level scope)? The spec doesn't say. Needs one canonical answer before either goes into the Foundation registry.
3. Should Member-scoped Channel Rods (§10: Cash Liquidity, Spending, Unsecured Debt, Credit Health, Reimbursement) be added to the master prompt's canonical §17 list now, or held until the financial-connection infrastructure (§4D above) actually exists? Recommend holding — adding them to the registry as aspirational-only invites the same "schema with nothing real underneath" problem flagged in §3C.

## 6. Loop mapping

This spec is not its own loop — it's cross-cutting elaboration that touches, and should be read during:

- **Loop 2 (Enterprise Hierarchy)** — the Member/Org identity model (§1 of this spec) belongs in the Foundation registry here.
- **Loop 3 (Semantic Architecture)** — the Data Scope enum question (§5.2 above) and Member-scoped Channel Rods (§5.3 above).
- **Loop 6 (Agents)** — Member Financial/Brand/Resume Staff as BestyStaff-derived templates (clean, no open questions).
- **Loop 7 (Security)** — the Member-vs-Organization data boundary (§10 of this spec) is the sharpest concrete test case Loop 7 has.
- **Loop 16 (Website)** — Personal Brand Website / Personal Brand World.
- **Loop 1 (Foundation)** must resolve the Journey/Channel rename and the authority-profile-granularity question (§5.1 above) before Loops 2/3/6/7 can act on this spec for real — both are blocking dependencies, not just related context.

`docs/salt-basin-master-build-progress.md` has been updated with these as tracked flagged conflicts and loop notes.
