// Agent runner -> Agents: the promptable roster. Each quality agent has a fixed purpose, the governed object it writes
// and its versioned prompt file (read-only here: changing a prompt is a reviewed change to the file in the repository).
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { S, ErrorBox, Field, lines } from './agentRunnerUi.jsx';

function AgentCard({ agent, ctx, goto }) {
  const [prompt, setPrompt] = useState('');
  const [p, setP] = useState({ feature: '', suite: 'smoke', loopRunId: '', changedFiles: '', seedId: '', scenario: '', duplicateOf: '' });
  const [error, setError] = useState('');
  const [queued, setQueued] = useState(null);
  const [text, setText] = useState(null);
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const scenarios = ctx.scenarios.filter((s) => !s.agents.length || s.agents.includes(agent.key));
  const needs = agent.params;

  async function showPrompt() {
    if (text) { setText(null); return; }
    try { setText(await api.agentRunnerAgentPrompt(agent.key)); } catch (e) { setError(e.message); }
  }
  async function ask() {
    setError(''); setQueued(null);
    const params = {};
    if (needs.includes('feature')) params.feature = p.feature;
    if (needs.includes('suite')) params.suite = p.suite;
    if (needs.includes('loopRunId')) params.loopRunId = p.loopRunId ? Number(p.loopRunId) : undefined;
    if (needs.includes('changedFiles')) params.changedFiles = lines(p.changedFiles);
    if (needs.includes('seedId')) params.seedId = p.seedId ? Number(p.seedId) : undefined;
    if (agent.key === 'release_test_script_writer' && p.feature) params.feature = p.feature;
    if (p.duplicateOf) params.duplicateOf = p.duplicateOf;
    try {
      const run = await api.startAgentRunnerRun({ agentKey: agent.key, prompt, params, fixtureScenario: p.scenario || undefined });
      setQueued(run);
      toast.success(`Run #${run.id} queued`);
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.card} data-testid={`agent-${agent.key}`}>
      <div style={S.cardTitle}>{agent.name}</div>
      <div><b>You can ask it to:</b> {agent.youCanAskIt}</div>
      <div><b>It writes:</b> {agent.writes}</div>
      <div><b>Governance:</b> {agent.governance}</div>
      <div style={S.meta}>Prompt file {agent.promptPath} · version {agent.promptVersion ?? 'unreadable'}{agent.problem ? ` · ${agent.problem}` : ''}</div>
      <div style={{ marginTop: '.4rem' }}>
        <button type="button" style={S.btn2} aria-expanded={!!text} onClick={showPrompt}>{text ? `Hide prompt of ${agent.name}` : `View prompt of ${agent.name}`}</button>
      </div>
      {text && <pre style={S.pre} data-testid={`prompt-${agent.key}`}>{text.prompt}</pre>}
      <div style={{ marginTop: '.7rem' }}>
        {(needs.includes('feature') || agent.key === 'release_test_script_writer') && (
          <div style={S.row}>
            <Field label={`Feature for ${agent.name}`}>
              {agent.key === 'release_test_script_writer'
                ? <input aria-label={`Feature for ${agent.name}`} style={S.input} placeholder="feature key (optional)" value={p.feature} onChange={set('feature')} />
                : (
                  <select aria-label={`Feature for ${agent.name}`} style={S.input} value={p.feature} onChange={set('feature')}>
                    <option value="">Choose a feature</option>
                    {ctx.baselines.map((b) => <option key={b.feature} value={b.feature}>{b.feature} (baseline v{b.latest})</option>)}
                  </select>
                )}
            </Field>
            {needs.includes('suite') && (
              <Field label={`Suite for ${agent.name}`}>
                <select aria-label={`Suite for ${agent.name}`} style={S.input} value={p.suite} onChange={set('suite')}>
                  <option value="smoke">Smoke</option><option value="regression">Regression</option>
                </select>
              </Field>
            )}
          </div>
        )}
        {needs.includes('loopRunId') && (
          <div style={S.row}>
            <Field label={`Release-loop run for ${agent.name}`}>
              <select aria-label={`Release-loop run for ${agent.name}`} style={S.input} value={p.loopRunId} onChange={set('loopRunId')}>
                <option value="">Choose a release-loop run</option>
                {ctx.loopRuns.filter((r) => r.status === 'active').map((r) => <option key={r.id} value={r.id}>#{r.id} {r.featureKey} · {r.releaseKey} ({r.stage})</option>)}
              </select>
            </Field>
          </div>
        )}
        {needs.includes('changedFiles') && (
          <div style={S.row}><Field label={`Changed files for ${agent.name} (one per line)`}><textarea aria-label={`Changed files for ${agent.name}`} rows={3} style={S.input} value={p.changedFiles} onChange={set('changedFiles')} /></Field></div>
        )}
        {needs.includes('seedId') && (
          <div style={S.row}>
            <Field label={`Backlog seed for ${agent.name}`}>
              <select aria-label={`Backlog seed for ${agent.name}`} style={S.input} value={p.seedId} onChange={set('seedId')}>
                <option value="">Choose a seed</option>
                {ctx.seeds.filter((s) => ['seed', 'shaped'].includes(s.stage)).map((s) => <option key={s.id} value={s.id}>#{s.id} {s.title} ({s.stage})</option>)}
              </select>
            </Field>
          </div>
        )}
        <div style={S.row}>
          <Field label={`Your request to ${agent.name}`}><textarea aria-label={`Your request to ${agent.name}`} rows={3} style={S.input} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></Field>
        </div>
        {ctx.fixturesAllowed && (
          <div style={S.row}>
            <Field label={`Fixture scenario for ${agent.name} (test environments)`}>
              <select aria-label={`Fixture scenario for ${agent.name}`} style={S.input} value={p.scenario} onChange={set('scenario')}>
                <option value="">Default for this agent</option>
                {scenarios.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
              </select>
            </Field>
            {p.scenario === 'triager_duplicate' && <Field label="Fixture parameter: duplicate of (bug id)"><input aria-label="Fixture parameter: duplicate of" style={S.input} value={p.duplicateOf} onChange={set('duplicateOf')} /></Field>}
          </div>
        )}
        <div style={S.row}><button type="button" style={S.btn} onClick={ask}>{`Ask ${agent.name}`}</button></div>
        <ErrorBox error={error} />
        {queued && (
          <div role="status" style={S.note} data-testid={`queued-${agent.key}`}>
            Run #{queued.id} queued. Its output will appear in Outputs when the worker finishes it.
            <div style={{ marginTop: '.4rem' }}><button type="button" style={S.btn2} onClick={() => goto('Runs', { run: queued.id })}>{`Open run #${queued.id}`}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentsTab({ goto }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const [a, b, l, s, o] = await Promise.all([api.agentRunnerAgents(), api.agentRunnerBaselines(), api.listReleaseLoopRuns(), api.agentRunnerSeeds(), api.agentRunnerOverview()]);
        setState({ agents: a.agents, baselines: b.baselines, loopRuns: l.runs, seeds: s.seeds, scenarios: o.fixtureScenarios, fixturesAllowed: o.fixturesAllowed });
      } catch (e) { setError(e.message); }
    })();
  }, []);
  if (!state) return <><ErrorBox error={error} /><div>Loading…</div></>;
  const quality = state.agents.filter((a) => a.mode === 'quality');
  const stage = state.agents.filter((a) => a.mode === 'stage');
  return (
    <div>
      <div style={S.sub}>Ask any of these agents directly. Prompting one creates a run; nothing an agent writes bypasses review. The three release-loop stage agents (validation, fix, integration) are started from the Runs tab or from a release-loop run.</div>
      {quality.map((a) => <AgentCard key={a.key} agent={a} ctx={state} goto={goto} />)}
      <div style={S.card}>
        <div style={S.cardTitle}>Release-loop stage agents</div>
        {stage.map((a) => (
          <div key={a.key} style={S.item} data-testid={`agent-${a.key}`}>
            <b>{a.name}</b> <span style={S.meta}>prompt version {a.promptVersion ?? 'unreadable'}</span>
            <div style={S.meta}>{a.youCanAskIt}. {a.governance}.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
