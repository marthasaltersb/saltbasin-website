// Platform MCP tool registry (2026-10-09). APPEND-ONLY, like the block REGISTRY in
// src/components/blocks/index.jsx: a tool that has shipped is never removed or renamed, because agents and
// saved configurations call it by name. Retire a tool by setting `deprecated` (it stays listed and callable);
// scripts/check-interface-parity.mjs compares this file with server/data/mcpToolManifest.json and fails if a
// shipped name is missing.
//
// Every tool is the MCP face of a capability that already exists in the website and the API:
//   - `handler` calls the SAME server function the matching API route calls (never a copy of its logic);
//   - `permission` is the same check that route applies ('user' = any signed-in user acting on their own
//     data, like requireUser; 'admin' = requireAdmin);
//   - the caller always acts as a real platform user (server/lib/platformAccess.js) and
//     server/lib/mcpServer.js re-applies role, scope, forced-password-change and Career Portfolio terms
//     on EVERY call. A token scope can only narrow access, never grant it.
// Handlers import their server modules lazily so this file (names, schemas, scopes) can be read by the parity
// check without opening the database.

/** Scope keys a token can carry. Each tool names exactly one. */
export const MCP_SCOPES = Object.freeze({
  'career.read': 'Read your Career Master, tracked opportunities and application outputs',
  'career.write': 'Track opportunities, save new draft versions, and ask the cover-letter agent for edits',
  'outputs.approve': 'Approve an output for its QR link (runs the finalization gate, same as the website)',
  'release.read': 'Read release records and the release tracker (administrators only)',
  'release.write': 'Create, reconcile, approve and import release records, dispose failed runs and edit the tracker rules (administrators only)',
  'release.loop.read': 'Read the release loop definition, runs, bugs and escalations (administrators only)',
  'sessions.read': 'Read after-session metrics, trends, mapping proposals, capture failures and the mapping rules (administrators only)',
  'sessions.write': 'Change the mapping rules, re-map, import sessions, reject or apply proposals and dispose capture failures (administrators only)',
  'release.loop.write': 'Change the release loop definition and drive runs, rounds, bugs and reconciliation (administrators only)',
  'renderings.read': 'Read renderings, their data map, history and pending changes',
  'renderings.write': 'Propose or make a change to a mapped source value (live or for approval, by the binding policy)',
  'renderings.approve': 'Approve or reject a pending data change; settings (administrators only; runs the finalization gate)',
  'datamodel.read': 'Read the data model map: tables, columns, relations, which routes and modules use them, and the data-object picker (held by administrators by default, grantable to any profile)',
  'datamodel.write': 'Change the data model map domain grouping rules (held by administrators by default, grantable to any profile)',
  'flows.read': 'Read journey flows, templates, history and the studio definition',
  'flows.write': 'Create, save, import, restore and template journey flows; change the studio definition (the studio access policy still applies)',
  'flows.publish': 'Publish a journey flow as the journey definition (runs the finalization gate, same as the website)',
  'flowjourney.read': 'Read the pick lists behind journey bindings, preview the journey a flow generates, and read the journey a flow is running as',
  'flowjourney.write': 'Start a test run of an activated journey and map or unmap experience channels (the studio access policy still applies)',
  'flowjourney.publish': 'Activate a published flow as a journey the platform runs (runs the finalization gate, same as the website)',
  'agent.runner.read': 'Read agent runner settings, the agent roster, runs, outputs, test plans and backlog seeds (administrators only)',
  'agent.runner.write': 'Prompt agents, stop runs, decide scope requests and proposals, change runner settings and move backlog seeds (administrators only)',
  'smoke.read': 'Read the status of the fictional production smoke test account (administrators only)',
  'smoke.write': 'Ready the fictional production smoke test account without changing its password (administrators only)',
});

const id = (description) => ({ type: 'integer', minimum: 1, description });
const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });

/** Same function and ownership check as GET /api/resume-outputs/:id/versions; a foreign id reads as not found. */
async function versionHistoryOr404(userId, outputId) {
  const { getOutputVersionHistory } = await import('./outputVersionHistory.js');
  const h = await getOutputVersionHistory(userId, outputId);
  if (!h) throw Object.assign(new Error('Resume output not found'), { status: 404, code: 'not_found' });
  return h;
}

import { ROUTE_TOOLS } from './mcpRouteTools.js';
import { jsonProblemMessage } from './friendlyErrors.js';
import { FLOW_STUDIO_TOOLS } from './mcpFlowStudioTools.js';

/** Release loop tools: same functions and error statuses as server/routes/releaseLoop.js; the admin check is the registry's permission. */
const rlActor = (user) => ({ id: user.id, label: user.name || user.email || `user ${user.id}` });
const rlLoop = () => import('./releaseLoopPlatform.js');
const rlDef = () => import('./releaseLoopDefinition.js');
const rcLib = () => import('./releaseCut.js');
const arLib = () => import('./agentRunner.js');
const arTool = (name, title, description, inputSchema, scope, api, handler) => ({ name, title, description: `Administrators only. ${description}`, inputSchema, scope, permission: 'admin', api, handler });
const rlObj =(description) => ({ type: 'object', description, additionalProperties: true });
const rlTool = (name, title, description, inputSchema, scope, api, handler) => ({ name, title, description: `Administrators only. ${description}`, inputSchema, scope, permission: 'admin', api, handler });


/** Release intelligence tools: same functions, validation and error statuses as server/routes/releaseIntelligence.js; the admin check is the registry's permission. */
const riLib = () => import('./releaseIntelligence.js');
const riImp = () => import('./releaseLogImporter.js');
const riCfg = () => import('./releaseIntelligenceConfig.js');
const riBad = (message) => Object.assign(new Error(message), { status: 400, code: 'bad_request' });
const riTool = (name, title, description, inputSchema, scope, api, handler) => rlTool(name, title, description, inputSchema, scope, api, handler);
const RI = 'release.write';

/** After-session mapping tools: same functions and error statuses as server/routes/sessionMapping.js; admin check is the registry's permission. Metrics only - no transcript text is ever returned. */
const smLib = () => import('./sessionMapping.js');
const smCfg = () => import('./sessionMappingConfig.js');
const smNotFound = (what) => Object.assign(new Error(`${what} not found`), { status: 404, code: 'not_found' });
const smTool = (name, title, description, inputSchema, scope, api, handler) => rlTool(name, title, description, inputSchema, scope, api, handler);
/** Render bindings tools: same functions (and error statuses) as server/routes/renderBindings.js. */
const rbLib = () => import('./renderBindings.js');
const rbTool = (name, title, description, inputSchema, scope, permission, api, handler) => ({ name, title, description, inputSchema, scope, permission, api, handler });
const RB_TOOLS = [
  rbTool('render_binding_renderings_list', 'List renderings', 'Lists the renderings the caller\'s role may open (each is a view over mapped source data).',
    schema({}), 'renderings.read', 'user', 'GET /api/render-bindings/renderings',
    async (_a, { user }) => { const RB = await rbLib(); await RB.ensureSeeded(); return { renderings: await RB.listRenderings(user) }; }),
  rbTool('render_binding_rendering_read', 'Read a rendering', 'Returns one rendering with its items (subjects), channels and pending counts.',
    schema({ renderingKey: str('Rendering key, for example release-world or member-board.', { maxLength: 80 }) }, ['renderingKey']),
    'renderings.read', 'user', 'GET /api/render-bindings/renderings/:key',
    async (args, { user }) => (await rbLib()).viewRendering(user, args.renderingKey)),
  rbTool('render_binding_item_read', 'Read an item\'s data map', 'Returns the Data map of one item: every visual channel with its source, value, provenance, pending ghost value and the fields the caller may edit. An unbound channel reads "not mapped".',
    schema({ renderingKey: str('Rendering key.', { maxLength: 80 }), subjectKey: str('Item key.', { maxLength: 120 }) }, ['renderingKey', 'subjectKey']),
    'renderings.read', 'user', 'GET /api/render-bindings/renderings/:key/subjects/:subjectKey',
    async (args, { user }) => (await rbLib()).viewSubject(user, args.renderingKey, args.subjectKey)),
  rbTool('render_binding_item_history', 'Read an item\'s change history', 'Returns the event log used by the time slider: value changes, proposals, decisions and write-back failures.',
    schema({ renderingKey: str('Rendering key.', { maxLength: 80 }), subjectKey: str('Item key.', { maxLength: 120 }) }, ['renderingKey', 'subjectKey']),
    'renderings.read', 'user', 'GET /api/render-bindings/renderings/:key/subjects/:subjectKey/history',
    async (args, { user }) => (await rbLib()).subjectHistory(user, args.renderingKey, args.subjectKey)),
  rbTool('render_binding_board_item_add', 'Add a workshop board item', 'Adds an item to the workshop board (the manual-entry rendering).',
    schema({ title: str('Item title.', { minLength: 1, maxLength: 200 }) }, ['title']),
    'renderings.write', 'user', 'POST /api/render-bindings/renderings/:key/subjects',
    async (args, { user }) => ({ subject: await (await rbLib()).createBoardItem(user, args.title) })),
  rbTool('render_binding_change_submit', 'Change a mapped source value', 'Changes one source field. Live bindings write immediately and notify open renderings; bindings that require approval record a pending proposal (nothing is overwritten). The field\'s editable_roles are enforced for the caller.',
    schema({ renderingKey: str('Rendering key.', { maxLength: 80 }), subjectKey: str('Item key.', { maxLength: 120 }), portKey: str('Port key.', { maxLength: 80 }), objectKey: str('Object key.', { maxLength: 80 }), fieldKey: str('Field key.', { maxLength: 80 }), value: { description: 'The new value.' }, note: str('Optional note.', { maxLength: 500 }) }, ['renderingKey', 'subjectKey', 'portKey', 'objectKey', 'fieldKey', 'value']),
    'renderings.write', 'user', 'POST /api/render-bindings/changes',
    async (args, { user }) => (await rbLib()).submitChange(user, args)),
  rbTool('render_binding_pending_list', 'List pending changes', 'Lists changes waiting for approval that the caller may see.',
    schema({}), 'renderings.read', 'user', 'GET /api/render-bindings/changes/pending',
    async (_a, { user }) => ({ pending: await (await rbLib()).listPending(user) })),
  rbTool('render_binding_change_impact', 'Impact analysis for a pending change', 'Computes on demand everything a pending change touches: bindings that read the field (before to after), calculated metrics, and connected rods.',
    schema({ changeId: id('The pending change id.') }, ['changeId']), 'renderings.read', 'user', 'GET /api/render-bindings/changes/:id/impact',
    async (args, { user }) => (await rbLib()).impactForChange(user, args.changeId)),
  rbTool('render_binding_change_decide', 'Approve or reject a pending change', 'Administrators only. Approve moves the change through its approval steps (only the last step applies the value) and runs the finalization gate, same as the website; reject leaves the approved value.',
    schema({ changeId: id('The pending change id.'), decision: { type: 'string', enum: ['approve', 'reject'] }, note: str('Optional note.', { maxLength: 500 }) }, ['changeId', 'decision']),
    'renderings.approve', 'admin', 'POST /api/render-bindings/changes/:id/approve|reject',
    async (args, { user }) => {
      if (args.decision === 'approve') { const { assertReadyToFinalize } = await import('./finalizationGates.js'); await assertReadyToFinalize(user.id); }
      return (await rbLib()).decideChange(user, args.changeId, args.decision, args.note);
    }),
  rbTool('render_binding_settings_read', 'Read render binding settings', 'Administrators only. Ports and fields (with editable roles), bindings with their change policy, and approval steps.',
    schema({}), 'renderings.approve', 'admin', 'GET /api/render-bindings/settings',
    async () => {
      const RB = await rbLib(); const Reg = await import('./renderBindingRegistry.js');
      const catalog = await RB.loadCatalog(); const { bindings, overrideError } = await RB.loadBindings();
      return { ports: catalog.filter((p) => !p.internal).map((p) => ({ portKey: p.port_key, name: p.name, portType: p.port_type, fields: p.objects.flatMap((o) => o.fields.map((f) => ({ objectKey: o.object_key, fieldKey: f.field_key, editableRoles: f.editable_roles, derived: !!f.derived }))) })),
        bindings: bindings.filter((b) => !Reg.findRendering(b.rendering)?.internal).map((b) => ({ id: b.id, rendering: b.rendering, channel: b.channel, changePolicy: b.change_policy, enabled: b.enabled })), steps: await RB.listWorkflowSteps(), roles: Reg.ROLES, overrideError };
    }),
  rbTool('render_binding_settings_save', 'Change render binding settings', 'Administrators only. One of: overrides (binding on/off or change policy), fieldRoles (a field\'s editable roles), step (an approval step).',
    schema({ overrides: rlObj('Same body as PUT /api/render-bindings/settings/bindings.'), fieldRoles: rlObj('{ portKey, objectKey, fieldKey, editableRoles: [] }'), step: rlObj('{ id, name, roleLabel, active }') }),
    'renderings.approve', 'admin', 'PUT /api/render-bindings/settings/...',
    async (args) => {
      const RB = await rbLib(); const out = {};
      if (args.overrides) out.overrides = await RB.saveOverrides(args.overrides);
      if (args.fieldRoles) { const f = args.fieldRoles; out.field = await RB.updateFieldRoles(f.portKey, f.objectKey, f.fieldKey, f.editableRoles); }
      if (args.step) { const { id: sid, ...rest } = args.step; out.steps = await RB.updateWorkflowStep(sid, rest); }
      if (!Object.keys(out).length) { const e = new Error('Nothing to change: pass overrides, fieldRoles or step'); e.status = 400; e.code = 'bad_request'; throw e; }
      return out;
    }),
];

