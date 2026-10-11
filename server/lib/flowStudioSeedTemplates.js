// Journey flow studio: seed templates. A code registry (read-only, never copied into anyone's rows by seed/boot);
// using one creates the person's own flow from it. Fictional content only. Append-only: a shipped key is never
// removed, because saved flows record the template key they came from.
import { emptyDoc, normalizeDoc } from '../../src/lib/flowStudioDoc.js';

const X = 40; const GAP = 190;
/** steps: [id, type, label, laneIndex, col, extra?]; edges: [from, to, label?, extra?] */
function state(steps, edges, scenarios = [], lanes = ['Customer', 'Operations']) {
  return {
    lanes: lanes.map((label, i) => ({ id: `lane${i + 1}`, label })), scenarios,
    nodes: steps.map(([id, type, label, lane, col, extra = {}]) => ({
      id, type, label, x: X + col * GAP, y: lane * 150 + 40, lane: `lane${lane + 1}`, execMode: extra.exec || '', concurrency: extra.par ? 'parallel' : 'sequential',
      scenarioTags: extra.tags || [], meta: { base: extra.meta || {}, ...(extra.over || {}) }, resolves: extra.resolves || [],
    })),
    edges: edges.map(([from, to, label = '', extra = {}], i) => ({ id: `e${i + 1}`, from, to, label, params: extra.params || '', notes: extra.notes || '', scenarioTags: extra.tags || [], overlays: extra.overlays || {} })),
  };
}

