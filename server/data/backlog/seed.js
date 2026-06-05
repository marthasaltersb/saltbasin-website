// Seed data for the admin Backlog dashboard.
//
// Captures the major feature requirements built into saltbasin.net,
// organized by capability group. Each item carries:
//   - title + one-line summary
//   - user story (As X, I want Y, so that Z)
//   - requirement detail (what we built, in business terms)
//   - business rules (the logic that governs behavior)
//   - design spec (the UX/visual decisions)
//   - acceptance criteria (Given / When / Then, what proves it works)
//   - process steps (which user-facing flows it touches)
//   - work split estimate (% of effort by Claude vs Betsy)
//   - time estimate (minutes of focused build time)
//   - deployment state (which environments it's live in)
//   - tags for cross-cutting search
//
// Server-side only. The backlog routes ingest this via POST /api/backlog/seed
// when the tables are empty. Idempotent — safe to call repeatedly.

export function backlogSeed() {
  return { groups, items, tierWorkarounds, projectStartedAt: PROJECT_STARTED_AT };
}

// Earliest commit on the project (git log --reverse). Used by the
// build-summary endpoint to compute "days to build".
export const PROJECT_STARTED_AT = new Date('2026-06-03T10:54:45-04:00').getTime();

// ── Capability groups ──
const groups = [
  {
    slug: 'platform-foundation',
    name: 'Platform Foundation',
    description: 'The shared CMS infrastructure both you and members use — schema, auth, draft/publish, block library.',
    color: '#1B2A3B',
    sortOrder: 10,
    techStack: ['React 19', 'Vite', 'React Router', 'Express', 'Postgres (Supabase)', 'bcryptjs', 'cookie-parser', 'CSS variables'],
  },
  {
    slug: 'multi-tenant-cms',
    name: 'Multi-tenant CMS',
    description: 'Member admin parity — every operator runs their own multi-page site with the same shell you use, scoped to their own data.',
    color: '#C4843A',
    sortOrder: 20,
    techStack: ['React 19', 'Express', 'Postgres (JSONB-style TEXT)', 'AdminShell shared component', 'requireUser middleware'],
  },
  {
    slug: 'lead-capture',
    name: 'Lead Capture & Identity',
    description: 'Public forms → leads → match-and-merge dedup → password-protected lead records → optional member conversion.',
    color: '#A8B89A',
    sortOrder: 30,
    techStack: ['React 19', 'Express', 'Postgres', 'bcryptjs (lead passwords)', 'crypto (publicId generation)', 'lead_sessions cookies'],
  },
  {
    slug: 'email-infrastructure',
    name: 'Email Infrastructure',
    description: 'Custom-domain mailbox (Zoho), transactional sending (Brevo), DNS auth (SPF / DKIM / DMARC), templated outbound.',
    color: '#4A6670',
    sortOrder: 40,
    techStack: ['Brevo API (v3/smtp/email)', 'Zoho Mail (Forever Free)', 'Wix DNS', 'SPF + CNAME-based DKIM + DMARC', 'fetch (no SDK)', 'lead_emails audit table'],
  },
  {
    slug: 'net-works-network',
    name: 'Salt Basin Net Works',
    description: 'The opt-in operator network: members opt in via their config, their card appears in the rotating banner on the Salt Basin home page.',
    color: '#D4B896',
    sortOrder: 50,
    techStack: ['React 19', 'Express', 'Postgres', 'CSS scroll-snap (horizontal banner)', 'one-shot script (inject-networks-banner.mjs)'],
  },
  {
    slug: 'public-site-content',
    name: 'Public Site Content',
    description: 'Founder-first hero, industries × domains wheel, services, case studies, timeline, technology, contact, references.',
    color: '#8B9BAE',
    sortOrder: 60,
    techStack: ['React 19', 'SVG (industry wheel)', 'CSS Grid + Flexbox', 'Cormorant Garamond + Inter web fonts'],
  },
  {
    slug: 'output-pages',
    name: 'Output Pages (Resume / Proposal / Case Study / One-Pager)',
    description: 'Print-friendly, member-gated, deep-link-shareable views of high-value artifacts.',
    color: '#3D5A6C',
    sortOrder: 70,
    techStack: ['React 19', 'CSS @media print', 'GatedPreview component (auth gate)', 'OutputFrame wrapper'],
  },
  {
    slug: 'admin-experience',
    name: 'Admin Experience',
    description: 'Salt Basin admin UX: sidebar, editor, preview, config panel, leads panel, Net Works roster, mobile.',
    color: '#7B8F9D',
    sortOrder: 80,
    techStack: ['React 19', 'multer (image uploads)', 'Supabase Storage', 'CSS variables (light/dark adaptive)', 'mobile breakpoint <768px'],
  },
  {
    slug: 'deployment-infrastructure',
    name: 'Deployment Infrastructure',
    description: 'Render (backend), Netlify (frontend), Supabase (DB + storage), GitHub Actions monitors, env-var management.',
    color: '#5A7080',
    sortOrder: 90,
    techStack: ['Render (free tier)', 'Netlify (free tier)', 'Supabase (free tier: Postgres + Storage)', 'GitHub Actions', 'libsodium-wrappers (encrypted GH secrets)', 'Render API', 'Netlify API'],
  },
  {
    slug: 'security-and-data',
    name: 'Security & Data',
    description: 'Auth (bcrypt + sessions), password rotation, data notice, gitignore hygiene, lead-data protection.',
    color: '#C44B4B',
    sortOrder: 100,
    techStack: ['bcryptjs', 'node:crypto (randomBytes)', 'cookie-based sessions', 'rotate-admin-password.mjs script', 'gitignored secret files'],
  },
  {
    slug: 'observability',
    name: 'Observability & Quality',
    description: 'Deploy monitors, missed-deploy detection, build-credit hygiene, local verify-before-push workflow.',
    color: '#9E7FB0',
    sortOrder: 110,
    techStack: ['GitHub Actions', 'UptimeRobot (13-min pings)', 'Render API polling', 'auto-issue creation on failure', 'netlify.toml build.ignore script'],
  },
  {
    slug: 'requirements-mgmt',
    name: 'Requirements & Test Management',
    description: 'This dashboard, deployment correlation, test cases, test runs, defect lifecycle (under construction).',
    color: '#E8A87C',
    sortOrder: 120,
    techStack: ['React 19', 'Express', 'Postgres (capability_groups + backlog_items + tier_workarounds)', 'side-drawer pattern', 'auto-seed on first load'],
  },
];

// Shortcut helpers so the item list below stays readable.
const DEPLOYED_ALL = { deployedGithub: true, deployedRender: true, deployedNetlify: true };
const DEPLOYED_BACKEND = { deployedGithub: true, deployedRender: true, deployedNetlify: false };
const DEPLOYED_FRONTEND_ONLY = { deployedGithub: true, deployedRender: false, deployedNetlify: true };
const REL_BOTH = { deployRelevance: { github: true, render: true, netlify: true } };
const REL_BACKEND = { deployRelevance: { github: true, render: true, netlify: false } };
const REL_FRONTEND = { deployRelevance: { github: true, render: false, netlify: true } };
const REL_INFRA = { deployRelevance: { github: false, render: false, netlify: false } };

// Common tech-stack bundles. Items pick whichever applies + add specifics.
// Cost estimates are in USD; methodology is documented on the build-summary
// output page. Calibration: total project budget ≈ $60 across all Claude
// Code time, distributed proportionally to time_minutes. Per-item costs are
// editable in the admin Backlog drawer.
const TECH_FULLSTACK = ['React 19', 'Vite', 'React Router', 'Express', 'Postgres (Supabase)', 'Node 22'];
const TECH_BACKEND_ONLY = ['Express', 'Postgres (Supabase)', 'Node 22'];
const TECH_INFRA_ONLY = ['Render', 'Netlify', 'Supabase', 'Wix DNS', 'GitHub Actions'];
const TECH_FRONTEND_ONLY = ['React 19', 'Vite', 'CSS variables'];

// $0.02 / minute is the baseline rate (matches the calibration above).
function cost(minutes) {
  if (minutes == null) return null;
  return Math.round(minutes * 0.02 * 100) / 100;
}

