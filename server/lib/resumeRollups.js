// Configurable resume rollups: KPI tiles, industry-duration buckets, and
// skill-category -> capability-group mappings.
//
// These used to be hardcoded in src/components/Output.jsx (computeExecutiveKPIs,
// INDUSTRY_DURATION_BUCKETS, META_CATEGORY_MAP/ORDER). They are now per-member
// rows in career_experience_definitions with three new definition types:
//   kpi_tile        - label + { note, accent, computation:{metric,field?,manualValue?} }
//   industry_bucket - label + { sub, keywords:[...] }
//   category_group  - label + { categories:[...] }
//
// This module owns: the defaults (seeded per type, see careerMaster.js
// ensureExperienceDefinitions), shape validation, and the pure resolver that
// turns (Career Master payload + definitions) into the computed tiles /
// industry durations / capability groups the resume outputs render.
//
// Honesty rule: a tile whose data is missing resolves to value '—' with an
// explanatory note. There are NO fabricated fallback figures. A 'manual' tile
// is allowed but is flagged userDefined and the response carries the
// footnote every output must render (same convention as
// proficiencyFootnote() in careerProficiencyEngine.js).

import { trendSeries } from '../../src/lib/careerCharts.js';
import { tierFillPct } from '../../src/lib/careerMaster.js';
import { USER_DEFINED_BASES, proficiencyFootnote } from './careerProficiencyEngine.js';
import { groupCount } from './rollupMetrics.js';

// atom_rollup groups Career Atom evidence (server/lib/careerAtomRollups.js)
// for the public careerRollupShowcase block: { entryType, groupBy, labelPrefix, sort }.
export const ROLLUP_DEFINITION_TYPES = ['kpi_tile', 'industry_bucket', 'category_group', 'atom_rollup'];

export const KPI_METRICS = Object.freeze({
  years_experience: { label: 'Years of experience', needsField: false },
  industry_count: { label: 'Distinct industries', needsField: false },
  engagement_count: { label: 'Engagements', needsField: false },
  max_dollar_in_engagement_field: { label: 'Largest $ figure in an engagement field', needsField: true },
  arr_automated: { label: 'ARR automated (from engagement metrics)', needsField: false },
  employer_count: { label: 'Employers', needsField: false },
  field_aggregate: { label: 'Aggregate of a Career Master field', needsField: false },
  proficiency_at_least: { label: 'Skills/tools at or above a proficiency level', needsField: false },
  manual: { label: 'Manual value (user-defined)', needsField: false },
});

// field_aggregate: which Career Master collection + field, and how to combine.
// Text fields support count / count_distinct; numeric fields also sum/max/avg.
export const AGGREGATE_ENTITIES = Object.freeze({
  skills: { label: 'Skills', text: ['skill', 'category', 'tier'], numeric: ['yearsExp', 'numEngagements'] },
  tools: { label: 'Tools', text: ['nameUsed', 'category', 'tier', 'wheelBucket'], numeric: ['numRoles'] },
  jobs: { label: 'Roles', text: ['company', 'title', 'industry', 'jobFunction'], numeric: [] },
  engagements: { label: 'Engagements', text: ['name', 'employer', 'industry', 'investmentType'], numeric: [] },
});
export const AGGREGATIONS = Object.freeze({
  count: 'Count (rows with a value)',
  count_distinct: 'Count of distinct values',
  sum: 'Sum', max: 'Highest', avg: 'Average',
});

// atom_rollup: entry type -> groupable columns (column names as stored on the
// Career Atom evidence, i.e. the legacy snake_case columns).
export const ATOM_ENTRY_TYPES = Object.freeze({
  career_skill_entry: { label: 'Skills', groupBy: ['category', 'tier'] },
  career_job_entry: { label: 'Roles', groupBy: ['industry', 'job_function', 'company'] },
  career_tool_entry: { label: 'Tools', groupBy: ['wheel_bucket', 'category', 'tier'] },
});
export const ATOM_LEGACY_KEYS = Object.freeze(['skills_by_category', 'jobs_by_industry', 'tools_by_wheel_bucket']);


