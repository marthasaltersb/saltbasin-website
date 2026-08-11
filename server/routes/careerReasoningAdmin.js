import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { computeReasoningPatternCandidates } from '../lib/careerReasoningCompiler.js';

const router = Router();

router.get('/candidates', requireAdmin, async (_req, res) => {
  try {
    const items = await computeReasoningPatternCandidates();
    res.json({ items });
  } catch (error) {
    console.error('[career-reasoning-admin] list failed:', error.message);
    res.status(500).json({ error: 'Failed to compute reasoning candidates' });
  }
});

router.post('/candidates/:id/decide', requireAdmin, async (req, res) => {
  const status = req.body?.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });
  try {
    const candidate = await db.prepare(`SELECT * FROM career_reasoning_cache_candidates WHERE id=$1`).get(Number(req.params.id));
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.status === 'applied' || candidate.status === 'rejected') return res.status(409).json({ error: 'Candidate is already decided' });
    const now = Date.now();
    const rule = String(req.body?.rule || `Suggest the member-approved ${candidate.pattern_key} reasoning pattern; require member confirmation before applying.`).slice(0, 4000);
    const proposedAction = { patternKey: candidate.pattern_key, entryType: candidate.entry_type, atomKey: candidate.atom_key, rule };
    const decision = await db.prepare(`
      INSERT INTO journey_rod_decisions
        (rod_id, decision_scope, decision_type, proposed_action, human_prompt, status, requested_at, decided_at, decided_by, decision_notes)
      VALUES (NULL,'platform','career_reasoning_cache_approval',$1::jsonb,$2,$3,$4,$4,$5,$6)
      RETURNING id
    `).get(proposedAction, `Apply reasoning cache pattern ${candidate.pattern_key}?`, status, now, req.user.id, req.body?.notes || null);

    let currentId = null;
    if (status === 'approved') {
      const currentKey = `career_reasoning_${candidate.pattern_key}`.slice(0, 180);
      const current = await db.prepare(`
        INSERT INTO journey_current_definitions
          (current_key, org_id, label, rod_type, scope_type, entry_criteria, created_at, updated_at)
        VALUES ($1,NULL,$2,'career_master','reasoning_cache',$3::jsonb,$4,$4)
        ON CONFLICT (current_key) WHERE org_id IS NULL DO UPDATE SET
          label=EXCLUDED.label, entry_criteria=EXCLUDED.entry_criteria, is_active=true, updated_at=EXCLUDED.updated_at
        RETURNING id
      `).get(currentKey, `Career reasoning: ${candidate.pattern_key}`, { reasoningCacheModel: 'pattern_lookup', ...proposedAction, requiresMemberConfirmation: true }, now);
      currentId = Number(current.id);
      await db.prepare(`
        INSERT INTO audit_log (actor_id, actor_email, actor_role, action, entity_type, entity_id, summary, diff, created_at)
        VALUES ($1,$2,$3,'applied_career_reasoning_cache','journey_current_definitions',$4,$5,$6,$7)
      `).run(req.user.id, req.user.email, req.user.role, String(currentId), `Applied member-approved reasoning pattern ${candidate.pattern_key}`, JSON.stringify({ entryCriteria: { reasoningCacheModel: 'pattern_lookup', ...proposedAction, requiresMemberConfirmation: true } }), now);
    }
    await db.prepare(`
      UPDATE career_reasoning_cache_candidates
      SET status=$1, admin_decision_id=$2, updated_at=$3 WHERE id=$4
    `).run(status === 'approved' ? 'applied' : 'rejected', decision.id, now, candidate.id);
    res.json({ ok: true, status: status === 'approved' ? 'applied' : 'rejected', decisionId: Number(decision.id), currentId });
  } catch (error) {
    console.error('[career-reasoning-admin] decide failed:', error.message);
    res.status(500).json({ error: 'Failed to decide reasoning candidate' });
  }
});

export default router;
