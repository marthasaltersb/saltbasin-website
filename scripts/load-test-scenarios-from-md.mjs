// Parses docs/TEST-SCENARIOS.md into structured scenarios and bulk-loads them
// into the QA system via POST /api/qa/scenarios.
//
// Format expected (matches what's already in docs/TEST-SCENARIOS.md):
//
//   # Group N — <Group Name>
//   ## Scenario N: <Title>
//   - **Requirement covered:** Backlog #N — *<Backlog Item Title>*
//   - **User logged in:** Admin / Member / Public visitor / Lead
//   - **Dependencies:** ...
//   ### Test Script
//   **Steps:**
//   1. Step 1 ...
//   2. Step 2 ...
//   **Expected outcomes:**
//   - Step 1: ...    OR    - <bare bullet>
//   - Step 2: ...
//   **How to verify:** ...
//   **Log Test Run:** ...
//
// Group name → capability slug map and the in-doc "Backlog #N — *Title*"
// fragment → backlog item exact-title match are both used to populate
// capabilityId + featureBacklogItemIds.
//
// Idempotent by title — re-runs skip scenarios whose title already exists.
//
// Usage: node scripts/load-test-scenarios-from-md.mjs

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const MD_PATH = path.join('docs', 'TEST-SCENARIOS.md');
const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

const GROUP_TO_SLUG = {
  'Platform Foundation':         'platform-foundation',
  'Multi-tenant CMS':            'multi-tenant-cms',
  'Lead Capture & Identity':     'lead-capture',
  'Email Infrastructure':        'email-infrastructure',
  'Salt Basin Net Works':        'net-works-network',
  'Public Site Content':         'public-site-content',
  'Output Pages':                'output-pages',
  'Admin Experience':            'admin-experience',
  'Deployment Infrastructure':   'deployment-infrastructure',
  'Security & Data':             'security-and-data',
  'Observability & Quality':     'observability',
  'Requirements & Test Management': 'requirements-mgmt',
};

// ── Markdown parser ──
function parseDoc(md) {
  const groupRe = /^# Group \d+ — (.+)$/gm;
  const groupSpans = [];
  let gm;
  while ((gm = groupRe.exec(md))) {
    groupSpans.push({ name: gm[1].trim(), start: gm.index });
  }
  for (let i = 0; i < groupSpans.length; i++) {
    groupSpans[i].end = i + 1 < groupSpans.length ? groupSpans[i + 1].start : md.length;
  }
  const groupAt = (idx) => groupSpans.find((g) => idx >= g.start && idx < g.end)?.name || '';

  const scenRe = /^## Scenario (\d+): (.+)$/gm;
  const positions = [];
  let sm;
  while ((sm = scenRe.exec(md))) {
    positions.push({ num: Number(sm[1]), title: sm[2].trim(), start: sm.index });
  }
  for (let i = 0; i < positions.length; i++) {
    positions[i].end = i + 1 < positions.length ? positions[i + 1].start : md.length;
  }
  return positions.map((p) => {
    const body = md.slice(p.start, p.end);
    return { ...p, group: groupAt(p.start), body };
  });
}