// Engagement text fields a max_dollar_in_engagement_field tile may scan.
export const DOLLAR_FIELDS = Object.freeze([
  'exitDetail', 'acquiredDetail', 'scale', 'financialReturn', 'outcomeStatus', 'metrics', 'outcomes', 'context', 'actions',
]);

export const KPI_ACCENTS = Object.freeze(['gold', 'teal', 'green', 'plum', 'navy']);

export const USER_DEFINED_FOOTNOTE = 'Figures marked † are user-defined, not Salt Basin methodology-driven.';

// [type, key, label, description, definition, sortOrder] - same tuple shape as
// DEFAULT_EXPERIENCE_DEFINITIONS in careerMaster.js.
// Equal to the previously hardcoded behavior, minus fabricated fallbacks. The
// old sixth tile was a hardcoded 'AI-Native' string (not derivable from any
// member's data), so it is replaced by a computed Employers tile.
export const DEFAULT_ROLLUP_DEFINITIONS = [
  ['kpi_tile', 'exit_signal', 'Exit Signal', null, { note: 'Portfolio value creation proof', accent: 'gold', computation: { metric: 'max_dollar_in_engagement_field', field: 'exitDetail' } }, 10],
  ['kpi_tile', 'arr_automated', 'ARR Automated', null, { note: 'Revenue system credibility', accent: 'teal', computation: { metric: 'arr_automated' } }, 20],
  ['kpi_tile', 'engagements', 'Engagements', null, { note: 'Case-study depth', accent: 'green', computation: { metric: 'engagement_count' } }, 30],
  ['kpi_tile', 'industries', 'Industries', null, { note: 'Pattern recognition range', accent: 'gold', computation: { metric: 'industry_count' } }, 40],
  ['kpi_tile', 'years', 'Years', null, { note: 'Operator track record', accent: 'teal', computation: { metric: 'years_experience' } }, 50],
  ['kpi_tile', 'employers', 'Employers', null, { note: 'Breadth of organizations', accent: 'plum', computation: { metric: 'employer_count' } }, 60],

  ['industry_bucket', 'saas_enterprise_software', 'SaaS & Enterprise Software', null, { sub: 'RevOps & monetization', keywords: ['saas', 'software', 'enterprise', 'technology', 'tech'] }, 10],
  ['industry_bucket', 'private_equity_portops', 'Private Equity / PortOps', null, { sub: 'Value creation & exit readiness', keywords: ['private equity', 'pe advisory', 'portfolio', 'vista'] }, 20],
  ['industry_bucket', 'healthcare_technology', 'Healthcare Technology', null, { sub: 'Systems alignment & relisting readiness', keywords: ['health', 'telehealth'] }, 30],
  ['industry_bucket', 'manufacturing_industrial', 'Manufacturing & Industrial', null, { sub: 'Q2R & commodity pricing architecture', keywords: ['manufactur', 'chemical', 'industrial', 'consumer goods', 'cpg'] }, 40],
  ['industry_bucket', 'education_publishing', 'Education & Publishing', null, { sub: 'Global program delivery', keywords: ['education', 'publish', 'edtech'] }, 50],
  ['industry_bucket', 'ai_native_ventures', 'AI-Native Ventures', null, { sub: 'Agentic products & advisory', keywords: ['ai'] }, 60],

  ['category_group', 'revenue_operations', 'Revenue Operations', null, { categories: ['Quote-to-Cash', 'Pricing & Subscription'] }, 10],
  ['category_group', 'process_architecture', 'Process & Architecture', null, { categories: ['Business Process', 'Integration', 'Solution Architecture', 'Process Improvement', 'Program Mgmt'] }, 20],
  ['category_group', 'data_integration', 'Data & Integration', null, { categories: ['CRM & CPQ', 'Data & MDM', 'QA & Testing', 'Training & Change'] }, 30],
  ['category_group', 'strategy_advisory', 'Strategy & Advisory', null, { categories: ['Stakeholder Mgmt', 'Business Dev', 'Financial Strategy', 'AI Operator'] }, 40],

  // The three groupings the public Career Rollup block has always shown; the
  // keys are the catalog keys existing consumers read, so they never change.
  ['atom_rollup', 'skills_by_category', 'Skills by category', null, { entryType: 'career_skill_entry', groupBy: 'category', labelPrefix: 'Skills', sort: 'count' }, 10],
  ['atom_rollup', 'jobs_by_industry', 'Roles by industry', null, { entryType: 'career_job_entry', groupBy: 'industry', labelPrefix: 'Roles', sort: 'count' }, 20],
  ['atom_rollup', 'tools_by_wheel_bucket', 'Tools by wheel bucket', null, { entryType: 'career_tool_entry', groupBy: 'wheel_bucket', labelPrefix: 'Tools', sort: 'count' }, 30],
];

