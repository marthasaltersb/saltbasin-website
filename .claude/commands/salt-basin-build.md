---
description: Advance the Salt Basin Ultimate Master Build by one reconciliation loop (Foundation, Channel architecture, EIDOS, DataBasin, 3D world). Repeatable across sessions.
---

Invoke the `salt-basin-master-build` skill to advance the Salt Basin Holdings master build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-master-build-progress.md` and run the next loop whose status is `not started` or newly-unblocked.
- If it names a loop (a number 1–20, or a keyword like `foundation`, `agents`, `security`, `website`, `scenarios`, matched against `.claude/skills/salt-basin-master-build/reference/loops.md`), run that specific loop.
- If it is `status`, don't run a loop — just read and summarize `docs/salt-basin-master-build-progress.md` (loop statuses, open conflicts, changelog) without making changes.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one loop in a single turn — the skill is designed to run one loop at a time for reviewability.

Follow the skill's workflow exactly: read the progress tracker and flagged conflicts first, read only the master-prompt sections relevant to the chosen loop, do the structural work (not just a findings list), run the `salt-basin-regression-gate` skill against the loop's diff before marking it `done`, then update the progress tracker before reporting back.
