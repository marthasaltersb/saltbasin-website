// Backlog seed rules (pure: no database, so they are unit-testable). See backlogSeeds.js for the lifecycle.
const text = (v) => String(v ?? '').trim();
export const SEED_STAGES = ['seed', 'shaped', 'ready', 'promoted'];

/** Gaps that stop a seed entering `to`. */
export function seedGaps(seed, to) {
  const d = seed.data;
  const gaps = [];
  if (to === 'shaped') {
    if (!text(d.problem)) gaps.push('the problem is not written');
    if (!(d.acceptanceCriteria || []).length) gaps.push('there is no acceptance criterion');
  }
  if (to === 'ready') {
    const open = (d.openQuestions || []).filter((q) => !text(q.answer));
    if (open.length) gaps.push(`${open.length} open question${open.length === 1 ? ' is' : 's are'} unanswered`);
    if (!d.size) gaps.push('there is no size');
    if (!text(d.draftChangeSpec)) gaps.push('there is no draft change spec');
    if (!(d.draftJourneys || []).length) gaps.push('there is no draft journey');
  }
  return gaps;
}

