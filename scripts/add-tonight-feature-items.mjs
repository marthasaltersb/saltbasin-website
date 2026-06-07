// Feature backlog items captured during the 2026-06-07 session that won't
// ship tonight but should be on the record. Mirrors the defect-script pattern
// (add-tonight-defect-items.mjs) so the same external-ref + idempotent loader
// flow applies.
//
// Idempotent by externalRef — re-runs skip items already present.
//
// Usage: node scripts/add-tonight-feature-items.mjs

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

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
async function createItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const PENDING_FRONTEND = {
  kind: 'feature',
  status: 'pending',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: true, render: false, netlify: true },
};

const ITEMS = [
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'FEAT.2026-06-07.1 · test-mode-side-panel',
    title: 'Test mode: embedded side panel on every screen for live run logging',
    summary: 'When admin toggles "test mode" on, a floating side panel mounts at the App level and appears on every page — including public, member, lead, and output surfaces. Tester picks a scenario, records pass/fail/blocked per step inline as they exercise the system, adds free-form observations, and submits a run from inside the panel. Live notes; never have to flip back to the QA tab mid-test.',
    userStory: 'As a tester walking through a scenario across multiple pages of the site, I want a persistent side panel that travels with me, so I can record pass/fail per step in real time and capture observations the scenario authors may have missed — without losing my place every time the test takes me to a different URL.',
    requirementDetail:
      'A floating side panel component mounted at the App level (not inside AdminShell) so it appears on every route. Admin-only visibility (gated on user.role === "admin"). Toggled via a button in the QA tab AND a small persistent indicator in the topbar when active. Panel contains: scenario picker dropdown, ordered step list with per-step pass/fail/blocked radios + notes + evidence URL field, free-form observations textarea at the bottom, "Submit Run" button. State (active scenario + per-step verdicts + notes + observations) persists in localStorage so navigating between pages does not lose in-progress work. On submit, POSTs to /api/qa/runs with the per-step results (existing endpoint handles auto-defect creation). After a successful run, the panel clears and shows a "Run logged · N defects created" confirmation.\n\nv1 scope: ~2hr build. Floating panel, scenario dropdown, per-step radios, observations field, localStorage persistence, submit. Admin-only. No drag-resize, no minimize, no multi-observation list. v2 (deferred follow-up): drag-resize, minimize/expand, per-step evidence drop zone, multi-observation list, auto-jump to current step as the tester scrolls the page under test.',
    businessRules:
      '- Panel only renders for users where /api/auth/me returns role="admin".\n- Panel state is localStorage-only — never synced to the server until the tester clicks Submit Run. Closing the browser mid-test does NOT lose the run; reopening any page with test mode on restores the state.\n- Panel z-index sits above page chrome but below modal dialogs (so a Convert-to-Member modal still wins).\n- Public surfaces (saltbasin.net, /u/:slug) render the panel ONLY when the visiting user is logged in as an admin — never visible to anonymous visitors regardless of localStorage state.\n- Test mode toggle is per-browser, not per-account — it lives in localStorage so multiple admins on different browsers can be in / out of test mode independently.',
    designSpec:
      'Floating panel pinned to the right edge of the viewport (or bottom on mobile). Width ~360px. Gold-accent border consistent with rest of admin chrome. Header: scenario title + collapse/close buttons. Body: scrollable step list. Footer: observations + Submit Run button. Indicator in topbar: small gold pill labeled "Test mode · [scenario abbrev]" — clicking it expands the panel.',
    acceptanceCriteria:
      'Given I am admin with test mode toggled on and a scenario selected\nWhen I navigate from /admin to /member to /u/some-slug\nThen the panel persists across every page with my step-result state intact\nAnd clicking Submit Run from the panel records the run + creates defects for any failed steps just like the QA tab modal does.',
    processSteps: '1. Toggle test mode in QA tab → 2. Pick a scenario → 3. Navigate the site → 4. Mark each step pass/fail/blocked + notes inline as you go → 5. Add observations → 6. Click Submit Run → 7. Panel clears, defects appear in Backlog.',
    priority: 'p1', tags: ['qa', 'workflow', 'test-mode', 'admin'],
    ...PENDING_FRONTEND,
  },
];

(async () => {
  console.log(`→ ${BASE}`);
  const cookie = await login();
  console.log('✓ logged in');

  const snap = await getBacklog(cookie);
  const existingRefs = new Set((snap.items || []).map((it) => it.externalRef).filter(Boolean));
  console.log(`  · ${existingRefs.size} existing items with external_ref`);

  let inserted = 0, skipped = 0;
  for (const item of ITEMS) {
    if (existingRefs.has(item.externalRef)) {
      console.log(`  · skip "${item.title.slice(0, 64)}…" (already present)`);
      skipped += 1; continue;
    }
    const grp = (snap.groups || []).find((g) => g.slug === item.capabilitySlug);
    const payload = { ...item, capabilityId: grp?.id ?? null };
    delete payload.capabilitySlug;
    const r = await createItem(cookie, payload);
    console.log(`  ✓ #${r.id} · ${item.title.slice(0, 64)}…`);
    inserted += 1;
  }
  console.log('');
  console.log(`Done. ${inserted} inserted, ${skipped} skipped. Total target: ${ITEMS.length}.`);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
