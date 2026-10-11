# Training spec — After-session context / prompt / cache / memory mapping with token, spend and time trends

Version 1 · 2026-10-09 · covers `docs/changes/session-mapping.md` v1. Audience: a test agent driving a real browser (desktop 1280x900 and a 390x844 touch phone) plus a shell. Follow literally. All data is fictional (a garden-supplies demo); nothing here names an employer or application target.

## Where things are

- **Screen**: `/world` -> top tab **Journeys** -> card **Sessions** (subtitle "Open configuration"). A full-screen panel opens with a **← Back to World** button, the title **Sessions**, a heading **Sessions** and five tabs in this order: **Trends**, **Sessions**, **Mapping queue**, **Import**, **Settings**. Reachable from the World Shell only: **Classic Tools** -> **Platform Lifecycle Management** does not list **Sessions**. Admin only: a member never sees the card.
- **What the screen shows**: metrics only (token counts, cache-hit ratio, agents, time, limit events, spend, mapping proposals). It never shows or stores conversation text.
- **Words in capitals** (the four summary tiles and every chart heading) are drawn in capitals on screen: SESSIONS, TOKENS, SPEND, CACHE-HIT RATIO; TOKENS BY TYPE, SPEND, CACHE-HIT RATIO, ACTIVE TIME, LIMIT EVENTS.
- **Interface parity** (every capability, three ways):

| Capability | Website (desktop and 390px) | API (admin cookie, same checks) | MCP tool |
| --- | --- | --- | --- |
| Read config / save / restore defaults | Settings tab | `GET/PUT/DELETE /api/session-mapping/config` | `session_mapping_config` (planned) |
| List and open sessions | Sessions tab | `GET /api/session-mapping/sessions`, `GET /api/session-mapping/sessions/:id` | `session_mapping_sessions` (planned) |
| Trends, before/after | Trends tab | `GET /api/session-mapping/trends` | `session_mapping_trends` (planned) |
| Mapping queue, reject, mark applied | Mapping queue tab | `GET /api/session-mapping/proposals`, `POST .../proposals/:id/reject`, `POST .../proposals/:id/apply` | `session_mapping_proposals` (planned) |
| File a session | Import tab (paste transcript, paste analysis, scan) | `POST /api/session-mapping/import/transcript`, `/import/metrics`, `/import/scan` | `session_mapping_import` (planned) |
| Capture failures | Import tab, bottom card | `GET /api/session-mapping/failures`, `PUT .../failures/:id/disposition` | `session_mapping_failures` (planned) |
| Command line / SessionEnd hook | n/a | `node scripts/analyze-session.mjs` | n/a |

- **MCP**: `server/lib/mcpToolRegistry.js` does not exist in the repository this spec was frozen against. The tools above are planned names for the `platform-mcp` feature; each will call the same `server/lib/sessionMapping.js` function as the route. No step below depends on MCP; the gap is recorded in the change spec, not hidden.
- Wait for any "Loading…" text to disappear before reading a tab. Opening a tab always reloads its numbers.

## Preconditions

Run the whole spec once per surface. Before the phone run, reset to a fresh database (P.1) and recreate the fixtures (P.2); the numbers below assume nothing was filed before.

1. [P.1] Fresh database per the fixed test constraints: boot the server once from the worktree root against a new empty database, run `npm run seed`, then `node scripts/create-test-member.mjs`. The admin account is the one named by `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` (in this harness `betsy@test.local` / `TestPass!2345`; the first `/world` visit may show **Career Portfolio Terms & Data Conditions**, already accepted by the script). The member is `member@test.local` / `TestPass!2345`. The server and every shell command run from the same worktree root and the same `DATABASE_URL`.
2. [P.2] Create the folder `/var/tmp/session-mapping-fixture` and write the files of Appendix A into it, byte for byte (each fenced block is one file; the first line of each block, starting with `#`, names the path and is not part of the file). Existing files are overwritten.
3. [P.3] Expect two kinds of background noise in every round, neither a defect: the console error `net::ERR_CERT_AUTHORITY_INVALID` / `net::ERR_TUNNEL_CONNECTION_FAILED` (a web-font request blocked by the sandbox), and Postgres lines such as `column ... already exists, skipping` printed by a `node -e` command that loads the database module. The only application requests allowed to fail are the HTTP 400 / 401 / 403 responses this spec names at the step that causes them.

