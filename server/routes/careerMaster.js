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
import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { db, getJSON, setJSON } from '../db.js';
import { requireAdmin, requireUser, getUserFromCookie } from '../auth.js';
import { careerMasterSeed } from '../data/career/seed.js';

const router = Router();
const INTAKE_BUCKET = 'career-context';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const INTAKE_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/csv',
  'application/rtf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const intakeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!INTAKE_MIME.has(file.mimetype)) {
      return cb(new Error('Allowed files: PDF, Word, Excel, PowerPoint, text, CSV, RTF, JPG, PNG, or WebP'));
    }
    cb(null, true);
  },
});

let intakeBucketReady = null;
async function ensureIntakeBucket() {
  if (!supabase) return false;
  if (intakeBucketReady) return intakeBucketReady;
  intakeBucketReady = (async () => {
    const { error } = await supabase.storage.createBucket(INTAKE_BUCKET, {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024,
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      console.error('[career-intake] createBucket failed:', error.message);
    }
    return true;
  })();
  return intakeBucketReady;
}

function boolVal(value) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function intVal(value, fallback = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function cleanText(value, max = 4000) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
}

function docRow(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    ownerScope: row.owner_scope,
    intakeKind: row.intake_kind,
    sourceTruthStatus: row.source_truth_status,
    sourceUseScope: row.source_use_scope,
    clientNamePolicy: row.client_name_policy,
    portfolioNamePolicy: row.portfolio_name_policy,
    caseStudyTitlePolicy: row.case_study_title_policy,
    publicPrimaryResearch: !!row.public_primary_research,
    primaryResumeRequested: !!row.primary_resume_requested,
    analysisPassesRequested: Number(row.analysis_passes_requested || 3),
    redactionAck: !!row.redaction_ack,
    publicOutputValidationAck: !!row.public_output_validation_ack,
    noPrivateNamePersistenceAck: !!row.no_private_name_persistence_ack,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    uploadNotes: row.upload_notes,
    status: row.status,
    createdAt: row.created_at != null ? Number(row.created_at) : null,
    updatedAt: row.updated_at != null ? Number(row.updated_at) : null,
  };
}

function runRow(row) {
  let documentIds = [];
  let metadata = {};
  try { documentIds = typeof row.document_ids === 'string' ? JSON.parse(row.document_ids) : row.document_ids || []; } catch { documentIds = []; }
  try { metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {}; } catch { metadata = {}; }
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    ownerScope: row.owner_scope,
    runKind: row.run_kind,
    status: row.status,
    documentIds,
    analysisPassesRequested: Number(row.analysis_passes_requested || 3),
    primaryResumeRequested: !!row.primary_resume_requested,
    publicPrimaryResearch: !!row.public_primary_research,
    resumePresetCreated: !!row.resume_preset_created,
    summary: row.summary,
    metadata,
    createdAt: row.created_at != null ? Number(row.created_at) : null,
    updatedAt: row.updated_at != null ? Number(row.updated_at) : null,
  };
}

