// Release loop (2026-10-09): the platform copy of the release process, for
// admins and in-app agents. Reachable from World Shell -> Journeys -> Release
// loop ("Open configuration"), also Classic Tools -> Platform Lifecycle
// Management -> Release loop. Works at 390px: one column, 44px tap targets,
// no hover-only actions, no horizontal page scroll.
//
// Every action shows its error inline (role="alert") and in a toast; nothing
// is swallowed. "Mark done" goes through useToolCategoryGate().run, matching
// the server-side assertReadyToFinalize inside the transition.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import AgentRunnerLoopCard from './AgentRunnerLoopCard.jsx';
import { ReleasesTab, SessionPlansTab } from './ReleaseCutTabs.jsx';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const S = {
  root: { background: '#fff', color: C.ink, borderRadius: 12, padding: '1rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'DM Sans, sans-serif', fontSize: '.88rem', boxSizing: 'border-box', width: '100%', overflowWrap: 'anywhere' },
  h1: { fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: 0 },
  h2: { fontSize: '1rem', margin: '0 0 .4rem' },
  sub: { color: C.sec, fontSize: '.8rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  tabs: { display: 'flex', gap: '.3rem', borderBottom: `1px solid ${C.line}`, marginBottom: '1rem', flexWrap: 'wrap' },
  tab: (on) => ({ border: 0, background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink, padding: '0 1rem', minHeight: 44, borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '.85rem', fontWeight: on ? 700 : 500 }),
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.85rem', marginBottom: '1rem', background: '#fff', minWidth: 0 },
  cardTitle: { fontWeight: 700, fontSize: '.92rem', marginBottom: '.5rem' },
  input: { padding: '.4rem .55rem', minHeight: 44, borderRadius: 7, border: '1px solid rgba(27,42,59,.3)', fontSize: '.88rem', font: 'inherit', background: '#fff', color: C.ink, width: '100%', boxSizing: 'border-box' },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '0 1rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  btn2: { border: '1px solid rgba(27,42,59,.3)', background: '#fff', color: C.ink, borderRadius: 7, padding: '0 .9rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.76rem', color: C.sec, flex: '1 1 200px', minWidth: 0 },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, color: C.ink, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  pill: (color) => ({ display: 'inline-block', padding: '.05rem .55rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, color: '#fff', background: color }),
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.82rem' },
  item: { borderBottom: `1px solid ${C.soft}`, padding: '.6rem 0' },
  meta: { color: C.sec, fontSize: '.74rem' },
};

const BAD = /fail|not_passed|needs|recurred|open|page_error|failed_request/i;
const GOOD = /^(pass|done|verified|reconciled)/i;
function Pill({ children }) {
  const t = String(children);
  return <span style={S.pill(GOOD.test(t) ? C.ok : BAD.test(t) ? C.bad : C.sec)}>{t}</span>;
}
function ErrorBox({ error, gaps }) {
  if (!error) return null;
  return (
    <div role="alert" style={S.alert}>
      {error}
      {gaps?.length ? <ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{gaps.map((g) => <li key={g}>{g}</li>)}</ul> : null}
    </div>
  );
}
function Field({ label, children }) { return <label style={S.label}><span>{label}</span>{children}</label>; }
const fmt = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');

// ── Definition ──────────────────────────────────────────────────────────────
function DefinitionTab() {
  const [view, setView] = useState(null);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const v = await api.getReleaseLoopDefinition();
      setView(v);
      setDraft(JSON.parse(JSON.stringify(v.definition)));
      setError(v.overrideError || '');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!view || !draft) return <><ErrorBox error={error} /><div>Loading…</div></>;
  const d = draft;
  const set = (patch) => setDraft({ ...d, ...patch });
  const setRole = (key, patch) => set({ roles: d.roles.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  const setGate = (key, value) => {
    const orig = view.definition.gates[key];
    set({ gates: { ...d.gates, [key]: Array.isArray(orig) ? value.split('\n').map((s) => s.trim()).filter(Boolean) : value } });
  };
  const setStage = (key, patch) => set({ stages: d.stages.map((x) => (x.key === key ? { ...x, ...patch } : x)) });
  const EDGE_FIELDS = ['next', 'onPass', 'onFail', 'onFixable', 'onBusinessDefinition'];
  async function save() {
    setBusy(true); setError('');
    try {
      await api.saveReleaseLoopDefinition(d, note);
      setNote(''); toast.success('Definition saved as a new version'); await load();
    } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); setError('');
    try { await api.resetReleaseLoopDefinition(note); setNote(''); toast.success('Definition reset to the shipped content'); await load(); }
    catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  }
  return (
    <div>
      <ErrorBox error={error} />
      <div style={S.card}>
        <div style={S.cardTitle}>{view.definition.name}</div>
        <div data-testid="definition-version" style={{ fontWeight: 700 }}>Definition version {view.definition.version}</div>
        <div style={S.meta}>Source: {view.restored ? `shipped content restored by a reset (the shipped file is version ${view.defaultVersion})` : view.overridden ? 'edited in the platform' : `shipped file (version ${view.defaultVersion})`}. Saving always creates the next version; you cannot choose the number.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Edit the definition</div>
        <div style={S.row}>
          <Field label="Summary"><textarea aria-label="Summary" rows={3} style={S.input} value={d.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
        </div>
        <div style={S.row}>
          <Field label="Max fix rounds"><input aria-label="Max fix rounds" type="number" min="1" max="10" style={S.input} value={d.maxFixRounds} onChange={(e) => set({ maxFixRounds: e.target.value })} /></Field>
          <Field label="Max fix attempts per bug"><input aria-label="Max fix attempts per bug" type="number" min="1" max="5" style={S.input} value={d.bugEscalation.maxFixAttemptsPerBug} onChange={(e) => set({ bugEscalation: { ...d.bugEscalation, maxFixAttemptsPerBug: e.target.value } })} /></Field>
        </div>
        <div style={S.cardTitle}>Roles</div>
        {d.roles.map((r) => (
          <div key={r.key} style={S.item}>
            <div style={S.meta}>{r.key}</div>
            <div style={S.row}>
              <Field label={`Name of ${r.key}`}><input aria-label={`Name of ${r.key}`} style={S.input} value={r.name} onChange={(e) => setRole(r.key, { name: e.target.value })} /></Field>
              <Field label={`What ${r.key} does`}><textarea aria-label={`What ${r.key} does`} rows={3} style={S.input} value={r.does} onChange={(e) => setRole(r.key, { does: e.target.value })} /></Field>
            </div>
          </div>
        ))}
        <div style={{ ...S.cardTitle, marginTop: '.8rem' }}>Gates</div>
        {Object.keys(d.gates).map((k) => (
          <div key={k} style={S.row}>
            <Field label={`Gate ${k}`}>
              <textarea aria-label={`Gate ${k}`} rows={Array.isArray(d.gates[k]) ? 4 : 3} style={S.input}
                value={Array.isArray(d.gates[k]) ? d.gates[k].join('\n') : d.gates[k]} onChange={(e) => setGate(k, e.target.value)} />
            </Field>
          </div>
        ))}
        <div style={{ ...S.cardTitle, marginTop: '.8rem' }}>Stage transitions</div>
        <div style={S.meta}>Stage keys are fixed because the gates refer to them by name. Where a stage goes next can be changed; every transition a stage has must keep a target.</div>
        {d.stages.map((st) => {
          const fields = EDGE_FIELDS.filter((f) => st[f] !== undefined);
          if (!fields.length) return null;
          return (
            <div key={st.key} style={S.item}>
              <b>{st.key}</b>
              <div style={S.row}>
                {fields.map((f) => (
                  <Field key={f} label={`${st.key} ${f}`}>
                    <select aria-label={`Stage ${st.key} ${f}`} style={S.input} value={st[f]} onChange={(e) => setStage(st.key, { [f]: e.target.value })}>
                      {d.stages.map((t) => <option key={t.key} value={t.key}>{t.key}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            </div>
          );
        })}
        <div style={S.row}>
          <Field label="Change note"><input aria-label="Change note" style={S.input} placeholder="What changed and why" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <div style={S.row}>
          <button type="button" style={S.btn} disabled={busy} onClick={save}>Save new version</button>
          {view.overridden && !view.restored && <button type="button" style={S.btn2} disabled={busy} onClick={reset}>Reset to shipped definition</button>}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Stages</div>
        {view.definition.stages.map((s) => (
          <div key={s.key} style={S.item}>
            <b>{s.key}</b> <span style={S.meta}>role {s.role}{['next', 'onPass', 'onFail', 'onFixable', 'onBusinessDefinition'].filter((f) => s[f]).map((f) => ` · ${f} → ${s[f]}`).join('')}</span>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Platform agents</div>
        {view.agents.length ? view.agents.map((a) => (
          <div key={a.key} style={S.item} data-testid={`agent-${a.key}`}><b>{a.name}</b> <span style={S.meta}>{a.key}</span><div style={S.meta}>{a.roleDescription}</div></div>
        )) : <div style={S.empty}>No release loop agents are seeded.</div>}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Version history</div>
        {view.history.length ? [...view.history].reverse().map((h) => (
          <div key={h.version} style={S.item}>Version {h.version} · {h.by} · {fmt(h.at)}<div style={S.meta}>{h.note}</div></div>
        )) : <div style={S.empty}>No edits yet: the shipped definition is in use.</div>}
      </div>
    </div>
  );
}

// ── Bug card ────────────────────────────────────────────────────────────────
function BugCard({ bug, run, limit, onChanged }) {
  const [text, setText] = useState('');
  const [text2, setText2] = useState('');
  const [scope, setScope] = useState('backlog_pre_existing');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  async function act(action, body, ok) {
    setError('');
    try { await api.releaseLoopBugAction(bug.id, action, body); setText(''); setText2(''); toast.success(ok); await onChanged(); }
    catch (e) { setError(e.message); toast.error(e.message); }
  }
  const s = bug.status;
  return (
    <div style={S.item} data-testid={`bug-${bug.bugKey}`}>
      <div><b>{bug.bugKey}</b> {bug.title} <Pill>{s}</Pill></div>
      <div style={S.meta}>{bug.triageClass}{bug.stepId ? ` · step ${bug.stepId}` : ''} · Fix attempts: {bug.fixAttempts} of {limit}</div>
      {bug.observed && <div style={S.meta}>Observed: {bug.observed}</div>}
      {bug.question && <div style={S.note}>Question for the owner: {bug.question}{bug.ownerAnswer ? <div>Owner's answer: {bug.ownerAnswer}</div> : null}</div>}
      {(s === 'open' || s === 'recurred') && (
        <div style={S.row}>
          <button type="button" style={S.btn} onClick={() => act('start-fix', {}, 'Fix started')}>Start fix for {bug.bugKey}</button>
        </div>
      )}
      {s === 'fixing' && (
        <div>
          <div style={S.row}>
            <Field label={`Fix summary for ${bug.bugKey}`}><input aria-label={`Fix summary for ${bug.bugKey}`} style={S.input} value={text} onChange={(e) => setText(e.target.value)} /></Field>
            <Field label={`Files changed for ${bug.bugKey}`}><input aria-label={`Files changed for ${bug.bugKey}`} style={S.input} placeholder="a.jsx, b.js" value={text2} onChange={(e) => setText2(e.target.value)} /></Field>
          </div>
          <div style={S.row}><button type="button" style={S.btn} onClick={() => act('fix', { summary: text, files: text2 }, 'Fix recorded')}>Record fix for {bug.bugKey}</button></div>
        </div>
      )}
      {s === 'fixed_awaiting_retest' && (
        <div>
          <div style={S.row}>
            <Field label={`Re-test note for ${bug.bugKey}`}><input aria-label={`Re-test note for ${bug.bugKey}`} style={S.input} value={text} onChange={(e) => setText(e.target.value)} /></Field>
          </div>
          <div style={S.row}>
            <button type="button" style={S.btn} onClick={() => act('retest', { passed: true, note: text }, 'Bug verified')}>Re-test passed for {bug.bugKey}</button>
            <button type="button" style={S.btn2} onClick={() => act('retest', { passed: false, note: text }, 'Re-test failure recorded')}>Re-test failed for {bug.bugKey}</button>
          </div>
        </div>
      )}
      {s === 'needs_business_definition' && (
        <div>
          <div style={S.row}>
            <Field label={`Owner's answer for ${bug.bugKey}`}><textarea aria-label={`Owner's answer for ${bug.bugKey}`} rows={2} style={S.input} value={text} onChange={(e) => setText(e.target.value)} /></Field>
          </div>
          <div style={S.row}><button type="button" style={S.btn} onClick={() => act('answer', { answer: text }, "Owner's answer recorded")}>Record owner's answer for {bug.bugKey}</button></div>
        </div>
      )}
      {s === 'needs_human' && (
        <div>
          <div style={S.note}>This bug used all {limit} fix attempts and left the automated loop. No agent touches it until a person decides.</div>
          <div style={S.row}>
            <Field label={`Decision note for ${bug.bugKey}`}><input aria-label={`Decision note for ${bug.bugKey}`} style={S.input} value={text} onChange={(e) => setText(e.target.value)} /></Field>
          </div>
          <div style={S.row}>
            <button type="button" style={S.btn} onClick={() => act('decision', { decision: 'retry', note: text }, 'Another round of attempts granted')}>Give another round of attempts to {bug.bugKey}</button>
            <button type="button" style={S.btn2} onClick={() => act('decision', { decision: 'backlog', note: text }, 'Moved to the backlog')}>Move {bug.bugKey} to backlog</button>
          </div>
        </div>
      )}
      {['open', 'recurred', 'fixing', 'fixed_awaiting_retest'].includes(s) && (
        <div>
          <button type="button" style={S.btn2} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide scope decision' : 'Scope decision'} for {bug.bugKey}</button>
          {open && (
            <div style={{ marginTop: '.5rem' }}>
              <div style={S.row}>
                <Field label={`Scope for ${bug.bugKey}`}>
                  <select aria-label={`Scope for ${bug.bugKey}`} style={S.input} value={scope} onChange={(e) => setScope(e.target.value)}>
                    <option value="backlog_pre_existing">backlog_pre_existing</option><option value="reassigned">reassigned</option><option value="process_note">process_note</option>
                  </select>
                </Field>
                <Field label={`Evidence for ${bug.bugKey}`}><input aria-label={`Evidence for ${bug.bugKey}`} style={S.input} value={text2} onChange={(e) => setText2(e.target.value)} /></Field>
              </div>
              <div style={S.row}><button type="button" style={S.btn} onClick={() => act('scope', { status: scope, evidence: text2 }, 'Scope recorded')}>Set scope for {bug.bugKey}</button></div>
            </div>
          )}
        </div>
      )}
      <ErrorBox error={error} />
      {bug.history.length > 0 && (
        <details>
          <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>History of {bug.bugKey} ({bug.history.length})</summary>
          {bug.history.map((h, i) => <div key={i} style={S.meta}>{fmt(h.at)} · {h.from || 'new'} → {h.to}{h.note ? ` · ${h.note}` : ''}</div>)}
        </details>
      )}
    </div>
  );
}

// ── Run detail ──────────────────────────────────────────────────────────────
function RunDetail({ runId, onBack, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [gaps, setGaps] = useState([]);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [round, setRound] = useState({ commitSha: '', stepsPassed: '', stepsTotal: '', consoleErrors: '0', failedRequests: '0', passed: 'false' });
  const [step, setStep] = useState({ stepId: '', surface: 'desktop', status: 'pass', note: '' });
  const [bug, setBug] = useState({ title: '', triageClass: 'defect', stepId: '', observed: '', question: '' });
  const [rec, setRec] = useState({ description: '', state: 'failed', failureClass: 'unclassified', stateLeft: '' });
  const [resolve, setResolve] = useState({});
  const [stepError, setStepError] = useState('');
  const gate = useToolCategoryGate();
  const lastStep = useRef(0);

  const load = useCallback(async () => {
    try {
      const next = await api.getReleaseLoopRun(runId);
      setD(next);
      lastStep.current = next.steps.length ? next.steps[next.steps.length - 1].id : 0;
    } catch (e) { setError(e.message); }
  }, [runId]);
  useEffect(() => { load(); }, [load]);

  // Live step log: poll for new steps while the run is validating.
  const live = d && d.run.status === 'active' && d.run.stage === 'validate';
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(async () => {
      try {
        const { steps } = await api.listReleaseLoopSteps(runId, lastStep.current);
        if (steps.length) {
          lastStep.current = steps[steps.length - 1].id;
          setD((cur) => (cur ? { ...cur, steps: [...cur.steps, ...steps.filter((s) => !cur.steps.some((x) => x.id === s.id))] } : cur));
        }
        setStepError('');
      } catch (e) { setStepError(`Live steps could not refresh: ${e.message}`); }
    }, 3000);
    return () => clearInterval(t);
  }, [live, runId]);

  async function run(fn, ok) {
    setError(''); setGaps([]); setMessage('');
    try { const out = await fn(); if (ok) toast.success(ok); await load(); onChanged(); return out; }
    catch (e) { setError(e.message); setGaps(e.body?.gaps || []); toast.error(e.message); return null; }
  }
  async function move(to) {
    setError(''); setGaps([]); setMessage('');
    try {
      const out = await (to === 'done' ? gate.run(() => api.transitionReleaseLoopRun(runId, to, note)) : api.transitionReleaseLoopRun(runId, to, note));
      if (out.outcome === 'not_passed') setMessage(out.message);
      toast.success(out.outcome === 'done' ? 'Run marked done' : out.outcome === 'not_passed' ? 'Run recorded as not passed' : `Moved to ${to}`);
      setNote(''); await load(); onChanged();
    } catch (e) { setError(e.message); setGaps(e.body?.gaps || []); toast.error(e.message); }
  }

  if (!d) return <><button type="button" style={S.btn2} onClick={onBack}>← All runs</button><ErrorBox error={error} /><div>Loading…</div></>;
  const r = d.run;
  const closed = r.status !== 'active';
  return (
    <div>
      {gate.modal}
      <button type="button" style={S.btn2} onClick={onBack}>← All runs</button>
      <h2 style={{ ...S.h2, marginTop: '.8rem' }}>{r.featureKey} · {r.releaseKey}</h2>
      <ErrorBox error={error} gaps={gaps} />
      {message && <div role="status" style={S.note}>{message}</div>}

      <div style={S.card}>
        <div style={S.cardTitle}>Stage</div>
        <div data-testid="run-stage">Stage: <b>{r.stage}</b>{d.stageRole ? ` (${d.stageRole.name})` : ''} · Status: <Pill>{r.status}</Pill></div>
        <div style={S.meta}>Fix rounds used: {r.fixRounds} of {d.maxFixRounds} · definition version {r.definitionVersion}</div>
        {!closed && (
          <>
            <div style={{ ...S.row, marginTop: '.6rem' }}>
              <Field label="Transition note (optional)"><input aria-label="Transition note" style={S.input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </div>
            <div style={S.row}>
              {d.allowedTransitions.length ? d.allowedTransitions.map((t) => (
                <button key={t} type="button" style={t === 'done' ? S.btn : S.btn2} onClick={() => move(t)}>{t === 'done' ? 'Mark done' : `Move to ${t}`}</button>
              )) : <span style={S.meta}>No further stage.</span>}
            </div>
          </>
        )}
        <div style={{ marginTop: '.5rem' }} data-testid="done-gate">
          <b>Done gate:</b> {d.doneGate.ok ? <Pill>ready</Pill> : <Pill>blocked</Pill>}
          {!d.doneGate.ok && <ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{d.doneGate.gaps.map((g) => <li key={g}>{g}</li>)}</ul>}
        </div>
      </div>

      <AgentRunnerLoopCard runId={runId} stage={r.stage} active={!closed} onChanged={load} />

      <div style={S.card}>
        <div style={S.cardTitle}>Validation rounds</div>
        {d.rounds.length ? d.rounds.map((x) => (
          <div key={x.roundNo} style={S.item} data-testid={`round-${x.roundNo}`}>
            Round {x.roundNo}: <Pill>{x.passed ? 'passed' : 'failed'}</Pill> <span style={S.meta}>{x.stepsPassed != null ? `${x.stepsPassed} of ${x.stepsTotal} steps` : 'steps not recorded'} · console errors {x.consoleErrors ?? 'not recorded'} · failed requests {x.failedRequests ?? 'not recorded'}{x.commitSha ? ` · ${x.commitSha}` : ''}</span>
          </div>
        )) : <div style={S.empty}>No round recorded yet.</div>}
        {!closed && r.stage === 'validate' && (
          <div style={{ marginTop: '.6rem' }}>
            <div style={S.cardTitle}>Record round {d.currentRoundNo}</div>
            <div style={S.row}>
              <Field label="Commit (optional)"><input aria-label="Commit" style={S.input} value={round.commitSha} onChange={(e) => setRound({ ...round, commitSha: e.target.value })} /></Field>
              <Field label="Steps passed"><input aria-label="Steps passed" type="number" min="0" style={S.input} value={round.stepsPassed} onChange={(e) => setRound({ ...round, stepsPassed: e.target.value })} /></Field>
              <Field label="Steps total"><input aria-label="Steps total" type="number" min="0" style={S.input} value={round.stepsTotal} onChange={(e) => setRound({ ...round, stepsTotal: e.target.value })} /></Field>
            </div>
            <div style={S.row}>
              <Field label="Console errors"><input aria-label="Console errors" type="number" min="0" style={S.input} value={round.consoleErrors} onChange={(e) => setRound({ ...round, consoleErrors: e.target.value })} /></Field>
              <Field label="Failed requests"><input aria-label="Failed requests" type="number" min="0" style={S.input} value={round.failedRequests} onChange={(e) => setRound({ ...round, failedRequests: e.target.value })} /></Field>
              <Field label="Result">
                <select aria-label="Round result" style={S.input} value={round.passed} onChange={(e) => setRound({ ...round, passed: e.target.value })}>
                  <option value="false">Failed</option><option value="true">Passed</option>
                </select>
              </Field>
            </div>
            <div style={S.row}><button type="button" style={S.btn} onClick={() => run(() => api.recordReleaseLoopRound(runId, round), 'Round recorded')}>Record round</button></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Live steps {live && <span style={S.meta}>(refreshing every 3 seconds, round {d.currentRoundNo})</span>}</div>
        <ErrorBox error={stepError} />
        {d.steps.length ? d.steps.map((x) => (
          <div key={x.id} style={S.item} data-testid="live-step">
            <Pill>{x.status}</Pill> <b>{x.stepId || 'note'}</b> <span style={S.meta}>round {x.roundNo}{x.surface ? ` · ${x.surface}` : ''} · {fmt(x.at)}</span>
            {x.note && <div>{x.note}</div>}
          </div>
        )) : <div style={S.empty}>No steps logged yet.</div>}
        {live && (
          <div style={{ marginTop: '.6rem' }}>
            <div style={S.row}>
              <Field label="Step id"><input aria-label="Step id" style={S.input} placeholder="J1.1" value={step.stepId} onChange={(e) => setStep({ ...step, stepId: e.target.value })} /></Field>
              <Field label="Surface">
                <select aria-label="Step surface" style={S.input} value={step.surface} onChange={(e) => setStep({ ...step, surface: e.target.value })}>
                  {['desktop', 'mobile', 'api', 'mcp', 'cli'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Step status">
                <select aria-label="Step status" style={S.input} value={step.status} onChange={(e) => setStep({ ...step, status: e.target.value })}>
                  {['pass', 'fail', 'ambiguous', 'info', 'page_error', 'failed_request'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
            </div>
            <div style={S.row}>
              <Field label="Step note"><input aria-label="Step note" style={S.input} value={step.note} onChange={(e) => setStep({ ...step, note: e.target.value })} /></Field>
              <button type="button" style={S.btn} onClick={async () => { const out = await run(() => api.addReleaseLoopStep(runId, step), 'Step logged'); if (out) setStep({ ...step, stepId: '', note: '' }); }}>Log step</button>
            </div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Bugs</div>
        {d.bugs.length ? d.bugs.map((b) => <BugCard key={b.id} bug={b} run={r} limit={d.maxFixAttemptsPerBug} onChanged={async () => { await load(); onChanged(); }} />) : <div style={S.empty}>No bugs recorded.</div>}
        {!closed && (
          <div style={{ marginTop: '.6rem' }}>
            <div style={S.cardTitle}>Add a bug from triage</div>
            <div style={S.row}>
              <Field label="Bug title"><input aria-label="Bug title" style={S.input} value={bug.title} onChange={(e) => setBug({ ...bug, title: e.target.value })} /></Field>
              <Field label="Bug class">
                <select aria-label="Bug class" style={S.input} value={bug.triageClass} onChange={(e) => setBug({ ...bug, triageClass: e.target.value })}>
                  {['defect', 'spec_error', 'environment', 'needs_business_definition', 'coverage_gap'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
            </div>
            <div style={S.row}>
              <Field label="Bug step id"><input aria-label="Bug step id" style={S.input} value={bug.stepId} onChange={(e) => setBug({ ...bug, stepId: e.target.value })} /></Field>
              <Field label="Observed"><input aria-label="Observed" style={S.input} value={bug.observed} onChange={(e) => setBug({ ...bug, observed: e.target.value })} /></Field>
            </div>
            {bug.triageClass === 'needs_business_definition' && (
              <div style={S.row}><Field label="Exact question for the owner"><textarea aria-label="Exact question for the owner" rows={2} style={S.input} value={bug.question} onChange={(e) => setBug({ ...bug, question: e.target.value })} /></Field></div>
            )}
            <div style={S.row}><button type="button" style={S.btn} onClick={async () => { const out = await run(() => api.addReleaseLoopBug(runId, bug), 'Bug added'); if (out) setBug({ title: '', triageClass: 'defect', stepId: '', observed: '', question: '' }); }}>Add bug</button></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Fixes</div>
        {d.fixes.length ? d.fixes.map((f) => (
          <div key={f.id} style={S.item}><b>{f.bugId}</b> · fix round {f.roundNo}: {f.summary}{f.files.length ? <div style={S.meta}>{f.files.join(', ')}</div> : null}</div>
        )) : <div style={S.empty}>No fixes recorded.</div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Reconciliation items</div>
        <div style={S.sub}>Every failure, refusal, partial step or deviation an agent reports. An item closes only with a note that gives the evidence.</div>
        {d.reconciliation.length ? d.reconciliation.map((it) => {
          const f = resolve[it.id] || { disposition: 'reconciled', note: '' };
          return (
            <div key={it.id} style={S.item} data-testid={`recon-${it.id}`}>
              <div><Pill>{it.disposition}</Pill> {it.description} <span style={S.meta}>{it.state} · {it.failureClass}</span></div>
              {it.stateLeft && <div style={S.meta}>State left: {it.stateLeft}</div>}
              {it.dispositionNote && <div style={S.meta}>Note: {it.dispositionNote}</div>}
              {it.disposition === 'open' && !closed && (
                <div style={S.row}>
                  <Field label={`Resolution note for item ${it.id}`}><input aria-label={`Resolution note for item ${it.id}`} style={S.input} value={f.note} onChange={(e) => setResolve({ ...resolve, [it.id]: { ...f, note: e.target.value } })} /></Field>
                  <button type="button" style={S.btn} onClick={() => run(() => api.resolveReleaseLoopReconciliation(runId, it.id, { disposition: 'reconciled', note: f.note }), 'Item reconciled')}>Mark item {it.id} reconciled</button>
                </div>
              )}
            </div>
          );
        }) : <div style={S.empty}>No reconciliation items.</div>}
        {!closed && (
          <div style={{ marginTop: '.6rem' }}>
            <div style={S.cardTitle}>Add a reconciliation item</div>
            <div style={S.row}>
              <Field label="What failed"><input aria-label="What failed" style={S.input} value={rec.description} onChange={(e) => setRec({ ...rec, description: e.target.value })} /></Field>
              <Field label="State it left"><input aria-label="State it left" style={S.input} value={rec.stateLeft} onChange={(e) => setRec({ ...rec, stateLeft: e.target.value })} /></Field>
            </div>
            <div style={S.row}>
              <Field label="Item state">
                <select aria-label="Item state" style={S.input} value={rec.state} onChange={(e) => setRec({ ...rec, state: e.target.value })}>
                  {['failed', 'refused', 'partial', 'interrupted'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Item class">
                <select aria-label="Item class" style={S.input} value={rec.failureClass} onChange={(e) => setRec({ ...rec, failureClass: e.target.value })}>
                  {['unclassified', 'product_defect', 'requirement_gap', 'owner_direction_conflict', 'test_harness', 'environment', 'process', 'informational'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
            </div>
            <div style={S.row}><button type="button" style={S.btn} onClick={async () => { const out = await run(() => api.addReleaseLoopReconciliation(runId, rec), 'Reconciliation item added'); if (out) setRec({ description: '', state: 'failed', failureClass: 'unclassified', stateLeft: '' }); }}>Add reconciliation item</button></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Run history</div>
        {d.events.length ? d.events.map((e) => (
          <div key={e.id} style={S.item}><span style={S.meta}>{fmt(e.at)} · {e.actor || 'system'}</span><div>{e.kind.replace('loop_', '')} {e.type}{e.state ? ` → ${e.state}` : ''}{e.note ? ` · ${e.note}` : ''}</div></div>
        )) : <div style={S.empty}>No history yet.</div>}
      </div>
    </div>
  );
}

// ── Runs ────────────────────────────────────────────────────────────────────
function RunsTab() {
  const [runs, setRuns] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ releaseKey: '', featureKey: '', name: '' });
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setRuns((await api.listReleaseLoopRuns()).runs); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function start() {
    setError('');
    try { const out = await api.createReleaseLoopRun(form); toast.success('Run started'); setForm({ releaseKey: form.releaseKey, featureKey: '', name: '' }); await load(); setOpenId(out.run.id); }
    catch (e) { setError(e.message); toast.error(e.message); }
  }
  if (openId) return <RunDetail runId={openId} onBack={() => { setOpenId(null); load(); }} onChanged={load} />;
  return (
    <div>
      <ErrorBox error={error} />
      <div style={S.card}>
        <div style={S.cardTitle}>Start a run</div>
        <div style={S.row}>
          <Field label="Release key"><input aria-label="Release key" style={S.input} placeholder="2030-03-01-garden-gate" value={form.releaseKey} onChange={(e) => setForm({ ...form, releaseKey: e.target.value })} /></Field>
          <Field label="Feature key"><input aria-label="Feature key" style={S.input} placeholder="seed-catalog" value={form.featureKey} onChange={(e) => setForm({ ...form, featureKey: e.target.value })} /></Field>
        </div>
        <div style={S.row}>
          <Field label="Feature name (optional)"><input aria-label="Feature name" style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <button type="button" style={S.btn} onClick={start}>Start run</button>
        </div>
      </div>
      <div style={S.cardTitle}>Runs</div>
      {!runs ? <div>Loading…</div> : runs.length ? runs.map((r) => (
        <div key={r.id} style={S.card} data-testid={`run-${r.featureKey}`}>
          <div><b>{r.featureKey}</b> <span style={S.meta}>{r.releaseKey}</span></div>
          <div style={S.meta}>Stage {r.stage} · <Pill>{r.status}</Pill> · {r.rounds} round{r.rounds === 1 ? '' : 's'} · {r.openBugs} open bug{r.openBugs === 1 ? '' : 's'}{r.escalated ? ` · ${r.escalated} escalated` : ''}</div>
          <div style={{ marginTop: '.5rem' }}><button type="button" style={S.btn2} onClick={() => setOpenId(r.id)}>Open run {r.featureKey}</button></div>
        </div>
      )) : <div style={S.empty}>No runs yet. Start one above.</div>}
    </div>
  );
}

// ── Escalations ─────────────────────────────────────────────────────────────
function EscalationsTab() {
  const [items, setItems] = useState(null);
  const [limit, setLimit] = useState(2);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const out = await api.listReleaseLoopEscalations(); setItems(out.escalations); setLimit(out.maxFixAttemptsPerBug); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div style={S.sub}>What left the automated loop: bugs that used every fix attempt (a person decides) and bugs that need a business definition (the owner answers the exact question). Nothing here is guessed.</div>
      <ErrorBox error={error} />
      {!items ? <div>Loading…</div> : items.length ? items.map((b) => (
        <div key={b.id} style={S.card} data-testid={`esc-${b.bugKey}`}>
          <BugCard bug={b} limit={limit} run={null} onChanged={load} />
          <div style={S.meta}>{b.featureKey} · {b.releaseKey}</div>
        </div>
      )) : <div style={S.empty}>Nothing is waiting for a person or the owner.</div>}
    </div>
  );
}

const TABS = ['Definition', 'Runs', 'Escalations', 'Releases', 'Session plans'];
export default function ReleaseLoopPanel() {
  const [tab, setTab] = useState('Runs');
  return (
    <div style={S.root}>
      <h1 style={S.h1}>Release loop</h1>
      <p style={S.sub}>The platform copy of the release process: the editable definition, runs through build, integrate, validate, triage and fix, live validation steps, bugs, reconciliation items and escalations. Nothing counts as done while a gate is open.</p>
      <div role="tablist" style={S.tabs}>
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Definition' && <DefinitionTab />}
      {tab === 'Runs' && <RunsTab />}
      {tab === 'Escalations' && <EscalationsTab />}
      {tab === 'Releases' && <ReleasesTab />}
      {tab === 'Session plans' && <SessionPlansTab />}
    </div>
  );
}
