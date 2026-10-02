// Proficiency rules & "why this level" (2026-10-02) — the screen for the
// rules the proficiency engine reads (server/lib/careerProficiencyEngine.js):
// which formula is in use, the member's own formulas, certification →
// skill/tool bonus mappings, and a per-skill/tool table showing the level,
// its basis, the points behind it, what the Salt Basin methodology alone
// would say, and a one-click override.
//
// Every rule is a career_experience_definitions row saved through the same
// /api/career/experience-definitions routes the rest of Proficiency &
// Rollups uses; overrides are 'current'-period proficiency assertions.
// Self-contained (props: onChanged) so it can sit in Career Master's
// Proficiency & Rollups and in the Output Template editor beside a live
// preview.
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const METHODOLOGY_KEY = 'salt_basin_methodology';
const BASIS_LABEL = {
  salt_basin_methodology: { text: 'Salt Basin methodology', color: '#2F7A5B', bg: 'rgba(47,154,104,.12)' },
  member_formula: { text: 'Your formula †', color: '#8A5A12', bg: 'rgba(201,131,32,.14)' },
  member_override: { text: 'Your override †', color: '#8A5A12', bg: 'rgba(201,131,32,.14)' },
};

const input = { width: '100%', padding: '.45rem .55rem', border: '1px solid rgba(27,42,59,.18)', borderRadius: 7, background: '#fff', color: '#1b2a3b', fontSize: '.8rem', boxSizing: 'border-box' };
const card = { background: '#fff', border: '1px solid rgba(27,42,59,.12)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' };
const h = { fontSize: '.95rem', fontWeight: 750, marginBottom: '.25rem' };
const sub = { fontSize: '.76rem', color: '#687078', lineHeight: 1.5, margin: '0 0 .75rem' };
const th = { textAlign: 'left', padding: '.5rem .6rem', background: '#f5f2ed', borderBottom: '1px solid rgba(27,42,59,.12)', fontSize: '.7rem' };
const td = { padding: '.5rem .6rem', borderBottom: '1px solid rgba(27,42,59,.08)', fontSize: '.78rem', verticalAlign: 'top' };
const btn = (kind = 'navy') => ({
  border: kind === 'ghost' ? '1px solid rgba(27,42,59,.2)' : 0, borderRadius: 7, cursor: 'pointer', padding: '.42rem .8rem', fontSize: '.76rem',
  background: kind === 'navy' ? '#1b2a3b' : kind === 'gold' ? '#c4843a' : '#fff', color: kind === 'ghost' ? '#1b2a3b' : '#fff',
});

function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
}

