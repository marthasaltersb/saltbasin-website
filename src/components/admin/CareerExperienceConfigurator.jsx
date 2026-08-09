import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TYPES = [
  ['period', 'Time periods', 'Define the date ranges used to assess changing proficiency.'],
  ['proficiency_level', 'Proficiency levels', 'Define the vocabulary and behavioral meaning of each level.'],
  ['rollup', 'Rollup policies', 'Define how skills and tools aggregate into capabilities and other groupings.'],
  ['display', 'Display views', 'Define how a saved rollup is presented and who may see it.'],
];

const input = { width: '100%', padding: '.55rem .65rem', border: '1px solid rgba(27,42,59,.18)', borderRadius: 7, background: '#fff', color: '#1b2a3b' };
const label = { display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#687078', marginBottom: '.25rem' };

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function Field({ title, children }) {
  return <label style={{ display: 'block' }}><span style={label}>{title}</span>{children}</label>;
}

function DefinitionFields({ item, update, definitions }) {
  const d = item.definition || {};
  const patch = (key, value) => update({ definition: { ...d, [key]: value } });
  if (item.type === 'period') return <div style={gridStyle}>
    <Field title="Start year"><input style={input} type="number" value={d.startYear ?? ''} onChange={(e) => patch('startYear', e.target.value ? Number(e.target.value) : null)} /></Field>
    <Field title="End year"><input style={input} type="number" value={d.endYear ?? ''} placeholder="Present" onChange={(e) => patch('endYear', e.target.value ? Number(e.target.value) : null)} /></Field>
  </div>;
  if (item.type === 'proficiency_level') return <div style={gridStyle}>
    <Field title="Ordinal"><input style={input} type="number" min="0" value={d.ordinal ?? 1} onChange={(e) => patch('ordinal', Number(e.target.value))} /></Field>
    <Field title="Evidence expectation"><input style={input} value={d.evidenceExpectation || ''} placeholder="Optional evidence guidance" onChange={(e) => patch('evidenceExpectation', e.target.value)} /></Field>
  </div>;
  if (item.type === 'rollup') {
    const periods = definitions.filter((x) => x.type === 'period' && x.isActive);
    const weights = { proficiency: 0.5, recency: 0.2, engagementBreadth: 0.15, evidenceConfidence: 0.15, ...(d.weights || {}) };
    const patchWeight = (key, value) => patch('weights', { ...weights, [key]: Number(value) });
    return <>
      <div style={gridStyle}>
        <Field title="Group by"><select style={input} value={d.groupBy || 'capability'} onChange={(e) => patch('groupBy', e.target.value)}>{['skill','tool','capability','category','domain','industry'].map((v) => <option key={v}>{v}</option>)}</select></Field>
        <Field title="Measure"><select style={input} value={d.measure || 'weighted_proficiency'} onChange={(e) => patch('measure', e.target.value)}>{['current_level','peak_level','sustained_level','weighted_proficiency','experience_duration','evidence_count'].map((v) => <option key={v}>{v}</option>)}</select></Field>
        <Field title="Minimum evidence"><input style={input} type="number" min="0" value={d.minimumEvidenceCount ?? 1} onChange={(e) => patch('minimumEvidenceCount', Number(e.target.value))} /></Field>
      </div>
      <Field title="Included periods"><div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', paddingTop: '.25rem' }}>{periods.map((p) => <label key={p.key} style={{ fontSize: '.78rem' }}><input type="checkbox" checked={(d.periodKeys || []).includes(p.key)} onChange={(e) => patch('periodKeys', e.target.checked ? [...(d.periodKeys || []), p.key] : (d.periodKeys || []).filter((k) => k !== p.key))} /> {p.label}</label>)}</div></Field>
      <div style={{ ...gridStyle, marginTop: '.65rem' }}>{Object.entries(weights).map(([key, value]) => <Field key={key} title={`${key} weight`}><input style={input} type="number" min="0" step="0.05" value={value} onChange={(e) => patchWeight(key, e.target.value)} /></Field>)}</div>
    </>;
  }
  const rollups = definitions.filter((x) => x.type === 'rollup' && x.isActive);
  return <><div style={gridStyle}>
    <Field title="Rollup"><select style={input} value={d.rollupKey || ''} onChange={(e) => patch('rollupKey', e.target.value)}><option value="">Select…</option>{rollups.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select></Field>
    <Field title="Visualization"><select style={input} value={d.chartType || 'bar'} onChange={(e) => patch('chartType', e.target.value)}>{['bar','radar','matrix','timeline','table'].map((v) => <option key={v}>{v}</option>)}</select></Field>
    <Field title="Visibility"><select style={input} value={d.visibility || 'private'} onChange={(e) => patch('visibility', e.target.value)}>{['private','resume','portfolio','public'].map((v) => <option key={v}>{v}</option>)}</select></Field>
    <Field title="Maximum groups"><input style={input} type="number" min="1" value={d.maxGroups ?? 8} onChange={(e) => patch('maxGroups', Number(e.target.value))} /></Field>
  </div><div style={{ display: 'flex', gap: '1rem', marginTop: '.65rem', fontSize: '.75rem' }}><label><input type="checkbox" checked={d.showEvidenceCount === true} onChange={(e) => patch('showEvidenceCount', e.target.checked)} /> Show evidence count</label><label><input type="checkbox" checked={d.showPeriodSelector === true} onChange={(e) => patch('showPeriodSelector', e.target.checked)} /> Show period selector</label></div></>;
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.65rem' };

export default function CareerExperienceConfigurator() {
  const [definitions, setDefinitions] = useState([]);
  const [workspace, setWorkspace] = useState('definitions');
  const [activeType, setActiveType] = useState('period');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [entities, setEntities] = useState([]);
  const [entityType, setEntityType] = useState('skill');
  const [assertions, setAssertions] = useState([]);
  const [rollupKey, setRollupKey] = useState('');
  const [preview, setPreview] = useState(null);

  const load = () => Promise.all([
    api.getCareerExperienceDefinitions(), api.listCareerSkills(), api.listCareerTools(), api.getCareerProficiencyAssertions(),
  ]).then(([defs, skills, tools, saved]) => {
    setDefinitions(defs.definitions || []);
    setEntities([
      ...(skills.items || []).map((x) => ({ type: 'skill', id: x.id, label: x.skill, category: x.category, evidenceCount: Number(x.numEngagements || 0) })),
      ...(tools.items || []).map((x) => ({ type: 'tool', id: x.id, label: x.currentName || x.nameUsed, category: x.category, evidenceCount: Number(x.numRoles || 0) })),
    ]);
    setAssertions(saved.assertions || []);
    const firstRollup = (defs.definitions || []).find((x) => x.type === 'rollup' && x.isActive);
    setRollupKey((current) => current || firstRollup?.key || '');
  }).catch((e) => toast(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => definitions.filter((d) => d.type === activeType).sort((a, b) => a.sortOrder - b.sortOrder), [definitions, activeType]);

  function update(type, key, patch) {
    setDefinitions((all) => all.map((d) => d.type === type && d.key === key ? { ...d, ...patch } : d));
  }

  async function save(item) {
    setBusyKey(`${item.type}:${item.key}`);
    try { await api.saveCareerExperienceDefinition(item.type, item.key, item); toast(`${item.label} saved`); await load(); }
    catch (e) { toast(e.message); }
    finally { setBusyKey(null); }
  }

  function add() {
    const n = visible.length + 1;
    const key = `new_${activeType}_${Date.now()}`;
    const definition = activeType === 'period' ? { startYear: null, endYear: null }
      : activeType === 'proficiency_level' ? { ordinal: n }
      : activeType === 'rollup' ? { groupBy: 'capability', measure: 'weighted_proficiency', periodKeys: [], minimumEvidenceCount: 1 }
      : { rollupKey: '', chartType: 'bar', visibility: 'private', maxGroups: 8 };
    setDefinitions((all) => [...all, { type: activeType, key, label: `New ${TYPES.find((t) => t[0] === activeType)[1].replace(/s$/, '')}`, description: '', definition, sortOrder: n * 10, isActive: true, isNew: true }]);
  }

  async function remove(item) {
    if (!window.confirm(`Remove “${item.label}”? Connected definitions may need to be updated.`)) return;
    if (!item.isNew) await api.deleteCareerExperienceDefinition(item.type, item.key);
    setDefinitions((all) => all.filter((d) => !(d.type === item.type && d.key === item.key)));
    toast(`${item.label} removed`);
  }

  async function setAssessment(entity, period, levelKey) {
    const existing = assertions.find((a) => a.entityType === entity.type && a.entityId === entity.id && a.periodKey === period.key);
    const assertionKey = `${entity.type}:${entity.id}:${period.key}`;
    setBusyKey(assertionKey);
    try {
      if (!levelKey) {
        await api.deleteCareerProficiencyAssertion(entity.type, entity.id, period.key);
        setAssertions((all) => all.filter((a) => !(a.entityType === entity.type && a.entityId === entity.id && a.periodKey === period.key)));
      } else {
        const body = {
          levelKey, confidence: existing?.confidence ?? 1,
          evidenceCount: existing?.evidenceCount ?? entity.evidenceCount,
          lastPracticedAt: existing?.lastPracticedAt ?? (period.key === 'current' ? Date.now() : null),
          visibility: existing?.visibility || 'private', assessmentSource: 'user_confirmed', notes: existing?.notes || '',
        };
        await api.saveCareerProficiencyAssertion(entity.type, entity.id, period.key, body);
        setAssertions((all) => [...all.filter((a) => !(a.entityType === entity.type && a.entityId === entity.id && a.periodKey === period.key)), { ...body, entityType: entity.type, entityId: entity.id, periodKey: period.key }]);
      }
      setPreview(null);
    } catch (e) { toast(e.message); }
    finally { setBusyKey(null); }
  }

  async function setAssertionVisibility(entity, period, visibility) {
    const existing = assertions.find((a) => a.entityType === entity.type && a.entityId === entity.id && a.periodKey === period.key);
    if (!existing?.levelKey) return;
    const assertionKey = `${entity.type}:${entity.id}:${period.key}`;
    setBusyKey(assertionKey);
    try {
      const body = { ...existing, visibility, assessmentSource: existing.assessmentSource || 'user_confirmed' };
      await api.saveCareerProficiencyAssertion(entity.type, entity.id, period.key, body);
      setAssertions((all) => all.map((a) => a === existing ? { ...a, visibility } : a));
      setPreview(null);
    } catch (e) { toast(e.message); }
    finally { setBusyKey(null); }
  }

  async function loadPreview() {
    if (!rollupKey) return;
    setBusyKey(`preview:${rollupKey}`);
    try { setPreview(await api.getCareerRollupPreview(rollupKey)); }
    catch (e) { toast(e.message); }
    finally { setBusyKey(null); }
  }

  const periods = definitions.filter((x) => x.type === 'period' && x.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const levels = definitions.filter((x) => x.type === 'proficiency_level' && x.isActive).sort((a, b) => Number(a.definition?.ordinal) - Number(b.definition?.ordinal));
  const rollups = definitions.filter((x) => x.type === 'rollup' && x.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) return <div style={{ padding: '1.1rem' }}>Loading configuration…</div>;

  return <div style={{ padding: '1.1rem', maxWidth: 1100, margin: '0 auto', color: '#1b2a3b' }}>
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 750 }}>Proficiency &amp; Rollup Configuration</div>
      <p style={{ margin: '.35rem 0 0', color: '#687078', fontSize: '.82rem', lineHeight: 1.55 }}>Configure the definitions first. Assessments, calculations, and public displays reference these stable definitions so terminology and behavior remain connected.</p>
    </div>
    <div style={{ display: 'flex', gap: '.45rem', marginBottom: '1rem' }}>{[['definitions','1 · Definitions'],['assess','2 · Assess proficiency'],['preview','3 · Preview rollups']].map(([id, title]) => <button key={id} onClick={() => setWorkspace(id)} style={{ padding: '.6rem .9rem', borderRadius: 8, cursor: 'pointer', border: workspace === id ? '1px solid #1b2a3b' : '1px solid rgba(27,42,59,.15)', color: workspace === id ? '#fff' : '#1b2a3b', background: workspace === id ? '#1b2a3b' : '#fff', fontWeight: 700 }}>{title}</button>)}</div>
    {workspace === 'definitions' && <>
    <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>{TYPES.map(([id, title]) => <button key={id} onClick={() => setActiveType(id)} style={{ padding: '.55rem .8rem', borderRadius: 8, cursor: 'pointer', border: activeType === id ? '1px solid #c4843a' : '1px solid rgba(27,42,59,.15)', background: activeType === id ? 'rgba(196,132,58,.12)' : '#fff', fontWeight: activeType === id ? 700 : 500 }}>{title}</button>)}</div>
    <div style={{ background: '#f5f2ed', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '.8rem', fontSize: '.78rem', color: '#687078' }}>{TYPES.find((t) => t[0] === activeType)?.[2]}</div>
    {visible.map((item) => <div key={`${item.type}:${item.key}`} style={{ background: '#fff', border: '1px solid rgba(27,42,59,.12)', borderRadius: 10, padding: '1rem', marginBottom: '.75rem', boxShadow: '0 2px 8px rgba(27,42,59,.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 2fr) auto', gap: '.65rem', alignItems: 'end', marginBottom: '.75rem' }}>
        <Field title="Label"><input style={input} value={item.label} onChange={(e) => update(item.type, item.key, { label: e.target.value, ...(item.isNew ? { key: slugify(e.target.value) || item.key } : {}) })} /></Field>
        <Field title="Definition"><input style={input} value={item.description || ''} onChange={(e) => update(item.type, item.key, { description: e.target.value })} /></Field>
        <label style={{ fontSize: '.78rem', paddingBottom: '.55rem' }}><input type="checkbox" checked={item.isActive} onChange={(e) => update(item.type, item.key, { isActive: e.target.checked })} /> Active</label>
      </div>
      <DefinitionFields item={item} definitions={definitions} update={(patch) => update(item.type, item.key, patch)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.85rem', alignItems: 'center' }}><code style={{ fontSize: '.67rem', color: '#7a8086' }}>{item.key}</code><div style={{ display: 'flex', gap: '.45rem' }}><button onClick={() => remove(item)} style={{ border: 0, background: 'transparent', color: '#a33', cursor: 'pointer' }}>Remove</button><button disabled={busyKey === `${item.type}:${item.key}` || !item.label.trim()} onClick={() => save(item)} style={{ border: 0, borderRadius: 7, background: '#1b2a3b', color: '#fff', padding: '.48rem .85rem', cursor: 'pointer' }}>{busyKey === `${item.type}:${item.key}` ? 'Saving…' : 'Save definition'}</button></div></div>
    </div>)}
    <button onClick={add} style={{ width: '100%', border: '1px dashed rgba(27,42,59,.25)', borderRadius: 9, background: 'rgba(255,255,255,.55)', padding: '.7rem', cursor: 'pointer', color: '#1b2a3b' }}>+ Add configurable definition</button>
    </>}
    {workspace === 'assess' && <>
      <div style={{ display: 'flex', gap: '.45rem', marginBottom: '.75rem' }}>{['skill','tool'].map((type) => <button key={type} onClick={() => setEntityType(type)} style={{ padding: '.5rem .8rem', borderRadius: 7, border: entityType === type ? '1px solid #c4843a' : '1px solid rgba(27,42,59,.15)', background: entityType === type ? 'rgba(196,132,58,.12)' : '#fff', textTransform: 'capitalize' }}>{type}s</button>)}</div>
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid rgba(27,42,59,.12)', borderRadius: 10 }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}><thead><tr><th style={th}>Career entity</th>{periods.map((p) => <th key={p.key} style={th}>{p.label}<div style={{ fontWeight: 400, fontSize: '.65rem' }}>{p.definition?.startYear || '…'}–{p.definition?.endYear || 'Present'}</div></th>)}</tr></thead><tbody>{entities.filter((e) => e.type === entityType).map((entity) => <tr key={`${entity.type}:${entity.id}`}><td style={td}><strong>{entity.label}</strong><div style={{ color: '#778087', fontSize: '.68rem' }}>{entity.category || 'Uncategorized'} · {entity.evidenceCount} evidence records</div></td>{periods.map((period) => { const saved = assertions.find((a) => a.entityType === entity.type && a.entityId === entity.id && a.periodKey === period.key); const key = `${entity.type}:${entity.id}:${period.key}`; return <td key={period.key} style={td}><select disabled={busyKey === key} style={{ ...input, minWidth: 135 }} value={saved?.levelKey || ''} onChange={(e) => setAssessment(entity, period, e.target.value)}><option value="">Not assessed</option>{levels.map((level) => <option key={level.key} value={level.key}>{level.label}</option>)}</select>{saved?.levelKey && <select aria-label="Assessment visibility" disabled={busyKey === key} style={{ ...input, minWidth: 135, marginTop: '.3rem', fontSize: '.68rem' }} value={saved.visibility || 'private'} onChange={(e) => setAssertionVisibility(entity, period, e.target.value)}>{['private','resume','portfolio','public'].map((v) => <option key={v} value={v}>{v}</option>)}</select>}</td>; })}</tr>)}</tbody></table></div>
      {entities.filter((e) => e.type === entityType).length === 0 && <div style={{ padding: '1rem', color: '#687078' }}>Add {entityType}s in Manual Intake before assessing proficiency.</div>}
    </>}
    {workspace === 'preview' && <>
      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'end', marginBottom: '1rem' }}><Field title="Rollup policy"><select style={{ ...input, minWidth: 260 }} value={rollupKey} onChange={(e) => { setRollupKey(e.target.value); setPreview(null); }}><option value="">Select…</option>{rollups.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select></Field><button onClick={loadPreview} disabled={!rollupKey || busyKey === `preview:${rollupKey}`} style={{ border: 0, borderRadius: 7, background: '#1b2a3b', color: '#fff', padding: '.58rem .9rem' }}>{busyKey === `preview:${rollupKey}` ? 'Calculating…' : 'Calculate preview'}</button></div>
      {preview && <div style={{ background: '#fff', border: '1px solid rgba(27,42,59,.12)', borderRadius: 10, padding: '1rem' }}><div style={{ fontWeight: 750, marginBottom: '.2rem' }}>{preview.label}</div><div style={{ color: '#687078', fontSize: '.72rem', marginBottom: '1rem' }}>{preview.groupBy} · {preview.measure} · {preview.inputs.assertionCount} assertions</div>{preview.groups.length ? preview.groups.map((g) => <div key={g.key} style={{ marginBottom: '.75rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.25rem' }}><span>{g.label}</span><strong>{g.value}{g.maxValue ? ` / ${g.maxValue}` : ''}</strong></div><div style={{ height: 10, borderRadius: 5, background: '#ece8e2', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, g.maxValue ? g.value / g.maxValue * 100 : g.value)}%`, background: 'linear-gradient(90deg,#1b5960,#c4843a)' }} /></div><div style={{ fontSize: '.65rem', color: '#7a8086', marginTop: '.2rem' }}>{g.assertionCount} assessments · {g.evidenceCount} evidence records</div></div>) : <div style={{ color: '#687078' }}>No assertions match this policy yet. Add assessments or lower its evidence threshold.</div>}</div>}
    </>}
  </div>;
}

const th = { textAlign: 'left', padding: '.7rem', background: '#f5f2ed', borderBottom: '1px solid rgba(27,42,59,.12)', fontSize: '.72rem' };
const td = { padding: '.6rem .7rem', borderBottom: '1px solid rgba(27,42,59,.08)', fontSize: '.78rem' };
