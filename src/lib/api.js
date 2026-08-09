// Thin fetch wrapper. All admin routes are cookie-authed; we always send credentials.
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error(body?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const api = {
  getProposalExperienceState: () => request('/api/proposal-experience/state'),
  getProposalHighways: () => request('/api/proposal-experience/highways'),
  getProposalSections: () => request('/api/proposal-experience/sections'),
  getProposalDiagnostic: () => request('/api/proposal-experience/diagnostic'),
  getProposalOpportunity: () => request('/api/proposal-experience/opportunity'),
  getProposalEvidence: () => request('/api/proposal-experience/evidence'),
  getMyLonetreeProposalConfig: () => request('/api/lonetree-mvp/proposal-config'),
  listLonetreeProposalProspects: () => request('/api/lonetree-mvp/admin/prospects'),
  getLonetreeProspectConfig: (userId, kind = 'draft') => request(`/api/lonetree-mvp/admin/prospects/${userId}/proposal-config?kind=${encodeURIComponent(kind)}`),
  saveLonetreeProspectDraft: (userId, value) => request(`/api/lonetree-mvp/admin/prospects/${userId}/proposal-config/draft`, { method: 'PUT', body: JSON.stringify({ value }) }),
  publishLonetreeProspectConfig: (userId) => request(`/api/lonetree-mvp/admin/prospects/${userId}/proposal-config/publish`, { method: 'POST' }),
  recordProposalStageViewed: (stageId) => request('/api/proposal-experience/events/stage-viewed', { method: 'POST', body: JSON.stringify({ stageId }) }),
  recordProposalScenarioExpanded: (scenarioId) => request('/api/proposal-experience/events/scenario-expanded', { method: 'POST', body: JSON.stringify({ scenarioId }) }),
  recordProposalEvidenceOpened: (evidenceId) => request('/api/proposal-experience/events/evidence-opened', { method: 'POST', body: JSON.stringify({ evidenceId }) }),
  submitProposalDecision: (option, rationale) => request('/api/proposal-experience/decision', { method: 'POST', body: JSON.stringify({ option, rationale }) }),
  getMemberEntitlements: () => request('/api/member-entitlements'),
  getCareerConsentStatus: (consentType = 'career_portfolio') => request(`/api/career/consent-status?consentType=${consentType}`),
  recordCareerConsent: (consentType, granted) => request('/api/career/consent', { method: 'POST', body: JSON.stringify({ consentType, granted }) }),
  listResumeOutputs: () => request('/api/resume-outputs'),
  createResumeOutput: (body) => request('/api/resume-outputs', { method: 'POST', body: JSON.stringify(body) }),
  getResumeOutputStaleness: (id) => request(`/api/resume-outputs/${id}/staleness`),
  updateResumeOutputStatus: (id, status) => request(`/api/resume-outputs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getFinancialProviders: () => request('/api/member-financial/providers'),
  getFinancialConnections: () => request('/api/member-financial/connections'),
  createFinancialConnection: (body) => request('/api/member-financial/connections', { method: 'POST', body: JSON.stringify(body) }),
  revokeFinancialConnection: (id) => request(`/api/member-financial/connections/${id}`, { method: 'DELETE' }),
  createFinancialAccount: (connectionId, body) => request(`/api/member-financial/connections/${connectionId}/accounts`, { method: 'POST', body: JSON.stringify(body) }),
  createFinancialShare: (body) => request('/api/member-financial/shares', { method: 'POST', body: JSON.stringify(body) }),
  revokeFinancialShare: (id) => request(`/api/member-financial/shares/${id}`, { method: 'DELETE' }),
  getMetricRegistry: () => request('/api/metric-intelligence/metrics'),
  getMetricArrDemo: (variant = 'live_arr') => request(`/api/metric-intelligence/metrics/arr/demo?variant=${encodeURIComponent(variant)}`),
  syncMetricRegistry: () => request('/api/metric-intelligence/registry/sync', { method: 'POST' }),
  calculateMetric: (body) => request('/api/metric-intelligence/calculate', { method: 'POST', body: JSON.stringify(body) }),
  getMetricObservations: (filters = {}) => request(`/api/metric-intelligence/observations?${new URLSearchParams(filters)}`),
  // Config envelopes (generic runtime-editable config — see server/lib/configEnvelope.js)
  listConfigEnvelopes: () => request('/api/config-envelopes'),
  getConfigEnvelope: (id) => request(`/api/config-envelopes/${encodeURIComponent(id)}`),
  writeConfigEnvelope: (id, value) => request(`/api/config-envelopes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  resetConfigEnvelope: (id) => request(`/api/config-envelopes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Auth
  me: () => request('/api/auth/me'),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Landing gate
  landingStatus: () => request('/api/auth/landing-gate/status'),
  unlockLanding: (password) =>
    request('/api/auth/landing-gate/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Site state
  getPublishedSite: () => request('/api/site/published'),
  getDraftSite: () => request('/api/site/draft'),
  saveDraftSite: (site) =>
    request('/api/site/draft', { method: 'PUT', body: JSON.stringify(site) }),
  publish: () => request('/api/site/publish', { method: 'POST' }),

  // Config
  getPublicConfig: () => request('/api/config/public'),
  getDraftConfig: () => request('/api/config/draft'),
  saveDraftConfig: (config) =>
    request('/api/config/draft', { method: 'PUT', body: JSON.stringify(config) }),

  // Net Works (admin: list all members)
  listMembers: () => request('/api/members/'),

  // Member-scoped CMS (mirrors the admin site + config endpoints, scoped to
  // req.user.id on the server). The member admin shell uses these instead of
  // the platform-level ones so each member only sees their own content.
  getMemberDraftSite: () => request('/api/member-site/draft'),
  saveMemberDraftSite: (site) =>
    request('/api/member-site/draft', { method: 'PUT', body: JSON.stringify(site) }),
  publishMemberSite: () => request('/api/member-site/publish', { method: 'POST' }),

  getMemberDraftConfig: () => request('/api/member-config/draft'),
  saveMemberDraftConfig: (config) =>
    request('/api/member-config/draft', { method: 'PUT', body: JSON.stringify(config) }),
  publishMemberConfig: () => request('/api/member-config/publish', { method: 'POST' }),
  getOrgPortalContext: (id) => request(`/api/org-portal/${id}/context`),
  getOrgSite: (id) => request(`/api/org-portal/${id}/site`),
  saveOrgSite: (id, data) => request(`/api/org-portal/${id}/site`, { method: 'PUT', body: JSON.stringify(data) }),
  getOrgConfig: (id) => request(`/api/org-portal/${id}/config`),
  saveOrgConfig: (id, data) => request(`/api/org-portal/${id}/config`, { method: 'PUT', body: JSON.stringify(data) }),
  publishOrgPortal: (id) => request(`/api/org-portal/${id}/publish`, { method: 'POST' }),
  getOrgPageTypes: (id) => request(`/api/org-portal/${id}/page-types`),
  getOrgConsentStatus: (id) => request(`/api/org-portal/${id}/consent-status`),
  recordOrgConsent: (id, body) => request(`/api/org-portal/${id}/consent`, { method: 'POST', body: JSON.stringify(body) }),
  getOrgDocuments: (id) => request(`/api/org-portal/${id}/documents`),
  getOrgDocument: (id, docId) => request(`/api/org-portal/${id}/documents/${docId}`),
  getMemberEmails: () => request('/api/members/me/emails'),

  // Public — used by the Salt Basin home page Net Works banner.
  listFeaturedMembers: () => request('/api/member-site/featured'),

  // JIRA integration (admin-only)
  getJiraConfig:      () => request('/api/jira/config'),
  saveJiraConfig:     (cfg) => request('/api/jira/config', { method: 'PUT', body: JSON.stringify(cfg) }),
  testJiraConnection: () => request('/api/jira/test', { method: 'POST' }),
  importFromJira:     () => request('/api/jira/import', { method: 'POST' }),

  // Scrum Agent (admin-only, Phase A scaffold)
  listAgentThreads:   () => request('/api/agent/threads'),
  createAgentThread:  (title) => request('/api/agent/threads', { method: 'POST', body: JSON.stringify({ title }) }),
  getAgentMessages:   (threadId) => request(`/api/agent/threads/${threadId}/messages`),
  deleteAgentThread:  (threadId) => request(`/api/agent/threads/${threadId}`, { method: 'DELETE' }),
  chatWithAgent:      (threadId, message) =>
    request('/api/agent/chat', { method: 'POST', body: JSON.stringify({ threadId, message }) }),

  // Member templates (logged-in users)
  listMemberTemplates: () => request('/api/member-templates/'),
  getMemberTemplate:   (slug) => request(`/api/member-templates/${slug}`),
  applyMemberTemplate: (slug) => request(`/api/member-templates/${slug}/apply`, { method: 'POST' }),

  // Backlog / Requirements Management (admin-only)
  getBacklog: () => request('/api/backlog/'),
  // Build progress snapshots — time-series rollups for charting "how the
  // numbers changed week over week / month over month." Auto-captured daily
  // on /summary access; can also be force-captured via createSnapshot().
  getSnapshots: (range = {}) => {
    const qs = new URLSearchParams(range).toString();
    return request(`/api/backlog/snapshots${qs ? `?${qs}` : ''}`);
  },
  createSnapshot: (body = {}) =>
    request('/api/backlog/snapshot', { method: 'POST', body: JSON.stringify(body) }),
  seedBacklog: () => request('/api/backlog/seed', { method: 'POST' }),
  createBacklogItem: (item) =>
    request('/api/backlog/items', { method: 'POST', body: JSON.stringify(item) }),
  updateBacklogItem: (id, patch) =>
    request(`/api/backlog/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  archiveBacklogItem: (id) =>
    request(`/api/backlog/items/${id}`, { method: 'DELETE' }),
  getBacklogItem: (id) => request(`/api/backlog/items/${id}`),
  createCapabilityGroup: (group) =>
    request('/api/backlog/groups', { method: 'POST', body: JSON.stringify(group) }),
  updateCapabilityGroup: (id, patch) =>
    request(`/api/backlog/groups/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  // QA — scenarios, steps, runs, defects
  getScenarios: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return request(`/api/qa/scenarios${qs ? `?${qs}` : ''}`);
  },
  getScenario: (id) => request(`/api/qa/scenarios/${id}`),
  createScenario: (scenario) =>
    request('/api/qa/scenarios', { method: 'POST', body: JSON.stringify(scenario) }),
  updateScenario: (id, patch) =>
    request(`/api/qa/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteScenario: (id) =>
    request(`/api/qa/scenarios/${id}`, { method: 'DELETE' }),
  addStep: (scenarioId, step) =>
    request(`/api/qa/scenarios/${scenarioId}/steps`, { method: 'POST', body: JSON.stringify(step) }),
  updateStep: (id, patch) =>
    request(`/api/qa/steps/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteStep: (id) =>
    request(`/api/qa/steps/${id}`, { method: 'DELETE' }),
  logRun: (run) =>
    request('/api/qa/runs', { method: 'POST', body: JSON.stringify(run) }),
  getRuns: (scenarioId) => {
    const qs = scenarioId ? `?scenarioId=${scenarioId}` : '';
    return request(`/api/qa/runs${qs}`);
  },
  getRun: (id) => request(`/api/qa/runs/${id}`),
  getDefects: () => request('/api/qa/defects'),

  // Career Master (admin-only CRUD; getCareerMaster is the public redacted read)
  getCareerMaster: () => request('/api/career/master'),
  getCareerCatalogs: () => request('/api/career/catalogs'),
  seedCareerMaster: () => request('/api/career/seed', { method: 'POST' }),
  listCareerJobs: () => request('/api/career/jobs'),
  createCareerJob: (item) => request('/api/career/jobs', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerJob: (id, patch) => request(`/api/career/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerJob: (id) => request(`/api/career/jobs/${id}`, { method: 'DELETE' }),
  listCareerSkills: () => request('/api/career/skills'),
  createCareerSkill: (item) => request('/api/career/skills', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerSkill: (id, patch) => request(`/api/career/skills/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerSkill: (id) => request(`/api/career/skills/${id}`, { method: 'DELETE' }),
  listCareerTools: () => request('/api/career/tools'),
  createCareerTool: (item) => request('/api/career/tools', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerTool: (id, patch) => request(`/api/career/tools/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerTool: (id) => request(`/api/career/tools/${id}`, { method: 'DELETE' }),
  listCareerEngagements: () => request('/api/career/engagements'),
  createCareerEngagement: (item) => request('/api/career/engagements', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerEngagement: (id, patch) => request(`/api/career/engagements/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerEngagement: (id) => request(`/api/career/engagements/${id}`, { method: 'DELETE' }),
  listCareerDomains: () => request('/api/career/domains'),
  createCareerDomain: (item) => request('/api/career/domains', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerDomain: (id, patch) => request(`/api/career/domains/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerDomain: (id) => request(`/api/career/domains/${id}`, { method: 'DELETE' }),
  listCareerCertifications: () => request('/api/career/certifications'),
  createCareerCertification: (item) => request('/api/career/certifications', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerCertification: (id, patch) => request(`/api/career/certifications/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerCertification: (id) => request(`/api/career/certifications/${id}`, { method: 'DELETE' }),
  listCareerDeals: () => request('/api/career/deals'),
  createCareerDeal: (item) => request('/api/career/deals', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerDeal: (id, patch) => request(`/api/career/deals/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerDeal: (id) => request(`/api/career/deals/${id}`, { method: 'DELETE' }),
  listCareerMetaOptions: () => request('/api/career/meta-options'),
  createCareerMetaOption: (item) => request('/api/career/meta-options', { method: 'POST', body: JSON.stringify(item) }),
  updateCareerMetaOption: (id, patch) => request(`/api/career/meta-options/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCareerMetaOption: (id) => request(`/api/career/meta-options/${id}`, { method: 'DELETE' }),
  listCareerIntakeDocuments: () => request('/api/career/intake-documents'),
  listCareerIntakeRuns: () => request('/api/career/intake-runs'),
  createCareerIntakeRun: (body) =>
    request('/api/career/intake-runs', { method: 'POST', body: JSON.stringify(body) }),
  runCareerIntakeAnalysis: (id) =>
    request(`/api/career/intake-runs/${id}/run`, { method: 'POST', body: '{}' }),
  syncCareerSiteMetadata: (body = {}) =>
    request('/api/career/sync-site-metadata', { method: 'POST', body: JSON.stringify(body) }),
  uploadCareerIntakeDocument: async (formData) => {
    const res = await fetch('/api/career/intake-documents', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error(body?.error || `Request failed: ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  },

  // Phase 1 semantic import / resume analysis (2026-07-27) — download is a
  // raw blob fetch (not JSON), the two upload calls share uploadCareerIntakeDocument's
  // formData-POST pattern above, commit is a plain JSON POST.
  downloadCareerSemanticTemplate: async () => {
    const res = await fetch('/api/career/semantic-template', { credentials: 'include' });
    if (res.status === 404) { const e = new Error('not_built'); e.status = 404; throw e; }
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.blob();
  },
  importCareerSemanticWorkbook: async (formData) => {
    const res = await fetch('/api/career/semantic-import', { method: 'POST', credentials: 'include', body: formData });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(body?.error || `Request failed: ${res.status}`); e.status = res.status; throw e; }
    return body;
  },
  analyzeCareerResume: async (formData) => {
    const res = await fetch('/api/career/resume-analysis', { method: 'POST', credentials: 'include', body: formData });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(body?.error || `Request failed: ${res.status}`); e.status = res.status; throw e; }
    return body;
  },
  commitCareerMappings: (entries, source) =>
    request('/api/career/mappings/commit', { method: 'POST', body: JSON.stringify({ entries, source }) }),

  // Admin nav structure (data-driven AdminShell)
  getAdminNav: () => request('/api/config/admin-nav'),
  updateAdminNav: (nav) =>
    request('/api/config/admin-nav', { method: 'PUT', body: JSON.stringify(nav) }),

  // Page type registry — platform-wide "New Page" taxonomy. Admin can read +
  // write; members get a read-only view via the mirrored member-config route.
  getPageTypes: () => request('/api/config/page-types'),
  getMemberPageTypes: () => request('/api/member-config/page-types'),
  updatePageTypes: (types) =>
    request('/api/config/page-types', { method: 'PUT', body: JSON.stringify(types) }),

  // Password reset + email recovery (both always return 200 to prevent
  // enumeration; UI just shows a generic "check your email" success state).
  // recaptchaToken comes from getRecaptchaToken(action) in lib/recaptcha.js
  // and is null when no site key is configured (server treats null as a
  // pass-through).
  requestPasswordReset: (email, recaptchaToken) =>
    request('/api/auth/reset-request', { method: 'POST', body: JSON.stringify({ email, recaptchaToken }) }),
  confirmPasswordReset: (token, password) =>
    request('/api/auth/reset-confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
  recoverEmail: (phone, recaptchaToken) =>
    request('/api/auth/email-recover', { method: 'POST', body: JSON.stringify({ phone, recaptchaToken }) }),

  // Commerce — SMB self-service deliverable packages + sample onboarding
  getCommerceProducts: () => request('/api/commerce/products'),
  getMyCommerceAccess: () => request('/api/commerce/my-access'),
  commerceCheckout: (deliverablePackageId, purchaseKind, orgId) =>
    request('/api/commerce/checkout', { method: 'POST', body: JSON.stringify({ deliverablePackageId, purchaseKind, orgId }) }),
  requestCustomScoping: (deliverablePackageId, notes) =>
    request('/api/commerce/request-custom-scoping', { method: 'POST', body: JSON.stringify({ deliverablePackageId, notes }) }),
  submitOnboardingRun: (productId, answers) =>
    request('/api/commerce/onboarding-runs', { method: 'POST', body: JSON.stringify({ productId, answers }) }),
  getMyOnboardingRuns: () => request('/api/commerce/onboarding-runs'),
  startMessageBetsy: () => request('/api/commerce/message-betsy/start', { method: 'POST' }),

  // Beta product feedback loop
  submitFeedback: (productId, category, message) =>
    request('/api/feedback', { method: 'POST', body: JSON.stringify({ productId, category, message }) }),
  getMyFeedback: () => request('/api/feedback/mine'),
  upvoteFeedback: (id) => request(`/api/feedback/${id}/upvote`, { method: 'POST' }),
  getFeedbackQueue: () => request('/api/feedback'),
  updateFeedback: (id, patch) => request(`/api/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  routeFeedback: (id) => request(`/api/feedback/${id}/route`, { method: 'POST' }),
  getFeedbackCategoryWeights: () => request('/api/feedback/category-weights'),
  setFeedbackCategoryWeight: (category, weight) =>
    request(`/api/feedback/category-weights/${category}`, { method: 'PATCH', body: JSON.stringify({ weight }) }),
  getFeedbackAdvisors: () => request('/api/feedback/advisors'),
  addFeedbackAdvisor: (userId, note) =>
    request('/api/feedback/advisors', { method: 'POST', body: JSON.stringify({ userId, note }) }),
  removeFeedbackAdvisor: (userId) => request(`/api/feedback/advisors/${userId}`, { method: 'DELETE' }),

  // OAuth connections (used by Command Center + Profile Hub integrations)
  getOAuthConnections: () => request('/api/oauth/connections'),

  // EIDOS Operating Model — global/org-scoped config for the DSM engine
  // built on top of journey_data_rods. Most resources are keyed by a human
  // business key (not a numeric id), upserted via PUT — see
  // docs/eidos-operating-model-playbook.md.
  listEidosRodTypes: () => request('/api/eidos/rod-types'),
  saveEidosRodType: (id, item) => request(`/api/eidos/rod-types/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosRodType: (id) => request(`/api/eidos/rod-types/${id}`, { method: 'DELETE' }),

  listEidosPorts: (orgId) => request(`/api/eidos/ports${orgId ? `?orgId=${orgId}` : ''}`),
  saveEidosPort: (key, item) => request(`/api/eidos/ports/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosPort: (key, orgId) => request(`/api/eidos/ports/${key}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),

  listEidosMolecules: () => request('/api/journey-rods/molecules'),
  saveEidosMolecule: (key, item) => request(`/api/journey-rods/molecules/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  listEidosClusters: () => request('/api/journey-rods/clusters'),
  saveEidosCluster: (key, item) => request(`/api/journey-rods/clusters/${key}`, { method: 'PUT', body: JSON.stringify(item) }),

  listEidosAffinityRules: (orgId) => request(`/api/eidos/affinity-rules${orgId ? `?orgId=${orgId}` : ''}`),
  saveEidosAffinityRule: (clusterKey, moleculeKey, item) =>
    request(`/api/eidos/affinity-rules/${clusterKey}/${moleculeKey}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosAffinityRule: (clusterKey, moleculeKey, orgId) =>
    request(`/api/eidos/affinity-rules/${clusterKey}/${moleculeKey}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),

  listEidosScenarios: () => request('/api/journey-rods/scenarios'),
  saveEidosScenario: (key, item) => request(`/api/journey-rods/scenarios/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  listEidosGateDefinitions: () => request('/api/journey-rods/gate-definitions'),
  saveEidosGateDefinition: (scenarioKey, stageKey, item) =>
    request(`/api/journey-rods/scenarios/${scenarioKey}/gates/${stageKey}`, { method: 'PUT', body: JSON.stringify(item) }),
  getMyJourneyRods: () => request('/api/journey-rods/me'),
  getJourneyCatalog: () => request('/api/journey-rods/catalog'),
  createJourneyRod: (item) => request('/api/journey-rods', { method: 'POST', body: JSON.stringify(item) }),
  getJourneyRod: (rodId) => request(`/api/journey-rods/${rodId}`),
  saveJourneyEvidence: (rodId, item) =>
    request(`/api/journey-rods/${rodId}/evidence`, { method: 'POST', body: JSON.stringify(item) }),

  getEidosSettlementStates: (rodId) => request(`/api/eidos/settlement-states/${rodId}`),
  computeEidosSettlement: (rodId, moleculeKey) =>
    request(`/api/eidos/settlement-states/${rodId}/compute`, { method: 'POST', body: JSON.stringify({ moleculeKey }) }),

  listEidosAccountingPolicies: (orgId) => request(`/api/eidos/accounting-policies${orgId ? `?orgId=${orgId}` : ''}`),
  saveEidosAccountingPolicy: (key, item) => request(`/api/eidos/accounting-policies/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosAccountingPolicy: (key, orgId) => request(`/api/eidos/accounting-policies/${key}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),

  listEidosGlAccounts: (orgId) => request(`/api/eidos/gl-accounts${orgId ? `?orgId=${orgId}` : ''}`),
  saveEidosGlAccount: (key, item) => request(`/api/eidos/gl-accounts/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosGlAccount: (key, orgId) => request(`/api/eidos/gl-accounts/${key}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),

  listEidosAccountingTopologies: (orgId) => request(`/api/eidos/accounting-topologies${orgId ? `?orgId=${orgId}` : ''}`),
  saveEidosAccountingTopology: (key, item) => request(`/api/eidos/accounting-topologies/${key}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteEidosAccountingTopology: (key, orgId) => request(`/api/eidos/accounting-topologies/${key}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),

  listEidosJournalEntries: (orgId) => request(`/api/eidos/journal-entries${orgId ? `?orgId=${orgId}` : ''}`),
  getEidosJournalEntry: (id) => request(`/api/eidos/journal-entries/${id}`),
  createEidosJournalEntry: (item) => request('/api/eidos/journal-entries', { method: 'POST', body: JSON.stringify(item) }),

  getEidosReciprocalComparisons: (rodId) => request(`/api/eidos/reciprocal/comparisons/${rodId}`),
  getEidosDivergences: (rodId) => request(`/api/eidos/reciprocal/divergences/${rodId}`),
  computeEidosDivergence: (rodIdA, rodIdB) =>
    request('/api/eidos/reciprocal/divergences/compute', { method: 'POST', body: JSON.stringify({ rodIdA, rodIdB }) }),

  getEidosPendingDecisions: () => request('/api/journey-rods/decisions/pending'),
  resolveEidosDecision: (id, status, notes) =>
    request(`/api/journey-rods/decisions/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, notes }) }),

  getLonetreeMvpSummary: () => request('/api/lonetree-mvp/summary'),
  getLonetreeMvpReconciliation: () => request('/api/lonetree-mvp/reconciliation'),
  getLonetreeMvpFundEconomics: () => request('/api/lonetree-mvp/fund-economics'),
  getLonetreeMvpSignals: () => request('/api/lonetree-mvp/signals'),
  getLonetreeMvpHypotheses: () => request('/api/lonetree-mvp/hypotheses'),
  getLonetreeMvpValueCreation: () => request('/api/lonetree-mvp/value-creation'),
  advanceLonetreeMvpInitiative: (initiativeId) => request(`/api/lonetree-mvp/value-creation/${encodeURIComponent(initiativeId)}/advance`, { method: 'PATCH' }),
  getLonetreeMvpTheses: () => request('/api/lonetree-mvp/theses'),
  getLonetreeMvpTraceMetric: (metric) => request(`/api/lonetree-mvp/trace/${encodeURIComponent(metric)}`),
  getLonetreeMvpTraceEvDrivers: () => request('/api/lonetree-mvp/trace-ev-drivers'),
  getLonetreeMvpDemonstration: (signalId) => request(`/api/lonetree-mvp/demonstration${signalId ? `?signalId=${encodeURIComponent(signalId)}` : ''}`),

  getCareerAgentHub: () => request('/api/career-agents/agent-hub'),
  listCareerOpportunities: () => request('/api/career-agents/opportunities'),
  createCareerOpportunity: (body) => request('/api/career-agents/opportunities', { method: 'POST', body: JSON.stringify(body) }),
  scoreCareerOpportunity: (id, body) => request(`/api/career-agents/opportunities/${id}/scores`, { method: 'POST', body: JSON.stringify(body) }),
  runCareerResearch: () => request('/api/career-agents/research', { method: 'POST' }),
  generateResumeForOpportunity: (id, body) => request(`/api/career-agents/opportunities/${id}/generate-resume`, { method: 'POST', body: JSON.stringify(body || {}) }),
  approveResumeForOpportunity: (id, body) => request(`/api/career-agents/opportunities/${id}/resume-outputs`, { method: 'POST', body: JSON.stringify(body) }),
  listResumeOutputsForOpportunity: (id) => request(`/api/career-agents/opportunities/${id}/resume-outputs`),
  generateResumeQueue: (limit) => request('/api/career-agents/generate-resume-queue', { method: 'POST', body: JSON.stringify({ limit }) }),
  importCareerPipelineWorkbook: async (formData) => {
    const res = await fetch('/api/career-agents/import', { method: 'POST', credentials: 'include', body: formData });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(body?.error || `Request failed: ${res.status}`); e.status = res.status; throw e; }
    return body;
  },

  getCommercialAgentHub: () => request('/api/commercial-opportunities/agent-hub'),
  listCommercialOpportunities: () => request('/api/commercial-opportunities/opportunities'),
  createCommercialOpportunity: (body) => request('/api/commercial-opportunities/opportunities', { method: 'POST', body: JSON.stringify(body) }),
  scoreCommercialOpportunity: (id, body) => request(`/api/commercial-opportunities/opportunities/${id}/scores`, { method: 'POST', body: JSON.stringify(body) }),

  getPublicationAgentHub: (pipeline) => request(`/api/publication-pipelines/agent-hub?pipeline=${encodeURIComponent(pipeline)}`),
  listPublicationItems: (appId) => request(`/api/publication-pipelines/items?appId=${encodeURIComponent(appId)}`),
  getPublicationSchedule: (agentDefinitionId) => request(`/api/publication-pipelines/schedule?agentDefinitionId=${agentDefinitionId}`),
  savePublicationSchedule: (body) => request('/api/publication-pipelines/schedule', { method: 'POST', body: JSON.stringify(body) }),
};
