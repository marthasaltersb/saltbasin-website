// The 'code_review' Agent Hub kind: scans recently-changed files for
// (a) hardcoded/non-configurable assumptions — reusing the existing
//     salt-basin-config-audit skill's checklist as the rubric, not
//     reimplementing it, and
// (b) Jest test-coverage gaps,
// then proposes test files. Writing those files to the live working tree is
// never done — Betsy's own uncommitted work already lives there (see
// concurrent-worktree memory). When `definition.auto_branch` is true, an
// isolated `git worktree` is used to create the branch, write files, commit,
// and push — main and the caller's working directory are never touched.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Anthropic from '@anthropic-ai/sdk';
import { assertAgentLlmBudget, recordAgentLlmUsage } from '../agentLlmUsage.js';
import { db } from '../../db.js';
import { detectTestGaps, detectHardcodedCandidates, pickTestCandidates } from './staticHeuristics.js';

const REPO_ROOT = process.cwd();
const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_SCAN_FILES = 20;
const MAX_FILE_CHARS = 6000;
const SCAN_EXTENSIONS = new Set(['.js', '.jsx']);
const SCAN_ROOTS = ['server/', 'src/'];
const EXCLUDE_PATTERNS = [/\.test\.js$/, /^dist\//, /^node_modules\//, /^coverage\//, /^\.claude\//];

function git(args, cwd = REPO_ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function safeGit(args, cwd = REPO_ROOT) {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

async function getPreviousFingerprint(definitionId, currentRunId) {
  const row = await db.prepare(`
    SELECT codebase_fingerprint FROM agent_hub_runs
    WHERE definition_id=$1 AND status='completed' AND id != $2 AND codebase_fingerprint IS NOT NULL
    ORDER BY id DESC LIMIT 1
  `).get(definitionId, currentRunId);
  return row?.codebase_fingerprint || null;
}

function isInScope(relPath) {
  if (!SCAN_ROOTS.some((root) => relPath.startsWith(root))) return false;
  if (!SCAN_EXTENSIONS.has(path.extname(relPath))) return false;
  if (EXCLUDE_PATTERNS.some((re) => re.test(relPath))) return false;
  return true;
}

function determineScope(previousSha, headSha) {
  let changed = [];
  let scopeDescription;
  if (previousSha && safeGit(['cat-file', '-e', previousSha])) {
    changed = (safeGit(['diff', '--name-only', previousSha, headSha]) || '')
      .split('\n').filter(Boolean);
    scopeDescription = `Files changed since the previous run (${previousSha.slice(0, 7)}..${headSha.slice(0, 7)})`;
  } else {
    const commitCount = Number(safeGit(['rev-list', '--count', 'HEAD']) || '0');
    const range = commitCount > 15 ? 'HEAD~15..HEAD' : 'HEAD';
    changed = commitCount > 1
      ? (safeGit(['diff', '--name-only', ...(commitCount > 15 ? ['HEAD~15', 'HEAD'] : ['HEAD~1', 'HEAD'])]) || '').split('\n').filter(Boolean)
      : (safeGit(['ls-tree', '-r', '--name-only', 'HEAD']) || '').split('\n').filter(Boolean);
    scopeDescription = `No prior run recorded — scanned ${commitCount > 15 ? 'the last 15 commits' : 'the full tree'} (${range})`;
  }
  const inScope = changed.filter(isInScope).slice(0, MAX_SCAN_FILES);
  return { files: inScope, scopeDescription, totalChanged: changed.length };
}

function readFileExcerpts(files) {
  const excerpts = [];
  for (const relPath of files) {
    const abs = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(abs)) continue; // deleted since the diff was taken
    let content = fs.readFileSync(abs, 'utf8');
    if (content.length > MAX_FILE_CHARS) content = content.slice(0, MAX_FILE_CHARS) + '\n... (truncated)';
    excerpts.push({ path: relPath, content, hasTest: fs.existsSync(abs.replace(/\.jsx?$/, '.test.js')) });
  }
  return excerpts;
}

function loadConfigAuditRubric() {
  const skillPath = path.join(REPO_ROOT, '.claude', 'skills', 'salt-basin-config-audit', 'SKILL.md');
  try {
    return fs.readFileSync(skillPath, 'utf8');
  } catch {
    return null;
  }
}

// A tool call with tool_choice forced to it is used instead of asking for
// "JSON only" in prose — free-text JSON containing large multi-line Jest test
// file bodies is exactly the case where a model tends to emit literal
// unescaped newlines inside a JSON string (invalid JSON), which a first
// version of this agent hit in testing. The Messages API validates tool-call
// input against the schema server-side, so this failure mode isn't possible.
const SUBMIT_FINDINGS_TOOL = {
  name: 'submit_findings',
  description: 'Report the hardcoded/non-configurable findings and any proposed Jest test files for this code-review pass.',
  input_schema: {
    type: 'object',
    properties: {
      hardcodedFindings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filePath: { type: 'string' },
            line: { type: ['number', 'null'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            title: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['filePath', 'severity', 'title', 'detail'],
        },
      },
      proposedTests: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filePath: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['filePath', 'content'],
        },
      },
    },
    required: ['hardcodedFindings', 'proposedTests'],
  },
};

