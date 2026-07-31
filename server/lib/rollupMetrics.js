// Rollup metrics engine — turns flat Career Master rows (jobs, skills, tools,
// engagements, domains, certifications, deals) into the "suggested" catalog
// consumed by the output-template stat card / infographic pickers (layers 2
// and 3 of the 4-layer output template system). Pure functions; no DB access
// here — callers pass in the same `master` shape returned by
// GET /api/career/master (camelCase fields, see careerMaster.js field maps).

function parseYear(value) {
  if (!value) return null;
  if (/present|current|ongoing/i.test(String(value))) return new Date().getFullYear();
  const m = String(value).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

// career_jobs.salary is free text ("$150,000 (lateral)", "$60,000 →
// ~$85,000", "Independent") rather than a plain number. Take the LAST
// dollar figure mentioned (a "$X → $Y" range describes growth within the
// same role, so the end value is the comparable data point across roles),
// and treat non-numeric entries (e.g. "Independent") as no salary data.
function parseSalary(value) {
  if (!value) return null;
  const matches = String(value).match(/\$?([\d,]+(?:\.\d+)?)/g);
  if (!matches || !matches.length) return null;
  const last = matches[matches.length - 1].replace(/[$,]/g, '');
  const n = Number(last);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function groupCount(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count }));
}

