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
import { buildRollupCatalog } from '../lib/rollupMetrics.js';
import { syncSingleEntry, removeEntryEvidence } from '../lib/careerAtomMigration.js';
import { buildCareerAtomRollupCatalog } from '../lib/careerAtomRollups.js';
import { CAREER_ENTRY_SOURCES, sourceForTable, atomDefinitionByKey, isJsonbSourceColumn } from '../lib/careerAtomRegistry.js';
import { consentDefinition, getConsentStatus, recordConsent } from '../lib/consentRegistry.js';
import { recordInteraction } from '../lib/usageTracking.js';
import { buildCareerSemanticTemplateWorkbook } from '../lib/careerSemanticTemplate.js';
import { parseCareerSemanticWorkbook } from '../lib/careerSemanticImport.js';
import { extractResumeText, proposeCareerMappingsFromText, bondProposedMappings } from '../lib/careerResumeExtraction.js';
import { calculateCareerProficiencyRollup } from '../lib/careerProficiencyRollups.js';
import { getLiveToken } from './oauth.js';
import { PROVIDERS } from '../lib/oauthProviders.js';
import { TABLE_BY_ENTRY_TYPE, IDENTITY_COLUMNS_BY_ENTRY_TYPE, detectConflicts, detectAmbiguousMappings } from '../lib/careerReconciliation.js';

const router = Router();
const INTAKE_BUCKET = 'career-context';

// Source-platform kinds a member can explicitly pick on upload (Phase 1,
// 2026-08-10 — Career Foundation Sourcing & Reconciliation), alongside the
// original initial/incremental/context/case-study kinds. 'linkedin_oauth_pull'
// is written only by POST /intake-documents/linkedin-pull below, never
// client-selectable — it's a distinct, lower-information source, not
// something a member picks. intake_kind stays a free-text, display-only
// column (server/db.js:3356) — no migration needed for new values.
const PLATFORM_SOURCE_KINDS = new Set(['linkedin_export', 'indeed_export', 'fiverr_export']);

const EXPERIENCE_DEFINITION_TYPES = new Set(['period', 'proficiency_level', 'rollup', 'display']);
const DEFAULT_EXPERIENCE_DEFINITIONS = [
  ['period', 'foundation', 'Foundation', 'Initial exposure and capability development.', { startYear: null, endYear: null }, 10],
  ['period', 'established', 'Established', 'Repeated application and growing responsibility.', { startYear: null, endYear: null }, 20],
  ['period', 'current', 'Current', 'Recent and current-market proficiency.', { startYear: null, endYear: null }, 30],
  ['proficiency_level', 'exposure', 'Exposure', 'Aware of the concept or participated with guidance.', { ordinal: 1 }, 10],
  ['proficiency_level', 'foundational', 'Foundational', 'Can apply fundamentals with occasional guidance.', { ordinal: 2 }, 20],
  ['proficiency_level', 'proficient', 'Proficient', 'Can apply independently in common scenarios.', { ordinal: 3 }, 30],
  ['proficiency_level', 'advanced', 'Advanced', 'Handles complex scenarios and adapts the practice.', { ordinal: 4 }, 40],
  ['proficiency_level', 'expert', 'Expert', 'Repeatedly solves complex problems and guides others.', { ordinal: 5 }, 50],
  ['rollup', 'current_capability_strength', 'Current Capability Strength', 'Current-period weighted capability view.', { groupBy: 'capability', measure: 'weighted_proficiency', periodKeys: ['current'], weights: { proficiency: 0.5, recency: 0.2, engagementBreadth: 0.15, evidenceConfidence: 0.15 }, minimumEvidenceCount: 1 }, 10],
  ['display', 'capability_bars', 'Capability Bars', 'Public-ready bar view of the current capability rollup.', { rollupKey: 'current_capability_strength', chartType: 'bar', showPeriodSelector: true, showEvidenceCount: true, maxGroups: 8, visibility: 'private' }, 10],
];

async function ensureExperienceDefinitions(userId) {
  const existing = await db.prepare(`SELECT COUNT(*)::int AS count FROM career_experience_definitions WHERE user_id=$1`).get(userId);
  if (Number(existing?.count) > 0) return;
  const now = Date.now();
  for (const [type, key, label, description, definition, sortOrder] of DEFAULT_EXPERIENCE_DEFINITIONS) {
    await db.prepare(`
      INSERT INTO career_experience_definitions
        (user_id, definition_type, definition_key, label, description, definition, sort_order, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8)
      ON CONFLICT (user_id, definition_type, definition_key) DO NOTHING
    `).run(userId, type, key, label, description, definition, sortOrder, now);
  }
}

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