/** Data model map tools: same functions (and error statuses) as server/routes/dataModelMap.js; the permission check is the datamodel scope's. */
const dmLib = () => import('./dataModelMap.js');
const DM_TOOLS = [
  rbTool('data_model_catalog_read', 'Read the data model map', 'Needs the datamodel permission (administrators by default). Returns the stamped data model catalog summary: Graphify version and source commit, counts, domains, every table with its domain, and the foreign-key links between tables.',
    schema({}), 'datamodel.read', 'permission', 'GET /api/data-model/catalog',
    async () => (await dmLib()).catalogSummary()),
  rbTool('data_model_table_read', 'Read one table of the data model map', 'Needs the datamodel permission (administrators by default). Returns one table: columns (type, nullable, primary key, references), tables it references and that reference it, and the routes and modules that use it.',
    schema({ table: str('Table name, for example career_jobs.', { maxLength: 120 }) }, ['table']), 'datamodel.read', 'permission', 'GET /api/data-model/tables/:name',
    async (args) => ({ table: await (await dmLib()).tableDetail(args.table) })),
  rbTool('data_model_code_read', 'Read the code-module view of the data model map', 'Needs the datamodel permission (administrators by default). Without `file` lists the code communities and their modules with import links between communities; with `file` returns that module\'s imports, importers and the tables it uses.',
    schema({ file: str('Module path, for example server/lib/journeyRods.js.', { maxLength: 200 }) }), 'datamodel.read', 'permission', 'GET /api/data-model/code',
    async (args) => (await dmLib()).codeModules({ file: args.file })),
  rbTool('data_model_search', 'Search the data model map', 'Needs the datamodel permission (administrators by default). Case-insensitive search over table names, column names and route files or mount paths (at most 60 hits).',
    schema({ query: str('Part of a table, column or route name.', { maxLength: 120 }) }, ['query']), 'datamodel.read', 'permission', 'GET /api/data-model/search',
    async (args) => (await dmLib()).searchCatalog(args.query)),
  rbTool('data_model_picker', 'Data-object and field picker source', 'Needs the datamodel permission (administrators by default). Without `object` lists the data objects (tables), optionally filtered by `domain` and `query`; with `object` lists that object\'s fields. Each entry has a stable key ("table" or "table.column") a flow definition can store.',
    schema({ domain: str('Domain key, for example career.', { maxLength: 60 }), query: str('Filter text.', { maxLength: 120 }), object: str('Table name to list fields for.', { maxLength: 120 }) }), 'datamodel.read', 'permission', 'GET /api/data-model/picker',
    async (args) => (await dmLib()).dataObjectPicker({ domain: args.domain, q: args.query, object: args.object })),
  rbTool('data_model_rules_read', 'Read the data model domain rules', 'Needs the datamodel permission (administrators by default). Returns the domain grouping rules in force (saved, or the shipped default).',
    schema({}), 'datamodel.read', 'permission', 'GET /api/data-model/rules',
    async () => (await dmLib()).getRules()),
  rbTool('data_model_rules_save', 'Change the data model domain rules', 'Needs the datamodel permission (administrators by default). Replaces the domain grouping rules (domains with label, colour, prefixes and tables) or, with reset true, returns to the shipped default.',
    schema({ domains: { type: 'array', description: 'Domains: [{ label, color: "#RRGGBB", prefixes: [], tables: [] }].', items: { type: 'object', additionalProperties: true } }, note: str('Why the rules changed.', { maxLength: 300 }), reset: { type: 'boolean', description: 'Return to the shipped default.' } }), 'datamodel.write', 'permission', 'PUT /api/data-model/rules',
    async (args, { user }) => { const M = await dmLib(); return args.reset ? M.resetRules() : M.saveRules(user, { domains: args.domains, note: args.note }); }),
];

