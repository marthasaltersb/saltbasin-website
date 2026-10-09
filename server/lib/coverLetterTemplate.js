// Cover-letter template, settings and the deterministic first draft (2026-10-02).
//
// First generation needs no LLM: a configurable template is filled from the opportunity's
// job-rec fields and the member's Career Master entries (the same Career Atom entries
// coverLetterTargeting.js reads). Nothing is invented — a clause whose data is missing is
// left out, never padded with guesses. The result is a document_blocks v1 document (see
// applicationPackages.js) so it uses the existing view / PDF / ZIP / QR pipeline.
import { db } from '../db.js';
import { getCareerAtomEntries } from './careerAtomRollups.js';
import { searchUnits, tokenize } from './packageSearch.js';

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'; // cheapest Claude model at time of writing; editable in the settings screen
export const PROVIDERS = [
  { key: 'anthropic', label: 'Anthropic API (uses your configured key)' },
  { key: 'stub', label: 'Offline test stub (no network, no real model)' },
];

export const PLACEHOLDERS = {
  company: 'Employer named on the opportunity',
  jobTitle: 'Role title from the job rec',
  location: 'Location from the job rec (blank if none)',
  locationClause: 'Location phrased as " in <location>" (blank if none)',
  fitSentence: 'One sentence naming terms shared by the job rec and your Career Master (blank if none)',
  employer: 'Employer of a matched Career Master job',
  title: 'Title of a matched Career Master job',
  dates: 'Start – end of that job',
  metrics: 'Key metrics recorded on that job in Career Master',
  matchedTerms: 'Job-rec terms found in that job',
  skills: 'Skills from Career Master that appear in the job rec (or your top skills)',
  name: 'Your name',
  evidence: 'The package text the agent found (used by "mention …" requests)',
};

export const DEFAULT_TONE_PRESETS = [
  {
    key: 'formal', label: 'Formal', contractions: 'expand',
    replacements: [{ from: 'a lot of', to: 'substantial' }, { from: 'really', to: '' }, { from: 'great', to: 'strong' }],
  },
  {
    key: 'warm', label: 'Warm', contractions: 'contract',
    replacements: [{ from: 'Thank you for your consideration.', to: 'Thank you for taking the time to consider my application.' }, { from: 'I am writing to apply', to: 'I am delighted to apply' }],
  },
  {
    key: 'direct', label: 'Direct', contractions: null,
    replacements: [{ from: 'I would welcome a conversation about', to: 'I would like to discuss' }, { from: 'in order to', to: 'to' }, { from: 'I believe that', to: '' }, { from: 'very', to: '' }, { from: 'just', to: '' }],
  },
];

export const DEFAULT_SETTINGS = {
  autoDraft: true,
  provider: 'anthropic',
  model: DEFAULT_MODEL,
  template: {
    salutation: 'Dear {company} hiring team,',
    subject: 'Re: {jobTitle}',
    opening: 'I am writing to apply for the {jobTitle} role at {company}{locationClause}. {fitSentence}',
    jobParagraph: 'At {employer} as {title} ({dates}), {metrics}. That experience maps directly to what your posting asks for: {matchedTerms}.',
    jobParagraphNoMetrics: 'At {employer} I worked as {title} ({dates}), which maps directly to what your posting asks for: {matchedTerms}.',
    jobParagraphMetricsOnly: 'At {employer} as {title} ({dates}), {metrics}.',
    jobParagraphPlain: 'At {employer} I worked as {title} ({dates}).',
    skillsParagraph: 'The skills I would bring to {company} include {skills}.',
    closing: 'I would welcome a conversation about how I can contribute to {company}. Thank you for your consideration.',
    signOff: 'Sincerely,',
    mentionSentence: 'Relevant to this role: {evidence}',
    bodyJobCount: 2,
    includeSkills: true,
  },
  tonePresets: DEFAULT_TONE_PRESETS,
};

const TEMPLATE_TEXT_KEYS = ['salutation', 'subject', 'opening', 'jobParagraph', 'jobParagraphNoMetrics', 'jobParagraphMetricsOnly', 'jobParagraphPlain', 'skillsParagraph', 'closing', 'signOff', 'mentionSentence'];
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

