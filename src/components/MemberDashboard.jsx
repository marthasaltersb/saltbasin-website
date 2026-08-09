// Member dashboard.
//
// Members get the exact same admin shell Betsy uses for the Salt Basin
// platform site — multi-page CMS, sidebar + editor + preview, draft / publish
// workflow, and a config panel with brand colors, social handles, Net Works
// home-banner opt-in, and a BYO Anthropic key slot for the upcoming Config
// Agent. The only thing scoped out of the member view is anything that would
// expose other tenants: Leads + Net Works tabs are admin-only.

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminShell from './admin/AdminShell.jsx';
import MemberCrystalOrbit from './MemberCrystalOrbit.jsx';

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
  if (params.get('workspace') === '1') {
    const orgId = params.get('org');
    return <AdminShell scope={orgId ? 'org-admin' : 'member'} orgId={orgId || null} />;
  }
  return <MemberCrystalOrbit user={user} onOpenWorkspace={(tab, orgId) => {
    const next = { workspace: '1', tab };
    if (orgId) next.org = String(orgId);
    setParams(next);
  }} />;
}
