// Generic admin API over the Config Envelope engine (server/lib/configEnvelope.js)
// — one route surface for every registered envelope, so adding a new
// editable registry never needs a new bespoke route. Mounted at
// /api/config-envelopes in server/index.js.

import express from 'express';
import { getUserFromCookie } from '../auth.js';
import { listConfigEnvelopes, getConfigEnvelope, resolveConfigEnvelope, writeConfigEnvelope, resetConfigEnvelope } from '../lib/configEnvelope.js';
import '../lib/methodologyEnvelopes.js'; // side effect: registers the P0 envelopes
import '../lib/publicationFlowEnvelopes.js'; // side effect: registers the Publication journey's flow envelopes

const router = express.Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

router.get('/', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const resolved = await Promise.all(listConfigEnvelopes().map(async (envelope) => ({
    id: envelope.id, label: envelope.label, description: envelope.description,
    ...(await resolveConfigEnvelope(envelope.id)),
  })));
  res.json({ envelopes: resolved });
});

// Read of a single envelope. Envelopes flagged `publicRead` skip auth so the
// unauthenticated /output/* surfaces actually receive the admin's saved
// override instead of silently rendering the shipped default. Writes below
// stay admin-only for every envelope.
router.get('/:id', async (req, res) => {
  const envelope = getConfigEnvelope(req.params.id);
  if (!envelope?.publicRead) {
    const user = await requireAdmin(req, res);
    if (!user) return;
  }
  if (!envelope) return res.status(404).json({ error: 'Unknown config envelope' });
  const resolved = await resolveConfigEnvelope(req.params.id);
  res.json({ id: envelope.id, label: envelope.label, description: envelope.description, ...resolved });
});

router.put('/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const envelope = getConfigEnvelope(req.params.id);
  if (!envelope) return res.status(404).json({ error: 'Unknown config envelope' });
  const result = await writeConfigEnvelope(req.params.id, req.body?.value);
  if (!result.ok) return res.status(400).json({ error: 'Validation failed', details: result.errors });
  res.json(result);
});

router.delete('/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const envelope = getConfigEnvelope(req.params.id);
  if (!envelope) return res.status(404).json({ error: 'Unknown config envelope' });
  const result = await resetConfigEnvelope(req.params.id);
  res.json(result);
});

export default router;