// Only ever called when the static heuristics pass (staticHeuristics.js)
// already found something worth escalating — a candidate hardcoded value or
// a test-gap file worth writing a test for — and only on that subset of
// files, not the full scanned set. A quiet run (nothing suspicious found
// statically) never reaches this function at all. See run() below.
async function callClaude(excerptsToEscalate, candidates, rubric, definition) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { offline: true, hardcodedFindings: [], proposedTests: [] };

  const anthropic = new Anthropic({ apiKey });
  const fileBlocks = excerptsToEscalate.map((f) =>
    `--- ${f.path}${f.hasTest ? ' (has a sibling *.test.js)' : ' (NO sibling *.test.js)'} ---\n${f.content}`
  ).join('\n\n');
  const candidateSummary = candidates.length
    ? `A static heuristic pass already flagged these unclassified candidates in the files below — confirm, refine, ` +
      `reclassify, or dismiss each one, and add anything else you notice:\n` +
      candidates.map((c) => `- ${c.filePath}${c.line ? ':' + c.line : ''} [${c.pattern}] ${c.snippet}`).join('\n')
    : 'No static candidates were flagged — these files were escalated only because they look like good test-writing candidates.';

  const system = `You are the Salt Basin code-review agent. Apply the configuration-audit checklist below to the` +
    ` supplied file excerpts, then call submit_findings with your results.\n\n${rubric || ''}\n\n${candidateSummary}\n\n` +
    `"hardcodedFindings" should only include items classified SHOULD BECOME CONFIGURATION under the skill's rules — skip` +
    ` INTENTIONAL PLATFORM CONSTANT and FOUNDATION-LOCKED BRAND RULE items (including any static candidate above that turns` +
    ` out to be one of those on inspection — just omit it, no need to explain the dismissal). "proposedTests" should contain` +
    ` at most 2 real, runnable Jest test files (ESM, "import { describe, test, expect } from '@jest/globals'") for files` +
    ` marked "NO sibling *.test.js" that export pure/testable functions — "filePath" is the new test file's path relative` +
    ` to the repo root (e.g. "server/lib/example.test.js"). If nothing qualifies, submit empty arrays.`;

  const policy = definition.config?.llm || { provider: 'anthropic', model: DEFAULT_MODEL, maxOutputTokensPerResponse: 8192, tokenCap: 1000000, capPeriod: 'month' };
  await assertAgentLlmBudget(Number(definition.id), policy);
  const response = await anthropic.messages.create({
    model: policy.model || DEFAULT_MODEL,
    max_tokens: Number(policy.maxOutputTokensPerResponse || 8192),
    system,
    tools: [SUBMIT_FINDINGS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_findings' },
    messages: [{ role: 'user', content: fileBlocks || 'No files in scope this run.' }],
  });
  await recordAgentLlmUsage(Number(definition.id), policy, response.usage || {});

  const toolCall = (response.content || []).find((c) => c.type === 'tool_use' && c.name === 'submit_findings');
  if (!toolCall) {
    return { offline: false, hardcodedFindings: [], proposedTests: [], parseError: 'Agent did not call submit_findings — no structured output returned.' };
  }
  return {
    offline: false,
    hardcodedFindings: toolCall.input?.hardcodedFindings || [],
    proposedTests: toolCall.input?.proposedTests || [],
  };
}