function Badge({ basis }) {
  const b = BASIS_LABEL[basis] || BASIS_LABEL.salt_basin_methodology;
  return <span style={{ display: 'inline-block', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.66rem', fontWeight: 700, color: b.color, background: b.bg, whiteSpace: 'nowrap' }}>{b.text}</span>;
}

function FormulaEditor({ formula, levels, inputs, readOnly, onChange }) {
  const d = formula.definition || {};
  const terms = d.terms || [];
  const thresholds = d.thresholds || [];
  const patch = (next) => onChange({ ...formula, definition: { ...d, ...next } });
  return (
    <div>
      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#687078', margin: '.4rem 0' }}>Points = sum of (input, capped) × weight</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '.6rem' }}>
        <thead><tr><th style={th}>Input</th><th style={th}>Weight (points per unit)</th><th style={th}>Cap (max units counted)</th>{!readOnly && <th style={th} />}</tr></thead>
        <tbody>
          {terms.map((t, i) => (
            <tr key={i}>
              <td style={td}>{readOnly ? inputs[t.input] || t.input : (
                <select aria-label="Formula input" style={input} value={t.input} onChange={(e) => patch({ terms: terms.map((x, j) => j === i ? { ...x, input: e.target.value } : x) })}>
                  {Object.entries(inputs).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )}</td>
              <td style={td}>{readOnly ? t.weight : <input aria-label="Weight" style={input} type="number" step="0.1" value={t.weight} onChange={(e) => patch({ terms: terms.map((x, j) => j === i ? { ...x, weight: e.target.value === '' ? 0 : Number(e.target.value) } : x) })} />}</td>
              <td style={td}>{readOnly ? (t.cap ?? 'none') : <input aria-label="Cap" style={input} type="number" placeholder="none" value={t.cap ?? ''} onChange={(e) => patch({ terms: terms.map((x, j) => j === i ? { ...x, cap: e.target.value === '' ? null : Number(e.target.value) } : x) })} />}</td>
              {!readOnly && <td style={td}><button type="button" style={btn('ghost')} onClick={() => patch({ terms: terms.filter((_, j) => j !== i) })}>Remove</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && <button type="button" style={{ ...btn('ghost'), marginBottom: '.8rem' }} onClick={() => patch({ terms: [...terms, { input: Object.keys(inputs)[0], weight: 1, cap: null }] })}>+ Add input</button>}
      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#687078', margin: '.4rem 0' }}>Level reached at minimum points</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Level</th><th style={th}>Minimum points</th>{!readOnly && <th style={th} />}</tr></thead>
        <tbody>
          {thresholds.map((t, i) => (
            <tr key={i}>
              <td style={td}>{readOnly ? (levels.find((l) => l.key === t.levelKey)?.label || t.levelKey) : (
                <select aria-label="Threshold level" style={input} value={t.levelKey} onChange={(e) => patch({ thresholds: thresholds.map((x, j) => j === i ? { ...x, levelKey: e.target.value } : x) })}>
                  {levels.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
              )}</td>
              <td style={td}>{readOnly ? t.minPoints : <input aria-label="Minimum points" style={input} type="number" step="0.5" value={t.minPoints} onChange={(e) => patch({ thresholds: thresholds.map((x, j) => j === i ? { ...x, minPoints: e.target.value === '' ? 0 : Number(e.target.value) } : x) })} />}</td>
              {!readOnly && <td style={td}><button type="button" style={btn('ghost')} onClick={() => patch({ thresholds: thresholds.filter((_, j) => j !== i) })}>Remove</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && <button type="button" style={{ ...btn('ghost'), marginTop: '.5rem' }} onClick={() => patch({ thresholds: [...thresholds, { levelKey: levels[0]?.key || '', minPoints: 0 }] })}>+ Add level threshold</button>}
    </div>
  );
}

export default function ProficiencyRulesPanel({ onChanged }) {
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState([]);
  const [resolution, setResolution] = useState(null);
  const [certs, setCerts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [editing, setEditing] = useState(null); // formula being edited (copy)
  const [newMapping, setNewMapping] = useState(null);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState('all');
  const [pendingFormula, setPendingFormula] = useState(null); // optimistic radio while a switch saves

  async function load() {
    try {
      const [defs, prof, certList, skills, tools] = await Promise.all([
        api.getCareerExperienceDefinitions(), api.getCareerProficiency(), api.listCareerCertifications(), api.listCareerSkills(), api.listCareerTools(),
      ]);
      setDefinitions(defs.definitions || []);
      setResolution(prof);
      setCerts(certList.items || []);
      setEntities([
        ...(skills.items || []).map((x) => ({ type: 'skill', id: Number(x.id), label: x.skill })),
        ...(tools.items || []).map((x) => ({ type: 'tool', id: Number(x.id), label: x.currentName || x.nameUsed })),
      ]);
    } catch (e) {
      toast.error(`Could not load proficiency rules: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function afterChange(message) {
    if (message) toast.success(message);
    await load();
    onChanged?.();
  }

  const levels = useMemo(() => (resolution?.levels || []), [resolution]);
  const inputs = resolution?.formulaInputs || {};
  const formulas = definitions.filter((d) => d.type === 'proficiency_formula').sort((a, b) => (a.key === METHODOLOGY_KEY ? -1 : b.key === METHODOLOGY_KEY ? 1 : a.sortOrder - b.sortOrder));
  const mappings = definitions.filter((d) => d.type === 'certification_mapping');
  const activeKey = pendingFormula || resolution?.activeFormula?.key || METHODOLOGY_KEY;

  async function saveDefinition(item, message) {
    setBusy(`${item.type}:${item.key}`);
    try {
      await api.saveCareerExperienceDefinition(item.type, item.key, {
        label: item.label, description: item.description || '', definition: item.definition, sortOrder: item.sortOrder ?? 10, isActive: item.isActive !== false,
      });
      await afterChange(message);
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function useFormula(key) {
    // Exactly one member formula may be selected; choosing the methodology
    // clears them all.
    setBusy(`use:${key}`);
    setPendingFormula(key);
    try {
      // Re-read: a formula saved a moment ago isn't in this render's list.
      const fresh = ((await api.getCareerExperienceDefinitions()).definitions || []).filter((d) => d.type === 'proficiency_formula');
      for (const f of fresh.filter((x) => x.key !== METHODOLOGY_KEY)) {
        const want = f.key === key;
        if (Boolean(f.definition?.selected) === want) continue;
        await api.saveCareerExperienceDefinition(f.type, f.key, { label: f.label, description: f.description || '', definition: { ...f.definition, selected: want }, sortOrder: f.sortOrder, isActive: f.isActive !== false });
      }
      await afterChange(key === METHODOLOGY_KEY ? 'Now using the Salt Basin methodology' : 'Now using your formula — affected levels are marked †');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
      setPendingFormula(null);
    }
  }

  function duplicate(formula) {
    const base = formula.key === METHODOLOGY_KEY ? 'my_formula' : `${formula.key}_copy`;
    let key = base;
    let n = 2;
    while (formulas.some((f) => f.key === key)) { key = `${base}_${n}`; n += 1; }
    const { locked, selected, ...rest } = formula.definition || {};
    setEditing({ type: 'proficiency_formula', key, label: formula.key === METHODOLOGY_KEY ? 'My formula' : `${formula.label} (copy)`, description: '', definition: { ...rest, selected: false }, sortOrder: 20, isActive: true, isNew: true });
  }

  async function removeDefinition(item, what) {
    if (!window.confirm(`Delete ${what} "${item.label}"?`)) return;
    try {
      await api.deleteCareerExperienceDefinition(item.type, item.key);
      if (editing?.key === item.key) setEditing(null);
      await afterChange(`${item.label} deleted`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  // How a tool was used (hands-on / integration design / adjacent) lives on
  // the Career Master tool record itself (career_tools.wheel_bucket), so
  // this edit IS a Career Master edit — atom sync, QR history and every
  // output that reads the tool pick it up.
  async function setToolCategory(p, category) {
    setBusy(`cat:${p.entityId}`);
    try {
      await api.updateCareerTool(p.entityId, { wheelBucket: category || null });
      await afterChange(category ? `${p.label}: ${resolution?.toolProficiencyCategories?.[category]} (saved to Career Master)` : `${p.label}: category cleared — derived from level`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function setOverride(p, levelKey) {
    setBusy(`ov:${p.entityType}:${p.entityId}`);
    try {
      if (!levelKey) await api.deleteCareerProficiencyAssertion(p.entityType, p.entityId, 'current');
      else await api.saveCareerProficiencyAssertion(p.entityType, p.entityId, 'current', { levelKey, assessmentSource: 'user_confirmed', confidence: 1, visibility: 'resume' });
      await afterChange(levelKey ? `${p.label} set to ${levels.find((l) => l.key === levelKey)?.label} (marked †)` : `${p.label} override removed`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: '#687078' }}>Loading proficiency rules…</div>;

  const rows = (resolution?.proficiencies || []).filter((p) => filter === 'all' || p.entityType === filter);
  const entityLabel = (t) => entities.find((e) => e.type === t.entityType && e.id === Number(t.entityId))?.label || `${t.entityType} #${t.entityId}`;

  return (
    <div style={{ color: '#1b2a3b' }}>
      {/* ── 1. Which formula decides levels ── */}
      <section style={card} aria-labelledby="prof-formula-in-use">
        <div id="prof-formula-in-use" style={h}>Formula in use</div>
        <p style={sub}>Levels come from one formula unless you set a level by hand. The Salt Basin methodology is locked; duplicate it to make your own. Anything decided by your formula or your override is marked † on every output, with a footnote saying it is user-defined.</p>
        {formulas.map((f) => (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.55rem .6rem', border: `1px solid ${activeKey === f.key ? '#c4843a' : 'rgba(27,42,59,.12)'}`, background: activeKey === f.key ? 'rgba(196,132,58,.08)' : '#fff', borderRadius: 8, marginBottom: '.4rem', flexWrap: 'wrap' }}>
            <input type="radio" name="formula-in-use" aria-label={`Use ${f.label}`} checked={activeKey === f.key} disabled={!!busy} onChange={() => useFormula(f.key)} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{f.label}{f.key === METHODOLOGY_KEY && <span style={{ marginLeft: '.4rem', fontSize: '.66rem', color: '#687078', fontWeight: 600 }}>LOCKED</span>}</div>
              <div style={{ fontSize: '.7rem', color: '#687078' }}>{(f.definition?.terms || []).map((t) => `${inputs[t.input] || t.input} × ${t.weight}${t.cap != null ? ` (max ${t.cap})` : ''}`).join(' + ')}</div>
            </div>
            <button type="button" style={btn('ghost')} onClick={() => setEditing(f.key === METHODOLOGY_KEY ? { ...f, viewOnly: true } : { ...f })}>{f.key === METHODOLOGY_KEY ? 'View' : 'Edit'}</button>
            <button type="button" style={btn('ghost')} onClick={() => duplicate(f)}>Duplicate</button>
            {f.key !== METHODOLOGY_KEY && <button type="button" style={{ ...btn('ghost'), color: '#a33' }} onClick={() => removeDefinition(f, 'formula')}>Delete</button>}
          </div>
        ))}
      </section>

      {/* ── 2. Formula editor ── */}
      {editing && (
        <section style={{ ...card, borderColor: '#c4843a' }} aria-labelledby="prof-formula-editor">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
            <div id="prof-formula-editor" style={h}>{editing.viewOnly ? `${editing.label} (read-only)` : editing.isNew ? 'New formula' : `Edit: ${editing.label}`}</div>
            <button type="button" style={btn('ghost')} onClick={() => setEditing(null)}>Close</button>
          </div>
          {!editing.viewOnly && (
            <label style={{ display: 'block', margin: '.5rem 0' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#687078', textTransform: 'uppercase', letterSpacing: '.06em' }}>Formula name</span>
              <input style={input} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value, ...(editing.isNew ? { key: slug(e.target.value) || editing.key } : {}) })} />
            </label>
          )}
          <FormulaEditor formula={editing} levels={levels} inputs={inputs} readOnly={!!editing.viewOnly} onChange={(next) => setEditing({ ...editing, ...next })} />
          {!editing.viewOnly && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
              <button type="button" style={btn('navy')} disabled={busy === `${editing.type}:${editing.key}` || !editing.label.trim()} onClick={async () => { if (await saveDefinition(editing, `${editing.label} saved`)) setEditing(null); }}>Save formula</button>
              <button type="button" style={btn('gold')} disabled={!!busy || !editing.label.trim()} onClick={async () => { if (await saveDefinition(editing, null)) { setEditing(null); await useFormula(editing.key); } }}>Save and use this formula</button>
            </div>
          )}
        </section>
      )}

      {/* ── 3. Certification mappings ── */}
      <section style={card} aria-labelledby="prof-cert-mappings">
        <div id="prof-cert-mappings" style={h}>Certification bonuses</div>
        <p style={sub}>A certification can add bonus points to the specific skills or tools it proves. Points only count where the formula in use includes "Certification bonus points".</p>
        {mappings.length === 0 && !newMapping && <div style={{ fontSize: '.78rem', color: '#687078', marginBottom: '.6rem' }}>No certification bonuses yet.</div>}
        {mappings.map((m) => {
          const cert = certs.find((c) => Number(c.id) === Number(m.definition?.certificationId));
          return (
            <div key={m.key} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', padding: '.5rem .6rem', border: '1px solid rgba(27,42,59,.12)', borderRadius: 8, marginBottom: '.4rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220, fontSize: '.8rem' }}>
                <strong>{cert?.name || `Certification #${m.definition?.certificationId}`}</strong> → +{m.definition?.bonusPoints} pts to{' '}
                {(m.definition?.targets || []).map(entityLabel).join(', ')}
                {m.definition?.countIfLapsed === false && <span style={{ color: '#687078' }}> · not counted if lapsed</span>}
              </div>
              <button type="button" style={btn('ghost')} onClick={() => setNewMapping({ ...m, editingExisting: true })}>Edit</button>
              <button type="button" style={{ ...btn('ghost'), color: '#a33' }} onClick={() => removeDefinition(m, 'certification bonus')}>Delete</button>
            </div>
          );
        })}
        {newMapping ? (
          <div style={{ border: '1px solid #c4843a', borderRadius: 8, padding: '.75rem', marginTop: '.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.6rem' }}>
              <label><span style={{ fontSize: '.68rem', fontWeight: 700, color: '#687078' }}>CERTIFICATION</span>
                <select aria-label="Certification" style={input} value={newMapping.definition.certificationId || ''} onChange={(e) => setNewMapping({ ...newMapping, definition: { ...newMapping.definition, certificationId: Number(e.target.value) } })}>
                  <option value="">Choose…</option>
                  {certs.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status ? ` (${c.status})` : ''}</option>)}
                </select>
              </label>
              <label><span style={{ fontSize: '.68rem', fontWeight: 700, color: '#687078' }}>BONUS POINTS</span>
                <input aria-label="Bonus points" style={input} type="number" step="0.5" value={newMapping.definition.bonusPoints ?? 1} onChange={(e) => setNewMapping({ ...newMapping, definition: { ...newMapping.definition, bonusPoints: Number(e.target.value) } })} />
              </label>
              <label style={{ fontSize: '.78rem', alignSelf: 'end', paddingBottom: '.45rem' }}>
                <input type="checkbox" checked={newMapping.definition.countIfLapsed !== false} onChange={(e) => setNewMapping({ ...newMapping, definition: { ...newMapping.definition, countIfLapsed: e.target.checked } })} /> Count even if lapsed
              </label>
            </div>
            <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#687078', margin: '.7rem 0 .3rem' }}>ADDS POINTS TO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
              {entities.map((e) => {
                const on = (newMapping.definition.targets || []).some((t) => t.entityType === e.type && Number(t.entityId) === e.id);
                return (
                  <button key={`${e.type}:${e.id}`} type="button" aria-pressed={on}
                    onClick={() => setNewMapping({ ...newMapping, definition: { ...newMapping.definition, targets: on ? newMapping.definition.targets.filter((t) => !(t.entityType === e.type && Number(t.entityId) === e.id)) : [...(newMapping.definition.targets || []), { entityType: e.type, entityId: e.id }] } })}
                    style={{ borderRadius: 999, padding: '.25rem .65rem', fontSize: '.74rem', cursor: 'pointer', border: on ? '1px solid #1b2a3b' : '1px solid rgba(27,42,59,.2)', background: on ? '#1b2a3b' : '#fff', color: on ? '#fff' : '#1b2a3b' }}>
                    {e.label} <span style={{ opacity: 0.7 }}>· {e.type}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.8rem' }}>
              <button type="button" style={btn('navy')} disabled={!newMapping.definition.certificationId || !(newMapping.definition.targets || []).length}
                onClick={async () => {
                  const cert = certs.find((c) => Number(c.id) === Number(newMapping.definition.certificationId));
                  const key = newMapping.editingExisting ? newMapping.key : `cert_${newMapping.definition.certificationId}_${Date.now().toString(36)}`;
                  const ok = await saveDefinition({ type: 'certification_mapping', key, label: `${cert?.name || 'Certification'} bonus`, definition: newMapping.definition, sortOrder: 10, isActive: true }, 'Certification bonus saved');
                  if (ok) setNewMapping(null);
                }}>Save bonus</button>
              <button type="button" style={btn('ghost')} onClick={() => setNewMapping(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" style={btn('ghost')} disabled={!certs.length} onClick={() => setNewMapping({ definition: { certificationId: null, bonusPoints: 1, targets: [], countIfLapsed: true } })}>
            {certs.length ? '+ Add certification bonus' : 'Add certifications in Manual Intake first'}
          </button>
        )}
      </section>

      {/* ── 4. Resolved levels: what, why, override ── */}
      <section style={card} aria-labelledby="prof-why">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <div id="prof-why" style={h}>Levels and why</div>
          <div style={{ display: 'flex', gap: '.3rem' }}>
            {['all', 'skill', 'tool'].map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} style={{ ...btn(filter === f ? 'navy' : 'ghost'), textTransform: 'capitalize' }}>{f === 'all' ? 'All' : `${f}s`}</button>)}
          </div>
        </div>
        <p style={sub}>Using <strong>{resolution?.activeFormula?.label}</strong>. Pick a level in "Your override" to set it by hand; choose "Use formula" to remove an override.{resolution?.footnote ? ` ${resolution.footnote}` : ''}</p>
        {rows.length === 0 ? (
          <div style={{ fontSize: '.78rem', color: '#687078' }}>No skills or tools yet — add them in Career Master → Manual Intake.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr><th style={th}>Skill / tool</th><th style={th}>Level shown</th><th style={th}>How it was used<div style={{ fontWeight: 400 }}>tools only · saved to Career Master</div></th><th style={th}>Decided by</th><th style={th}>Points behind it</th><th style={th}>Methodology alone</th><th style={th}>Your override</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const overridden = p.basis === 'member_override';
                  return (
                    <tr key={`${p.entityType}:${p.entityId}`}>
                      <td style={td}><strong>{p.label}</strong><div style={{ fontSize: '.66rem', color: '#7a8086' }}>{p.entityType}{p.category ? ` · ${p.category}` : ''}</div></td>
                      <td style={td}><strong>{p.levelLabel || '—'}</strong>{p.basis !== 'salt_basin_methodology' && <span style={{ color: '#c4843a', fontWeight: 700 }}> †</span>}</td>
                      <td style={td}>
                        {p.entityType === 'tool' ? (
                          <>
                            <select aria-label={`How ${p.label} was used`} style={input} disabled={busy === `cat:${p.entityId}`} value={p.proficiencyCategorySource === 'career_master' ? p.proficiencyCategory : ''} onChange={(e) => setToolCategory(p, e.target.value)}>
                              <option value="">{p.proficiencyCategorySource === 'career_master' ? 'Not set — derive from level' : `Not set — derived: ${p.proficiencyCategoryLabel}`}</option>
                              {Object.entries(resolution?.toolProficiencyCategories || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            {p.proficiencyCategorySource === 'derived_from_level' && <div style={{ fontSize: '.64rem', color: '#7a8086', marginTop: '.2rem' }}>Not recorded yet — inferred from level</div>}
                          </>
                        ) : <span style={{ color: '#9aa3ad' }}>—</span>}
                      </td>
                      <td style={td}><Badge basis={p.basis} /></td>
                      <td style={td}>
                        {overridden ? <span style={{ color: '#687078' }}>Set by hand</span> : (
                          <>
                            <strong>{p.points} pts</strong>
                            <div style={{ fontSize: '.68rem', color: '#536173', lineHeight: 1.5 }}>
                              {p.breakdown.map((b) => <div key={b.input}>{inputs[b.input] || b.input}: {b.value}{b.input === 'yearsPerformed' && p.inputs.yearsSource === 'first_used' ? ' (from first-used year)' : ''}{b.counted != null && b.counted !== b.value ? ` (capped at ${b.counted})` : ''} × {b.weight} = {b.points}</div>)}
                              {p.certifications.map((c) => <div key={c.id}>↳ {c.name} +{c.bonusPoints}{c.lapsed ? ' (lapsed)' : ''}</div>)}
                            </div>
                          </>
                        )}
                      </td>
                      <td style={td}>{levels.find((l) => l.key === p.methodologyLevelKey)?.label || '—'}<div style={{ fontSize: '.66rem', color: '#7a8086' }}>{p.methodologyPoints} pts</div></td>
                      <td style={td}>
                        <select aria-label={`Override level for ${p.label}`} style={input} disabled={busy === `ov:${p.entityType}:${p.entityId}`} value={overridden ? p.levelKey : ''} onChange={(e) => setOverride(p, e.target.value)}>
                          <option value="">Use formula</option>
                          {levels.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