async function attachMappingSource(user, file, sourceKind) {
  if (!supabase) throw new Error('Source storage is not configured');
  await ensureIntakeBucket();
  const now = Date.now();
  const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12) || '.bin';
  const storageKey = `${user.role === 'admin' ? 'admin' : 'member'}/${user.id}/${now}-${crypto.randomBytes(10).toString('hex')}${ext}`;
  const { error } = await supabase.storage.from(INTAKE_BUCKET).upload(storageKey, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new Error(`Could not attach source: ${error.message}`);
  const prior = await db.prepare(`SELECT COUNT(*)::int AS count FROM career_intake_documents WHERE user_id=$1`).get(user.id);
  const intakeKind = Number(prior?.count || 0) === 0 ? 'initial_mapping' : 'incremental_mapping';
  const inserted = await db.prepare(`
    INSERT INTO career_intake_documents (
      user_id, owner_scope, intake_kind, source_truth_status, source_use_scope,
      client_name_policy, portfolio_name_policy, case_study_title_policy,
      public_primary_research, primary_resume_requested, analysis_passes_requested,
      redaction_ack, public_output_validation_ack, no_private_name_persistence_ack,
      original_filename, storage_bucket, storage_key, mime_type, file_size, status, retention_expires_at, created_at, updated_at
    ) VALUES ($1,$2,$3,'user_attested','career_master_and_outputs','never_publish_client_names',
      'generalize_all','industry_company_type',false,true,1,true,true,true,$4,$5,$6,$7,$8,'parsed',$9,$10,$10)
    RETURNING id
  `).run(user.id, user.role === 'admin' ? 'admin' : 'member', intakeKind, file.originalname || 'upload', INTAKE_BUCKET, storageKey, file.mimetype || null, file.size ?? null, now + 2_592_000_000, now);
  return { kind: sourceKind, documentId: Number(inserted.lastInsertRowid), filename: file.originalname || 'upload' };
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

async function loadCareerMasterRows(userId) {
  const [jobs, skills, tools, engagements, domains] = await Promise.all([
    db.prepare(`SELECT * FROM career_jobs WHERE user_id = $1 ORDER BY order_index, id`).all(userId),
    db.prepare(`SELECT * FROM career_skills WHERE user_id = $1 ORDER BY order_index, id`).all(userId),
    db.prepare(`SELECT * FROM career_tools WHERE user_id = $1 ORDER BY order_index, id`).all(userId),
    db.prepare(`SELECT * FROM career_engagements WHERE user_id = $1 ORDER BY order_index, id`).all(userId),
    db.prepare(`SELECT * FROM career_domains WHERE user_id = $1 ORDER BY group_type, order_index, id`).all(userId),
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
  if (jsonFields.has(camel)) return value ?? (camel === 'extra' ? {} : []);
  return value === undefined ? null : value;
}

// Generic CRUD router for a career_* table.
// Every career_* table now carries user_id (multi-tenancy retrofit — see
// db.js's career_jobs/etc ALTER TABLE + backfill). Mounted behind
// requireUser below, so req.user is always set: each member only ever
// sees/edits their own rows, mirroring the ownership model already used
// for member_sites/member_configs and output_templates.
// `scoped: false` opts a table out of per-user ownership — used only for
// career_meta_options, which has no user_id column (shared, admin-curated
// vocabulary, not per-member data).
function makeResourceRouter(table, fieldMap, jsonFields = new Set(), { scoped = true } = {}) {
  const r = Router();

  r.get('/', async (req, res) => {
    const rows = scoped
      ? await db.prepare(`SELECT * FROM ${table} WHERE user_id = $1 ORDER BY order_index, id`).all(req.user.id)
      : await db.prepare(`SELECT * FROM ${table} ORDER BY order_index, id`).all();
    res.json({ items: rows.map((row) => rowToCamel(row, fieldMap, jsonFields)) });
  });

  r.post('/', async (req, res) => {
    const body = req.body || {};
    const cols = scoped ? ['user_id'] : [];
    const placeholders = scoped ? ['$1'] : [];
    const vals = scoped ? [req.user.id] : [];
    let i = scoped ? 2 : 1;
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
    const newId = Number(result.lastInsertRowid);
    // Keep the Career Channel Rod's evidence in sync with the legacy CRUD —
    // fire-and-forget, same pattern as the audit-log calls elsewhere in this
    // codebase. Only applies to tables in CAREER_ENTRY_SOURCES (career_meta_
    // options has no rod to sync into and isn't part of that registry).
    if (scoped && sourceForTable(table)) {
      syncSingleEntry(req.user.id, table, newId).catch((e) => console.error('[careerMaster] atom sync failed:', e.message));
    }
    res.json({ id: newId });
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
    const where = scoped ? `WHERE id = $${i} AND user_id = $${i + 1}` : `WHERE id = $${i}`;
    if (scoped) vals.push(req.user.id);
    const result = await db.prepare(`UPDATE ${table} SET ${sets.join(', ')} ${where}`).run(...vals);
    if (!result.changes) return res.status(404).json({ error: 'Not found' });
    if (scoped && sourceForTable(table)) {
      syncSingleEntry(req.user.id, table, id).catch((e) => console.error('[careerMaster] atom sync failed:', e.message));
    }
    res.json({ ok: true });
  });

  r.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const result = scoped
      ? await db.prepare(`DELETE FROM ${table} WHERE id = $1 AND user_id = $2`).run(id, req.user.id)
      : await db.prepare(`DELETE FROM ${table} WHERE id = $1`).run(id);
    if (!result.changes) return res.status(404).json({ error: 'Not found' });
    if (scoped && sourceForTable(table)) {
      removeEntryEvidence(req.user.id, table, id).catch((e) => console.error('[careerMaster] atom evidence cleanup failed:', e.message));
    }
    res.json({ ok: true });
  });

  return r;
}

// ── owner resolution (multi-tenancy) ───────────────────────────────────────
// `?owner=<slug>` resolves to that member's user_id via member_profiles
// (same join pattern as memberSite.js's /by-slug routes). No `owner` param
// preserves every pre-retrofit call site exactly — it falls back to the
// platform admin's user_id, i.e. Betsy's own data, matching today's behavior.
let cachedAdminUserId = null;
async function resolveDefaultAdminUserId() {
  if (cachedAdminUserId != null) return cachedAdminUserId;
  const row = await db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`).get();
  cachedAdminUserId = row ? Number(row.id) : null;
  return cachedAdminUserId;
}
// `owner=me` resolves to the authenticated caller's own id — lets the
// (already-authenticated) builder/admin UI request its own Career Master
// data without needing to know its own profile slug. Exported for reuse by
// server/lib/dataSourceRegistry.js's generic rollup route.
export async function resolveOwnerUserId(ownerSlug, req) {
  if (ownerSlug === 'me') {
    const user = await getUserFromCookie(req).catch(() => null);
    if (user) return Number(user.id);
  } else if (ownerSlug) {
    const row = await db.prepare(`SELECT user_id FROM member_profiles WHERE slug = $1`).get(ownerSlug);
    if (row) return Number(row.user_id);
  }
  return resolveDefaultAdminUserId();
}

// ── public, redacted read (mounted before requireUser below) ──────────────
async function loadMasterPayload(req) {
  const ownerUserId = await resolveOwnerUserId(req.query.owner, req);
  const [jobRows, skillRows, toolRows, engagementRows, domainRows, certRows] = await Promise.all([
    db.prepare(`SELECT * FROM career_jobs WHERE user_id = $1 ORDER BY order_index, id`).all(ownerUserId),
    db.prepare(`SELECT * FROM career_skills WHERE user_id = $1 ORDER BY order_index, id`).all(ownerUserId),
    db.prepare(`SELECT * FROM career_tools WHERE user_id = $1 ORDER BY order_index, id`).all(ownerUserId),
    db.prepare(`SELECT * FROM career_engagements WHERE user_id = $1 AND publish_case_study = true ORDER BY order_index, id`).all(ownerUserId),
    db.prepare(`SELECT * FROM career_domains WHERE user_id = $1 ORDER BY group_type, order_index, id`).all(ownerUserId),
    db.prepare(`SELECT * FROM career_certifications WHERE user_id = $1 ORDER BY order_index, id`).all(ownerUserId),
  ]);

  const engagements = engagementRows.map((row) => {
    const item = rowToCamel(row, ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS);
    delete item.clientNameReal; // never expose the private real client name publicly
    item.clientDisplayName = item.industry ? `${item.industry} client` : 'Confidential client';
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
  // carve-outs, attribution) — only included when the requester IS the data
  // owner (their own private investor profile), not exposed to other
  // viewers even if they're viewing their own site. Meta options are shared,
  // admin-curated vocabulary — safe for any authenticated user to read.
  let user = null;
  try { user = await getUserFromCookie(req); } catch { /* unauthenticated — public payload only */ }
  if (user) {
    const [metaRows] = await Promise.all([
      db.prepare(`SELECT * FROM career_meta_options ORDER BY field_key, order_index, id`).all(),
    ]);
    payload.metaOptions = metaRows.map((row) => rowToCamel(row, META_OPTION_FIELDS));
  }
  if (user && Number(user.id) === ownerUserId) {
    const dealRows = await db.prepare(`SELECT * FROM career_deals WHERE user_id = $1 ORDER BY order_index, id`).all(ownerUserId);
    payload.deals = dealRows.map((row) => rowToCamel(row, DEAL_FIELDS));
  }

  return payload;
}

router.get('/master', async (req, res) => {
  try {
    const payload = await loadMasterPayload(req);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load career master data' });
  }
});

// Suggested stat-card / infographic catalog for the output-template pickers
// (layers 2 and 3 of the 4-layer output template system). Computed live off
// the same Career Master rows as /master — no separate storage.
router.get('/rollups', async (req, res) => {
  try {
    const master = await loadMasterPayload(req);
    res.json(buildRollupCatalog(master));
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute rollup catalog' });
  }
});

// Shared, non-personal vocabulary derived from seeded Career Master data.
// Members can search these values without copying another person's roles,
// employers, metrics, narratives, or engagements.
router.get('/catalogs', requireUser, async (req, res) => {
  try {
    const distinct = async (table, column) => (await db.prepare(
      `SELECT DISTINCT ${column} AS value FROM ${table} WHERE ${column} IS NOT NULL AND TRIM(${column}) <> '' ORDER BY value`
    ).all()).map((r) => r.value);
    const [skills, skillCategories, tools, toolCategories, industries, jobFunctions, domains, metaOptions] = await Promise.all([
      distinct('career_skills', 'skill'), distinct('career_skills', 'category'),
      distinct('career_tools', 'name_used'), distinct('career_tools', 'category'),
      distinct('career_jobs', 'industry'), distinct('career_jobs', 'job_function'),
      distinct('career_domains', 'title'),
      db.prepare(`SELECT * FROM career_meta_options ORDER BY field_key, order_index, id`).all(),
    ]);
    res.json({ skills, skillCategories, tools, toolCategories, industries, jobFunctions, domains, metaOptions: metaOptions.map((r) => rowToCamel(r, META_OPTION_FIELDS)) });
  } catch (e) {
    console.error('[career] catalogs failed:', e.message);
    res.status(500).json({ error: 'Failed to load career catalogs' });
  }
});

// Rollup catalog for the public Career Prospect layout (careerRollupShowcase
// block) — computed from Channel Rod evidence (journey_rod_evidence), not
// the legacy tables directly, per explicit design decision: the legacy
// career_* tables stay the editing surface, the Channel Rod is the read
// surface for anything member-facing/public. Same ?owner=<slug>|me
// resolution as /rollups above.
router.get('/atom-rollups', async (req, res) => {
  try {
    const ownerUserId = await resolveOwnerUserId(req.query.owner, req);
    res.json(await buildCareerAtomRollupCatalog(ownerUserId));
    // Orbit usage tracking (2026-07-27) — attributed to the profile owner
    // being queried, not the (possibly anonymous) viewer. Fire-and-forget,
    // after the response is sent, and never lets a missing entitlement rod
    // (e.g. no real member behind this owner id yet) fail the actual
    // request — same non-blocking pattern as this file's other tracking
    // calls elsewhere in the codebase.
    recordInteraction({ userId: ownerUserId, moduleKey: 'resume_career', interactionType: 'career_rollup_queried' })
      .catch((e) => console.warn('[careerMaster] atom-rollups usage tracking skipped:', e.message));
  } catch (e) {
    console.error('[careerMaster] atom-rollups failed:', e.message);
    res.status(500).json({ error: 'Failed to compute Career Atom rollup catalog' });
  }
});

// Consent gate (2026-07-16) — required before any career configuration,
// upload, or Career Orbit entry. See server/lib/consentRegistry.js.
// Publication-safe configurable rollup. This resolves only a member with a
// published site, an active display marked public, and public assertions.
router.get('/public-rollup/:slug/:displayKey', async (req, res) => {
  try {
    const owner = await db.prepare(`
      SELECT mp.user_id
        FROM member_profiles mp
        JOIN member_sites ms ON ms.user_id=mp.user_id AND ms.kind='published'
       WHERE mp.slug=$1
    `).get(req.params.slug);
    if (!owner) return res.status(404).json({ error: 'published profile not found' });
    const userId = Number(owner.user_id);
    const [definitionRows, assertionRows, skillRows, toolRows] = await Promise.all([
      db.prepare(`SELECT definition_type, definition_key, label, description, definition, sort_order, is_active FROM career_experience_definitions WHERE user_id=$1 AND is_active=true`).all(userId),
      db.prepare(`SELECT * FROM career_proficiency_assertions WHERE user_id=$1 AND visibility='public'`).all(userId),
      db.prepare(`SELECT id, skill, category FROM career_skills WHERE user_id=$1`).all(userId),
      db.prepare(`SELECT id, name_used, current_name, category FROM career_tools WHERE user_id=$1`).all(userId),
    ]);
    const definitions = definitionRows.map((row) => ({ type: row.definition_type, key: row.definition_key, label: row.label, description: row.description, definition: row.definition || {}, sortOrder: Number(row.sort_order), isActive: true }));
    const display = definitions.find((x) => x.type === 'display' && x.key === req.params.displayKey);
    if (!display || display.definition?.visibility !== 'public') return res.status(404).json({ error: 'public display not found' });
    const rollup = definitions.find((x) => x.type === 'rollup' && x.key === display.definition?.rollupKey);
    if (!rollup) return res.status(404).json({ error: 'public rollup policy not found' });
    const assertions = assertionRows.map((row) => ({ entityType: row.entity_type, entityId: Number(row.entity_id), periodKey: row.period_key, levelKey: row.level_key, confidence: Number(row.confidence), evidenceCount: Number(row.evidence_count), lastPracticedAt: row.last_practiced_at == null ? null : Number(row.last_practiced_at) }));
    const entities = [
      ...skillRows.map((row) => ({ type: 'skill', id: Number(row.id), label: row.skill, category: row.category })),
      ...toolRows.map((row) => ({ type: 'tool', id: Number(row.id), label: row.current_name || row.name_used, category: row.category })),
    ];
    const result = calculateCareerProficiencyRollup({ assertions, levels: definitions.filter((x) => x.type === 'proficiency_level'), periods: definitions.filter((x) => x.type === 'period'), entities, rollup });
    const maxGroups = Math.max(1, Math.min(50, Number(display.definition?.maxGroups) || 8));
    res.json({
      display: { key: display.key, label: display.label, description: display.description, chartType: display.definition?.chartType || 'bar', showPeriodSelector: display.definition?.showPeriodSelector === true, showEvidenceCount: display.definition?.showEvidenceCount === true },
      rollup: { ...result, groups: result.groups.slice(0, maxGroups) },
    });
  } catch (e) {
    console.error('[career] public configurable rollup failed:', e.message);
    res.status(500).json({ error: 'Failed to load public rollup' });
  }
});

router.get('/consent-status', requireUser, async (req, res) => {
  try {
    res.json(await getConsentStatus(req.user.id, req.query.consentType || 'career_portfolio'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/consent', requireUser, async (req, res) => {
  const { consentType = 'career_portfolio', granted, acknowledgementKeys } = req.body || {};
  if (typeof granted !== 'boolean') return res.status(400).json({ error: 'granted (boolean) is required' });
  try {
    const definition = consentDefinition(consentType);
    if (!definition) return res.status(400).json({ error: 'unknown consent type' });
    if (granted) {
      const supplied = new Set(Array.isArray(acknowledgementKeys) ? acknowledgementKeys : []);
      const missing = definition.acknowledgements.filter((item) => !supplied.has(item.key)).map((item) => item.key);
      if (missing.length) return res.status(400).json({ error: 'all current acknowledgements are required', missingAcknowledgements: missing });
    }
    const result = await recordConsent(req.user.id, consentType, granted, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      context: { acknowledgementKeys: acknowledgementKeys || [] },
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
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

      const prior = await db.prepare(`SELECT COUNT(*)::int AS count FROM career_intake_documents WHERE user_id=$1`).get(req.user.id);
      const requestedKind = cleanText(req.body.intakeKind, 40);
      const autoKind = Number(prior?.count || 0) === 0 ? 'initial_mapping' : 'incremental_mapping';
      const intakeKind = PLATFORM_SOURCE_KINDS.has(requestedKind) ? requestedKind : autoKind;
      const result = await db.prepare(`
        INSERT INTO career_intake_documents (
          user_id, owner_scope, intake_kind, source_truth_status, source_use_scope,
          client_name_policy, portfolio_name_policy, case_study_title_policy,
          public_primary_research, primary_resume_requested, analysis_passes_requested,
          redaction_ack, public_output_validation_ack, no_private_name_persistence_ack,
          original_filename, storage_bucket, storage_key, mime_type, file_size,
          upload_notes, status, retention_expires_at, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23
        ) RETURNING id
      `).run(
        req.user.id,
        ownerScope,
        intakeKind,
        cleanText(req.body.sourceTruthStatus, 80) || 'user_attested',
        cleanText(req.body.sourceUseScope, 80) || 'career_master_and_outputs',
        'never_publish_client_names',
        'generalize_all',
        'industry_company_type',
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
        now + 2_592_000_000,
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

// Pulls whatever LinkedIn's OAuth API actually exposes (basic identity only
// — see server/lib/oauthProviders.js's linkedin provider) and writes it
// through the exact same intake pipeline as any other uploaded source, so a
// LinkedIn connection is mechanically equal to a manual export upload, not a
// privileged code path. Real position/skills/recommendation history still
// requires the member exporting their LinkedIn data and uploading it as a
// 'linkedin_export' source (see PLATFORM_SOURCE_KINDS above).
router.post('/intake-documents/linkedin-pull', requireUser, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'storage not configured (missing SUPABASE_URL / SERVICE_ROLE_KEY)' });
  try {
    const live = await getLiveToken(req.user.id, 'linkedin');
    if (!live) return res.status(400).json({ error: 'Connect LinkedIn first (Integrations) before pulling a profile source.' });
    const identity = await PROVIDERS.linkedin.fetchIdentity(live.token);
    const now = Date.now();
    const text = [
      'LinkedIn Profile Pull (via connected LinkedIn account)',
      `Name: ${identity.label || 'Unknown'}`,
      `LinkedIn Member ID: ${identity.externalId || 'unknown'}`,
      '',
      "Note: LinkedIn's OAuth API only exposes basic identity (name) for a connected account — it does not provide position history, skills, or recommendations. For real career history, export your LinkedIn data (Settings & Privacy > Data Privacy > Get a copy of your data) and upload the export as a separate source.",
    ].join('\n');
    const buffer = Buffer.from(text, 'utf-8');
    await ensureIntakeBucket();
    const ownerScope = req.user.role === 'admin' ? 'admin' : 'member';
    const storageKey = `${ownerScope}/${req.user.id}/${now}-${crypto.randomBytes(10).toString('hex')}.txt`;
    const { error: uploadErr } = await supabase.storage.from(INTAKE_BUCKET).upload(storageKey, buffer, { contentType: 'text/plain', upsert: false });
    if (uploadErr) return res.status(500).json({ error: uploadErr.message });
    const result = await db.prepare(`
      INSERT INTO career_intake_documents (
        user_id, owner_scope, intake_kind, source_truth_status, source_use_scope,
        client_name_policy, portfolio_name_policy, case_study_title_policy,
        public_primary_research, primary_resume_requested, analysis_passes_requested,
        redaction_ack, public_output_validation_ack, no_private_name_persistence_ack,
        original_filename, storage_bucket, storage_key, mime_type, file_size,
        upload_notes, status, retention_expires_at, created_at, updated_at
      ) VALUES (
        $1,$2,'linkedin_oauth_pull','user_attested','career_master_and_outputs','never_publish_client_names',
        'generalize_all','industry_company_type',false,true,1,true,true,true,
        $3,$4,$5,'text/plain',$6,$7,'uploaded',$8,$9,$9
      ) RETURNING id
    `).run(
      req.user.id, ownerScope, 'linkedin-profile-pull.txt', INTAKE_BUCKET, storageKey, buffer.length,
      'Auto-captured from connected LinkedIn account (basic identity only).', now + 2_592_000_000, now
    );
    const row = await db.prepare(`SELECT * FROM career_intake_documents WHERE id = $1`).get(result.lastInsertRowid);
    res.json({ ok: true, item: docRow(row), limited: true });
  } catch (e) {
    console.error('[career-intake] linkedin pull failed:', e.message);
    res.status(500).json({ error: `LinkedIn pull failed: ${e.message}` });
  }
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
      documentIds,
      passes,
      primaryResumeRequested,
      publicResearch,
      !!primaryResume,
      `Queued ${passes} Career Master analysis pass${passes === 1 ? '' : 'es'} across ${documentIds.length} uploaded source${documentIds.length === 1 ? '' : 's'}.`,
      metadata,
      now
    );

    const row = await db.prepare(`SELECT * FROM career_intake_runs WHERE id = $1`).get(result.lastInsertRowid);
    res.json({ ok: true, item: runRow(row), primaryResume });
  } catch (e) {
    console.error('[career-intake] create run failed:', e.message);
    res.status(500).json({ error: 'Failed to queue intake analysis' });
  }
});

router.post('/intake-runs/:id/run', requireUser, async (req, res) => {
  const runId = Number(req.params.id);
  const run = await db.prepare(`SELECT * FROM career_intake_runs WHERE id = $1 AND user_id = $2`).get(runId, req.user.id);
  if (!run) return res.status(404).json({ error: 'Analysis run not found' });
  const documentIds = Array.isArray(run.document_ids) ? run.document_ids.map(Number) : [];
  if (!documentIds.length) return res.status(400).json({ error: 'This run has no attached sources' });
  if (!supabase) return res.status(503).json({ error: 'Source storage is not configured' });

  await db.prepare(`UPDATE career_intake_runs SET status = 'running', updated_at = $1 WHERE id = $2`).run(Date.now(), runId);
  try {
    const proposal = {};
    const sheetWarnings = [];
    const sourceErrors = [];
    for (const documentId of documentIds) {
      const doc = await db.prepare(`SELECT * FROM career_intake_documents WHERE id = $1 AND user_id = $2`).get(documentId, req.user.id);
      if (!doc) { sourceErrors.push({ documentId, error: 'Source not found' }); continue; }
      const { data, error } = await supabase.storage.from(doc.storage_bucket).download(doc.storage_key);
      if (error || !data) { sourceErrors.push({ documentId, filename: doc.original_filename, error: error?.message || 'Download failed' }); continue; }
      const buffer = Buffer.from(await data.arrayBuffer());
      let parsed;
      if (/\.xlsx?$/i.test(doc.original_filename || '')) {
        parsed = parseCareerSemanticWorkbook(buffer);
        sheetWarnings.push(...(parsed.sheetWarnings || []));
      } else if (/\.(pdf|docx|txt)$/i.test(doc.original_filename || '')) {
        const text = await extractResumeText(buffer, doc.mime_type, doc.original_filename);
        const raw = await proposeCareerMappingsFromText(text);
        if (raw.offline) throw new Error('AI analysis is not configured (missing ANTHROPIC_API_KEY)');
        parsed = { proposal: bondProposedMappings(raw) };
      } else {
        sourceErrors.push({ documentId, filename: doc.original_filename, error: 'Analysis currently supports PDF, DOCX, TXT, XLS, and XLSX sources' });
        continue;
      }
      for (const [entryType, entries] of Object.entries(parsed.proposal || {})) {
        proposal[entryType] ||= [];
        proposal[entryType].push(...entries.map((entry) => ({
          ...entry,
          documentId,
          sourceFilename: doc.original_filename,
          fieldBonds: Object.fromEntries(Object.entries(entry.fieldBonds || {}).map(([key, bond]) => [key, {
            ...bond, documentId, sourceFilename: doc.original_filename,
            sourceLocation: `${doc.original_filename}: ${bond.sourceLocation || bond.header || 'extracted source text'}`,
          }])),
        })));
      }
      await db.prepare(`UPDATE career_intake_documents SET status = 'analyzed', updated_at = $1 WHERE id = $2`).run(Date.now(), documentId);
    }
    const mappedEntries = Object.values(proposal).reduce((sum, items) => sum + items.length, 0);
    const now = Date.now();
    await db.prepare(`UPDATE career_intake_runs SET status = 'completed', summary = $1, metadata = $2::jsonb, updated_at = $3 WHERE id = $4`).run(
      `Analysis completed with ${mappedEntries} proposed Career Master entries across ${documentIds.length} source${documentIds.length === 1 ? '' : 's'}.`,
      { mappedEntries, sourceErrors }, now, runId
    );
    try { await detectAmbiguousMappings(req.user.id, proposal); } catch (e) { console.error('[career] ambiguous-mapping detection failed:', e.message); }
    res.json({ ok: true, runId, source: { kind: 'career_intake_run', runId, documentIds }, proposal, sheetWarnings, sourceErrors });
  } catch (e) {
    await db.prepare(`UPDATE career_intake_runs SET status = 'failed', summary = $1, updated_at = $2 WHERE id = $3`).run(e.message, Date.now(), runId);
    console.error('[career-intake] run failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync-site-metadata', requireUser, async (req, res) => {
  try {
    const scope = req.user.role === 'admin' && req.body?.scope !== 'member' ? 'admin' : 'member';
    const draft = scope === 'admin'
      ? ((await getJSON('site_state', 'draft')) || { pages: {} })
      : (await readMemberDraftSite(req.user.id));
    if (!draft) return res.status(404).json({ error: 'No draft site found to annotate' });

    const master = await loadCareerMasterRows(req.user.id);
    const result = applyCareerMetadataToSite(draft, master);
    if (scope === 'admin') await setJSON('site_state', 'draft', result.site);
    else await writeMemberDraftSite(req.user.id, result.site);
    res.json({ ok: true, scope, updatedSections: result.updatedSections });
  } catch (e) {
    console.error('[career] sync-site-metadata failed:', e.message);
    res.status(500).json({ error: 'Failed to sync site metadata from Career Master' });
  }
});

// ── Phase 1: Excel semantic template + AI resume extraction + preview-
// before-persist (2026-07-27) ── server/lib/careerSemanticTemplate.js,
// careerSemanticImport.js, and careerResumeExtraction.js hold the real
// logic; these routes are thin. Only /mappings/commit writes to the
// database — /semantic-template just generates a download, /semantic-import
// and /resume-analysis only parse/propose and return a preview payload for
// CareerMappingPreview.jsx. Scope note: unlike /intake-documents above,
// these routes don't persist the raw uploaded file to Supabase or create a
// career_intake_documents row — the proposal is transient (held in the
// browser until confirmed), which is what "preview before persisting"
// requires; the legacy intake-documents/intake-runs upload flow remains a
// separate, still-dormant system, not wired to this new path.
router.get('/semantic-template', requireUser, async (req, res) => {
  try {
    const buffer = await buildCareerSemanticTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="salt-basin-career-semantic-template.xlsx"');
    res.send(buffer);
  } catch (e) {
    console.error('[career] semantic-template failed:', e.message);
    res.status(500).json({ error: 'Failed to generate semantic template' });
  }
});

router.post('/semantic-import', requireUser, (req, res) => {
  intakeUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const source = await attachMappingSource(req.user, req.file, 'excel_semantic_import');
      const result = parseCareerSemanticWorkbook(req.file.buffer);
      res.json({ ok: true, source, ...result });
    } catch (e) {
      console.error('[career] semantic-import failed:', e.message);
      res.status(400).json({ error: `Could not parse workbook: ${e.message}` });
    }
  });
});

router.post('/resume-analysis', requireUser, (req, res) => {
  intakeUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const source = await attachMappingSource(req.user, req.file, 'ai_resume_extraction');
      const text = await extractResumeText(req.file.buffer, req.file.mimetype, req.file.originalname);
      if (!text.trim()) return res.status(400).json({ error: 'Could not extract any text from this file — try a different format' });
      const rawProposal = await proposeCareerMappingsFromText(text);
      if (rawProposal.offline) return res.status(503).json({ error: 'Resume analysis is not configured on this server (missing ANTHROPIC_API_KEY)' });
      const proposal = bondProposedMappings(rawProposal);
      try { await detectAmbiguousMappings(req.user.id, proposal); } catch (e) { console.error('[career] ambiguous-mapping detection failed:', e.message); }
      res.json({ ok: true, source, proposal, sheetWarnings: [], missingSheets: [], recognizedSheets: [] });
    } catch (e) {
      console.error('[career] resume-analysis failed:', e.message);
      res.status(500).json({ error: `Resume analysis failed: ${e.message}` });
    }
  });
});

router.post('/mappings/classify', requireUser, async (req, res) => {
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const classifications = [];
  const normalize = (value) => value == null ? '' : String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const table = TABLE_BY_ENTRY_TYPE[entry.entryType];
    if (!table) { classifications.push({ index, status: 'invalid' }); continue; }
    const columns = {};
    for (const [atomKey, value] of Object.entries(entry.values || {})) {
      const atom = atomDefinitionByKey(atomKey);
      if (atom?.entryType === entry.entryType) columns[atom.sourceColumn] = value;
    }
    const identityColumns = (IDENTITY_COLUMNS_BY_ENTRY_TYPE[entry.entryType] || []).filter((column) => columns[column] != null && columns[column] !== '');
    if (!identityColumns.length) { classifications.push({ index, status: 'new', reason: 'no_identity_match' }); continue; }
    const rows = await db.prepare(`SELECT * FROM ${table} WHERE user_id=$1`).all(req.user.id);
    const candidate = rows.find((row) => identityColumns.every((column) => normalize(row[column]) === normalize(columns[column])));
    if (!candidate) { classifications.push({ index, status: 'new' }); continue; }
    const changedFields = Object.entries(columns).filter(([column, value]) => normalize(candidate[column]) !== normalize(value)).map(([column]) => column);
    classifications.push({ index, status: changedFields.length ? 'update_review' : 'exact_duplicate', targetId: Number(candidate.id), changedFields });
  }
  res.json({ classifications });
});

const nextOrderIndexCache = new Map();
async function nextOrderIndex(table, userId) {
  const cacheKey = `${table}:${userId}`;
  if (nextOrderIndexCache.has(cacheKey)) {
    const next = nextOrderIndexCache.get(cacheKey);
    nextOrderIndexCache.set(cacheKey, next + 1);
    return next;
  }
  const row = await db.prepare(`SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM ${table} WHERE user_id = $1`).get(userId);
  const next = Number(row?.next ?? 0);
  nextOrderIndexCache.set(cacheKey, next + 1);
  return next;
}

// The only route in this Phase 1 group that persists anything. Writes each
// confirmed entry into its real legacy career_* table (the actual editing
// surface, per this file's own header comment) so the classic
// CareerMasterPanel immediately shows what was imported, then reuses the
// already-shipped syncSingleEntry() to populate journey_rod_evidence —
// same single write-path every other Career Master create already uses, not
// a second parallel evidence-only write.
router.post('/mappings/commit', requireUser, async (req, res) => {
  const body = req.body || {};
  const source = typeof body.source === 'object' && body.source ? body.source : { kind: body.source || 'career_mapping_commit' };
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (!entries.length) return res.status(400).json({ error: 'entries (non-empty array) is required' });

  const created = [];
  const updated = [];
  const skipped = [];
  const errors = [];
  const now = Date.now();
  nextOrderIndexCache.clear();

  for (const entry of entries) {
    const table = TABLE_BY_ENTRY_TYPE[entry.entryType];
    if (!table) { errors.push({ entryType: entry.entryType, error: 'Unknown entry type' }); continue; }
    const values = entry.values || {};
    const cols = ['user_id'];
    const placeholders = ['$1'];
    const vals = [req.user.id];
    let i = 2;
    let touchedAny = false;
    const comparison = [];
    for (const [atomKey, rawValue] of Object.entries(values)) {
      if (rawValue === null || rawValue === undefined || rawValue === '') continue;
      const atomDef = atomDefinitionByKey(atomKey);
      if (!atomDef || atomDef.entryType !== entry.entryType) {
        errors.push({ entryType: entry.entryType, atomKey, error: 'Unknown or mismatched atom' });
        continue;
      }
      const column = atomDef.sourceColumn;
      cols.push(column);
      if (isJsonbSourceColumn(column)) {
        placeholders.push(`$${i++}::jsonb`);
        let jsonValue = rawValue;
        if (typeof rawValue === 'string') {
          try { jsonValue = JSON.parse(rawValue); } catch { jsonValue = [rawValue]; }
        }
        const persistedValue = Array.isArray(jsonValue) ? jsonValue : [jsonValue];
        vals.push(persistedValue);
        comparison.push([column, persistedValue]);
      } else {
        placeholders.push(`$${i++}`);
        vals.push(rawValue);
        comparison.push([column, rawValue]);
      }
      touchedAny = true;
    }
    if (!touchedAny) { errors.push({ entryType: entry.entryType, error: 'No recognized fields to save' }); continue; }

    // Cautious incremental import: an exact normalized match is evidence that
    // the fact already exists, so do not insert or double-count it. This is
    // intentionally conservative; ambiguous near-matches remain reviewable
    // additions rather than silently overwriting a member's foundation.
    const existingRows = await db.prepare(`SELECT id, ${comparison.map(([column]) => column).join(', ')} FROM ${table} WHERE user_id=$1`).all(req.user.id);
    const normalize = (value) => {
      if (value === null || value === undefined) return '';
      if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
      return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
    };
    const exact = existingRows.find((row) => comparison.every(([column, value]) => normalize(row[column]) === normalize(value)));
    if (exact) {
      skipped.push({ entryType: entry.entryType, table, id: Number(exact.id), reason: 'exact_duplicate' });
      continue;
    }
    const identityColumns = (IDENTITY_COLUMNS_BY_ENTRY_TYPE[entry.entryType] || []).filter((column) => comparison.some(([candidate]) => candidate === column));
    const identityMatch = identityColumns.length ? existingRows.find((row) => identityColumns.every((column) => normalize(row[column]) === normalize(comparison.find(([candidate]) => candidate === column)?.[1]))) : null;
    if (identityMatch) {
      const updateValues = comparison.map(([, value]) => value);
      const updateAssignments = comparison.map(([column, value], index) => `${column}=$${index + 1}${Array.isArray(value) || (value && typeof value === 'object') ? '::jsonb' : ''}`);
      updateValues.push(now, Number(identityMatch.id), req.user.id);
      await db.prepare(`UPDATE ${table} SET ${updateAssignments.join(', ')}, updated_at=$${comparison.length + 1} WHERE id=$${comparison.length + 2} AND user_id=$${comparison.length + 3}`).run(...updateValues);
      await syncSingleEntry(req.user.id, table, Number(identityMatch.id));
      for (const mapping of Array.isArray(entry.mappings) ? entry.mappings : []) {
        await db.prepare(`INSERT INTO career_source_mappings (user_id,document_id,source_kind,source_filename,source_location,source_label,entry_type,target_table,target_id,atom_key,original_value,committed_value,match_type,affinity,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15)`).run(req.user.id, mapping.documentId || source.documentId || null, source.kind, mapping.sourceFilename || source.filename || null, mapping.sourceLocation || null, mapping.sourceLabel || null, entry.entryType, table, Number(identityMatch.id), mapping.atomKey, JSON.stringify(mapping.originalValue ?? null), JSON.stringify(mapping.committedValue ?? null), mapping.matchType || 'incremental_update', Number.isFinite(Number(mapping.affinity)) ? Number(mapping.affinity) : null, now);
      }
      updated.push({ entryType: entry.entryType, table, id: Number(identityMatch.id), changedFields: comparison.map(([column]) => column) });
      continue;
    }

    cols.push('order_index', 'created_at', 'updated_at');
    placeholders.push(`$${i++}`, `$${i++}`, `$${i++}`);
    vals.push(await nextOrderIndex(table, req.user.id), now, now);

    try {
      const result = await db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`).run(...vals);
      const newId = Number(result.lastInsertRowid);
      await syncSingleEntry(req.user.id, table, newId);
      for (const mapping of Array.isArray(entry.mappings) ? entry.mappings : []) {
        await db.prepare(`
          INSERT INTO career_source_mappings (
            user_id, document_id, source_kind, source_filename, source_location, source_label,
            entry_type, target_table, target_id, atom_key, original_value, committed_value,
            match_type, affinity, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15)
        `).run(req.user.id, mapping.documentId || source.documentId || null, source.kind, mapping.sourceFilename || source.filename || null,
          mapping.sourceLocation || null, mapping.sourceLabel || null, entry.entryType, table, newId,
          mapping.atomKey, JSON.stringify(mapping.originalValue ?? null), JSON.stringify(mapping.committedValue ?? null),
          mapping.matchType || null, Number.isFinite(Number(mapping.affinity)) ? Number(mapping.affinity) : null, now);
      }
      created.push({ entryType: entry.entryType, table, id: newId });
    } catch (e) {
      console.error('[career] mappings/commit insert failed:', e.message);
      errors.push({ entryType: entry.entryType, error: e.message });
    }
  }

  try {
    await db.prepare(`
      INSERT INTO career_intake_runs (
        user_id, owner_scope, run_kind, status, document_ids, analysis_passes_requested,
        primary_resume_requested, public_primary_research, resume_preset_created,
        summary, metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,'completed',$4,1,false,false,false,$5,$6,$7,$7)
    `).run(
      req.user.id,
      req.user.role === 'admin' ? 'admin' : 'member',
      cleanText(source.kind, 80) || 'career_mapping_commit',
      [],
      `Committed ${created.length} Career Master entr${created.length === 1 ? 'y' : 'ies'} from ${body.source === 'ai_resume_extraction' ? 'AI resume analysis' : 'semantic Excel import'}.`,
      { created, errors, source },
      now
    );
  } catch (e) {
    console.error('[career] failed to record intake run for mappings commit:', e.message);
  }

  try { await detectConflicts(req.user.id); } catch (e) { console.error('[career] conflict detection failed:', e.message); }

  res.json({ ok: true, created, updated, skipped, errors });
});

