# Release 0.3.0 updates

Release 0.2.0 is frozen in docs/release-log/releases/0.2.0/.

## 2026-10-10 — definition-studio (new)

Definition Studio: Betsy's process flow builder prototype, ported into the platform as the Composer
interface (World Shell → Journeys → Definition Studio, admin). One workspace per module (the Career module
first) or composed product; every save is a versioned document in the database; the canvas itself is
configurable (levels, shapes, step fields, option lists, geometry sizes), each item with a plain name, an
L-number id and a fixed API name; drafting runs on the server; 10 MCP tools.

- Change spec `docs/changes/definition-studio.md`, training spec `docs/training/definition-studio.md` (v1).
- Round 1: 33 pass, 2 pass-with-note, 2 fail (`docs/test-results/definition-studio/round-1.md`; triage
  `docs/triage/definition-studio-round-1.md`). Round 2: all 8 re-validated steps pass
  (`docs/test-results/definition-studio/round-2.md`).
- Validated locally against a fresh Postgres 16 database, branch `feature/seven-layer-theory`; not merged.
