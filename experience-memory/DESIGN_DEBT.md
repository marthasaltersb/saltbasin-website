# Design Debt

1. P0 — Pointer-driven 3D scenes lack complete keyboard/non-visual parity.
2. P0 — Runtime experiential findings are not yet persisted into Agent Hub runs.
3. P1 — Camera and motion constants remain partly scene-local.
4. P1 — User/agent character schemas are not yet wired into every world.
5. P1 — First real slice landed 2026-08-10 (`flickering-petting-brook` plan): `SHARED_WORLD_STATE_REFERENCE`,
   a real Scenario Scope selector (`QUERY_CONTEXT_REGISTRY`, reused as-is), an illustrative Time Scope
   slider, and a Dashboard Definition View (`dashboardDefinitionRegistry.js`,
   `resolveDashboardComposition()`) that shows multiple lenses together over one converged result. The
   single-select "View Lens" picker (`activateVariant`) still exists alongside the new dashboard mode rather
   than being replaced — downgraded from P0 since the shared-state model is now real, not just critiqued, but
   still open: the two selection modes should eventually converge into one.
6. P1 — Large scene builders need extraction into compiler-consumable components.
7. P1 — Historical playback and persistent consequences are not generalized. The 2026-08-10 Time Scope slider
   is explicitly illustrative/synthesized (`lineage.js`), not a replay of real `journey_rod_events` — that
   reconciliation remains open, flagged as a Non-Goal in the `flickering-petting-brook` plan.
8. P2 — Asset provenance, licensing, LOD, and performance measurements require automated ingestion.
9. P2 — Static/loop/cinematic outputs are not yet compiled from one manifest.
10. P1 — Dashboard Definition View's split-viewport panes share one user-controlled camera (no independent
    per-lens framing) and disable click-to-select entirely while active (no split-viewport hit-testing).
    Both are real, deliberate scope cuts from the 2026-08-10 plan, not accidental gaps — closing them is
    `salt-basin-world-variants` Phase 7's job (Interaction Intent layer, per-lens cameras).