// Bounded Career World BestyStaff: deterministic, schema-aware mutations
// only. It does not call an LLM or external API. The UI submits an explicit
// target and field patch, this route validates ownership/field authority,
// applies the change, and returns an auditable summary.
const BOUNDED_CAREER_TARGETS = {
  job: ['career_jobs', JOB_FIELDS, new Set()],
  skill: ['career_skills', SKILL_FIELDS, new Set()],
  tool: ['career_tools', TOOL_FIELDS, new Set()],
  engagement: ['career_engagements', ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS],
  domain: ['career_domains', DOMAIN_FIELDS, DOMAIN_JSON_FIELDS],
  certification: ['career_certifications', CERTIFICATION_FIELDS, new Set()],
  deal: ['career_deals', DEAL_FIELDS, new Set()],
};

router.post('/bounded-agent/action', requireUser, async (req, res) => {
  const { targetType, targetId, changes } = req.body || {};
  if (targetType === 'resumePreset') {
    if (!targetId || !changes || typeof changes !== 'object' || Array.isArray(changes)) return res.status(400).json({ error: 'Resume preset id and changes object are required' });
    const row = await db.prepare(`SELECT data FROM member_configs WHERE user_id=$1 AND kind='draft'`).get(req.user.id);
    const config = row ? JSON.parse(row.data) : {};
    const presets = Array.isArray(config.resumePresets) ? config.resumePresets : [];
    const index = presets.findIndex((preset) => String(preset.id) === String(targetId));
    if (index < 0) return res.status(404).json({ error: 'Resume preset not found in this member scope' });
    const allowed = ['name', 'isDefault', 'sections'];
    const patch = Object.fromEntries(Object.entries(changes).filter(([field]) => allowed.includes(field)));
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'No authorized resume-template fields supplied' });
    presets[index] = { ...presets[index], ...patch };
    if (patch.isDefault === true) presets.forEach((preset, presetIndex) => { if (presetIndex !== index) preset.isDefault = false; });
    config.resumePresets = presets;
    await db.prepare(`INSERT INTO member_configs (user_id,kind,data,updated_at) VALUES ($1,'draft',$2,$3) ON CONFLICT (user_id,kind) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`).run(req.user.id, JSON.stringify(config), Date.now());
    return res.json({ ok: true, agent: 'Career World BestyStaff', runtime: 'deterministic_no_llm', targetType, targetId: String(targetId), updatedFields: Object.keys(patch) });
  }
  const definition = BOUNDED_CAREER_TARGETS[targetType];
  if (!definition) return res.status(400).json({ error: 'Unsupported Career World target type' });
  if (!Number.isInteger(Number(targetId)) || !changes || typeof changes !== 'object' || Array.isArray(changes)) return res.status(400).json({ error: 'targetId and changes object are required' });
  const [table, fieldMap, jsonFields] = definition;
  const blocked = new Set(['clientNameReal', 'clientDisplayName', 'portfolioCompany']);
  const accepted = Object.entries(changes).filter(([field]) => fieldMap[field] && !blocked.has(field));
  if (!accepted.length) return res.status(400).json({ error: 'No authorized fields supplied' });
  const existing = await db.prepare(`SELECT id FROM ${table} WHERE id=$1 AND user_id=$2`).get(Number(targetId), req.user.id);
  if (!existing) return res.status(404).json({ error: 'Career record not found in this member scope' });
  const params = [];
  const assignments = accepted.map(([field, value], index) => {
    params.push(serializeVal(field, value, jsonFields));
    return `${fieldMap[field]}=$${index + 1}${jsonFields.has(field) ? '::jsonb' : ''}`;
  });
  params.push(Date.now(), Number(targetId), req.user.id);
  await db.prepare(`UPDATE ${table} SET ${assignments.join(', ')}, updated_at=$${accepted.length + 1} WHERE id=$${accepted.length + 2} AND user_id=$${accepted.length + 3}`).run(...params);
  await syncSingleEntry(req.user.id, table, Number(targetId));
  res.json({ ok: true, agent: 'Career World BestyStaff', runtime: 'deterministic_no_llm', targetType, targetId: Number(targetId), updatedFields: accepted.map(([field]) => field) });
});

