// Member profile agent — POST /api/members/me/agent
//
// A Claude-backed chat agent scoped strictly to one member's data. The agent
// can read and write the member's site draft and config via the same DB
// operations the admin editor uses. It CANNOT touch Salt Basin's platform
// schema, other members' data, or any admin-only routes.
//
// Optional: if the member has configured integrations.memberDb.url in their
// config, the agent gains a query_member_db tool that runs read-only SELECT
// queries against their own external Postgres/Supabase database.
//
// Auth: requireUser — any logged-in member (or admin) can use this endpoint.

import { Router } from 'express';
import postgres from 'postgres';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { audit } from '../lib/audit.js';
import { makeRateLimiter } from '../lib/rateLimit.js';
import { decrypt } from '../lib/crypto.js';
import { MEMBER_FEATURES, requireMemberFeature } from '../lib/memberAccess.js';
import {
  canWriteMemberConfigPath,
  resolveMemberStaffTemplate,
  toolsForMemberStaff,
} from '../lib/memberStaffTemplates.js';
import { assertAgentLlmBudget, recordAgentLlmUsage } from '../lib/agentLlmUsage.js';
import { permittedCustomerMemory, captureMemberChatMemory } from '../lib/customerMemory.js';

const router = Router();
router.use(requireUser);
router.use(requireMemberFeature(MEMBER_FEATURES.CAREER_BESTYSTAFF));

// LLM calls cost money per-token — cap abuse (runaway scripts, shared BYO keys,
// or a member accidentally looping) at 20 messages/minute per IP.
const agentLimiter = makeRateLimiter({ windowMs: 60_000, max: 20, message: 'Too many agent requests — please wait a moment' });

const CLAUDE_API   = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const MAX_TOOL_ITERATIONS = 8; // safety cap on agentic loops

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function getAnthropicKey(userId) {
  const row = await db
    .prepare(`SELECT data FROM member_configs WHERE user_id = $1 AND kind = 'draft'`)
    .get(userId);
  if (row) {
    try {
      const cfg = JSON.parse(row.data);
      if (cfg?.integrations?.anthropicKeyEnc) return decrypt(cfg.integrations.anthropicKeyEnc);
    } catch {}
  }
  return process.env.ANTHROPIC_API_KEY || null;
}

async function readSite(userId) {
  const row = await db
    .prepare(`SELECT data FROM member_sites WHERE user_id = $1 AND kind = 'draft'`)
    .get(userId);
  return row ? JSON.parse(row.data) : null;
}

async function writeSite(userId, site) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO member_sites (user_id, kind, data, updated_at)
    VALUES ($1, 'draft', $2, $3)
    ON CONFLICT (user_id, kind) DO UPDATE SET data = $2, updated_at = $3
  `).run(userId, JSON.stringify(site), now);
}

async function readConfig(userId) {
  const row = await db
    .prepare(`SELECT data FROM member_configs WHERE user_id = $1 AND kind = 'draft'`)
    .get(userId);
  return row ? JSON.parse(row.data) : null;
}

async function writeConfig(userId, cfg) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO member_configs (user_id, kind, data, updated_at)
    VALUES ($1, 'draft', $2, $3)
    ON CONFLICT (user_id, kind) DO UPDATE SET data = $2, updated_at = $3
  `).run(userId, JSON.stringify(cfg), now);
}

