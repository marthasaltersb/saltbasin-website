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
});

const id = (description) => ({ type: 'integer', minimum: 1, description });
const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });

export const MCP_TOOLS = Object.freeze([
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
]);

export const MCP_TOOL_NAMES = Object.freeze(MCP_TOOLS.map((t) => t.name));

export function getMcpTool(name) {
  return MCP_TOOLS.find((t) => t.name === name) || null;
}

/** The public description of a tool (what tools/list and the Connected agents screen show). */
export function describeTool(t) {
  return { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, scope: t.scope, permission: t.permission, api: t.api };
}
