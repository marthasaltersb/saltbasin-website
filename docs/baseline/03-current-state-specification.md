# Current-State Specification

**Inventory date:** 2026-10-01 · **Inspected revision:** `e0ea466c6c109cafccd8afa1afbb064e312cc7bb` (`main` merge of PR #5, committed 2026-09-22; working branch `claude/compassionate-wozniak-7vx4jr`) · **Status:** Stage 2 first full pass. Every inventoried element is assigned to a module. Behavior is specified in depth for 12 core modules and registered (not yet assessed) for the other 15.

This document states **what exists and how it behaves now**. It contains no target requirements. Where code and documentation disagree, the disagreement goes to the [decision log](./07-decision-log.md) and is not resolved here.

## How the specification is built

Two layers:

1. **Generated inventory** ([`inventory/`](./inventory/README.md)), produced by `scripts/baseline/generate-inventory.mjs`. It is the mechanical, complete list of elements: 592 API endpoints, 211 tables (191 from bootstrap and 20 declared elsewhere), 37 UI routes, 424 source modules, 67 block types, 32 admin tabs, 78 env var names, 9 scheduled jobs, 6 themes, 17 test files, and 194 documentation files. Each element has a stable `TE-…` ID. It is regenerated per release, never hand-edited.
2. **Module specifications** ([`03-modules/`](./03-modules/)), hand-authored. These hold requirement-level rows (`REQ-`/`DEF-`) that cite file:line evidence and link to `TE-` IDs.

`scripts/baseline/module-map.json` assigns every generated element to exactly one module. [`inventory/module-coverage.md`](./inventory/module-coverage.md) shows the assignment and lists any unassigned element (currently **0**). `scripts/baseline/check-traceability.mjs` fails if any document cites an undefined ID, and writes [`inventory/traceability-report.md`](./inventory/traceability-report.md) with row counts by state.

## Conventions

- **IDs:** `REQ-<module#>-<nnn>` for behavior, `DEF-<module#>-<nnn>` for definitions (objects, vocabularies, documents). IDs are stable: never renumbered or reused. A retired row keeps its ID and is marked *apparently obsolete*.
- **Row schema:** ID · Module · Name and meaning · Source references · Expected current behavior · Technical element IDs · **Maturity** · **Implementation state** · Evidence and gaps · **Verification state** · Related IDs.
- **Definition maturity:** `absent` (nothing specified) · `ambiguous` (conflicting or unclear sources) · `partial` · `sufficient` (enough to write acceptance criteria).
- **Implementation state:** `not located` · `placeholder or mock` · `partial` · `implemented` · `apparently obsolete` · `not assessed` (element exists but behavior wasn't read; used only in registered modules).
- **Verification state:** `unverified` (documentation claim only) · `static evidence only` (code read) · `automated checks passed` · `user-journey checks passed` · `failed`. A parenthetical such as *(runtime observed 2026-10-01)* or *(reproduced 2026-10-01, AT-04-001)* means a one-off manual or scripted run against the local scratch environment ([11](./11-verification-and-release-records.md)) confirmed the described current behavior. That is stronger than code reading, but it is **not** a committed automated check.
- "Implemented" means the code exists and its logic was read. It does **not** mean the behavior is correct, intended, or working in production.

## What "complete" means for this inventory

| Criterion | Status at `e0ea466` |
|---|---|
| Every endpoint, table, UI route and source file in `src/`+`server/` inventoried | Met (generated) |
| Every inventoried element assigned to a module | Met: 0 unassigned |
| Every module has a specification file | Met: 27/27 |
| Every module's behavior read and specified | **Not met.** 12 modules specified (depth varies, see table); 15 registered only |
| Every cited ID resolves | Met (checker: 0 dangling, 0 duplicates) |
| Live database compared with declared schema | **Not met.** No live access (DEC-020) |
| Frontend visible states transcribed (copy, validation, empty/loading/error) | **Not met** for any module |
| Prior documentation (`docs/canon`, specs, handovers) reconciled against code | **Not met.** Registered as sources only |

Excluded (stated, not silent): `node_modules/`, `dist/`, `package-lock.json`, binary office/PDF files, one-off root scripts and data dumps, and `tmp/`, `work/`, `output*/`, `generated/`. See [02](./02-coverage-and-limitations.md).

## Module register

Depth: **Specified** = route and library code read, rows carry file:line evidence. **Partial** = key paths read, others registered. **Registered** = elements inventoried and documentation claims recorded as *unverified*.

| Module | Name | Spec | Depth | Endpoints | Tables | Key open decisions |
|---|---|---|---|---|---|---|
| MOD-01 | Platform runtime, deployment & operations | [MOD-01](./03-modules/MOD-01-platform-runtime.md) | Specified | 2 | 0 | DEC-003, DEC-018, DEC-019, DEC-020 |
| MOD-02 | Authentication, sessions & identity | [MOD-02](./03-modules/MOD-02-authentication.md) | Specified | 18 | 11 | DEC-008, DEC-009, DEC-010, DEC-011 |
| MOD-03 | Platform CMS — admin site & config | [MOD-03](./03-modules/MOD-03-platform-cms.md) | Specified | 17 | 3 | DEC-012, DEC-013 |
| MOD-04 | Member sites, profiles & member config | [MOD-04](./03-modules/MOD-04-member-sites.md) | Partial | 66 | 10 | DEC-014, DEC-015 |
| MOD-05 | Public rendering — blocks, themes, tokens | [MOD-05](./03-modules/MOD-05-rendering-themes.md) | Partial | 0 | 0 | DEC-016 |
| MOD-06 | SEO & structured data | [MOD-06](./03-modules/MOD-06-seo.md) | Specified | 0 | 0 | DEC-018 |
| MOD-07 | Output documents, resume & templates | [MOD-07](./03-modules/MOD-07-outputs.md) | Partial | 17 | 4 | DEC-017 |
| MOD-08 | Leads, CRM & BestyStaff intake | [MOD-08](./03-modules/MOD-08-leads-intake.md) | Partial | 33 | 11 | DEC-007, DEC-009 |
| MOD-09 | Email delivery & notifications | [MOD-09](./03-modules/MOD-09-email-notifications.md) | Specified | 5 | 2 | DEC-007 |
| MOD-10 | Integrations — OAuth, data sources, uploads, Jira | [MOD-10](./03-modules/MOD-10-integrations.md) | Partial | 13 | 8 | — |
| MOD-11 | Commerce, licensing, entitlements & services | [MOD-11](./03-modules/MOD-11-commerce-entitlements.md) | Partial | 20 | 17 | DEC-014, DEC-021 |
| MOD-12 | Organizations & org portal | [MOD-12](./03-modules/MOD-12-organizations.md) | Registered | 12 | 5 | — |
| MOD-13 | Member financial connections | [MOD-13](./03-modules/MOD-13-member-financial.md) | Specified | 8 | 4 | — |
| MOD-14 | Career (Master, Channel Rod, reasoning, agents) | [MOD-14](./03-modules/MOD-14-career.md) | Registered (+2 rows read) | 96 | 16 | — |
| MOD-15 | Commercial opportunity pipeline & L2R | [MOD-15](./03-modules/MOD-15-commercial-l2r.md) | Registered | 13 | 6 | — |
| MOD-16 | Journey Rod / Channel substrate | [MOD-16](./03-modules/MOD-16-journey-substrate.md) | Registered | 76 | 28 | — |
| MOD-17 | 3D worlds, crystal design system, experience engine | [MOD-17](./03-modules/MOD-17-worlds-crystal.md) | Registered | 8 | 9 | DEC-016, DEC-019 |
| MOD-18 | Agents | [MOD-18](./03-modules/MOD-18-agents.md) | Registered | 29 | 18 | — |
| MOD-19 | Platform lifecycle management | [MOD-19](./03-modules/MOD-19-platform-lifecycle.md) | Registered | 47 | 23 | DEC-006 |
| MOD-20 | Analytics, events & audit | [MOD-20](./03-modules/MOD-20-analytics-audit.md) | Registered | 8 | 5 | — |
| MOD-21 | Content pipeline, publications & HERQ | [MOD-21](./03-modules/MOD-21-content-herq.md) | Registered | 35 | 8 | — |
| MOD-22 | Network Relationship Management | [MOD-22](./03-modules/MOD-22-nrm.md) | Registered | 10 | 4 | — |
| MOD-23 | FinBridgeCo & accounting | [MOD-23](./03-modules/MOD-23-finbridgeco.md) | Registered | 5 | 6 | — |
| MOD-24 | Metric intelligence | [MOD-24](./03-modules/MOD-24-metric-intelligence.md) | Registered (+1 row read) | 7 | 3 | — |
| MOD-25 | Global standards | [MOD-25](./03-modules/MOD-25-global-standards.md) | Registered | 7 | 3 | — |
| MOD-26 | Proposal experience, Lonetree MVP | [MOD-26](./03-modules/MOD-26-proposal-lonetree.md) | Registered | 40 | 7 | — |
| MOD-27 | Legal & notice pages | [MOD-27](./03-modules/MOD-27-legal-pages.md) | Registered | 0 | 0 | — |

Endpoint and table counts come from [module-coverage.md](./inventory/module-coverage.md) at this revision (table counts include tables declared outside bootstrap).

## Summary of the most consequential current-state findings

Each is evidenced in the linked row. None is resolved here.

1. **No new member can be created through the product right now** (runtime observed). Direct signup is invite-only by default, and lead conversion requires a verified email. The verification email is blocked by the outbound-email authorization gate, and only a token hash is stored, so the user is told `verificationSent:true` but can never verify. (REQ-08-010, REQ-08-003, REQ-02-014, DEC-007, DEC-011)
2. **Most transactional email is silently blocked** since 2026-08-10: lead credentials, the owner's new-lead alert, contact-form forwarding, welcome emails, digests, and the admin test email. (REQ-09-002, DEC-007)
3. **Member draft content is returned to anonymous visitors** by the public member-site API and hidden only in the browser (reproduced). Related gaps: deny-list config sanitization, an ungated legacy profile endpoint, and email exposure in the featured banner. (REQ-04-005…010, DEC-015)
4. **No RLS is declared on any table**, and authorization lives entirely in Express. On Supabase this matters if the auto-generated APIs are reachable (live state unknown). (REQ-01-004, DEC-020)
5. **Member site editing ends after a 90-day automatic trial** unless paid, sponsored, or granted. (REQ-04-002, DEC-014)
6. **`npm test` fails, and no tests run in CI.** (DEC-006)
7. **Three schema mechanisms coexist** (boot DDL, lazy runtime DDL, an unapplied SQL file). (REQ-01-002, DEC-004, DEC-019)
8. **Hosting topology likely defeats server-side SEO injection** for `saltbasin.net`. (REQ-06-002, DEC-018)
9. **Eight CLAUDE.md statements are contradicted by code.** (DEC-019)