const CORE_TOOLS = [
  {
    name: 'career_master_read',
    title: 'Read my Career Master',
    description: 'Returns the caller\'s Career Master: jobs, skills, tools, engagements, domains, certifications and deals. Same data the Career Master screen shows.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career/master?owner=me',
    handler: async (_args, { user }) => {
      const { loadMasterPayloadForOwner } = await import('../routes/careerMaster.js');
      return loadMasterPayloadForOwner(user.id, user);
    },
  },
  {
    name: 'career_opportunities_list',
    title: 'List my tracked career opportunities',
    description: 'Lists the career opportunities the caller is tracking, with stage, company, role and score.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career-agents/opportunities',
    handler: async (_args, { user }) => {
      const { listCareerOpportunities } = await import('./careerOpportunityRollups.js');
      return listCareerOpportunities(user.id);
    },
  },
  {
    name: 'career_opportunity_create',
    title: 'Track a career opportunity',
    description: 'Tracks a new career opportunity. With only a company and a role title it is a placeholder; details can be added later.',
    inputSchema: schema({
      jobTitle: str('Role title, for example "Principal Value Architect".', { minLength: 1, maxLength: 200 }),
      companyName: str('Company name.', { maxLength: 200 }),
      url: str('Link to the posting.', { maxLength: 1000 }),
      location: str('Location.', { maxLength: 200 }),
      notes: str('Notes or the job description text.', { maxLength: 20000 }),
    }, ['jobTitle']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/career-agents/opportunities',
    handler: async (args, { user }) => {
      const { trackCareerOpportunity } = await import('./opportunityOutputs.js');
      return trackCareerOpportunity(user.id, args);
    },
  },
  {
    name: 'career_opportunity_open',
    title: 'Open a tracked opportunity',
    description: 'Opens one tracked opportunity with its linked application outputs and their provenance.',
    inputSchema: schema({ opportunityId: id('The opportunity id from career_opportunities_list.') }, ['opportunityId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career-agents/opportunities/:id',
    handler: async (args, { user }) => {
      const { openCareerOpportunity } = await import('./opportunityOutputs.js');
      return openCareerOpportunity(user.id, args.opportunityId);
    },
  },
  {
    name: 'application_outputs_list',
    title: 'List application outputs for an opportunity',
    description: 'Lists the resumes, cover letters and packages linked to a tracked opportunity, newest version first, with provenance (source, dates, authors, version, Career Master state).',
    inputSchema: schema({ opportunityId: id('The opportunity id.') }, ['opportunityId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career-agents/opportunities/:id/outputs',
    handler: async (args, { user }) => {
      const { listOpportunityOutputs } = await import('./opportunityOutputs.js');
      return listOpportunityOutputs(user.id, args.opportunityId);
    },
  },
  {
    name: 'application_output_open',
    title: 'Open an application output',
    description: 'Returns one output\'s document content (header and blocks) as the block editor opens it.',
    inputSchema: schema({ outputId: id('The output id from application_outputs_list.') }, ['outputId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career-agents/resume-outputs/:id/content',
    handler: async (args, { user }) => {
      const { getOutputContentForEdit } = await import('./opportunityOutputs.js');
      return getOutputContentForEdit(user.id, args.outputId);
    },
  },
  {
    name: 'application_output_new_draft_version',
    title: 'Save a new draft version of an output',
    description: 'Saves edited document content as the NEXT DRAFT version in the same lineage. Never edits an approved version. Unchanged content is refused.',
    inputSchema: schema({
      outputId: id('The output id to edit.'),
      content: { type: 'object', description: 'The full document_blocks content: { format: "document_blocks", version: 1, header, blocks }.' },
      name: str('Optional new name for the output.', { maxLength: 200 }),
    }, ['outputId', 'content']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/career-agents/resume-outputs/:id/versions',
    handler: async (args, { user }) => {
      const { saveEditedVersion } = await import('./opportunityOutputs.js');
      return saveEditedVersion(user.id, args.outputId, { content: args.content, name: args.name || null });
    },
  },
  {
    name: 'output_versions_list',
    title: 'List the versions of an output',
    description: 'Lists every version in an output\'s lineage, oldest first: status, created and modified dates, approvedBy, and the change summary against the previous version. Same data as the Version history dialog. An id that is not yours reads as not found.',
    inputSchema: schema({ outputId: id('Any version id of the output (from application_outputs_list).') }, ['outputId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/resume-outputs/:id/versions',
    handler: async (args, { user }) => {
      const h = await versionHistoryOr404(user.id, args.outputId);
      return { lineageRootId: h.lineageRootId, title: h.title, versions: h.versions.map(({ header, blocks, ...meta }) => meta) };
    },
  },
  {
    name: 'output_version_read',
    title: 'Read one version of an output as it stood',
    description: 'Returns one version\'s header and blocks exactly as the Version history dialog shows them, with its dates and approval record.',
    inputSchema: schema({ outputId: id('Any version id of the output.'), versionId: id('The version id from output_versions_list.') }, ['outputId', 'versionId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/resume-outputs/:id/versions',
    handler: async (args, { user }) => {
      const h = await versionHistoryOr404(user.id, args.outputId);
      const v = h.versions.find((x) => x.id === args.versionId);
      if (!v) throw Object.assign(new Error('Version not found in this output'), { status: 404, code: 'not_found' });
      return v;
    },
  },
  {
    name: 'output_versions_compare',
    title: 'Compare two versions of an output',
    description: 'Returns the tracked changes from one version to another of the same output, using the same comparison as the Version history dialog.',
    inputSchema: schema({ outputId: id('Any version id of the output.'), fromVersionId: id('The earlier version id.'), toVersionId: id('The later version id.') }, ['outputId', 'fromVersionId', 'toVersionId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/resume-outputs/:id/versions',
    handler: async (args, { user }) => {
      const h = await versionHistoryOr404(user.id, args.outputId);
      const a = h.versions.find((x) => x.id === args.fromVersionId);
      const b = h.versions.find((x) => x.id === args.toVersionId);
      if (!a || !b) throw Object.assign(new Error('Version not found in this output'), { status: 404, code: 'not_found' });
      if (a.error || b.error) throw Object.assign(new Error('Cannot compare (a version could not be read)'), { status: 422, code: 'unreadable_version' });
      const { diffVersions, summarizeDiff } = await import('../../src/lib/outputVersionDiff.js');
      const changes = diffVersions(a, b);
      return { fromVersionId: a.id, toVersionId: b.id, summary: summarizeDiff(changes), changes };
    },
  },
  {
    name: 'application_output_approve_for_qr',
    title: 'Approve an output for its QR link',
    description: 'Approves one output version so its private /r/ link opens it. Runs the same finalization gate as the website: refused (409 tool_category_required) while any technology in the Career Master lacks a proficiency category.',
    inputSchema: schema({ outputId: id('The output version to approve.') }, ['outputId']),
    scope: 'outputs.approve',
    permission: 'user',
    api: 'POST /api/resume-outputs/:id/share',
    handler: async (args, { user, req }) => {
      const { approveOutputForSharing, shareUrlFor } = await import('./applicationPackages.js');
      const shared = await approveOutputForSharing(args.outputId, user);
      if (!shared) { const e = new Error('Resume output not found'); e.status = 404; e.code = 'not_found'; throw e; }
      return { ...shared, url: shareUrlFor(shared.token, req) };
    },
  },
  {
    name: 'application_output_revoke_qr',
    title: 'Revoke an output\'s QR link',
    description: 'Stops the output\'s private /r/ link from opening. The slug is discarded and never reissued. Only the owner can revoke.',
    inputSchema: schema({ outputId: id('The output version whose link to revoke.') }, ['outputId']),
    scope: 'outputs.approve',
    permission: 'user',
    api: 'DELETE /api/resume-outputs/:id/share',
    handler: async (args, { user }) => {
      const { revokeOutputSharing } = await import('./applicationPackages.js');
      const ok = await revokeOutputSharing(args.outputId, user.id);
      if (!ok) { const e = new Error('Resume output not found'); e.status = 404; e.code = 'not_found'; throw e; }
      return { ok: true };
    },
  },
  {
    name: 'application_package_import',
    title: 'Import an application package',
    description: 'Files every output of a package JSON as draft outputs (re-import skips unchanged ones; changed ones become new draft versions). Never approves anything.',
    inputSchema: schema({ package: { type: 'object', description: 'The package JSON: packageKey, outputs[{variant, outputType, name, content}], optional authors and createdAt.' } }, ['package']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/resume-outputs/import-package',
    handler: async (args, { user }) => {
      const { importApplicationPackage } = await import('./applicationPackages.js');
      try { return { results: await importApplicationPackage(user.id, args.package) }; }
      catch (err) { err.status = err.status || 400; err.code = err.code || 'invalid_package'; throw err; }
    },
  },
  {
    name: 'shared_output_resolve',
    title: 'Resolve a QR link slug',
    description: 'Returns what a visitor to /r/<slug> sees (approved document, frozen). Only approved, still-published slugs resolve; anything else is not_found.',
    inputSchema: schema({ token: str('The slug from the /r/ link.', { maxLength: 64 }) }, ['token']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/shared-outputs/:token',
    handler: async (args) => {
      const { getSharedOutputByToken, publicSharedView } = await import('./applicationPackages.js');
      const row = await getSharedOutputByToken(args.token);
      if (!row) { const e = new Error('Not found'); e.status = 404; e.code = 'not_found'; throw e; }
      return publicSharedView(row);
    },
  },
  {
    name: 'career_opportunity_update_details',
    title: 'Fill in opportunity details',
    description: 'Updates the role title, link, location or notes of a tracked opportunity (a placeholder becomes a regular entry).',
    inputSchema: schema({
      opportunityId: id('The opportunity id.'),
      jobTitle: str('Role title.', { maxLength: 200 }),
      url: str('Link to the posting.', { maxLength: 1000 }),
      location: str('Location.', { maxLength: 200 }),
      notes: str('Notes or the job description text.', { maxLength: 20000 }),
    }, ['opportunityId']),
    scope: 'career.write',
    permission: 'user',
    api: 'PATCH /api/career-agents/opportunities/:id',
    handler: async (args, { user }) => {
      const { updateOpportunityDetails } = await import('./opportunityOutputs.js');
      const { jobTitle, url, location, notes } = args;
      return updateOpportunityDetails(user.id, args.opportunityId, { jobTitle, url, location, notes });
    },
  },
  {
    name: 'application_outputs_unlinked_list',
    title: 'List outputs not linked to any opportunity',
    description: 'Lists the member\'s resume outputs that are not yet linked to a tracked opportunity.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career-agents/unlinked-outputs',
    handler: async (args, { user }) => {
      const { listUnlinkedOutputs } = await import('./opportunityOutputs.js');
      return { outputs: await listUnlinkedOutputs(user.id) };
    },
  },
  {
    name: 'application_output_link',
    title: 'Link an output to an opportunity',
    description: 'Links an existing output (its whole version lineage) to a tracked opportunity.',
    inputSchema: schema({ opportunityId: id('The opportunity id.'), outputId: id('The output id to link.') }, ['opportunityId', 'outputId']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/career-agents/opportunities/:id/outputs/:outputId/link',
    handler: async (args, { user }) => {
      const { linkOutputToOpportunity } = await import('./opportunityOutputs.js');
      return linkOutputToOpportunity(user.id, args.outputId, args.opportunityId);
    },
  },
  {
    name: 'application_output_unlink',
    title: 'Unlink an output from an opportunity',
    description: 'Removes the link between an output (its whole lineage) and a tracked opportunity.',
    inputSchema: schema({ opportunityId: id('The opportunity id.'), outputId: id('The output id to unlink.') }, ['opportunityId', 'outputId']),
    scope: 'career.write',
    permission: 'user',
    api: 'DELETE /api/career-agents/opportunities/:id/outputs/:outputId/link',
    handler: async (args, { user }) => {
      const { unlinkOutputFromOpportunity } = await import('./opportunityOutputs.js');
      return unlinkOutputFromOpportunity(user.id, args.outputId, args.opportunityId);
    },
  },
  {
    name: 'cover_letter_open',
    title: 'Open a cover letter',
    description: 'Opens a cover letter (latest version) with its package-search context, as the cover-letter agent sees it.',
    inputSchema: schema({ letterId: id('The cover-letter output id.') }, ['letterId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/cover-letters/letters/:id',
    handler: async (args, { user }) => {
      const { openLetter } = await import('./coverLetterAgent.js');
      return openLetter(user.id, args.letterId);
    },
  },
  {
    name: 'cover_letter_agent_turn',
    title: 'Ask the cover-letter agent for an edit',
    description: 'One turn with the cover-letter agent. It is confined to this one letter and its package; edits come back as a proposal (tracked changes) that is NOT applied until accepted in the website.',
    inputSchema: schema({
      letterId: id('The cover-letter output id.'),
      request: str('What to change, in plain words (max 1000 characters).', { minLength: 1, maxLength: 1000 }),
      sessionKey: str('Optional conversation key that groups turns.', { maxLength: 64 }),
    }, ['letterId', 'request']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/cover-letters/letters/:id/turns',
    handler: async (args, { user }) => {
      const { runTurn } = await import('./coverLetterAgent.js');
      return { turn: await runTurn(user.id, { projectionId: args.letterId, request: args.request, sessionKey: args.sessionKey }) };
    },
  },
  {
    name: 'cover_letter_settings_read',
    title: 'Read my cover-letter settings',
    description: 'Returns the caller\'s cover-letter template, tone presets and model settings (saved values merged over defaults), plus the available providers and placeholders.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/cover-letters/settings',
    handler: async (_args, { user }) => {
      const { getSettings, PROVIDERS, PLACEHOLDERS, DEFAULT_SETTINGS } = await import('./coverLetterTemplate.js');
      return { settings: await getSettings(user.id), providers: PROVIDERS, placeholders: PLACEHOLDERS, defaults: DEFAULT_SETTINGS };
    },
  },
  {
    name: 'cover_letter_settings_save',
    title: 'Save my cover-letter settings',
    description: 'Validates and saves the caller\'s cover-letter settings. An invalid setting is refused with the reason and nothing is saved.',
    inputSchema: schema({ settings: { type: 'object', description: 'The full settings object, as returned by cover_letter_settings_read.' } }, ['settings']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/cover-letters/settings',
    handler: async (args, { user }) => {
      const { saveSettings } = await import('./coverLetterTemplate.js');
      return { settings: await saveSettings(user.id, args.settings) };
    },
  },
  {
    name: 'cover_letter_opportunities_list',
    title: 'List opportunities with letter and package state',
    description: 'Tracked opportunities with their job rec text, cover letter, resumes and combined package state. Read-only.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/cover-letters/opportunities',
    handler: async (_args, { user }) => {
      const { listOpportunityPackages } = await import('./coverLetterPackages.js');
      return { opportunities: await listOpportunityPackages(user.id) };
    },
  },
  {
    name: 'cover_letter_job_rec_save',
    title: 'Save job rec text on an opportunity',
    description: 'Saves (or clears with empty text) the job recommendation text on a tracked opportunity. The letter agent and first-draft template read it.',
    inputSchema: schema({ opportunityId: id('The tracked opportunity (career_opportunity_target rod) id.'), text: str('The job rec text.', { maxLength: 20000 }) }, ['opportunityId', 'text']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/cover-letters/opportunities/:id/job-rec',
    handler: async (args, { user }) => {
      const { setJobRecText } = await import('./coverLetterAutoDraft.js');
      return setJobRecText(user.id, args.opportunityId, args.text);
    },
  },
  {
    name: 'cover_letter_generate',
    title: 'Generate the cover letter for an opportunity',
    description: 'Creates the template-built cover letter draft for an opportunity. With force, files a new draft version even if one exists. Never edits an approved version.',
    inputSchema: schema({ opportunityId: id('The tracked opportunity id.'), force: { type: 'boolean', description: 'Regenerate even if a letter already exists.' } }, ['opportunityId']),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/cover-letters/opportunities/:id/cover-letter',
    handler: async (args, { user }) => {
      const { ensureCoverLetterForOpportunity, loadOpportunity } = await import('./coverLetterAutoDraft.js');
      const { rowView } = await import('./coverLetterPackages.js');
      await loadOpportunity(user.id, args.opportunityId);
      const result = await ensureCoverLetterForOpportunity(user.id, args.opportunityId, { force: !!args.force });
      return { created: result.created, letter: rowView(result.row) };
    },
  },
  {
    name: 'cover_letter_package_build',
    title: 'Build the combined application package',
    description: 'Assembles the combined package (table of contents, cover letter and resumes) for a tracked opportunity or an imported packageKey. Give exactly one of opportunityId or packageKey.',
    inputSchema: schema({ opportunityId: id('The tracked opportunity id.'), packageKey: str('Lowercase slug of an imported package.', { maxLength: 64 }) }),
    scope: 'career.write',
    permission: 'user',
    api: 'POST /api/cover-letters/opportunities/:id/package | POST /api/cover-letters/packages/assemble',
    handler: async (args, { user }) => {
      const { assembleApplicationPackage } = await import('./packageAssembly.js');
      const { rowView } = await import('./coverLetterPackages.js');
      const bad = (message) => { const e = new Error(message); e.status = 400; e.code = 'invalid_input'; return e; };
      if ((args.opportunityId == null) === (args.packageKey == null)) throw bad('Give exactly one of opportunityId or packageKey.');
      let result;
      if (args.opportunityId != null) {
        const { loadOpportunity } = await import('./coverLetterAutoDraft.js');
        await loadOpportunity(user.id, args.opportunityId);
        result = await assembleApplicationPackage(user.id, { opportunityRodId: args.opportunityId });
      } else {
        if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(args.packageKey)) throw bad('packageKey must be a lowercase slug.');
        result = await assembleApplicationPackage(user.id, { packageKey: args.packageKey });
      }
      return { status: result.status, sections: result.sections, package: rowView(result.row) };
    },
  },
  {
    name: 'cover_letter_turns_list',
    title: 'Read the cover-letter agent conversation',
    description: 'Lists the agent turns (requests, answers, proposals and their decisions) for one cover letter.',
    inputSchema: schema({ letterId: id('The cover-letter output id.') }, ['letterId']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/cover-letters/letters/:id/turns',
    handler: async (args, { user }) => {
      const { listTurns } = await import('./coverLetterAgent.js');
      return { turns: await listTurns(user.id, args.letterId) };
    },
  },
  {
    name: 'resume_rollups_read',
    title: 'Read my resume rollups',
    description: 'Returns the caller\'s computed resume rollups: KPI tiles, industry buckets and skill category groups, optionally with the Career Atom groupings. Same data the Resume Rollups screen shows.',
    inputSchema: schema({ includeAtom: { type: 'boolean', description: 'Also include the Career Atom groupings.' } }),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career/resume-rollups?owner=me[&include=atom]',
    handler: async (args, { user }) => {
      const { computeResumeRollups, loadMasterPayloadForOwner } = await import('../routes/careerMaster.js');
      const master = await loadMasterPayloadForOwner(user.id, user);
      return computeResumeRollups(user.id, master, { includeAtom: !!args.includeAtom });
    },
  },
  {
    name: 'resume_rollup_preview',
    title: 'Preview unsaved rollup definitions',
    description: 'Computes the rollups as if the given definitions were saved. Nothing is written. An invalid definition is refused with the reason.',
    inputSchema: schema({ definitions: { type: 'array', description: 'Draft definitions: { type, key, label, definition, sortOrder, isActive }. Types not sent keep the stored rows.', items: { type: 'object' } } }, ['definitions']),
    scope: 'career.read',
    permission: 'user',
    api: 'POST /api/career/resume-rollups/preview',
    handler: async (args, { user }) => {
      const { previewResumeRollups } = await import('../routes/careerMaster.js');
      return previewResumeRollups(user, args.definitions);
    },
  },
  {
    name: 'career_atom_rollups_read',
    title: 'Read my Career Atom rollups',
    description: 'Returns skills by category, jobs by industry and tools by wheel bucket computed from the caller\'s Career Channel Rod. A member with no Career Master rows gets an honest empty result.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career/atom-rollups?owner=me',
    handler: async (_args, { user }) => {
      const { buildCareerAtomRollupCatalog } = await import('./careerAtomRollups.js');
      return buildCareerAtomRollupCatalog(user.id);
    },
  },
  {
    name: 'career_experience_definitions_read',
    title: 'Read my experience and rollup definitions',
    description: 'Lists the caller\'s definitions: periods, proficiency levels and formulas, KPI tiles, industry buckets, category groups and Career Atom rollups.',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career/experience-definitions',
    handler: async (_args, { user }) => {
      const { listExperienceDefinitions } = await import('../routes/careerMaster.js');
      return listExperienceDefinitions(user.id);
    },
  },
  {
    name: 'career_experience_definition_save',
    title: 'Save an experience or rollup definition',
    description: 'Creates or replaces one definition. Reordering is a save with a new sortOrder. The locked Salt Basin methodology cannot be changed.',
    inputSchema: schema({
      type: str('Definition type, for example kpi_tile, industry_bucket, category_group, atom_rollup.'),
      key: str('Lowercase key (letters, numbers, underscores).', { pattern: '^[a-z][a-z0-9_]{1,79}$' }),
      label: str('Display label.', { minLength: 1, maxLength: 120 }),
      description: str('Optional description.', { maxLength: 600 }),
      definition: { type: 'object', description: 'The definition body for this type.' },
      sortOrder: { type: 'integer', description: 'Position among definitions of the same type.' },
      isActive: { type: 'boolean', description: 'Whether it is shown.' },
    }, ['type', 'key', 'label']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/experience-definitions/:type/:key',
    handler: async (args, { user }) => {
      const { saveExperienceDefinition } = await import('../routes/careerMaster.js');
      const { type, key, ...body } = args;
      return saveExperienceDefinition(user.id, type, key, body);
    },
  },
  {
    name: 'career_experience_definition_delete',
    title: 'Delete an experience or rollup definition',
    description: 'Deletes one of the caller\'s definitions. The locked Salt Basin methodology cannot be deleted.',
    inputSchema: schema({ type: str('Definition type.'), key: str('Definition key.') }, ['type', 'key']),
    scope: 'career.write',
    permission: 'user',
    api: 'DELETE /api/career/experience-definitions/:type/:key',
    handler: async (args, { user }) => {
      const { deleteExperienceDefinition } = await import('../routes/careerMaster.js');
      return deleteExperienceDefinition(user.id, args.type, args.key);
    },
  },
  {
    name: 'career_proficiency_override_save',
    title: 'Override a proficiency level',
    description: 'Sets the caller\'s own proficiency level for one skill or tool in one period, replacing the methodology result for it.',
    inputSchema: schema({
      entityType: { type: 'string', enum: ['skill', 'tool'], description: 'skill or tool.' },
      entityId: id('The skill or tool id from career_master_read.'),
      periodKey: str('Period key, for example current.'),
      levelKey: str('Active proficiency level key.'),
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      evidenceCount: { type: 'integer', minimum: 0 },
      visibility: { type: 'string', enum: ['private', 'resume', 'portfolio', 'public'] },
      notes: str('Optional note.', { maxLength: 1000 }),
    }, ['entityType', 'entityId', 'periodKey', 'levelKey']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/proficiency-assertions/:entityType/:entityId/:periodKey',
    handler: async (args, { user }) => {
      const { saveProficiencyAssertion } = await import('../routes/careerMaster.js');
      const { entityType, entityId, periodKey, ...body } = args;
      return saveProficiencyAssertion(user.id, entityType, entityId, periodKey, body);
    },
  },
  {
    name: 'career_proficiency_override_clear',
    title: 'Clear a proficiency override',
    description: 'Removes the caller\'s own proficiency override so the methodology result applies again.',
    inputSchema: schema({
      entityType: { type: 'string', enum: ['skill', 'tool'] },
      entityId: id('The skill or tool id.'),
      periodKey: str('Period key.'),
    }, ['entityType', 'entityId', 'periodKey']),
    scope: 'career.write',
    permission: 'user',
    api: 'DELETE /api/career/proficiency-assertions/:entityType/:entityId/:periodKey',
    handler: async (args, { user }) => {
      const { deleteProficiencyAssertion } = await import('../routes/careerMaster.js');
      return deleteProficiencyAssertion(user.id, args.entityType, args.entityId, args.periodKey);
    },
  },
  {
    name: 'proficiency_rules_read',
    title: 'Read my proficiency rules and results',
    description: 'Returns each skill and technology with its resolved proficiency level, the inputs and points behind it, whether it is derived by the methodology, a member formula or a member override, the active formula, the available levels and technology categories. Same data as Proficiency rules.',
    inputSchema: schema({ period: str('Period key; defaults to "current".', { maxLength: 80 }) }),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/career/proficiency',
    handler: async (args, { user }) => {
      const { buildProficiencyView } = await import('../routes/careerMaster.js');
      return buildProficiencyView(user.id, args.period ? String(args.period) : 'current');
    },
  },
  {
    name: 'proficiency_override_set',
    title: 'Override a proficiency level',
    description: 'Sets your own proficiency level for one skill or technology (shown with the dagger mark). Same write as the website override.',
    inputSchema: schema({
      entityType: { type: 'string', enum: ['skill', 'tool'], description: 'Whether the entity is a skill or a technology.' },
      entityId: id('The skill or technology id from career_master_read.'),
      levelKey: str('A proficiency level key from proficiency_rules_read.', { minLength: 1, maxLength: 80 }),
    }, ['entityType', 'entityId', 'levelKey']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/proficiency-assertions/:entityType/:entityId/:periodKey',
    handler: async (args, { user }) => {
      const { saveProficiencyAssertion } = await import('../routes/careerMaster.js');
      return saveProficiencyAssertion(user.id, args.entityType, args.entityId, 'current', { levelKey: args.levelKey, assessmentSource: 'user_confirmed', confidence: 1, visibility: 'resume' });
    },
  },
  {
    name: 'proficiency_override_clear',
    title: 'Remove a proficiency override',
    description: 'Removes your override for one skill or technology so its level is derived again.',
    inputSchema: schema({
      entityType: { type: 'string', enum: ['skill', 'tool'], description: 'Whether the entity is a skill or a technology.' },
      entityId: id('The skill or technology id.'),
    }, ['entityType', 'entityId']),
    scope: 'career.write',
    permission: 'user',
    api: 'DELETE /api/career/proficiency-assertions/:entityType/:entityId/:periodKey',
    handler: async (args, { user }) => {
      const { deleteProficiencyAssertion } = await import('../routes/careerMaster.js');
      return deleteProficiencyAssertion(user.id, args.entityType, args.entityId, 'current');
    },
  },
  {
    name: 'technology_category_set',
    title: 'Set a technology\'s proficiency category',
    description: 'Records how a technology was used (hands_on, integration_design or adjacent), or clears it with null. Saved to the Career Master tool record, so outputs and the finalization gate pick it up.',
    inputSchema: schema({
      toolId: id('The technology id from career_master_read.'),
      category: { type: ['string', 'null'], enum: ['hands_on', 'integration_design', 'adjacent', null], description: 'The category, or null to clear it.' },
    }, ['toolId', 'category']),
    scope: 'career.write',
    permission: 'user',
    api: 'PATCH /api/career/tools/:id',
    handler: async (args, { user }) => {
      const { setToolProficiencyCategory } = await import('../routes/careerMaster.js');
      return setToolProficiencyCategory(user.id, args.toolId, args.category);
    },
  },
  {
    name: 'proficiency_formula_save',
    title: 'Save a proficiency formula',
    description: 'Creates or updates one of your own proficiency formulas (terms and level thresholds). Whether it is the active formula is kept as it was (new formulas start unselected); use proficiency_formula_select to switch. The Salt Basin methodology is locked and cannot be overwritten.',
    inputSchema: schema({
      key: str('Lowercase letters, numbers and underscores.', { minLength: 2, maxLength: 80 }),
      label: str('Display name.', { minLength: 1, maxLength: 120 }),
      description: str('Optional description.', { maxLength: 600 }),
      definition: { type: 'object', description: '{ terms: [{ input, weight, cap }], thresholds: [{ levelKey, minPoints }] }. Inputs and levels are listed by proficiency_rules_read.' },
      sortOrder: { type: 'integer' },
      isActive: { type: 'boolean' },
    }, ['key', 'label', 'definition']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/experience-definitions/:type/:key',
    handler: async (args, { user }) => {
      const { saveProficiencyFormula } = await import('../routes/careerMaster.js');
      return saveProficiencyFormula(user.id, args.key, { label: args.label, description: args.description, definition: args.definition, sortOrder: args.sortOrder ?? 20, isActive: args.isActive });
    },
  },
  {
    name: 'proficiency_formula_select',
    title: 'Choose the active proficiency formula',
    description: 'Selects which formula resolves your proficiency levels: one of your own formula keys, or "salt_basin_methodology" to return to the methodology. Exactly one is active.',
    inputSchema: schema({ key: str('A formula key from proficiency_rules_read, or salt_basin_methodology.', { minLength: 2, maxLength: 80 }) }, ['key']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/experience-definitions/:type/:key',
    handler: async (args, { user }) => {
      const { selectProficiencyFormula } = await import('../routes/careerMaster.js');
      return selectProficiencyFormula(user.id, args.key);
    },
  },
  {
    name: 'certification_mapping_save',
    title: 'Map a certification to skills or technologies',
    description: 'Creates or updates a certification bonus: one of your certifications adds bonus points to the skills and technologies it maps to.',
    inputSchema: schema({
      key: str('Lowercase letters, numbers and underscores.', { minLength: 2, maxLength: 80 }),
      label: str('Display name.', { minLength: 1, maxLength: 120 }),
      certificationId: id('One of your certifications.'),
      targets: { type: 'array', minItems: 1, items: { type: 'object', properties: { entityType: { type: 'string', enum: ['skill', 'tool'] }, entityId: { type: 'integer', minimum: 1 } }, required: ['entityType', 'entityId'], additionalProperties: false } },
      bonusPoints: { type: 'number' },
      countIfLapsed: { type: 'boolean' },
    }, ['key', 'label', 'certificationId', 'targets']),
    scope: 'career.write',
    permission: 'user',
    api: 'PUT /api/career/experience-definitions/:type/:key',
    handler: async (args, { user }) => {
      const { saveExperienceDefinition } = await import('../routes/careerMaster.js');
      return saveExperienceDefinition(user.id, 'certification_mapping', args.key, { label: args.label, definition: { certificationId: args.certificationId, targets: args.targets, bonusPoints: args.bonusPoints, countIfLapsed: args.countIfLapsed }, sortOrder: 10 });
    },
  },
  {
    name: 'shared_output_live_read',
    title: 'Read a live QR page',
    description: 'Returns what the private /r/ page for an approved output shows right now (live data, version and approval metadata). The token is the secret from the QR link; an unapproved or revoked token reads as not found, exactly as on the website.',
    inputSchema: schema({ token: str('The slug from the /r/ link.', { minLength: 8, maxLength: 200 }) }, ['token']),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/shared-outputs/:token',
    handler: async (args) => {
      const { getSharedOutputByToken, publicSharedView } = await import('./applicationPackages.js');
      const row = await getSharedOutputByToken(args.token);
      if (!row) { const e = new Error('Not found'); e.status = 404; e.code = 'not_found'; throw e; }
      return publicSharedView(row);
    },
  },
  {
    name: 'platform_mcp_info',
    title: 'Show the MCP address and tools',
    description: 'Returns the MCP address, transport and the tools registered. Same facts as GET /api/platform/mcp (Connected Agents screen).',
    inputSchema: schema({}),
    scope: 'career.read',
    permission: 'user',
    api: 'GET /api/platform/mcp',
    handler: async (args, ctx) => {
      const base = (process.env.APP_BASE_URL || '').replace(/\/+$/, '');
      return {
        url: base ? `${base}/mcp` : '/mcp',
        transport: 'Streamable HTTP (stateless, POST)',
        authorization: 'Authorization: Bearer <token>',
        isAdmin: ctx.user.role === 'admin',
        scopes: Object.entries(MCP_SCOPES).map(([key, description]) => ({ key, description, tools: MCP_TOOLS.filter((t) => t.scope === key).map((t) => t.name) })),
        tools: MCP_TOOLS.map(describeTool),
      };
    },
  },
  {
    name: 'platform_capabilities_map',
    title: 'Read the interface parity map',
    description: 'Administrators only. Returns the parity map: every capability with its website path, API routes and MCP tools, plus a summary. Same as GET /api/platform/capabilities.',
    inputSchema: schema({}),
    scope: 'release.read',
    permission: 'admin',
    api: 'GET /api/platform/capabilities',
    handler: async () => {
      const { CAPABILITIES, evaluateCapabilities, summarizeCapabilities } = await import('./capabilityParity.js');
      const rows = evaluateCapabilities(CAPABILITIES);
      return { summary: summarizeCapabilities(rows), capabilities: rows };
    },
  },
  {
    name: 'release_tracker_read',
    title: 'Read release records',
    description: 'Administrators only. Without releaseId: lists release records. With releaseId: that release with its features, rounds and failed runs.',
    inputSchema: schema({ releaseId: id('Optional release id; omit to list all releases.') }),
    scope: 'release.read',
    permission: 'admin',
    api: 'GET /api/release-intelligence/releases[/:id]',
    handler: async (args) => {
      const { listReleases, getReleaseDetail } = await import('./releaseIntelligence.js');
      if (args.releaseId == null) return { releases: await listReleases() };
      const detail = await getReleaseDetail(args.releaseId);
      if (!detail) { const e = new Error('Release not found'); e.status = 404; e.code = 'not_found'; throw e; }
      return detail;
    },
  },
  {
    name: 'release_tracker_get_state',
    title: 'Read the release tracker state',
    description: 'Latest release tracker snapshot: features (each carries scope planned/backlog and added-after-the-cut), history points and numbered updates. Administrators, and members whose email is granted on the tracker Settings tab. Same as GET /api/release-tracker/state.',
    inputSchema: schema({ release: str('Optional release key; omit for the current release.', { maxLength: 120 }) }),
    scope: 'release.read',
    permission: 'user',
    api: 'GET /api/release-tracker/state',
    handler: async (args, { user }) => {
      const { getState, viewerKindForUser } = await import('./releaseTrackerService.js');
      const viewer = await viewerKindForUser(user);
      if (!viewer) { const e = new Error('You do not have access to the release tracker. Ask an admin to add your email on its Settings tab.'); e.status = 403; e.code = 'tracker_access_denied'; throw e; }
      return { viewer, state: await getState({ releaseKey: args.release ? String(args.release) : null }) };
    },
  },
  ...(() => {
    const rt = async () => import('./releaseTrackerService.js');
    const jsonish = (d) => ({ type: ['object', 'array', 'string'], description: d });
    const parse = async (v, what) => {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch (e) {
        const { jsonProblemMessage } = await import('./friendlyErrors.js');
        const { TrackerError } = await rt();
        throw new TrackerError(jsonProblemMessage(what, e), 400, 'json_invalid');
      }
    };
    const adm = (name, title, description, props, required, api, handler, scope = RI) => ({
      name, title, description: `Administrators only. ${description}`, inputSchema: schema(props, required), scope, permission: 'admin', api, handler,
    });
    return [
      adm('release_tracker_ingest_snapshot', 'Store a release tracker snapshot', 'Stores a snapshot, history and numbered updates (append-only), as when an admin pastes a snapshot on the tracker Settings tab. Each of snapshot, history and updates may be an object/array or a JSON string. Same as POST /api/release-tracker/snapshots.',
        { snapshot: jsonish('The snapshot (object or JSON string).'), history: jsonish('Optional history points.'), updates: jsonish('Optional numbered updates.'), releaseKey: str('Optional release key.', { maxLength: 120 }), commit: str('Optional commit sha.', { maxLength: 60 }) }, ['snapshot'],
        'POST /api/release-tracker/snapshots',
        async (args, { user }) => {
          const { ingestSnapshot } = await rt();
          const snapshot = await parse(args.snapshot, 'snapshot');
          const history = await parse(args.history, 'history');
          const updates = await parse(args.updates, 'updates');
          return ingestSnapshot({ source: 'manual', sourceRef: `admin ${user.email || user.id}`, snapshot, history: history ?? null, updates: updates ?? null, tokenReleaseKey: null, releaseKey: args.releaseKey || null, commit: args.commit || null });
        }),
      adm('release_tracker_list_snapshots', 'List release tracker snapshots', 'Every recorded snapshot, newest first. Same as GET /api/release-tracker/snapshots.',
        { limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Optional maximum.' } }, [], 'GET /api/release-tracker/snapshots',
        async (args) => ({ snapshots: await (await rt()).listSnapshots(args.limit) }), 'release.read'),
      adm('release_tracker_pull_now', 'Pull release logs now', 'Fetches the committed release-log files from the configured repository now. Same as POST /api/release-tracker/pull.',
        {}, [], 'POST /api/release-tracker/pull', async () => (await rt()).pullFromRepo({ source: 'pull' })),
      adm('release_tracker_get_settings', 'Read release tracker settings', 'Repository, branch, interval and access settings. Same as GET /api/release-tracker/settings.',
        {}, [], 'GET /api/release-tracker/settings',
        async () => { const m = await rt(); return { settings: await m.loadSettings(), liveViewers: m.streamClientCount() }; }, 'release.read'),
      adm('release_tracker_save_settings', 'Save release tracker settings', 'Edits repository, branch, interval, member access and the share-link switch. Same as PUT /api/release-tracker/settings.',
        { settings: rlObj('The settings object the Settings tab sends.') }, ['settings'], 'PUT /api/release-tracker/settings',
        async (args) => ({ settings: await (await rt()).saveSettings(args.settings) })),
      adm('release_tracker_create_token', 'Create a tracker token', 'Creates an ingest or share token (plaintext returned once). A share token publishes the tracker to anyone with the link, so it runs the finalization gate first. Same as POST /api/release-tracker/tokens.',
        { kind: { type: 'string', enum: ['ingest', 'share'], description: 'Token kind.' }, releaseKey: str('Release key (required for an ingest token).', { maxLength: 120 }), label: str('Optional label.', { maxLength: 120 }) }, ['kind'],
        'POST /api/release-tracker/tokens',
        async (args, { user }) => {
          if (args.kind === 'share') { const { assertReadyToFinalize } = await import('./finalizationGates.js'); await assertReadyToFinalize(user.id); }
          return (await rt()).createToken({ kind: args.kind, releaseKey: args.releaseKey, label: args.label, actor: user });
        }),
      adm('release_tracker_list_ingest_log', 'Read the release tracker ingest log', 'Recent ingest attempts (stored, duplicate, refused), newest first. Same as GET /api/release-tracker/ingest-log.',
        { limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Optional maximum.' } }, [], 'GET /api/release-tracker/ingest-log',
        async (args) => ({ log: await (await rt()).listIngestLog(args.limit) }), 'release.read'),
      adm('release_tracker_webhook_secret', 'Generate or clear the tracker webhook secret', 'Generates a new repository webhook secret (returned once) or, with clear true, removes it. Same as POST /api/release-tracker/settings/webhook-secret.',
        { clear: { type: 'boolean', description: 'True to remove the secret instead of generating one.' } }, [], 'POST /api/release-tracker/settings/webhook-secret',
        async (args) => { const m = await rt(); if (args.clear) { await m.setWebhookSecret(null); return { cleared: true }; } return { secret: await m.generateWebhookSecret() }; }),
      adm('release_tracker_revoke_token', 'Revoke a tracker token', 'Revokes an ingest or share token. Same as DELETE /api/release-tracker/tokens/:id.',
        { tokenId: id('The token id.') }, ['tokenId'], 'DELETE /api/release-tracker/tokens/:id',
        async (args, { user }) => (await rt()).revokeToken(Number(args.tokenId), user)),
    ];
  })(),
  riTool('release_create', 'Create a release record', 'Creates a release record. Same body as POST /api/release-intelligence/releases.',
    schema({ release: rlObj('The release fields the Release Intelligence screen sends.') }, ['release']), RI, 'POST /api/release-intelligence/releases',
    async (args, { user }) => (await riLib()).createRelease(args.release || {}, rlActor(user))),
  riTool('release_feature_add', 'Add a feature to a release', 'Adds a manual feature to a release record.',
    schema({ releaseId: id('The release id.'), feature: rlObj('The feature fields (same body as POST /api/release-intelligence/releases/:id/features).') }, ['releaseId', 'feature']), RI, 'POST /api/release-intelligence/releases/:id/features',
    async (args, { user }) => (await riLib()).addManualFeature(args.releaseId, args.feature || {}, rlActor(user))),
  riTool('release_approve', 'Approve a release', 'Finalizes the reconciliation of a release. Runs the finalization gate first and is refused with 409 while a gate is open.',
    schema({ releaseId: id('The release id.'), note: str('Approval note.', { maxLength: 2000 }) }, ['releaseId']), RI, 'POST /api/release-intelligence/releases/:id/approve',
    async (args, { user }) => {
      const { assertReadyToFinalize } = await import('./finalizationGates.js');
      await assertReadyToFinalize(user.id);
      return (await riLib()).approveRelease(args.releaseId, args.note, rlActor(user));
    }),
  riTool('release_reopen', 'Reopen a release', 'Reopens an approved release record.',
    schema({ releaseId: id('The release id.'), note: str('Why.', { maxLength: 2000 }) }, ['releaseId']), RI, 'POST /api/release-intelligence/releases/:id/reopen',
    async (args, { user }) => (await riLib()).reopenRelease(args.releaseId, args.note, rlActor(user))),
  riTool('release_failed_runs_list', 'List failed runs', 'Lists failed, refused, partial or interrupted runs, optionally filtered (same query as GET /api/release-intelligence/failed-runs).',
    schema({ filter: rlObj('Optional filter fields, as the query string of the route.') }), 'release.read', 'GET /api/release-intelligence/failed-runs',
    async (args) => ({ runs: await (await riLib()).listFailedRuns(args.filter || {}) })),
  riTool('release_failed_run_record', 'Record a failed run', 'Records a failed run by hand.',
    schema({ run: rlObj('The failed-run fields (same body as POST /api/release-intelligence/failed-runs).') }, ['run']), RI, 'POST /api/release-intelligence/failed-runs',
    async (args, { user }) => ({ id: await (await riLib()).addManualFailedRun(args.run || {}, rlActor(user)) })),
  riTool('release_failed_run_dispose', 'Dispose a failed run', 'Sets a reviewer disposition (with a note) on a failed run.',
    schema({ runId: id('The failed run id.'), disposition: rlObj('The disposition fields (same body as PUT /api/release-intelligence/failed-runs/:id/disposition).') }, ['runId', 'disposition']), RI, 'PUT /api/release-intelligence/failed-runs/:id/disposition',
    async (args, { user }) => (await riLib()).setDisposition(args.runId, args.disposition || {}, rlActor(user))),
  riTool('release_outputs_list', 'List outputs and their release links', 'Lists outputs with the release each is linked to.',
    schema({}), 'release.read', 'GET /api/release-intelligence/outputs',
    async () => ({ outputs: await (await riLib()).listOutputs() })),
  riTool('release_output_link', 'Link an output to a release', 'Links an output to a release, or unlinks it with a null releaseId.',
    schema({ outputId: id('The output id.'), releaseId: { type: ['integer', 'null'], minimum: 1, description: 'The release id, or null to unlink.' } }, ['outputId']), RI, 'PUT /api/release-intelligence/outputs/:id/release',
    async (args, { user }) => ({ outputs: await (await riLib()).linkOutput(args.outputId, args.releaseId || null, rlActor(user)) })),
  riTool('release_trends_read', 'Read contribution trends', 'Returns the token, time and contribution trends.',
    schema({}), 'release.read', 'GET /api/release-intelligence/trends',
    async () => (await riLib()).getTrends()),
  riTool('release_import_document', 'Import a release document', 'Files one release-loop document (path and text) and attributes orphaned records.',
    schema({ path: str('The document path.', { maxLength: 500 }), content: str('The document text.') }, ['path', 'content']), RI, 'POST /api/release-intelligence/import/document',
    async (args, { user }) => {
      if (!args.path || typeof args.content !== 'string' || !args.content.trim()) throw riBad('Give the document path and its text');
      const imp = await riImp();
      const result = await imp.importDocument(args.path, args.content, { actor: rlActor(user) });
      return { ...result, attributed: await imp.attributeOrphans() };
    }),
  riTool('release_import_snapshot', 'Import a tracker snapshot', 'Files a release tracker snapshot (an object or a JSON string) under a release key.',
    schema({ releaseKey: str('The release key.', { maxLength: 200 }), snapshot: { description: 'The snapshot, as an object or a JSON string.', type: ['object', 'string'] } }, ['releaseKey', 'snapshot']), RI, 'POST /api/release-intelligence/import/snapshot',
    async (args, { user }) => {
      let snap = args.snapshot;
      if (typeof snap === 'string') { try { snap = JSON.parse(snap); } catch (e) { throw riBad(jsonProblemMessage('snapshot', e)); } }
      const imp = await riImp();
      const result = await imp.importSnapshot(String(args.releaseKey || '').trim(), snap, { actor: rlActor(user) });
      return { ...result, attributed: await imp.attributeOrphans() };
    }),
  riTool('release_import_repository', 'Import release logs from the repository', 'Files the release-loop logs found under the server\'s own repository checkout. Takes no path.',
    schema({}), RI, 'POST /api/release-intelligence/import/repository',
    async (_args, { user }) => (await riImp()).importRepository((await import('node:path')).resolve(process.cwd()), { actor: rlActor(user) })),
  riTool('release_config_read', 'Read the tracker rules', 'Returns the effective rules, the defaults and whether an override is stored.',
    schema({}), 'release.read', 'GET /api/release-intelligence/config',
    async () => { const c = await riCfg(); const { rules, overrideError, overridden } = await c.loadRules(); return { rules, defaults: c.DEFAULT_RULES, overrideError, overridden }; }),
  riTool('release_config_save', 'Save the tracker rules', 'Saves the complete rules; invalid rules are refused with the problems listed.',
    schema({ rules: rlObj('The complete rules, as returned by release_config_read.') }, ['rules']), RI, 'PUT /api/release-intelligence/config',
    async (args) => ({ rules: await (await riCfg()).saveRules(args.rules) })),
  riTool('release_config_reset', 'Reset the tracker rules', 'Removes the stored override so the shipped defaults apply.',
    schema({}), RI, 'DELETE /api/release-intelligence/config',
    async () => { await (await riCfg()).resetRules(); return { ok: true }; }),
  smTool('session_mapping_config', 'Read the session mapping rules', 'Returns the effective rules (prices, thresholds, target files), the shipped defaults and whether an override is stored.',
    schema({}), 'sessions.read', 'GET /api/session-mapping/config',
    async () => { const c = await smCfg(); const { rules, overrideError, overridden } = await c.loadRules(); return { rules, defaults: c.DEFAULT_RULES, overrideError, overridden }; }),
  smTool('session_mapping_config_save', 'Save or reset the session mapping rules', 'Saves the complete rules (invalid rules are refused with the problems listed) or, with reset true, removes the stored override. Every session is re-mapped afterwards.',
    schema({ rules: rlObj('The complete rules, as returned by session_mapping_config.'), reset: { type: 'boolean', description: 'Remove the stored override instead of saving.' } }),
    'sessions.write', 'PUT /api/session-mapping/config',
    async (args) => {
      const c = await smCfg(); const l = await smLib();
      if (args.reset) { await c.resetRules(); return { ok: true, remapped: await l.remapAll() }; }
      const rules = await c.saveRules(args.rules);
      return { rules, remapped: await l.remapAll() };
    }),
  smTool('session_mapping_sessions', 'List or read analysed sessions', 'Without sessionId, lists every analysed session with its metrics and open proposal count. With sessionId, returns that session with its proposals. Metrics only; never transcript text.',
    schema({ sessionId: id('Optional analysis id.') }), 'sessions.read', 'GET /api/session-mapping/sessions',
    async (args) => {
      const l = await smLib();
      if (args.sessionId == null) return l.listSessions();
      const d = await l.getSession(args.sessionId);
      if (!d) throw smNotFound('Session');
      return d;
    }),
  smTool('session_mapping_remap', 'Re-map one session', 'Recomputes the mapping proposals of one session against the current rules and returns it.',
    schema({ sessionId: id('The analysis id.') }, ['sessionId']), 'sessions.write', 'POST /api/session-mapping/sessions/:id/remap',
    async (args) => {
      const l = await smLib();
      await l.remapSession(args.sessionId);
      const d = await l.getSession(args.sessionId);
      if (!d) throw smNotFound('Session');
      return d;
    }),
  smTool('session_mapping_trends', 'Read token, spend and time trends', 'Returns observed tokens, inferred time and priced spend trends (a model with no price row is "not priced", never 0).',
    schema({}), 'sessions.read', 'GET /api/session-mapping/trends',
    async () => (await smLib()).getTrends()),
  smTool('session_mapping_proposals', 'List mapping proposals', 'Lists context / prompt / cache / memory mapping proposals, optionally filtered by status or area.',
    schema({ status: str('Optional status filter.', { maxLength: 40 }), area: str('Optional area filter.', { maxLength: 60 }) }), 'sessions.read', 'GET /api/session-mapping/proposals',
    async (args) => ({ proposals: await (await smLib()).listProposals({ status: args.status, area: args.area }) })),
  smTool('session_mapping_proposal_decide', 'Reject or apply a proposal', 'reject records a note; apply marks the proposal applied and runs the finalization gate first (refused 409 tool_category_required while any technology lacks a proficiency category), same as the website.',
    schema({ proposalId: id('The proposal id.'), action: { type: 'string', enum: ['reject', 'apply'] }, note: str('Reviewer note.', { maxLength: 2000 }), appliedOn: str('apply only: date or label it was applied on.', { maxLength: 60 }), ref: str('apply only: commit or reference.', { maxLength: 300 }) }, ['proposalId', 'action']),
    'sessions.write', 'POST /api/session-mapping/proposals/:id/apply',
    async (args, { user }) => {
      const l = await smLib(); const a = rlActor(user);
      if (args.action === 'reject') return { proposal: await l.rejectProposal(args.proposalId, args.note, a) };
      const { assertReadyToFinalize } = await import('./finalizationGates.js');
      await assertReadyToFinalize(user.id);
      return { proposal: await l.applyProposal(args.proposalId, { appliedOn: args.appliedOn, note: args.note, ref: args.ref }, a) };
    }),
  smTool('session_mapping_import', 'Import session metrics', 'kind transcript: analyse pasted transcript lines in memory (text is discarded, metrics kept). kind metrics: file an analysis JSON. kind scan: scan the server\'s transcript folder.',
    schema({ kind: { type: 'string', enum: ['transcript', 'metrics', 'scan'] }, sessionId: str('transcript: any short session name.', { maxLength: 200 }), main: str('transcript: the main session lines.'), subagents: { type: 'array', items: rlObj('{label, text}'), description: 'transcript: optional subagent transcripts.' }, analysis: rlObj('metrics: the analysis JSON.') }, ['kind']),
    'sessions.write', 'POST /api/session-mapping/import/transcript',
    async (args, { user }) => {
      const l = await smLib(); const a = rlActor(user);
      if (args.kind === 'scan') return l.scanTranscripts({ actor: a });
      if (args.kind === 'metrics') return l.importMetricsJson(args.analysis, { actor: a });
      return l.importTranscriptText({ sessionId: args.sessionId, main: args.main, subagents: args.subagents }, { actor: a });
    }),
  smTool('session_mapping_failures', 'List capture failures', 'Lists sessions whose capture failed, with any reviewer disposition.',
    schema({}), 'sessions.read', 'GET /api/session-mapping/failures',
    async () => ({ failures: await (await smLib()).listCaptureFailures() })),
  smTool('session_mapping_failure_dispose', 'Dispose a capture failure', 'Sets a reviewer disposition (with a note) on a capture failure.',
    schema({ failureId: id('The failure id.'), disposition: str('The disposition key.', { maxLength: 60 }), note: str('Why.', { maxLength: 2000 }) }, ['failureId', 'disposition']),
    'sessions.write', 'PUT /api/session-mapping/failures/:id/disposition',
    async (args, { user }) => ({ failure: await (await smLib()).setCaptureFailureDisposition(args.failureId, { disposition: args.disposition, note: args.note }, rlActor(user)) })),
  rlTool('release_loop_get_definition', 'Read the release loop definition', 'Returns the effective definition (roles, stages, gates), its version history and the platform agents.',
    schema({}), 'release.loop.read', 'GET /api/release-loop/definition',
    async () => (await rlLoop()).getDefinitionView()),
  rlTool('release_loop_save_definition', 'Save the release loop definition', 'Saves a complete definition as the next version (the server picks the number). A change note is required; a definition the gates cannot use is refused with the problems listed. With reset true, restores the shipped definition instead.',
    schema({ definition: rlObj('The complete definition, as returned by release_loop_get_definition.'), note: str('What changed and why.', { minLength: 1, maxLength: 500 }), reset: { type: 'boolean' } }, ['note']),
    'release.loop.write', 'PUT /api/release-loop/definition',
    async (args, { user }) => {
      const def = await rlDef();
      if (args.reset) await def.resetDefinition(args.note, rlActor(user));
      else await def.saveDefinition(args.definition, args.note, rlActor(user));
      return (await rlLoop()).getDefinitionView();
    }),
  rlTool('release_loop_list_runs', 'List release loop runs', 'Lists every run with its stage, status, rounds and open bugs.',
    schema({}), 'release.loop.read', 'GET /api/release-loop/runs',
    async () => ({ runs: await (await rlLoop()).listRuns() })),
  rlTool('release_loop_start_run', 'Start a release loop run', 'Starts a run for one feature of one release.',
    schema({ releaseKey: str('Starts with a date, YYYY-MM-DD.', { maxLength: 120 }), featureKey: str('The feature key.', { maxLength: 120 }), name: str('Display name.', { maxLength: 200 }), date: str('Optional date.', { maxLength: 40 }) }, ['releaseKey', 'featureKey']),
    'release.loop.write', 'POST /api/release-loop/runs',
    async (args, { user }) => (await rlLoop()).createRun(args, rlActor(user))),
  rlTool('release_loop_get_run', 'Read one release loop run', 'Returns a run with its rounds, steps, bugs, reconciliation items, gate state and allowed next stages.',
    schema({ runId: id('The run id.') }, ['runId']), 'release.loop.read', 'GET /api/release-loop/runs/:id',
    async (args) => (await rlLoop()).getRunDetail(args.runId)),
  rlTool('release_loop_transition_run', 'Move a run to another stage', 'Moves a run along an allowed edge. Moving to done runs the finalization gate and is refused with 409 while a gate is open.',
    schema({ runId: id('The run id.'), to: str('The target stage key.', { maxLength: 60 }), note: str('Why.', { maxLength: 500 }) }, ['runId', 'to']),
    'release.loop.write', 'POST /api/release-loop/runs/:id/transition',
    async (args, { user }) => (await rlLoop()).transitionRun(args.runId, args.to, { note: args.note, actor: rlActor(user), userId: user.id })),
  rlTool('release_loop_record_round', 'Record a validation round', 'Records the outcome of a validation round for a run.',
    schema({ runId: id('The run id.'), round: rlObj('The round fields the Runs screen sends (same body as POST /api/release-loop/runs/:id/rounds).') }, ['runId', 'round']),
    'release.loop.write', 'POST /api/release-loop/runs/:id/rounds',
    async (args, { user }) => (await rlLoop()).recordRound(args.runId, args.round, rlActor(user))),
  rlTool('release_loop_log_step', 'Log a live validation step', 'Appends one validation step (pass, fail, ambiguous, info, page_error, failed_request) to a run.',
    schema({ runId: id('The run id.'), step: rlObj('The step fields (same body as POST /api/release-loop/runs/:id/steps).') }, ['runId', 'step']),
    'release.loop.write', 'POST /api/release-loop/runs/:id/steps',
    async (args) => (await rlLoop()).addStep(args.runId, args.step)),
  rlTool('release_loop_add_bug', 'Add a triaged bug', 'Creates a bug on a run from triage. A needs_business_definition item must carry the exact question for the owner.',
    schema({ runId: id('The run id.'), title: str('Bug title.', { maxLength: 300 }), triageClass: str('A triage class key.', { maxLength: 60 }), stepId: str('Spec step id.', { maxLength: 40 }), observed: str('What was seen.', { maxLength: 2000 }), question: str('Required for needs_business_definition.', { maxLength: 2000 }) }, ['runId', 'title', 'triageClass']),
    'release.loop.write', 'POST /api/release-loop/runs/:id/bugs',
    async (args, { user }) => { const { runId, ...body } = args; return (await rlLoop()).createBug(runId, body, rlActor(user)); }),
  rlTool('release_loop_bug_action', 'Act on a bug', 'One bug lifecycle action: start_fix, fix, retest, scope, answer or decision. Same checks as the Runs screen.',
    schema({ bugId: id('The bug id.'), action: { type: 'string', enum: ['start_fix', 'fix', 'retest', 'scope', 'answer', 'decision'] }, input: rlObj('The action body (same fields as POST /api/release-loop/bugs/:id/<action>).') }, ['bugId', 'action']),
    'release.loop.write', 'POST /api/release-loop/bugs/:id/fix',
    async (args, { user }) => {
      const l = await rlLoop(); const a = rlActor(user); const body = args.input || {};
      switch (args.action) {
        case 'start_fix': return l.startFix(args.bugId, a);
        case 'fix': return l.recordFix(args.bugId, body, a);
        case 'retest': return l.retestBug(args.bugId, body, a);
        case 'scope': return l.scopeBug(args.bugId, body, a);
        case 'answer': return l.answerBusinessQuestion(args.bugId, body, a);
        default: return l.decideNeedsHuman(args.bugId, body, a);
      }
    }),
  rlTool('release_loop_add_reconciliation', 'Add a reconciliation item', 'Adds a reconciliation item to a run.',
    schema({ runId: id('The run id.'), item: rlObj('The item fields (same body as POST /api/release-loop/runs/:id/reconciliation).') }, ['runId', 'item']),
    'release.loop.write', 'POST /api/release-loop/runs/:id/reconciliation',
    async (args, { user }) => (await rlLoop()).addReconciliationItem(args.runId, args.item, rlActor(user))),
  rlTool('release_loop_resolve_reconciliation', 'Resolve a reconciliation item', 'Resolves one reconciliation item.',
    schema({ runId: id('The run id.'), itemId: id('The item id.'), resolution: rlObj('The resolution fields (same body as PUT /api/release-loop/runs/:id/reconciliation/:itemId).') }, ['runId', 'itemId', 'resolution']),
    'release.loop.write', 'PUT /api/release-loop/runs/:id/reconciliation/:itemId',
    async (args, { user }) => (await rlLoop()).resolveReconciliationItem(args.runId, args.itemId, args.resolution, rlActor(user))),
  rlTool('release_loop_list_escalations', 'List escalations', 'Lists bugs escalated to a person, with the maximum fix attempts per bug.',
    schema({}), 'release.loop.read', 'GET /api/release-loop/escalations',
    async () => ({ escalations: await (await rlLoop()).listEscalations(), maxFixAttemptsPerBug: (await (await rlDef()).getEffectiveDefinition()).definition.bugEscalation.maxFixAttemptsPerBug })),
  // ── Release cut + session plans (docs/changes/release-cut-and-session-plans.md): same functions as server/routes/releaseCut.js ──
  rlTool('release_cut_list_releases', 'List releases', 'Lists every release (frozen ones and the open one) with planned, delivered and carried feature counts and the number of session plans.',
    schema({}), 'release.loop.read', 'GET /api/release-cut/releases',
    async () => (await rcLib()).listReleases()),
  rlTool('release_cut_get_release', 'Read one release', 'Returns a frozen release exactly as it was cut (features with last score and baseline, bug counts, sessions) or the open release as it stands now.',
    schema({ version: str('The release version, for example 0.2.0.', { minLength: 1, maxLength: 40 }) }, ['version']),
    'release.loop.read', 'GET /api/release-cut/releases/:version',
    async (args) => (await rcLib()).getRelease(args.version)),
  rlTool('release_cut_list_sessions', 'List session plans', 'Lists the session estimates of a release (the open release when none is given) with their merges.',
    schema({ release: str('Optional release version.', { maxLength: 40 }), session: str('Optional: return only this session id.', { maxLength: 120 }) }),
    'release.loop.read', 'GET /api/release-cut/sessions[/:session]',
    async (args) => { const l = await rcLib(); return args.session ? { session: l.getSessionPlan(args.session) } : { release: args.release || l.activeDefs().version, sessions: l.listSessionPlans({ release: args.release }) }; }),
  rlTool('release_cut_session_report', 'Expected versus actual per session', 'One row per estimated item: expected score, the score at the latest merge (null when not validated, never 0) and whether it was met.',
    schema({ release: str('Optional release version.', { maxLength: 40 }) }),
    'release.loop.read', 'GET /api/release-cut/sessions/report',
    async (args) => (await rcLib()).sessionReport({ release: args.release })),
  rlTool('release_cut_record_estimate', 'Record a session estimate', 'Records what a session expects to deliver before it starts. An estimate is fixed once a merge is recorded; changing it then needs a reestimate reason and keeps the original.',
    schema({ session: str('Session id.', { minLength: 1, maxLength: 120 }), intent: str('One line on what the session is for.', { maxLength: 500 }), items: { type: 'array', minItems: 1, items: rlObj('{feature, goal, expect like "30/32", size S|M|L}') }, reestimate: str('Reason, required when a merge is already recorded.', { maxLength: 500 }) }, ['session', 'items']),
    'release.loop.write', 'POST /api/release-cut/sessions/estimate',
    async (args) => (await rcLib()).recordEstimate(args)),
  rlTool('release_cut_record_merge', 'Record a merge against a session estimate', 'Reads each feature\'s latest validated round (never filled in by hand) and files it against the session. No feature given means every feature in the estimate.',
    schema({ session: str('Session id.', { minLength: 1, maxLength: 120 }), commit: str('Merged commit; defaults to the repository head.', { maxLength: 80 }), features: { type: 'array', items: { type: 'string' } }, ifNew: { type: 'boolean', description: 'Record only when a feature has a new validated round.' } }, ['session']),
    'release.loop.write', 'POST /api/release-cut/sessions/:session/merge',
    async (args) => (await rcLib()).recordMerge(args)),
  rlTool('release_cut_close_session', 'Close a session', 'Seals the session\'s estimate-versus-result record. A finalize path: runs the finalization gate first (refused 409 tool_category_required while any technology lacks a proficiency category), same as the website.',
    schema({ session: str('Session id.', { minLength: 1, maxLength: 120 }), note: str('What happened.', { maxLength: 1000 }) }, ['session']),
    'release.loop.write', 'POST /api/release-cut/sessions/:session/close',
    async (args, { user }) => {
      const { assertReadyToFinalize } = await import('./finalizationGates.js');
      await assertReadyToFinalize(user.id);
      return (await rcLib()).closeSession(args);
    }),
  // ── Platform agent runner (docs/changes/platform-agent-runner.md): same functions as server/routes/agentRunner.js ──
  arTool('agent_runner_overview', 'Agent runner overview', 'Returns worker status, run counts, proposals and scope requests waiting for a person, observed usage and the fixture scenarios.',
    schema({}), 'agent.runner.read', 'GET /api/agent-runner/overview', async () => (await arLib()).overview()),
  arTool('agent_runner_settings', 'Read or save agent runner settings', 'Without "settings": returns the settings (size limits S/M/L, turn limit, concurrency, stalled-after seconds, model, shared modules, extra forbidden paths; secrets are only ever reported as set or not set). With "settings": saves them. The GitHub token and worker token are managed on the website only.',
    schema({ settings: rlObj('Fields to change, same body as PUT /api/agent-runner/settings.') }), 'agent.runner.write', 'GET|PUT /api/agent-runner/settings',
    async (args, { user }) => { const l = await arLib(); return args.settings ? l.saveSettings(args.settings, rlActor(user)) : l.settingsView(); }),
  arTool('agent_runner_list_agents', 'List the agent roster', 'Lists the quality agents and the release loop stage agents with what you can ask each one, what it writes, how it is governed and the version of its prompt file.',
    schema({ agentKey: str('Optional: return this agent\'s full prompt text and version instead of the roster.', { maxLength: 80 }) }), 'agent.runner.read', 'GET /api/agent-runner/agents[/:key/prompt]',
    async (args) => { const l = await arLib(); return args.agentKey ? l.getAgentPrompt(args.agentKey) : { agents: await l.listAgents() }; }),
  arTool('agent_runner_start_run', 'Prompt an agent (start a run)', 'Queues a run for one agent. Quality agents take a prompt plus params (feature, suite, loopRunId, changedFiles, seedId); stage agents take loopRunId (and a work order or bugKeys for the fixer, a branch for the integrator). Nothing runs until a worker claims it.',
    schema({ agentKey: str('An agent key from agent_runner_list_agents.', { maxLength: 80 }), prompt: str('Your request, in your own words.', { maxLength: 8000 }), params: rlObj('Structured inputs (feature, suite, loopRunId, changedFiles, seedId).'), loopRunId: id('Release-loop run id, for stage agents.'), bugKeys: { type: 'array', items: { type: 'string' }, description: 'Fixer: bugs whose work orders become this run\'s work order.' }, workOrder: rlObj('Fixer/integrator: the work order (items with key, intent, files, size, doneWhen).'), branch: str('Branch, for the integrator.', { maxLength: 120 }), fixtureScenario: str('Fixture scenario key (test environments).', { maxLength: 80 }) }, ['agentKey']),
    'agent.runner.write', 'POST /api/agent-runner/runs', async (args, { user }) => (await arLib()).createRun(args, rlActor(user))),
  arTool('agent_runner_list_runs', 'List agent runs', 'Lists runs, newest first, optionally filtered by status, release-loop run or agent.',
    schema({ status: str('queued, running, succeeded, failed, scope_exceeded or stopped.', { maxLength: 30 }), loopRunId: id('Release-loop run id.'), agentKey: str('Agent key.', { maxLength: 80 }) }),
    'agent.runner.read', 'GET /api/agent-runner/runs', async (args) => ({ runs: await (await arLib()).listRuns(args) })),
  arTool('agent_runner_get_run', 'Read one agent run', 'Returns a run with its timeline, work order, scope requests, result, diff check and the proposals it produced.',
    schema({ runId: id('The agent run id.') }, ['runId']), 'agent.runner.read', 'GET /api/agent-runner/runs/:id', async (args) => (await arLib()).getRun(args.runId)),
  arTool('agent_runner_run_action', 'Stop, requeue or retry a run', 'stop interrupts a queued or running run and records who stopped it; requeue puts a stalled run back on the queue; retry starts a new run with the same inputs and the current work order.',
    schema({ runId: id('The agent run id.'), action: { type: 'string', enum: ['stop', 'requeue', 'retry'] }, fixtureScenario: str('Retry only, test environments: replay this recorded scenario instead of the original.', { maxLength: 80 }) }, ['runId', 'action']),
    'agent.runner.write', 'POST /api/agent-runner/runs/:id/(stop|requeue|retry)',
    async (args, { user }) => { const l = await arLib(); const a = rlActor(user); return args.action === 'stop' ? l.stopRun(args.runId, a) : args.action === 'requeue' ? l.requeueRun(args.runId, a) : l.retryRun(args.runId, a, { fixtureScenario: args.fixtureScenario }); }),
  arTool('agent_runner_scope_decision', 'Decide a scope request', 'Approves or declines an agent\'s request to edit a file outside its work order. Approving widens the work order, is recorded with your note and runs the finalization gate.',
    schema({ runId: id('The agent run id.'), requestId: str('The scope request id, for example S1.', { maxLength: 20 }), decision: { type: 'string', enum: ['approve', 'decline'] }, note: str('Why.', { minLength: 1, maxLength: 500 }) }, ['runId', 'requestId', 'decision', 'note']),
    'agent.runner.write', 'POST /api/agent-runner/runs/:id/scope-requests/:rid/decision',
    async (args, { user }) => (await arLib()).decideScopeRequest(args.runId, args.requestId, { decision: args.decision, note: args.note }, rlActor(user), user.id)),
  arTool('agent_runner_outputs', 'List or read agent outputs', 'Without outputId: lists the governed objects agents produced (draft specs, results, amendment proposals, bugs, test plans, enhancement proposals, shaped seeds), optionally by kind or status. With outputId: one output with its payload.',
    schema({ outputId: id('Optional output id.'), kind: str('Optional kind.', { maxLength: 40 }), status: str('Optional status.', { maxLength: 30 }), amendment: { type: 'boolean', description: 'With outputId on an amendment proposal: return the docs/spec-amendments file shape instead.' } }),
    'agent.runner.read', 'GET /api/agent-runner/outputs[/:id[/amendment]]',
    async (args) => { const l = await arLib(); return args.outputId ? (args.amendment ? l.exportAmendment(args.outputId) : l.getOutput(args.outputId)) : { outputs: await l.listOutputs({ kind: args.kind, status: args.status }) }; }),
  arTool('agent_runner_decide_output', 'Decide an agent proposal', 'Approve/reject a draft spec or amendment proposal, accept/decline an enhancement proposal (accepting files a backlog seed). A note is required; approving and accepting run the finalization gate.',
    schema({ outputId: id('The output id.'), decision: { type: 'string', enum: ['approve', 'reject', 'accept', 'decline'] }, note: str('Why.', { minLength: 1, maxLength: 500 }) }, ['outputId', 'decision', 'note']),
    'agent.runner.write', 'POST /api/agent-runner/outputs/:id/decision',
    async (args, { user }) => (await arLib()).decideOutput(args.outputId, { decision: args.decision, note: args.note }, rlActor(user), user.id)),
  arTool('agent_runner_test_plan', 'Plan smoke and regression tests', 'Given the changed files, returns every feature\'s smoke suite plus the regression baselines of features whose files or shared modules changed, with the reason for each.',
    schema({ changedFiles: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Repository-relative paths.' } }, ['changedFiles']),
    'agent.runner.read', 'POST /api/agent-runner/test-plan', async (args) => (await arLib()).planTests(args.changedFiles)),
  arTool('agent_runner_baselines', 'List frozen baselines and smoke suites', 'Lists features that have a frozen baseline, the latest version and the size and source of their smoke suite.',
    schema({}), 'agent.runner.read', 'GET /api/agent-runner/baselines', async () => ({ baselines: await (await arLib()).listBaselines() })),
  arTool('agent_runner_seeds', 'Backlog seeds', 'action list (optionally by stage), get, create (title + words), answer (seedId, index, answer) or move (seedId, to: shaped|ready|promoted, note). Promotion is a finalize path (gate) and builds nothing.',
    schema({ action: { type: 'string', enum: ['list', 'get', 'create', 'answer', 'move'] }, seedId: id('Seed id.'), stage: str('Stage filter for list.', { maxLength: 20 }), title: str('Seed title.', { maxLength: 160 }), words: str('The idea in your own words.', { maxLength: 4000 }), index: { type: 'integer', minimum: 0 }, answer: str('Your answer.', { maxLength: 4000 }), to: str('Target stage.', { maxLength: 20 }), note: str('Note.', { maxLength: 500 }) }, ['action']),
    'agent.runner.write', 'GET|POST /api/agent-runner/seeds[...]',
    async (args, { user }) => {
      const s = (await arLib()).seeds; const a = rlActor(user);
      switch (args.action) {
        case 'list': return { seeds: await s.listSeeds({ stage: args.stage }) };
        case 'get': return s.getSeed(args.seedId);
        case 'create': return s.createSeed({ title: args.title, words: args.words }, a);
        case 'answer': return s.answerQuestion(args.seedId, args.index, args.answer, a);
        default: return s.moveSeed(args.seedId, args.to, { note: args.note, actor: a, userId: user.id });
      }
    }),
];

/** Production smoke account tools: same functions and error statuses as server/routes/productionSmoke.js. No password passes through an agent session. */
const psLib = () => import('./smokeAccount.js');
const PS_TOOLS = [
  rlTool('production_smoke_account_status', 'Production smoke test account status', 'Reports whether the fictional production smoke test account exists and is ready (terms current, no forced password change, starter profile), plus the GitHub secret names the owner must add. Never returns a password.',
    schema({}), 'smoke.read', 'GET /api/production-smoke/account',
    async () => (await psLib()).getSmokeAccountStatus()),
  rlTool('production_smoke_account_ready', 'Ready the production smoke test account', 'Re-readies the EXISTING fictional smoke test account (clears a forced password change, records current platform and Career Portfolio terms, restores the starter profile). It does not set or change a password and cannot create the account: creation needs a password, which is entered on the website or by the provisioning workflow, never passed through an agent session.',
    schema({}), 'smoke.write', 'POST /api/production-smoke/account',
    async () => (await psLib()).readySmokeAccount({})),
];

// Tools that run an existing website route's own handler in-process (see mcpRouteTools.js), appended after the
// core tools. Append-only like everything above.
export const MCP_TOOLS = Object.freeze([...CORE_TOOLS, ...ROUTE_TOOLS, ...RB_TOOLS, ...DM_TOOLS, ...PS_TOOLS, ...FLOW_STUDIO_TOOLS]);

export const MCP_TOOL_NAMES = Object.freeze(MCP_TOOLS.map((t) => t.name));

export function getMcpTool(name) {
  return MCP_TOOLS.find((t) => t.name === name) || null;
}

/** The public description of a tool (what tools/list and the Connected agents screen show). */
export function describeTool(t) {
  return { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, scope: t.scope, permission: t.permission, api: t.api };
}
