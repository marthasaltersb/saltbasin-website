---
description: Advance the Salt Basin Seven-Layer Theory, Matrix & Journey Engine build by one phase — seven theory layers, seven definitions per concept (the seventh is always Rest), a 49-family matrix registry, a hypergraph relationship engine, the musical composition model (Note/Chord/Journey Data Rod/Clef/Staff/Sheet/Measure/Beat/Rest), a 1–12 interval temporal engine, and builder integration. Discovery-first, extend-never-fork. Repeatable across sessions.
---

Invoke the `salt-basin-seven-layer-theory` skill to advance the Seven-Layer Theory build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-seven-layer-theory-progress.md` and run the next phase whose status is `not started` or newly-unblocked. Never start Phase 3 (Persistence) or later while the Phase 2 architecture is still `awaiting review` — report the open decisions instead.
- If it names a phase (a number 1–8, or a keyword like `discovery`, `architecture`, `persistence`, `registry`, `matrix`, `hypergraph`, `temporal`, `rest`, `calculation`, `builder`, `validation`, matched against `.claude/skills/salt-basin-seven-layer-theory/reference/phases.md`), run that specific phase — subject to the same review gate.
- If it is `status`, don't run a phase — just read and summarize the progress tracker (phase statuses, compatibility assessment, open decisions, changelog) without making changes.
- If it is `approve` followed by decision answers (e.g. `approve DEC-SLT-01=b DEC-SLT-02=keep-app-level`), record Betsy's answers in the tracker's decision log, set Phase 2 to `approved` only when every blocking decision is answered, and stop. Do not start Phase 3 in the same turn.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — the skill runs one phase at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker first, read only the master-spec sections relevant to the chosen phase, inspect the real implementation before designing anything, run `/channel-journey-architecture` (pre-implementation pass) against any proposed new table and `salt-basin-config-audit` against any new weighted formula, follow the release loop for any code change, then update the tracker before reporting back. Never invent a Salt Basin product definition, never present a design analogy as a proven equivalence, and never treat missing data as an authorized Rest.
