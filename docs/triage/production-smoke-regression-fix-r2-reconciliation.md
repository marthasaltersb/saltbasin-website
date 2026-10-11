# Reconciliation: production-smoke-regression, fix round 2

Branch `release-loop/production-smoke-regression-fix-r2` (fc73e27). Not committed.

| # | Reported | Kind | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Build passed; postbuild "No Codex sandbox logs" | informational | resolved | Re-ran `npm run build` on the branch: passes, same skip message (expected when no logs exist). |
| 2 | Server did not serve dist without NODE_ENV=production | environment | resolved | `server/index.js:112` gates static serving on `NODE_ENV === 'production'`; documented behavior, not a defect. |
| 3 | Boot "check_for_column_name_collision" | informational | resolved | `/var/tmp/sbpg/agents/fix-17100-6/server.log`: 665 entries, all `severity: 'NOTICE'` code 42701 ("column ... already exists, skipping") from idempotent `ADD COLUMN IF NOT EXISTS` (e.g. `journey_data_rods`, `server/db.js` ~95-110). No ERROR or FATAL lines. Harmless; not caused by this change. |
| 4 | Cleanup left scratch files | process | resolved | Scratch only in the agent's own directory; process killed and DB dropped per report. |
| 5 | B11 not fixed (accepted limitations) | requirement_gap | unresolved | Spec "Known limitations" lists real gaps; nothing changed. See below. |

## B11 and spec "Known limitations" gaps

- Production defects still open: bugs `platform-mcp-PR1-1`, `qr-gated-outputs-PR1-2`, `qr-gated-outputs-PR1-3` stay open until a production round passes S3.4-S3.6, S4.1, R1.1, R1.2, S6.1. Round 3 still failed all (Netlify has not published the frontend). Owner action (Netlify deploy); cannot be verified from the sandbox.
- Stale limitation text (missed by the fix agent): the spec's "Known limitations" still says "The workflow waits for the Render deploy only, not Netlify". Round 2 added a Netlify wait step (`.github/workflows/production-smoke.yml` lines 72-98), so this is now wrong. The step runs only on push to main and was never run against Netlify.
- Documentation gap: the spec's "Secrets the owner must add" table omits the new `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`. Without them the step only warns and sleeps a fixed 3 minutes.
- Signed-in checks are read-only (R2.2 proves read paths, not rendered member data): requirement_gap, deferred.
- R2.3 agent-runner smoke steps are not replayed on production: by design (needs admin, writes, fixture worker never on Render); the owner question from round 1 is still open.
- Provisioning admin must not use two-step sign-in; provision script returns 404 on an undeployed site; S3.3 is not_run when no public page links a member site.
- R2.1/R2.2 depend on the owner adding `SMOKE_*` secrets and running Provision smoke test account (round 3: not_run).

## Verification of round-2 fix items (branch contents)

- T2-1 sign out: `data-testid="world-sign-out"` at `src/components/WorldShell.jsx:916`; `.sb-admin-topbar-scroll` / `.sb-admin-logout` in `src/brand.css:627-629` and `AdminShell.jsx`. Present.
- T2-3 refusal order: `server/lib/smokeAccount.js:87-91` decides slug-taken (409) before any write. Present.
- B9 Netlify wait: present (see above), unexecuted.
