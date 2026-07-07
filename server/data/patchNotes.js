// Curated release log for Salt Basin Net Works.
//
// Each entry groups what shipped together, with the "voice" of release notes
// rather than commit messages. Surface via GET /api/backlog/patch-notes
// and rendered at /output/patch-notes.
//
// Newest releases LAST in the array (the API returns reversed so consumers
// see newest first). Keeps the diff small when appending.
//
// ── Metrics block (added retroactively in v0.16.1) ──────────────────────────
// Every release now carries a `metrics` object:
//
//   directorHours      — Hours Betsy spent on architecture decisions, UX
//                        direction, requirements definition, and build
//                        supervision. Billed as a principal architect/director.
//   claudeBuildMins    — Approximate wall-clock minutes Claude spent in active
//                        coding for this release. Does NOT include idle time or
//                        human review pauses.
//   engineerEquivHours — Senior engineer hours required to produce the same
//                        output independently (includes their own spec/arch
//                        time, since Claude works from Betsy's direction).
//
// Computed at render time (not stored here to keep rate assumptions editable):
//   directorCostUsd    = directorHours × DIRECTOR_RATE
//   claudeEquivCostUsd = engineerEquivHours × ENGINEER_RATE   (what it would
//                        cost if a human did what Claude did, at engineer rate)
//   leverageMultiple   = engineerEquivHours / (directorHours + claudeBuildMins/60)
//
// ── Post-deploy steps ────────────────────────────────────────────────────────
// After every `git push origin main` (Render auto-deploys on push):
//   1. Verify Render deploy completes at https://dashboard.render.com
//   2. node scripts/add-vXXX-backlog-items.mjs    ← update platform backlog
//   3. node scripts/add-vXXX-test-scenarios.mjs   ← add test scenarios (if any)
//   4. Confirm /output/patch-notes renders the new release
//
// These steps are intentionally manual (they hit the live production API).
// They are NOT part of the Render build command because:
//   a) They require ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD in .env (not in CI)
//   b) They are idempotent but should only run after a confirmed deploy
//   c) A failed deploy should not create partial backlog records

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
    metrics: {
      directorHours: 4,
      claudeBuildMins: 180,
      engineerEquivHours: 80,
      notes: 'Full-stack CMS from zero: auth, DB schema, 7 block types, brand system, split-view editor, Render + Netlify deploy pipeline.',
    },
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
    metrics: {
      directorHours: 3,
      claudeBuildMins: 150,
      engineerEquivHours: 60,
      notes: 'Content strategy, founder narrative, SVG wheel concept, case study structure, and mobile-first layout all driven by director; Claude executed the implementation.',
    },
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
    metrics: {
      directorHours: 2,
      claudeBuildMins: 180,
      engineerEquivHours: 50,
      notes: 'Lead dedup model, output page design, auth gate UX, and data notice copy are all director decisions. Four distinct output document types plus the entire lead pipeline.',
    },
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
    metrics: {
      directorHours: 2,
      claudeBuildMins: 150,
      engineerEquivHours: 40,
      notes: 'Multi-tenancy architecture (shared shell, separate data scopes) is a director architectural decision that defines the entire platform model.',
    },
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
    metrics: {
      directorHours: 1.5,
      claudeBuildMins: 90,
      engineerEquivHours: 12,
      notes: 'Provider pivot (Resend → Brevo) was a real-time DNS constraint discovery — the director identified the issue, evaluated alternatives, and made the call. Claude executed the swap.',
    },
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
    metrics: {
      directorHours: 5,
      claudeBuildMins: 120,
      engineerEquivHours: 30,
      notes: 'Director wrote or dictated the content for all 35 requirements and 6 tier workarounds — the intellectual work of translating a build into a product management system. Claude built the UI shell.',
    },
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
    metrics: {
      directorHours: 2,
      claudeBuildMins: 120,
      engineerEquivHours: 20,
      notes: 'The per-person metrics model and cost comparison methodology are director-defined intellectual contributions. This release is the first time the build\'s value was formally quantified.',
    },
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
    metrics: {
      directorHours: 3,
      claudeBuildMins: 240,
      engineerEquivHours: 80,
      notes: 'JIRA OAuth integration, AI agent scaffold, and three template definitions running in parallel tracks. High leverage ratio due to breadth — three separate system integrations in one session.',
    },
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
    metrics: {
      directorHours: 4,
      claudeBuildMins: 240,
      engineerEquivHours: 60,
      notes: 'QA system architecture (test scenarios, step verdicts, auto-defect model), audit log design, and nav restructure are all director-level design decisions. Six new tables and the defect traceability model.',
    },
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
    metrics: {
      directorHours: 1,
      claudeBuildMins: 60,
      engineerEquivHours: 8,
      notes: 'Targeted UX fixes identified through Betsy\'s own use of the platform before member onboarding. Director testing is what surfaced these issues.',
    },
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
    metrics: {
      directorHours: 2,
      claudeBuildMins: 150,
      engineerEquivHours: 35,
      notes: 'Complete auth UX: conversion flow, password reset, email recovery, reCAPTCHA scaffold — all with proper security defaults (enumeration prevention, session invalidation on reset).',
    },
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
    metrics: {
      directorHours: 5,
      claudeBuildMins: 360,
      engineerEquivHours: 120,
      notes: 'Nine block visual designs referenced from PPTX provided by director. Field settings system architecture (13 types, cascade rules, audit log) is a director-defined data model. Highest single-session feature density in the build.',
    },
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
    metrics: {
      directorHours: 4,
      claudeBuildMins: 240,
      engineerEquivHours: 70,
      notes: 'Template category taxonomy, resume preset UX, AI interpreter flow design, and client snapshot data model are all director-designed. My Resume is a distinct product app within the platform.',
    },
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
    metrics: {
      directorHours: 10,
      claudeBuildMins: 480,
      engineerEquivHours: 200,
      notes: 'PLATFORM_MERGE_SPEC.md is a director-produced architectural document covering 18 phases, 7 ADRs, unified object model, and 9 new applications. This release is the single largest build event. The 53 backlog items represent requirements authored by the director.',
    },
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
    metrics: {
      directorHours: 3,
      claudeBuildMins: 240,
      engineerEquivHours: 70,
      notes: 'Social layer architecture (connection model, bidirectional enforcement, message threading) and CRM job lead type are director-designed features. 18 test scenarios authored by director.',
    },
  },

  // ─────────────────────── v0.16 — Lead email management + auth login fix ────────────────────
  {
    version: 'v0.16',
    name: 'Lead Email Management & Auth Fix',
    date: '2026-06-28',
    summary:
      'Multi-email support lands on leads: each lead can now have personal and work addresses with per-email unsubscribe and primary designation. A critical login bug is fixed — admin access was broken after a lead with the admin\'s secondary email was converted to a member. Lead-to-member conversion now checks secondary email addresses too before blocking. The resume output page no longer spins forever when the founding page is in draft.',
    sections: [
      {
        heading: 'Fixed',
        items: [
          'Admin login restored: login() now tries the submitted password against ALL user records that match the email (primary users.email column + secondary verified user_emails rows). Prevents a member conversion from blocking an admin who had that email registered as a secondary address',
          'Lead conversion now checks user_emails secondary table before blocking with "email already registered" — gives a proper "sign in with X" message if it finds a match',
          'Resume output (/output/resume) no longer spins forever when the consulting-founder page is in draft — falls back to slug search and shows a clear error message instead',
        ],
      },
      {
        heading: 'New — Multi-email per Lead',
        items: [
          'lead_email_addresses table: each lead can have multiple contact emails, each with type (personal/work), org_name for work addresses, is_primary flag, and per-email subscribed toggle',
          'POST /api/leads: when an existing lead is matched by phone with a different email submitted, the new email is captured to lead_email_addresses automatically',
          'GET /api/leads/public/:publicId now includes contactEmails array',
          'POST /public/:publicId/contact-emails — add an additional email address',
          'PATCH /public/:publicId/contact-emails/:id — update type, org name, primary designation, or unsubscribe',
        ],
      },
      {
        heading: 'New — Lead Email UX',
        items: [
          'LeadSuccessModal: when an existing lead is matched, shows the existing primary email and credential reminder so the lead knows they\'ll need their original password to access/convert',
          'LeadSuccessModal: when alternate email was submitted (phone match scenario), prompts to choose which should be primary — applies immediately without leaving the modal',
          'LeadView Email Addresses panel: shows primary email, all alternate addresses with type selector and org name for work, make-primary button, per-email unsubscribe toggle, and add-email form',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'lead_email_addresses table seeded in db.js bootstrap (idempotent CREATE TABLE IF NOT EXISTS)',
          'user_emails secondary check added to conversion route: SELECT from user_emails WHERE email = submitted_email AND verified = true',
          'Post-conversion: submitted email auto-registered in user_emails if different from users.email primary',
        ],
      },
    ],
    metrics: {
      directorHours: 3,
      claudeBuildMins: 180,
      engineerEquivHours: 55,
      notes: 'Multi-email UX design, auth debug investigation (identifying the lead conversion conflict), and lead matching flow redesign are all director contributions. Auth fix required understanding a subtle email ownership conflict across two tables.',
    },
  },

  // ─── v0.16.1 — CTA visibility + patch notes metrics + deploy process ──
  {
    version: 'v0.16.1',
    name: 'CTA Visibility, Build Metrics & Deploy Process',
    date: '2026-06-30',
    summary:
      'CTA buttons that link to draft or unpublished pages are now hidden from the public site — they only appear when the target page is live. All prior patch notes (v0.1–v0.16) are retroactively updated with quantified build metrics: director hours, Claude build time, and senior engineer equivalent hours. The post-deploy backlog script gains search and traceability capabilities. The full post-deploy process is documented for the first time.',
    sections: [
      {
        heading: 'New — CTA Visibility Gate',
        items: [
          'isLiveHref() utility in blocks/index.jsx: returns false for internal links whose slug is not in the published live-page set, true for external links, anchors, and non-page routes (/output/, /u/, etc.)',
          'liveSlugs Set computed in PublicSite.jsx from all published pages with status="live", passed to every RenderSection',
          'Six block types gated: HeroBlock (cta1/cta2), TwoColBlock (cta1/cta2), CtaBlock (cta1), TimelineBlock (btns array), AppMockupBlock (cta1/cta2), ChoiceGridBlock (per-choice ctaLink)',
          'Preview and admin modes receive liveSlugs=null → show all CTAs regardless of target page status (for content authoring)',
        ],
      },
      {
        heading: 'New — Build Metrics (retroactive, v0.1–v0.16)',
        items: [
          'Every patch note entry now carries a metrics block: directorHours, claudeBuildMins, engineerEquivHours',
          'directorHours: time Betsy spent on architecture decisions, UX direction, requirements definition, and build supervision — billed at a principal architect/director rate',
          'claudeBuildMins: approximate wall-clock minutes Claude spent in active coding per release',
          'engineerEquivHours: senior engineer hours to produce the same output independently (includes their own arch/spec time since Claude works from director-provided direction)',
          'Computed at render time: directorCostUsd = directorHours × DIRECTOR_RATE, leverageMultiple = engineerEquivHours / (directorHours + claudeBuildMins/60)',
          'Cumulative across v0.1–v0.16: ~57.5 director hours, ~3,465 Claude build minutes (~57.75h), ~1,010 engineer equivalent hours',
        ],
      },
      {
        heading: 'New — Backlog Script Enhancements (add-v016-backlog-items.mjs)',
        items: [
          'searchItems(items, query): fuzzy local search across title, summary, and externalRef — lets you find the right item to update/link without knowing the exact ref',
          'findByVersion(items, version): returns all items whose externalRef starts with a given version string (e.g. "v0.15")',
          'Items created with patchNoteVersion tag: tags array includes "patch:vX.XX" for queryable version linkage',
          'Traceability fields: parentRef (links defects to their parent feature ref), testScenarioRef (links requirements to the scenario that validated them)',
          'Summary report now shows: updated / created deployed / created pending / skipped / not-found, grouped by capability',
        ],
      },
      {
        heading: 'New — Post-Deploy Process Documentation',
        items: [
          'Post-deploy steps documented in patchNotes.js file header (canonical reference)',
          'Steps: (1) verify Render deploy on dashboard, (2) node scripts/add-vXXX-backlog-items.mjs, (3) node scripts/add-vXXX-test-scenarios.mjs if scenarios exist, (4) confirm /output/patch-notes renders the new release',
          'Why manual (not automated): scripts require ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD in .env which are not in CI; idempotent but should only run after confirmed deploy; failed deploy should not create partial backlog records',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'No new DB tables or columns in this release',
          'src/components/blocks/index.jsx: isLiveHref + NON_PAGE_PREFIXES at top of file, liveSlugs param on RenderSection + all 6 block types',
          'src/components/PublicSite.jsx: liveSlugs Set computed from live pages after currentPage resolution, passed to each RenderSection',
          'server/data/patchNotes.js: metrics block added to all 16 prior entries + this entry; post-deploy steps in file header',
          'scripts/add-v016-backlog-items.mjs: searchItems, findByVersion helpers; patchNoteVersion tagging; traceability fields on all items',
        ],
      },
    ],
    metrics: {
      directorHours: 2,
      claudeBuildMins: 90,
      engineerEquivHours: 12,
      notes: 'CTA visibility is a simple architectural guardrail. The majority of this release\'s value is the retroactive metrics analysis — director defined the measurement model and commissioned the retroactive update across all 16 prior releases.',
    },
    postDeploySteps: [
      'node scripts/add-v016-backlog-items.mjs',
      'Confirm /output/patch-notes shows v0.16.1',
      'Verify CTA buttons on public site for draft-page targets are hidden (e.g. any section with a button pointing to a draft page)',
    ],
  },

  // ─────────── v0.17 — IP Artifacts, Contribution Methodology, L2R Model ───────────
  {
    version: 'v0.17',
    name: 'IP Artifacts, Contribution Methodology & L2R Model',
    date: '2026-06-30',
    summary:
      'Established Master Enterprise Solution Best Bets™ as the top-level IP brand. Added two canonical, versioned IP artifacts as data files: the Lead to Revenue Capability Model™ and the Contribution Intelligence Methodology™, each with three-tier gated output routes (/output/l2r-model, /output/methodology). Added the sessions and rate_configs tables as the data foundation for future contribution tracking. Integrations hidden behind an "Under Research" notice until real partnerships exist.',
    sections: [
      {
        heading: 'New',
        items: [
          'Master Enterprise Solution Best Bets™ registered as the top-level IP trademark across all artifact files, copyright unified to "Martha Elizabeth Salter aka Betsy Salter"',
          'server/data/leadToRevenueModel.js: 9-stage Lead to Revenue Capability Model, 5 GTM nodes, 6 cross-cutting dimensions, three-tier license (public/member/client)',
          'server/data/contributionMethodology.js: 4 contribution types (Strategic Direction, Domain Authoring, Active Supervision, Code Generation), 2026 rate configs, oversight intensity scale, irreducible/reducible reduction map, three feedback loops',
          '/output/l2r-model and /output/methodology — three-tier gated output routes (public teaser, member framework, client full detail)',
          'DB: sessions table (JSONL ingestion foundation) + rate_configs table (versioned 2026 rate benchmarks)',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Integration provider list hidden behind an "Under Research" notice — no partnerships claimed until real ones exist',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'Render env vars synced: TOKEN_ENCRYPTION_KEY + APP_BASE_URL added',
          'Local ADMIN_INITIAL_PASSWORD synced to match production',
        ],
      },
    ],
    metrics: {
      directorHours: 8.5,
      claudeBuildMins: 320,
      engineerEquivHours: 68,
      notes: 'Both IP artifact data files are director-authored domain content (the methodology and the capability model are Betsy\'s own frameworks); Claude structured them into versioned, licensable data files and built the gated output routes around them.',
    },
    postDeploySteps: [
      'node scripts/add-v017-backlog-items.mjs',
      'Confirm /output/methodology and /output/l2r-model render at all three tiers',
    ],
  },

  // ─────────── v0.17.1 — MES Trademark Correction ───────────
  {
    version: 'v0.17.1',
    name: 'MES Trademark — Full Legal Name Correction',
    date: '2026-07-01',
    summary: 'Corrected the Master Enterprise Solution Best Bets™ author/copyright attribution to the full legal name across all IP artifact files, with a refined parentBrandDescriptor.',
    sections: [
      { heading: 'Fixed', items: ['Author/copyright fields updated to full legal name across leadToRevenueModel.js and contributionMethodology.js'] },
    ],
    metrics: { directorHours: 0.13, claudeBuildMins: 28, engineerEquivHours: 1, notes: 'Corrected 2026-07-07 against real JSONL burst analysis of session 551b4cbf (apportioned share of that session\'s 3.93 real active hours / 0.79 real director hours across its 3 items). engineerEquivHours remains a judgment estimate, not log-derived.' },
  },

  // ─────────── v0.17.2 — Deploy Crash Fix ───────────
  {
    version: 'v0.17.2',
    name: 'Fix v0.17 Deploy Crash',
    date: '2026-07-02',
    summary: 'A boot-time crash on Render was traced to a DB migration ALTER against the sessions table colliding with an existing column. Isolated each v0.17 migration statement so a failure in one no longer takes down bootstrap for the rest.',
    sections: [
      { heading: 'Fixed', items: ['Isolated DB migrations from sessions column ALTERs so bootstrap survives a single failed ALTER statement'] },
    ],
    metrics: { directorHours: 0.22, claudeBuildMins: 70, engineerEquivHours: 3, notes: 'Corrected 2026-07-07 against real JSONL burst analysis of session 551b4cbf (apportioned share of that session\'s 3.93 real active hours / 0.79 real director hours across its 3 items). engineerEquivHours remains a judgment estimate, not log-derived.' },
  },

  // ─────────── v0.17.3 — Lead Pledge Flow ───────────
  {
    version: 'v0.17.3',
    name: 'Lead Pledge Flow',
    date: '2026-07-05',
    summary: 'Replaced the "convert lead to member" action with a lower-friction "pledge interest" flow, so a lead can express interest in becoming a network operator without an immediate full account conversion.',
    sections: [
      { heading: 'Changed', items: ['Convert-to-member action on the Leads panel replaced with a pledge-interest flow'] },
    ],
    metrics: { directorHours: 0.44, claudeBuildMins: 139, engineerEquivHours: 8, notes: 'Corrected 2026-07-07 against real JSONL burst analysis of session 551b4cbf (apportioned share of that session\'s 3.93 real active hours / 0.79 real director hours across its 3 items). engineerEquivHours remains a judgment estimate, not log-derived.' },
  },

  // ─────────── v0.18 — Home Page Restructure, Data-Driven Nav, Contribution Intelligence ───────────
  {
    version: 'v0.18',
    name: 'Home Page Restructure, Data-Driven Nav & Contribution Intelligence Retroactive Update',
    date: '2026-07-06',
    summary:
      'Home page reorganized into a paired-column layout: site purpose + founder card in row 1, a new stat-tile Executive Summary dashboard + Salt Basin Mission in row 2, with Career Timeline and Case Studies added directly below. The three Consulting pages merged into one, and "Meet the Founder" retired. PublicNav.jsx rewritten to be fully data-driven — no hardcoded nav array anywhere in the codebase; a page or a section\'s "show as sub-page in nav" toggle is now the only source of truth for the visitor-facing nav. Dense resume-style text (timeline bullets, case study fields) converted to hover/tap-expandable dashboard tiles. Documentation — CHANGELOG.md and TECHNICAL_DESIGN_SPEC.md — brought current, with the Contribution Intelligence Methodology (built in a prior session) applied retroactively to this session\'s own work.',
    sections: [
      {
        heading: 'New',
        items: [
          'execDashboard block type: stat tiles (years of experience, industries served) + card-grid achievement highlights, paired with the Salt Basin Mission',
          'domainsNiche block type: categorized domains + niche solutions, split out of the old industryWheel into its own home on the merged Consulting page',
          'ExpandableTile: shared dashboard-tile component — clamps text to 3 lines, expands to full text on hover/tap — applied to Career Timeline bullets and Case Studies fields',
          'section.navSubPage + navLabel fields, with a checkbox in EditorPane\'s Section Settings — the mechanism that makes the public nav fully data-driven',
          'Two Mermaid architecture diagrams added to TECHNICAL_DESIGN_SPEC.md (system/deployment topology; draft→publish→nav content flow)',
        ],
      },
      {
        heading: 'Changed',
        items: [
          'Home page section order: About This Site + Face of the Founder (row 1) → Executive Dashboard + Mission (row 2) → Career Timeline → Case Studies → Industries Served',
          'Consulting pages (Domains & Niche Expertise, Services, Self-Service Assessments) merged into one page; "Meet the Founder" page retired, its content redistributed to Home',
          'PublicNav.jsx: hardcoded NAV array replaced with a nav built from live page/section data at render time',
          'Admin Pages sidebar simplified to a flat list, matching the public nav 1:1',
          'Output.jsx (resume, case-study, domains PDF routes) updated to read from Home\'s restructured sections instead of the removed founder page',
          'CHANGELOG.md backfilled through v0.17.3 and today (stale since Session 7, 2026-06-09)',
        ],
      },
      {
        heading: 'Behind the scenes',
        items: [
          'FUNCTIONAL_DESIGN_SPEC.md, TECHNICAL_DESIGN_SPEC.md, FUNCTIONAL_TECHNICAL_MAPPING.md, AGENTS.md committed (authored in a prior session, previously uncommitted)',
          '.gitignore: added Word lock-file pattern and two personal reference paths',
          '9 backlog items added retroactively for v0.17.1–v0.18 (scripts/add-v018-backlog-items.mjs)',
        ],
      },
    ],
    metrics: {
      directorHours: 0.56,
      claudeBuildMins: 169,
      engineerEquivHours: 30,
      notes: 'Corrected 2026-07-07 (same day, after real analysis was run): directorHours and claudeBuildMins are now the actual JSONL burst-analysis figures for session e3c9236b-fa3f-40be-8418-a807e0c3a21a — 2.82 real active hours, 22 real human turns (7.8/hr, "low" oversight), director hours = active hours × 0.20 oversight weight. This session covered the entire v0.18 release including the analysis that produced these very numbers. engineerEquivHours remains a judgment estimate (traditional-team-equivalent effort), not something derivable from timestamps — see contributionMethodology.js RETROACTIVE_SESSION_ANALYSIS for the full method and disclosed gaps.',
    },
    postDeploySteps: [
      'node scripts/add-v018-backlog-items.mjs',
      'Confirm /output/patch-notes shows v0.18',
      'Confirm /output/build-summary reflects the new items',
      'Verify /consulting renders all three merged sections and the public nav matches the Pages list exactly',
    ],
  },

  // ─────────── v0.18.1 — Real Session-Log Contribution Analysis ───────────
  {
    version: 'v0.18.1',
    name: 'Real Session-Log Contribution Analysis (replaces hand-estimated hours)',
    date: '2026-07-07',
    summary:
      'Director flagged that the build summary\'s hours could not be right and asked for the Contribution Intelligence Methodology to be run against actual session logs, not estimates. Built a reproducible JSONL burst-analysis tool, ran it across all 11 Claude Code session transcripts on file for this project, and used the real numbers to correct the 9 backlog items added in v0.18 (which had been hand-estimated at roughly 4× their real measured time) and the associated patch-note metrics. Found and disclosed two real issues along the way: the transcript format\'s "user" turns are mostly synthetic tool-result echoes rather than human input, and the v0.17 sessions-table migration silently collided with the pre-existing auth-cookie sessions table.',
    sections: [
      {
        heading: 'New',
        items: [
          'scripts/analyze-contribution-sessions.mjs: reproducible burst-analysis tool — groups timestamped transcript events into active bursts (gap > 15 min ends a burst), separates real human-typed messages from synthetic tool-result echoes filed under the same event type, computes active hours / turn density / oversight level per session',
          'contributionMethodology.js RETROACTIVE_SESSION_ANALYSIS: full corrected numbers, per-session breakdown, method disclosure, and an explicit knownGaps list',
          'A new, explicit oversight-weight table (critical=0.90, high=0.65, moderate=0.40, low=0.20) operationalizing the previously qualitative "turn density weight" language — used to split a session\'s active hours into director vs. Claude hours',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'Turn-counting bug: the June 2026 methodology derivation appears to have counted synthetic tool_result-echo events (logged under type:"user") as human turns, inflating turn density severalfold. Corrected filter keeps only events with real text content.',
          '9 backlog items (v0.17.1–v0.18) had hoursClaude/hoursBetsy corrected from hand estimates to real session-derived figures — platform hoursTotal dropped from 106.3 to 93.4 as a result',
        ],
      },
      {
        heading: 'Known issues',
        items: [
          'The auth `sessions` table (login cookies) and the analytics session-tracking table added in v0.17 share the same name — the v0.17 CREATE TABLE was a silent no-op, and its ALTER TABLE statements added jsonl_filename/active_hours/etc. columns onto the live auth table instead. Real session analysis was stored in config_state to avoid writing synthetic rows into a security-relevant table. The underlying naming collision is unresolved.',
          'Only 9 of ~110 backlog_items have been corrected against real session data. The remaining ~101 items still carry pre-correction hand estimates which, by the same magnitude found in this pass, likely also overstate real active time — build-summary totals remain directionally inflated until a full reconciliation is run.',
          'Contribution-type split (Strategic Direction / Domain Authoring / Active Supervision) is not individually verified per turn — active-supervision hours use the oversight-weight formula, not a content-classified breakdown.',
        ],
      },
    ],
    metrics: {
      directorHours: 0.35,
      claudeBuildMins: 55,
      engineerEquivHours: 6,
      notes: 'This release is the analysis itself, running inside the same e3c9236b session already accounted for in v0.18 — figures here are an internal apportionment of that session\'s time to this specific piece of work, not additional hours on top of v0.18.',
    },
    postDeploySteps: [
      'Confirm /output/patch-notes shows v0.18.1',
      'Confirm /output/build-summary hoursTotal reflects the corrected 93.4 (down from 106.3)',
      'Plan the full ~101-item backlog reconciliation as a follow-up (not done in this release)',
    ],
  },

  // ─────────── v0.18.2 — Full Backlog Hours Reconciliation ───────────
  {
    version: 'v0.18.2',
    name: 'Full Backlog Hours Reconciliation (closes the ~101-item gap)',
    date: '2026-07-07',
    summary:
      'Closed out the reconciliation flagged as a follow-up in v0.18.1. Every remaining backlog item was checked against real session evidence before its hours were touched — burst-level containment (not just createdAt-inside-a-date-range, which is misleading for sessions resumed across days), a search across all three Claude project directories on the machine for sessions filed under a different cwd, and a check of the Claude Desktop session index for sessions whose JSONL transcript no longer exists. Along the way, found and merged three "epic" backlog items whose task ranges were being double-counted against later per-task items already carrying their own hour estimates.',
    sections: [
      {
        heading: 'New',
        items: [
          'scripts/correlate-backlog-to-bursts.mjs: precise burst-containment correlation — checks whether a backlog item\'s createdAt falls inside an actual active burst (not just a session\'s overall date range), resolving cases where two sessions\' outer date ranges overlap but only one has a real burst at that moment',
          'scripts/reconcile-backlog-hours-full.mjs: the full 61-item correction, run in three evidence tiers (see Fixed)',
          'Discovered a second session-metadata source beyond the JSONL transcripts: the Claude Desktop app\'s own session index (AppData/Roaming/Claude/claude-code-sessions), which retains sessionId, cwd, title, and completedTurns even for sessions whose transcript file no longer exists (flagged there as transcriptUnavailable: true)',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'Tier 1 (real burst analysis): 17 items (81–91, 92–97) had never been assigned hours at all — corrected using real active hours from sessions 97254a80 (5.47 hrs) and de055505 (5.05 hrs), split equally across items sharing a session since no prior estimate existed to preserve a ratio against',
          'Tier 2 (coarse turn-count estimate, lower confidence): 41 of the original items 1–47 had hand-typed hours with no session transcript to verify them against. Found the missing session in the Claude Desktop index — "Website admin panel and configurability," 2026-06-03→06-07, 120 completed turns, transcript confirmed unavailable. Derived active hours from completedTurns / platform-average turn density (9.92 hrs), apportioned across the 41 items proportional to their original hand-estimate ratios (scale corrected, relative weighting preserved)',
          'Merge: items #1, #6, #10 were "epic" entries whose externalRef task range (e.g. "tasks #4–#12") fully contained other items\' individually tracked tasks (#2, #3, #27 / #7, #8, #9, #18, #19 / #11) — both were being summed in Build Summary. Epics retired to 0/0 hours; the detail items keep their corrected hours',
          'Confirmed 40 items (37–39, 48–80, 98–101) correctly carry 0/null hours — they are status=pending, i.e. not yet built, not part of the estimate-inflation problem',
          'platform hoursTotal dropped from 93.4 to 32.1 (26.6 Claude / 5.5 Betsy) as a result',
        ],
      },
      {
        heading: 'Known issues',
        items: [
          'Tier 2\'s 41 items rest on a coarser evidence base than Tier 1 or the v0.18.1 corrections — completedTurns is a Desktop-app-reported total with no burst/duration/human-vs-assistant split, so its conversion to active hours assumes the platform-average turn density (12.1/hr) rather than that session\'s own (unknowable) density. Treat these 41 items\' hours as directionally correct, not independently verified.',
          'The root cause of the missing transcript (2026-06-03→06-07) was not investigated — Claude Desktop marks it transcriptUnavailable but the mechanism (retention policy, rotation, crash) is unconfirmed. If it recurs, active session data could be lost again without warning.',
          'Content-level duplicate detection (beyond externalRef task-number overlap) was not run — it\'s possible other items describe overlapping work without a shared task-number trail to catch it.',
        ],
      },
    ],
    metrics: {
      directorHours: 0.4,
      claudeBuildMins: 90,
      engineerEquivHours: 10,
      notes: 'Approximate — this session was in progress at time of writing. Correct against real burst analysis in a future pass once the session transcript is complete, per the same method used to correct v0.18 in v0.18.1.',
    },
    postDeploySteps: [
      'Confirm /output/patch-notes shows v0.18.2',
      'Confirm /output/build-summary hoursTotal reflects 32.1 (down from 93.4)',
      'Design the update-not-create backlog workflow (flagged as a follow-up, not done in this release)',
    ],
  },

  // ─────────── v0.18.3 — Cost Reconciliation, Fee-Type Billing, PLM/EIDOS, Upsert Flow ───────────
  {
    version: 'v0.18.3',
    name: 'Cost Reconciliation, Real Billing Fee-Type, PLM/EIDOS Item, Backlog Upsert',
    date: '2026-07-07',
    summary:
      'Follow-up to v0.18.2: the hours were real, but costUsdClaude/traditionalCostUsd were still computed from two disconnected legacy formulas (neither tied to a documented rate), and the Codex-built PLM/EIDOS Operating Model dashboard existed in the codebase with no backlog record at all. Fixed the cost formulas against the actual RATE_CONFIGS_2026 rates, classified every item\'s Anthropic billing fee type against real receipts found via Gmail search, added the missing PLM item using file-mtime evidence from Codex\'s own working directories (no JSONL transcript exists for non-Claude-Code tools), and closed the loop with a durable fix so future backlog-seeding runs update instead of duplicate. Along the way, a migration bug crashed production for about 15 minutes — documented in Known issues.',
    sections: [
      {
        heading: 'New',
        items: [
          'Wired up the v0.17 contribution-tracking columns (data_source, est_claude_hours, est_betsy_hours, actual_claude_hours, actual_betsy_hours) into backlog.js\'s API layer — they existed in the schema but were never exposed, preserving estimate-vs-actual variance instead of overwriting the original estimate when hours get corrected',
          'New fee_type column, classified per item from real Anthropic billing receipts (Gmail search: Pro plan renewals vs. "Prepaid extra usage" overage purchases) against each item\'s build-session window',
          '/output/build-summary: two new sections — activity-type × pricing breakdown (Code Generation @ $115/hr Claude, Active Supervision @ $225/hr Betsy) and a fee-type breakdown (subscription-included vs ad hoc overage), both pulling straight from RATE_CONFIGS_2026',
          'Backlog item #111: the PLM/EIDOS Operating Model dashboard, documented with hoursClaude left null (built in Codex, not Claude Code — no session transcript exists, so it can\'t be measured by the Claude-specific methodology tiers) and real file-mtime evidence disclosed in requirementDetail instead',
          'Upsert-by-externalRef on POST /api/backlog/items: if an item with the same externalRef already exists, PATCH it instead of inserting a duplicate — every add-vXXX-backlog-items.mjs script already calls this endpoint, so the fix protects all future callers automatically',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'costUsdClaude was computed at $0.02/Claude-minute (a legacy token-cost guess, ~$1.20/hr) and traditionalCostUsd at $6.25/min (~$375/hr, an undocumented multiplier) — neither tied to RATE_CONFIGS_2026. Replaced with hoursClaude × $115/hr and (hoursClaude+hoursBetsy) × $175/hr across all 110 items.',
          'activitiesClaude/activitiesBetsy recomputed from the corrected hours using the codebase\'s own existing (previously dormant) formula.',
          'Platform totals: costUsdClaude $102.30 → $3,061.30, traditionalCostUsd → $5,612.25, aiSavingsMultiple 389.6x → 1.8x. The old multiplier was never real — it was computed from hours that were themselves ~4-8x inflated hand estimates.',
        ],
      },
      {
        heading: 'Known issues',
        items: [
          'Production outage (~15 min, all routes 502ing): the v0.17 backlog_items column migration ran as one multi-statement query. session_id\'s foreign key into the colliding auth `sessions` table (see v0.18.1\'s known issues) failed, which silently aborted the ENTIRE batch — meaning data_source/est_*/actual_*/fee_type never actually existed in production despite being in the ALTER TABLE statements for who knows how long. Once this release\'s API layer started writing to them, the resulting Postgres error was an uncaught promise rejection that crashed the whole Node process. Fixed by isolating every migration statement into its own call and dropping the broken FK (session_id is unused). Also added a process-level unhandledRejection handler as a safety net — mitigation, not a substitute for per-route try/catch, which is still missing.',
          'Fee-type classification is at build-session-date precision (does a "Prepaid extra usage" purchase fall inside/near the session window), not per-token metering — real dollars spent ($325 total: $60 subscription + $265 overage) and the modeled $115/hr value of the hours are different numbers answering different questions, both shown but easy to conflate.',
          'The PLM/EIDOS item\'s 0.70hr is file-mtime-span evidence (weakest tier used yet), not turn-level data — Codex\'s local thread catalog was empty, so no richer session data exists to check it against.',
          'Upsert-by-externalRef only catches exact string matches — it would not have caught the original epic/sub-item duplication (different externalRefs whose task ranges overlap). That still requires a human or a smarter range-aware check; not built here.',
        ],
      },
    ],
    metrics: {
      directorHours: 0.5,
      claudeBuildMins: 140,
      engineerEquivHours: 14,
      notes: 'Approximate — this session was in progress at time of writing, spanning the cost reconciliation, the production incident and its fix, the PLM item, and the upsert flow. Correct against real burst analysis in a future pass, same as v0.18.2\'s own metrics.',
    },
    postDeploySteps: [
      'Confirm /output/patch-notes shows v0.18.3',
      'Confirm /output/build-summary shows the new Contribution Intelligence and Fee Type breakdown sections',
      'Confirm the "Operating Model" tab still resolves correctly (not falling back to Config) after a hard refresh',
      'Spot-check that new backlog-item scripts update existing externalRefs instead of duplicating them',
    ],
  },

  // ─────────── v0.18.4 — Active Supervision Redesign + Director Differentiator ───────────
  {
    version: 'v0.18.4',
    name: 'Active Supervision Redesign (Per-Burst Weight) + Director Differentiator Narrative',
    date: '2026-07-07',
    summary:
      'Director flagged that her hours (5.5 total) felt implausibly low given she is continuously present for every build session — and the methodology agreed once inspected: the session-level oversight-weight formula (activeHours × 0.20 for a whole session\'s "low" average turn density) conflated typing frequency with presence. A session with long stretches of watching Claude execute, without needing to type a correction every few minutes, was being scored as low-oversight when it was actually full presence. Replaced with a per-burst weight keyed to what kind of work was happening in each specific stretch, and added a narrative section to Build Progress explaining why the Director role isn\'t reducible to a hours count in the first place.',
    sections: [
      {
        heading: 'New',
        items: [
          'PER_BURST_SUPERVISION_WEIGHT in contributionMethodology.js: >40 turns/hr → 1.0 (active back-and-forth), 15-40/hr → 0.75 (steady engagement), <15/hr or zero human turns in a real burst → 0.5 (present, watching a long autonomous stretch), confirmed autonomous/scheduled session → 0. Supersedes the old session-average oversightWeight (kept in the data for audit trail, no longer used).',
          'GET /api/backlog/methodology: re-serves CONTRIBUTION_TYPES/REDUCTION_MAP/PER_BURST_SUPERVISION_WEIGHT — static reference data, no DB query.',
          '/output/build-summary: "Why the Director\'s Hours Aren\'t Interchangeable" section — Betsy\'s three contribution types (Strategic Direction, Domain Authoring, Active Supervision) with their irreducibility rationale, plus the full irreducible-IP list, pulled live from the methodology instead of hardcoded.',
        ],
      },
      {
        heading: 'Fixed',
        items: [
          'Recomputed hoursBetsy for all 67 affected items (81-97, 102-110, and the Tier-2 batch 1-47) using real per-burst turn density from the underlying JSONL transcripts. Platform hoursBetsy: 5.5 → 15.3 hours. traditionalCostUsd and activitiesBetsy recomputed to match on every touched item.',
          'hoursClaude was untouched — that formula (full session active hours) was never the problem.',
        ],
      },
      {
        heading: 'Known issues',
        items: [
          'The Tier 2 batch (items 1-47) has no per-burst data — its orphaned session has no surviving transcript (see v0.18.2). A flat 0.5 "long autonomous stretch" default was applied to the whole session total rather than derived per-burst, then re-apportioned across items proportional to their existing hoursBetsy share. Several of those items carry 0.00 supervision hours as a direct consequence — they had 0 in the original 2026-06 hand estimate, and proportional redistribution of a total against a zero share stays zero. This likely understates real supervision on those specific items; flagged rather than overridden with a guess.',
          'Two methodology extensions were requested but deliberately not built: (1) a "cost basis hours" figure for Claude — a value-equivalent hours figure distinct from raw wall-clock hours, for cost-comparison purposes — the multiplier is the Director\'s judgment call to set, not something to derive from data; (2) maintenance-cost and license-cost tracking for ongoing/continuous agent-based work, which needs its own cost category (build vs. maintenance vs. license), not yet designed into the schema.',
        ],
      },
    ],
    metrics: {
      directorHours: 0.6,
      claudeBuildMins: 60,
      engineerEquivHours: 8,
      notes: 'Approximate — this session was in progress at time of writing. Correct against real burst analysis in a future pass, same as v0.18.2/v0.18.3\'s own metrics.',
    },
    postDeploySteps: [
      'Confirm /output/patch-notes shows v0.18.4',
      'Confirm /output/build-summary hoursBetsy reflects 15.3 (up from 5.5) and the new Director Differentiator section renders',
      'Design cost-basis-hours multiplier and maintenance/license cost tracking with Betsy as a follow-up (not done in this release)',
    ],
  },
];
