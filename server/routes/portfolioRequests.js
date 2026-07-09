// Portfolio request lead funnel — intake behind the teaser views of the
// Career Master Database, Case Study Portfolio, and Strategic Operator
// outputs. Leads arrive either from the BestyStaff chat agent
// (server/routes/bestyStaff.js, which imports createPortfolioRequest) or
// from the fallback intake forms.
//
//   POST /api/portfolio-requests                  → public, multipart (fields
//                                                   + up to 5 sample documents)
//   POST /api/portfolio-requests/:id/attachments  → public, multipart — attach
//                                                   files to a just-created
//                                                   request (chat flow)
//   GET  /api/portfolio-requests                  → admin list
//
// Attachments land in a private Supabase bucket ("temp-attachments") and a
// temp_attachments row with expires_at = upload + 24h. sweepExpired() runs
// at boot and hourly, hard-deleting both the storage object and the row —
// the "temporary attachment context space" guarantee. Request rows
// themselves (the lead) are kept.

import { Router } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import { requireAdmin, requireUser } from '../auth.js';
import { dispatchRaw } from '../lib/email.js';
import { makeRateLimiter } from '../lib/rateLimit.js';

const router = Router();
const TEMP_BUCKET = 'temp-attachments';
const ATTACHMENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ATTACH_WINDOW_MS = 60 * 60 * 1000; // attachments may only be added within 1h of request creation
const MAX_ATTACHMENTS_PER_REQUEST = 5;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const ALLOWED_MIME = new Set([
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Allowed files: PDF, Word, Excel, PowerPoint, text, CSV, RTF, JPG, PNG, or WebP'));
    }
    cb(null, true);
  },
});

const intakeLimiter = makeRateLimiter({ windowMs: 60_000, max: 10, message: 'Too many submissions — please wait a moment' });

let bucketReady = null;
async function ensureBucket() {
  if (!supabase) return false;
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const { error } = await supabase.storage.createBucket(TEMP_BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      console.error('[portfolio-requests] createBucket failed:', error.message);
    }
    return true;
  })();
  return bucketReady;
}

// ── 24-hour auto-purge of the temporary attachment context space ──────────
export async function sweepExpiredAttachments() {
  try {
    const rows = await db.prepare(`SELECT * FROM temp_attachments WHERE expires_at < $1`).all(Date.now());
    if (!rows.length) return { swept: 0 };
    if (supabase) {
      const keys = rows.map((r) => r.storage_key).filter(Boolean);
      if (keys.length) {
        const { error } = await supabase.storage.from(TEMP_BUCKET).remove(keys);
        if (error) console.error('[portfolio-requests] sweep storage remove failed:', error.message);
      }
    }
    await db.prepare(`DELETE FROM temp_attachments WHERE expires_at < $1`).run(Date.now());
    console.log(`[portfolio-requests] swept ${rows.length} expired attachment${rows.length === 1 ? '' : 's'}`);
    return { swept: rows.length };
  } catch (e) {
    console.error('[portfolio-requests] sweep failed:', e.message);
    return { swept: 0, error: e.message };
  }
}
// Run at boot (module load happens after db bootstrap) and hourly after.
sweepExpiredAttachments();
setInterval(sweepExpiredAttachments, 60 * 60 * 1000).unref();

function clean(v, max = 4000) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function boolOrNull(v) {
  if (v === 'true' || v === true) return true;
  if (v === 'false' || v === false) return false;
  return null;
}

function jsonArray(v, maxItems = 40) {
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, maxItems).map((x) => String(x).slice(0, 200));
  } catch {
    return [];
  }
}

// Recommend a portfolio type for "build your own" intakes — simple rule
// pass over role type / goal / showcase selections, echoed back to the
// requestor on submit and stored on the lead for Betsy.
function recommendPortfolio({ roleType, goal, showcase }) {
  const role = String(roleType || '').toLowerCase();
  const g = String(goal || '').toLowerCase();
  const show = (showcase || []).map((s) => String(s).toLowerCase());
  if (/invest|operating partner|managing partner|principal|\bgp\b|\blp\b|private equity/.test(role)
    || /investor/.test(g)
    || show.some((s) => /deal|transaction|certification/.test(s))) {
    return 'Investor Profile Portfolio — deal transactions, certifications & renewals, portfolio KPIs';
  }
  if (/consult|fractional|advisor/.test(role) || show.some((s) => /case stud|testimonial/.test(s))) {
    return 'Case Study Portfolio — engagement-led with client-voice quotes and quantified outcomes';
  }
  if (/job|open role|hiring|search/.test(g)) {
    return 'Executive Resume Portfolio — tailored resume presets with skills-proficiency dashboard';
  }
  return 'Strategic Operator Profile — one-page infographic plus skills & industry dashboards';
}

