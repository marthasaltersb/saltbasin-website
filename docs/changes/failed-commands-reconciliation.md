# Failed commands reconciliation — application packages / proficiency / live QR session (2026-10-02)

Every command, build, test or agent run in this session that failed, was refused, was interrupted, or partially applied — what state it left, and how it was reconciled. Rule going forward: nothing fails silently, in the product or in the process.

## Process failures

| # | What failed | State it left | Reconciled how | Status |
| --- | --- | --- | --- | --- |
| 1 | `python-docx` / `qrcode` / Pillow / `pypdf` / `opencv` not installed (ModuleNotFoundError) | Nothing written | Installed; re-ran each step | Resolved |
| 2 | Extractor put the ATS resume's contact line in the headline slot | Wrong header in the first package JSON | Contact detected by email/phone; header leftovers kept as paragraphs; re-extracted | Resolved |
| 3 | Re-import created duplicate versions (JSONB reorders keys, so equal content compared unequal) | 4 duplicate draft rows in the local test DB | Key-sorted comparison; test DB cleared; re-ran: unchanged → skipped, changed → new version | Resolved |
| 4 | `pkill -f "node server/index.js"` matched and killed the shell running it (exit 144) | Server and shell gone | Switched to a PID file for every restart | Resolved |
| 5 | PDF via built-in Helvetica rendered `→` as `!'` and `⁴` as `t` | Wrong characters in generated PDFs | Bundled DejaVu Sans (4 weights + license); verified text extraction contains `→` and `⁴` | Resolved |
| 6 | LibreOffice "source file could not be loaded" on every `.docx` | No docx→PDF check possible | Root cause: Writer component not installed (only core). Installed `libreoffice-writer`; converted and verified hyperlinks + QR | Resolved |
| 7 | Commit + push command rejected by the user mid-run | **Commit landed, push did not.** I first reported "nothing committed" — wrong | Checked `git log`; corrected the report to the user; push still held for go-ahead | Resolved (push pending approval) |
| 8 | Push of later commits | Not attempted — the user stopped the earlier push | Held; each stop-hook reminder answered without pushing | Pending user go-ahead |
| 9 | Local Postgres down after a worker restart (`ECONNREFUSED`) | App server exited | Restarted Postgres + server; checked schema | Resolved |
| 10 | A Postgres restart command was interrupted by the user | Postgres had in fact started; later `pg_ctl start` reported "another server might be running" | Verified with `psql`/log that one server was running; no duplicate | Resolved |
| 11 | Docs edit `find` across table cells matched nothing (`find_none`) | Nothing changed | Replaced the whole table with hash/rev guards | Resolved |
| 12 | Browser test: radio "Use Salt Basin methodology" didn't change state | Real UI flaw (controlled radio snapped back until save finished) | Optimistic selection while saving; re-tested | Resolved (product fix) |
| 13 | Browser test timed out on the Rules table | Script ran unauthenticated (env not loaded) — not a product bug | Re-ran with credentials; all steps passed | Resolved |
| 14 | Edit command (capped-points display) rejected by the user | **Partially applied:** both file edits had run before the rejection | Detected with `grep`; kept (correct and wanted); reported to the user | Resolved |
| 15 | Follow-up multi-file edit aborted on an assertion | Nothing written (edits apply only after all assertions pass) | Removed the already-applied pair; re-ran | Resolved |
| 16 | `kill: no such process` on stale server PID | None | Started a fresh server, rewrote PID file | Resolved |
| 17 | Four background agents (chart gallery, configurable rollups, career-bound outputs, release reconciliation) **stopped by the user** | Gallery: uncommitted partial `ChartGallery.jsx` + editor edits. Rollups: uncommitted partial `server/lib/resumeRollups.js`. Career-bound: no changes. Releases: no changes of its own | Inspected each worktree, reported to the user, tasks reset to pending; relaunched on the user's request with the partials offered for salvage | Relaunched |
| 18 | Two agent worktrees were created from old `main` (`e0ea466`), not the working branch | Those agents lacked all branch commits and copied files in by hand | New agents are told to start from the branch HEAD and verify it before working | Resolved for relaunch |
| 19 | Chromium background calls to Google endpoints denied by the egress proxy | None (browser telemetry) | Ignored; no app request affected | Not an app issue |

## Product failures that used to be silent (now surfaced)

| Where | Before | Now |
| --- | --- | --- |
| Chart snapshot fails at QR approval | Logged on the server; QR page silently had no printed baseline | Approval returns `warnings` shown as an error toast; QR page says the printed snapshot wasn't captured and can't compare |
| QR history fails to record a Career Master change | Logged only; the timeline silently skipped a state | `share_sync_error { at, message }` saved on the output; My Resume shows it; cleared on the next successful record |
| Live data fails when the QR page opens | Page quietly showed fewer states | Page shows "Live career data could not be loaded right now" and labels the banner RECORDED DATA |
| Career Master / proficiency fails to load for a template output | Charts showed "no data yet" | Charts show "data could not be loaded — a loading error, not missing Career Master data" |
| Suggestions fail in the technology-category dialog | Suggestions silently absent | Dialog says suggestions are unavailable and why |
| QR page when there is neither a printed snapshot nor live data | The whole live-data panel was hidden (found while verifying the fixes above) | Panel always renders; it states the missing baseline and the failed live load |

Verified by renaming `career_jobs` in the local test database so Career Master queries really failed: the QR API returned `liveError`; editing a skill recorded `share_sync_error` on all three shared outputs and the My Resume list exposed it; approving returned the snapshot warning. After restoring the table, the next save cleared every error and live data returned. Browser screenshots confirmed each notice renders: the QR page's live-data and missing-baseline notices, the RECORDED DATA banner label, and the My Resume sync-error line.

## Known remaining silent paths (pre-existing, not changed here)

- Career Atom sync after Career Master writes (`syncSingleEntry` / `removeEntryEvidence`) logs failures only.
- Audit-log writes in several routes are fire-and-forget.
