# Registries (block types, admin tabs, themes, crystal variants)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


## Section block REGISTRY — `src/components/blocks/index.jsx`

Append-only per CLAUDE.md deployment-safety invariant. Unknown `section.type` falls back to `TextBlock` (static evidence: `REGISTRY[section.type] || TextBlock`). 67 keys.

| Element ID | section.type key | Component | Component defined at | Registry line |
|---|---|---|---|---|
| TE-BLK-hero | `hero` | HeroBlock | `src/components/blocks/index.jsx:123` | `src/components/blocks/index.jsx:5696` |
| TE-BLK-scripture | `scripture` | ScriptureBlock | `src/components/blocks/index.jsx:265` | `src/components/blocks/index.jsx:5697` |
| TE-BLK-about | `about` | AboutBlock | `src/components/blocks/index.jsx:303` | `src/components/blocks/index.jsx:5698` |
| TE-BLK-cards | `cards` | CardsBlock | `src/components/blocks/index.jsx:392` | `src/components/blocks/index.jsx:5699` |
| TE-BLK-twoCol | `twoCol` | TwoColBlock | `src/components/blocks/index.jsx:523` | `src/components/blocks/index.jsx:5700` |
| TE-BLK-resume | `resume` | ResumeBlock | `src/components/blocks/index.jsx:605` | `src/components/blocks/index.jsx:5701` |
| TE-BLK-socialGrid | `socialGrid` | SocialGridBlock | `src/components/blocks/index.jsx:743` | `src/components/blocks/index.jsx:5702` |
| TE-BLK-contact | `contact` | ContactBlock | `src/components/blocks/index.jsx:812` | `src/components/blocks/index.jsx:5703` |
| TE-BLK-text | `text` | TextBlock | `src/components/blocks/index.jsx:851` | `src/components/blocks/index.jsx:5704` |
| TE-BLK-cta | `cta` | CtaBlock | `src/components/blocks/index.jsx:894` | `src/components/blocks/index.jsx:5705` |
| TE-BLK-industries | `industries` | IndustriesBlock | `src/components/blocks/index.jsx:941` | `src/components/blocks/index.jsx:5706` |
| TE-BLK-domains | `domains` | DomainsBlock | `src/components/blocks/index.jsx:1003` | `src/components/blocks/index.jsx:5707` |
| TE-BLK-services | `services` | ServicesBlock | `src/components/blocks/index.jsx:1101` | `src/components/blocks/index.jsx:5708` |
| TE-BLK-assessments | `assessments` | AssessmentsBlock | `src/components/blocks/index.jsx:1205` | `src/components/blocks/index.jsx:5709` |
| TE-BLK-joinNetwork | `joinNetwork` | JoinNetworkBlock | `src/components/blocks/index.jsx:1812` | `src/components/blocks/index.jsx:5710` |
| TE-BLK-referencesRequest | `referencesRequest` | ReferencesRequestBlock | `src/components/blocks/index.jsx:1623` | `src/components/blocks/index.jsx:5711` |
| TE-BLK-forCompanies | `forCompanies` | ForCompaniesBlock | `src/components/blocks/index.jsx:1878` | `src/components/blocks/index.jsx:5712` |
| TE-BLK-industryWheel | `industryWheel` | IndustryWheelBlock | `src/components/blocks/index.jsx:2164` | `src/components/blocks/index.jsx:5713` |
| TE-BLK-flexColumns | `flexColumns` | FlexColumnsBlock | `src/components/blocks/ColumnWidgets.jsx` | `src/components/blocks/index.jsx:5714` |
| TE-BLK-domainsNiche | `domainsNiche` | DomainsNicheBlock | `src/components/blocks/index.jsx:2228` | `src/components/blocks/index.jsx:5715` |
| TE-BLK-technology | `technology` | TechnologyBlock | `src/components/blocks/index.jsx:2653` | `src/components/blocks/index.jsx:5716` |
| TE-BLK-aboutIntro | `aboutIntro` | AboutIntroBlock | `src/components/blocks/index.jsx:2716` | `src/components/blocks/index.jsx:5717` |
| TE-BLK-execDashboard | `execDashboard` | ExecDashboardBlock | `src/components/blocks/index.jsx:3054` | `src/components/blocks/index.jsx:5718` |
| TE-BLK-timeline | `timeline` | TimelineBlock | `src/components/blocks/index.jsx:3316` | `src/components/blocks/index.jsx:5719` |
| TE-BLK-caseStudies | `caseStudies` | CaseStudiesBlock | `src/components/blocks/index.jsx:3930` | `src/components/blocks/index.jsx:5720` |
| TE-BLK-netWorksBanner | `netWorksBanner` | NetWorksBannerBlock | `src/components/blocks/index.jsx:4156` | `src/components/blocks/index.jsx:5721` |
| TE-BLK-statGrid | `statGrid` | StatGridBlock | `src/components/blocks/index.jsx:4274` | `src/components/blocks/index.jsx:5722` |
| TE-BLK-process | `process` | ProcessBlock | `src/components/blocks/index.jsx:4297` | `src/components/blocks/index.jsx:5723` |
| TE-BLK-columns | `columns` | ColumnsBlock | `src/components/blocks/index.jsx:4617` | `src/components/blocks/index.jsx:5724` |
| TE-BLK-iconGrid | `iconGrid` | IconGridBlock | `src/components/blocks/index.jsx:4641` | `src/components/blocks/index.jsx:5725` |
| TE-BLK-kpiDashboard | `kpiDashboard` | KpiDashboardBlock | `src/components/blocks/index.jsx:4685` | `src/components/blocks/index.jsx:5726` |
| TE-BLK-roadmap | `roadmap` | RoadmapBlock | `src/components/blocks/index.jsx:4729` | `src/components/blocks/index.jsx:5727` |
| TE-BLK-heatmap | `heatmap` | HeatmapBlock | `src/components/blocks/index.jsx:4778` | `src/components/blocks/index.jsx:5728` |
| TE-BLK-leaderboard | `leaderboard` | LeaderboardBlock | `src/components/blocks/index.jsx:4852` | `src/components/blocks/index.jsx:5729` |
| TE-BLK-executiveSummary | `executiveSummary` | ExecutiveSummaryBlock | `src/components/blocks/index.jsx:4902` | `src/components/blocks/index.jsx:5730` |
| TE-BLK-appMockup | `appMockup` | AppMockupBlock | `src/components/blocks/index.jsx:4956` | `src/components/blocks/index.jsx:5731` |
| TE-BLK-choiceGrid | `choiceGrid` | ChoiceGridBlock | `src/components/blocks/index.jsx:5025` | `src/components/blocks/index.jsx:5732` |
| TE-BLK-decisionTree | `decisionTree` | DecisionTreeBlock | `src/components/blocks/index.jsx:5081` | `src/components/blocks/index.jsx:5733` |
| TE-BLK-outputGenerator | `outputGenerator` | OutputGeneratorBlock | `src/components/blocks/index.jsx:5163` | `src/components/blocks/index.jsx:5734` |
| TE-BLK-skills | `skills` | SkillsBlock | `src/components/blocks/index.jsx:5331` | `src/components/blocks/index.jsx:5735` |
| TE-BLK-clientSnapshot | `clientSnapshot` | ClientSnapshotBlock | `src/components/blocks/index.jsx:5405` | `src/components/blocks/index.jsx:5736` |
| TE-BLK-customOutputBlock | `customOutputBlock` | CustomOutputBlock | `src/components/blocks/index.jsx:5546` | `src/components/blocks/index.jsx:5737` |
| TE-BLK-careerExplorer | `careerExplorer` | CareerExplorerBlock | `src/components/blocks/index.jsx:5569` | `src/components/blocks/index.jsx:5738` |
| TE-BLK-accentStatCards | `accentStatCards` | AccentStatCardsBlock | `src/components/blocks/index.jsx:4338` | `src/components/blocks/index.jsx:5739` |
| TE-BLK-cascadeFlow | `cascadeFlow` | CascadeFlowBlock | `src/components/blocks/index.jsx:4384` | `src/components/blocks/index.jsx:5740` |
| TE-BLK-architectureSteps | `architectureSteps` | ArchitectureStepsBlock | `src/components/blocks/index.jsx:4433` | `src/components/blocks/index.jsx:5741` |
| TE-BLK-productHero | `productHero` | ProductHeroBlock | unresolved | `src/components/blocks/index.jsx:5742` |
| TE-BLK-marketingHooks | `marketingHooks` | MarketingHooksBlock | unresolved | `src/components/blocks/index.jsx:5743` |
| TE-BLK-rotatingHighlights | `rotatingHighlights` | RotatingHighlightsBlock | unresolved | `src/components/blocks/index.jsx:5744` |
| TE-BLK-buildFlow | `buildFlow` | BuildFlowBlock | unresolved | `src/components/blocks/index.jsx:5745` |
| TE-BLK-journeyRods | `journeyRods` | JourneyRodsBlock | unresolved | `src/components/blocks/index.jsx:5746` |
| TE-BLK-productCatalog | `productCatalog` | ProductCatalogBlock | unresolved | `src/components/blocks/index.jsx:5747` |
| TE-BLK-exposureCalculator | `exposureCalculator` | ExposureCalculatorBlock | unresolved | `src/components/blocks/index.jsx:5748` |
| TE-BLK-apiCatalogTable | `apiCatalogTable` | ApiCatalogTableBlock | unresolved | `src/components/blocks/index.jsx:5749` |
| TE-BLK-startEngagement | `startEngagement` | StartEngagementBlock | unresolved | `src/components/blocks/index.jsx:5750` |
| TE-BLK-platformCadence | `platformCadence` | PlatformCadenceBlock | unresolved | `src/components/blocks/index.jsx:5751` |
| TE-BLK-conversationalDemo | `conversationalDemo` | ConversationalDemoBlock | unresolved | `src/components/blocks/index.jsx:5752` |
| TE-BLK-salterMomentumMethod | `salterMomentumMethod` | SalterMomentumMethodBlock | unresolved | `src/components/blocks/index.jsx:5753` |
| TE-BLK-metadataModelDiagram | `metadataModelDiagram` | MetadataModelDiagramBlock | unresolved | `src/components/blocks/index.jsx:5754` |
| TE-BLK-methodologyMath | `methodologyMath` | MethodologyMathBlock | unresolved | `src/components/blocks/index.jsx:5755` |
| TE-BLK-careerHeroOrbit | `careerHeroOrbit` | CareerHeroOrbitBlock | unresolved | `src/components/blocks/index.jsx:5756` |
| TE-BLK-careerLensTabs | `careerLensTabs` | CareerLensTabsBlock | unresolved | `src/components/blocks/index.jsx:5757` |
| TE-BLK-careerRollupShowcase | `careerRollupShowcase` | CareerRollupShowcaseBlock | unresolved | `src/components/blocks/index.jsx:5758` |
| TE-BLK-careerJourneyStepper | `careerJourneyStepper` | CareerJourneyStepperBlock | unresolved | `src/components/blocks/index.jsx:5759` |
| TE-BLK-evidenceChainDiagram | `evidenceChainDiagram` | EvidenceChainDiagramBlock | `src/components/blocks/index.jsx:4484` | `src/components/blocks/index.jsx:5760` |
| TE-BLK-orbitModelDiagram | `orbitModelDiagram` | OrbitModelDiagramBlock | `src/components/blocks/index.jsx:4530` | `src/components/blocks/index.jsx:5761` |
| TE-BLK-maturitySignalsDiagram | `maturitySignalsDiagram` | MaturitySignalsDiagramBlock | `src/components/blocks/index.jsx:4577` | `src/components/blocks/index.jsx:5762` |

