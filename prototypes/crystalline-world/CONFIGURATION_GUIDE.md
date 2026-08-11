# Configuration Guide

All configuration lives near the beginning of the inline script in `salt-basin-crystalline-world-v2.html`.

## Rods and stages

Edit `RODS`. Preserve unique `id` values. Each rod owns its label, color, world `z` lane, and ordered `stages` array. The generator, stage rail, minimap, Ride, and camera consume this registry automatically.

## Atoms and site data

Replace the seeded atom object creation with values adapted from Salt Basin `section` and `fieldMeta`. Use `SITE_MODEL_ADAPTER` as the contract. Recommended projection inputs are maturity, evidence density, lineage depth, relationship count, contested, validated, atom type, molecule type, completion, and force applications.

## Crystal systems and growth

Tune `SYSTEMS`, `GROWTH_TIERS`, and only `projectOperationalStateToCrystal()`. Do not scatter maturity rules through rendering functions. Every geometry decision should flow through the returned projection specification.

## Infrastructure

Add entries to `INFRASTRUCTURE` with `label`, `cost`, `prereq`, `capability`, `benefit`, and `form`. Placement is restricted to the active district lane. Add a form renderer in `placeTower()` when introducing a genuinely new shape family.

## Tasks, events, companions and simulator routes

- Tasks: add registry entries to `TASKS` and map their progress signal in `renderContextPanels()`.
- Events: extend `EVENTS` with governed trigger/copy pairs; persistent event history is available in `state.events`.
- Companions: Shard is the initial `companion` group. Add future companions as configuration-driven groups with the same follow/reaction contract.
- Routes: add entries to `SIMULATOR_ROUTES`; route cards and previews are generated automatically.

## Persistence

Increment `SCHEMA_VERSION` when stored shapes change. Keep `loadState()` defensive and provide migration defaults before consuming saved values.
