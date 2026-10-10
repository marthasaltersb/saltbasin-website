# Test result — World Shell navigation to a tracked job opportunity (round 2)

- Feature: World Shell navigation to a tracked job opportunity, its linked draft outputs, provenance and the shared editor
- Training spec: `docs/training/world-shell-opportunity-outputs.md`, frozen as baseline v1 (sha256 `b5baecdf11346c51ab1ed7ce382f0f7507c3c46464f64ede3f1bc1012539cdb9`); `release-spec-baseline.mjs check` passed ("baselines match: world-shell-navigation v1"). Baseline unchanged since round 1, so no diff table is needed (round 1 scored 45/48 on the pre-baseline step list; this round is the first scored against v1 ids).
- Round: 2
- Commit tested: `c3a71b490991e2f7c7616cb326bd9cfe1084b7d0` (integration branch `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-09
- Environment: fresh database `sb_rl_val_5400_1` (dropped afterwards), `npm run build` + `node server/index.js` on port 5402, seeded with `npm run seed`, Chromium 1194 via Playwright, TZ=UTC, en-US, light scheme. Desktop 1280x900 (click) and mobile 390x844 isMobile+hasTouch (tap). CLI steps in bash in the worktree.
- Live log: `/var/tmp/sbpg/release-loop/world-shell-navigation/round-2/steps.jsonl`; screenshots in the same directory (`<surface>-<step>-<n>.png`).
- Result: **FAIL** (36 of 47 scored steps passed)

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "world-shell-navigation",
  "baseline": 1,
  "specSha256": "b5baecdf11346c51ab1ed7ce382f0f7507c3c46464f64ede3f1bc1012539cdb9",
  "total": 47,
  "passed": 36,
  "failed": ["J0.1","J0.3","J2.3","J4.1","J9.1","J9.2","J10.1","E.5","E.7"],
  "blocked": ["J0.2","E.1"],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

## Test accounts and how the spec's setup was handled

The spec's preconditions (a `curl` signup of `riley.member@example.test` with a provisional password) are API calls, which the fixed test constraints forbid. I used `scripts/create-test-member.mjs` only:

- default accounts (`member@test.local`, admin) were created, member@test.local used only for E.7;
- desktop walk: `riley.member@example.test`, "Riley Fenn", `--no-terms` (so the terms flow in J0.3 could still be tested);
- phone walk: `riley.phone@example.test`, "Riley Fenn", `--no-terms`, so every journey ran twice from a clean state (the second walk could not reuse the first member's state).
- Password for both is `Member!Pass#2468xx` (the spec's post-change password `...yy` could not be reached, see J0.1/J0.2). J3 therefore ran with the `xx` password and each walk's own email.

## Fix details from the handed-over bugs

| Bug | Maps to step | Verdict this round |
|---|---|---|
| world-shell-navigation-B9 (spec predates create-test-member.mjs rule) | J0.1, J0.2, E.1 | **Still failing, recurrenceOf B9.** The spec is frozen and still tells the tester to sign up through the API; under the fixed constraints the account never has a provisional password, so the password page is unreachable (J0.1 fail, J0.2 and E.1 blocked). Needs an approved amendment, not a code change. |
| world-shell-navigation-B11 (3D island entry never exercised) | no baseline step | **Not verifiable.** No step covers it. Observation: the 3D world rendered and was interactive in headless Chromium (swiftshader); the Journeys cards entered the same panels. I did not click 3D islands (would be a step addition). |

Round-1's root issue is also unchanged: the template-built cover letter that every tracked opportunity gets (`coverLetterAutoDraft.js`) still makes the spec's counts wrong (J2.3, J4.1, J9.1, J9.2, J10.1). The spec text for those steps is unchanged in baseline v1, so they fail exactly as in round 1. Every other behaviour the spec describes works, on both surfaces.

## Per step (desktop / mobile)

| Step | Result | What I saw |
|---|---|---|
| J0.1 | **FAIL** (both) | Login with the create-test-member account lands straight on `/world` with the terms prompt (BESTYSTAFF · REQUIRED FIRST PROMPT); no `/first-login-password` page (UI_GAP/setup, B9). |
| J0.2 | blocked (both) | Depends on J0.1; no password page exists to fill. |
| J0.3 | **FAIL** (mobile; desktop pass) | Desktop: four boxes ticked, toast "Consent recorded", World Shell, 0 TRACKED, 7 AGENTS (AGENTS reads 0 for a few seconds first; see Re-evaluations). Mobile: toast and World Shell appear, but the phone top bar shows no TRACKED / AGENTS counters at all, so "Counters read 0 TRACKED, 7 AGENTS" cannot be seen at 390px (MOBILE_GAP). |
| J1.1 to J1.4 | pass | Journeys cards, Career Master full-screen with five tabs, Add Entry dialog with all listed fields, Tools (1) / Ledgerly ERP, back to World. |
| J2.1, J2.2, J2.4 | pass | |
| J2.3 | **FAIL** (both) | Everything as specified except the sentence "No outputs linked to this opportunity yet. Link an existing output below, or import an application package." which is absent: an auto-drafted DRAFT card "Cover Letter — Principal Value Architect at Northwind Freight" (Source: Generated from your Career Master) is already linked. Placeholders Posting URL / Location / Notes and eight score inputs present. |
| J3.1 to J3.3 | pass (cli, logged for both walks) | Refusal text exact; created lines and the "Opportunity #n already existed; 2 output(s) linked." line present; re-run `unchanged`. Output ids are #2/#3 (desktop) and #5/#6 (phone walk), not #1/#2, as ids depend on the shared database and the auto letter (spec says ids vary). |
| J4.1 | **FAIL** (both) | Three cards, all DRAFT: Northwind Freight - Cover Letter, Northwind Freight - Salt Basin Resume, Cover Letter — Principal Value Architect at Northwind Freight (auto). Spec says exactly two. |
| J4.2 | pass | All provenance values exact incl. today's date `Oct 9, 2026`, `Filed against 4 ... (state <12 hex>). Unchanged since.`, no "View my Salt Basin site" button. |
| J5.1, J5.2 | pass | |
| J6.1 to J6.5 | pass | Editor (9 BLOCKS in order, preview with TABLE KEPT EXACTLY AS IMPORTED), "Error: No changes to save.", only four block types plus Cancel, version 2 of 2 afterwards. |
| J7.1 to J7.5 | pass | Dialog with Hands-on (suggested), cancelled message, APPROVED - QR LIVE, QR page with LIVE DATA banner. |
| J8.1, J8.2 | pass | Same slug reused; old bullets until approval, new after. |
| J9.1 | **FAIL** (both) | After Unlink the select shows exactly "Choose an output..." and "Northwind Freight - Cover Letter (cover letter, Draft)" as specified, but two cards remain, not one (the auto letter). |
| J9.2 | **FAIL** (both) | After Link output there are three cards, not two. |
| J10.1 | **FAIL** (both) | Card "Imported Resume — note.txt" with Source Imported document (uploaded by you), Authors none recorded, resume - version 1 of 1 is correct, but it is the fourth card, not the third. |
| J10.2 | pass | Three Body Text rows; Version 2 of 2 (edited from version 1). |
| J11.1 | pass | See Re-evaluations (mobile toast). |
| J12.1 to J12.4 | pass | Desktop walk resized to 390x800 (clicks); phone walk on the 390x844 touch context. No horizontal scroll, panel 8px margins, one-column editor, version 4 of 4, confirmation box fits, APPROVED - QR LIVE. |
| E.1 | blocked (both) | Cannot create a provisional-password member through the interface under the fixed accounts (B9). |
| E.2 | pass | With the `GET /api/member-config/draft` request aborted in the browser (fault injection, the interface cannot produce this itself), the right panel shows "Your islands could not be loaded: ..." (not blank). |
| E.3 | pass | Same action as J6.2 (red "Error: No changes to save.", HTTP 400 seen in the network log). |
| E.4 | pass | Same actions as J7.2/J7.3. |
| E.5 | **FAIL** (both) | An AI-generated JSON output cannot be created through the interface in the test environment (no `ANTHROPIC_API_KEY`). Clicking "Generate Resume for This Opportunity" did `POST .../generate-resume` which returned 400; no new card and no error text was visible after 7s on either surface (toast lives 2.4s). The "reason instead of Edit draft" could not be seen. |
| E.6 | pass | Unlink removes one card (4 to 3); the select offers the letter; My Resume shows Resume Output History with the letter still present. |
| E.7 | **FAIL** (both, UI_GAP) | Logged in as the other member: tracker empty (TRACKED (0), no Northwind outputs). The "foreign id returns an error" half can only be exercised with a typed API call, so it cannot be completed through the interface. |
| E.8 | pass | J3.3 rerun printed `unchanged` for both outputs with the same opportunity id; tracked list stayed at TRACKED (1). |

## Interface parity

- Desktop point-and-click and 390px touch walkthroughs both completed for every journey. The only typed URL is the app start page (`/login`, and `/world` as the shell's own entry used for the spec's "Reload /world").
- MCP_GAP: platform MCP server not built yet (feature platform-mcp). `server/lib/mcpToolRegistry.js` does not exist and the server exposes no MCP endpoint, so none of these capabilities has a tool: track an opportunity (`POST /api/career-agents/opportunities`), update its details (`PATCH .../opportunities/:id`), list its outputs (`GET .../opportunities/:id/outputs`), list unlinked outputs (`GET /api/career-agents/unlinked-outputs`), link / unlink an output (`POST|DELETE .../opportunities/:id/outputs/:outputId/link`), read an output's content (`GET /api/career-agents/resume-outputs/:id/content`), save a new draft version (`POST .../resume-outputs/:id/versions`), approve for QR (`POST /api/resume-outputs/:id/share`), import a package (script over HTTP).
- UI_GAP: E.1 (no way to produce a provisional-password member), E.7 (foreign-id behaviour).
- MOBILE_GAP: J0.3 counters (TRACKED / AGENTS) are not shown in the phone top bar.

## Re-evaluations I made in my own log (disclosed)

These checks failed because of my script, not the product, and were corrected from the screenshots (the corrected lines say so in `steps.jsonl`):

- J6.4 desktop and mobile: my check counted text occurrences from `innerText`, which excludes the textarea value. The textarea held the exact initial value, and the live preview showed the new sentence (desktop screenshot; on the phone the single innerText hit is the preview since the row label is truncated).
- J0.3 desktop: the 7 AGENTS counter appeared after more than 10s only because the machine load average was about 35; it appears in about 3s unloaded.
- J11.1 mobile: the "Opportunity details saved" toast (2.4s) was missed under load; a supplementary run of the same action on a second placeholder observed it, and the box and PLACEHOLDER tag were gone.
- J9.1 desktop evidence reads "after=3": my fixed 2s wait was too short under load; the phone walk (polling) shows 3 to 2 cards. The result is a fail either way.
- Earlier script defects (case-sensitive heading match, a hidden diagnostic element capturing a click) caused re-runs of steps on a fresh database; only the final fresh walk's results are in the log. Some J4/J5/E.6 lines were removed once and re-run because of parsing bugs in my script.

## Console errors and failed requests

- No page errors.
- External, sandbox-blocked (`external_blocked`): Google Fonts stylesheet, three.js CDN script on `/login`.
- Expected HTTP 400 on `POST .../resume-outputs/:id/versions` (J6.2 no change) and on `POST .../opportunities/:id/generate-resume` (E.5).
- Expected HTTP 409 on `POST /api/resume-outputs/:id/share` (finalization gate before the category dialog).
- `GET /api/member-config/draft` failed by design (E.2 fault injection); two `ERR_ABORTED` GETs from navigations away mid-load.
- Regression-gate rule: no blank, clipped, unreadable or contextless screen at 1280px or 390px.

## Observations (not scored)

- Generate Resume for This Opportunity returns HTTP 400 with no visible message after the 2.4s toast; unclear to a user whether anything happened (possibly missing API key in this environment).
- AGENTS counter reads 0 for several seconds after consent before showing 7.
- Parallel first boot (server plus seed plus create-test-member started together on an empty database) crashed the server with a `pg_type` unique-violation (race on CREATE TABLE); sequential boot is fine. Not a user path.
- B11: no baseline step enters an island in the 3D view; the 3D scene rendered in headless Chromium.

## Process notes

- Server stopped by PID file; database `sb_rl_val_5400_1` dropped. No product code, specs or baselines changed; nothing committed. The report was written in the worktree copy (the tool refused the main-checkout path) and copied to the requested path.
