# Interaction Checklist

Inspect the resulting implementation as an interacting user — not by reading source and assuming it works.
Drive the actual running app (browser tools: `preview_start`, `computer`, `read_page`,
`read_console_messages`, `resize_window`) and confirm each of the following against what actually renders,
not against what the component tree claims to mount.

## Minimum test list

- Desktop
- Mobile (`resize_window` to a mobile preset, confirm layout doesn't just shrink but re-flows correctly)
- Top navigation visibility (not just present in the DOM — actually visible and unobstructed)
- Viewport clipping (nothing critical cut off at any tested width/height)
- Panel sizing
- Split-screen behavior
- 3D scene loading (the scene must actually resolve to geometry, not a blank/cream frame)
- Camera position (intentional, not default/uninitialized)
- Object centering
- Target travel (camera moves purposefully to a target, not a jump-cut to nowhere)
- Checkpoint interaction
- Molecule interaction
- Atom interaction
- Return to World View
- Agent chat availability
- Agent authority enforcement
- Read-only behavior (where the user's authority is read-only, confirm no mutating affordance is exposed)
- Denied-update behavior (attempted mutation the user isn't authorized for is blocked, and blocked
  visibly/explicitly — not silently)
- Permitted-update proposal behavior (an authorized mutation flows through the Agent as a proposal, not a
  direct write)
- Concurrent-user representation
- Temporal lineage
- Query convergence
- Result contribution highlighting
- Configuration persistence (a config change survives reload/re-fetch, not just local component state)

## Failed states (treat as gate failures, not warnings)

- A cream, blank, empty, visually ambiguous, off-camera, clipped, or contextless 3D view
- Successful component mounting mistaken for successful rendering — always verify what's actually on
  screen (screenshot or `read_page`), not just that no error was thrown
- Any camera move that doesn't leave the user able to answer WHERE AM I? / WHAT AM I LOOKING AT? / WHY WAS
  I MOVED HERE? / WHAT CAN I DO HERE? / WHICH AGENT CAN HELP ME? (see SKILL.md's orientation requirement)
