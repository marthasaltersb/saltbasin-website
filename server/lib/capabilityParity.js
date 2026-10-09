// Interface-parity map (2026-10-09). A config registry - no table - listing every capability in the governed
// route files with the three ways it must be usable:
//
//   ui   - the World Shell path a person clicks (desktop and a 390px phone), or null when there is none yet
//   api  - the API route(s) the UI calls (and the MCP tool's handler shares the server function behind them)
//   mcp  - the MCP tool name(s) in server/lib/mcpToolRegistry.js, or null when there is none yet
//
// A missing ui/mcp is recorded as a GAP and shown highlighted on World Shell -> Capabilities (admin). A path
// that is deliberately not offered in an interface carries an `exclusion` with the reason instead
// (uiExclusion / mcpExclusion) - never a silent blank. `node scripts/check-interface-parity.mjs` verifies the
// registry against the code (routes exist, tools exist, every governed route is listed, shipped tools were not
// removed) and `--strict` fails while any gap remains. APPEND-ONLY in spirit like the block REGISTRY: a
// capability is changed by filling in its gap, not by deleting its row.
import { MCP_TOOL_NAMES } from './mcpToolRegistry.js';

/** Route files under parity governance: file -> mount path (kept in step with server/index.js by the check). */
export const GOVERNED_ROUTE_FILES = Object.freeze({
  'server/routes/careerPlacementAgents.js': '/api/career-agents',
  'server/routes/resumeOutputs.js': '/api/resume-outputs',
  'server/routes/coverLetters.js': '/api/cover-letters',
  'server/routes/platformAccess.js': '/api/platform',
  'server/routes/careerMaster.js': '/api/career',
  'server/routes/sharedOutputs.js': '/api/shared-outputs',
});

/** For files governed only in part: file -> pattern a route (`METHOD /full/path`) must match to be governed.
 *  Empty: server/routes/careerMaster.js is governed in full (every route has a row below). */
export const GOVERNED_ROUTE_FILTERS = Object.freeze({});

const CPA = '/api/career-agents';
const RO = '/api/resume-outputs';
const CL = '/api/cover-letters';
const CM = '/api/career';
const RR = `World Shell > Journeys > Career Master > Resume rollups`;
const WS = 'World Shell';
const PROF = `${WS} > Journeys > Career Master > Proficiency & Rollups > 3 · Rules & why`;
const OPP = `${WS} > Journeys > Career Placement Agents > (select an opportunity)`;
const RESUME = `${WS} > Journeys > My Resume`;

