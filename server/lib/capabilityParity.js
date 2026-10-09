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
});

const CPA = '/api/career-agents';
const RO = '/api/resume-outputs';
const CL = '/api/cover-letters';
const WS = 'World Shell';
const OPP = `${WS} > Journeys > Career Placement Agents > (select an opportunity)`;
const RESUME = `${WS} > Journeys > My Resume`;

export const CAPABILITIES = Object.freeze([
  // ── Career Master and tracked opportunities ───────────────────────────────
  { key: 'career-master-read', title: 'Read the Career Master', group: 'Career Master', ui: `${WS} > Journeys > Career Master`, api: ['GET /api/career/master'], mcp: ['career_master_read'] },
  { key: 'agent-hub-read', title: 'See the agent hub (agents and counts)', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`GET ${CPA}/agent-hub`], mcp: null, gap: 'No MCP tool for the agent hub summary yet.' },
  { key: 'opportunities-list', title: 'List tracked opportunities', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`GET ${CPA}/opportunities`], mcp: ['career_opportunities_list'] },
  { key: 'opportunity-create', title: 'Track a new opportunity', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents > Track`, api: [`POST ${CPA}/opportunities`], mcp: ['career_opportunity_create'] },
  { key: 'opportunity-open', title: 'Open one tracked opportunity', group: 'Career opportunities', ui: OPP, api: [`GET ${CPA}/opportunities/:id`], mcp: ['career_opportunity_open'] },
  { key: 'opportunity-details', title: 'Fill in opportunity details', group: 'Career opportunities', ui: `${OPP} > Save details`, api: [`PATCH ${CPA}/opportunities/:id`], mcp: null, gap: 'No MCP tool for editing opportunity details yet.' },
  { key: 'opportunity-scores', title: 'Record dimension scores', group: 'Career opportunities', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/scores`], mcp: null, gap: 'No MCP tool for recording scores yet.' },
  { key: 'opportunity-approve', title: 'Approve an opportunity to pursue', group: 'Career opportunities', ui: OPP, api: [`POST ${CPA}/opportunities/:id/approve`], mcp: null, gap: 'No MCP tool for approving an opportunity yet.' },
  { key: 'opportunity-advance-stage', title: 'Advance an opportunity stage', group: 'Career opportunities', ui: OPP, api: [`POST ${CPA}/opportunities/:id/advance-stage`], mcp: null, gap: 'No MCP tool for stage changes yet.' },
  { key: 'pipeline-import', title: 'Import a pipeline workbook', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/import`], mcp: null, mcpExclusion: 'File upload; an agent creates opportunities one at a time with career_opportunity_create.' },
  { key: 'research-run', title: 'Run career research', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/research`], mcp: null, gap: 'No MCP tool to start research yet.' },
  { key: 'pipeline-verify', title: 'Run the qualification gates now', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents`, api: [`POST ${CPA}/verify-pipeline`, `GET ${CPA}/verification-current`], mcp: null, gap: 'No MCP tool for the qualification gates yet.' },
  { key: 'verification-current-edit', title: 'Edit the qualification gate definition (admin)', group: 'Career opportunities', ui: null, api: [`PUT ${CPA}/verification-current`], mcp: null, gap: 'No screen edits the gate definition yet; it is API-only.' },
  { key: 'agent-schedule', title: 'View and change the agent schedule', group: 'Career opportunities', ui: `${WS} > Journeys > Career Placement Agents > Schedules`, api: [`GET ${CPA}/schedule`, `POST ${CPA}/schedule`], mcp: null, gap: 'No MCP tool for the schedule yet.' },
  { key: 'outreach', title: 'Outreach: start, research contacts, draft, save, merge outcome', group: 'Career opportunities', ui: `${OPP} > Outreach & Hiring Manager Research`, api: [`GET ${CPA}/opportunities/:id/outreach`, `POST ${CPA}/opportunities/:id/outreach/start`, `POST ${CPA}/opportunities/:id/outreach/research-contacts`, `POST ${CPA}/opportunities/:id/outreach/draft-message`, `POST ${CPA}/opportunities/:id/outreach/messages`, `POST ${CPA}/outreach/:id/merge-outcome`], mcp: null, gap: 'No MCP tools for outreach yet.' },

  // ── Application outputs ───────────────────────────────────────────────────
  { key: 'application-outputs-list', title: 'List the outputs linked to an opportunity (with provenance)', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS`, api: [`GET ${CPA}/opportunities/:id/outputs`], mcp: ['application_outputs_list'] },
  { key: 'application-output-link', title: 'Link or unlink an existing output', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Link an Existing Output / Unlink`, api: [`GET ${CPA}/unlinked-outputs`, `POST ${CPA}/opportunities/:id/outputs/:outputId/link`, `DELETE ${CPA}/opportunities/:id/outputs/:outputId/link`], mcp: null, gap: 'No MCP tools for linking outputs yet.' },
  { key: 'application-output-open', title: 'Open an output\'s document content', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Edit draft`, api: [`GET ${CPA}/resume-outputs/:id/content`], mcp: ['application_output_open'] },
  { key: 'application-output-new-draft', title: 'Save a new draft version', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Edit draft > Save`, api: [`POST ${CPA}/resume-outputs/:id/versions`], mcp: ['application_output_new_draft_version'] },
  { key: 'application-output-approve-qr', title: 'Approve an output for its QR link', group: 'Application outputs', ui: `${OPP} > APPLICATION OUTPUTS > Approve for QR`, api: [`POST ${RO}/:id/share`], mcp: ['application_output_approve_for_qr'] },
  { key: 'application-output-revoke-qr', title: 'Revoke a QR link', group: 'Application outputs', ui: `${RESUME}`, api: [`DELETE ${RO}/:id/share`], mcp: null, gap: 'No MCP tool for revoking a QR link yet.' },
  { key: 'application-output-qr-image', title: 'Download the QR image', group: 'Application outputs', ui: `${RESUME}`, api: [`GET ${RO}/:id/qr.:format(svg|png)`], mcp: null, mcpExclusion: 'Binary image; the approve tool returns the shareable URL.' },
  { key: 'application-package-import', title: 'Import an application package', group: 'Application outputs', ui: null, api: [`POST ${RO}/import-package`], mcp: null, gap: 'Import is command-line only (scripts/import-application-package.mjs); no screen uploads a package.' },
  { key: 'resume-outputs-list', title: 'List my resume outputs', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${RO}`], mcp: null, gap: 'No MCP tool listing all outputs yet.' },
  { key: 'resume-output-generate', title: 'Generate a resume output from the Career Master', group: 'Resume outputs', ui: `${RESUME}`, api: [`POST ${RO}`], mcp: null, gap: 'No MCP tool for generating a resume output yet.' },
  { key: 'resume-output-staleness', title: 'Check whether an output is stale', group: 'Resume outputs', ui: null, api: [`GET ${RO}/:id/staleness`], mcp: null, gap: 'No screen or MCP tool shows staleness yet.' },
  { key: 'resume-output-versions', title: 'Version history of an output', group: 'Resume outputs', ui: `${RESUME} > Version history`, api: [`GET ${RO}/:id/versions`], mcp: null, gap: 'No MCP tool for version history yet.' },
  { key: 'resume-output-status', title: 'Approve or publish an output (status)', group: 'Resume outputs', ui: `${RESUME}`, api: [`PATCH ${RO}/:id/status`], mcp: null, gap: 'No MCP tool for status changes yet; approve-for-QR is covered.' },
  { key: 'finalization-check', title: 'Check what blocks finalizing', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${RO}/finalization-check`], mcp: null, gap: 'No MCP tool for the pre-check yet; the approve tool returns the same refusal.' },
  { key: 'opportunity-resumes', title: 'Generate, approve and list resumes for an opportunity', group: 'Resume outputs', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/generate-resume`, `POST ${CPA}/opportunities/:id/resume-outputs`, `GET ${CPA}/opportunities/:id/resume-outputs`, `POST ${CPA}/generate-resume-queue`, `POST ${CPA}/auto-queue-outputs`], mcp: null, gap: 'No MCP tools for generating resumes yet.' },
  { key: 'opportunity-import-output', title: 'Import a document into an opportunity', group: 'Resume outputs', ui: `${OPP} > Or Import an Existing Document`, api: [`POST ${CPA}/opportunities/:id/import-output`], mcp: null, mcpExclusion: 'File upload; an agent saves content with application_output_new_draft_version.' },
  { key: 'resume-output-view-download', title: 'View, download PDF, ZIP or email outputs', group: 'Resume outputs', ui: `${RESUME}`, api: [`GET ${CPA}/resume-outputs/:id/view`, `GET ${CPA}/resume-outputs/:id/download.pdf`, `POST ${CPA}/resume-outputs/export-zip`, `POST ${CPA}/resume-outputs/email`], mcp: null, gap: 'No MCP tools for rendered views, downloads or email yet.' },
  { key: 'opportunity-cover-letter-legacy', title: 'Generate and approve an agent cover letter (legacy path)', group: 'Cover letters', ui: `${OPP}`, api: [`POST ${CPA}/opportunities/:id/generate-cover-letter`, `POST ${CPA}/opportunities/:id/cover-letter-outputs`], mcp: null, gap: 'No MCP tools for the legacy cover-letter generator yet.' },

  // ── Cover letters ─────────────────────────────────────────────────────────
  { key: 'cover-letter-settings', title: 'Cover-letter settings', group: 'Cover letters', ui: `${RESUME} > Cover-letter settings`, api: [`GET ${CL}/settings`, `PUT ${CL}/settings`], mcp: null, gap: 'No MCP tools for cover-letter settings yet.' },
  { key: 'cover-letter-packages', title: 'Packages per opportunity: list, job text, draft letter, assemble', group: 'Cover letters', ui: `${RESUME} > Application packages`, api: [`GET ${CL}/opportunities`, `PUT ${CL}/opportunities/:id/job-rec`, `POST ${CL}/opportunities/:id/cover-letter`, `POST ${CL}/opportunities/:id/package`, `POST ${CL}/packages/assemble`], mcp: null, gap: 'No MCP tools for packages yet.' },
  { key: 'cover-letter-open', title: 'Open a cover letter', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`GET ${CL}/letters/:id`], mcp: ['cover_letter_open'] },
  { key: 'cover-letter-agent-turn', title: 'Ask the cover-letter agent for an edit', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`POST ${CL}/letters/:id/turns`], mcp: ['cover_letter_agent_turn'] },
  { key: 'cover-letter-turns', title: 'Read the agent conversation and metrics', group: 'Cover letters', ui: `${RESUME} > Application packages (Open)`, api: [`GET ${CL}/letters/:id/turns`, `GET ${CL}/metrics`], mcp: null, gap: 'No MCP tools for the conversation history or metrics yet.' },
  { key: 'cover-letter-turn-decide', title: 'Accept or reject a proposed edit', group: 'Cover letters', ui: `${RESUME} > Application packages (Open) > Accept / Reject`, api: [`POST ${CL}/turns/:id/accept`, `POST ${CL}/turns/:id/reject`], mcp: null, mcpExclusion: 'Applying a proposal is a human decision made in the website, by design.' },

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
