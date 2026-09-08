# Current-State Specification — Pending

**Status: pending structured stub.** This is the largest document in the program and is deliberately not filled with inferred content ahead of the deep, per-file inspection the governing objective requires ("code presence does not establish working behavior"; "a missing search result does not prove absence unless the relevant scope was inspected"). What follows is the confirmed module boundary list (real, from directory structure — `01-source-register.md` SRC-CODE-01 through SRC-CODE-14) and the table schema each module's entries will use once populated.

## Required row schema (per the objective)

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|

- **Implementation state** ∈ {not located, placeholder/mock, partial, implemented, apparently obsolete}
- **Verification state** ∈ {unverified, static evidence only, automated checks passed, user-journey checks passed, failed}
- IDs use prefix `REQ-` (or `DEF-` for pure definitions with no behavior), stable across revisions of this document.

## Confirmed module boundaries (from directory structure — not yet content-inspected)

Per `CLAUDE.md`'s three-layer platform model, plus what the directory listings actually show:

| Candidate module | Backend evidence | Frontend evidence | Stage 2 priority |
|---|---|---|---|
| Admin CMS (Betsy's site, `saltbasin.net`) | `server/routes/site.js`, `config.js`, `configEnvelopes.js` | `src/components/PublicSite.jsx`, `src/components/admin/**` | Unset — awaiting your priority |
| Member public sites (`/u/:slug`) | `server/routes/memberSite.js`, `memberConfig.js` | `src/components/PublicProfile.jsx` | Unset |
| Member admin dashboard (`/member`) | `server/routes/memberEntitlements.js`, `memberAccess.js`, `memberFinancial.js`, `memberTemplates.js` | `src/components/MemberDashboard.jsx` | Unset |
| Auth / identity | `server/routes/auth.js`, `server/auth.js` | `src/components/FirstLoginPasswordPage.jsx`, `ResetPasswordPage.jsx`, `SignupPage.jsx` | Unset |
| Career pipeline (legacy CRUD + Channel Rod + Placement Agents) | `server/routes/careerMaster.js`, `careerPlacementAgents.js`, `careerReconciliation.js`, `careerReasoningAdmin.js`; `server/lib/careerAtom*.js`, `careerOpportunityRollups.js`, `careerResearchAgent.js`, `careerVerificationAgent.js` | `src/components/blocks/CareerProspectBlocks.jsx`, `src/components/admin/CareerPlacementAgentsPanel.jsx` | Unset |
| Commercial opportunity pipeline | `server/routes/commercialOpportunities.js`; `server/lib/commercialOpportunityRollups.js` | `src/components/admin/CommercialOpportunityPanel.jsx` | Unset |
| OAuth / external integrations (14 providers) | `server/routes/oauth.js`; `server/lib/oauthProviders.js`, `crypto.js` | Not yet located | Unset |
| Leads / CRM | `server/routes/leads.js`, `leadIntegrations.js` | Not yet located | Unset |
| BestyStaff agent | `server/routes/bestyStaff.js`, `bestyStaffCareer.js` | `src/components/BestyStaffContactSection.jsx` | Unset |
| Journey Rod / Channel architecture (EIDOS, Tributary, Current, Atom/Molecule) | `server/routes/journeyRods.js`, `eidos.js`, `genesis.js`, `nrm.js`; `server/lib/journeyRods.js`, `tributaryRegistry.js`, `currentRegistry.js`, `molecule.js`, `eidosBonding.js` | `src/components/SpatialJourneyWorld.jsx`, `RiverSystemMap.jsx`, `OpportunityAgentOrbitWorld.jsx`, `MemberCrystalOrbit.jsx` | Unset |
| 3D world/crystal rendering system | Not applicable | `src/components/SaltBasinCrystal.jsx`, `CrystalOfficeScene.jsx`, `CrystalRoomScene.jsx`, `CrystalSolarSystem.jsx`, `CrystalWorldCityScene.jsx`, `WorldShell.jsx`; `src/lib/crystalGeometry.js` (per `CLAUDE.md`, the single shared crystal design system — "never fork a variant locally") | Unset |
| Output/print routes | `server/routes/resumeOutputs.js`; per `CLAUDE.md` `/output/*` is unauthenticated, print-isolated | `src/components/Output.jsx` | Unset |
| Org Portal | `server/routes/orgPortal.js` | `src/components/OrgPortal.jsx` | Unset |
| Governance / QA / metric intelligence | `server/routes/governance.js`, `qa.js`, `metricIntelligence.js`, `l2rDiagnostics.js`, `fieldAudit.js` | Not yet located | Unset |

This list itself is not guaranteed exhaustive — it is what the current directory listing supports, not a content-verified module map. Some of these route files may turn out to be thin/deprecated/placeholder; that determination is Stage 2 work, not asserted here.

## Next step to populate this document

Tell me which module(s) to inventory first (or confirm breadth-first order), then each gets its own linked file (per the objective's instruction to split large tables into linked files rather than truncate), e.g. `03a-admin-cms.md`, `03b-member-sites.md`, etc., each following the row schema above with real file/line evidence.
