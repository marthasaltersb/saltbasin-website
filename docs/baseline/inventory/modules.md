# First-party module inventory (src/, server/)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


424 files, 146286 lines (tests excluded — see tests.md). "Imported by" counts static relative imports and dynamic `import()` across src/ and server/; **0 means no static importer was found** (candidate dead code, an entry point, or loaded another way — verify before treating as obsolete).

| Directory | Files | Lines | Files with 0 importers |
|---|---|---|---|
| `server/audit.js` | 1 | 121 | 0 |
| `server/auth.js` | 1 | 219 | 0 |
| `server/data` | 16 | 45296 | 2 |
| `server/db.js` | 1 | 5918 | 0 |
| `server/index.js` | 1 | 334 | 1 |
| `server/lib/agentCadenceEnvelope.js` | 1 | 47 | 0 |
| `server/lib/agentContextRegistry.js` | 1 | 27 | 0 |
| `server/lib/agentDataPolicy.js` | 1 | 72 | 0 |
| `server/lib/agentDispatcher.js` | 1 | 100 | 0 |
| `server/lib/agentHubRunner.js` | 1 | 114 | 0 |
| `server/lib/agentLlmUsage.js` | 1 | 45 | 0 |
| `server/lib/agentRunGovernance.js` | 1 | 76 | 0 |
| `server/lib/agentStudioGovernance.js` | 1 | 71 | 0 |
| `server/lib/agents` | 4 | 667 | 0 |
| `server/lib/approvalGate.js` | 1 | 33 | 0 |
| `server/lib/audit.js` | 1 | 47 | 0 |
| `server/lib/autoQueueAgent.js` | 1 | 78 | 0 |
| `server/lib/backlogHistoryReconciler.js` | 1 | 102 | 0 |
| `server/lib/backlogIntelligenceSchema.js` | 1 | 109 | 0 |
| `server/lib/bestyStaffGateDefinitions.js` | 1 | 61 | 0 |
| `server/lib/careerAtomMigration.js` | 1 | 131 | 0 |
| `server/lib/careerAtomRegistry.js` | 1 | 175 | 0 |
| `server/lib/careerAtomRollups.js` | 1 | 151 | 0 |
| `server/lib/careerBondingEngine.js` | 1 | 113 | 0 |
| `server/lib/careerFileRetention.js` | 1 | 49 | 0 |
| `server/lib/careerOpportunityRollups.js` | 1 | 232 | 0 |
| `server/lib/careerOutreachRollups.js` | 1 | 95 | 0 |
| `server/lib/careerPipelineImport.js` | 1 | 127 | 0 |
| `server/lib/careerProficiencyRollups.js` | 1 | 89 | 0 |
| `server/lib/careerReasoningCompiler.js` | 1 | 77 | 0 |
| `server/lib/careerReconciliation.js` | 1 | 222 | 0 |
| `server/lib/careerResearchAgent.js` | 1 | 105 | 0 |
| `server/lib/careerResumeExtraction.js` | 1 | 216 | 0 |
| `server/lib/careerSemanticImport.js` | 1 | 89 | 0 |
| `server/lib/careerSemanticTemplate.js` | 1 | 134 | 0 |
| `server/lib/careerVerificationAgent.js` | 1 | 77 | 0 |
| `server/lib/codeAgentContext.js` | 1 | 87 | 0 |
| `server/lib/codeAgentRunner.js` | 1 | 103 | 0 |
| `server/lib/collaborationRegistry.js` | 1 | 41 | 0 |
| `server/lib/commercialOpportunityRollups.js` | 1 | 152 | 0 |
| `server/lib/configEnvelope.js` | 1 | 106 | 0 |
| `server/lib/consentRegistry.js` | 1 | 118 | 0 |
| `server/lib/contentAttachmentRetention.js` | 1 | 38 | 0 |
| `server/lib/contextCache.js` | 1 | 97 | 0 |
| `server/lib/coverLetterTargeting.js` | 1 | 76 | 0 |
| `server/lib/cronMatch.js` | 1 | 67 | 0 |
| `server/lib/crypto.js` | 1 | 36 | 0 |
| `server/lib/currentRegistry.js` | 1 | 82 | 0 |
| `server/lib/customerEntitlements.js` | 1 | 44 | 0 |
| `server/lib/customerMemory.js` | 1 | 43 | 0 |
| `server/lib/dataSourceRegistry.js` | 1 | 49 | 0 |
| `server/lib/documentAtomRegistry.js` | 1 | 133 | 0 |
| `server/lib/documentAtomSync.js` | 1 | 187 | 1 |
| `server/lib/documentStructureParser.js` | 1 | 315 | 1 |
| `server/lib/eidos.js` | 1 | 91 | 0 |
| `server/lib/eidosBonding.js` | 1 | 168 | 0 |
| `server/lib/email.js` | 1 | 445 | 0 |
| `server/lib/emailDomain.js` | 1 | 20 | 0 |
| `server/lib/feedbackScoring.js` | 1 | 23 | 0 |
| `server/lib/financialPolicyRegistry.js` | 1 | 75 | 0 |
| `server/lib/genesisCatalog.js` | 1 | 48 | 0 |
| `server/lib/hiringManagerResearchAgent.js` | 1 | 98 | 0 |
| `server/lib/interactiveAgentLoop.js` | 1 | 51 | 0 |
| `server/lib/journeyEvidenceHelpers.js` | 1 | 47 | 0 |
| `server/lib/journeyRods.js` | 1 | 396 | 0 |
| `server/lib/l2rDiagnosticEngagement.js` | 1 | 162 | 0 |
| `server/lib/l2rDiagnosticRegistry.js` | 1 | 909 | 0 |
| `server/lib/lineage.js` | 1 | 130 | 0 |
| `server/lib/lonetreeDemoRegistry.js` | 1 | 137 | 0 |
| `server/lib/lonetreeReconciliation.js` | 1 | 391 | 0 |
| `server/lib/memberAccess.js` | 1 | 133 | 0 |
| `server/lib/memberDbConnections.js` | 1 | 48 | 0 |
| `server/lib/memberProvisioning.js` | 1 | 150 | 0 |
| `server/lib/memberStaffTemplates.js` | 1 | 60 | 0 |
| `server/lib/memberVisibilityRegistry.js` | 1 | 39 | 0 |
| `server/lib/methodologyEnvelopes.js` | 1 | 259 | 1 |
| `server/lib/metricIntelligence.js` | 1 | 140 | 0 |
| `server/lib/molecule.js` | 1 | 151 | 0 |
| `server/lib/notificationEngine.js` | 1 | 73 | 0 |
| `server/lib/oauthProviders.js` | 1 | 453 | 0 |
| `server/lib/opportunityPipelineRegistry.js` | 1 | 398 | 0 |
| `server/lib/orgDocumentProjection.js` | 1 | 42 | 0 |
| `server/lib/organizationSso.js` | 1 | 43 | 0 |
| `server/lib/outputRendering.js` | 1 | 93 | 0 |
| `server/lib/outreachDraftAgent.js` | 1 | 76 | 0 |
| `server/lib/passwordPolicy.js` | 1 | 26 | 0 |
| `server/lib/passwordPolicyRules.js` | 1 | 11 | 0 |
| `server/lib/proposalDocumentProjection.js` | 1 | 109 | 0 |
| `server/lib/proposalExperienceRegistry.js` | 1 | 220 | 0 |
| `server/lib/proposalOperations.js` | 1 | 36 | 0 |
| `server/lib/provisioningPolicyRegistry.js` | 1 | 113 | 0 |
| `server/lib/publicationFlowEnvelopes.js` | 1 | 62 | 1 |
| `server/lib/qualificationGateCheckers.js` | 1 | 70 | 0 |
| `server/lib/rateLimit.js` | 1 | 35 | 0 |
| `server/lib/recaptcha.js` | 1 | 61 | 0 |
| `server/lib/resumePresets.js` | 1 | 68 | 0 |
| `server/lib/resumeProjection.js` | 1 | 132 | 0 |
| `server/lib/resumeTargeting.js` | 1 | 125 | 0 |
| `server/lib/riverbedRegistry.js` | 1 | 47 | 1 |
| `server/lib/rollupMetrics.js` | 1 | 223 | 0 |
| `server/lib/scenarioGenerator.js` | 1 | 57 | 0 |
| `server/lib/scenarioLibraryApply.js` | 1 | 158 | 0 |
| `server/lib/seo.js` | 1 | 68 | 0 |
| `server/lib/seoMiddleware.js` | 1 | 99 | 0 |
| `server/lib/simplePdf.js` | 1 | 21 | 0 |
| `server/lib/snapshot.js` | 1 | 122 | 0 |
| `server/lib/totp.js` | 1 | 42 | 0 |
| `server/lib/trajectory.js` | 1 | 223 | 1 |
| `server/lib/tributaryRegistry.js` | 1 | 392 | 0 |
| `server/lib/usageTracking.js` | 1 | 62 | 0 |
| `server/lib/vectorize.js` | 1 | 179 | 1 |
| `server/lib/websiteIntelligence` | 2 | 318 | 2 |
| `server/lib/worldVariantSeedAgent.js` | 1 | 95 | 0 |
| `server/lib/zipStore.js` | 1 | 39 | 0 |
| `server/routes` | 65 | 15995 | 1 |
| `server/scripts` | 9 | 697 | 9 |
| `src/App.jsx` | 1 | 142 | 0 |
| `src/components` | 46 | 25608 | 3 |
| `src/components/admin` | 79 | 25803 | 3 |
| `src/config` | 30 | 2867 | 4 |
| `src/data` | 11 | 2038 | 1 |
| `src/lib` | 45 | 7086 | 3 |
| `src/main.jsx` | 1 | 12 | 1 |
| `src/scenarios` | 4 | 83 | 2 |

## `server/audit.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-audit | `server/audit.js` | 121 | 1 | writeAudit, snapshotRow, diffRows | Audit log helper. Every mutation on backlog + QA entities (and any future entity we choose to |

## `server/auth.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-auth | `server/auth.js` | 219 | 62 | createSession, destroySession, getUserFromCookie, login, changePassword, setAdminCookie, clearAdminCookie, isLandingUnlocked … +6 |  |

