// CI/CD production promotion backlog logging.
//
// Session: Codex (OpenAI), 2026-07-09.
//
// Built:
//   - .github/workflows/scheduled-production-promotion.yml
//   - .agents/cicd-production-promotion-agent.md
//   - Sunday schedule: 14:00 UTC, one production-ready PR per run
//   - Manual dry-run dispatch support
//   - Non-LLM CI/CD policy: no Claude/OpenAI/LLM calls inside automation
//   - Production push of the automation commit, followed by the in-progress
//     Claude-built product bundle commit.
//
// Attribution:
//   This was Codex/OpenAI-assisted release engineering, not Claude Code work.
//   The backlog schema has no generic "other AI agent hours" column, so
//   hoursClaude/costUsdClaude stay null and the Codex contribution is disclosed
//   in requirementDetail + tags. This follows the precedent in
//   scripts/add-plm-eidos-operating-model-item.mjs.
//
// Evidence:
//   ~/.codex/.sandbox/sandbox.2026-07-09.log includes a Salt Basin Codex burst
//   from 2026-07-09T16:23:48Z to 2026-07-09T16:28:53Z (about 0.09 tool-active
//   hours) for the CI/CD/deploy commands. That is a conservative tool-activity
//   measurement, not a full conversational/reasoning duration.
//
// Idempotent via POST /api/backlog/items upsert-by-externalRef.
//
// Usage:
//   node scripts/add-cicd-promotion-backlog-item.mjs
//
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD, optional PUBLIC_BASE_URL.

import 'dotenv/config';

const BASE = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS = process.env.ADMIN_INITIAL_PASSWORD;

if (!EMAIL || !PASS) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function upsertItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`upsert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const ITEM = {
  capabilityId: 9,
  kind: 'feature',
  priority: 'p1',
  status: 'deployed',
  externalRef: 'codex-2026-07-09.cicd-production-promotion-agent',
  title: 'CI/CD production promotion agent - Sunday scheduled production release lane',
  summary: 'Added a deterministic GitHub Actions promotion lane that runs every Sunday, verifies the next production-ready PR with npm ci and npm run build, then squash-merges to main so the existing Render/Netlify production path deploys without any Claude or other LLM calls inside CI/CD.',
  userStory: 'As Betsy, I want a repeatable Sunday production-promotion process that can pick up completed sessions packaged as PRs, verify them, and release them through the existing production deployment chain without spending Claude tokens in the automated process.',
  requirementDetail:
    'Built in Codex (OpenAI), not Claude Code. Added .github/workflows/scheduled-production-promotion.yml and .agents/cicd-production-promotion-agent.md. The workflow selects open non-draft PRs targeting main with the production-ready label, skips do-not-merge, runs npm ci and npm run build against the PR merge ref, and squash-merges at most one PR per Sunday run. Manual workflow_dispatch defaults to dry_run=true. Scheduled runs require PROMOTION_AGENT_ENABLED=true. The release lane relies on existing main-branch Render/Netlify auto-deploy behavior plus the existing Render deploy verification/monitor workflows. It explicitly does not call Anthropic, Claude, OpenAI, or any LLM API during CI/CD. Relevant prior backlog items reviewed: #30 Render/Netlify hosting split, #31 Render deploy monitor, #32 Netlify build.ignore approval gate, and #37 future Deployments view. This item extends those controls with a scheduled promotion agent rather than duplicating them. Codex contribution evidence: sandbox.2026-07-09.log shows Salt Basin tool-active CI/CD/deploy burst 2026-07-09T16:23:48Z -> 2026-07-09T16:28:53Z (~0.09 hours). Because the schema has no generic other-AI-tool hours field, hoursClaude/costUsdClaude are intentionally null; Codex work is disclosed here and via tags.',
  acceptanceCriteria:
    'Given a PR targets main, is not draft, and has production-ready, when the Sunday scheduled workflow runs and PROMOTION_AGENT_ENABLED=true, then the workflow verifies npm ci and npm run build and merges it to main. Given a PR has do-not-merge, it is skipped. Given workflow_dispatch is used with dry_run=true, the workflow verifies but does not merge. Given the workflow runs, no Claude/LLM API key is read or invoked by the CI/CD automation.',
  businessRules:
    'CI/CD automation is deterministic only. Strategic readiness remains a human/session-labeling decision represented by the production-ready label. Do not use Claude or other LLM tokens in the scheduled promotion path.',
  designSpec:
    'GitHub Actions scheduled workflow; Sunday 14:00 UTC; one PR per run; labels production-ready and do-not-merge; built-in GITHUB_TOKEN only; existing Render/Netlify main-branch deployment hooks remain the deploy mechanism.',
  deployRelevance: { github: true, render: false, netlify: false },
  deployedGithub: true,
  deployedRender: false,
  deployedNetlify: false,
  hoursClaude: null,
  hoursBetsy: null,
  costUsdClaude: null,
  dataSource: 'non_claude_tool_sandbox_burst_analysis',
  tags: ['deployment-infrastructure', 'ci-cd', 'github-actions', 'production-promotion', 'codex-built', 'non-claude-ai-tool', 'no-llm-ci'],
};

async function main() {
  console.log(`Connecting to ${BASE}...`);
  const cookie = await login();
  const result = await upsertItem(cookie, ITEM);
  const verb = result.upserted === 'updated' ? 'UPDATED' : 'CREATED';
  console.log(`${verb} [${result.id}]: ${ITEM.title}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
