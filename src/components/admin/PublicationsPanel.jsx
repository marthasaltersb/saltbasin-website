import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';
import PublicationsCalendar from './PublicationsCalendar.jsx';
import PublicationsDashboard from './PublicationsDashboard.jsx';

// Generic editorial calendar / publication tracker — leveraged by ALL
// marketing content (HERQ posts, Services ads, future apps), not nested
// under HerqPanel. Backed by /api/content-publications
// (server/routes/contentPublications.js). Release 1 scope: list/create/edit
// + manual interaction import — not yet a full drag/drop calendar view.
const APP_OPTIONS = [
  { id: 'app.herq', label: 'HERQ' },
  { id: 'app.services', label: 'Services / Ads' },
];
const CHANNEL_OPTIONS = ['linkedin', 'website', 'newsletter', 'x', 'instagram', 'facebook', 'print'];
const STATUS_OPTIONS = ['draft', 'awaiting_approval', 'approved', 'scheduled', 'publishing', 'published', 'partially_published', 'failed', 'cancelled', 'removed'];
const STATUS_COLORS = {
  draft: '#FFE08A', awaiting_approval: '#FFD6A5', approved: '#BDE4FF', scheduled: '#C7B7FF',
  publishing: '#BDE4FF', published: '#CDEEDC', partially_published: '#CDEEDC', failed: '#F5A3A3',
  cancelled: '#ddd', removed: '#ddd',
};

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  card: { background: 'var(--sb-admin-surface)', border: '0.5px solid var(--sb-admin-border)', borderRadius: 4, padding: '1rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-admin-text-soft)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'var(--sb-admin-bg)', border: '0.5px solid var(--sb-admin-border)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-admin-text)', fontSize: '0.85rem', boxSizing: 'border-box' },
  btn: (primary) => ({ padding: '0.45rem 1.1rem', background: primary ? 'var(--sb-admin-gold-warm)' : 'transparent', color: primary ? '#1A1A1A' : 'var(--sb-admin-text)', border: '0.5px solid var(--sb-admin-border)', borderRadius: 2, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }),
};