## Journey 1 — Open the Sessions screen

1. [J1.1] Open `/login`, enter the admin email and password, click **Sign In**. Expect to leave `/login`.
2. [J1.2] Open `/world`. Expect the top bar to show the tab **Journeys**.
3. [J1.3] Click **Journeys**. Expect a card labelled **Sessions** with the subtitle **Open configuration**.
4. [J1.4] Click the **Sessions** card. Expect a **← Back to World** button, the title **Sessions**, the heading **Sessions**, the five tabs **Trends**, **Sessions**, **Mapping queue**, **Import**, **Settings** in that order, and on **Trends** the text **No sessions have been filed yet. Open the Import tab to file one.**
5. [J1.5] Measure the page (browser dev tools, or select-all and scroll): Expect no horizontal scrolling (the page is no wider than the viewport, 1280 or 390 px) and every tab button at least 44 px tall.

## Journey 2 — Settings: the price table and thresholds start at the defaults

1. [J2.1] Click the **Settings** tab. Expect the card **Price table** with **Currency** `USD` and exactly three price rows: row 1 model prefix `claude-opus` with Input `15`, Cache write `18.75`, Cache read `1.5`, Output `75`; row 2 `claude-sonnet` with `3`, `3.75`, `0.3`, `15`; row 3 `claude-haiku` with `1`, `1.25`, `0.1`, `5`.
2. [J2.2] Still on **Settings**. Expect **Idle gap that is not work (minutes)** `10`; **Transcripts folder on the server (blank = default)** empty; the thresholds **Cache-hit ratio below (0 to 1)** `0.8`, **Minimum messages before judging cache** `5`, **Compactions allowed before proposing** `0`, **One agent’s share of tokens above (0 to 1)** `0.6`, **Minimum agents before judging share** `2`, **Usage or rate limits allowed before proposing** `0`, **Skill invoked this many times** `5`; and the target files **Context target file** `CLAUDE.md`, **Prompt target file** `.claude/workflows/release-loop.js`, **Cache target file** `CLAUDE.md`, **Memory target file** `docs/active-universal-salt-basin-agent-memory-register.md`.

## Journey 3 — File a pasted transcript

1. [J3.1] Click the **Import** tab. Expect the cards **Scan server transcripts**, **Paste a transcript**, **Paste an analysis (JSON)** and **Capture failures (0 open)** (the last one says **No capture failures.**).
2. [J3.2] In **Paste a transcript**: type `demo-garden-1` in **Session name**; paste the content of `paste/main.jsonl` (Appendix A) in **Main session transcript**; click **Add subagent transcript**; type `Garden checker` in **Subagent 1 label**; paste the content of `paste/sub/helper.jsonl` in **Subagent 1 transcript**; click **Analyze and file**. Expect the message **Filed as session #1 (new). 4 mapping proposals in the queue.**
3. [J3.3] Click the **Sessions** tab. Expect one card **Session demo-gar** with the pill **Claude Code**, **Ended 2030-03-01** and the line **6,700 tokens · cache-hit 77.7% · spend USD 0.0276 + not priced: claude-mystery-demo · 1 limit event · 1 compaction · 4 open mappings**.
4. [J3.4] Click **Open session details**. Expect the sub-line **Claude Code session · ended 2030-03-01 · 6 messages (usage counted once per message id)**; Input tokens **150**, Cache-write tokens **1,000**, Cache-read tokens **4,000**, Output tokens **1,550**, Cache-hit ratio **77.7%**, Spend **USD 0.0276 + not priced: claude-mystery-demo**, Active time **18 min**, Elapsed time **30 min**; the card **Agents (2)** listing **main session · 5 messages · 6,550 tokens** and **Garden checker · 1 message · 150 tokens**; the card **Limit events** with **1 usage or rate-limit event, 1 compaction**, a line **Compaction (auto): 150,000 tokens before · 2030-03-01** and a line **rate limit (HTTP 429) · 2030-03-01**; and **Mapping proposals (4)**.
5. [J3.5] Click **← All sessions**. Expect the session list again.