function fmtPct(n) {
  if (!Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// ── Layer 2: static rollup counts ────────────────────────────────────────────
export function computeStaticRollups(master) {
  const { jobs = [], skills = [], tools = [], engagements = [], certifications = [], domains = [], deals = [] } = master;
  const out = [];

  out.push({ key: 'total_jobs', label: 'Roles Held', value: jobs.length, category: 'career' });
  out.push({ key: 'total_skills', label: 'Skills Tracked', value: skills.length, category: 'career' });
  out.push({ key: 'total_tools', label: 'Tools & Platforms', value: tools.length, category: 'career' });
  out.push({ key: 'total_case_studies', label: 'Published Case Studies', value: engagements.length, category: 'career' });
  out.push({ key: 'total_certifications', label: 'Certifications', value: certifications.length, category: 'career' });
  if (deals.length) out.push({ key: 'total_deals', label: 'Deal Transactions', value: deals.length, category: 'investor' });

  for (const { key, count } of groupCount(skills, (s) => s.category)) {
    out.push({ key: `skills_by_category:${key}`, label: `Skills · ${key}`, value: count, category: 'skills' });
  }
  for (const { key, count } of groupCount(jobs, (j) => j.industry)) {
    out.push({ key: `jobs_by_industry:${key}`, label: `Roles · ${key}`, value: count, category: 'industry' });
  }
  for (const { key, count } of groupCount(tools, (t) => t.wheelBucket)) {
    out.push({ key: `tools_by_bucket:${key}`, label: `Tools · ${key}`, value: count, category: 'tools' });
  }
  // Case study, certification, and domain groupings — the remaining Career
  // Master objects (skills/jobs/tools were already grouped above) — so the
  // Infographics builder can roll up any of the six Career Master tables,
  // not just three of them.
  for (const { key, count } of groupCount(engagements, (e) => e.industry)) {
    out.push({ key: `engagements_by_industry:${key}`, label: `Case Studies · ${key}`, value: count, category: 'case_studies' });
  }
  for (const { key, count } of groupCount(engagements, (e) => e.employer)) {
    out.push({ key: `engagements_by_employer:${key}`, label: `Case Studies · ${key}`, value: count, category: 'case_studies' });
  }
  for (const { key, count } of groupCount(certifications, (c) => c.category)) {
    out.push({ key: `certifications_by_category:${key}`, label: `Certifications · ${key}`, value: count, category: 'certifications' });
  }
  for (const { key, count } of groupCount(certifications, (c) => c.status)) {
    out.push({ key: `certifications_by_status:${key}`, label: `Certifications · ${key}`, value: count, category: 'certifications' });
  }
  for (const { key, count } of groupCount(domains, (d) => d.groupType)) {
    out.push({ key: `domains_by_group:${key}`, label: `Domains · ${key}`, value: count, category: 'domains' });
  }
  const activeCerts = certifications.filter((c) => c.status === 'active').length;
  if (certifications.length) out.push({ key: 'active_certifications', label: 'Active Certifications', value: activeCerts, category: 'career' });

  return out;
}

// ── Layer 2: change-over-time deltas (salary, AUM/exit value, ownership stake) ──
export function computeDeltaRollups(master) {
  const { jobs = [], deals = [] } = master;
  const out = [];

  const salaryJobs = jobs
    .map((j) => ({ year: parseYear(j.startDate), value: parseSalary(j.salary), label: j.title }))
    .filter((j) => j.year != null && j.value != null)
    .sort((a, b) => a.year - b.year);
  if (salaryJobs.length >= 2) {
    const first = salaryJobs[0];
    const last = salaryJobs[salaryJobs.length - 1];
    const changePct = first.value > 0 ? ((last.value - first.value) / first.value) * 100 : null;
    out.push({
      key: 'salary_progression',
      label: 'Base Salary Growth',
      series: salaryJobs.map((j) => ({ t: j.year, label: j.label, value: j.value })),
      change: fmtPct(changePct),
    });
  }

  const activeDeals = deals.filter((d) => Number(d.exitValueMusd) > 0 || Number(d.arrCurrentMusd) > 0);
  if (activeDeals.length) {
    const aumSeries = activeDeals
      .map((d) => ({ t: parseYear(d.entryDate), label: d.dealName, value: Number(d.exitValueMusd || d.arrCurrentMusd || 0) }))
      .filter((d) => d.t != null)
      .sort((a, b) => a.t - b.t);
    if (aumSeries.length >= 2) {
      const first = aumSeries[0].value;
      const last = aumSeries[aumSeries.length - 1].value;
      const changePct = first > 0 ? ((last - first) / first) * 100 : null;
      out.push({ key: 'portfolio_value_progression', label: 'Portfolio / AUM Growth (USD M)', series: aumSeries, change: fmtPct(changePct) });
    }

    const arrSeries = activeDeals
      .filter((d) => Number(d.arrEntryMusd) > 0 && Number(d.arrCurrentMusd) > 0)
      .map((d) => ({ dealName: d.dealName, entry: Number(d.arrEntryMusd), prior: Number(d.arrPriorYearMusd || d.arrEntryMusd), current: Number(d.arrCurrentMusd) }));
    if (arrSeries.length) {
      const totalEntry = arrSeries.reduce((s, d) => s + d.entry, 0);
      const totalCurrent = arrSeries.reduce((s, d) => s + d.current, 0);
      const changePct = totalEntry > 0 ? ((totalCurrent - totalEntry) / totalEntry) * 100 : null;
      out.push({
        key: 'arr_progression',
        label: 'ARR Growth Across Portfolio (USD M)',
        series: arrSeries.map((d) => ({ t: d.dealName, label: d.dealName, value: d.current })),
        change: fmtPct(changePct),
      });
    }

    const returnRows = activeDeals.filter((d) => Number(d.grossReturnPct) || Number(d.attributionPct));
    if (returnRows.length) {
      const avgReturn = returnRows.reduce((s, d) => s + Number(d.grossReturnPct || 0), 0) / returnRows.length;
      const avgAttribution = returnRows.reduce((s, d) => s + Number(d.attributionPct || 0), 0) / returnRows.length;
      out.push({
        key: 'ownership_return_progression',
        label: 'Ownership Stake / Expected Return',
        series: returnRows.map((d) => ({ t: d.dealName, label: d.stakeType || d.dealName, value: Number(d.grossReturnPct || 0) })),
        change: fmtPct(avgReturn),
        sublabel: `Avg. attribution ${fmtPct(avgAttribution)}`,
      });
    }
  }

  return out;
}

// ── Layer 3: tool/tech usage snapshot rolled up from engagement data ────────
export function computeToolUsageSnapshot(master) {
  const { tools = [], engagements = [] } = master;
  return tools.map((tool) => {
    const industries = new Set();
    for (const eng of engagements) {
      const roles = Array.isArray(eng.roles) ? eng.roles : [];
      const mentioned = roles.some((r) => String(r?.tool || r?.name || '').toLowerCase() === String(tool.nameUsed || '').toLowerCase());
      if (mentioned && eng.industry) industries.add(eng.industry);
    }
    return {
      tool: tool.currentName || tool.nameUsed,
      category: tool.category,
      wheelBucket: tool.wheelBucket,
      tier: tool.tier,
      roleCount: Number(tool.numRoles) || 0,
      industries: [...industries],
      firstUsed: tool.firstUsed,
    };
  });
}

// ── Layer 3: certification badges (finance/banking/accounting/investing) ────
const REGULATED_CERT_CATEGORIES = new Set(['finance', 'banking', 'accounting', 'investing', 'regulatory']);
export function computeCertBadges(master) {
  const { certifications = [] } = master;
  const relevant = certifications.filter((c) => REGULATED_CERT_CATEGORIES.has(String(c.category || '').toLowerCase()));
  const byStatus = new Map();
  for (const cert of relevant) {
    const status = cert.status || 'unknown';
    if (!byStatus.has(status)) byStatus.set(status, []);
    byStatus.get(status).push({ name: cert.name, issuer: cert.issuer, category: cert.category, expires: cert.expires, credentialId: cert.credentialId });
  }
  return [...byStatus.entries()].map(([status, items]) => ({ status, items }));
}

// ── Layer 3: overlap counts for venn diagrams (skills × industries, etc.) ───
export function computeCapabilityOverlap(master) {
  const { skills = [], engagements = [] } = master;
  const categories = [...new Set(skills.map((s) => s.category).filter(Boolean))];
  const industries = [...new Set(engagements.map((e) => e.industry).filter(Boolean))];
  const overlaps = [];
  for (const category of categories) {
    for (const industry of industries) {
      const catSkills = skills.filter((s) => s.category === category).map((s) => s.skill.toLowerCase());
      const relatedEngagements = engagements.filter((e) => e.industry === industry);
      const mentioned = relatedEngagements.some((e) => {
        const text = JSON.stringify(e.actions || '') + JSON.stringify(e.outcomes || '') + JSON.stringify(e.context || '');
        return catSkills.some((skill) => text.toLowerCase().includes(skill));
      });
      if (mentioned) overlaps.push({ category, industry, overlapCount: relatedEngagements.length });
    }
  }
  return overlaps;
}

// ── Aggregator consumed by GET /api/career/rollups ──────────────────────────
export function buildRollupCatalog(master) {
  return {
    staticRollups: computeStaticRollups(master),
    deltaRollups: computeDeltaRollups(master),
    toolUsage: computeToolUsageSnapshot(master),
    certBadges: computeCertBadges(master),
    overlaps: computeCapabilityOverlap(master),
  };
}
