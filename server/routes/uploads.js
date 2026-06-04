// Image uploads → Supabase Storage.
//
// The bucket `uploads` is created lazily on first boot (if it doesn't exist).
// Files are written under a randomized hex filename to avoid collisions and
// guessing. The public URL returned to the client points at Supabase's CDN.
import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '../auth.js';

const BUCKET = 'uploads';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[uploads] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — uploads will fail.'
  );
}
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const EXT_FOR = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

// Buffer in memory — multer doesn't write to disk before we hand off to
// Supabase. 5 MB cap mirrors the original disk-based limits.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only image files (jpg, png, webp, gif, avif) are allowed'));
    }
    cb(null, true);
  },
});

// One-time bucket bootstrap. createBucket is idempotent against repeated calls
// (returns an error we swallow if it already exists).
let bucketReady = null;
async function ensureBucket() {
  if (!supabase) return false;
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    try {
      const { error } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.error('[uploads] createBucket failed:', error.message);
      }
    } catch (e) {
      console.error('[uploads] bucket bootstrap error:', e.message);
    }
    return true;
  })();
  return bucketReady;
}

const router = Router();

router.post('/', requireUser, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
    if (!supabase) {
      return res.status(500).json({ error: 'storage not configured (missing SUPABASE_URL / SERVICE_ROLE_KEY)' });
    }

    await ensureBucket();

    const id = crypto.randomBytes(12).toString('hex');
    const ext = EXT_FOR[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || '.bin';
    const filename = `${id}${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '604800', // 7 days
        upsert: false,
      });
    if (uploadErr) return res.status(500).json({ error: uploadErr.message });

    // Public URL is a CDN-friendly direct link to the file.
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    res.json({
      ok: true,
      url: data.publicUrl,
      filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

export default router;
// For backwards compatibility with the old server/index.js import — no longer
// a local directory but keeping the export to avoid an import error.
export const uploadsDir = null;