// ── validation ─────────────────────────────────────────────────────────────

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

function cleanStringList(list, { maxItems, maxLen }) {
  if (!Array.isArray(list)) return null;
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const s = clean(raw, maxLen);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

/**
 * Validate + normalize a definition body for a given type.
 * Returns { ok:true, definition } (normalized, safe to store) or { ok:false, error }.
 * Types outside ROLLUP_DEFINITION_TYPES pass through untouched (legacy behavior).
 */
export function validateRollupDefinition(type, definition) {
  if (!ROLLUP_DEFINITION_TYPES.includes(type)) return { ok: true, definition };
  const d = definition && typeof definition === 'object' && !Array.isArray(definition) ? definition : null;
  if (!d) return { ok: false, error: 'definition must be an object' };

  if (type === 'kpi_tile') {
    const c = d.computation && typeof d.computation === 'object' ? d.computation : null;
    if (!c || !KPI_METRICS[c.metric]) return { ok: false, error: `computation.metric must be one of: ${Object.keys(KPI_METRICS).join(', ')}` };
    const computation = { metric: c.metric };
    if (c.metric === 'max_dollar_in_engagement_field') {
      const field = c.field || 'exitDetail';
      if (!DOLLAR_FIELDS.includes(field)) return { ok: false, error: `computation.field must be one of: ${DOLLAR_FIELDS.join(', ')}` };
      computation.field = field;
    }
    if (c.metric === 'field_aggregate') {
      const ent = AGGREGATE_ENTITIES[c.entity];
      if (!ent) return { ok: false, error: `computation.entity must be one of: ${Object.keys(AGGREGATE_ENTITIES).join(', ')}` };
      const aggregation = AGGREGATIONS[c.aggregation] ? c.aggregation : null;
      if (!aggregation) return { ok: false, error: `computation.aggregation must be one of: ${Object.keys(AGGREGATIONS).join(', ')}` };
      const numeric = ent.numeric.includes(c.field);
      if (!numeric && !ent.text.includes(c.field)) return { ok: false, error: `computation.field for ${c.entity} must be one of: ${[...ent.text, ...ent.numeric].join(', ')}` };
      if (!numeric && ['sum', 'max', 'avg'].includes(aggregation)) return { ok: false, error: `${aggregation} needs a numeric field (${ent.numeric.join(', ') || 'none for ' + c.entity})` };
      computation.entity = c.entity; computation.field = c.field; computation.aggregation = aggregation;
    }
    if (c.metric === 'proficiency_at_least') {
      if (!['skill', 'tool'].includes(c.entityType)) return { ok: false, error: 'computation.entityType must be skill or tool' };
      const levelKey = clean(c.levelKey, 80);
      if (!levelKey) return { ok: false, error: 'a proficiency tile needs a levelKey' };
      computation.entityType = c.entityType; computation.levelKey = levelKey;
    }
    if (c.metric === 'manual') {
      const manualValue = clean(c.manualValue, 40);
      if (!manualValue) return { ok: false, error: 'a manual tile needs a manualValue' };
      computation.manualValue = manualValue;
    }
    const accent = KPI_ACCENTS.includes(d.accent) ? d.accent : 'gold';
    return { ok: true, definition: { note: clean(d.note, 160), accent, computation } };
  }

  if (type === 'industry_bucket') {
    const keywords = cleanStringList(d.keywords, { maxItems: 40, maxLen: 60 });
    if (!keywords || !keywords.length) return { ok: false, error: 'an industry bucket needs at least one keyword' };
    return { ok: true, definition: { sub: clean(d.sub, 160), keywords } };
  }

  if (type === 'atom_rollup') {
    const et = ATOM_ENTRY_TYPES[d.entryType];
    if (!et) return { ok: false, error: `entryType must be one of: ${Object.keys(ATOM_ENTRY_TYPES).join(', ')}` };
    if (!et.groupBy.includes(d.groupBy)) return { ok: false, error: `groupBy for ${d.entryType} must be one of: ${et.groupBy.join(', ')}` };
    const sort = d.sort === 'label' ? 'label' : 'count';
    return { ok: true, definition: { entryType: d.entryType, groupBy: d.groupBy, labelPrefix: clean(d.labelPrefix, 40) || et.label, sort } };
  }

  // category_group
  const categories = cleanStringList(d.categories, { maxItems: 80, maxLen: 80 });
  if (!categories) return { ok: false, error: 'categories must be a list of strings' };
  return { ok: true, definition: { categories } };
}

// ── keyword matching ───────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Compile plain-string keywords into one case-insensitive regex. User input is
 * regex-escaped, so a keyword can never inject a pattern. Keywords of 3
 * characters or fewer (e.g. "ai", "cpg") match whole words only so "ai" does
 * not hit "retail"; longer keywords match as substrings ("manufactur" hits
 * "Manufacturing"). Returns null when there is nothing to match.
 */
export function compileKeywordRegex(keywords) {
  const parts = (keywords || []).map((k) => String(k || '').trim()).filter(Boolean).map((k) => {
    const e = escapeRegex(k);
    // Short keywords match whole tokens only. Lookarounds rather than \b so
    // keywords ending in a symbol (e.g. "c++") still work.
    return k.length <= 3 ? `(?<![A-Za-z0-9])${e}(?![A-Za-z0-9])` : e;
  });
  return parts.length ? new RegExp(parts.join('|'), 'i') : null;
}

// ── resolver ───────────────────────────────────────────────────────────────

function dollarValue(str) {
  const m = String(str).match(/\$\s?([\d,]*\.?\d+)\s?([KMBT])\b\+?/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2].toUpperCase()];
  return { raw: m[0].replace(/\s+/g, ''), value: parseFloat(m[1].replace(/,/g, '')) * mult };
}

