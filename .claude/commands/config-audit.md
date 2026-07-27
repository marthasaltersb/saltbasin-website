---
description: Audit a build for hardcoded product assumptions that should be configuration — run before planning and after implementing any Salt Basin feature.
---

Invoke the `salt-basin-config-audit` skill against: $ARGUMENTS

- If empty: audit the current working tree (`git status` / `git diff`) — this is a **post-implementation** pass over whatever is currently changed but not yet committed.
- If it describes a task, feature, or plan that hasn't been built yet (e.g. "the new agent proximity panel"): run the **pre-implementation** pass — audit the plan for hardcoded assumptions before code is written.
- If it names specific files, a diff, a PR, or says "after"/"post": run the **post-implementation** pass against that scope.
- If it is `full` or `repo`: run the full checklist against the whole codebase. This is a long pass spanning schema, agents, 3D rendering, and simulation — confirm scope with Betsy before starting rather than doing a shallow sweep.

Follow the skill's workflow exactly: ask "would Betsy need to edit source code to change this for another Member, Organization, product, Channel, industry, or business scenario?" for every relevant item in the checklist, check whether a configuration surface already exists in this repo (see the skill's surface table) before proposing a new one, convert SHOULD BECOME CONFIGURATION items that are in scope for this build, and end with the classified list (INTENTIONAL PLATFORM CONSTANT / FOUNDATION-LOCKED BRAND RULE / SHOULD BECOME CONFIGURATION / TEMPORARY PROTOTYPE DEBT) plus any TEMPORARY PROTOTYPE DEBT called out separately. Do not hide prototype debt.
