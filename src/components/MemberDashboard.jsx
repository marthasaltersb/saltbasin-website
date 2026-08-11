// Member dashboard.
//
// Members get the exact same admin shell Betsy uses for the Salt Basin
// platform site — multi-page CMS, sidebar + editor + preview, draft / publish
// workflow, and a config panel with brand colors, social handles, Net Works
// home-banner opt-in, and a BYO Anthropic key slot for the upcoming Config
// Agent. The only thing scoped out of the member view is anything that would
// expose other tenants: Leads + Net Works tabs are admin-only.

import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminShell from './admin/AdminShell.jsx';
import MemberCrystalOrbit from './MemberCrystalOrbit.jsx';
import CareerConsentGate from './admin/CareerConsentGate.jsx';

export default function MemberDashboard() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Every Salt Basin identity also has a Member context. Admin users are
    // intentionally allowed to remain here so they can configure their own
    // founder/member profile without changing login identities.
    api
      .me()
      .then(({ user }) => {
        if (!user) return nav('/login', { replace: true });
        setUser(user);
      })
      .catch(() => nav('/login', { replace: true }));
  }, [nav]);

  if (!user) return null;
  if (user.mustChangePassword) return <CareerConsentGate><Navigate to="/first-login-password" replace /></CareerConsentGate>;
  if (params.get('workspace') === '1') {
    const orgId = params.get('org');
    const workspaceScope = orgId ? 'org-admin' : params.get('scope') === 'admin' && user.role === 'admin' ? 'admin' : 'member';
    return <CareerConsentGate><AdminShell scope={workspaceScope} orgId={orgId || null} /></CareerConsentGate>;
  }
  return <CareerConsentGate><MemberCrystalOrbit user={user} onOpenWorkspace={(tab, orgId, scope = 'member') => {
    const next = { workspace: '1', tab, scope };
    if (orgId) next.org = String(orgId);
    setParams(next);
  }} /></CareerConsentGate>;
}