/** Throws a readable Error for anything a settings save should refuse. */
export function validateSettings(input) {
  const s = input && typeof input === 'object' ? input : {};
  const out = {
    autoDraft: s.autoDraft !== false,
    provider: s.provider || DEFAULT_SETTINGS.provider,
    model: String(s.model || '').trim() || DEFAULT_MODEL,
    template: { ...DEFAULT_SETTINGS.template, ...(s.template || {}) },
    tonePresets: Array.isArray(s.tonePresets) ? s.tonePresets : DEFAULT_TONE_PRESETS,
  };
  if (!PROVIDERS.some((p) => p.key === out.provider)) throw new Error(`Unknown provider "${out.provider}".`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/.test(out.model)) throw new Error('Model name may only contain letters, digits, dots, dashes, colons and underscores.');
  for (const key of TEMPLATE_TEXT_KEYS) {
    const text = String(out.template[key] ?? '');
    if (text.length > 1200) throw new Error(`Template field "${key}" is longer than 1200 characters.`);
    for (const m of text.matchAll(/\{([^{}]*)\}/g)) {
      if (!Object.prototype.hasOwnProperty.call(PLACEHOLDERS, m[1])) throw new Error(`Template field "${key}" uses an unknown placeholder {${m[1]}}. Allowed: ${Object.keys(PLACEHOLDERS).map((k) => `{${k}}`).join(' ')}`);
    }
    out.template[key] = text;
  }
  out.template.bodyJobCount = Math.max(0, Math.min(5, Number.parseInt(out.template.bodyJobCount, 10) || 0));
  out.template.includeSkills = out.template.includeSkills !== false;
  const seen = new Set();
  out.tonePresets = out.tonePresets.map((p, i) => {
    const key = String(p?.key || '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_-]{1,30}$/.test(key)) throw new Error(`Tone preset ${i + 1}: key must be 2-31 lowercase letters, digits, dashes or underscores, starting with a letter.`);
    if (seen.has(key)) throw new Error(`Tone preset key "${key}" is used twice.`);
    seen.add(key);
    const contractions = p.contractions === 'expand' || p.contractions === 'contract' ? p.contractions : null;
    const replacements = (Array.isArray(p.replacements) ? p.replacements : []).map((r) => ({ from: String(r?.from ?? ''), to: String(r?.to ?? '') }));
    if (replacements.some((r) => !r.from.trim())) throw new Error(`Tone preset "${key}": a replacement has an empty "from" text.`);
    return { key, label: String(p.label || key).trim() || key, contractions, replacements };
  });
  return out;
}

export async function getSettings(userId) {
  const row = await db.prepare(`SELECT settings FROM cover_letter_settings WHERE user_id=$1`).get(userId);
  if (!row) return validateSettings({});
  return validateSettings(parseJson(row.settings));
}

export async function saveSettings(userId, input) {
  const clean = validateSettings(input);
  await db.prepare(`
    INSERT INTO cover_letter_settings (user_id, settings, updated_at) VALUES ($1,$2::jsonb,$3)
    ON CONFLICT (user_id) DO UPDATE SET settings=excluded.settings, updated_at=excluded.updated_at
  `).run(userId, clean, Date.now());
  return clean;
}

function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '').replace(/[ \t]+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/\(\s*\)/g, '').trim();
}

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// stem -> first original word in a text, so matched (stemmed) terms read as words.
function stemWords(text) {
  const map = new Map();
  for (const raw of String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*[a-z0-9+#]|[a-z0-9]/g) || []) {
    const stem = tokenize(raw)[0];
    if (stem && !map.has(stem)) map.set(stem, raw);
  }
  return map;
}

const clean = (v) => (v == null ? '' : String(v).trim());

/**
 * Deterministic cover-letter content from the template, the opportunity's job-rec fields
 * and the member's Career Master entries. Pure given its inputs (`now` is injectable).
 */
export function buildCoverLetterContent({ member, opportunity, career, settings, now = Date.now() }) {
  const t = settings.template;
  const jobTitle = clean(opportunity.jobTitle);
  const company = clean(opportunity.company);
  const location = clean(opportunity.location);
  const rec = [jobTitle, opportunity.notes].filter(Boolean).join('\n');
  const words = stemWords(rec);

  // Rank Career Master jobs by shared terms with the job rec (BM25), recent first as tiebreak.
  const jobs = career.jobs || [];
  const jobUnits = jobs.map((j, i) => ({ source: 'job', sourceLabel: 'job', index: i + 1, kind: 'job', text: [j.title, j.job_function, j.industry, j.key_metrics, j.company].map(clean).join(' ') }));
  const ranked = searchUnits(jobUnits, rec, { limit: jobs.length || 1 });
  const matchedByIndex = new Map(ranked.hits.map((h) => [h.index, h]));
  const orderedJobs = [...jobs.keys()].sort((a, b) => (matchedByIndex.get(b + 1)?.score || 0) - (matchedByIndex.get(a + 1)?.score || 0) || a - b);
  const chosen = orderedJobs.slice(0, t.bodyJobCount);

  // Words from the role title / company would just echo the heading, so they are not listed as "matched".
  const headingStems = new Set(tokenize(`${jobTitle} ${company}`));
  const termsFor = (idx) => (matchedByIndex.get(idx + 1)?.matchedTerms || []).filter((s) => !headingStems.has(s)).map((s) => words.get(s)).filter(Boolean);
  const allTerms = [...new Set(chosen.flatMap(termsFor))];

  const skillNames = (career.skills || []).map((s) => clean(s.skill)).filter(Boolean);
  const skillUnits = skillNames.map((skill, i) => ({ source: 'skill', sourceLabel: 'skill', index: i + 1, kind: 'skill', text: skill }));
  const skillHits = searchUnits(skillUnits, rec, { limit: 6 }).hits.map((h) => skillNames[h.index - 1]);
  const skills = (skillHits.length ? skillHits : skillNames.slice(0, 5)).slice(0, 6);

  const base = {
    company, jobTitle, location, locationClause: location ? (/^remote\b/i.test(location) ? ' (remote)' : ` in ${location}`) : '', name: clean(member.name),
    fitSentence: allTerms.length ? `My background lines up with your need for ${joinList(allTerms.slice(0, 4))}.` : '',
  };
  const blocks = [];
  const add = (role, text, extra = {}) => { const v = String(text || '').trim(); if (v) blocks.push({ type: 'paragraph', role, text: v, ...extra }); };

  add('date', new Date(now).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }));
  if (company) add('recipient', `Hiring team, ${company}${location ? ` — ${location}` : ''}`);
  add('subject', fill(t.subject, base), { emphasis: 'bold' });
  add('salutation', fill(company ? t.salutation : 'Dear hiring team,', base));
  add('body', fill(t.opening, base));
  for (const idx of chosen) {
    const j = jobs[idx];
    const terms = termsFor(idx);
    const values = {
      ...base, employer: clean(j.company), title: clean(j.title),
      dates: [clean(j.start_date), clean(j.end_date) || 'present'].filter(Boolean).join(' – '),
      metrics: clean(j.key_metrics), matchedTerms: joinList(terms.slice(0, 5)),
    };
    const template = values.metrics && terms.length ? t.jobParagraph : terms.length ? t.jobParagraphNoMetrics : values.metrics ? t.jobParagraphMetricsOnly : t.jobParagraphPlain;
    add('body', fill(template, values), { sourceRowId: j.sourceRowId });
  }
  if (t.includeSkills && skills.length) add('body', fill(t.skillsParagraph, { ...base, skills: joinList(skills) }));
  add('body', fill(t.closing, base));
  add('signoff', fill(t.signOff, base));
  add('signature', clean(member.name));

  return {
    format: 'document_blocks',
    version: 1,
    header: { name: clean(member.name), headline: jobTitle ? `Application — ${jobTitle}${company ? `, ${company}` : ''}` : 'Cover letter', contact: clean(member.email) },
    blocks,
    generation: {
      method: 'template', templateVersion: 1,
      usedJobRecFields: ['jobTitle', company && 'company', location && 'location', opportunity.notes && 'notes'].filter(Boolean),
      careerJobsUsed: chosen.length, jobRecThin: !clean(opportunity.notes),
    },
  };
}

/** Loads the member + Career Master inputs buildCoverLetterContent needs. */
export async function loadLetterInputs(userId) {
  const user = await db.prepare(`SELECT display_name, email FROM users WHERE id=$1`).get(userId);
  const career = await getCareerAtomEntries(userId);
  const name = clean(user?.display_name) || clean(user?.email).split('@')[0];
  return { member: { name, email: clean(user?.email) }, career };
}