export default function PublicationsPanel() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterApp, setFilterApp] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('calendar');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterApp !== 'all') params.set('app_id', filterApp);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/content-publications?${params}`, { credentials: 'include' });
      const data = await res.json();
      setPublications(data.publications || []);
    } catch (e) {
      toast.error('Failed to load publications');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterApp, filterStatus]);

  async function deletePub(id) {
    if (!confirm('Delete this publication?')) return;
    await fetch(`/api/content-publications/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Publication deleted');
    load();
  }

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-admin-gold-warm)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' }}>Editorial Calendar</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', fontWeight: 700 }}>Publications</div>
        </div>
        <button style={s.btn(true)} onClick={() => { setShowNew(true); setEditId(null); }}>+ New Publication</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select value={filterApp} onChange={e => setFilterApp(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="all">All Apps</option>
          {APP_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', border: '0.5px solid var(--sb-admin-border)', borderRadius: 2, overflow: 'hidden' }}>
          {['calendar', 'list', 'dashboard'].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '0.35rem 0.85rem', fontSize: '0.72rem', textTransform: 'capitalize', cursor: 'pointer',
              border: 'none', fontFamily: 'var(--sb-font-label)',
              background: view === v ? 'var(--sb-admin-gold-warm)' : 'transparent',
              color: view === v ? '#1A1A1A' : 'var(--sb-admin-text)',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {(showNew || editId) && (
        <div style={{ ...s.card, marginBottom: '1.25rem' }}>
          <PublicationForm
            initial={publications.find(p => p.id === editId) || {}}
            onSave={async (form) => {
              const url = editId ? `/api/content-publications/${editId}` : '/api/content-publications';
              const method = editId ? 'PUT' : 'POST';
              const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.missingApprovals?.length) {
                  toast.error(`Missing approvals: ${data.missingApprovals.join(', ')}`);
                } else {
                  toast.error(data.error || 'Failed to save');
                }
                return;
              }
              toast.success(editId ? 'Publication updated' : 'Publication created');
              setShowNew(false); setEditId(null); load();
            }}
            onCancel={() => { setShowNew(false); setEditId(null); }}
          />
        </div>
      )}

      {loading && <div style={{ fontSize: '0.85rem', color: 'var(--sb-admin-text-soft)' }}>Loading…</div>}
      {!loading && publications.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--sb-admin-text-soft)' }}>No publications scheduled yet.</div>}

      {!loading && view === 'dashboard' && (
        <PublicationsDashboard appFilter={filterApp} />
      )}

      {!loading && view === 'calendar' && (
        <PublicationsCalendar
          publications={publications}
          onEdit={(id) => { setEditId(id); setShowNew(false); }}
          onRefresh={load}
        />
      )}

      {!loading && view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {publications.map(p => (
            <div key={p.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--sb-admin-text-soft)', fontFamily: 'var(--sb-font-label)' }}>{p.app_id}</span>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', padding: '1px 7px', background: 'rgba(0,0,0,0.06)', borderRadius: 10 }}>{p.channel}</span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: 10, background: STATUS_COLORS[p.status] || '#eee', color: '#1A1A1A', fontWeight: 600 }}>{p.status}</span>
                    {p.long_form_ref && <span style={{ fontSize: '0.62rem', color: 'var(--sb-admin-gold-warm)' }}>→ long-form linked</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>{p.entry_ref || '(no entry linked)'}</div>
                  {p.scheduled_at && <div style={{ fontSize: '0.7rem', color: 'var(--sb-admin-text-soft)' }}>Scheduled {new Date(Number(p.scheduled_at)).toLocaleString()}</div>}
                  {p.failure_reason && <div style={{ fontSize: '0.7rem', color: '#C44A4A' }}>Failed: {p.failure_reason}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button style={{ ...s.btn(false), padding: '0.25rem 0.6rem' }} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>{expandedId === p.id ? 'Hide' : 'Interactions'}</button>
                  <button style={{ ...s.btn(false), padding: '0.25rem 0.6rem' }} onClick={() => { setEditId(p.id); setShowNew(false); }}>Edit</button>
                  <button style={{ ...s.btn(false), padding: '0.25rem 0.6rem', color: '#C44A4A' }} onClick={() => deletePub(p.id)}>×</button>
                </div>
              </div>
              {expandedId === p.id && <InteractionsList publicationId={p.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublicationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    app_id: 'app.herq', entry_ref: '', long_form_ref: '', channel: 'linkedin', channel_account_ref: '',
    campaign_ref: '', status: 'draft', destination_url: '',
    ...initial,
    scheduled_at: initial.scheduled_at ? new Date(Number(initial.scheduled_at)).toISOString().slice(0, 16) : '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    onSave({ ...form, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).getTime() : null });
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>App</label>
          <select style={s.input} value={form.app_id} onChange={set('app_id')}>
            {APP_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Channel</label>
          <select style={s.input} value={form.channel} onChange={set('channel')}>
            {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={s.label}>Entry Ref (unified_content_items.id)</label>
          <input style={s.input} value={form.entry_ref} onChange={set('entry_ref')} placeholder="post.abc123" />
        </div>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={s.label}>Long-Form Ref (optional — the Salt Basin site "read more" this points to)</label>
          <input style={s.input} value={form.long_form_ref} onChange={set('long_form_ref')} placeholder="output.xyz789 or a site page slug — leave blank for ads" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Channel Account Ref</label>
          <input style={s.input} value={form.channel_account_ref} onChange={set('channel_account_ref')} placeholder="e.g. linkedin oauth_connections id" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Campaign Ref</label>
          <input style={s.input} value={form.campaign_ref} onChange={set('campaign_ref')} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Scheduled At</label>
          <input type="datetime-local" style={s.input} value={form.scheduled_at} onChange={set('scheduled_at')} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Status</label>
          <select style={s.input} value={form.status} onChange={set('status')}>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={s.label}>Destination URL</label>
          <input style={s.input} value={form.destination_url} onChange={set('destination_url')} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={s.btn(true)} onClick={save}>Save</button>
        <button style={s.btn(false)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function InteractionsList({ publicationId }) {
  const [interactions, setInteractions] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ interaction_type: 'like', external_user_ref: '', comment_content: '', sentiment: 'neutral' });

  async function load() {
    const res = await fetch(`/api/content-publications/${publicationId}/interactions`, { credentials: 'include' });
    const data = await res.json();
    setInteractions(data.interactions || []);
  }
  useEffect(() => { load(); }, [publicationId]);

  async function save() {
    const res = await fetch(`/api/content-publications/${publicationId}/interactions`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed'); return; }
    setShowNew(false);
    load();
  }

  return (
    <div style={{ marginTop: '0.75rem', borderTop: '0.5px solid var(--sb-admin-border)', paddingTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={s.label}>Interactions ({interactions.length})</span>
        <button style={{ ...s.btn(false), padding: '0.2rem 0.6rem' }} onClick={() => setShowNew(!showNew)}>+ Log Interaction</button>
      </div>
      {showNew && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <select style={s.input} value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value }))}>
            {['impression', 'like', 'comment', 'share', 'click', 'follow', 'lead'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input style={s.input} placeholder="External user ref" value={form.external_user_ref} onChange={e => setForm(f => ({ ...f, external_user_ref: e.target.value }))} />
          <input style={{ ...s.input, gridColumn: '1 / -1' }} placeholder="Comment content (optional)" value={form.comment_content} onChange={e => setForm(f => ({ ...f, comment_content: e.target.value }))} />
          <button style={s.btn(true)} onClick={save}>Save</button>
        </div>
      )}
      {interactions.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--sb-admin-text-soft)' }}>No interactions logged yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {interactions.map(i => (
            <div key={i.id} style={{ fontSize: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{i.interaction_type}</span>
              {i.comment_content && <span>"{i.comment_content}"</span>}
              <span style={{ color: 'var(--sb-admin-text-soft)', marginLeft: 'auto' }}>{new Date(Number(i.occurred_at)).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