## Journey 4 — Mapping queue: reject one, apply one

1. [J4.1] Click the **Mapping queue** tab. Expect **4 mappings** (Status **Proposed**, Area **All areas**) with these titles, top to bottom: **1 usage or rate-limit event**; **Durable facts at risk after compaction**; **Context compacted 1 time**; **Cache-hit ratio 77.7% is below 80.0%**.
2. [J4.2] Read the card **Cache-hit ratio 77.7% is below 80.0%**. Expect the pills **Cache** and **proposed**; **Edit target: CLAUDE.md · from Session demo-gar**; the evidence lines **Cache-hit ratio: 77.7%**, **Cache-read tokens: 4,000**, **Cache-write tokens: 1,000**, **Uncached input tokens: 150**, **Messages: 6**; and a suggested edit that starts **In CLAUDE.md, keep the stable prefix first and identical from turn to turn** and ends **(this session: 77.7% over 6 messages).**
3. [J4.3] Set **Area filter** to **Memory**. Expect **1 mapping**. Set it back to **All areas**.
4. [J4.4] On the card **Durable facts at risk after compaction** click **Reject**, then **Confirm reject** with the field empty. Expect the red message **Say why this mapping is rejected** (HTTP 400). Type `Not needed for the demo` in **Why is this rejected?** and click **Confirm reject**. Expect the queue to show **3 mappings**.
5. [J4.5] Set **Status filter** to **Rejected**. Expect **1 mapping**: the **Durable facts at risk after compaction** card with **Rejected: Not needed for the demo**. Set **Status filter** back to **Proposed** (expect **3 mappings**).
6. [J4.6] On the card **Cache-hit ratio 77.7% is below 80.0%** click **Mark applied**. Set **Applied on** to `2030-03-03`, type `demo-commit-1` in **Reference (commit or note)**, click **Confirm applied**. Expect the queue to show **2 mappings**.
7. [J4.7] Set **Status filter** to **Applied**. Expect **1 mapping**: the cache card with **Applied on 2030-03-03 · demo-commit-1**. Set **Status filter** back to **Proposed**.

## Journey 5 — File a second analysis; trends, timeline and before/after

1. [J5.1] Click the **Trends** tab. Expect the tiles **1** SESSIONS, **6,700** TOKENS, **USD 0.0276** SPEND, **77.7%** CACHE-HIT RATIO; the note **Not priced (add a price row in Settings): claude-mystery-demo. Their spend is left out, not counted as zero.**; the line **Showing 2030-03-01 to 2030-03-01 (1 day with sessions)**; the five charts TOKENS BY TYPE, SPEND, CACHE-HIT RATIO, ACTIVE TIME, LIMIT EVENTS; and under **Before and after applied mappings** the text **No sessions have ended since this change, so there is nothing to compare yet.**
2. [J5.2] Click **Import**. Paste the content of `paste/analysis2.json` (Appendix A) in **Paste an analysis (JSON)** and click **File analysis**. Expect **Filed as session #2 (new). 0 mapping proposals in the queue.**
3. [J5.3] Click **Trends**. Expect the tiles **2** SESSIONS, **18,700** TOKENS, **USD 0.0626** SPEND, **88.4%** CACHE-HIT RATIO and the line **Showing 2030-03-01 to 2030-03-05 (2 days with sessions)**. In the before/after card for the cache mapping expect **Applied on 2030-03-03 to CLAUDE.md** and the rows **Sessions** 1 and 1; **Cache-hit ratio** 77.7% and 94.0% followed by **(up 16.3 points)**; **Tokens per session** 6,700 and 12,000; **Spend per session** USD 0.0276 and USD 0.035; **Limit events per session** 1.00 and 0.00; **Active minutes per session** 18.00 and 45.00.
4. [J5.4] Read the tooltip text of the bars (the SVG title element of each bar; desktop hover shows it): expect in TOKENS BY TYPE **2030-03-05 — Output tokens: 2,000 tokens** and **2030-03-01 — Cache-read tokens: 4,000 tokens**; in SPEND **2030-03-05 — 0.035 USD** and **2030-03-01 — 0.0276 USD**; in CACHE-HIT RATIO **2030-03-05 — 94 %** and **2030-03-01 — 77.7 %**; in ACTIVE TIME **2030-03-05 — 45 minutes** and **2030-03-01 — 18 minutes**; in LIMIT EVENTS **2030-03-01 — Usage or rate limits: 1 event** and **2030-03-01 — Compactions: 1 event**. (Each chart has one value axis: tokens, USD, percent, minutes, events.)
5. [J5.5] Focus the slider **Timeline through** and press the Home key (phone: drag it fully left). Expect **Showing 2030-03-01 to 2030-03-01 (1 day with sessions)** and the SESSIONS tile **1**. Press End (drag fully right): expect **Showing 2030-03-01 to 2030-03-05 (2 days with sessions)**. Focus **Timeline from** and press End: expect **Showing 2030-03-05 to 2030-03-05 (1 day with sessions)** and the TOKENS tile **12,000**. Press Home to restore.