// Career Master CRUD is member-owned from here down (multi-tenancy retrofit
// — each member manages their own jobs/skills/tools/engagements/domains/
// certifications/deals, same trust model as member_sites/member_configs).
// /meta-options stays admin-only below — it's shared, admin-curated
// vocabulary (recommended dropdown values), not per-member data.
router.use(requireUser);

router.use('/jobs', makeResourceRouter('career_jobs', JOB_FIELDS));
router.use('/skills', makeResourceRouter('career_skills', SKILL_FIELDS));
router.use('/tools', makeResourceRouter('career_tools', TOOL_FIELDS));
router.use('/engagements', makeResourceRouter('career_engagements', ENGAGEMENT_FIELDS, ENGAGEMENT_JSON_FIELDS));
router.use('/domains', makeResourceRouter('career_domains', DOMAIN_FIELDS, DOMAIN_JSON_FIELDS));
router.use('/certifications', makeResourceRouter('career_certifications', CERTIFICATION_FIELDS));
router.use('/deals', makeResourceRouter('career_deals', DEAL_FIELDS));
router.use('/meta-options', requireAdmin, makeResourceRouter('career_meta_options', META_OPTION_FIELDS, undefined, { scoped: false }));

// ── seed ─────────────────────────────────────────────────────────────────
// Idempotent per table (not per call): each table is only seeded when it is
// empty, so re-running after adding a new table (e.g. certifications/deals/
// meta options) fills just the new tables without duplicating the old ones.
// Configurable vocabulary, aggregation, and display definitions for the
// member's connected Career Master experience. Definitions are always scoped
// to the authenticated user; a caller cannot select another owner by id.
router.get('/experience-definitions', requireUser, async (req, res) => {
  await ensureExperienceDefinitions(req.user.id);
  const rows = await db.prepare(`
    SELECT definition_type, definition_key, label, description, definition,
           sort_order, is_active, updated_at
      FROM career_experience_definitions
     WHERE user_id=$1
     ORDER BY definition_type, sort_order, definition_key
  `).all(req.user.id);
  res.json({ definitions: rows.map((row) => ({
    type: row.definition_type,
    key: row.definition_key,
    label: row.label,
    description: row.description,
    definition: row.definition || {},
    sortOrder: Number(row.sort_order),
    isActive: row.is_active !== false,
    updatedAt: Number(row.updated_at),
  })) });
});

