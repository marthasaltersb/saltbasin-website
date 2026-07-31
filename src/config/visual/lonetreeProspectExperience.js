import { LONETREE_PROPOSAL_NARRATIVE } from './lonetreeProposalNarrative.js';

// Prospect-demo presentation configuration. Defaults reproduce the supplied
// LoneTree v5 original-design package; the Config Envelope lets an authorized
// editor change copy, navigation, fonts, and color tokens without a code edit.
export const LONETREE_PROSPECT_EXPERIENCE = {
  schemaVersion: 3,
  narrative: {
    eyebrow: 'Salt Basin Advisory Partner Proposal & Demo',
    landingTitle: 'Welcome to the LoneTree Operational Intelligence Demo',
    landingBody: 'Click below to enter the Prospect Experience.',
    landingBlurbLead: 'LoneTree Priorities + Market Timing + Salt Basin Market Entry =',
    landingBlurb: 'Focused prospecting and outreach, a defensible strategy for LP and exit credibility, and an interactive demonstration of where Salt Basin products are headed and why we want to partner with LoneTree to get there.',
    companyLabel: 'HealthCare Portco Example',
    companyAction: "Enter a new kind of Proposal you won't want to leave",
    landingInstruction: 'Click below to enter the Prospect Experience',
    navigationEyebrow: 'Salt Basin × LoneTree',
    navigationTitle: 'LoneTree Prospect Experience',
    navigationBody: 'Choose Proposal Narrative, Demo, or Spatial Journey.',
    navigationBackLabel: 'Back to portfolio selection',
    proposalHomeBackLabel: 'Back to Proposal Home',
    downloadLabel: 'Download Complete Prospect Experience',
  },
  navigation: {
    downloadUrl: '/api/lonetree-mvp/prospect-package',
    initialDestination: 'proposal',
    nodes: [
      { destination: 'proposal', label: 'Proposal Narrative', angle: -90 },
      { destination: 'demo', label: 'Demo', angle: 30 },
      { destination: 'spatial', label: 'Spatial Journey', angle: 150 },
    ],
  },
  proposalNarrative: LONETREE_PROPOSAL_NARRATIVE,
  legacyProposalNarrative: {
    sections: [
      { id: 'executive-brief', label: 'Executive Brief', targetId: 'd-exec', eyebrow: 'Executive Brief', title: 'Validate the evidence model with LoneTree’s history—then use it across the next fund journey.', narrative: 'Phase 1 validation: can LoneTree reconstruct, reconcile and defend the fund thesis and selected PortCo value-creation claims using the evidence already produced through underwriting, quarterly reporting and operating history? Long-term hypothesis: can the same governed evidence improve portfolio decisions, LP diligence, lead-to-cash performance and exit readiness over time?' },
      { id: 'methodology', label: 'Methodology', targetId: 'd-method', eyebrow: 'Authoritative Methodology', title: 'Belief becomes defensible proof.', narrative: 'Preserve what LoneTree believed, connect it to what actually happened, test competing explanations and produce a claim that an investment committee, LP, lender or buyer can independently follow.' },
      { id: 'scenario-repository', label: 'Scenario Repository', targetId: 'd-scenarios', eyebrow: 'Scenario Repository', title: 'Turn recurring operating conditions into repeatable decisions.', narrative: 'The 2,400 governed configurations give LoneTree a reusable way to recognize commercial, financial and evidence patterns across PortCos while retaining the exact conditions, controls, authority and history behind each recommendation.' },
      { id: 'semantic-kernel', label: 'Semantic Kernel', targetId: 'd-kernel', eyebrow: 'Organization Import & Semantic Kernel', title: 'Make the model deployable without losing control.', narrative: 'The semantic kernel provides the stable IDs, organization scope, provenance, effective dates and version controls required to move from a Phase 1 backtest into a repeatable LoneTree operating capability.' },
      { id: 'implementation-reality', label: 'Implementation Reality', targetId: 'd-reality', eyebrow: 'Implementation Reality', title: 'Know what can be used now, configured next and validated before scale.', narrative: 'This view protects LoneTree’s implementation decision by separating observed capability from configurable components, proposed design and items that still require validation.' },
      { id: 'visual-library', label: 'Visual Library', targetId: 'd-visuals', eyebrow: 'Visual Reference Library', title: 'See how LoneTree’s evidence moves from claim to decision.', narrative: 'Each dashboard summarizes the decision signal first, then lets the reader open the underlying definitions, events, reconciliations and evidence that support it.' },
      { id: 'evidence-model', label: 'Evidence Model', targetId: 'd-evidence', eyebrow: 'Evidence Model', title: 'Follow every important claim back to proof.', narrative: 'The dashboard shows the complete evidence path; each detail view explains what the object contributes, what it depends on and what LoneTree must govern for the claim to remain defensible.' },
      { id: 'crystal-world', label: 'Crystal World', targetId: 'd-world', eyebrow: 'Crystal World', title: 'Governed state becomes geometry.', narrative: 'The Salt Basin Orbit is the role-aware decision surface: the same governed truth resolves into the evidence a GP, LP or PortCo CEO/CFO is entitled to see based on ownership, waterfall, purchase, financing and operating context.' },
      { id: 'sponsor-thesis', label: 'Sponsor Thesis', targetId: 'd-sponsor', eyebrow: 'Sponsor Operating Thesis', title: 'Phase 1 gives the GP a decision tool—and creates the proof base for future LP outreach.', narrative: 'LoneTree first tests whether fund and PortCo claims can be reproduced from existing evidence, then uses the resulting proof to improve sponsor decisions and shape the right LP narrative.' },
      { id: 'guided-examples', label: 'Guided Examples', targetId: 'd-examples', eyebrow: 'Guided Examples', title: 'See the decision first, then inspect the evidence beneath it.', narrative: 'Each example starts with the executive outcome and confidence signal, then opens into the claim, drivers, source events, reconciliations and gaps that roll up to the dashboard.' },
      { id: 'operating-system', label: 'Operating System', targetId: 'd-platform', eyebrow: 'Operating System', title: 'The capabilities that carry Phase 1 into a scalable operating model.', narrative: 'Each product is tied to the LoneTree decision it enables, the evidence it governs and the role-aware experience it supports across GP, LP and PortCo users.' },
      { id: 'appendix', label: 'Appendix', targetId: 'd-appendix', eyebrow: 'Appendix', title: 'Source references and supporting detail.', narrative: 'This appendix shows what each included source contributes to the proposal, so the reader can understand and verify the foundation without prior knowledge of the files.' },
    ],
  },
  theme: {
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'DM Sans', system-ui, sans-serif",
    fontLabel: "'Jost', system-ui, sans-serif",
    page: '#F8F4EC',
    surface: '#FFFDF8',
    surfaceMuted: '#F1EBDD',
    text: '#2B2A28',
    textMuted: '#5B5750',
    teal: '#4A7C8E',
    tealDeep: '#345A68',
    gold: '#C4843A',
    rose: '#D98CA0',
    border: '#D8CCB8',
  },
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function validateLonetreeProspectExperience(value) {
  if (!value || typeof value !== 'object') return ['value must be an object'];
  const errors = [];
  for (const key of ['eyebrow', 'landingTitle', 'landingBody', 'landingBlurbLead', 'landingBlurb', 'companyLabel', 'companyAction', 'landingInstruction', 'navigationEyebrow', 'navigationTitle', 'navigationBody', 'navigationBackLabel', 'proposalHomeBackLabel', 'downloadLabel']) {
    if (typeof value.narrative?.[key] !== 'string' || !value.narrative[key].trim()) errors.push(`narrative.${key}: must be a non-empty string`);
  }
  const nodes = value.navigation?.nodes;
  if (typeof value.navigation?.downloadUrl !== 'string' || !value.navigation.downloadUrl.trim()) errors.push('navigation.downloadUrl: must be a non-empty string');
  if (!Array.isArray(nodes) || !nodes.length) errors.push('navigation.nodes: must be a non-empty array');
  else {
    const destinations = new Set();
    nodes.forEach((node, index) => {
      if (!node || typeof node !== 'object') { errors.push(`navigation.nodes[${index}]: must be an object`); return; }
      if (typeof node.destination !== 'string' || !node.destination.trim()) errors.push(`navigation.nodes[${index}].destination: must be a non-empty string`);
      else if (destinations.has(node.destination)) errors.push(`navigation.nodes[${index}].destination: duplicate "${node.destination}"`);
      else destinations.add(node.destination);
      if (typeof node.label !== 'string' || !node.label.trim()) errors.push(`navigation.nodes[${index}].label: must be a non-empty string`);
      if (typeof node.angle !== 'number' || !Number.isFinite(node.angle)) errors.push(`navigation.nodes[${index}].angle: must be a finite number`);
    });
    if (!destinations.has(value.navigation?.initialDestination)) errors.push('navigation.initialDestination: must reference a configured node destination');
  }
  if (!Number.isFinite(value.proposalNarrative?.playback?.intervalMs) || value.proposalNarrative.playback.intervalMs < 1000) errors.push('proposalNarrative.playback.intervalMs: must be at least 1000');
  if (typeof value.proposalNarrative?.visual?.highlightGlow !== 'string' || !value.proposalNarrative.visual.highlightGlow.trim()) errors.push('proposalNarrative.visual.highlightGlow: must be a non-empty string');
  if (!Number.isFinite(value.proposalNarrative?.visual?.revealIntervalMs) || value.proposalNarrative.visual.revealIntervalMs < 100) errors.push('proposalNarrative.visual.revealIntervalMs: must be at least 100');
  for (const key of ['headerLabel', 'breadcrumbLabel']) if (typeof value.proposalNarrative?.[key] !== 'string' || !value.proposalNarrative[key].trim()) errors.push(`proposalNarrative.${key}: must be a non-empty string`);
  for (const downloadKey of ['completeDownload', 'archiveDownload']) for (const key of ['label', 'url']) if (typeof value.proposalNarrative?.[downloadKey]?.[key] !== 'string' || !value.proposalNarrative[downloadKey][key].trim()) errors.push(`proposalNarrative.${downloadKey}.${key}: must be a non-empty string`);
  const narrativeSections = value.proposalNarrative?.sections;
  if (!Array.isArray(narrativeSections) || !narrativeSections.length) errors.push('proposalNarrative.sections: must be a non-empty array');
  else narrativeSections.forEach((section, index) => {
    for (const key of ['id', 'label', 'eyebrow', 'title', 'narrative']) if (typeof section?.[key] !== 'string' || !section[key].trim()) errors.push(`proposalNarrative.sections[${index}].${key}: must be a non-empty string`);
  });
  for (const key of ['fontDisplay', 'fontBody', 'fontLabel']) {
    if (typeof value.theme?.[key] !== 'string' || !value.theme[key].trim()) errors.push(`theme.${key}: must be a non-empty string`);
  }
  for (const key of ['page', 'surface', 'surfaceMuted', 'text', 'textMuted', 'teal', 'tealDeep', 'gold', 'rose', 'border']) {
    if (!HEX.test(value.theme?.[key] || '')) errors.push(`theme.${key}: must be a #rrggbb hex string`);
  }
  return errors;
}