async function ensurePrimaryResumePreset(userId) {
  const row = await db.prepare(
    `SELECT data FROM member_json_store WHERE user_id = $1 AND key = $2`
  ).get(userId, 'resume_presets');
  const data = row ? JSON.parse(row.data) : { presets: [] };
  const presets = Array.isArray(data.presets) ? data.presets : [];
  const existing = presets.find((p) => p.id === 'career-master-primary');
  const primary = {
    ...(existing || {}),
    id: 'career-master-primary',
    name: existing?.name || 'Primary Resume',
    primaryResume: true,
    includedSections: existing?.includedSections || [],
    layout: existing?.layout || 'modern',
    showExecSummary: true,
    showCapabilityMeters: true,
    showIndustryBars: true,
    showToolBars: true,
    showClientVoice: true,
    outputSections: [
      'executive_summary',
      'capability_meters',
      'industry_duration',
      'tool_proficiency',
      'career_timeline',
      'case_study_portfolio',
    ],
    generatedFrom: 'career_master_intake',
    updatedAt: Date.now(),
  };
  const next = [primary, ...presets.filter((p) => p.id !== primary.id).map((p) => ({ ...p, primaryResume: false }))];
  const now = Date.now();
  await db.prepare(
    `INSERT INTO member_json_store (user_id, key, data, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(userId, 'resume_presets', JSON.stringify({ presets: next }), now);
  return primary;
}

async function loadCareerMasterRows() {
  const [jobs, skills, tools, engagements, domains] = await Promise.all([
    db.prepare(`SELECT * FROM career_jobs ORDER BY order_index, id`).all(),
    db.prepare(`SELECT * FROM career_skills ORDER BY order_index, id`).all(),
    db.prepare(`SELECT * FROM career_tools ORDER BY order_index, id`).all(),
    db.prepare(`SELECT * FROM career_engagements ORDER BY order_index, id`).all(),
    db.prepare(`SELECT * FROM career_domains ORDER BY group_type, order_index, id`).all(),
  ]);
  return { jobs, skills, tools, engagements, domains };
}

function careerMeta({ objectType, objectId = null, field = null, description, tags = [] }) {
  return {
    sourceType: 'career_master',
    mergedFrom: [objectType, objectId, field].filter(Boolean).join('.'),
    sources: [{ type: objectType, id: objectId, field }],
    capabilityTags: tags,
    description,
  };
}

function applyCareerMetadataToSite(site, master) {
  if (!site?.pages) return { site, updatedSections: 0 };
  let updatedSections = 0;
  const sortedJobs = [...master.jobs].sort((a, b) => {
    const ay = /present|current|ongoing/i.test(String(a.end_date || '')) ? 9999 : Number(String(a.end_date || a.start_date || '').match(/(19|20)\d{2}/)?.[0] || 0);
    const by = /present|current|ongoing/i.test(String(b.end_date || '')) ? 9999 : Number(String(b.end_date || b.start_date || '').match(/(19|20)\d{2}/)?.[0] || 0);
    return by - ay;
  });

  const pages = {};
  for (const [pageKey, page] of Object.entries(site.pages)) {
    pages[pageKey] = {
      ...page,
      sections: (page.sections || []).map((section) => {
        const fieldMeta = { ...(section.fieldMeta || {}) };
        let touched = false;
        const set = (fieldKey, meta) => {
          if (!section.fields || !(fieldKey in section.fields)) return;
          fieldMeta[fieldKey] = { ...(fieldMeta[fieldKey] || {}), ...meta };
          touched = true;
        };

        if (section.type === 'timeline') {
          sortedJobs.slice(0, 10).forEach((job, idx) => {
            const n = idx + 1;
            const id = Number(job.id);
            set(`job${n}Company`, careerMeta({ objectType: 'career_jobs', objectId: id, field: 'company', description: 'Company mapped from Career Master job history.', tags: ['career.role', 'career.timeline'] }));
            set(`job${n}Title`, careerMeta({ objectType: 'career_jobs', objectId: id, field: 'title', description: 'Role title mapped from Career Master job history.', tags: ['career.role', 'career.timeline'] }));
            set(`job${n}Dates`, careerMeta({ objectType: 'career_jobs', objectId: id, field: 'start_date/end_date', description: 'Role date range mapped from Career Master job history.', tags: ['career.role', 'career.timeline'] }));
            set(`job${n}Bullets`, careerMeta({ objectType: 'career_jobs', objectId: id, field: 'key_metrics', description: 'Role achievements mapped from Career Master job metrics.', tags: ['career.role', 'career.metrics'] }));
          });
        }

        if (section.type === 'industryWheel') {
          set('handsOn', careerMeta({ objectType: 'career_tools', field: 'tier/wheel_bucket', description: 'Hands-on tools mapped from Career Master tool proficiency.', tags: ['career.tools', 'career.proficiency'] }));
          set('integrationDesign', careerMeta({ objectType: 'career_tools', field: 'tier/wheel_bucket', description: 'Integration-design tools mapped from Career Master tool proficiency.', tags: ['career.tools', 'career.architecture'] }));
          set('adjacent', careerMeta({ objectType: 'career_tools', field: 'tier/wheel_bucket', description: 'Adjacent tools mapped from Career Master tool exposure.', tags: ['career.tools'] }));
        }

        if (section.type === 'caseStudies') {
          const firstEngagement = master.engagements[0];
          ['cases', 'items', 'case1Title', 'case1Body', 'case1Outcome'].forEach((fieldKey) => {
            set(fieldKey, careerMeta({ objectType: 'career_engagements', objectId: firstEngagement ? Number(firstEngagement.id) : null, field: 'context/actions/outcomes/metrics', description: 'Case study input mapped from Career Master engagements.', tags: ['career.engagement', 'career.case_study'] }));
          });
        }

        if (section.type === 'aboutIntro' || section.type === 'execDashboard' || section.type === 'resume') {
          ['introBody', 'founderBlurb', 'howIWork', 'p1', 'p2', 'p3', 'summary', 'headline'].forEach((fieldKey) => {
            set(fieldKey, careerMeta({ objectType: 'career_domains', field: 'profile_meta', description: 'Profile narrative mapped from Career Master profile/domain inputs.', tags: ['career.profile', 'career.summary'] }));
          });
          ['skills', 'skillGroups', 'capabilities'].forEach((fieldKey) => {
            set(fieldKey, careerMeta({ objectType: 'career_skills', field: 'skill/category/tier/resume_language', description: 'Skill content mapped from Career Master skills.', tags: ['career.skills', 'career.proficiency'] }));
          });
        }

        if (!touched) return section;
        updatedSections += 1;
        return { ...section, fieldMeta };
      }),
    };
  }
  return { site: { ...site, pages }, updatedSections };
}

async function readMemberDraftSite(userId) {
  const row = await db.prepare(`SELECT data FROM member_sites WHERE user_id = $1 AND kind = 'draft'`).get(userId);
  return row ? JSON.parse(row.data) : null;
}

async function writeMemberDraftSite(userId, site) {
  await db.prepare(`
    INSERT INTO member_sites (user_id, kind, data, updated_at)
    VALUES ($1, 'draft', $2, $3)
    ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(userId, JSON.stringify(site), Date.now());
}

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
// Investor / operating-principal extension (certifications with renewal
// tracking, deal transactions with per-deal role + individual return
// carve-out, and the recommended-selectable-values metadata layer).
const CERTIFICATION_FIELDS = {
  name: 'name', issuer: 'issuer', category: 'category', firstEarned: 'first_earned',
  lastRenewed: 'last_renewed', expires: 'expires', status: 'status',
  credentialId: 'credential_id', notes: 'notes', orderIndex: 'order_index',
};
const DEAL_FIELDS = {
  dealName: 'deal_name', portfolioCompany: 'portfolio_company', employerAtTime: 'employer_at_time',
  dealRole: 'deal_role', investmentType: 'investment_type', dealSize: 'deal_size',
  dealSizeMusd: 'deal_size_musd', entryDate: 'entry_date', exitDate: 'exit_date',
  exitValue: 'exit_value', exitValueMusd: 'exit_value_musd', grossReturnPct: 'gross_return_pct',
  attributionPct: 'attribution_pct', individualReturn: 'individual_return', stakeType: 'stake_type',
  outcomeStatus: 'outcome_status', isActivePortfolio: 'is_active_portfolio',
  arrEntryMusd: 'arr_entry_musd', arrPriorYearMusd: 'arr_prior_year_musd',
  arrCurrentMusd: 'arr_current_musd', notes: 'notes', orderIndex: 'order_index',
};
const META_OPTION_FIELDS = {
  fieldKey: 'field_key', value: 'value', description: 'description', orderIndex: 'order_index',
};

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
    const [jobRows, skillRows, toolRows, engagementRows, domainRows, certRows] = await Promise.all([
      db.prepare(`SELECT * FROM career_jobs ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_skills ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_tools ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_engagements WHERE publish_case_study = true ORDER BY order_index, id`).all(),
      db.prepare(`SELECT * FROM career_domains ORDER BY group_type, order_index, id`).all(),
      db.prepare(`SELECT * FROM career_certifications ORDER BY order_index, id`).all(),
    ]);

    const engagements = engagementRows.map((row) => {
      const item = rowToCamel(row, ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS);
      delete item.clientNameReal; // never expose the private real client name publicly
      return item;
    });

    const payload = {
      jobs: jobRows.map((row) => rowToCamel(row, JOB_FIELDS)),
      skills: skillRows.map((row) => rowToCamel(row, SKILL_FIELDS)),
      tools: toolRows.map((row) => rowToCamel(row, TOOL_FIELDS)),
      engagements,
      domains: domainRows.map((row) => rowToCamel(row, DOMAIN_FIELDS, DOMAIN_JSON_FIELDS)),
      certifications: certRows.map((row) => rowToCamel(row, CERTIFICATION_FIELDS)),
    };

    // Deal transactions carry private financial data (individual return
    // carve-outs, attribution) — only included for the admin, who is the
    // sole audience of the Investor Profile dashboard. Meta options ride
    // along so the dashboard can label recommended values.
    let isAdmin = false;
    try {
      const user = await getUserFromCookie(req);
      isAdmin = user?.role === 'admin';
    } catch { /* unauthenticated — public payload only */ }
    if (isAdmin) {
      const [dealRows, metaRows] = await Promise.all([
        db.prepare(`SELECT * FROM career_deals ORDER BY order_index, id`).all(),
        db.prepare(`SELECT * FROM career_meta_options ORDER BY field_key, order_index, id`).all(),
      ]);
      payload.deals = dealRows.map((row) => rowToCamel(row, DEAL_FIELDS));
      payload.metaOptions = metaRows.map((row) => rowToCamel(row, META_OPTION_FIELDS));
    }

    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load career master data' });
  }
});

