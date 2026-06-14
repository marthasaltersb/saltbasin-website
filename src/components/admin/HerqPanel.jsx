import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';
import HerqOutputConfigurator from './HerqOutputConfigurator.jsx';

// HERQ panel renders inside [data-brand-mode="herq"] — Salter Momentum™ aesthetic.
// Uses herq CSS variables, NOT sb- variables.

const HERQ_TABS = [
  { id: 'framework', label: 'Framework' },
  { id: 'series',    label: 'Series' },
  { id: 'tracker',   label: 'Post Tracker' },
  { id: 'research',  label: 'Research' },
  { id: 'insights',  label: 'Insights' },
  { id: 'outputs',   label: 'Outputs' },
];

const STATUS_OPTIONS = ['idea', 'drafting', 'scheduled', 'published', 'referenced', 'paused'];

const h = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%', color: 'var(--herq-text, #1A1A1A)' },
  eyebrow: { fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--herq-accent, #E8407A)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.5rem', fontFamily: 'var(--sb-font-display)', fontWeight: 700, color: 'var(--herq-text, #1A1A1A)', marginBottom: '1.25rem' },
  subTab: (active) => ({
    padding: '0.35rem 0.85rem', fontSize: '0.72rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase',
    background: active ? 'var(--herq-accent, #E8407A)' : 'transparent',
    color: active ? '#fff' : 'var(--herq-teal, #4A7C8E)',
    border: `0.5px solid ${active ? 'var(--herq-accent, #E8407A)' : 'rgba(74,124,142,0.3)'}`,
    borderRadius: 2, cursor: 'pointer',
  }),
  card: { background: 'rgba(0,0,0,0.04)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '1rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.8)', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--herq-text, #1A1A1A)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)' },
  btn: (primary) => ({ padding: '0.45rem 1.1rem', background: primary ? 'var(--herq-accent, #E8407A)' : 'transparent', color: primary ? '#fff' : 'var(--herq-teal, #4A7C8E)', border: `0.5px solid ${primary ? 'var(--herq-accent, #E8407A)' : 'rgba(74,124,142,0.4)'}`, borderRadius: 2, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }),
};

// ── Series colors ──
const SERIES_COLOR_MAP = {
  'series.base':   { label: 'Hot Elephant Resident Question',    color: '#FF6B9D' },
  'series.hazard': { label: 'Hazardous Enterprise Reality Question', color: '#FFD6A5' },
  'series.retain': { label: 'Highly Evaded Retention Question',  color: '#BDE4FF' },
  'series.human':  { label: 'Human Enterprise Resource Question',color: '#CDEEDC' },
  'series.earn':   { label: 'Hindered Earnings Reporting Question', color: '#FFE08A' },
};