// ── Shared lead creation — used by the form POST below and by the
// BestyStaff intake agent's submit_portfolio_request tool. ────────────────
// Accepts string or native values (form fields arrive as strings, the
// agent's tool input arrives typed). Throws Error with .statusCode = 400
// on validation failure.
export async function createPortfolioRequest(b = {}) {
  const kind = b.kind === 'build_own' ? 'build_own' : 'request_betsy';
  const contactEmail = clean(b.contactEmail, 255);
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    const err = new Error('A valid contact email is required');
    err.statusCode = 400;
    throw err;
  }

  const showcase = jsonArray(b.showcase);
  const recommended = kind === 'build_own'
    ? recommendPortfolio({ roleType: b.roleType, goal: b.goal, showcase })
    : null;
  // Opaque per-lead token — lets a returning anonymous visitor's own browser
  // (via localStorage) look up this record later for the BestyStaff
  // "welcome back" greeting, without the sequential id being guessable.
  const publicToken = crypto.randomBytes(16).toString('hex');

  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO portfolio_requests (
      kind, source_output, knows_betsy, knows_betsy_detail, comparing_to_role,
      job_description, coverage, coverage_notes, role_type, career_stage, goal,
      showcase, recommended_portfolio, contact_name, contact_email,
      contact_company, contact_title, contact_phone, notes, status,
      public_token, top_questions, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23)
    RETURNING id
  `).run(
    kind,
    clean(b.sourceOutput, 80),
    boolOrNull(b.knowsBetsy),
    clean(b.knowsBetsyDetail, 500),
    boolOrNull(b.comparingToRole),
    clean(b.jobDescription, 20000),
    JSON.stringify(jsonArray(b.coverage)),
    clean(b.coverageNotes, 4000),
    clean(b.roleType, 120),
    clean(b.careerStage, 80),
    clean(b.goal, 120),
    JSON.stringify(showcase),
    recommended,
    clean(b.contactName, 160),
    contactEmail,
    clean(b.contactCompany, 160),
    clean(b.contactTitle, 160),
    clean(b.contactPhone, 60),
    clean(b.notes, 4000),
    'new',
    publicToken,
    clean(b.topQuestions, 2000),
    now
  );
  const requestId = Number(result.lastInsertRowid);

  // Notify Betsy (Brevo, or stdout stub in dev — never blocks the lead)
  const subjectKind = kind === 'build_own' ? 'Build-your-own portfolio intake' : "Request for Betsy's Career Portfolio";
  dispatchRaw({
    to: process.env.ADMIN_EMAIL || 'betsysalter@saltbasin.net',
    subject: `[Salt Basin] ${subjectKind} — ${contactEmail}`,
    text: [
      `${subjectKind} (request #${requestId})`,
      '',
      `  From:      ${clean(b.contactName, 160) || contactEmail} <${contactEmail}>`,
      b.contactCompany ? `  Company:   ${clean(b.contactCompany, 160)}` : null,
      b.contactTitle ? `  Title:     ${clean(b.contactTitle, 160)}` : null,
      `  Source:    ${clean(b.sourceOutput, 80) || 'unknown teaser'}${b.via ? ` · via ${clean(b.via, 40)}` : ''}`,
      kind === 'request_betsy' ? `  Knows Betsy: ${boolOrNull(b.knowsBetsy) === true ? 'yes' : 'no'}${b.knowsBetsyDetail ? ` (${clean(b.knowsBetsyDetail, 200)})` : ''}` : null,
      kind === 'request_betsy' ? `  Comparing to open role: ${boolOrNull(b.comparingToRole) === true ? 'yes — JD in record' : 'no'}` : null,
      kind === 'build_own' ? `  Role type: ${clean(b.roleType, 120) || '—'} · Stage: ${clean(b.careerStage, 80) || '—'} · Goal: ${clean(b.goal, 120) || '—'}` : null,
      recommended ? `  Recommended: ${recommended}` : null,
    ].filter((l) => l !== null).join('\n'),
  }).catch((e) => console.error('[portfolio-requests] notify failed:', e.message));

  return { id: requestId, kind, recommendedPortfolio: recommended, publicToken };
}

