// Route-backed MCP tools (parity fix, 2026-10-09). APPEND-ONLY, same rule as mcpToolRegistry.js.
//
// Each entry is the MCP face of an existing website API route. The handler does not re-implement the route: it
// runs that route's own Express handler in-process (server/lib/mcpRouteInvoker.js) as the token's owner, so the
// route's middleware (requireUser / requireAdmin), validation, ownership checks, gates (for example the
// finalization gate) and error statuses are the website's, byte for byte. A tool's `body` / `query` arguments are
// passed to the route as its request body / query string; the description names the fields the route reads.
import { MOUNTS, invokeRoute } from './mcpRouteInvoker.js';

const INT = { type: 'integer', minimum: 1 };
const STR = { type: 'string', minLength: 1, maxLength: 200 };
const OBJ = (description) => ({ type: 'object', description });

/**
 * spec: [name, title, description, routerKey, method, path, opts]
 * opts: scope (default career.read for GET, career.write otherwise), permission ('user' default),
 *       params { argName: 'pathParam' } (integers unless `strParams`), body (description) , query (description),
 *       bodyRequired.
 */
const SPECS = [
  // ── Career opportunities ──
  ['career_agent_hub_read', 'See the agent hub', 'Returns the Career Placement Agents hub: the agent roster and counts of tracked opportunities by stage.', 'careerAgents', 'GET', '/agent-hub', {}],
  ['career_opportunity_scores_record', 'Record dimension scores for an opportunity', 'Records the 0-5 dimension scores for one tracked opportunity, with their source. Body fields: dimensionScores (object of dimension key to 0-5), sourceType, sourceReference, sourceTier (1-4). A missing score stays null; nothing is guessed.', 'careerAgents', 'POST', '/opportunities/:id/scores', { params: { opportunityId: 'id' }, body: 'dimensionScores, sourceType, sourceReference, sourceTier', bodyRequired: true }],
  ['career_opportunity_approve', 'Approve an opportunity to pursue', 'Approves a tracked opportunity (same rule as the website: refused until it is fully scored and qualifies).', 'careerAgents', 'POST', '/opportunities/:id/approve', { params: { opportunityId: 'id' } }],
  ['career_opportunity_advance_stage', 'Advance an opportunity stage', 'Moves a tracked opportunity to a new stage. Body field: stage.', 'careerAgents', 'POST', '/opportunities/:id/advance-stage', { params: { opportunityId: 'id' }, body: 'stage', bodyRequired: true }],
  ['career_research_run', 'Run career research', 'Starts the career research agent for the caller, exactly as the Research button does. Body fields are the route\'s optional research settings.', 'careerAgents', 'POST', '/research', { body: 'optional research settings' }],
  ['career_pipeline_verify', 'Run the qualification gates now', 'Runs the qualification gates over the caller\'s pipeline and returns what passed and what was held.', 'careerAgents', 'POST', '/verify-pipeline', {}],
  ['career_verification_current_read', 'Read the qualification gate definition', 'Returns the qualification gate definition currently in force for the caller.', 'careerAgents', 'GET', '/verification-current', {}],
  ['career_verification_current_save', 'Save the qualification gate definition (administrators)', 'Administrators only. Replaces the qualification gate definition. Body field: gates.', 'careerAgents', 'PUT', '/verification-current', { permission: 'admin', body: 'gates', bodyRequired: true }],
  ['career_agent_schedule_read', 'Read the agent schedule', 'Returns the caller\'s agent schedule (which agent actions run, and how often).', 'careerAgents', 'GET', '/schedule', {}],
  ['career_agent_schedule_save', 'Change the agent schedule', 'Changes one agent action\'s cadence. Body fields: agentKey, actionKey, cadence.', 'careerAgents', 'POST', '/schedule', { body: 'agentKey, actionKey, cadence', bodyRequired: true }],
  ['career_outreach_read', 'Read the outreach effort for an opportunity', 'Returns the outreach effort for one tracked opportunity: contacts, drafted messages and outcomes.', 'careerAgents', 'GET', '/opportunities/:id/outreach', { params: { opportunityId: 'id' } }],
  ['career_outreach_start', 'Start outreach for an opportunity', 'Starts the outreach effort for one tracked opportunity.', 'careerAgents', 'POST', '/opportunities/:id/outreach/start', { params: { opportunityId: 'id' } }],
  ['career_outreach_research_contacts', 'Research hiring-manager contacts', 'Runs hiring-manager research for one tracked opportunity and returns the contacts found (with their confidence tier).', 'careerAgents', 'POST', '/opportunities/:id/outreach/research-contacts', { params: { opportunityId: 'id' } }],
  ['career_outreach_draft_message', 'Draft an outreach message', 'Drafts an outreach message for one tracked opportunity from its verified trigger and the caller\'s Career Master. The draft is returned, not sent.', 'careerAgents', 'POST', '/opportunities/:id/outreach/draft-message', { params: { opportunityId: 'id' } }],
  ['career_outreach_message_save', 'Save an outreach message', 'Saves an outreach message draft as an application output. Body fields: subject, body, sourceRowId.', 'careerAgents', 'POST', '/opportunities/:id/outreach/messages', { params: { opportunityId: 'id' }, body: 'subject, body, sourceRowId', bodyRequired: true }],
  ['career_outreach_merge_outcome', 'Merge an outreach outcome into the application', 'Records the outcome of an outreach effort on its application. Body field: outcome.', 'careerAgents', 'POST', '/outreach/:id/merge-outcome', { params: { outreachId: 'id' }, body: 'outcome', bodyRequired: true }],
  ['career_resume_generate', 'Generate resume content for an opportunity', 'Generates targeted resume content from the Career Master for one tracked opportunity (returned, not yet filed). Body field: jobDescription (optional).', 'careerAgents', 'POST', '/opportunities/:id/generate-resume', { params: { opportunityId: 'id' }, body: 'jobDescription' }],
  ['career_resume_output_save', 'File generated resume content as an output', 'Files resume content for an opportunity as a resume output. Body fields: presetId, generatedContent, targetJobDescription.', 'careerAgents', 'POST', '/opportunities/:id/resume-outputs', { params: { opportunityId: 'id' }, body: 'presetId, generatedContent, targetJobDescription', bodyRequired: true }],
  ['career_opportunity_resumes_list', 'List resume outputs for an opportunity', 'Lists the resume outputs filed for one tracked opportunity.', 'careerAgents', 'GET', '/opportunities/:id/resume-outputs', { params: { opportunityId: 'id' } }],
  ['career_resume_queue_generate', 'Generate the resume queue', 'Generates resumes for approved opportunities that have none. Body field: limit (at most 25).', 'careerAgents', 'POST', '/generate-resume-queue', { body: 'limit' }],
  ['career_auto_queue_outputs', 'Queue outputs for newly approved opportunities', 'Queues application outputs for opportunities approved since the last run.', 'careerAgents', 'POST', '/auto-queue-outputs', {}],
  ['career_cover_letter_generate', 'Generate a cover letter for an opportunity (legacy path)', 'Generates cover-letter content for one tracked opportunity with the legacy generator (returned, not filed). Body field: jobDescription (optional).', 'careerAgents', 'POST', '/opportunities/:id/generate-cover-letter', { params: { opportunityId: 'id' }, body: 'jobDescription' }],
  ['career_cover_letter_output_save', 'File a generated cover letter as an output (legacy path)', 'Files cover-letter content as an output for an opportunity. Body fields: generatedContent, targetJobDescription.', 'careerAgents', 'POST', '/opportunities/:id/cover-letter-outputs', { params: { opportunityId: 'id' }, body: 'generatedContent, targetJobDescription', bodyRequired: true }],
  ['career_output_view', 'View an output as the website renders it', 'Returns one output as the digital view shows it (sections, provenance, approval and QR state). PDF and ZIP downloads are binary files and are not offered over MCP.', 'careerAgents', 'GET', '/resume-outputs/:id/view', { params: { outputId: 'id' } }],
  ['career_outputs_email', 'Email outputs to an address', 'Emails the chosen outputs as PDFs to an address, exactly as the website does. Body fields: projectionIds (array), toEmail.', 'careerAgents', 'POST', '/resume-outputs/email', { body: 'projectionIds, toEmail', bodyRequired: true }],

  // ── Resume outputs ──
  ['resume_outputs_list', 'List my resume outputs', 'Lists all of the caller\'s resume outputs.', 'resumeOutputs', 'GET', '/', {}],
  ['resume_output_generate', 'Generate a resume output from the Career Master', 'Generates a resume output from the Career Master. Body fields: presetId (required), presetName, includedSections, regenerateFromId, targetJobDescription.', 'resumeOutputs', 'POST', '/', { body: 'presetId, presetName, includedSections, regenerateFromId, targetJobDescription', bodyRequired: true }],
  ['resume_output_staleness', 'Check whether an output is stale', 'Reports whether one output is out of date against the current Career Master.', 'resumeOutputs', 'GET', '/:id/staleness', { params: { outputId: 'id' } }],
  ['resume_output_versions', 'Version history of an output', 'Returns the version history of one output, with dates and tracked changes.', 'resumeOutputs', 'GET', '/:id/versions', { params: { outputId: 'id' } }],
  ['resume_output_status_set', 'Set an output\'s status', 'Changes an output\'s status. Body field: status. Approving or publishing runs the same finalization gate as the website.', 'resumeOutputs', 'PATCH', '/:id/status', { params: { outputId: 'id' }, body: 'status', bodyRequired: true }],
  ['finalization_check', 'Check what blocks finalizing', 'Lists what would block approving an output right now (for example technologies without a proficiency category). The same list the website shows before Approve.', 'resumeOutputs', 'GET', '/finalization-check', {}],

  // ── Cover letters ──
  // cover_letter_settings_read / cover_letter_settings_save / cover_letter_package_build are core tools in
  // mcpToolRegistry.js (added on the integration branch by the cover-letter-agent fix); not duplicated here.
  ['cover_letter_packages_list', 'List application packages per opportunity', 'Lists each tracked opportunity with its cover letter and package state.', 'coverLetters', 'GET', '/opportunities', {}],
  ['cover_letter_job_text_set', 'Set the job description text for an opportunity', 'Stores the job description text the cover letter and package are built against. Body field: text.', 'coverLetters', 'PUT', '/opportunities/:id/job-rec', { params: { opportunityId: 'id' }, body: 'text', bodyRequired: true }],
  ['cover_letter_draft_for_opportunity', 'Draft the cover letter for an opportunity', 'Builds the template cover letter for an opportunity. Body field: force (boolean) to rebuild.', 'coverLetters', 'POST', '/opportunities/:id/cover-letter', { params: { opportunityId: 'id' }, body: 'force' }],
  ['cover_letter_packages_assemble', 'Assemble a package by key', 'Assembles an application package by its key. Body field: packageKey.', 'coverLetters', 'POST', '/packages/assemble', { body: 'packageKey', bodyRequired: true }],
  ['cover_letter_turns_read', 'Read a cover letter\'s agent conversation', 'Returns the cover-letter agent turns for one letter, including proposed edits and whether each was accepted.', 'coverLetters', 'GET', '/letters/:id/turns', { params: { letterId: 'id' } }],
  ['cover_letter_metrics_read', 'Read cover-letter agent metrics', 'Returns the cover-letter agent usage metrics for the caller. Query field: sessionKey (optional).', 'coverLetters', 'GET', '/metrics', { query: 'sessionKey' }],

  // ── Career Master ──
  ['career_rollups_read', 'Read rollup policy results', 'Returns the Career Master rollups (the same data the Output Template chart gallery reads). Query field: owner (optional; a member slug, or me; defaults to me, the caller).', 'career', 'GET', '/rollups', { query: 'owner (me by default, or a member slug)', defaultQuery: { owner: 'me' } }],
  ['career_rollup_preview_read', 'Preview one rollup policy', 'Returns the preview of one rollup policy by key.', 'career', 'GET', '/rollup-preview/:key', { params: { key: 'key' }, strParams: ['key'] }],
  ['career_intake_documents_list', 'List intake documents', 'Lists the documents the caller has taken in for Career Master intake. File upload itself is a website action.', 'career', 'GET', '/intake-documents', {}],
  ['career_intake_linkedin_pull', 'Pull intake from LinkedIn', 'Pulls profile content from the caller\'s connected LinkedIn account into intake documents.', 'career', 'POST', '/intake-documents/linkedin-pull', { body: 'route settings' }],
  ['career_intake_runs_list', 'List intake runs', 'Lists the caller\'s Career Master intake runs.', 'career', 'GET', '/intake-runs', {}],
  ['career_intake_run_create', 'Create an intake run', 'Creates an intake run over chosen intake documents. Body fields as the website sends them (document ids and mode).', 'career', 'POST', '/intake-runs', { body: 'document ids and mode', bodyRequired: true }],
  ['career_intake_run_execute', 'Execute an intake run', 'Runs one intake run and returns the proposal.', 'career', 'POST', '/intake-runs/:id/run', { params: { runId: 'id' } }],
  ['career_semantic_template_read', 'Read the semantic import template', 'Returns the semantic import template description. Workbook upload and resume analysis of an uploaded file are website actions.', 'career', 'GET', '/semantic-template', {}],
  ['career_mappings_classify', 'Classify proposed field mappings', 'Classifies proposed Career Master field mappings. Body as the website sends it.', 'career', 'POST', '/mappings/classify', { body: 'proposal', bodyRequired: true }],
  ['career_mappings_lineage', 'Read mapping lineage', 'Returns the lineage of committed field mappings. Query as the website sends it.', 'career', 'GET', '/mappings/lineage', { query: 'lineage filters' }],
  ['career_mappings_commit', 'Commit field mappings', 'Commits approved field mappings into the Career Master. Body as the website sends it.', 'career', 'POST', '/mappings/commit', { body: 'approved mappings', bodyRequired: true }],
  ['career_bounded_agent_action', 'Run a bounded agent action', 'Runs one action of the bounded Career Master agent. Body as the website sends it.', 'career', 'POST', '/bounded-agent/action', { body: 'action', bodyRequired: true }],
];

