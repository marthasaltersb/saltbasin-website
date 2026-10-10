// Agent runner -> Runs: start a stage run (validation, fix, integration), watch every run live, stop it, decide scope
// requests. Approving a scope request widens the work order and goes through useToolCategoryGate().run, matching the
// assertReadyToFinalize call in the server function.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { S, Pill, ErrorBox, Field, fmt, fmtTime, lines, STATUS_LABEL, KIND_LABEL } from './agentRunnerUi.jsx';

const OPEN = ['queued', 'running'];
const agentName = (agents, key) => agents.find((a) => a.key === key)?.name || key;

function WorkOrderView({ wo }) {
  return (
    <div data-testid="work-order">
      {wo.items.map((it) => (
        <div key={it.key} style={S.item} data-testid={`wo-item-${it.key}`}>
          <b>{it.key}</b> · size {it.size} ({wo.sizeLimits[it.size]} lines) <div>{it.intent}</div>
          <div style={S.meta}>May edit: {it.files.join(', ')}</div>
          {it.doneWhen?.length ? <div style={S.meta}>Done when these steps pass: {it.doneWhen.join(', ')}</div> : null}
        </div>
      ))}
      <div style={S.meta}>Forbidden unless an item is about them: {wo.forbidden.join(', ')}</div>
      {wo.approvals?.length ? wo.approvals.map((a, i) => <div key={i} style={S.meta}>Widened: {a.file} added to {a.item} by {a.approvedBy} ({a.note})</div>) : null}
    </div>
  );
}

function ScopeRequest({ run, req, onDone }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const gate = useToolCategoryGate();
  async function decide(decision) {
    setError('');
    try {
      await (decision === 'approve' ? gate.run(() => api.decideAgentRunnerScope(run.id, req.id, { decision, note })) : api.decideAgentRunnerScope(run.id, req.id, { decision, note }));
      toast.success(`Scope request ${req.id} ${decision === 'approve' ? 'approved' : 'declined'}`);
      setNote(''); await onDone();
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.item} data-testid={`scope-${req.id}`}>
      {gate.modal}
      <div><b>{req.id}</b> · {req.file} for {req.item} <Pill>{req.status}</Pill></div>
      <div>{req.why}</div>
      {req.ownerRequired && <div style={S.note}>Needs the owner: {req.ownerReason}</div>}
      {req.status === 'pending' ? (
        <>
          <div style={S.row}><Field label={`Note for ${req.id}`}><input aria-label={`Note for ${req.id}`} style={S.input} value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
          <div style={S.row}>
            <button type="button" style={S.btn} onClick={() => decide('approve')}>{`Approve scope request ${req.id}`}</button>
            <button type="button" style={S.btn2} onClick={() => decide('decline')}>{`Decline scope request ${req.id}`}</button>
          </div>
          <ErrorBox error={error} />
        </>
      ) : <div style={S.meta}>{req.status} by {req.decidedBy}: {req.note}</div>}
    </div>
  );
}

