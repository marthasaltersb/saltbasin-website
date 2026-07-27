---
description: Advance the Contribution Intelligence System build by one phase — evidence-based human-vs-AI contribution reconstruction, attribution, lineage, and economic valuation, starting from real Claude session data. Repeatable across sessions.
---

Invoke the `salt-basin-contribution-intelligence` skill to advance the Contribution Intelligence System build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-contribution-intelligence-progress.md` and run the next phase whose status is `not started` or newly-unblocked.
- If it names a phase (a number 1–8, or a keyword like `inspection`, `taxonomy`, `differentiation`, `session`, `cost`, `lineage`, `channels`, `sales`, `marketing`, matched against `.claude/skills/salt-basin-contribution-intelligence/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-contribution-intelligence-progress.md` (phase statuses, open decisions, changelog) without making changes.
- If it is `decisions`, list the three open decisions from `reference/phases.md` / the progress tracker and ask Betsy directly for an answer on any still marked unanswered — do not proceed with a build until she responds.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — the skill is designed to run one phase at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker and open-decisions table first, read only the master-prompt sections relevant to the chosen phase, inspect the real repo before designing new schema (especially for Phase 1), do the actual structural build work (not just a findings list), version every classification/estimate/attribution rather than treating it as precise fact, then update the progress tracker before reporting back.
