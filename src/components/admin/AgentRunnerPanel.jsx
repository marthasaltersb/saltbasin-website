// Agent runner (2026-10-09): Salt Basin runs the release loop's agents itself. World Shell -> Journeys -> Agent runner
// (administrators). Tabs: Overview, Agents, Runs, Outputs, Test plan, Backlog seeds, Settings.
// Sessions are capped by the change they may make (a work order), not by spend; nothing here caps dollars.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { S, C, Pill, ErrorBox, Field, fmt, lines } from './agentRunnerUi.jsx';
import AgentsTab from './AgentRunnerAgents.jsx';
import RunsTab from './AgentRunnerRuns.jsx';
import OutputsTab from './AgentRunnerOutputs.jsx';
import SeedsTab from './AgentRunnerSeeds.jsx';

const TABS = ['Overview', 'Agents', 'Runs', 'Outputs', 'Test plan', 'Backlog seeds', 'Settings'];

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ goto }) {
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setO(await api.agentRunnerOverview()); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);
  if (!o) return <><ErrorBox error={error} /><div>Loading…</div></>;
  const c = o.counts || {};
  return (
    <div>
      <ErrorBox error={error} />
      <div style={S.card} data-testid="worker-card">
        <div style={S.cardTitle}>Worker</div>
        <div data-testid="worker-status" style={{ fontWeight: 700 }}>{o.worker.message}</div>
        {!o.worker.connected && <div style={S.note}>Queued runs wait until a worker starts. The worker is a separate service from the website (Dockerfile.worker, scripts/agent-worker.mjs).</div>}
        {o.worker.workers.map((w) => <div key={w.id} style={S.meta}>{w.id} · {w.adapter} adapter · {w.online ? 'online' : 'last seen'} {fmt(w.lastSeen)}</div>)}
        <div style={S.meta}>Up to {o.worker.concurrency} runs at once (Settings).</div>
        {o.fixturesAllowed && <div style={S.meta}>Test environment: runs replay recorded, fictional sessions. No network, no API key.</div>}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Runs</div>
        <div data-testid="run-counts">Queued {c.queued || 0} · Running {c.running || 0} · Succeeded {c.succeeded || 0} · Failed {c.failed || 0} · SCOPE_EXCEEDED {c.scope_exceeded || 0} · Stopped {c.stopped || 0}</div>
        <div style={{ marginTop: '.5rem' }}><button type="button" style={S.btn2} onClick={() => goto('Runs')}>Open Runs</button></div>
      </div>
      <div style={S.card} data-testid="waiting-card">
        <div style={S.cardTitle}>Waiting for you</div>
        <div data-testid="waiting-for-you">{o.pendingOutputs} proposal{o.pendingOutputs === 1 ? '' : 's'} · {o.pendingScopeRequests} scope request{o.pendingScopeRequests === 1 ? '' : 's'}</div>
        <div style={{ ...S.row, marginTop: '.5rem' }}>
          <button type="button" style={S.btn2} onClick={() => goto('Outputs')}>Open Outputs</button>
          <button type="button" style={S.btn2} onClick={() => goto('Runs')}>Open Runs for scope requests</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Usage (observed, not capped)</div>
        <div data-testid="usage">{o.usage.runsWithUsage} run{o.usage.runsWithUsage === 1 ? '' : 's'} reported usage · {o.usage.inputTokens} input tokens · {o.usage.outputTokens} output tokens · {o.usage.listCostUsd == null ? 'cost not recorded' : `list cost $${o.usage.listCostUsd.toFixed(2)}`}</div>
        <div style={S.meta}>{o.usage.note}</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Rejected worker calls</div>
        {o.rejectedWorkerCalls.length ? o.rejectedWorkerCalls.map((r) => (
          <div key={r.id} style={S.item} data-testid="rejected-call">{fmt(r.at)} · {r.reason}<div style={S.meta}>{r.details?.path || ''}</div></div>
        )) : <div style={S.empty}>None. Every call a worker made with a bad token would be listed here.</div>}
      </div>
    </div>
  );
}