router.put('/experience-definitions/:type/:key', requireUser, async (req, res) => {
  const type = String(req.params.type || '');
  const key = String(req.params.key || '');
  if (!EXPERIENCE_DEFINITION_TYPES.has(type)) return res.status(400).json({ error: 'invalid definition type' });
  if (!/^[a-z][a-z0-9_]{1,79}$/.test(key)) return res.status(400).json({ error: 'definition key must be lowercase letters, numbers, and underscores' });
  const body = req.body || {};
  const label = String(body.label || '').trim().slice(0, 120);
  if (!label) return res.status(400).json({ error: 'label is required' });
  const definition = body.definition && typeof body.definition === 'object' && !Array.isArray(body.definition) ? body.definition : {};
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0;
  const now = Date.now();
  await db.prepare(`
    INSERT INTO career_experience_definitions
      (user_id, definition_type, definition_key, label, description, definition, sort_order, is_active, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$9)
    ON CONFLICT (user_id, definition_type, definition_key) DO UPDATE SET
      label=EXCLUDED.label, description=EXCLUDED.description, definition=EXCLUDED.definition,
      sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active, updated_at=EXCLUDED.updated_at
  `).run(req.user.id, type, key, label, body.description ? String(body.description).slice(0, 600) : null,
    definition, sortOrder, body.isActive !== false, now);
  res.json({ ok: true, updatedAt: now });
});

