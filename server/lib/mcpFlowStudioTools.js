// Journey flow studio MCP tools (2026-10-10). Same functions, permission policy and error statuses as
// server/routes/flowStudio.js: every handler calls an export of flowStudio.js with the acting user, and the studio
// definition's access policy (create / publish / shareTemplate / editDefinition) is enforced inside those functions.
// `permission: 'user'` is the registry-level check (any signed-in user); role-based provisioning is the policy.
const lib = () => import('./flowStudio.js');
const id = (description) => ({ type: 'integer', minimum: 1, description });
const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const obj = (description) => ({ type: 'object', description, additionalProperties: true });
const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const T = (name, title, description, inputSchema, scope, api, handler) => ({ name, title, description, inputSchema, scope, permission: 'user', api, handler });
const FSA = '/api/flow-studio';

const fj = () => import('./flowJourney.js');
export const FLOW_STUDIO_TOOLS = [
  T('flow_studio_definition_read', 'Read the flow studio definition', 'Returns the versioned definition that drives the studio: shape types and colours, execution modes, field sections and fields, validation rules and the access policy.',
    schema({}), 'flows.read', `GET ${FSA}/definition`, async () => (await lib()).getDefinition()),
  T('flow_studio_definition_save', 'Change the flow studio definition', 'Saves a new version of the definition (the role must be allowed by the access policy). A change that affects saved flows returns the impact and needs the same call again with the approval token.',
    schema({ definition: obj('The full definition.'), note: str('Why it changed.', { maxLength: 300 }), approved: str('Impact token from the previous refusal.') }, ['definition', 'note']), 'flows.write', `PUT ${FSA}/definition`,
    async (a, { user }) => (await lib()).saveDefinition(user, a.definition, { note: a.note, approved: a.approved })),
  T('flow_studio_flows_list', 'List flows and templates', 'Lists your flows (administrators see all) and the templates you can use: seed, organization and platform templates.',
    schema({}), 'flows.read', `GET ${FSA}/flows`, async (_a, { user }) => (await lib()).listFlows(user)),
  T('flow_studio_flow_create', 'Create a flow', 'Creates a flow: blank, from a seed template key, or from a template id.',
    schema({ name: str('Flow name.', { maxLength: 120 }), templateKey: str('Seed template key.'), templateId: id('Template id.') }), 'flows.write', `POST ${FSA}/flows`,
    async (a, { user }) => (await lib()).createFlow(user, { ...a, sourceAction: 'mcp' })),
  T('flow_studio_flow_read', 'Read a flow', 'Returns the flow document (Current and Future state), its definition and its validation findings.',
    schema({ flowId: id('Flow id.') }, ['flowId']), 'flows.read', `GET ${FSA}/flows/:id`, async (a, { user }) => (await lib()).getFlow(user, a.flowId)),
  T('flow_studio_flow_save', 'Save a flow draft', 'Saves the flow document as the next draft version (history records the source action).',
    schema({ flowId: id('Flow id.'), doc: obj('The flow document.'), baseVersion: { type: 'integer', description: 'Version you edited from; a newer saved version is refused.' }, note: str('Optional note.', { maxLength: 300 }) }, ['flowId', 'doc']), 'flows.write', `PUT ${FSA}/flows/:id`,
    async (a, { user }) => (await lib()).saveDraft(user, a.flowId, { doc: a.doc, baseVersion: a.baseVersion, note: a.note, sourceAction: 'mcp' })),
  T('flow_studio_flow_validate', 'Validate a flow', 'Runs the structural checks (orphans, single-branch decisions, unreachable steps and the rest of the configured rules).',
    schema({ flowId: id('Flow id.'), doc: obj('Optional unsaved document to check instead of the saved draft.') }, ['flowId']), 'flows.read', `POST ${FSA}/flows/:id/validate`,
    async (a, { user }) => (await lib()).validateOnly(user, a.flowId, a.doc)),
  T('flow_studio_flow_history', 'Read a flow history', 'Every saved version, publish, restore and import, each with its source action and actor.',
    schema({ flowId: id('Flow id.') }, ['flowId']), 'flows.read', `GET ${FSA}/flows/:id/history`, async (a, { user }) => (await lib()).history(user, a.flowId)),
  T('flow_studio_flow_restore', 'Restore an earlier version', 'Saves an earlier version as the next draft version.',
    schema({ flowId: id('Flow id.'), version: id('Version number to restore.') }, ['flowId', 'version']), 'flows.write', `POST ${FSA}/flows/:id/restore`,
    async (a, { user }) => (await lib()).restoreVersion(user, a.flowId, a.version)),
  T('flow_studio_publish_preview', 'Preview the impact of publishing', 'Returns what publishing changes, the validation findings, and the approval token.',
    schema({ flowId: id('Flow id.') }, ['flowId']), 'flows.read', `GET ${FSA}/flows/:id/publish-preview`, async (a, { user }) => (await lib()).publishPreview(user, a.flowId)),
  T('flow_studio_flow_publish', 'Publish a flow', 'Publishes the draft as the journey definition. Needs the approval token from the preview and runs the finalization gate, same as the website.',
    schema({ flowId: id('Flow id.'), approved: str('Token from the preview.'), note: str('Optional note.', { maxLength: 300 }) }, ['flowId', 'approved']), 'flows.publish', `POST ${FSA}/flows/:id/publish`,
    async (a, { user }) => { const { assertReadyToFinalize } = await import('./finalizationGates.js'); await assertReadyToFinalize(user.id); return (await lib()).publish(user, a.flowId, { approved: a.approved, note: a.note }); }),
  T('flow_studio_flow_export', 'Export a flow or template', 'Returns the flow as json, as a single self-contained html viewer, or as a journey definition (gates, variants, actors, authority, experience bindings).',
    schema({ flowId: id('Flow id (or template id).'), format: { type: 'string', enum: ['json', 'html', 'journey'] }, state: { type: 'string', enum: ['current', 'future'] } }, ['flowId']), 'flows.read', `GET ${FSA}/flows/:id/export`,
    async (a, { user }) => (await lib()).exportFlow(user, a.flowId, a.format || 'json', { state: a.state || 'future' })),
  T('flow_studio_flow_import', 'Import a flow', 'Imports an exported JSON flow after validating it (plain-language errors); optionally also saves it as a template.',
    schema({ payload: { description: 'The exported JSON text or object.' }, name: str('Optional new name.'), asTemplate: { type: 'boolean' }, visibility: { type: 'string', enum: ['private', 'org', 'platform'] } }, ['payload']), 'flows.write', `POST ${FSA}/flows/import`,
    async (a, { user }) => (await lib()).importFlow(user, a.payload, a)),
  T('flow_studio_template_save', 'Save a flow as a template', 'Saves a flow as a template: private, shared with your organization, or with the platform (needs the shareTemplate permission).',
    schema({ flowId: id('Flow id.'), name: str('Template name.'), visibility: { type: 'string', enum: ['private', 'org', 'platform'] } }, ['flowId']), 'flows.write', `POST ${FSA}/flows/:id/save-as-template`,
    async (a, { user }) => (await lib()).saveAsTemplate(user, a.flowId, a)),
  T('flow_studio_template_change', 'Overwrite or delete a template', 'Shows the impact first; call again with approved set to the token to apply. op is overwrite (needs flowId) or delete.',
    schema({ templateId: id('Template id.'), op: { type: 'string', enum: ['overwrite', 'delete'] }, flowId: id('Flow to copy over the template (overwrite).'), approved: str('Impact token.') }, ['templateId', 'op']), 'flows.write', `PUT|DELETE ${FSA}/templates/:id`,
    async (a, { user }) => {
      const L = await lib();
      if (!a.approved) { const e = Object.assign(new Error('Review the impact and approve it to apply.'), { status: 409, code: 'impact_approval_required', impact: await L.templateImpact(user, a.templateId, { op: a.op, fromFlowId: a.flowId }) }); throw e; }
      return a.op === 'delete' ? L.deleteTemplate(user, a.templateId, { approved: a.approved }) : L.overwriteTemplate(user, a.templateId, { flowId: a.flowId, approved: a.approved });
    }),
  T('flow_studio_agent_draft', 'Ask the studio agent for a draft', 'Drafts metadata for one step (node) or connector (edge) through the in-app agent path. Nothing is applied until you save it.',
    schema({ kind: { type: 'string', enum: ['node', 'edge'] }, label: str('Step or connector label.'), type: str('Shape type.'), prompt: str('What to draft.', { maxLength: 800 }), fields: { type: 'array', items: { type: 'string' } } }, ['kind']), 'flows.write', `POST ${FSA}/flows/:id/agent-draft`,
    async (a, { user }) => (await lib()).agentDraft(user, a)),

  // ── Journey flow -> experience mapping (docs/changes/journey-flow-experience-mapping.md); scopes flowjourney.* ──
  T('flow_journey_catalogs_read', 'Read what a structured binding can point at', 'Returns the pick lists behind the studio bindings: platform capabilities, permissions and licences, data ports, actors, World Shell layers, crystal variants, interactions, and the data objects (with `object` set, that object\'s fields).',
    schema({ object: str('Optional data object (table) name: returns its fields instead of the object list.'), q: str('Optional text to filter data objects.') }), 'flowjourney.read', `GET ${FSA}/catalogs`,
    async (a) => { const L = await fj(); return a.object ? L.dataFieldsOf(a.object) : { ...(await L.bindingCatalogs()), ...(await L.dataObjects({ q: a.q })) }; }),
  T('flow_journey_preview', 'Preview the journey a flow generates', 'Compiles the published (or draft) flow into a journey definition without applying it: steps with their structured bindings, gates with branch conditions, the experience each step renders as, the path per variant, problems, the impact on running journeys and members, and the approval token.',
    schema({ flowId: id('Flow id.'), source: { type: 'string', enum: ['published', 'draft'] } }, ['flowId']), 'flowjourney.read', `GET ${FSA}/flows/:id/journey-preview`,
    async (a, { user }) => (await fj()).previewJourney(user, a.flowId, { source: a.source || 'published' })),
  T('flow_journey_active_read', 'Read the journey a flow is running as', 'Reads back, from the platform tables, the gates, molecules, actor roles, experience and running journeys of the flow\'s activated journey.',
    schema({ flowId: id('Flow id.') }, ['flowId']), 'flowjourney.read', `GET ${FSA}/flows/:id/journey`, async (a, { user }) => (await fj()).activeJourney(user, a.flowId)),
  T('flow_journey_activate', 'Activate a flow as a journey', 'Applies the generated journey (molecules, gates, scenario) after the impact preview: needs the token from flow_journey_preview, the activateJourney permission, and runs the finalization gate, same as the website.',
    schema({ flowId: id('Flow id.'), approved: str('Token from the preview.'), note: str('Optional note.', { maxLength: 300 }) }, ['flowId', 'approved']), 'flowjourney.publish', `POST ${FSA}/flows/:id/journey/activate`,
    async (a, { user }) => { const { assertReadyToFinalize } = await import('./finalizationGates.js'); await assertReadyToFinalize(user.id); return (await fj()).activateJourney(user, a.flowId, { approved: a.approved, note: a.note }); }),
  T('flow_journey_test_start', 'Start a test run of an activated journey', 'Starts one journey of the activated flow for you (the same call the website\'s Start a test journey button makes).',
    schema({ flowId: id('Flow id.') }, ['flowId']), 'flowjourney.write', `POST ${FSA}/flows/:id/journey/test-run`, async (a, { user }) => (await fj()).startTestJourney(user, a.flowId)),
  T('flow_experience_channels_read', 'Read the experience channels', 'Which experience channels (static asset, layer, crystal variant, animation, interaction, destination) are mapped to a step field, through the render-bindings registry.',
    schema({}), 'flowjourney.read', `GET ${FSA}/experience-channels`, async () => (await fj()).experienceChannels()),
  T('flow_experience_channels_save', 'Map or unmap experience channels', 'Turns channels on or off (the editDefinition permission applies). Shows the impact first: call again with approved set to the token to apply.',
    schema({ channels: obj('{ "step.asset": true|false, ... }'), note: str('Why it changed.', { maxLength: 300 }), approved: str('Impact token from the previous refusal.') }, ['channels', 'note']), 'flowjourney.write', `PUT ${FSA}/experience-channels`,
    async (a, { user }) => (await fj()).saveExperienceChannels(user, { channels: a.channels, note: a.note, approved: a.approved })),
];
