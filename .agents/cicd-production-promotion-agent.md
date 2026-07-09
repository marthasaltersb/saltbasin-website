# CI/CD Production Promotion Agent

## Purpose

Promote completed Salt Basin website work to production on a recurring schedule
without spending Claude or other LLM tokens inside the automated CI/CD process.

The agent is implemented as deterministic GitHub Actions plus existing hosting
auto-deploy hooks:

- GitHub is the source of truth for release candidates.
- Render deploys backend/API changes from `main`.
- Netlify deploys frontend changes from `main`, with `netlify.toml` skipping
  frontend builds when frontend-relevant files did not change.
- Existing Render monitor workflows verify missed or failed deploys.

## Non-LLM Policy

This production automation must not call:

- Anthropic or Claude APIs.
- OpenAI APIs.
- Any agent API that performs code reasoning, summarization, or release
  decisioning during CI/CD.

The workflow may install dependencies and run deterministic scripts such as
`npm ci`, `npm run build`, `gh`, `jq`, and provider REST calls for deployment
status. The app can continue to contain runtime Anthropic integration for
member/product features, but CI/CD does not invoke those features.

## Agent Stack

### 1. Session Producer Agent

Source: human, Codex, Claude Code, or any other local builder.

Responsibilities:

- Work on a branch, never directly on `main`.
- Keep changes reviewable and buildable.
- Open a pull request into `main`.
- Describe the session output and any risk in the PR body.

Suggested branch names:

- `codex/<short-purpose>`
- `feat/autonomous-batch-YYYY-MM-DD`
- `fix/<short-purpose>`
- `release/<short-purpose>`

### 2. Candidate Intake Agent

Source: GitHub pull request metadata.

Responsibilities:

- Treat open PRs targeting `main` as the only deployable unit.
- Ignore draft PRs.
- Ignore PRs labeled `do-not-merge`.
- Consider only PRs labeled `production-ready`.

This keeps "automatic pickup" explicit: a session becomes eligible when it is
packaged as a PR and marked with the release label.

### 3. Deterministic Gate Agent

Source: `.github/workflows/scheduled-production-promotion.yml`.

Responsibilities:

- Run every Sunday at 14:00 UTC and by manual dispatch.
- Select the oldest eligible `production-ready` PR.
- Check out GitHub's PR merge ref against `main`.
- Run `npm ci`.
- Run `npm run build`.
- Stop if either command fails.

No test runner exists in this repo yet, so the production gate is the build.
Add test commands here later if a test framework is introduced.

### 4. Production Promotion Agent

Source: same scheduled workflow.

Responsibilities:

- Squash-merge the verified PR into `main`.
- Let existing Render and Netlify auto-deploy from `main`.
- Comment on dry runs or failures.

Safety controls:

- Scheduled runs require repository variable
  `PROMOTION_AGENT_ENABLED=true`.
- Manual workflow dispatch defaults to `dry_run=true`.
- Add `do-not-merge` to block any PR.
- The current workflow promotes at most one PR each Sunday.

### 5. Deploy Verification Agent

Source: existing workflows.

Responsibilities:

- `.github/workflows/render-deploy-verify.yml` checks that Render noticed a
  new `main` commit.
- `.github/workflows/render-deploy-monitor.yml` polls Render and opens issues
  for failed deploys.
- Netlify deploy behavior is controlled by `netlify.toml`.

## Required GitHub Configuration

Repository variables:

- `PROMOTION_AGENT_ENABLED=true`

Repository labels:

- `production-ready`
- `do-not-merge`

The workflow creates these labels if they do not already exist.

Repository secrets already used by deploy monitoring:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

The promotion workflow itself only needs the built-in `GITHUB_TOKEN`.

## Operating Procedure

1. Complete a work session on a branch.
2. Open a pull request targeting `main`.
3. Confirm the PR is not draft.
4. Add `production-ready` when it should be released by automation.
5. Add `do-not-merge` at any time to block automated promotion.
6. The Sunday scheduled workflow verifies and merges the oldest eligible PR.
7. Render and Netlify deploy from the resulting `main` commit.
8. Existing deploy-monitor workflows create issues if Render misses or fails a
   deploy.

## What This Does Not Do

- It does not decide whether a feature is strategically ready.
- It does not inspect Claude sessions or spend Claude tokens.
- It does not bypass GitHub branch protection.
- It does not solve merge conflicts automatically.
- It does not deploy uncommitted local work.

## Future Extensions

- Add a PR-creation workflow for branches matching `codex/*` or
  `feat/autonomous-batch-*`.
- Add Playwright or API smoke tests after a test framework exists.
- Add a post-deploy health check against `https://saltbasin.net/api/health`.
- Add Netlify deploy-status polling if a Netlify API token is added.
