# Triage: no-silent-failures, round 1

Baseline v1 (specSha256 78ce1b07...). Validator score 18/28. Triage by code reading plus the validator's evidence (no server was started, so nothing to clean up). No code or spec changed.

| Item | Step | Class | Root cause |
| --- | --- | --- | --- |
| T1 | J5.2 | defect | `/output/*` reads Career Master for the default admin when no `?owner=` is given, but proficiency and the primary template for the signed-in user |
| T2 | J3.4 | defect | `toast.error` is identical to `toast.success` (`src/lib/toast.js:25-26`); also 2.4 s lifetime |
| T3 | J2.2 | spec_error | step ignores the one change added in J0.5 |
| T4 | J3.2 | spec_error | earlier version is retired only when the new one is approved |
| T5 | J4.1 | spec_error | step names fixture-path values, P4 builds from the gallery |
| T6 | J1.2, J3.1, J5.1 | spec_error | fault injection and package import are cli steps by design, not marked cli |
| T7 | E.1 | spec_error | a bogus URL has no interface; a revoked link does |
| T8 | E.4 | spec_error | noise list incomplete |
| T9 | B15 (observation) | defect | RECORDED DATA banner still says it "matches" and that charts "update from Career Master" |
| T10 | B15 (observation) | coverage_gap | no step checks the banner sentence or the member-owned chart data |

## T1 J5.2 (defect)
`src/components/Output.jsx:1176` fetches `/api/career/master` with `owner` only if the URL has one. `/output/resume` has none. `resolveOwnerUserId()` (`server/routes/careerMaster.js:559-568`) then falls back to the default admin. Meanwhile `/api/career/proficiency` is `requireUser` (session user) and `/api/output-templates/primary` (`server/routes/outputTemplates.js:62`) is session-scoped. A signed-in member therefore gets their own template and proficiency drawn over the admin's jobs, hence "No dated roles". Same fallback at `Output.jsx:1230` (`/api/career/rollups`). The spec only passed historically because P1 signs in as admin (the default owner); it surfaced with the harness member (open bug B12). The QR page uses the approver's own data, so it draws.
Fix: in `useOutputTemplateConfig`, when no `owner`/`profile` param is present and the primary-template response is the viewer's own, use `owner='me'` for master, rollups and resume-rollups. Simplest: have `/api/output-templates/primary` return `ownedByViewer: true` when the row came from the `user_id` branch, derive `effectiveOwner = owner || (ownedByViewer ? 'me' : '')`, and make the master and rollups effects depend on it. Unauthenticated visitors keep the platform-owner behaviour. Do not change the server fallback (public pages rely on it).

## T2 J3.4 (defect)
`src/lib/toast.js:25-26` defines `toast.error = (m, ms) => toast(m, ms)`: same element and `.sb-toast` class (`src/brand.css:455`, `.sb-admin-shell .sb-toast:269`). The change spec requires a visibly distinct error (red toast); the user cannot tell a failed snapshot from success. Fix: `toast.error` adds class `sb-toast-error` (red border and accent, `role="alert"`), default 6000 ms; `toast.success` gets `role="status"`. Define the class for both the base and `.sb-admin-shell` variants. The longer error life also fixes the "wait 4 seconds then expect a toast" problem the validator hit (J1.3 failure toast gone at 2.4 s).

## T3 J2.2 (spec_error)
Product matches the change spec ("keeps ... 'N changes since...'", Behaviour changes). J0.5 adds Pipeline Tracker after both approvals, so the recorded history has one change when J2.2 runs. Amendment: before `a banner starting "RECORDED DATA — matches the approved printed version"`; after `a banner starting "RECORDED DATA —" (words after the dash are not checked here; see J2.3)`. Traces to: change spec "Behaviour changes to know" and rule "a failure is never shown as ... matches the printed version". Not weaker: prefix and alert text unchanged; the sentence is checked by new J2.3.

## T4 J3.2 (spec_error)
`server/lib/applicationPackages.js:128-131` demotes the previous published version to `approved` and drops its `share_token` only inside the next approval (J3.4). Importing a new version just adds a draft. Amendment on J3.2: replace `(the earlier approved version now reads *Approved*, no QR image)` with `(the earlier version still reads *Published* with its QR image, link and **Revoke QR**)`. Add to J3.4: "the earlier version now reads *Approved* with no QR image" (stricter, not weaker). Traces to: qr-gated-outputs change spec, "approving a newer version moves the slug".

