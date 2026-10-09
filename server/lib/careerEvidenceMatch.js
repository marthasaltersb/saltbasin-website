// Career evidence matcher (2026-10-01) — isomorphic (no server-only
// imports), shared by:
//   - the public `foundationProofLedger` block (src/components/blocks/
//     FoundationProofLedgerBlock.jsx), which resolves each headline proof
//     claim to the real Career Master rows behind it at render time, and
//   - the Portfolio-First Site Agent (server/lib/websiteIntelligence/
//     portfolioFirstAgent.js), which uses the same function to REJECT any
//     agent-drafted proof claim whose value can't be found in a real row.
// One matcher on both sides means "verified on the public site" and
// "accepted by the agent" can never disagree.
//
// Input `master` is the public, redacted /api/career/master payload shape
// ({ jobs, engagements, ... } — camelCase, see server/routes/careerMaster.js
// loadPublicCareerMaster). Never reads salary or real client names.

function norm(value) {
  return String(value || '').toLowerCase();
}

function asList(value) {
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

// Evidence "lines" are the individual claim-sized fragments a row carries:
// a job's keyMetrics is a ';'-separated list; an engagement carries
// outcomes[]/metrics[] arrays plus scale/context prose.
function jobLines(job) {
  return String(job.keyMetrics || '').split(';').map((s) => s.trim()).filter(Boolean);
}

function engagementLines(eng) {
  return [
    ...asList(eng.metrics),
    ...asList(eng.outcomes),
    ...asList(eng.scale),
    ...String(eng.context || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean),
  ];
}

function employerMatches(rowEmployer, employer) {
  if (!employer) return true;
  return norm(rowEmployer).includes(norm(employer));
}

function lineMatches(line, terms) {
  if (!terms.length) return true;
  const l = norm(line);
  return terms.some((t) => l.includes(norm(t)));
}

// Numeric tokens in a headline figure ("$500M+" → ["500"], "<5% → 50%+" →
// ["5", "50"]). A row only substantiates a figure when every token appears
// in its matched lines — "mentions usage-based billing" is not evidence of
// "50%+ of revenue".
export function figureTokens(value) {
  return String(value || '').match(/\d+(?:[.,]\d+)?/g) || [];
}

function containsFigure(lines, figure) {
  const tokens = figureTokens(figure);
  if (!tokens.length) return true;
  const hay = lines.join(' ');
  return tokens.every((t) => new RegExp(`(^|[^\\d])${t.replace('.', '\\.')}(?![\\d])`).test(hay));
}

/**
 * Finds Career Master rows that substantiate a claim.
 * @param master  public career master payload ({ jobs, engagements })
 * @param claim   { employer?: string, terms?: string[] } — employer is a
 *                case-insensitive substring of the row's company/employer;
 *                terms are case-insensitive substrings a line must contain
 *                (any one). Empty terms → the row's first two lines.
 *                figure?: string — when set, a row only counts if every
 *                number in the figure appears in its matched lines.
 * @returns [{ kind: 'job'|'engagement', title, employer, period, lines }]
 *          — only rows with at least one matching line. Empty array means
 *          "no evidence on file", which callers must surface honestly.
 */
export function findCareerEvidence(master, claim = {}) {
  const employer = String(claim.employer || '').trim();
  const figure = claim.figure || '';
  const terms = (Array.isArray(claim.terms) ? claim.terms : String(claim.terms || '').split(','))
    .map((t) => String(t).trim()).filter(Boolean);
  if (!employer && !terms.length) return [];

  const results = [];
  for (const job of master?.jobs || []) {
    if (!employerMatches(job.company, employer)) continue;
    const lines = jobLines(job).filter((l) => lineMatches(l, terms));
    if (lines.length && containsFigure(lines, figure)) {
      results.push({
        kind: 'job',
        title: job.title || '',
        employer: job.company || '',
        period: [job.startDate, job.endDate].filter(Boolean).join(' – '),
        lines: terms.length ? lines : lines.slice(0, 2),
      });
    }
  }
  for (const eng of master?.engagements || []) {
    if (!employerMatches(eng.employer, employer)) continue;
    const lines = engagementLines(eng).filter((l) => lineMatches(l, terms));
    if (lines.length && containsFigure(lines, figure)) {
      results.push({
        kind: 'engagement',
        title: eng.clientDisplayName || eng.name || '',
        employer: eng.employer || '',
        period: eng.period || '',
        lines: terms.length ? lines : lines.slice(0, 2),
      });
    }
  }
  return results;
}
