// Platform access API (2026-10-09): the "Connected agents" screen (personal access tokens for the MCP server)
// and the "Capabilities" screen (interface-parity map, admin). Cookie-authenticated like the rest of the app:
// an access token can NOT manage tokens - credentials are created and revoked by a signed-in person.
import express from 'express';
import { requireUser, requireAdmin } from '../auth.js';
import { listTokens, createToken, revokeToken, AccessError } from '../lib/platformAccess.js';
import { MCP_SCOPES, MCP_TOOLS, describeTool } from '../lib/mcpToolRegistry.js';
import { CAPABILITIES, evaluateCapabilities, summarizeCapabilities } from '../lib/capabilityParity.js';

const router = express.Router();

const fail = (res, e) => res.status(e instanceof AccessError ? e.status : 500).json({ error: e.message, code: e.code });

router.get('/tokens', requireUser, async (req, res) => {
  try { res.json({ tokens: await listTokens(req.user.id) }); } catch (e) { fail(res, e); }
});

// Returns the plaintext token ONCE; only its hash is stored.
router.post('/tokens', requireUser, async (req, res) => {
  try {
    const { name, scopes, expiresInDays } = req.body || {};
    res.status(201).json(await createToken(req.user.id, { name, scopes, expiresInDays }, Object.keys(MCP_SCOPES)));
  } catch (e) { fail(res, e); }
});

router.delete('/tokens/:id', requireUser, async (req, res) => {
  try { res.json(await revokeToken(req.user.id, Number(req.params.id))); } catch (e) { fail(res, e); }
});

// Where to connect, the scopes a token can carry and the tools each scope unlocks.
router.get('/mcp', requireUser, (req, res) => {
  const base = (process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  res.json({
    url: `${base}/mcp`,
    transport: 'Streamable HTTP (stateless, POST)',
    authorization: 'Authorization: Bearer <token>',
    isAdmin: req.user.role === 'admin',
    scopes: Object.entries(MCP_SCOPES).map(([key, description]) => ({ key, description, tools: MCP_TOOLS.filter((t) => t.scope === key).map((t) => t.name), adminOnly: MCP_TOOLS.filter((t) => t.scope === key).every((t) => t.permission === 'admin') })),
    tools: MCP_TOOLS.map(describeTool),
  });
});

router.get('/capabilities', requireAdmin, (req, res) => {
  const rows = evaluateCapabilities(CAPABILITIES);
  res.json({ summary: summarizeCapabilities(rows), capabilities: rows });
});

export default router;
