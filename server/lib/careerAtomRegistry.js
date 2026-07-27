// Career Master → Career Atoms migration registry (2026-07-16). Master
// prompt §77 (Resume and Career Channel) requires a versioned Career Atom/
// Molecule model; the shipped `career_jobs`/`career_skills`/`career_tools`/
// `career_engagements`/`career_domains`/`career_certifications`/
// `career_deals` tables are flat CRUD with no Atom-level governance. This
// registry is the field-mapping — table-driven so ~80 near-identical atom
// definitions come from one compact spec instead of being hand-authored,
// matching the "scalable generator" approach already used for the L2
// scenario matrix (server/lib/scenarioGenerator.js).
//
// Each entry: one legacy table -> one Career Molecule ("entry type"),
// composed of the Career Atoms drawn from its meaningful columns. Pure
// record-management columns (id, order_index, created_at, updated_at,
// user_id) and pure presentation choices (icon, accent_color) are excluded —
// they're not governed business facts.

export const CAREER_ENTRY_SOURCES = Object.freeze([
  {
    table: 'career_jobs',
    entryType: 'career_job_entry',
    entryLabel: 'Career Job Entry',
    columns: [
      ['company', 'Employer'], ['title', 'Job Title'], ['start_date', 'Start Date'],
      ['end_date', 'End Date'], ['duration', 'Duration'], ['salary', 'Salary'],
      ['job_function', 'Job Function'], ['industry', 'Industry'], ['key_metrics', 'Key Metrics'],
    ],
  },
  {
    table: 'career_skills',
    entryType: 'career_skill_entry',
    entryLabel: 'Career Skill Entry',
    columns: [
      ['skill', 'Skill Name'], ['category', 'Skill Category'], ['tier', 'Skill Tier'],
      ['years_exp', 'Years of Experience'], ['num_engagements', 'Number of Engagements'],
      ['first_used', 'First Used (Year)'], ['resume_language', 'Resume Language'],
    ],
  },
  {
    table: 'career_tools',
    entryType: 'career_tool_entry',
    entryLabel: 'Career Tool Entry',
    columns: [
      ['name_used', 'Tool Name (as used)'], ['current_name', 'Current Tool Name'], ['category', 'Tool Category'],
      ['tier', 'Tool Tier'], ['first_used', 'First Used (Year)'], ['num_roles', 'Number of Roles'],
      ['notes', 'Notes'], ['wheel_bucket', 'Wheel Bucket'],
    ],
  },
  {
    table: 'career_engagements',
    entryType: 'career_engagement_entry',
    entryLabel: 'Career Engagement Entry',
    columns: [
      ['name', 'Engagement Name'], ['employer', 'Employer'], ['client_name_real', 'Client (Real Name)'],
      ['client_display_name', 'Client (Display Name)'], ['industry', 'Industry'], ['period', 'Period'],
      ['scale', 'Scale'], ['roles', 'Roles'], ['context', 'Context'], ['actions', 'Actions'],
      ['outcomes', 'Outcomes'], ['metrics', 'Metrics'], ['testimonial', 'Testimonial'],
      ['testimonial_attr', 'Testimonial Attribution'], ['scenarios', 'Scenarios'],
      ['publish_case_study', 'Publish as Case Study'], ['investment_type', 'Investment Type'],
      ['acquired_detail', 'Acquired Detail'], ['exit_detail', 'Exit Detail'],
      ['financial_return', 'Financial Return'], ['outcome_status', 'Outcome Status'],
    ],
  },
  {
    table: 'career_domains',
    entryType: 'career_domain_entry',
    entryLabel: 'Career Domain Entry',
    columns: [
      ['group_type', 'Domain Group Type'], ['title', 'Domain Title'],
      ['description', 'Domain Description'], ['items', 'Domain Items'],
    ],
  },
  {
    table: 'career_certifications',
    entryType: 'career_certification_entry',
    entryLabel: 'Career Certification Entry',
    columns: [
      ['name', 'Certification Name'], ['issuer', 'Issuer'], ['category', 'Certification Category'],
      ['first_earned', 'First Earned'], ['last_renewed', 'Last Renewed'], ['expires', 'Expires'],
      ['status', 'Status'], ['credential_id', 'Credential ID'], ['notes', 'Notes'],
    ],
  },
  {
    table: 'career_deals',
    entryType: 'career_deal_entry',
    entryLabel: 'Career Deal Entry',
    columns: [
      ['deal_name', 'Deal Name'], ['portfolio_company', 'Portfolio Company'], ['employer_at_time', 'Employer at Time'],
      ['deal_role', 'Deal Role'], ['investment_type', 'Investment Type'], ['deal_size', 'Deal Size'],
      ['deal_size_musd', 'Deal Size ($MM)'], ['entry_date', 'Entry Date'], ['exit_date', 'Exit Date'],
      ['exit_value', 'Exit Value'], ['exit_value_musd', 'Exit Value ($MM)'], ['gross_return_pct', 'Gross Return %'],
      ['attribution_pct', 'Attribution %'], ['individual_return', 'Individual Return'], ['stake_type', 'Stake Type'],
      ['outcome_status', 'Outcome Status'], ['is_active_portfolio', 'Active Portfolio'],
      ['arr_entry_musd', 'ARR at Entry ($MM)'], ['arr_prior_year_musd', 'ARR Prior Year ($MM)'],
      ['arr_current_musd', 'ARR Current ($MM)'], ['notes', 'Notes'],
    ],
  },
]);