function RunDetail({ runId, onBack, goto, agents, overview }) {
  const [r, setR] = useState(null);
  const [retryScenario, setRetryScenario] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setR(await api.agentRunnerRun(runId)); setError(''); } catch (e) { setError(e.message); }
  }, [runId]);
  useEffect(() => { load(); const t = setInterval(load, 1500); return () => clearInterval(t); }, [load]);
  async function act(action, ok, body) {
    setError('');
    try { const out = await api.agentRunnerRunAction(runId, action, body); toast.success(ok); if (action === 'retry') { await load(); return out; } await load(); } catch (e) { setError(e.message); toast.error(e.message); }
    return null;
  }
  if (!r) return <><button type="button" style={S.btn2} onClick={onBack}>← All runs</button><ErrorBox error={error} /><div>Loading…</div></>;
  const open = OPEN.includes(r.status);
  return (
    <div>
      <button type="button" style={S.btn2} onClick={onBack}>← All runs</button>
      <h2 style={{ ...S.h2, marginTop: '.8rem' }} data-testid="run-title">Run #{r.id} · {agentName(agents, r.agentKey)}</h2>
      <ErrorBox error={error} />
      <div style={S.card}>
        <div data-testid="run-status">Status: <Pill>{STATUS_LABEL[r.status] || r.status}</Pill>{r.stalled ? <Pill>stalled</Pill> : null}</div>
        <div style={S.meta}>{r.featureKey ? `Feature ${r.featureKey} · ` : ''}{r.loopRunId ? `Release-loop run #${r.loopRunId} · ` : ''}{r.branch ? `Branch ${r.branch} · ` : ''}prompt version {r.promptVersion} · {r.adapter ? `${r.adapter} adapter · ` : ''}attempt {r.attempts}</div>
        {r.pinnedBaseline && <div style={S.meta} data-testid="pinned-baseline">Pinned baseline: {r.pinnedBaseline.feature} v{r.pinnedBaseline.version} (scored steps: {r.pinnedBaseline.scoredSteps})</div>}
        {r.prompt && <div style={{ marginTop: '.4rem' }}><b>Request:</b> {r.prompt}</div>}
        {r.waitingFor && <div style={S.note} data-testid="waiting-for">{r.waitingFor}</div>}
        {r.error && <div role="alert" style={S.alert} data-testid="run-error">{r.error}</div>}
        {r.stopRequested && r.stoppedBy && <div style={S.meta} data-testid="stopped-by">Stop requested by {r.stoppedBy}</div>}
        <div style={{ ...S.row, marginTop: '.6rem' }}>
          {open && <button type="button" style={S.btn} onClick={() => act('stop', 'Stop requested')}>Stop run</button>}
          {r.status === 'running' && r.stalled && <button type="button" style={S.btn2} onClick={() => act('requeue', 'Put back on the queue')}>Put back on the queue</button>}
          {!open && overview.fixturesAllowed && (
            <Field label="Fixture scenario for the retry (test environments)">
              <select aria-label="Fixture scenario for the retry" style={S.input} value={retryScenario} onChange={(e) => setRetryScenario(e.target.value)}>
                <option value="">Same as this run</option>
                {overview.fixtureScenarios.filter((x) => !x.agents.length || x.agents.includes(r.agentKey)).map((x) => <option key={x.key} value={x.key}>{x.key}</option>)}
              </select>
            </Field>
          )}
          {!open && <button type="button" style={S.btn2} onClick={async () => { const n = await act('retry', 'New run queued', { fixtureScenario: retryScenario || undefined }); if (n) goto('Runs', { run: n.id }); }}>Retry with the current work order</button>}
        </div>
      </div>
      {r.workOrder && <div style={S.card}><div style={S.cardTitle}>Work order</div><WorkOrderView wo={r.workOrder} /></div>}
      {(r.scopeRequests?.length > 0) && (
        <div style={S.card}>
          <div style={S.cardTitle}>Scope requests</div>
          {r.scopeRequests.map((q) => <ScopeRequest key={q.id} run={r} req={q} onDone={load} />)}
        </div>
      )}
      {r.checks && r.checks.perItem && (
        <div style={S.card} data-testid="diff-check">
          <div style={S.cardTitle}>Branch check against the work order</div>
          <div><Pill>{r.checks.ok ? 'within the work order' : 'violations'}</Pill></div>
          {r.checks.perItem.map((p) => <div key={p.key} style={S.meta}>{p.key}: {p.changed} of {p.limit} lines (size {p.size})</div>)}
          {(r.checks.violations || []).map((v, i) => <div key={i} role="alert" style={S.alert}>{v.code}: {v.detail}</div>)}
        </div>
      )}
      {r.outputs?.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>What this run produced</div>
          {r.outputs.map((o) => <div key={o.id} style={S.item}>{KIND_LABEL[o.kind] || o.kind}: {o.title} <Pill>{o.status}</Pill></div>)}
          <button type="button" style={S.btn2} onClick={() => goto('Outputs')}>Open Outputs</button>
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>Timeline {open && <span style={S.meta}>(refreshing every 1.5 seconds)</span>}</div>
        {r.timeline.length ? r.timeline.map((e) => (
          <div key={e.seq} style={S.item} data-testid="timeline-entry">
            <span style={S.meta}>{fmtTime(e.at)} · {e.type}</span>
            <div>{e.type === 'step' ? `${e.stepId} on ${e.surface}: ${e.status}${e.note ? ` (${e.note})` : ''}` : e.type === 'edit_ok' ? `Edit allowed: ${e.file}` : e.type === 'edit_refused' ? `Edit refused: ${e.file} (${e.code}). ${e.text || ''}` : e.type === 'usage' ? 'Usage reported' : e.text}</div>
          </div>
        )) : <div style={S.empty}>Nothing yet.</div>}
      </div>
      {r.usage && <div style={S.meta} data-testid="run-usage">Usage: {r.usage.inputTokens ?? 'not recorded'} input · {r.usage.outputTokens ?? 'not recorded'} output tokens · {r.usage.listCostUsd == null ? 'cost not recorded' : `$${Number(r.usage.listCostUsd).toFixed(2)}`}{r.usage.observed === false ? ' (recorded fixture session)' : ''}</div>}
    </div>
  );
}

