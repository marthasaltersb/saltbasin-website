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

  // Admin nav structure (data-driven AdminShell)
  getAdminNav: () => request('/api/config/admin-nav'),
  updateAdminNav: (nav) =>
    request('/api/config/admin-nav', { method: 'PUT', body: JSON.stringify(nav) }),
};