## T5 J4.1 (spec_error)
P4 says use the gallery if present. The gallery (`src/components/admin/ChartGallery.jsx:50-52`) gives titles Proficiency Tiers, Trend Bars, Career Timeline, and the header is the member name. The fixture values (Pat Example, Proficiency, Experience trend, Career timeline) exist only on the fallback path. Two contradictory expectations in one step. Amendment: retire the fixture branch of P4 (the gallery is present, `docs/changes/chart-gallery`); J4.1 expects the header to be the signed-in member's display name (Test Member for the harness account) and alert titles "Proficiency Tiers: data could not be loaded.", "Trend Bars: data could not be loaded.", "Career Timeline: data could not be loaded." with the unchanged bodies. Same three alerts, same order, same bodies: not weaker. Also amend P1 to sign in as member@test.local (open bug B12), since T1 only shows for a member.

## T6 J1.2, J3.1, J5.1 (spec_error)
No product screen should break its own database, and the spec already says these are "the only database commands in this spec". The definition allows "a cli step by design" and `testConstraints.surfaces.cli` is "bash in the validator worktree"; the steps are just not marked. Amendment: prefix J1.2, J3.1 and J5.1 with `[cli]` so the baseline records them as cli-only. Browser steps around them are unchanged. Package import has no in-app screen: that capability gap is tracked in `world-shell-navigation-B12` (backlog), not here. Also amend RESTORE to use `ALTER TABLE IF EXISTS ... RENAME` for each table, because the validator's E.2 run (FAULT A only) failed with "relation career_proficiency_assertions_held does not exist" after the first ALTER had run.
MCP_GAP (approve-for-QR, History reads, QR page read, career reads): `server/lib/mcpToolRegistry.js` does not exist yet; belongs to the platform-mcp feature, not a fix here.

## T7 E.1 (spec_error)
A bogus slug can only be reached by typing a URL, which interfaceParity forbids as a step. A revoked link is reachable by point-and-click and shows the same page ("This link isn't available", `SharedOutputPage.jsx`). Amendment: replace E.1 with `Run last, after J5.6: on My Resume click **Revoke QR** on Example Corp - Cover Letter (confirm). Open COVER LINK in a private window: the page shows "This link isn't available".` Traces to: change spec ("unchanged by this feature") and qr-gated-outputs revoke behaviour. Same assertion, now reachable.

## T8 E.4 (spec_error)
`GET /api/career/resume-rollups` calls `loadMasterPayload` (reads `career_jobs`), so it returns 500 under FAULT A by design (`server/routes/careerMaster.js:647-654`); `Output.jsx:1378` calls it. Amendment: add `/api/career/resume-rollups` to the 500 list, and one HTTP 404 on `/api/shared-outputs/<slug>` after the E.1 Revoke step. Traces to: change spec Verified list ("only the requests the faults cause").

## T9 B15 banner (defect)
`src/components/SharedLiveStates.jsx:119-121` prints "matches the approved printed version" when `live` is false, and line 124 says the charts "update from the Salt Basin Career Master" while live data failed. This contradicts the change spec's own rule that a failure is never shown as "matches the printed version"; its Known limitation records it as accepted, but the rule wins (tracker bug B15 is Open). Fix: when `!live`, headline `RECORDED DATA — N recorded change(s) since the approved printed version (live data unavailable)` or `RECORDED DATA — no recorded changes since the approved printed version (live data unavailable)`, and replace the line-124 sentence with "Live career data could not be loaded, so these charts show the last recorded state." Healthy-path text stays byte-for-byte. Update the change spec's Known limitations accordingly.

## T10 coverage gaps
1. New step after J2.2: `[J2.3] On RESUME LINK (FAULT A in place) the banner contains "(live data unavailable)" and the sentence under it begins "Live career data could not be loaded, so these charts show the last recorded state." and does not contain "update from the Salt Basin Career Master".` Traces to: change spec rule, T9.
2. New step after J5.2: `[J5.2b] As the signed-in test member, /output/resume Career Timeline lists Northwind Advisory 2019-2023 and Trend Bars shows at least two years.` Traces to: change spec "charts drawn from Career Master data", T1 regression.

## Observations
- Toast lifetime (2.4 s) vs "wait 4 seconds": error toast fixed by T2; amend J1.3 and J5.3 to "within 4 seconds" and keep the DOM-observer note.
- Classic Tools top-bar overlap on desktop and tab bar at zero size at 390px: world-shell-navigation (MOBILE_GAP), not this feature.
- Cold sign-in about 10 s and the seed race crash at start (duplicate key pg_type_typname_nsp_index): environment (start order); boot once, wait for health, then seed.
- Aborted `/api/career/jobs` on navigation: harmless, not a finding.
