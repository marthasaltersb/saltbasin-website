// Tiny post-create hook seam for tracked career opportunities (2026-10-02).
// careerOpportunityRollups.createCareerOpportunity() calls runOpportunityCreatedHooks()
// after the rod and its entity link exist. Hooks never break opportunity creation: a
// failing hook is logged, and the hook itself is responsible for recording a member-visible
// error (see coverLetterAutoDraft.js).
const hooks = [];

export function onOpportunityCreated(fn) { hooks.push(fn); }

export async function runOpportunityCreatedHooks(ctx) {
  for (const fn of hooks) {
    try { await fn(ctx); } catch (e) { console.error('[opportunityHooks] hook failed:', e.message); }
  }
}