### SUBSECTION_REGISTRY (5)

| Key | Component |
|---|---|
| `text` | SubSectionText |
| `image` | SubSectionImage |
| `hoverIcon` | SubSectionHoverIcon |
| `dashboardRollup` | SubSectionDashboardRollup |
| `outputGenerator` | SubSectionOutputGenerator |

## Admin `TAB_COMPONENTS` — `src/components/admin/AdminShell.jsx`

32 componentIds. `content` and `config` are handled inline in AdminShell (not in this map). Which tabs a user actually sees is driven by `config_state` id `admin_nav` (admins) or the member's `navigation.memberTabs` (members) — see module spec.

| Element ID | componentId | Component | Props | Location |
|---|---|---|---|---|
| TE-TAB-leads | `leads` | LeadsPanel |  | `src/components/admin/AdminShell.jsx:67` |
| TE-TAB-networks | `networks` | NetWorksPanel |  | `src/components/admin/AdminShell.jsx:68` |
| TE-TAB-backlog | `backlog` | BacklogPanel |  | `src/components/admin/AdminShell.jsx:69` |
| TE-TAB-feedback | `feedback` | FeedbackPanel |  | `src/components/admin/AdminShell.jsx:70` |
| TE-TAB-qa | `qa` | QAPanel |  | `src/components/admin/AdminShell.jsx:71` |
| TE-TAB-plmDashboard | `plmDashboard` | MemberPlmPanel | scope="admin" | `src/components/admin/AdminShell.jsx:72` |
| TE-TAB-resume | `resume` | MyResumePanel | {...props} | `src/components/admin/AdminShell.jsx:73` |
| TE-TAB-outputTemplates | `outputTemplates` | OutputTemplateConfiguratorHub | {...props} | `src/components/admin/AdminShell.jsx:74` |
| TE-TAB-careerMaster | `careerMaster` | CareerMasterPanel | scope="admin" | `src/components/admin/AdminShell.jsx:75` |
| TE-TAB-contentManager | `contentManager` | ContentManagerShell |  | `src/components/admin/AdminShell.jsx:76` |
| TE-TAB-nrm | `nrm` | NrmPanel | isAdmin={true} | `src/components/admin/AdminShell.jsx:77` |
| TE-TAB-analytics | `analytics` | AnalyticsPanel | isAdmin={true} | `src/components/admin/AdminShell.jsx:78` |
| TE-TAB-finbridgeco | `finbridgeco` | FinBridgeCoPanel |  | `src/components/admin/AdminShell.jsx:79` |
| TE-TAB-governance | `governance` | GovernancePanel |  | `src/components/admin/AdminShell.jsx:80` |
| TE-TAB-emotionalWeather | `emotionalWeather` | EmotionalWeatherPanel |  | `src/components/admin/AdminShell.jsx:81` |
| TE-TAB-memberNrm | `memberNrm` | NrmPanel | isAdmin={false} | `src/components/admin/AdminShell.jsx:82` |
| TE-TAB-memberAnalytics | `memberAnalytics` | AnalyticsPanel | isAdmin={false} | `src/components/admin/AdminShell.jsx:83` |
| TE-TAB-lineage | `lineage` | LineagePanel |  | `src/components/admin/AdminShell.jsx:84` |
| TE-TAB-inbox | `inbox` | InboxPanel |  | `src/components/admin/AdminShell.jsx:85` |
| TE-TAB-commandCenter | `commandCenter` | CommandCenterPanel |  | `src/components/admin/AdminShell.jsx:86` |
| TE-TAB-eidos | `eidos` | EidosOperatingModelPanel |  | `src/components/admin/AdminShell.jsx:87` |
| TE-TAB-websiteIntelligence | `websiteIntelligence` | WebsiteIntelligencePanel |  | `src/components/admin/AdminShell.jsx:88` |
| TE-TAB-metricIntelligence | `metricIntelligence` | MetricIntelligencePanel |  | `src/components/admin/AdminShell.jsx:89` |
| TE-TAB-methodologyConfig | `methodologyConfig` | MethodologyConfigPanel |  | `src/components/admin/AdminShell.jsx:90` |
| TE-TAB-lonetreeMvp | `lonetreeMvp` | LonetreeMvpPanel | {...props} | `src/components/admin/AdminShell.jsx:91` |
| TE-TAB-commercialOpportunities | `commercialOpportunities` | CommercialOpportunityPanel |  | `src/components/admin/AdminShell.jsx:92` |
| TE-TAB-l2rDiagnostics | `l2rDiagnostics` | L2rDiagnosticPanel |  | `src/components/admin/AdminShell.jsx:93` |
| TE-TAB-agentHubConfig | `agentHubConfig` | AgentHubConfigPanel | {...props} | `src/components/admin/AdminShell.jsx:94` |
| TE-TAB-agentHubOutputs | `agentHubOutputs` | AgentOutputsPanel |  | `src/components/admin/AdminShell.jsx:95` |
| TE-TAB-genesisFoundation | `genesisFoundation` | GenesisFoundationPanel |  | `src/components/admin/AdminShell.jsx:96` |
| TE-TAB-careerReasoningCompiler | `careerReasoningCompiler` | CareerReasoningCompilerPanel |  | `src/components/admin/AdminShell.jsx:97` |
| TE-TAB-worldVariantStudio | `worldVariantStudio` | WorldVariantStudioPanel |  | `src/components/admin/AdminShell.jsx:98` |

## Theme picker options (`ConfigPanel.jsx` THEME_OPTIONS)

`strategic`, `glow-light`, `glow-dark`, `momentum-warm`, `lagoon`, `prospect`

## CRYSTAL_VARIANTS keys (`src/lib/crystalGeometry.js`)

`signature` (line 25), `hourglass` (line 65), `salttide` (line 111), `engine` (line 150), `rings` (line 171), `token` (line 190), `table` (line 224), `founder` (line 268), `agentHub` (line 321), `commercialPipeline` (line 358), `publication` (line 396)
