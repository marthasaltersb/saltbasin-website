// Resume rollups (2026-10-02) — the screen for the three groupings the resume
// outputs used to hardcode: KPI tiles, industry-duration buckets, and the
// skill-category → capability-group mapping, plus the Career Atom rollup
// groupings behind the public Career Rollup block. A live preview recomputes
// every edit (saved or not) against the member's real Career Master.
//
// Each is a career_experience_definitions row (types kpi_tile /
// industry_bucket / category_group) saved through the same
// /api/career/experience-definitions routes as the rest of Proficiency &
// Rollups; computed values come from GET /api/career/resume-rollups, the same
// endpoint the resume outputs render. A tile with no data shows '—' and says
// why — there are no fallback figures. A 'manual' tile is user-defined and is
// marked † on every output.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { fetchResumeRollups } from '../../lib/resumeRollups.js';

const input = { width: '100%', padding: '.45rem .55rem', border: '1px solid rgba(27,42,59,.18)', borderRadius: 7, background: '#fff', color: '#1b2a3b', fontSize: '.8rem', boxSizing: 'border-box' };
const card = { background: '#fff', border: '1px solid rgba(27,42,59,.12)', borderRadius: 10, padding: '1rem', marginBottom: '.75rem' };
const h = { fontSize: '.95rem', fontWeight: 750, marginBottom: '.25rem' };
const sub = { fontSize: '.76rem', color: '#687078', lineHeight: 1.5, margin: '0 0 .75rem' };
const lab = { display: 'block', fontSize: '.66rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#687078', marginBottom: '.2rem' };
const btn = (kind = 'navy') => ({
  border: kind === 'ghost' ? '1px solid rgba(27,42,59,.2)' : 0, borderRadius: 7, cursor: 'pointer', padding: '.4rem .75rem', fontSize: '.76rem',
  background: kind === 'navy' ? '#1b2a3b' : kind === 'danger' ? '#a33' : '#fff', color: kind === 'ghost' ? '#1b2a3b' : '#fff',
});
const chip = { display: 'inline-flex', alignItems: 'center', gap: '.3rem', padding: '.15rem .2rem .15rem .6rem', borderRadius: 999, background: 'rgba(74,124,142,.14)', color: '#1b2a3b', fontSize: '.74rem', margin: '0 .3rem .3rem 0' };
const chipX = { border: 0, background: 'transparent', cursor: 'pointer', color: '#536173', fontSize: '.9rem', lineHeight: 1, padding: '0 .35rem' };

const TYPE_LABEL = { kpi_tile: 'KPI tile', industry_bucket: 'industry bucket', category_group: 'category group', atom_rollup: 'Career Atom grouping' };

function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
}
function newKey(type, label) {
  const prefix = { kpi_tile: 'kpi', industry_bucket: 'ind', category_group: 'grp', atom_rollup: 'atom' }[type];
  return `${prefix}_${slug(label) || 'new'}_${Date.now().toString(36)}`.slice(0, 79);
}

function Field({ title, children, style }) {
  return <label style={{ display: 'block', ...style }}><span style={lab}>{title}</span>{children}</label>;
}

function Chips({ items, onRemove, renderExtra }) {
  return <div>{items.map((k) => (
    <span key={k} style={chip}>{k}{renderExtra ? renderExtra(k) : null}
      <button type="button" aria-label={`Remove ${k}`} style={chipX} onClick={() => onRemove(k)}>×</button>
    </span>
  ))}</div>;
}

function ChipAdder({ placeholder, onAdd, listId, options }) {
  const [v, setV] = useState('');
  const commit = () => { const t = v.trim(); if (t) { onAdd(t); setV(''); } };
  return (
    <div style={{ display: 'flex', gap: '.4rem' }}>
      <input style={input} value={v} placeholder={placeholder} list={listId} aria-label={placeholder}
        onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
      {options && <datalist id={listId}>{options.map((o) => <option key={o} value={o} />)}</datalist>}
      <button type="button" style={btn('ghost')} onClick={commit}>Add</button>
    </div>
  );
}

