# Triage — cover-letter-agent, round 1

Triage agent `tri-5800-2`. Baseline v1. Integration head when triaged: `7910d59`. Not committed. No code changed. Fictional data only.

Reproduction: J1.2 and J8.4 reproduced by calling `buildCoverLetterContent()` and `resolveRequest()` directly against a scratch database (dropped afterwards). The rest were traced in code. All findings are on the integration head, which now contains `server/lib/mcpToolRegistry.js` (from platform-mcp) — the validator tested an older commit (`c3a71b4`) where it did not exist.

| Id | Step | Class | Root cause (short) |
|---|---|---|---|
| T1 | J1.1 (mobile) | defect | Classic Tools top bar is hidden at <=900px and the mobile drawer that should replace it was never rendered |
| T2 | J1.2 | defect | Template only uses key metrics when job rec terms matched |
| T3 | J8.4 | defect | "Nothing to change" tone result is returned as `info`, which is routed as `search_only` |
| T4 | E.5 | defect | `hasJobRec` is true whenever the job title/location exist |
| T5 | E.3, E.4 | spec_error | Error branches are not reachable by clicking; step must name API/MCP surface |
| T6 | E.6 (second half) | spec_error | Same: refusal only reachable by API/MCP |
| T7 | E.7 | spec_error | Failure alert cannot be provoked by any user action; step needs a harness fixture |
| T8 | MCP | defect | Cover-letter capabilities beyond open/turn have no MCP tool |
| T9 | (O1) | coverage_gap | No step covers World Shell reachability (bugs B3/B11 open) |

## T1 — J1.1 mobile: no My Resume tab at 390px (defect, MOBILE_GAP)

- Root cause: `src/brand.css:630-631` sets `.sb-admin-topbar-actions { display:none !important }` at `max-width:900px`. The CSS for a replacement (`.sb-admin-mobile-current`, `.sb-admin-mobile-menu-button`, `.sb-admin-mobile-backdrop`, `.sb-admin-mobile-drawer`, `.sb-admin-mobile-nav-group`, `.sb-admin-mobile-drawer-actions`, lines 613-717) exists since `eb62057`, but nothing in `src/` renders those classes (grep finds zero uses). `src/components/admin/AdminShell.jsx:665-690` renders only the hidden `.sb-admin-topbar-actions` block. So a phone user in Classic Tools has no way to switch tabs.
- Files: `src/components/admin/AdminShell.jsx`, `src/brand.css`.
- Fix: in AdminShell render the mobile pieces the CSS expects: a `sb-admin-mobile-current` label (current tab), a `sb-admin-mobile-menu-button` that toggles a drawer (`sb-admin-mobile-drawer.open` + backdrop) listing the same items as the desktop strip (`configDraft.navigation.memberTabs` filtered/sorted for member scope, `adminNav.views` for admin) plus the Back to World / Visit links in `sb-admin-mobile-drawer-actions`; selecting an item calls `setTab` / `switchView` and closes the drawer. Hooks must be declared before the `if (!draft || !configDraft) return null` guard (CLAUDE.md rules of hooks). The workaround (World Shell > Journeys > My Resume) stays valid but is not what the step says.
- Note (O4, no step): at 1280px the same top bar overlaps (logo under Back to World, clipped right-hand tabs). The same shell fix round should check it; no separate item.

## T2 — J1.2: key metrics missing from the first-draft letter (defect)

- Reproduced: with job rec notes empty and a Career Master job whose `key_metrics` is "led a pricing redesign", the paragraph is `At Harbor Logistics I worked as Value Architect (2019 – present).`
- Root cause: `server/lib/coverLetterTemplate.js:196` — `const template = values.metrics && terms.length ? t.jobParagraph : terms.length ? t.jobParagraphNoMetrics : t.jobParagraphPlain;`. With no job rec text `terms` is empty, so the plain template (no metrics) is chosen even though metrics exist. The change spec says a clause is omitted only when its data is missing, and the training spec expects `At <employer> as <title> (<dates>), <metrics> …` in the no-job-rec draft (J1.2). This is not bug B7 (B7 is about career-bound overrides/links); it is an independent template-selection hole, though it touches the same file.
- Files: `server/lib/coverLetterTemplate.js`.
- Fix: add an additive template key `jobParagraphMetricsOnly` (default `'At {employer} as {title} ({dates}), {metrics}.'`) to `DEFAULT_SETTINGS.template` and `TEMPLATE_TEXT_KEYS` (existing saved settings merge over defaults in `validateSettings`, so no stored row is rewritten), and choose it when `values.metrics && !terms.length`. Add the key to the settings UI list in `CoverLetterSettings.jsx` and a unit case in `tests/cover-letter-agent.test.js`. Expected result after fix: "At Harbor Logistics as Value Architect (2019 – present), led a pricing redesign that raised contract margin by 4 points."

