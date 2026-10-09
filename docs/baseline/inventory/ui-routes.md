# Frontend route inventory (src/App.jsx)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


37 `<Route>` declarations. Authorization is **not** declared at the router level — each screen performs its own session check (see module specs).

| Element ID | Path | Element | Resolves to | Lazy | Location |
|---|---|---|---|---|---|
| TE-UIR-login | `/login` | LoginPage | `src/components/admin/LoginPage.jsx` | yes | `src/App.jsx:80` |
| TE-UIR-admin-login | `/admin/login` | LoginPage | `src/components/admin/LoginPage.jsx` | yes | `src/App.jsx:81` |
| TE-UIR-test-login | `/test/login` | TestLoginRedirect | `src/components/admin/TestLoginRedirect.jsx` | yes | `src/App.jsx:82` |
| TE-UIR-reset-token | `/reset/:token` | ResetPasswordPage | `src/components/ResetPasswordPage.jsx` | yes | `src/App.jsx:83` |
| TE-UIR-first-login-password | `/first-login-password` | FirstLoginPasswordPage | `src/components/FirstLoginPasswordPage.jsx` | yes | `src/App.jsx:84` |
| TE-UIR-signup | `/signup` | SignupRoute | `src/App.jsx#SignupRoute` | no | `src/App.jsx:85` |
| TE-UIR-member | `/member` | MemberDashboard | `src/components/MemberDashboard.jsx` | yes | `src/App.jsx:96` |
| TE-UIR-world | `/world` | WorldShell | `src/components/WorldShell.jsx` | yes | `src/App.jsx:97` |
| TE-UIR-org-orgId | `/org/:orgId` | OrgPortal | `src/components/OrgPortal.jsx` | yes | `src/App.jsx:98` |
| TE-UIR-experience-reference | `/experience/reference` | ReferenceExperiencePage | `src/components/ReferenceExperiencePage.jsx` | yes | `src/App.jsx:99` |
| TE-UIR-u-slug | `/u/:slug` | PublicProfile | `src/components/PublicProfile.jsx` | yes | `src/App.jsx:100` |
| TE-UIR-u-slug | `/u/:slug/*` | PublicProfile | `src/components/PublicProfile.jsx` | yes | `src/App.jsx:101` |
| TE-UIR-lead-publicId | `/lead/:publicId` | LeadView | `src/components/LeadView.jsx` | yes | `src/App.jsx:102` |
| TE-UIR-data-notice | `/data-notice` | DataNotice | `src/components/DataNotice.jsx` | no | `src/App.jsx:103` |
| TE-UIR-privacy | `/privacy` | PrivacyPolicy | `src/components/PrivacyPolicy.jsx` | yes | `src/App.jsx:104` |
| TE-UIR-terms | `/terms` | TermsOfService | `src/components/TermsOfService.jsx` | yes | `src/App.jsx:105` |
| TE-UIR-output-resume | `/output/resume` | ResumeOutput | `src/components/Output.jsx#ResumeOutput` | yes | `src/App.jsx:106` |
| TE-UIR-output-case-study-slug | `/output/case-study/:slug` | CaseStudyOutput | `src/components/Output.jsx#CaseStudyOutput` | yes | `src/App.jsx:107` |
| TE-UIR-output-proposal-type | `/output/proposal/:type` | ProposalOutput | `src/components/Output.jsx#ProposalOutput` | yes | `src/App.jsx:108` |
| TE-UIR-output-one-pager | `/output/one-pager` | OnePagerOutput | `src/components/Output.jsx#OnePagerOutput` | yes | `src/App.jsx:109` |
| TE-UIR-output-build-summary | `/output/build-summary` | BuildSummaryOutput | `src/components/Output.jsx#BuildSummaryOutput` | yes | `src/App.jsx:110` |
| TE-UIR-output-tech-stack | `/output/tech-stack` | TechStackOutput | `src/components/Output.jsx#TechStackOutput` | yes | `src/App.jsx:111` |
| TE-UIR-output-product-one-pager | `/output/product-one-pager` | ProductOnePagerOutput | `src/components/Output.jsx#ProductOnePagerOutput` | yes | `src/App.jsx:112` |
| TE-UIR-output-patch-notes | `/output/patch-notes` | PatchNotesOutput | `src/components/Output.jsx#PatchNotesOutput` | yes | `src/App.jsx:113` |
| TE-UIR-output-domains | `/output/domains` | DomainsOutput | `src/components/Output.jsx#DomainsOutput` | yes | `src/App.jsx:114` |
| TE-UIR-output-portfolio-appendix | `/output/portfolio-appendix` | PortfolioAppendixOutput | `src/components/Output.jsx#PortfolioAppendixOutput` | yes | `src/App.jsx:115` |
| TE-UIR-output-case-study-portfolio | `/output/case-study-portfolio` | CareerCaseStudyPortfolioOutput | `src/components/Output.jsx#CareerCaseStudyPortfolioOutput` | yes | `src/App.jsx:116` |
| TE-UIR-output-career-master-database | `/output/career-master-database` | CareerMasterDatabaseOutput | `src/components/Output.jsx#CareerMasterDatabaseOutput` | yes | `src/App.jsx:117` |
| TE-UIR-output-portfolio | `/output/portfolio` | CareerPortfolioHubOutput | `src/components/Output.jsx#CareerPortfolioHubOutput` | yes | `src/App.jsx:118` |
| TE-UIR-output-resume-portfolio | `/output/resume-portfolio` | ResumePortfolioOutput | `src/components/Output.jsx#ResumePortfolioOutput` | yes | `src/App.jsx:119` |
| TE-UIR-output-full-portfolio | `/output/full-portfolio` | CareerFullPortfolioOutput | `src/components/Output.jsx#CareerFullPortfolioOutput` | yes | `src/App.jsx:120` |
| TE-UIR-output-strategic-operator | `/output/strategic-operator` | StrategicOperatorOutput | `src/components/Output.jsx#StrategicOperatorOutput` | yes | `src/App.jsx:121` |
| TE-UIR-output-methodology | `/output/methodology` | MethodologyOutput | `src/components/Output.jsx#MethodologyOutput` | yes | `src/App.jsx:122` |
| TE-UIR-output-l2r-model | `/output/l2r-model` | L2RModelOutput | `src/components/Output.jsx#L2RModelOutput` | yes | `src/App.jsx:123` |
| TE-UIR-output-business-definition-experience | `/output/business-definition-experience` | BusinessDefinitionExperience | `src/components/BusinessDefinitionExperience.jsx` | yes | `src/App.jsx:124` |
| TE-UIR-admin | `/admin/*` | MemberDashboard | `src/components/MemberDashboard.jsx` | yes | `src/App.jsx:127` |
| TE-UIR-root | `/*` | PublicRoute | `src/App.jsx#PublicRoute` | no | `src/App.jsx:128` |