router.delete('/experience-definitions/:type/:key', requireUser, async (req, res) => {
  const type = String(req.params.type || '');
  const key = String(req.params.key || '');
  if (!EXPERIENCE_DEFINITION_TYPES.has(type)) return res.status(400).json({ error: 'invalid definition type' });
  await db.prepare(`DELETE FROM career_experience_definitions WHERE user_id=$1 AND definition_type=$2 AND definition_key=$3`)
    .run(req.user.id, type, key);
  res.json({ ok: true });
});

router.get('/proficiency-assertions', async (req, res) => {
  const rows = await db.prepare(`
    SELECT id, entity_type, entity_id, period_key, level_key, confidence,
           assessment_source, evidence_count, last_practiced_at, visibility,
           notes, updated_at
      FROM career_proficiency_assertions
     WHERE user_id=$1
     ORDER BY entity_type, entity_id, period_key
  `).all(req.user.id);
  res.json({ assertions: rows.map((row) => ({
    id: Number(row.id), entityType: row.entity_type, entityId: Number(row.entity_id),
    periodKey: row.period_key, levelKey: row.level_key, confidence: Number(row.confidence),
    assessmentSource: row.assessment_source, evidenceCount: Number(row.evidence_count),
    lastPracticedAt: row.last_practiced_at == null ? null : Number(row.last_practiced_at),
    visibility: row.visibility, notes: row.notes, updatedAt: Number(row.updated_at),
  })) });
});

