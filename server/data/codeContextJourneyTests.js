export const CODE_CONTEXT_JOURNEY_TESTS = [
  { title: 'Anonymous visitor reaches isolated Test Sign In', role: 'anonymous', backlogMatch: 'test', environment: 'both', preconditions: 'VITE_TEST_BASE_URL is configured for deployed test builds.', steps: [
    ['Open /login', 'Production Sign In renders with a visible Test Sign In link.'],
    ['Select Test Sign In', 'Browser opens /test/login and redirects to the configured isolated test base URL.'],
    ['Repeat without VITE_TEST_BASE_URL', 'The route explains that test is unconfigured and never submits credentials to production.'],
  ]},
  { title: 'Admin starts a governed Claude context session', role: 'salt_basin_admin', backlogMatch: 'agent', environment: 'test', steps: [
    ['Sign in as a Salt Basin admin and open PLM → Backlog', 'The Codex + Claude Studio button is visible.'],
    ['Open the studio and select Claude · Anthropic, a context profile, and a backlog item', 'The selections remain visible before the first message.'],
    ['Send a requirements question', 'Anthropic Messages returns a response and the thread persists provider, model, context snapshot, and backlog link.'],
    ['Open the business knowledge registry', 'Extracted rules, decisions, lessons, or implementation notes appear without duplicating the transcript.'],
  ]},
  { title: 'Admin starts a governed Codex context session', role: 'salt_basin_admin', backlogMatch: 'agent', environment: 'test', steps: [
    ['Open Codex + Claude Studio and select Codex · OpenAI', 'Codex is visibly selected.'],
    ['Send a code-context question', 'OpenAI Responses returns a persisted assistant turn.'],
    ['Inspect the knowledge registry', 'The structured extraction pass produces reviewable records with source lineage.'],
  ]},
  { title: 'Admin approves bounded repository execution', role: 'salt_basin_admin', backlogMatch: 'agent', environment: 'test', steps: [
    ['From a persisted agent thread, enter a bounded implementation objective and select Propose', 'A proposed code run appears and no repository process starts.'],
    ['Select Approve run', 'The run becomes approved, then queued or running.'],
    ['Wait for completion', 'Events capture output, changed files, pre-existing files, exit code, and build verification.'],
    ['Inspect prohibited effects', 'No commit, push, deployment, dependency installation, or secret access occurred.'],
  ]},
  { title: 'Admin reconstructs canonical backlog from all chats', role: 'salt_basin_admin', backlogMatch: 'backlog', environment: 'test', steps: [
    ['Select Run with Codex or Run with Claude under Historical backlog reconstruction', 'One asynchronous reconciliation run is queued; a second concurrent run is rejected.'],
    ['Allow transcript processing to complete', 'CODEX and CLAUDE raw-event sessions are grouped and extracted.'],
    ['Run reconciliation again', 'Canonical keys and source uniqueness upsert existing requirements instead of duplicating them.'],
    ['Inspect a matched item', 'All chat sources, participants, components, estimated hours, actual hours, and contribution allocations remain linked.'],
  ]},
  { title: 'QA failure creates an evidence-backed defect', role: 'qa_tester', backlogMatch: 'qa', environment: 'test', steps: [
    ['Open a required journey scenario and execute its ordered steps', 'The run captures user profile, data values, actions, expected behavior, and actual behavior.'],
    ['Submit a failed step without screenshot or evidence URL', 'The API rejects the result.'],
    ['Attach at least one screenshot and submit the failed step', 'A child defect is created against the primary backlog item with reproduction context.'],
    ['Inspect the defect', 'The defect shares the scenario/result objects and indicates that redeployment is required.'],
  ]},
  { title: 'GitHub deployment maps components to backlog items', role: 'deployment_automation', backlogMatch: 'deployment', environment: 'both', steps: [
    ['Post a signed GitHub deployment payload with commit, environment, timestamp, and changed files', 'A deployment record is created.'],
    ['Inspect component mapping', 'Changed file paths resolve backlog components and canonical backlog items.'],
    ['Post a production deployment', 'Mapped items record current production commit, deployment, environment, and effective time.'],
  ]},
  { title: 'Release manager promotes passing deployment to production', role: 'release_manager', backlogMatch: 'deployment', environment: 'test', steps: [
    ['Evaluate promotion for a sandbox or test deployment with missing required results', 'The gate is blocked and lists missing scenarios.'],
    ['Complete every required scenario with passing results for the deployment', 'Coverage reaches 100%.'],
    ['Evaluate again', 'The gate becomes eligible.'],
    ['Select Promote to Production and approve the confirmation', 'The configured GitHub Actions workflow is dispatched with the deployment and gate identifiers.'],
  ]},
  { title: 'Admin reviews deployment-generated HERQ output', role: 'salt_basin_admin', backlogMatch: 'publication', environment: 'test', steps: [
    ['Generate post-deployment outputs', 'Architecture, technology, timeline, decision, lesson, cost, capability, and agent-specification inputs are aggregated.'],
    ['Open the HERQ review queue', 'Generated output remains in review and is not public.'],
    ['Edit text, grouping rules, visual assignments, and image prompt', 'Configuration and generated content version independently.'],
    ['Approve and publish', 'A content publication is created only after human approval.'],
  ]},
];

