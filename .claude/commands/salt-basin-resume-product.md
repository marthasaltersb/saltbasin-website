---
description: Advance the Salt Basin Resume Product by one phase — Career Master Foundation, evidence-graded transferable-skill scoring, configurable resume templates, contribution ledger, and Betsy's actual Osaic application. Repeatable across sessions.
---

Invoke the `salt-basin-resume-product` skill to advance the Salt Basin Resume Product build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-resume-product-progress.md` and run the next phase whose status is `not started` or newly-unblocked.
- If it names a phase (a number 1–7, or a keyword like `reconciliation`, `career-master`, `scoring`, `templates`, `ledger`, `tracking`, `osaic`, matched against `.claude/skills/salt-basin-resume-product/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-resume-product-progress.md` (phase statuses, open blockers, changelog) without making changes.
- If it is `decisions`, list the open `DEC-006` through `DEC-010` entries from `docs/baseline/07-decision-log.md` and ask Betsy directly for an answer on any still `OPEN` — do not proceed with a build until she responds.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — the skill is designed to run one phase at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker and open blockers first, read only the intake-package sections relevant to the chosen phase, run the reuse-first (`salt-basin-channel-journey-architecture`) and config (`salt-basin-config-audit`) audits where the workflow calls for them, do the actual structural build work (not just a findings list), then update the progress tracker before reporting back. Never finalize Phase 7 (Betsy's real Osaic materials) while DEC-010 is open or the exact posting is missing.
