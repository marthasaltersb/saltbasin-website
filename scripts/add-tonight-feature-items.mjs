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
    capabilitySlug: 'public-site-content',
    externalRef: 'FEAT.2026-06-07.2 · bestystaff-public-chat-widget',
    title: 'BestyStaff Phase 5 — public chat widget on saltbasin.net',
    summary: 'A floating chat widget on the public Salt Basin site that lets visitors ask BestyStaff questions about the site and about Betsy. Stubbed today (501 from /api/agent/bestystaff); admin config card already collects greeting, persona, and aboutBio. This item is the build: real Anthropic-backed endpoint + frontend widget + safety guards + rate limiting.',
    userStory: 'As a public visitor curious whether Salt Basin is right for me, I want to ask a few quick questions about the work Betsy does and what engagements look like, without filling out a form, so I can self-qualify before reaching out as a lead.',
    requirementDetail:
      'Replace the 501 stub at POST /api/agent/bestystaff with a real Anthropic SDK call. System prompt is built from config.bestystaff.persona + aboutBio + a snapshot of public-site pages/sections (so it can answer "what services does Betsy offer?" with the actual published copy, not a hallucination). Per-IP rate limit (e.g. 20 messages/hour to start) to bound cost and bot abuse. Optional conversation-id pattern so multi-turn works — client-side localStorage holds the id; server keeps recent turns in memory (Redis-less for now; if cardinality grows past memory, swap to a DB-backed bestystaff_conversations table).\n\nFrontend: a new BestyStaffWidget component mounted on PublicSite (and possibly /u/:slug member profiles — open question). Floating bubble bottom-right. Only renders when config.bestystaff.enabled === true. Greeting on open uses config.bestystaff.greeting. Conversation persists in localStorage so refresh doesn\'t lose context.\n\n**v1 scope (~2-3 hr):** single-turn endpoint, persona + bio as system prompt, basic widget, per-IP rate limit, safety guard system prompt. No site-context tool use, no multi-turn.\n\n**v2 (deferred):** multi-turn conversations + site-context tool use (model can read live page content via a get_site_content tool) so answers quote actual published copy.\n\n**v3 (deferred):** capture conversation → lead conversion ("want me to follow up by email?" prompt). On opt-in, creates a lead row with source=bestystaff and the conversation as prior_notes. Hooks into the existing lead-capture flow.',
    businessRules:
      '- Widget only renders when config.bestystaff.enabled is true (admin opt-in already exists).\n- System prompt MUST explicitly forbid revealing: admin env vars, member private data, anything in the leads table, internal config_state values beyond what publicConfig() already exposes.\n- "I don\'t know about that" fallback for off-topic questions — model is instructed never to fabricate when uncertain.\n- No PII collected from visitors without an explicit opt-in step.\n- Rate limit per IP (recommend 20 messages/hour for v1) returns 429 with a friendly "you\'ve sent a lot — try again later" message.\n- Cost cap: if monthly Anthropic spend on BestyStaff exceeds a threshold (configurable, e.g. $50), widget auto-disables and alerts admin. (v2+ — not v1.)\n- Conversations are private to the visitor browser (localStorage) unless they explicitly opt in to share / convert to lead.',
    designSpec:
      'Bottom-right floating chat bubble, gold accent, matches Strategic Operator palette. Closed state: small circular avatar + "Ask BestyStaff" label on hover. Open state: 360px wide × ~480px tall panel with header (BestyStaff name + close X), scrollable message list, textarea + send button at bottom. Greeting message renders as the first assistant message on first open. On mobile, panel goes full-screen modal when opened. Loading state shows a typing-indicator triple-dot.',
    acceptanceCriteria:
      'Given config.bestystaff.enabled is true\nWhen a public visitor opens saltbasin.net\nThen the BestyStaff bubble appears in the bottom-right\nAnd clicking it opens a chat panel with the configured greeting\nAnd asking "What services do you offer?" returns a coherent answer derived from the site\'s actual published copy + Betsy\'s configured aboutBio\nAnd asking "What is Betsy\'s home address?" returns a graceful "I don\'t share that" response (safety guard).',
    processSteps: '1. Admin enables BestyStaff in Config → 2. Visitor lands on saltbasin.net → 3. Sees chat bubble → 4. Asks a question → 5. Gets persona-aligned response → 6. Continues conversation (v2) → 7. Optionally converts to lead (v3).',
    priority: 'p1', tags: ['public-site', 'agent', 'bestystaff', 'phase-5', 'anthropic'],
    ...PENDING_FRONTEND,
  },
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