function maxDollar(strings) {
  let best = null;
  for (const s of strings) {
    if (!s) continue;
    // scan every $ token in the string, not just the first
    for (const m of String(s).matchAll(/\$\s?[\d,]*\.?\d+\s?[KMBT]\b\+?/gi)) {
      const v = dollarValue(m[0]);
      if (v && (!best || v.value > best.value)) best = v;
    }
  }
  return best;
}

const flattenText = (v) => (Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]);

const normKey = (s) => String(s || '').trim().toLowerCase();

function resolveTile(def, master, proficiency) {
  const comp = def.definition?.computation || { metric: 'manual' };
  const base = {
    key: def.key,
    label: def.label,
    note: def.definition?.note || '',
    accent: def.definition?.accent || 'gold',
    metric: comp.metric,
    value: '—',
    empty: true,
    userDefined: false,
    basis: 'no_data',
    source: '',
  };
  const engagements = master.engagements || [];
  const jobs = master.jobs || [];
  const empty = (reason, source) => ({ ...base, note: reason, source });
  const ok = (value, source) => ({ ...base, value, empty: false, basis: 'computed', source });

  switch (comp.metric) {
    case 'years_experience': {
      const series = trendSeries(master, 'experience_years');
      const last = series.length ? series[series.length - 1].value : null;
      if (!last) return empty('No dated roles in Career Master yet', 'career_jobs start/end dates, overlapping roles merged, month precision');
      return ok(String(last), 'career_jobs start/end dates, overlapping roles merged, month precision');
    }
    case 'industry_count': {
      const set = new Set();
      [...jobs, ...engagements].forEach((x) => { const k = normKey(x.industry); if (k) set.add(k); });
      if (!set.size) return empty('No industries recorded on roles or engagements', 'distinct industry values across career_jobs and career_engagements');
      return ok(String(set.size), 'distinct industry values across career_jobs and career_engagements');
    }
    case 'engagement_count': {
      if (!engagements.length) return empty('No published engagements yet', 'published career_engagements');
      return ok(String(engagements.length), 'published career_engagements');
    }
    case 'employer_count': {
      const set = new Set(jobs.map((j) => normKey(j.company)).filter(Boolean));
      if (!set.size) return empty('No employers recorded in Career Master', 'distinct career_jobs.company');
      return ok(String(set.size), 'distinct career_jobs.company');
    }
    case 'max_dollar_in_engagement_field': {
      const field = comp.field || 'exitDetail';
      const best = maxDollar(engagements.flatMap((e) => flattenText(e[field])));
      if (!best) return empty(`No dollar figure found in engagement "${field}"`, `largest $ figure in career_engagements.${field}`);
      return ok(best.raw, `largest $ figure in career_engagements.${field}`);
    }
    case 'arr_automated': {
      const lines = engagements.flatMap((e) => flattenText(e.metrics)).filter((m) => /ARR automated/i.test(m));
      const best = maxDollar(lines);
      if (!best) return empty('No "ARR automated" metric with a $ figure in engagement metrics', 'career_engagements.metrics lines containing "ARR automated"');
      return ok(best.raw, 'career_engagements.metrics lines containing "ARR automated"');
    }
    case 'field_aggregate': {
      const ent = AGGREGATE_ENTITIES[comp.entity];
      const src = `${comp.aggregation} of ${comp.entity}.${comp.field} in Career Master`;
      if (!ent) return empty('Unknown collection', '');
      const vals = (master[comp.entity] || []).map((r) => r[comp.field]).filter((v) => v != null && String(v).trim() !== '');
      if (!vals.length) return empty(`No ${ent.label.toLowerCase()} with a "${comp.field}" value`, src);
      if (comp.aggregation === 'count') return ok(String(vals.length), src);
      if (comp.aggregation === 'count_distinct') return ok(String(new Set(vals.map((v) => normKey(v))).size), src);
      const nums = vals.map(Number).filter((n) => Number.isFinite(n));
      if (!nums.length) return empty(`No numeric "${comp.field}" values`, src);
      const fmt = (n) => String(Math.round(n * 10) / 10);
      if (comp.aggregation === 'sum') return ok(fmt(nums.reduce((a, b) => a + b, 0)), src);
      if (comp.aggregation === 'max') return ok(fmt(Math.max(...nums)), src);
      return ok(fmt(nums.reduce((a, b) => a + b, 0) / nums.length), src);
    }
    case 'proficiency_at_least': {
      const src = `proficiency engine: ${comp.entityType}s at or above the chosen level`;
      const levels = proficiency?.levels || [];
      const level = levels.find((l) => l.key === comp.levelKey);
      if (!proficiency) return empty('Proficiency levels are not available', src);
      if (!level) return empty(`Proficiency level "${comp.levelKey}" no longer exists`, src);
      const pool = (proficiency.proficiencies || []).filter((p) => p.entityType === comp.entityType);
      const hit = pool.filter((p) => p.levelKey && p.ordinal >= level.ordinal);
      if (!pool.length) return empty(`No ${comp.entityType}s in Career Master yet`, src);
      const userDefined = hit.some((p) => USER_DEFINED_BASES.has(p.basis));
      return { ...base, value: String(hit.length), empty: false, userDefined, basis: userDefined ? 'user_defined' : 'computed', source: `${src} (${level.label})`, proficiencyFootnote: proficiencyFootnote(hit) };
    }
    case 'manual': {
      const v = String(comp.manualValue || '').trim();
      if (!v) return empty('Manual value not set', 'user-defined');
      return { ...base, value: v, empty: false, userDefined: true, basis: 'user_defined', source: 'entered by the member' };
    }
    default:
      return empty('Unknown metric', '');
  }
}

