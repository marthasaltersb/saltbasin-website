import React, { useEffect, useRef, useState } from 'react';
import { toast } from '../../lib/toast.js';

function fmtTime(ms) {
  if (!ms) return '';
  const d = new Date(Number(ms));
  const diff = Date.now() - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function InboxPanel() {
  const [messages, setMessages] = useState(null);
  const [requests, setRequests] = useState(null);
  const [connections, setConnections] = useState(null);
  const [activeThread, setActiveThread] = useState(null); // { userId, email, slug }
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('messages'); // messages | requests | connections
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(d => setMe(d.user)).catch(() => {});
    loadAll();
  }, []);

  async function loadAll() {
    const [msgRes, reqRes, connRes] = await Promise.allSettled([
      fetch('/api/members/me/messages', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/members/me/connection-requests', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/members/me/connections', { credentials: 'include' }).then(r => r.json()),
    ]);
    if (msgRes.status === 'fulfilled') setMessages(msgRes.value.messages || []);
    if (reqRes.status === 'fulfilled') setRequests(reqRes.value.requests || []);
    if (connRes.status === 'fulfilled') setConnections(connRes.value.connections || []);
  }

  async function openThread(userId, email, slug) {
    setActiveThread({ userId, email, slug });
    const r = await fetch(`/api/members/me/messages/thread/${userId}`, { credentials: 'include' });
    const d = await r.json();
    setThread(d.messages || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!draft.trim() || !activeThread) return;
    setSending(true);
    try {
      const r = await fetch('/api/members/me/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activeThread.userId, body: draft.trim() }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      setDraft('');
      openThread(activeThread.userId, activeThread.email, activeThread.slug);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  async function acceptRequest(id) {
    await fetch(`/api/members/me/connections/${id}/accept`, { method: 'POST', credentials: 'include' });
    toast.success('Connection accepted');
    loadAll();
  }

  async function declineRequest(id) {
    await fetch(`/api/members/me/connections/${id}/decline`, { method: 'POST', credentials: 'include' });
    toast.success('Request declined');
    loadAll();
  }

  // Group inbox messages by sender for thread list
  const threadList = [];
  const seen = new Set();
  for (const msg of (messages || [])) {
    if (!seen.has(msg.sender_id)) {
      seen.add(msg.sender_id);
      const unreadCount = (messages || []).filter(m => m.sender_id === msg.sender_id && !m.read_at).length;
      threadList.push({ userId: msg.sender_id, email: msg.sender_email, slug: msg.sender_slug, lastMsg: msg.body, lastAt: msg.created_at, unread: unreadCount });
    }
  }
  const pendingCount = (requests || []).length;

  const S = {
    sidebar: { width: 280, borderRight: '0.5px solid rgba(196,132,58,0.15)', overflowY: 'auto', background: 'var(--sb-navy-deep)' },
    threadRow: (active) => ({ padding: '0.85rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.08)', cursor: 'pointer', background: active ? 'rgba(196,132,58,0.1)' : 'transparent' }),
    bubble: (mine) => ({
      maxWidth: '70%', padding: '0.55rem 0.85rem', borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
      background: mine ? 'var(--sb-gold)' : 'rgba(255,255,255,0.08)', color: mine ? 'white' : 'var(--sb-cream)', fontSize: '0.85rem', lineHeight: 1.55, wordBreak: 'break-word',
    }),
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sb-navy-deep)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', flexShrink: 0 }}>
        <div className="sb-display" style={{ fontSize: '1.4rem', color: 'var(--sb-cream)', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Inbox</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['messages', 'Messages'], ['requests', `Requests${pendingCount ? ` (${pendingCount})` : ''}`], ['connections', 'Connections']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ padding: '0.4rem 1rem', border: 'none', borderBottom: tab === v ? '2px solid var(--sb-gold)' : '2px solid transparent', background: 'transparent', color: tab === v ? 'var(--sb-gold)' : 'var(--sb-dusty)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Messages tab */}
      {tab === 'messages' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Thread list */}
          <div style={S.sidebar}>
            {messages === null && <div style={{ padding: '1.5rem', color: 'var(--sb-dusty)', fontSize: '0.82rem' }}>Loading…</div>}
            {messages !== null && threadList.length === 0 && (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--sb-dusty)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                No messages yet.<br />Messages from your connections appear here.
              </div>
            )}
            {threadList.map(t => (
              <div key={t.userId} onClick={() => openThread(t.userId, t.email, t.slug)} style={S.threadRow(activeThread?.userId === t.userId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: t.unread ? 700 : 500, color: 'var(--sb-cream)' }}>{t.slug || t.email}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--sb-dusty)' }}>{fmtTime(t.lastAt)}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.lastMsg}</div>
                {t.unread > 0 && <div style={{ display: 'inline-block', marginTop: 4, background: 'var(--sb-gold)', color: 'white', fontSize: '0.6rem', borderRadius: 10, padding: '1px 7px' }}>{t.unread} new</div>}
              </div>
            ))}
          </div>

          {/* Thread view */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!activeThread ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>
                Select a conversation
              </div>
            ) : (
              <>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--sb-cream)', fontSize: '0.9rem' }}>{activeThread.slug || activeThread.email}</div>
                  {activeThread.slug && <a href={`/u/${activeThread.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)', textDecoration: 'none' }}>/u/{activeThread.slug} ↗</a>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {thread.map(msg => {
                    const mine = me && Number(msg.sender_id) === Number(me.id);
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div>
                          <div style={S.bubble(mine)}>{msg.body}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{fmtTime(msg.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '0.5px solid rgba(196,132,58,0.15)', flexShrink: 0, display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <textarea
                    value={draft} onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Write a message… (Enter to send)"
                    rows={2}
                    style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={sendMessage} disabled={sending || !draft.trim()}
                    style={{ padding: '0.6rem 1.1rem', borderRadius: 8, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'stretch' }}>
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Connection requests tab */}
      {tab === 'requests' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {requests === null && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem' }}>Loading…</div>}
          {requests !== null && requests.length === 0 && (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem', fontStyle: 'italic', padding: '1.5rem 0' }}>No pending connection requests.</div>
          )}
          {(requests || []).map(req => (
            <div key={req.id} style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 8, marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--sb-cream)', fontSize: '0.88rem' }}>{req.requester_slug || req.requester_email}</div>
                  {req.requester_slug && <a href={`/u/${req.requester_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)', textDecoration: 'none' }}>/u/{req.requester_slug} ↗</a>}
                  <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: 3 }}>{fmtTime(req.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => acceptRequest(req.id)} style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => declineRequest(req.id)} style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--sb-dusty)', fontSize: '0.75rem', cursor: 'pointer' }}>Decline</button>
                </div>
              </div>
              {req.message && <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--sb-sage)', fontStyle: 'italic', borderLeft: '2px solid rgba(196,132,58,0.3)', paddingLeft: '0.75rem' }}>{req.message}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Connections tab */}
      {tab === 'connections' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {connections === null && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem' }}>Loading…</div>}
          {connections !== null && connections.length === 0 && (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem', fontStyle: 'italic', padding: '1.5rem 0' }}>No connections yet. Visit member profiles to send connection requests.</div>
          )}
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {(connections || []).map(conn => (
              <div key={conn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.1rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.15)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--sb-cream)', fontSize: '0.88rem' }}>{conn.other_slug || conn.other_email}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginTop: 2 }}>Connected {fmtTime(conn.updated_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {conn.other_slug && (
                    <a href={`/u/${conn.other_slug}`} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--sb-dusty)', fontSize: '0.7rem', textDecoration: 'none' }}>Profile ↗</a>
                  )}
                  <button onClick={() => { setTab('messages'); openThread(conn.other_user_id, conn.other_email, conn.other_slug); }}
                    style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.7rem', cursor: 'pointer' }}>
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
