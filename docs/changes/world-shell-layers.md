# Change spec — World Shell layers: the Sun is the root menu and every click goes one layer deeper

Feature key: `world-shell-layers` · Release: `2026-10-02-application-packages-resume` · Version 1 · 2026-10-09
Branch: `release-loop/world-shell-layers-build-r3` (built on integration head `0800b1c`, merging the salvaged `release-loop/world-shell-layers-build-r2` work; the requested branch name `release-loop/world-shell-layers-build` is already checked out by two stale worktrees at `536aa29`, so it could not be reused)
Training spec: `docs/training/world-shell-layers.md`

Owner direction (2026-10-09): "the world shell navigation should leverage the sun crystal menu nav and then every click after is the user moving another layer deep ... the user moving through layers with more detail exposed against each object in the scene at each layer", and "i also need to be able to navigate back to the summary pages so i need breadcrumbs".

## Traces to

| Earlier spec / commit | Version | How this builds on or supersedes it |
| --- | --- | --- |
| `docs/changes/world-shell-opportunity-outputs.md` (training spec `docs/training/world-shell-opportunity-outputs.md`, feature key `world-shell-navigation`) | v1, 2026-10-02 | Builds on: the opportunity panel, `OpportunityOutputsSection`, the shared editor, the version-history window. **Kept working unchanged:** the output cards, **Edit draft**, **Approve for QR**, **Unlink**, **Link output**, **← Tracked list**, **← Back to World** and every label that spec's steps use (verified, see Verified). **Changed behaviour** (not removed): each of those buttons now pushes/pops a layer, and the opportunity page gains **Open output ›** and **Open application outputs (n) ›**. Its journeys are not edited by this feature. |
| Island registry design in `src/lib/worldIslands.js` (2026-09-06 destination metadata, `ISLAND_REGISTRY`, `resolveWorldIslands`) | as of `c3a71b4` | Builds on and reuses it as the source of the Sun menu; nothing in the registry is changed (append-only). |
| `src/lib/crystalGeometry.js` | as of `c3a71b4` | Reused: the Sun is the existing `CRYSTAL_VARIANTS.signature` core; no new 3D scene, no forked variant. |
| `docs/changes/output-version-history.md` | `c3a71b4` | Reused: the version-history window is the Version history layer. |
| Salvaged partial build `7f2e292` (`release-loop/world-shell-layers-build-salvage`, untested) | n/a | Taken as the starting point (hook, breadcrumb component, layer vocabulary), reviewed line by line, then completed and tested. |
| Release loop definition | `server/data/releaseLoop/definition.json` v4 | This spec follows `specStandards` and `interfaceParity`. |

## What changed, in one paragraph

The World Shell now has ONE navigation model, a stack of layers. The Sun (the 3D core crystal) is layer 0 and the root menu: the right-hand panel at layer 0 is a labelled **Sun menu** listing every place the signed-in user may go (keyboard and screen-reader operable, mirrored in the DOM), and clicking the Sun (or its crumb) always returns to it with keyboard focus on the first entry. Every click into an object pushes exactly one layer after it (island, then item, then sub-object, then editor/version history) and the camera moves toward the selected island; each layer shows more about its object than the one above (the opportunity page shows a count and the cards; **Application outputs** lists them; **Output** shows full provenance and its versions as clickable entries). A breadcrumb trail (`Sun › island › item › sub-object`) records the path actually taken, summary pages (Sun menu, Journeys grid, tracked list, outputs list) included, so each is a crumb that returns to it with its scroll position and filters intact; opening the same opportunity from the Journeys grid instead of the Sun menu gives a different trail and its own remembered state. Escape, the old back buttons (labels unchanged) and the browser's Back/Forward all move one layer. The whole stack is in the URL (`/world?at=...`), so refresh, shared links and Back/Forward restore the exact layer; anything unknown or no longer permitted falls back to the deepest valid layer with a visible note.

## Data model (additive only)

None. No table, column, config row or seed changes; nothing touches member rows. The only persisted state is the URL. Per-layer scroll position and filter values are a per-viewer convenience kept in `sessionStorage` (every access guarded, the shell works without it).

## Server

| File | Change |
| --- | --- |
| `server/lib/worldLayersResolve.js` (new) | `resolveWorldLayers(user, at)`: parses a serialised stack with the same `parseAt`/`structuralProblem` the browser uses (`src/lib/worldLayers.js`), validates every layer against the user's own islands (`admin_nav` for admins; member navigation plus the read-time additive default tabs, as `GET /api/member-config/draft`), moons, opportunities (`listCareerOpportunities` / `listCommercialOpportunities`) and outputs (`listOpportunityOutputs`, which itself asserts ownership), and returns `{ requested, at, scope, valid, note, trail[], sunMenu[] }`. Layers the user may not open are dropped with a note and never described. |
| `server/routes/worldLayers.js` (new), mounted at `/api/world-layers` in `server/index.js` | `GET /api/world-layers/resolve?at=` behind `requireUser` (401 `{"error":"unauthorized"}` when signed out). Same permissions as the UI because it reads through the same functions. |
| MCP | `world_layers_resolve` in `server/lib/mcpToolRegistry.js` (scope `career.read`, permission `user`, appended to `server/data/mcpToolManifest.json`) calls `resolveWorldLayers(user, at)` with the authenticated user: same function and permissions as the route. Capability row `world-layers-resolve` in `server/lib/capabilityParity.js`; `server/routes/worldLayers.js` is a governed route file. |

## Client

