// Keeps the live site consistent with an approved application package.
//
// Audits the admin DRAFT site (every page/section/field) and Career Master
// jobs against the facts stated in a package in server/data/applicationPackages/,
// prints each conflict, and — only with --apply — fixes the ones that have a
// safe, exact replacement, then saves the draft. It never publishes unless
// you also pass --publish, and never touches member rows.
//
// Usage:
//   node scripts/sync-site-with-application-package.mjs server/data/applicationPackages/acme-2026-09.json
//   node scripts/sync-site-with-application-package.mjs <package.json> --apply            # save draft
//   node scripts/sync-site-with-application-package.mjs <package.json> --apply --publish  # and publish
//
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (or SB_EMAIL +
// SB_PASSWORD). PUBLIC_BASE_URL selects the server (default: local dev API).
import 'dotenv/config';
import fs from 'node:fs';
import { rolesFromDocument, compareRolesWithCareerMaster } from '../server/lib/packageRoleCheck.js';

const [pkgPath, ...flags] = process.argv.slice(2);
if (!pkgPath) throw new Error('Usage: node scripts/sync-site-with-application-package.mjs <package.json> [--apply] [--publish]');
const APPLY = flags.includes('--apply');
const PUBLISH = flags.includes('--publish');
if (PUBLISH && !APPLY) throw new Error('--publish requires --apply');

const BASE = (process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const EMAIL = process.env.SB_EMAIL || process.env.ADMIN_EMAIL;
const PASS = process.env.SB_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
if (!EMAIL || !PASS) throw new Error('Set ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (or SB_EMAIL + SB_PASSWORD) in .env');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const atsResume = pkg.outputs.find((o) => o.variant === 'resume_ats') || pkg.outputs.find((o) => o.outputType === 'resume');
if (!atsResume) throw new Error('Package has no resume output to sync from.');

// ── Facts the package states, as checks against site text ────────────────
// `replace` is applied by --apply; checks without it are report-only because
// the right rewrite depends on the surrounding copy.
const FACTS = [
  {
    id: 'years',
    note: 'Package states 13 years of experience.',
    find: /\b12\+?(\s*(?:\+\s*)?years?\b)/gi,
    replace: (_m, rest) => `13${rest}`,
  },
  {
    id: 'years-stat',
    note: 'Stat tiles labelled "years" should read 13.',
    statValue: { labelRe: /years/i, from: /^12\+?$/, to: '13' },
  },
  {
    id: 'product-hos',
    note: 'HandoverOS was renamed SaltBasin HOS (Highway Operating System).',
    find: /\bHandoverOS\b/g,
    replace: () => 'SaltBasin HOS',
  },
  {
    id: 'product-chi',
    note: 'CardWise was renamed SaltTide CHI (Credit Health Infrastructure).',
    find: /\bCardWise\b/g,
    replace: () => 'SaltTide CHI',
  },
  {
    id: 'certifications',
    note: 'Package: "Previously held: Salesforce Administration, Platform Builder, Sales Cloud, Revenue Cloud".',
    find: /Salesforce\.com Certified(?:;| and) Salesforce CPQ Trained/g,
    replace: () => 'Previously held: Salesforce Administration, Platform Builder, Sales Cloud, Revenue Cloud',
  },
  {
    id: 'scope-claims',
    note: 'Package explicitly does not claim hands-on data science / BI engineering, and does not describe a fractional CFO role — review wording.',
    find: /\bfractional CFO\b|\bhands-on[^.]*\b(?:Snowflake|Tableau|data science|BI engineering)\b/gi,
  },
];

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function api(path, cookie, options = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(options.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${body.error || ''}`);
  return body;
}

// Walks every string inside a section's fields (including nested arrays/
// objects like stat lists), calling visit(value, setter, pathLabel).
function walkStrings(node, pathLabel, visit) {
  if (typeof node === 'string') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => {
      if (typeof child === 'string') visit(child, (v) => { node[i] = v; }, `${pathLabel}[${i}]`);
      else walkStrings(child, `${pathLabel}[${i}]`, visit);
    });
    return;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (typeof node[key] === 'string') visit(node[key], (v) => { node[key] = v; }, `${pathLabel}.${key}`);
      else walkStrings(node[key], `${pathLabel}.${key}`, visit);
    }
  }
}

function auditSite(site) {
  const findings = [];
  const pages = Array.isArray(site.pages) ? site.pages : Object.values(site.pages || {});
  for (const page of pages) {
    for (const section of page.sections || []) {
      const where = `${page.key || page.slug}/${section.id}`;
      walkStrings(section.fields || {}, 'fields', (value, set, path) => {
        for (const fact of FACTS) {
          if (!fact.find) continue;
          fact.find.lastIndex = 0;
          if (!fact.find.test(value)) continue;
          fact.find.lastIndex = 0;
          const next = fact.replace ? value.replace(fact.find, fact.replace) : null;
          findings.push({ fact: fact.id, where: `${where} ${path}`, note: fact.note, before: value, after: next });
          if (APPLY && next != null && next !== value) { set(next); value = next; }
        }
      });
      // Stat tiles: { label, value } objects anywhere in fields.
      const statFact = FACTS.find((f) => f.statValue);
      const visitStats = (node, path) => {
        if (Array.isArray(node)) return node.forEach((n, i) => visitStats(n, `${path}[${i}]`));
        if (!node || typeof node !== 'object') return;
        if (typeof node.label === 'string' && typeof node.value === 'string'
            && statFact.statValue.labelRe.test(node.label) && statFact.statValue.from.test(node.value.trim())) {
          findings.push({ fact: statFact.id, where: `${where} ${path}`, note: statFact.note, before: `${node.label}: ${node.value}`, after: `${node.label}: ${statFact.statValue.to}` });
          if (APPLY) node.value = statFact.statValue.to;
        }
        Object.keys(node).forEach((k) => visitStats(node[k], `${path}.${k}`));
      };
      visitStats(section.fields || {}, 'fields');
    }
  }
  return findings;
}

// Package roles vs Career Master jobs — report-only; Career Master is the
// editing surface for these. Same comparison the in-app provenance card uses.
function auditCareerJobs(jobs) {
  return compareRolesWithCareerMaster(rolesFromDocument(atsResume.content), jobs)
    .filter((r) => r.status !== 'match')
    .flatMap((r) => {
      if (r.status === 'missing') return [{ fact: 'career-job-missing', where: r.company, note: 'In the package but not in Career Master.', before: '', after: `${r.title} · ${r.dates}` }];
      const out = [];
      if (!r.titleMatch) out.push({ fact: 'career-job-title', where: `career_jobs#${r.careerMaster.id} ${r.company}`, note: 'Title differs from the package.', before: r.careerMaster.title, after: r.title });
      if (!r.datesMatch) out.push({ fact: 'career-job-dates', where: `career_jobs#${r.careerMaster.id} ${r.company}`, note: 'Dates differ from the package.', before: r.careerMaster.dates, after: r.dates });
      return out;
    });
}

function print(findings, heading) {
  console.log(`\n── ${heading}: ${findings.length} finding(s)`);
  for (const f of findings) {
    console.log(`• [${f.fact}] ${f.where}\n    ${f.note}\n    before: ${String(f.before).slice(0, 220)}${f.after != null ? `\n    after:  ${String(f.after).slice(0, 220)}` : '\n    (report only — edit by hand)'}`);
  }
}

const cookie = await login();
const draft = await api('/api/site/draft', cookie);
const siteFindings = auditSite(draft);
print(siteFindings, `Site draft vs ${pkg.packageKey}`);

const jobs = (await api('/api/career/jobs', cookie)).items || [];
print(auditCareerJobs(jobs), 'Career Master jobs (report only)');

const fixable = siteFindings.filter((f) => f.after != null && f.after !== f.before);
if (!APPLY) {
  console.log(`\nDry run — ${fixable.length} site fix(es) would be applied with --apply.`);
} else if (!fixable.length) {
  console.log('\nNothing to apply.');
} else {
  await api('/api/site/draft', cookie, { method: 'PUT', body: JSON.stringify(draft) });
  console.log(`\nSaved ${fixable.length} fix(es) to the site draft.`);
  if (PUBLISH) {
    await api('/api/site/publish', cookie, { method: 'POST' });
    console.log('Published.');
  } else {
    console.log('Review the draft in /admin, then publish (or re-run with --publish).');
  }
}