router.put('/proficiency-assertions/:entityType/:entityId/:periodKey', async (req, res) => {
  const entityType = String(req.params.entityType || '');
  const entityId = Number(req.params.entityId);
  const periodKey = String(req.params.periodKey || '');
  const entityTable = entityType === 'skill' ? 'career_skills' : entityType === 'tool' ? 'career_tools' : null;
  if (!entityTable || !Number.isInteger(entityId) || entityId <= 0) return res.status(400).json({ error: 'invalid career entity' });
  const entity = await db.prepare(`SELECT id FROM ${entityTable} WHERE id=$1 AND user_id=$2`).get(entityId, req.user.id);
  if (!entity) return res.status(404).json({ error: 'career entity not found' });
  const period = await db.prepare(`SELECT 1 FROM career_experience_definitions WHERE user_id=$1 AND definition_type='period' AND definition_key=$2 AND is_active=true`).get(req.user.id, periodKey);
  const levelKey = String(req.body?.levelKey || '');
  const level = await db.prepare(`SELECT 1 FROM career_experience_definitions WHERE user_id=$1 AND definition_type='proficiency_level' AND definition_key=$2 AND is_active=true`).get(req.user.id, levelKey);
  if (!period || !level) return res.status(400).json({ error: 'active period and proficiency level definitions are required' });
  const confidence = Math.max(0, Math.min(1, Number(req.body?.confidence ?? 1)));
  const evidenceCount = Math.max(0, Math.trunc(Number(req.body?.evidenceCount || 0)));
  const lastPracticedAt = req.body?.lastPracticedAt == null ? null : Number(req.body.lastPracticedAt);
  const visibility = ['private','resume','portfolio','public'].includes(req.body?.visibility) ? req.body.visibility : 'private';
  const now = Date.now();
  await db.prepare(`
    INSERT INTO career_proficiency_assertions
      (user_id, entity_type, entity_id, period_key, level_key, confidence, assessment_source,
       evidence_count, last_practiced_at, visibility, notes, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
    ON CONFLICT (user_id, entity_type, entity_id, period_key) DO UPDATE SET
      level_key=EXCLUDED.level_key, confidence=EXCLUDED.confidence,
      assessment_source=EXCLUDED.assessment_source, evidence_count=EXCLUDED.evidence_count,
      last_practiced_at=EXCLUDED.last_practiced_at, visibility=EXCLUDED.visibility,
      notes=EXCLUDED.notes, updated_at=EXCLUDED.updated_at
  `).run(req.user.id, entityType, entityId, periodKey, levelKey, confidence,
    String(req.body?.assessmentSource || 'user_confirmed').slice(0, 80), evidenceCount,
    Number.isFinite(lastPracticedAt) ? lastPracticedAt : null, visibility,
    req.body?.notes ? String(req.body.notes).slice(0, 1000) : null, now);
  res.json({ ok: true, updatedAt: now });
});