// ── Backlog items ──
const items = [
  // ───────────────────────── PLATFORM FOUNDATION ─────────────────────────
  {
    capabilitySlug: 'platform-foundation',
    title: 'Configurable CMS with admin login and draft/publish workflow',
    summary: 'Two-state content model — every page and section lives as draft until explicitly published.',
    userStory: 'As Betsy, I want to edit my site privately and only push changes live when I am ready, so I never surprise visitors with half-finished content.',
    requirementDetail:
      'A web-based CMS scoped to a single admin owner (Betsy) with bcrypt-hashed login, cookie-based sessions, and a two-state content model. The "draft" state holds in-progress edits; the "published" state is what saltbasin.net visitors see. Promotion is explicit and reversible (a re-publish replaces the public state but the draft pointer is retained).',
    businessRules:
      '- Only authenticated admin users can read or write the draft.\n- Only authenticated admin users can promote draft → published.\n- The public route never reads the draft.\n- A page or section in "draft" status renders nothing on the public site, even after publish.\n- A "soon" status renders a Coming Soon placeholder on public; a "live" status renders the real content.',
    designSpec:
      'Top toolbar with Save / Discard / Publish buttons. Sticky save bar at bottom shows "Unsaved: content + config" when dirty, "All changes saved" when clean. Publish triggers a confirmation dialog ("Promote draft to public?"). Editor + preview run side-by-side in the default Split view; user can switch to Edit Only or Preview Only via a tab toggle.',
    acceptanceCriteria:
      'Given I am logged in as admin\nWhen I edit a section heading and click Save Draft\nThen the public site at saltbasin.net is unchanged\nAnd the section heading is persisted to the draft\n\nGiven I have unsaved draft changes\nWhen I click Publish\nThen I see a "Promote draft to public?" confirmation\nAnd if I confirm, the public site updates within seconds.',
    processSteps: '1. Admin login → 2. Edit content → 3. Save Draft → 4. Review in preview → 5. Publish → 6. Public site updates.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 240,
    tags: ['cms', 'auth', 'draft-publish'],
    externalRef: 'tasks #4-#12',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'platform-foundation',
    title: 'Password-protected pre-launch landing gate',
    summary: 'A toggleable wall that hides the entire public site behind a single shared password until launch.',
    userStory: 'As Betsy, I want to share saltbasin.net with select early reviewers before I am ready to go fully public, so I can collect feedback without anyone stumbling across an unfinished site.',
    requirementDetail:
      'A configurable "pre-launch gate" that, when enabled, replaces every public page with a single password prompt. Successful entry sets a session cookie so the visitor does not have to re-enter on every page. The admin can toggle the gate, change the password, and customize the gate copy (headline + subhead) from the Config panel without code changes.',
    businessRules:
      '- Gate enabled = all non-admin routes return 403 until unlocked.\n- Unlock cookie lives in the landing_sessions table with an expiry.\n- Admin routes (/admin/*) and direct API routes are always reachable.\n- Toggling the gate off does not invalidate existing unlock cookies.',
    designSpec:
      'Centered full-viewport navy panel with the Salt Basin wordmark, the admin-set headline and subhead, a single password input, and a gold Unlock button. Wrong password shows an inline error without re-rendering the page.',
    acceptanceCriteria:
      'Given the gate is enabled\nWhen I visit saltbasin.net without an unlock cookie\nThen I see the password page\n\nGiven I enter the correct password\nWhen I submit\nThen I am unlocked for the duration of my session\nAnd I see the real public site.',
    processSteps: '1. Admin enables gate in Config → 2. Visitor lands on saltbasin.net → 3. Sees password prompt → 4. Enters password → 5. Cookie set → 6. Site visible.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 95,
    timeMinutes: 90,
    tags: ['gate', 'auth', 'config'],
    externalRef: 'task #5',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'platform-foundation',
    title: 'Block library for composable page sections',
    summary: 'A registry of reusable section types — hero, cards, two-column, contact, industries, timeline, technology, etc.',
    userStory: 'As Betsy, I want to compose pages from a library of pre-built section types so I can add content without writing code.',
    requirementDetail:
      'A React block registry (~22 component types) keyed by section.type. Each block accepts { section, config, mode } and renders the public markup. The same block library powers the platform site, the admin live preview, member profile sites, and the print-friendly output pages.',
    businessRules:
      '- Every block must handle a missing field gracefully (no crashes on partial data).\n- Blocks honor section.status: draft → null in public, soon → Coming Soon panel in public, live → full render.\n- Background tokens (ivory / navy / linen / teal / cream) map to brand CSS variables, so member brand-color overrides cascade automatically.',
    designSpec:
      'Each block follows Salt Basin Strategic Operator palette: ivory/cream backgrounds with navy text, navy backgrounds with cream text. Eyebrow labels in gold caps. Display headings use the Cormorant Garamond family. Body text uses a humanist sans. Gold rule line under headings as visual divider.',
    acceptanceCriteria:
      'Given a page has a "hero" type section with a heading\nWhen the public site renders that page\nThen I see a hero block with the heading in display type\n\nGiven I add a new section type to the registry\nWhen the admin sets a section to that type\nThen it renders correctly in both preview and public.',
    processSteps: 'Section type chosen in admin → Block component looked up in registry → Section.fields rendered into the block → Output styled per brand tokens.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 300,
    tags: ['blocks', 'rendering', 'brand'],
    externalRef: 'task #8',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'platform-foundation',
    title: 'Brand tokens + Strategic Operator palette',
    summary: 'Salt Basin brand identity codified into CSS variables — palette, type, spacing, radius — applied consistently.',
    userStory: 'As Betsy, I want every page, output, and admin screen to feel like the same brand without me having to repaint each one.',
    requirementDetail:
      'A central brand.css that exposes Salt Basin colors, type families, spacing, and radius as CSS custom properties (--sb-navy, --sb-gold, --sb-ivory, --sb-display, etc.). Every component reads from these tokens. Member profile pages can override the same tokens scoped to their /u/:slug route, so each member can recolor their own profile without touching the codebase.',
    businessRules:
      '- The canonical palette is Strategic Operator (navy, gold, cream, ivory, sage, taupe).\n- Member overrides apply only inside .sb-member-profile-root.\n- Admin tooling and the Salt Basin platform site always use the canonical tokens.',
    designSpec:
      'Brand kit per the Salt Basin Strategic Operator skill: deep navy primary, warm gold accent, ivory/cream paper, sage and dusty teal as secondary accents. Cormorant Garamond for display, Inter for body, JetBrains Mono for code/labels.',
    acceptanceCriteria:
      'Given a member sets their brand.accent color to #ff0000\nWhen I view /u/their-slug\nThen the gold accents (CTAs, eyebrows) render in red\nAnd saltbasin.net itself is unaffected.',
    processSteps: 'CSS vars defined in brand.css → Components read var(--sb-*) → Member CMS injects an override style at /u/:slug → Member profile recolors scoped to that subtree.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 90,
    timeMinutes: 120,
    tags: ['brand', 'design-system'],
    externalRef: 'task #3',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'platform-foundation',
    title: 'Supabase Postgres migration (from SQLite)',
    summary: 'Moved persistent state from a local SQLite file to managed Supabase Postgres for hosted reliability.',
    userStory: 'As the platform owner, I want my data to live in a managed Postgres so it survives container restarts on Render and I can query it from anywhere.',
    requirementDetail:
      'Migrated from node:sqlite to the `postgres` npm package targeting a Supabase Postgres instance. Wrote a thin adapter exposing the same prepare().get/.all/.run shape so callers did not need to change. Schema bootstrap runs on every server boot (CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS) so migrations are idempotent. Resolved an early Render IPv6 ENETUNREACH by switching DATABASE_URL to the Supabase Session Pooler.',
    businessRules:
      '- All data lives in Postgres, not on the Render container disk.\n- Schema migrations are idempotent and run on boot.\n- The adapter preserves the sqlite-style call sites so future swaps are easy.\n- DATABASE_URL must use the IPv4 pooler (port 5432) — IPv6 direct fails on Render free tier.',
    designSpec: 'N/A — backend only.',
    acceptanceCriteria:
      'Given I redeploy the Render service\nWhen the container restarts\nThen no data is lost\nAnd the schema is in the expected shape.',
    processSteps: 'Server boots → bootstrap() runs migrations → Routes can hit db.prepare(...) immediately.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 180,
    tags: ['db', 'postgres', 'supabase', 'infra'],
    externalRef: 'task #70',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  // ───────────────────────── MULTI-TENANT CMS ─────────────────────────
  {
    capabilitySlug: 'multi-tenant-cms',
    title: 'Member admin parity — same shell, scoped to own data',
    summary: 'Every member runs the same multi-page CMS Betsy uses, but only sees and edits their own site.',
    userStory: 'As an operator who has signed up to Salt Basin Net Works, I want the same powerful editor Betsy has so I can build a real profile site without being limited to a one-page template.',
    requirementDetail:
      'A single AdminShell component takes a `scope` prop ("admin" or "member"). The shell picks which API endpoints to talk to and which tabs to show based on scope. Members see "My Site" + "Config" tabs; admin sees "My Profile" + "Leads" + "Net Works" + "Config". Behind the scenes, members hit /api/member-site/* and /api/member-config/*, which are scoped to req.user.id by middleware — they can only ever read or write their own row.',
    businessRules:
      '- A member can never read another member\'s draft, published site, or config.\n- A member never sees the Leads tab or the Net Works (member roster) tab.\n- The same block library, draft/publish workflow, status states, and preview pane apply to both scopes.\n- Members get a default starter site (Home / About / Contact) on first signup, generated lazily on first GET if no row exists.',
    designSpec:
      'Member topbar reads "Operator Console · /u/<slug>" in the eyebrow, with two action buttons: "View My Profile" (opens /u/:slug) and "Visit Salt Basin ↗" (opens /). Member tab toggle is just "My Site" + "Config" — no Leads, no Net Works. Otherwise pixel-identical to admin.',
    acceptanceCriteria:
      'Given I am logged in as a member\nWhen I visit /member\nThen I see the AdminShell with only My Site and Config tabs\nAnd I can edit my own pages and sections\nAnd I cannot see any other member\'s data.',
    processSteps: '1. Member signs up → 2. Default site auto-seeded → 3. Member opens /member → 4. Edits sections in same UX as admin → 5. Publishes their own draft → 6. /u/:slug updates.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 180,
    tags: ['multi-tenant', 'admin-shell', 'scoping'],
    externalRef: 'tasks #123-#131, commit c414102',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'multi-tenant-cms',
    title: 'Member brand-color overrides (scoped to /u/:slug)',
    summary: 'Members pick their own Primary / Accent / Ink / Paper colors; their profile recolors without touching Salt Basin.',
    userStory: 'As a member operator with my own brand identity, I want my profile page to use my colors so visitors immediately see it as MY brand, not a Salt Basin template.',
    requirementDetail:
      'The member Config panel exposes four color pickers (Primary, Accent, Ink, Paper) that map to the same CSS variables (--sb-navy, --sb-gold, --sb-cream, --sb-ivory) the blocks read from. The PublicProfile component injects an inline <style> tag at the top of the member\'s page that overrides those variables, scoped under a .sb-member-profile-root class so the override only applies to that subtree.',
    businessRules:
      '- Colors must be 6-char hex (#RRGGBB). Picker enforces format.\n- Empty / invalid values fall back to Salt Basin defaults.\n- Overrides are scoped to .sb-member-profile-root — they never leak to saltbasin.net.\n- Changes only take effect when the member publishes (lives in published config).',
    designSpec:
      'In the member Config panel, a "Brand Colors" card with four labeled rows. Each row has a native color picker (32x32 swatch) and a hex text field side-by-side. Editing either updates the other. Small explainer above the grid: "These colors apply to your profile pages only."',
    acceptanceCriteria:
      'Given I am a member and I set Accent to #DC143C\nWhen I publish and visit /u/my-slug\nThen the gold elements (CTAs, eyebrows, rule lines) render in crimson\nAnd saltbasin.net visuals are unchanged.',
    processSteps: '1. Member opens Config → 2. Picks colors via swatch or hex → 3. Saves draft → 4. Publishes → 5. PublicProfile route injects scoped <style> → 6. Member profile recolors.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['member', 'brand', 'config'],
    externalRef: 'task #127',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'multi-tenant-cms',
    title: 'Member BYO Anthropic API key (for the future Config Agent)',
    summary: 'Members can paste their own Claude API key, stored server-side, ready to power their in-admin editor agent.',
    userStory: 'As a member operator, I want to bring my own Claude API key so I can use an AI editor on my own profile without sharing infrastructure cost with Salt Basin.',
    requirementDetail:
      'The member Config panel has a "Config Agent · Bring Your Own Claude" card with a password-style input for the Anthropic API key and a model selector defaulting to claude-sonnet-4-5. The key is stored in the member_configs.draft.integrations.anthropicKey JSON path, never returned in publicConfig(), and never exposed in the public API. The actual agent runtime is deferred to a future session.',
    businessRules:
      '- The key is stored as-is in member_configs (encryption-at-rest is provided by Supabase Postgres).\n- The key is never echoed back to the public config endpoint.\n- A PUT that omits integrations defensively merges in the existing key — prevents accidental wipe on partial saves.\n- The selected model is saved alongside the key for future agent reads.',
    designSpec:
      'Member Config panel only (never shown in admin scope). Card title: "Config Agent · Bring Your Own Claude". Explainer with a link to console.anthropic.com. Password input for the key (browser hides as dots). Plain text input for the model name. Both editable inline.',
    acceptanceCriteria:
      'Given I paste a key and save\nWhen I refresh the member dashboard\nThen the key field is repopulated\nAnd the public profile fetch does not include the key in any response.',
    processSteps: '1. Member opens Config → 2. Pastes key + model → 3. Saves → 4. Key persisted in member_configs JSON → 5. Future agent reads it server-side only.',
    status: 'deployed',
    priority: 'p2',
    workSplitClaude: 100,
    timeMinutes: 45,
    tags: ['member', 'config', 'ai', 'bring-your-own'],
    externalRef: 'task #127',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'multi-tenant-cms',
    title: 'Default member starter site (Home / About / Contact)',
    summary: 'New members land on a three-page starter site they can edit, not a blank screen.',
    userStory: 'As a brand-new member, I want my profile to already have a reasonable starter structure so I can edit content instead of building from scratch.',
    requirementDetail:
      'On first GET /api/member-site/draft for a user with no existing row, the server seeds a default site from defaultMemberSite(): Home page (Hero + Domains + Services cards + Contact), About page (Hero + Resume timeline), Contact page (Hero + Contact form). The starter content uses placeholder copy and the member\'s display name where known.',
    businessRules:
      '- Seed runs once per member, lazily, on first read.\n- Subsequent reads return whatever the member has saved.\n- The seed structure is multi-page (not flat) so the member sees the full CMS capability from day one.\n- The same defaults can be regenerated by deleting the member\'s row (admin-only future tooling).',
    designSpec:
      'Home page has a hero, a domains-of-expertise block, a services cards block, and a contact block — same layout shape as Salt Basin\'s home but trimmed for a single operator. About page has an About hero and a Resume timeline block. Contact page has a contact hero and a contact form block.',
    acceptanceCriteria:
      'Given I am a brand-new member who has never opened /member\nWhen I open it\nThen I see three pages (Home / About / Contact) in the sidebar\nAnd each page has 2-4 editable sections\nAnd I can edit and publish them.',
    processSteps: '1. Member signup → 2. First /member visit → 3. Server ensureDraft() seeds defaults → 4. Member sees 3 pages with editable sections.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 45,
    tags: ['member', 'starter-site', 'defaults'],
    externalRef: 'task #130',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  // ───────────────────────── LEAD CAPTURE ─────────────────────────
  {
    capabilitySlug: 'lead-capture',
    title: 'Lead capture with email + phone + match-and-merge dedup',
    summary: 'Public forms create a lead record; repeat submissions auto-merge by normalized email or phone.',
    userStory: 'As Betsy, I want every form submission to end up as a single lead record per person, even if they fill out multiple forms over time, so I can see their full engagement history in one place.',
    requirementDetail:
      'Public forms (Contact, Join Network, For Companies, Assessments notify, References request) POST to /api/leads. The server normalizes the email (lowercase, trim) and phone (digits only), then looks for an active (non-merged) lead with a matching email OR phone. If found, the new submission attaches as activity on the existing record and any divergent fields (name, phone, message) are folded in. If not found, a new lead is created with a generated public_id, a bcrypt-hashed access password, and the source field set.',
    businessRules:
      '- Email match is case-insensitive and trim-tolerant.\n- Phone match uses digits-only normalization (so "555-123-4567" and "(555) 123-4567" match).\n- A lead with merged_into_id IS NOT NULL is treated as inactive — never matched.\n- On match, the lead\'s updated_at bumps; a new lead_activity row records the source + cta_location + message.\n- The merged lead\'s message is appended to prior_notes (JSON array) so nothing is lost.',
    designSpec:
      'On the public form, after submit, a confirmation modal shows the lead URL and password (one-time display). The lead also receives those credentials by email. The modal includes "Open my lead record →" and "Close" actions. Failed submissions show inline errors in the form.',
    acceptanceCriteria:
      'Given I am a visitor and I submit a contact form with my email\nWhen the email already exists on an active lead\nThen no duplicate is created\nAnd a new activity row is logged against the existing lead\nAnd both the new submission AND prior submissions are visible in admin.',
    processSteps: '1. Visitor submits a public form → 2. Server normalizes email + phone → 3. Match lookup → 4. Either creates new lead or attaches activity → 5. Confirmation modal shows URL + password → 6. Email sent (via Brevo).',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 240,
    tags: ['leads', 'dedup', 'public-forms'],
    externalRef: 'tasks #100-#105',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'lead-capture',
    title: 'Password-protected lead record at /lead/:publicId',
    summary: 'Each lead gets a shareable URL secured by a per-record password — no guessable tokens in the URL.',
    userStory: 'As a lead who submitted a form, I want a private URL where I can come back, add more context, and see what I have shared with Betsy — protected so only I can access it.',
    requirementDetail:
      'A lead record lives at /lead/<publicId> where publicId is a short, opaque, non-sequential identifier. Access requires entering the bcrypt-hashed password the lead received by email. Successful entry creates a lead_session cookie scoped to that lead_id; subsequent visits within the session bypass the password. The page shows the submission history, allows the lead to add notes, and (later) to upload supporting files.',
    businessRules:
      '- Public IDs are NOT sequential or guessable.\n- Password is bcrypt-hashed at rest.\n- Lead sessions are stored in lead_sessions and expire.\n- A correct password generates a new session cookie; an incorrect one rate-limits via standard request flow.\n- The legacy URL-token access remains for back-compat but new leads always use the password flow.',
    designSpec:
      'On first visit without a session: a centered navy panel with the Salt Basin wordmark, "Enter password for lead #<publicId>", and an unlock button. Wrong password shows inline error. Once unlocked: a structured view of the lead — Summary, Activity timeline, Emails to you (logged), and an Add note input.',
    acceptanceCriteria:
      'Given I have a valid lead URL and password\nWhen I enter the password correctly\nThen I see my lead record\nAnd subsequent visits in the same browser session do not re-prompt for the password\n\nGiven I enter the wrong password\nWhen I submit\nThen I see an error and remain on the unlock screen.',
    processSteps: '1. Lead receives URL + password by email → 2. Visits URL → 3. Enters password → 4. Session cookie set → 5. Views own lead record.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 180,
    tags: ['leads', 'auth', 'lead-session'],
    externalRef: 'task #102',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'lead-capture',
    title: 'Lead → member conversion flow',
    summary: 'A lead can convert into a Salt Basin Net Works member from their own lead record, carrying their context forward.',
    userStory: 'As a lead who has engaged enough to want a profile of my own, I want a one-click path from my lead record to becoming a member, so my prior context follows me into membership.',
    requirementDetail:
      'On the lead view, an authenticated lead can click "Become a member" which deep-links them to /signup with their public_id and a one-time conversion token. The signup form pre-fills their email and asks for a password + display name. On submit, the new user account is linked back to the lead (leads.converted_user_id), so the admin can see which leads became members and the member can see their pre-membership lead history later.',
    businessRules:
      '- Conversion token must match the lead\'s access_token to authorize the link.\n- Once converted, the lead retains its lead record AND gains a user/member identity.\n- The lead is never deleted or anonymized post-conversion.\n- A single lead can only convert once; the second attempt is a no-op.',
    designSpec:
      'On the lead view, a banner near the top: "Want to claim a Salt Basin profile? Become a member →" with a gold CTA. Click goes to /signup?fromLeadPublicId=...&fromLeadToken=... which shows a streamlined form (email pre-filled and locked, password + display name only).',
    acceptanceCriteria:
      'Given I am an authenticated lead\nWhen I click "Become a member"\nThen I land on /signup with my email pre-filled\nAnd after I complete signup\nThen my user account is linked to my prior lead in the database.',
    processSteps: '1. Lead views own record → 2. Clicks Become a member → 3. Lands on /signup with pre-fill → 4. Completes signup → 5. lead.converted_user_id set → 6. Member dashboard accessible.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 90,
    tags: ['leads', 'conversion', 'membership'],
    externalRef: 'task #64',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'lead-capture',
    title: 'Lead view shows email log',
    summary: 'Every email the platform sent to a lead is logged and visible inside the lead\'s own record.',
    userStory: 'As a lead, I want to see what emails Salt Basin has sent me and what they contained, so I have a verifiable trail of communication.',
    requirementDetail:
      'A lead_emails table records every transactional email sent: to, from, subject, html, text, provider (resend/brevo/console), status, providerId, error. The lead view fetches and renders these as an expandable list — collapsed shows from/subject/status, expanded shows the full body. Admin can see the same log from the admin Lead detail view.',
    businessRules:
      '- Every dispatch() call writes a lead_emails row regardless of provider.\n- Stubbed (console) sends are logged with status="stubbed" so dev/test never sends real mail but the log is complete.\n- Failed sends include the error message for diagnostics.\n- The from address logged is whatever the platform identity was at send time (e.g., betsysalter@saltbasin.net).',
    designSpec:
      'On the lead view, a panel titled "Emails to you" between the Summary and Activity. Each row shows from / subject / status pill (sent/stubbed/failed) and a chevron to expand the body. Click to expand shows the rendered HTML in a contained area.',
    acceptanceCriteria:
      'Given I am an authenticated lead with a confirmation email logged\nWhen I view my lead record\nThen I see an "Emails to you" panel\nAnd the panel lists the confirmation email\nAnd I can expand to see the full body.',
    processSteps: '1. Server sends email → 2. dispatch() writes lead_emails row → 3. Lead views record → 4. UI fetches lead emails → 5. Renders list.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['leads', 'email-log', 'transparency'],
    externalRef: 'task #114',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── EMAIL INFRASTRUCTURE ─────────────────────────
  {
    capabilitySlug: 'email-infrastructure',
    title: 'Zoho mailbox at betsysalter@saltbasin.net',
    summary: 'Real custom-domain mailbox for receiving replies and personal mail — Forever Free tier.',
    userStory: 'As Betsy, I want a professional mailbox at my own domain so leads who reply land in my inbox, not a personal Gmail.',
    requirementDetail:
      'Configured Zoho Mail\'s Forever Free Plan with custom domain saltbasin.net. Added domain ownership TXT record, three MX records (mx.zoho.com / mx2 / mx3), SPF, and DKIM in Wix DNS (the authoritative DNS host for the domain). Verified domain ownership + sending auth from the Zoho admin console.',
    businessRules:
      '- DNS records live at Wix (the DNS authority), not Netlify.\n- Only ONE SPF record may exist on the domain; Brevo\'s SPF needs are met via Brevo\'s own CNAME-based DKIM, no merge required.\n- Free tier: 5GB / 1 user / web access only (no IMAP/POP).\n- All inbound mail for *@saltbasin.net routes through Zoho.',
    designSpec: 'Operational only — Zoho\'s webmail UI is the read interface.',
    acceptanceCriteria:
      'Given the MX records are in place\nWhen someone sends an email to betsysalter@saltbasin.net\nThen it arrives in the Zoho webmail inbox.',
    processSteps: '1. Sign up Zoho Forever Free → 2. Add saltbasin.net → 3. Verify TXT in Wix → 4. Add MX in Wix → 5. Add SPF + DKIM in Wix → 6. Zoho confirms → 7. Inbox live.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 40,
    timeMinutes: 90,
    tags: ['email', 'mailbox', 'zoho', 'dns'],
    externalRef: 'task #132',
    ...REL_INFRA,
  },

  {
    capabilitySlug: 'email-infrastructure',
    title: 'Brevo transactional email (swap from Resend)',
    summary: 'Outbound transactional API for lead confirmations and admin alerts — works on Wix DNS where Resend cannot.',
    userStory: 'As Betsy, I want the platform to actually send the emails my code logs, so leads get confirmations and I get new-lead alerts in my Zoho inbox.',
    requirementDetail:
      'Refactored server/lib/email.js from Resend\'s API to Brevo\'s (POST https://api.brevo.com/v3/smtp/email). Auth header changed from "Authorization: Bearer" to "api-key". Payload reshaped to Brevo\'s {sender, to[], htmlContent, textContent} format. The swap was forced because Resend requires an MX record on a subdomain (send.saltbasin.net), and Wix DNS does not allow MX on subdomains.',
    businessRules:
      '- BREVO_API_KEY env var must be set in Render for real delivery; absent it, dispatch falls back to a console stub that still writes lead_emails rows.\n- The "from" address is read from the published config (email.fromAddress) so admin can change identity without code changes.\n- A defensive parseFrom() splits "Name <email>" into Brevo\'s required {name, email} sender object.\n- Every send (real OR stubbed) logs to lead_emails with provider="brevo" or "console".',
    designSpec: 'Backend infrastructure only.',
    acceptanceCriteria:
      'Given BREVO_API_KEY is set in Render\nWhen the server calls dispatchRaw({to, subject, text, html})\nThen Brevo accepts the message\nAnd a message_id is logged to lead_emails\nAnd the recipient inbox receives the message.',
    processSteps: '1. Code calls sendLeadConfirmation() → 2. dispatch() resolves from-address from published config → 3. POST to Brevo with api-key header → 4. Brevo returns message_id → 5. Row written to lead_emails with provider=brevo.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 90,
    tags: ['email', 'outbound', 'brevo', 'api'],
    externalRef: 'task #133, commit 03d16d1',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  {
    capabilitySlug: 'email-infrastructure',
    title: 'Lead confirmation email + Betsy notification',
    summary: 'Every lead submission fires two emails: confirmation to the lead, alert to Betsy.',
    userStory: 'As a lead, I want a confirmation email with my private lead URL and password. As Betsy, I want an instant alert when any new lead lands so I can engage while interest is hot.',
    requirementDetail:
      'On POST /api/leads, the server fires sendLeadConfirmation() (to the lead) and sendNewLeadAlert() (to Betsy) in parallel — they do not block the API response. The confirmation includes the private URL + password and a data-handling notice. The Betsy alert includes the lead\'s email, name, phone, source, message, and a "View lead →" button. Both fire for new leads AND for activity on existing leads (so Betsy sees repeat engagement too).',
    businessRules:
      '- Both emails fire from the same address (email.fromAddress in config).\n- Sending failures are caught and logged but never crash the POST handler.\n- The Betsy alert respects config.email.notifyOnNewLead (admin can toggle off) and config.email.notifyTo (admin can override recipient).\n- The confirmation email is fire-and-forget; the API response always returns success so far as the lead row was created.',
    designSpec:
      'Confirmation email: navy / cream styled HTML with a code-style URL + password block, a friendly opening, and a "Data security disclaimer" footer. Betsy alert: structured table of {Email, Name, Phone, Source, Message} with a gold "View lead →" CTA button.',
    acceptanceCriteria:
      'Given I submit a contact form with my email\nWhen the request completes\nThen the API returns my publicId + URL + password\nAnd within ~1 second, my inbox receives the confirmation\nAnd within ~1 second, Betsy\'s inbox receives the new-lead alert.',
    processSteps: '1. Lead submits form → 2. Lead row created → 3. sendLeadConfirmation fires → 4. sendNewLeadAlert fires → 5. API responds → 6. Both emails delivered async.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 90,
    tags: ['email', 'notifications', 'leads'],
    externalRef: 'tasks #81, #82, commit 1fe487f',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  {
    capabilitySlug: 'email-infrastructure',
    title: 'Admin-configurable email identity + notification settings',
    summary: 'From-address, reply-to, and notification toggles editable in the Config panel — no code change needed.',
    userStory: 'As Betsy, I want to change the email identity my platform uses without redeploying, so I can adapt as my address strategy evolves.',
    requirementDetail:
      'The Config panel has an "Outbound Email Identity" card (fromName, fromAddress, replyTo) and a "New-Lead Notifications" card (toggle, override recipient, "Send test email" probe). All fields persist to config_state.email.* and are read by the email dispatch layer on every send. The "Send test email" button calls POST /api/config/test-email which dispatches a real message and returns the provider response inline.',
    businessRules:
      '- The from-name + from-address combine into "Name <email>" format for Brevo.\n- Reply-to is optional and defaults to from-address when absent.\n- The notifyOnNewLead toggle defaults to true if unset (lossy-fail-open for setup convenience).\n- The notifyTo address falls back to ADMIN_EMAIL env var when blank.',
    designSpec:
      'Inside admin → Config tab, two cards stacked. First: three labeled text fields (fromName, fromAddress, replyTo). Second: a toggle for notifications, a recipient field, and an inline diagnostic ("Send test email" with status feedback). Status messages: "✓ Sent via Brevo (id: ...)" or "✗ <error>".',
    acceptanceCriteria:
      'Given I change fromAddress in the Config panel and publish\nWhen a new lead submits a form\nThen the lead confirmation email\'s "from" header shows the new address.',
    processSteps: '1. Admin opens Config → 2. Edits identity fields → 3. Saves draft → 4. Publishes → 5. Next dispatch reads new values → 6. New emails use new identity.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['email', 'config', 'admin'],
    externalRef: 'task #115, commit 1fe487f',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── NET WORKS BANNER ─────────────────────────
  {
    capabilitySlug: 'net-works-network',
    title: 'Net Works opt-in banner on Salt Basin home page',
    summary: 'A horizontally-scrolling card row under the founder About section showing every opted-in member.',
    userStory: 'As Betsy, I want my home page to showcase the operators in my network — but only those who have explicitly opted in — so saltbasin.net feels alive and like a real community.',
    requirementDetail:
      'A new "netWorksBanner" block lives in the block registry. It fetches GET /api/member-site/featured which returns every member whose published config has featured.displayOnHome === true. Each member becomes a card with logo (or initials fallback), display name, optional company name, and a 1–2 sentence blurb, linking to /u/:slug. Empty state shows "Members start opting in soon" so the section never looks broken.',
    businessRules:
      '- A member appears only if they have a PUBLISHED config with displayOnHome true.\n- The card uses the member\'s logoUrl if set; otherwise renders the first two letters of their display name.\n- Cards link to /u/<slug>.\n- The banner section was injected into the live published Salt Basin home page via a one-shot script (scripts/inject-networks-banner.mjs) directly after the AboutIntro section.',
    designSpec:
      'Ivory/cream background, section with eyebrow "The Network", display heading "Salt Basin Net Works", gold rule line, intro paragraph, then a horizontal scroll row of 280px-wide cards. Each card has a 64x64 logo box at top, display name in Cormorant, optional company name in gold uppercase eyebrow style, 2-line blurb, and a "View profile →" footer in gold caps.',
    acceptanceCriteria:
      'Given there are no opted-in members\nWhen I visit saltbasin.net\nThen I see the section with a friendly empty-state message\n\nGiven a member toggles displayOnHome and publishes\nWhen I visit saltbasin.net\nThen their card appears in the banner.',
    processSteps: '1. Member sets displayOnHome=true + blurb + logo → 2. Publishes their config → 3. GET /api/member-site/featured includes them → 4. Banner renders their card → 5. Visitor clicks → 6. Lands on /u/:slug.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 120,
    tags: ['net-works', 'home-page', 'public', 'opt-in'],
    externalRef: 'task #128, commit c414102',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'net-works-network',
    title: 'Member opt-in card (logo, company name, blurb)',
    summary: 'Member Config panel: toggle to appear on Salt Basin home + fields for logo URL, company, blurb.',
    userStory: 'As a member operator, I want to control whether my profile appears on the Salt Basin home banner and what it says, so I am never surprised by being featured without consent.',
    requirementDetail:
      'In the member Config panel, a "Salt Basin Net Works Banner" card with a toggle (default off) and three text fields: company/brand name, logo URL (paste a public URL), short blurb. Changes only take effect when the member publishes their config — the live banner reads from published configs only.',
    businessRules:
      '- The toggle defaults to OFF for every new member — opt-in, never default-in.\n- Logo URL is a free-text public URL; the banner falls back to initials if blank or invalid.\n- The blurb is shown truncated to 2 lines via CSS line-clamp.\n- Changes do not affect the live banner until the member clicks Publish.',
    designSpec:
      'Member Config panel only. Card title: "Salt Basin Net Works Banner". Explainer line at top. Toggle row with help text. Three labeled text fields below. The toggle uses the existing Toggle component for visual consistency.',
    acceptanceCriteria:
      'Given I am a new member\nWhen I open my Config panel for the first time\nThen the "Show on Salt Basin home" toggle is off\nAnd my profile is not on the banner.\n\nGiven I toggle it on, fill in blurb + logo, and publish\nWhen Salt Basin home is loaded\nThen my card appears in the banner.',
    processSteps: '1. Member opens Config → 2. Toggles opt-in → 3. Sets company / logo / blurb → 4. Publishes → 5. Banner shows them.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['member', 'opt-in', 'net-works'],
    externalRef: 'task #127, commit c414102',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── PUBLIC SITE CONTENT ─────────────────────────
  {
    capabilitySlug: 'public-site-content',
    title: 'Founder-first hero with mission split',
    summary: 'About / Intro hero — left column the face of the founder, right column the Salt Basin mission and bullets.',
    userStory: 'As a visitor to saltbasin.net, I want to immediately see who Betsy is and what Salt Basin Net Works does, so I can decide in 10 seconds whether to engage.',
    requirementDetail:
      'The top of the home page is a two-column section. Left: eyebrow "Face of the Founder", her name in display type, title "Strategic Operator", photo placeholder, a short blurb, and two CTAs (View Resume / Get in Touch). Right: eyebrow "Salt Basin Mission · Short-Term Growth", a mission heading, mission body, three bullets, and a platform tagline.',
    businessRules:
      '- The hero is the first section on the home page, always status=live.\n- Bullets and CTA labels are editable via the admin Config and section field editors.\n- The photo block falls back to initials when no photoUrl is uploaded.\n- The hero is a "aboutIntro" block type — its own dedicated component for the founder-first composition.',
    designSpec:
      'Strategic Operator palette: navy background, cream text. Cormorant display name. Gold eyebrow text. Two-column grid that stacks on mobile. Gold rule between sections. Subtle background concentric rings as an atmospheric effect.',
    acceptanceCriteria:
      'Given I visit saltbasin.net\nWhen the page loads\nThen the first section is the founder + mission split\nAnd both columns are fully populated with admin-edited content.',
    processSteps: 'Hero is the first section in home page seed → Rendered as aboutIntro block → Visitor scrolls past to the rest.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 90,
    timeMinutes: 180,
    tags: ['home', 'hero', 'public'],
    externalRef: 'task #33',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'public-site-content',
    title: 'Industries × Domains wheel (interactive)',
    summary: 'An SVG wheel of industries that, when clicked, swaps in a dynamic dashboard for the chosen vertical.',
    userStory: 'As a visitor evaluating Betsy\'s experience, I want to see the industries she has worked across and click into specific verticals to see her actual track record there.',
    requirementDetail:
      'A custom SVG block (industryWheel) renders ~8 industries arranged on a wheel. Clicking an industry segment updates an adjacent panel with that industry\'s dynamic content: a client snapshot list, signature outcomes, and domain coverage. The categorized domains and niche solutions sit full-width below the wheel for browsing without interaction.',
    businessRules:
      '- Industries and per-industry content are all admin-editable via section fields.\n- The wheel scales with viewport width on mobile.\n- Default selected industry is the first in the list.\n- The niche-solutions panel below has three tabs (CPQ / Billing / Integration).',
    designSpec:
      'Wheel: navy circle on ivory background, gold spokes, industry labels in gold caps around the perimeter. Click an industry → it highlights gold and the side panel slides its content in. Niche Solutions below: ivory cards in three tabbed sections.',
    acceptanceCriteria:
      'Given I am on the home page\nWhen I click an industry on the wheel\nThen the side panel updates with that industry\'s client snapshot + outcomes\nAnd the selection persists until I click another industry.',
    processSteps: '1. Visitor sees wheel → 2. Clicks industry → 3. Panel updates with that industry\'s data → 4. Visitor scrolls to niche solutions → 5. Tabs through CPQ/Billing/Integration.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 95,
    timeMinutes: 360,
    tags: ['home', 'industries', 'interactive', 'public'],
    externalRef: 'tasks #23, #27-#32',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'public-site-content',
    title: 'Timeline + Case Studies + Technology blocks',
    summary: 'Three high-density blocks showing career arc, deep case studies, and tech stack expertise.',
    userStory: 'As a buyer evaluating Betsy for senior work, I want to see her career timeline, three to five concrete case studies, and her technology depth — so I can match her experience against my needs.',
    requirementDetail:
      'A "timeline" block shows 7 roles with click-to-expand detail per role. A "caseStudies" block renders 3 detailed case studies (situation / action / outcome). A "technology" block groups tools into "Hands-on" / "Integration Design" / "Adjacent Project Exposure" — with Salt Basin tech stack edits applied (NetSuite, NetSuite Zone Billing, Avalara, Adaptive Insights, Informatica moved to Integration; TIBCO BusinessWorks moved to Adjacent).',
    businessRules:
      '- Timeline roles expand independently — clicking one does not collapse others.\n- Case studies have a consistent SAO (Situation/Action/Outcome) format.\n- Technology tools are grouped by depth of expertise — buyers can see what is hands-on vs theoretical.\n- All three blocks are admin-editable via the section field editor.',
    designSpec:
      'Timeline uses a vertical gold rule with dot markers per role. Case studies render as full-width navy cards with gold rule dividers. Technology uses a grid of small tool chips with logo glyphs and group labels.',
    acceptanceCriteria:
      'Given I am on the consulting/founder page\nWhen I click a role in the timeline\nThen the role expands and shows context, impact, and references.\n\nGiven I scroll to case studies\nWhen the section is in view\nThen I see three case studies in SAO format.',
    processSteps: 'Visitor lands on consulting/founder page → Reads timeline → Clicks role to expand → Scrolls to case studies → Continues to technology block.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 90,
    timeMinutes: 300,
    tags: ['public', 'consulting', 'background'],
    externalRef: 'tasks #35, #36, #24, #116',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'public-site-content',
    title: 'References request flow',
    summary: 'A dedicated form on the public site that captures reference requests as leads with a routed CTA.',
    userStory: 'As a serious buyer who wants to talk to Betsy\'s prior clients, I want a clear, respectful path to request a reference, so I do not have to cold-email her or guess at the protocol.',
    requirementDetail:
      'A "referencesRequest" block on the consulting/founder page (or a dedicated /references page) presents the reference protocol ("released after a brief context check") and a form requesting requester name, email, optional company, and context. Submission flows through the standard /api/leads path with source="references" so the admin can filter to reference requests specifically and route accordingly.',
    businessRules:
      '- Reference requests are leads with source="references" — they participate in dedup like any other lead.\n- The form requires name + email; company and context are optional.\n- The submission triggers the same lead confirmation + Betsy alert email pipeline.\n- The CTA captures cta_location so admin can see exactly which page the request came from.',
    designSpec:
      'Two-column block. Left: eyebrow "References", display heading "Request to contact my references", body explaining the protocol. Right: a card form with Name, Email, Company (optional), Context textarea, Submit button. White card with gold top border.',
    acceptanceCriteria:
      'Given I am a buyer evaluating Betsy\nWhen I fill out the references request form and submit\nThen I see the standard lead confirmation modal with my URL + password\nAnd a lead with source="references" appears in the admin Leads list.',
    processSteps: '1. Visitor reads protocol → 2. Fills form → 3. Submits → 4. Lead created with source=references → 5. Lead receives confirmation email → 6. Betsy receives new-lead alert.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 90,
    tags: ['public', 'references', 'leads'],
    externalRef: 'task #112',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── OUTPUT PAGES ─────────────────────────
  {
    capabilitySlug: 'output-pages',
    title: 'Print-friendly Resume output page',
    summary: 'A standalone /output/resume page styled for clean print + PDF export, member-gated.',
    userStory: 'As a buyer who wants Betsy\'s resume as a portable artifact, I want a print/PDF-friendly view I can save and share, with the same content as on the site.',
    requirementDetail:
      'A dedicated /output/resume route that renders Betsy\'s resume in a print-friendly layout — proper page breaks, no nav chrome, single-column for paper, hidden interactive controls. Auth-gated: non-members see a teaser preview with "Become a Member" + "Sign In" CTAs; members see full content with a Print button. The full resume includes Industries Served + client snapshots + Technology stack.',
    businessRules:
      '- Non-members never see the full content — even via Print preview, only the teaser is rendered (no DOM-based bypass).\n- Members see a "✦ Member view" badge instead of the gated label.\n- The Print button is hidden when gated.\n- Print CSS suppresses background colors, fits one column, breaks cleanly between sections.',
    designSpec:
      'Ivory paper background. Cormorant Garamond display headings. Vertical timeline of roles. Industries served as a grid below the timeline. Client snapshots as bullet list. Tech stack as grouped chips. Footer with contact + URL. Print CSS: @media print suppresses navigation, gold-rule dividers, page-break-inside: avoid on each role.',
    acceptanceCriteria:
      'Given I am a member visiting /output/resume\nWhen I click Print\nThen the printable preview shows my resume cleanly fit to letter paper\nAnd no admin chrome, no Print button, no toast appears in the print.\n\nGiven I am NOT a member\nWhen I visit /output/resume\nThen I see only a teaser and CTAs to become a member.',
    processSteps: '1. Visitor opens /output/resume → 2. Auth check → 3. If member: full content + Print button → 4. If not: teaser + Sign In / Become a Member CTAs.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 180,
    tags: ['output', 'resume', 'print', 'auth-gated'],
    externalRef: 'tasks #109, #117, #118',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'output-pages',
    title: 'Proposal output (Diagnostic / Embedded / Advisory)',
    summary: 'Three engagement-shape proposal templates at /output/proposal/:type, deep-linked from service cards.',
    userStory: 'As a buyer interested in a specific engagement shape, I want a clean, structured proposal I can read or share with my team, so the path from interest to decision is shorter.',
    requirementDetail:
      'Three proposal templates: diagnostic-sprint, embedded-operator, advisory-retainer. Each renders as a member-gated print-friendly page at /output/proposal/<slug>. Content includes engagement summary, scope, deliverables, suggested cadence, illustrative pricing range. The service cards on the home page link directly to the matching proposal — buyers can drop into a proposal without contacting first.',
    businessRules:
      '- Auth-gated like Resume — non-members see teaser only.\n- Three slugs are hardcoded: diagnostic-sprint, embedded-operator, advisory-retainer.\n- Proposals are static for now — no scoping configurator yet (backlog item #121).\n- Each proposal includes a clear "Talk about this engagement" CTA that prefills source=proposal in the lead capture.',
    designSpec:
      'Same print-friendly chrome as Resume. Each proposal has a hero (engagement title, sub), a scope section, deliverables, cadence, and pricing range. Gold-rule dividers between sections. Page-break-friendly.',
    acceptanceCriteria:
      'Given I click "View Proposal" on the Diagnostic Sprint card\nWhen the proposal opens\nThen I see the diagnostic-sprint template populated\nAnd I can print it or come back to it later.',
    processSteps: '1. Visitor sees service card on home → 2. Clicks "View Proposal" → 3. Lands on /output/proposal/<slug> → 4. Auth check → 5. Member sees full proposal, non-member sees teaser.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 120,
    tags: ['output', 'proposal', 'sales'],
    externalRef: 'task #111',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'output-pages',
    title: 'Case Study + One-pager outputs',
    summary: 'Print-friendly /output/case-study/:slug and /output/one-pager pages for portfolio sharing.',
    userStory: 'As a buyer building a case for Betsy with my CEO, I want a one-pager I can drop into a deck and individual case studies I can attach to an email.',
    requirementDetail:
      'A /output/case-study/:slug template renders any of Betsy\'s case studies in full detail (Situation / Action / Outcome / Technology). A /output/one-pager template aggregates Services, Domains, Niche Solutions into a single high-density page suitable as a marketing one-pager. Both are member-gated and print-friendly.',
    businessRules:
      '- Auth-gated like other outputs.\n- One-pager intentionally fits on a single printed letter page (or close to it).\n- Case studies use the same SAO format as the home-page case studies block.\n- All output pages use the same OutputFrame wrapper for chrome consistency.',
    designSpec:
      'Case study: hero with case title, SAO sections separated by gold rules, technology footer. One-pager: header with Salt Basin wordmark, three-column body (Services / Domains / Niche), contact footer. Both designed to print cleanly.',
    acceptanceCriteria:
      'Given I am a member\nWhen I visit /output/case-study/some-slug\nThen I see that case study in full detail in a printable layout.',
    processSteps: '1. Buyer requests case study → 2. Member shares /output/case-study/:slug → 3. Buyer prints or downloads PDF → 4. Forwards to colleagues.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 150,
    tags: ['output', 'case-study', 'one-pager'],
    externalRef: 'tasks #110, #119',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── ADMIN EXPERIENCE ─────────────────────────
  {
    capabilitySlug: 'admin-experience',
    title: 'Admin sidebar + editor + preview pane',
    summary: 'Three-pane admin: sidebar of pages/sections, editor for the selected section, live preview of the page.',
    userStory: 'As Betsy editing content, I want to see my changes in context immediately, so I do not have to publish-and-check.',
    requirementDetail:
      'The admin "My Profile" / "My Site" tab shows a three-pane layout. Left: collapsible sidebar listing all pages, with each page expandable to its sections (status chips and delete affordances). Center: editor for the selected section\'s fields. Right: live preview of the selected page rendered via the same block library the public site uses. A view-mode toggle (Split / Edit Only / Preview Only) lets the admin focus.',
    businessRules:
      '- The preview reads from the draft state, not the published state — what you see is what would publish.\n- The sidebar collapses on mobile and auto-closes after selecting a page (so on phones the editor takes full width).\n- Status badges color-code: live=green, draft=neutral, soon=gold.\n- The Add Page modal lets admin set name, slug, type, and initial status.',
    designSpec:
      'Three vertical panes on desktop, stacked on mobile. Sidebar 240px navy. Editor in the center, ivory. Preview right pane, ivory + scroll. Sticky save bar at bottom across the editor + preview area.',
    acceptanceCriteria:
      'Given I am editing a section heading\nWhen I type\nThen the preview pane updates in real-time\nAnd I can still navigate to other pages without losing my unsaved changes (they persist until I leave or discard).',
    processSteps: 'Admin clicks page in sidebar → Section list shows → Clicks section → Editor + preview update.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 360,
    tags: ['admin', 'editor', 'preview'],
    externalRef: 'task #9',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'admin-experience',
    title: 'Net Works admin tab (member roster)',
    summary: 'Admin-only tab listing every signed-up member with email, slug, joined date, last activity, publish state.',
    userStory: 'As Betsy, I want to see every operator who has joined Salt Basin Net Works at a glance so I can track membership growth and outreach.',
    requirementDetail:
      'The "Net Works" tab fetches GET /api/members and renders a table-like card list of all member-role users. Each row shows email, slug (with code styling), joined date, last activity (relative time), and a published/draft-only badge. Stat chips up top show Total members / Published profiles / Joined this month. A search box filters by email or slug; a sort dropdown reorders by newest, oldest, recent activity, or A-Z.',
    businessRules:
      '- Admin-only — never visible to members.\n- Pulls from users table joined to member_profiles (slug + published flag).\n- Empty state messaging: "No members yet — when operators sign up via /signup, they show up here."\n- "View profile" link only appears when the member has published.',
    designSpec:
      'Centered max-width container, dark navy background. Top: large display heading "Net Works", description, stat chips. Filters: search + sort row. Member list as horizontal cards with email in cream display type, slug in gold mono, joined / last-activity in dusty gray, "Published" badge in green when applicable.',
    acceptanceCriteria:
      'Given I am admin\nWhen I open the Net Works tab\nThen I see every signed-up member as a card\nAnd I can search and sort the list.',
    processSteps: '1. Admin clicks Net Works tab → 2. Backend returns members list → 3. UI renders cards + stats → 4. Admin filters or clicks View profile.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 90,
    tags: ['admin', 'members', 'roster'],
    externalRef: 'task #79, commit 1fe487f',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'admin-experience',
    title: 'Mobile admin shell (collapsible sidebar, stacked panels)',
    summary: 'Admin is fully usable on phones — sidebar slides over, editor and preview stack vertically.',
    userStory: 'As Betsy traveling without a laptop, I want to edit my site from my phone, so urgent fixes never wait for me to get home.',
    requirementDetail:
      'CSS breakpoints in brand.css transform the admin shell on mobile: the sidebar becomes a slide-over panel triggered by a hamburger button, the three-pane layout collapses to a stacked one-column flow, the topbar buttons hide unnecessary actions, and the save bar becomes sticky at the bottom of the viewport.',
    businessRules:
      '- The hamburger button only appears on mobile (CSS-driven, no JS detection).\n- Selecting a page on mobile auto-closes the sidebar so the editor takes the full screen.\n- The View Public / Logout / Publish actions remain accessible on mobile but with compact styling.',
    designSpec:
      'Mobile breakpoint <768px. Hamburger icon left of the wordmark. Sidebar slides in from left with a semi-transparent backdrop. Stacked editor → preview. Save bar fixed bottom with safe-area inset.',
    acceptanceCriteria:
      'Given I am on a phone\nWhen I open /admin and log in\nThen I see the wordmark + hamburger\nAnd I can tap the hamburger to open the sidebar\nAnd I can edit a section and save.',
    processSteps: '1. Admin loads /admin on phone → 2. Sees compact shell → 3. Taps hamburger → 4. Picks page → 5. Sidebar closes → 6. Edits + saves.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 95,
    timeMinutes: 120,
    tags: ['admin', 'mobile', 'responsive'],
    externalRef: 'task #106',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── DEPLOYMENT INFRASTRUCTURE ─────────────────────────
  {
    capabilitySlug: 'deployment-infrastructure',
    title: 'Render (backend) + Netlify (frontend) hosting split',
    summary: 'Express + Postgres backend on Render; React + Vite frontend on Netlify; Netlify proxies /api/* to Render.',
    userStory: 'As the platform owner, I want the frontend to load instantly from a CDN and the backend to scale independently, so visitor experience is fast even when the backend is doing heavy work.',
    requirementDetail:
      'Frontend (dist/) is hosted on Netlify behind the saltbasin.net domain. Backend (Express API) runs on Render at saltbasin-website.onrender.com. Netlify\'s netlify.toml proxies any /api/* request from the browser to the Render origin, so the browser never sees the Render URL — same-origin cookies, no CORS, single user-facing host.',
    businessRules:
      '- All API calls go through saltbasin.net/api/* (Netlify) → Render — never directly to the Render URL from the browser.\n- Static assets and SPA routes are served by Netlify with the /* → /index.html catch-all for React Router.\n- The backend has a Supabase Storage upload abstraction so file URLs are absolute and bypass the proxy.',
    designSpec: 'Operational only.',
    acceptanceCriteria:
      'Given I visit saltbasin.net\nWhen the page loads\nThen Netlify serves the bundle\nAnd /api/site/published goes through Netlify\'s proxy to Render seamlessly.',
    processSteps: 'Visitor → Netlify CDN → If /api/*, Netlify proxies to Render → Backend responds → Netlify pipes back to browser.',
    status: 'deployed',
    priority: 'p0',
    workSplitClaude: 95,
    timeMinutes: 90,
    tags: ['infra', 'render', 'netlify', 'proxy'],
    externalRef: 'tasks #43-#48',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  {
    capabilitySlug: 'deployment-infrastructure',
    title: 'Render deploy monitor + auto-deploy verification',
    summary: 'GitHub Actions workflow watches Render deploys and auto-creates a GitHub Issue if a deploy fails or is skipped.',
    userStory: 'As the platform owner, I want to know immediately if a deploy fails or is silently skipped, so I do not discover the issue from a user.',
    requirementDetail:
      'Two GitHub Actions workflows: render-deploy-monitor.yml watches every push to main, queries the Render API to confirm a deploy was created, and waits for it to finish (success or fail). render-deploy-verify.yml runs on a delay to catch silently-skipped deploys (Render sometimes does not auto-queue if config did not change). On any failure, an Issue is auto-created with the deploy URL and last 50 lines of build log.',
    businessRules:
      '- Workflows must succeed on every push — they fail loud, not silent.\n- Auto-created Issues are labeled "deploy-failure" so they can be filtered.\n- The verify workflow runs ~5 min after push to catch the queue-failure case.\n- Secrets (RENDER_API_KEY, RENDER_SERVICE_ID) are stored as GitHub Actions repo secrets via the push-github-secrets.mjs script.',
    designSpec: 'CI-only.',
    acceptanceCriteria:
      'Given I push a commit with a syntax error in the server\nWhen Render fails to build\nThen the monitor workflow detects the failure\nAnd opens a GitHub Issue with the build log.',
    processSteps: 'Push to main → render-deploy-monitor polls Render API → On failure → GitHub Issue created.',
    status: 'deployed',
    priority: 'p2',
    workSplitClaude: 100,
    timeMinutes: 90,
    tags: ['ci', 'monitor', 'render', 'github-actions'],
    externalRef: 'task #97',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  {
    capabilitySlug: 'deployment-infrastructure',
    title: 'Netlify build.ignore + frontend-deploy approval gate',
    summary: 'Backend-only commits skip Netlify build automatically; frontend changes wait for explicit push approval.',
    userStory: 'As Betsy operating on a free Netlify tier, I want backend-only commits to never burn build credits, and I want approval over every frontend deploy so I am never surprised.',
    requirementDetail:
      'netlify.toml has a build.ignore script: `git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- src/ public/ index.html vite.config.js netlify.toml package.json package-lock.json` — exits 0 (skip) when no frontend-relevant files changed, exits non-zero (build) otherwise. Paired with a working agreement: Claude pushes backend commits freely (Render auto-deploys, Netlify auto-skips), but pauses to ask for approval before pushing any commit that would trigger a Netlify build.',
    businessRules:
      '- Backend-only paths (server/, scripts/, .github/, *.md) auto-skip Netlify.\n- Frontend-relevant paths (src/, public/, index.html, vite.config.js, netlify.toml, package*.json) always build.\n- Mixed commits should be split: backend first (pushes freely), frontend held for approval.\n- Approval prompt format: "Ready to push <files>. Triggers Netlify rebuild. Ok to push, or hold?"',
    designSpec: 'Workflow and CI only — no UI.',
    acceptanceCriteria:
      'Given I commit a change only to server/lib/email.js\nWhen Netlify webhook fires\nThen the build.ignore script exits 0 and Netlify skips the build\nAnd Render deploys the backend normally.',
    processSteps: '1. Claude commits → 2. Pushes to main (backend-only) or asks first (frontend) → 3. Netlify ignore script runs → 4. Skip or build accordingly.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 30,
    tags: ['ci', 'netlify', 'workflow', 'cost-management'],
    externalRef: 'commit abc94b1',
    ...DEPLOYED_BACKEND, ...REL_BACKEND,
  },

  // ───────────────────────── SECURITY & DATA ─────────────────────────
  {
    capabilitySlug: 'security-and-data',
    title: 'Admin password rotation tooling',
    summary: 'A scripted rotation that generates a strong password, updates the DB, syncs Render env, and writes a one-shot file.',
    userStory: 'As Betsy, I want a single command that rotates my admin password securely — DB hash, Render env, and local .env all updated atomically — so credential hygiene does not require me to remember N steps.',
    requirementDetail:
      'scripts/rotate-admin-password.mjs generates a 24-char strong password (alphanumeric without ambiguous chars, plus symbols), bcrypt-hashes it and UPDATEs users.password_hash for the admin row, rewrites ADMIN_INITIAL_PASSWORD in local .env, pushes the new value to Render via the Render API (preserving all other env vars), and writes the plain password ONCE to .admin-password-rotated-YYYY-MM-DD.txt (gitignored). Stdout never prints the value.',
    businessRules:
      '- The password is never echoed to stdout.\n- The plain value lands ONLY in .env, the Render env vars, and the one-shot file.\n- The one-shot file is gitignored via a hardcoded pattern.\n- The script is idempotent — re-running rotates again.',
    designSpec: 'CLI only — no UI.',
    acceptanceCriteria:
      'Given I run the rotate script\nWhen it completes\nThen my old password no longer authenticates\nAnd the new password works against /admin/login\nAnd the new value is in .env, Render env, and the rotated.txt file.',
    processSteps: '1. Run script → 2. New password generated → 3. DB hash updated → 4. .env rewritten → 5. Render env synced → 6. .txt file written → 7. Stdout reports success without leaking value.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['security', 'rotation', 'scripts'],
    externalRef: 'commit c4a6ca2',
    ...DEPLOYED_BACKEND, ...REL_INFRA,
  },

  {
    capabilitySlug: 'security-and-data',
    title: 'Data Notice page + inline disclaimers',
    summary: 'A standalone /data-notice page documenting data handling, with inline disclaimers on every form and upload.',
    userStory: 'As a visitor providing my email or uploading a file, I want to know what happens to my data, so I can make an informed choice.',
    requirementDetail:
      'A /data-notice route renders Betsy\'s data-handling stance in plain English ("Treat this platform like a LinkedIn DM until I have certified more"). The InlineDataNotice component is sprinkled above every form (Contact, Join Network, For Companies, Assessments, References, Lead view upload) with a "Full notice →" link to /data-notice. The footer of every page links to /data-notice.',
    businessRules:
      '- The /data-notice page is always accessible, regardless of pre-launch gate state.\n- The inline notice has two modes: light (on light backgrounds) and dark (on navy).\n- The compact prop reduces the notice to a single line; default is two lines.',
    designSpec:
      'Standalone page with ivory background, navy text, Cormorant headings. Sections: What I collect, How I use it, Who sees it, What I do not do, How to remove your data. Plain-English tone, no legalese.',
    acceptanceCriteria:
      'Given I am about to submit my email on the Contact form\nWhen the form renders\nThen I see a compact data notice above it\nAnd I can click "Full notice →" to see the standalone page.',
    processSteps: 'Visitor sees form → Reads inline notice → Optionally clicks through to /data-notice → Decides to submit or not.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['security', 'transparency', 'data-handling'],
    externalRef: 'tasks #67-#69',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── OBSERVABILITY ─────────────────────────
  {
    capabilitySlug: 'observability',
    title: 'Cold-start UX with branded loader',
    summary: 'Render free-tier cold starts (~20s) are handled with a branded loading screen instead of a blank flash.',
    userStory: 'As a visitor hitting the site after it has been idle, I want to see a branded loading state — not a white flash — so the first impression is professional even when the backend is waking up.',
    requirementDetail:
      'When the initial API fetches take more than ~300ms (cold-start signal), the public site renders a ColdStartLoader: Salt Basin Net Works wordmark, gold pulse dots, and after 3 seconds an explainer message acknowledging the cold start. UptimeRobot pings the backend every 13 minutes via the /api/health endpoint to minimize cold starts during business hours.',
    businessRules:
      '- The loader appears for any initial fetch, but the explainer text only after 3 seconds.\n- /api/health is a lightweight endpoint that exercises the DB (keeps Supabase warm) and returns within ~50ms when warm.\n- UptimeRobot is configured to ping every 13 minutes (just under Render\'s 15-min idle threshold).',
    designSpec:
      'Full-viewport navy background. Salt Basin wordmark in cream display type. Eyebrow "Net Works · Bottom Lines with a Rising Tide" in gold caps. Three pulsing dots in gold. Conditional explainer after 3s in dusty gray.',
    acceptanceCriteria:
      'Given the Render backend is cold\nWhen I visit saltbasin.net\nThen I see the branded loader within ~50ms\nAnd within 20-30s the site finishes loading.\n\nGiven the backend is warm\nWhen I visit\nThen the loader flashes for <500ms and is essentially invisible.',
    processSteps: '1. Visitor lands on saltbasin.net → 2. Bundle parses → 3. Initial API call → 4. If slow: loader visible → 5. If <500ms: loader invisible → 6. Site renders.',
    status: 'deployed',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 60,
    tags: ['ux', 'cold-start', 'loader', 'monitoring'],
    externalRef: 'task #99',
    ...DEPLOYED_ALL, ...REL_BOTH,
  },

  // ───────────────────────── REQUIREMENTS MGMT (this dashboard) ─────────────────────────
  {
    capabilitySlug: 'requirements-mgmt',
    title: 'Backlog dashboard with full-detail requirements',
    summary: 'Admin-only view of every feature built, organized by capability group, with editable details per card.',
    userStory: 'As Betsy, I want to see everything that has been built into saltbasin.net, why it was built, what it does, and where it is deployed — so I have a portfolio-grade record of the work.',
    requirementDetail:
      'A new "Backlog" tab in the admin shell (admin scope only) lists capability groups in a left sidebar, with seeded backlog items (this file) rendered as cards on the right. Each card shows title, capability tag, status badge, work-split %, and deploy chips (GitHub / Render / Netlify). Clicking a card opens a side drawer with the full requirement detail — user story, requirement, business rules, design spec, acceptance criteria, process steps — all editable inline. Save persists via PATCH /api/backlog/items/:id.',
    businessRules:
      '- Admin scope only — members never see the Backlog tab.\n- Initial seed is idempotent — runs only when both tables are empty.\n- Items can be created, edited, archived (soft-delete via status).\n- Defects (kind="defect") attach to a parent feature via parent_id.',
    designSpec:
      'Standard admin layout. Left: capability group nav with item-count badges. Right: card grid filtered by the active group (or "All"). Card: capability color chip on the left edge, title in display, summary, status pill, deploy chips. Drawer: right-side slide-over, full-height, sections for each detail field, edit/save at top.',
    acceptanceCriteria:
      'Given I am admin\nWhen I open the Backlog tab\nThen I see capability groups in the left nav\nAnd cards for every seeded item on the right\nAnd I can click a card to see and edit its full detail.',
    processSteps: '1. Admin opens Backlog tab → 2. If empty, seed runs → 3. Cards display → 4. Click card → 5. Drawer with detail → 6. Edit and save.',
    status: 'in_progress',
    priority: 'p0',
    workSplitClaude: 100,
    timeMinutes: 240,
    tags: ['backlog', 'requirements', 'admin', 'this-feature'],
    externalRef: 'tasks #134-#139',
    deployedGithub: false,
    deployedRender: false,
    deployedNetlify: false,
    deployRelevance: { github: true, render: true, netlify: true },
  },

  {
    capabilitySlug: 'requirements-mgmt',
    title: '[Future] Deployments view — GitHub / Render / Netlify correlation',
    summary: 'Per-requirement deploy state pulled live from the three systems, with a unified timeline.',
    userStory: 'As Betsy, I want to know exactly when each feature last shipped in each environment and whether the system was even relevant, so I do not waste time wondering if something has gone live yet.',
    requirementDetail:
      'A "Deployments" view inside the Backlog tab. Pulls commits + deploy events from GitHub (push events), Render (deploy history via /v1/services/:id/deploys), and Netlify (deploy history via the Netlify API). Per backlog item, shows a row of chips: GitHub commit SHA + date, Render deploy state, Netlify deploy state. A timeline tab shows the chronological deploy history across all systems.',
    businessRules:
      '- Each backlog item has a deploy_relevance JSON that marks which systems matter for that item — backend-only items show N/A for Netlify, not "not deployed".\n- Fresh data is pulled on demand (no background polling) to keep this lightweight.\n- API credentials are server-side only.',
    designSpec:
      'Inside Backlog tab, second sub-tab "Deployments". Top: refresh button + last-fetched timestamp. Body: list of backlog items, each row showing the deploy chips. Click into a row → detail panel with full deploy history per system. Color coding: green=live, gold=in-progress, gray=N/A, red=failed.',
    acceptanceCriteria:
      'Given I open the Deployments view\nWhen the data loads\nThen I see each backlog item with its current deploy state in each system\nAnd N/A is shown for systems that are not relevant to that item.',
    processSteps: '1. Admin opens Deployments view → 2. Backend fetches from GitHub / Render / Netlify APIs → 3. Correlates against backlog items by tag or external_ref → 4. Renders chips and timeline.',
    status: 'pending',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 0,
    tags: ['backlog', 'deployments', 'integrations', 'future-phase'],
    externalRef: 'Phase 2',
    deployedGithub: false,
    deployedRender: false,
    deployedNetlify: false,
    deployRelevance: { github: true, render: true, netlify: true },
  },

  {
    capabilitySlug: 'requirements-mgmt',
    title: '[Future] Test cases + test scripts + run logger',
    summary: 'Each deployed requirement gets test cases; each case has scripted steps; runs log pass/fail + create defects.',
    userStory: 'As Betsy, I want to run a test from this dashboard, log the result, and automatically open a defect if it fails — so my QA workflow is in one place, not spread across docs and spreadsheets.',
    requirementDetail:
      'Test cases attach to backlog_items (test_cases.backlog_item_id). Each case has scenario, user-role-to-log-in-as, data-setup prereqs. Test scripts are children of cases (test_scripts.test_case_id, sort_order) with step text, expected outcome, and verification method. The "Log test run" button records a test_runs row (status: pass/fail/blocked/skipped, notes). On status=fail, a backlog_item with kind=defect and parent_id=<the original requirement> is auto-created and prefilled with the failure context.',
    businessRules:
      '- Test cases can only attach to deployed requirements.\n- A test run is a permanent record — never edited or deleted.\n- Defect auto-creation copies the test scenario into the defect\'s requirement_detail so context is preserved.\n- Defects appear in the same Backlog dashboard, filterable by kind.',
    designSpec:
      'Inside Backlog tab, third sub-tab "Test Cases". Tree view: capability → requirement → test case → script steps. Right pane: run logger with pass/fail/blocked radio, notes textarea, "Submit run" button. On submit-with-fail: a defect-creation dialog pre-fills.',
    acceptanceCriteria:
      'Given I open a test case for the lead capture flow\nWhen I follow the scripted steps and click "Log test run" with fail\nThen a defect appears in the Backlog tied to the lead-capture requirement\nAnd the original test case shows the run history.',
    processSteps: '1. Admin opens Test Cases view → 2. Navigates to a case → 3. Follows scripted steps → 4. Logs run → 5. If fail: defect created and added to backlog.',
    status: 'pending',
    priority: 'p1',
    workSplitClaude: 100,
    timeMinutes: 0,
    tags: ['backlog', 'testing', 'qa', 'defects', 'future-phase'],
    externalRef: 'Phase 3',
    deployedGithub: false,
    deployedRender: false,
    deployedNetlify: false,
    deployRelevance: { github: true, render: true, netlify: true },
  },

  {
    capabilitySlug: 'requirements-mgmt',
    title: '[Future] Activity log: hours, tokens, issues encountered + resolutions',
    summary: 'A chronological view of everything that happened, time spent, tokens consumed, problems and how they were solved.',
    userStory: 'As Betsy preparing a portfolio piece or a case study, I want to see the narrative of what was built, when, with what tradeoffs, and where the rough spots were — so I have a defensible story.',
    requirementDetail:
      'An "Activity" view inside the Backlog tab. Three data feeds: (1) cumulative time per capability group, derived from backlog_items.time_minutes; (2) Anthropic token usage, ingested via a future-session integration; (3) a curated issue log (issue_log table) of bugs, blockers, dead-ends and how they were resolved — populated manually but seedable from this session\'s history.',
    businessRules:
      '- The issue log is append-only — entries are never deleted, only marked resolved.\n- Tokens are tracked per session (future integration with Claude Code\'s billing API or self-reported entries).\n- Hours are estimated, not tracked to the minute.\n- The view should read as a narrative, not a spreadsheet.',
    designSpec:
      'Inside Backlog tab, fourth sub-tab "Activity". Three sections: Time-by-capability summary chart, Token usage chart, Issue log timeline. Issue log entries are cards with problem statement, resolution, and references to related backlog items or commits.',
    acceptanceCriteria:
      'Given I open the Activity view\nWhen the data loads\nThen I see total hours spent grouped by capability\nAnd a list of issues encountered with their resolutions.',
    processSteps: 'Open Activity view → Browse summaries → Drill into specific issues or capabilities.',
    status: 'pending',
    priority: 'p2',
    workSplitClaude: 100,
    timeMinutes: 0,
    tags: ['backlog', 'activity', 'metrics', 'narrative', 'future-phase'],
    externalRef: 'Phase 4',
    deployedGithub: false,
    deployedRender: false,
    deployedNetlify: false,
    deployRelevance: { github: false, render: false, netlify: false },
  },
];

// Auto-populate cost_usd_claude on every item where it's not already set.
// Methodology documented on the build-summary output page.
for (const it of items) {
  if (it.costUsdClaude == null) it.costUsdClaude = cost(it.timeMinutes);
}

// ── Tier workarounds ──
// How we avoided needing to pay for upgraded tiers. Surfaced on the
// build-summary one-pager output.
const tierWorkarounds = [
  {
    capabilitySlug: 'email-infrastructure',
    product: 'Resend (transactional email)',
    tierAvoided: 'Resend paid tier + dedicated DNS host',
    monthlySavings: 19,
    problem:
      'Resend\'s domain verification requires an MX record on a subdomain (e.g. send.saltbasin.net) so they can handle bounce notifications. Wix DNS — which hosts saltbasin.net\'s DNS records — does not allow MX records on subdomains, only at the apex. Apex MX was already taken by Zoho for inbound mail. Resend therefore could not be verified on Wix DNS at any tier.',
    solution:
      'Switched to Brevo (formerly Sendinblue), whose modern verification uses CNAME-based DKIM and a Brevo-domain return-path — no subdomain MX requirement. Brevo\'s free forever tier (9K emails/month) covers the foreseeable volume, vs Resend\'s 3K. Code refactor was small (parseFrom helper, payload reshape, header rename).',
  },
  {
    capabilitySlug: 'email-infrastructure',
    product: 'Zoho Mail (mailbox)',
    tierAvoided: 'Google Workspace ($6/user/month) or Microsoft 365 ($6/user/month)',
    monthlySavings: 6,
    problem:
      'A professional consulting brand needs a real custom-domain mailbox (betsy@saltbasin.net) for receiving lead replies, not a Gmail forward. Standard paid options are $6/user/month minimum, which adds up across an opt-in member network.',
    solution:
      'Used Zoho Mail\'s Forever Free Plan — custom-domain mailbox, 5GB storage, 1 user, web access only (no IMAP/POP — accept that constraint). Setup is the same standard SPF/DKIM/MX flow as paid providers. Trade-off: members would each need their own paid mailbox eventually, but for the founder identity Zoho free is fully sufficient.',
  },
  {
    capabilitySlug: 'deployment-infrastructure',
    product: 'Render (backend hosting)',
    tierAvoided: 'Render Starter / Pro ($7-25/mo)',
    monthlySavings: 25,
    problem:
      'Render\'s free tier spins down after 15 minutes of inactivity, causing 20-30 second cold starts on the next visitor. For a consulting brand site, a 20s blank screen is a brand-killer.',
    solution:
      'Two layers: (1) a branded ColdStartLoader component renders immediately with the Salt Basin wordmark and pulse dots so the brand is visible during the cold start, with an explainer message after 3s. (2) UptimeRobot pings /api/health every 13 minutes (under Render\'s 15-min idle threshold), keeping the container warm during business hours. Combined: cold starts are rare and when they happen, the experience is branded not broken.',
  },
  {
    capabilitySlug: 'deployment-infrastructure',
    product: 'Netlify (frontend hosting)',
    tierAvoided: 'Netlify Starter ($19/mo) or Pro tier',
    monthlySavings: 19,
    problem:
      'Iterative development with many small commits exhausts Netlify\'s free-tier build minutes (300/mo) quickly. When credits run out, Netlify blocks ALL deploys — both automated CI and manual CLI/drag-drop — until the next billing cycle.',
    solution:
      'Two mitigations: (1) Added a build.ignore script to netlify.toml that exits 0 (skip) when git diff finds no changes in frontend-relevant paths (src/, public/, index.html, vite.config.js, netlify.toml, package*.json) — backend-only commits stop burning credits. (2) Adopted an explicit-approval workflow: Claude asks before pushing any commit that would trigger a Netlify build, so frontend changes get batched. Future option: migrate to Cloudflare Pages (free, unlimited builds) when the next batch of frontend changes is ready.',
  },
  {
    capabilitySlug: 'deployment-infrastructure',
    product: 'Supabase (Postgres + Storage)',
    tierAvoided: 'Supabase Pro ($25/mo)',
    monthlySavings: 25,
    problem:
      'Render\'s free tier does not include persistent disk for the backend container. Files (image uploads, SQLite databases) would be wiped on every deploy or restart.',
    solution:
      'Migrated all persistent state to Supabase\'s free tier: Postgres for the relational data (500MB), Storage for image uploads (1GB), with absolute URLs returned by the upload endpoint so the browser fetches images directly from Supabase\'s CDN (no proxy through Render). Free tier limits are well above current needs.',
  },
  {
    capabilitySlug: 'observability',
    product: 'GitHub Actions (CI / deploy monitoring)',
    tierAvoided: 'A paid CI provider or self-hosted runner',
    monthlySavings: 10,
    problem:
      'Render does not surface deploy failures clearly. A silent skipped auto-deploy is easy to miss until the next deploy unintentionally batches the missed change.',
    solution:
      'Built two GitHub Actions workflows that run on the free tier (2,000 min/mo for public repos): render-deploy-monitor watches every push to main, polls the Render API, and creates a GitHub Issue with the build log on any failure. render-deploy-verify runs ~5 min after push to catch silently-skipped deploys. Cost: $0; coverage: every deploy.',
  },
];
