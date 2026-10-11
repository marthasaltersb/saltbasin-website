# Test result: production smoke and regression, round 3

```json
{"feature":"production-smoke-regression","baseline":null,"target":"https://saltbasin.net","round":3,"total":28,"passed":18,"failed":["S3.4","S3.5","S3.6","S4.1","S6.1","R1.1","R1.2"],"blocked":[],"notRun":["S3.3","R2.1","R2.2"],"preconditionsFailed":[],"observations":["O1","O2"]}
```

- Feature `production-smoke-regression`, spec `docs/training/production-smoke-regression.md` (suite commit 3651a7b; not yet frozen as a baseline). Score block copied from the run; only `round` and `observations` were filled in here.
- Target: production `https://saltbasin.net`. `main` is at bd6a576, the owner-approved netlify.toml fix (proxy `/mcp` and `/mcp/*`; privacy headers on `/r/*` and `/release-tracker/*`).
- Run: GitHub Actions **Production smoke and regression**, run [38085808989](https://github.com/marthasaltersb/saltbasin-website/actions/runs/38085808989), attempt 3, suite started 2026-10-11T01:30:28Z. That is about 4 h 36 min after bd6a576 was pushed (2026-10-10T20:54Z). Re-run at the owner's request.
- Evidence: artifact `production-smoke-38085808989` (attempt 3, artifact id 11688217093): `report.json` and `screens/*.png`.

## Step results

Identical to round 2:

| Step | Result | Actual |
| --- | --- | --- |
| S1.1, S2.1-S2.4, S3.1, S3.2, S5.1-S5.8 | pass | as in rounds 1 and 2 |
| S3.3 | not_run | no public page links to a `/u/<slug>` member site |
| S3.4, S3.6, R1.1, R1.2 | **fail** | `/r/<token>` still shows the site's "Not Found / That page doesn't exist (yet)." page; API answers 404 correctly |
| S3.5 | **fail** | page: no `X-Robots-Tag`, no `Referrer-Policy`, no meta robots |
| S4.1 | **fail** | `POST /mcp` with no token: HTTP 404 text/html "Page not found" (Netlify) |
| S6.1 | **fail** | saltbasin.net still serves `/assets/index-DP8cXOwv.js`; Render serves `/assets/index-BhoksWcj.js` |
| S6.2 | pass | Render `/mcp` without a token: 401 JSON |
| S6.3 | pass | Render `/r/<token>`: `X-Robots-Tag: noindex, nofollow, noarchive`, `Referrer-Policy: no-referrer` |
| R1.3 | pass | `/api/release-loop/runs` with no cookie: 401 |
| R2.1, R2.2 | not_run | the approved fictional production test account does not exist yet |

## Bugs

platform-mcp-PR1-1, qr-gated-outputs-PR1-2 and qr-gated-outputs-PR1-3 stay **open**: their prodSteps (S4.1; S3.4, S3.6, R1.1, R1.2; S3.5) still fail. No new bugs.

## Observations

- O1. Netlify has still not published bd6a576, nor any frontend newer than the `/r/:token` route. The public bundle hash is unchanged since round 1. The repository side is complete, and its targets work on Render (S6.2, S6.3). The fix reaches members only when the owner gets a Netlify deploy of `main` published (Netlify dashboard, site saltbasin.net, Deploys: failed build, locked auto-publishing, wrong production branch or no build credits), or points saltbasin.net straight at Render.
- O2. R2.1 and R2.2 stay not run until the approved fictional production test account is provisioned (session S-0.3.0-02-build).