function runCoverage() {
  try {
    execFileSync('node', ['--experimental-vm-modules', './node_modules/jest/bin/jest.js', '--coverage', '--coverageReporters=json-summary', '--silent'], {
      cwd: REPO_ROOT, stdio: 'pipe',
    });
  } catch {
    // Jest exits non-zero on any failing test — coverage-summary.json is
    // still written, so this is not treated as a hard failure here.
  }
  try {
    const summaryPath = path.join(REPO_ROOT, 'coverage', 'coverage-summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    return summary.total?.lines?.pct ?? null;
  } catch {
    return null;
  }
}

function writeIsolatedBranch({ runId, proposedTests, reportMarkdown }) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const branchName = `agent/code-review-${dateStr}-${runId}`;
  const worktreeDir = path.join(os.tmpdir(), 'agent-hub-worktrees', `run-${runId}`);
  const notes = [];
  let pushed = false;
  let prUrl = null;

  try {
    fs.mkdirSync(path.dirname(worktreeDir), { recursive: true });
    git(['worktree', 'add', '-b', branchName, worktreeDir, 'HEAD']);

    for (const test of proposedTests) {
      const dest = path.join(worktreeDir, test.filePath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, test.content, 'utf8');
    }
    const reportRelPath = `reports/agent-hub/run-${runId}.md`;
    const reportDest = path.join(worktreeDir, reportRelPath);
    fs.mkdirSync(path.dirname(reportDest), { recursive: true });
    fs.writeFileSync(reportDest, reportMarkdown, 'utf8');

    git(['add', '-A'], worktreeDir);
    git(['commit', '-m', `Agent Hub: code-review run ${runId}\n\nAdds ${proposedTests.length} proposed test file(s) and the run report.`], worktreeDir);

    try {
      git(['push', '-u', 'origin', branchName], worktreeDir);
      pushed = true;
    } catch (err) {
      notes.push(`Could not push to origin (${err.message.split('\n')[0]}) — branch committed locally only.`);
    }

    if (pushed) {
      try {
        execFileSync('gh', ['--version'], { stdio: 'ignore' });
        const out = execFileSync('gh', [
          'pr', 'create', '--title', `Agent Hub: code-review run ${runId}`,
          '--body-file', reportDest, '--head', branchName,
        ], { cwd: worktreeDir, encoding: 'utf8' });
        prUrl = out.trim().split('\n').pop();
      } catch (err) {
        notes.push(`Branch pushed but PR was not auto-opened (gh CLI unavailable or failed: ${err.message.split('\n')[0]}) — open one manually.`);
      }
    }

    return { branchName, prUrl, reportPath: reportRelPath, notes };
  } finally {
    try { git(['worktree', 'remove', worktreeDir, '--force']); } catch { /* best effort */ }
  }
}

function buildReportMarkdown({
  definition, scope, hardcodedFindings, unclassifiedCandidates, testGapFindings, proposedTests,
  coveragePct, offline, uncommittedCount, apiCalled, aiEnabled,
}) {
  const apiNote = !aiEnabled
    ? '**API:** disabled for this agent (`aiEnabled: false`) — static heuristics only, never calls Claude.'
    : offline
      ? '**API:** ANTHROPIC_API_KEY is not configured — static heuristics only this run.'
      : apiCalled
        ? '**API:** called — static heuristics found candidates worth a second look.'
        : '**API:** not called — the static pass found nothing worth escalating this run.';

  const lines = [
    `# Agent Hub — ${definition.label}`,
    '',
    `**Scope:** ${scope.scopeDescription} — ${scope.files.length} of ${scope.totalChanged} changed file(s) analyzed.`,
    coveragePct != null ? `**Server test coverage (lines):** ${coveragePct.toFixed(1)}%` : '**Server test coverage:** unavailable',
    uncommittedCount ? `**Note:** ${uncommittedCount} uncommitted working-tree file(s) were not included in this scan.` : '',
    apiNote,
    '',
    `## Hardcoded / non-configurable findings — classified (${hardcodedFindings.length})`,
    ...(hardcodedFindings.length
      ? hardcodedFindings.map((f) => `- **[${f.severity}]** \`${f.filePath}${f.line ? ':' + f.line : ''}\` — ${f.title}: ${f.detail}`)
      : ['- None found in this pass.']),
    '',
    `## Hardcoded / non-configurable candidates — static heuristic, unclassified (${unclassifiedCandidates.length})`,
    ...(unclassifiedCandidates.length
      ? unclassifiedCandidates.map((c) => `- \`${c.filePath}${c.line ? ':' + c.line : ''}\` [${c.pattern}] — ${c.snippet}`)
      : ['- None found in this pass.']),
    '',
    `## Test coverage gaps (${testGapFindings.length})`,
    ...(testGapFindings.length
      ? testGapFindings.map((f) => `- \`${f.filePath}\` — ${f.title}`)
      : ['- None found in this pass.']),
    '',
    `## Proposed test files (${proposedTests.length})`,
    ...(proposedTests.length
      ? proposedTests.map((t) => `- \`${t.filePath}\``)
      : ['- None proposed this run.']),
  ];
  return lines.filter((l) => l !== '').join('\n');
}