## `server/data`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-data-backlog-seed | `server/data/backlog/seed.js` | 1171 | 3 | backlogSeed, PROJECT_STARTED_AT | Seed data for the admin Backlog dashboard. Captures the major feature requirements built into saltbasin.net, |
| TE-SRV-data-career-seed | `server/data/career/seed.js` | 757 | 1 | careerMasterSeed | Seed data for the Career Master tables (career_jobs, career_skills, career_tools, career_engagements, career_domains). |
| TE-SRV-data-codeContextJourneyTests | `server/data/codeContextJourneyTests.js` | 55 | 1 | CODE_CONTEXT_JOURNEY_TESTS |  |
| TE-SRV-data-contributionMethodology | `server/data/contributionMethodology.js` | 419 | 1 | default; ARTIFACT, DERIVATION_RECORD, RETROACTIVE_SESSION_ANALYSIS, PER_BURST_SUPERVISION_WEIGHT, CONTRIBUTION_TYPES, RATE_CONFIGS_2026, OVERSIGHT_LEVELS, REDUCTION_MAP … +6 | Contribution Intelligence Methodology © 2026 Martha Elizabeth Salter - The Salter Influence LLC All Rights Reserved. |
| TE-SRV-data-contributionTaxonomy | `server/data/contributionTaxonomy.js` | 126 | 0 | default; TAXONOMY_VERSION, CONTRIBUTOR_TYPES, HUMAN_ORIENTED_CLASSES, AI_ORIENTED_CLASSES, SHARED_CONTEXT_DEPENDENT_CLASSES, CONTRIBUTION_TAXONOMY, tierForClass, TOOL_CLASS_MAP … +1 | Contribution Intelligence — Contributor Types & Classification Taxonomy (Phase 2 of the .claude/skills/salt-basin-contribution-intelligence build, §II/§III of r |
| TE-SRV-data-defaultMemberConfig | `server/data/defaultMemberConfig.js` | 137 | 2 | defaultMemberConfig | Default member-level config. Includes brand colors they can override on their own profile, social handles, opt-in for the Salt Basin home page Net Works banner, |
| TE-SRV-data-defaultMemberProfile | `server/data/defaultMemberProfile.js` | 81 | 3 | defaultMemberProfile | The starter content a brand-new member sees when they sign up. Same block shape as the main site so the public profile renderer can re-use the block library. |
| TE-SRV-data-defaultMemberSite | `server/data/defaultMemberSite.js` | 306 | 2 | defaultMemberSite | Default site a brand-new member sees when they sign up. Mirrors the shape of defaultSite.js (multi-page, sections with type/status/bg/fields) so the same admin  |
| TE-SRV-data-defaultSite | `server/data/defaultSite.js` | 834 | 4 | defaultSite, defaultConfig | Home page: the Salt Basin MRS "Product Experience" — fully config-driven via the block registry (src/components/blocks/ProductExperienceBlocks.jsx, MetadataMode |
| TE-SRV-data-genesisOverlapSeeds | `server/data/genesisOverlapSeeds.js` | 54 | 2 | genesisOverlapSeeds, GENESIS_OVERLAP_STATUSES, GENESIS_REVIEW_STATUSES | Deterministic first-pass bindings between the live Salt Basin implementation and the governed Genesis repositories. These are seed records, not runtime authorit |
| TE-SRV-data-l2rCapabilityHierarchySeed | `server/data/l2rCapabilityHierarchySeed.js` | 39065 | 2 | default; L2R_DOMAINS, SUB_CAPABILITY_CLUSTERS, CAPABILITY_ATOMS, QTR_REFERENCE_ATOMS, QTR_SCENARIOS | Lead-to-Revenue Capability Hierarchy + QTR Diagnostic Seed (Phase 1, 2026-08-09) Generated from two source workbooks Betsy supplied (not committed — original |
| TE-SRV-data-leadToRevenueModel | `server/data/leadToRevenueModel.js` | 506 | 0 | default; ARTIFACT, GTM_PATHS, GTM_NODES, LIFECYCLE_STAGES, CROSS_CUTTING, PLATFORM_CAPABILITY_MAP | Lead to Revenue Capability Model © 2026 Martha Elizabeth Salter - The Salter Influence LLC All Rights Reserved. |
| TE-SRV-data-memberTemplates | `server/data/memberTemplates.js` | 271 | 1 | memberTemplatesSeed | Curated starter templates for member operators. Each template is a complete starting point: brand kit (colors), suggested |
| TE-SRV-data-patchNotes | `server/data/patchNotes.js` | 1202 | 1 | patchNotes | Curated release log for Salt Basin Net Works. Each entry groups what shipped together, with the "voice" of release notes |
| TE-SRV-data-scenarioLibrary | `server/data/scenarioLibrary.js` | 268 | 1 | SCENARIO_LIBRARY, validateScenarioLibraryShape | The Scenario Library — declarative scenario + stage-gate definitions for the Channel Journey evaluation engine (server/lib/journeyRods.js evaluateJourneyRod). |
| TE-SRV-data-seed | `server/data/seed.js` | 44 | 1 | ensureSeeded |  |

## `server/db.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-db | `server/db.js` | 5918 | 129 | db, getJSON, setJSON | Postgres database layer backed by Supabase. The original code was written against the synchronous node:sqlite API |

## `server/index.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-index | `server/index.js` | 334 | 0 |  |  |

## `server/lib/agentCadenceEnvelope.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentCadenceEnvelope | `server/lib/agentCadenceEnvelope.js` | 47 | 1 | findCadencePreset | Agent cadence presets (2026-08-09) — the platform-wide, admin-editable list of cadence options a member can pick for a given agent+action schedule (Career Place |

## `server/lib/agentContextRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentContextRegistry | `server/lib/agentContextRegistry.js` | 27 | 1 | AGENT_CONTEXT_POLICIES, resolveAgentContextPolicy, renderContextCacheKey |  |

## `server/lib/agentDataPolicy.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentDataPolicy | `server/lib/agentDataPolicy.js` | 72 | 1 | actorScope, inferAgentPurpose, buildAgentDataContext, agentDataPolicyPrompt |  |

## `server/lib/agentDispatcher.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentDispatcher | `server/lib/agentDispatcher.js` | 100 | 1 | runDueSchedules, startAgentDispatcher | Real background agent dispatcher (2026-08-09) — the first one anywhere in this codebase. Everything built before this (job research, resume generation, qualific |

## `server/lib/agentHubRunner.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentHubRunner | `server/lib/agentHubRunner.js` | 114 | 2 | runDefinition, runByDefinitionId, runDueDefinitions | Agent Hub orchestration: creates the agent_hub_runs row, dispatches to the agent-kind handler, persists findings + stats, and emits the completion notification/ |

## `server/lib/agentLlmUsage.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentLlmUsage | `server/lib/agentLlmUsage.js` | 45 | 5 | usagePeriodKey, getAgentLlmUsage, assertAgentLlmBudget, recordAgentLlmUsage |  |

## `server/lib/agentRunGovernance.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentRunGovernance | `server/lib/agentRunGovernance.js` | 76 | 7 | checkAndRecordRunAllowance | Agent run governance (2026-08-07) — the only cost/rate guardrail that exists anywhere in this codebase for an agent-triggered (not a live user request/response) |

## `server/lib/agentStudioGovernance.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agentStudioGovernance | `server/lib/agentStudioGovernance.js` | 71 | 1 | AGENT_STUDIO_PROFILES, validateAgentStudioConfig, hydrateAgentStudioConfig | Canonical authority boundaries for the in-app product-building agent team. These profiles are intentionally code-owned: an agent may tune its working preference |

## `server/lib/agents`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-agents-codeReviewAgent | `server/lib/agents/codeReviewAgent.js` | 394 | 1 | run | The 'code_review' Agent Hub kind: scans recently-changed files for (a) hardcoded/non-configurable assumptions — reusing the existing salt-basin-config-audit ski |
| TE-SRV-lib-agents-contentResearchAgent | `server/lib/agents/contentResearchAgent.js` | 71 | 1 | run | The 'content_research' Agent Hub kind — resolves which external systems a research agent should pull from, reusing the existing data_ports registry for source d |
| TE-SRV-lib-agents-crystalWorldAuditAgent | `server/lib/agents/crystalWorldAuditAgent.js` | 97 | 1 | auditCrystalRegistries, auditSceneInstrumentation, auditExperientialContracts, run | Deterministic Crystal World audit. This agent never calls an LLM: it validates the canonical registries and checks that the primary scene builders participate i |
| TE-SRV-lib-agents-staticHeuristics | `server/lib/agents/staticHeuristics.js` | 105 | 1 | detectTestGaps, detectHardcodedCandidates, pickTestCandidates | Zero-API static analysis for the code_review agent. Runs on every scan, always, regardless of ANTHROPIC_API_KEY. Its job is twofold: 1. Produce findings that do |

## `server/lib/approvalGate.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-approvalGate | `server/lib/approvalGate.js` | 33 | 1 | REQUIRED_APPROVAL_LEVELS, ALL_APPROVAL_LEVELS, APPROVAL_OUTCOMES, checkApprovalGate | Approval gate — "An entry cannot move into the scheduler until all required approvals for that format are complete" (Content Entry Journey spec, section 11). Re |

## `server/lib/audit.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-audit | `server/lib/audit.js` | 47 | 8 | audit, hashIp | Audit log helper — call audit() from any route to record a write event. Failures are swallowed so a broken audit write never blocks the real action. |

## `server/lib/autoQueueAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-autoQueueAgent | `server/lib/autoQueueAgent.js` | 78 | 2 | autoQueueOutputsForNewlyApproved | Auto-queue agent (2026-08-09) — "an automated queue to generate resumes and cover letters for any newly approved job roles from the research." Orchestrates exis |

## `server/lib/backlogHistoryReconciler.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-backlogHistoryReconciler | `server/lib/backlogHistoryReconciler.js` | 102 | 1 | reconcileBacklogHistory |  |

## `server/lib/backlogIntelligenceSchema.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-backlogIntelligenceSchema | `server/lib/backlogIntelligenceSchema.js` | 109 | 6 | ensureBacklogIntelligenceSchema |  |

## `server/lib/bestyStaffGateDefinitions.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-bestyStaffGateDefinitions | `server/lib/bestyStaffGateDefinitions.js` | 61 | 1 | DEFAULT_BESTYSTAFF_GATE_DEFINITIONS, mergedGateDefinitions, classifyLeadIntent, evaluateLeadConversion, emailGateFor |  |

## `server/lib/careerAtomMigration.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerAtomMigration | `server/lib/careerAtomMigration.js` | 131 | 3 | ensureCareerMasterRod, migrateCareerDataForUser, syncSingleEntry, removeEntryEvidence, migrateCareerDataForAllUsers | Career Master data migration (2026-07-16) — populates the Career Atom vocabulary seeded by careerAtomRegistry.js with real evidence rows, migrated from the lega |

## `server/lib/careerAtomRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerAtomRegistry | `server/lib/careerAtomRegistry.js` | 175 | 7 | CAREER_ENTRY_SOURCES, generateCareerAtomDefinitions, generateCareerMoleculeDefinitions, sourceForTable, atomDefinitionByKey, isJsonbSourceColumn | Career Master → Career Atoms migration registry (2026-07-16). Master prompt §77 (Resume and Career Channel) requires a versioned Career Atom/ Molecule model; th |

## `server/lib/careerAtomRollups.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerAtomRollups | `server/lib/careerAtomRollups.js` | 151 | 8 | buildCareerAtomRollupCatalog, getCareerAtomEntries, hasCareerPortfolioContent | Rollup-over-evidence builder for the public Career Prospect layout (server/routes/careerMaster.js's GET /atom-rollups). Reads a member's Career Atom evidence (p |

## `server/lib/careerBondingEngine.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerBondingEngine | `server/lib/careerBondingEngine.js` | 113 | 2 | careerAtomTagIndex, loadCareerBondingRules, matchTextToCareerAtom, bondLabelsToCareerAtoms | Career Bonding Engine (2026-07-27) — server-side port of the free-text matching half of src/lib/journeyEngine/bonding.js, scoped to the Career domain. Reuses th |

## `server/lib/careerFileRetention.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerFileRetention | `server/lib/careerFileRetention.js` | 49 | 1 | runCareerFileRetention |  |

## `server/lib/careerOpportunityRollups.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerOpportunityRollups | `server/lib/careerOpportunityRollups.js` | 232 | 4 | getOrCreateCareerMasterRod, listCareerOpportunities, createCareerOpportunity, recordDimensionScores, advanceOpportunityStage, approveCareerOpportunity, allowedNextStages, getCareerAgentHub | Career Opportunity rollups (2026-08-06, Phase 2 — Career Placement Agents vertical slice) — the read/write surface a member-facing panel uses for the career hal |

## `server/lib/careerOutreachRollups.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerOutreachRollups | `server/lib/careerOutreachRollups.js` | 95 | 1 | getOutreachEffort, startOutreachEffort, mergeOutreachOutcomeToApplication | Career Outreach Effort rollups (2026-08-09) — the nested Tributary process "for hiring manager research and direct job outreach that can merge back to the appli |

## `server/lib/careerPipelineImport.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerPipelineImport | `server/lib/careerPipelineImport.js` | 127 | 1 | parseCareerPipelineWorkbook, rowToOpportunityPayload | Career Pipeline bulk import (2026-08-09) — reads a member's own externally-maintained career pipeline spreadsheet (real, human-researched tracked roles, not age |

## `server/lib/careerProficiencyRollups.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerProficiencyRollups | `server/lib/careerProficiencyRollups.js` | 89 | 1 | calculateCareerProficiencyRollup |  |

## `server/lib/careerReasoningCompiler.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerReasoningCompiler | `server/lib/careerReasoningCompiler.js` | 77 | 1 | computeReasoningPatternCandidates | Career Foundation Sourcing & Reconciliation, Phase 4 (2026-08-10) — the cross-user compiler. Groups every member-approved reasoning (career_reasoning_approvals, |

## `server/lib/careerReconciliation.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerReconciliation | `server/lib/careerReconciliation.js` | 222 | 3 | TABLE_BY_ENTRY_TYPE, IDENTITY_COLUMNS_BY_ENTRY_TYPE, detectConflicts, detectAmbiguousMappings, applyCareerFieldUpdate, resolveReconciliationTask | Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — detects when multiple equal-standing sources disagree about the same Career Master fact (a " |

## `server/lib/careerResearchAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerResearchAgent | `server/lib/careerResearchAgent.js` | 105 | 2 | researchCareerOpportunities | Career job research agent (2026-08-07) — the first real (not config/tracking-only) agent in this codebase: it actually searches the live web and proposes real o |

## `server/lib/careerResumeExtraction.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerResumeExtraction | `server/lib/careerResumeExtraction.js` | 216 | 2 | extractResumeText, proposeCareerMappingsFromText, bondProposedMappings | Career Resume Extraction (2026-07-27, Phase 1) — the actual missing piece behind "Queue N Analysis Passes": that button previously only created a career_intake_ |

## `server/lib/careerSemanticImport.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerSemanticImport | `server/lib/careerSemanticImport.js` | 89 | 1 | parseCareerSemanticWorkbook | Career Semantic Import parser (2026-07-27, Phase 1) — the reverse operation of careerSemanticTemplate.js: reads an uploaded workbook (either the generated templ |

## `server/lib/careerSemanticTemplate.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerSemanticTemplate | `server/lib/careerSemanticTemplate.js` | 134 | 2 | TEMPLATE_VERSION, buildCareerSemanticTemplateWorkbook, entrySheetNameForType, entryTypeForSheetName, allEntrySheetNames | Career Semantic Template (2026-07-27, Phase 1 of the Career Configuration Overhaul) — generates a downloadable Excel workbook mapping directly onto real Career  |

## `server/lib/careerVerificationAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-careerVerificationAgent | `server/lib/careerVerificationAgent.js` | 77 | 2 | runQualificationGatesForUser | Career opportunity verification agent (2026-08-09) — "constant check to make sure jobs in the open, unapproved pipeline are constantly re-searched and removed i |

## `server/lib/codeAgentContext.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-codeAgentContext | `server/lib/codeAgentContext.js` | 87 | 2 | WORK_STAGES, KNOWLEDGE_TYPES, ensureDefaultContextProfile, compileSessionContext, extractionPrompt, recordExtraction |  |

## `server/lib/codeAgentRunner.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-codeAgentRunner | `server/lib/codeAgentRunner.js` | 103 | 1 | executeApprovedCodeRun |  |

## `server/lib/collaborationRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-collaborationRegistry | `server/lib/collaborationRegistry.js` | 41 | 1 | PRESENCE_ACTION_STATES, PRESENCE_TTL_MS, PRESENCE_VISIBILITY_RULES, canViewPresence, isDataScope | Loop 14 (§38 Real-Time Multi-User Collaboration) config. Collaboration behavior "must be configurable" per the master prompt — this is that registry, not hardco |

## `server/lib/commercialOpportunityRollups.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-commercialOpportunityRollups | `server/lib/commercialOpportunityRollups.js` | 152 | 1 | listCommercialOpportunities, createCommercialOpportunity, recordCommercialDimensionScores, getCommercialAgentHub | Commercial Opportunity rollups (2026-08-06, Phase 3 — Commercial Opportunity Pipeline vertical slice, mirroring careerOpportunityRollups.js for the spec's other |

## `server/lib/configEnvelope.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-configEnvelope | `server/lib/configEnvelope.js` | 106 | 9 | defineConfigEnvelope, getConfigEnvelope, listConfigEnvelopes, resolveConfigEnvelope, writeConfigEnvelope, resetConfigEnvelope | Config Envelope — a reusable, repeatable engine for making a static config registry admin-editable at runtime, without an engineer or a deploy, while never brea |

## `server/lib/consentRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-consentRegistry | `server/lib/consentRegistry.js` | 118 | 7 | CONSENT_TYPES, consentDefinition, recordConsent, hasCurrentConsent, getConsentStatus | Consent Registry (2026-07-16) — the required-consent set a member must grant before any career configuration, upload, or Career Orbit entry. Config-driven (like |

## `server/lib/contentAttachmentRetention.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-contentAttachmentRetention | `server/lib/contentAttachmentRetention.js` | 38 | 1 | runContentAttachmentRetention | Deletes content_attachments past their 30-day retention window — only ever applies to non-admin (member/client) uploads, since admin uploads get retention_expir |

## `server/lib/contextCache.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-contextCache | `server/lib/contextCache.js` | 97 | 1 | getOrRefresh, invalidate, invalidateDomain | Agent context cache (master prompt §35). Agents "should not reconstruct baseline context from zero for every interaction" — before this module, every BestyStaff |

## `server/lib/coverLetterTargeting.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-coverLetterTargeting | `server/lib/coverLetterTargeting.js` | 76 | 2 | generateCoverLetterContent | Real cover-letter generation (2026-08-09) — a direct sibling of resumeTargeting.js's generateResumeContent(): same evidence-grounded, forced-tool-choice shape,  |

## `server/lib/cronMatch.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-cronMatch | `server/lib/cronMatch.js` | 67 | 2 | isValidCron, isCronDue | Minimal 5-field cron matcher (minute hour day-of-month month day-of-week). node-cron's public API is built around `cron.schedule(expr, fn)` for a single fixed j |

## `server/lib/crypto.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-crypto | `server/lib/crypto.js` | 36 | 5 | encrypt, decrypt |  |

## `server/lib/currentRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-currentRegistry | `server/lib/currentRegistry.js` | 82 | 5 | CURRENT_SCOPES, resolveCurrentTemplate, getCurrent, evaluateEntryCriteria | Current Registry (2026-07-27, generalized to a real table 2026-07-28) — the rule set governing a Channel journey's context: stage sequence (by reference to jour |

## `server/lib/customerEntitlements.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-customerEntitlements | `server/lib/customerEntitlements.js` | 44 | 3 | grantCustomerViewEntitlement, hasCapability | Auto-granted entitlement for a Customer Channel Journey (2026-07-27) — the counterpart to commerce.js's grantAccess(), which grants product_licenses + data_enti |

## `server/lib/customerMemory.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-customerMemory | `server/lib/customerMemory.js` | 43 | 2 | refreshCustomerMemory, permittedCustomerMemory, captureMemberChatMemory |  |

## `server/lib/dataSourceRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-dataSourceRegistry | `server/lib/dataSourceRegistry.js` | 49 | 1 | DATA_SOURCES, dataSourceDefinition | Generalized dashboard-rollup data sources (2026-07-27) — config-driven registry so a rollup block can pull from any registered domain instead of being hardcoded |

## `server/lib/documentAtomRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-documentAtomRegistry | `server/lib/documentAtomRegistry.js` | 133 | 3 | SOURCE_DOCUMENT_ROD_TYPE, DOCUMENT_RECORD_TYPES, classifyInputType, STRUCTURE_ATOM_TYPES, generateDocumentAtomDefinitions, structureAtomLevel, sourceReferenceFor, parentSourceReference … +1 | Source Document Intelligence — Atom/rod-type registry (2026-09-06). Reuse-first audit (salt-basin-channel-journey-architecture skill) result: |

## `server/lib/documentAtomSync.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-documentAtomSync | `server/lib/documentAtomSync.js` | 187 | 0 | createSourceDocumentRod, recordSourceFileAtoms, persistParsedStructure, recordLlmAssistedAtom, recordHumanValidation, reconstructDocumentTree | Source Document Intelligence — persistence layer (2026-09-06). Mirrors server/lib/careerAtomMigration.js's exact shape (ensure-rod / persist- evidence / event-s |

## `server/lib/documentStructureParser.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-documentStructureParser | `server/lib/documentStructureParser.js` | 315 | 0 | segmentSentences, segmentWords, parseDocumentStructure | Source Document Intelligence — deterministic structural parser (2026-09-06). Runs entirely rule-based, zero LLM calls, for every format this codebase |

## `server/lib/eidos.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-eidos | `server/lib/eidos.js` | 91 | 1 | classifySettlementDensity, computeRodSettlement, computeDivergenceBetweenRods | EIDOS Operating Model — server-side helpers for the layers added on top of the existing journey_data_rods engine (server/lib/journeyRods.js). See docs/eidos-ope |

## `server/lib/eidosBonding.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-eidosBonding | `server/lib/eidosBonding.js` | 168 | 2 | computeBonds, assembleMolecule, loadRodAtoms, loadMoleculeDefinition, recordCurrentArc, reconstructLatestCurrentArc, reconstructCurrentArcHistory | Server-side Semantic Affinity Field / Atom Cluster / Molecule / Current Arc engine (2026-07-27). Ports the tag-overlap/Contribution-Affinity/ assembleMolecules  |

## `server/lib/email.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-email | `server/lib/email.js` | 445 | 15 | dispatchRaw, sendLeadConfirmation, sendLeadEmailVerification, sendNewLeadAlert, sendVerificationEmail, sendContactFormToMember, sendMemberEntitlementWelcome, sendDailyDigest | Outbound email abstraction. If BREVO_API_KEY is set in env, sends real email via Brevo's transactional |

## `server/lib/emailDomain.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-emailDomain | `server/lib/emailDomain.js` | 20 | 4 | classifyEmailDomain, emailDomainOf | Shared personal-vs-custom email domain classification. Used by leads.js (/actor-context) and bestyStaff.js (the convert_lead_to_member conversation flow) so bot |

## `server/lib/feedbackScoring.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-feedbackScoring | `server/lib/feedbackScoring.js` | 23 | 1 | ROUTE_THRESHOLD, DEFAULT_CATEGORY_WEIGHT, categoryWeight, computeScore, scoreFeedback | Beta feedback scoring: score = category weight × (1 + log2(1 + upvotes)). Category weights are admin/advisor-configurable (feedback_category_weights) — this is  |

## `server/lib/financialPolicyRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-financialPolicyRegistry | `server/lib/financialPolicyRegistry.js` | 75 | 2 | DATA_SCOPES, FINANCIAL_CONNECTION_POLICIES, FINANCIAL_PROVIDERS, FINANCIAL_SHARE_OUTPUT_TYPES, resolveFinancialProvider, classifyLiability |  |

## `server/lib/genesisCatalog.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-genesisCatalog | `server/lib/genesisCatalog.js` | 48 | 1 | genesisCatalog, defaultGenesisConfiguration, findTable, configurationErrors |  |

## `server/lib/hiringManagerResearchAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-hiringManagerResearchAgent | `server/lib/hiringManagerResearchAgent.js` | 98 | 1 | researchHiringManagers | Hiring manager research agent (2026-08-09) — real execution for the already-seeded 'contact_relationship_analyst' agent role ("Finds accountable functions, publ |

## `server/lib/interactiveAgentLoop.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-interactiveAgentLoop | `server/lib/interactiveAgentLoop.js` | 51 | 2 | runInteractiveAgentLoop |  |

## `server/lib/journeyEvidenceHelpers.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-journeyEvidenceHelpers | `server/lib/journeyEvidenceHelpers.js` | 47 | 3 | postJourneyEvidence | Server-side evidence posting for the Public Site Dev Lifecycle journeys (server/data/scenarioLibrary.js) — called from the real routes that already do the work  |

## `server/lib/journeyRods.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-journeyRods | `server/lib/journeyRods.js` | 396 | 13 | createUserJourneyRod, ensureLeadRevenueRod, ensureMemberJourneyRods, ensureMemberOrganizationRods, ensureUserRevenueRod, transitionRodOwnership, upsertAccountRecord, promoteLeadToOrganizationLead … +5 |  |

## `server/lib/l2rDiagnosticEngagement.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-l2rDiagnosticEngagement | `server/lib/l2rDiagnosticEngagement.js` | 162 | 1 | createDiagnostic, listDiagnostics, getDiagnostic, recordObservation, recordFinding, getLandscape | Lead-to-Revenue Definition Studio — Current-State Diagnostic engagement service (2026-08-09, Phase 2). Reuse-first: rod creation follows the same shape as ensur |

## `server/lib/l2rDiagnosticRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-l2rDiagnosticRegistry | `server/lib/l2rDiagnosticRegistry.js` | 909 | 1 | BENCHMARK_REGISTER, SOURCE_REGISTER, listDomains, getCapabilityAtom, listCapabilitiesForDomain, getReferenceAtom, getScenarioGates, listScenariosByQtrDomain | Lead-to-Revenue Definition Studio Registry (2026-08-09, Phase 1) — reuse- first classification for the whole build, audited via the salt-basin-channel-journey-a |

## `server/lib/lineage.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-lineage | `server/lib/lineage.js` | 130 | 2 | flattenJSON, contextHash, snapshotHash, diffFlat, captureLineage |  |

## `server/lib/lonetreeDemoRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-lonetreeDemoRegistry | `server/lib/lonetreeDemoRegistry.js` | 137 | 2 | SIGNAL_ATOMS, BUSINESS_HYPOTHESIS_ATOMS, generateSignalMoleculeDefinitions, generateBusinessHypothesisMoleculeDefinitions, LONETREE_EVENT_TYPES, FUND_HIGHWAY_STAGES, PORTCO_HIGHWAYS, RECORD_ATOMS … +1 | Lonetree Fund MVP demo registry (2026-07-29). Betsy's Lonetree demo spec (Market Universe -> Exit Highway, PortCo commercial reconciliation) needs two new gover |

## `server/lib/lonetreeReconciliation.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-lonetreeReconciliation | `server/lib/lonetreeReconciliation.js` | 391 | 1 | computePortcoCommercialReconciliation, computeFundEconomics, traceEnterpriseValueDrivers, traceMetricLineage, computeSignalPropagationDemonstration | Lonetree MVP reconciliation engine (2026-07-29) — computes the Operational -> Financial -> Fund Economics chain (Usage -> Invoice -> Revenue Schedule -> GL -> E |

## `server/lib/memberAccess.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-memberAccess | `server/lib/memberAccess.js` | 133 | 5 | MEMBER_FEATURES, ensureCareerFoundationTrial, getMemberAccessSummary, hasMemberFeature, requireMemberFeature, getMemberStorageUsage |  |

## `server/lib/memberDbConnections.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-memberDbConnections | `server/lib/memberDbConnections.js` | 48 | 2 | redactMemberDbsForClient, mergeMemberDbsForStorage, decryptMemberDbUrl | integrations.memberDbs[] holds a member/org's own external database connections (server/routes/memberAgent.js's query_db_{id} tool gives the agent a live, read- |

## `server/lib/memberProvisioning.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-memberProvisioning | `server/lib/memberProvisioning.js` | 150 | 3 | provisionEntitlement, provisionDefaultModulesForNewMember, handleFirstLogin | Member Entitlement Provisioning (2026-07-13) — the direct-to-consumer slice of the global provisioning process defined in provisioningPolicyRegistry.js. Hooks i |

## `server/lib/memberStaffTemplates.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-memberStaffTemplates | `server/lib/memberStaffTemplates.js` | 60 | 1 | MEMBER_STAFF_TEMPLATES, DEFAULT_MEMBER_STAFF_TEMPLATE_ID, resolveMemberStaffTemplate, toolsForMemberStaff, canWriteMemberConfigPath | Reusable BestyStaff-derived templates for member-scoped staff. Templates describe identity, authority, and behavior; the route supplies executable capabilities. |

## `server/lib/memberVisibilityRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-memberVisibilityRegistry | `server/lib/memberVisibilityRegistry.js` | 39 | 3 | VISIBILITY_MODES, VISIBILITY_MODE_VALUES, isValidVisibilityMode, siteUnlockCookieName | Config-driven registry for a member's public-site (/u/:slug) access mode. One named list, per this project's config-over-hardcoding convention, so the four mode |

## `server/lib/methodologyEnvelopes.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-methodologyEnvelopes | `server/lib/methodologyEnvelopes.js` | 259 | 0 | ROD_MATHEMATICS_ENVELOPE, QUERY_CONVERGENCE_ENVELOPE, MATURITY_MODEL_ENVELOPE, SCENARIO_LIBRARY_ENVELOPE, SCENARIO_ATOM_WEIGHTS_ENVELOPE, JOURNEY_WORLD_EXPERIENCE_ENVELOPE, LONETREE_PROSPECT_EXPERIENCE_ENVELOPE | Registers the P0 weighted-composite registries as Config Envelopes (see configEnvelope.js) — the pilot slice for making "everything editable without an engineer |

## `server/lib/metricIntelligence.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-metricIntelligence | `server/lib/metricIntelligence.js` | 140 | 1 | evaluateFormula, ARR_DEFINITION, CORE_METRICS, METRIC_DEPENDENCIES, resolveVariant, calculateMetric, analyzeChange, classifyChangeEvent … +3 |  |

## `server/lib/molecule.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-molecule | `server/lib/molecule.js` | 151 | 1 | form, preview, render, react | Molecular data primitives — form, render, react, preview A molecule has three bond axes that must all close simultaneously |

## `server/lib/notificationEngine.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-notificationEngine | `server/lib/notificationEngine.js` | 73 | 1 | emitEvent | Generic notification/task write path. Any feature that wants to surface a notification and/or a task for a user calls emitEvent() with its own source_type — rou |

## `server/lib/oauthProviders.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-oauthProviders | `server/lib/oauthProviders.js` | 453 | 2 | PROVIDERS, PROVIDER_IDS, buildAuthUrl, clientCredentialsToken, exchangeCode, refreshToken | OAuth 2.0 provider configurations. Each entry defines the authorization URL, token URL, scopes, and how to fetch a basic identity record after authorization. |

## `server/lib/opportunityPipelineRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-opportunityPipelineRegistry | `server/lib/opportunityPipelineRegistry.js` | 398 | 6 | SOURCE_TIERS, EXPANSION_RINGS, CONTACT_CONFIDENCE_LABELS, findOrCreateEntity, findOrCreatePerson, recordRelationship, resolveAgentRoster, createAgentDefinition … +9 | Opportunity Pipeline Registry (2026-08-06) — shared infrastructure for the Salt Basin Weekly Research & Outreach Master Agent spec's two pipelines (commercial a |

## `server/lib/orgDocumentProjection.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-orgDocumentProjection | `server/lib/orgDocumentProjection.js` | 42 | 2 | createOrgDocumentProjection, listOrgDocuments, getOrgDocument | Organization Document Projection (2026-07-27) — creates/reads org_document_projections rows, the satellite table for the 'customer_document_delivery' Tributary  |

## `server/lib/organizationSso.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-organizationSso | `server/lib/organizationSso.js` | 43 | 1 | organizationSsoConfig, discoverOidc, hashSsoState, randomSsoValue, exchangeOidcCode |  |

## `server/lib/outputRendering.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-outputRendering | `server/lib/outputRendering.js` | 93 | 1 | summarizeProjectionForView, renderProjectionToPdfBuffer, filenameFor | Output rendering (2026-08-09) — turns a resume_output_projections row's durable, structured generated_content into (a) a read-only "digital view" JSON shape for |

## `server/lib/outreachDraftAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-outreachDraftAgent | `server/lib/outreachDraftAgent.js` | 76 | 1 | draftOutreachMessage | Direct outreach drafting agent (2026-08-09) — real execution for the already-seeded 'outreach_strategist' agent role ("Drafts first contacts and follow-ups base |

## `server/lib/passwordPolicy.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-passwordPolicy | `server/lib/passwordPolicy.js` | 26 | 3 | passwordWasUsed, replacePassword |  |

## `server/lib/passwordPolicyRules.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-passwordPolicyRules | `server/lib/passwordPolicyRules.js` | 11 | 2 | PASSWORD_POLICY, validatePasswordPolicy |  |

## `server/lib/proposalDocumentProjection.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-proposalDocumentProjection | `server/lib/proposalDocumentProjection.js` | 109 | 1 | ILLUSTRATIVE_DISCLAIMER, readRecordAtoms, compileProposalDocument | Proposal Document Projection (2026-07-29) — compiles one member's proposal_experience Channel Rod into an executive/PDF-ready document object. |

## `server/lib/proposalExperienceRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-proposalExperienceRegistry | `server/lib/proposalExperienceRegistry.js` | 220 | 4 | ensureProposalExperienceRod, PROPOSAL_JOURNEY_STAGES, PROPOSAL_ACTIONS, DELTA_ATOMS, generateDeltaAtomDefinitions, RECORD_MOLECULE_ATOMS, generateRecordMoleculeAtomDefinitions, recordProposalDecision … +3 | LoneTree "Member Experience Module" registry (2026-07-29) — the semantic delta from Salt_Basin_MVP_Proposal_Experience_Delta_Spec_v0.1.docx + Salt_Basin_MVP_Pro |

## `server/lib/proposalOperations.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-proposalOperations | `server/lib/proposalOperations.js` | 36 | 1 | runProposalFeedbackReminders, runProposalFeedbackTriage |  |

## `server/lib/provisioningPolicyRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-provisioningPolicyRegistry | `server/lib/provisioningPolicyRegistry.js` | 113 | 3 | PROVISIONING_ORIGINS, SALT_BASIN_ENTITLEMENT_STAGES, SALT_BASIN_MODULES, SALT_BASIN_TRACKED_INTERACTIONS, PROVISIONING_SECURITY_POLICY, resolveProvisioningTemplate, isKnownModule | Member Entitlement Provisioning — global process config (2026-07-13). "I want the Salt Basin provisioning process to follow a global process for |

## `server/lib/publicationFlowEnvelopes.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-publicationFlowEnvelopes | `server/lib/publicationFlowEnvelopes.js` | 62 | 0 |  | Registers the Publication journey's per-pipeline flow config (criteria, stages, output destination, observation-gating) as Config Envelopes (see configEnvelope. |

## `server/lib/qualificationGateCheckers.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-qualificationGateCheckers | `server/lib/qualificationGateCheckers.js` | 70 | 2 | CHECKERS | Qualification gate checkers (2026-08-09) — the checkType -> executor registry a qualification-gate Current's gates reference by name (see opportunityPipelineReg |

## `server/lib/rateLimit.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-rateLimit | `server/lib/rateLimit.js` | 35 | 6 | makeRateLimiter | Lightweight in-process rate limiter. Usage: |

## `server/lib/recaptcha.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-recaptcha | `server/lib/recaptcha.js` | 61 | 3 | verifyRecaptcha | reCAPTCHA v3 server-side verification. Frontend calls grecaptcha.execute(SITE_KEY, {action}) to get an opaque token, |

## `server/lib/resumePresets.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-resumePresets | `server/lib/resumePresets.js` | 68 | 3 | resumeUrlFromPreset, pickPrimaryPreset, normalizePrimaryFlags, publicPresetView, loadResumePresets, siteOwnerUserId | Shared resume-preset resolution for public resume links. One source of truth for layout→URL mapping and the single-primary invariant, used by site.js (site owne |

## `server/lib/resumeProjection.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-resumeProjection | `server/lib/resumeProjection.js` | 132 | 3 | computeCareerStateFingerprint, createResumeOutputProjection, checkStaleness, listResumeOutputProjections, listResumeOutputProjectionsForOpportunity, getResumeOutputProjectionRaw, updateProjectionStatus | Resume Output Projection (master-org-admin-config.md §5, 2026-07-16). "A Resume Output is a projection of the canonical Career state ... it is not a separate co |

## `server/lib/resumeTargeting.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-resumeTargeting | `server/lib/resumeTargeting.js` | 125 | 3 | computeResumeTargeting, generateResumeContent | Job-description-targeted resume output (2026-07-27). A focused, one-shot call — not the tool-calling site-editing agent in memberAgent.js, which is the wrong sh |

## `server/lib/riverbedRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-riverbedRegistry | `server/lib/riverbedRegistry.js` | 47 | 0 | resolveRiverbedScope, resolveMemberRiverbedRods, resolveOrgRiverbedRods, resolveAllRiverbedRodsForUser | Riverbed Registry (2026-07-27) — the client-scope object per the Foundation doc's Riverbed definition: a Member (no Organization profiles assigned) or a Member  |

## `server/lib/rollupMetrics.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-rollupMetrics | `server/lib/rollupMetrics.js` | 223 | 2 | groupCount, computeStaticRollups, computeDeltaRollups, computeToolUsageSnapshot, computeCertBadges, computeCapabilityOverlap, buildRollupCatalog | Rollup metrics engine — turns flat Career Master rows (jobs, skills, tools, engagements, domains, certifications, deals) into the "suggested" catalog consumed b |

## `server/lib/scenarioGenerator.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-scenarioGenerator | `server/lib/scenarioGenerator.js` | 57 | 1 | DRAFT_DIMENSION_DEFINITIONS, generateScenarioMatrix, estimateMatrixSize | L2 scenario matrix generator (master prompt §26 / HOS methodology doc, docs/salt-basin-hos-journey-methodology.md line 75): "L2 scenarios are generated from dim |

## `server/lib/scenarioLibraryApply.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-scenarioLibraryApply | `server/lib/scenarioLibraryApply.js` | 158 | 2 | checkReferences, applyScenarioLibrary | Applies the resolved `scenario-library` Config Envelope into the two tables the evaluation engine actually reads: journey_scenarios and journey_gate_definitions |

## `server/lib/seo.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-seo | `server/lib/seo.js` | 68 | 2 | buildSeoTags, injectSeoIntoHtml | Shared, framework-free SEO tag builder. Imported directly by both the server (Express meta-injection middleware) and the client (useSeoHead hook) — same cross-i |

## `server/lib/seoMiddleware.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-seoMiddleware | `server/lib/seoMiddleware.js` | 99 | 1 | createSeoMiddleware | Server-side SEO meta-tag injection for the production Express static build. A client-side <head> update (see src/lib/useSeoHead.js) is invisible to link-unfurli |

## `server/lib/simplePdf.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-simplePdf | `server/lib/simplePdf.js` | 21 | 1 | createTextPdf |  |

## `server/lib/snapshot.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-snapshot | `server/lib/snapshot.js` | 122 | 1 | computeCurrentTotals, captureBaselineIfEmpty | Build progress snapshot helpers. captureBaselineIfEmpty() runs once on server startup. If the |

## `server/lib/totp.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-totp | `server/lib/totp.js` | 42 | 1 | generateTotpSecret, totpCode, verifyTotp, totpUri |  |

## `server/lib/trajectory.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-trajectory | `server/lib/trajectory.js` | 223 | 0 | position, velocity, acceleration, limit, eta, trajectory, moleculeTrajectory, recordBondState … +1 | Trajectory — calculus layer for the molecular model Extends bonds from binary (open/closed) to continuous (0.0 → 1.0) |

## `server/lib/tributaryRegistry.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-tributaryRegistry | `server/lib/tributaryRegistry.js` | 392 | 10 | TRIBUTARY_TYPES, validateTributary, createJourneyTributary, tributaryDefinition, validatePeerTributary, linkJourneyTributary, getLinkedRods, validateReferenceTributary … +4 | Tributary Registry (2026-07-16, extended 2026-07-28) — the one config-driven place that names every valid connection between Channel Journeys (a Channel instanc |

## `server/lib/usageTracking.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-usageTracking | `server/lib/usageTracking.js` | 62 | 3 | recordLogin, recordInteraction, getEntitlementUsageSummary | Member Entitlement usage tracking (2026-07-13) — "capture number of logins and interactions at every feature module so usage is tracked." Reuses the existing an |

## `server/lib/vectorize.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-vectorize | `server/lib/vectorize.js` | 179 | 0 | vectorize, queryVector, cosineSimilarity, search | Molecular vectorizer — converts a molecule into a unified vector that encodes semantic meaning AND structural bond state simultaneously. |

## `server/lib/websiteIntelligence`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-websiteIntelligence-pageInventory | `server/lib/websiteIntelligence/pageInventory.js` | 132 | 0 | buildPageInventory | Website Intelligence Engine — WebsiteAnalysisAgent / WebsitePageInventory (master prompt §IV). Phase 2 of .claude/skills/salt-basin-website-intelligence. |
| TE-SRV-lib-websiteIntelligence-sourceAdapters | `server/lib/websiteIntelligence/sourceAdapters.js` | 186 | 0 | SOURCE_TYPES, SOURCE_AUTHORITY, normalizePages, adaptSaltBasinSiteState, adaptMemberSiteState, adaptFoundationSourceOfTruth, adaptBrandGuide | Website Intelligence Engine — Source Adapter layer (master prompt §III). Phase 2 of .claude/skills/salt-basin-website-intelligence. Every downstream model (page |

## `server/lib/worldVariantSeedAgent.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-worldVariantSeedAgent | `server/lib/worldVariantSeedAgent.js` | 95 | 1 | interpretVariantPrompt | World Variant Engine — Phase 8 slice: Variant Creation Studio's prompt interpreter (salt-basin-world-variants, 2026-09-06). Same evidence-grounded, forced-tool- |

## `server/lib/zipStore.js`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-lib-zipStore | `server/lib/zipStore.js` | 39 | 1 | createZip | Minimal standards-compliant ZIP writer using the STORE method. This keeps retention archives dependency-free and preserves the original bytes. |

## `server/routes`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-routes-agent | `server/routes/agent.js` | 333 | 1 | default;  | Scrum Agent — Phase A scaffold. Phase A goals: |
| TE-SRV-routes-agentHub | `server/routes/agentHub.js` | 268 | 1 | default;  | Agent Hub API — admin-only. GET /api/agent-hub/definitions → list agent definitions |
| TE-SRV-routes-analytics | `server/routes/analytics.js` | 239 | 1 | default;  |  |
| TE-SRV-routes-auth | `server/routes/auth.js` | 358 | 1 | default;  |  |
| TE-SRV-routes-backlog | `server/routes/backlog.js` | 696 | 1 | default;  | Backlog / Requirements Management API. Admin-only. Members never see this. Surface area: |
| TE-SRV-routes-backlogOutputs | `server/routes/backlogOutputs.js` | 72 | 1 | default;  |  |
| TE-SRV-routes-bestyStaff | `server/routes/bestyStaff.js` | 523 | 1 | default;  | BestyStaff — Betsy's AI proxy intake agent. POST /api/agent/bestystaff This finalizes the long-standing "Phase 5" stub: a Claude-backed chat |
| TE-SRV-routes-bestyStaffCareer | `server/routes/bestyStaffCareer.js` | 109 | 1 | default;  |  |
| TE-SRV-routes-careerMaster | `server/routes/careerMaster.js` | 1625 | 2 | default; resolveOwnerUserId | Career Master Data API — the single source of truth for Betsy's resume / portfolio content (skills, jobs, tools, engagements/case studies, and domains/niche-sol |
| TE-SRV-routes-careerPlacementAgents | `server/routes/careerPlacementAgents.js` | 638 | 1 | default;  | Career Placement Agents API (2026-08-06, Phase 2 — vertical slice of the Salt Basin Weekly Research & Outreach Master Agent spec's career pipeline). Member-scop |
| TE-SRV-routes-careerReasoningAdmin | `server/routes/careerReasoningAdmin.js` | 64 | 1 | default;  |  |
| TE-SRV-routes-careerReconciliation | `server/routes/careerReconciliation.js` | 59 | 1 | default;  | Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the member-facing review queue API. Mirrors server/routes/careerPlacementAgents.js's convent |
| TE-SRV-routes-commerce | `server/routes/commerce.js` | 440 | 1 | default; stripeWebhookHandler | Self-service commerce for SMB deliverable packages. Mirrors the server/lib/email.js pattern: if STRIPE_SECRET_KEY is set, |
| TE-SRV-routes-commercialOpportunities | `server/routes/commercialOpportunities.js` | 54 | 1 | default;  | Commercial Opportunity Pipeline API (2026-08-06, Phase 3 — vertical slice of the Weekly Research & Outreach spec's commercial pipeline, mirroring careerPlacemen |
| TE-SRV-routes-config | `server/routes/config.js` | 165 | 2 | default; invalidatePublicConfigCache |  |
| TE-SRV-routes-configEnvelopes | `server/routes/configEnvelopes.js` | 67 | 1 | default;  | Generic admin API over the Config Envelope engine (server/lib/configEnvelope.js) — one route surface for every registered envelope, so adding a new editable reg |
| TE-SRV-routes-contentAttachments | `server/routes/contentAttachments.js` | 190 | 1 | default;  | Content Attachments — generic file uploads attached to any Content Entry Journey record (research inputs, content items, insights, outputs, and future Observati |
| TE-SRV-routes-contentPublications | `server/routes/contentPublications.js` | 235 | 1 | default;  | Content Publications — generic editorial calendar / scheduler + engagement capture for ALL marketing content (app.herq posts, app.services ads, future apps). No |
| TE-SRV-routes-dataSources | `server/routes/dataSources.js` | 25 | 1 | default;  |  |
| TE-SRV-routes-deploymentIntelligence | `server/routes/deploymentIntelligence.js` | 81 | 1 | default;  |  |
| TE-SRV-routes-eidos | `server/routes/eidos.js` | 239 | 1 | default;  |  |
| TE-SRV-routes-events | `server/routes/events.js` | 34 | 1 | default;  | Page view event beacon. POST /api/events/page-view { memberSlug, pageSlug, referrer } Called from the browser when a public profile page loads. No auth required |
| TE-SRV-routes-experience | `server/routes/experience.js` | 18 | 1 | default;  |  |
| TE-SRV-routes-feedback | `server/routes/feedback.js` | 225 | 1 | default;  | Beta product feedback loop. POST /api/feedback (member) submit feedback |
| TE-SRV-routes-fieldAudit | `server/routes/fieldAudit.js` | 66 | 1 | default;  |  |
| TE-SRV-routes-finbridgeco | `server/routes/finbridgeco.js` | 92 | 1 | default;  |  |
| TE-SRV-routes-genesis | `server/routes/genesis.js` | 222 | 1 | default;  |  |
| TE-SRV-routes-globalStandards | `server/routes/globalStandards.js` | 124 | 1 | default;  |  |
| TE-SRV-routes-governance | `server/routes/governance.js` | 136 | 1 | default;  |  |
| TE-SRV-routes-herq | `server/routes/herq.js` | 388 | 1 | default;  |  |
| TE-SRV-routes-jira | `server/routes/jira.js` | 268 | 1 | default;  | JIRA Cloud integration — Phase A (read-only). Auth: HTTP Basic with the admin's atlassian email + an API token. |
| TE-SRV-routes-journeyRods | `server/routes/journeyRods.js` | 201 | 1 | default;  |  |
| TE-SRV-routes-l2rDiagnostics | `server/routes/l2rDiagnostics.js` | 98 | 1 | default;  | Lead-to-Revenue Diagnostic API (2026-08-09, Definition Studio Phase 2). Admin-scoped (requireAdmin) for now, same reasoning as commercialOpportunities.js: Betsy |
| TE-SRV-routes-leadIntegrations | `server/routes/leadIntegrations.js` | 161 | 1 | default;  |  |
| TE-SRV-routes-leads | `server/routes/leads.js` | 1155 | 2 | default; resetLeadCredentialsByEmail |  |
| TE-SRV-routes-lineage | `server/routes/lineage.js` | 101 | 1 | default;  |  |
| TE-SRV-routes-lonetreeMvp | `server/routes/lonetreeMvp.js` | 294 | 1 | default;  | Lonetree MVP demo API (2026-07-29) — read-only surface over the seeded Fund/PortCo demo dataset (server/scripts/seedLonetreeMvpFund.js) and the reconciliation e |
| TE-SRV-routes-memberAccess | `server/routes/memberAccess.js` | 16 | 0 | default;  |  |
| TE-SRV-routes-memberAgent | `server/routes/memberAgent.js` | 482 | 8 | default; getAnthropicKey | Member profile agent — POST /api/members/me/agent A Claude-backed chat agent scoped strictly to one member's data. The agent |
| TE-SRV-routes-memberConfig | `server/routes/memberConfig.js` | 150 | 1 | default;  | Member-scoped config routes — same pattern as memberSite.js. Stores brand colors, social handles, the Net Works opt-in toggle, and the |
| TE-SRV-routes-memberEntitlements | `server/routes/memberEntitlements.js` | 61 | 1 | default;  | Member-facing Entitlement dashboard (2026-07-16) — "the admin configurable UI ... that's what the members are going to use." Surfaces the Member Entitlement Pro |
| TE-SRV-routes-memberFinancial | `server/routes/memberFinancial.js` | 95 | 1 | default;  |  |
| TE-SRV-routes-members | `server/routes/members.js` | 631 | 1 | default;  |  |
| TE-SRV-routes-memberSite | `server/routes/memberSite.js` | 337 | 1 | default;  | Member-scoped CMS routes. Mirrors the admin /api/site/* routes but is auth-scoped to req.user.id, so |
| TE-SRV-routes-memberTemplates | `server/routes/memberTemplates.js` | 146 | 1 | default;  | Member templates — Phase A Endpoints: |
| TE-SRV-routes-methodologyStats | `server/routes/methodologyStats.js` | 50 | 1 | default;  | Safe, non-admin-gated aggregate figures for /output/methodology (the client/member-facing Contribution Intelligence Methodology IP page). |
| TE-SRV-routes-metricIntelligence | `server/routes/metricIntelligence.js` | 79 | 1 | default;  |  |
| TE-SRV-routes-notifications | `server/routes/notifications.js` | 83 | 1 | default;  | Generic notification/task API — available to any authenticated user (not admin-only), since notifications/tasks are a platform-wide primitive. |
| TE-SRV-routes-nrm | `server/routes/nrm.js` | 262 | 1 | default;  |  |
| TE-SRV-routes-oauth | `server/routes/oauth.js` | 329 | 2 | default; getLiveToken |  |
| TE-SRV-routes-orgPortal | `server/routes/orgPortal.js` | 145 | 1 | default;  |  |
| TE-SRV-routes-outputTemplates | `server/routes/outputTemplates.js` | 187 | 1 | default;  | Member-scoped output templates (resume, proposal, case-study, one-pager, build-summary). Storage was consolidated into unified_outputs (see the "Consolidate out |
| TE-SRV-routes-portfolioRequests | `server/routes/portfolioRequests.js` | 507 | 2 | default; sweepExpiredAttachments, createPortfolioRequest | Portfolio request lead funnel — intake behind the teaser views of the Career Master Database, Case Study Portfolio, and Strategic Operator outputs. Leads arrive |
| TE-SRV-routes-presence | `server/routes/presence.js` | 88 | 1 | default;  | Loop 14 (§38 Real-Time Multi-User Collaboration) — presence slice. "Multiple users may interact with the same checkpoint simultaneously. The |
| TE-SRV-routes-profiles | `server/routes/profiles.js` | 468 | 1 | default;  |  |
| TE-SRV-routes-proposalExperience | `server/routes/proposalExperience.js` | 270 | 1 | default;  | Member Experience Module read/write API (2026-07-29) — serves the guided 9-stage Proposal Experience for the CALLING member's own proposal_experience Channel Ro |
| TE-SRV-routes-publicationPipelines | `server/routes/publicationPipelines.js` | 92 | 1 | default;  | Publication Pipeline API (2026-08-07) — the agent/schedule/flow-config surface for Salt Basin's own content-publication process (HERQ, and later Marketing Ads / |
| TE-SRV-routes-qa | `server/routes/qa.js` | 644 | 1 | default;  | QA: test scenarios, scripts, runs, defects. Admin-only. Surface area: |
| TE-SRV-routes-resumeAccess | `server/routes/resumeAccess.js` | 195 | 1 | default;  |  |
| TE-SRV-routes-resumeOutputs | `server/routes/resumeOutputs.js` | 50 | 1 | default;  | Resume Output Projection API (2026-07-16) — member-scoped. |
| TE-SRV-routes-scenarios | `server/routes/scenarios.js` | 44 | 1 | default;  |  |
| TE-SRV-routes-services | `server/routes/services.js` | 247 | 1 | default;  |  |
| TE-SRV-routes-site | `server/routes/site.js` | 118 | 1 | default;  |  |
| TE-SRV-routes-uploads | `server/routes/uploads.js` | 116 | 1 | default; uploadsDir | Image uploads → Supabase Storage. The bucket `uploads` is created lazily on first boot (if it doesn't exist). |
| TE-SRV-routes-worldVariantStudio | `server/routes/worldVariantStudio.js` | 40 | 1 | default;  | Variant Creation Studio API (salt-basin-world-variants Phase 8 slice, 2026-09-06). Admin-scoped (requireAdmin) — this is the "development Variant Creation Studi |

## `server/scripts`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-SRV-scripts-addMemberWorkEmail | `server/scripts/addMemberWorkEmail.mjs` | 81 | 0 |  | Adds a secondary (work) email to an existing lead AND the user that lead converted into — one person, two addresses. Written 2026-07-29 for Breck Golden (lead 1 |
| TE-SRV-scripts-convertBreckGolden | `server/scripts/convertBreckGolden.mjs` | 77 | 0 |  | One-off, manually-run real conversion (2026-07-27) — converts lead id 15 (Breck Golden, saltbasin-networks@breckgolden.com) to a real member, mirroring server/r |
| TE-SRV-scripts-provisionBreckRevenueJourney | `server/scripts/provisionBreckRevenueJourney.mjs` | 18 | 0 |  |  |
| TE-SRV-scripts-seedLoneTreeDemo | `server/scripts/seedLoneTreeDemo.js` | 117 | 0 |  | One-off, manually-run demo seed (2026-07-27) — NOT part of server/data/seed.js and never runs automatically at boot, per that file's own invariant that seed.js  |
| TE-SRV-scripts-seedLonetreeMvpFund | `server/scripts/seedLonetreeMvpFund.js` | 175 | 0 |  | Lonetree MVP demo seed (2026-07-29) — NOT part of server/data/seed.js and never runs automatically at boot, matching every other one-off demo seed in this direc |
| TE-SRV-scripts-seedProductResourcePages | `server/scripts/seedProductResourcePages.js` | 114 | 0 |  | One-off, manually-run seed (2026-07-27) — adds a new "Product Resource Library" page to site_state's DRAFT only (never touches 'published'), exactly as if it ha |
| TE-SRV-scripts-seedProposalExperience | `server/scripts/seedProposalExperience.js` | 54 | 0 |  | Idempotent seed for the Member Experience Module (2026-07-29) — upserts server/data/proposalExperienceSeed/repository.json (ported from Salt_Basin_MVP_Proposal_ |
| TE-SRV-scripts-seedScenarioLibrary | `server/scripts/seedScenarioLibrary.js` | 38 | 0 |  | Applies the `scenario-library` Config Envelope into journey_scenarios and journey_gate_definitions. Safe to rerun — scenarios upsert on scenario_key, gates on ( |
| TE-SRV-scripts-setBreckTempPassword | `server/scripts/setBreckTempPassword.mjs` | 23 | 0 |  | One-off, manually-run (2026-07-28) — sets a known temporary password for Breck Golden's converted member account (user 17) so Betsy can log in through the real  |

## `src/App.jsx`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-App | `src/App.jsx` | 142 | 1 | default; App |  |

## `src/components`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-components-BackLink | `src/components/BackLink.jsx` | 44 | 6 | default; BackLink |  |
| TE-CMP-components-BestyStaffContactSection | `src/components/BestyStaffContactSection.jsx` | 37 | 1 | default; BestyStaffContactSection |  |
| TE-CMP-components-blocks-blockUtils | `src/components/blocks/blockUtils.jsx` | 55 | 2 | useViewportWidth, PanelCard | Small shared helpers used by multiple block files. Extracted here (rather than left inline in index.jsx) so ColumnWidgets.jsx can reuse them without a circular  |
| TE-CMP-components-blocks-CareerProspectBlocks | `src/components/blocks/CareerProspectBlocks.jsx` | 253 | 1 | CareerHeroOrbitBlock, CareerLensTabsBlock, CareerRollupShowcaseBlock, CareerJourneyStepperBlock | Career Prospect layout blocks — config-driven, built from the "Salt Basin Career Member Prospect Experience" brand-kit reference (2026-07-16). Every block reads |
| TE-CMP-components-blocks-ColumnWidgets | `src/components/blocks/ColumnWidgets.jsx` | 349 | 2 | FormColumnWidget, WheelDisplay, WIDGET_REGISTRY, WIDGET_TYPES, FlexColumnsBlock | Pluggable sub-section display widgets for the flexColumns section type — each column independently picks one of these via section.fields.flexCols[i].widgetType. |
| TE-CMP-components-blocks-index | `src/components/blocks/index.jsx` | 5855 | 7 | DEFAULT_INDUSTRY_WHEEL_NODES, SUBSECTION_REGISTRY, RenderSection, BLOCK_TYPES | Block library. Each block accepts { section, config, mode } and renders the public-facing markup. `mode` is 'public' or 'preview' so admin previews can show dra |
| TE-CMP-components-blocks-MetadataModelBlock | `src/components/blocks/MetadataModelBlock.jsx` | 53 | 1 | MetadataModelDiagramBlock | Atom / Joint / Molecule metadata model — a small, config-driven explainer diagram, not a graph-layout engine. Renders nodes grouped by tier in three columns plu |
| TE-CMP-components-blocks-ProductExperienceBlocks | `src/components/blocks/ProductExperienceBlocks.jsx` | 947 | 1 | ProductHeroBlock, RotatingHighlightsBlock, BuildFlowBlock, JourneyRodsBlock, ProductCatalogBlock, ExposureCalculatorBlock, ApiCatalogTableBlock, StartEngagementBlock … +5 | Salt Basin MRS "Product Experience" homepage blocks — config-driven replacements for the reference HTML mockup's sections. Every block reads exclusively from se |
| TE-CMP-components-blocks-SectionShell | `src/components/blocks/SectionShell.jsx` | 64 | 1 | default; SectionShell |  |
| TE-CMP-components-Breadcrumbs | `src/components/Breadcrumbs.jsx` | 104 | 1 | default; Breadcrumbs |  |
| TE-CMP-components-BusinessDefinitionExperience | `src/components/BusinessDefinitionExperience.jsx` | 1072 | 1 | default; BusinessDefinitionExperience |  |
| TE-CMP-components-CrystalMark | `src/components/CrystalMark.jsx` | 29 | 1 | default; CrystalMark |  |
| TE-CMP-components-CrystalMarkField | `src/components/CrystalMarkField.jsx` | 132 | 2 | default; registerCrystalMark, CrystalMarkField |  |
| TE-CMP-components-CrystalOfficeScene | `src/components/CrystalOfficeScene.jsx` | 326 | 1 | default; CrystalOfficeScene |  |
| TE-CMP-components-CrystalRoomScene | `src/components/CrystalRoomScene.jsx` | 158 | 1 | default; CrystalRoomScene |  |
| TE-CMP-components-CrystalSolarSystem | `src/components/CrystalSolarSystem.jsx` | 298 | 1 | default; CrystalSolarSystem |  |
| TE-CMP-components-CrystalWorldCityScene | `src/components/CrystalWorldCityScene.jsx` | 38 | 1 | default; CrystalWorldCityScene |  |
| TE-CMP-components-DataNotice | `src/components/DataNotice.jsx` | 160 | 4 | default; InlineDataNotice, DataNotice |  |
| TE-CMP-components-DefinitionStudioJourney | `src/components/DefinitionStudioJourney.jsx` | 116 | 1 | default; DefinitionStudioJourney |  |
| TE-CMP-components-FirstLoginPasswordPage | `src/components/FirstLoginPasswordPage.jsx` | 62 | 1 | default; FirstLoginPasswordPage |  |
| TE-CMP-components-FlowingJourneyDeck | `src/components/FlowingJourneyDeck.jsx` | 101 | 1 | default; FlowingJourneyDeck |  |
| TE-CMP-components-LandingGate | `src/components/LandingGate.jsx` | 83 | 1 | default; LandingGate |  |
| TE-CMP-components-LeadView | `src/components/LeadView.jsx` | 791 | 1 | default; LeadView |  |
| TE-CMP-components-MemberCrystalOrbit | `src/components/MemberCrystalOrbit.jsx` | 210 | 1 | default; MemberCrystalOrbit |  |
| TE-CMP-components-MemberDashboard | `src/components/MemberDashboard.jsx` | 48 | 1 | default; MemberDashboard | Member dashboard. Members get the exact same admin shell Betsy uses for the Salt Basin |
| TE-CMP-components-OpportunityAgentOrbitWorld | `src/components/OpportunityAgentOrbitWorld.jsx` | 324 | 2 | default; OpportunityAgentOrbitWorld | Opportunity Agent Orbit World (2026-08-06, Phase 2 — Career Placement Agents; generalized Phase 3 for the commercial pipeline too). Anchored around the same bas |
| TE-CMP-components-OrgPortal | `src/components/OrgPortal.jsx` | 157 | 1 | default; OrgPortal |  |
| TE-CMP-components-Output | `src/components/Output.jsx` | 5598 | 1 | ResumeOutput, CaseStudyOutput, CareerCaseStudyPortfolioOutput, CareerMasterDatabaseOutput, CareerPortfolioHubOutput, ResumePortfolioOutput, CareerFullPortfolioOutput, DomainsOutput … +10 | Print-friendly "output" pages: Resume, Case Study, Proposal, One-Pager. Auth gate: visitors who aren't logged in see a teaser (top portion + fade |
| TE-CMP-components-PlanetAtmosphereView | `src/components/PlanetAtmosphereView.jsx` | 483 | 1 | default; PlanetAtmosphereView | Planet Atmosphere (2026-09-06) — the dedicated zoomed-in scene WorldShell hands off to once its "enter the planet" travel cinematic finishes for an 'atmosphere' |
| TE-CMP-components-PortfolioRequestFlow | `src/components/PortfolioRequestFlow.jsx` | 958 | 4 | default; PortfolioRequestPrompt | BestyStaff intake chat — rendered under the public teaser views of the Career Master Database, Case Study Portfolio, and Strategic Operator outputs. |
| TE-CMP-components-PrivacyPolicy | `src/components/PrivacyPolicy.jsx` | 213 | 1 | default; PrivacyPolicy |  |
| TE-CMP-components-PublicFooter | `src/components/PublicFooter.jsx` | 59 | 8 | default; PublicFooter |  |
| TE-CMP-components-PublicNav | `src/components/PublicNav.jsx` | 267 | 7 | default; PublicNav |  |
| TE-CMP-components-PublicProfile | `src/components/PublicProfile.jsx` | 492 | 1 | default; PublicProfile | Member-owned public profile site. Each member runs their own multi-page CMS through the AdminShell (scope = |
| TE-CMP-components-PublicSite | `src/components/PublicSite.jsx` | 276 | 1 | default; PublicSite |  |
| TE-CMP-components-ReferenceExperiencePage | `src/components/ReferenceExperiencePage.jsx` | 23 | 1 | default; ReferenceExperiencePage |  |
| TE-CMP-components-ResetPasswordPage | `src/components/ResetPasswordPage.jsx` | 168 | 1 | default; ResetPasswordPage | Password-reset confirmation page. Reached via the email link delivered by /api/auth/reset-request. URL shape: |
| TE-CMP-components-RiverSystemMap | `src/components/RiverSystemMap.jsx` | 47 | 0 | default; RiverSystemMap |  |
| TE-CMP-components-SaltBasinCrystal | `src/components/SaltBasinCrystal.jsx` | 292 | 23 | default; ensureThree, hasWebGL, SaltBasinCrystal |  |
| TE-CMP-components-SaltBasinHome | `src/components/SaltBasinHome.jsx` | 546 | 0 | default; SaltBasinHome |  |
| TE-CMP-components-SignupPage | `src/components/SignupPage.jsx` | 275 | 0 | default; SignupPage |  |
| TE-CMP-components-SiteConfigView | `src/components/SiteConfigView.jsx` | 123 | 1 | default; SiteConfigView | Extracted from WorldShell.jsx (2026-09-06) so PlanetAtmosphereView.jsx can reuse it for the "Site Configuration" moon without a circular import between the two  |
| TE-CMP-components-SpatialJourneyWorld | `src/components/SpatialJourneyWorld.jsx` | 2338 | 2 | default; SpatialJourneyWorld |  |
| TE-CMP-components-TermsOfService | `src/components/TermsOfService.jsx` | 222 | 1 | default; TermsOfService |  |
| TE-CMP-components-UxRuntimeAuditProbe | `src/components/UxRuntimeAuditProbe.jsx` | 23 | 1 | default; UxRuntimeAuditProbe |  |
| TE-CMP-components-WorldShell | `src/components/WorldShell.jsx` | 1339 | 1 | default; WorldShell | World Shell (2026-08-07) — the real, full-screen "world" landing experience: a Crystal Core (the exact homepage crystal mesh — CRYSTAL_ VARIANTS.signature, not  |

## `src/components/admin`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-components-admin-AdminShell | `src/components/admin/AdminShell.jsx` | 1257 | 3 | default; AdminShell |  |
| TE-CMP-components-admin-adminStyles | `src/components/admin/adminStyles.js` | 159 | 16 | styles | Shared inline styles for admin chrome. Co-located in JS so they can use the brand CSS variables without producing dozens of utility classes. |
| TE-CMP-components-admin-AgentHubConfigPanel | `src/components/admin/AgentHubConfigPanel.jsx` | 165 | 1 | default; AgentHubConfigPanel |  |
| TE-CMP-components-admin-AgentOutputsPanel | `src/components/admin/AgentOutputsPanel.jsx` | 153 | 1 | default; AgentOutputsPanel |  |
| TE-CMP-components-admin-AnalyticsPanel | `src/components/admin/AnalyticsPanel.jsx` | 149 | 1 | default; AnalyticsPanel |  |
| TE-CMP-components-admin-AttachmentList | `src/components/admin/AttachmentList.jsx` | 102 | 2 | default; AttachmentList |  |
| TE-CMP-components-admin-BacklogDrawer | `src/components/admin/BacklogDrawer.jsx` | 445 | 1 | default; BacklogDrawer | Right-side slide-over drawer that shows the full requirement detail for a backlog item — every field is editable inline. Save persists via PATCH. |
| TE-CMP-components-admin-BacklogPanel | `src/components/admin/BacklogPanel.jsx` | 659 | 1 | default; BacklogPanel | Backlog dashboard. Admin-only. Left rail: capability groups with item counts. Right pane: |
| TE-CMP-components-admin-BoundedCareerAgentPanel | `src/components/admin/BoundedCareerAgentPanel.jsx` | 38 | 1 | default; BoundedCareerAgentPanel |  |
| TE-CMP-components-admin-CareerConsentGate | `src/components/admin/CareerConsentGate.jsx` | 81 | 4 | default; CareerConsentGate | CareerConsentGate (2026-07-16) — blocks all career configuration (My Resume, Career Master, Upload Data, Career Orbit) until the member has granted current cons |
| TE-CMP-components-admin-CareerExperienceConfigurator | `src/components/admin/CareerExperienceConfigurator.jsx` | 199 | 1 | default; CareerExperienceConfigurator |  |
| TE-CMP-components-admin-CareerIntakePanel | `src/components/admin/CareerIntakePanel.jsx` | 409 | 2 | default; CareerIntakePanel |  |
| TE-CMP-components-admin-CareerMappingPreview | `src/components/admin/CareerMappingPreview.jsx` | 190 | 2 | default; CareerMappingPreview | CareerMappingPreview (2026-07-27, Phase 1) — shared preview/edit screen for both the Excel semantic-import path and the AI resume-analysis path. Both server rou |
| TE-CMP-components-admin-CareerMasterEntryPoint | `src/components/admin/CareerMasterEntryPoint.jsx` | 41 | 2 | default; CareerMasterEntryPoint |  |
| TE-CMP-components-admin-CareerMasterPanel | `src/components/admin/CareerMasterPanel.jsx` | 495 | 3 | default; CareerMasterPanel |  |
| TE-CMP-components-admin-CareerOrbit | `src/components/admin/CareerOrbit.jsx` | 24 | 1 | default; CareerOrbit |  |
| TE-CMP-components-admin-CareerPlacementAgentsPanel | `src/components/admin/CareerPlacementAgentsPanel.jsx` | 187 | 1 | default; CareerPlacementAgentsPanel | Career Placement Agents panel (2026-08-06, Phase 2 vertical slice) — the real admin/member tab surfacing the data model built in server/lib/opportunityPipelineR |
| TE-CMP-components-admin-CareerReasoningCompilerPanel | `src/components/admin/CareerReasoningCompilerPanel.jsx` | 117 | 1 | default; CareerReasoningCompilerPanel | Career Foundation Sourcing & Reconciliation, Phase 4 (2026-08-10) — the Salt Basin admin's cross-user reasoning compiler view. Every candidate is a reasoning pa |
| TE-CMP-components-admin-CareerReconciliationPanel | `src/components/admin/CareerReconciliationPanel.jsx` | 205 | 1 | default; CareerReconciliationPanel | Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the review queue a member works through when two equal-standing sources (resume, LinkedIn ex |
| TE-CMP-components-admin-ChooseYourPathScreen | `src/components/admin/ChooseYourPathScreen.jsx` | 63 | 0 | default; ChooseYourPathScreen | ChooseYourPathScreen (2026-07-16) — shown once Career Portfolio consent is granted (see CareerConsentGate.jsx). Two main paths: Enter Career Orbit (the 3D per-j |
| TE-CMP-components-admin-CommandCenterPanel | `src/components/admin/CommandCenterPanel.jsx` | 605 | 1 | default; CommandCenterPanel |  |
| TE-CMP-components-admin-CommercialOpportunityPanel | `src/components/admin/CommercialOpportunityPanel.jsx` | 208 | 1 | default; CommercialOpportunityPanel | Commercial Opportunity Pipeline panel (2026-08-06, Phase 3 vertical slice) — the real admin tab surfacing server/lib/commercialOpportunityRollups.js. Admin-scop |
| TE-CMP-components-admin-ConfigPanel | `src/components/admin/ConfigPanel.jsx` | 1689 | 3 | default; ConfigPanel |  |
| TE-CMP-components-admin-ContentItemsPanel | `src/components/admin/ContentItemsPanel.jsx` | 151 | 1 | default; ContentItemsPanel |  |
| TE-CMP-components-admin-ContentManagerShell | `src/components/admin/ContentManagerShell.jsx` | 62 | 1 | default; ContentManagerShell |  |
| TE-CMP-components-admin-EditorPane | `src/components/admin/EditorPane.jsx` | 2424 | 1 | default; EditorPane |  |
| TE-CMP-components-admin-EidosOperatingModelPanel | `src/components/admin/EidosOperatingModelPanel.jsx` | 609 | 1 | default; EidosOperatingModelPanel |  |
| TE-CMP-components-admin-EmotionalWeatherPanel | `src/components/admin/EmotionalWeatherPanel.jsx` | 66 | 1 | default; EmotionalWeatherPanel |  |
| TE-CMP-components-admin-FeedbackPanel | `src/components/admin/FeedbackPanel.jsx` | 172 | 1 | default; FeedbackPanel | Admin queue for the beta product feedback loop. Server side: server/routes/feedback.js (/api/feedback/*), scoring in server/lib/feedbackScoring.js. Mounted as t |
| TE-CMP-components-admin-FinBridgeCoPanel | `src/components/admin/FinBridgeCoPanel.jsx` | 127 | 1 | default; FinBridgeCoPanel |  |
| TE-CMP-components-admin-FlexColumnsEditor | `src/components/admin/FlexColumnsEditor.jsx` | 305 | 1 | default; FlexColumnsEditor, FormConfig, WheelNodesEditor |  |
| TE-CMP-components-admin-GenesisFoundationPanel | `src/components/admin/GenesisFoundationPanel.jsx` | 206 | 1 | default; GenesisFoundationPanel |  |
| TE-CMP-components-admin-GlobalStandardsPanel | `src/components/admin/GlobalStandardsPanel.jsx` | 174 | 1 | default; GlobalStandardsPanel |  |
| TE-CMP-components-admin-GovernancePanel | `src/components/admin/GovernancePanel.jsx` | 153 | 1 | default; GovernancePanel |  |
| TE-CMP-components-admin-HerqOutputConfigurator | `src/components/admin/HerqOutputConfigurator.jsx` | 573 | 1 | default; HerqOutputConfigurator |  |
| TE-CMP-components-admin-HerqPanel | `src/components/admin/HerqPanel.jsx` | 630 | 1 | default; HerqPanel |  |
| TE-CMP-components-admin-IconLibraryPanel | `src/components/admin/IconLibraryPanel.jsx` | 82 | 1 | default; IconLibraryPanel |  |
| TE-CMP-components-admin-IconPickerField | `src/components/admin/IconPickerField.jsx` | 91 | 1 | default; IconPickerField |  |
| TE-CMP-components-admin-ImageUploadField | `src/components/admin/ImageUploadField.jsx` | 119 | 2 | default; ImageUploadField |  |
| TE-CMP-components-admin-InboxPanel | `src/components/admin/InboxPanel.jsx` | 241 | 1 | default; InboxPanel |  |
| TE-CMP-components-admin-JourneyReviewScreens | `src/components/admin/JourneyReviewScreens.jsx` | 42 | 1 | RecommendationReviewScreen, ChangePreviewScreen |  |
| TE-CMP-components-admin-L2rDiagnosticPanel | `src/components/admin/L2rDiagnosticPanel.jsx` | 227 | 1 | default; L2rDiagnosticPanel | Lead-to-Revenue Diagnostic panel (2026-08-09, Definition Studio Phase 2) — the real admin tab surfacing server/lib/l2rDiagnosticEngagement.js. Admin-scoped, sam |
| TE-CMP-components-admin-LeadsPanel | `src/components/admin/LeadsPanel.jsx` | 419 | 2 | default; LeadsPanel |  |
| TE-CMP-components-admin-LineagePanel | `src/components/admin/LineagePanel.jsx` | 348 | 1 | default; LineagePanel |  |
| TE-CMP-components-admin-LoginPage | `src/components/admin/LoginPage.jsx` | 316 | 1 | default; LoginPage | Sign-in page. One page, three modes: |
| TE-CMP-components-admin-LonetreeMvpPanel | `src/components/admin/LonetreeMvpPanel.jsx` | 948 | 2 | default; LonetreeMvpPanel |  |
| TE-CMP-components-admin-MemberAccessPanel | `src/components/admin/MemberAccessPanel.jsx` | 87 | 0 | default; MemberAccessPanel |  |
| TE-CMP-components-admin-MemberEntitlementsPanel | `src/components/admin/MemberEntitlementsPanel.jsx` | 108 | 1 | default; MemberEntitlementsPanel | MemberEntitlementsPanel — member-facing view of the Member Entitlement Provisioning pipeline (2026-07-16). Shows which modules (Personal Brand Website, Resume/C |
| TE-CMP-components-admin-MemberFinancialPanel | `src/components/admin/MemberFinancialPanel.jsx` | 85 | 1 | default; MemberFinancialPanel |  |
| TE-CMP-components-admin-MemberPanels | `src/components/admin/MemberPanels.jsx` | 455 | 3 | MemberStatsPanel, MemberAuditPanel, MemberAgentPanel | Three member-only panels: Stats, Audit history, Agent chat. Imported and rendered by AdminShell when the member selects those tabs. |
| TE-CMP-components-admin-MemberPlmPanel | `src/components/admin/MemberPlmPanel.jsx` | 560 | 1 | default; MemberPlmPanel |  |
| TE-CMP-components-admin-MemberProductsPanel | `src/components/admin/MemberProductsPanel.jsx` | 356 | 1 | default; MemberProductsPanel | Member-facing product docs, 5-question sample onboarding journey, and self-service commerce for SMB deliverable packages. Mounted as the 'products' tab in Admin |
| TE-CMP-components-admin-MethodologyConfigPanel | `src/components/admin/MethodologyConfigPanel.jsx` | 127 | 1 | default; MethodologyConfigPanel |  |
| TE-CMP-components-admin-MetricIntelligencePanel | `src/components/admin/MetricIntelligencePanel.jsx` | 49 | 1 | default; MetricIntelligencePanel |  |
| TE-CMP-components-admin-MyResumePanel | `src/components/admin/MyResumePanel.jsx` | 1131 | 1 | default; MyResumePanel |  |
| TE-CMP-components-admin-NetWorksPanel | `src/components/admin/NetWorksPanel.jsx` | 342 | 1 | default; NetWorksPanel | Net Works panel — admin view of every member who has signed up to the Salt Basin platform. Renamed from "members list" to match the brand framing: Salt Basin Ne |
| TE-CMP-components-admin-NotificationBell | `src/components/admin/NotificationBell.jsx` | 144 | 0 | default; NotificationBell |  |
| TE-CMP-components-admin-NrmPanel | `src/components/admin/NrmPanel.jsx` | 423 | 1 | default; NrmPanel |  |
| TE-CMP-components-admin-OrgDocumentsPanel | `src/components/admin/OrgDocumentsPanel.jsx` | 115 | 1 | default; OrgDocumentsPanel | Organization Documents panel (2026-07-27) — gated view of the 'customer_document_delivery' Tributary's satellite table (org_document_projections): a proposal pl |
| TE-CMP-components-admin-OutputTemplateConfigurator | `src/components/admin/OutputTemplateConfigurator.jsx` | 642 | 2 | default; OutputTemplateConfiguratorHub, OutputTemplateConfigurator | OutputTemplateConfigurator — the 4-layer output template editor. One component serves all 5 output types (resume, proposal, case-study, one-pager, build-summary |
| TE-CMP-components-admin-OverlapResolutionJourney | `src/components/admin/OverlapResolutionJourney.jsx` | 53 | 1 | default; OverlapResolutionJourney |  |
| TE-CMP-components-admin-PageLayoutView | `src/components/admin/PageLayoutView.jsx` | 140 | 1 | default; PageLayoutView |  |
| TE-CMP-components-admin-PageTypeManagerPanel | `src/components/admin/PageTypeManagerPanel.jsx` | 245 | 1 | default; PageTypeManagerPanel |  |
| TE-CMP-components-admin-PreviewPane | `src/components/admin/PreviewPane.jsx` | 110 | 1 | default; PreviewPane |  |
| TE-CMP-components-admin-ProfileHub | `src/components/admin/ProfileHub.jsx` | 679 | 1 | default; ProfileHub |  |
| TE-CMP-components-admin-ProposalExperiencePanel | `src/components/admin/ProposalExperiencePanel.jsx` | 410 | 1 | default; ProposalExperiencePanel | Member Experience Module — guided 9-stage Proposal Experience (2026-07-29). This is now the landing view a member sees on /member login (AdminShell scope="membe |
| TE-CMP-components-admin-PublicationsCalendar | `src/components/admin/PublicationsCalendar.jsx` | 135 | 1 | default; PublicationsCalendar |  |
| TE-CMP-components-admin-PublicationsDashboard | `src/components/admin/PublicationsDashboard.jsx` | 95 | 1 | default; PublicationsDashboard |  |
| TE-CMP-components-admin-PublicationsPanel | `src/components/admin/PublicationsPanel.jsx` | 286 | 1 | default; PublicationsPanel |  |
| TE-CMP-components-admin-QAPanel | `src/components/admin/QAPanel.jsx` | 751 | 1 | default; QAPanel | QA Panel — test scenarios + scripts + runs + defects. Form-driven by design. The brain-dump reconciler is a separate surface |
| TE-CMP-components-admin-ScrumAgentPanel | `src/components/admin/ScrumAgentPanel.jsx` | 363 | 1 | default; ScrumAgentPanel | Scrum Agent chat panel — Phase A. Docks on the right side of the Backlog tab. Collapsible. Persists thread |
| TE-CMP-components-admin-SectionLayoutFields | `src/components/admin/SectionLayoutFields.jsx` | 189 | 3 | default; DEFAULT_LAYOUT, getLayout, SectionLayoutFields |  |
| TE-CMP-components-admin-SectionTemplateModal | `src/components/admin/SectionTemplateModal.jsx` | 642 | 2 | default; TEMPLATE_CATEGORIES, SectionTemplateModal |  |
| TE-CMP-components-admin-ServicesPanel | `src/components/admin/ServicesPanel.jsx` | 213 | 1 | default; ServicesPanel |  |
| TE-CMP-components-admin-Sidebar | `src/components/admin/Sidebar.jsx` | 209 | 1 | default; Sidebar |  |
| TE-CMP-components-admin-TestLoginRedirect | `src/components/admin/TestLoginRedirect.jsx` | 11 | 1 | default; TestLoginRedirect |  |
| TE-CMP-components-admin-UploadDataScreen | `src/components/admin/UploadDataScreen.jsx` | 113 | 2 | default; UploadDataScreen | UploadDataScreen (2026-07-16, wired to real endpoints 2026-07-27) — reached from Choose Your Path. Three real paths: download the semantic Excel template (maps  |
| TE-CMP-components-admin-WebsiteIntelligencePanel | `src/components/admin/WebsiteIntelligencePanel.jsx` | 39 | 1 | default; WebsiteIntelligencePanel |  |
| TE-CMP-components-admin-WorldVariantStudioPanel | `src/components/admin/WorldVariantStudioPanel.jsx` | 371 | 1 | default; WorldVariantStudioPanel | Variant Creation Studio (salt-basin-world-variants Phase 8 slice, 2026-09-06) — Betsy asked for "a standalone generator that can create new [world] variants thr |

## `src/config`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-config-architecture-layerRegistry | `src/config/architecture/layerRegistry.js` | 27 | 2 | SaltBasinLayerIndex, LAYER_REGISTRY, semanticIdentity, assertRenderableIdentity |  |
| TE-CMP-config-architecture-objectTypeRegistry | `src/config/architecture/objectTypeRegistry.js` | 16 | 1 | OBJECT_TYPE_REGISTRY |  |
| TE-CMP-config-experience-cameraRegistry | `src/config/experience/cameraRegistry.js` | 12 | 0 | CAMERA_REGISTRY |  |
| TE-CMP-config-experience-characterRegistry | `src/config/experience/characterRegistry.js` | 16 | 0 | USER_CHARACTER_PROFILES, AGENT_CHARACTER_PROFILES |  |
| TE-CMP-config-experience-dashboardDefinitionRegistry | `src/config/experience/dashboardDefinitionRegistry.js` | 60 | 2 | DASHBOARD_LAYOUTS, DASHBOARD_DEFINITION_REGISTRY, getDashboardDefinition, listDashboardDefinitions, validateDashboardDefinitionRegistry | Dashboard Definition Registry — the genuinely new piece of the multi-lens/scenario-scope design (DEC-001 amended, DEC-002, 2026-08-10 plan: "flickering-petting- |
| TE-CMP-config-experience-experienceGenome | `src/config/experience/experienceGenome.js` | 21 | 1 | EXPERIENCE_GENOME, validateGenomeSelection | Salt Basin's compositional visual grammar. New experiences select governed genes; renderers consume the compiled result and never infer business meaning. |
| TE-CMP-config-experience-experienceKnowledgeGraph | `src/config/experience/experienceKnowledgeGraph.js` | 16 | 1 | EXPERIENCE_ARTIFACTS, findReusableExperienceArtifacts |  |
| TE-CMP-config-experience-experienceManifest | `src/config/experience/experienceManifest.js` | 26 | 2 | EXPERIENCE_MANIFEST_VERSION, validateExperienceObject, validateExperienceManifest |  |
| TE-CMP-config-experience-motionRegistry | `src/config/experience/motionRegistry.js` | 13 | 0 | MOTION_REGISTRY |  |
| TE-CMP-config-experience-referenceJourneyManifest | `src/config/experience/referenceJourneyManifest.js` | 42 | 1 | REFERENCE_JOURNEY_MANIFEST |  |
| TE-CMP-config-journeys-journeyDefinitions | `src/config/journeys/journeyDefinitions.js` | 28 | 0 | JOURNEY_DEFINITIONS, TRIBUTARY_RULES, CONFLUENCE_RULES |  |
| TE-CMP-config-metrics-maturityModel | `src/config/metrics/maturityModel.js` | 223 | 5 | MATURITY_LEVELS, MAX_MATURITY_LEVEL, MATURITY_SIGNALS, AGGREGATION, MATURITY_PROFILES, EVIDENCE_CHAIN_STAGES, MATURITY_MODEL, maturityToneFor … +2 | THE canonical Maturity Model — one definition, used by every maturity layer. Rebuilt 2026-07-29 against Betsy's source workbooks rather than inference: |
| TE-CMP-config-metrics-metricCategoryRegistry | `src/config/metrics/metricCategoryRegistry.js` | 17 | 1 | METRIC_CATEGORY_REGISTRY | The 10 fixed metric-category vocabulary from the Visual Metrics master prompt (§XIV). Every entry in metricDefinitionRegistry.js must use one of these category  |
| TE-CMP-config-metrics-metricDefinitionRegistry | `src/config/metrics/metricDefinitionRegistry.js` | 203 | 3 | METRIC_DEFINITION_REGISTRY, metricsByCategory, metricsByImplementationStatus | The Metric Definition Registry (Visual Metrics master prompt §XV) — the single source of truth for what every semantic metric in the 3D environment means, how i |
| TE-CMP-config-metrics-queryContextRegistry | `src/config/metrics/queryContextRegistry.js` | 77 | 2 | QUERY_CONTEXT_REGISTRY, QUERY_INTERACTION_REGISTRY | Active Query Context definitions (Visual Metrics master prompt §I–§IV). An Orbit selection in the world (Customer / Revenue / Member) sets `active_query_context |
| TE-CMP-config-metrics-queryConvergenceMethodology | `src/config/metrics/queryConvergenceMethodology.js` | 24 | 3 | QUERY_CONVERGENCE_METHODOLOGY |  |
| TE-CMP-config-metrics-queryRelevanceNarrative | `src/config/metrics/queryRelevanceNarrative.js` | 43 | 1 | RELEVANCE_COMPONENT_LABELS, describeRelevanceComponents, generateElementBusinessMeaning | §XVI Steps 4–5: "Why This Element Converged" drill-through and the generated plain-language business-meaning sentence. Every sentence here is built from the rea |
| TE-CMP-config-metrics-rodMathematicsMethodology | `src/config/metrics/rodMathematicsMethodology.js` | 180 | 4 | ROD_MATHEMATICS_METHODOLOGY, CROSS_ROD_STATE_EXPECTATIONS | Channel Rod mathematics methodology. Rewritten 2026-07-29 to match the Maturity and Confidence principles: |
| TE-CMP-config-ux-uxRepairRegistry | `src/config/ux/uxRepairRegistry.js` | 20 | 1 | UX_REPAIR_REGISTRY, getUxRepairRecipe | Approved repair vocabulary for deterministic UX work orders. Detection is automatic; design-changing recipes remain approval-bound. |
| TE-CMP-config-visual-journeyWorldExperience | `src/config/visual/journeyWorldExperience.js` | 85 | 2 | JOURNEY_WORLD_EXPERIENCE, resolveJourneyObjectGroup, validateJourneyWorldExperience | Editable presentation and interaction contract for the Spatial Journey World. Semantic evaluation remains in the journey/maturity engines; this registry control |
| TE-CMP-config-visual-lonetreeProposalNarrative | `src/config/visual/lonetreeProposalNarrative.js` | 22 | 1 | LONETREE_PROPOSAL_NARRATIVE |  |
| TE-CMP-config-visual-lonetreeProspectExperience | `src/config/visual/lonetreeProspectExperience.js` | 108 | 3 | LONETREE_PROSPECT_EXPERIENCE, validateLonetreeProspectExperience |  |
| TE-CMP-config-visual-metricVisualEncodingRegistry | `src/config/visual/metricVisualEncodingRegistry.js` | 57 | 1 | METRIC_VISUAL_ENCODING_REGISTRY, ATOM_RENDER_PROFILE, validateVisualEncodingRegistry, resolveQueryDistance |  |
| TE-CMP-config-visual-visualSemanticRegistry | `src/config/visual/visualSemanticRegistry.js` | 19 | 2 | GEOMETRY_REGISTRY, VISUAL_SEMANTIC_REGISTRY, legendEntries |  |
| TE-CMP-config-visual-worldCompositionRegistry | `src/config/visual/worldCompositionRegistry.js` | 109 | 2 | SHARED_WORLD_STATE_REFERENCE, DEFAULT_VARIANT_KEY, WORLD_DEFAULT_VARIANT, resolveDefaultVariantForWorld, resolveWorldComposition, validateWorldCompositionRegistry, listWorldCompositions, resolveDashboardComposition | Candidate view-composition registry. Betsy's 2026-08-10 clarification supersedes the earlier assumption that each domain world owns different underlying data: o |
| TE-CMP-config-visual-worldRegistry | `src/config/visual/worldRegistry.js` | 24 | 2 | WORLD_REGISTRY, ROTATION_CHOREOGRAPHY_REGISTRY, getWorldDefinition |  |
| TE-CMP-config-visual-worldVariantComponentProfiles | `src/config/visual/worldVariantComponentProfiles.js` | 437 | 2 | WORLD_VARIANT_COMPONENT_PROFILES, getWorldVariantComponentProfile, validateWorldVariantComponentProfile, validateAllWorldVariantComponentProfiles | World Variant Engine Phase 4 (master-build-prompt.md §VI) — the nine Variant Component Profile systems (Orbit, Atom, Molecule, Rod, Lineage, Convergence, Enviro |
| TE-CMP-config-visual-worldVariantEncodingProfiles | `src/config/visual/worldVariantEncodingProfiles.js` | 575 | 4 | VISUAL_CHANNEL, CURVE_TYPE, QUERY_RELEVANCE_BANDS, WORLD_VARIANT_ENCODING_PROFILES, getVisualEncodingProfile, shellRadiusForBand, validateVisualEncodingProfile, validateAllVisualEncodingProfiles … +2 | World Variant Engine Phase 3 (master-build-prompt.md §IV, §VII) — the per-variant VisualEncodingProfile layer and the typed WorldVariantConfig schema/validators |
| TE-CMP-config-visual-worldVariantGenerativeSeed | `src/config/visual/worldVariantGenerativeSeed.js` | 167 | 3 | GENERATIVE_PRIMITIVE_FAMILY, GENERATIVE_ACCENT_TOKEN, DEFAULT_GENERATIVE_SEED_SPEC, createSeededRandom, facetCountForAmount, validateGenerativeSeedSpec, resolveGenerativeCluster, describeGenerativeSeedSpec | World Variant Engine — Phase 8 slice: Variant Creation Studio, generative seed layer (salt-basin-world-variants, 2026-09-06). Betsy asked for "a standalone gene |
| TE-CMP-config-visual-worldVariantRegistry | `src/config/visual/worldVariantRegistry.js` | 200 | 8 | WORLD_VARIANT_STATUS, WORLD_VARIANT_FAMILY, WORLD_VARIANT_SEMANTIC_INVARIANTS, validateSemanticInvariantCoverage, WORLD_VARIANT_REGISTRY, getWorldVariantDefinition, listWorldVariants, listWorldVariantsByStatus … +1 | The World Variant Registry (3D World Variant Engine master prompt §II) — the single source of truth for which spatial metaphors exist over the Salt Basin semant |

## `src/data`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-data-backlogFieldSchema | `src/data/backlogFieldSchema.js` | 126 | 2 | BACKLOG_FIELD_SCHEMA, fieldPresent, fieldsForCategory, fieldsForDimension, categoryScore, dimensionScore, missingFields, missingDimensionFields … +1 | The literal field catalog that backs the "Data Definition" stage gate and the definition-shaped methodology dimensions (businessDefinition, functionalDesign, te |
| TE-CMP-data-businessDefinitionExperienceConfig | `src/data/businessDefinitionExperienceConfig.js` | 685 | 1 | businessDefinitionExperienceConfig |  |
| TE-CMP-data-capabilityTags | `src/data/capabilityTags.js` | 185 | 1 | ALL_TAGS, TAG_CATEGORIES, TAG_BY_ID, SOURCE_TYPES, MERGED_FIELD_DEFAULTS | Canonical capability tag registry. Tags are sourced from two data models: |
| TE-CMP-data-crystalExperienceConfig | `src/data/crystalExperienceConfig.js` | 88 | 2 | DEFAULT_CRYSTAL_EXPERIENCE, mergeCrystalExperience |  |
| TE-CMP-data-dealJourneyExperience | `src/data/dealJourneyExperience.js` | 18 | 1 | DEAL_JOURNEY_EXPERIENCE | Configurable Deal Journey seed transcribed from the user-supplied HTML. The spatial renderer and the stage panel consume this same object. |
| TE-CMP-data-elementRegistry | `src/data/elementRegistry.js` | 122 | 0 | ELEMENT_CATEGORY, ELEMENT_REGISTRY, getElement, isAllowedValue | The periodic table of the Spatial Journey World: field datatypes / semantic primitives, defined once and reused by every atom on every rod template. An element  |
| TE-CMP-data-handoverOsScenarioLibrary | `src/data/handoverOsScenarioLibrary.js` | 25 | 1 | HOS_EDGE_CASES, compileHosScenarioInsights |  |
| TE-CMP-data-journeyWorldConfig | `src/data/journeyWorldConfig.js` | 247 | 1 | MOLECULE_DEFINITIONS, MEMBER_ORGANIZATION_RELATIONSHIP_TYPE, REVENUE_ROD_TEMPLATE, CUSTOMER_ROD_TEMPLATE, MEMBER_ROD_TEMPLATE, ROD_TEMPLATES, OBJECTIVES, SEED_LEADS | The Spatial Journey World's domain configuration: the three Lifecycle Journey Data Rod *type* templates (Revenue / Customer / Member), the Private Equity Deal v |
| TE-CMP-data-memberWorldRegistry | `src/data/memberWorldRegistry.js` | 107 | 1 | MEMBER_WORLD_REGISTRY, DEFAULT_EDGE_CARDS, provisionMemberWorlds | Canonical member experience topology. This is intentionally data-first: the visual orbit, city, journey paths, entitlement gates, and workspace routes all consu |
| TE-CMP-data-platformLifecycleConfig | `src/data/platformLifecycleConfig.js` | 375 | 1 | PLATFORM_LIFECYCLE_CONFIG, pct, clamp01, average, backlogItemToLifecycleRecord, computedLifecycleStage, lifecycleGateGaps, gateLabel |  |
| TE-CMP-data-platformModules | `src/data/platformModules.js` | 60 | 1 | PLATFORM_MODULES, UNASSIGNED_MODULE, moduleForGroupSlug | The 11-app Application Map from PLATFORM_MERGE_SPEC.md §9 — the canonical list of modules the Operating Model Dashboard breaks its backlog down by. This is deli |

## `src/lib`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-lib-analytics | `src/lib/analytics.js` | 39 | 1 | track | Client-side analytics event tracker. All events POST to /api/analytics/events — fire-and-forget, never throws. |
| TE-CMP-lib-api | `src/lib/api.js` | 590 | 62 | api | Thin fetch wrapper. All admin routes are cookie-authed; we always send credentials. |
| TE-CMP-lib-bestyStaffAttribution | `src/lib/bestyStaffAttribution.js` | 22 | 3 | recordBestyTouch, readBestyAttribution |  |
| TE-CMP-lib-bestyStaffScript | `src/lib/bestyStaffScript.js` | 157 | 1 | CONSENT_LINE, KNOWS_BETSY_QUESTION, TOP_QUESTIONS_QUESTION, CLOSING_QUESTION, CONTACT_LINE, FLOW_QUICK_REPLIES, SAFE_ANSWER_BANK, matchSafeAnswer … +6 | BestyStaff cache layer — deterministic conversation script + guardrail-safe answer bank, transcribed verbatim from docs/salt-basin-specific-agent-playbook.md (t |
| TE-CMP-lib-brandIconData | `src/lib/brandIconData.js` | 339 | 2 | ICON_VIEWBOX, ICONS, ICON_NAMES | Salt Basin Net Works — brand icon geometry, single source of truth. Shared by src/lib/brandIcons.jsx (React) and scripts/exportBrandIcons.mjs (standalone .svg e |
| TE-CMP-lib-brandIcons | `src/lib/brandIcons.jsx` | 62 | 1 | default; BrandIcon | Salt Basin Net Works — brand icon set. Two brand modes, one geometry source (brandIconData.js): 'operator' — Strategic Operator: crisp stroke, currentColor, no  |
| TE-CMP-lib-careerMaster | `src/lib/careerMaster.js` | 45 | 3 | fetchCareerMaster, TIER_FILL_PCT, tierFillPct, toolWheelBucket | Shared client-side accessor for the public Career Master read endpoint. Multiple blocks (timeline, industry wheel, case studies, skills grid) on the same page a |
| TE-CMP-lib-crystalGeometry | `src/lib/crystalGeometry.js` | 499 | 10 | addCrystalLights, CRYSTAL_VARIANTS, buildGemMesh, buildRiverParticles, advanceRiverParticles, projectToScreen | Shared Three.js crystal recipes. SaltBasinCrystal.jsx (single-object mark/ hero/backdrop crystal), CrystalOfficeScene.jsx (crystal-city destinations), and Cryst |
| TE-CMP-lib-experienceAssetPipeline | `src/lib/experienceAssetPipeline.js` | 13 | 0 | ASSET_PIPELINE_STATES, resolveAssetRequest |  |
| TE-CMP-lib-experienceCompiler | `src/lib/experienceCompiler.js` | 27 | 1 | compileExperience |  |
| TE-CMP-lib-experienceEngine-lonetreeExperience | `src/lib/experienceEngine/lonetreeExperience.js` | 425 | 1 | STAGE_ORDER, STAGE_DEFS, METRIC_DEFS, STAGE_METRICS, resolveExperience | Experience Engine v1 (2026-07-29) — per Betsy's Interaction Layer feedback: a first-class layer between the semantic runtime (the Lonetree demo API payloads) an |
| TE-CMP-lib-hooks-useCareerPlacementAgents | `src/lib/hooks/useCareerPlacementAgents.js` | 403 | 2 | CAREER_DIMENSION_FIELDS, STAGE_LABELS, useCareerPlacementAgents |  |
| TE-CMP-lib-hooks-useCommercialOpportunities | `src/lib/hooks/useCommercialOpportunities.js` | 52 | 2 | COMMERCIAL_DIMENSION_FIELDS, EXPANSION_RING_OPTIONS, useCommercialOpportunities |  |
| TE-CMP-lib-hooks-useOpportunityPipeline | `src/lib/hooks/useOpportunityPipeline.js` | 121 | 2 | useOpportunityPipeline | Shared data/state logic for the two "opportunity pipeline" surfaces (Career Placement Agents, Commercial Opportunity Pipeline) — extracted (2026-08-07) from wha |
| TE-CMP-lib-hooks-usePublicationPipeline | `src/lib/hooks/usePublicationPipeline.js` | 80 | 1 | usePublicationPipeline | Publication journey data hook (2026-08-07) — real data for the HERQ Publications island (and, later, Marketing Ads / Research Reports on the identical shape). R |
| TE-CMP-lib-iconRegistry | `src/lib/iconRegistry.jsx` | 227 | 2 | default; ICON_CATEGORIES, getIconDef, listIcons, Icon |  |
| TE-CMP-lib-journeyEngine-atomGeometry | `src/lib/journeyEngine/atomGeometry.js` | 149 | 2 | getBipyramidParts, getConfiguredAtomParts, buildAtomMaterial, buildStageAnchorMesh, buildMoleculeShellMesh, buildHashNodeMesh, buildReconciliationRingMesh, buildHomeAnchorPinMesh … +2 | Geometry/material builders for the Spatial Journey World's own object vocabulary — this is deliberately separate from crystalGeometry.js, whose contract is name |
| TE-CMP-lib-journeyEngine-basin | `src/lib/journeyEngine/basin.js` | 157 | 2 | STATE_STRATA, DATA_BASINS, basinFor, computeAtomDensity, computeCompositionDensity, computeRodDensity, classifyStratum, isSuspended … +5 | Propagation layer of Salt Basin Divergent State Mechanics: how state is distributed and settles, as opposed to what it's made of (bonding.js) or how far correla |
| TE-CMP-lib-journeyEngine-bonding | `src/lib/journeyEngine/bonding.js` | 125 | 2 | tagOverlapRatio, selectMoleculeVariant, computeBonds, assembleMolecules | Magnetic-property compatibility -> Bond formation -> Molecule assembly. An atom carries `magneticProperties` (attraction tags). A molecule |
| TE-CMP-lib-journeyEngine-divergence | `src/lib/journeyEngine/divergence.js` | 125 | 1 | computeStateVector, getSnapshots, computeCorrelatedStateEnvelope, computeHeterosemanticDivergence, classifyDivergence, isReconciliationBoundaryExceedance, recordPerturbation | Divergence layer of Salt Basin Divergent State Mechanics — the surviving concept from prior-art pressure testing, renamed from "Orbital Divergence" to Heterosem |
| TE-CMP-lib-journeyEngine-genesis | `src/lib/journeyEngine/genesis.js` | 228 | 1 | evaluateGenesisRules, LEAD_GENESIS_RULES, fromLead, fromMoleculeProduction, buildRodFromPlan, buildRodFromJourneyDefinition | The Lead -> Rod (and Molecule -> Master Data Rod) genesis rule engine. One generic matcher (`evaluateGenesisRules`) evaluates a rule set that is |
| TE-CMP-lib-journeyEngine-layout | `src/lib/journeyEngine/layout.js` | 98 | 1 | computeRodLayout, computeGateDimensionRibs | Non-parallel, gate-driven spatial layout. Rods are not three parallel corridors. Each rod (other than the root) |
| TE-CMP-lib-journeyEngine-lineage | `src/lib/journeyEngine/lineage.js` | 110 | 2 | getAtomLineage, lineageValueAtOffset, bumpVersion | Deterministic per-atom lineage: a 10-week history + up to two pending future branches (open decisions/deals that would move the atom in the next review cycle),  |
| TE-CMP-lib-journeyEngine-maturity | `src/lib/journeyEngine/maturity.js` | 113 | 3 | clamp01, rollupStageMaturity, rollupMoleculeMaturity, bandForMaturity, computeAtomVisual, evaluateGate | Stage/molecule maturity rollups and gate evaluation. Gates are soft guidance ("here's what's missing"), never a hard stop — |
| TE-CMP-lib-journeyEngine-maturityEngine | `src/lib/journeyEngine/maturityEngine.js` | 163 | 1 | computeMaturity, applyVolatility, facetCountForMaturity | The single maturity engine. Every maturity layer calls this one function. Betsy, 2026-07-29: "I want all maturity to be the most robust definition that |
| TE-CMP-lib-journeyEngine-mockAgentProvider | `src/lib/journeyEngine/mockAgentProvider.js` | 65 | 1 | ROLE_PERMISSIONS, getPermissionProfile, describeAtomConflict, describeGateStatus, describeMergeProposal, describeOutputsAgentAvailability, describeModuleAccess | Deterministic mock agent responses — the demo must function without any external AI API, so every message here is generated from real rod/atom/ gate state, neve |
| TE-CMP-lib-journeyEngine-pathColor | `src/lib/journeyEngine/pathColor.js` | 34 | 1 | PINNED_PATH_COLORS, FALLBACK_PATH_PALETTE, RISK_COLOR, resolvePathColor | Deterministic permanent path-color identity (see spec: same semantic path -> same color across journeys/rods/users/sessions, never derived from array order or o |
| TE-CMP-lib-journeyEngine-queryConvergence | `src/lib/journeyEngine/queryConvergence.js` | 90 | 1 | calculateQueryRelevance, deriveRelevanceComponents, calculateQueryCoverage, calculateQueryConfidence, calculateConvergenceStability, deriveQueryEvidenceMetrics |  |
| TE-CMP-lib-journeyEngine-rodHash | `src/lib/journeyEngine/rodHash.js` | 93 | 1 | computeRodHash, triangulateEntity, triangulateStages | The real-time convergence/query engine. Molecules and atoms never leave their rod — the rod is the sole source of |
| TE-CMP-lib-journeyEngine-rodMathematics | `src/lib/journeyEngine/rodMathematics.js` | 137 | 1 | calculateRodPosition, calculateStageCompleteness, calculateStageReadiness, calculateChannelMaturity, calculateStateConfidence, recencyScore, calculateJourneyDensity, calculateRodCoherence … +1 |  |
| TE-CMP-lib-maturityScoring | `src/lib/maturityScoring.js` | 73 | 3 | scoreFieldDensity, scoreDestinationMaturity, maturityBandFor | Computes real, weighted content-density scores instead of hand-picked maturity numbers. Every place the 3D crystal experience colors, sizes, or orders something |
| TE-CMP-lib-mergeFieldRegistry | `src/lib/mergeFieldRegistry.js` | 324 | 1 | MERGE_FIELDS, fieldsForContext, fieldsByNamespace, fieldByPath, NAMESPACE_LABELS | Merge field registry — canonical schema of every interpolatable field available in output templates. Used to power the field picker in the block editor so that  |
| TE-CMP-lib-outputBlocks | `src/lib/outputBlocks.js` | 1010 | 2 | BLOCK_DEFS, renderBlockToHtml, renderTemplateToHtml, renderMemberFooterHtml, buildStatBlocksFromLayerConfig, buildInfographicBlocksFromLayerConfig, buildBlocksFromLayerConfig, DEFAULT_TEMPLATES … +1 | Output block system — machine-readable block configs that drive all rendered outputs. Blocks are stored as JSON in the DB and rendered to HTML via renderTemplat |
| TE-CMP-lib-recaptcha | `src/lib/recaptcha.js` | 67 | 4 | getRecaptchaToken | reCAPTCHA v3 client. Loads the Google reCAPTCHA script lazily on first use, then exposes |
| TE-CMP-lib-resumeDensity | `src/lib/resumeDensity.js` | 119 | 0 | CHARS_PER_LINE, LINES_PER_PAGE, estimateBlockLines, fitSectionsToPage | Resume density / white-space engine (layer 4, resume-type outputs only). Deterministic line-estimation so a rendered resume never has dead whitespace: sections  |
| TE-CMP-lib-resumeUrls | `src/lib/resumeUrls.js` | 26 | 1 | resumeUrlFromPreset, primaryResumeUrl |  |
| TE-CMP-lib-riverSystemMap | `src/lib/riverSystemMap.js` | 45 | 1 | RIVER_MAP_VIEWBOX, RIVER_TRUNK_PATH, RIVER_TRIBUTARIES, RIVER_ENDPOINTS, riverSystemMapSvg | River System Map — a branching main-trunk + tributaries diagram, matching the brandIconData.js stroke language (rounded caps, currentColor-able, stroke-only, no |
| TE-CMP-lib-sceneManifest | `src/lib/sceneManifest.js` | 99 | 3 | normalizeSceneManifest, validateSceneManifest, attachSceneManifest, attachSceneManifestTree, collectSceneManifest, auditSceneManifest, publishSceneManifest, removePublishedSceneManifest | Runtime lineage contract for governed Three.js worlds. The manifest is metadata-only: attaching it never changes geometry, material, layout, or interaction beha |
| TE-CMP-lib-semanticMigrationAdapter | `src/lib/semanticMigrationAdapter.js` | 21 | 0 | migrateLegacyJourneyObject |  |
| TE-CMP-lib-toast | `src/lib/toast.js` | 29 | 52 | toast | Minimal toast utility — no provider, just a singleton element. |
| TE-CMP-lib-useSeoHead | `src/lib/useSeoHead.js` | 59 | 2 | useSeoHead |  |
| TE-CMP-lib-uxRuntimeAudit | `src/lib/uxRuntimeAudit.js` | 86 | 1 | scoreUxFindings, auditRenderedExperience, publishUxRuntimeAudit | Deterministic, read-only experiential audit. Unlike registry validation, these checks measure the rendered experience in the current viewport. |
| TE-CMP-lib-vendorLogos | `src/lib/vendorLogos.jsx` | 67 | 1 | VENDOR_LOGOS, getVendorLogo, VendorLogo |  |
| TE-CMP-lib-websiteIntelligence | `src/lib/websiteIntelligence.js` | 72 | 1 | WEBSITE_SOURCE_TYPES, normalizePages, createWebsitePageInventory, summarizeInventory |  |
| TE-CMP-lib-worldIslands | `src/lib/worldIslands.js` | 201 | 2 | ISLAND_REGISTRY, resolveWorldIslands | Resolves a logged-in user's World Shell islands from data that's already the real "what can this user see" source of truth — a member's own `member_configs` nav |

## `src/main.jsx`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-main | `src/main.jsx` | 12 | 0 |  |  |

## `src/scenarios`

| Element ID | File | Lines | Imported by | Exports (named) | Header comment (first lines) |
|---|---|---|---|---|---|
| TE-CMP-scenarios-fixtureGenerator | `src/scenarios/fixtureGenerator.js` | 12 | 0 | generateScenarioFixture, compareFixtureOutputs |  |
| TE-CMP-scenarios-scenarioObservation | `src/scenarios/scenarioObservation.js` | 8 | 0 | createScenarioObservation |  |
| TE-CMP-scenarios-scenarioRegistry | `src/scenarios/scenarioRegistry.js` | 42 | 2 | DEFAULT_ATOM_WEIGHTS, compareAtoms, ScenarioRegistry |  |
| TE-CMP-scenarios-scenarioSignature | `src/scenarios/scenarioSignature.js` | 21 | 1 | canonicalizeAtomAssignments, createScenarioSignature |  |
