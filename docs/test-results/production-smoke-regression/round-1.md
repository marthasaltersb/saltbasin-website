# Test result: production smoke and regression, round 1

```json
{"feature":"production-smoke-regression","baseline":null,"target":"https://saltbasin.net","round":1,"total":25,"passed":16,"failed":["S3.4","S3.5","S3.6","S4.1","R1.1","R1.2"],"blocked":[],"notRun":["S3.3","R2.1","R2.2"],"preconditionsFailed":[],"observations":["O1","O2","O3","O4"]}
```

- Feature `production-smoke-regression`, spec `docs/training/production-smoke-regression.md` v1 (not yet frozen as a baseline; `baseline: null`). Score block copied from the run; only `round` and `observations` were filled in here (the run had no round input).
- Target: production `https://saltbasin.net` after the 0.2.0 merge (`main` = `8f30987`). Suite commit `dcdc417` (branch `claude/prod-smoke-regression-0.3.0`).
- Run: GitHub Actions **Production smoke and regression**, run [38083986076](https://github.com/marthasaltersb/saltbasin-website/actions/runs/38083986076). Attempt 1 started 20:30:54Z; attempt 2 (the scored one) started about 20:36Z. Both gave the identical score. Render had started the deploy of `8f30987` at 20:22 (Verify Render Auto-Deploy, run 38083316569), and the Render Deploy Monitor (run 38084584531, 20:39Z) reported the latest deploy `live`.
- Why GitHub Actions: this Claude environment's network policy refuses `saltbasin.net` (`curl` CONNECT 403). To run from a session, allow `saltbasin.net` under the environment's **Network access** settings.
- Environment: GitHub-hosted ubuntu-latest, Node 20, Playwright 1.56.1 Chromium, light scheme, en-US, UTC. Desktop 1280x900; phone 390x844 (isMobile, touch). No sign-in, fresh context per visit; non-GET page requests stubbed in the browser (`suppressedWrites` in report.json).
- Rehearsal before the run: the same script against a local production build on a fresh seeded database scored 22 passed, 0 failed, 3 not run (S3.3, R2.1, R2.2). So the production failures below are production-only.
- Evidence: artifact `production-smoke-38083986076` (attempt 2, artifact id 11681985365): `report.json` and `screens/*.png` (page, route, `r-*` and `layout-*` screenshots, desktop and phone, full-page layout shots). Kept 30 days.

## Step results

| Step | Result | Actual |
| --- | --- | --- |
| S1.1 | pass | HTTP 200 `{"ok":true,"db":"ok"}` |
| S2.1 | pass | HTTP 200, 6 pages: `/`, `/platform`, `/methodology`, `/consulting`, `/resources`, `/creative` |
| S2.2 | pass | 6 pages rendered |
| S2.3 | pass | no page or console errors |
| S2.4 | pass | no 5xx |
| S3.1 | pass | `/world` HTTP 200, sign-in prompt |
| S3.2 | pass | `/login` HTTP 200, one email and one password field |
| S3.3 | not_run | no public page links to a `/u/<slug>` member site; no slug was guessed |
| S3.4 | **fail** | `/r/AAAAAAAAAAAAAAAAAAAAAAAA` shows the public site's "Not Found / That page doesn't exist (yet)." page, not "This link isn't available". API `/api/shared-outputs/<token>` answers 404 correctly |
| S3.5 | **fail** | page: no `X-Robots-Tag`, no `Referrer-Policy`, no `meta[name=robots]`. API response does carry `X-Robots-Tag: noindex, nofollow, noarchive` |
| S3.6 | **fail** | `/r/short`: same as S3.4 |
| S4.1 | **fail** | `POST /mcp` with no token: HTTP 404 `text/html` "Page not found" (Netlify), not 401 JSON |
| S5.1-S5.8 | pass | home and login, desktop and phone: scrollWidth = clientWidth; no overlaps (home 114 boxes, login 11) |
| R1.1 | **fail** | = qr-gated-outputs v2 J10.1; same as S3.4 |
| R1.2 | **fail** | = qr-gated-outputs v2 J10.2; same as S3.6 |
| R1.3 | pass | = in-app-release-loop v2 E.6; `/api/release-loop/runs` with no cookie: HTTP 401 `{"error":"unauthorized"}` |
| R2.1 | not_run | 8 frozen smoke steps (platform-agent-runner v1) need an admin sign-in, writes and the fixture worker |
| R2.2 | not_run | 155 baseline steps need a signed-in account; no fictional production test account exists |

## Bugs filed (docs/release-log/bug-ledger.json)

| Bug | Feature (reassigned) | Baseline step | URL | Expected | Actual | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| production-smoke-regression-P1 | platform-mcp | v4 E.3 (also J2.2) | `https://saltbasin.net/mcp` | 401 JSON error from the MCP server | 404 HTML from Netlify; never reaches Render | report.json S4.1 |
| production-smoke-regression-P2 | qr-gated-outputs | v2 J10.1, J10.2 (and J5.1) | `https://saltbasin.net/r/AAAAAAAAAAAAAAAAAAAAAAAA`, `/r/short` | "This link isn't available" | site "Not Found" page | screens/r-AAAAAAAAAAAA-desktop.png, screens/r-short-desktop.png |
| production-smoke-regression-P3 | qr-gated-outputs | v2 J5.3, J5.4 | `https://saltbasin.net/r/AAAAAAAAAAAAAAAAAAAAAAAA` | `X-Robots-Tag` noindex, `Referrer-Policy: no-referrer`, meta robots | none of the three on the page | report.json S3.5 |

Triage: `docs/triage/production-smoke-regression-round-1.md`.

## Observations (not scored)

- O1. saltbasin.net is served by **Netlify** (`netlify.toml`): the frontend bundle comes from Netlify, and only `/api/*` is proxied to Render. The Render backend is current: `/api/release-loop/*` (added 2026-10-09) answers, and `/api/shared-outputs` sets its headers. The frontend Netlify serves does not know `/r/:token`, so it is older than the backend. This split is the common cause of P1-P3.
- O2. For the same reason, the server-side SEO tag injection (`server/lib/seoMiddleware.js`, "prod-only") never runs on saltbasin.net. Link-unfurling bots get Netlify's plain `index.html`. No baseline step covers it.
- O3. No public page links to a member site `/u/<slug>`, so S3.3 could not pick a slug. Not a defect; a fixed fictional member slug (owner decision, see the test-account question) would let S3.3 always run.
- O4. Score total is 25, not the 24 in the session estimate: the spec gained an eighth layout step while being written (S5.1-S5.8 = 4 pages/surfaces x 2 checks).

## Cleanup

Nothing written to production (no sign-in; page writes stubbed). The local rehearsal database `sb_smoke_local` was dropped and its server stopped. No product code changed.
