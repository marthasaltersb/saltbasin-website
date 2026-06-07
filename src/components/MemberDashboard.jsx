// Member dashboard.
//
// Members get the exact same admin shell Betsy uses for the Salt Basin
// platform site — multi-page CMS, sidebar + editor + preview, draft / publish
// workflow, and a config panel with brand colors, social handles, Net Works
// home-banner opt-in, and a BYO Anthropic key slot for the upcoming Config
// Agent. The only thing scoped out of the member view is anything that would
// expose other tenants: Leads + Net Works tabs are admin-only.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminShell from './admin/AdminShell.jsx';

export default function MemberDashboard() {
  const nav = useNavigate();

  useEffect(() => {
    // If the user lost their session or is actually an admin, send them to
    // the right destination. AdminShell will still gate via /api/auth/me
    // (it runs through RequireMember below), but we redirect proactively to
    // avoid a flash of the wrong UI.
    api
      .me()
      .then(({ user }) => {
        if (!user) return nav('/login', { replace: true });
        if (user.role === 'admin') return nav('/admin', { replace: true });
      })
      .catch(() => nav('/login', { replace: true }));
  }, [nav]);

  return <AdminShell scope="member" />;
}
