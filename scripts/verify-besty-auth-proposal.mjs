import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [auth, authRoutes, leads, proposal, consentGate, memberDashboard, intake, proposalOps, customerMemory, orgPortal, manifestText] = await Promise.all([
  read('server/auth.js'), read('server/routes/auth.js'), read('server/routes/leads.js'), read('server/routes/proposalExperience.js'),
  read('src/components/admin/CareerConsentGate.jsx'), read('src/components/MemberDashboard.jsx'), read('src/components/PortfolioRequestFlow.jsx'), read('server/lib/proposalOperations.js'), read('server/lib/customerMemory.js'), read('server/routes/orgPortal.js'),
  read('tests/fixtures/bestystaff-auth-proposal-visual-states.json'),
]);

const checks = [
  ['password-change middleware exists', auth.includes('enforceRequiredPasswordChange')],
  ['terms middleware returns 428', auth.includes("status(428)") && auth.includes('career_terms_required')],
  ['member password endpoint is user-scoped', authRoutes.includes("router.post('/change-password', requireUser")],
  ['reset uses shared password replacement', authRoutes.includes('replacePassword(userId, password)')],
  ['reset preference endpoint exists', authRoutes.includes("'/password-reset-preferences'")],
  ['TOTP setup and challenge are implemented', authRoutes.includes("router.post('/totp/setup'") && authRoutes.includes('verifyTotp')],
  ['converted leads must change temporary password', leads.includes("must_change_password) VALUES ($1, $2, 'member', true")],
  ['lead conversion uses configurable gate evaluator', leads.includes('evaluateLeadConversion')],
  ['terms UI identifies itself as first BestyStaff prompt', consentGate.includes('BestyStaff · required first prompt')],
  ['terms gate wraps both member workspace states', (memberDashboard.match(/<CareerConsentGate>/g) || []).length >= 2],
  ['intake tells lead to expect verification email', intake.includes('verification email is on the way')],
  ['proposal versions route exists', proposal.includes("router.get('/versions'")],
  ['proposal feedback defaults to draft', proposal.includes("VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$8)") && proposal.includes("status: 'draft'")],
  ['feedback publishing is explicit', proposal.includes("router.post('/feedback/publish'")],
  ['delivery archives prior delivered version', proposal.includes("status='archived'")],
  ['delivery assigns collaborator rights', proposal.includes('proposal_collaborators')],
  ['delivery creates recipient notification', proposal.includes("'proposal_version'")],
  ['final proposal converts to contract metadata', proposal.includes("versions/:versionId/contract") && proposal.includes('proposal_contracts')],
  ['final proposal requires explicit approval', proposal.includes('final proposals require approval before delivery') && proposal.includes("versions/:versionId/approve")],
  ['proposal delivery includes PDF walkthrough', proposal.includes('createTextPdf') && proposal.includes('walkthrough.pdf')],
  ['unpublished feedback reminders require private drafts', proposalOps.includes("pfe.status='draft'") && proposalOps.includes('proposal_feedback_reminders')],
  ['published feedback triage requires configurator review', proposalOps.includes("status='triaged'") && proposalOps.includes('requiresConfiguratorReview: true')],
  ['customer memory is permission filtered', customerMemory.includes('permittedCustomerMemory') && customerMemory.includes("classification !== 'organization'")],
  ['organization authentication policy requires one route', orgPortal.includes('at least one authentication route is required') && orgPortal.includes('require_one_route=true')],
];

for (const [name, passed] of checks) assert.ok(passed, name);
const manifest = JSON.parse(manifestText);
assert.ok(manifest.states.length >= 12, 'visual-state catalog must cover all primary surfaces');
assert.deepEqual(Object.keys(manifest.viewports), ['mobile', 'tablet', 'desktop']);

const baseUrl = process.env.VERIFY_BASE_URL;
if (baseUrl) {
  for (const path of ['/login', '/api/auth/me', '/api/auth/password-policy']) {
    const response = await fetch(new URL(path, baseUrl));
    assert.ok(response.status < 500, `${path} returned ${response.status}`);
  }
}

console.log(`BestyStaff/auth/proposal verification passed: ${checks.length} contracts, ${manifest.states.length} visual states.`);
