---
description: Audit a build for new tables/mechanisms that should instead reuse the Channel Journey substrate (rod_types, Tributary registry, event-sourced state, tracked interactions, Atom/Molecule/bonding tables) — run before planning and after implementing any Riverbed/Channel/Current/Atom/Molecule/Orbit concept.
---

Invoke the `salt-basin-channel-journey-architecture` skill against: $ARGUMENTS

- If empty: audit the current working tree (`git status` / `git diff`) — a **post-implementation** pass over whatever is currently changed but not yet committed.
- If it describes a task, feature, or plan that hasn't been built yet: run the **pre-implementation** pass — audit the plan for new-table proposals before code is written.
- If it names specific files, a diff, or a PR: run the **post-implementation** pass against that scope.
- If it is `full` or `repo`: run the full checklist against the whole `journey_*` schema and every registry (`tributaryRegistry.js`, `provisioningPolicyRegistry.js`, `currentRegistry.js`, `eidosBonding.js`). Confirm scope with Betsy before starting.

Follow the skill's workflow exactly: for every new Riverbed/Channel/Tributary/Current/Current-Arc/Atom/Molecule/Orbit concept, work through the six-item reuse-first checklist in order before accepting any new-table proposal, check the existing-surface table, and end with the classified list (REUSES EXISTING SUBSTRATE / NEW TABLE, JUSTIFIED / NEW TABLE, NOT YET JUSTIFIED / AGENT BOUNDARY OR FINE-GRAINED SECURITY GAP) plus any "NEW TABLE, NOT YET JUSTIFIED" items called out separately. Do not let an unjustified new table through silently.
