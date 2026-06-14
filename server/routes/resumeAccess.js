import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { dispatchRaw } from '../lib/email.js';

const router = express.Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

// POST /api/resume/temp-access
// Creates a 24h temp access token for a non-member visitor.
// Also upserts a lead record keyed on email.
router.post('/temp-access', async (req, res) => {
  try {
    const { email, request_context, terms_accepted } = req.body;
    if (!email || !terms_accepted) return res.status(400).json({ error: 'Email and terms acceptance required' });

    const token = crypto.randomUUID();
    const now = Date.now();
    const expires_at = now + 24 * 60 * 60 * 1000;

    // Upsert lead
    const existing = await db.prepare(`SELECT id FROM leads WHERE email = $1 LIMIT 1`).get(email.trim().toLowerCase());
    let leadId;
    if (existing) {
      leadId = existing.id;
      await db.prepare(`UPDATE leads SET prior_notes = COALESCE(prior_notes || '[]', '[]')::jsonb || $1::jsonb, updated_at = $2 WHERE id = $3`)
        .run(JSON.stringify([{ at: now, source: 'resume-temp-access', text: request_context || '(no context)' }]), now, leadId);
    } else {
      const row = await db.prepare(`
        INSERT INTO leads (source, email, message, created_at, updated_at)
        VALUES ('resume-temp-access', $1, $2, $3, $3)
        RETURNING id
      `).get(email.trim().toLowerCase(), request_context || null, now);
      leadId = row.id;
    }

    await db.prepare(`
      INSERT INTO resume_temp_access (email, token, request_context, terms_accepted, lead_id, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `).run(email.trim().toLowerCase(), token, request_context || null, terms_accepted, leadId, now, expires_at);

    // Send confirmation email (fire-and-forget)
    dispatchRaw({
      to: email,
      subject: 'Your temporary access to Betsy Salter\'s resume',
      html: `<p>You've been granted 24-hour access to view Betsy Salter's resume.</p>
             <p>Your access token: <strong>${token}</strong></p>
             <p>This preview is for evaluation purposes only and may not be used to submit job applications without Betsy's consent.</p>`,
    }).catch(() => {});

    res.json({ ok: true, token, expires_at });
  } catch (e) {
    console.error('resume temp-access error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resume/validate-temp/:token
router.get('/validate-temp/:token', async (req, res) => {
  try {
    const row = await db.prepare(`
      SELECT id, email, expires_at, lead_id FROM resume_temp_access WHERE token = $1 LIMIT 1
    `).get(req.params.token);
    if (!row) return res.json({ valid: false, reason: 'not_found' });
    if (Date.now() > row.expires_at) return res.json({ valid: false, reason: 'expired' });
    res.json({ valid: true, email: row.email, expires_at: row.expires_at });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resume/temp-download-request
// Captures additional download context and updates the lead.
router.post('/temp-download-request', async (req, res) => {
  try {
    const { token, org, role_type, question, missing_info } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const row = await db.prepare(`SELECT id, lead_id, expires_at FROM resume_temp_access WHERE token = $1 LIMIT 1`).get(token);
    if (!row || Date.now() > row.expires_at) return res.status(403).json({ error: 'Invalid or expired token' });

    const now = Date.now();
    await db.prepare(`
      UPDATE resume_temp_access
         SET org = $1, role_type = $2, question = $3, missing_info = $4
       WHERE token = $5
    `).run(org || null, role_type || null, question || null, missing_info || null, token);

    if (row.lead_id) {
      const note = JSON.stringify([{
        at: now,
        source: 'resume-download-request',
        text: [org && `Org: ${org}`, role_type && `Role: ${role_type}`, question && `Question: ${question}`, missing_info && `Missing: ${missing_info}`].filter(Boolean).join(' | '),
      }]);
      await db.prepare(`UPDATE leads SET prior_notes = COALESCE(prior_notes || '[]', '[]')::jsonb || $1::jsonb, updated_at = $2 WHERE id = $3`)
        .run(note, now, row.lead_id);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('temp-download-request error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resume/member-reason-check
// Returns whether the logged-in member has a reason capture within the last 24h.
router.get('/member-reason-check', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const row = await db.prepare(`
      SELECT id, reason, created_at FROM resume_member_reasons
       WHERE user_id = $1 AND created_at > $2
       ORDER BY created_at DESC LIMIT 1
    `).get(user.id, cutoff);

    res.json({ has_recent: !!row, reason: row?.reason || null, captured_at: row?.created_at || null });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resume/member-reason
// Saves a member's reason for viewing the resume.
router.post('/member-reason', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Reason required' });

    await db.prepare(`
      INSERT INTO resume_member_reasons (user_id, reason, created_at) VALUES ($1, $2, $3)
    `).run(user.id, reason.trim(), Date.now());

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resume/member-download-request
// Saves a member download request as a network_request. May promote to lead if org context given.
router.post('/member-download-request', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { reason, org, role_type, question, missing_info } = req.body;

    const now = Date.now();
    const row = await db.prepare(`
      INSERT INTO network_requests (user_id, request_type, reason, org, role_type, question, missing_info, created_at)
      VALUES ($1, 'resume-download', $2, $3, $4, $5, $6, $7)
      RETURNING id
    `).get(user.id, reason || null, org || null, role_type || null, question || null, missing_info || null, now);

    // Auto-promote to lead if org context is present
    let lead_id = null;
    if (org) {
      const userRow = await db.prepare(`SELECT email FROM users WHERE id = $1 LIMIT 1`).get(user.id);
      if (userRow?.email) {
        const existing = await db.prepare(`SELECT id FROM leads WHERE email = $1 LIMIT 1`).get(userRow.email);
        if (existing) {
          lead_id = existing.id;
        } else {
          const lead = await db.prepare(`
            INSERT INTO leads (source, email, message, created_at, updated_at)
            VALUES ('network-resume-download', $1, $2, $3, $3) RETURNING id
          `).get(userRow.email, [org && `Org: ${org}`, role_type && `Role: ${role_type}`, question].filter(Boolean).join(' | '), now);
          lead_id = lead.id;
        }
        await db.prepare(`UPDATE network_requests SET converted_to_lead_id = $1 WHERE id = $2`).run(lead_id, row.id);
      }
    }

    res.json({ ok: true, network_request_id: row.id, converted_to_lead_id: lead_id });
  } catch (e) {
    console.error('member-download-request error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
