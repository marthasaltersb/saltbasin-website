// Admin queue for the beta product feedback loop. Server side:
// server/routes/feedback.js (/api/feedback/*), scoring in
// server/lib/feedbackScoring.js. Mounted as the 'feedback' tab (PLM view)
// in AdminShell for scope='admin'.

import React from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';

const label = {
  fontFamily: 'var(--sb-font-label)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--sb-dusty)',
};

const STATUS_COLOR = {
  new: 'var(--sb-dusty)',
  reviewing: '#4A7C8E',
  routed: '#A8B89A',
  archived: '#8B9BAE',
};

export default function FeedbackPanel() {
  const [queue, setQueue] = React.useState(null);
  const [weights, setWeights] = React.useState(null);
  const [advisors, setAdvisors] = React.useState(null);
  const [newAdvisorId, setNewAdvisorId] = React.useState('');
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    api.getFeedbackQueue().then((d) => setQueue(d.feedback || [])).catch((e) => setError(e.message));
    api.getFeedbackCategoryWeights().then((d) => setWeights(d.weights || [])).catch(() => setWeights([]));
    api.getFeedbackAdvisors().then((d) => setAdvisors(d.advisors || [])).catch(() => setAdvisors([]));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function route(id) {
    try {
      await api.routeFeedback(id);
      toast.success('Routed to backlog.');
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function setStatus(id, status) {
    try {
      await api.updateFeedback(id, { status });
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function saveWeight(category, value) {
    const weight = Number(value);
    if (!(weight >= 0)) return;
    try {
      await api.setFeedbackCategoryWeight(category, weight);
      toast.success(`${category} weight updated — applies to future scores.`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function addAdvisor() {
    if (!newAdvisorId) return;
    try {
      await api.addFeedbackAdvisor(Number(newAdvisorId), null);
      setNewAdvisorId('');
      toast.success('Advisor added.');
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function removeAdvisor(userId) {
    try {
      await api.removeFeedbackAdvisor(userId);
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div style={{ ...styles.editorPane, overflowY: 'auto' }}>
      <div style={styles.editorHeader}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
          Feedback
        </div>
      </div>

      <div style={styles.editorBody}>
        {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        {/* Category weights — the "curated advisors weigh the real importance" mechanic */}
        <div style={styles.card}>
          <div style={{ ...label, marginBottom: '0.5rem' }}>Category Weights</div>
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
            Score = category weight × (1 + log2(1 + upvotes)). Feedback auto-routes to the backlog once its score clears 5.
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {(weights || []).map((w) => (
              <div key={w.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ ...label }}>{w.category}</div>
                <input
                  type="number" min="0" step="0.5" defaultValue={w.weight}
                  onBlur={(e) => saveWeight(w.category, e.target.value)}
                  style={{ width: '80px', background: 'var(--sb-navy-deep)', color: 'var(--sb-cream)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Advisors */}
        <div style={styles.card}>
          <div style={{ ...label, marginBottom: '0.5rem' }}>Advisors</div>
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
            Active advisors can also adjust category weights above, without full admin access.
          </div>
          {(advisors || []).filter((a) => a.is_active).map((a) => (
            <div key={a.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '0.5px solid rgba(196,132,58,0.12)' }}>
              <div style={{ color: 'var(--sb-cream)', fontSize: '0.82rem' }}>{a.display_name || a.email}</div>
              <button className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => removeAdvisor(a.user_id)}>Remove</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="number" placeholder="User ID" value={newAdvisorId} onChange={(e) => setNewAdvisorId(e.target.value)}
              style={{ background: 'var(--sb-navy-deep)', color: 'var(--sb-cream)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: '120px' }}
            />
            <button className="sb-btn sb-btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem' }} onClick={addAdvisor}>Add advisor</button>
          </div>
        </div>

        {/* Queue */}
        <div style={styles.card}>
          <div style={{ ...label, marginBottom: '0.5rem' }}>Queue — sorted by score</div>
          {queue === null && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}
          {queue && queue.length === 0 && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>No feedback yet.</div>}
          {(queue || []).map((f) => (
            <div key={f.id} style={{ padding: '0.6rem 0', borderBottom: '0.5px solid rgba(196,132,58,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ color: 'var(--sb-cream)', fontSize: '0.85rem', flex: 1 }}>{f.message}</div>
                <div style={{ color: 'var(--sb-gold)', fontSize: '0.82rem', fontFamily: 'var(--sb-font-label)', whiteSpace: 'nowrap' }}>{Number(f.score).toFixed(1)}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', alignItems: 'center', fontSize: '0.7rem', color: 'var(--sb-dusty)' }}>
                <span>{f.category}</span>
                {f.product_id && <span>· {f.product_id}</span>}
                <span>· {f.user_display_name || f.user_email}</span>
                <span>· {f.upvotes} upvote{f.upvotes === 1 ? '' : 's'}</span>
                <span style={{ color: STATUS_COLOR[f.status] || 'var(--sb-dusty)' }}>● {f.status}</span>
                {f.routed_backlog_item_id && <span>· backlog #{f.routed_backlog_item_id}</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {!f.routed_backlog_item_id && (
                  <button className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => route(f.id)}>Route to backlog</button>
                )}
                {f.status === 'new' && (
                  <button className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => setStatus(f.id, 'reviewing')}>Mark reviewing</button>
                )}
                {f.status !== 'archived' && (
                  <button className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => setStatus(f.id, 'archived')}>Archive</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