export default function HerqPanel() {
  const [tab, setTab] = useState('tracker');
  const [series, setSeries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [research, setResearch] = useState([]);
  const [insights, setInsights] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [sR, pR, rR, iR, oR] = await Promise.all([
        fetch('/api/herq/series', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/herq/posts', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/herq/research', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/herq/insights', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/herq/outputs', { credentials: 'include' }).then(r => r.json()),
      ]);
      setSeries(sR.series || []);
      setPosts(pR.posts || []);
      setResearch(rR.research || []);
      setInsights(iR.insights || []);
      setOutputs(oR.outputs || []);
    } catch (e) {
      toast.error('Failed to load HERQ data');
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={h.page}>
      {/* HERQ Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={h.eyebrow}>Salter Momentum™ · HERQ</div>
          <div style={h.title}>Content Repository</div>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: '#FF6B9D', color: '#fff', borderRadius: 4, fontSize: '0.72rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', fontWeight: 700 }}>◈ HERQ</div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {HERQ_TABS.map(t => <button key={t.id} style={h.subTab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {loading && <div style={{ color: 'var(--herq-teal, #4A7C8E)', fontSize: '0.85rem' }}>Loading HERQ data…</div>}

      {!loading && tab === 'framework'  && <FrameworkPanel series={series} />}
      {!loading && tab === 'series'     && <SeriesPanel series={series} onRefresh={loadAll} />}
      {!loading && tab === 'tracker'    && <PostTracker posts={posts} series={series} onRefresh={loadAll} />}
      {!loading && tab === 'research'   && <ResearchPanel research={research} onRefresh={loadAll} />}
      {!loading && tab === 'insights'   && <InsightsPanel insights={insights} onRefresh={loadAll} />}
      {!loading && tab === 'outputs'    && <OutputsPanel outputs={outputs} posts={posts} series={series} onRefresh={loadAll} />}
    </div>
  );
}

// ── Framework Panel ────────────────────────────────────────────────────────────

function FrameworkPanel({ series }) {
  return (
    <div>
      {/* Zero.Post pinned card */}
      <div style={{ ...h.card, borderLeft: '4px solid #FF6B9D', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF6B9D', fontFamily: 'var(--sb-font-label)', marginBottom: '0.35rem' }}>Pinned Framework Reference — Not a Content Post</div>
        <div style={{ fontSize: '1.1rem', fontFamily: 'var(--sb-font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>Zero.Post</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--herq-teal, #4A7C8E)', lineHeight: 1.6 }}>
          Every future HERQ post references Zero.Post. It defines the irreducible variable: human judgment cannot be replaced in a governed system. Zero.Post is the framework foundation — it appears as a pinned reference on every post, not as a content item in the tracker.
        </div>
      </div>

      {/* HERQ Mission */}
      <div style={h.card}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--herq-accent, #E8407A)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>HERQ Framework Mission</div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--herq-text, #1A1A1A)' }}>
          HERQ asks the questions that organizations know are there but no one will say out loud. The framework makes the uncomfortable visible, governable, and actionable — without sacrificing organizational reality or human judgment.
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>Active Series ({series.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {series.map(s => {
              const meta = SERIES_COLOR_MAP[s.id];
              return (
                <div key={s.id} style={{ padding: '0.35rem 0.85rem', background: meta?.color || '#ddd', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>
                  {s.series_title.split(' ').map(w => w[0]).join('')} · {s.series_title}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Series Panel ──────────────────────────────────────────────────────────────

function SeriesPanel({ series, onRefresh }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  function startEdit(s) { setEditId(s.id); setForm({ series_title: s.series_title, definition: s.definition || '', status: s.status }); }

  async function save() {
    const res = await fetch(`/api/herq/series/${editId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success('Series updated');
    setEditId(null);
    onRefresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {series.map(s => {
        const meta = SERIES_COLOR_MAP[s.id];
        const isEditing = editId === s.id;
        return (
          <div key={s.id} style={{ ...h.card, borderLeft: `4px solid ${meta?.color || '#ccc'}` }}>
            {isEditing ? (
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={h.label}>Series Title</label>
                  <input style={h.input} value={form.series_title} onChange={e => setForm(f => ({ ...f, series_title: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={h.label}>Definition</label>
                  <textarea style={{ ...h.input, minHeight: 80, resize: 'vertical' }} value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={h.btn(true)} onClick={save}>Save</button>
                  <button style={h.btn(false)} onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: meta?.color || '#999', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' }}>HERQ · {s.classification_type}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--herq-text, #1A1A1A)', marginBottom: '0.35rem' }}>{s.series_title}</div>
                  {s.definition && <div style={{ fontSize: '0.8rem', color: 'var(--herq-teal, #4A7C8E)', lineHeight: 1.5 }}>{s.definition}</div>}
                </div>
                <button style={{ ...h.btn(false), marginLeft: '1rem', flexShrink: 0 }} onClick={() => startEdit(s)}>Edit</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Post Tracker ──────────────────────────────────────────────────────────────

function PostTracker({ posts, series, onRefresh }) {
  const [showNew, setShowNew] = useState(false);
  const [filterSeries, setFilterSeries] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editPost, setEditPost] = useState(null);

  const filtered = posts.filter(p => {
    if (filterSeries !== 'all' && p.series_ref !== filterSeries) return false;
    if (filterStatus !== 'all' && p.export_status !== filterStatus) return false;
    return true;
  });

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/herq/posts/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Post deleted');
    onRefresh();
  }

  const STATUS_COLORS_HERQ = { idea: '#FFE08A', drafting: '#BDE4FF', scheduled: '#CDEEDC', published: '#CDEEDC', referenced: '#C7B7FF', paused: '#FFD6A5', draft: '#FFE08A' };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterSeries} onChange={e => setFilterSeries(e.target.value)} style={{ ...h.input, width: 'auto' }}>
          <option value="all">All Series</option>
          {series.map(s => <option key={s.id} value={s.id}>{s.series_title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...h.input, width: 'auto' }}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button style={h.btn(true)} onClick={() => { setShowNew(true); setEditPost(null); }}>+ New Post</button>
      </div>

      {(showNew || editPost) && (
        <div style={{ ...h.card, marginBottom: '1.25rem', borderTop: '3px solid var(--herq-accent, #E8407A)' }}>
          <PostForm initial={editPost || {}} series={series} onSave={async (form) => {
            const url = editPost ? `/api/herq/posts/${editPost.id}` : '/api/herq/posts';
            const method = editPost ? 'PUT' : 'POST';
            const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (!res.ok) { toast.error('Failed'); return; }
            toast.success(editPost ? 'Post updated' : 'Post created');
            setShowNew(false); setEditPost(null); onRefresh();
          }} onCancel={() => { setShowNew(false); setEditPost(null); }} />
        </div>
      )}

      {/* Zero.Post pinned */}
      <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(255,107,157,0.08)', border: '0.5px dashed #FF6B9D', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.75rem', color: '#FF6B9D', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em' }}>
        📌 ZERO.POST — Framework Reference (pinned · not a content post)
      </div>

      {/* Post table */}
      {filtered.length === 0 ? (
        <div style={{ color: 'var(--herq-teal, #4A7C8E)', fontSize: '0.85rem', padding: '1rem 0' }}>No posts yet. Create your first HERQ post above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((p, i) => {
            const seriesData = series.find(s => s.id === p.series_ref);
            const seriesMeta = SERIES_COLOR_MAP[p.series_ref];
            const body = typeof p.body === 'string' ? JSON.parse(p.body || '{}') : (p.body || {});
            return (
              <div key={p.id} style={{ ...h.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)' }}>Post {i + 1}</span>
                    {seriesMeta && <span style={{ padding: '1px 7px', background: seriesMeta.color, borderRadius: 10, fontSize: '0.6rem', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{seriesData?.series_title?.split(' ').map(w => w[0]).join('')}</span>}
                    <span style={{ padding: '1px 7px', background: STATUS_COLORS_HERQ[p.export_status] || '#eee', borderRadius: 10, fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{p.export_status}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--herq-text, #1A1A1A)', marginBottom: '0.2rem' }}>{p.title}</div>
                  {p.topic && <div style={{ fontSize: '0.75rem', color: 'var(--herq-teal, #4A7C8E)' }}>{p.topic}</div>}
                  {p.summary && <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.25rem', lineHeight: 1.5 }}>{p.summary}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button style={{ ...h.btn(false), padding: '0.25rem 0.6rem' }} onClick={() => { setEditPost(p); setShowNew(false); }}>Edit</button>
                  <button style={{ ...h.btn(false), padding: '0.25rem 0.6rem', borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => deletePost(p.id)}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostForm({ initial, series, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '', topic: '', summary: '', series_ref: '', export_status: 'idea',
    ...initial,
    body: typeof initial.body === 'string' ? JSON.parse(initial.body || '{}') : (initial.body || {}),
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--herq-accent, #E8407A)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
        {initial.id ? 'Edit Post' : 'New HERQ Post'} · <span style={{ color: 'var(--herq-teal)', fontSize: '0.65rem' }}>All posts reference Zero.Post</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={h.label}>Title *</label>
          <input style={h.input} value={form.title} onChange={set('title')} placeholder="The question this post asks" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={h.label}>Series</label>
          <select style={h.input} value={form.series_ref} onChange={set('series_ref')}>
            <option value="">No series</option>
            {series.map(s => <option key={s.id} value={s.id}>{s.series_title}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={h.label}>Status</label>
          <select style={h.input} value={form.export_status} onChange={set('export_status')}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={h.label}>Topic</label>
          <input style={h.input} value={form.topic} onChange={set('topic')} placeholder="One-line topic summary" />
        </div>
        <div style={{ marginBottom: '0.75rem', gridColumn: '1 / -1' }}>
          <label style={h.label}>Summary</label>
          <textarea style={{ ...h.input, minHeight: 80, resize: 'vertical' }} value={form.summary} onChange={set('summary')} placeholder="Brief summary of what this post covers" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button style={h.btn(true)} onClick={() => onSave(form)}>Save Post</button>
        <button style={h.btn(false)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Research Panel ─────────────────────────────────────────────────────────────

function ResearchPanel({ research, onRefresh }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', source_name: '', stat: '', why_it_matters: '', verification_status: 'needsVerification' });

  async function save() {
    const res = await fetch('/api/herq/research', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed'); return; }
    toast.success('Research input added');
    setShowNew(false);
    setForm({ title: '', source_name: '', stat: '', why_it_matters: '', verification_status: 'needsVerification' });
    onRefresh();
  }

  const VSTATUS_COLORS = { verified: '#CDEEDC', needsVerification: '#FFD6A5', userProvided: '#C7B7FF', illustrative: '#BDE4FF' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)' }}>Research Inputs ({research.length})</div>
        <button style={h.btn(true)} onClick={() => setShowNew(!showNew)}>+ Add Research</button>
      </div>
      {showNew && (
        <div style={{ ...h.card, marginBottom: '1rem', borderTop: '3px solid var(--herq-accent)' }}>
          {['title', 'source_name', 'stat', 'why_it_matters'].map(k => (
            <div key={k} style={{ marginBottom: '0.6rem' }}>
              <label style={h.label}>{k.replace(/_/g, ' ')}</label>
              <input style={h.input} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={h.label}>Verification Status</label>
            <select style={h.input} value={form.verification_status} onChange={e => setForm(f => ({ ...f, verification_status: e.target.value }))}>
              {['verified', 'needsVerification', 'userProvided', 'illustrative'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={h.btn(true)} onClick={save}>Save</button>
            <button style={h.btn(false)} onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {research.map(r => (
          <div key={r.id} style={{ ...h.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{r.title}</div>
              <span style={{ padding: '1px 8px', borderRadius: 10, background: VSTATUS_COLORS[r.verification_status] || '#eee', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>{r.verification_status}</span>
            </div>
            {r.source_name && <div style={{ fontSize: '0.72rem', color: 'var(--herq-teal)' }}>{r.source_name}</div>}
            {r.stat && <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--herq-accent)', margin: '0.35rem 0' }}>"{r.stat}"</div>}
            {r.why_it_matters && <div style={{ fontSize: '0.78rem', color: '#555' }}>{r.why_it_matters}</div>}
          </div>
        ))}
        {research.length === 0 && <div style={{ color: 'var(--herq-teal)', fontSize: '0.85rem' }}>No research inputs yet.</div>}
      </div>
    </div>
  );
}

// ── Insights Panel ─────────────────────────────────────────────────────────────

function InsightsPanel({ insights, onRefresh }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ body: '', source_type: 'user note', sentiment: 'neutral', actionability: 'medium', follow_up_needed: false });

  async function save() {
    const res = await fetch('/api/herq/insights', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed'); return; }
    toast.success('Insight added');
    setShowNew(false);
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--herq-teal)', fontFamily: 'var(--sb-font-label)' }}>Comment Insights ({insights.length})</div>
        <button style={h.btn(true)} onClick={() => setShowNew(!showNew)}>+ Add Insight</button>
      </div>
      {showNew && (
        <div style={{ ...h.card, marginBottom: '1rem', borderTop: '3px solid var(--herq-accent)' }}>
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={h.label}>Insight / Observation *</label>
            <textarea style={{ ...h.input, minHeight: 80, resize: 'vertical' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 0.75rem' }}>
            {[['source_type', ['LinkedIn comment', 'website comment', 'direct message', 'user note', 'interview', 'market observation', 'AI synthesis']],
              ['sentiment', ['positive', 'negative', 'neutral', 'mixed', 'unknown']],
              ['actionability', ['low', 'medium', 'high']]].map(([k, opts]) => (
              <div key={k} style={{ marginBottom: '0.6rem' }}>
                <label style={h.label}>{k.replace(/_/g, ' ')}</label>
                <select style={h.input} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={h.btn(true)} onClick={save}>Save</button>
            <button style={h.btn(false)} onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {insights.map(ins => (
          <div key={ins.id} style={{ ...h.card }}>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.35rem' }}>"{ins.body}"</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '1px 7px', background: '#BDE4FF', borderRadius: 10, fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{ins.source_type}</span>
              <span style={{ padding: '1px 7px', background: '#FFE08A', borderRadius: 10, fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{ins.sentiment}</span>
              <span style={{ padding: '1px 7px', background: '#CDEEDC', borderRadius: 10, fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{ins.actionability}</span>
            </div>
          </div>
        ))}
        {insights.length === 0 && <div style={{ color: 'var(--herq-teal)', fontSize: '0.85rem' }}>No insights yet.</div>}
      </div>
    </div>
  );
}

// ── Outputs Panel ──────────────────────────────────────────────────────────────

function OutputsPanel({ outputs, posts, series, onRefresh }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', purpose: '', template_ref: 'HERQSeriesPostOnePager' });

  async function save() {
    const res = await fetch('/api/herq/outputs', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed'); return; }
    toast.success('Output created');
    setShowNew(false);
    onRefresh();
  }

  const STATUS_COLORS_OUT = { draft: '#FFE08A', preview: '#BDE4FF', published: '#CDEEDC', archived: '#ddd' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--herq-teal)', fontFamily: 'var(--sb-font-label)' }}>HERQ Outputs ({outputs.length})</div>
        <button style={h.btn(true)} onClick={() => setShowNew(!showNew)}>+ New Output</button>
      </div>
      {showNew && (
        <div style={{ ...h.card, marginBottom: '1rem', borderTop: '3px solid var(--herq-accent)' }}>
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={h.label}>Output Title *</label>
            <input style={h.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={h.label}>Template</label>
            <select style={h.input} value={form.template_ref} onChange={e => setForm(f => ({ ...f, template_ref: e.target.value }))}>
              {['HERQFramework', 'HERQSeriesTracker', 'HERQSeriesPostOnePager'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={h.label}>Purpose</label>
            <input style={h.input} value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={h.btn(true)} onClick={save}>Create Output</button>
            <button style={h.btn(false)} onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}
      {outputs.length > 0 ? (
        <div style={{ marginTop: '0.5rem', height: 'calc(100vh - 280px)', minHeight: 400 }}>
          <HerqOutputConfigurator outputs={outputs} posts={posts} series={series} onRefresh={onRefresh} />
        </div>
      ) : (
        <div style={{ color: 'var(--herq-teal)', fontSize: '0.85rem', padding: '1rem 0' }}>No outputs yet. Create your first HERQ output above.</div>
      )}
    </div>
  );
}
