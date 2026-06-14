// Merge field registry — canonical schema of every interpolatable field available
// in output templates. Used to power the field picker in the block editor so that
// authors never need to know field paths by heart.
//
// Each entry: { path, label, description, type, example, context }
//   path        — the {{path}} expression used in block props
//   label       — human label shown in the picker
//   description — where the value comes from in the DB / site JSON
//   type        — 'text' | 'array' | 'boolean'
//   example     — representative value for preview
//   context     — which output types this field is available in

export const MERGE_FIELDS = [

  // ── About (personal profile / about section of consulting-founder page) ──────
  {
    path: 'about.name',
    label: 'Full Name',
    description: 'Display name from the About section',
    type: 'text',
    example: 'Betsy Salter',
    context: ['resume', 'all'],
  },
  {
    path: 'about.heading',
    label: 'Section Heading',
    description: 'The heading field on the About block (often the name)',
    type: 'text',
    example: 'Betsy Salter',
    context: ['resume', 'all'],
  },
  {
    path: 'about.title',
    label: 'Professional Title',
    description: 'Job title / role descriptor from About',
    type: 'text',
    example: 'Strategic Consultant & Platform Founder',
    context: ['resume', 'all'],
  },
  {
    path: 'about.p1',
    label: 'Summary Paragraph 1',
    description: 'First paragraph of the professional summary',
    type: 'text',
    example: 'I wear a lot of hats, and I wear them all with intention…',
    context: ['resume', 'all'],
  },
  {
    path: 'about.p2',
    label: 'Summary Paragraph 2',
    description: 'Second paragraph of the professional summary',
    type: 'text',
    example: 'As a consultant, and now platform founder…',
    context: ['resume', 'all'],
  },
  {
    path: 'about.p3',
    label: 'Summary Paragraph 3',
    description: 'Third paragraph of the professional summary',
    type: 'text',
    example: '',
    context: ['resume', 'all'],
  },
  {
    path: 'about.howIWork',
    label: 'How I Work',
    description: 'Short "How I Work" note from the About block',
    type: 'text',
    example: 'I leverage AI to do hands-on development and output generation…',
    context: ['resume', 'all'],
  },
  {
    path: 'about.email',
    label: 'Email Address',
    description: 'Contact email from About fields',
    type: 'text',
    example: 'betsy@saltbasin.net',
    context: ['resume', 'all'],
  },
  {
    path: 'about.location',
    label: 'Location',
    description: 'City/state from About fields',
    type: 'text',
    example: 'Charleston, SC',
    context: ['resume', 'all'],
  },
  {
    path: 'about.website',
    label: 'Website',
    description: 'Personal or business website URL',
    type: 'text',
    example: 'saltbasin.net',
    context: ['resume', 'all'],
  },
  {
    path: 'about.linkedin',
    label: 'LinkedIn',
    description: 'LinkedIn profile URL or handle',
    type: 'text',
    example: 'linkedin.com/in/betsysalter',
    context: ['resume', 'all'],
  },
  {
    path: 'about.education',
    label: 'Education — Degree',
    description: 'Degree / credential from About fields',
    type: 'text',
    example: 'B.S. Accounting',
    context: ['resume', 'all'],
  },
  {
    path: 'about.institution',
    label: 'Education — Institution',
    description: 'School name from About fields',
    type: 'text',
    example: 'College of Charleston',
    context: ['resume', 'all'],
  },

  // ── Timeline (raw section fields from consulting-founder) ────────────────────
  {
    path: 'timeline.educationLine',
    label: 'Education Line',
    description: 'Single-line education summary from the timeline section',
    type: 'text',
    example: 'College of Charleston — B.S. Accounting, Graduated 2013',
    context: ['resume', 'all'],
  },

  // ── Jobs (parsed array from timeline job1…job10 slots) ───────────────────────
  // Individual slots — useful for pinning a specific job to a specific block
  ...Array.from({ length: 10 }, (_, i) => i + 1).flatMap(n => [
    {
      path: `jobs.${n - 1}.company`,
      label: `Job ${n} — Company`,
      description: `Company name for timeline job slot ${n}`,
      type: 'text',
      example: n === 1 ? 'Streamforce Consulting' : '',
      context: ['resume', 'all'],
    },
    {
      path: `jobs.${n - 1}.title`,
      label: `Job ${n} — Title`,
      description: `Job title for timeline slot ${n}`,
      type: 'text',
      example: n === 1 ? 'Business Architect' : '',
      context: ['resume', 'all'],
    },
    {
      path: `jobs.${n - 1}.dates`,
      label: `Job ${n} — Dates`,
      description: `Date range for timeline slot ${n}`,
      type: 'text',
      example: n === 1 ? 'Jan 2025 – May 2025' : '',
      context: ['resume', 'all'],
    },
    {
      path: `jobs.${n - 1}.bullets`,
      label: `Job ${n} — Bullets`,
      description: `Achievement bullets for timeline slot ${n} (array)`,
      type: 'array',
      example: '["Bullet one", "Bullet two"]',
      context: ['resume', 'all'],
    },
  ]),

  // ── Tech / Capability (industryWheel section on home page) ──────────────────
  {
    path: 'wheel.handsOn',
    label: 'Tech — Hands-On',
    description: 'Comma-separated "Label:slug" list of hands-on technologies',
    type: 'text',
    example: 'Salesforce CPQ:sfcpq, Zuora:zuora',
    context: ['resume', 'all'],
  },
  {
    path: 'wheel.integrationDesign',
    label: 'Tech — Integration Design',
    description: 'Comma-separated list of integration design competencies',
    type: 'text',
    example: 'MuleSoft:mule, Boomi:boomi',
    context: ['resume', 'all'],
  },
  {
    path: 'wheel.adjacent',
    label: 'Tech — Adjacent Exposure',
    description: 'Comma-separated list of adjacent technologies',
    type: 'text',
    example: 'Snowflake:snow, dbt:dbt',
    context: ['resume', 'all'],
  },

  // ── HERQ outputs context ─────────────────────────────────────────────────────
  {
    path: 'output.title',
    label: 'Output Title',
    description: 'The title field of the current HERQ output record',
    type: 'text',
    example: 'HERQ Framework — Q1 2025',
    context: ['HERQFramework', 'HERQSeriesTracker', 'HERQSeriesPostOnePager'],
  },
  {
    path: 'output.purpose',
    label: 'Output Purpose',
    description: 'Purpose / description of the output',
    type: 'text',
    example: 'Client-facing overview of the HERQ framework',
    context: ['HERQFramework', 'HERQSeriesTracker', 'HERQSeriesPostOnePager'],
  },
  {
    path: 'series.series_title',
    label: 'Series Title',
    description: 'Title of the HERQ series linked to this output',
    type: 'text',
    example: 'Hot Elephant Resident Question',
    context: ['HERQSeriesTracker', 'HERQSeriesPostOnePager'],
  },
  {
    path: 'series.definition',
    label: 'Series Definition',
    description: 'Full definition text of the series',
    type: 'text',
    example: 'The question that is always in the room but never on the agenda.',
    context: ['HERQSeriesTracker', 'HERQSeriesPostOnePager'],
  },
  {
    path: 'series.default_color_token',
    label: 'Series Accent Color Token',
    description: 'CSS variable token for the series accent color (e.g. --herq-pink)',
    type: 'text',
    example: '--herq-pink',
    context: ['HERQSeriesTracker', 'HERQSeriesPostOnePager'],
  },
  {
    path: 'post.title',
    label: 'Post Title',
    description: 'Title of the HERQ post linked to this output',
    type: 'text',
    example: 'Why nobody answered the pricing question',
    context: ['HERQSeriesPostOnePager'],
  },
  {
    path: 'post.topic',
    label: 'Post Topic',
    description: 'Short topic label for the post',
    type: 'text',
    example: 'Pricing governance',
    context: ['HERQSeriesPostOnePager'],
  },
  {
    path: 'post.summary',
    label: 'Post Summary',
    description: 'One-paragraph summary of the post',
    type: 'text',
    example: 'In every RevOps engagement I\'ve run, there\'s a pricing question that…',
    context: ['HERQSeriesPostOnePager'],
  },

  // ── Org / Brand ──────────────────────────────────────────────────────────────
  {
    path: 'org.name',
    label: 'Organization Name',
    description: 'Salt Basin Net Works organization profile name',
    type: 'text',
    example: 'Salt Basin Net Works',
    context: ['all'],
  },
  {
    path: 'org.website',
    label: 'Organization Website',
    description: 'Platform website URL',
    type: 'text',
    example: 'saltbasin.net',
    context: ['all'],
  },
  {
    path: 'org.tagline',
    label: 'Organization Tagline',
    description: 'Brand tagline',
    type: 'text',
    example: 'Net Works · Bottom Lines With a Rising Tide',
    context: ['all'],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

// All fields for a given output_type (includes 'all' context fields always)
export function fieldsForContext(outputType) {
  return MERGE_FIELDS.filter(f =>
    f.context.includes('all') || f.context.includes(outputType)
  );
}

// Fields grouped by namespace prefix (about, timeline, jobs, wheel, output, series, post, org)
export function fieldsByNamespace(outputType) {
  const fields = fieldsForContext(outputType);
  const groups = {};
  for (const f of fields) {
    const ns = f.path.split('.')[0];
    if (!groups[ns]) groups[ns] = [];
    groups[ns].push(f);
  }
  return groups;
}

// Quick lookup by path
export function fieldByPath(path) {
  return MERGE_FIELDS.find(f => f.path === path) || null;
}

// Namespace labels shown in the picker UI
export const NAMESPACE_LABELS = {
  about: 'About / Profile',
  timeline: 'Timeline',
  jobs: 'Experience (Jobs)',
  wheel: 'Technology & Capabilities',
  output: 'HERQ Output',
  series: 'HERQ Series',
  post: 'HERQ Post',
  org: 'Organization / Brand',
};
