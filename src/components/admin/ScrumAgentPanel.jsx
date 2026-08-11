// Scrum Agent chat panel — Phase A.
//
// Docks on the right side of the Backlog tab. Collapsible. Persists thread
// id in localStorage so reopening reloads the conversation. Phase A is
// echo + Claude-only — no backlog tools yet (those land Session 3).

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '../../lib/api.js';

const LS_THREAD_KEY = 'sb_scrum_thread_id';

export default function ScrumAgentPanel({ open, onClose }) {
  const [threads, setThreads] = useState([]);
  const [threadId, setThreadId] = useState(() => {
    const v = localStorage.getItem(LS_THREAD_KEY);
    return v ? Number(v) : null;
  });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const [provider, setProvider] = useState('anthropic');
  const [profiles, setProfiles] = useState([]);
  const [contextProfileId, setContextProfileId] = useState(null);
  const [backlogItems, setBacklogItems] = useState([]);
  const [backlogItemId, setBacklogItemId] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [showRegistry, setShowRegistry] = useState(false);
  const [codeRuns, setCodeRuns] = useState([]);
  const [runObjective, setRunObjective] = useState('');
  const [runBusy, setRunBusy] = useState(false);
  const [reconciliationRuns, setReconciliationRuns] = useState([]);
  const scrollRef = useRef(null);

  // Load threads + current thread messages on open
  useEffect(() => {
    if (!open) return;
    Promise.all([api.listAgentThreads(), api.listAgentContextProfiles(), api.getBacklog(), api.listAgentKnowledge(), api.listBacklogReconciliationRuns()])
      .then(([threadResult, profileResult, backlogResult, knowledgeResult, reconciliationResult]) => {
        setThreads(threadResult.threads || []);
        setProfiles(profileResult.profiles || []);
        setContextProfileId((current) => current || profileResult.profiles?.find((p) => p.isDefault)?.id || null);
        const groupNames = Object.fromEntries((backlogResult.groups || []).map((group) => [group.id, group.name]));
        setBacklogItems((backlogResult.items || []).map((item) => ({ ...item, capabilityName: groupNames[item.capabilityId] || 'Unassigned' })));
        setKnowledge(knowledgeResult.records || []);
        setReconciliationRuns(reconciliationResult.runs || []);
      }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!threadId) { setMessages([]); return; }
    Promise.all([api.getAgentMessages(threadId), api.listAgentCodeRuns(threadId)])
      .then(([messageResult, runResult]) => { setMessages(messageResult.messages || []); setCodeRuns(runResult.runs || []); })
      .catch(() => {});
  }, [threadId]);

  useEffect(() => {
    if (!open || !threadId || !codeRuns.some((run) => ['approved', 'queued', 'running'].includes(run.status))) return undefined;
    const timer = setInterval(() => api.listAgentCodeRuns(threadId).then((result) => setCodeRuns(result.runs || [])).catch(() => {}), 2500);
    return () => clearInterval(timer);
  }, [open, threadId, codeRuns]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  async function send() {
    const m = draft.trim();
    if (!m || sending) return;
    setSending(true); setErr(null);
    // Optimistic add of user msg
    const userMsg = { id: `temp-${Date.now()}`, role: 'user', content: m, createdAt: Date.now() };
    setMessages((arr) => [...arr, userMsg]);
    setDraft('');
    try {
      const r = await api.chatWithAgent(threadId, m, { provider, contextProfileId, backlogItemId });
      if (r.threadId && r.threadId !== threadId) {
        setThreadId(r.threadId);
        localStorage.setItem(LS_THREAD_KEY, String(r.threadId));
        // refresh threads list
        api.listAgentThreads().then((x) => setThreads(x.threads || [])).catch(() => {});
      }
      setMessages((arr) => [
        ...arr.filter((x) => x.id !== userMsg.id),
        { ...userMsg, id: `user-${Date.now()}` },
        { id: `assist-${Date.now()}`, role: 'assistant', content: r.assistant, createdAt: Date.now() },
      ]);
    } catch (e) {
      setErr(e.message);
      // Roll back the optimistic user msg
      setMessages((arr) => arr.filter((x) => x.id !== userMsg.id));
      setDraft(m);
    } finally {
      setSending(false);
    }
  }

  function startNewThread() {
    setThreadId(null);
    setMessages([]);
    localStorage.removeItem(LS_THREAD_KEY);
  }

  function pickThread(id) {
    setThreadId(id);
    localStorage.setItem(LS_THREAD_KEY, String(id));
  }

  async function proposeRun() {
    if (!threadId || !runObjective.trim() || runBusy) return;
    setRunBusy(true); setErr(null);
    try {
      const result = await api.proposeAgentCodeRun({ threadId, objective: runObjective.trim() });
      setCodeRuns((runs) => [result.run, ...runs]);
      setRunObjective('');
    } catch (error) { setErr(error.message); } finally { setRunBusy(false); }
  }

  async function decideRun(id, approve) {
    setRunBusy(true); setErr(null);
    try {
      if (approve) await api.approveAgentCodeRun(id); else await api.rejectAgentCodeRun(id, 'Rejected from Code Context Studio');
      const result = await api.listAgentCodeRuns(threadId);
      setCodeRuns(result.runs || []);
    } catch (error) { setErr(error.message); } finally { setRunBusy(false); }
  }

  async function reconcileHistory(selectedProvider) {
    setRunBusy(true); setErr(null);
    try {
      await api.startBacklogReconciliation(selectedProvider);
      const result = await api.listBacklogReconciliationRuns();
      setReconciliationRuns(result.runs || []);
    } catch (error) { setErr(error.message); } finally { setRunBusy(false); }
  }

  if (!open) return null;

  return (
    <aside
      style={{
        width: 460,
        flexShrink: 0,
        background: 'var(--sb-navy-deep)',
        borderLeft: '0.5px solid rgba(196,132,58,0.3)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '0.5px solid rgba(196,132,58,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--sb-navy)',
        }}
      >
        <div>
          <div className="sb-display" style={{ fontSize: '0.95rem', color: 'var(--sb-cream)', letterSpacing: '0.1em' }}>
            Code Context Studio
          </div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginTop: 1 }}>
            Codex + Claude · governed sessions
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={startNewThread} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }} title="Start a new thread">+ New</button>
          <button onClick={onClose} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }} title="Close panel">✕</button>
        </div>
      </div>

      {!threadId && (
        <div style={{ padding: '0.65rem 0.75rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)', display: 'grid', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <select className="sb-input" value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Code agent provider">
              <option value="anthropic">Claude · Anthropic</option>
              <option value="openai">Codex · OpenAI</option>
            </select>
            <select className="sb-input" value={contextProfileId || ''} onChange={(e) => setContextProfileId(e.target.value ? Number(e.target.value) : null)} aria-label="Context profile">
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
            </select>
          </div>
          <select className="sb-input" value={backlogItemId || ''} onChange={(e) => setBacklogItemId(e.target.value ? Number(e.target.value) : null)} aria-label="Backlog work item">
            <option value="">No backlog item linked</option>
            {backlogItems.map((item) => <option key={item.id} value={item.id}>{item.capabilityName} · {item.title}</option>)}
          </select>
          <div style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>Context is snapshotted when the first message starts the session. Durable rules, decisions, lessons, and build-stage evidence are extracted after each turn. Repository writes still require an approved execution runner.</div>
        </div>
      )}

      <button onClick={() => setShowRegistry((value) => !value)} style={{ border: 0, borderBottom: '0.5px solid rgba(196,132,58,0.12)', background: 'rgba(0,0,0,0.14)', color: 'var(--sb-gold)', padding: '0.45rem 0.75rem', textAlign: 'left', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {showRegistry ? 'Hide' : 'Show'} business knowledge registry · {knowledge.length}
      </button>
      {showRegistry && <KnowledgeRegistry records={knowledge} />}
      <HistoryReconciliation runs={reconciliationRuns} onStart={reconcileHistory} busy={runBusy} />

      {/* Thread list (compact) */}
      {threads.length > 0 && (
        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '0.5px solid rgba(196,132,58,0.12)', maxHeight: 100, overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: 4 }}>
            Recent threads
          </div>
          {threads.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => pickThread(t.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: t.id === threadId ? 'rgba(196,132,58,0.18)' : 'transparent',
                border: 'none', padding: '0.3rem 0.5rem',
                fontSize: '0.72rem', color: t.id === threadId ? 'var(--sb-cream)' : 'var(--sb-sage)',
                cursor: 'pointer', borderRadius: 'var(--sb-radius)',
                fontFamily: 'var(--sb-font-body)',
              }}
            >
              {t.title || `Thread #${t.id}`}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--sb-gold)' }}>Governed code session.</strong> Choose Codex or Claude, a reusable context profile, and optionally a backlog item. Every turn is retained and parsed into reviewable business rules, decisions, lessons, implementation notes, and build-stage evidence.
            </p>
            <p style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
              Try: "Design and implement this backlog item using the current EIDOS capability and business-rule context."
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))
        )}
        {sending && <Bubble role="assistant" content="…" thinking />}
      </div>

      {/* Error band */}
      {err && (
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(196,75,75,0.15)', color: 'var(--sb-risk-critical)', fontSize: '0.7rem', borderTop: '0.5px solid rgba(196,75,75,0.3)' }}>
          ✗ {err}
        </div>
      )}

      {threadId && <CodeRunPanel runs={codeRuns} objective={runObjective} setObjective={setRunObjective} onPropose={proposeRun} onDecision={decideRun} busy={runBusy} />}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{ padding: '0.75rem 0.85rem', borderTop: '0.5px solid rgba(196,132,58,0.2)', background: 'var(--sb-navy)' }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
          }}
          placeholder="Ask about a requirement, draft a story, plan a sprint…  (⌘+Enter)"
          className="sb-input sb-textarea"
          style={{ fontSize: '0.82rem', minHeight: 70 }}
          disabled={sending}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--sb-dusty)' }}>
            ⌘+Enter to send
          </span>
          <button type="submit" disabled={sending || !draft.trim()} className="sb-btn sb-btn-gold" style={{ fontSize: '0.7rem', padding: '0.4rem 0.95rem' }}>
            {sending ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  );
}