// Authenticated intake endpoints sit before the admin-only CRUD boundary.
// Authenticated intake uploads for admin or member users. Uploaded source files
// live in a private Supabase bucket; Postgres stores only metadata and policy.
router.get('/intake-documents', requireUser, async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT * FROM career_intake_documents
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `).all(req.user.id);
    res.json({ items: rows.map(docRow) });
  } catch (e) {
    console.error('[career-intake] list documents failed:', e.message);
    res.status(500).json({ error: 'Failed to load intake documents' });
  }
});

router.post('/intake-documents', requireUser, (req, res) => {
  intakeUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    if (!supabase) {
      return res.status(500).json({ error: 'storage not configured (missing SUPABASE_URL / SERVICE_ROLE_KEY)' });
    }

    const redactionAck = boolVal(req.body.redactionAck);
    const outputAck = boolVal(req.body.publicOutputValidationAck);
    const noPrivateNameAck = boolVal(req.body.noPrivateNamePersistenceAck);
    if (!redactionAck || !outputAck || !noPrivateNameAck) {
      return res.status(400).json({ error: 'redaction, public-output validation, and private-name acknowledgements are required' });
    }

    try {
      await ensureIntakeBucket();
      const now = Date.now();
      const ownerScope = req.user.role === 'admin' ? 'admin' : 'member';
      const ext = path.extname(req.file.originalname || '').toLowerCase().slice(0, 12) || '.bin';
      const safeExt = /^[a-z0-9.]+$/.test(ext) ? ext : '.bin';
      const storageKey = `${ownerScope}/${req.user.id}/${now}-${crypto.randomBytes(10).toString('hex')}${safeExt}`;

      const { error: uploadErr } = await supabase.storage
        .from(INTAKE_BUCKET)
        .upload(storageKey, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadErr) return res.status(500).json({ error: uploadErr.message });

      const result = await db.prepare(`
        INSERT INTO career_intake_documents (
          user_id, owner_scope, intake_kind, source_truth_status, source_use_scope,
          client_name_policy, portfolio_name_policy, case_study_title_policy,
          public_primary_research, primary_resume_requested, analysis_passes_requested,
          redaction_ack, public_output_validation_ack, no_private_name_persistence_ack,
          original_filename, storage_bucket, storage_key, mime_type, file_size,
          upload_notes, status, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$22
        ) RETURNING id
      `).run(
        req.user.id,
        ownerScope,
        cleanText(req.body.intakeKind, 80) || 'career_context',
        cleanText(req.body.sourceTruthStatus, 80) || 'user_attested',
        cleanText(req.body.sourceUseScope, 80) || 'career_master_and_outputs',
        cleanText(req.body.clientNamePolicy, 80) || 'generalize_private_clients',
        cleanText(req.body.portfolioNamePolicy, 80) || 'allow_if_user_provided',
        cleanText(req.body.caseStudyTitlePolicy, 80) || 'industry_company_type',
        boolVal(req.body.publicPrimaryResearch),
        boolVal(req.body.primaryResumeRequested),
        intVal(req.body.analysisPassesRequested, 3),
        redactionAck,
        outputAck,
        noPrivateNameAck,
        cleanText(req.file.originalname, 255) || 'upload',
        INTAKE_BUCKET,
        storageKey,
        req.file.mimetype || null,
        req.file.size ?? null,
        cleanText(req.body.uploadNotes),
        'uploaded',
        now
      );

      const row = await db.prepare(`SELECT * FROM career_intake_documents WHERE id = $1`).get(result.lastInsertRowid);
      res.json({ ok: true, item: docRow(row) });
    } catch (e) {
      console.error('[career-intake] upload failed:', e.message);
      res.status(500).json({ error: 'Failed to save intake document' });
    }
  });
});

router.get('/intake-runs', requireUser, async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT * FROM career_intake_runs
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `).all(req.user.id);
    res.json({ items: rows.map(runRow) });
  } catch (e) {
    console.error('[career-intake] list runs failed:', e.message);
    res.status(500).json({ error: 'Failed to load intake runs' });
  }
});