// ── Test plan ───────────────────────────────────────────────────────────────
function TestPlanTab() {
  const [baselines, setBaselines] = useState(null);
  const [files, setFiles] = useState('');
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.agentRunnerBaselines().then((r) => setBaselines(r.baselines)).catch((e) => setError(e.message)); }, []);
  async function build() {
    setError(''); setPlan(null);
    try { setPlan(await api.agentRunnerTestPlan(lines(files))); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Frozen baselines and smoke suites</div>
        <div style={S.meta}>A smoke suite is a short, fixed list of a feature's most important baseline steps (docs/training/baselines/&lt;feature&gt;/smoke.json, changed only by amendment). A feature without one shows a derived list, labelled as derived.</div>
        {!baselines ? <div>Loading…</div> : baselines.length ? baselines.map((b) => (
          <div key={b.feature} style={S.item} data-testid={`baseline-${b.feature}`}><b>{b.feature}</b> · baseline v{b.latest} · smoke: {b.smokeSteps} step{b.smokeSteps === 1 ? '' : 's'} ({b.smokeSource === 'smoke.json' ? 'smoke.json' : b.smokeSource === 'derived' ? 'derived' : 'none'}){b.fixture ? ' · fictional fixture' : ''}</div>
        )) : <div style={S.empty}>No baseline is frozen yet.</div>}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Plan the tests for a change</div>
        <div style={S.row}>
          <Field label="Changed files (one per line)"><textarea aria-label="Changed files" rows={4} style={S.input} placeholder="server/lib/example.js" value={files} onChange={(e) => setFiles(e.target.value)} /></Field>
        </div>
        <div style={S.row}><button type="button" style={S.btn} onClick={build}>Build test plan</button></div>
        <ErrorBox error={error} />
        {plan && (
          <div data-testid="test-plan">
            <div style={S.cardTitle}>Smoke: {plan.smoke.length} suites, {plan.totals.smokeSteps} steps</div>
            {plan.smoke.map((s) => <div key={s.feature} style={S.meta}>{s.feature} v{s.baselineVersion}: {s.stepIds.join(', ') || 'no steps'} ({s.source})</div>)}
            <div style={{ ...S.cardTitle, marginTop: '.7rem' }}>Regression: {plan.regression.length} baseline{plan.regression.length === 1 ? '' : 's'}, {plan.totals.regressionSteps} steps</div>
            {plan.regression.length ? plan.regression.map((r) => <div key={r.feature} style={S.meta} data-testid={`regression-${r.feature}`}>{r.feature} v{r.baselineVersion} ({r.stepCount} steps): {r.reason}</div>) : <div style={S.empty}>No feature's files or shared modules were touched, so no full regression is needed.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
function SettingsTab() {
  const [v, setV] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ghToken, setGhToken] = useState('');
  const [newToken, setNewToken] = useState(null);
  const apply = (view) => {
    setV(view);
    setForm({
      S: String(view.sizeLimits.S), M: String(view.sizeLimits.M), L: String(view.sizeLimits.L), turnLimit: String(view.turnLimit), concurrency: String(view.concurrency),
      staleSeconds: String(view.staleSeconds), model: view.model, sharedModules: view.sharedModules.join('\n'), forbiddenPatterns: view.forbiddenPatterns.join('\n'),
    });
  };
  useEffect(() => { api.agentRunnerSettings().then(apply).catch((e) => setError(e.message)); }, []);
  if (!v || !form) return <><ErrorBox error={error} /><div>Loading…</div></>;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function act(fn, ok) {
    setBusy(true); setError('');
    try { const out = await fn(); if (ok) toast.success(ok); return out; } catch (e) { setError(e.message); toast.error(e.message); return null; } finally { setBusy(false); }
  }
  async function save() {
    const view = await act(() => api.saveAgentRunnerSettings({
      sizeLimits: { S: form.S, M: form.M, L: form.L }, turnLimit: form.turnLimit, concurrency: form.concurrency, staleSeconds: form.staleSeconds, model: form.model,
      sharedModules: lines(form.sharedModules), forbiddenPatterns: lines(form.forbiddenPatterns),
    }), 'Settings saved');
    if (view) apply(view);
  }
  return (
    <div>
      <ErrorBox error={error} />
      <div style={S.card}>
        <div style={S.cardTitle}>Work-order size limits</div>
        <div style={S.meta}>A work order gives every item a size. The size is a ceiling on changed lines for that item; a branch over it fails as SCOPE_EXCEEDED and is not merged. Nothing here is a spend cap.</div>
        <div style={S.row}>
          <Field label="Size S (lines)"><input aria-label="Size S (lines)" type="number" min="1" style={S.input} value={form.S} onChange={set('S')} /></Field>
          <Field label="Size M (lines)"><input aria-label="Size M (lines)" type="number" min="1" style={S.input} value={form.M} onChange={set('M')} /></Field>
          <Field label="Size L (lines)"><input aria-label="Size L (lines)" type="number" min="1" style={S.input} value={form.L} onChange={set('L')} /></Field>
        </div>
        <div style={S.meta}>Defaults: S {v.defaults.sizeLimits.S}, M {v.defaults.sizeLimits.M}, L {v.defaults.sizeLimits.L}.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Run limits</div>
        <div style={S.row}>
          <Field label="Turn limit"><input aria-label="Turn limit" type="number" min="1" style={S.input} value={form.turnLimit} onChange={set('turnLimit')} /></Field>
          <Field label="Concurrency"><input aria-label="Concurrency" type="number" min="1" style={S.input} value={form.concurrency} onChange={set('concurrency')} /></Field>
          <Field label="Stalled after (seconds)"><input aria-label="Stalled after (seconds)" type="number" min="5" style={S.input} value={form.staleSeconds} onChange={set('staleSeconds')} /></Field>
          <Field label="Model"><input aria-label="Model" style={S.input} value={form.model} onChange={set('model')} /></Field>
        </div>
        <div style={S.meta}>The turn limit only stops a run that loops without progress. A run ends when its work order is done or blocked.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Paths</div>
        <div style={S.row}>
          <Field label="Shared modules (a change forces a full regression, one path or glob per line)"><textarea aria-label="Shared modules" rows={5} style={S.input} value={form.sharedModules} onChange={set('sharedModules')} /></Field>
          <Field label="Extra forbidden paths (one glob per line)"><textarea aria-label="Extra forbidden paths" rows={5} style={S.input} value={form.forbiddenPatterns} onChange={set('forbiddenPatterns')} /></Field>
        </div>
        <div style={S.meta}>Always forbidden to a work order unless its item is about them: training specs, baselines, amendments, the process definition, lockfiles and dependency lists.</div>
        <div style={{ ...S.row, marginTop: '.6rem' }}><button type="button" style={S.btn} disabled={busy} onClick={save}>Save settings</button></div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Anthropic API key</div>
        <div data-testid="api-key-status">{v.apiKey.set ? 'API key: set in the website environment' : 'API key: not set in the website environment'}</div>
        <div style={S.meta}>{v.apiKey.note} The value is never shown or stored here.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>GitHub token</div>
        <div data-testid="github-token-status">{v.githubToken.stored ? `GitHub token: stored, ending in ${v.githubToken.last4}` : 'GitHub token: none stored'}</div>
        <div style={S.meta}>Stored encrypted. Only a worker holding a live claim on a run can fetch it, to clone and to push that run's own work branch. It is never shown again after saving.</div>
        <div style={S.row}>
          <Field label="GitHub token"><input aria-label="GitHub token" type="password" autoComplete="off" style={S.input} value={ghToken} onChange={(e) => setGhToken(e.target.value)} /></Field>
          <button type="button" style={S.btn} disabled={busy} onClick={async () => { const view = await act(() => api.saveAgentRunnerGithubToken(ghToken), 'GitHub token stored'); if (view) { setGhToken(''); setV(view); } }}>Save GitHub token</button>
          {v.githubToken.stored && <button type="button" style={S.btn2} disabled={busy} onClick={async () => { const view = await act(() => api.removeAgentRunnerGithubToken(), 'GitHub token removed'); if (view) setV(view); }}>Remove GitHub token</button>}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Worker token</div>
        <div data-testid="worker-token-status">{v.workerToken.created ? `Worker token: created, ending in ${v.workerToken.last4}` : 'Worker token: none created'}</div>
        <div style={S.meta}>The worker (scripts/agent-worker.mjs) sends this token with every call. Creating a new one stops the old one working immediately.</div>
        <div style={S.row}>
          <button type="button" style={S.btn} disabled={busy} onClick={async () => { const out = await act(() => api.createAgentRunnerWorkerToken(), 'Worker token created'); if (out) { setNewToken(out.token); setV(out.view); } }}>Create new worker token</button>
        </div>
        {newToken && (
          <div style={S.note} data-testid="new-worker-token">
            Copy this token now; it is shown once: <code style={{ wordBreak: 'break-all' }}>{newToken}</code>
            <div style={{ marginTop: '.4rem' }}><button type="button" style={S.btn2} onClick={() => setNewToken(null)}>I have copied it</button></div>
          </div>
        )}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Settings history</div>
        {v.history.length ? [...v.history].reverse().map((h, i) => <div key={i} style={S.item}>{fmt(h.at)} · {h.by} · {h.note}</div>) : <div style={S.empty}>No changes yet: the defaults are in use.</div>}
      </div>
    </div>
  );
}

export default function AgentRunnerPanel() {
  const [tab, setTab] = useState('Overview');
  const [open, setOpen] = useState({ run: null, seed: null });
  const goto = (t, extra) => { setTab(t); if (extra) setOpen((o) => ({ ...o, ...extra })); };
  return (
    <div style={S.root}>
      <h1 style={S.h1}>Agent runner</h1>
      <div style={S.sub}>Salt Basin runs the release loop's agents on its own worker with the Claude Agent SDK. Every session is capped by the change it is allowed to make (its work order), not by spend. Everything an agent writes lands as a governed object that waits for a person.</div>
      <div role="tablist" style={S.tabs}>
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Overview' && <OverviewTab goto={goto} />}
      {tab === 'Agents' && <AgentsTab goto={goto} />}
      {tab === 'Runs' && <RunsTab initialRun={open.run} onOpened={() => setOpen((o) => ({ ...o, run: null }))} goto={goto} />}
      {tab === 'Outputs' && <OutputsTab goto={goto} />}
      {tab === 'Test plan' && <TestPlanTab />}
      {tab === 'Backlog seeds' && <SeedsTab goto={goto} />}
      {tab === 'Settings' && <SettingsTab />}
    </div>
  );
}