export const CAPABILITIES = Object.freeze([
  // ── Career Master and tracked opportunities ───────────────────────────────
  { key: 'career-master-read', title: 'Read the Career Master', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: ['GET /api/career/master'], mcp: ['career_master_read'] },
  { key: 'agent-hub-read', title: 'See the agent hub (agents and counts)', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`GET ${CPA}/agent-hub`], mcp: ['career_agent_hub_read'] },
  { key: 'opportunities-list', title: 'List tracked opportunities', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`GET ${CPA}/opportunities`], mcp: ['career_opportunities_list'] },
  { key: 'opportunity-create', title: 'Track a new opportunity', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents > Track`, api: [`POST ${CPA}/opportunities`], mcp: ['career_opportunity_create'] },
  { key: 'opportunity-open', title: 'Open one tracked opportunity', group: 'Career opportunities', ui: OPP, api: [`GET ${CPA}/opportunities/:id`], mcp: ['career_opportunity_open'] },
  { key: 'opportunity-details', title: 'Fill in opportunity details', group: 'Career opportunities', ui: `${OPP} > Save details`, api: [`PATCH ${CPA}/opportunities/:id`], mcp: ['career_opportunity_update_details'] },
  { key: 'opportunity-scores', title: 'Record dimension scores', group: 'Career opportunities', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/scores`], mcp: ['career_opportunity_scores_record'] },
  { key: 'opportunity-approve', title: 'Approve an opportunity to pursue', group: 'Career opportunities', ui: OPP, api: [`POST ${CPA}/opportunities/:id/approve`], mcp: ['career_opportunity_approve'] },
  { key: 'opportunity-advance-stage', title: 'Advance an opportunity stage', group: 'Career opportunities', ui: OPP, api: [`POST ${CPA}/opportunities/:id/advance-stage`], mcp: ['career_opportunity_advance_stage'] },
  { key: 'pipeline-import', title: 'Import a pipeline workbook', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/import`], mcp: null, mcpExclusion: 'File upload; an agent creates opportunities one at a time with career_opportunity_create.' },
  { key: 'research-run', title: 'Run career research', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/research`], mcp: ['career_research_run'] },
  { key: 'pipeline-verify', title: 'Run the qualification gates now', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/verify-pipeline`, `GET ${CPA}/verification-current`], mcp: ['career_pipeline_verify', 'career_verification_current_read'] },
  { key: 'verification-current-edit', title: 'Edit the qualification gate definition (admin)', group: 'Career opportunities', ui: `${WS} > Journeys > Qualification Rules > Save qualification rule (administrators)`, api: [`PUT ${CPA}/verification-current`], mcp: ['career_verification_current_save'] },
  { key: 'agent-schedule', title: 'View and change the agent schedule', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents > Schedules`, api: [`GET ${CPA}/schedule`, `POST ${CPA}/schedule`], mcp: ['career_agent_schedule_read', 'career_agent_schedule_save'] },
  { key: 'outreach', title: 'Outreach: start, research contacts, draft, save, merge outcome', group: 'Career opportunities', ui: `${OPP} > Outreach & Hiring Manager Research`, api: [`GET ${CPA}/opportunities/:id/outreach`, `POST ${CPA}/opportunities/:id/outreach/start`, `POST ${CPA}/opportunities/:id/outreach/research-contacts`, `POST ${CPA}/opportunities/:id/outreach/draft-message`, `POST ${CPA}/opportunities/:id/outreach/messages`, `POST ${CPA}/outreach/:id/merge-outcome`], mcp: ['career_outreach_read', 'career_outreach_start', 'career_outreach_research_contacts', 'career_outreach_draft_message', 'career_outreach_message_save', 'career_outreach_merge_outcome'] },

  // ── Application outputs ───────────────────────────────────────────────────
  { key: 'application-outputs-list', title: 'List the outputs linked to an opportunity (with provenance)', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS`, api: [`GET ${CPA}/opportunities/:id/outputs`], mcp: ['application_outputs_list'] },
  { key: 'application-output-link', title: 'Link or unlink an existing output', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Link an Existing Output / Unlink`, api: [`GET ${CPA}/unlinked-outputs`, `POST ${CPA}/opportunities/:id/outputs/:outputId/link`, `DELETE ${CPA}/opportunities/:id/outputs/:outputId/link`], mcp: ['application_outputs_unlinked_list', 'application_output_link', 'application_output_unlink'] },
  { key: 'application-output-open', title: 'Open an output\'s document content', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Edit draft`, api: [`GET ${CPA}/resume-outputs/:id/content`], mcp: ['application_output_open'] },
  { key: 'application-output-new-draft', title: 'Save a new draft version', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Edit draft > Save`, api: [`POST ${CPA}/resume-outputs/:id/versions`], mcp: ['application_output_new_draft_version'] },
  { key: 'application-output-approve-qr', title: 'Approve an output for its QR link', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Approve for QR`, api: [`POST ${RO}/:id/share`], mcp: ['application_output_approve_for_qr'] },
  { key: 'application-output-revoke-qr', title: 'Revoke a QR link', group: 'Application outputs', ui: `${RESUME}`, api: [`DELETE ${RO}/:id/share`], mcp: ['application_output_revoke_qr'] },
  { key: 'application-output-qr-image', title: 'Download the QR image', group: 'Application outputs', ui: `${RESUME}`, api: [`GET ${RO}/:id/qr.:format(svg|png)`], mcp: null, mcpExclusion: 'Binary image; the approve tool returns the shareable URL.' },
  { key: 'shared-output-resolve', title: 'Open an approved output by its private QR link', group: 'Application outputs', ui: 'Scan the QR code or open the /r/ link (public page)', api: ['GET /api/shared-outputs/:token'], mcp: ['shared_output_resolve'] },
  { key: 'application-output-docx', title: 'Download the stamped .docx (slug QR, real dates)', group: 'Application outputs', ui: `${RESUME} > Download .docx`, api: [`GET ${RO}/:id/download.docx`], mcp: null, mcpExclusion: 'Binary file; the approve tool returns the shareable URL.' },
  { key: 'application-package-import', title: 'Import an application package', group: 'Application outputs', ui: `${RESUME} > Import an application package`, api: [`POST ${RO}/import-package`], mcp: ['application_package_import'] },
  { key: 'resume-outputs-list', title: 'List my resume outputs', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${RO}`], mcp: ['resume_outputs_list'] },
  { key: 'resume-output-generate', title: 'Generate a resume output from the Career Master', group: 'Resume outputs', ui: `${RESUME}`, api: [`POST ${RO}`], mcp: ['resume_output_generate'] },
  { key: 'resume-output-staleness', title: 'Check whether an output is stale', group: 'Resume outputs', ui: `${RESUME} > Check freshness`, api: [`GET ${RO}/:id/staleness`], mcp: ['resume_output_staleness'] },
  { key: 'resume-output-versions', title: 'Version history of an output', group: 'Resume outputs', ui: `${RESUME} > Version history`, api: [`GET ${RO}/:id/versions`], mcp: ['resume_output_versions'] },
  { key: 'resume-output-status', title: 'Approve or publish an output (status)', group: 'Resume outputs', ui: `${RESUME}`, api: [`PATCH ${RO}/:id/status`], mcp: ['resume_output_status_set'] },
  { key: 'finalization-check', title: 'Check what blocks finalizing', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${RO}/finalization-check`], mcp: ['finalization_check'] },
  { key: 'opportunity-resumes', title: 'Generate, approve and list resumes for an opportunity', group: 'Resume outputs', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/generate-resume`, `POST ${CPA}/opportunities/:id/resume-outputs`, `GET ${CPA}/opportunities/:id/resume-outputs`, `POST ${CPA}/generate-resume-queue`, `POST ${CPA}/auto-queue-outputs`], mcp: ['career_resume_generate', 'career_resume_output_save', 'career_opportunity_resumes_list', 'career_resume_queue_generate', 'career_auto_queue_outputs'] },
  { key: 'opportunity-import-output', title: 'Import a document into an opportunity', group: 'Resume outputs', ui: `${OPP} > Or Import an Existing Document`, api: [`POST ${CPA}/opportunities/:id/import-output`], mcp: null, mcpExclusion: 'File upload; an agent saves content with application_output_new_draft_version.' },
  { key: 'resume-output-view-download', title: 'View, download PDF, ZIP or email outputs', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${CPA}/resume-outputs/:id/view`, `GET ${CPA}/resume-outputs/:id/download.pdf`, `POST ${CPA}/resume-outputs/export-zip`, `POST ${CPA}/resume-outputs/email`], mcp: ['career_output_view', 'career_outputs_email'] },
  { key: 'opportunity-cover-letter-legacy', title: 'Generate and approve an agent cover letter (legacy path)', group: 'Cover letters', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/generate-cover-letter`, `POST ${CPA}/opportunities/:id/cover-letter-outputs`], mcp: ['career_cover_letter_generate', 'career_cover_letter_output_save'] },

  // ── Cover letters ─────────────────────────────────────────────────────────
  { key: 'cover-letter-settings', title: 'Cover-letter settings', group: 'Cover letters', ui: `${RESUME} > Cover-letter settings`, api: [`GET ${CL}/settings`, `PUT ${CL}/settings`], mcp: ['cover_letter_settings_read', 'cover_letter_settings_save'] },
  { key: 'cover-letter-packages', title: 'Packages per opportunity: list, job text, draft letter, assemble', group: 'Cover letters', ui: `${RESUME} > Application packages`, api: [`GET ${CL}/opportunities`, `PUT ${CL}/opportunities/:id/job-rec`, `POST ${CL}/opportunities/:id/cover-letter`, `POST ${CL}/opportunities/:id/package`, `POST ${CL}/packages/assemble`], mcp: ['cover_letter_packages_list', 'cover_letter_job_text_set', 'cover_letter_draft_for_opportunity', 'cover_letter_package_build', 'cover_letter_packages_assemble'] },
  { key: 'cover-letter-open', title: 'Open a cover letter', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`GET ${CL}/letters/:id`], mcp: ['cover_letter_open'] },
  { key: 'cover-letter-agent-turn', title: 'Ask the cover-letter agent for an edit', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`POST ${CL}/letters/:id/turns`], mcp: ['cover_letter_agent_turn'] },
  { key: 'cover-letter-turns', title: 'Read the agent conversation and metrics', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`GET ${CL}/letters/:id/turns`, `GET ${CL}/metrics`], mcp: ['cover_letter_turns_read', 'cover_letter_metrics_read'] },
  { key: 'cover-letter-turn-decide', title: 'Accept or reject a proposed edit', group: 'Cover letters', ui: `${RESUME} > Application packages (Open) > Accept / Reject`, api: [`POST ${CL}/turns/:id/accept`, `POST ${CL}/turns/:id/reject`], mcp: null, mcpExclusion: 'Applying a proposal is a human decision made in the website, by design.' },

  // ── Career Master: resume rollups and definitions ─────────────────────────
  { key: 'resume-rollups-read', title: 'Read computed resume rollups (KPI tiles, industry buckets, category groups)', group: 'Resume rollups', ui: `${WS} > Journeys > Career Master > Resume rollups`, api: [`GET ${CM}/resume-rollups`], mcp: ['resume_rollups_read'] },
  { key: 'resume-rollups-preview', title: 'Live preview of unsaved rollup definitions', group: 'Resume rollups', ui: `${WS} > Journeys > Career Master > Resume rollups`, api: [`POST ${CM}/resume-rollups/preview`], mcp: ['resume_rollup_preview'] },
  { key: 'career-atom-rollups-read', title: 'Read Career Atom rollups', group: 'Resume rollups', ui: `${WS} > Journeys > Career Master > Resume rollups`, api: [`GET ${CM}/atom-rollups`], mcp: ['career_atom_rollups_read'] },
  { key: 'experience-definitions-read', title: 'List experience and rollup definitions', group: 'Resume rollups', ui: `${WS} > Journeys > Career Master > Resume rollups`, api: [`GET ${CM}/experience-definitions`], mcp: ['career_experience_definitions_read'] },
  { key: 'experience-definition-save', title: 'Save or reorder a definition (tile, bucket, group, Career Atom card)', group: 'Resume rollups', ui: `${RR} > Save / up / down`, api: [`PUT ${CM}/experience-definitions/:type/:key`], mcp: ['career_experience_definition_save'] },
  { key: 'experience-definition-delete', title: 'Remove a definition', group: 'Resume rollups', ui: `${RR} > Remove`, api: [`DELETE ${CM}/experience-definitions/:type/:key`], mcp: ['career_experience_definition_delete'] },
  { key: 'career-proficiency-read', title: 'Read resolved proficiency and rollup policy previews', group: 'Resume rollups', ui: `${WS} > Journeys > Career Master > Proficiency`, api: [`GET ${CM}/rollup-preview/:key`, `GET ${CM}/rollups`], mcp: ['career_rollups_read', 'career_rollup_preview_read'] },

  // ── Career Master: other routes (listed so the file can be governed; MCP gaps are recorded, not hidden) ──
  { key: 'career-public-reads', title: 'Public/shared Career Master reads (public rollup, catalogs)', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: [`GET ${CM}/public-rollup/:slug/:displayKey`, `GET ${CM}/catalogs`], mcp: null, mcpExclusion: 'Public or shared vocabulary read by the website; an agent reads the member\'s own data with career_master_read.' },
  { key: 'career-consent', title: 'Career Portfolio terms (status and accept)', group: 'Career Master', ui: `${WS} (first sign-in step)`, api: [`GET ${CM}/consent-status`, `POST ${CM}/consent`], mcp: null, mcpExclusion: 'Accepting terms is a personal decision made in the website; MCP calls are refused until it is done.' },
  { key: 'career-intake', title: 'Intake documents and runs (upload, LinkedIn pull, run, semantic import, analysis)', group: 'Career Master', ui: `${WS} > Journeys > Career Master > Manual Intake`, api: [`GET ${CM}/intake-documents`, `POST ${CM}/intake-documents`, `POST ${CM}/intake-documents/linkedin-pull`, `GET ${CM}/intake-runs`, `POST ${CM}/intake-runs`, `POST ${CM}/intake-runs/:id/run`, `GET ${CM}/semantic-template`, `POST ${CM}/semantic-import`, `POST ${CM}/resume-analysis`], mcp: ['career_intake_documents_list', 'career_intake_linkedin_pull', 'career_intake_runs_list', 'career_intake_run_create', 'career_intake_run_execute', 'career_semantic_template_read'] },
  { key: 'career-mappings', title: 'Field mappings (classify, lineage, commit) and bounded agent action', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: [`POST ${CM}/mappings/classify`, `GET ${CM}/mappings/lineage`, `POST ${CM}/mappings/commit`, `POST ${CM}/bounded-agent/action`], mcp: ['career_mappings_classify', 'career_mappings_lineage', 'career_mappings_commit', 'career_bounded_agent_action'] },
  { key: 'career-master-records', title: 'Create, edit and delete Career Master records (jobs, skills, tools, engagements, domains, certifications, deals, meta options)', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: ['jobs', 'skills', 'tools', 'engagements', 'domains', 'certifications', 'deals', 'meta-options'].flatMap((r) => [`GET ${CM}/${r}`, `POST ${CM}/${r}`, `PATCH ${CM}/${r}/:id`, `DELETE ${CM}/${r}/:id`]), mcp: ['career_record_list', 'career_record_create', 'career_record_update', 'career_record_delete'] },
  { key: 'career-admin-utilities', title: 'Site metadata sync and definition seeding', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: [`POST ${CM}/sync-site-metadata`, `POST ${CM}/seed`], mcp: null, mcpExclusion: 'Maintenance actions run from the website.' },
  // ── Proficiency rules, technology categories and the live QR page ─────────
  { key: 'proficiency-rules-read', title: 'Read proficiency rules and resolved levels', group: 'Proficiency rules', ui: PROF, api: [`GET ${CM}/proficiency`, `GET ${CM}/experience-definitions`], mcp: ['proficiency_rules_read'] },
  { key: 'proficiency-override', title: 'Override or clear one proficiency level', group: 'Proficiency rules', ui: PROF, api: [`GET ${CM}/proficiency-assertions`, `PUT ${CM}/proficiency-assertions/:entityType/:entityId/:periodKey`, `DELETE ${CM}/proficiency-assertions/:entityType/:entityId/:periodKey`], mcp: ['proficiency_override_set', 'proficiency_override_clear', 'career_proficiency_override_save', 'career_proficiency_override_clear'] },
  { key: 'technology-category', title: 'Set a technology\'s proficiency category', group: 'Proficiency rules', ui: PROF, api: [`PATCH ${CM}/tools/:id`], mcp: ['technology_category_set'] },
  { key: 'proficiency-formula', title: 'Save, select or delete a proficiency formula and certification bonus', group: 'Proficiency rules', ui: PROF, api: [`PUT ${CM}/experience-definitions/:type/:key`], mcp: ['proficiency_formula_save', 'proficiency_formula_select', 'certification_mapping_save'] },
  { key: 'proficiency-definition-delete', title: 'Delete a formula or certification bonus', group: 'Proficiency rules', ui: PROF, api: [`DELETE ${CM}/experience-definitions/:type/:key`], mcp: ['career_experience_definition_delete'] },
  { key: 'shared-output-live', title: 'Open the live QR page (and its PDF)', group: 'Application outputs', ui: `${WS} > Journeys > My Resume (QR link opens /r/:token)`, api: ['GET /api/shared-outputs/:token'], mcp: ['shared_output_live_read'] },
  { key: 'shared-output-pdf', title: 'Download the PDF from the live QR page', group: 'Application outputs', ui: `${WS} > Journeys > My Resume (QR link opens /r/:token)`, api: ['GET /api/shared-outputs/:token/download.pdf'], mcp: null, mcpExclusion: 'Binary document; shared_output_live_read returns the same content as data.' },

  // ── Release tracker ───────────────────────────────────────────────────────
  { key: 'release-tracker-read', title: 'Read release records (admin)', group: 'Release tracker', ui: `${WS} > Journeys > Release Intelligence`, api: ['GET /api/release-intelligence/releases', 'GET /api/release-intelligence/releases/:id'], mcp: ['release_tracker_read'] },

  // ── Platform access (this feature) ────────────────────────────────────────
  { key: 'access-tokens', title: 'Create, list and revoke access tokens', group: 'Platform access', ui: `${WS} > Journeys > Connected Agents`, api: ['GET /api/platform/tokens', 'POST /api/platform/tokens', 'DELETE /api/platform/tokens/:id'], mcp: null, mcpExclusion: 'Credentials are managed by a signed-in person in the website; a token can never mint or revoke tokens.' },
  { key: 'mcp-connection-info', title: 'Show the MCP address and the tools a token gets', group: 'Platform access', ui: `${WS} > Journeys > Connected Agents`, api: ['GET /api/platform/mcp'], mcp: null, mcpExclusion: 'MCP clients receive the same list from tools/list.' },
  { key: 'capabilities-map', title: 'Show this parity map (admin)', group: 'Platform access', ui: `${WS} > Journeys > Capabilities`, api: ['GET /api/platform/capabilities'], mcp: null, mcpExclusion: 'Reference map for people; the source is server/lib/capabilityParity.js.' },
]);

