// Three member-only panels: Stats, Audit history, Agent chat.
// Imported and rendered by AdminShell when the member selects those tabs.

import React from 'react';
import { styles } from './adminStyles.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(Number(ts)).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDay(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const labelStyle = {
  fontFamily: 'var(--sb-font-label)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--sb-dusty)',
};

// ── Stats Panel ───────────────────────────────────────────────────────────────

export function MemberStatsPanel({ isAdmin = false }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const url = isAdmin ? '/api/members/admin/stats' : '/api/members/me/stats';
    fetch(url, { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [isAdmin]);

  const panelTitle = isAdmin ? 'Platform Stats' : 'Profile Stats';

  return (
    <div style={{ ...styles.editorPane, overflowY: 'auto' }}>
      <div style={styles.editorHeader}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
          {panelTitle}
        </div>
      </div>
      <div style={styles.editorBody}>
        {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{error}</div>}
        {!data && !error && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}

        {data && !isAdmin && (
          <>
            {/* Totals */}
            <div style={{ ...styles.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={labelStyle}>Total page views</div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-gold)', marginTop: '0.25rem' }}>{data.totals.views.toLocaleString()}</div>
              </div>
              <div>
                <div style={labelStyle}>Unique visitors</div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-gold)', marginTop: '0.25rem' }}>{data.totals.uniques.toLocaleString()}</div>
              </div>
            </div>

            {/* Top pages */}
            {data.topPages?.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Top Pages</div>
                {data.topPages.map((p) => (
                  <div key={p.page} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', fontFamily: 'monospace' }}>{p.page}</span>
                    <span style={{ ...labelStyle, color: 'var(--sb-gold)' }}>{p.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            )}

            {/* Daily sparkline */}
            {data.daily?.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Last 30 Days</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {[...data.daily].reverse().map((d, i) => {
                    const max = Math.max(...data.daily.map((x) => x.views), 1);
                    const pct = (d.views / max) * 100;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ ...labelStyle, minWidth: 60 }}>{fmtDay(d.day)}</span>
                        <div style={{ flex: 1, height: 10, background: 'rgba(196,132,58,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sb-gold)', borderRadius: 4 }} />
                        </div>
                        <span style={{ ...labelStyle, minWidth: 32, textAlign: 'right' }}>{d.views}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.totals.views === 0 && (
              <div style={{ ...styles.card, color: 'var(--sb-dusty)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                No page views recorded yet. Views are counted each time a visitor loads your public profile page.
              </div>
            )}
          </>
        )}

        {data && isAdmin && (
          <>
            <div style={{ ...styles.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={labelStyle}>Platform total views</div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-gold)', marginTop: '0.25rem' }}>{data.platform?.views?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div style={labelStyle}>Unique visitors</div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-gold)', marginTop: '0.25rem' }}>{data.platform?.uniques?.toLocaleString() || 0}</div>
              </div>
            </div>

            {data.memberBreakdown?.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Member Profile Views</div>
                {data.memberBreakdown.map((m) => (
                  <div key={m.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--sb-cream)' }}>/u/{m.slug}</span>
                    <span style={{ ...labelStyle, color: 'var(--sb-gold)' }}>{m.views.toLocaleString()} views · {m.uniques.toLocaleString()} uniq</span>
                  </div>
                ))}
              </div>
            )}

            {data.recentLogins?.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Recent Logins</div>
                {data.recentLogins.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--sb-cream)' }}>{l.email}</span>
                    <span style={labelStyle}>{fmtDate(l.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Audit Panel ───────────────────────────────────────────────────────────────

const ACTION_COLORS = {
  'auth.login':         '#a8b89a',
  'auth.login.failed':  '#c44b4b',
  'auth.logout':        '#8b9bae',
  'site.draft.save':    '#c4843a',
  'site.publish':       '#a8b89a',
  'agent.chat':         '#8b9bae',
};

export function MemberAuditPanel({ isAdmin = false }) {
  const [entries, setEntries] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [offset, setOffset] = React.useState(0);
  const LIMIT = 50;

  function load(off = 0) {
    const url = isAdmin
      ? `/api/members/admin/audit?limit=${LIMIT}&offset=${off}`
      : `/api/members/me/audit?limit=${LIMIT}&offset=${off}`;
    fetch(url, { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((d) => {
        setEntries((prev) => off === 0 ? d.entries : [...(prev || []), ...d.entries]);
        setOffset(off + d.entries.length);
      })
      .catch((e) => setError(e.message));
  }

  React.useEffect(() => { load(0); }, [isAdmin]);

  return (
    <div style={{ ...styles.editorPane, overflowY: 'auto' }}>
      <div style={styles.editorHeader}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
          {isAdmin ? 'Platform Audit Log' : 'Activity History'}
        </div>
      </div>
      <div style={styles.editorBody}>
        {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{error}</div>}
        {!entries && !error && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}

        {entries && entries.length === 0 && (
          <div style={{ ...styles.card, color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>
            No activity recorded yet.
          </div>
        )}

        {entries && entries.length > 0 && (
          <div style={styles.card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isAdmin ? '140px 1fr 160px 100px' : '140px 1fr 160px',
                    gap: '0.5rem',
                    alignItems: 'start',
                    padding: '0.5rem 0',
                    borderBottom: i < entries.length - 1 ? '0.5px solid rgba(196,132,58,0.1)' : 'none',
                  }}
                >
                  <span style={{ ...labelStyle }}>{fmtDate(e.created_at)}</span>
                  <div>
                    <span
                      style={{
                        ...labelStyle,
                        color: ACTION_COLORS[e.action] || 'var(--sb-sage)',
                        display: 'inline-block',
                        marginBottom: '0.1rem',
                      }}
                    >
                      {e.action}
                    </span>
                    {e.summary && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--sb-cream)', lineHeight: 1.4 }}>{e.summary}</div>
                    )}
                  </div>
                  <span style={{ ...labelStyle, fontFamily: 'monospace', letterSpacing: 0, fontSize: '0.65rem' }}>
                    {e.ip ? e.ip.slice(0, 20) : '—'}
                  </span>
                  {isAdmin && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--sb-sage)' }}>{e.actor_email || '—'}</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => load(offset)}
              className="sb-btn sb-btn-outline"
              style={{ marginTop: '0.75rem', fontSize: '0.68rem', padding: '0.4rem 0.9rem' }}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Agent Chat Panel ──────────────────────────────────────────────────────────

export function MemberAgentPanel() {
  const [history, setHistory] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [toolLog, setToolLog] = React.useState([]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    const nextHistory = [...history, { role: 'user', content: msg }];
    setHistory(nextHistory);
    setLoading(true);
    try {
      const res = await fetch('/api/members/me/agent', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Agent error');
      setHistory([...nextHistory, { role: 'assistant', content: body.reply }]);
      if (body.toolCalls?.length) setToolLog((prev) => [...prev, ...body.toolCalls]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const bubbleStyle = (role) => ({
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    maxWidth: '82%',
    background: role === 'user' ? 'var(--sb-navy)' : 'rgba(196,132,58,0.08)',
    border: role === 'user' ? '0.5px solid rgba(196,132,58,0.2)' : '0.5px solid rgba(196,132,58,0.15)',
    borderRadius: role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
    padding: '0.65rem 0.9rem',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: 'var(--sb-cream)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--sb-navy-deep)' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
          Profile Agent
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginTop: 2 }}>
          Ask me to update your profile, add sections, set config values, or query your external database.
          Changes go to your draft — you still control when to publish.
        </div>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {history.length === 0 && (
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--sb-sage)', display: 'block', marginBottom: '0.5rem' }}>Get started:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                '"Show me my current site structure"',
                '"Add a stat grid to my About page with 3 key metrics"',
                '"Change my hero heading to [your headline]"',
                '"Set my owner name in config to [your name]"',
                '"What sections do I have on my home page?"',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s.replace(/^"|"$/g, ''))}
                  style={{ textAlign: 'left', background: 'rgba(196,132,58,0.06)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 'var(--sb-radius)', padding: '0.4rem 0.7rem', color: 'var(--sb-sage)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-body)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((m, i) => (
          <div key={i} style={bubbleStyle(m.role)}>{m.content}</div>
        ))}

        {loading && (
          <div style={{ ...bubbleStyle('assistant'), color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
            Thinking…
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(196,75,75,0.1)', borderRadius: 'var(--sb-radius)', border: '0.5px solid rgba(196,75,75,0.3)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Tool call log — collapsed, expandable */}
      {toolLog.length > 0 && (
        <ToolCallLog log={toolLog} onClear={() => setToolLog([])} />
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '0.75rem 1.25rem', borderTop: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          className="sb-input sb-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask the agent to update your profile…  (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{ flex: 1, resize: 'none', fontSize: '0.85rem' }}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="sb-btn sb-btn-gold"
          style={{ padding: '0.55rem 1rem', fontSize: '0.75rem', alignSelf: 'stretch', opacity: (!input.trim() || loading) ? 0.45 : 1 }}
        >
          Send
        </button>
        {history.length > 0 && (
          <button
            onClick={() => { setHistory([]); setToolLog([]); setError(''); }}
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.55rem 0.7rem', fontSize: '0.7rem', alignSelf: 'stretch' }}
            title="Clear conversation"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function ToolCallLog({ log, onClear }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ flexShrink: 0, borderTop: '0.5px solid rgba(196,132,58,0.1)', background: 'rgba(0,0,0,0.15)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', padding: '0.35rem 1.25rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)' }}>
          {log.length} tool call{log.length !== 1 ? 's' : ''} this session
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--sb-dusty)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 0.75rem', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {log.map((t, i) => (
            <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--sb-sage)', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--sb-gold)' }}>{t.tool}</span>
              {' '}
              <span style={{ color: 'var(--sb-dusty)' }}>{JSON.stringify(t.input).slice(0, 80)}</span>
              {' → '}
              <span style={{ color: t.result?.ok || t.result?.rows ? '#a8b89a' : 'var(--sb-risk-critical)' }}>
                {t.result?.ok ? '✓ ok' : t.result?.error ? `✗ ${t.result.error}` : JSON.stringify(t.result).slice(0, 60)}
              </span>
            </div>
          ))}
          <button onClick={onClear} style={{ alignSelf: 'flex-start', marginTop: '0.25rem', background: 'none', border: 'none', color: 'var(--sb-dusty)', cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Clear log</button>
        </div>
      )}
    </div>
  );
}