function ComputedLine({ children, tone }) {
  return <div style={{ fontSize: '.74rem', color: tone === 'empty' ? '#8A5A12' : '#2F7A5B', marginTop: '.5rem' }}>{children}</div>;
}

export default function RollupGroupingsPanel({ onChanged }) {
  const [defs, setDefs] = useState([]);
  const [rollups, setRollups] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Items edited but not yet saved ("type:key"); a reload after saving one
  // card must never wipe another card's unsaved edits.
  const dirty = useRef(new Set());
  const previewSeq = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([api.getCareerExperienceDefinitions(), fetchResumeRollups('me', { atom: true })]);
      const server = (d.definitions || []).filter((x) => TYPE_LABEL[x.type]);
      setDefs((prev) => {
        const keyOf = (x) => `${x.type}:${x.key}`;
        const prevBy = new Map(prev.map((x) => [keyOf(x), x]));
        const merged = server.map((s) => (dirty.current.has(keyOf(s)) && prevBy.has(keyOf(s)) ? prevBy.get(keyOf(s)) : s));
        const serverKeys = new Set(server.map(keyOf));
        return [...merged, ...prev.filter((x) => x.isNew && !serverKeys.has(keyOf(x)))];
      });
      setRollups(r);
      setLoaded(true);
      setLoadError(null);
    } catch (e) {
      // Distinct from an empty configuration: nothing below renders as "no tiles".
      setRollups(null);
      setLoadError(e.message || 'Resume rollups could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Live preview: every edit (saved or not) is recomputed server-side against
  // the member's real Career Master without writing anything. A draft the
  // server rejects is shown as a paused preview with the reason.
  useEffect(() => {
    if (!loaded) return undefined;
    const seq = ++previewSeq.current;
    const timer = setTimeout(async () => {
      setPreviewing(true);
      try {
        const r = await api.previewResumeRollups(defs.map((d) => ({ type: d.type, key: d.key, label: d.label, definition: d.definition, sortOrder: d.sortOrder, isActive: d.isActive })));
        if (seq === previewSeq.current) { setRollups(r); setPreviewError(null); }
      } catch (e) {
        if (seq === previewSeq.current) setPreviewError(e.message || 'Preview failed');
      } finally {
        if (seq === previewSeq.current) setPreviewing(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [defs, loaded]);

  const ofType = useCallback((type) => defs.filter((d) => d.type === type).sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)), [defs]);
  const computed = useMemo(() => ({
    kpi_tile: new Map((rollups?.tiles || []).map((t) => [t.key, t])),
    industry_bucket: new Map((rollups?.industryDurations || []).map((t) => [t.key, t])),
    category_group: new Map((rollups?.capabilityGroups || []).map((t) => [t.key, t])),
    atom_rollup: new Map((rollups?.atomGroupings || []).map((t) => [t.key, t])),
  }), [rollups]);

  const patch = (type, key, change) => {
    dirty.current.add(`${type}:${key}`);
    setDefs((all) => all.map((d) => (d.type === type && d.key === key ? { ...d, ...change } : d)));
  };
  const patchDef = (item, change) => patch(item.type, item.key, { definition: { ...item.definition, ...change } });

  async function persist(item, { quiet = false } = {}) {
    await api.saveCareerExperienceDefinition(item.type, item.key, {
      label: item.label, description: item.description || null, definition: item.definition, sortOrder: item.sortOrder, isActive: item.isActive,
    });
    dirty.current.delete(`${item.type}:${item.key}`);
    if (!quiet) toast.success(`${item.label} saved`);
  }

  async function run(busyKey, fn) {
    setBusy(busyKey);
    try { await fn(); await load(); if (onChanged) onChanged(); }
    catch (e) { toast.error(e.message || 'Save failed'); }
    finally { setBusy(null); }
  }

  const save = (item) => run(`${item.type}:${item.key}`, () => persist(item));

  const remove = (item) => {
    // A member with no saved row of a type is given the defaults again, so the
    // last saved row can't be removed: hiding it (Shown off) is the way to show none.
    if (!item.isNew && defs.filter((d) => d.type === item.type && !d.isNew).length <= 1) {
      toast.error(`Keep at least one ${TYPE_LABEL[item.type]}: removing the last one would restore the defaults. Untick Shown to hide it from outputs instead.`);
      return Promise.resolve();
    }
    if (!window.confirm(`Remove “${item.label}”?`)) return Promise.resolve();
    dirty.current.delete(`${item.type}:${item.key}`);
    if (item.isNew) { setDefs((all) => all.filter((d) => !(d.type === item.type && d.key === item.key))); return Promise.resolve(); }
    return run(`${item.type}:${item.key}`, async () => {
      await api.deleteCareerExperienceDefinition(item.type, item.key);
      setDefs((all) => all.filter((d) => !(d.type === item.type && d.key === item.key)));
    });
  };

  const move = (type, index, dir) => {
    const list = ofType(type);
    const a = list[index]; const b = list[index + dir];
    if (!a || !b || a.isNew || b.isNew) return Promise.resolve();
    // Re-number the whole list so equal/missing sortOrders can never tie.
    const reordered = [...list];
    reordered[index] = b; reordered[index + dir] = a;
    return run(`${type}:order`, async () => {
      for (let i = 0; i < reordered.length; i += 1) {
        const item = { ...reordered[i], sortOrder: (i + 1) * 10 };
        if (!item.isNew && item.sortOrder !== reordered[i].sortOrder) await persist(item, { quiet: true });
      }
    });
  };

  const add = (type) => {
    const n = ofType(type).length + 1;
    const base = {
      kpi_tile: { label: 'New tile', definition: { note: '', accent: 'gold', computation: { metric: 'engagement_count' } } },
      industry_bucket: { label: 'New industry bucket', definition: { sub: '', keywords: [] } },
      category_group: { label: 'New capability group', definition: { categories: [] } },
      atom_rollup: { label: 'New Career Atom grouping', definition: { entryType: 'career_skill_entry', groupBy: 'category', labelPrefix: 'Skills', sort: 'count' } },
    }[type];
    setDefs((all) => [...all, { type, key: newKey(type, base.label), description: '', sortOrder: n * 10, isActive: true, isNew: true, ...base }]);
  };

  // Mapping a category into a group removes it from any other group (first
  // group wins server-side, so leaving a duplicate would silently be ignored).
  function mapCategory(category, toKey) {
    const norm = category.trim().toLowerCase();
    const touched = [];
    const next = defs.map((d) => {
      if (d.type !== 'category_group') return d;
      const cats = d.definition.categories || [];
      const has = cats.some((c) => c.toLowerCase() === norm);
      let out = cats;
      if (d.key === toKey && !has) out = [...cats, category];
      else if (d.key !== toKey && has) out = cats.filter((c) => c.toLowerCase() !== norm);
      if (out === cats) return d;
      const changed = { ...d, definition: { ...d.definition, categories: out } };
      touched.push(changed);
      return changed;
    });
    touched.forEach((t) => dirty.current.add(`${t.type}:${t.key}`));
    setDefs(next);
    const persisted = touched.filter((t) => !t.isNew);
    if (persisted.length) run('category_group:map', async () => { for (const t of persisted) await persist(t, { quiet: true }); });
  }
  function unmapCategory(item, category) {
    const changed = { ...item, definition: { ...item.definition, categories: item.definition.categories.filter((c) => c !== category) } };
    dirty.current.add(`${item.type}:${item.key}`);
    setDefs((all) => all.map((d) => (d.type === item.type && d.key === item.key ? changed : d)));
    if (!item.isNew) run('category_group:map', () => persist(changed, { quiet: true }));
  }

  if (loading && !rollups && !loadError) return <div style={{ padding: '1rem', color: '#687078' }}>Loading resume rollups…</div>;

  const catalog = rollups?.catalog || { metrics: [], dollarFields: [], accents: [] };
  const memberCategories = rollups?.skillCategories || [];

  const OrderButtons = ({ type, index, last, disabled }) => (
    <span style={{ display: 'inline-flex', gap: '.25rem' }}>
      <button type="button" aria-label="Move up" style={btn('ghost')} disabled={disabled || index === 0} onClick={() => move(type, index, -1)}>↑</button>
      <button type="button" aria-label="Move down" style={btn('ghost')} disabled={disabled || last} onClick={() => move(type, index, 1)}>↓</button>
    </span>
  );

  const Footer = ({ item, index, list }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem' }}>
      <code style={{ fontSize: '.66rem', color: '#7a8086' }}>{item.isNew ? 'not saved yet' : item.key}</code>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
        <label style={{ fontSize: '.74rem' }}><input type="checkbox" checked={item.isActive} onChange={(e) => patch(item.type, item.key, { isActive: e.target.checked })} /> Shown</label>
        <OrderButtons type={item.type} index={index} last={index === list.length - 1} disabled={!!busy || item.isNew} />
        <button type="button" style={btn('ghost')} onClick={() => remove(item)} disabled={busy === `${item.type}:${item.key}`}>Remove</button>
        <button type="button" style={btn()} onClick={() => save(item)} disabled={busy === `${item.type}:${item.key}`}>{busy === `${item.type}:${item.key}` ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );

  const tiles = ofType('kpi_tile');
  const buckets = ofType('industry_bucket');
  const groups = ofType('category_group');
  const atoms = ofType('atom_rollup');
  const anyManual = tiles.some((t) => t.definition?.computation?.metric === 'manual');

  return (
    <div style={{ background: '#faf7f2', color: '#1b2a3b', borderRadius: 10, padding: '1rem' }} data-testid="resume-rollups-panel">
      {previewError && (
        <div role="alert" style={{ ...card, borderColor: '#C98320', background: '#FFF4E5' }}>
          <strong>Live preview paused.</strong> {previewError}. Your edits are kept; fix this and the preview resumes.
        </div>
      )}
      {loadError && (
        <div role="alert" style={{ ...card, borderColor: '#C98320', background: '#FFF4E5' }}>
          <strong>Resume rollups could not be loaded.</strong> {loadError}. This is a loading error — your tiles, buckets and groups are not empty.{' '}
          <button type="button" style={btn()} onClick={load}>Retry</button>
        </div>
      )}
      <p style={sub}>
        These three lists drive the resume's Executive Summary tiles, Industry Experience bars and Capability Confidence bars. Values are computed
        from your Career Master. Nothing is estimated: a tile with no data shows “—” and explains why.
      </p>

      {/* ── KPI tiles ── */}
      <div style={h}>KPI tiles</div>
      <p style={sub}>Years of experience is the cumulative figure from the Career Master trend (month precision, overlapping roles merged). “Manual value” tiles are yours alone and are marked † on every output.</p>
      {tiles.map((item, i) => {
        const c = item.definition?.computation || { metric: 'manual' };
        const live = computed.kpi_tile.get(item.key);
        const metricMeta = catalog.metrics.find((m) => m.key === c.metric);
        const setComp = (change) => patchDef(item, { computation: { ...c, ...change } });
        return (
          <div key={item.key} style={card} data-testid={`kpi-${item.key}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.65rem' }}>
              <Field title="Label"><input style={input} value={item.label} onChange={(e) => patch(item.type, item.key, { label: e.target.value })} /></Field>
              <Field title="Note"><input style={input} value={item.definition?.note || ''} onChange={(e) => patchDef(item, { note: e.target.value })} /></Field>
              <Field title="Accent">
                <select style={input} value={item.definition?.accent || 'gold'} onChange={(e) => patchDef(item, { accent: e.target.value })}>
                  {catalog.accents.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field title="Metric">
                <select style={input} aria-label="Metric" value={c.metric} onChange={(e) => {
                  const m = e.target.value;
                  const first = (catalog.aggregateEntities || [])[0];
                  const extra = m === 'field_aggregate' ? { entity: first?.key, field: first?.textFields[0], aggregation: 'count' }
                    : m === 'proficiency_at_least' ? { entityType: 'skill', levelKey: (catalog.proficiencyLevels || [])[0]?.key || '' } : {};
                  patchDef(item, { computation: { metric: m, ...extra } });
                }}>
                  {catalog.metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </Field>
              {metricMeta?.needsField && (
                <Field title="Engagement field to scan">
                  <select style={input} value={c.field || catalog.dollarFields[0]} onChange={(e) => setComp({ field: e.target.value })}>
                    {catalog.dollarFields.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              )}
              {c.metric === 'field_aggregate' && (() => {
                const ent = (catalog.aggregateEntities || []).find((x) => x.key === c.entity) || catalog.aggregateEntities?.[0];
                const fields = ent ? [...ent.textFields, ...ent.numericFields] : [];
                const numeric = ent?.numericFields.includes(c.field);
                return <>
                  <Field title="Collection">
                    <select style={input} aria-label="Aggregate collection" value={ent?.key || ''} onChange={(e) => { const n = catalog.aggregateEntities.find((x) => x.key === e.target.value); setComp({ entity: n.key, field: n.numericFields[0] || n.textFields[0], aggregation: n.numericFields[0] ? 'sum' : 'count' }); }}>
                      {(catalog.aggregateEntities || []).map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                    </select>
                  </Field>
                  <Field title="Field">
                    <select style={input} aria-label="Aggregate field" value={c.field || ''} onChange={(e) => setComp({ field: e.target.value, aggregation: ent.numericFields.includes(e.target.value) ? c.aggregation : 'count' })}>
                      {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field title="Aggregation">
                    <select style={input} aria-label="Aggregation" value={c.aggregation || 'count'} onChange={(e) => setComp({ aggregation: e.target.value })}>
                      {(catalog.aggregations || []).filter((a) => numeric || ['count', 'count_distinct'].includes(a.key)).map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                    </select>
                  </Field>
                </>;
              })()}
              {c.metric === 'proficiency_at_least' && <>
                <Field title="Counts">
                  <select style={input} aria-label="Proficiency entity" value={c.entityType || 'skill'} onChange={(e) => setComp({ entityType: e.target.value })}>
                    <option value="skill">Skills</option><option value="tool">Tools</option>
                  </select>
                </Field>
                <Field title="At or above level">
                  <select style={input} aria-label="Proficiency level" value={c.levelKey || ''} onChange={(e) => setComp({ levelKey: e.target.value })}>
                    <option value="">Choose a level…</option>
                    {(catalog.proficiencyLevels || []).map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                  </select>
                </Field>
              </>}
              {c.metric === 'manual' && (
                <Field title="Your value (shown with †)"><input style={input} value={c.manualValue || ''} onChange={(e) => setComp({ manualValue: e.target.value })} placeholder="e.g. 8+" /></Field>
              )}
            </div>
            {live
              ? <ComputedLine tone={live.empty ? 'empty' : 'ok'}><strong>{live.userDefined ? `${live.value}†` : live.value}</strong> · {live.empty ? live.note : live.source} {live.userDefined && '· user-defined'}</ComputedLine>
              : <ComputedLine tone="empty">{item.isActive ? (previewError ? 'Preview paused — fix the error above.' : 'Calculating…') : 'Hidden — not shown on outputs.'}</ComputedLine>}
            <Footer item={item} index={i} list={tiles} />
          </div>
        );
      })}
      {tiles.length === 0 && <div style={{ ...card, color: '#687078' }}>No KPI tiles yet — the Executive Summary will not render a tile row. Add one below.</div>}
      <button type="button" style={{ ...btn('ghost'), width: '100%', marginBottom: '.4rem' }} onClick={() => add('kpi_tile')}>+ Add KPI tile</button>
      {anyManual && <div style={{ fontSize: '.72rem', color: '#8A5A12', marginBottom: '1rem' }}>Footnote on outputs: “{rollups?.footnote || 'Figures marked † are user-defined, not Salt Basin methodology-driven.'}”</div>}

      {/* ── Industry buckets ── */}
      <div style={{ ...h, marginTop: '1.25rem' }}>Industry buckets</div>
      <p style={sub}>A role or engagement counts toward a bucket when its industry text contains any keyword (case-insensitive; keywords of three letters or fewer match whole words, so “ai” does not match “retail”). Years = distinct calendar years with matching activity, so overlaps never double-count.</p>
      {buckets.map((item, i) => {
        const live = computed.industry_bucket.get(item.key);
        const kws = item.definition?.keywords || [];
        return (
          <div key={item.key} style={card} data-testid={`bucket-${item.key}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.65rem', marginBottom: '.6rem' }}>
              <Field title="Label"><input style={input} value={item.label} onChange={(e) => patch(item.type, item.key, { label: e.target.value })} /></Field>
              <Field title="Sub-label"><input style={input} value={item.definition?.sub || ''} onChange={(e) => patchDef(item, { sub: e.target.value })} /></Field>
            </div>
            <span style={lab}>Keywords</span>
            <Chips items={kws} onRemove={(k) => patchDef(item, { keywords: kws.filter((x) => x !== k) })} />
            <ChipAdder placeholder="Add keyword, press Enter" onAdd={(k) => { if (!kws.some((x) => x.toLowerCase() === k.toLowerCase())) patchDef(item, { keywords: [...kws, k] }); }} />
            {live
              ? <ComputedLine><strong>{live.years} yr{live.years === 1 ? '' : 's'}</strong> · {live.source}</ComputedLine>
              : <ComputedLine tone="empty">{item.isActive ? (previewError ? 'Preview paused — fix the error above.' : 'No matching roles or engagements — this bucket is omitted from outputs.') : 'Hidden — not shown on outputs.'}</ComputedLine>}
            <Footer item={item} index={i} list={buckets} />
          </div>
        );
      })}
      {buckets.length === 0 && <div style={{ ...card, color: '#687078' }}>No industry buckets — the Industry Experience section will be empty.</div>}
      <button type="button" style={{ ...btn('ghost'), width: '100%', marginBottom: '.4rem' }} onClick={() => add('industry_bucket')}>+ Add industry bucket</button>

      {/* ── Category groups ── */}
      <div style={{ ...h, marginTop: '1.25rem' }}>Capability groups</div>
      <p style={sub}>Map your skill categories into the capability groups shown as Capability Confidence bars. Mapping a category into one group removes it from any other.</p>
      {rollups && (
        <div style={{ ...card, background: (rollups.unmappedCategories || []).length ? '#FFF9EE' : '#F2F8F4' }} data-testid="unmapped-categories">
          <span style={lab}>Your unmapped skill categories</span>
          {(rollups.unmappedCategories || []).length === 0
            ? <div style={{ fontSize: '.78rem', color: '#2F7A5B' }}>Every skill category you use is mapped to a group.</div>
            : (rollups.unmappedCategories || []).map((u) => (
              <div key={u.category} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: '.25rem 0', fontSize: '.8rem' }}>
                <span style={{ flex: 1 }}><strong>{u.category}</strong> · {u.skillCount} skill{u.skillCount === 1 ? '' : 's'} — not counted in any bar</span>
                <select aria-label={`Map ${u.category} to`} style={{ ...input, width: 'auto' }} value="" disabled={!!busy || groups.every((g) => g.isNew) }
                  onChange={(e) => { if (e.target.value) mapCategory(u.category, e.target.value); }}>
                  <option value="">Map to group…</option>
                  {groups.filter((g) => !g.isNew).map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
            ))}
          {rollups.uncategorizedSkillCount > 0 && <div style={{ fontSize: '.74rem', color: '#8A5A12', marginTop: '.4rem' }}>{rollups.uncategorizedSkillCount} skill(s) have no category set and can't be grouped — set a category in Career Master.</div>}
        </div>
      )}
      {groups.map((item, i) => {
        const live = computed.category_group.get(item.key);
        const cats = item.definition?.categories || [];
        const known = new Map(memberCategories.map((m) => [m.category.toLowerCase(), m]));
        return (
          <div key={item.key} style={card} data-testid={`group-${item.key}`}>
            <Field title="Group label" style={{ maxWidth: 340, marginBottom: '.6rem' }}>
              <input style={input} value={item.label} onChange={(e) => patch(item.type, item.key, { label: e.target.value })} />
            </Field>
            <span style={lab}>Skill categories in this group</span>
            {cats.length === 0 && <div style={{ fontSize: '.76rem', color: '#8A5A12', marginBottom: '.4rem' }}>No categories mapped yet.</div>}
            <Chips items={cats} onRemove={(c) => unmapCategory(item, c)}
              renderExtra={(c) => (known.has(c.toLowerCase()) ? <span style={{ color: '#687078', fontSize: '.66rem' }}>({known.get(c.toLowerCase()).skillCount})</span> : <span style={{ color: '#8A5A12', fontSize: '.66rem' }}>(no skills)</span>)} />
            <ChipAdder placeholder="Add a skill category" listId={`cats-${item.key}`} options={memberCategories.map((m) => m.category)}
              onAdd={(c) => (item.isNew ? patchDef(item, { categories: [...cats, c] }) : mapCategory(c, item.key))} />
            {live
                ? <ComputedLine tone={live.skillCount ? 'ok' : 'empty'}>{live.skillCount ? `${live.pct}% · ${live.evidence}` : 'No skills fall in this group — it is omitted from the Capability Confidence bars.'}</ComputedLine>
                : null}
            <Footer item={item} index={i} list={groups} />
          </div>
        );
      })}
      {groups.length === 0 && <div style={{ ...card, color: '#687078' }}>No capability groups — the Capability Confidence section will be empty.</div>}
      <button type="button" style={{ ...btn('ghost'), width: '100%', marginBottom: '.4rem' }} onClick={() => add('category_group')}>+ Add capability group</button>

      {/* ── Career Atom rollup groupings ── */}
      <div style={{ ...h, marginTop: '1.25rem' }}>Career Atom rollups</div>
      <p style={sub}>The groupings behind the public Career Rollup block (and anything reading Career Atom evidence). “Skills by category”, “Roles by industry” and “Tools by wheel bucket” keep their keys so existing pages keep working; hide one with Shown, or add your own grouping.</p>
      {atoms.map((item, i) => {
        const live = computed.atom_rollup.get(item.key);
        const d = item.definition || {};
        const et = (catalog.atomEntryTypes || []).find((x) => x.key === d.entryType) || (catalog.atomEntryTypes || [])[0];
        return (
          <div key={item.key} style={card} data-testid={`atom-${item.key}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '.65rem' }}>
              <Field title="Label"><input style={input} value={item.label} onChange={(e) => patch(item.type, item.key, { label: e.target.value })} /></Field>
              <Field title="Entries">
                <select style={input} aria-label="Atom entry type" value={d.entryType || ''} onChange={(e) => { const n = catalog.atomEntryTypes.find((x) => x.key === e.target.value); patchDef(item, { entryType: n.key, groupBy: n.groupBy[0], labelPrefix: n.label }); }}>
                  {(catalog.atomEntryTypes || []).map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                </select>
              </Field>
              <Field title="Group by">
                <select style={input} aria-label="Atom group by" value={d.groupBy || ''} onChange={(e) => patchDef(item, { groupBy: e.target.value })}>
                  {(et?.groupBy || []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field title="Label prefix"><input style={input} value={d.labelPrefix || ''} onChange={(e) => patchDef(item, { labelPrefix: e.target.value })} /></Field>
              <Field title="Sort">
                <select style={input} aria-label="Atom sort" value={d.sort || 'count'} onChange={(e) => patchDef(item, { sort: e.target.value })}>
                  <option value="count">Largest first</option><option value="label">A to Z</option>
                </select>
              </Field>
            </div>
            {live
              ? <ComputedLine tone={live.entries.length ? 'ok' : 'empty'}>{live.entries.length ? live.entries.map((e) => `${e.key} (${e.value})`).join(' · ') : 'No Career Atom evidence for this grouping yet — the public block shows its empty state.'}</ComputedLine>
              : <ComputedLine tone="empty">{item.isActive ? (previewError ? 'Preview paused — fix the error above.' : 'Calculating…') : 'Hidden — not shown on outputs.'}</ComputedLine>}
            <Footer item={item} index={i} list={atoms} />
          </div>
        );
      })}
      {atoms.length === 0 && <div style={{ ...card, color: '#687078' }}>No Career Atom groupings — the public Career Rollup block will show its empty state.</div>}
      <button type="button" style={{ ...btn('ghost'), width: '100%' }} onClick={() => add('atom_rollup')}>+ Add Career Atom grouping</button>

      {/* ── Live preview ── */}
      <div style={{ ...card, marginTop: '1.5rem', background: '#F5F2ED' }} data-testid="rollup-live-preview">
        <div style={h}>Live preview {previewing && <span style={{ fontSize: '.7rem', color: '#687078', fontWeight: 400 }}>· updating…</span>}</div>
        <p style={sub}>Exactly what the resume's Executive Summary, Industry Experience and Capability Confidence sections will show for your Career Master right now, including unsaved edits.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.5rem', marginBottom: '.75rem' }}>
          {(rollups?.tiles || []).map((t) => (
            <div key={t.key} style={{ background: '#fff', borderRadius: 8, padding: '.6rem', textAlign: 'center', border: '1px solid rgba(27,42,59,.08)' }} title={t.source}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{t.userDefined ? `${t.value}†` : t.value}</div>
              <div style={{ fontSize: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: '#8A5A12' }}>{t.label}</div>
              <div style={{ fontSize: '.64rem', color: '#687078' }}>{t.note}</div>
            </div>
          ))}
          {(rollups?.tiles || []).length === 0 && <div style={{ color: '#687078', fontSize: '.78rem' }}>No visible KPI tiles.</div>}
        </div>
        {rollups?.footnote && <div style={{ fontSize: '.7rem', fontStyle: 'italic', color: '#536173', marginBottom: '.6rem' }} data-testid="preview-footnote">{rollups.footnote}</div>}
        <span style={lab}>Capability Confidence</span>
        {(rollups?.capabilityGroups || []).filter((g) => g.skillCount > 0).map((g) => (
          <div key={g.key} style={{ marginBottom: '.4rem', fontSize: '.76rem' }}>{g.name} · <strong>{g.pct}%</strong> · {g.evidence}</div>
        ))}
        {!(rollups?.capabilityGroups || []).some((g) => g.skillCount > 0) && <div style={{ fontSize: '.76rem', color: '#687078' }}>No capability groups contain skills yet.</div>}
        <span style={{ ...lab, marginTop: '.6rem' }}>Industry Experience</span>
        {(rollups?.industryDurations || []).map((r) => <div key={r.key} style={{ fontSize: '.76rem' }}>{r.label} · <strong>{r.years} yr{r.years === 1 ? '' : 's'}</strong></div>)}
        {!(rollups?.industryDurations || []).length && <div style={{ fontSize: '.76rem', color: '#687078' }}>No industry bucket matches a role or engagement yet.</div>}
      </div>
    </div>
  );
}