// Career-bound outputs, package reconciliation and per-preset master overrides (release 2026-10-02, round 4 F3-5).
// Each is the MCP face of the same route the website calls (member-scoped via requireUser / requireAuth).
const CB_CONTENT = 'name, content (career_bound v1: sections, jobs[{jobId, bulletIds, extraBullets (this output only), overrides (per-field wording for this output only; a field that is absent reads live from Career Master)}], master_list sections with ids, overrides and extras)';
SPECS.push(
  ['career_reconciliation_tasks_list', 'List reconciliation tasks', 'Lists the caller\'s Career Master reconciliation queue, conflicts first. Query field: status (open, all, sync_failed).', 'careerReconciliation', 'GET', '/tasks', { query: 'status' }],
  ['career_reconciliation_task_resolve', 'Resolve a reconciliation task', 'Resolves one queue task (including package tasks that add a job, bullet, skill, tool or certification to Career Master). Body fields: method and any fields the task type needs.', 'careerReconciliation', 'POST', '/tasks/:id/resolve', { params: { taskId: 'id' }, body: 'method, task-specific fields', bodyRequired: true }],
  ['career_reconciliation_package_import', 'Import an application package as a reconciliation source', 'Files the package outputs (never approving anything) and raises one reconciliation task per difference from Career Master. Body field: package.', 'careerReconciliation', 'POST', '/package-sources', { body: 'package', bodyRequired: true }],
  ['career_reconciliation_task_retry_sync', 'Retry a failed Career Atom sync', 'Retries the Career Atom sync of a decided package task whose sync failed.', 'careerReconciliation', 'POST', '/tasks/:id/retry-sync', { params: { taskId: 'id' } }],
  ['career_bound_jobs_list', 'List Career Master jobs with bullet libraries', 'Returns the caller\'s Career Master jobs with their bullet-variant libraries.', 'careerBound', 'GET', '/jobs', {}],
  ['career_bound_bullet_add_to_master', 'Add a bullet to Career Master', 'Adds a bullet variant to a Career Master job (it then appears in every output that selects it). To add a bullet to one output only, put it in that output\'s job extraBullets via career_bound_output_save. Body fields: text, tags.', 'careerBound', 'POST', '/jobs/:jobId/bullets', { params: { jobId: 'jobId' }, body: 'text, tags', bodyRequired: true }],
  ['career_bound_bullet_update', 'Edit a Career Master bullet', 'Edits a bullet variant in Career Master. Body fields: text, tags.', 'careerBound', 'PATCH', '/jobs/:jobId/bullets/:bulletId', { params: { jobId: 'jobId', bulletId: 'bulletId' }, strParams: ['bulletId'], body: 'text, tags', bodyRequired: true }],
  ['career_bound_bullet_delete', 'Delete a Career Master bullet', 'Deletes a bullet variant from Career Master.', 'careerBound', 'DELETE', '/jobs/:jobId/bullets/:bulletId', { params: { jobId: 'jobId', bulletId: 'bulletId' }, strParams: ['bulletId'] }],
  ['career_bound_convertible_list', 'List convertible package resumes', 'Lists imported package resumes that can be converted to career-bound, with each package\'s open reconciliation task count.', 'careerBound', 'GET', '/convertible', {}],
  ['career_bound_convert_preview', 'Preview converting a package resume', 'Dry run of converting a package resume to career-bound; reports any role it could not bind.', 'careerBound', 'GET', '/convert/:projectionId/preview', { params: { projectionId: 'projectionId' } }],
  ['career_bound_convert', 'Convert a package resume to career-bound', 'Converts an imported package resume into a career-bound output that reads from Career Master. Files a new draft; approves nothing.', 'careerBound', 'POST', '/convert/:projectionId', { params: { projectionId: 'projectionId' } }],
  ['career_bound_output_create', 'Create a career-bound output', 'Creates a career-bound output. With no content it starts from everything in Career Master. Body fields: ' + CB_CONTENT + '.', 'careerBound', 'POST', '/outputs', { body: CB_CONTENT }],
  ['career_bound_review_count', 'Count open package review tasks', 'Returns how many package reconciliation tasks are still open.', 'careerBound', 'GET', '/review-count', {}],
  ['career_bound_output_open', 'Open a career-bound output', 'Returns the editor state: stored content, resolved content, and Career Master state.', 'careerBound', 'GET', '/outputs/:id', { params: { outputId: 'id' } }],
  ['career_bound_output_preview', 'Preview unsaved career-bound content', 'Resolves posted content against Career Master and returns it; writes nothing. Body field: content.', 'careerBound', 'POST', '/outputs/:id/preview', { params: { outputId: 'id' }, body: 'content', bodyRequired: true }],
  ['career_bound_output_save', 'Edit a career-bound output (field overrides, output-only bullets, selection)', 'Saves the output as the next draft version; never edits an approved version. Setting a job\'s overrides.<field> overrides that field for this output only; removing the field reverts it to Career Master. Body fields: ' + CB_CONTENT + '.', 'careerBound', 'PUT', '/outputs/:id', { params: { outputId: 'id' }, body: CB_CONTENT, bodyRequired: true }],
  ['output_templates_list', 'List output template presets', 'Lists the caller\'s output template presets.', 'outputTemplates', 'GET', '/', { query: 'output_type' }],
  ['output_templates_primary_read', 'Read the primary preset', 'Returns the caller\'s primary preset for an output type. Query field: output_type.', 'outputTemplates', 'GET', '/primary', { query: 'output_type' }],
  ['output_templates_portfolio_read', 'Read the portfolio presets', 'Returns the caller\'s portfolio output presets.', 'outputTemplates', 'GET', '/portfolio', {}],
  ['output_template_public_read', 'Read a public preset', 'Returns what the public page of a preset shows.', 'outputTemplates', 'GET', '/:id/public', { params: { templateId: 'id' }, strParams: ['templateId'] }],
  ['output_template_create', 'Create an output template preset', 'Creates a preset. Body fields: output_type, name, config (config.masterOverrides holds per-preset wording for jobs, skills, tools and certifications; removing an entry reverts it to Career Master), is_primary.', 'outputTemplates', 'POST', '/', { body: 'output_type, name, config, is_primary', bodyRequired: true }],
  ['output_template_update', 'Edit a preset (per-preset master overrides)', 'Saves a preset. Body fields: name, config (config.masterOverrides is the per-output wording that overrides Career Master; removing an entry reverts to the live value), is_primary.', 'outputTemplates', 'PUT', '/:id', { params: { templateId: 'id' }, strParams: ['templateId'], body: 'name, config, is_primary', bodyRequired: true }],
  ['output_template_delete', 'Delete a preset', 'Deletes a preset.', 'outputTemplates', 'DELETE', '/:id', { params: { templateId: 'id' }, strParams: ['templateId'] }],
);

