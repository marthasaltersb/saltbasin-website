# Reconciliation Matrix — Blocked

> **2026-10-01 status:** still blocked on validated entries in 05. The existing-definition side is now available: REQ/DEF rows in [`03-modules/`](./03-modules/) and `TE-` IDs in [`inventory/`](./inventory/README.md). Mapping rows must cite those IDs. `scripts/baseline/check-traceability.mjs` validates them.

**Status: blocked**, same reason as `05-new-requirement-register.md` — there are no new requirements yet to map against existing definitions.

## Required row schema (for when reconciliation begins)

| Mapping ID | New requirement and source | Existing definition IDs | Technical element IDs | Relationship | Required actions | Dependencies | Decision or uncertainty | Acceptance test IDs |
|---|---|---|---|---|---|---|---|---|

- **Relationship** ∈ {retain, extend, modify, replace, split, merge, retire, new, conflicting, unresolved}
- Every mapping row requires an explicit action, including "retain; no implementation change" where that's the true answer.
- Actions must name the affected layer: terminology, documentation, UI, interaction, data model, database migration, business rules, permissions, API, configuration, or tests.
- **Unmapped new requirements** and **existing features with no counterpart in the new documents** are both tracked here once they exist — silence in one direction never means deletion in the other.

Nothing to map yet.