function resolveIndustryDurations(bucketDefs, master) {
  const nowYear = new Date().getFullYear();
  const yearOf = (s) => { const m = String(s || '').match(/(?:19|20)\d{2}/); return m ? Number(m[0]) : null; };
  const items = [];
  (master.jobs || []).forEach((j) => {
    const start = yearOf(j.startDate);
    if (!start) return;
    const end = /present|ongoing|current/i.test(String(j.endDate || '')) ? nowYear : (yearOf(j.endDate) ?? start);
    items.push({ text: `${j.industry || ''} ${j.jobFunction || ''}`, start, end: Math.max(start, end) });
  });
  (master.engagements || []).forEach((e) => {
    const ys = String(e.period || '').match(/(?:19|20)\d{2}/g) || [];
    if (!ys.length) return;
    const start = Number(ys[0]);
    const end = /present|ongoing/i.test(String(e.period)) ? nowYear : Number(ys[ys.length - 1]);
    items.push({ text: e.industry || '', start, end: Math.max(start, end) });
  });
  return bucketDefs.map((b) => {
    const re = compileKeywordRegex(b.definition?.keywords);
    const years = new Set();
    let matched = 0;
    if (re) {
      items.forEach((it) => {
        if (!re.test(it.text)) return;
        matched += 1;
        for (let y = it.start; y <= it.end; y += 1) years.add(y);
      });
    }
    return {
      key: b.key, label: b.label, sub: b.definition?.sub || '', years: years.size,
      basis: 'computed', source: `${matched} role/engagement(s) matched keywords: ${(b.definition?.keywords || []).join(', ')}`,
    };
  }).filter((r) => r.years > 0).sort((a, b) => b.years - a.years);
}

