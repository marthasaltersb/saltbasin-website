---
description: Advance the Salt Basin Pre Build by one phase — canonical Member identity, Personal Brand Website/World, Resume Output Projection, Member financial connections, and Organization Admin modules/worlds. Repeatable across sessions.
---

Invoke the `salt-basin-pre-build` skill to advance the Member Configuration + Member Organization Admin Configuration build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-pre-build-progress.md` and run the next phase whose status is `not started` or newly-unblocked.
- If it names a phase (a number 1–6, or a keyword like `identity`, `brand`, `resume`, `financial`, `staff`, `orgadmin`, matched against `.claude/skills/salt-basin-pre-build/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-pre-build-progress.md` (phase statuses, open decisions, changelog) without making changes.
- If it is `decisions`, list the three open decisions from `reference/phases.md` / the progress tracker and ask Betsy directly for an answer on any still marked `unanswered` — do not proceed with a build until she responds.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — the skill is designed to run one phase at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker and open-decisions table first, read only the spec sections and reconciliation-memo passages relevant to the chosen phase, do the actual structural build work (not just a findings list), then update the progress tracker before reporting back.