// Extract a labeled field, e.g. "- **Requirement covered:** ..."
function extractInline(body, label) {
  const re = new RegExp(`-\\s+\\*\\*${label}:\\*\\*\\s+(.+)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

// Extract a section block under a bold heading until the next bold heading
// or "---" divider.
function extractSection(body, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([\\s\\S]+?)(?=\\n\\*\\*|\\n---|$)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

function parseSteps(stepsBlock) {
  if (!stepsBlock) return [];
  // Numbered list: "1. ..." "2. ..." etc.
  return stepsBlock
    .split(/\n(?=\d+\.\s)/)
    .map((s) => s.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

function parseOutcomes(outcomesBlock) {
  if (!outcomesBlock) return { byStep: {}, raw: '' };
  const byStep = {};
  const generic = [];
  for (const line of outcomesBlock.split('\n')) {
    const stripped = line.replace(/^[-*]\s+/, '').trim();
    if (!stripped) continue;
    const m = stripped.match(/^Step\s+(\d+):\s+(.+)$/i);
    if (m) byStep[Number(m[1])] = m[2].trim();
    else generic.push(stripped);
  }
  return { byStep, generic, raw: outcomesBlock.trim() };
}

function parseRequirement(reqText) {
  // "Backlog #N — *Title*" — extract the title between asterisks
  if (!reqText) return null;
  const m = reqText.match(/Backlog\s+#(\d+)\s+—\s+\*([^*]+)\*/);
  if (!m) return null;
  return { backlogNum: Number(m[1]), title: m[2].trim() };
}

function parseScenario(s) {
  const requirementText = extractInline(s.body, 'Requirement covered');
  const requirement = parseRequirement(requirementText);
  const user = extractInline(s.body, 'User logged in');
  const deps = extractInline(s.body, 'Dependencies');
  const stepsBlock = extractSection(s.body, 'Steps');
  const outcomesBlock = extractSection(s.body, 'Expected outcomes');
  const howVerify = extractSection(s.body, 'How to verify');

  const stepsArr = parseSteps(stepsBlock);
  const outcomes = parseOutcomes(outcomesBlock);

  // Per-step outcomes — prefer keyed-by-step from outcomesBlock; fall back to
  // a generic "Verify against scenario expected outcomes" when none was listed
  // for that step number.
  const steps = stepsArr.map((action, i) => {
    const num = i + 1;
    const fromMap = outcomes.byStep[num];
    return {
      action,
      expectedOutcome: fromMap || 'Verify against the scenario\'s "Expected outcomes" + "How to verify" notes.',
    };
  });

  // Summary holds the full expected outcomes block and the "How to verify"
  // guidance so the tester sees the whole picture in the QA drawer.
  const summaryParts = [];
  if (outcomes.raw) summaryParts.push(`Expected outcomes:\n${outcomes.raw}`);
  if (howVerify) summaryParts.push(`How to verify:\n${howVerify}`);
  const summary = summaryParts.join('\n\n') || null;

  // Preconditions = user + dependencies.
  const preParts = [];
  if (user) preParts.push(`User logged in: ${user}`);
  if (deps) preParts.push(`Dependencies: ${deps}`);
  const preconditions = preParts.join('\n') || null;

  return {
    num: s.num,
    title: s.title,
    group: s.group,
    capabilitySlug: GROUP_TO_SLUG[s.group] || null,
    requirement,
    user,
    summary,
    preconditions,
    steps,
  };
}

// ── API ──
async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}
async function getBacklog(cookie) {
  const res = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getBacklog failed: ${res.status}`);
  return res.json();
}
async function getScenarios(cookie) {
  const res = await fetch(`${BASE}/api/qa/scenarios`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getScenarios failed: ${res.status}`);
  return res.json();
}
async function createScenario(cookie, payload) {
  const res = await fetch(`${BASE}/api/qa/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createScenario failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Title match is case-insensitive and ignores trailing punctuation. We also
// allow contains-match as a secondary signal when exact fails.
function matchBacklogItem(items, title) {
  if (!title) return null;
  const norm = (s) => s.toLowerCase().replace(/[.\s]+$/, '').trim();
  const target = norm(title);
  // 1. Exact match
  let hit = items.find((it) => it.kind === 'feature' && norm(it.title || '') === target);
  if (hit) return { item: hit, confidence: 'exact' };
  // 2. Startswith match (handles long titles that were truncated in the doc)
  hit = items.find((it) => it.kind === 'feature' && norm(it.title || '').startsWith(target));
  if (hit) return { item: hit, confidence: 'prefix' };
  // 3. Substring either direction
  hit = items.find(
    (it) => it.kind === 'feature' && (norm(it.title || '').includes(target) || target.includes(norm(it.title || '')))
  );
  if (hit) return { item: hit, confidence: 'partial' };
  return null;
}

// ── Main ──
(async () => {
  console.log(`→ ${BASE}`);
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const raw = parseDoc(md);
  const parsed = raw.map(parseScenario);
  console.log(`  · parsed ${parsed.length} scenarios from ${MD_PATH}`);

  const cookie = await login();
  console.log('✓ logged in');

  const backlog = await getBacklog(cookie);
  const existing = await getScenarios(cookie);
  const existingTitles = new Set((existing.scenarios || []).map((s) => s.title));
  console.log(`  · ${backlog.items.length} backlog items, ${existingTitles.size} existing scenarios`);

  let inserted = 0, skipped = 0, missingCapability = 0, missingFeature = 0;
  const report = [];

  for (const sc of parsed) {
    if (existingTitles.has(sc.title)) {
      console.log(`  · skip "${sc.title}" (already present)`);
      skipped += 1;
      continue;
    }
    const grp = backlog.groups.find((g) => g.slug === sc.capabilitySlug);
    if (!grp) missingCapability += 1;

    const match = matchBacklogItem(backlog.items, sc.requirement?.title);
    if (!match) missingFeature += 1;

    const featureIds = match ? [match.item.id] : [];
    const primaryId = featureIds[0] || null;

    const payload = {
      title: sc.title,
      summary: sc.summary,
      preconditions: sc.preconditions,
      capabilityId: grp?.id ?? null,
      featureBacklogItemIds: featureIds,
      primaryBacklogItemId: primaryId,
      environmentScope: 'prod',
      priority: 'p1',
      steps: sc.steps,
    };
    const r = await createScenario(cookie, payload);
    console.log(`  ✓ #${r.id} · S${sc.num} ${sc.title.slice(0, 56)}…`);
    inserted += 1;

    report.push({
      scenarioNum: sc.num,
      scenarioTitle: sc.title,
      capability: sc.group,
      requirementText: sc.requirement?.title || '(none in doc)',
      matchedFeatureId: match?.item.id || null,
      matchedFeatureTitle: match?.item.title || null,
      matchConfidence: match?.confidence || 'NO MATCH',
    });
  }

  // Print a feature-link mapping report so Betsy can see what got linked vs
  // what needs manual attention.
  console.log('');
  console.log('───── Feature-link mapping report ─────');
  const noMatches = report.filter((r) => !r.matchedFeatureId);
  const partials = report.filter((r) => r.matchConfidence === 'partial' || r.matchConfidence === 'prefix');
  const exacts = report.filter((r) => r.matchConfidence === 'exact');

  console.log(`Exact matches:   ${exacts.length}`);
  console.log(`Partial matches: ${partials.length} (review recommended)`);
  console.log(`No matches:      ${noMatches.length}`);

  if (partials.length) {
    console.log('');
    console.log('Partial matches — review in QA UI and confirm linkage:');
    for (const r of partials) {
      console.log(`  S${r.scenarioNum}: "${r.requirementText}"`);
      console.log(`     → matched feature #${r.matchedFeatureId}: "${r.matchedFeatureTitle}" (${r.matchConfidence})`);
    }
  }
  if (noMatches.length) {
    console.log('');
    console.log('NO matches — these scenarios got no feature link, please attach manually:');
    for (const r of noMatches) {
      console.log(`  S${r.scenarioNum}: "${r.requirementText}" (${r.capability})`);
    }
  }

  console.log('');
  console.log(`Done. ${inserted} inserted, ${skipped} skipped. Capability misses: ${missingCapability}, feature-link misses: ${missingFeature}.`);
})().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
