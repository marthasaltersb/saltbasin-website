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
  const scrollRef = useRef(null);

  // Load threads + current thread messages on open
  useEffect(() => {
    if (!open) return;
    api
      .listAgentThreads()
      .then((r) => setThreads(r.threads || []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!threadId) { setMessages([]); return; }
    api
      .getAgentMessages(threadId)
      .then((r) => setMessages(r.messages || []))
      .catch(() => {});
  }, [threadId]);

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
      const r = await api.chatWithAgent(threadId, m);
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

  if (!open) return null;

  return (
    <aside
      style={{
        width: 380,
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
            Scrum Agent
          </div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginTop: 1 }}>
            Phase A · scaffold
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={startNewThread} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }} title="Start a new thread">+ New</button>
          <button onClick={onClose} className="sb-btn sb-btn-outline" style={{ fontSize: '0.62rem', padding: '0.3rem 0.65rem' }} title="Close panel">✕</button>
        </div>
      </div>

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
              <strong style={{ color: 'var(--sb-gold)' }}>Phase A scaffold.</strong> I can help you think through requirements, draft user stories, and plan sprints. I can't yet apply changes to the backlog — tool wiring lands in Session 3.
            </p>
            <p style={{ fontSize: '0.74rem', fontStyle: 'italic' }}>
              Try: "Help me write acceptance criteria for the JIRA bidirectional sync requirement." Or: "What requirements should I prioritize for next sprint?"
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
            Scrum Agent
          </div>
        )}
        {content}
      </div>
    </div>
  );
}
