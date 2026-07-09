// Configurable Platform Initiative — Phase D backlog logging.
//
// Session fd26e133-8fc2-466d-a852-9bf79328181e (2026-07-08) built Phase D:
// button classification (url/output/popup/custom) + placement, extending the
// section.fields.actions system from FEAT.2026-06-09.9 (id 90, already
// completed — untouched, still accurate: it covers label/href/style, not
// classification). Full detail: HANDOVER_configurable_platform.md (Phases
// A-C) and this session's plan file for Phase D.
//
// Overlap check (same method as add-configurable-platform-backlog-items.mjs):
// scanned all 118 live items for button/CTA/popup/placement keywords. One
// genuine overlap found and handled as an UPDATE, not a new item:
//   - PB.2 "CTA / button configurability per section" (id 49, pending) asked
//     for cta1Action ('submit form'|'external link'|'scroll-to-anchor') on
//     the legacy cta1/cta2 fields. Phase D delivers the same underlying
//     intent — button behavior classification beyond a bare URL — via a
//     broader, already-more-capable mechanism (the actions[] array from
//     id 90: url/output/popup w/ 3 sub-kinds/4 safe custom actions) instead
//     of extending cta1/cta2. This UPDATES id 49 in place with Phase D's
//     actual delivered scope rather than leaving a stale, narrower pending
//     item alongside a new duplicate — same principle as the concurrent
//     session's v0.19 script "gets UPDATED — not duplicated — since this
//     session rebuilt/extended that same surface."
// Not touched: id 90 (still accurate, untouched), id 23 "References request
// flow" (a distinct, already-deployed dedicated page, not this button system).
//
// Hours: real burst-analysis session total for fd26e133 — hoursClaude=1.32
// (raw active hours, analyze-contribution-sessions.mjs), hoursBetsy=0.67
// weighted / hoursStrategicDirection=0 / hoursDomainAuthoring=0
// (turn-classification.json — this session's human turns were short
// directives, correctly bucketed as active_supervision, not a methodology
// gap). This session also did non-Phase-D work (reconciliation, the Phase
// A/B/C backlog-logging script) — apportioned out via the same reproducible
// line-count-share method as the Phase A/B/C split: Phase D's edits (~351
// new/changed lines across EditorPane.jsx, blocks/index.jsx, ColumnWidgets.jsx,
// FlexColumnsEditor.jsx) vs the backlog-logging script (205 lines,
// scripts/add-configurable-platform-backlog-items.mjs) — Phase D share 0.631.
// Reconciliation produced no code and is excluded from both.
//
// patch_note_version left UNSET — same open v0.19/v0.20 numbering collision
// with the concurrent session noted in add-configurable-platform-backlog-items.mjs.
//
// Idempotent via POST /api/backlog/items' upsert-by-externalRef. Usage:
//   node scripts/add-phase-d-backlog-items.mjs
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD, optional PUBLIC_BASE_URL.

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

const CLAUDE_RATE = 115;
const TRADITIONAL_RATE = 175;

