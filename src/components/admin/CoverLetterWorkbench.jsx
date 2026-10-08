// Cover-letter workbench (2026-10-02): the output-package editor surface for ONE cover letter,
// with the cover-letter agent as a side chat. It is opened from the Resume Output History row
// ("Edit with cover-letter agent") in MyResumePanel.
//
// What the agent may touch is stated on screen and enforced on the server
// (server/lib/coverLetterAgent.js): this letter only; its search covers only this package.
// Each reply shows the evidence it searched, whether a language model was used, and the edit as
// tracked changes you accept or reject. Accepting files a NEW draft version — an approved
// version is never edited in place. Approve/publish run through the tool-category gate.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import CoverLetterSettings from './CoverLetterSettings.jsx';

const INK = '#1b2a3b';
const GOLD = '#c4843a';

const chip = (bg, fg) => ({ display: 'inline-block', fontSize: '0.66rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 10, background: bg, color: fg });
const btn = (tone) => ({ padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', border: tone === 'gold' || tone === 'navy' ? 'none' : '1px solid rgba(27,42,59,0.25)', background: tone === 'gold' ? GOLD : tone === 'navy' ? INK : '#fff', color: tone === 'gold' || tone === 'navy' ? '#fff' : INK });

function Segments({ segments }) {
  return segments.map((s, i) => {
    if (s.t === 'ins') return <ins key={i} style={{ background: '#d7f0dc', textDecoration: 'none', borderBottom: '2px solid #2f8f4e' }}>{s.text}</ins>;
    if (s.t === 'del') return <del key={i} style={{ background: '#f8d9d4', color: '#8c2a1c' }}>{s.text}</del>;
    return <span key={i}>{s.text}</span>;
  });
}

const STATUS_LABEL = { proposed: 'Awaiting your decision', accepted: 'Accepted', rejected: 'Rejected', none: 'No change', superseded: 'Superseded — the letter has a newer version' };

function LlmLine({ llm, route }) {
  if (!llm?.called) {
    const why = route === 'blocked' ? 'not used — not available (see message)' : route === 'refused' ? 'not used — request refused' : 'not used';
    return <div data-testid="llm-line" style={{ fontSize: '0.72rem', color: '#4b5563' }}><strong>LLM:</strong> {why}</div>;
  }
  return (
    <div data-testid="llm-line" style={{ fontSize: '0.72rem', color: '#4b5563' }}>
      <strong>LLM:</strong> used · model {llm.model} · {llm.inputTokens ?? '?'} tokens in / {llm.outputTokens ?? '?'} out{llm.tokensEstimated ? ' (estimated)' : ''} · {llm.latencyMs ?? '?'} ms · {llm.attempts} attempt{llm.attempts === 1 ? '' : 's'}
    </div>
  );
}

function TurnCard({ turn, onDecide, busy }) {
  const routeLabel = { rules: 'Answered by rules', search_only: 'Answered from package search', refused: 'Refused', blocked: 'Could not run', failed: 'Failed', llm: 'Answered with the language model' }[turn.route] || turn.route;
  const bad = turn.route === 'refused' || turn.route === 'blocked' || turn.route === 'failed';
  return (
    <div style={{ background: bad ? '#fdf3ef' : '#f6f3ec', border: `1px solid ${bad ? '#e8b9a8' : 'rgba(0,0,0,0.08)'}`, borderRadius: 8, padding: '0.6rem 0.7rem', marginTop: '0.4rem' }} data-testid="agent-reply">
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
        <span style={chip(bad ? '#f0c9bb' : '#e3d3be', INK)}>{routeLabel}</span>
        <span style={chip('#e5e7eb', INK)} data-testid="turn-status">{STATUS_LABEL[turn.status] || turn.status}</span>
      </div>
      <div role={bad ? 'alert' : undefined} style={{ fontSize: '0.84rem', lineHeight: 1.5, color: INK }}>{turn.message}</div>
      <LlmLine llm={turn.llm} route={turn.route} />
      <details style={{ marginTop: '0.3rem' }} open={turn.hits.length > 0 && turn.status === 'proposed'}>
        <summary style={{ fontSize: '0.74rem', cursor: 'pointer' }}>Evidence used — package search ({turn.hits.length} match{turn.hits.length === 1 ? '' : 'es'})</summary>
        {turn.hits.length === 0 && <div style={{ fontSize: '0.74rem', color: '#6b7280', padding: '0.3rem 0' }}>Nothing in this package matched the request.</div>}
        <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem', fontSize: '0.74rem', lineHeight: 1.45 }}>
          {turn.hits.map((h, i) => <li key={i}><strong>{h.source}</strong> ¶{h.paragraph}: {h.text}</li>)}
        </ul>
      </details>
      {turn.status === 'proposed' && turn.diff && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.74rem', marginBottom: '0.3rem' }}>{turn.diff.summary.join(' · ')}. Changes are shown in the letter on the left.</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" style={btn('navy')} disabled={busy} onClick={() => onDecide(turn, 'accept')}>Accept changes</button>
            <button type="button" style={btn()} disabled={busy} onClick={() => onDecide(turn, 'reject')}>Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoverLetterWorkbench({ outputId, onClose, onChanged }) {
  const [letter, setLetter] = useState(null);
  const [turns, setTurns] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('letter');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [sendError, setSendError] = useState(null);
  const gate = useToolCategoryGate();
  const sessionKey = useRef(`cl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const chatEnd = useRef(null);
  const [currentId, setCurrentId] = useState(outputId);

  const refresh = useCallback(async (id) => {
    try {
      const l = await api.openCoverLetter(id);
      setLetter(l); setCurrentId(l.id); setLoadError(null);
      const t = await api.listCoverLetterTurns(l.id);
      setTurns(t.turns);
      setMetrics(await api.getCoverLetterMetrics(sessionKey.current));
      return l;
    } catch (e) {
      setLoadError(e.message);
      return null;
    }
  }, []);

  useEffect(() => { refresh(outputId); }, [outputId, refresh]);
  useEffect(() => { chatEnd.current?.scrollIntoView?.({ block: 'nearest' }); }, [turns.length]);

  const pending = useMemo(() => [...turns].reverse().find((t) => t.status === 'proposed' && t.diff) || null, [turns]);

  async function send(text) {
    const value = (text ?? input).trim();
    if (!value) return;
    setSending(true); setSendError(null);
    try {
      await api.sendCoverLetterRequest(currentId, value, sessionKey.current);
      setInput('');
      await refresh(currentId);
    } catch (e) {
      setSendError(e.message); toast.error(e.message);
    } finally { setSending(false); }
  }

  async function decide(turn, decision) {
    setDeciding(true);
    try {
      const r = await api.decideCoverLetterTurn(turn.id, decision);
      if (decision === 'accept') {
        toast.success(`Accepted — saved as a new draft version (#${r.newVersionId}). The earlier version is unchanged.`);
        await refresh(r.newVersionId);
        onChanged?.();
      } else {
        toast.success('Rejected — the letter is unchanged.');
        await refresh(currentId);
      }
    } catch (e) {
      toast.error(e.message);
      await refresh(currentId);
    } finally { setDeciding(false); }
  }

  async function setStatus(status) {
    try {
      await gate.run(() => api.updateResumeOutputStatus(currentId, status));
      toast.success(status === 'approved' ? 'Approved.' : status === 'published' ? 'Published.' : 'Updated.');
      await refresh(currentId);
      onChanged?.();
    } catch (e) { toast.error(e.message); }
  }

  const diffRows = pending?.diff?.rows || null;
  // Example requests that point at real paragraph numbers of this letter.
  const examples = useMemo(() => {
    const bodies = (letter?.blocks || []).filter((b) => b.role === 'body' || (!b.role && b.type === 'paragraph'));
    const longest = [...bodies].sort((a, b) => b.text.length - a.text.length)[0];
    return [longest ? `Shorten paragraph ${longest.n}` : 'Shorten the letter', 'Make it more formal', 'Replace "hiring team" with "talent team"', 'Mention renewal forecasting', 'Where do I mention pricing?'];
  }, [letter]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Cover letter and agent" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
      <div style={{ background: '#fff', width: 'min(1180px, 100%)', margin: 0, display: 'flex', flexDirection: 'column', color: INK, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.7rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{letter?.name || 'Cover letter'}</div>
            {letter && <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Version #{letter.id} · <span style={{ textTransform: 'capitalize' }} data-testid="letter-status">{letter.status}</span></div>}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" style={btn(tab === 'letter' ? 'navy' : undefined)} onClick={() => setTab('letter')}>Letter and agent</button>
            <button type="button" style={btn(tab === 'settings' ? 'navy' : undefined)} onClick={() => setTab('settings')}>Settings</button>
            {letter && <a href={api.downloadResumeOutputUrl(letter.id)} style={{ ...btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Download PDF</a>}
            {letter?.status === 'draft' && <button type="button" style={btn()} onClick={() => setStatus('approved')}>Approve</button>}
            {letter?.status === 'approved' && <button type="button" style={btn('gold')} onClick={() => setStatus('published')}>Publish</button>}
            <button type="button" style={btn()} onClick={onClose}>Close</button>
          </div>
        </div>

        {loadError && <div role="alert" style={{ padding: '1rem', color: '#a5531f' }}>Could not open this cover letter: {loadError}</div>}

        {tab === 'settings' && <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, background: '#faf8f4' }}><CoverLetterSettings onSaved={() => refresh(currentId)} /></div>}

        {tab === 'letter' && letter && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, flexWrap: 'wrap', overflowY: 'auto' }}>
            {/* Letter */}
            <div style={{ flex: '1 1 480px', minWidth: 0, padding: '1rem', overflowY: 'auto', background: '#fffdf8', borderRight: '1px solid rgba(0,0,0,0.08)', maxHeight: '100%' }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                Paragraph numbers (¶) are what you refer to in chat. {diffRows ? <strong style={{ color: INK }}>Tracked changes shown — accept or reject them in the chat.</strong> : 'An approved version is never edited: accepted changes become a new draft version.'}
              </div>
              {letter.header?.name && <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{letter.header.name}{letter.header.contact ? <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.78rem' }}> · {letter.header.contact}</span> : null}</div>}
              <div style={{ marginTop: '0.6rem' }} data-testid="letter-body">
                {(diffRows || letter.blocks.map((b) => ({ status: 'same', n: b.n, segments: [{ t: 'same', text: b.text }] }))).map((row, i) => {
                  const bg = row.status === 'deleted' ? '#fdf0ed' : row.status === 'inserted' ? '#eefaf0' : row.status === 'changed' || row.status === 'moved' ? '#fffbe6' : 'transparent';
                  return (
                    <div key={i} data-status={row.status} style={{ display: 'flex', gap: '0.5rem', padding: '0.35rem 0.4rem', background: bg, borderLeft: row.status === 'same' ? '3px solid transparent' : `3px solid ${row.status === 'deleted' ? '#c0392b' : row.status === 'inserted' ? '#2f8f4e' : GOLD}`, borderRadius: 3 }}>
                      <span style={{ flex: '0 0 2.2rem', fontSize: '0.68rem', color: '#8b877c', paddingTop: '0.15rem' }}>{row.n ? `¶${row.n}` : 'new'}</span>
                      <span style={{ flex: 1, fontSize: '0.88rem', lineHeight: 1.55 }}>
                        <Segments segments={row.segments} />
                        {row.status === 'moved' && <em style={{ color: '#8b877c', fontSize: '0.7rem' }}> (moved)</em>}
                        {row.status !== 'same' && <span style={{ ...chip('#e5e7eb', INK), marginLeft: 6 }}>{row.status}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#6b7280' }}>
                <strong>Versions:</strong>{' '}
                {letter.versions.map((v, i) => <span key={v.id} style={{ marginRight: 8 }}>v{i + 1} #{v.id} ({v.status}{v.shared ? ', QR' : ''}){v.id === letter.id ? ' ← current' : ''}</span>)}
              </div>
            </div>

            {/* Chat */}
            <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff', maxHeight: '100%' }}>
              <div style={{ padding: '0.7rem 1rem 0.3rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cover-letter agent</div>
                <div style={{ fontSize: '0.72rem', color: '#4b5563', lineHeight: 1.5, marginTop: '0.2rem' }} data-testid="agent-scope">
                  I can read and change <strong>this cover letter only</strong>. I search only this package ({1 + letter.package.members.length} output{letter.package.members.length ? 's' : ''}{letter.package.hasJobRec ? ' + job rec text' : ', no job rec text attached'}) — never Career Master, other members or the web. I try the search and rules first and only call a language model ({letter.llm.provider === 'stub' ? 'offline test stub' : letter.llm.model}) if they can’t do it.
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 1rem 0.6rem', minHeight: 160 }} aria-live="polite">
                {turns.length === 0 && <div style={{ fontSize: '0.8rem', color: '#6b7280', padding: '0.5rem 0' }}>No messages yet. Try one of the examples below.</div>}
                {turns.map((t) => (
                  <div key={t.id} style={{ marginTop: '0.7rem' }}>
                    <div style={{ background: INK, color: '#fff', borderRadius: 8, padding: '0.4rem 0.65rem', fontSize: '0.84rem', alignSelf: 'flex-end' }}>{t.request}</div>
                    <TurnCard turn={t} onDecide={decide} busy={deciding} />
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
              {sendError && <div role="alert" style={{ color: '#a5531f', fontSize: '0.78rem', padding: '0 1rem' }}>{sendError}</div>}
              <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {examples.map((ex) => <button key={ex} type="button" style={{ ...btn(), fontSize: '0.68rem', padding: '0.2rem 0.5rem' }} onClick={() => setInput(ex)}>{ex}</button>)}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: '0.4rem', padding: '0 1rem 0.6rem' }}>
                <textarea aria-label="Message to the cover-letter agent" rows={2} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask for a change to this letter…" style={{ flex: 1, padding: '0.45rem 0.55rem', border: '1px solid rgba(27,42,59,0.25)', borderRadius: 6, fontSize: '0.84rem', fontFamily: 'inherit', resize: 'vertical' }} />
                <button type="submit" style={btn('navy')} disabled={sending || !input.trim()}>{sending ? 'Working…' : 'Send'}</button>
              </form>
              {metrics && (
                <div style={{ padding: '0 1rem 0.7rem', fontSize: '0.68rem', color: '#6b7280' }} data-testid="session-metrics">
                  This session: {metrics.turns} message{metrics.turns === 1 ? '' : 's'} · {metrics.llmTurns} used a language model · {metrics.inputTokens} tokens in / {metrics.outputTokens} out · {metrics.accepted} accepted, {metrics.rejected} rejected
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {gate.modal}
    </div>
  );
}
