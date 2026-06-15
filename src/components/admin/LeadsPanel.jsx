import React, { useEffect, useState } from 'react';
import { styles } from './adminStyles.js';
import { toast } from '../../lib/toast.js';

const SOURCE_LABELS = {
  joinNetwork: 'Join the Network',
  forCompanies: 'For Companies',
  assessments: 'Assessments',
  contact: 'Contact',
  manual: 'Manual',
};

const JOB_STATUS_LABELS = { new: 'New', applied: 'Applied', interviewing: 'Interviewing', rejected: 'Rejected', offer: 'Offer' };
const JOB_STATUS_COLORS = { new: '#888', applied: '#c4843a', interviewing: '#02a1a6', rejected: '#c44', offer: '#5a9a5a' };

const S = {
  input: { padding: '0.45rem 0.75rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' },
  label: { fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4, display: 'block', fontFamily: 'var(--sb-font-label)' },
  row: { marginBottom: '0.85rem' },
};

export default function LeadsPanel() {
  const [leads, setLeads] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', name: '', phone: '', message: '', leadType: 'network', skipEmail: false, jobDescription: '', jobUrl: '', company: '', hiringManager: '', jobStatus: 'new' });
  const [creating, setCreating] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // all | network | job

  async function load() {
    try {
      const res = await fetch('/api/leads', { credentials: 'include' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Load failed');
      setLeads(body.leads);
    } catch (e) {
      toast('Load failed: ' + e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this lead permanently?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
    setSelectedId(null);
  }

  async function createLead(e) {
    e.preventDefault();
    if (!createForm.email) return toast.error('Email required');
    setCreating(true);
    try {
      const r = await fetch('/api/leads/admin-create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      toast.success('Lead created');
      setShowCreate(false);
      setCreateForm({ email: '', name: '', phone: '', message: '', leadType: 'network', skipEmail: false, jobDescription: '', jobUrl: '', company: '', hiringManager: '', jobStatus: 'new' });
      load();
    } catch (err) {
      toast.error('Create failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  function exportCsv() {
    if (!leads?.length) return toast('No leads to export');
    const headers = ['id', 'type', 'source', 'email', 'name', 'company', 'job_status', 'message', 'created_at'];
    const rows = leads.map((l) => [
      l.id, l.lead_type || 'network', l.source, l.email, l.name || '',
      l.company || '', l.job_status || '',
      l.message || '', new Date(l.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!leads) return null;
  const filteredLeads = typeFilter === 'all' ? leads : leads.filter(l => (l.lead_type || 'network') === typeFilter);
  const selected = leads.find((l) => l.id === selectedId);
  const jobLeadCount = leads.filter(l => l.lead_type === 'job').length;
  const networkLeadCount = leads.filter(l => !l.lead_type || l.lead_type === 'network').length;

  return (
    <div style={{ ...styles.editorPane, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={styles.editorHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
            Leads · {leads.length}
            {jobLeadCount > 0 && <span style={{ marginLeft: 8, color: 'var(--sb-teal-deep)' }}>{jobLeadCount} job</span>}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)', marginTop: 2 }}>Captured from public forms or added manually.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={load}>Refresh</button>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={exportCsv}>Export CSV</button>
          <button className="sb-btn" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem', background: 'var(--sb-gold)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Cancel' : '+ Add Lead'}
          </button>
        </div>
      </div>

      {/* Create lead form */}
      {showCreate && (
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.2)', background: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={createLead}>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.85rem' }}>New Lead</div>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
              {['network', 'job'].map(t => (
                <button key={t} type="button"
                  style={{ padding: '0.3rem 0.85rem', borderRadius: 6, border: createForm.leadType === t ? '1.5px solid var(--sb-gold)' : '0.5px solid rgba(255,255,255,0.12)', background: createForm.leadType === t ? 'rgba(196,132,58,0.15)' : 'transparent', color: createForm.leadType === t ? 'var(--sb-gold)' : 'var(--sb-dusty)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  onClick={() => setCreateForm(f => ({ ...f, leadType: t }))}>
                  {t === 'job' ? 'Job Lead' : 'Network Lead'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div style={S.row}>
                <label style={S.label}>Email *</label>
                <input style={S.input} type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@company.com" />
              </div>
              <div style={S.row}>
                <label style={S.label}>Name</label>
                <input style={S.input} value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
              </div>
            </div>

            {createForm.leadType === 'job' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div style={S.row}>
                    <label style={S.label}>Company *</label>
                    <input style={S.input} value={createForm.company} onChange={e => setCreateForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
                  </div>
                  <div style={S.row}>
                    <label style={S.label}>Hiring Manager</label>
                    <input style={S.input} value={createForm.hiringManager} onChange={e => setCreateForm(f => ({ ...f, hiringManager: e.target.value }))} placeholder="Name + contact info" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div style={S.row}>
                    <label style={S.label}>Job URL</label>
                    <input style={S.input} value={createForm.jobUrl} onChange={e => setCreateForm(f => ({ ...f, jobUrl: e.target.value }))} placeholder="https://company.com/jobs/..." />
                  </div>
                  <div style={S.row}>
                    <label style={S.label}>Status</label>
                    <select style={S.input} value={createForm.jobStatus} onChange={e => setCreateForm(f => ({ ...f, jobStatus: e.target.value }))}>
                      {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={S.row}>
                  <label style={S.label}>Job Description</label>
                  <textarea style={{ ...S.textarea, minHeight: 100 }} value={createForm.jobDescription} onChange={e => setCreateForm(f => ({ ...f, jobDescription: e.target.value }))} placeholder="Paste job description…" />
                </div>
              </>
            ) : (
              <div style={S.row}>
                <label style={S.label}>Phone</label>
                <input style={S.input} value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
              </div>
            )}

            <div style={S.row}>
              <label style={S.label}>Notes / Message</label>
              <textarea style={{ ...S.textarea, minHeight: 70 }} value={createForm.message} onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))} placeholder="Optional notes about this lead…" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--sb-dusty)', cursor: 'pointer' }}>
                <input type="checkbox" checked={createForm.skipEmail} onChange={e => setCreateForm(f => ({ ...f, skipEmail: e.target.checked }))} style={{ accentColor: 'var(--sb-gold)' }} />
                Skip confirmation email
              </label>
              <button type="submit" disabled={creating} style={{ padding: '0.45rem 1.25rem', borderRadius: 6, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>
                {creating ? 'Adding…' : 'Add Lead'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid rgba(196,132,58,0.15)', padding: '0 1rem' }}>
        {[['all', `All (${leads.length})`], ['network', `Network (${networkLeadCount})`], ['job', `Job (${jobLeadCount})`]].map(([v, l]) => (
          <button key={v} onClick={() => setTypeFilter(v)}
            style={{ padding: '0.45rem 0.85rem', border: 'none', borderBottom: typeFilter === v ? '2px solid var(--sb-gold)' : '2px solid transparent', background: 'transparent', color: typeFilter === v ? 'var(--sb-gold)' : 'var(--sb-dusty)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Lead list */}
        <div style={{ width: 380, borderRight: '0.5px solid rgba(196,132,58,0.15)', overflowY: 'auto' }}>
          {filteredLeads.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
              No leads yet.
            </div>
          )}
          {filteredLeads.map((l) => {
            const active = l.id === selectedId;
            const isJob = l.lead_type === 'job';
            return (
              <div key={l.id} onClick={() => setSelectedId(l.id)}
                style={{ padding: '0.85rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.1)', cursor: 'pointer', background: active ? 'rgba(196,132,58,0.1)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: isJob ? 'var(--sb-teal-deep)' : 'var(--sb-gold)' }}>
                      {isJob ? 'Job' : (SOURCE_LABELS[l.source] || l.source)}
                    </div>
                    {isJob && l.job_status && (
                      <span style={{ fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: JOB_STATUS_COLORS[l.job_status] || '#888', border: `0.5px solid ${JOB_STATUS_COLORS[l.job_status] || '#888'}`, borderRadius: 2, padding: '1px 5px' }}>
                        {JOB_STATUS_LABELS[l.job_status] || l.job_status}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--sb-teal-deep)' }}>#{l.public_id || l.id}</div>
                </div>
                {isJob && l.company && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sb-cream)', marginBottom: 2 }}>{l.company}</div>
                )}
                <div style={{ fontSize: isJob ? '0.78rem' : '0.88rem', fontWeight: isJob ? 400 : 500, color: isJob ? 'var(--sb-dusty)' : 'var(--sb-cream)', wordBreak: 'break-all' }}>{l.email}</div>
                {l.name && <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: 2 }}>{l.name}</div>}
                <div style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)', marginTop: 4 }}>{new Date(l.created_at).toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {selected ? (
            <LeadDetail lead={selected} onDelete={() => remove(selected.id)} onUpdate={load} />
          ) : (
            <div style={{ color: 'var(--sb-dusty)', textAlign: 'center', padding: '3rem' }}>
              {typeFilter === 'job' ? '← Pick a job lead to inspect' : '← Pick a lead to inspect'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onDelete, onUpdate }) {
  const leadUrl = lead.public_id ? `/lead/${lead.public_id}` : null;
  const isJob = lead.lead_type === 'job';
  const [editing, setEditing] = useState(false);
  const [jobForm, setJobForm] = useState({ jobStatus: lead.job_status || 'new', company: lead.company || '', hiringManager: lead.hiring_manager || '', jobUrl: lead.job_url || '', jobDescription: lead.job_description || '' });
  const [saving, setSaving] = useState(false);

  async function saveJob() {
    setSaving(true);
    try {
      const r = await fetch(`/api/leads/${lead.id}/job`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });
      if (!r.ok) throw new Error('Save failed');
      onUpdate();
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="sb-eyebrow" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isJob ? 'Job Lead' : (SOURCE_LABELS[lead.source] || lead.source)}
            {isJob && lead.job_status && (
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: JOB_STATUS_COLORS[lead.job_status] || '#888', border: `0.5px solid ${JOB_STATUS_COLORS[lead.job_status] || '#888'}`, borderRadius: 2, padding: '1px 6px' }}>
                {JOB_STATUS_LABELS[lead.job_status] || lead.job_status}
              </span>
            )}
          </div>
          <h2 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', letterSpacing: '0.04em' }}>
            {isJob && lead.company ? lead.company : `Lead #${lead.public_id || lead.id}`}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isJob && <button onClick={() => setEditing(v => !v)} className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>Edit Job Info</button>}
          {leadUrl && <a href={leadUrl} target="_blank" rel="noreferrer" className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>View as lead ↗</a>}
          <button onClick={onDelete} className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem', borderColor: 'var(--sb-risk-critical)', color: 'var(--sb-risk-critical)' }}>Delete</button>
        </div>
      </div>

      <Section label="Email" value={lead.email} />
      <Section label="Name" value={lead.name || '—'} />
      <Section label="Submitted" value={new Date(lead.created_at).toLocaleString()} />

      {/* Job-specific fields */}
      {isJob && !editing && (
        <div style={{ marginTop: '1rem', background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 6, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>Job Details</div>
          <Section label="Company" value={lead.company || '—'} />
          <Section label="Hiring Manager" value={lead.hiring_manager || '—'} />
          {lead.job_url && <Section label="Job URL" value={<a href={lead.job_url} target="_blank" rel="noreferrer" style={{ color: 'var(--sb-teal-deep)' }}>{lead.job_url}</a>} />}
          {lead.job_description && (
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: 2 }}>Job Description</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: 4 }}>{lead.job_description}</div>
            </div>
          )}
        </div>
      )}

      {/* Job edit form */}
      {isJob && editing && (
        <div style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 6, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>Edit Job Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
            <div><label style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', display: 'block', marginBottom: 3 }}>Status</label>
              <select value={jobForm.jobStatus} onChange={e => setJobForm(f => ({ ...f, jobStatus: e.target.value }))}
                style={{ padding: '0.4rem 0.6rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.8rem', width: '100%' }}>
                {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', display: 'block', marginBottom: 3 }}>Company</label>
              <input value={jobForm.company} onChange={e => setJobForm(f => ({ ...f, company: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '0.65rem' }}><label style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', display: 'block', marginBottom: 3 }}>Hiring Manager</label>
            <input value={jobForm.hiringManager} onChange={e => setJobForm(f => ({ ...f, hiringManager: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '0.65rem' }}><label style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', display: 'block', marginBottom: 3 }}>Job URL</label>
            <input value={jobForm.jobUrl} onChange={e => setJobForm(f => ({ ...f, jobUrl: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} placeholder="https://..." />
          </div>
          <div style={{ marginBottom: '0.85rem' }}><label style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', display: 'block', marginBottom: 3 }}>Job Description</label>
            <textarea value={jobForm.jobDescription} onChange={e => setJobForm(f => ({ ...f, jobDescription: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box', minHeight: 100, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveJob} disabled={saving} style={{ padding: '0.4rem 1rem', borderRadius: 5, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} style={{ padding: '0.4rem 1rem', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--sb-dusty)', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {!isJob && (
        <>
          <Section label="Phone" value={lead.phone || '—'} />
          <Section label="Original message" value={lead.message || '—'} />
        </>
      )}

      {!isJob && lead.answers && Object.keys(lead.answers).length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.62rem', letterSpacing: '0.16em', marginBottom: '0.6rem' }}>Captured Answers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(lead.answers).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 'var(--sb-radius)', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', whiteSpace: 'pre-wrap' }}>{String(v) || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, value }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.6rem', letterSpacing: '0.16em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', color: 'var(--sb-cream)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}
