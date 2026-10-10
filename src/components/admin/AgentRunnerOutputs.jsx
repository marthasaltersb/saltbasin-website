// Agent runner -> Outputs: every agent output is a governed object. Proposals (draft specs, amendment proposals,
// enhancement proposals) wait here for a person; records (test results, bugs, test plans, shaped seeds) are shown
// with where they landed. Approving / accepting goes through useToolCategoryGate().run, matching the
// assertReadyToFinalize call inside decideOutput.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { S, Pill, ErrorBox, Field, fmt, KIND_LABEL } from './agentRunnerUi.jsx';

const DECISIONS = {
  draft_spec: [['approve', 'Approve draft'], ['reject', 'Reject draft']],
  amendment_proposal: [['approve', 'Approve amendment'], ['reject', 'Reject amendment']],
  enhancement_proposal: [['accept', 'Accept enhancement'], ['decline', 'Decline enhancement']],
};

function Body({ o }) {
  const p = o.payload;
  switch (o.kind) {
    case 'draft_spec':
      return (
        <div>
          <div data-testid="draft-counts">Parsed as a training spec: {p.preconditionCount} precondition{p.preconditionCount === 1 ? '' : 's'}, {p.stepCount} journey step{p.stepCount === 1 ? '' : 's'}, {p.edgeCount} edge case{p.edgeCount === 1 ? '' : 's'}.</div>
          <div style={S.meta}>Feature {p.feature}. Stable step ids are added when the amendment reviewer freezes it as baseline v1.</div>
          <details><summary style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>Show the draft text</summary><pre style={S.pre}>{p.markdown}</pre></details>
        </div>
      );
    case 'test_results':
      return (
        <div>
          <div data-testid="results-score">{p.score.passed} of {p.score.total} steps passed on baseline v{p.baselineVersion} ({p.suite})</div>
          <div style={S.meta}>Scored by the baseline script against the pinned baseline{p.smokeSource ? `; smoke list from ${p.smokeSource}` : ''}.</div>
          {p.steps.filter((s) => s.result !== 'pass').map((s, i) => <div key={i} style={S.meta}>Failed: {s.id} on {s.surface}{s.seen ? ` (${s.seen})` : ''}</div>)}
          {(p.score.notRun || []).length ? <div style={S.meta}>Not run: {p.score.notRun.join(', ')}</div> : null}
          {(p.observations || []).map((x, i) => <div key={i} style={S.meta}>Observation: {x}</div>)}
        </div>
      );
    case 'amendment_proposal':
      return (
        <div>
          <div>{p.reason}</div>
          <div style={S.meta}>Against baseline v{p.fromBaseline}. Decided by a reviewer other than the proposer.</div>
          {p.changes.map((c, i) => (
            <div key={i} style={S.item} data-testid="amendment-change">
              <b>{c.op}{c.stepId ? ` ${c.stepId}` : ''}</b>: {c.after}
              <div style={S.meta}>Traces to: {c.tracesTo} · Why: {c.whyNeeded}</div>
            </div>
          ))}
          {p.needsOwner?.length ? <div style={S.note} data-testid="needs-owner">Removing {p.needsOwner.join(', ')} names no duplicate step, so it goes to the owner.</div> : null}
        </div>
      );
    case 'bug':
      return o.ref?.duplicateOf
        ? <div data-testid="bug-duplicate">Linked as a duplicate of {o.ref.duplicateOf}. No new bug was filed.</div>
        : (
          <div data-testid="bug-body">
            <div><b>{o.ref?.bugKey}</b> · {p.triageClass} · size {p.size} · step {p.stepId || 'none'}</div>
            <div>Observed: {p.observed}</div><div>Root cause: {p.rootCause}</div><div>Intended fix: {p.proposedFix}</div>
            <div style={S.meta}>Files: {p.files.join(', ')} · Done when: {p.doneWhen.join(', ')}</div>
          </div>
        );
    case 'test_plan':
      return (
        <div data-testid="plan-body">
          <div style={S.meta}>Changed: {p.changedFiles.join(', ')}</div>
          <div><b>Smoke:</b> {p.smoke.length} suites, {p.totals.smokeSteps} steps</div>
          <div><b>Regression:</b> {p.regression.length} baseline{p.regression.length === 1 ? '' : 's'}, {p.totals.regressionSteps} steps</div>
          {p.regression.map((r) => <div key={r.feature} style={S.meta}>{r.feature} v{r.baselineVersion}: {r.reason}</div>)}
          {p.rationale && <div style={S.meta}>Agent's note: {p.rationale}</div>}
        </div>
      );
    case 'enhancement_proposal':
      return (
        <div data-testid="enhancement-body">
          <div><b>Problem:</b> {p.problem}</div><div><b>Evidence:</b> {p.evidence}</div><div><b>Value:</b> {p.value}</div><div><b>Rough size:</b> {p.size}</div>
          {o.ref?.seedId ? <div style={S.note}>Became backlog seed #{o.ref.seedId}.</div> : null}
        </div>
      );
    case 'shaped_seed':
      return <div data-testid="shaped-body">Seed #{o.ref?.seedId} is now <b>{p.stageAfter}</b>: {p.openQuestions.length} open question{p.openQuestions.length === 1 ? '' : 's'} for you, {p.acceptanceCriteria.length} acceptance criteri{p.acceptanceCriteria.length === 1 ? 'on' : 'a'}, size {p.size}. Open Backlog seeds to answer.</div>;
    default:
      return <pre style={S.pre}>{JSON.stringify(p, null, 2)}</pre>;
  }
}

function OutputCard({ o, onChanged }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const gate = useToolCategoryGate();
  const decisions = o.status === 'proposed' ? DECISIONS[o.kind] : null;
  async function decide(decision) {
    setError('');
    try {
      const body = { decision, note };
      await (decision === 'approve' || decision === 'accept' ? gate.run(() => api.decideAgentRunnerOutput(o.id, body)) : api.decideAgentRunnerOutput(o.id, body));
      toast.success('Decision recorded'); setNote(''); await onChanged();
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  async function showFile() {
    try { setFile(await api.agentRunnerOutputAmendment(o.id)); } catch (e) { setError(e.message); }
  }
  return (
    <div style={S.item} data-testid={`output-${o.id}`}>
      {gate.modal}
      <div><b>#{o.id}</b> {KIND_LABEL[o.kind] || o.kind}: {o.title} <Pill>{o.status}</Pill></div>
      <div style={S.meta}>From run #{o.runId} · {fmt(o.createdAt)}{o.decidedBy ? ` · ${o.status} by ${o.decidedBy}: ${o.decisionNote}` : ''}</div>
      <button type="button" style={S.btn2} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? `Hide output #${o.id}` : `Open output #${o.id}`}</button>
      {open && (
        <div style={{ marginTop: '.5rem' }}>
          <Body o={o} />
          {decisions && (
            <div>
              <div style={S.row}><Field label={`Decision note for output ${o.id}`}><input aria-label={`Decision note for output ${o.id}`} style={S.input} value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
              <div style={S.row}>{decisions.map(([d, label]) => <button key={d} type="button" style={d === decisions[0][0] ? S.btn : S.btn2} onClick={() => decide(d)}>{`${label} ${o.id}`}</button>)}</div>
            </div>
          )}
          {o.kind === 'amendment_proposal' && (
            <div>
              <button type="button" style={S.btn2} onClick={showFile}>{`Show amendment file for output ${o.id}`}</button>
              {file && <pre style={S.pre} data-testid="amendment-file">{JSON.stringify(file, null, 2)}</pre>}
            </div>
          )}
          <ErrorBox error={error} />
        </div>
      )}
    </div>
  );
}

export default function OutputsTab() {
  const [outputs, setOutputs] = useState(null);
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setOutputs((await api.agentRunnerOutputs({ kind, status })).outputs); setError(''); } catch (e) { setError(e.message); }
  }, [kind, status]);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);
  return (
    <div>
      <div style={S.sub}>Every output of an agent lands here as the governed object it is. Nothing an agent wrote has changed a spec, a baseline, the backlog's features or the code.</div>
      <div style={S.row}>
        <Field label="Kind">
          <select aria-label="Kind filter" style={S.input} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All kinds</option>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Output status">
          <select aria-label="Output status filter" style={S.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {['proposed', 'approved', 'rejected', 'accepted', 'declined', 'recorded', 'filed', 'linked', 'applied'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <ErrorBox error={error} />
      {!outputs ? <div>Loading…</div> : outputs.length ? outputs.map((o) => <OutputCard key={o.id} o={o} onChanged={load} />) : <div style={S.empty}>No agent output yet. Ask an agent on the Agents tab.</div>}
    </div>
  );
}