## Journey 6 — Edit the price table and a threshold: everything is re-priced and re-mapped

1. [J6.1] Click **Settings**, click **Add price row**. In row 4 type model prefix `claude-mystery`, Input `2`, Cache write `1`, Cache read `1`, Output `2`. Click **Save settings**. Expect **Saved. Mapping re-run for 2 sessions.**
2. [J6.2] Click **Sessions**. Expect the card **Session demo-gar** to read **6,700 tokens · cache-hit 77.7% · spend USD 0.0279 · 1 limit event** (no "not priced"). Click **Trends**. Expect the SPEND tile **USD 0.0629** and no "Not priced" note.
3. [J6.3] Click **Settings**, set **Compactions allowed before proposing** to `1`, click **Save settings** (expect **Saved. Mapping re-run for 2 sessions.**). Click **Mapping queue**. Expect **1 mapping** (Proposed): **1 usage or rate-limit event**; the **Context compacted 1 time** card is gone. Status **Applied** still shows **1 mapping** and **Rejected** still shows **1 mapping**. Set the filter back to **Proposed**.
4. [J6.4] Click **Settings**, click **Restore defaults**. Expect **Defaults restored. Mapping re-run for 2 sessions.** and the price table back to the three default rows. Click **Mapping queue**. Expect **2 mappings** (Proposed): **1 usage or rate-limit event** and **Context compacted 1 time**.

## Journey 7 — Hook failure, scan the server folder, capture failures

1. [J7.1] `node scripts/analyze-session.mjs --hook < /var/tmp/session-mapping-fixture/hook-bad.json; echo "exit=$?"` prints, on the error stream, `analyze-session failed (/nonexistent/x.jsonl): No transcript found for "/nonexistent/x.jsonl"` and, on the output stream, `exit=0` (a failing hook never blocks).
2. [J7.2] `cat server/data/sessionMapping/hook-failures.jsonl` prints exactly one line containing `"ref":"/nonexistent/x.jsonl"` and `"error":"No transcript found for \"/nonexistent/x.jsonl\""`.
3. [J7.3] In **Settings** type `/var/tmp/session-mapping-fixture/folder` in **Transcripts folder on the server (blank = default)** and click **Save settings**. Expect **Saved. Mapping re-run for 2 sessions.**
4. [J7.4] Click **Import**, click **Scan server transcripts**. Expect **Found 1 transcript: 1 new, 0 updated, 0 unchanged, 0 failed, 1 hook failure filed below.**
5. [J7.5] In **Capture failures (1 open)** expect one row **open** **session_end_hook · /nonexistent/x.jsonl** with the text **No transcript found for "/nonexistent/x.jsonl"**. Click **Mark reconciled** with the note empty: expect the red message **Closing a capture failure needs a note saying what was done** (HTTP 400). Type `Hook path was a typo in the demo` in the note field and click **Mark reconciled**. Expect the heading **Capture failures (0 open)** and the row text **reconciled: Hook path was a typo in the demo**.
6. [J7.6] Click **Scan server transcripts** again. Expect **Found 1 transcript: 0 new, 0 updated, 1 unchanged, 0 failed.**
7. [J7.7] Click **Sessions**. Expect a card **Session scan-dem** with **Claude Code**, **Ended 2030-03-02** and **4,260 tokens · cache-hit 49.4% · spend USD 0.0113 · 0 limit events · 0 compactions · 0 open mappings**. Click its **Open session details**: expect **Agents (2)** with **main session · 2 messages · 4,240 tokens** and **Fixture helper · 1 message · 20 tokens**, and **No mapping proposed for this session: it is within every threshold.** Click **← All sessions**, then **Trends**: expect the tile **3** SESSIONS and **Showing 2030-03-01 to 2030-03-05 (3 days with sessions)**.

