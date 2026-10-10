# Triage: production smoke and regression, round 1

Date 2026-10-10 · round `docs/test-results/production-smoke-regression/round-1.md` · run https://github.com/marthasaltersb/saltbasin-website/actions/runs/38083986076

## Common cause

saltbasin.net is a Netlify site (`netlify.toml`) that proxies only `/api/*` to the Render service. Everything Express does outside `/api/*` (the `/mcp` endpoint, the `/r/` and `/release-tracker/` privacy headers, server-side SEO tags) does not happen on production. In addition, the frontend bundle Netlify serves is older than the backend: it has no `/r/:token` route.

## Findings

| Bug | Class | Feature / baseline step | Members affected | Proposed fix (not applied; owner first) |
| --- | --- | --- | --- | --- |
| platform-mcp-PR1-1 `/mcp` 404 | product_defect | platform-mcp v4 E.3 | Every member or agent using a personal access token: Connected Agents cannot reach the MCP server at all | Add to `netlify.toml`, before the SPA fallback: `[[redirects]] from = "/mcp" to = "https://saltbasin-website.onrender.com/mcp" status = 200 force = true`. Re-run S4.1 |
| qr-gated-outputs-PR1-2 `/r/<token>` shows Not Found | product_defect | qr-gated-outputs v2 J10.1, J10.2, J5.1 | Anyone opening a QR link from an approved application document sees "Not Found" instead of the document | Check the Netlify deploy log for current `main` (missing, skipped by the `ignore` rule, or failed) and redeploy the frontend. Re-run S3.4, S3.6, R1.1, R1.2 |
| qr-gated-outputs-PR1-3 no privacy headers on `/r/` | product_defect | qr-gated-outputs v2 J5.3, J5.4 | Shared documents can be indexed and leak the referrer | Add `[[headers]] for = "/r/*"` and `for = "/release-tracker/*"` with `X-Robots-Tag = "noindex, nofollow, noarchive"` and `Referrer-Policy = "no-referrer"` to `netlify.toml`. Re-run S3.5 |

Why not fixed in this session: the handover says a production bug that blocks members goes to the owner first, before any fix, and the fix changes production hosting configuration. All three proposed changes are confined to `netlify.toml`.

## For the owner (exact questions)

1. May we change `netlify.toml` as above (proxy `/mcp`, add the `/r/*` and `/release-tracker/*` headers) and redeploy the Netlify frontend from current `main`?
2. May we create one dedicated, fictional production test account (for example `smoke-member@test.saltbasin.invalid`, "Smoke Test Member", no real data, excluded from email), with its credentials stored only as a GitHub Actions secret, so the signed-in regression steps (R2.1, R2.2) can run? And should the agent-runner smoke steps run on production at all, given that they need the fixture worker, which is never enabled on Render?
