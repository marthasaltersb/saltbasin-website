# User Visual-State Test — 2026-08-10

## Purpose

User-perspective verification of the shared semantic/query-state experience changes. This record is part
of the repository's durable experience memory and captures actions, expected states, observed visual
states, console/runtime evidence, and blockers without converting unverified behavior into a pass.

## Environment

- Client target: `http://localhost:5173`
- API target: `http://localhost:3001`
- Reference route: `/experience/reference`
- Spatial route: `/world`
- Test operator: Codex acting through the in-app browser
- Date/time zone: 2026-08-10, America/New_York

## Test ledger

| Step | User action | Expected visual/runtime state | Observed state | Result |
|---|---|---|---|---|
| 1 | Start `npm run dev` | Vite listens on 5173 and Express listens on 3001 | Vite reported ready on 5173. The API watch process repeatedly emitted `Restarting 'server/index.js'`; 3001 did not become available during the initial observation window. | Partial / investigate |
| 2 | Start API without watch via `npm start` | Express completes bootstrap and listens on 3001 | Bootstrap completed after an extended schema-notice phase. Express then listened on 3001; `/api/health` returned HTTP 200 with `db: "ok"`. | Pass |
| 3 | Open `/experience/reference` | Candidate frame renders with `Manifest valid` and an accessible journey-map button | The user's existing tab had opened before Vite was stable and displayed the browser-level `This site can't be reached` page. Browser security prevented Codex from reloading that failed localhost tab. | Blocked — user refresh required |
| 4 | Click `Open accessible journey map` | Accessible 2D journey state becomes visible; focus remains recoverable | Not run yet. | Pending |
| 5 | Open `/world`, enter the world | Spatial intro transitions to shared-state world controls | Not run yet. | Pending |
| 6 | Inspect selectors | Labels read `Context` and `View Lens (candidate)` | Not run yet. | Pending |
| 7 | Switch Context | Navigation/orientation changes without copying or resetting semantic state | Not run yet. | Pending |
| 8 | Switch Crystal Basin → Temporal Journey Canyon → Crystal Basin | Presentation changes while entity/evidence/journey state remains shared | Not run yet. | Pending |
| 9 | Inspect console | No new application errors caused by the tested interactions | Not run yet. | Pending |
| 10 | Run targeted automated checks | Compiler/manifest/audit tests pass and production build succeeds | Targeted Node suite passed 6/6. The production build had already passed immediately before this user test; it was not repeated while the development client was active. | Pass |

## Visual-state invariants under test

1. One governed semantic/query state is referenced across journeys and contexts.
2. Context changes orientation and scope; it does not create a data version.
3. View lenses change representation; they do not fork business state.
4. Consequential state remains distinct from ambient animation or camera motion.
5. The accessible journey representation remains available and focus-recoverable.
6. Candidate controls are visibly identified as candidate rather than canonical.

## Current blocker

The in-app browser's failed localhost error page cannot be reloaded by browser automation under the
browser URL safety policy. A single manual refresh by the user after Vite is listening will unblock the
remaining user-click journey. This is an environment/browser-state blocker, not an application pass or
failure.

## Supporting probes

- `GET http://localhost:5173/experience/reference` returned HTTP 200 after Vite stabilized.
- The first API health probe ran before bootstrap completed and could not connect. A follow-up probe returned HTTP 200 with `{"ok":true,"db":"ok"}`.
- Targeted compiler/scene-manifest/UX-audit suite: 6 passed, 0 failed.