function atomKeyFor(entryType, column) {
  // entryType is already 'career_x_entry' -> atom key 'career_x_<column>'
  return `${entryType.replace(/_entry$/, '')}_${column}`;
}

// Real Postgres column types (checked directly against information_schema,
// not guessed) for the columns that aren't plain text — everything else
// defaults to 'text'.
const NUMERIC_COLUMNS = new Set([
  'years_exp', 'deal_size_musd', 'exit_value_musd', 'gross_return_pct',
  'attribution_pct', 'arr_entry_musd', 'arr_prior_year_musd', 'arr_current_musd',
]);
const INTEGER_COLUMNS = new Set(['num_engagements', 'first_used', 'num_roles']);
const BOOLEAN_COLUMNS = new Set(['publish_case_study', 'is_active_portfolio']);
const JSONB_COLUMNS = new Set(['roles', 'outcomes', 'metrics', 'scenarios', 'items']);

function dataTypeFor(column) {
  if (NUMERIC_COLUMNS.has(column)) return 'numeric';
  if (INTEGER_COLUMNS.has(column)) return 'integer';
  if (BOOLEAN_COLUMNS.has(column)) return 'boolean';
  if (JSONB_COLUMNS.has(column)) return 'jsonb';
  return 'text';
}

// Flat list of every Career Atom definition: { atomKey, label, entryType, sourceTable, sourceColumn, dataType }
export function generateCareerAtomDefinitions() {
  const atoms = [];
  for (const source of CAREER_ENTRY_SOURCES) {
    for (const [column, label] of source.columns) {
      atoms.push({
        atomKey: atomKeyFor(source.entryType, column),
        label: `${source.entryLabel.replace(' Entry', '')} — ${label}`,
        entryType: source.entryType,
        sourceTable: source.table,
        sourceColumn: column,
        dataType: dataTypeFor(column),
      });
    }
  }
  return atoms;
}

// One Career Molecule (Cluster) per entry type, listing the atom keys that compose it.
export function generateCareerMoleculeDefinitions() {
  return CAREER_ENTRY_SOURCES.map((source) => ({
    entryType: source.entryType,
    label: source.entryLabel,
    sourceTable: source.table,
    atomKeys: source.columns.map(([column]) => atomKeyFor(source.entryType, column)),
  }));
}

export function sourceForTable(table) {
  return CAREER_ENTRY_SOURCES.find((s) => s.table === table);
}

// Reverse lookup for the semantic-import/resume-extraction commit path
// (server/routes/careerMaster.js's POST /mappings/commit): given a governed
// atomKey, find which legacy table/column it writes back to. Regenerates
// the flat list rather than caching — generateCareerAtomDefinitions() is a
// cheap pure function over a fixed 7-source config, not a query.
export function atomDefinitionByKey(atomKey) {
  return generateCareerAtomDefinitions().find((a) => a.atomKey === atomKey) || null;
}

// The 5 columns whose Postgres type is jsonb (career_engagements.roles/
// outcomes/metrics/scenarios, career_domains.items). server/db.js's `db`
// adapter reads jsonb columns back as raw JSON-text strings rather than
// parsed objects/arrays (confirmed against this codebase's existing jsonb
// columns, e.g. journey_metadata_clusters.molecule_keys) — a migration
// reading one of these columns must JSON.parse() it before re-encoding for
// storage, or the JSON text itself gets treated as a plain string value and
// double-wrapped instead of stored as the real array/object.
export function isJsonbSourceColumn(column) {
  return JSONB_COLUMNS.has(column);
}