router.post('/intake-runs', requireUser, async (req, res) => {
  try {
    const body = req.body || {};
    const requestedIds = Array.isArray(body.documentIds) ? body.documentIds.map(Number).filter(Number.isFinite) : [];
    let documentIds = [];
    if (requestedIds.length > 0) {
      const rows = await db.prepare(`
        SELECT id FROM career_intake_documents
        WHERE user_id = $1
      `).all(req.user.id);
      const allowed = new Set(rows.map((r) => Number(r.id)));
      documentIds = requestedIds.filter((id) => allowed.has(id));
    }

    const primaryResumeRequested = body.primaryResumeRequested !== false;
    const primaryResume = primaryResumeRequested ? await ensurePrimaryResumePreset(req.user.id) : null;
    const now = Date.now();
    const ownerScope = req.user.role === 'admin' ? 'admin' : 'member';
    const passes = intVal(body.analysisPassesRequested, 3);
    const publicResearch = boolVal(body.publicPrimaryResearch);
    const metadata = {
      sourcePriority: [
        'uploaded user sources marked source-of-truth or primary-validated',
        'public primary sources when requested',
        'user-attested or synthetic scenario patterns for non-public templates',
      ],
      privacyDefault: 'Generalize private client/project names to industry and company-type headlines.',
      caseStudyDefault: 'Employer-linked initiatives default to generalized case study titles unless user-approved for public naming.',
      resumePresetId: primaryResume?.id || null,
    };

    const result = await db.prepare(`
      INSERT INTO career_intake_runs (
        user_id, owner_scope, run_kind, status, document_ids, analysis_passes_requested,
        primary_resume_requested, public_primary_research, resume_preset_created,
        summary, metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
      RETURNING id
    `).run(
      req.user.id,
      ownerScope,
      cleanText(body.runKind, 80) || 'career_master_mapping',
      'queued',
      JSON.stringify(documentIds),
      passes,
      primaryResumeRequested,
      publicResearch,
      !!primaryResume,
      `Queued ${passes} Career Master analysis pass${passes === 1 ? '' : 'es'} across ${documentIds.length} uploaded source${documentIds.length === 1 ? '' : 's'}.`,
      JSON.stringify(metadata),
      now
    );

    const row = await db.prepare(`SELECT * FROM career_intake_runs WHERE id = $1`).get(result.lastInsertRowid);
    res.json({ ok: true, item: runRow(row), primaryResume });
  } catch (e) {
    console.error('[career-intake] create run failed:', e.message);
    res.status(500).json({ error: 'Failed to queue intake analysis' });
  }
});

