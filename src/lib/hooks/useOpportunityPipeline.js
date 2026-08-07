// Shared data/state logic for the two "opportunity pipeline" surfaces
// (Career Placement Agents, Commercial Opportunity Pipeline) — extracted
// (2026-08-07) from what were two near-identical panel components so both
// the classic admin-tab panels AND the new World Shell's docked inspector
// can drive the same fetch/create/score logic without duplicating it.
// Presentation (the 2D form-heavy panel vs. the World Shell's compact docked
// card) stays separate; this hook owns nothing about how it's rendered.
import { useState, useEffect, useCallback } from 'react';
import { toast } from '../toast.js';

export function useOpportunityPipeline({
  getHub,
  listOpportunities,
  createOpportunity,
  scoreOpportunity,
  buildCreatePayload,
  initialAddForm,
  dimensionFields,
  itemLabel,
  pipelineLabel,
  enabled = true,
}) {
  const [loading, setLoading] = useState(enabled);
  const [agents, setAgents] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(initialAddForm);
  const [scoreDraft, setScoreDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [hub, oppResult] = await Promise.all([getHub(), listOpportunities()]);
      setAgents(hub.agents);
      setWorkflow(hub.workflow);
      setOpportunities(oppResult.opportunities);
    } catch (e) {
      toast(`Failed to load ${pipelineLabel}: ` + e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `enabled: false` (e.g. a member's browser calling the admin-only
  // commercial pipeline hook just because it's declared alongside the career
  // one, to satisfy rules-of-hooks) skips the fetch entirely rather than
  // firing a request that will 401/403 and toast a spurious error.
  useEffect(() => { if (enabled) load(); else setLoading(false); }, [enabled, load]);

  const selectedAgent = agents.find((a) => a.key === selectedAgentKey) || null;
  const selectedOpportunity = opportunities.find((o) => o.id === selectedOpportunityId) || null;

  useEffect(() => {
    if (selectedOpportunity) {
      const next = {};
      dimensionFields.forEach((d) => {
        const existing = selectedOpportunity.score?.components?.find((c) => c.key === d.key);
        next[d.key] = existing?.rawScore ?? '';
      });
      setScoreDraft(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOpportunityId]);

  function selectAgent(key) { setSelectedAgentKey(key); setSelectedOpportunityId(null); }
  function selectOpportunity(id) { setSelectedOpportunityId(id); setSelectedAgentKey(null); }

  async function handleAddOpportunity(e) {
    e?.preventDefault?.();
    const payload = buildCreatePayload(addForm);
    if (!payload) return;
    setSaving(true);
    try {
      const created = await createOpportunity(payload);
      setOpportunities((prev) => [created, ...prev]);
      setSelectedOpportunityId(created.id);
      setShowAddForm(false);
      setAddForm(initialAddForm);
      toast(`Tracked "${itemLabel(created)}".`);
    } catch (err) {
      toast('Could not add opportunity: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveScore() {
    if (!selectedOpportunity) return;
    const dimensionScores = {};
    for (const d of dimensionFields) {
      const raw = scoreDraft[d.key];
      if (raw === '' || raw == null) continue;
      dimensionScores[d.key] = Number(raw);
    }
    if (!Object.keys(dimensionScores).length) { toast('Enter at least one dimension score.'); return; }
    setSaving(true);
    try {
      const updated = await scoreOpportunity(selectedOpportunity.id, { dimensionScores, sourceReference: 'manual-review-' + Date.now() });
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast(updated.score?.complete ? `Scored: ${updated.score.score} / 100${updated.score.tier ? ` (${updated.score.tier})` : ''}` : 'Scores saved (some dimensions still unscored).');
    } catch (err) {
      toast('Could not save scores: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return {
    loading, agents, workflow, opportunities,
    selectedAgentKey, selectedOpportunityId, selectedAgent, selectedOpportunity,
    selectAgent, selectOpportunity,
    showAddForm, setShowAddForm, addForm, setAddForm, handleAddOpportunity,
    scoreDraft, setScoreDraft, handleSaveScore, saving,
    dimensionFields, reload: load,
  };
}
