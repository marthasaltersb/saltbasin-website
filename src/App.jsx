import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './lib/api.js';
import PublicSite from './components/PublicSite.jsx';
import LandingGate from './components/LandingGate.jsx';
import LoginPage from './components/admin/LoginPage.jsx';
import AdminShell from './components/admin/AdminShell.jsx';
import SignupPage from './components/SignupPage.jsx';
import MemberDashboard from './components/MemberDashboard.jsx';
import PublicProfile from './components/PublicProfile.jsx';
import LeadView from './components/LeadView.jsx';
import ResetPasswordPage from './components/ResetPasswordPage.jsx';
import DataNotice from './components/DataNotice.jsx';
import { ResumeOutput, CaseStudyOutput, DomainsOutput, ProposalOutput, OnePagerOutput, BuildSummaryOutput, TechStackOutput, ProductOnePagerOutput, PatchNotesOutput } from './components/Output.jsx';

function PublicRoute() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    api.landingStatus().then(setStatus).catch(() => setStatus({ enabled: false, unlocked: true }));
  }, []);
  if (!status) return null;
  if (status.enabled && !status.unlocked) {
    return <LandingGate status={status} onUnlocked={() => setStatus({ ...status, unlocked: true })} />;
  }
  return <PublicSite />;
}

function RequireAdmin({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    api.me().then(({ user }) => setState({ loading: false, user })).catch(() =>
      setState({ loading: false, user: null })
    );
  }, []);
  if (state.loading) return null;
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* /login is the canonical sign-in URL. /admin/login is kept as an alias
          for back-compat with any saved bookmarks / external links. Both render
          the same LoginPage — there is no "admin login" UI distinct from member
          login (the server figures out the role from the user record). */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/reset/:token" element={<ResetPasswordPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/member" element={<MemberDashboard />} />
      <Route path="/u/:slug" element={<PublicProfile />} />
      <Route path="/u/:slug/*" element={<PublicProfile />} />
      <Route path="/lead/:publicId" element={<LeadView />} />
      <Route path="/data-notice" element={<DataNotice />} />
      <Route path="/output/resume" element={<ResumeOutput />} />
      <Route path="/output/case-study/:slug" element={<CaseStudyOutput />} />
      <Route path="/output/proposal/:type" element={<ProposalOutput />} />
      <Route path="/output/one-pager" element={<OnePagerOutput />} />
      <Route path="/output/build-summary" element={<BuildSummaryOutput />} />
      <Route path="/output/tech-stack" element={<TechStackOutput />} />
      <Route path="/output/product-one-pager" element={<ProductOnePagerOutput />} />
      <Route path="/output/patch-notes" element={<PatchNotesOutput />} />
      <Route path="/output/domains" element={<DomainsOutput />} />
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      />
      <Route path="/*" element={<PublicRoute />} />
    </Routes>
  );
}
