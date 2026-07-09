// Career Master Data API — the single source of truth for Betsy's resume /
// portfolio content (skills, jobs, tools, engagements/case studies, and
// domains/niche-solutions/ventures). Feeds the public timeline, industry
// wheel, case studies, resume output templates, and the elevated public
// profile view.
//
//   GET  /api/career/master              → public, redacted (no client_name_real)
//   GET/POST/PATCH/DELETE /api/career/jobs
//   GET/POST/PATCH/DELETE /api/career/skills
//   GET/POST/PATCH/DELETE /api/career/tools
//   GET/POST/PATCH/DELETE /api/career/engagements
//   GET/POST/PATCH/DELETE /api/career/domains
//   POST /api/career/seed                → idempotent, admin-only
//
// Admin CRUD routes require requireAdmin (see server/auth.js), same as
// server/routes/backlog.js. The /master read is intentionally unauthenticated
// so public site blocks and /output/* pages can fetch it directly.

import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { careerMasterSeed } from '../data/career/seed.js';

const router = Router();

// ── field maps: camelCase (API) <-> snake_case (DB column) ────────────────
const JOB_FIELDS = {
  company: 'company', title: 'title', startDate: 'start_date', endDate: 'end_date',
  duration: 'duration', salary: 'salary', jobFunction: 'job_function', industry: 'industry',
  keyMetrics: 'key_metrics', orderIndex: 'order_index',
};
const SKILL_FIELDS = {
  skill: 'skill', category: 'category', tier: 'tier', yearsExp: 'years_exp',
  numEngagements: 'num_engagements', firstUsed: 'first_used', resumeLanguage: 'resume_language',
  orderIndex: 'order_index',
};
const TOOL_FIELDS = {
  nameUsed: 'name_used', currentName: 'current_name', category: 'category', tier: 'tier',
  firstUsed: 'first_used', numRoles: 'num_roles', notes: 'notes', wheelBucket: 'wheel_bucket',
  orderIndex: 'order_index',
};
const ENGAGEMENT_FIELDS = {
  name: 'name', employer: 'employer', clientNameReal: 'client_name_real', clientDisplayName: 'client_display_name',
  industry: 'industry', period: 'period', scale: 'scale', roles: 'roles', context: 'context', actions: 'actions',
  outcomes: 'outcomes', metrics: 'metrics', testimonial: 'testimonial', testimonialAttr: 'testimonial_attr',
  scenarios: 'scenarios', publishCaseStudy: 'publish_case_study', investmentType: 'investment_type',
  acquiredDetail: 'acquired_detail', exitDetail: 'exit_detail', financialReturn: 'financial_return',
  outcomeStatus: 'outcome_status', orderIndex: 'order_index',
};
const ENGAGEMENT_JSON_FIELDS = new Set(['roles', 'outcomes', 'metrics', 'scenarios']);
const DOMAIN_FIELDS = {
  groupType: 'group_type', title: 'title', icon: 'icon', description: 'description',
  items: 'items', accentColor: 'accent_color', extra: 'extra', orderIndex: 'order_index',
};
const DOMAIN_JSON_FIELDS = new Set(['items', 'extra']);

function rowToCamel(row, fieldMap, jsonFields = new Set()) {
  const out = { id: Number(row.id) };
  for (const [camel, snake] of Object.entries(fieldMap)) {
    let v = row[snake];
    if (jsonFields.has(camel) && typeof v === 'string') {
      try { v = JSON.parse(v); } catch { /* leave as-is */ }
    }
    out[camel] = v;
  }
  out.createdAt = row.created_at != null ? Number(row.created_at) : null;
  out.updatedAt = row.updated_at != null ? Number(row.updated_at) : null;
  return out;
}

function serializeVal(camel, value, jsonFields) {
  if (jsonFields.has(camel)) return JSON.stringify(value ?? (camel === 'extra' ? {} : []));
  return value === undefined ? null : value;
}

// Generic CRUD router for a career_* table.
function makeResourceRouter(table, fieldMap, jsonFields = new Set()) {
  const r = Router();

  r.get('/', async (req, res) => {
    const rows = await db.prepare(`SELECT * FROM ${table} ORDER BY order_index, id`).all();
    res.json({ items: rows.map((row) => rowToCamel(row, fieldMap, jsonFields)) });
  });

  r.post('/', async (req, res) => {
    const body = req.body || {};
    const cols = [];
    const placeholders = [];
    const vals = [];
    let i = 1;
    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] === undefined) continue;
      cols.push(snake);
      placeholders.push(`$${i++}`);
      vals.push(serializeVal(camel, body[camel], jsonFields));
    }
    const now = Date.now();
    cols.push('created_at', 'updated_at');
    placeholders.push(`$${i++}`, `$${i++}`);
    vals.push(now, now);
    const result = await db
      .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`)
      .run(...vals);
    res.json({ id: Number(result.lastInsertRowid) });
  });

  r.patch('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] === undefined) continue;
      sets.push(`${snake} = $${i++}`);
      vals.push(serializeVal(camel, body[camel], jsonFields));
    }
    if (!sets.length) return res.json({ ok: true, noop: true });
    sets.push(`updated_at = $${i++}`);
    vals.push(Date.now());
    vals.push(id);
    await db.prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i}`).run(...vals);
    res.json({ ok: true });
  });

  r.delete('/:id', async (req, res) => {
    await db.prepare(`DELETE FROM ${table} WHERE id = $1`).run(Number(req.params.id));
    res.json({ ok: true });
  });

  return r;
}

