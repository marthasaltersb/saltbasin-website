import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const RELATIONSHIP_TYPES = ['contact', 'member', 'prospect', 'reference', 'partner', 'lead'];
const STATUS_COLORS = { new: '#C4843A', acknowledged: '#4A7C8E', fulfilled: '#A8B89A', declined: '#C44A4A' };

function SectionHeader({ title }) {
  return (
    <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)' }}>{title}</div>
  );
}

function ContactForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', org_name: '', role_title: '', relationship_type: 'contact', notes: '', ...initial });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(ev) {
    ev.preventDefault();
    try { await onSave(form); } catch (e) { toast.error(e.message); }
  }

  const inp = (label, key, type = 'text') => (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      <input type={type} value={form[key]} onChange={set(key)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(139,155,174,0.25)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)' }} />
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        {inp('First Name', 'first_name')}
        {inp('Last Name', 'last_name')}
      </div>
      {inp('Email', 'email', 'email')}
      {inp('Organization', 'org_name')}
      {inp('Role / Title', 'role_title')}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' }}>Relationship Type</label>
        <select value={form.relationship_type} onChange={set('relationship_type')} style={{ width: '100%', background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(139,155,174,0.25)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem' }}>
          {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(139,155,174,0.25)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'var(--sb-font-body)' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" style={{ padding: '0.5rem 1.25rem', background: 'var(--sb-gold)', color: 'var(--sb-ivory)', border: 'none', borderRadius: 2, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>Save</button>
        <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--sb-dusty)', border: '0.5px solid rgba(139,155,174,0.3)', borderRadius: 2, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
}

export default function NrmPanel({ isAdmin = true }) {
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('contacts');
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        fetch('/api/nrm/contacts', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/nrm/reference-requests', { credentials: 'include' }).then(r => r.json()),
      ]);
      setContacts(cRes.contacts || []);
      setRequests(rRes.requests || []);
    } catch (e) {
      toast.error('Failed to load network data');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveContact(form) {
    const url = editContact ? `/api/nrm/contacts/${editContact.id}` : '/api/nrm/contacts';
    const method = editContact ? 'PUT' : 'POST';
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    toast.success(editContact ? 'Contact updated' : 'Contact added');
    setShowForm(false);
    setEditContact(null);
    load();
  }

  async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;
    await fetch(`/api/nrm/contacts/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Contact deleted');
    load();
  }

  async function updateReqStatus(id, status) {
    await fetch(`/api/nrm/reference-requests/${id}/status`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    toast.success('Status updated');
    load();
  }

  const filtered = contacts.filter(c => {
    if (typeFilter !== 'all' && c.relationship_type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.first_name, c.last_name, c.email, c.org_name, c.role_title].some(f => f?.toLowerCase().includes(q));
  });

  const tabBtn = (id, label, count) => (
    <button onClick={() => setTab(id)} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', background: tab === id ? 'rgba(196,132,58,0.15)' : 'transparent', color: tab === id ? 'var(--sb-gold)' : 'var(--sb-dusty)', border: `0.5px solid ${tab === id ? 'rgba(196,132,58,0.35)' : 'transparent'}`, borderRadius: 2, cursor: 'pointer' }}>
      {label}{count != null ? ` (${count})` : ''}
    </button>
  );

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>Network Relationship Manager</div>
        <div style={{ fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300 }}>{isAdmin ? 'Network Hub' : 'My Network'}</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabBtn('contacts', 'Contacts', contacts.length)}
        {tabBtn('requests', 'Reference Requests', requests.filter(r => r.status === 'new').length || null)}
        {isAdmin && tabBtn('network', 'Opted-in Members')}
      </div>

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}

      {!loading && tab === 'contacts' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
            <input
              placeholder="Search contacts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(139,155,174,0.25)', borderRadius: 2, padding: '0.45rem 0.75rem', color: 'var(--sb-cream)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)' }}
            />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(139,155,174,0.25)', borderRadius: 2, padding: '0.45rem 0.75rem', color: 'var(--sb-cream)', fontSize: '0.8rem' }}>
              <option value="all">All types</option>
              {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => { setShowForm(true); setEditContact(null); }} style={{ padding: '0.45rem 1rem', background: 'var(--sb-gold)', color: 'var(--sb-ivory)', border: 'none', borderRadius: 2, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>+ Add Contact</button>
          </div>

          {showForm && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', marginBottom: '1rem' }}>{editContact ? 'Edit Contact' : 'New Contact'}</div>
              <ContactForm initial={editContact || {}} onSave={saveContact} onCancel={() => { setShowForm(false); setEditContact(null); }} />
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1.5rem 0' }}>No contacts found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filtered.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)' }}>{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: '0.15rem' }}>{[c.role_title, c.org_name].filter(Boolean).join(' · ') || c.email || ''}</div>
                  </div>
                  <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 2, background: 'rgba(74,124,142,0.2)', color: 'var(--sb-teal)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.relationship_type}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setEditContact(c); setShowForm(true); }} style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', background: 'transparent', border: '0.5px solid rgba(139,155,174,0.3)', borderRadius: 2, color: 'var(--sb-dusty)', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteContact(c.id)} style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', background: 'transparent', border: '0.5px solid rgba(196,68,68,0.3)', borderRadius: 2, color: 'var(--sb-risk-critical)', cursor: 'pointer' }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'requests' && (
        <>
          <SectionHeader title={`Reference Requests — ${requests.length} total`} />
          {requests.length === 0 ? (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>No reference requests yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {requests.map(r => (
                <div key={r.id} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', border: `0.5px solid rgba(255,255,255,0.06)`, borderLeft: `3px solid ${STATUS_COLORS[r.status] || 'var(--sb-dusty)'}`, borderRadius: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)' }}>{r.requester_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>{r.requester_email}{r.requester_org ? ` · ${r.requester_org}` : ''}</div>
                    </div>
                    <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 2, background: 'rgba(255,255,255,0.06)', color: STATUS_COLORS[r.status] || 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{r.status}</span>
                  </div>
                  {r.context && <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)', fontStyle: 'italic', marginBottom: '0.5rem' }}>"{r.context}"</div>}
                  {r.target_name && <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>For: {r.target_name}</div>}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                    {['acknowledged', 'fulfilled', 'declined'].map(s => (
                      <button key={s} disabled={r.status === s} onClick={() => updateReqStatus(r.id, s)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.62rem', background: 'transparent', border: `0.5px solid ${r.status === s ? 'var(--sb-gold)' : 'rgba(139,155,174,0.3)'}`, borderRadius: 2, color: r.status === s ? 'var(--sb-gold)' : 'var(--sb-dusty)', cursor: r.status === s ? 'default' : 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'network' && isAdmin && <OptedInMembers />}
    </div>
  );
}

function OptedInMembers() {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    fetch('/api/nrm/opted-in-members', { credentials: 'include' }).then(r => r.json()).then(d => setMembers(d.members || []));
  }, []);

  return (
    <div>
      <SectionHeader title={`Opted-in Network Members — ${members.length}`} />
      {members.length === 0 ? (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>No members have opted in to network visibility yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)' }}>{m.display_name || m.email}</div>
                {m.network_bio && <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: '0.15rem' }}>{m.network_bio}</div>}
              </div>
              {m.slug && <a href={`/u/${m.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--sb-gold)', textDecoration: 'none' }}>View Profile →</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
