// Curated release log for Salt Basin Net Works.
//
// Each entry groups what shipped together, with the "voice" of release notes
// rather than commit messages. Surface via GET /api/backlog/patch-notes
// and rendered at /output/patch-notes.
//
// Newest releases LAST in the array (the API returns reversed so consumers
// see newest first). Keeps the diff small when appending.

export function patchNotes() {
  return RELEASES;
}

const RELEASES = [
  // ─────────────────────── v0.1 — Foundation ───────────────────────
  {
    version: 'v0.1',
    name: 'Foundation',
    date: '2026-06-03',
    summary:
      'First commits land. The Salt Basin Net Works CMS goes from idea to a working two-state (draft / published) admin scoped behind a bcrypt-hashed login, served from an Express + Postgres backend on Render and a React + Vite frontend on Netlify.',
    sections: [
      {
        heading: 'New',
        items: [
          'Multi-page CMS with draft / publish workflow',
          'Block library: hero, cards, two-column, contact, scripture, text, CTA',
          'Strategic Operator brand tokens (navy / gold / cream palette, Cormorant + Inter type)',
          'Password-protected pre-launch landing gate',
          'Admin sidebar + editor + live preview (split-view default)',
        ],
      },
    ],
  },

  // ─────────────────────── v0.2 — Public site ──────────────────────
  {
    version: 'v0.2',
    name: 'Founder-First Public Site',
    date: '2026-06-04',
    summary:
      'The public-facing Salt Basin home page comes together. Hero rebuilt around the founder + mission split, the Industries × Domains wheel ships, services and case studies land, mobile responsiveness throughout.',
    sections: [
      {
        heading: 'New',
        items: [
          'About / Intro hero: face-of-the-founder + Salt Basin mission split',
          'Industries × Domains interactive SVG wheel with per-industry dashboards',
          'Niche Solutions panel with CPQ / Billing / Integration tabs',
          'Timeline block (7 roles, click-to-expand)',
          'Case Studies block (3 detailed SAO studies)',
          'Technology Experience block (Hands-On / Integration / Adjacent groupings)',
          'Join the Network + For Companies CTA sections',
          'Mobile responsive layout, hamburger nav',
          'Cold-start branded loader (Render free-tier UX)',
        ],
      },
    ],
  },

  // ─────────────────── v0.3 — Lead capture + outputs ───────────────
  {
    version: 'v0.3',
    name: 'Lead Capture & Outputs',
    date: '2026-06-05',
    summary:
      'Forms become real leads. Each lead gets a private password-protected URL. The first round of print-friendly output pages ships (resume, proposal, case study, one-pager) — member-gated with teaser previews for non-members.',
    sections: [
      {
        heading: 'New',
        items: [
          'Lead capture from every public form with match-and-merge dedup on email + phone',
          'Per-lead private record at /lead/<publicId> behind a bcrypt password',
          'Lead-to-member conversion path (pre-fill signup with lead context)',
          'Print-friendly Resume / Case Study / Proposal / One-Pager output pages',
          'Auth gate: non-members see teaser, members see full content + Print/PDF',
          'References request flow (separate lead source, dedicated form)',
          'Data Notice page + inline disclaimers on every form',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Resume output now includes Industries Served + client snapshots + tech stack',
          'Tech stack edits: NetSuite + Zone Billing + Avalara + Adaptive + Informatica moved to Integration Design; TIBCO BW moved to Adjacent Exposure',
        ],
      },
    ],
  },

  // ─────────────────── v0.4 — Multi-tenant CMS ─────────────────────
  {
    version: 'v0.4',
    name: 'Multi-Tenant CMS',
    date: '2026-06-05',
    summary:
      'Every member operator gets the same multi-page admin Betsy uses, scoped to their own data. Brand colors per member. Net Works opt-in banner on the Salt Basin home page that surfaces opted-in operators automatically.',
    sections: [
      {
        heading: 'New',
        items: [
          'AdminShell takes a `scope` prop — same shell powers admin + every member',
          'Member sites have their own draft + published JSON in `member_sites`',
          'Member Config: brand colors, Net Works opt-in (logo + blurb + company name), BYO Anthropic API key slot',
          'Default 3-page starter site (Home / About / Contact) seeded on first member visit',
          'NetWorksBanner block on Salt Basin home page — horizontal-scroll cards of opted-in members',
          'Salt Basin admin gets a Net Works tab listing every signed-up member',
        ],
      },
    ],
  },

  // ────────── v0.5 — Email infrastructure (Zoho + Brevo) ───────────
  {
    version: 'v0.5',
    name: 'Email Infrastructure',
    date: '2026-06-05',
    summary:
      'Outbound email goes from console-stubbed to fully delivered. Custom-domain mailbox at betsysalter@saltbasin.net (Zoho Free). Lead confirmations + Betsy alerts on every submission. Switched provider mid-build when Resend collided with Wix DNS limits.',
    sections: [
      {
        heading: 'New',
        items: [
          'Zoho Mail Forever Free Plan for betsysalter@saltbasin.net',
          'Lead confirmation emails (URL + password) sent on every submission',
          'Betsy alert emails on every new lead AND repeat activity',
          'Admin Config panel: Outbound Email Identity + New-Lead Notifications cards',
          'Inline "Send test email" probe button',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Email provider: Resend → Brevo. Wix DNS does not allow subdomain MX records (Resend requires send.<domain>); Brevo uses CNAME-based DKIM at the apex — no subdomain MX needed',
          'config.email.fromAddress now reads from the published config (admin-editable)',
        ],
      },
    ],
  },

  // ─────────────── v0.6 — Backlog dashboard ────────────────────────
  {
    version: 'v0.6',
    name: 'Admin Backlog',
    date: '2026-06-05',
    summary:
      'A real product-management dashboard inside the admin. Every feature shipped becomes a backlog item with full user story / requirement detail / business rules / design spec / acceptance criteria. Tier-cost workarounds documented as their own card type.',
    sections: [
      {
        heading: 'New',
        items: [
          'Admin Backlog tab (admin-only): capability groups left rail, requirement cards right',
          '35 requirements seeded covering all work to date, organized into 12 capability groups',
          '6 tier workarounds documented (Resend → Brevo, Zoho Free, Render Free + UptimeRobot, Netlify credit lock, Supabase Free, GitHub Actions Free)',
          'Side drawer for each requirement: fully editable user story / requirement / rules / spec / criteria / process steps',
          'Tech stack per capability + cost estimates per requirement',
        ],
      },
    ],
  },

  // ─── v0.7 — Backlog enhancements + 3 outputs ─────────────────────
  {
    version: 'v0.7',
    name: 'Backlog Enhancements + 3 Outputs',
    date: '2026-06-05',
    summary:
      'Per-person split (Betsy hours vs Claude hours, Betsy activities vs Claude activities) replaces the simple work-split slider. Live capability-group rollups. New Outputs catalog inside the Backlog tab linking to three print-friendly reports including a pre-AI cost comparison.',
    sections: [
      {
        heading: 'New',
        items: [
          'Per-person split: hours_betsy / hours_claude / activities_betsy / activities_claude (replaces single work-split %)',
          'Live capability rollups — switching groups in the left rail re-aggregates the metric chips for that scope',
          'Outputs catalog inside Backlog → Outputs sub-tab',
          'Tech Stack Architecture output (5-layer architecture diagram + per-capability tech mapping)',
          'Marketing Product One-Pager output (Salt Basin Net Works positioning, three pillars, capability inventory)',
          'Build Progress Report output (now with pre-AI cost comparison @ $150/hr × 2.5× effort multiplier + delivery timeline)',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'BacklogDrawer replaces single work-split slider + time-minutes input with a 2×2 PersonInput grid',
        ],
      },
    ],
  },

  // ─── v0.8 — JIRA + Templates + Scrum Agent + admin polish ────────
  {
    version: 'v0.8',
    name: 'JIRA + Templates + Scrum Agent + Admin Polish',
    date: '2026-06-06',
    summary:
      'Three new tracks land in parallel: JIRA Cloud read-only import wired up; three curated member templates seeded; the Scrum Agent goes live as a chat panel docked inside the Backlog tab (Phase A scaffold — Claude-powered, no tools yet). Plus a focused round of admin UX polish.',
    sections: [
      {
        heading: 'New',
        items: [
          'JIRA Integration (Phase A · read-only pull): Config card → save credentials → Test → Import. Issues land in a new "JIRA Mirror" capability group with status/priority/type mapped',
          'Member Templates Phase A: Operator Profile / Consulting Practice / Coach-Speaker starters seeded (gallery UX next session)',
          'Scrum Agent Phase A: floating ✦ button in Backlog opens a docked chat panel. Real Claude responses with conversation persistence in localStorage. Propose-and-approve tools wire in Session 3',
          'Salt Basin admin brand palette card (with Reset to defaults). Edits flow through publicConfig → saltbasin.net recolors',
          'Date pickers for date-shaped resume fields (start / end / since / until / etc.) — was free-text',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Split view is now drag-resizable with a gold-tinted divider. Double-click resets to 55/45',
          'Persisted split ratio per browser, separately for admin vs member scope',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'Brand colors were invisible to admin — the card was wrapped in `{isMember && ...}`. Now visible (and functional) for both scopes',
          'TDZ crash in AdminShell: split-view useEffect depended on `sidebarOpen` declared further down → blank admin page on first load. Hook order reordered with inline comment to prevent regression',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New schema: jira_config, member_templates, agent_threads, agent_messages, plus brand_kit + tech_stack columns on existing tables',
          'ANTHROPIC_API_KEY pushed to Render env so Scrum Agent calls Claude directly',
        ],
      },
    ],
  },

  // ─── v0.9 — QA system + data-driven admin nav + audit log ─────────
  {
    version: 'v0.9',
    name: 'QA System, Audit Log, and a Data-Driven Admin',
    date: '2026-06-07',
    summary:
      'The admin grows up. A new QA tab lets the admin author test scenarios for every deployed feature, run them step-by-step, and have failed steps auto-create defect backlog items linked back to the failing scenario. Every mutation across the QA and backlog routes lands in a new audit_events log so nothing gets changed silently. The admin tabs themselves reorganize into "Platform Lifecycle Management" and "Customer Relationship Management" views — and the whole nav structure now lives in config_state rather than hardcoded JSX, so future relabels and reorderings happen without a code push.',
    sections: [
      {
        heading: 'New',
        items: [
          'QA tab (under Platform Lifecycle Management): author test scenarios tied to deployed backlog items, with ordered steps capturing action + expected outcome',
          'Log Test Run modal: per-step pass / fail / blocked verdicts with notes and evidence URLs, environment selector (test vs prod), overall notes',
          'Auto-defect creation: any failed step spawns a kind="defect" backlog item parented to the scenario\'s primary feature, with the failing step\'s evidence carried into the defect summary',
          'Multi-select linked features on a scenario — one scenario can cover multiple deployed features, with one marked as "primary" (the parent for auto-defects)',
          'Audit log: every create / update / delete on QA and backlog routes writes a row in audit_events with before/after JSONB, the source (manual_ui / brain_dump / bulk_script / jira_sync / seed), and the actor',
          'Admin nav reorganized into views: Content, Platform Lifecycle Management (Backlog + QA), Customer Relationship Management (Leads + Net Works), and System (Config)',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Admin nav structure is now data-driven from config_state["admin_nav"] — labels, grouping, order, and presence can change without touching code (the component identities stay in a small in-code registry, since React components can\'t be loaded from JSON)',
          'Native <option> dropdowns are now legible on dark OS themes (global color rule in brand.css)',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New tables: test_scenarios, test_scenario_steps, test_runs, test_run_step_results, test_scenario_features (junction), audit_events',
          'backlog_items gets a test_scenario_id column for back-navigation from a defect to the scenario that surfaced it',
          'Optimistic concurrency on PATCH /api/qa/scenarios via expectedUpdatedAt: writes can\'t silently overwrite changes that happened between read and apply',
          'Default admin_nav structure seeded into config_state at bootstrap if missing; deleting that row and rebooting re-seeds it',
        ],
      },
    ],
  },

  // ─── v0.10 — Pre-onboarding fixes: My Profile + dynamic resume ────
  {
    version: 'v0.10',
    name: 'Pre-onboarding fixes — My Profile and dynamic resume',
    date: '2026-06-07',
    summary:
      'Targeted fixes ahead of inviting members. The primary editing surface is "My Profile" again — the v0.9 nav refactor obscured the use case with the generic label "Content / My Site". The Config tab opens with an explanation card so newcomers know what each section configures. Resume now uses a dynamic add/remove list — members can have as many roles as their careers need, with start/end dates and a "Current" toggle.',
    sections: [
      {
        heading: 'Fixed',
        items: [
          '"Content" / "My Site" → "My Profile" everywhere: seeded nav, hardcoded member tab strip, and a one-shot migration that relabels the existing config_state.admin_nav row in production without touching any manual nav edits',
          'Config tab top of panel: new intro card explains what Config is for (member: "how your profile looks and where it links to"; admin: "platform-level saltbasin.net configuration"), distinguishing it from My Profile (content)',
        ],
      },
      {
        heading: 'New',
        items: [
          'Resume roles: dynamic add/remove list. Each role has title, company, start date, end date or "Current", and a description. Up/down to reorder, × to delete. No more 2-slot limit',
          'scripts/add-tonight-defect-items.mjs records the five bugs flagged tonight as kind="defect" backlog items with full requirement detail and acceptance criteria — three completed, two pending follow-up',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'ResumeBlock renderer accepts both shapes: new f.roles array (preferred) and legacy f.role1/f.role1Desc keys (fallback) so existing member data keeps rendering until next edit',
          'EditorPane gained array-aware field detection: when a section field is an array (today: roles), a dedicated list editor renders instead of the default string input. Pattern generalizes to domains and service cards in the next pass',
        ],
      },
    ],
  },

  // ─── v0.11 — Real member sign-up: convert, reset, recover, captcha ──
  {
    version: 'v0.11',
    name: 'A real member sign-up process',
    date: '2026-06-07',
    summary:
      'The end-to-end sign-up loop a real human would use, end to end. A lead viewing their own record can convert to a member in one click (with a password re-entry confirmation) and lands in the member dashboard auto-signed-in. The Sign In button on the public site goes to a generic /login page instead of /admin/login. That page now also lets people reset a forgotten password and recover the email they signed up with. All of these flows have reCAPTCHA v3 wiring in place — the code is a no-op until you register a site key and paste the secret into Render env, then captcha kicks in everywhere at once.',
    sections: [
      {
        heading: 'New',
        items: [
          'POST /api/leads/public/:publicId/convert — authed lead promotes themselves to a member without re-entering anything but a password confirmation. Lead password_hash is reused as the new user password_hash (no re-hash). Lead row persists with converted_user_id set so all prior context (emails, activity, merged-from history) stays queryable',
          'LeadView "I know you love it — go ahead and convert to member" CTA card with a password-confirm modal',
          '/login as the canonical generic sign-in URL. /admin/login still works as a back-compat alias',
          'Forgot password? flow on the sign-in page → enter email → email with a single-use 1-hour reset link → /reset/:token page with new password + confirmation',
          'Forgot your email? flow on the sign-in page → enter phone → email gets sent to the address on the lead with that phone reminding them which email to use',
          'reCAPTCHA v3 wired into signup, lead→member convert, password reset request, and email recovery. Skipped at runtime when RECAPTCHA_SECRET_KEY isn\'t set, so safe to ship before keys are registered',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Sign-in page redirects post-login based on role: admin → /admin, member → /member. A ?next= URL param (same-origin only) overrides this',
          'Sign-in page title is "Sign In" (not "Admin Login") since members use the same page',
          'Password reset deletes all existing sessions for the user as a precaution — anyone signed in elsewhere will need to re-sign-in with the new password',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New password_reset_tokens table: token (random 32-byte hex), user_id, expires_at, used_at, created_at. Used tokens for the same user are bulk-invalidated when one is consumed (defensive against concurrent requests)',
          'Email recovery walks leads.phone → leads.converted_user_id → users.email; phone is normalized to digits-only to match the existing lead-capture convention',
          'Both recovery endpoints always return 200 regardless of whether a record matched, to defeat email + phone enumeration',
          'reCAPTCHA scaffolding (server/lib/recaptcha.js + src/lib/recaptcha.js) reads env vars: VITE_RECAPTCHA_SITE_KEY (Netlify, frontend), RECAPTCHA_SECRET_KEY + optional RECAPTCHA_MIN_SCORE (Render, backend). To turn it on: register a v3 site at https://www.google.com/recaptcha/admin, paste both keys into the respective dashboards, redeploy',
          'reCAPTCHA NOT yet applied to the lead-capture endpoint — needs each of the public lead-capture form blocks (Join the Network, For Companies, contact, assessments) to send a token first. Tracked as a follow-up on task #28',
        ],
      },
    ],
  },

  // ─── v0.12 — Field settings, 9 new blocks, section templates ─────
  {
    version: 'v0.12',
    name: 'Field Settings, New Block Library, and Section Templates',
    date: '2026-06-09',
    summary:
      'Every content field in every section now has a full settings panel: visible/hidden, auditable edit history, field type (13 options), predefined value sets for select/multi-select, and cascading/dependent field rules. Nine new block types ship — drawn directly from the PPTX visual references — giving the CMS the ability to produce KPI dashboards, roadmaps, status heatmaps, leaderboards, executive summaries, app mockups, choice grids, interactive decision trees, and an AI-powered drag-and-drop output generator. Section creation is now a two-step visual modal: pick a template from a card grid, then name and configure it. The sidebar section list scrolls independently so the "+ Add Section" button is always pinned and visible.',
    sections: [
      {
        heading: 'New — Field Settings System',
        items: [
          'Every field in every section now has a ⚙ Settings tab: visible/hidden toggle, auditable toggle (captures before/after edit history), field type selector (text, textarea, number, date, boolean, select, multiselect, URL, email, JSON, image, color, richtext), predefined value set editor for select/multiselect types, description/hint field',
          'Source tab (existing source type system, now tab-organized) — user_input / merged / derived / direct with merge path and capability tags',
          'Cascade tab — define rules so selecting a value in one field filters the allowed options of a downstream field (dependent dropdowns)',
          'Clone (⧉) and Remove (✕) controls on every field row',
          '+ Add Field button at the bottom of each section to create new custom fields inline',
          'field_audit_log table + POST/GET /api/field-audit route — any field with auditable: true silently logs user + before/after value on every save',
        ],
      },
      {
        heading: 'New — Block Types (9)',
        items: [
          'KPI Dashboard — pastel metric panels grid; each panel has value, change indicator, caption, and custom color',
          'Roadmap — horizontally scrollable timeline with gradient-colored milestone nodes and status pills (complete / in-progress / planned / blocked)',
          'Status Heatmap — color-coded row × column status matrix (green/yellow/red/blue/teal cells) with auto-generated legend',
          'Leaderboard — ranked list with gold/silver/bronze highlights, optional avatars, value and change delta per entry',
          'Executive Summary — two-column layout with accent-colored stat cards on the left and a contact/info card on the right',
          'App Mockup — phone / tablet / browser frame with gradient fill and screen content or images; supports multi-screen side-by-side',
          'Choice Grid — interactive colored option tiles; click a tile to expand it with a CTA link',
          'Decision Tree — interactive YES/NO branching flowchart; click branches to navigate, Reset button clears state',
          'Output Generator — drag-to-reorder content block palette, output type selector (resume / executive bio / cover letter / LinkedIn summary / one-pager / proposal intro), audience/job-description textarea, AI-powered Generate button that calls the member agent endpoint',
        ],
      },
      {
        heading: 'New — Section Template Modal',
        items: [
          'Replacing the old plain-text section form: "+ Add Section" opens a 2-step visual modal',
          'Step 1: card grid of 15 pre-built templates (Blank, Hero, KPI Dashboard, Roadmap, Executive Summary, Heatmap, Leaderboard, App Mockup, Choice Grid, Decision Tree, Output Generator, Cards, Two Column, Timeline, Stat Grid, CTA) — each with icon, description, and default column count',
          'Step 2: name the section, set columns (1–4), choose background, set visibility — then seed fields are pre-filled from the template',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'Sidebar section list now scrolls independently — the "+ Add Section" button is pinned to the bottom of the sidebar and is always visible regardless of how many sections exist',
          'Pages list and section label stay fixed; only the section rows scroll',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New table: field_audit_log (user_id, section_id, field_key, before_value, after_value, created_at)',
          'New route file: server/routes/fieldAudit.js — POST logs an audit entry, GET retrieves history by sectionId and optional fieldKey',
          'New component: src/components/admin/SectionTemplateModal.jsx (15 templates, 2-step flow)',
          'blocks/index.jsx grew from 3649 → ~5400 lines with 9 new block components + STATUS_PILL helper',
          'REGISTRY expanded from 26 → 35 block types; BLOCK_TYPES export auto-derives from REGISTRY so no separate update needed',
          'addSection() in AdminShell now accepts columns + pre-seeded fields from the template instead of the old hardcoded type-switch logic',
        ],
      },
    ],
  },

  // ─────────────────────── v0.13 — Resume, Templates & Profile Depth ───────────────────────
  {
    version: 'v0.13',
    name: 'Resume, Templates & Profile Depth',
    date: '2026-06-09',
    summary:
      'Major expansion of member profile capabilities: categorized section template modal, career resume page seeded by default, "My Resume" member app with preset builder and AI interpreter, expanded case study + client snapshot blocks, Skills + Industry Wheel + Career Timeline templates, configurable section action buttons, and a generic member JSON store for future extensibility.',
    sections: [
      {
        heading: 'New — Template Categories',
        items: [
          'Section template modal rebuilt: flat grid replaced by a 4-category sidebar (General, Member Profile, Org Profile, Project Management)',
          'General: Blank, Hero, Two Column, CTA, Stat Grid',
          'Member Profile: Career Timeline, Case Studies, Client Snapshot, Skills, Technology, Industry Wheel, Executive Summary, Services/Offerings, Resume Block',
          'Org Profile: Company Timeline, Roadmap, Product Mockup, Team/Leaderboard',
          'Project Management: KPI Dashboard, Status Heatmap, Project Timeline, Feature Cards, Decision Tree, Output Generator',
          'Each category has a tab count and its templates include updated default field seeds tailored to their use case',
        ],
      },
      {
        heading: 'New — My Resume',
        items: [
          'New "My Resume" tab in the member admin shell (next to My Profile)',
          'Resume preset builder: create named presets by checking which pages/sections to include in a given resume variant',
          'Primary preset designation — the primary resume is the publicly downloadable version on the member\'s profile page',
          'Public download link displayed in the panel once a primary preset is configured',
          'Resume interpreter agent: paste any job description and the AI returns a tailored professional summary, top skills to highlight, experience bullet rewrites, and gap analysis',
          'Copy-to-clipboard and direct link to the resume output renderer',
        ],
      },
      {
        heading: 'New — Resume Page Default',
        items: [
          'New member sites are seeded with a "Resume" page out of the box (in addition to Home, About, Contact)',
          'The Resume page includes: Resume Hero section (navy, with Download PDF + Contact CTA), Career Timeline, Role Detail (dynamic roles list), and Skills',
          'All role and skill entries are fully editable from the member admin',
        ],
      },
      {
        heading: 'New — Block & Editor Improvements',
        items: [
          'Skills block: skill groups with category headings, name, proficiency level (expert/proficient/familiar), and years — rendered as colored chips',
          'Client Snapshot block: per-client inputs for industry, employer sponsor, capabilities delivered/touched, technology delivered/touched, revenue range, and tags; rollup view groups by industry, capability, or revenue',
          'Case Studies block: expanded to 8 structured fields per case (clientSummary, problemStatement, kpiImprovement, methodsTaken, challenges, impact, feedback, tags) with accordion expand in both editor and public view',
          'Career Timeline configurable actions — no longer hardcoded to "View Resume"; CTA buttons set via the Section Actions editor',
          'Section Actions card visible for every section in the editor — add, edit, and remove CTA buttons (label, href, style)',
          'Photo/media upload support in any section via + Add Photo Field in the editor Content Fields card',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New table: member_json_store (user_id, key, data, updated_at) — generic key-value store for member settings that don\'t fit the draft/published content model',
          'New API: GET/PUT /api/members/me/resume-presets persists preset JSON to member_json_store key="resume_presets"',
          'New component: src/components/admin/MyResumePanel.jsx',
          'defaultMemberSite.js updated: Resume page added as 3rd page with 4 sections (hero, timeline, roles, skills)',
          'SectionTemplateModal.jsx fully rewritten: 37 template definitions across 4 categories, category sidebar, Step 1 grid auto-sizes to category',
          'AdminShell: "My Resume" tab wired for isMember; resume excluded from PublishBar',
        ],
      },
    ],
  },

  // ─────────────────────── v0.14 — Platform merge: HERQ + NRM + services ──────────────────────
  {
    version: 'v0.14',
    name: 'Platform Merge — HERQ, NRM, Services & Governance',
    date: '2026-06-12',
    summary:
      'The largest single release in the build. Five product lines merge into the unified Salt Basin platform: HERQ (HR analytics layer), NRM (network relationship manager), Services Catalog, Standards Library, and Governance. Analytics, Data Lineage, and Security hardening round it out. The My Resume tab ships to the admin shell with layout preset builder, AI-tailored preset generation, and PDF preview. Fifty-three backlog items written or updated across twelve capability groups.',
    sections: [
      {
        heading: 'New — Platform Products',
        items: [
          'HERQ: compensation benchmark widgets, headcount heatmap, retention-risk matrix, org-chart renderer — all reading from the analytics layer',
          'NRM: network health dashboard, relationship map, engagement tracker, pipeline view by relationship tier',
          'Services Catalog: browsable card grid of consulting offerings, each with scope, deliverables, and rate band',
          'Standards Library: versioned policy and process documents with section-level approval workflows',
          'Governance: board/committee charter management, meeting minutes, decision log, and policy attestation tracker',
        ],
      },
      {
        heading: 'New — Analytics & Lineage',
        items: [
          'Analytics capability group seeded (12 backlog items): event pipeline, dashboard renderer, KPI store, and threshold alerting',
          'Data Lineage capability group (8 items): column-level lineage graph, impact analysis, compliance tagging, and audit export',
          'Security hardening: rate limiter on login/reset, cookie attribute fix on logout, lazy session purge, org-invite email enumeration fix, 16-char lead access passwords',
        ],
      },
      {
        heading: 'New — My Resume (admin scope)',
        items: [
          'My Resume tab in admin shell ("My Profile" view) — same panel as member scope but loading both admin CMS sections and member sections together',
          'Resume preset builder with layout template picker (Classic SB, Modern SB, Minimal, Executive) and per-section include toggles with drag-to-reorder',
          'AI interpreter: paste a job description → Claude returns tailored summary, highlighted skills, rewritten bullets, and gap analysis',
          'Accept-and-save flow: agent output becomes a new named preset; discard clears it without touching existing presets',
          'PDF preview iframe inline in the panel',
          'Primary preset designation controls which resume /output/resume serves publicly',
        ],
      },
      {
        heading: 'New — Action Button Editor',
        items: [
          'Every section in the editor now shows a Section Actions card — add CTA buttons with a guided link picker that lists site pages, anchors, and /output/* routes',
          'Button style picker: primary / secondary / ghost / danger',
          'Saved to fieldMeta.actions per section; rendered in public view and preview',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'scripts/add-v014-backlog-items.mjs — idempotent backlog reconciliation for all v0.14 items',
          '53 new/updated backlog items, 12 capability groups touched',
          'admin_nav Inbox tab injection in db.js bootstrap',
          'My Resume scoped via AdminShell TAB_COMPONENTS (bug surface for v0.15 fix)',
        ],
      },
    ],
  },

  // ─────────────────────── v0.15 — Connections, Messaging, CRM Job Leads ────────────────────
  {
    version: 'v0.15',
    name: 'Connections, Messaging & CRM Job Leads',
    date: '2026-06-15',
    summary:
      'Member-to-member social layer lands: connection requests, accept/decline flow, and direct messages gated to accepted connections. Each member gets a dedicated Inbox panel with sub-tabs for Messages, Requests, and Connections. The CRM gets manual lead creation (with skip-email option) and a new Job Lead type with company, hiring manager, job URL, status (New / Applied), and job description fields. The My Resume scope bug (admin seeing 0 sections) is fixed.',
    sections: [
      {
        heading: 'New — Member Connections',
        items: [
          'Connection request flow: "+ Connect" button on public profiles sends a pending request. Anonymous visitors see no button',
          'Inbox → Requests sub-tab: accept or decline incoming requests with real-time count badge',
          'Inbox → Connections sub-tab: grid of accepted connections with Profile link and Message shortcut',
          'Bidirectional connection lookup — only one row per pair (requester_id < recipient_id direction enforced at DB level)',
          'GET /api/members/me/connection-status/:slug — single call returns status, connectionId, direction, and targetUserId for the profile page',
        ],
      },
      {
        heading: 'New — Direct Messaging',
        items: [
          'Members can message connections directly from a public profile (compose popover on "Message" button) or from Inbox → Connections',
          'Server enforces accepted connection before allowing any message — non-connections receive 403',
          'Inbox → Messages sub-tab: thread list with unread count badge; thread view with chat bubbles (gold = mine, grey = theirs), scroll-to-bottom on open, Enter to send / Shift+Enter for newline',
          'Read marking: GET /thread/:userId marks all their messages as read; unread count reflects state in real time',
          'GET /api/members/me/messages/unread-count — usable for future inbox badge in the nav',
        ],
      },
      {
        heading: 'New — InboxPanel',
        items: [
          'New Inbox tab injected into admin_nav for both admin and member scopes via db.js bootstrap migration',
          'Three sub-tabs: Messages (thread list + thread view), Requests (pending incoming with count), Connections (accepted grid)',
          'Requests tab label shows live count: "Requests (2)" when 2 pending',
        ],
      },
      {
        heading: 'New — CRM Enhancements',
        items: [
          'Manual lead creation: "+ Add Lead" button in Leads panel header expands an inline form. Admin can create a lead without going through a public form',
          '"Skip confirmation email" checkbox suppresses the Brevo outbound email on manual creation',
          'Job Lead type (separate from Network leads): company, hiring manager info, job URL, status (New / Applied), and job description textarea',
          'Type filter tabs in Leads panel: All / Network / Job with live counts',
          'Job leads display company name prominently in the list and "Edit Job Info" inline form in the detail pane',
          'PATCH /api/leads/:id/job — update job-specific fields without touching the core lead record',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'My Resume showed 0 sections for admin (Betsy): TAB_COMPONENTS entry was `() => <MyResumePanel />` — ignored all props including `scope`. Fixed to `(props) => <MyResumePanel {...props} />` so scope="admin" propagates and both admin + member site data load correctly',
          'MyResumePanel scroll: admin workspace has overflow:hidden; panel now wraps in flex:1/overflowY:auto container so full content is reachable',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'New tables: member_connections (UNIQUE(requester_id, recipient_id)), member_messages (sender_id, recipient_id, body, read_at)',
          'New columns on leads: lead_type, job_description, job_url, company, hiring_manager, job_status',
          'All migrations are idempotent ALTER TABLE IF NOT EXISTS / CREATE TABLE IF NOT EXISTS in db.js bootstrap',
          'scripts/add-v015-backlog-items.mjs — idempotent backlog reconciliation for v0.15 items',
          'scripts/add-v015-test-scenarios.mjs — 18 test scenarios covering every v0.15 feature plus regression paths',
        ],
      },
    ],
  },
];