function withCost(hoursBetsy, hoursClaude, hoursStrategicDirection, hoursDomainAuthoring) {
  return {
    hoursBetsy,
    hoursClaude,
    hoursStrategicDirection,
    hoursDomainAuthoring,
    activitiesBetsy: Math.ceil(hoursBetsy * 3),
    activitiesClaude: Math.ceil(hoursClaude * 6),
    costUsdClaude: Math.round(hoursClaude * CLAUDE_RATE * 100) / 100,
    traditionalCostUsd: Math.round((hoursBetsy + hoursClaude) * TRADITIONAL_RATE * 100) / 100,
    dataSource: 'measured_burst_analysis',
  };
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function getBacklog(cookie) {
  const res = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getBacklog failed: ${res.status}`);
  return res.json();
}

async function upsertItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`upsertItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const BUILT_NOT_YET_DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: false,
  deployedRender: false,
  deployedNetlify: false,
};

const OVERLAP_KEYWORDS = /button|cta|popup|custom.?action|placement/i;

const PHASE_D_ITEM = {
  capabilitySlug: 'admin-experience',
  // Updates PB.2 in place (see header comment) rather than creating a new
  // item — same externalRef PB.2 already has on production.
  externalRef: 'PB.2 · profile-admin · cta-configurability',
  title: 'Button classification (URL/output/popup/custom) + placement, via the section.fields.actions system',
  summary: 'Supersedes the original PB.2 concept (cta1Action on legacy cta1/cta2 fields) with a broader mechanism built on the already-more-capable actions[] array (FEAT.2026-06-09.9): each button now has an explicit type — url, output document, popup (lead form / media / embedded output), or a fixed menu of 4 safe custom actions (copy link, scroll to top, print, share) — plus a placement control (left/center/right/stacked) for the button row.',
  userStory: 'As an admin or member editing a section, I want each button to do more than link to a URL — trigger a lead-capture popup, show a media lightbox, embed an output document, or run a safe built-in action like copy-link — and control how the button row is aligned, without writing code.',
  requirementDetail: 'src/components/admin/EditorPane.jsx: SectionActionsEditor gained a Type select (url/output/popup/custom) per row and a Placement control (once per Actions card); the existing guided link picker is reused unchanged for url/output (narrowed to the Output Documents group only when type=output); a new PopupActionConfig sub-editor handles the 3 popup kinds, reusing FlexColumnsEditor.jsx\'s exported FormConfig for the form kind and the existing ImageUploadField for media. src/components/blocks/index.jsx: new PopupOverlay (reuses the backdrop/card modal pattern already established by ResumePdfButton — the second consumer of that pattern, not a new one) and ActionButtons (shared renderer, extracted from the inline block that used to live only in TimelineBlock) dispatch by type: url/output render as <a>, popup opens the overlay (form kind posts to /api/leads with source=action-button-popup via the exported FormColumnWidget from ColumnWidgets.jsx, media shows an enlarged image, output embeds the target /output/* route in an iframe), custom runs one of the 4 hardcoded handlers. Wired into TimelineBlock only this pass — the reference implementation, matching Phase C\'s "not retrofitted onto every block" precedent; HeroBlock and other hardcoded cta1/cta2 sites are unchanged.',
  acceptanceCriteria: 'Given a section with a legacy {label,href,style} action (no type field), it renders identically to before (verified — the "Download Resume" seeded button on a Career Timeline section). Given an admin adds a popup-type button with kind=form and no fields configured yet, the field list auto-seeds a required email field the moment the row is switched to popup (bug found and fixed this session — the seed previously only fired on an explicit kind-dropdown change, not on the initial type switch). Given a visitor submits that popup form, a lead is created via /api/leads. Given an admin sets placement=center, the button row is horizontally centered.',
  businessRules: 'Custom actions are a fixed, hardcoded menu — no arbitrary code execution against a field that round-trips through the database, avoiding an injected-JS/XSS surface. type defaults to \'url\' when absent — zero migration required for existing content.',
  tags: ['configurable-platform', 'phase-d', 'admin-experience', 'button-classification', 'popup', 'custom-action', 'placement'],
  ...BUILT_NOT_YET_DEPLOYED,
  ...withCost(0.42, 0.83, 0, 0),
};

async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.\n');

  const { groups = [], items: existingItems = [] } = await getBacklog(cookie);
  const slugMap = {};
  for (const g of groups) if (g.slug) slugMap[g.slug] = g.id;

  const overlapHits = existingItems.filter((i) => {
    if (i.externalRef === PHASE_D_ITEM.externalRef) return false; // the item we're updating, not an overlap
    const haystack = `${i.title || ''} ${i.summary || ''} ${(i.tags || []).join(' ')}`;
    return OVERLAP_KEYWORDS.test(haystack);
  });
  console.log(`Overlap scan: ${overlapHits.length} other existing item(s) matched Phase D keywords (reviewed manually — see header comment):`);
  for (const h of overlapHits) console.log(`  [${h.id}] (${h.status}) ${h.externalRef || '(no externalRef)'} — ${h.title}`);
  console.log('');

  const { capabilitySlug, ...rest } = PHASE_D_ITEM;
  const groupId = slugMap[capabilitySlug] || null;
  if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
  const result = await upsertItem(cookie, { ...rest, capabilityId: groupId });
  const verb = result.upserted === 'updated' ? 'UPDATED' : 'CREATED';
  console.log(`  ${verb} [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 70)}`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${verb} 1 item (PB.2 → Phase D button classification).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next: assign patch_note_version + flip deployed flags once committed/deployed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