// Store uploaded files in the temporary attachment context space —
// auto-deleted 24 hours after upload by sweepExpiredAttachments().
async function storeTempAttachments(requestId, files) {
  let stored = 0;
  let attachmentError = null;
  if (!files?.length) return { stored, attachmentError, expiresAt: null };
  if (!supabase) {
    return { stored, attachmentError: 'attachment storage not configured — request saved without files', expiresAt: null };
  }
  await ensureBucket();
  const now = Date.now();
  for (const file of files) {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12) || '.bin';
    const safeExt = /^[a-z0-9.]+$/.test(ext) ? ext : '.bin';
    const key = `requests/${requestId}/${now}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    const { error: upErr } = await supabase.storage.from(TEMP_BUCKET).upload(key, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (upErr) { attachmentError = upErr.message; continue; }
    await db.prepare(`
      INSERT INTO temp_attachments (request_id, original_filename, mime_type, file_size, storage_bucket, storage_key, expires_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `).run(requestId, clean(file.originalname, 255) || 'upload', file.mimetype || null, file.size ?? null, TEMP_BUCKET, key, now + ATTACHMENT_TTL_MS, now);
    stored += 1;
  }
  return { stored, attachmentError, expiresAt: stored > 0 ? now + ATTACHMENT_TTL_MS : null };
}

// ── public intake (fallback forms — single multipart request) ──────────────
router.post('/', intakeLimiter, (req, res) => {
  upload.array('files', 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const b = req.body || {};
      const files = req.files || [];
      if (files.length > 0 && b.disclaimerAck !== 'true') {
        return res.status(400).json({ error: 'The attachment data disclaimer must be acknowledged' });
      }

      const created = await createPortfolioRequest(b);
      const { stored, attachmentError, expiresAt } = await storeTempAttachments(created.id, files);

      res.json({
        ok: true,
        id: created.id,
        recommendedPortfolio: created.recommendedPortfolio,
        publicToken: created.publicToken,
        attachmentsStored: stored,
        attachmentsExpireAt: expiresAt,
        ...(attachmentError ? { attachmentWarning: attachmentError } : {}),
      });
    } catch (e) {
      if (e.statusCode === 400) return res.status(400).json({ error: e.message });
      console.error('[portfolio-requests] create failed:', e.message);
      res.status(500).json({ error: 'Failed to save portfolio request' });
    }
  });
});

// ── public: append closing-question context to a just-created request ─────
// BestyStaff's required closing question ("Did you get all of your
// questions answered? ...") captures unanswered questions that should reach
// Betsy even after the lead has already been submitted. Public + append-only
// (never overwrites), scoped to the same 1h window as attachments, and
// length-capped so it can't be used to dump arbitrary data onto old leads.
router.patch('/:id/notes', intakeLimiter, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId)) return res.status(400).json({ error: 'Invalid request id' });
    const addition = clean(req.body?.note, 2000);
    if (!addition) return res.status(400).json({ error: 'note is required' });

    const row = await db.prepare(`SELECT id, created_at, notes FROM portfolio_requests WHERE id = $1`).get(requestId);
    if (!row) return res.status(404).json({ error: 'Request not found' });
    if (Date.now() - Number(row.created_at) > ATTACH_WINDOW_MS) {
      return res.status(400).json({ error: 'This request is no longer accepting updates' });
    }

    const merged = [row.notes, `[Closing question] ${addition}`].filter(Boolean).join('\n\n').slice(0, 4000);
    await db.prepare(`UPDATE portfolio_requests SET notes = $1, updated_at = $2 WHERE id = $3`).run(merged, Date.now(), requestId);
    res.json({ ok: true });
  } catch (e) {
    console.error('[portfolio-requests] notes patch failed:', e.message);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Safe subset of a portfolio_requests row for "returning visitor" memory —
// deliberately excludes contact_email/contact_phone (no reason to echo PII
// back into a chat bubble) and job_description/notes (may carry pasted
// content the visitor wouldn't expect replayed verbatim on a later visit).
function memoryRow(row) {
  return {
    id: Number(row.id),
    kind: row.kind,
    contactName: row.contact_name,
    knowsBetsy: row.knows_betsy,
    knowsBetsyDetail: row.knows_betsy_detail,
    topQuestions: row.top_questions,
    roleType: row.role_type,
    careerStage: row.career_stage,
    goal: row.goal,
    recommendedPortfolio: row.recommended_portfolio,
    createdAt: Number(row.created_at),
  };
}

// ── public: token-gated lookup for a returning anonymous visitor ──────────
// The client persists { id, token } to localStorage after a successful
// submit (see PortfolioRequestFlow.jsx). On a later visit it calls this to
// decide whether to greet with "welcome back" + prior context instead of
// the full opening script. The random token (not the sequential id) is the
// actual access control — without it this would let anyone enumerate leads.
router.get('/lookup', intakeLimiter, async (req, res) => {
  try {
    const id = Number(req.query.id);
    const token = clean(req.query.token, 64);
    if (!Number.isFinite(id) || !token) return res.status(400).json({ error: 'id and token are required' });
    const row = await db.prepare(`SELECT * FROM portfolio_requests WHERE id = $1 AND public_token = $2`).get(id, token);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ item: memoryRow(row) });
  } catch (e) {
    console.error('[portfolio-requests] lookup failed:', e.message);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// ── member-scoped: most recent submission tied to the logged-in member's
// own email ─────────────────────────────────────────────────────────────
// For a known member session — no client-supplied identifier, so this can
// never be used to probe another member's record.
router.get('/my-history', requireUser, async (req, res) => {
  try {
    const email = clean(req.user?.email, 255);
    if (!email) return res.json({ item: null });
    const row = await db.prepare(`
      SELECT * FROM portfolio_requests WHERE contact_email = $1 ORDER BY created_at DESC LIMIT 1
    `).get(email);
    res.json({ item: row ? memoryRow(row) : null });
  } catch (e) {
    console.error('[portfolio-requests] my-history failed:', e.message);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ── public: attach sample documents to a just-created request ─────────────
// Used by the BestyStaff chat flow, which submits the lead via the agent's
// tool call and then uploads any attached files here. Guard rails: the
// request must exist, be recent (created within the last hour), stay under
// the per-request attachment cap, and the data disclaimer must be
// acknowledged.
router.post('/:id/attachments', intakeLimiter, (req, res) => {
  upload.array('files', 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const requestId = Number(req.params.id);
      if (!Number.isFinite(requestId)) return res.status(400).json({ error: 'Invalid request id' });
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'No files provided' });
      if (req.body?.disclaimerAck !== 'true') {
        return res.status(400).json({ error: 'The attachment data disclaimer must be acknowledged' });
      }

      const row = await db.prepare(`SELECT id, created_at FROM portfolio_requests WHERE id = $1`).get(requestId);
      if (!row) return res.status(404).json({ error: 'Request not found' });
      if (Date.now() - Number(row.created_at) > ATTACH_WINDOW_MS) {
        return res.status(400).json({ error: 'This request is no longer accepting attachments' });
      }
      const existing = await db.prepare(`SELECT COUNT(*)::int AS cnt FROM temp_attachments WHERE request_id = $1`).get(requestId);
      if (Number(existing.cnt) + files.length > MAX_ATTACHMENTS_PER_REQUEST) {
        return res.status(400).json({ error: `A request can carry at most ${MAX_ATTACHMENTS_PER_REQUEST} attachments` });
      }

      const { stored, attachmentError, expiresAt } = await storeTempAttachments(requestId, files);
      res.json({
        ok: true,
        attachmentsStored: stored,
        attachmentsExpireAt: expiresAt,
        ...(attachmentError ? { attachmentWarning: attachmentError } : {}),
      });
    } catch (e) {
      console.error('[portfolio-requests] attach failed:', e.message);
      res.status(500).json({ error: 'Failed to store attachments' });
    }
  });
});

// ── admin list ─────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await db.prepare(`SELECT * FROM portfolio_requests ORDER BY created_at DESC, id DESC`).all();
    const attach = await db.prepare(`SELECT request_id, COUNT(*)::int AS cnt, MIN(expires_at) AS next_expiry FROM temp_attachments GROUP BY request_id`).all();
    const attachByReq = new Map(attach.map((a) => [Number(a.request_id), a]));
    res.json({
      items: rows.map((r) => ({
        id: Number(r.id),
        kind: r.kind,
        sourceOutput: r.source_output,
        knowsBetsy: r.knows_betsy,
        knowsBetsyDetail: r.knows_betsy_detail,
        comparingToRole: r.comparing_to_role,
        jobDescription: r.job_description,
        coverage: typeof r.coverage === 'string' ? JSON.parse(r.coverage) : r.coverage,
        coverageNotes: r.coverage_notes,
        roleType: r.role_type,
        careerStage: r.career_stage,
        goal: r.goal,
        showcase: typeof r.showcase === 'string' ? JSON.parse(r.showcase) : r.showcase,
        recommendedPortfolio: r.recommended_portfolio,
        contactName: r.contact_name,
        contactEmail: r.contact_email,
        contactCompany: r.contact_company,
        contactTitle: r.contact_title,
        contactPhone: r.contact_phone,
        notes: r.notes,
        status: r.status,
        attachments: attachByReq.get(Number(r.id))?.cnt || 0,
        attachmentsExpireAt: attachByReq.get(Number(r.id))?.next_expiry != null ? Number(attachByReq.get(Number(r.id)).next_expiry) : null,
        createdAt: Number(r.created_at),
      })),
    });
  } catch (e) {
    console.error('[portfolio-requests] list failed:', e.message);
    res.status(500).json({ error: 'Failed to load portfolio requests' });
  }
});

export default router;
