---
name: reuse-first-audit
description: Audit a plan before building, and a diff after, for new tables, parallel mechanisms or bespoke storage that should instead reuse an existing record type, relationship type, event type, tracked interaction or additive column. Use before planning and after implementing anything that adds or changes how data is stored or linked.
---

# Reuse-first audit

The question for every new concept:

> Can this be expressed by reusing an existing record type, relationship, event type, tracked
> interaction or definition table — or does it genuinely need new storage?

## Checklist, in order

Only fall through to "new table" when every step is a genuine poor fit.

1. **A new type of an existing record?** In Salt Basin: a new `rod_type`. A new kind of thing with a
   journey is a new type row, not a new table.
2. **A new relationship-registry entry?** Every record-to-record link is named in one registry, with one
   insert path and one validation gate. Never write bespoke insert code per caller.
3. **A new event type?** State that changes over time is reconstructed from append-only events, not
   stored as a second mutable "current state" table.
4. **A new tracked interaction?** Usage tracking already exists, so add an entry, not new analytics
   tables.
5. **A new definition row** (an attribute or group definition)? Memberships are computed from rules,
   never stored as static lists.
6. **An additive column?** A new fact about an existing row becomes an idempotent
   `ADD COLUMN IF NOT EXISTS`.

## History checks (always)

- Does anything delete rows that history depends on? (Cascading deletes and physical evidence deletes
  are red flags.)
- Does every change to a record also write an event, in the same transaction?
- Is corrected data superseded with a pointer to what it replaced, instead of overwritten?

## Classify every new concept

- **REUSES EXISTING SUBSTRATE**: name exactly what it extends.
- **NEW TABLE, JUSTIFIED**: say why all six checklist steps failed.
- **NEW TABLE, NOT YET JUSTIFIED**: flag it before it ships.
- **AGENT BOUNDARY / SECURITY GAP**: reserved but not enforced. Say so; never claim enforcement that
  doesn't exist.

End with what was rewired to reuse existing structures, the classified list, and the unjustified items
called out separately.
