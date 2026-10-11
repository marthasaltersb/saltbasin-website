# Training spec — release cut (frozen per-release history) and session estimates tracked against each merge

Version 1 · 2026-10-10 · covers `docs/changes/release-cut-and-session-plans.md` v1. Audience: a test agent driving a real browser (desktop and a 390px phone walkthrough) with a shell for the command steps. Follow literally. All data is fictional (a garden-supplies product); nothing here names an employer or application target.

## Where things are

- World Shell (`/world`) -> top tab **Journeys** -> card **Release loop** (small text under the title: "Open configuration"). A full-screen panel opens with a **← Back to World** button, the title **Release loop**, and inside it the heading **Release loop** and five tabs in this order: **Definition**, **Runs**, **Escalations**, **Releases**, **Session plans**. The **Runs** tab is open first. This feature adds the last two tabs.
- **Releases** lists every release as a card with a button **Open release <version>**; a release opens to its features, counts and sessions, with a **← All releases** button.
- **Session plans** has a **Release** selector, a card **Record an estimate** (only for the open release) and one card per session plan. The estimate card has fields **Session id**, **Intent**, one row per item with **Feature**, **Goal**, **Expected score** and **Size** (their accessible names carry the row number: **Feature 1**, **Goal 1**, **Expected score 1**, **Size 1**, **Feature 2** ...), buttons **Add item** and **Save estimate**, and a field **Re-estimate reason**. A session card has the buttons **Record merge for <session>** and **Close session <session>** and a field **Closing note for <session>** while the session is open.
- Nothing in the journeys needs an API call or a terminal except Journeys 6 to 8 (marked as commands) and the edge cases marked as commands. Cutting a release itself is a repository command by design (`scripts/release-cut.mjs`: it copies release-log files and edits the next release's feature list, which is source-control work); the website shows its result on **Releases**.
- "Text" in an expected result means visible text. The page also holds a hidden `output` element (`data-ux-audit-probe`) whose JSON repeats page text: ignore it.
- Red alerts on these tabs are written in plain words and shown in red (`role="alert"`); nothing on these tabs is amber.

Interface parity, per journey (UI path -> API route -> MCP tool). All routes need an administrator; a member gets HTTP 403 and an MCP member token gets `forbidden`.

| Journey | UI path | API (admin cookie, same checks) | MCP tool (calls the same server function) |
| --- | --- | --- | --- |
| 1 Releases | Releases tab | `GET /api/release-cut/releases`, `GET /api/release-cut/releases/:version` | `release_cut_list_releases`, `release_cut_get_release` -> `listReleases`, `getRelease` |
| 2 Estimate | Session plans tab -> Record an estimate | `POST /api/release-cut/sessions/estimate` | `release_cut_record_estimate` -> `recordEstimate` |
| 3 Merge | Session plans tab -> Record merge for ... | `POST /api/release-cut/sessions/:session/merge` | `release_cut_record_merge` -> `recordMerge` |
| 4 Close | Session plans tab -> Close session ... | `POST /api/release-cut/sessions/:session/close` (runs `assertReadyToFinalize`) | `release_cut_close_session` -> `closeSession` |
| 5 Release selector | Session plans tab -> Release | `GET /api/release-cut/sessions?release=` | `release_cut_list_sessions` -> `listSessionPlans` |
| 6 Command line | `scripts/session-plan.mjs`, `scripts/release-cut.mjs` | same functions as the routes | same functions as the tools |
| 7 API | the routes above | `GET /sessions/report` and the routes above | `release_cut_session_report` |
| 8 MCP | Connected Agents (token) | the routes above | the seven `release_cut_*` tools |

## Preconditions

1. [P.1] A freshly seeded database, the production build served, and the admin account signed in (it is the platform's first admin; its email and password are the environment's `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`, written `<ADMIN_EMAIL>` and `<ADMIN_PASSWORD>` below). The test accounts are made with `scripts/create-test-member.mjs` (member `member@test.local`, password `TestPass!2345`; the admin is readied by the same script). Reuse one signed-in session for every browser step (sign-in allows 10 attempts per 15 minutes per IP).
2. [P.2] In the validator's worktree delete leftovers from an earlier pass: `rm -f docs/release-log/session-plans/S-garden-*.json`. Run it again before the phone pass. Nothing else under `docs/release-log` is changed by this spec. Session plans are files, so a database reset does not clear them.
3. [P.3] Open World -> **Journeys** -> the **Release loop** card -> **Open configuration**. Expect the heading **Release loop** and the tabs **Definition**, **Runs**, **Escalations**, **Releases**, **Session plans**, in that order.
4. [P.4] Phone passes use a viewport 390px wide and 844px tall and the same steps. Desktop passes use 1280px wide. Run each pass on its own freshly seeded database.
5. [P.5] Expected noise: console errors for blocked web fonts or certificates (`net::ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`) are environment noise. The only application requests allowed to fail are the refusals this spec names (HTTP 400, 404 or 409), each at the step that causes it. No page error is allowed.
6. [P.6] Command fixture (used only by Journey 6): make an empty folder, called `<FIX>` below (for example `/tmp/garden-cut`, outside any git repository), then create these three files in it exactly (fictional data). `<FIX>/docs/release-log/active-release.features.json`: `{"release":"2030-04-01-garden-gate","version":"1.0.0","title":"Garden gate release","features":[{"key":"seed-catalog","title":"Seed catalog","kind":"new"},{"key":"watering-plan","title":"Watering plan","kind":"new"}]}`. `<FIX>/docs/release-log/active-release.state.json`: `{"features":{"seed-catalog":{"status":"passed","lastRound":2,"lastScore":"12/12"},"watering-plan":{"status":"validate","lastRound":1,"lastScore":"5/8"}},"bugs":[{"feature":"watering-plan","status":"open"}]}`. `<FIX>/docs/test-results/seed-catalog/round-2.md`, whose text is a line `# round 2` followed by a fenced json block holding `{ "feature": "seed-catalog", "baseline": 1, "total": 12, "passed": 12 }`.
7. [P.7] Score fixture (read once, before Journey 3, from the worktree under test): open the highest-numbered `docs/test-results/in-app-release-loop/round-<N>.md`; its fenced json block holds `passed`, `total` and `baseline`. Write `<IARL_ROUND>` for N, `<IARL_PASSED>`, `<IARL_TOTAL>` and `<IARL_BASELINE>` for those three values, and `<IARL_REPORT>` for the path `docs/test-results/in-app-release-loop/round-<N>.md`. The platform must show exactly these values. Where a step says a **Met** label, it is **Met** only when `<IARL_TOTAL>` is 60 and `<IARL_PASSED>` is at least 60 (the estimate is 60/60), otherwise the label is a red **Missed**.

## Journey 1 — Every release, frozen ones exactly as cut

UI path: Releases tab. API: `GET /api/release-cut/releases[/:version]`. MCP: `release_cut_list_releases`, `release_cut_get_release`.

1. [J1.1] Click the tab **Releases**.
   - Expect two cards in this order. First **Release 0.2.0** with the label **frozen**, the line **2026-10-02-application-packages · Salt Basin application packages release** and the line **4 of 18 delivered · 14 carried · frozen 2026-10-10 · 0 session plans**, and a button **Open release 0.2.0**. Second **Release 0.3.0** with the label **open**, the line **2026-10-10-production-hardening · Salt Basin production hardening release**, a line starting **Started 2026-10-10**, and a button **Open release 0.3.0**.
2. [J1.2] Click **Open release 0.2.0**.
   - Expect the heading **Release 0.2.0 — frozen**, the text **Frozen 2026-10-10 at commit 4df3ff7. This record is never rewritten.** and the line **4 of 18 features delivered · 14 carried · bugs: 69 verified, 262 open**.
3. [J1.3] Read the **Features** list of this release.
   - Expect exactly 18 feature cards. The card **qr-gated-outputs** shows the label **delivered** and the line **new · last score 38/38 on baseline v2**. The card **chart-gallery** shows the label **validate** (not delivered) and the line **new · last score 18/20 on baseline v3**.
4. [J1.4] Read the **Sessions** list of this release.
   - Expect the text **No session plans were recorded for this release.**
5. [J1.5] Click **← All releases**.
   - Expect the two cards **Release 0.2.0** and **Release 0.3.0** again.
6. [J1.6] Click **Open release 0.3.0**.
   - Expect the heading **Release 0.3.0 — open** and the text **This release is still open: scores are the latest validated round and change until it is cut.** Click **← All releases** to leave.

## Journey 2 — Record an estimate before the work

UI path: Session plans tab -> Record an estimate. API: `POST /api/release-cut/sessions/estimate`. MCP: `release_cut_record_estimate`. The session ids used are `S-garden-01` and `S-garden-02`; features come from the open release.

1. [J2.1] Click the tab **Session plans**.
   - Expect the selector **Release** showing **0.3.0 (open)**, a card **Record an estimate** with the button **Save estimate**, and the heading **Session plans for release 0.3.0**.
2. [J2.2] With every field empty click **Save estimate**.
   - Expect a red alert **A session id is required (for example S-0.3.0-01-build).** (HTTP 400).
3. [J2.3] Type `S-garden-01` into **Session id** and `Garden walkthrough` into **Intent**, leave **Feature 1** unchosen and click **Save estimate**.
   - Expect a red alert **Each item needs a feature. Choose one of the open release's features.** (HTTP 400).
4. [J2.4] Choose `in-app-release-loop` in **Feature 1**, type `70/60` into **Expected score 1** and click **Save estimate**.
   - Expect a red alert **The expected score must look like 30/32 with the first number no larger than the second (got "70/60").** (HTTP 400).
5. [J2.5] Type `sixty` into **Expected score 1** and click **Save estimate**.
   - Expect a red alert ending **(got "sixty").** (HTTP 400).
6. [J2.6] Type `60/60` into **Expected score 1**, `Keep it passing` into **Goal 1**, choose `S` in **Size 1**, click **Add item**, choose `guided-training-agent` in **Feature 2**, type `5/5` into **Expected score 2**, choose `M` in **Size 2**, and click **Save estimate**.
   - Expect the form to clear (**Session id** empty) and a new card **S-garden-01** with the label **open**, the line **Garden walkthrough**, the item line **in-app-release-loop · size S · expected 60/60 · no merge recorded** with the text **Keep it passing**, the item line **guided-training-agent · size M · expected 5/5 · no merge recorded**, and the line **0 merges recorded**.

## Journey 3 — Record a merge: the score is read, never typed

UI path: session card -> Record merge for S-garden-01. API: `POST /api/release-cut/sessions/:session/merge`. MCP: `release_cut_record_merge`. The platform reads each feature's newest `docs/test-results/<feature>/round-N.md` score block; `in-app-release-loop` shows the score of its newest validated round (the values written in P.7), and `guided-training-agent` has no validated round.

1. [J3.1] Click **Record merge for S-garden-01**.
   - Expect the line **1 merge recorded**, the item line **in-app-release-loop · size S · expected 60/60 · actual <IARL_PASSED>/<IARL_TOTAL>** (from P.7) followed by the label **Met** in green when `<IARL_TOTAL>` is 60 and `<IARL_PASSED>` is at least 60, otherwise **Missed** in red, and the item line **guided-training-agent · size M · expected 5/5 · actual not validated** with no **Met** or **Missed** label and the number 0 nowhere in its actual score.
2. [J3.2] Look for any field that accepts a score on the session card.
   - Expect none: the card has only the button **Record merge for S-garden-01**, the field **Closing note for S-garden-01** and the button **Close session S-garden-01**.
3. [J3.3] In **Record an estimate** type `S-garden-01` into **Session id**, choose `in-app-release-loop` in **Feature 1**, type `59/60` into **Expected score 1** and click **Save estimate**.
   - Expect a red alert **Session S-garden-01 already recorded a merge, so its estimate is fixed. To change it, give a reason for the re-estimate; the original is kept beside it.** (HTTP 409).
4. [J3.4] Type `Scope changed` into **Re-estimate reason** and click **Save estimate**.
   - Expect on card **S-garden-01** the text **1 re-estimate (original kept)** and the item line still reading **in-app-release-loop · size S · expected 60/60 · actual <IARL_PASSED>/<IARL_TOTAL>** (the original estimate is unchanged).
5. [J3.5] Type `S-garden-02` into **Session id**, choose `in-app-release-loop` in **Feature 1**, type `60/62` into **Expected score 1**, click **Save estimate**, then click **Record merge for S-garden-02**.
   - Expect the card **S-garden-02** with the item line **in-app-release-loop · size - · expected 60/62 · actual <IARL_PASSED>/<IARL_TOTAL>** followed by a red label **Missed**.

## Journey 4 — Close a session

UI path: session card -> Close session. API: `POST /api/release-cut/sessions/:session/close`. MCP: `release_cut_close_session`. Closing seals the record and is a finalize path: the server runs `assertReadyToFinalize` first and the screen runs the action through `useToolCategoryGate().run`.

1. [J4.1] Type `Walkthrough done` into **Closing note for S-garden-01** and click **Close session S-garden-01**.
   - Expect card **S-garden-01** to show the label **closed** and the text **Walkthrough done**.
2. [J4.2] Look at card **S-garden-01**.
   - Expect no button **Record merge for S-garden-01**, no button **Close session S-garden-01** and no field **Closing note for S-garden-01**.
3. [J4.3] Look at card **S-garden-02**.
   - Expect it still shows the buttons **Record merge for S-garden-02** and **Close session S-garden-02** and the label **open**.

## Journey 5 — The release selector

UI path: Session plans tab -> Release. API: `GET /api/release-cut/sessions?release=<version>`. MCP: `release_cut_list_sessions`.

1. [J5.1] Choose `0.2.0` in **Release**.
   - Expect the heading **Session plans for release 0.2.0** and the text **No session plans were recorded for this release.**
2. [J5.2] Look for the card **Record an estimate** while 0.2.0 is selected.
   - Expect it is not shown (a frozen release takes no new estimates).
3. [J5.3] Choose `0.3.0` in **Release**.
   - Expect the cards **S-garden-01** and **S-garden-02** and the card **Record an estimate**.

## Journey 6 — The command line: estimates, merges and the cut (commands)

Commands run in a shell in the worktree root, against the fixture `<FIX>` from P.6 (`--root <FIX>` points every command at it, so nothing in the repository changes). `<HEAD7>` is the output of `git rev-parse --short=7 HEAD` in the worktree. Each command's output is the text on its first line unless stated.

1. [J6.1] Run `node scripts/session-plan.mjs estimate --root <FIX> --session S-garden-cli --intent "Cut walk" --item "feature=seed-catalog;goal=ship;expect=12/12;size=S" --item "feature=watering-plan;goal=fix;expect=8/8;size=M"`.
   - Expect exit code 0 and the output `Estimate recorded for S-garden-cli: 2 item(s) in release 1.0.0.`
2. [J6.2] Run `node scripts/session-plan.mjs estimate --root <FIX> --session S-garden-cli --item "feature=nope;expect=1/1"`.
   - Expect exit code 2 and the message `"nope" is not a feature of the open release (1.0.0). Check the spelling against the feature list.`
3. [J6.3] Run `node scripts/session-plan.mjs merge --root <FIX> --session S-garden-cli --commit abc1234`.
   - Expect exit code 0 and `Merge abc1234 recorded for S-garden-cli: 2 feature result(s).`
4. [J6.4] Run `node scripts/session-plan.mjs report --root <FIX>`.
   - Expect exit code 0 and exactly three lines: `Release 1.0.0: 1 session plan(s)`, then a line for `seed-catalog` containing `size S  expected 12/12  actual 12/12  MET`, then a line for `watering-plan` containing `size M  expected 8/8  actual not validated`, with no `MET` or `MISSED` at its end.
5. [J6.5] Run `node scripts/session-plan.mjs estimate --root <FIX> --session S-garden-cli --item "feature=seed-catalog;expect=11/12"`.
   - Expect exit code 2 and the message `Session S-garden-cli already recorded a merge, so its estimate is fixed. To change it, give a reason for the re-estimate; the original is kept beside it.`
6. [J6.6] Run `node scripts/release-cut.mjs --root <FIX> --next-version 1.1.0 --next-release 2030-05-01-garden-path --next-title "Garden path release"`.
   - Expect exit code 0 and the output `Froze 1.0.0 at <HEAD7>: 1/2 planned delivered, 1 carried, 0 in backlog, 0 added after the cut. Opened 1.1.0 with 1 features (1 carried, 0 new).`
7. [J6.7] Run `node -e "const s=require('<FIX>/docs/release-log/releases/1.0.0/summary.json');console.log(s.counts.planned,s.counts.delivered,s.counts.carried,s.features.map(f=>f.key+':'+f.delivered+':'+f.lastScore).join(','),s.sessions.length)"`.
   - Expect exactly `2 1 1 seed-catalog:true:12/12,watering-plan:false:5/8 1`.
8. [J6.8] Run `node -e "const n=require('<FIX>/docs/release-log/active-release.features.json');console.log(n.version,n.features.map(f=>f.key+':'+f.kind).join(','))"`.
   - Expect exactly `1.1.0 watering-plan:carried`.
9. [J6.9] Run `bash -c "mkdir -p <FIX>/docs/release-log/releases/1.1.0; node scripts/release-cut.mjs --root <FIX> --next-version 1.2.0"`.
   - Expect exit code 1 and the message `releases/1.1.0 already exists; a frozen release is never rewritten.`
10. [J6.10] Run `node scripts/release-cut.mjs --root <FIX>`.
   - Expect exit code 2 and the message `--next-version is required`.

## Journey 7 — The same actions through the API, with the same permissions (commands)

`<API_BASE>` is the served origin (for example `http://localhost:6602`). Cookie jars `admin.jar` and `member.jar` are made with `curl -c`. Ids `S-garden-api` is new (P.2 removed any leftover).

1. [J7.1] Run `curl -s -c admin.jar -H "Content-Type: application/json" -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' <API_BASE>/api/auth/login`, then `curl -s -o /dev/null -w "%{http_code}" -b admin.jar <API_BASE>/api/release-cut/releases`.
   - Expect the second command to print `200`.
2. [J7.2] Run `curl -s -o /dev/null -w "%{http_code}" <API_BASE>/api/release-cut/releases`.
   - Expect `401`.
3. [J7.3] Run `curl -s -c member.jar -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"TestPass!2345"}' <API_BASE>/api/auth/login`, then `curl -s -w " %{http_code}" -b member.jar <API_BASE>/api/release-cut/releases`.
   - Expect the second command to print `{"error":"admin only"} 403`.
4. [J7.4] Run `curl -s -w " %{http_code}" -b admin.jar <API_BASE>/api/release-cut/releases/9.9.9`.
   - Expect `{"error":"There is no release \"9.9.9\". Pick one from the list.","code":"not_found"} 404`.
5. [J7.5] Run `curl -s -b admin.jar <API_BASE>/api/release-cut/releases/0.2.0`.
   - Expect JSON with `"state":"frozen"`, `"frozenCommit":"4df3ff7"` and `"counts":{"planned":18,"delivered":4,"carried":14` (the same record the Releases tab showed).
6. [J7.6] Run `curl -s -o /dev/null -w "%{http_code}" -b admin.jar -H "Content-Type: application/json" -d '{"session":"S-garden-api","intent":"API walk","items":[{"feature":"in-app-release-loop","expect":"60/60","size":"S"}]}' <API_BASE>/api/release-cut/sessions/estimate`.
   - Expect `201`.
7. [J7.7] Run `curl -s -w " %{http_code}" -b admin.jar -H "Content-Type: application/json" -d '{"session":"S-garden-api","items":[{"feature":"nope"}]}' <API_BASE>/api/release-cut/sessions/estimate`.
   - Expect `{"error":"\"nope\" is not a feature of the open release (0.3.0). Check the spelling against the feature list.","code":"bad_request"} 400`.
8. [J7.8] Run `curl -s -b admin.jar -H "Content-Type: application/json" -d '{}' <API_BASE>/api/release-cut/sessions/S-garden-api/merge`.
   - Expect JSON with `"recorded":true` and a result `{"feature":"in-app-release-loop","round":<IARL_ROUND>,"passed":<IARL_PASSED>,"total":<IARL_TOTAL>,"baseline":<IARL_BASELINE>,"report":"<IARL_REPORT>"}`.
9. [J7.9] Run `curl -s -b admin.jar <API_BASE>/api/release-cut/sessions/report`.
   - Expect JSON whose `rows` holds an entry with `"session":"S-garden-api"`, `"expected":"60/60"`, `"actual":"<IARL_PASSED>/<IARL_TOTAL>"` and `"met"` true only when `<IARL_TOTAL>` is 60 and `<IARL_PASSED>` is at least 60 (otherwise false).
10. [J7.10] Run `curl -s -w " %{http_code}" -b admin.jar -H "Content-Type: application/json" -d '{"note":"done"}' <API_BASE>/api/release-cut/sessions/S-garden-api/close`.
   - Expect the output to end `"closeNote":"done"}} 200`.
11. [J7.11] In the browser open **Session plans** (leave and re-enter the **Release loop** screen so it reloads).
   - Expect a card **S-garden-api** with the label **closed**, the text **done** and the item line **in-app-release-loop · size S · expected 60/60 · actual 60/60** (the same record the API wrote).

## Journey 8 — The same actions through MCP, with the same permissions

The MCP client is `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list | call <tool> '<json>'` (see `platform-mcp`).

1. [J8.1] Open **Journeys** -> **Connected Agents**, type `Cut agent` into **Token name**, tick **release.loop.read** and **release.loop.write**, click **Create token**.
   - Expect the once-only box **Copy your token now. It will not be shown again.** with a token starting `sbpat_` (keep it as **TOKEN_C**); click **I have copied it**.
2. [J8.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> list`.
   - Expect exit code 0 and these seven lines, one after another in this order: `release_cut_list_releases`, `release_cut_get_release`, `release_cut_list_sessions`, `release_cut_session_report`, `release_cut_record_estimate`, `release_cut_record_merge`, `release_cut_close_session`.
3. [J8.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_get_release '{"version":"0.2.0"}'`.
   - Expect `isError: false` and a result with `state` `frozen`, `frozenCommit` `4df3ff7`, `counts.planned` 18, `counts.delivered` 4 and `counts.carried` 14.
4. [J8.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_record_merge '{"session":"S-garden-nope"}'`.
   - Expect `isError: true` and an error with `status` 404, `code` `not_found` and `message` `Session S-garden-nope has no estimate yet. Record the estimate first, then the merge.`
5. [J8.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_record_estimate '{"session":"S-garden-mcp","intent":"MCP walk","items":[{"feature":"in-app-release-loop","expect":"60/60","size":"S"}]}'`.
   - Expect `isError: false` and a result whose `session.session` is `S-garden-mcp` with `reEstimated` false.
6. [J8.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_record_merge '{"session":"S-garden-mcp"}'`.
   - Expect `isError: false`, `recorded` true and a result for `in-app-release-loop` with `passed` <IARL_PASSED>, `total` <IARL_TOTAL> and `baseline` <IARL_BASELINE>.
7. [J8.7] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_session_report`.
   - Expect `isError: false` and a `rows` entry with `session` `S-garden-mcp`, `expected` `60/60`, `actual` `<IARL_PASSED>/<IARL_TOTAL>` and `met` true only when `<IARL_TOTAL>` is 60 and `<IARL_PASSED>` is at least 60 (otherwise false).
8. [J8.8] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_cut_close_session '{"session":"S-garden-mcp","note":"mcp done"}'`.
   - Expect `isError: false` and a result with `closeNote` `mcp done`.
9. [J8.9] In a second browser session sign in as the member `member@test.local` (password `TestPass!2345`) at `/login`, open `/world`, click **Journeys**.
   - Expect the card **Connected Agents** and no card **Release loop**.
10. [J8.10] As the member open **Connected Agents**, type `Member probe` into **Token name**, tick **release.loop.read**, click **Create token** (keep the token as **TOKEN_M**), then run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_M> call release_cut_list_releases`.
   - Expect `isError: true` and an error with `status` 403, `code` `forbidden` and `message` `release_cut_list_releases is for administrators only. You are signed in as a member.`
11. [J8.11] In the administrator's session open **Journeys** -> **Capabilities** and find the card **Record an estimate (or re-estimate) and record a merge (admin)**.
   - Expect its three cells **Website ready** (path **World Shell > Journeys > Release loop > Session plans**), **API ready** (listing `POST /api/release-cut/sessions/estimate` and `POST /api/release-cut/sessions/:session/merge`) and **MCP ready** (listing `release_cut_record_estimate` and `release_cut_record_merge`).
12. [J8.12] Run `node scripts/check-interface-parity.mjs`.
   - Expect exit code 0 and the last line `OK: the registry matches the code.`

## Edge cases

- [E.1] **Layout, both passes**: after Journey 1 and Journey 2 the document has no horizontal scroll (`document.documentElement.scrollWidth` is not more than `window.innerWidth`) and every visible button, select and input inside the Release loop panel (below its tab row) is at least 44px tall, including **Open release 0.2.0**, **Save estimate**, **Add item** and the **Release** selector.
- [E.2] **Re-saving before any merge replaces the estimate**: on **Session plans** type `S-garden-03` into **Session id**, choose `in-app-release-loop` in **Feature 1**, type `60/60` into **Expected score 1** and click **Save estimate**; then type `S-garden-03` again, choose `in-app-release-loop`, type `59/60` and click **Save estimate**. Expect exactly one card **S-garden-03** whose item line reads **in-app-release-loop · size - · expected 59/60 · no merge recorded** and the line **0 merges recorded** (no re-estimate is counted because no merge existed).
- [E.3] **Reload keeps everything**: reload the page and reopen **Session plans**. Expect the cards **S-garden-01** (closed), **S-garden-02** and **S-garden-03**, and the cards written by Journeys 7 and 8, **S-garden-api** and **S-garden-mcp**.
- [E.4] Run `git diff --stat -- docs/release-log/releases` after all other steps (a frozen release is never rewritten). Expect exit code 0 and no output.
- [E.5] Run `node scripts/session-plan.mjs report --release 0.2.0`. Expect exit code 0 and exactly the output `Release 0.2.0: 0 session plan(s)`.
- [E.6] Run `curl -s -b admin.jar <API_BASE>/api/release-cut/sessions/report` after Journey 7 (not validated is never 0). Expect the row for `S-garden-01` / `guided-training-agent` to hold `"expected":"5/5"`, `"actual":null` and `"met":null`.
