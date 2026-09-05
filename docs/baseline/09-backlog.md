# Prioritized Backlog — Blocked

**Status: blocked.** A dependency-ordered backlog derives from the reconciliation matrix (`06`) and target specification (`08`), neither of which exist yet. Populating this now would mean prioritizing work against invented requirements.

## Required row schema (for when this unblocks)

Each task: stable **Task ID** (prefix `TASK-`), objective, source and mapping IDs, affected components and database objects, dependencies, priority with rationale, acceptance criteria, test IDs, migration implications, and definition of done. Product decisions are tracked separately in `07-decision-log.md`, not mixed into executable tasks.

## Known hygiene items surfaced during Stage 1 (not yet tasks — logged in `07-decision-log.md` instead)

These are documentation-drift findings, not backlog items: DEC-001 (`CLAUDE.md` test-runner statement is stale), DEC-002 (`.env.example` missing documented-required vars), DEC-003 (no staging environment), DEC-004 (`migrations/` mechanism unconfirmed). They will convert to `TASK-` entries only once you decide they warrant action, per the objective's separation of product decisions from executable tasks.

Nothing else to prioritize yet.