const orderCurrent = state([
  ['n1', 'terminal', 'Order received', 0, 0, { exec: 'manual' }],
  ['n2', 'step', 'Check stock by hand', 1, 1, { exec: 'manual', meta: { painPoints: 'Stock sheet is updated once a day', frictionOpportunity: 'About 6 percent of orders ship late because stock was already gone', handoverGap: 'Sales does not see the warehouse count', dataSources: 'Warehouse spreadsheet', actors: 'Order desk clerk' } }],
  ['n3', 'decision', 'In stock?', 1, 2, { meta: { decisionParams: 'Count on the sheet is at least the order quantity' } }],
  ['n4', 'step', 'Pick and pack', 1, 3, { exec: 'manual', meta: { leakageScenario: 'Short shipments are re-sent at the company cost' } }],
  ['n5', 'step', 'Phone the customer about the delay', 0, 3, { exec: 'manual', tags: ['Backorder'] }],
  ['n6', 'terminal', 'Order shipped', 0, 4, {}],
], [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4', 'Yes', { params: 'Count is enough' }], ['n3', 'n5', 'No', { params: 'Count is short', tags: ['Backorder'] }], ['n4', 'n6'], ['n5', 'n6']], ['Rush order', 'Backorder']);

const orderFuture = state([
  ['n1', 'terminal', 'Order received', 0, 0, { exec: 'automated' }],
  ['n2', 'step', 'Check live stock', 1, 1, { exec: 'automated', meta: { systemName: 'Inventory service', systemAuthority: 'May reserve stock automatically', actionAuthority: 'System', sceneAsset: 'scene.order-check', animation: 'pulse', destinationLink: '/orders/status', businessGoal: 'No late shipments caused by stock errors' }, resolves: [{ nodeId: 'n2', kind: 'pain' }, { nodeId: 'n2', kind: 'handover' }] }],
  ['n3', 'decision', 'In stock?', 1, 2, { meta: { gateKey: 'stock_check', decisionParams: 'Live count is at least the order quantity' } }],
  ['n4', 'step', 'Pick and pack', 1, 3, { exec: 'hybrid', meta: { actors: 'Warehouse team', actionAuthority: 'Warehouse lead may substitute items' }, resolves: [{ nodeId: 'n4', kind: 'leakage' }] }],
  ['n5', 'step', 'Notify the customer of the backorder', 0, 3, { exec: 'automated', tags: ['Backorder'] }],
  ['n6', 'terminal', 'Order shipped', 0, 4, {}],
], [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4', 'Yes', { params: 'Live count is enough', overlays: { 'Rush order': { label: 'Yes (priority)', params: 'Count is enough; rush lane' } } }], ['n3', 'n5', 'No', { params: 'Live count is short', tags: ['Backorder'] }], ['n4', 'n6'], ['n5', 'n6']], ['Rush order', 'Backorder']);

const supportCurrent = state([
  ['n1', 'event', 'Ticket arrives', 0, 0, { exec: 'manual' }],
  ['n2', 'step', 'Read and classify', 1, 1, { exec: 'manual', meta: { painPoints: 'Classification depends on who is on shift' } }],
  ['n3', 'decision', 'Urgent?', 1, 2, {}],
  ['n4', 'step', 'Assign to specialist', 1, 3, { exec: 'manual' }],
  ['n5', 'step', 'Reply with a standard answer', 1, 3, { exec: 'manual' }],
  ['n6', 'terminal', 'Ticket closed', 0, 4, {}],
], [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4', 'Urgent'], ['n3', 'n5', 'Routine'], ['n4', 'n6'], ['n5', 'n6']], ['Billing question']);

const supportFuture = state([
  ['n1', 'event', 'Ticket arrives', 0, 0, { exec: 'automated' }],
  ['n2', 'step', 'Classify automatically', 1, 1, { exec: 'automated' }],
  ['n3', 'decision', 'Urgent?', 1, 2, {}],
  ['n4', 'step', 'Assign to specialist', 1, 3, { exec: 'hybrid' }],
  ['n5', 'step', 'Send suggested answer', 1, 3, { exec: 'automated' }],
  ['n6', 'terminal', 'Ticket closed', 0, 4, {}],
], [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4', 'Urgent'], ['n3', 'n5', 'Routine'], ['n4', 'n6'], ['n5', 'n6']], ['Billing question']);

const onboardCurrent = state([
  ['n1', 'terminal', 'Member signs up', 0, 0, {}],
  ['n2', 'parallel', 'Set up in parallel', 1, 1, { par: true }],
  ['n3', 'step', 'Create profile', 0, 2, { exec: 'manual', par: true }],
  ['n4', 'step', 'Send welcome pack', 1, 2, { exec: 'automated', par: true }],
  ['n5', 'terminal', 'Member active', 1, 3, {}],
], [['n1', 'n2'], ['n2', 'n3', 'Profile'], ['n2', 'n4', 'Welcome'], ['n3', 'n5'], ['n4', 'n5']]);

const onboardFuture = state([
  ['n1', 'terminal', 'Member signs up', 0, 0, {}],
  ['n2', 'parallel', 'Set up in parallel', 1, 1, { par: true }],
  ['n3', 'step', 'Create profile with a guide', 0, 2, { exec: 'hybrid', par: true }],
  ['n4', 'step', 'Send welcome pack', 1, 2, { exec: 'automated', par: true }],
  ['n5', 'terminal', 'Member active', 1, 3, {}],
], [['n1', 'n2'], ['n2', 'n3', 'Profile'], ['n2', 'n4', 'Welcome'], ['n3', 'n5'], ['n4', 'n5']]);

const mk = (name, domain, description, current, future) => {
  const d = emptyDoc(name, domain); d.description = description; d.states = { current, future }; return d;
};

export const SEED_TEMPLATES = Object.freeze([
  { key: 'order_to_delivery', name: 'Order to delivery', description: 'Fictional example: an order desk moving from a manual stock check to a live one, with Rush order and Backorder scenarios.', doc: mk('Order to delivery', 'Order channel', 'Fictional example flow.', orderCurrent, orderFuture) },
  { key: 'support_ticket', name: 'Support ticket resolution', description: 'Fictional example: classify, route and answer a support ticket, with a Billing question scenario.', doc: mk('Support ticket resolution', 'Support channel', 'Fictional example flow.', supportCurrent, supportFuture) },
  { key: 'member_onboarding', name: 'Member onboarding', description: 'Fictional example: two parallel set-up branches joining before the member becomes active.', doc: mk('Member onboarding', 'Membership channel', 'Fictional example flow.', onboardCurrent, onboardFuture) },
]);

export const seedTemplateDoc = (key, def) => {
  const t = SEED_TEMPLATES.find((x) => x.key === key);
  return t ? normalizeDoc(structuredClone(t.doc), def) : null;
};
