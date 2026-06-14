import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { dispatchRaw as sendRaw } from '../lib/email.js';

const router = Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function getUser(req) {
  try { return await getUserFromCookie(req); } catch { return null; }
}

function newId(prefix = 'prop') {
  return `${prefix}.${crypto.randomUUID().split('-')[0]}`;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Admin: Proposals CRUD ─────────────────────────────────────────────────────

router.get('/proposals', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`
      SELECT * FROM unified_content_items WHERE app_id = 'app.services' ORDER BY updated_at DESC LIMIT 200
    `).all();
    res.json({ proposals: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load proposals' });
  }
});

router.post('/proposals', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, summary, body, domain_refs, audience_refs } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = `prop.${slugify(title)}.${Date.now()}`;
    const now = Date.now();
    await db.prepare(`
      INSERT INTO unified_content_items
        (id, app_id, type, title, summary, body, domain_refs, audience_refs, export_status, created_by, updated_by, created_at, updated_at, metadata)
      VALUES ($1,'app.services','proposal',$2,$3,$4,$5,$6,'draft',$7,$7,$8,$8,'{}')
    `).run(id, title, summary || null, body ? JSON.stringify(body) : null, domain_refs || null, audience_refs || null, user.id, now);
    res.json({ ok: true, id });
  } catch (e) {
    console.error('[services] create proposal error:', e.message);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

router.get('/proposals/:id', async (req, res) => {
  const user = await getUser(req);
  try {
    const proposal = await db.prepare(`SELECT * FROM unified_content_items WHERE id=$1 AND app_id='app.services'`).get(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });

    // Public can view published only; admin sees all
    if (proposal.export_status !== 'published' && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not published' });
    }

    // For published proposals, check org-admin access or proposal access grant
    if (proposal.export_status === 'published' && user?.role !== 'admin') {
      const hasOrgAccess = user ? await db.prepare(`
        SELECT 1 FROM org_memberships WHERE user_id=$1 AND role IN ('owner','admin','member')
      `).get(user.id) : null;

      const hasGrant = user ? await db.prepare(`
        SELECT 1 FROM services_proposal_access WHERE proposal_id=$1 AND user_id=$2 AND granted=true
      `).get(req.params.id, user.id) : null;

      if (!hasOrgAccess && !hasGrant) {
        return res.status(403).json({ error: 'Access required', proposal_id: req.params.id, title: proposal.title });
      }
    }

    res.json({ proposal });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load proposal' });
  }
});

router.put('/proposals/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, summary, body, domain_refs, audience_refs, export_status } = req.body;
    const statusUpdatedAt = export_status ? Date.now() : undefined;
    await db.prepare(`
      UPDATE unified_content_items SET title=$1, summary=$2, body=$3, domain_refs=$4, audience_refs=$5, export_status=$6, export_status_updated_at=$7, updated_by=$8, updated_at=$9
      WHERE id=$10 AND app_id='app.services'
    `).run(title, summary || null, body ? JSON.stringify(body) : null, domain_refs || null, audience_refs || null, export_status || 'draft', statusUpdatedAt || null, user.id, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// POST /api/services/proposals/:id/publish
router.post('/proposals/:id/publish', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const now = Date.now();
    await db.prepare(`
      UPDATE unified_content_items SET export_status='published', export_status_updated_at=$1, updated_at=$1 WHERE id=$2 AND app_id='app.services'
    `).run(now, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to publish' });
  }
});

// POST /api/services/proposals/:id/request-access — public, no auth required
router.post('/proposals/:id/request-access', async (req, res) => {
  const user = await getUser(req);
  try {
    const { org_name, request_context, requester_name, requester_email } = req.body;
    if (!org_name) return res.status(400).json({ error: 'Organization name required' });

    const proposal = await db.prepare(`SELECT title FROM unified_content_items WHERE id=$1 AND app_id='app.services'`).get(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    // Create or find lead record
    const leadEmail = user?.email || requester_email;
    let leadId = null;
    if (leadEmail) {
      const existingLead = await db.prepare(`SELECT id FROM leads WHERE LOWER(email)=LOWER($1) AND merged_into_id IS NULL`).get(leadEmail);
      if (existingLead) {
        leadId = existingLead.id;
      } else if (leadEmail) {
        const result = await db.prepare(`
          INSERT INTO leads (source, email, name, answers, created_at, updated_at)
          VALUES ('services-proposal-access',$1,$2,$3,$4,$4) RETURNING id
        `).run(leadEmail, requester_name || user?.display_name || null, JSON.stringify({ org_name, request_context, proposal_id: req.params.id }), Date.now());
        leadId = result.lastInsertRowid;
      }
    }

    // Create access record
    const id = newId('spa');
    const now = Date.now();
    await db.prepare(`
      INSERT INTO services_proposal_access (id, proposal_id, user_id, org_name, request_context, lead_id, granted, granted_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,true,$7,$7)
    `).run(id, req.params.id, user?.id || null, org_name, request_context || null, leadId, now);

    // Notify Betsy
    const admin = await db.prepare(`SELECT email FROM users WHERE role='admin' ORDER BY id LIMIT 1`).get();
    if (admin) {
      await sendRaw({
        to: admin.email,
        subject: `[Salt Basin] Proposal access request — ${org_name}`,
        text: `New access request for proposal: "${proposal.title}"\n\nOrg: ${org_name}\nRequester: ${requester_name || 'Unknown'} <${leadEmail || 'Unknown'}>\nContext: ${request_context || 'None provided'}\n\nAccess has been automatically granted.\n\nView leads at /admin`,
      }).catch(() => {});
    }

    // Send confirmation to requester
    if (leadEmail) {
      await sendRaw({
        to: leadEmail,
        subject: `[Salt Basin] You've been granted access`,
        text: `Hi${requester_name ? ' ' + requester_name : ''},\n\nYou've been granted access to the service proposal: "${proposal.title}"\n\nYou can view it by logging into Salt Basin Net Works.\n\nThanks,\nSalt Basin Net Works`,
      }).catch(() => {});
    }

    res.json({ ok: true, granted: true });
  } catch (e) {
    console.error('[services] request-access error:', e.message);
    res.status(500).json({ error: 'Failed to process access request' });
  }
});

// GET /api/services/proposals/:id/access — list access grants (admin)
router.get('/proposals/:id/access', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`
      SELECT spa.*, u.email AS user_email, u.display_name AS user_name
      FROM services_proposal_access spa
      LEFT JOIN users u ON u.id = spa.user_id
      WHERE spa.proposal_id = $1 ORDER BY spa.created_at DESC
    `).all(req.params.id);
    res.json({ access: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load access list' });
  }
});

// GET /api/services/leads — admin view of all crm_leads from services requests
router.get('/leads', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const rows = await db.prepare(`
      SELECT l.*, a.org_name, a.request_context
      FROM leads l
      LEFT JOIN services_proposal_access a ON a.lead_id = l.id
      ORDER BY l.created_at DESC LIMIT 200
    `).all();
    res.json({ leads: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

// DELETE /api/services/proposals/:id
router.delete('/proposals/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    await db.prepare('DELETE FROM unified_content_items WHERE id=$1 AND app_id=$2').run(req.params.id, 'app.services');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// GET /api/services/public — published proposals list (gated per-proposal)
router.get('/public', async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT id, title, summary, export_status_updated_at, updated_at
      FROM unified_content_items
      WHERE app_id='app.services' AND export_status='published'
      ORDER BY updated_at DESC
    `).all();
    res.json({ proposals: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load proposals' });
  }
});

export default router;