## Journey 8 — The command-line analyzer and the SessionEnd hook

1. [J8.1] `node scripts/analyze-session.mjs /var/tmp/session-mapping-fixture/folder/scan-demo-1.jsonl; echo "exit=$?"` prints, among its lines: `Session claude_code:scan-demo-1`, `Messages (usage counted once per message id): 3`, `Tokens: input 50, cache-write 2,000, cache-read 2,000, output 210`, `Cache-hit ratio: 49.4%`, `Agents: 2`, `- main session: 2 messages, 4,240 tokens`, `- Fixture helper: 1 messages, 20 tokens`, `Limit events: 0 usage/rate-limit, 0 compaction`, `Mapping proposals: 0`, and finally `exit=0`. Nothing is written to the database.
2. [J8.2] `node scripts/analyze-session.mjs /var/tmp/session-mapping-fixture/folder/scan-demo-1.jsonl --json | grep -c '"text"'` prints `0` (the metrics contain no transcript text).
3. [J8.3] `node scripts/analyze-session.mjs /var/tmp/session-mapping-fixture/folder/scan-demo-1.jsonl --import` prints, as its first line, `Filed as session #3 (updated); 0 mapping proposal(s) in the queue.` followed by the same summary as J8.1
4. [J8.4] `node scripts/analyze-session.mjs --hook < /var/tmp/session-mapping-fixture/hook-ok.json; echo "exit=$?"` prints only `exit=0` (hook mode is silent on success).
5. [J8.5] `grep -c SessionEnd .claude/settings.json` prints `1` (the non-blocking SessionEnd hook is installed and runs `node scripts/analyze-session.mjs --hook`).

## Journey 9 — In-app agent runs are filed from their completion path

1. [J9.1] `node -e "import('./server/lib/sessionMapping.js').then(async (m) => { await m.recordInAppAgentRun({ definitionId: 7, label: 'Demo outreach agent', model: 'claude-sonnet-demo', usage: { input_tokens: 30, output_tokens: 70 } }); await m.recordInAppAgentRun({ definitionId: 7, label: 'Demo outreach agent', model: 'claude-sonnet-demo', limit: 'usage_limit' }); process.exit(0); })"; echo "exit=$?"` ends with `exit=0` (this is the function the platform calls after every in-app agent completion and when an agent reaches its token cap).
2. [J9.2] Click **Sessions**. Expect two cards **Demo outreach agent** with the pill **in-app agent**: one reading **100 tokens · cache-hit not recorded · spend USD 0.0011 · 0 limit events** and one reading **0 tokens** ... **1 limit event · 0 compactions · 1 open mapping**. Their **Ended** date is the UTC date on which J9.1 ran.
3. [J9.3] Open the details of the card with **100 tokens**. Expect **In-app agent run** in the sub-line, **Cache-write tokens: not recorded** and **Elapsed time: not recorded** (unknown values are never shown as zero).

## Journey 10 — The API gives the same answers with the same permissions

