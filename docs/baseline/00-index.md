# Baseline, Reconciliation & Verification — Index

**Inventory date:** 2026-09-05
**Inspected revision:** `e8e25e15bd69404ba4aab498ec04907190250ea2` (branch `claude/local-repo-export-2ap4hx`, `origin/main` merged in as of 2026-08-10)
**Repository:** `marthasaltersb/saltbasin-website` (single repository in scope; no other repositories were made available to this session)
**Program stage:** Stage 1 (scope discovery + source register) complete for a first pass. Stages 3–6 are blocked pending inputs listed in [`02-coverage-and-limitations.md`](./02-coverage-and-limitations.md).

This is the documentation area for the repository-baseline / design-reconciliation / user-experience-verification program. Nothing here modifies application code, configuration, or the database. Stage 2 (deep per-module current-state inventory) is intentionally left as a **pending, structured stub** — see the note at the top of that file — rather than filled with inferred detail, per the governing instruction not to invent content ahead of evidence.

## Documents

| # | Document | Status | Purpose |
|---|---|---|---|
| 00 | `00-index.md` (this file) | Live | Program index, stage status, navigation |
| 01 | [`01-source-register.md`](./01-source-register.md) | Populated (Stage 1) | Every source inspected: docs, code areas, migrations, CI, env, tests — with location, revision, scope, and access limitations |
| 02 | [`02-coverage-and-limitations.md`](./02-coverage-and-limitations.md) | Populated (Stage 1) | What "complete" means for this pass, explicit exclusions, unavailable access, open questions blocking later stages |
| 03 | [`03-current-state-specification.md`](./03-current-state-specification.md) | Pending stub | Per-module requirement/definition tables (the ID | Module | Name | Source refs | Behavior | Tech element IDs | Impl state | Evidence | Verification state | Related IDs schema) |
| 04 | [`04-technical-element-register.md`](./04-technical-element-register.md) | Pending stub | Code/DB object register linked to requirement IDs |
| 05 | [`05-new-requirement-register.md`](./05-new-requirement-register.md) | Awaiting read-aloud validation | Atomic requirements extracted from new design documents (supplied 2026-09-05; user validation pass in progress — see doc 12) |
| 06 | [`06-reconciliation-matrix.md`](./06-reconciliation-matrix.md) | Partially populated (2026-09-10, resume-product package only) — orbital-design (05's NEW-001–017) still blocked | New-requirement ↔ existing-definition mapping table |
| 07 | [`07-decision-log.md`](./07-decision-log.md) | Populated (Stage 1 findings) | Conflicting/ambiguous facts found so far, open product decisions, resolutions as they're made |
| 08 | [`08-target-specification.md`](./08-target-specification.md) | Pending — blocked | Unified target glossary, schema, rules, UX states |
| 09 | [`09-backlog.md`](./09-backlog.md) | Pending — blocked | Dependency-ordered implementation backlog |
| 10 | [`10-test-catalog.md`](./10-test-catalog.md) | Populated (existing tests only) | Inventory of existing automated tests + coverage gap statement; acceptance-scenario catalog is pending new requirements |
| 11 | [`11-verification-and-release-records.md`](./11-verification-and-release-records.md) | Pending stub | Verification run results and release linkage, going forward |
| 12 | [`12-design-package-validation-workflow.md`](./12-design-package-validation-workflow.md) | Active | Read-aloud validation process for the 2026-09-05 design package — reading order, capture method, promotion path into doc 05 |

## How this program proceeds from here

1. **You review** `01-source-register.md`, `02-coverage-and-limitations.md`, and `07-decision-log.md` for accuracy and to resolve the open decisions.
2. **You supply** the new product/UX design documents referenced in the original objective (including any ChatGPT-voice-derived documents). Until then, `05`–`06`, `08`–`09` stay pending stubs — filling them without those inputs would mean inventing requirements, which is explicitly out of scope.
3. Once supplied, Stage 2 (deep current-state module inventory, sized to be done incrementally — likely per module cluster) and Stage 3 (requirement extraction + reconciliation) proceed in parallel where possible.
4. Stage 5 (real-browser user-journey verification) begins once target behavior is decided per module — testing against undecided behavior would produce tests that assert nothing meaningful.

No claim in this documentation area should be read as "implemented and verified" unless `10-test-catalog.md` or `11-verification-and-release-records.md` says so explicitly with evidence.
