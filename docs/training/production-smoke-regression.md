# Training spec — production smoke and regression

Version 1 · 2026-10-10 · covers `docs/changes/production-smoke-regression.md` v1 · feature key `production-smoke-regression` · release 0.3.0. Audience: the automated suite `scripts/production-smoke.mjs` (run by `.github/workflows/production-smoke.yml`) and any person or agent re-checking its result by hand. Follow literally. Step ids are stable: never renumbered or reused; a retired step keeps its id.

## Where things are

- Target: `<BASE>` = `https://saltbasin.net`. It is a Netlify site (`netlify.toml`): Netlify serves the frontend bundle and proxies only `/api/*` to the Render service that runs the server. Anything the server does outside `/api/*` must also be configured in `netlify.toml` to exist on production. The suite also accepts any other base for a local rehearsal (`--base http://127.0.0.1:<port>`).
- The Claude cloud sandbox cannot reach `<BASE>` (proxy CONNECT 403), so the suite runs on a GitHub-hosted runner: on every push to `main` (after Render reports the commit live), on demand (Actions -> **Production smoke and regression** -> **Run workflow**), and on pushes to `claude/prod-smoke-regression-0.3.0`.
- Output: the run's artifact `production-smoke-<run id>` holds `report.json` (score block, every step with URL / expected / actual / evidence, the frozen-baseline mapping, the list of suppressed writes) and `screens/*.png`. The run summary repeats the score block and a step table.

## Test constraints (fixed)

1. [C.1] **Read-only.** The suite never signs in, never submits a form and never changes production data. Every non-GET request a page sends to `<BASE>` (page-view tracking, for example) is answered inside the browser with `{"ok":true,"stub":"production-smoke"}` and listed under `suppressedWrites`; it never reaches the server. The only request the suite sends itself that is not a GET is the unauthenticated `POST /mcp` in S4.1, which the server refuses before running anything.
2. [C.2] **No real accounts.** Steps that need a signed-in user run only with a dedicated, fictional production test account. None exists; those steps are `not_run`, never guessed.
3. [C.3] **No email, no Anthropic API.** Nothing in the suite can trigger either.
4. [C.4] Surfaces: desktop 1280x900; phone 390x844 (isMobile, touch, scale 2). Chromium, light scheme, en-US, UTC. Each page visit uses a fresh browser context (no cookies).
5. [C.5] What counts as an error: an uncaught page error, or a `console.error` other than the browser's own "Failed to load resource ... status of 4xx/5xx" line (responses are judged by status instead: any 5xx fails; 4xx are recorded as `resource4xx` because an anonymous visitor legitimately gets 401 from `/api/auth/me`). A cold Render container may take 30 seconds or more to wake: navigation waits up to 90 seconds.
6. [C.6] Status values: `pass`, `fail`, `blocked` (could not be judged because something before it failed, for example production unreachable or the prelaunch landing gate on), `not_run` (deliberately not run, with the reason).

## Smoke

1. [S1.1] `GET <BASE>/api/health`.
   - Expect HTTP 200 and JSON with `"ok": true` and `"db": "ok"`. If production cannot be reached at all, every later step is `blocked` with the network error.
2. [S2.1] `GET <BASE>/api/site/published`.
   - Expect HTTP 200 with at least one page in `pages` (a keyed object; read it with `Object.values`). The public pages are `/` plus `/<slug>` of every page whose `status` is not `draft`. If the prelaunch landing gate is on (`GET /api/auth/landing-gate/status` says `enabled: true`) the response is 403 and S2.1 is `blocked`.
3. [S2.2] Open every public page from S2.1 on desktop.
   - Expect each document to load with HTTP below 400, not to show the **Not Found** / "That page doesn't exist (yet)." page, and to show at least 40 characters of visible text. Screenshot `screens/page-<slug>-desktop.png`.
4. [S2.3] On those same visits, expect no page error and no console error (C.5).
5. [S2.4] On those same visits, expect no request answered with HTTP 5xx.
6. [S3.1] Open `<BASE>/world`.
   - Expect HTTP 200, visible text, no page or console error, no 5xx. (An anonymous visitor sees the sign-in prompt; that is the expected page.)
7. [S3.2] Open `<BASE>/login`.
   - Expect HTTP 200 and a form with one email field and one password field; no page or console error, no 5xx. Nothing is typed.
8. [S3.3] Take the first `/u/<slug>` link found on any public page in S2.2 and open it.
   - Expect HTTP 200, more than 40 characters of visible text, no "not found", no page or console error, no 5xx. If no public page links to a member site the step is `not_run` ("no slug was guessed").
