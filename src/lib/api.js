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
};