// ── public, redacted read (mounted before requireAdmin below) ─────────────
router.get('/master', async (req, res) => {
  try {
    const [jobRows, skillRows, toolRows, engagementRows, domainRows] = await Promise.all([
      db.prepare(`SELECT * FROM career_jobs ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_skills ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_tools ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_engagements WHERE publish_case_study = true ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_domains ORDER BY group_type, order_index, id`).all(),
    ]);

    const engagements = engagementRows.map((row) => {
      const item = rowToCamel(row, ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS);
      delete item.clientNameReal; // never expose the private real client name publicly
      return item;
    });

    res.json({
      jobs: jobRows.map((row) => rowToCamel(row, JOB_FIELDS)),
      skills: skillRows.map((row) => rowToCamel(row, SKILL_FIELDS)),
      tools: toolRows.map((row) => rowToCamel(row, TOOL_FIELDS)),
      engagements,
      domains: domainRows.map((row) => rowToCamel(row, DOMAIN_FIELDS, DOMAIN_JSON_FIELDS)),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load career master data' });
  }
});

// ── admin-only from here down ──────────────────────────────────────────────
router.use(requireAdmin);

router.use('/jobs', makeResourceRouter('career_jobs', JOB_FIELDS));
router.use('/skills', makeResourceRouter('career_skills', SKILL_FIELDS));
router.use('/tools', makeResourceRouter('career_tools', TOOL_FIELDS));
router.use('/engagements', makeResourceRouter('career_engagements', ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS));
router.use('/domains', makeResourceRouter('career_domains', DOMAIN_FIELDS, DOMAIN_JSON_FIELDS));

// ── seed ─────────────────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
  const counts = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*)::int FROM career_jobs) AS jobs,
         (SELECT COUNT(*)::int FROM career_skills) AS skills,
         (SELECT COUNT(*)::int FROM career_tools) AS tools,
         (SELECT COUNT(*)::int FROM career_engagements) AS engagements,
         (SELECT COUNT(*)::int FROM career_domains) AS domains`
    )
    .get();
  const alreadyPopulated = Object.values(counts).some((n) => Number(n) > 0);
  if (alreadyPopulated) {
    return res.json({ ok: true, skipped: true, reason: 'already populated', counts });
  }

  const { jobs, skills, tools, engagements, domains } = careerMasterSeed();
  const now = Date.now();

  for (let idx = 0; idx < jobs.length; idx++) {
    const j = jobs[idx];
    await db.prepare(`
      INSERT INTO career_jobs (company, title, start_date, end_date, duration, salary, job_function, industry, key_metrics, order_index, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
    `).run(j.company, j.title, j.startDate ?? null, j.endDate ?? null, j.duration ?? null, j.salary ?? null, j.jobFunction ?? null, j.industry ?? null, j.keyMetrics ?? null, idx, now);
  }

  for (let idx = 0; idx < skills.length; idx++) {
    const s = skills[idx];
    await db.prepare(`
      INSERT INTO career_skills (skill, category, tier, years_exp, num_engagements, first_used, resume_language, order_index, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    `).run(s.skill, s.category ?? null, s.tier ?? null, s.yearsExp ?? null, s.numEngagements ?? null, s.firstUsed ?? null, s.resumeLanguage ?? null, idx, now);
  }

  for (let idx = 0; idx < tools.length; idx++) {
    const t = tools[idx];
    await db.prepare(`
      INSERT INTO career_tools (name_used, current_name, category, tier, first_used, num_roles, notes, order_index, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    `).run(t.nameUsed, t.currentName ?? null, t.category ?? null, t.tier ?? null, t.firstUsed ?? null, t.numRoles ?? null, t.notes ?? null, idx, now);
  }

  for (let idx = 0; idx < engagements.length; idx++) {
    const e = engagements[idx];
    await db.prepare(`
      INSERT INTO career_engagements (
        name, employer, client_name_real, client_display_name, industry, period, scale, roles,
        context, actions, outcomes, metrics, testimonial, testimonial_attr, scenarios,
        investment_type, acquired_detail, exit_detail, financial_return, outcome_status,
        order_index, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$22)
    `).run(
      e.name, e.employer, e.clientNameReal ?? null, e.clientDisplayName, e.industry ?? null, e.period ?? null, e.scale ?? null,
      JSON.stringify(e.roles || []), e.context ?? null, e.actions ?? null, JSON.stringify(e.outcomes || []),
      JSON.stringify(e.metrics || []), e.testimonial ?? null, e.testimonialAttr ?? null, JSON.stringify(e.scenarios || []),
      e.investmentType ?? null, e.acquiredDetail ?? null, e.exitDetail ?? null, e.financialReturn ?? null, e.outcomeStatus ?? null,
      idx, now
    );
  }

  for (let idx = 0; idx < domains.length; idx++) {
    const d = domains[idx];
    await db.prepare(`
      INSERT INTO career_domains (group_type, title, icon, description, items, accent_color, extra, order_index, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
    `).run(d.groupType, d.title, d.icon ?? null, d.description ?? null, JSON.stringify(d.items || []), d.accentColor ?? null, JSON.stringify(d.extra || {}), idx, now);
  }

  res.json({
    ok: true,
    seeded: { jobs: jobs.length, skills: skills.length, tools: tools.length, engagements: engagements.length, domains: domains.length },
  });
});

export default router;
