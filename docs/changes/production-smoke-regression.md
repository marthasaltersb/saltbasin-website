# Change spec — production smoke and regression

Version 1 · 2026-10-10 · feature key `production-smoke-regression` · release 0.3.0 (`2026-10-10-production-hardening`) · branch `claude/prod-smoke-regression-0.3.0`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `docs/release-log/HANDOVER-0.3.0.md` | 0.2.0 cut, `7d76341` | Defines this feature: test `https://saltbasin.net` after each merge to `main`; smoke read-only; regression only with a fictional test account; production failures filed as bugs |
| Release 0.2.0 merge to `main` | PR #9, `8f30987` | The code now on production that this suite checks |
| `docs/training/baselines/qr-gated-outputs/v2.json` | frozen, 0.2.0 | Steps J10.1 and J10.2 replayed as R1.1 and R1.2 |
| `docs/training/baselines/in-app-release-loop/v2.json` | frozen, 0.2.0 | Step E.6 replayed as R1.3 |
| `docs/training/baselines/release-intelligence/v3.json`, `release-loop-tooling/v3.json` | frozen, 0.2.0 | Mapped step by step; none is anonymous and read-only, so none runs yet (R2.2) |
| `docs/training/baselines/platform-agent-runner/smoke.json` | v1 | The only frozen smoke suite; mapped, not run (R2.1) |
| `.github/workflows/render-deploy-verify.yml` | existing | Same Render secrets and deploy lookup, reused to wait for a deploy before testing |

Supersedes nothing. No product code, table, route or screen changes.

## What changed, in one paragraph

Production can now be checked automatically after every merge to `main`. A new GitHub Actions workflow (`.github/workflows/production-smoke.yml`) waits for Render to report the merged commit live, then runs `scripts/production-smoke.mjs` in Chromium against `https://saltbasin.net`: health, every published public page, `/world`, `/login`, a member site, the QR not-available page and its noindex headers, the MCP endpoint's refusal without a token, and desktop and phone layout of the home and login pages, plus the anonymous steps of the delivered features' frozen baselines. It uploads a JSON report and screenshots. The suite is read-only by construction and reports anything it cannot reach or may not do as `not_run` or `blocked`, never as passed.

## Why GitHub Actions

The Claude cloud environment's network policy refuses `saltbasin.net` (CONNECT 403). The runner reaches it directly. To run the suite from a Claude session instead, `saltbasin.net` must be allowed in that environment's **Network access** settings.

## Files

- `scripts/production-smoke.mjs` (new): the suite. Options `--base`, `--out`, `--round`, and `--ignore-blocked-external` (local rehearsal behind a proxy that blocks CDNs only; never on the runner). Exit code 1 when a step fails.
- `.github/workflows/production-smoke.yml` (new): triggers on push to `main` (with the Render wait), `workflow_dispatch` (inputs `base_url`, `round`), and push to this feature's branch (so it runs before the file reaches `main`, where `workflow_dispatch` looks for it). Installs `playwright@1.56.1` without saving it (no `package.json` change).
- `docs/training/production-smoke-regression.md` (new): steps S1.1-S5.8, R1.1-R2.2 and the fixed constraints C.1-C.6.

## In the tracker and the fix loop

- Production rounds are ordinary `docs/test-results/production-smoke-regression/round-N.md` files. A score block with a `target` URL marks a production round. `scripts/production-rounds.mjs` reads them, and `scripts/release-tracker-sync.mjs` shows the feature on the 0.3.0 tracker with its rounds and last score (`validatedOn: production`).
- Bugs a production round finds are filed in `docs/test-results/production-smoke-regression/bugs.json` with their owning feature (id `<owner>-PR<round>-<n>`, baseline `stepId`, `prodSteps`, URL, expected, actual, evidence). The sync adds each one to its owner's bugs and to the bug ledger. `release-loop-resume.mjs --args` then hands them to that owner's fix agents with the rest of its open bugs, and the owner stays unfinished until they are verified.
- Verification: a local test round never verifies a production bug (`verifyBy: production`). The next production round verifies it when none of its `prodSteps` failed, was blocked or was not run. Otherwise it records one "still failing in production" note.
- `release-loop-resume.mjs --args` never launches this feature as a local run. Its next round is the production suite, after the owners' fixes are merged to `main` and deployed.

## Read-only guarantees

- No sign-in, no form submission, no cookies carried between visits.
- Non-GET requests from pages to the production origin are stubbed in the browser and listed (`suppressedWrites`).
- The one direct non-GET request (`POST /mcp` without a token) is refused at authentication. It does count once against the MCP failed-auth limiter for the runner's IP.

## Known limitations

- Production is Netlify (frontend, plus an `/api/*` proxy) in front of Render (server). The workflow waits for the Render deploy only. It cannot see whether Netlify has deployed the same commit, and round 1 found that it had not (bugs platform-mcp-PR1-1, qr-gated-outputs-PR1-2, qr-gated-outputs-PR1-3).

- Every step that needs a signed-in account is `not_run` (R2.1, R2.2): no fictional production test account exists, and the suite may not create one or use a real account. Open question for the owner below.
- The overlap check is a heuristic on text and control boxes; it skips fixed and sticky layers, canvases and SVGs (the 3D scenes), so it does not prove those are clear.
- Only the first `/u/<slug>` link found is opened; S3.3 is `not_run` when no public page links to a member site.
- The suite is not yet frozen as a baseline. After review: `node scripts/release-spec-baseline.mjs freeze` for this feature.

## Question for the owner

May we create one dedicated, fictional production test account (for example `smoke-member@test.saltbasin.invalid`, display name "Smoke Test Member", no real data, excluded from email) and store its credentials as a GitHub Actions secret, so the suite can run the signed-in regression steps (R2.1, R2.2)? And should the agent-runner smoke steps run on production at all, given that they need the fixture worker, which is never enabled on Render?