9. [S3.4] Open `<BASE>/r/AAAAAAAAAAAAAAAAAAAAAAAA` (24 characters, never issued).
   - Expect the heading **This link isn't available**, no page or console error, no 5xx; `GET /api/shared-outputs/<that token>` answers 404.
10. [S3.5] On the same page expect the response header `X-Robots-Tag` to contain `noindex`, the element `meta[name=robots]` to read `noindex, nofollow, noarchive`, and the API response in S3.4 to carry `X-Robots-Tag` with `noindex`. (`Referrer-Policy` is recorded; it should read `no-referrer`.)
11. [S3.6] Open `<BASE>/r/short`. Expect the same page and the same API status as S3.4.
12. [S4.1] `POST <BASE>/mcp` with JSON-RPC `tools/list` and no `Authorization` header.
   - Expect HTTP 401, a JSON body with an `error` (the server sends `{"jsonrpc":"2.0","error":{"code":-32001,...},"id":null}`) and `WWW-Authenticate: Bearer ...`.
13. [S5.1] Home page `/` at desktop: `document.documentElement.scrollWidth` equals `clientWidth` (no horizontal scroll).
14. [S5.2] Home page `/` at desktop: no two visible text or control boxes overlap. Checked boxes: `a, button, input, select, textarea, label, h1-h4, p, li` that are visible, at least 4x4px, carry text (or are a control), and are not inside a fixed or sticky layer, an `aria-hidden` subtree, a canvas or an SVG. A pair overlaps when the shared area is more than 4px each way and more than 20% of the smaller box; ancestor/descendant pairs are skipped. Screenshots `screens/layout-home-desktop.png` and `...-full.png`.
15. [S5.3] Home page at phone 390x844: as S5.1.
16. [S5.4] Home page at phone 390x844: as S5.2.
17. [S5.5] `/login` at desktop: as S5.1.
18. [S5.6] `/login` at desktop: as S5.2.
19. [S5.7] `/login` at phone: as S5.1.
20. [S5.8] `/login` at phone: as S5.2.

## Regression

Anonymous, read-only steps of the delivered features' frozen baselines, replayed against production under their own ids:

21. [R1.1] = qr-gated-outputs baseline v2 `[J10.1]`: `<BASE>/r/AAAAAAAAAAAAAAAAAAAAAAAA` shows **This link isn't available**, with no hint whether the slug ever existed.
22. [R1.2] = qr-gated-outputs baseline v2 `[J10.2]`: `<BASE>/r/short` shows the same page (same API status as R1.1).
23. [R1.3] = in-app-release-loop baseline v2 `[E.6]`: `GET <BASE>/api/release-loop/runs` with no cookie answers 401.

Steps that need an account (C.2):

24. [R2.1] Replay every frozen smoke suite (`docs/training/baselines/*/smoke.json`; today only platform-agent-runner v1: J1.1, J1.7, J2.4, J4.4, J10.1, J10.9, J13.2, E.1). Every step needs an admin sign-in and writes, and that suite runs the agent runner's fixture worker, which is never enabled on Render. `not_run` until a fictional production test account exists and the owner decides how agent-runner steps may run in production.
25. [R2.2] Replay the signed-in, read-only steps of qr-gated-outputs v2, release-loop-tooling v3, release-intelligence v3 and in-app-release-loop v2. `not_run` until a fictional production test account exists. `report.json` -> `baselineMapping` lists every step of those four baselines with `ran` (and the R id it ran as) or `not_run` with one of these reasons: `needs_test_account`, `local_only` (release-loop-tooling's steps are repository tooling and fixtures, and a few command steps need the repository or the database directly; none is a production surface).

## Scoring

- The score block is `report.json` -> `score`: `total` counts S and R steps (25 at v1), `passed`, and the ids under `failed`, `blocked` and `notRun`. A `not_run` or `blocked` step is never counted as passed and never as 0 of anything.
- The workflow run is red when any step failed; `not_run` and `blocked` alone do not make it red.

## Filing a failure

Each failed step becomes a bug in the release ledger with: the URL, the step id, the expected result, the actual result (copied from `report.json`), the evidence path (`production-smoke-<run id>/screens/...`) and the run URL. A failure that belongs to another feature names that feature and its baseline step id (for R1.x, the id in brackets above). A failure that stops members from signing in or using their site goes to the owner at once in plain language.