function resolveCapabilityGroups(groupDefs, master) {
  const skills = master.skills || [];
  const groupOf = new Map(); // normalized category -> group key (first group wins)
  groupDefs.forEach((g) => (g.definition?.categories || []).forEach((c) => { if (!groupOf.has(normKey(c))) groupOf.set(normKey(c), g.key); }));
  const groups = groupDefs.map((g) => {
    const inGroup = skills.filter((s) => groupOf.get(normKey(s.category)) === g.key);
    const avgPct = inGroup.length ? inGroup.reduce((sum, s) => sum + tierFillPct(s.tier), 0) / inGroup.length : 0;
    const expertCount = inGroup.filter((s) => s.tier === 'Expert').length;
    const avgYears = inGroup.length ? inGroup.reduce((sum, s) => sum + (Number(s.yearsExp) || 0), 0) / inGroup.length : 0;
    const totalEngagements = inGroup.reduce((sum, s) => sum + (Number(s.numEngagements) || 0), 0);
    return {
      key: g.key, name: g.label, categories: g.definition?.categories || [],
      skillCount: inGroup.length, pct: Math.round(avgPct), expertCount,
      avgYears: Math.round(avgYears), totalEngagements,
      evidence: `${expertCount} Expert · ${inGroup.length} skills`,
      basis: 'configured_mapping', source: 'career_skills.category mapped through the member\'s category groups, tier -> fill %',
    };
  });
  const counts = new Map();
  let uncategorized = 0;
  skills.forEach((s) => {
    const c = String(s.category || '').trim();
    if (!c) { uncategorized += 1; return; }
    if (groupOf.has(normKey(c))) return;
    counts.set(c, (counts.get(c) || 0) + 1);
  });
  const allCounts = new Map();
  skills.forEach((s) => { const c = String(s.category || '').trim(); if (c) allCounts.set(c, (allCounts.get(c) || 0) + 1); });
  const skillCategories = [...allCounts.entries()].map(([category, skillCount]) => ({ category, skillCount, groupKey: groupOf.get(normKey(category)) || null }))
    .sort((a, b) => a.category.localeCompare(b.category));
  const unmappedCategories = [...counts.entries()].map(([category, skillCount]) => ({ category, skillCount }))
    .sort((a, b) => b.skillCount - a.skillCount || a.category.localeCompare(b.category));
  return { groups, unmappedCategories, skillCategories, uncategorizedSkillCount: uncategorized };
}

/**
 * Pure resolver. `rows` are career_experience_definitions rows already mapped
 * to { type, key, label, definition, sortOrder, isActive }. For any rollup type
 * with NO rows at all, the in-memory defaults are used (never written here).
 */