1. [J10.1] `curl -s -c /tmp/sm-admin.jar -H "Content-Type: application/json" -d '{"email":"betsy@test.local","password":"TestPass!2345"}' -o /dev/null -w "%{http_code}" http://localhost:<API_PORT>/api/auth/login` prints `200` (use the admin email and password of P.1 and the server's port).
2. [J10.2] `curl -s -b /tmp/sm-admin.jar -w " %{http_code}" "http://localhost:<API_PORT>/api/session-mapping/proposals?status=applied"` prints a JSON body containing `"status":"applied"`, `"appliedOn":"2030-03-03"` and `"appliedRef":"demo-commit-1"`, followed by ` 200`.
3. [J10.3] `curl -s -b /tmp/sm-admin.jar http://localhost:<API_PORT>/api/session-mapping/trends` prints JSON containing `"currency":"USD"` and `"totalSessions":5`.
4. [J10.4] `curl -s -w " %{http_code}" http://localhost:<API_PORT>/api/session-mapping/sessions` (no cookie) prints `{"error":"unauthorized"} 401`.

## Edge cases

Run these in order, after Journey 10, in the same browser session.

- [E.1] **Import** -> in **Analysis JSON** type `{not json` and click **File analysis**. Expect a red message starting **The analysis could not be read because part of its text is mistyped or missing.** followed by a second line starting **Technical detail:** (HTTP 400); nothing is filed.
- [E.2] In **Analysis JSON** type `{"sourceKey":"claude_code:x"}` and click **File analysis**. Expect the red message **The analysis needs a "tokens" object with input, cacheWrite, cacheRead and output** (HTTP 400).
- [E.3] In **Paste a transcript** type `bad-lines` in **Session name** and `not json` in **Main session transcript**, click **Analyze and file**. Expect the red message **No assistant messages with token usage were found (1 line could not be read as JSON)** (HTTP 400).
- [E.4] Clear **Session name** and click **Analyze and file**. Expect the red message **Give a session id (any short name, for example the transcript file name)** (HTTP 400).
- [E.5] Fill **Session name** `demo-garden-1`, **Main session transcript** with `paste/main.jsonl`, add a subagent labelled `Garden checker` with `paste/sub/helper.jsonl`, click **Analyze and file**. Expect **Filed as session #1 (updated). 2 mapping proposals in the queue.** Click **Sessions**: expect still exactly one card **Session demo-gar** (no duplicate), and in **Mapping queue** the Applied filter still shows 1 and Rejected still shows 1 (earlier decisions are kept).
- [E.6] **Settings** -> **Add price row**, fill only Input, Cache write, Cache read and Output with `1` (leave the model prefix empty), click **Save settings**. Expect the red message **prices row 4: model prefix is required** (HTTP 400) and nothing saved. Click **Remove row 4**.
- [E.7] **Mapping queue** -> on the card **Context compacted 1 time** click **Mark applied**, clear **Applied on**, click **Confirm applied**. Expect the red message **Give the day the edit took effect as YYYY-MM-DD** (HTTP 400); the card stays **proposed**.
- [E.8] **Settings** -> set **Transcripts folder on the server (blank = default)** to `/var/tmp/session-mapping-fixture/nope`, **Save settings**; **Import** -> **Scan server transcripts**. Expect the red message **Cannot read transcripts folder /var/tmp/session-mapping-fixture/nope: ENOENT: no such file or directory** followed by the system's own detail (HTTP 400).
- [E.9] `curl -s -c /tmp/sm-member.jar -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"TestPass!2345"}' -o /dev/null -w "%{http_code}" http://localhost:<API_PORT>/api/auth/login` prints `200`; then `curl -s -b /tmp/sm-member.jar -w " %{http_code}" http://localhost:<API_PORT>/api/session-mapping/sessions` prints `{"error":"admin only"} 403` (a member can never read session metrics).

## Appendix A — Fixture files (fictional; write each block to the path on its first line, without that line)

```
# /var/tmp/session-mapping-fixture/paste/main.jsonl
{"type":"assistant","timestamp":"2030-03-01T10:00:00.000Z","sessionId":"demo-garden-1","gitBranch":"demo/garden","message":{"id":"msg_a1","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":1000,"cache_read_input_tokens":0,"output_tokens":100}}}
{"type":"assistant","timestamp":"2030-03-01T10:00:00.000Z","sessionId":"demo-garden-1","gitBranch":"demo/garden","message":{"id":"msg_a1","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":1000,"cache_read_input_tokens":0,"output_tokens":100}}}
{"type":"assistant","timestamp":"2030-03-01T10:02:00.000Z","message":{"id":"msg_a2","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":0,"cache_read_input_tokens":1000,"output_tokens":200}}}
{"type":"assistant","timestamp":"2030-03-01T10:04:00.000Z","message":{"id":"msg_a3","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":0,"cache_read_input_tokens":1000,"output_tokens":300}}}
{"type":"system","subtype":"compact_boundary","timestamp":"2030-03-01T10:05:00.000Z","compactMetadata":{"trigger":"auto","preTokens":150000,"postTokens":20000}}
{"type":"assistant","timestamp":"2030-03-01T10:06:00.000Z","message":{"id":"msg_a4","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":0,"cache_read_input_tokens":1000,"output_tokens":400}}}
{"type":"assistant","timestamp":"2030-03-01T10:07:00.000Z","isApiErrorMessage":true,"apiErrorStatus":429,"message":{"id":"msg_err1","model":"<synthetic>","usage":{"input_tokens":0,"output_tokens":0},"content":[{"type":"text","text":"x"}]}}
{"type":"assistant","timestamp":"2030-03-01T10:30:00.000Z","message":{"id":"msg_a5","model":"claude-sonnet-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":0,"cache_read_input_tokens":1000,"output_tokens":500}}}
```

```
# /var/tmp/session-mapping-fixture/paste/sub/helper.jsonl
{"type":"assistant","timestamp":"2030-03-01T10:10:00.000Z","message":{"id":"msg_s1","model":"claude-mystery-demo","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":50}}}
{"type":"assistant","timestamp":"2030-03-01T10:11:00.000Z","message":{"id":"msg_s1","model":"claude-mystery-demo","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":50}}}
```

```
# /var/tmp/session-mapping-fixture/paste/analysis2.json
{"sourceKey":"claude_code:demo-garden-2","label":"Session demo-two","startedAt":1898939700000,"endedAt":1898942400000,"elapsedMinutes":45,"activeMinutes":45,"messages":10,"tokens":{"input":100,"cacheWrite":500,"cacheRead":9400,"output":2000},"byModel":{"claude-sonnet-demo":{"input":100,"cacheWrite":500,"cacheRead":9400,"output":2000,"messages":10}}}
```

```
# /var/tmp/session-mapping-fixture/folder/scan-demo-1.jsonl
{"type":"assistant","timestamp":"2030-03-02T09:00:00.000Z","sessionId":"scan-demo-1","message":{"id":"msg_f1","model":"claude-sonnet-demo","usage":{"input_tokens":20,"cache_creation_input_tokens":2000,"cache_read_input_tokens":0,"output_tokens":100}}}
{"type":"assistant","timestamp":"2030-03-02T09:05:00.000Z","message":{"id":"msg_f2","model":"claude-sonnet-demo","usage":{"input_tokens":20,"cache_creation_input_tokens":0,"cache_read_input_tokens":2000,"output_tokens":100}}}
```

```
# /var/tmp/session-mapping-fixture/folder/scan-demo-1/subagents/agent-fx1.jsonl
{"type":"assistant","timestamp":"2030-03-02T09:02:00.000Z","message":{"id":"msg_h1","model":"claude-haiku-demo","usage":{"input_tokens":10,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":10}}}
```

```
# /var/tmp/session-mapping-fixture/folder/scan-demo-1/subagents/agent-fx1.meta.json
{"description":"Fixture helper","agentType":"general-purpose"}
```

```
# /var/tmp/session-mapping-fixture/hook-bad.json
{"transcript_path":"/nonexistent/x.jsonl"}
```

```
# /var/tmp/session-mapping-fixture/hook-ok.json
{"transcript_path":"/var/tmp/session-mapping-fixture/folder/scan-demo-1.jsonl"}
```
