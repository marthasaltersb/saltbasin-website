---
description: Advance the Salt Basin Visual Metrics / Query Convergence / Data Rod Mathematics redesign by one phase — give every displayed score, percentage, and convergence behavior in the 3D world a defined, explainable semantic meaning. Repeatable across sessions.
---

Invoke the `salt-basin-visual-metrics` skill to advance the visual-metrics redesign.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-visual-metrics-progress.md` and run the next phase whose status is `not started` or newly-unblocked.
- If it names a phase (a number 1–7, or a keyword like `audit`, `taxonomy`, `registry`, `relevance`, `coverage`, `confidence`, `stability`, `rod`, `maturity`, `density`, `coherence`, `alignment`, `encoding`, `orbit`, `drilldown`, matched against `.claude/skills/salt-basin-visual-metrics/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-visual-metrics-progress.md` (phase statuses, audit table, changelog) without making changes.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — the skill is designed to run one phase (or a documented sub-split of a phase, per Phases 3 and 4's scope-discipline note) at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker and audit table first, read only the master-prompt sections relevant to the chosen phase, inspect the real 3D/journeyEngine implementation before designing anything (especially for Phase 1), do the actual structural work (registry, calculation engine, or UI redesign — not just a findings list), run `salt-basin-config-audit` against any new weighted formula, then update the progress tracker before reporting back. Never let a displayed number survive into the redesigned experience without a defined business or semantic question it answers.