function KnowledgeRegistry({ records }) {
  return (
    <div style={{ maxHeight: 210, overflowY: 'auto', padding: '0.5rem 0.7rem', borderBottom: '0.5px solid rgba(196,132,58,0.16)', background: 'rgba(0,0,0,0.22)' }}>
      {records.length === 0 ? <div style={{ color: 'var(--sb-dusty)', fontSize: '0.7rem' }}>No extracted records yet.</div> : records.slice(0, 40).map((record) => (
        <div key={record.id} style={{ marginBottom: 6, padding: '0.45rem 0.55rem', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: 'var(--sb-radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: '0.55rem', color: 'var(--sb-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>{record.recordType?.replaceAll('_', ' ')}</span><span>{record.templateCandidate ? 'Template candidate' : record.status}</span>
          </div>
          <div style={{ color: 'var(--sb-cream)', fontSize: '0.7rem', marginTop: 3 }}>{record.title}</div>
          <div style={{ color: 'var(--sb-sage)', fontSize: '0.65rem', lineHeight: 1.35, marginTop: 2 }}>{record.statement}</div>
          {(record.backlogTitle || record.domainKeys?.length) && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.56rem', marginTop: 3 }}>{record.backlogTitle || record.domainKeys.join(' · ')}</div>}
        </div>
      ))}
    </div>
  );
}

function CodeRunPanel({ runs, objective, setObjective, onPropose, onDecision, busy }) {
  const latest = runs[0];
  return (
    <div style={{ padding: '0.65rem 0.75rem', borderTop: '0.5px solid rgba(196,132,58,0.2)', background: 'rgba(0,0,0,0.18)' }}>
      <div style={{ fontSize: '0.58rem', color: 'var(--sb-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Approved repository execution</div>
      {latest && (
        <div style={{ padding: '0.45rem 0.55rem', marginBottom: 6, border: '0.5px solid rgba(245,240,232,0.12)', borderRadius: 'var(--sb-radius)', fontSize: '0.65rem', color: 'var(--sb-sage)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--sb-cream)' }}><span>Run #{latest.id}</span><span>{latest.status}</span></div>
          <div style={{ marginTop: 3 }}>{latest.objective}</div>
          {latest.changedFiles?.length > 0 && <div style={{ marginTop: 3, color: 'var(--sb-dusty)' }}>{latest.changedFiles.length} new changed file(s) recorded</div>}
          {latest.verification?.map((check, index) => <div key={index} style={{ marginTop: 2, color: check.status === 'passed' ? 'var(--sb-sage)' : 'var(--sb-risk-critical)' }}>{check.command}: {check.status}</div>)}
          {latest.status === 'proposed' && <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
            <button disabled={busy} onClick={() => onDecision(latest.id, true)} className="sb-btn sb-btn-gold" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }}>Approve run</button>
            <button disabled={busy} onClick={() => onDecision(latest.id, false)} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }}>Reject</button>
          </div>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 5 }}>
        <input className="sb-input" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Bounded implementation objective" disabled={busy} style={{ fontSize: '0.7rem' }} />
        <button onClick={onPropose} disabled={busy || !objective.trim()} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}>Propose</button>
      </div>
      <div style={{ fontSize: '0.55rem', color: 'var(--sb-dusty)', marginTop: 4 }}>Approval permits workspace edits only. Commit, push, deploy, dependency installation, secrets, and network access remain prohibited.</div>
    </div>
  );
}

function HistoryReconciliation({ runs, onStart, busy }) {
  const latest = runs[0];
  return <div style={{ padding: '0.5rem 0.75rem', borderBottom: '0.5px solid rgba(196,132,58,0.14)', background: 'rgba(0,0,0,0.12)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <div><div style={{ fontSize: '0.58rem', color: 'var(--sb-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Historical backlog reconstruction</div><div style={{ fontSize: '0.55rem', color: 'var(--sb-dusty)', marginTop: 2 }}>{latest ? `Latest: ${latest.status} · ${latest.stats?.sessions || 0} sessions` : 'Upsert all Codex + Claude chat requirements and contribution attribution.'}</div></div>
      <div style={{ display: 'flex', gap: 4 }}><button disabled={busy} onClick={() => onStart('openai')} className="sb-btn sb-btn-outline" style={{ fontSize: '0.56rem', padding: '0.25rem 0.45rem' }}>Run with Codex</button><button disabled={busy} onClick={() => onStart('anthropic')} className="sb-btn sb-btn-outline" style={{ fontSize: '0.56rem', padding: '0.25rem 0.45rem' }}>Run with Claude</button></div>
    </div>
  </div>;
}

function Bubble({ role, content, thinking }) {
  const isUser = role === 'user';
  return (
    <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '0.6rem 0.85rem',
          borderRadius: 'var(--sb-radius)',
          background: isUser ? 'rgba(196,132,58,0.15)' : 'rgba(245,240,232,0.06)',
          border: isUser ? '0.5px solid rgba(196,132,58,0.35)' : '0.5px solid rgba(245,240,232,0.12)',
          fontSize: '0.82rem', lineHeight: 1.55,
          color: isUser ? 'var(--sb-cream)' : 'var(--sb-sage)',
          whiteSpace: 'pre-wrap',
          fontStyle: thinking ? 'italic' : 'normal',
          opacity: thinking ? 0.6 : 1,
        }}
      >
        {!isUser && !thinking && (
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
            Code Agent
          </div>
        )}
        {content}
      </div>
    </div>
  );
}
