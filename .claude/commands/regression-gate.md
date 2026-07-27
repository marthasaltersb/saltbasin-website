---
description: Full Salt Basin build-completion and regression gate — drive the app as a user, test Channel creation rules, Agent authority, query convergence, temporal lineage, and architecture regressions before declaring a build complete.
---

Invoke the `salt-basin-regression-gate` skill against: $ARGUMENTS

- If empty: determine scope from the current diff (`git status` / `git diff`) — this is a **post-implementation** gate over whatever was just built but not yet declared complete.
- If it names a feature, loop, or component (e.g. "the onboarding Channel", "loop 6", "checkpoint interaction"): scope the gate to that area, but still run every section of the gate (interaction, Channel rules, agent authority, query convergence, temporal, architecture regression, Foundation reconciliation) against it — don't skip sections because the named scope seems narrow.
- If it is `full` or `all`: run the complete gate against the whole current build state. This is long — confirm with Betsy before starting rather than doing a shallow sweep.

Follow the skill's workflow exactly: start the app and drive it as an interacting user in the browser (never substitute "it mounted" or "no console error" for actually looking at the rendered frame), work through every reference checklist (`interaction-checklist.md`, `channel-rules.md`, `agent-authority-and-concurrency.md`, `query-convergence-and-temporal.md`, `architecture-regression-checklist.md`), and end with the Foundation Source of Truth reconciliation step. Report as a PASS/FAIL gate outcome with every failed state named concretely — do not declare the build complete if any section fails.
