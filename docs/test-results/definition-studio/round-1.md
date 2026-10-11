# Test results — Definition Studio — round 1

- Feature: `definition-studio`
- Training spec: `docs/training/definition-studio.md`, version 1 (2026-10-10)
- Date: 2026-10-10
- Validator: release-loop validation agent (browser + terminal), spec followed literally, no code/spec edits
- Environment: fresh database; Vite dev at http://localhost:5173 (proxies `/api`), Express at http://localhost:3001
  (MCP at http://localhost:3001/mcp); Playwright Chromium 1194 headless, desktop viewport 1440x900 (phone 390x844);
  `ANTHROPIC_API_KEY` not set; external fonts/CDN blocked (ERR_TUNNEL_CONNECTION_FAILED), and those console errors were ignored as the spec allows.
- Sign-in: no sign-in form was used. The existing signed-in curl cookie jars (admin `/var/tmp/sbstudio/jar`,
  member `/var/tmp/sbstudio/jarm`, from accounts betsy@test.local and member@test.local) were loaded into the browser
  context for [P.1] and reused for every browser and terminal step, which kept clear of the sign-in rate limit.
- Scripts and screenshots: `/var/tmp/sbstudio/validate/` (`p_j1.mjs`, `j2_j3.mjs`, `j2_6_j3.mjs`, `j3b.mjs`/`j3c.mjs`/`j3d.mjs`,
  `j4.mjs`, `j5a.mjs`, `j5b.mjs`, `j7.mjs`, `e5.mjs`, `ovl.mjs`).
- Console/page errors: none apart from blocked CDN/font requests, the expected 409 response on [J4.4], and one
  `404 Failed to load resource` logged once during the J4 run that a later re-run did not reproduce (URL not captured).

## Results

| Step | Result | Evidence |
|---|---|---|
| [P.1] | PASS | Both windows land on `/world` showing World Shell ("World | Journeys | Classic Tools"; admin shows betsy@test.local, member shows "Test Member"). `p1-admin.png`, `p1-member.png` |
| [P.2] | PASS | After clicking Journeys, the admin has 1 **Definition Studio** card and the member has 0. `p2-admin.png`, `p2-member.png` |
| [P.3] | PASS | Heading "Definition Studio", **Working on** select, "+ New product", tabs Canvas / Studio settings / History, "← Back to World". `p3.png` |
| [J1.1] | PASS | Line: "Module · API name resume_career · The Member's Career Master — …"; canvas title "Resume Output Creator (Career Master)"; small line "DEFINITION STUDIO · MODULE · RESUME_CAREER" |
| [J1.2] | PASS | Shape bar: Step, Sub-process, Decision, Parallel gate, Event, Data object, Start / end (7, in order); "🏛 L1 · Industry"; option "Base (L2 · Flow — consistent for every scenario)" |
| [J1.3] | PASS | Nodes: Start, New step, Decision? |
| [J1.4] | PASS | Arrow drawn (status "Connected. …"); saved document holds edge n1→n2 (Start→New step). `j1-4.png` |
| [J1.5] | PASS | Save state "Saved to Salt Basin · version 1" |
| [J1.6] | PASS | After reload (URL kept `?at=journeys,island:definition-studio`): Start, New step, Decision? and the arrow are back. `j1-6.png` |
| [J1.7] | PASS | `GET …/document?workspace=module:resume_career&key=flow:default` → HTTP 200; `document.value` (string) contains `"New step"` |
| [J2.1] | PASS | Note "…Version 1 (platform defaults)."; L1/L2/L3 = Industry / Flow / Scenario; grey lines "FLOW-L1 · API name industry", "FLOW-L2 · API name flow", "FLOW-L3 · API name scenario". `j2-1.png` |
| [J2.2] | PASS | Geometry `step`; grey line "FLOW-L2-SHAPE-008 · API name hand_off (fixed once saved)" |
| [J2.3] | PASS | Red alert "Add a change note saying what changed and why, then save again."; server config still version 1 |
| [J2.4] | PASS | Toast "Studio settings saved as version 2. The canvas now uses them."; note "Version 2."; Settings history "Version 2 · … · betsy@test.local / Add hand-off shape (training)". `j2-4.png` |
| [J2.5] | PASS | Shape bar ends with "Hand-off"; option "Base (L2 · Journey Flow — consistent for every scenario)"; placed shape labelled "Hand-off" with tag "HAND-OFF". `j2-5.png` |
| [J2.6] | PASS | Toggle reads "Off (kept for saved flows)"; "…saved as version 3…"; Sub-process gone from the shape bar; Start / New step / Decision? / Hand-off and the arrow still show |
| [J2.7] | PASS | HTTP 400, `error`: "The Studio settings weren't saved: "Decision" (FLOW-L2-SHAPE-003) can't be removed — switch it off instead, so saved flows that use it still open." |
| [J3.1] | FAIL | Grey line read "FLOW-L2-FIELD-023 · API name evidence_required (fixed once saved)", not "FLOW-L2-FIELD-024 …". Saved as version 4 with the note |
| [J3.2] | PASS-WITH-NOTE | Step settings open with field "EVIDENCE REQUIRED" (uppercased by page style), hint "What proves this step happened". Note: the save-state pill covers **Save specification** (see Failures). `j3-2.png` |
| [J3.3] | FAIL | "Saved." appeared and the value "Signed intake form" was still there after reload, but **Save specification** is mostly covered by the "Saved to Salt Basin" pill. A normal click is intercepted by `#studioSaveState`; it only went through when aimed at the 2px strip left uncovered. `j3-3.png` |
| [J4.1] | PASS | "API name will be harbor_onboarding_kit" |
| [J4.2] | PASS | Toast "Created Harbor Onboarding Kit (PRODUCT-L0-001). You're now composing it."; selected "Harbor Onboarding Kit · PRODUCT-L0-001" in group "Products composed here"; small line "DEFINITION STUDIO · PRODUCT PRODUCT-L0-001 · HARBOR_ONBOARDING_KIT" |
| [J4.3] | PASS | Product canvas: [New step] (saved v1); Career canvas: Start, New step, Decision?, Hand-off (not the product's). `j4-3-product.png` |
| [J4.4] | PASS-WITH-NOTE | Red message "A module or product with the API name "harbor_onboarding_kit" already exists. Choose a different name." (HTTP 409). The same text shows twice at once, as an inline alert and as a toast, both `role=alert`. `j4-4.png` |
| [J5.1] | PASS | Card "Working canvas (autosave)", line "flow:default · version 1 · 10/10/2026, 10:01:09 PM · betsy@test.local". `j5-1.png` |
| [J5.2] | PASS | PUT with note → HTTP 200 `{"version":2,"changed":true}`; Versions shows "Version 2 (current) … Training save point" and "Version 1 …". `j5-2.png` |
| [J5.3] | PASS | Toast "Version 1 restored as version 3. Reopen the canvas to see it."; "Version 3 (current) … Restored version 1". `j5-3.png` |
| [J6.1] | PASS | Status "AI drafting is not set up on this server yet (no ANTHROPIC_API_KEY). You can still fill in every field by hand."; all inspector field values unchanged. `j6-1.png` |
| [J7.1] | PASS | Connected Agents: name "Studio probe", only definitions.read + definitions.write ticked, token created (`sbpat_…`, shown once). `j7-1.png` |
| [J7.2] | PASS | `list` (against http://localhost:3001/mcp) includes `definition_studio_workspaces` and `definition_studio_document_save` (10 definition_studio_* tools listed) |
| [J7.3] | PASS | `isError: false`; workspaces include `module:resume_career` and `product:harbor_onboarding_kit` |
| [J7.4] | PASS | `isError: false`; `document.value` is byte-identical to the API/website value (version 3, nodes Start, New step, Decision?, Hand-off) |
| [E.1] | PASS | Member cookie `GET /api/definition-studio/workspaces` → 403 `{"error":"admin only"}` |
| [E.2] | PASS | No cookie `GET /api/definition-studio/canvas?workspace=module:resume_career` → 401 `{"error":"unauthorized"}` |
| [E.3] | PASS | 404 "That module does not exist. Pick a module or product from the list." |
| [E.4] | PASS | 3.6 MB value → 413 "That document is larger than 3.5 MB and was not saved. Split the flow into smaller templates." (nothing saved; no `flow:e4test` document) |
| [E.5] | PASS | 390px: horizontal overflow 0 px on the Canvas and Studio settings tabs; no element extends past the viewport; with no unsaved changes the save bar is `position: static` at the end, before Settings history. `e5-settings-bar.png` |

**Totals:** PASS 33 · PASS-WITH-NOTE 2 · FAIL 2 · BLOCKED 0 (37 steps)

## Failures and notes

### [J3.1] FAIL — new field id is FLOW-L2-FIELD-023, spec expects FLOW-L2-FIELD-024
- Repro: Studio settings → section "Actors & data flow" → **+ Add field to "Actors & data flow"**.
- Seen: grey line "FLOW-L2-FIELD-023 · API name field_023 (fixed once saved)". After setting Field name to
  **Evidence required**: "FLOW-L2-FIELD-023 · API name evidence_required (fixed once saved)". The saved config (version 4) has
  `{"id":"FLOW-L2-FIELD-023","apiName":"evidence_required","hint":"What proves this step happened"}`.
- Cause: the platform default settings hold 22 fields (`FLOW-L2-FIELD-001`…`022` across 6 sections, from
  `GET /api/definition-studio/config` on a fresh database), so the next id is 023. The change spec
  (`docs/changes/definition-studio.md`, "6 field sections / 23 fields") and the training spec both assume 23 defaults.
  Either a default field is missing compared with the prototype, or the spec/change-spec count is wrong. Triage must
  decide which; per spec governance this needs either a code fix or a spec amendment, not a validator judgement.
- Everything else in the step (API name, hint, save with note) worked.

### [J3.3] FAIL — "Save specification" is covered by the canvas save-state pill (also noted on [J3.2])
- Repro (1440x900 and 1920x1080): Canvas (Career module) → **⚙ Configure** → click **New step**. The step settings open
  on the right; their footer has **✦ Ask agent to draft**, the status, and **Save specification**.
- Seen: the rounded save-state pill (`#studioSaveState`, "Saved to Salt Basin · version 1", fixed bottom-right of the canvas page)
  is drawn over the button. Measured inside the frame: button at (1215,622) 117x32, pill at (1095,628) 248x28; only **17%**
  of the button's area reaches the button (`elementFromPoint` sampling). In the screenshot the button's label can't be seen.
  A normal click (Playwright `click()`) retries for 30 s with "`<div role="status" id="studioSaveState" …>` intercepts pointer
  events" and fails. A user clicking on the label would hit the pill.
- Clicking the uncovered top 2px strip of the button worked: status "Saved.", and after a page reload **Evidence required**
  still read **Signed intake form**, so persistence is correct. The defect is in the layout/z-order (the pill should not cover
  the inspector footer, e.g. hide or move it while the inspector is open, or give it `pointer-events: none`).
- Screenshot: `/var/tmp/sbstudio/validate/j3-2.png` (pill over the bottom-right of the inspector).

### [J4.4] PASS-WITH-NOTE — duplicate message shown twice
- The exact expected red message appears, but twice at once: as the inline `ErrorBox` (`role="alert"`) and as a toast,
  so `getByRole('alert')` returns two identical strings. This meets the spec's wording; flagged only as possible noise.

### [J3.2] PASS-WITH-NOTE
- The field label is shown in upper case ("EVIDENCE REQUIRED") because of the page style; the spec allows this kind of letter-case difference. The hint text is exact. See [J3.3] for the
  covered save button in the same panel.

### Other observations (not scored)
- [J1.5]: the pill already read "Saved to Salt Basin · version 1" before any shape was placed (an initial save of
  the empty canvas). Later autosaves within 10 minutes folded into version 1, as the change spec describes.
- `page.reload()` waiting for the full `load` event timed out once in the sandbox, most likely because blocked CDN requests held it up.
  Waiting for `domcontentloaded` worked. Not an app defect as far as can be told here.
- Validation data written to the database: settings versions 2–4, Career module `flow:default` versions 1–3,
  product PRODUCT-L0-001 (`flow:default` v1), MCP token "Studio probe". All data is fictional.
