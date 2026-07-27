---
name: salt-basin-pre-build
description: Repeatable multi-session driver that builds out the "Member Configuration + Member Organization Admin Configuration" companion spec — canonical Member identity, Personal Brand Website/World, Resume Output Projection, Member financial connections, and Organization Admin modules/worlds. Use when Betsy invokes /salt-basin-pre-build, references "the pre-build," "the member config spec," "member org admin config," or asks to build the identity/access/personal-config layer that the Salt Basin master build depends on.
---

# Salt Basin Pre Build

This skill drives Betsy's "Member Configuration + Member Organization Admin Configuration" spec — a 20-section companion brief that defines the canonical Member identity model, per-Member personal configuration (brand website, resume, financial connections), and the Organization Admin authority/module layer. It is called **pre-build** because master-build loops 2 (Enterprise Hierarchy), 3 (Semantic Architecture), 6 (Agents), 7 (Security), and 16 (Website) all assume this identity/access layer already exists — this skill is what actually builds it, so those loops have real schema to build on top of rather than reconciling against a spec that's still just a document.

This is a **sibling** to `salt-basin-master-build`, not a replacement or a duplicate. Don't re-run master-build loops 2/3/6/7/16 to build this content — run the matching pre-build phase instead, then let those loops validate/extend against what's now real.

## Non-negotiables (apply on every invocation, no exceptions)

- Never rename `BestyStaff` — the spelling is intentional.
- Never silently rename or reinterpret an intentional Betsy-defined term. Flag conflicts; don't resolve them by fiat.
- **Never default on an open decision.** `reference/phases.md` lists three specific open decisions (profile-array granularity, dual visibility enums, Member-scoped Channel Rod registry timing). If a phase is blocked on one of these, stop and ask Betsy — do not pick the "recommended" path from the reconciliation memo and proceed as if it were confirmed.
- Member Organization Admin is **not** a separate user-record type — it's a canonical Member identity plus Organization-scoped authority profiles, module access, view access, and Agent access. Do not create a `memberType = "ADMIN"` field or equivalent primary-identity distinction anywhere in schema or code.
- Personal financial data is Member-private by default and must never become Organization-visible through inference from Organization Admin authority — only through an explicit authorized sharing action. This is a security boundary, not a UX default.
- A Resume Output is a **projection** of canonical Career state, not a second copy of it. When underlying Career state changes, notify — never silently rewrite an approved/published Resume Output.
- Follow CLAUDE.md's deployment-safety invariants: append-only block registry, additive-only shared config rows, schema-versioned JSON, seed/bootstrap never touches member rows.

## Files

- `.claude/skills/salt-basin-master-build/reference/member-org-admin-config.md` — the full verbatim 20-section spec (lives under the master-build skill because it was ingested as a companion document there first; read the specific section(s) relevant to the current phase rather than the whole file).
- `docs/salt-basin-master-build-member-org-reconciliation.md` — the reconciliation memo comparing this spec against shipped schema (`personal_profiles`, `organization_profiles`, `org_memberships`, `product_licenses`, `data_entitlements`, `oauth_connections`) and against the pre-existing Member Portal Crystal & Agentic Layer spec. Read this before building anything — it already did the "does this conflict with what's live" analysis; don't redo it from scratch.
- `reference/phases.md` — static definition of the 6 pre-build phases, which spec sections each covers, and which are blocked on an open decision.
- `docs/salt-basin-pre-build-progress.md` (repo root, not under this skill directory) — the **mutable** state: phase statuses, the three open decisions and whether Betsy has answered them, and a changelog. Read first, update last, on every invocation.

## Workflow for every invocation

1. Read `docs/salt-basin-pre-build-progress.md` first. Check the open-decisions table — if the phase you're about to run is blocked on one that's still unanswered, stop and ask Betsy rather than proceeding on a default.
2. Determine which phase to run:
   - If the user named one (`/salt-basin-pre-build phase 4`, `/salt-basin-pre-build financial`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked` (with its blocker now resolved) and whose dependencies (see the phase table) are satisfied.
3. Read only the spec sections that phase's row in `reference/phases.md` cites, plus the relevant part of the reconciliation memo — via Grep/Read, not the whole file.
4. Do the actual build work: inspect current schema (`server/db.js`) and routes → identify what's genuinely missing vs. already covered by shipped tables → add new tables/columns additively (never rename/remove existing ones) → wire routes → wire admin UI where the phase calls for it → make the structural change, not just a written plan.
5. Update `docs/salt-basin-pre-build-progress.md`: set the phase's status, add a changelog entry (date, what changed structurally, what's still open), and update the open-decisions table if Betsy answered one during this invocation.
6. Report back concisely: which phase ran, what structurally changed, what's still open or blocked, and what phase is next.

## Scope discipline

Six phases, each independently reviewable. Don't try to satisfy all 20 spec sections in one turn. If a phase's scope is still too large for one turn (Phase 4's financial-connection infrastructure is the likely candidate), say so and propose splitting it rather than doing a shallow pass across the whole phase.