const RESOURCES = ['jobs', 'skills', 'tools', 'engagements', 'domains', 'certifications', 'deals', 'meta-options'];
const RESOURCE_PROP = { type: 'string', enum: RESOURCES, description: 'Which Career Master record type. meta-options is administrators only (the route refuses everyone else).' };
SPECS.push(
  ['career_record_list', 'List Career Master records of one type', 'Lists the caller\'s records of one type (jobs, skills, tools, engagements, domains, certifications, deals).', 'career', 'GET', '/:resource', { schemaProps: { resource: RESOURCE_PROP }, required: ['resource'], pathArgs: { resource: 'resource' } }],
  ['career_record_create', 'Create a Career Master record', 'Creates one record. Body fields are that record type\'s fields as the Career Master screen saves them.', 'career', 'POST', '/:resource', { schemaProps: { resource: RESOURCE_PROP }, required: ['resource'], pathArgs: { resource: 'resource' }, body: 'the record\'s fields', bodyRequired: true }],
  ['career_record_update', 'Edit a Career Master record', 'Edits one record. Body fields are the fields to change.', 'career', 'PATCH', '/:resource/:id', { schemaProps: { resource: RESOURCE_PROP, recordId: { ...INT, description: 'The record id.' } }, required: ['resource', 'recordId'], pathArgs: { resource: 'resource', recordId: 'id' }, body: 'the fields to change', bodyRequired: true }],
  ['career_record_delete', 'Delete a Career Master record', 'Deletes one record, exactly as the website\'s Delete does.', 'career', 'DELETE', '/:resource/:id', { schemaProps: { resource: RESOURCE_PROP, recordId: { ...INT, description: 'The record id.' } }, required: ['resource', 'recordId'], pathArgs: { resource: 'resource', recordId: 'id' } }],
);

