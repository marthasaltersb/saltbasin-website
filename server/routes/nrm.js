import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { dispatchRaw as sendRaw } from '../lib/email.js';

const router = Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId() {
  return crypto.randomUUID();
}

// ── Contacts ─────────────────────────────────────────────────────────────────

// GET /api/nrm/contacts
router.get('/contacts', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const isAdmin = user.role === 'admin';
    const contacts = isAdmin
      ? await db.prepare(`
          SELECT nc.*, u.display_name AS member_name, u.email AS member_email
          FROM nrm_contacts nc
          LEFT JOIN users u ON u.id = nc.user_id
          ORDER BY nc.updated_at DESC LIMIT 500
        `).all()
      : await db.prepare(`
          SELECT * FROM nrm_contacts WHERE owner_user_id = $1 ORDER BY updated_at DESC LIMIT 500
        `).all(user.id);

    res.json({ contacts });
  } catch (e) {
    console.error('[nrm] contacts error:', e.message);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

// POST /api/nrm/contacts
router.post('/contacts', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { first_name, last_name, email, org_name, role_title, relationship_type, notes, domain_refs } = req.body;
    const id = newId();
    const now = Date.now();

    await db.prepare(`
      INSERT INTO nrm_contacts (id, first_name, last_name, email, org_name, role_title, relationship_type, notes, domain_refs, owner_user_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
    `).run(id, first_name || null, last_name || null, email || null, org_name || null, role_title || null, relationship_type || 'contact', notes || null, domain_refs || null, user.id, now);

    res.json({ ok: true, id });
  } catch (e) {
    console.error('[nrm] create contact error:', e.message);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// GET /api/nrm/contacts/:id
router.get('/contacts/:id', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const contact = await db.prepare(`SELECT * FROM nrm_contacts WHERE id = $1`).get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    if (user.role !== 'admin' && contact.owner_user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ contact });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load contact' });
  }
});

// PUT /api/nrm/contacts/:id
router.put('/contacts/:id', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const contact = await db.prepare(`SELECT * FROM nrm_contacts WHERE id = $1`).get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    if (user.role !== 'admin' && contact.owner_user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const { first_name, last_name, email, org_name, role_title, relationship_type, notes, domain_refs, opted_in } = req.body;
    await db.prepare(`
      UPDATE nrm_contacts SET first_name=$1, last_name=$2, email=$3, org_name=$4, role_title=$5, relationship_type=$6, notes=$7, domain_refs=$8, opted_in=$9, updated_at=$10
      WHERE id=$11
    `).run(first_name || null, last_name || null, email || null, org_name || null, role_title || null, relationship_type || 'contact', notes || null, domain_refs || null, opted_in ?? contact.opted_in, Date.now(), req.params.id);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/nrm/contacts/:id
router.delete('/contacts/:id', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const contact = await db.prepare(`SELECT owner_user_id FROM nrm_contacts WHERE id = $1`).get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    if (user.role !== 'admin' && contact.owner_user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.prepare(`DELETE FROM nrm_contacts WHERE id = $1`).run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ── Reference Requests ────────────────────────────────────────────────────────

// GET /api/nrm/reference-requests (admin: all; member: only targeting them)
router.get('/reference-requests', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const rows = user.role === 'admin'
      ? await db.prepare(`
          SELECT rr.*, u.display_name AS target_name, u.email AS target_email
          FROM nrm_reference_requests rr
          LEFT JOIN users u ON u.id = rr.target_member_user_id
          ORDER BY rr.created_at DESC LIMIT 500
        `).all()
      : await db.prepare(`
          SELECT * FROM nrm_reference_requests WHERE target_member_user_id = $1 ORDER BY created_at DESC LIMIT 200
        `).all(user.id);

    res.json({ requests: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load reference requests' });
  }
});

// POST /api/nrm/reference-requests — public intake (no auth required)
router.post('/reference-requests', async (req, res) => {
  try {
    const { requester_name, requester_email, requester_org, target_member_user_id, context } = req.body;
    if (!requester_name || !requester_email) return res.status(400).json({ error: 'Name and email required' });

    const id = newId();
    const now = Date.now();

    await db.prepare(`
      INSERT INTO nrm_reference_requests (id, requester_name, requester_email, requester_org, target_member_user_id, context, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,'new',$7,$7)
    `).run(id, requester_name, requester_email, requester_org || null, target_member_user_id ? Number(target_member_user_id) : null, context || null, now);

    // Notify Betsy (admin)
    const admin = await db.prepare(`SELECT email FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`).get();
    if (admin) {
      await sendRaw({
        to: admin.email,
        subject: `[Salt Basin] New reference request from ${requester_name}`,
        text: `A new reference request has been submitted.\n\nFrom: ${requester_name} <${requester_email}>\nOrg: ${requester_org || 'Not provided'}\nContext: ${context || 'None'}\n\nView in admin at /admin`,
      }).catch(() => {});
    }

    // Notify the target member if specified
    if (target_member_user_id) {
      const member = await db.prepare(`SELECT email, display_name FROM users WHERE id = $1`).get(Number(target_member_user_id));
      if (member) {
        await sendRaw({
          to: member.email,
          subject: `[Salt Basin] New reference request`,
          text: `Hi ${member.display_name || 'there'},\n\nSomeone submitted a reference request mentioning you.\n\nFrom: ${requester_name} <${requester_email}>\nOrg: ${requester_org || 'Not provided'}\nContext: ${context || 'None'}\n\nView it at /member`,
        }).catch(() => {});
      }
    }

    res.json({ ok: true, id });
  } catch (e) {
    console.error('[nrm] reference request error:', e.message);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// PUT /api/nrm/reference-requests/:id/status
router.put('/reference-requests/:id/status', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const { status } = req.body;
    const valid = ['new', 'acknowledged', 'fulfilled', 'declined'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await db.prepare(`UPDATE nrm_reference_requests SET status=$1, updated_at=$2 WHERE id=$3`).run(status, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/nrm/opted-in-members — directory of opted-in members
router.get('/opted-in-members', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const members = await db.prepare(`
      SELECT u.id, u.display_name, u.email, mp.slug, mp.network_bio, mp.opted_in_network
      FROM users u
      JOIN member_profiles mp ON mp.user_id = u.id
      WHERE mp.opted_in_network = true
      ORDER BY u.display_name ASC
    `).all();
    res.json({ members });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load network members' });
  }
});

export default router;