router.post('/sync-site-metadata', requireUser, async (req, res) => {
  try {
    const scope = req.user.role === 'admin' && req.body?.scope !== 'member' ? 'admin' : 'member';
    const draft = scope === 'admin'
      ? ((await getJSON('site_state', 'draft')) || { pages: {} })
      : (await readMemberDraftSite(req.user.id));
    if (!draft) return res.status(404).json({ error: 'No draft site found to annotate' });

    const master = await loadCareerMasterRows();
    const result = applyCareerMetadataToSite(draft, master);
    if (scope === 'admin') await setJSON('site_state', 'draft', result.site);
    else await writeMemberDraftSite(req.user.id, result.site);
    res.json({ ok: true, scope, updatedSections: result.updatedSections });
  } catch (e) {
    console.error('[career] sync-site-metadata failed:', e.message);
    res.status(500).json({ error: 'Failed to sync site metadata from Career Master' });
  }
});

// Admin-only Career Master CRUD from here down.
router.use(requireAdmin);

router.use('/jobs', makeResourceRouter('career_jobs', JOB_FIELDS));
router.use('/skills', makeResourceRouter('career_skills', SKILL_FIELDS));
router.use('/tools', makeResourceRouter('career_tools', TOOL_FIELDS));
router.use('/engagements', makeResourceRouter('career_engagements', ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS));
router.use('/domains', makeResourceRouter('career_domains', DOMAIN_FIELDS, DOMAIN_JSON_FIELDS));
router.use('/certifications', makeResourceRouter('career_certifications', CERTIFICATION_FIELDS));
router.use('/deals', makeResourceRouter('career_deals', DEAL_FIELDS));
router.use('/meta-options', makeResourceRouter('career_meta_options', META_OPTION_FIELDS));