SPECS.push(
  ['career_catalogs_read', 'Read the Career Master catalogs', 'Returns the shared Career Master vocabularies (catalogs) the website uses to fill pick lists.', 'career', 'GET', '/catalogs', {}],
  ['career_public_rollup_read', 'Read a member\'s public career rollup', 'Returns the public rollup a member has chosen to publish. Arguments: slug (the member\'s public slug) and displayKey (the rollup display).', 'career', 'GET', '/public-rollup/:slug/:displayKey', { params: { slug: 'slug', displayKey: 'displayKey' }, strParams: ['slug', 'displayKey'] }],
  ['career_site_metadata_sync', 'Sync site metadata into the Career Master', 'Runs the website\'s site metadata sync for the caller (administrators sync the admin site unless body.scope is member).', 'career', 'POST', '/sync-site-metadata', { body: 'scope (optional)' }],
);

// Opportunity-scoring preferences (parity fix, release 2026-10-10-production-hardening-resume): the MCP face of the
// three /api/career-agents/scoring-preferences routes the World Shell's "Opportunity Scoring Weights" card uses.
SPECS.push(
  ['career_scoring_preferences_read', 'Read my opportunity scoring weights', 'Returns the caller\'s opportunity-scoring weights (dimensions with weight as a fraction), whether they are a personal override or the Salt Basin default, and the platform default dimensions.', 'careerAgents', 'GET', '/scoring-preferences', {}],
  ['career_scoring_preferences_save', 'Save my opportunity scoring weights', 'Saves the caller\'s personal weights; affects only the caller\'s own scores. Body field: weights (object of every dimension key to a fraction between 0 and 1; they must total 1.0, for example 0.15 for 15%).', 'careerAgents', 'PUT', '/scoring-preferences', { body: 'weights', bodyRequired: true }],
  ['career_scoring_preferences_reset', 'Reset my opportunity scoring weights to the default', 'Removes the caller\'s personal weights so scoring reverts to the Salt Basin default. Safe to repeat.', 'careerAgents', 'DELETE', '/scoring-preferences', {}],
);

