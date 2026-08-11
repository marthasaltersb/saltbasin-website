# Salt Basin Crystalline World v2 — Architecture Notes

## Preservation boundary

The Downloads source remains untouched. `salt-basin-crystalline-world-v2.html` began as a byte-for-byte working copy. Its palette, typography, intro, renderer, three rods and original stage order, Deal Points, Flight/World/Build modes, stage navigation, Ride, orbit/zoom, picking, inspector, conflict resolution, event button, minimap, quest, and animation loop remain in place.

## Architecture map

1. **Configuration/data model** — `C`, `SYSTEMS`, `RODS`, `NAMES`, plus additive registries for growth tiers, infrastructure, tasks, simulator routes, save schema, and `SITE_MODEL_ADAPTER`.
2. **Game state** — the original `state` object now adds Evidence, Trust, Build Capacity, completed tasks, infrastructure, event history, and settings.
3. **Renderer/scene** — original Three.js renderer, lights, fog, world group, ground, grid, stars, camera, and pickable arrays remain authoritative.
4. **Materials/geometry** — original material/glow/label helpers remain. `projectOperationalStateToCrystal()` is now the single maturity-to-render specification. `buildCrystal()` consumes it.
5. **Flight world** — the original rod/stage loops remain. Additive relationship tubes, locked district placeholders, dust, and Shard are created afterward.
6. **World map** — original World mode/camera scale and minimap remain; district context and locked expansion zones enrich it.
7. **Camera/controls** — original yaw, pitch, zoom, drag, wheel, keyboard, pointer picking, and Ride remain. Double-tap recenter, stage arrival feedback, reduced-motion settings, and Shard follow are additive.
8. **HUD** — original brand, resources, mode bar, quest, actions, inspector, event banner, toast, and minimap remain. Stage rail, companion card, tool dock, Build tray, modal workspaces, accessibility status, startup status, and performance overlay extend them.
9. **Inspector/Data Story** — original atom inspector and reinforce/resolve action remain; scientific projection, governed caveat, evidence/lineage/relationship measures, and Data Story context were added.
10. **Force/maturity** — original maturity delta behavior remains; geometry now re-crystallizes continuously after Apply Force / resolution.
11. **Tasks/simulator** — original quest remains. Operational tasks and five alternate paths provide contextual work surfaces.
12. **Animation** — original loop still drives render, Ride, camera, crystal motion, and stage pulse; dust, relationships, dynamic lights, Shard, and metrics are additive.
13. **Events/input** — original handlers remain. Startup uses guarded one-time activation and global error handling; modal, Build, mobile, persistence, and accessibility handlers are additive.

## Salt Basin website data-model mapping

- `site_state.pages[]` / `member_sites.pages[]` → rod or domain worlds.
- `sections[]` → stages or governed structures.
- `section.id` → atom identity.
- `section.type` → molecule/crystal habit and contextual renderer.
- `section.status` → growth, maturity, and validation state.
- `section.content` → inspectable governed matter.
- `section.fieldMeta` → evidence density, lineage, source type, capability tags, relationships, and contested state.
- draft/published pairs → immature/validated stable projections.
- `config_state` / `member_configs` → district rules, navigation, resource registries, infrastructure and projection configuration.
- admin/member scope → Betsy-site or member-owned worlds without changing the rendering engine.

## Known boundary

The prototype is a standalone single HTML document with CDN-loaded Three.js and web fonts. The generated key visual is a separate design reference and is not a runtime dependency.
