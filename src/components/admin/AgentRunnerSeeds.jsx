// Agent runner -> Backlog seeds: seed -> shaped -> ready -> promoted, with the full history of questions and answers.
// A seed is promoted to a feature only when a person says so (useToolCategoryGate().run, matching the server's
// assertReadyToFinalize); promoting builds nothing.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { S, Pill, ErrorBox, Field, fmt } from './agentRunnerUi.jsx';

const STAGES = ['all', 'seed', 'shaped', 'ready', 'promoted'];

function SeedCard({ seed, onChanged, goto }) {
  const [answers, setAnswers] = useState({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [gaps, setGaps] = useState([]);
  const gate = useToolCategoryGate();
  const d = seed.data;
  async function run(fn, ok) {
    setError(''); setGaps([]);
    try { await fn(); toast.success(ok); await onChanged(); } catch (e) { setError(e.message); setGaps(e.body?.gaps || []); toast.error(e.message); }
  }
  async function ask() {
    setError('');
    try { const r = await api.startAgentRunnerRun({ agentKey: 'release_backlog_gardener', prompt: `Grow seed ${seed.id}`, params: { seedId: seed.id } }); toast.success(`Run #${r.id} queued`); goto('Runs', { run: r.id }); }
    catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.card} data-testid={`seed-${seed.id}`}>
      {gate.modal}
      <div><b>#{seed.id}</b> {seed.title} <Pill>{seed.stage}</Pill></div>
      <div style={S.meta}>Your words: {d.words}</div>
      {d.problem && <div data-testid="seed-problem"><b>Problem:</b> {d.problem}</div>}
      {d.openQuestions.length > 0 && (
        <div>
          <div style={S.cardTitle}>Open questions for you</div>
          {d.openQuestions.map((q, i) => (
            <div key={i} style={S.item}>
              <div>Question {i + 1}: {q.q}</div>
              {q.answer ? <div style={S.note}>Answer: {q.answer} <span style={S.meta}>({q.answeredBy})</span></div> : seed.stage !== 'promoted' && (
                <div style={S.row}>
                  <Field label={`Answer to question ${i + 1} of seed ${seed.id}`}><input aria-label={`Answer to question ${i + 1} of seed ${seed.id}`} style={S.input} value={answers[i] || ''} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} /></Field>
                  <button type="button" style={S.btn} onClick={() => run(async () => { await api.answerAgentRunnerSeed(seed.id, i, answers[i] || ''); setAnswers({ ...answers, [i]: '' }); }, 'Answer saved')}>{`Save answer ${i + 1} of seed ${seed.id}`}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {d.acceptanceCriteria.length > 0 && <div><b>Acceptance criteria:</b><ul style={{ margin: '.2rem 0 .2rem 1.2rem', padding: 0 }}>{d.acceptanceCriteria.map((a) => <li key={a}>{a}</li>)}</ul></div>}
      {d.size && <div><b>Size:</b> {d.size}</div>}
      {d.draftChangeSpec && <details><summary style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>Draft change spec and journeys</summary><pre style={S.pre}>{d.draftChangeSpec}</pre>{d.draftJourneys.map((j) => <div key={j} style={S.meta}>Draft journey: {j}</div>)}</details>}
      {seed.stage !== 'promoted' && (
        <div>
          <div style={S.row}>
            <Field label={`Note for seed ${seed.id}`}><input aria-label={`Note for seed ${seed.id}`} style={S.input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
          <div style={S.row}>
            {['seed', 'shaped'].includes(seed.stage) && <button type="button" style={S.btn2} onClick={ask}>{`Ask the Backlog gardener to grow seed ${seed.id}`}</button>}
            {seed.stage === 'seed' && <button type="button" style={S.btn2} onClick={() => run(() => api.moveAgentRunnerSeed(seed.id, 'shaped', note), 'Moved to shaped')}>{`Move seed ${seed.id} to shaped`}</button>}
            {seed.stage === 'shaped' && <button type="button" style={S.btn2} onClick={() => run(() => api.moveAgentRunnerSeed(seed.id, 'ready', note), 'Marked ready')}>{`Mark seed ${seed.id} ready`}</button>}
            {seed.stage === 'ready' && <button type="button" style={S.btn} onClick={() => run(() => gate.run(() => api.moveAgentRunnerSeed(seed.id, 'promoted', note)), 'Promoted to a feature')}>{`Promote seed ${seed.id} to a feature`}</button>}
            {seed.stage === 'ready' && <button type="button" style={S.btn2} onClick={() => run(() => api.moveAgentRunnerSeed(seed.id, 'shaped', note), 'Sent back to shaped')}>{`Send seed ${seed.id} back to shaped`}</button>}
          </div>
          <ErrorBox error={error} gaps={gaps} />
        </div>
      )}
      {seed.stage === 'promoted' && <div style={S.note}>Promoted: it is a feature in the backlog now. Nothing was built by promoting it.</div>}
      <details>
        <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>History of seed {seed.id} ({seed.history.length})</summary>
        {seed.history.map((h, i) => <div key={i} style={S.meta} data-testid="seed-history">{fmt(h.at)} · {h.by} · {h.event}{h.from ? ` ${h.from} -> ${h.to}` : ''}{h.note ? ` · ${h.note}` : ''}</div>)}
      </details>
    </div>
  );
}

export default function SeedsTab({ goto }) {
  const [seeds, setSeeds] = useState(null);
  const [stage, setStage] = useState('all');
  const [title, setTitle] = useState('');
  const [words, setWords] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setSeeds((await api.agentRunnerSeeds()).seeds); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);
  async function add() {
    setError('');
    try { await api.createAgentRunnerSeed({ title, words }); setTitle(''); setWords(''); toast.success('Seed added'); await load(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  const shown = (seeds || []).filter((s) => stage === 'all' || s.stage === stage);
  return (
    <div>
      <div style={S.sub}>A backlog seed is an idea before it is a feature: seed, shaped, ready, promoted. It keeps its full history of questions and answers. Nothing is built until you promote it and start it as a feature.</div>
      <div style={S.card}>
        <div style={S.cardTitle}>New seed</div>
        <div style={S.row}>
          <Field label="Seed title"><input aria-label="Seed title" style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        </div>
        <div style={S.row}>
          <Field label="Your idea in your own words"><textarea aria-label="Your idea in your own words" rows={3} style={S.input} value={words} onChange={(e) => setWords(e.target.value)} /></Field>
        </div>
        <div style={S.row}><button type="button" style={S.btn} onClick={add}>Add seed</button></div>
        <ErrorBox error={error} />
      </div>
      <div role="group" aria-label="Seed stage" style={{ ...S.tabs, borderBottom: 0 }}>
        {STAGES.map((s) => <button key={s} type="button" aria-pressed={stage === s} style={S.tab(stage === s)} onClick={() => setStage(s)}>{s === 'all' ? 'All seeds' : `Stage ${s}`}</button>)}
      </div>
      {!seeds ? <div>Loading…</div> : shown.length ? shown.map((s) => <SeedCard key={s.id} seed={s} onChanged={load} goto={goto} />) : <div style={S.empty}>No seeds here yet.</div>}
    </div>
  );
}
