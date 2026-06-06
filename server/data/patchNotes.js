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
];