function StartStageRun({ agents, loopRuns, overview, onStarted }) {
  const stage = agents.filter((a) => a.mode === 'stage');
  const [agentKey, setAgentKey] = useState('release_validator');
  const [loopRunId, setLoopRunId] = useState('');
  const [bugs, setBugs] = useState([]);
  const [useBugs, setUseBugs] = useState({});
  const [items, setItems] = useState([]);
  const [item, setItem] = useState({ key: '', intent: '', files: '', size: 'S', doneWhen: '' });
  const [branch, setBranch] = useState('');
  const [scenario, setScenario] = useState('');
  const [error, setError] = useState('');
  const loopRef = useRef('');
  useEffect(() => {
    loopRef.current = loopRunId;
    if (!loopRunId) { setBugs([]); return; }
    api.getReleaseLoopRun(loopRunId).then((d) => { if (loopRef.current === loopRunId) setBugs(d.bugs); }).catch((e) => setError(e.message));
  }, [loopRunId]);
  const fixer = agentKey === 'release_fixer';
  const integrator = agentKey === 'release_integrator';
  const scenarios = overview.fixtureScenarios.filter((s) => !s.agents.length || s.agents.includes(agentKey));
  const withOrders = bugs.filter((b) => b.workOrder && ['open', 'recurred', 'fixing'].includes(b.status));

  async function start() {
    setError('');
    const body = { agentKey, fixtureScenario: scenario || undefined };
    if (loopRunId) body.loopRunId = Number(loopRunId);
    if (fixer) {
      const keys = Object.keys(useBugs).filter((k) => useBugs[k]);
      if (items.length) body.workOrder = { items };
      else body.bugKeys = keys;
    }
    if (integrator) body.branch = branch;
    try {
      const run = await api.startAgentRunnerRun(body);
      toast.success(`Run #${run.id} queued`);
      onStarted(run);
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  function addItem() {
    setError('');
    if (!item.key.trim() || !item.intent.trim() || !lines(item.files).length) { setError('An item needs its id, its intent and at least one file it may edit'); return; }
    setItems([...items, { key: item.key.trim(), intent: item.intent.trim(), files: lines(item.files), size: item.size, doneWhen: item.doneWhen.split(/[\s,]+/).filter(Boolean) }]);
    setItem({ key: '', intent: '', files: '', size: 'S', doneWhen: '' });
  }
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Start a stage run</div>
      <div style={S.row}>
        <Field label="Stage agent">
          <select aria-label="Stage agent" style={S.input} value={agentKey} onChange={(e) => { setAgentKey(e.target.value); setScenario(''); }}>
            {stage.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Release-loop run">
          <select aria-label="Release-loop run" style={S.input} value={loopRunId} onChange={(e) => setLoopRunId(e.target.value)}>
            <option value="">Choose a release-loop run</option>
            {loopRuns.filter((r) => r.status === 'active').map((r) => <option key={r.id} value={r.id}>#{r.id} {r.featureKey} · {r.releaseKey} ({r.stage})</option>)}
          </select>
        </Field>
      </div>
      {integrator && <div style={S.row}><Field label="Branch to integrate"><input aria-label="Branch to integrate" style={S.input} placeholder="release-loop/seed-catalog-build" value={branch} onChange={(e) => setBranch(e.target.value)} /></Field></div>}
      {fixer && (
        <div>
          <div style={S.cardTitle}>Work order</div>
          <div style={S.meta}>The agent can do what the work order lists and nothing else. Use the work orders the bug triager filed, or write items here.</div>
          {withOrders.length ? withOrders.map((b) => (
            <label key={b.bugKey} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', minHeight: 44 }}>
              <input type="checkbox" style={{ width: 22, height: 22 }} checked={!!useBugs[b.bugKey]} onChange={(e) => setUseBugs({ ...useBugs, [b.bugKey]: e.target.checked })} />
              <span>{`Use work order of ${b.bugKey}`} <span style={S.meta}>size {b.size} · {b.workOrder.files.join(', ')}</span></span>
            </label>
          )) : <div style={S.empty}>{loopRunId ? 'This run has no open bug with a work order yet. Ask the Bug triager for one, or write an item below.' : 'Choose a release-loop run to see its bugs.'}</div>}
          {items.map((it) => (
            <div key={it.key} style={S.item} data-testid={`new-item-${it.key}`}>
              <b>{it.key}</b> size {it.size}: {it.intent} <span style={S.meta}>{it.files.join(', ')}</span>
              <div><button type="button" style={S.btn2} onClick={() => setItems(items.filter((x) => x.key !== it.key))}>{`Remove item ${it.key}`}</button></div>
            </div>
          ))}
          <div style={S.row}>
            <Field label="Item id"><input aria-label="Item id" style={S.input} value={item.key} onChange={(e) => setItem({ ...item, key: e.target.value })} /></Field>
            <Field label="Intent (the one change intended)"><input aria-label="Intent" style={S.input} value={item.intent} onChange={(e) => setItem({ ...item, intent: e.target.value })} /></Field>
          </div>
          <div style={S.row}>
            <Field label="Files it may edit (one per line)"><textarea aria-label="Files it may edit" rows={2} style={S.input} value={item.files} onChange={(e) => setItem({ ...item, files: e.target.value })} /></Field>
            <Field label="Size"><select aria-label="Size" style={S.input} value={item.size} onChange={(e) => setItem({ ...item, size: e.target.value })}><option>S</option><option>M</option><option>L</option></select></Field>
            <Field label="Done when (step ids)"><input aria-label="Done when" style={S.input} placeholder="J2.1" value={item.doneWhen} onChange={(e) => setItem({ ...item, doneWhen: e.target.value })} /></Field>
          </div>
          <div style={S.row}><button type="button" style={S.btn2} onClick={addItem}>Add item to work order</button></div>
        </div>
      )}
      {overview.fixturesAllowed && (
        <div style={S.row}>
          <Field label="Fixture scenario (test environments)">
            <select aria-label="Fixture scenario" style={S.input} value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="">Default for this agent</option>
              {scenarios.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
            </select>
          </Field>
        </div>
      )}
      <div style={S.row}><button type="button" style={S.btn} onClick={start}>Start run</button></div>
      <ErrorBox error={error} />
    </div>
  );
}

export default function RunsTab({ initialRun, onOpened, goto }) {
  const [state, setState] = useState(null);
  const [runs, setRuns] = useState([]);
  const [openId, setOpenId] = useState(initialRun || null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (initialRun) { setOpenId(initialRun); onOpened?.(); } }, [initialRun]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadRuns = useCallback(async () => {
    try { setRuns((await api.agentRunnerRuns({ status: filter })).runs); } catch (e) { setError(e.message); }
  }, [filter]);
  useEffect(() => { loadRuns(); const t = setInterval(loadRuns, 1500); return () => clearInterval(t); }, [loadRuns]);
  useEffect(() => {
    (async () => {
      try {
        const [a, l, o] = await Promise.all([api.agentRunnerAgents(), api.listReleaseLoopRuns(), api.agentRunnerOverview()]);
        setState({ agents: a.agents, loopRuns: l.runs, overview: o });
      } catch (e) { setError(e.message); }
    })();
  }, []);
  const go = (t, extra) => { if (t === 'Runs' && extra?.run) setOpenId(extra.run); else goto?.(t, extra); };
  if (!state) return <><ErrorBox error={error} /><div>Loading…</div></>;
  if (openId) return <RunDetail runId={openId} agents={state.agents} overview={state.overview} onBack={() => { setOpenId(null); loadRuns(); }} goto={go} />;
  return (
    <div>
      <StartStageRun agents={state.agents} loopRuns={state.loopRuns} overview={state.overview} onStarted={(run) => { setOpenId(run.id); }} />
      <div style={S.card}>
        <div style={S.cardTitle}>Runs</div>
        <div style={S.row}>
          <Field label="Status">
            <select aria-label="Status filter" style={S.input} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
        </div>
        <ErrorBox error={error} />
        {runs.length ? runs.map((r) => (
          <div key={r.id} style={S.item} data-testid={`run-row-${r.id}`}>
            <div><b>#{r.id}</b> {agentName(state.agents, r.agentKey)}{r.featureKey ? ` · ${r.featureKey}` : ''} <Pill>{STATUS_LABEL[r.status] || r.status}</Pill>{r.stalled ? <Pill>stalled</Pill> : null}</div>
            <div style={S.meta}>{fmt(r.createdAt)} · by {r.createdBy}{r.pendingScopeRequests ? ` · ${r.pendingScopeRequests} scope request waiting` : ''}</div>
            {r.waitingFor && <div style={S.meta}>{r.waitingFor}</div>}
            {r.error && <div style={{ ...S.meta, color: '#a5391f' }}>{r.error}</div>}
            <button type="button" style={S.btn2} onClick={() => setOpenId(r.id)}>{`Open run #${r.id}`}</button>
          </div>
        )) : <div style={S.empty}>No runs yet. Start one above, or ask a quality agent on the Agents tab.</div>}
      </div>
    </div>
  );
}