export function resolveResumeRollups(master, rows, proficiency = null) {
  const m = master || {};
  const byType = (type) => {
    const all = (rows || []).filter((r) => r.type === type);
    if (all.length) return { defs: all.filter((r) => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)), usingDefaults: false };
    const defs = DEFAULT_ROLLUP_DEFINITIONS.filter((d) => d[0] === type)
      .map(([t, key, label, , definition, sortOrder]) => ({ type: t, key, label, definition, sortOrder, isActive: true }));
    return { defs, usingDefaults: true };
  };
  const tiles = byType('kpi_tile');
  const buckets = byType('industry_bucket');
  const groups = byType('category_group');
  const atoms = byType('atom_rollup');
  const resolvedTiles = tiles.defs.map((d) => resolveTile(d, m, proficiency));
  const cap = resolveCapabilityGroups(groups.defs, m);
  return {
    tiles: resolvedTiles,
    industryDurations: resolveIndustryDurations(buckets.defs, m),
    capabilityGroups: cap.groups,
    atomDefinitions: atoms.defs.map((d) => ({ key: d.key, label: d.label, ...d.definition })),
    unmappedCategories: cap.unmappedCategories,
    skillCategories: cap.skillCategories,
    uncategorizedSkillCount: cap.uncategorizedSkillCount,
    footnote: [
      resolvedTiles.some((t) => t.userDefined && t.metric === 'manual') ? USER_DEFINED_FOOTNOTE : null,
      ...new Set(resolvedTiles.map((t) => t.proficiencyFootnote).filter(Boolean)),
    ].filter(Boolean).join(' ') || null,
    catalog: {
      metrics: Object.entries(KPI_METRICS).map(([key, v]) => ({ key, label: v.label, needsField: v.needsField })),
      dollarFields: DOLLAR_FIELDS,
      accents: KPI_ACCENTS,
      aggregateEntities: Object.entries(AGGREGATE_ENTITIES).map(([key, v]) => ({ key, label: v.label, textFields: v.text, numericFields: v.numeric })),
      aggregations: Object.entries(AGGREGATIONS).map(([key, label]) => ({ key, label })),
      proficiencyLevels: (proficiency?.levels || []).map((l) => ({ key: l.key, label: l.label, ordinal: l.ordinal })),
      atomEntryTypes: Object.entries(ATOM_ENTRY_TYPES).map(([key, v]) => ({ key, label: v.label, groupBy: v.groupBy })),
    },
    usingDefaults: { kpi_tile: tiles.usingDefaults, industry_bucket: buckets.usingDefaults, category_group: groups.usingDefaults, atom_rollup: atoms.usingDefaults },
  };
}


// ── Career Atom rollup groupings ───────────────────────────────────────────

/**
 * Pure: groups reconstructed Career Atom entries ({skills, jobs, tools}, field
 * names = legacy column names) per the member's atom_rollup definitions.
 * Returns [{ key, label, entryType, groupBy, entries:[{key,label,value}] }]
 * in definition order; inactive definitions are omitted.
 */
export function resolveAtomGroupings(defs, atomEntries) {
  const pool = { career_skill_entry: atomEntries?.skills || [], career_job_entry: atomEntries?.jobs || [], career_tool_entry: atomEntries?.tools || [] };
  return (defs || []).filter((d) => d.isActive !== false).map((d) => {
    const def = d.definition || {};
    const rows = pool[def.entryType] || [];
    const groups = groupCount(rows, (r) => String(r[def.groupBy] ?? '').trim());
    groups.sort(def.sort === 'label' ? (a, b) => a.key.localeCompare(b.key) : (a, b) => b.count - a.count || a.key.localeCompare(b.key));
    return {
      key: d.key, label: d.label, entryType: def.entryType, groupBy: def.groupBy,
      entries: groups.map(({ key, count }) => ({ key, label: `${def.labelPrefix || ''} · ${key}`, value: count })),
    };
  });
}

/** Rows -> the definitions to use: stored rows when the member has any, else the defaults. */
export function atomDefinitionsFromRows(rows) {
  const stored = (rows || []).filter((r) => r.type === 'atom_rollup');
  if (stored.length) return [...stored].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
  return DEFAULT_ROLLUP_DEFINITIONS.filter((d) => d[0] === 'atom_rollup')
    .map(([type, key, label, , definition, sortOrder]) => ({ type, key, label, definition, sortOrder, isActive: true }));
}