| File | Change |
| --- | --- |
| `src/lib/worldLayers.js` (new) | The layer vocabulary (`journeys`, `island`, `moon`, `opp`, `outputs`, `output`, `versions`, `editor`, `classic`; append-only because shared links carry it), `parseAt`/`serializeAt`, structural validity rules (which layer may open on which), per-layer UI memory keyed by the trail that reaches the layer, `prefersReducedMotion()`. Added in this build: an `output` or `editor` layer may open directly on an `opp` (so the opportunity page's **Open output ›** and **Edit draft** buttons are one layer each); a `versions` key may be `<outputId>` (open at the latest) or `<outputId>.<versionId>` (open at that version). |
| `src/lib/useWorldLayers.jsx` (new) | The stack hook and context. The URL is the source of truth: every operation is a `navigate()`, so Back/Forward, refresh and shared links agree with the in-app controls. `pop`/`popTo` use `history.back()` when the target is the previous history entry so the browser's own Back/Forward stay in step. `invalidate(index, why)` drops a layer a component discovered is gone (output unlinked) and says why. Validation problems are fixed once with `replace` and shown as a note. |
| `src/components/WorldBreadcrumbs.jsx` (new) | The trail. Every crumb but the last is a button. At 700px and below a trail of more than two crumbs collapses to `… › current`; **…** opens the full trail as a numbered list (closes on **…** again, on any press outside it, or when the trail changes). **Copy link** shows (and copies) `Link to this layer: <url>`. The note for a fallback appears under the bar with **Dismiss**. All buttons are at least 44px tall at every width (round 4 of in-app-release-loop, step E.1); phone width also adds a 44px minimum width and larger padding. The **Sun** crumb is a button even when current (re-opens the root menu and focuses its first entry). |
| `src/components/WorldShell.jsx` | Replaced `focusedKey`, `atmosphereKey`, `returnKeyRef` and the selected-opportunity/editor/history state with the stack. `SunMenu` added at layer 0 (shown in the right rail, above the pipeline stats when there is one). Clicking the 3D Sun resets the stack and focuses the menu. The camera dollies toward the island and closer with depth, cutting instead of flying under `prefers-reduced-motion` (a note says so in the Sun menu). Escape pops one layer (not in fields, dialogs, full-screen modules). Scroll positions are recorded per trail and restored with retry until late-loading content allows them (a clamped position never overwrites the remembered one). Journeys cards are keyboard-operable and push `journeys` then the island. Every full-screen module, planet, Classic Tools and the Leads/Career Master embeds are layers with working **← Back to World** (one layer). |
| `src/components/OpportunityOutputsSection.jsx` | Three modes at three layers: `summary` (inside the opportunity: the count line, the existing cards with **Open output ›**, **Open application outputs (n) ›**, the link UI), `list` (Application outputs: filter select, one clickable entry per output, link UI), `detail` (Output: the full card plus **Versions of this output** with a clickable entry per version). The editor and version history are layers on top. A layer whose data disappeared (output unlinked) falls back one layer with a note. The editor shell sits below the floating trail bar. |
| `src/components/PlanetAtmosphereView.jsx` | Optional `moonKey`/`onMoonChange` props so the open moon is a layer; unchanged when they are absent. |
| `src/lib/hooks/useOpportunityPipeline.js` | `loaded` (a deep link is not judged missing before the list arrived) and `lastCreated` (a newly tracked item opens as the next layer). |
| `src/lib/api.js` | `resolveWorldLayers(at)`. |

## Behaviour changes to know

- The browser address now changes while navigating the World Shell (`/world?at=...`); `/world` alone is the Sun. Old bookmarks to `/world` keep working.
- Going back from an item opened out of **Journeys** returns to **Journeys** (one layer), not to the World; **← Back to World** keeps its label but pops one layer.
- Tracking a new opportunity opens it as the next layer, as before.
- **Interface parity:** UI (desktop + 390px), API and MCP are covered by the training spec (Journey 10, edge case [E.12]).
- The 3D scene's own picking is unchanged: clicking an island crystal or planet works as before and pushes the same layer as the Sun menu entry.

## Verified (initial check)

Environment: fresh database `sb_rl_bld_6000_1` on the local Postgres, seeded, accounts from `scripts/create-test-member.mjs`; production build served on port 6002; Chromium from the pinned path with software GL (slow, so every wait is condition-based).

- `npm run build` passes; the server boots against the fresh database.
- `npm run build` passes; the server boots against the fresh database; `node scripts/check-interface-parity.mjs` exits 0 (72 of 72 capabilities in all three interfaces, 110 tools, manifest matches).
- Every journey of `docs/training/world-shell-layers.md` was walked once in Chromium on the merged code (integration head `0800b1c` plus this branch): Journeys 1-6 and 9 on desktop 1280x900, Journey 7 (admin), Journey 8 on the 390x844 phone profile, Journey 10 with `curl` (MCP via the parity check), and the edge cases the walker covers. All steps passed. A first pass failed only on the Sun menu entry counts (the integration head added the **Connected Agents** island for members and six more admin islands); the spec was corrected to ten member and seventeen admin entries and the pass repeated clean.

## Known limitations

- Moons inside a planet (the Site editor's atmosphere view) are layers in the model and the URL, but the training spec does not click a 3D moon (picking is a canvas gesture); the planet layer itself, its journey buttons and **← Back to World** are covered.
- The review/approval dialogs of the finalization gate are not layers: they are modal and own Escape.
- The training spec's J5 step 4-7 type addresses into the address bar by necessity (a link is the capability under test); the UI route to the same links is **Copy link**.
- Browsers without WebGL: the 3D area shows the existing fallback text and everything remains reachable through the Sun menu, Journeys cards and the trail (not separately walked here).

## Fix notes per round

(appended by fix agents)
