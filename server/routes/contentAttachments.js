// Content Attachments — generic file uploads attached to any Content Entry
// Journey record (research inputs, content items, insights, outputs, and
// future Observation/Framework records). Reuses the Supabase Storage pattern
// already established for career_intake_documents. Accepts documents
// (PDF/DOCX/XLSX/CSV/TXT) and images, unlike /api/uploads which is
// images-only/5MB for public site content.
//
// Retention policy: an attachment persists to the uploader's own user
// record (uploaded_by) indefinitely if the uploader is admin (Betsy's own
// internal marketing work) — retention_expires_at stays NULL. Any non-admin
// uploader (a member or client) gets a 30-day retention_expires_at, enforced
// by contentAttachmentRetention.js. Storage key is organized by uploader
// then by where it was uploaded (entity_type/entity_id): persistent uploads
// live under "users/{uploaded_by}/...", retention-eligible ones under
// "temp/{uploaded_by}/..." — the prefix itself reflects the policy.
import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const BUCKET = 'content-attachments';
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.warn('[content-attachments] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — attachment uploads will fail.');
}
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('File type not allowed. Use images, PDF, Word, Excel, PowerPoint, CSV, or text files.'));
    }
    cb(null, true);
  },
});

let bucketReady = null;
async function ensureBucket() {
  if (!supabase) return false;
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    try {
      const { error } = await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 25 * 1024 * 1024,
      });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.error('[content-attachments] createBucket failed:', error.message);
      }
    } catch (e) {
      console.error('[content-attachments] bucket bootstrap error:', e.message);
    }
    return true;
  })();
  return bucketReady;
}

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId(prefix = 'attachment') {
  return `${prefix}.${crypto.randomUUID().split('-')[0]}`;
}

const router = Router();

// List attachments for an entity — admins see everything attached to that
// entity; non-admins only see their own uploads (they may share an entity
// with other contributors, e.g. a shared research input).
router.get('/', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const { entity_type, entity_id } = req.query;
  if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id are required' });
  try {
    const isAdmin = user.role === 'admin';
    const q = `
      SELECT id, entity_type, entity_id, original_filename, mime_type, file_size, notes, uploaded_by, retention_expires_at, created_at
      FROM content_attachments
      WHERE entity_type=$1 AND entity_id=$2 AND deleted_at IS NULL ${isAdmin ? '' : 'AND uploaded_by=$3'}
      ORDER BY created_at DESC
    `;
    const rows = isAdmin
      ? await db.prepare(q).all(entity_type, entity_id)
      : await db.prepare(q).all(entity_type, entity_id, user.id);
    res.json({ attachments: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load attachments' });
  }
});

// Upload a new attachment — any authenticated user (admin, member, or
// client), not admin-only, so member/client-submitted source material can
// land here too.
router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
    const { entity_type, entity_id, notes } = req.body;
    if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id are required' });
    if (!supabase) return res.status(500).json({ error: 'storage not configured (missing SUPABASE_URL / SERVICE_ROLE_KEY)' });

    await ensureBucket();

    const isAdmin = user.role === 'admin';
    const id = newId();
    const ext = path.extname(req.file.originalname).toLowerCase() || '.bin';
    const rootFolder = isAdmin ? 'users' : 'temp';
    const storageKey = `${rootFolder}/${user.id}/${entity_type}/${entity_id}/${id}${ext}`;
    const now = Date.now();
    const retentionExpiresAt = isAdmin ? null : now + RETENTION_MS;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadErr) return res.status(500).json({ error: uploadErr.message });

    await db.prepare(`
      INSERT INTO content_attachments (id, entity_type, entity_id, original_filename, storage_bucket, storage_key, mime_type, file_size, notes, uploaded_by, retention_expires_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `).run(id, entity_type, entity_id, req.file.originalname, BUCKET, storageKey, req.file.mimetype, req.file.size, notes || null, user.id, retentionExpiresAt, now);

    res.json({ ok: true, id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, retentionExpiresAt });
  });
});

// Signed download URL (bucket is private) — owner or admin only
router.get('/:id/download', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  try {
    const row = await db.prepare(`SELECT * FROM content_attachments WHERE id=$1 AND deleted_at IS NULL`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (user.role !== 'admin' && Number(row.uploaded_by) !== Number(user.id)) return res.status(403).json({ error: 'Not authorized' });
    if (!supabase) return res.status(500).json({ error: 'storage not configured' });
    const { data, error } = await supabase.storage.from(row.storage_bucket).createSignedUrl(row.storage_key, 300);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, url: data.signedUrl, filename: row.original_filename });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create download link' });
  }
});

// Owner or admin only
router.delete('/:id', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  try {
    const row = await db.prepare(`SELECT * FROM content_attachments WHERE id=$1`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (user.role !== 'admin' && Number(row.uploaded_by) !== Number(user.id)) return res.status(403).json({ error: 'Not authorized' });
    if (supabase) {
      const { error } = await supabase.storage.from(row.storage_bucket).remove([row.storage_key]);
      if (error) console.error('[content-attachments] storage delete failed:', error.message);
    }
    await db.prepare(`DELETE FROM content_attachments WHERE id=$1`).run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
