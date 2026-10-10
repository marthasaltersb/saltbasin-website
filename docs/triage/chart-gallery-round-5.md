# Triage - chart gallery, round 5 (baseline v3)

Analysis from code and the round-5 report. No code changed, no spec edited. Amendments A1 and A2 (approved) stand; nothing here is spec_error. All four failures are defects, each a recurrence that was never in a fix list.

| id | step | class | note |
|---|---|---|---|
| CG-R3-2 (recurred) | J2.3 mobile | defect | AdminShell never got the mobile menu/drawer markup that brand.css already styles |
| CG-R2b-2 (recurred) | E.4 | defect | `interpolate()` turns numeric 0 into an empty string |
| CG-R2b-5 (recurred) | MCP_GAP output templates | defect | `/api/output-templates` is not exposed through the route-backed MCP tools |
| CG-R4-1 (recurred) | MCP_GAP career_rollups_read | defect | MCP call omits `owner=me`, so the route falls back to the default admin |

## CG-R3-2 (recurred) - J2.3 mobile (defect, MOBILE_GAP)
- `src/components/admin/AdminShell.jsx` lines 675-700: the admin view selector (`TabToggle` of `adminNav.views`) lives only inside `.sb-admin-topbar-actions`. `src/brand.css` lines 630-631 hide that at 900px or narrower. brand.css lines 614-712 already style `.sb-admin-mobile-current`, `-menu-button`, `-backdrop`, `-drawer(.open)`, `-drawer-head`, `-drawer-scroll`, `-nav-group`, `-drawer-actions`, but AdminShell has no JSX using them (only `sb-admin-mobile-toggle`, line 640, for the page list). At 390px nothing replaces the hidden selector, matching the validator's observation.
- Fix: add `const [mobileMenuOpen, setMobileMenuOpen] = useState(false)` BEFORE the early `return null` at line 622 (hooks rule). In the topbar add a menu button and a `sb-admin-mobile-current` label (active view). Render backdrop + drawer listing `adminNav.views` (members: `configDraft.navigation.memberTabs`) with their tabs, calling `switchView` / `setTab` and closing on select; put Back to World / sign out in `sb-admin-mobile-drawer-actions`. Verify at 390px: menu, Output Templates, Resume, Infographics, Live Preview below the gallery, no overlap. Also fix the floating Back to World button overlapping the brand text (validator observation) in the same file.

## CG-R2b-2 (recurred) - E.4 gauge shows no number for 0 (defect)
- `src/lib/outputBlocks.js` line 485: `interpolate()` starts `if (!text || !ctx) return text || ''`. Numeric 0 is falsy and returns `''`. The `capacity-gauge` case (lines 692-706) prints `${ip(rollup.value)}` at line 704; the gallery thumbnail and Live Preview share this renderer, which explains both symptoms. The arc (dasharray 0,157) is correct.
- Fix: `if (text == null || !ctx) return text == null ? '' : String(text);` (the replace branch already keeps 0). Audit other `ip(<number>)` callers (stat card values). Verify with an empty member: add Capacity Gauge; thumbnail and preview show 0 above ROLES HELD.

## CG-R2b-5 (recurred) - MCP_GAP: no output-template tools (defect)
- The MCP server exists, so the old "environment" classification is void. `server/routes/outputTemplates.js` (mounted at `/api/output-templates`, `server/index.js` line 188) has GET `/`, `/primary`, `/portfolio`, `/:id/public`, POST `/`, PUT `/:id`, DELETE `/:id`. `server/lib/mcpRouteInvoker.js` ROUTERS/MOUNTS (lines 12-23) list only careerAgents, resumeOutputs, coverLetters, career. `mcpRouteTools.js` SPECS has no entry, `capabilityParity.js` has no row, and the file is not in `GOVERNED_ROUTE_FILES` (lines 17-27), so `scripts/check-interface-parity.mjs` could not flag it.
- Fix: add `outputTemplates` to ROUTERS and MOUNTS; append SPECS (append-only; update `server/data/mcpToolManifest.json`): `output_templates_list` (GET /), `output_template_primary_read` (GET /primary), `output_template_create` (POST /), `output_template_update` (PUT /:id), `output_template_delete` (DELETE /:id), scopes career.read / career.write. Handlers use `getUserFromCookie`, which honours `req.platformUser`, so the invoker works unchanged. Add the route file to `GOVERNED_ROUTE_FILES` and a capabilityParity row (Admin / World Shell Output Templates, API, MCP). Verify with a PAT: tools/list shows them; list/save/delete match the UI; a token without career.write is refused on save/delete.

## CG-R4-1 (recurred) - career_rollups_read returns another user's data (defect)
- `server/lib/mcpRouteTools.js` line 67 calls GET `/rollups` with `{}` and no query, so `server/routes/careerMaster.js` `resolveOwnerUserId(undefined, req)` (lines 573-581) falls through to `resolveDefaultAdminUserId()`. The member gets the default admin's empty rollups. The UI sends `owner=me`. The tool schema forbids an `owner` argument, so the caller cannot correct it. Deterministic, not flaky.
- Fix: support a fixed query in SPECS opts (for example `fixedQuery: { owner: 'me' }`, merged over the caller query in the invoker) and set it on `career_rollups_read`. Do not accept `owner` from the caller. Audit other `career` GET specs that read per-user data through `resolveOwnerUserId` for the same omission. Verify: for the round-5 member MCP returns Roles Held 3, Skills 4, Tools 2, Case Studies 1, Operations 2 / Strategy 2, equal to `/api/career/rollups?owner=me`.

## Validator observations (decisions)
- "atom sync failed: cannot cast type boolean to jsonb" is the existing CG-R4-2 (still unfixed, defect, outside the baseline): `server/lib/careerAtomMigration.js` lines 66 and 103 bind a JS boolean to a `$3::jsonb` parameter. Fix by casting in SQL (`to_jsonb($3::boolean)` when rawValue is boolean, or pass a non-boolean JSON value) and surface the error rather than only logging (`careerMaster.js` ~480/529). It plausibly contributes to Career Channel Rod gaps. No new step: owned by Career Master, not observable by chart-gallery journeys.
- CG-R2b-3 and CG-R4-3 are fixed and verified; nothing to do.
- Tiny (about 5px) row labels, sticky preview header overlapping content on the phone, tiny Proficiency Tiers thumbnail: cosmetic, no coverage_gap.
- J2.2 row order: set membership, no amendment.
- Process note: the validator wrote its report in its own worktree; the integrator must copy it to `docs/test-results/chart-gallery/round-5.md`.