router.delete('/proficiency-assertions/:entityType/:entityId/:periodKey', async (req, res) => {
  await db.prepare(`DELETE FROM career_proficiency_assertions WHERE user_id=$1 AND entity_type=$2 AND entity_id=$3 AND period_key=$4`)
    .run(req.user.id, req.params.entityType, Number(req.params.entityId), req.params.periodKey);
  res.json({ ok: true });
});

router.get('/rollup-preview/:key', async (req, res) => {
  await ensureExperienceDefinitions(req.user.id);
  const [definitionRows, assertionRows, skillRows, toolRows] = await Promise.all([
    db.prepare(`SELECT definition_type, definition_key, label, description, definition, sort_order, is_active FROM career_experience_definitions WHERE user_id=$1`).all(req.user.id),
    db.prepare(`SELECT * FROM career_proficiency_assertions WHERE user_id=$1`).all(req.user.id),
    db.prepare(`SELECT id, skill, category FROM career_skills WHERE user_id=$1`).all(req.user.id),
    db.prepare(`SELECT id, name_used, current_name, category FROM career_tools WHERE user_id=$1`).all(req.user.id),
  ]);
  const definitions = definitionRows.map((row) => ({ type: row.definition_type, key: row.definition_key, label: row.label, description: row.description, definition: row.definition || {}, sortOrder: Number(row.sort_order), isActive: row.is_active !== false }));
  const rollup = definitions.find((x) => x.type === 'rollup' && x.key === req.params.key && x.isActive);
  if (!rollup) return res.status(404).json({ error: 'active rollup definition not found' });
  const assertions = assertionRows.map((row) => ({ entityType: row.entity_type, entityId: Number(row.entity_id), periodKey: row.period_key, levelKey: row.level_key, confidence: Number(row.confidence), evidenceCount: Number(row.evidence_count), lastPracticedAt: row.last_practiced_at == null ? null : Number(row.last_practiced_at) }));
  const entities = [
    ...skillRows.map((row) => ({ type: 'skill', id: Number(row.id), label: row.skill, category: row.category })),
    ...toolRows.map((row) => ({ type: 'tool', id: Number(row.id), label: row.current_name || row.name_used, category: row.category })),
  ];
  res.json(calculateCareerProficiencyRollup({
    assertions,
    levels: definitions.filter((x) => x.type === 'proficiency_level'),
    periods: definitions.filter((x) => x.type === 'period'),
    entities,
    rollup,
  }));
});

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
      e.roles || [], e.context ?? null, e.actions ?? null, e.outcomes || [],
      e.metrics || [], e.testimonial ?? null, e.testimonialAttr ?? null, e.scenarios || [],
      e.investmentType ?? null, e.acquiredDetail ?? null, e.exitDetail ?? null, e.financialReturn ?? null, e.outcomeStatus ?? null,
      idx, now
    );
  }

  for (let idx = 0; idx < domains.length; idx++) {
    const d = domains[idx];
    await db.prepare(`
      INSERT INTO career_domains (group_type, title, icon, description, items, accent_color, extra, order_index, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
    `).run(d.groupType, d.title, d.icon ?? null, d.description ?? null, d.items || [], d.accentColor ?? null, d.extra || {}, idx, now);
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