## T3 — J8.4: "Make it more formal" tagged "Answered from package search" (defect)

- Reproduced: `resolveRequest({request:'Make it more formal', ...})` on a letter with nothing to change returns `{kind:'info', message:'The "Formal" tone preset found nothing to change …'}`.
- Root cause: `server/lib/coverLetterRules.js:110` returns `kind:'info'`; `server/lib/coverLetterAgent.js:159-160` maps every `info` to `route:'search_only'`, which `src/components/admin/CoverLetterWorkbench.jsx:45` labels "Answered from package search". A tone preset is a rule answer; the spec requires "Answered by rules". (`unsatisfied` maps to `route:'rules'`, `agent.js:161-162`.)
- Files: `server/lib/coverLetterRules.js`.
- Fix: change line 110 to `kind: 'unsatisfied'` (same message). The other `info` results (move/shorten/mention no-ops, lines 173/194/212) are left alone because J9.2 passed as written.

## T4 — E.5: scope text says "+ job rec text" when none is attached (defect)

- Root cause: `server/lib/packageSearch.js:133-142` `jobRecText(row)` always appends the rod's `jobTitle` and `location` (and url), so `recUnits` (line 155) is non-empty for every opportunity and `hasJobRec: recUnits.length > 0` (line 160) is always true. The row panel decides from `o.metadata.notes` (`coverLetters.js:44`), so the two disagree.
- Files: `server/lib/packageSearch.js` (also feeds `coverLetterAgent.js:73`).
- Fix: compute `hasJobRec` from the real job-rec text only (rod `metadata.notes`, what the panel uses; `target_job_description` is not usable alone because `ensureCoverLetterForOpportunity` stores title + notes there). Keep searching title/location as before; only the flag changes. Unit test: opportunity without notes gives `hasJobRec:false`, scope text "(2 outputs, no job rec text attached)".

## T5 — E.3 and E.4: not reachable by point-and-click (spec_error)

- Product matches the change spec: `ownedLetter()` (`coverLetterAgent.js:36-41`) returns 404 "Cover letter not found." for another member's id (the validator's supplementary check got exactly that body) and 400 "The cover-letter agent only works on cover letters. This output is a resume." for a non-letter. The interface offers the agent only on the member's own letters, so those branches cannot be clicked; E.3's own wording already says "(via the URL of the API)". The step is wrong to be scored on the website surface. Both are testable through the MCP tool `cover_letter_open` (`mcpToolRegistry.js:147`) with the same permissions, so parity is satisfied.
- E.3 needs a second member (create with `scripts/create-test-member.mjs --email <second>`, per the harness rule).

## T6 — E.6 second half: package key without a letter (spec_error)

- First half passes (UI). The refusal at `packageAssembly.js:88-89` is reachable only via `POST /api/cover-letters/packages/assemble {packageKey}`; the interface always files a letter first, by design. Same class as T5. After T8 it is reachable through an MCP tool as well.

## T7 — E.7: failed automatic draft alert (spec_error)

- Product matches: `coverLetterAutoDraft.js:101-111` records `cover_letter_autodraft_failed` and `CoverLetterPackagesPanel.jsx:119` shows the red alert (`role="alert"`). No supported user action makes the draft fail (template validation runs on save, so a bad template is refused earlier), so the alert can only be seen by injecting the failure event. Proposal: the step states its fixture: the harness inserts one `journey_rod_events` row of that type for the tracked opportunity (test setup, not a product hook), then the validator checks the alert and that the Generate button works. The owner may prefer unit level instead; the amendment reviewer decides.

