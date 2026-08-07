// Publication journey data hook (2026-08-07) — real data for the HERQ
// Publications island (and, later, Marketing Ads / Research Reports on the
// identical shape). Reuses the config-envelopes API directly for flow
// config (server/lib/publicationFlowEnvelopes.js) rather than a bespoke
// endpoint — same reuse-first reasoning documented there.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';
import { toast } from '../toast.js';

export function usePublicationPipeline({ pipeline = 'herq', appId = 'app.herq', flowEnvelopeId = 'herq_publication_flow', enabled = true } = {}) {
  const [loading, setLoading] = useState(enabled);
  const [agents, setAgents] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [items, setItems] = useState([]);
  const [flow, setFlow] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [hub, itemsRes, flowRes] = await Promise.all([
        api.getPublicationAgentHub(pipeline),
        api.listPublicationItems(appId),
        api.getConfigEnvelope(flowEnvelopeId),
      ]);
      setAgents(hub.agents);
      setWorkflow(hub.workflow);
      setItems(itemsRes.items);
      setFlow(flowRes.value);
      const contentAgent = hub.agents.find((a) => a.pipeline === pipeline && a.tier === 1);
      if (contentAgent) {
        const schedRes = await api.getPublicationSchedule(contentAgent.id);
        setSchedules(schedRes.schedules);
      }
    } catch (e) {
      toast(`Failed to load ${pipeline} publication pipeline: ` + e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (enabled) load(); else setLoading(false); }, [enabled, load]);

  const contentAgent = agents.find((a) => a.pipeline === pipeline && a.tier === 1) || null;
  const latestSchedule = schedules[0] || null;

  async function saveFlow(nextFlow) {
    setSaving(true);
    try {
      const res = await api.writeConfigEnvelope(flowEnvelopeId, nextFlow);
      if (!res.ok) { toast('Could not save flow config: ' + (res.errors || []).join('; ')); return; }
      setFlow(nextFlow);
      toast('Flow config saved.');
    } catch (e) {
      toast('Could not save flow config: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveSchedule({ cadence, triggerMode, triggerMoleculeKey }) {
    if (!contentAgent) return;
    setSaving(true);
    try {
      const schedule = await api.savePublicationSchedule({
        agentDefinitionId: contentAgent.id, cadence, triggerMode, triggerMoleculeKey,
      });
      setSchedules((prev) => [schedule, ...prev]);
      toast('Schedule saved.');
    } catch (e) {
      toast('Could not save schedule: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return { loading, agents, workflow, items, flow, schedules, contentAgent, latestSchedule, saving, saveFlow, saveSchedule, reload: load };
}
