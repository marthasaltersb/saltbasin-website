/**
 * CareerMasterPanel — admin CRUD for the Career Master data model.
 *
 * Single source of truth for Betsy's resume/portfolio content: skills,
 * jobs, tools, engagements (case studies), and domains/niche-solutions/
 * ventures. Feeds the public timeline, industry wheel, case studies,
 * resume output templates, and the elevated public profile view.
 *
 * Mirrors BacklogPanel's admin-CRUD conventions: dedicated REST resource
 * per table, a table + add/edit modal per tab, idempotent seed button.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TIERS = ['Expert', 'Advanced', 'Proficient', 'Foundational'];
const WHEEL_BUCKETS = ['hands_on', 'integration_design', 'adjacent'];
const DOMAIN_GROUP_TYPES = ['domain', 'venture', 'niche_solution', 'industry', 'profile_meta'];

const TABS = [
  { id: 'skills', label: 'Skills' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'tools', label: 'Tools' },
  { id: 'engagements', label: 'Engagements' },
  { id: 'domains', label: 'Domains & Ventures' },
];

// ── field schemas drive both the table columns and the edit modal ────────
const SCHEMAS = {
  skills: {
    list: api.listCareerSkills, create: api.createCareerSkill, update: api.updateCareerSkill, delete: api.deleteCareerSkill,
    columns: [
      { key: 'skill', label: 'Skill' },
      { key: 'category', label: 'Category' },
      { key: 'tier', label: 'Tier' },
      { key: 'yearsExp', label: 'Yrs' },
      { key: 'numEngagements', label: '# Eng.' },
    ],
    fields: [
      { key: 'skill', label: 'Skill', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'tier', label: 'Proficiency Tier', type: 'select', options: TIERS },
      { key: 'yearsExp', label: 'Years Experience', type: 'number' },
      { key: 'numEngagements', label: '# Engagements', type: 'number' },
      { key: 'firstUsed', label: 'First Used (Year)', type: 'number' },
      { key: 'resumeLanguage', label: 'Suggested Resume Language', type: 'textarea' },
    ],
  },
  jobs: {
    list: api.listCareerJobs, create: api.createCareerJob, update: api.updateCareerJob, delete: api.deleteCareerJob,
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'title', label: 'Title' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'industry', label: 'Industry' },
    ],
    fields: [
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'startDate', label: 'Start Date', type: 'text' },
      { key: 'endDate', label: 'End Date', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'salary', label: 'Base Salary', type: 'text' },
      { key: 'jobFunction', label: 'Function', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'keyMetrics', label: 'Key Metrics & Achievements', type: 'textarea' },
    ],
  },
  tools: {
    list: api.listCareerTools, create: api.createCareerTool, update: api.updateCareerTool, delete: api.deleteCareerTool,
    columns: [
      { key: 'nameUsed', label: 'Name Used' },
      { key: 'currentName', label: 'Current Name' },
      { key: 'category', label: 'Category' },
      { key: 'tier', label: 'Tier' },
      { key: 'numRoles', label: '# Roles' },
    ],
    fields: [
      { key: 'nameUsed', label: 'Name When Used', type: 'text' },
      { key: 'currentName', label: 'Current Name (if renamed)', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'tier', label: 'Proficiency Tier', type: 'select', options: TIERS },
      { key: 'firstUsed', label: 'First Used (Year)', type: 'number' },
      { key: 'numRoles', label: '# Roles', type: 'number' },
      { key: 'wheelBucket', label: 'Industry Wheel Bucket (blank = derive from tier)', type: 'select', options: ['', ...WHEEL_BUCKETS] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  engagements: {
    list: api.listCareerEngagements, create: api.createCareerEngagement, update: api.updateCareerEngagement, delete: api.deleteCareerEngagement,
    columns: [
      { key: 'clientDisplayName', label: 'Client / Project' },
      { key: 'employer', label: 'Employer' },
      { key: 'industry', label: 'Industry' },
      { key: 'period', label: 'Period' },
      { key: 'publishCaseStudy', label: 'Published', render: (v) => (v === false ? 'Hidden' : 'Published') },
    ],
    fields: [
      { key: 'name', label: 'Internal Name', type: 'text' },
      { key: 'employer', label: 'Employer (matches a Job company)', type: 'text' },
      { key: 'clientDisplayName', label: 'Client Display Name (public)', type: 'text' },
      { key: 'clientNameReal', label: 'Client Real Name (private — never shown publicly)', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'scale', label: 'Scale', type: 'text' },
      { key: 'roles', label: 'Roles (one per line)', type: 'array' },
      { key: 'context', label: 'Business Context / Problem', type: 'textarea' },
      { key: 'actions', label: 'What Betsy Did', type: 'textarea' },
      { key: 'outcomes', label: 'Business Outcomes (one per line)', type: 'array' },
      { key: 'metrics', label: 'Key Metrics (one per line)', type: 'array' },
      { key: 'testimonial', label: 'Testimonial Quote', type: 'textarea' },
      { key: 'testimonialAttr', label: 'Testimonial Attribution', type: 'text' },
      { key: 'scenarios', label: 'Scenario Tags (one per line)', type: 'array' },
      { key: 'publishCaseStudy', label: 'Published to public case studies', type: 'checkbox' },
      { key: 'investmentType', label: 'Deal — Investment Type (Vista only)', type: 'text' },
      { key: 'acquiredDetail', label: 'Deal — Acquired Detail', type: 'text' },
      { key: 'exitDetail', label: 'Deal — Exit Detail', type: 'text' },
      { key: 'financialReturn', label: 'Deal — Financial Return', type: 'text' },
      { key: 'outcomeStatus', label: 'Deal — Outcome Status', type: 'text' },
    ],
  },
  domains: {
    list: api.listCareerDomains, create: api.createCareerDomain, update: api.updateCareerDomain, delete: api.deleteCareerDomain,
    columns: [
      { key: 'groupType', label: 'Group' },
      { key: 'title', label: 'Title' },
      { key: 'icon', label: 'Icon' },
      { key: 'accentColor', label: 'Color' },
    ],
    fields: [
      { key: 'groupType', label: 'Group Type', type: 'select', options: DOMAIN_GROUP_TYPES },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'icon', label: 'Icon (single glyph)', type: 'text' },
      { key: 'accentColor', label: 'Accent Color (hex)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'items', label: 'Sub-items / bullets (one per line)', type: 'array' },
      { key: 'extra', label: 'Extra (raw JSON — venture/profile_meta metadata)', type: 'json' },
    ],
  },
};

const S = {
  wrap: { padding: '1.5rem', maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--sb-font-body)' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '1.25rem' },
  tabBar: { display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' },
  tabBtn: (active) => ({
    padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.04em',
    background: active ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.06)',
    color: active ? 'white' : '#333', fontWeight: active ? 700 : 500,
  }),
  btn: (style) => ({
    padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : style === 'danger' ? '#c44' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' || style === 'danger' ? 'white' : '#333',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: 'white', borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.1)' },
  th: { textAlign: 'left', padding: '0.55rem 0.75rem', background: 'rgba(0,0,0,0.04)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777', fontWeight: 700 },
  td: { padding: '0.55rem 0.75rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', color: '#333' },
  row: { cursor: 'pointer' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', minHeight: 90, padding: '0.65rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem', display: 'block' },
  field: { marginBottom: '0.85rem' },
};

function Field({ f, value, onChange }) {
  if (f.type === 'select') {
    return (
      <select style={S.input} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => <option key={o} value={o}>{o || '(none)'}</option>)}
      </select>
    );
  }
  if (f.type === 'textarea') {
    return <textarea style={S.textarea} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  if (f.type === 'array') {
    return <textarea style={S.textarea} value={Array.isArray(value) ? value.join('\n') : ''} onChange={(e) => onChange(e.target.value.split('\n').filter((l) => l.trim().length > 0))} />;
  }
  if (f.type === 'json') {
    return (
      <textarea
        style={S.textarea}
        defaultValue={JSON.stringify(value ?? {}, null, 2)}
        onBlur={(e) => {
          try { onChange(JSON.parse(e.target.value || '{}')); } catch { toast('Invalid JSON — change not applied'); }
        }}
      />
    );
  }
  if (f.type === 'checkbox') {
    return <input type="checkbox" checked={value !== false} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sb-gold, #c4843a)' }} />;
  }
  if (f.type === 'number') {
    return <input style={S.input} type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
  }
  return <input style={S.input} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

function EditModal({ schema, item, onSave, onDelete, onClose, saving }) {
  const [draft, setDraft] = useState(item);
  const isNew = !item.id;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: '1.75rem', width: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '1rem' }}>
          {isNew ? 'Add' : 'Edit'} Entry
        </div>
        {schema.fields.map((f) => (
          <div key={f.key} style={S.field}>
            <label style={S.label}>{f.label}</label>
            <Field f={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div>
            {!isNew && <button style={S.btn('danger')} onClick={() => onDelete(item.id)} disabled={saving}>Delete</button>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={S.btn('outline')} onClick={onClose} disabled={saving}>Cancel</button>
            <button style={S.btn('gold')} onClick={() => onSave(draft)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CareerMasterPanel() {
  const [activeTab, setActiveTab] = useState('skills');
  const [rows, setRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { key, item } or null
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const entries = await Promise.all(TABS.map(async (t) => [t.id, (await SCHEMAS[t.id].list()).items || []]));
      setRows(Object.fromEntries(entries));
    } catch (e) {
      toast('Failed to load career master data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  const totalRows = useMemo(() => Object.values(rows).reduce((sum, arr) => sum + (arr?.length || 0), 0), [rows]);

  async function handleSeed() {
    try {
      const result = await api.seedCareerMaster();
      if (result.skipped) toast('Already populated — nothing to seed');
      else toast(`Seeded ${result.seeded?.skills ?? 0} skills · ${result.seeded?.jobs ?? 0} jobs · ${result.seeded?.tools ?? 0} tools · ${result.seeded?.engagements ?? 0} engagements · ${result.seeded?.domains ?? 0} domains`);
      loadAll();
    } catch (e) {
      toast('Seed failed: ' + e.message);
    }
  }

  async function handleSave(draft) {
    const schema = SCHEMAS[activeTab];
    setSaving(true);
    try {
      if (draft.id) {
        await schema.update(draft.id, draft);
      } else {
        await schema.create(draft);
      }
      setEditing(null);
      await loadAll();
      toast('Saved');
    } catch (e) {
      toast('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    const schema = SCHEMAS[activeTab];
    setSaving(true);
    try {
      await schema.delete(id);
      setEditing(null);
      await loadAll();
      toast('Deleted');
    } catch (e) {
      toast('Delete failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const schema = SCHEMAS[activeTab];
  const activeRows = rows[activeTab] || [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--sb-ivory, #faf8f4)' }}>
      <div style={S.wrap}>
        <div style={S.h1}>Career Master</div>
        <div style={S.sub}>
          Single source of truth for skills, jobs, tools, and engagements — feeds the public timeline, industry wheel, case studies, and resume outputs.
          {!loading && totalRows === 0 && ' Tables are empty — seed the initial dataset to get started.'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={S.tabBar}>
            {TABS.map((t) => (
              <button key={t.id} style={S.tabBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
                {t.label} ({(rows[t.id] || []).length})
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {totalRows === 0 && !loading && <button style={S.btn('gold')} onClick={handleSeed}>✦ Seed Initial Data</button>}
            <button style={S.btn('navy')} onClick={() => setEditing({ item: {} })}>+ Add</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>Loading…</div>
        ) : activeRows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem', background: 'white', borderRadius: 10, border: '0.5px dashed rgba(0,0,0,0.15)' }}>
            No entries yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {schema.columns.map((c) => <th key={c.key} style={S.th}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row) => (
                  <tr key={row.id} style={S.row} onClick={() => setEditing({ item: row })}>
                    {schema.columns.map((c) => (
                      <td key={c.key} style={S.td}>
                        {c.render ? c.render(row[c.key]) : (row[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          schema={schema}
          item={editing.item}
          saving={saving}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
