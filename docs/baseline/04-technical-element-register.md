# Technical-Element Register — Pending

**Status: pending structured stub.** Populated incrementally alongside `03-current-state-specification.md` — a technical element is registered as it's linked from a requirement/definition row, not enumerated independently ahead of that work (this avoids inventing "elements" that turn out not to correspond to any real requirement).

## Required row schema

| Element ID | Kind | Precise location | Responsibility | Inputs/outputs | Dependencies | Linked requirement IDs | Evidence |
|---|---|---|---|---|---|---|---|

- **Kind** ∈ {route handler, server lib module, React component, DB table, DB function/trigger/policy, config/registry, background job, migration, other}
- Location must be file path + symbol/line at the inspected revision, or schema + object name for DB elements.
- Use "no implementation located" as a valid, explicit finding rather than omitting a row — per the objective's instruction not to invent a technical element where none exists.

## What's already known and will seed this register in Stage 2

From `01-source-register.md`:
- 190 `CREATE TABLE` statements and 172 `ADD COLUMN IF NOT EXISTS` statements in `server/db.js` — each will become one or more `DB table` rows once enumerated.
- 53 files in `server/routes/` — each is a candidate cluster of `route handler` elements once its individual endpoints are read.
- ~95 files in `server/lib/` — each a candidate `server lib module` element.
- `src/components/blocks/index.jsx`'s `REGISTRY` (per `CLAUDE.md`, an append-only map of `section.type → Component` — a deployment-safety invariant) will need its own enumerated element list once read, since every entry is individually load-bearing for existing member data.

No element rows are recorded yet.