function build([name, title, description, routerKey, method, path, opts]) {
  const idArgs = opts.params || {};
  const strParams = new Set(opts.strParams || []);
  const properties = { ...(opts.schemaProps || {}) };
  const required = [...(opts.required || [])];
  for (const arg of Object.keys(idArgs)) {
    properties[arg] = strParams.has(arg) ? { ...STR, description: `The ${arg}.` } : { ...INT, description: `The ${arg.replace(/Id$/, '')} id.` };
    required.push(arg);
  }
  if (opts.body) { properties.body = OBJ(`Request body fields: ${opts.body}.`); if (opts.bodyRequired) required.push('body'); }
  if (opts.query) properties.query = OBJ(`Query fields: ${opts.query}.`);
  const pathArgs = opts.pathArgs || idArgs;
  const isRead = method === 'GET';
  return {
    name, title, description,
    inputSchema: { type: 'object', properties, required: [...new Set(required)], additionalProperties: false },
    scope: opts.scope || (isRead ? 'career.read' : 'career.write'),
    permission: opts.permission || 'user',
    api: `${method} ${MOUNTS[routerKey]}${path}`,
    handler: async (args, ctx) => invokeRoute(routerKey, method, path, ctx, {
      params: Object.fromEntries(Object.entries(pathArgs).map(([arg, p]) => [p, args[arg]])),
      query: { ...(opts.defaultQuery || {}), ...(args.query || {}) },
      body: args.body || {},
    }),
  };
}

export const ROUTE_TOOLS = SPECS.map(build);
