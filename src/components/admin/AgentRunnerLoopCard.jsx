// Shown inside a Release loop run (World Shell -> Journeys -> Release loop -> Runs -> a run): start the agent for the
// run's current stage with the Agent runner, and watch its runs. When a run finishes, the run detail reloads so the
// new round, bugs and fixes appear without a page reload.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { S, Pill, ErrorBox, Field, STATUS_LABEL } from './agentRunnerUi.jsx';

const STAGE_AGENT = { validate: ['release_validator', 'Start validation round with the agent runner'], integrate: ['release_integrator', 'Start integration with the agent runner'] };

export default function AgentRunnerLoopCard({ runId, stage, active, onChanged }) {
  const [runs, setRuns] = useState([]);
  const [overview, setOverview] = useState(null);
  const [branch, setBranch] = useState('');
  const [scenario, setScenario] = useState('');
  const [error, setError] = useState('');
  const seen = useRef(new Map());
  const load = useCallback(async () => {
    try {
      const r = (await api.agentRunnerRuns({ loopRunId: runId })).runs;
      setRuns(r);
      let changed = false;
      for (const x of r) {
        const prev = seen.current.get(x.id);
        if (prev && ['queued', 'running'].includes(prev) && !['queued', 'running'].includes(x.status)) changed = true;
        seen.current.set(x.id, x.status);
      }
      if (changed) onChanged?.();
      setError('');
    } catch (e) { setError(e.message); }
  }, [runId, onChanged]);
  useEffect(() => { load(); const t = setInterval(load, 1500); return () => clearInterval(t); }, [load]);
  useEffect(() => { api.agentRunnerOverview().then(setOverview).catch((e) => setError(e.message)); }, []);
  const entry = STAGE_AGENT[stage];
  async function start() {
    setError('');
    try {
      const body = { agentKey: entry[0], loopRunId: runId, fixtureScenario: scenario || undefined };
      if (entry[0] === 'release_integrator') body.branch = branch;
      const run = await api.startAgentRunnerRun(body);
      toast.success(`Agent run #${run.id} queued`);
      await load();
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  const scenarios = (overview?.fixtureScenarios || []).filter((s) => entry && (!s.agents.length || s.agents.includes(entry[0])));
  return (
    <div style={S.card} data-testid="agent-runner-card">
      <div style={S.cardTitle}>Agent runner</div>
      <div style={S.meta}>Salt Basin's own worker runs this run's stage agent. Open World Shell, Journeys, Agent runner for the full view.</div>
      {active && entry ? (
        <div>
          {entry[0] === 'release_integrator' && <div style={S.row}><Field label="Branch to integrate"><input aria-label="Branch to integrate" style={S.input} value={branch} onChange={(e) => setBranch(e.target.value)} /></Field></div>}
          {overview?.fixturesAllowed && (
            <div style={S.row}>
              <Field label="Fixture scenario (test environments)">
                <select aria-label="Fixture scenario" style={S.input} value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  <option value="">Default for this agent</option>
                  {scenarios.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
                </select>
              </Field>
            </div>
          )}
          <div style={S.row}><button type="button" style={S.btn} onClick={start}>{entry[1]}</button></div>
        </div>
      ) : <div style={S.meta}>{active ? `The ${stage} stage has no agent to start here. The fix agent is started from the Agent runner's Runs tab with a work order.` : 'This run is closed.'}</div>}
      <ErrorBox error={error} />
      {runs.length ? runs.map((x) => <div key={x.id} style={S.item} data-testid="loop-agent-run"><b>Agent run #{x.id}</b> {x.agentKey.replace('release_', '').replace(/_/g, ' ')} <Pill>{STATUS_LABEL[x.status] || x.status}</Pill>{x.error ? <div style={{ ...S.meta, color: '#a5391f' }}>{x.error}</div> : null}</div>) : <div style={S.empty}>No agent runs for this release-loop run yet.</div>}
    </div>
  );
}
