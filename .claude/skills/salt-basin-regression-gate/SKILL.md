---
name: salt-basin-regression-gate
description: Full Salt Basin build-completion and regression gate — treat a feature as unproven until it has been driven as an interacting user in the browser, checked against the canonical Channel/Channel Rod creation rules, the full enterprise deal Channel, collaborative/concurrent-user behavior, Agent authority boundaries, cross-Rod query convergence, temporal lineage, and an architecture-regression checklist, then reconciled against the Foundation Source of Truth. Use when Betsy invokes /regression-gate, references "the regression gate," "the completion gate," "the build completion prompt," or asks whether a Salt Basin build is actually done (not just rendering) before declaring completion.
---

# Salt Basin Build Completion and Regression Gate

A feature rendering, or a component mounting without errors, is not evidence the build is complete.
This gate exists because those are exactly the false positives that have passed before. **Do not declare
completion until this gate has been executed** for the scope of the current change.

## Ground rule

Successful component mount ≠ successful rendering. A cream, blank, empty, visually ambiguous, off-camera,
clipped, or contextless 3D view is a **failed state**, even if no error was thrown and no console warning
fired. Judge every 3D/spatial check by what a real screenshot or read_page actually shows, not by the
absence of an exception.

## Workflow

1. **Determine scope.** Read the diff (`git status` / `git diff`) or ask Betsy which feature/loop just
   landed if it isn't obvious. Don't run the full gate against unrelated, unchanged surface area — but
   don't narrow scope just because it's convenient either. If the change touches shared registries
   (`src/config/visual/visualSemanticRegistry.js`, `server/lib/eidos.js`, `src/lib/journeyEngine/*`,
   `AdminShell.jsx` tab routing), the blast radius includes every consumer of that registry.
2. **Start the app and drive it as a user** (browser tools — see `reference/interaction-checklist.md` for
   the full test list: desktop/mobile, nav visibility, viewport clipping, panel sizing, split-screen, 3D
   scene loading, camera framing, checkpoint/Molecule/Atom interaction, return-to-World-View, Agent chat
   availability). Never substitute "the component mounted" or "no console error" for actually looking at
   the rendered frame.
3. **Test the canonical Channel creation rules** — external-source lead, internally created account-team
   lead, direct-to-consumer purchase. Full sequences in `reference/channel-rules.md`.
4. **Test the full enterprise deal Channel end-to-end**, including everything after Opportunity Close
   (onboarding through exit). Full stage list in `reference/channel-rules.md`. The Channel must not stop
   at Close — if it does, that is a gap, not a scope boundary.
5. **Test collaborative/concurrent behavior and Agent authority enforcement** — multiple interacting users
   at one Checkpoint, contributor lineage, an Agent mediating a denied action versus a permitted proposal.
   Full scenarios in `reference/agent-authority-and-concurrency.md`.
6. **Test a cross-Rod query** (ARR / pipeline / onboarded customers / adoption) for visible convergence,
   lineage, and result-contribution highlighting, plus temporal state inspection (10 weeks ago / present /
   near-future). Full test in `reference/query-convergence-and-temporal.md`.
7. **Run the architecture regression checklist** — confirm none of the listed regressions were
   reintroduced. Full checklist in `reference/architecture-regression-checklist.md`.
8. **Reconcile against the Foundation Source of Truth** (`docs/salt-basin-foundation-source-of-truth.md`).
   If the build introduced a new canonical architecture decision, update the Foundation. If the build
   conflicts with the Foundation, **do not silently overwrite it** — identify the conflict and preserve it
   as an unresolved decision (append to `docs/salt-basin-master-build-progress.md`'s flagged-conflicts
   section) unless Betsy's explicit instruction resolves it in this conversation.
9. **Report results as a gate outcome**, not a narrative: PASS/FAIL per section above, every failed state
   named concretely (what was expected, what was actually seen), and any Foundation conflicts surfaced
   separately. Do not declare the build complete if any section failed.

## Orientation requirement for every camera move

Whenever the system moves the interacting user to an object (a Rod, Tributary, Checkpoint, Molecule,
Atom), the target must become visually obvious through restrained Salt Basin-approved visual treatment —
not just present in the scene graph. The camera must intentionally frame it as the center of attention.
After the move, the user must be able to answer all five without guessing:

- WHERE AM I?
- WHAT AM I LOOKING AT?
- WHY WAS I MOVED HERE?
- WHAT CAN I DO HERE?
- WHICH AGENT CAN HELP ME?

If a screenshot or read_page after a camera move can't answer one of these, that move is a failed state,
regardless of whether the transition animation completed without error.

## Files

- `reference/interaction-checklist.md` — the full user-interaction test list (desktop/mobile, nav,
  viewport, panels, 3D scene loading/camera/centering, checkpoint/Molecule/Atom interaction, Agent chat
  availability, read-only vs. denied vs. permitted-proposal behavior, config persistence).
- `reference/channel-rules.md` — the three canonical Channel-creation sequences (external-source lead,
  internal account-team lead, direct-to-consumer) and the full enterprise deal Channel stage list
  (Lead → Exit, with configurable exit outcomes).
- `reference/agent-authority-and-concurrency.md` — concurrent-user-at-one-Checkpoint scenarios,
  contributor identity lineage, collaborative reasoning before persistence, and the Account
  Executive/post-onboarding-billing Agent-boundary test.
- `reference/query-convergence-and-temporal.md` — the cross-Rod ARR/pipeline/adoption query test
  (Atom identification → Magnetic Field activation → Molecule formation → Channel Rod convergence →
  compressed query Rod hash → result → selectable lineage) and the 10-weeks-ago/present/near-future
  temporal inspection test.
- `reference/architecture-regression-checklist.md` — the full list of regressions to confirm are absent
  (terminology, identity types, scope leakage, lost effective-dating/lineage, Agent-boundary bypass,
  config-to-hardcode reversion, decorative 3D, brand color violations).

## Cross-references into the existing codebase

Don't treat this gate as free-floating theory — point every failure at real code:

| Area | Where to look |
|---|---|
| 3D spatial rendering / camera / centering | `src/components/SpatialJourneyWorld.jsx`, `CrystalRoomScene.jsx`, `CrystalOfficeScene.jsx`, `CrystalMarkField.jsx`, `src/config/visual/visualSemanticRegistry.js`, `src/config/visual/worldRegistry.js` |
| Channel / Channel Rod / Tributary / lineage engine | `src/lib/journeyEngine/*`, `server/routes/journeyRods.js`, `src/data/journeyWorldConfig.js` |
| EIDOS (Atoms/Molecules/Magnetic Field/Ports/query convergence) | `server/lib/eidos.js`, `server/routes/eidos.js`, `src/components/admin/EidosOperatingModelPanel.jsx` |
| Agent authority / BestyStaff | `server/routes/bestyStaff.js`, `server/routes/memberAgent.js`, `src/lib/journeyEngine/mockAgentProvider.js` |
| Member/Org authority & scope | `org_memberships.role`, `product_licenses.tier`, `data_entitlements.scope` — see `docs/salt-basin-master-build-member-org-reconciliation.md` before assuming a scope model |
| Foundation Source of Truth | `docs/salt-basin-foundation-source-of-truth.md`, `docs/salt-basin-foundation-source-of-truth.registry.json` |
| Open conflicts / changelog | `docs/salt-basin-master-build-progress.md` |

Run `salt-basin-config-audit` alongside this gate when a regression finding turns out to be a hardcoded
assumption rather than a functional bug — the two are complementary, not redundant: this gate proves the
build *behaves* correctly; the config audit proves it *stays configurable* while doing so.
