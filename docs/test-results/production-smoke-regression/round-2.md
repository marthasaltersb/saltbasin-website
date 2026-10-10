# Test result: production smoke and regression, round 2

```json
{"feature":"production-smoke-regression","baseline":null,"target":"https://saltbasin.net","round":2,"total":28,"passed":18,"failed":["S3.4","S3.5","S3.6","S4.1","S6.1","R1.1","R1.2"],"blocked":[],"notRun":["S3.3","R2.1","R2.2"],"preconditionsFailed":[],"observations":["O1","O2"]}
```

- Feature `production-smoke-regression`, spec `docs/training/production-smoke-regression.md` (suite commit 3651a7b, which adds S6.1-S6.3; not yet frozen as a baseline).
- Target: production `https://saltbasin.net` after the owner-approved netlify.toml fix reached `main` as bd6a576
  (proxy `/mcp` and `/mcp/*` to Render; `X-Robots-Tag` and `Referrer-Policy` on `/r/*` and `/release-tracker/*`).
- Run: GitHub Actions **Production smoke and regression**, run 38085808989, attempt 2, started 21:13:15Z (about 19 minutes
  after bd6a576 was pushed). Attempt 1 (20:58:56Z) gave the same failures. The older suite was also re-run as
  run 38084775846 attempt 2 (20:59Z): 16/25, same failures as round 1.
- Recorded by session S-0.3.0-02-build from the production smoke session's report (that session left round 2 to this one).

## Step results that changed or are new

| Step | Result | Actual |
| --- | --- | --- |
| S6.1 (new) | **fail** | saltbasin.net serves `/assets/index-DP8cXOwv.js`; the Render server behind it serves `/assets/index-BhoksWcj.js`. Netlify has not deployed current `main`. |
| S6.2 (new) | pass | Render `/mcp` without a token answers 401 JSON (the proxy target is right). |
| S6.3 (new) | pass | Render `/r/<token>` sends `X-Robots-Tag: noindex, nofollow, noarchive` and `Referrer-Policy: no-referrer`. |
| S3.4, S3.5, S3.6, S4.1, R1.1, R1.2 | **fail** | unchanged from round 1. |

All other steps as in round 1.

## Bugs

platform-mcp-PR1-1, qr-gated-outputs-PR1-2 and qr-gated-outputs-PR1-3 stay **open**. Only a production round that passes S6.1, S4.1,
S3.4-S3.6, R1.1 and R1.2 verifies them.

## Observations

- O1. The repository side of the fix is complete and its targets work on Render (S6.2, S6.3). The remaining cause is outside the repo:
  Netlify has not built or published a frontend since before the `/r/:token` route existed, and did not build bd6a576 either. Likely
  causes: failing builds, locked auto-publishing, the wrong production branch, or no build credits. Only the owner can see this, in the
  Netlify dashboard (site saltbasin.net -> Deploys). Asked of the owner on 2026-10-10.
- O2. Signed-in steps R2.1 and R2.2 stay not run until the owner-approved fictional production test account exists (being built in this release).