export async function run(definition, { runId }) {
  const headSha = git(['rev-parse', 'HEAD']);
  const previousSha = await getPreviousFingerprint(definition.id, runId);
  const scope = determineScope(previousSha, headSha);
  const uncommittedCount = (safeGit(['status', '--porcelain']) || '').split('\n').filter(Boolean).length;

  const excerpts = readFileExcerpts(scope.files);

  // Static pass — always runs, zero API calls, zero cost.
  const testGapFindings = detectTestGaps(excerpts);
  const hardcodedCandidates = detectHardcodedCandidates(excerpts);
  const testCandidates = pickTestCandidates(excerpts, { max: 2 });

  // Escalate to Claude only for the specific files worth a second look —
  // never the full scanned set — and only when there's something to escalate
  // (or aiEnabled is explicitly off, in which case the API is never called
  // at all, even on a run with candidates).
  const aiEnabled = definition.config?.aiEnabled !== false;
  const candidatePaths = new Set([...hardcodedCandidates.map((c) => c.filePath), ...testCandidates.map((f) => f.path)]);
  const excerptsToEscalate = excerpts.filter((f) => candidatePaths.has(f.path));
  const apiCalled = aiEnabled && excerptsToEscalate.length > 0;

  const rubric = loadConfigAuditRubric();
  const { offline, hardcodedFindings: aiFindings, proposedTests, parseError } = apiCalled
    ? await callClaude(excerptsToEscalate, hardcodedCandidates, rubric, definition)
    : { offline: false, hardcodedFindings: [], proposedTests: [] };

  // AI-classified findings for files it actually reviewed take precedence;
  // any static candidate in a file the API never saw (skipped run, disabled,
  // or no key) still surfaces, clearly labeled as unclassified so nobody
  // mistakes a regex hit for a config-audit-skill judgment.
  const reviewedPaths = new Set(excerptsToEscalate.map((f) => f.path));
  const unclassifiedCandidates = apiCalled
    ? hardcodedCandidates.filter((c) => !reviewedPaths.has(c.filePath))
    : hardcodedCandidates;

  const coveragePct = runCoverage();

  const findings = [
    ...aiFindings.map((f) => ({
      category: 'hardcoded_config', severity: f.severity || 'medium',
      filePath: f.filePath, line: f.line || null, title: f.title, detail: f.detail,
    })),
    ...unclassifiedCandidates.map((c) => ({
      category: 'hardcoded_config', severity: 'low', filePath: c.filePath, line: c.line,
      title: `Possible hardcoded value (static heuristic, unclassified): ${c.pattern}`, detail: c.snippet,
    })),
    ...testGapFindings.slice(0, 15).map((f) => ({
      category: 'test_gap', severity: 'low', filePath: f.filePath, title: f.title,
    })),
    ...(parseError ? [{ category: 'other', severity: 'low', title: 'Agent response parse issue', detail: parseError }] : []),
  ];

  const reportMarkdown = buildReportMarkdown({
    definition, scope, hardcodedFindings: aiFindings, unclassifiedCandidates, testGapFindings, proposedTests,
    coveragePct, offline, uncommittedCount, apiCalled, aiEnabled,
  });

  let branchName = null;
  let prUrl = null;
  let reportPath = null;

  if (definition.auto_branch && proposedTests.length > 0) {
    const branchResult = writeIsolatedBranch({ runId, proposedTests, reportMarkdown });
    branchName = branchResult.branchName;
    prUrl = branchResult.prUrl;
    reportPath = branchResult.reportPath;
    if (branchResult.notes.length) findings.push({ category: 'other', severity: 'low', title: 'Branch/PR notes', detail: branchResult.notes.join(' ') });
  }

  const summary = `${scope.scopeDescription}. ${aiFindings.length + unclassifiedCandidates.length} hardcoded-value finding(s)` +
    `${apiCalled ? '' : ' (API not called this run)'}, ${testGapFindings.length} test-coverage gap(s), ` +
    `${proposedTests.length} test file(s) proposed` +
    (branchName ? `, branch \`${branchName}\` created${prUrl ? ` (PR: ${prUrl})` : ''}.` : '.') +
    `\n\n${reportMarkdown}`;

  return {
    findings,
    summary,
    stats: {
      filesScanned: scope.files.length,
      filesChanged: scope.totalChanged,
      testsAdded: proposedTests.length,
      findingsCount: findings.length,
      apiCalled,
      coveragePct,
    },
    branchName,
    prUrl,
    reportPath,
    fingerprint: headSha,
  };
}