## T8 — MCP: cover-letter capabilities missing as tools (defect, MCP_GAP)

- At the integration head `server/lib/mcpToolRegistry.js` exists with `cover_letter_open` and `cover_letter_agent_turn`, and `application_output_approve_for_qr` (covers "approve for QR"). `server/lib/capabilityParity.js:73-77` already lists the rest as gaps. Accept/reject has a documented owner-direction exclusion (`mcpExclusion`, `capabilityParity.js:78`; `docs/changes/platform-mcp.md`: applying a proposal is a human decision made in the website); the validator should score it as excluded, not as a gap.
- Missing tools (each calls the same function the route calls, `permission:'user'`): `cover_letter_settings_read` / `cover_letter_settings_save` (`getSettings` / `saveSettings`); `cover_letter_opportunities_list` (move the logic of `coverLetters.js:36-52` into a lib function shared by route and tool); `cover_letter_job_rec_save` (`setJobRecText`); `cover_letter_generate` (`ensureCoverLetterForOpportunity` with `force`); `cover_letter_package_build` (`assembleApplicationPackage` by opportunity or `packageKey`); `cover_letter_turns_list` (`listTurns`). "Add a resume to a package" is the existing file-import route: record it in the parity map as `mcpExclusion` like `opportunity-import-output`.
- Also append names to `server/data/mcpToolManifest.json` (append-only), update the parity rows (`mcp: [...]`, remove `gap`), run `scripts/check-interface-parity.mjs`.
- Files: `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json`, `server/lib/capabilityParity.js`, `server/routes/coverLetters.js`.

## T9 — Observation O1 (World Shell reachability) — coverage_gap

- Open bugs `cover-letter-agent-B3` and `B11` already track this (owner said the agent is reachable from the World Shell opportunity view). No baseline step proves it, so a fix could regress unnoticed. Proposed new step below; it fails until B3/B11 are fixed, which is intended.

## Proposed amendments (for the amendment reviewer; spec not edited)

- E.3 change: before "opening a letter id that is not yours (via the URL of the API) answers ..." -> after "Surface: API or MCP only (no screen offers another member's letter). With a second member (created by the harness) who owns a letter, call GET /api/cover-letters/letters/<their id> or MCP cover_letter_open as the first member: answer 'Cover letter not found.' (404). The dialog 'Could not open this cover letter: …' is not part of this step." Traces to: change spec "Server" (`ownedLetter`) and interface parity v3 (capability reachable on API and MCP).
- E.4 change: add "Surface: API or MCP only" and name the call (cover_letter_open / GET letters/:id with a resume output id). Same trace.
- E.6 change: split; keep the UI half; second half "Surface: API or MCP only: POST /api/cover-letters/packages/assemble with a packageKey that has no cover letter (or cover_letter_package_build once it exists) answers 'This package has no cover letter. …'". Traces to change spec `packageAssembly.js` "always includes the cover letter".
- E.7 change: add a fixture sentence: "Setup (harness, not a user action): insert a journey_rod_events row, event_type cover_letter_autodraft_failed, metadata {error:'test failure'}, for the tracked opportunity." Then the existing expectations. Traces to change spec "Behaviour changes" (failure shown on the row, never swallowed).
- New step (T9, add) J10.1: "On the World Shell, open Journeys > Career Placement Agents > the tracked opportunity > Application outputs. Expect buttons Edit with cover-letter agent and Build package with contents next to the generated cover letter; clicking the first opens the same agent dialog as J3.1." Traces to owner direction recorded in bugs B3/B11 and change spec "Integration hook points" 5. Why: no step currently proves this; applies to desktop and 390px.

## Other observations — decisions

- O2 (History row of an Approved letter says "Not yet approved" in Authors line): minor wording defect not covered by a step; recommend a label change in `MyResumePanel.jsx` when next touched. No item.
- O3: passes as written; nothing.
- O4: see T1 note.
- O5: J6.2/J6.3 passed as written; cosmetic, no amendment.
- O6: not a defect; nothing.
- O7: covered by T5-T7.
- Harness note (member@test.local instead of "Casey Rowan"): per the fixed constraints, not a step error.

## Needs owner

None.
