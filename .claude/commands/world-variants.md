---
description: Advance the Salt Basin 3D World Variant Engine build by one phase — render the same governed semantic model (Query Relevance/Coverage/Confidence, Rod Maturity, Cross-Rod Alignment, ...) through materially distinct 3D spatial metaphors (Crystal Basin, Orbital Intelligence, Monetary River, Enterprise Highway, Neural Constellation, Temporal Canyon). Repeatable across sessions.
---

Invoke the `salt-basin-world-variants` skill to advance the 3D World Variant Engine build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-world-variants-progress.md` and run the next phase whose status is
  `not started` or newly-unblocked.
- If it names a phase (a number 1–9, or a keyword like `inspect`, `registry`, `encoding`, `profiles`,
  `crystal-basin`, `orbital`, `river`, `highway`, `constellation`, `canyon`, `switcher`, `comparison`,
  `studio`, `explanation`, `temporal`, `performance`, `evaluation`, matched against
  `.claude/skills/salt-basin-world-variants/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-world-variants-progress.md`
  (phase statuses, the Phase 1 audit, open naming decisions, and changelog) without making changes.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single
  turn — the skill is designed to run one phase (or a documented sub-split, per Phase 5's and Phase 6's
  scope-discipline note) at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker first, read only the master-prompt section(s)
relevant to the chosen phase, check `docs/salt-basin-visual-metrics-progress.md` for the Metric Definition
Registry / Visual Encoding Registry this build depends on before designing a phase that needs them, do the
actual structural work (registry, profile system, real variant renderer — not a findings list or an inert
config document), run `salt-basin-config-audit` against any new profile/encoding surface, then update the
progress tracker before reporting back. Never let a variant redefine what a semantic metric means, never let
a variant conditional leak into an unrelated render component, and never resolve the `WORLD_REGISTRY`
naming collision by fiat — it's an open decision, not this skill's to close. (The prior "Orbin" vs. "Orbit"
question is resolved — "Orbit" is canonical, per Betsy 2026-07-12.)
