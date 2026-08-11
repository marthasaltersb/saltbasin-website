import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from './lib/api.js';
import PublicSite from './components/PublicSite.jsx';
import UxRuntimeAuditProbe from './components/UxRuntimeAuditProbe.jsx';
const LandingGate = lazy(() => import('./components/LandingGate.jsx'));
const LoginPage = lazy(() => import('./components/admin/LoginPage.jsx'));
const TestLoginRedirect = lazy(() => import('./components/admin/TestLoginRedirect.jsx'));
const MemberDashboard = lazy(() => import('./components/MemberDashboard.jsx'));
const PublicProfile = lazy(() => import('./components/PublicProfile.jsx'));
const LeadView = lazy(() => import('./components/LeadView.jsx'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage.jsx'));
const FirstLoginPasswordPage = lazy(() => import('./components/FirstLoginPasswordPage.jsx'));
const DataNotice = lazy(() => import('./components/DataNotice.jsx'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy.jsx'));
const TermsOfService = lazy(() => import('./components/TermsOfService.jsx'));
const BusinessDefinitionExperience = lazy(() => import('./components/BusinessDefinitionExperience.jsx'));
const OrgPortal = lazy(() => import('./components/OrgPortal.jsx'));
const ReferenceExperiencePage = lazy(() => import('./components/ReferenceExperiencePage.jsx'));

const lazyOutput = (name) => lazy(() =>
  import('./components/Output.jsx').then((module) => ({ default: module[name] }))
);
const ResumeOutput = lazyOutput('ResumeOutput');
const CaseStudyOutput = lazyOutput('CaseStudyOutput');
const DomainsOutput = lazyOutput('DomainsOutput');
const PortfolioAppendixOutput = lazyOutput('PortfolioAppendixOutput');
const CareerCaseStudyPortfolioOutput = lazyOutput('CareerCaseStudyPortfolioOutput');
const CareerMasterDatabaseOutput = lazyOutput('CareerMasterDatabaseOutput');
const CareerPortfolioHubOutput = lazyOutput('CareerPortfolioHubOutput');
const ResumePortfolioOutput = lazyOutput('ResumePortfolioOutput');
const CareerFullPortfolioOutput = lazyOutput('CareerFullPortfolioOutput');
const StrategicOperatorOutput = lazyOutput('StrategicOperatorOutput');
const ProposalOutput = lazyOutput('ProposalOutput');
const OnePagerOutput = lazyOutput('OnePagerOutput');
const BuildSummaryOutput = lazyOutput('BuildSummaryOutput');
const TechStackOutput = lazyOutput('TechStackOutput');
const ProductOnePagerOutput = lazyOutput('ProductOnePagerOutput');
const PatchNotesOutput = lazyOutput('PatchNotesOutput');
const MethodologyOutput = lazyOutput('MethodologyOutput');
const L2RModelOutput = lazyOutput('L2RModelOutput');

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
    <>
    <UxRuntimeAuditProbe />
    <Suspense fallback={<RouteLoader />}>
    <Routes>
      {/* /login is the canonical sign-in URL. /admin/login is kept as an alias
          for back-compat with any saved bookmarks / external links. Both render
          the same LoginPage — there is no "admin login" UI distinct from member
          login (the server figures out the role from the user record). */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/test/login" element={<TestLoginRedirect />} />
      <Route path="/reset/:token" element={<ResetPasswordPage />} />
      <Route path="/first-login-password" element={<FirstLoginPasswordPage />} />
      <Route path="/signup" element={<SignupRoute />} />
      {/* The World Shell (2026-08-07) is now the primary logged-in surface
          for both roles — /admin and /member render it directly instead of
          the flat AdminShell/MemberDashboard tab UI, so users never have to
          navigate to a separate /world URL to see it. Both those components
          still exist and still work — WorldShell's own "Classic Tools" tab
          mounts AdminShell inline as an escape hatch for modules that don't
          have an in-world view yet — they're just no longer what a bare
          /admin or /member hit shows by default. /world itself stays as a
          direct alias. */}
      <Route path="/member" element={<MemberDashboard />} />
      <Route path="/world" element={<MemberDashboard />} />
      <Route path="/org/:orgId" element={<OrgPortal />} />
      <Route path="/experience/reference" element={<ReferenceExperiencePage />} />
      <Route path="/u/:slug" element={<PublicProfile />} />
      <Route path="/u/:slug/*" element={<PublicProfile />} />
      <Route path="/lead/:publicId" element={<LeadView />} />
      <Route path="/data-notice" element={<DataNotice />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
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
      {/* WorldShell does its own auth check (api.me(), redirect to /login),
          the same self-contained pattern /member and /world already use —
          no RequireAdmin wrapper needed here anymore. */}
      <Route path="/admin/*" element={<MemberDashboard />} />
      <Route path="/*" element={<PublicRoute />} />
    </Routes>
    </Suspense>
    </>
  );
}

function RouteLoader() {
  return (
    <div className="sb-route-loader" role="status" aria-live="polite">
      Loading…
    </div>
  );
}
