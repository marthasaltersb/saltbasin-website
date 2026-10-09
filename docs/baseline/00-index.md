# Baseline, Reconciliation & Verification — Index

**Inventory date:** 2026-10-01 (previous pass 2026-09-05)
**Inspected revision:** `e0ea466c6c109cafccd8afa1afbb064e312cc7bb` (`main`, PR #5 merge, committed 2026-09-22), branch `claude/compassionate-wozniak-7vx4jr`
**Repository in scope:** `marthasaltersb/saltbasin-website` (the only repository available to this program)
**Program stage:** Stage 1 complete. **Stage 2 first full pass complete**: every element is inventoried and assigned to a module, and 12 of 27 modules have behavior specified. Stage 3 is blocked on validation of the 2026-09-05 design package. Stages 4–6 are blocked. Their tooling and formats exist.

This area documents the existing application, reconciles it with new product and UX documents, and records verification. **It changes no application code, configuration or database.** The only additions outside `docs/baseline/` are the read-only tooling scripts in `scripts/baseline/`.

## Documents

| # | Document | Status | Purpose |
|---|---|---|---|
| 00 | `00-index.md` | Live | This index |
| 01 | [Source register](./01-source-register.md) | Updated 2026-10-01 | Every source: location, revision, scope inspected, access limits |
| 02 | [Coverage & limitations](./02-coverage-and-limitations.md) | Updated 2026-10-01 | What "complete" means, exclusions, missing access, stage blockers |
| 03 | [Current-state specification](./03-current-state-specification.md) + [`03-modules/`](./03-modules/) (27 files) | **Populated (first pass)** | Module register, conventions, REQ/DEF rows with evidence and three-dimension assessment |
| 04 | [Technical-element register](./04-technical-element-register.md) + [`inventory/`](./inventory/README.md) | **Populated (generated)** | Stable `TE-` IDs for endpoints, tables, routes, modules, blocks, tabs, themes, env names, jobs, tests |
| 05 | [New-requirement register](./05-new-requirement-register.md) | Awaiting user validation | `NEW-001`…`NEW-017` from the 2026-09-05/06 intake, all pending read-back |
| 06 | [Reconciliation matrix](./06-reconciliation-matrix.md) | Blocked on 05 | New ↔ existing mapping |
| 07 | [Decision log](./07-decision-log.md) | **21 entries** (DEC-001…021) | Conflicts, drift, and material product decisions. Nothing silently resolved |
| 08 | [Target specification](./08-target-specification.md) | Blocked | Unified target model |
| 09 | [Backlog](./09-backlog.md) | Blocked | Dependency-ordered tasks |
| 10 | [Test catalog](./10-test-catalog.md) | Part A executed. Part B: 1 reproduction executed | Existing tests and results. Acceptance-scenario template and scenarios |
| 11 | [Verification & release records](./11-verification-and-release-records.md) | 3 discovery records | Executed runs with evidence ([`evidence/`](./evidence/)) |
| 12 | [Design-package validation workflow](./12-design-package-validation-workflow.md) | Paused (user direction, 2026-09-06) | Read-aloud validation protocol for the intake package |

## Tooling (re-runnable per release)

| Script | What it does |
|---|---|
| `scripts/baseline/generate-inventory.mjs` | Regenerates `inventory/` from source (+ declared-schema catalog from a throwaway local DB). Refuses non-local DB hosts |
| `scripts/baseline/module-map.json` | Element → module assignment rules (append-only module IDs) |
| `scripts/baseline/check-traceability.mjs` | Fails on undefined or duplicate IDs. Writes `inventory/traceability-report.md` (row counts by maturity/implementation/verification, rows lacking scenarios) |

## Next concrete steps

1. **Your decisions** on the material items in [07](./07-decision-log.md): DEC-007 (email gate blocks member onboarding), DEC-015 (member public data), DEC-020 (authorize read-only live RLS/metadata inspection), DEC-014, DEC-021, DEC-006, DEC-016.
2. **Resume Stage 3:** either continue the read-aloud validation of the 2026-09-05 package (doc 12), or supply the Configuration Module design that was set as its prerequisite, or supply any newer documents.
3. **Deepen Stage 2** where the new documents point (likely MOD-03/04/17 and the Configuration Module concepts), starting with frontend visible states.