// ── seed ─────────────────────────────────────────────────────────────────
// Idempotent per table (not per call): each table is only seeded when it is
// empty, so re-running after adding a new table (e.g. certifications/deals/
// meta options) fills just the new tables without duplicating the old ones.
router.post('/seed', async (req, res) => {
  const counts = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*)::int FROM career_jobs) AS jobs,
         (SELECT COUNT(*)::int FROM career_skills) AS skills,
         (SELECT COUNT(*)::int FROM career_tools) AS tools,
         (SELECT COUNT(*)::int FROM career_engagements) AS engagements,
         (SELECT COUNT(*)::int FROM career_domains) AS domains,
         (SELECT COUNT(*)::int FROM career_certifications) AS certifications,
         (SELECT COUNT(*)::int FROM career_deals) AS deals,
         (SELECT COUNT(*)::int FROM career_meta_options) AS meta_options`
    )
    .get();
  const isEmpty = (key) => Number(counts[key]) === 0;
  if (!Object.keys(counts).some(isEmpty)) {
    return res.json({ ok: true, skipped: true, reason: 'already populated', counts });
  }

  const seedData = careerMasterSeed();
  const jobs = isEmpty('jobs') ? seedData.jobs : [];
  const skills = isEmpty('skills') ? seedData.skills : [];
  const tools = isEmpty('tools') ? seedData.tools : [];
  const engagements = isEmpty('engagements') ? seedData.engagements : [];
  const domains = isEmpty('domains') ? seedData.domains : [];
  const certifications = isEmpty('certifications') ? (seedData.certifications || []) : [];
  const deals = isEmpty('deals') ? (seedData.deals || []) : [];
  const metaOptions = isEmpty('meta_options') ? (seedData.metaOptions || []) : [];
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

  for (let idx = 0; idx < certifications.length; idx++) {
    const c = certifications[idx];
    await db.prepare(`
      INSERT INTO career_certifications (name, issuer, category, first_earned, last_renewed, expires, status, credential_id, notes, order_index, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
    `).run(c.name, c.issuer ?? null, c.category ?? null, c.firstEarned ?? null, c.lastRenewed ?? null, c.expires ?? null, c.status ?? null, c.credentialId ?? null, c.notes ?? null, idx, now);
  }

  for (let idx = 0; idx < deals.length; idx++) {
    const d = deals[idx];
    await db.prepare(`
      INSERT INTO career_deals (
        deal_name, portfolio_company, employer_at_time, deal_role, investment_type,
        deal_size, deal_size_musd, entry_date, exit_date, exit_value, exit_value_musd,
        gross_return_pct, attribution_pct, individual_return, stake_type, outcome_status,
        is_active_portfolio, arr_entry_musd, arr_prior_year_musd, arr_current_musd,
        notes, order_index, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23)
    `).run(
      d.dealName, d.portfolioCompany ?? null, d.employerAtTime ?? null, d.dealRole ?? null, d.investmentType ?? null,
      d.dealSize ?? null, d.dealSizeMusd ?? null, d.entryDate ?? null, d.exitDate ?? null, d.exitValue ?? null, d.exitValueMusd ?? null,
      d.grossReturnPct ?? null, d.attributionPct ?? null, d.individualReturn ?? null, d.stakeType ?? null, d.outcomeStatus ?? null,
      d.isActivePortfolio === true, d.arrEntryMusd ?? null, d.arrPriorYearMusd ?? null, d.arrCurrentMusd ?? null,
      d.notes ?? null, idx, now
    );
  }

  for (let idx = 0; idx < metaOptions.length; idx++) {
    const m = metaOptions[idx];
    await db.prepare(`
      INSERT INTO career_meta_options (field_key, value, description, order_index, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$5)
    `).run(m.fieldKey, m.value, m.description ?? null, idx, now);
  }

  res.json({
    ok: true,
    seeded: {
      jobs: jobs.length, skills: skills.length, tools: tools.length, engagements: engagements.length, domains: domains.length,
      certifications: certifications.length, deals: deals.length, metaOptions: metaOptions.length,
    },
  });
});

export default router;
