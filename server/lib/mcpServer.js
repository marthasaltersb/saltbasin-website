// Platform MCP server (2026-10-09): Streamable HTTP transport at /mcp, built on the official
// @modelcontextprotocol/sdk. Stateless - one Server + transport per request, bound to the user the bearer
// token belongs to. Registered by server/index.js as app.use('/mcp', mcpRouter).
//
// Order on every request: (1) authenticate the bearer token (HTTP 401 when missing, unknown, revoked or
// expired); (2) tools/list shows the tools the token's scopes include; (3) tools/call re-checks, in this
// order: tool exists, scope granted, role permission, forced password change / Career Portfolio terms (the
// same getAccountGateBlock the API middleware uses), argument schema - then runs the handler and records one
// tracked interaction. Any failure is returned as an MCP error result (isError: true, with status, code and
// message in structuredContent) - nothing is swallowed and nothing is retried silently.
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCP_TOOLS, getMcpTool } from './mcpToolRegistry.js';
import { authenticateToken, touchToken, AccessError } from './platformAccess.js';
import { getAccountGateBlock } from '../auth.js';
import { recordMcpToolCall } from './usageTracking.js';

/** Minimal JSON-schema check for the registry's flat object schemas. Returns an error message or null. */
export function validateArgs(schema, args) {
  const a = args ?? {};
  if (typeof a !== 'object' || Array.isArray(a)) return 'Arguments must be an object.';
  const props = schema.properties || {};
  for (const key of schema.required || []) {
    if (a[key] === undefined || a[key] === null || a[key] === '') return `"${key}" is required.`;
  }
  for (const [key, value] of Object.entries(a)) {
    const p = props[key];
    if (!p) { if (schema.additionalProperties === false) return `Unknown argument "${key}".`; continue; }
    if (value === undefined || value === null) continue;
    if (p.type === 'integer' && !(Number.isInteger(value) && (p.minimum == null || value >= p.minimum))) return `"${key}" must be a whole number${p.minimum != null ? ` of at least ${p.minimum}` : ''}.`;
    if (p.type === 'string') {
      if (typeof value !== 'string') return `"${key}" must be text.`;
      if (p.minLength != null && value.trim().length < p.minLength) return `"${key}" must not be empty.`;
      if (p.maxLength != null && value.length > p.maxLength) return `"${key}" is limited to ${p.maxLength} characters.`;
    }
    if (p.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) return `"${key}" must be an object.`;
  }
  return null;
}

function errorResult(status, code, message, details) {
  const error = { status, code, message, ...(details ? { details } : {}) };
  return { isError: true, content: [{ type: 'text', text: `Error ${status} ${code}: ${message}` }], structuredContent: { error } };
}

/** Maps anything a handler throws onto the same status/code the API route would have answered with. */
function toErrorResult(e) {
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 400;
  const code = e.code || (status === 404 ? 'not_found' : status === 400 ? 'bad_request' : 'error');
  return errorResult(status, code, e.message, e.details);
}

/**
 * Runs one tool call as `ctx.user` with `ctx.token`'s scopes. Exported so the same path is used by the
 * HTTP server and by anything that needs to call a tool in-process.
 */
export async function executeTool(name, args, ctx) {
  const tool = getMcpTool(name);
  if (!tool) {
    const unknown = errorResult(404, 'unknown_tool', `There is no tool named "${name}".`);
    // An unknown name is still a call made with this token: it is counted (under the name as sent, truncated).
    const tracked = await recordMcpToolCall({ userId: ctx.user.id, tokenId: ctx.token.id, tool: `unknown:${String(name).slice(0, 60)}`, ok: false, errorCode: 'unknown_tool' });
    if (!tracked.ok) unknown.content.push({ type: 'text', text: `Warning: this call could not be recorded in usage tracking (${tracked.error}).` });
    return unknown;
  }
  const outcome = await (async () => {
    if (!ctx.token.scopes.includes(tool.scope)) {
      return errorResult(403, 'scope_not_granted', `This access token does not include the "${tool.scope}" scope needed for ${tool.name}. Create a token with that scope in Connected Agents.`);
    }
    if (tool.permission === 'admin' && ctx.user.role !== 'admin') {
      return errorResult(403, 'forbidden', `${tool.name} is for administrators only. You are signed in as a ${ctx.user.role}.`);
    }
    const block = await getAccountGateBlock(ctx.user);
    if (block) return errorResult(block.status, block.body.error, block.body.error === 'career_terms_required' ? 'Accept the Career Portfolio terms in the website before agents can use your data.' : 'Set your own password in the website first.', block.body);
    const invalid = validateArgs(tool.inputSchema, args);
    if (invalid) return errorResult(400, 'invalid_arguments', invalid);
    try {
      const data = await tool.handler(args ?? {}, ctx);
      return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { result: JSON.parse(JSON.stringify(data)) } };
    } catch (e) {
      return toErrorResult(e);
    }
  })();
  const tracked = await recordMcpToolCall({ userId: ctx.user.id, tokenId: ctx.token.id, tool: tool.name, ok: !outcome.isError, errorCode: outcome.isError ? outcome.structuredContent.error.code : null });
  if (!tracked.ok) outcome.content.push({ type: 'text', text: `Warning: this call could not be recorded in usage tracking (${tracked.error}).` });
  return outcome;
}

function buildServer(ctx) {
  const server = new Server({ name: 'salt-basin-platform', version: '1.0.0' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_TOOLS.filter((t) => ctx.token.scopes.includes(t.scope)).map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => executeTool(request.params.name, request.params.arguments, ctx));
  return server;
}

const router = express.Router();

router.all('/', async (req, res) => {
  const auth = String(req.headers.authorization || '');
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  let ctx;
  try {
    const { user, token } = await authenticateToken(bearer);
    ctx = { user, token, req };
    await touchToken(token.id);
  } catch (e) {
    const status = e instanceof AccessError ? e.status : 500;
    res.setHeader('WWW-Authenticate', 'Bearer realm="salt-basin-platform"');
    return res.status(status).json({ jsonrpc: '2.0', error: { code: -32001, message: e.message }, id: null });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'This MCP server is stateless: send JSON-RPC requests with POST.' }, id: null });
  }
  const server = buildServer(ctx);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error('[mcp] request failed:', e);
    if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: e.message }, id: null });
  }
});

export default router;