/** Computes per-capability status (the Capabilities screen and the check script share this). */
export function evaluateCapabilities(capabilities = CAPABILITIES, toolNames = MCP_TOOL_NAMES) {
  return capabilities.map((c) => {
    const missingTools = (c.mcp || []).filter((n) => !toolNames.includes(n));
    const ui = c.ui ? 'yes' : c.uiExclusion ? 'excluded' : 'gap';
    const api = c.api?.length ? 'yes' : 'gap';
    const mcp = c.mcp?.length && !missingTools.length ? 'yes' : c.mcpExclusion ? 'excluded' : 'gap';
    return {
      key: c.key, title: c.title, group: c.group,
      ui: c.ui || null, api: c.api || [], mcp: c.mcp || [],
      uiStatus: ui, apiStatus: api, mcpStatus: mcp,
      uiExclusion: c.uiExclusion || null, mcpExclusion: c.mcpExclusion || null,
      gap: c.gap || null, missingTools,
      full: ui !== 'gap' && api !== 'gap' && mcp !== 'gap',
    };
  });
}

export function summarizeCapabilities(rows) {
  return {
    total: rows.length,
    full: rows.filter((r) => r.full).length,
    uiGaps: rows.filter((r) => r.uiStatus === 'gap').length,
    mcpGaps: rows.filter((r) => r.mcpStatus === 'gap').length,
    apiGaps: rows.filter((r) => r.apiStatus === 'gap').length,
  };
}
