import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from './lib/api.js';
import PublicSite from './components/PublicSite.jsx';
import LandingGate from './components/LandingGate.jsx';
import LoginPage from './components/admin/LoginPage.jsx';
import AdminShell from './components/admin/AdminShell.jsx';
import MemberDashboard from './components/MemberDashboard.jsx';
import PublicProfile from './components/PublicProfile.jsx';
import LeadView from './components/LeadView.jsx';
import ResetPasswordPage from './components/ResetPasswordPage.jsx';
import DataNotice from './components/DataNotice.jsx';
import BusinessDefinitionExperience from './components/BusinessDefinitionExperience.jsx';
import OrgPortal from './components/OrgPortal.jsx';
import { ResumeOutput, CaseStudyOutput, DomainsOutput, PortfolioAppendixOutput, CareerCaseStudyPortfolioOutput, CareerMasterDatabaseOutput, CareerPortfolioHubOutput, ResumePortfolioOutput, CareerFullPortfolioOutput, StrategicOperatorOutput, ProposalOutput, OnePagerOutput, BuildSummaryOutput, TechStackOutput, ProductOnePagerOutput, PatchNotesOutput, MethodologyOutput, L2RModelOutput } from './components/Output.jsx';

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

function SignupRoute() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // All sign-up traffic — including lead conversion — now starts with the
  // BestyStaff intake. A lead becomes a member through a conversation on
  // their own lead view (POST /api/leads/public/:publicId/convert), not a
  // standalone password-creation form — see LeadView.jsx's "Become a
  // member" prompt and bestyStaff.js's convert_lead_to_member tool.
  // SignupPage.jsx (the old fromLead form) is intentionally unreferenced
  // here now, not deleted, per the project's "flag, don't lose work" norm.
  const source = params.get('intakeSource') || 'networks-sign-up';
  return <Navigate to={`/?intakeSource=${encodeURIComponent(source)}#bestystaff`} replace />;
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
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/member" element={<MemberDashboard />} />
      <Route path="/org/:orgId" element={<OrgPortal />} />
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
      <Route path="/output/portfolio-appendix" element={<PortfolioAppendixOutput />} />
      <Route path="/output/case-study-portfolio" element={<CareerCaseStudyPortfolioOutput />} />
      <Route path="/output/career-master-database" element={<CareerMasterDatabaseOutput />} />
      <Route path="/output/portfolio" element={<CareerPortfolioHubOutput />} />
      <Route path="/output/resume-portfolio" element={<ResumePortfolioOutput />} />
      <Route path="/output/full-portfolio" element={<CareerFullPortfolioOutput />} />
      <Route path="/output/strategic-operator" element={<StrategicOperatorOutput />} />
      <Route path="/output/methodology" element={<MethodologyOutput />} />
      <Route path="/output/l2r-model" element={<L2RModelOutput />} />
      <Route path="/output/business-definition-experience" element={<BusinessDefinitionExperience />} />
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