function deepSet(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// ── Tool definitions (sent to Claude) ────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_site',
    description: 'Read the member\'s current draft site JSON. Returns all pages, sections, and their fields.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_config',
    description: 'Read the member\'s current draft config JSON. Returns brand, social links, resume presets, integrations, etc.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_section_fields',
    description: 'Update one or more fields inside a section. Merges into the existing fields object — only the keys you specify are changed.',
    input_schema: {
      type: 'object',
      properties: {
        page_key:   { type: 'string', description: 'The page key (e.g. "home", "about", or the page\'s key in site.pages)' },
        section_id: { type: 'string', description: 'The section\'s id string' },
        fields:     { type: 'object', description: 'Key-value pairs to merge into the section\'s existing fields' },
      },
      required: ['page_key', 'section_id', 'fields'],
    },
  },
  {
    name: 'add_section',
    description: 'Add a new section to a page. The section type must be one of the supported block types.',
    input_schema: {
      type: 'object',
      properties: {
        page_key: { type: 'string', description: 'The page key to add the section to' },
        type:     { type: 'string', description: 'Block type: text | hero | cards | cta | twoCol | resume | domains | caseStudies | referencesRequest | statGrid | process | columns | iconGrid | contact | socialGrid | scripture' },
        name:     { type: 'string', description: 'Human-readable name shown in the editor sidebar' },
        fields:   { type: 'object', description: 'Initial field values for the section (optional)' },
        bg:       { type: 'string', description: 'Background: ivory | navy | linen | teal | cream (default: ivory)' },
        status:   { type: 'string', description: 'draft | soon | live (default: draft)' },
      },
      required: ['page_key', 'type', 'name'],
    },
  },
  {
    name: 'update_config_path',
    description: 'Set a value at a dot-path in the member config draft. E.g. path="site.ownerName" value="Jane Doe".',
    input_schema: {
      type: 'object',
      properties: {
        path:  { type: 'string', description: 'Dot-separated path into the config object' },
        value: { description: 'The value to set (any JSON-serialisable type)' },
      },
      required: ['path', 'value'],
    },
  },
  {
    name: 'update_page',
    description: 'Update page-level metadata: name, navLabel, navGroup, hideFromNav, slug, or order.',
    input_schema: {
      type: 'object',
      properties: {
        page_key: { type: 'string' },
        patch: {
          type: 'object',
          description: 'Fields to merge into the page: name, navLabel, navGroup, hideFromNav, slug, order',
        },
      },
      required: ['page_key', 'patch'],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(name, input, userId, memberDbPools, staffTemplate) {
  // Dynamic per-source query tool
  if (name.startsWith('query_db_')) {
    const dbId = name.replace('query_db_', '');
    const src = memberDbPools[dbId];
    if (!src) return { error: `Data source "${dbId}" not found or not connected.` };
    const { sql: rawSql } = input;
    if (!rawSql || typeof rawSql !== 'string') return { error: 'sql is required' };
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE)\b/i.test(rawSql);
    if (isWrite && (!src.allowWrite || !staffTemplate.allowExternalWrites)) {
      return { error: `${staffTemplate.name} has read-only authority for external sources.` };
    }
    try {
      const rows = await src.pool.unsafe(rawSql);
      return { source: src.name, rows: Array.from(rows).slice(0, 200) };
    } catch (e) {
      return { error: e.message };
    }
  }

  switch (name) {

    case 'get_site': {
      const site = await readSite(userId);
      if (!site) return { error: 'No draft site found. Ask me to set one up.' };
      // Trim section fields to keep response compact
      const summary = {};
      for (const [pk, page] of Object.entries(site.pages || {})) {
        summary[pk] = {
          name: page.name, slug: page.slug, status: page.status,
          sections: (page.sections || []).map((s) => ({ id: s.id, type: s.type, name: s.name, status: s.status })),
        };
      }
      return { pages: summary };
    }

    case 'get_config': {
      const cfg = await readConfig(userId);
      if (!cfg) return { error: 'No config found.' };
      // Redact sensitive keys
      const safe = JSON.parse(JSON.stringify(cfg));
      if (safe.integrations?.anthropicKeyEnc) {
        safe.integrations.anthropicKeyConfigured = true;
        delete safe.integrations.anthropicKeyEnc;
      }
      if (safe.integrations?.memberDb?.url) safe.integrations.memberDb.url = '[redacted]';
      return safe;
    }

    case 'update_section_fields': {
      const { page_key, section_id, fields } = input;
      const site = await readSite(userId);
      if (!site) return { error: 'No draft site.' };
      const page = site.pages?.[page_key];
      if (!page) return { error: `Page "${page_key}" not found.` };
      const sec = (page.sections || []).find((s) => s.id === section_id);
      if (!sec) return { error: `Section "${section_id}" not found in page "${page_key}".` };
      sec.fields = { ...(sec.fields || {}), ...fields };
      await writeSite(userId, site);
      return { ok: true, section_id, updated_fields: Object.keys(fields) };
    }

    case 'add_section': {
      const { page_key, type, name, fields, bg, status } = input;
      const site = await readSite(userId);
      if (!site) return { error: 'No draft site.' };
      if (!site.pages?.[page_key]) return { error: `Page "${page_key}" not found.` };
      const id = `${type}-${Date.now()}`;
      const section = { id, type, name, bg: bg || 'ivory', status: status || 'draft', fields: fields || {} };
      site.pages[page_key].sections = [...(site.pages[page_key].sections || []), section];
      await writeSite(userId, site);
      return { ok: true, section_id: id };
    }

    case 'update_config_path': {
      const { path, value } = input;
      if (!canWriteMemberConfigPath(staffTemplate, path)) {
        return { error: `${staffTemplate.name} is not authorized to write config path "${path}".` };
      }
      // Guard: block attempts to write to sensitive credential fields (reserved for UI config)
      if (
        path.startsWith('integrations.memberDb.url')
        || path === 'integrations.anthropicKey'
        || path === 'integrations.anthropicKeyEnc'
      ) {
        return { error: 'Sensitive keys can only be set through the Config UI, not the agent.' };
      }
      const cfg = await readConfig(userId) || {};
      deepSet(cfg, path, value);
      await writeConfig(userId, cfg);
      return { ok: true, path, value };
    }

    case 'update_page': {
      const { page_key, patch } = input;
      const ALLOWED = ['name', 'navLabel', 'navGroup', 'hideFromNav', 'slug', 'order'];
      const site = await readSite(userId);
      if (!site) return { error: 'No draft site.' };
      if (!site.pages?.[page_key]) return { error: `Page "${page_key}" not found.` };
      for (const k of Object.keys(patch)) {
        if (ALLOWED.includes(k)) site.pages[page_key][k] = patch[k];
      }
      await writeSite(userId, site);
      return { ok: true, page_key, updated: Object.keys(patch).filter((k) => ALLOWED.includes(k)) };
    }

    // query_db_* handled above via prefix match

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(member, hasMemberDb, staffTemplate, context = 'personal_brand', memory = []) {
  const contextGuidance = {
    personal_brand: 'Focus on personal-brand pages, layouts, navigation, header/footer language, calls to action, tags, SEO fields, and mappings from persisted member data into public fields.',
    career_intake: 'Focus on career intake, source-to-master mapping definitions, career metadata, skills/tools/capabilities, proficiency definitions, and which approved data may feed public profile fields. Never claim an intake record changed unless a tool actually persisted it.',
    resume_outputs: 'Focus on persisted resumePresets and reusable output configuration: selected career sections, ordering, audience rules, headings, summaries, tags, and mapping rules. Prefer configuration changes over one-off generated text.',
  };
  return `You are ${staffTemplate.name}, a BestyStaff-derived agent for Salt Basin Net Works. You are helping ${member.email} configure their member-scoped draft environment.

Current configuration workspace: ${context}.
${contextGuidance[context] || contextGuidance.personal_brand}

Purpose: ${staffTemplate.purpose}
Workforce type: ${staffTemplate.workforceType}. You are not Channel Rod Staff unless explicitly assigned to a Channel Rod.

Your capabilities:
- Read and update the member's draft site (pages, sections, fields)
- Read and update the member's draft config (brand, social links, resume presets, etc.)
- Add new sections to existing pages
- Update page navigation settings

What you CANNOT do:
- Create or modify database schemas
- Access other members' data
- Access Salt Basin platform-level admin settings
- Push changes live (the member must click Publish in the editor)
- Modify integrations.anthropicKey or integrations.memberDb.url (Config UI only)

Salt Basin site structure:
- A site has PAGES (e.g. home, about, contact) each with a list of SECTIONS
- Sections have a TYPE (block type) and FIELDS (the editable content)
- Block types: text, hero, cards, cta, twoCol, resume, domains, caseStudies, referencesRequest, statGrid, process, columns, iconGrid, contact, socialGrid, scripture, netWorksBanner, joinNetwork
- Config holds brand colors, social links, resume presets, and integration settings

Guidelines:
${staffTemplate.instructions.map((instruction) => `- ${instruction}`).join('\n')}
- Always call get_site first before making changes so you know the current structure
- When adding sections, set status to 'draft' unless the member explicitly wants it live
- Suggest meaningful section names that will make sense in the sidebar
- After making changes, summarize exactly what was updated
- Ask clarifying questions before large structural changes
- Voice: direct, strategic, no fluff
- Customer memory below is already filtered for this user and module. Never infer access to records not included, and only write through the tools granted for this workspace.${hasMemberDb ? '\n- You have access to the member\'s external database via query_member_db' : ''}

PERMISSION-FILTERED CUSTOMER MEMORY:
${JSON.stringify(memory).slice(0, 16000)}`;
}

// ── Main chat endpoint ────────────────────────────────────────────────────────

router.post('/', agentLimiter, async (req, res) => {
  const { message, history = [], staffTemplateId, context = 'personal_brand' } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message required' });
  }

  const apiKey = await getAnthropicKey(req.user.id);
  if (!apiKey) {
    return res.status(400).json({
      error: 'No Anthropic API key configured. Set ANTHROPIC_API_KEY in Render env or paste a BYO key in your Config panel under "Config Agent · Bring Your Own Claude".',
    });
  }

  // Check for member DB connections (array of named sources)
  const cfg = await readConfig(req.user.id);
  const configuredTemplateId = cfg?.agents?.defaultMemberStaffTemplateId;
  const staffTemplate = resolveMemberStaffTemplate(staffTemplateId || configuredTemplateId);
  const definitionKey = staffTemplate.id === 'profile_builder' ? 'member-profile-builder-staff' : 'member-personal-brand-staff';
  const agentDefinition = await db.prepare(`SELECT id, config FROM agent_hub_definitions WHERE key=$1`).get(definitionKey);
  const definitionConfig = typeof agentDefinition?.config === 'string' ? JSON.parse(agentDefinition.config) : (agentDefinition?.config || {});
  const llmPolicy = definitionConfig.llm || { provider: 'anthropic', model: DEFAULT_MODEL, maxOutputTokensPerResponse: 4096, tokenCap: 500000, capPeriod: 'month', maxToolIterations: MAX_TOOL_ITERATIONS };
  const memberDbs = cfg?.integrations?.memberDbs || [];
  const memberDbPools = {};
  const activeTools = toolsForMemberStaff(staffTemplate, TOOLS);

  for (const dbCfg of memberDbs) {
    if (!staffTemplate.allowExternalSources) break;
    if (!dbCfg.url || !dbCfg.id) continue;
    try {
      memberDbPools[dbCfg.id] = {
        pool: postgres(dbCfg.url, { max: 2, idle_timeout: 10, connect_timeout: 8, prepare: false }),
        allowWrite: !!dbCfg.allowWrite,
        name: dbCfg.name || dbCfg.id,
      };
      activeTools.push({
        name: `query_db_${dbCfg.id}`,
        description: `Run a query against member data source "${dbCfg.name || dbCfg.id}"${dbCfg.description ? ': ' + dbCfg.description : ''}. ${dbCfg.allowWrite ? 'Read/write access enabled.' : 'Read-only (SELECT only).'}`,
        input_schema: {
          type: 'object',
          properties: { sql: { type: 'string', description: `SQL statement to run against "${dbCfg.name || dbCfg.id}"` } },
          required: ['sql'],
        },
      });
    } catch {}
  }

  const member = req.user;
  const memory = await permittedCustomerMemory(req.user.id, context);
  const systemPrompt = buildSystemPrompt(member, Object.keys(memberDbPools).length > 0, staffTemplate, context, memory);

  // Build message history for Claude
  const messages = [
    ...history.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20),
    { role: 'user', content: message },
  ];

  // Agentic loop: call Claude → execute tools → repeat until text response
  let iterations = 0;
  let toolCallLog = [];

  try {
    while (iterations < Number(llmPolicy.maxToolIterations || MAX_TOOL_ITERATIONS)) {
      iterations++;
      if (agentDefinition) await assertAgentLlmBudget(Number(agentDefinition.id), llmPolicy);

      const claudeRes = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: llmPolicy.model || DEFAULT_MODEL,
          max_tokens: Number(llmPolicy.maxOutputTokensPerResponse || 4096),
          system: systemPrompt,
          tools: activeTools,
          messages,
        }),
      });

      const body = await claudeRes.json().catch(() => ({}));
      if (!claudeRes.ok) {
        const errMsg = body?.error?.message || JSON.stringify(body);
        return res.status(claudeRes.status).json({ error: errMsg });
      }
      if (agentDefinition) await recordAgentLlmUsage(Number(agentDefinition.id), llmPolicy, body.usage || {});

      // If Claude stopped with text (no tool calls), we're done
      if (body.stop_reason === 'end_turn' || !body.content?.some((c) => c.type === 'tool_use')) {
        const text = (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
        await captureMemberChatMemory({ userId: req.user.id, moduleScope: context, userMessage: message, assistantMessage: text, toolCalls: toolCallLog });
        audit({
          req, actor: req.user, action: 'agent.chat',
          entityType: 'member_site', entityId: req.user.id,
          summary: `Agent: "${message.slice(0, 80)}" → ${toolCallLog.length} tool calls`,
        });
        return res.json({ reply: text, toolCalls: toolCallLog, usage: body.usage });
      }

      // Execute tool calls
      const assistantContent = body.content;
      messages.push({ role: 'assistant', content: assistantContent });

      const toolResults = [];
      for (const block of assistantContent) {
        if (block.type !== 'tool_use') continue;
        const result = await executeTool(block.name, block.input, req.user.id, memberDbPools, staffTemplate);
        toolCallLog.push({ tool: block.name, input: block.input, result });
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    // Hit iteration cap
    const limitReply = 'I reached the tool-call limit on this request. Try breaking the task into smaller steps.';
    await captureMemberChatMemory({ userId: req.user.id, moduleScope: context, userMessage: message, assistantMessage: limitReply, toolCalls: toolCallLog });
    res.json({ reply: limitReply, toolCalls: toolCallLog });
  } catch (e) {
    console.error('[memberAgent] error:', e.message);
    if (e.code === 'AGENT_LLM_CAP_REACHED') return res.status(429).json({ error: 'This agent has reached its configured LLM token cap for the current period.', usage: e.usage });
    res.status(500).json({ error: e.message });
  } finally {
    for (const src of Object.values(memberDbPools)) {
      src.pool.end().catch(() => {});
    }
  }
});

export default router;
