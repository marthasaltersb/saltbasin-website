// Journey flow -> experience mapping UI parts (docs/changes/journey-flow-experience-mapping.md), used by FlowStudioPanel:
//  - PickField: a structured binding (one pick, or a list of picks shown as removable chips) read from the platform catalogs
//  - ConditionEditor: the structured branch condition of a connector (data field, operator, value)
//  - JourneyPanel: preview of the generated user journey, impact + one approval, activation, read-back, test run
//  - ExperienceChannelsCard / OptionListsCard: Settings (which channels are mapped; the actor / licence / interaction lists)
// Everything is a button or a select (no hover-only action) and 44px tall; errors are shown in a role="alert" box.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { CONDITION_OPS } from '../../lib/flowJourneyCompile.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

function useFieldCache() {
  const cache = useRef(new Map());
  return async (object) => {
    if (!cache.current.has(object)) cache.current.set(object, (await api.fsDataFields(object)).fields);
    return cache.current.get(object);
  };
}

/** Two selects (data object, then field) that report `table.column`. */
function DataFieldPicker({ label, objects, onPick, disabled, initialObject = '' }) {
  const loadFields = useFieldCache();
  const [object, setObject] = useState(initialObject);
  const [fields, setFields] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => { let live = true; if (object) loadFields(object).then((f) => { if (live) { setFields(f); setErr(''); } }).catch((e) => { if (live) setErr(e.message); }); else setFields([]); return () => { live = false; }; }, [object]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fs-row" style={{ marginBottom: '.3rem' }}>
      <label className="fs-label" style={{ flex: '1 1 150px' }}>{label}: data object
        <select className="fs-input" aria-label={`${label}: data object`} value={object} disabled={disabled} onChange={(e) => setObject(e.target.value)}>
          <option value="">Choose a data object…</option>
          {objects.map((o) => <option key={o.key} value={o.key}>{o.label} ({o.fieldCount})</option>)}
        </select></label>
      <label className="fs-label" style={{ flex: '1 1 150px' }}>{label}: field
        <select className="fs-input" aria-label={`${label}: field`} value="" disabled={disabled || !object} onChange={(e) => { if (e.target.value) onPick(e.target.value); }}>
          <option value="">{object ? 'Choose a field…' : 'Pick a data object first'}</option>
          {fields.map((f) => <option key={f.key} value={f.key}>{f.label} ({f.type})</option>)}
        </select></label>
      {err ? <div className="fs-alert" role="alert">{err}</div> : null}
    </div>
  );
}

export function PickField({ field, value, baseValue, scenarioMode, catalogs, scenarios, dataObjects, disabled, onChange }) {
  const list = field.source === 'variants' ? scenarios.map((s) => ({ key: s, label: s })) : (catalogs?.[field.source] || []);
  const labelOf = (k) => list.find((o) => o.key === k)?.label || k;
  const known = (k) => field.source === 'dataFields' || list.some((o) => o.key === k);
  const multi = field.type === 'multipick';
  const current = multi ? (Array.isArray(value) ? value : []) : (typeof value === 'string' ? value : '');
  const inherited = scenarioMode && (multi ? !(Array.isArray(value) && value.length) : !value);
  const base = multi ? (Array.isArray(baseValue) ? baseValue : []) : (typeof baseValue === 'string' ? baseValue : '');
  const groups = useMemo(() => { const g = new Map(); for (const o of list) { const k = o.group || ''; if (!g.has(k)) g.set(k, []); g.get(k).push(o); } return [...g]; }, [list]);
  const options = groups.map(([g, os]) => (g ? <optgroup key={g} label={g}>{os.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</optgroup> : os.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)));
  if (!catalogs && field.source !== 'variants') return <div className="fs-label" style={{ marginBottom: '.45rem' }}>{field.label}<span className="fs-muted">Loading the list…</span></div>;
  if (!multi) {
    return (
      <label className="fs-label" style={{ marginBottom: '.45rem' }}>{field.label}
        <select className="fs-input" aria-label={field.label} value={current} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">{scenarioMode ? `Inherit${base ? ` (${labelOf(base)})` : ''}` : 'Not set'}</option>
          {current && !known(current) ? <option value={current}>{current} (not in the list)</option> : null}
          {options}
        </select>
        {field.hint ? <span className="fs-muted">{field.hint}</span> : null}
      </label>
    );
  }
  return (
    <div className="fs-label" style={{ marginBottom: '.55rem' }} role="group" aria-label={field.label}>
      <span>{field.label}</span>
      {inherited && base.length ? <span className="fs-muted">Inherited from base: {base.map(labelOf).join(', ')}</span> : null}
      {current.length === 0 && !inherited ? <span className="fs-muted">Nothing picked.</span> : null}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
        {current.map((k) => (
          <li key={k} style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <span style={{ flex: 1, minWidth: 0 }}>{labelOf(k)}{!known(k) ? ' (not in the list)' : ''}</span>
            <button type="button" className="fs-btn2" style={{ minHeight: 44 }} disabled={disabled} aria-label={`Remove ${labelOf(k)} from ${field.label}`} onClick={() => onChange(current.filter((x) => x !== k))}>Remove</button>
          </li>
        ))}
      </ul>
      {field.source === 'dataFields'
        ? <DataFieldPicker label={field.label} objects={dataObjects || []} disabled={disabled} onPick={(k) => { if (!current.includes(k)) onChange([...current, k]); }} />
        : (
          <select className="fs-input" aria-label={`Add to ${field.label}`} value="" disabled={disabled} onChange={(e) => { const k = e.target.value; if (k && !current.includes(k)) onChange([...current, k]); }}>
            <option value="">Add…</option>
            {options}
          </select>
        )}
      {field.hint ? <span className="fs-muted">{field.hint}</span> : null}
    </div>
  );
}

export function ConditionEditor({ edge, dataObjects, disabled, onChange }) {
  const c = edge.bind?.condition || { field: '', op: '', value: '' };
  const op = CONDITION_OPS.find((o) => o.key === c.op);
  const set = (patch) => onChange({ ...c, ...patch });
  const has = !!(c.field || c.op || c.value);
  return (
    <fieldset style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '.5rem 0', padding: '.5rem .6rem' }} data-testid="fs-condition">
      <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>Branch condition</legend>
      <p className="fs-muted">The structured rule a person or the platform checks to take this branch. Leave it empty for the "otherwise" branch.</p>
      <p className="fs-muted" data-testid="fs-condition-current">{c.field ? `Data field: ${c.field}` : 'No data field picked.'}</p>
      <DataFieldPicker label="Condition" objects={dataObjects || []} disabled={disabled} initialObject={c.field ? c.field.split('.')[0] : ''} onPick={(k) => set({ field: k })} />
      <label className="fs-label">Condition: operator
        <select className="fs-input" aria-label="Condition: operator" value={c.op} disabled={disabled} onChange={(e) => set({ op: e.target.value })}>
          <option value="">Choose an operator…</option>
          {CONDITION_OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select></label>
      {op?.needsValue ? <label className="fs-label">Condition: value<input className="fs-input" aria-label="Condition: value" value={c.value} disabled={disabled} onChange={(e) => set({ value: e.target.value })} /></label> : null}
      <div className="fs-row" style={{ marginTop: '.4rem' }}><button type="button" className="fs-btn2" disabled={disabled || !has} onClick={() => onChange(null)}>Clear condition</button></div>
    </fieldset>
  );
}

const statusColor = { ok: 'ok', 'not set': 'warning', 'not mapped': '', invalid: 'error' };

export function JourneyPanel({ flowId, flow, dirty, m, gate, onFlowChanged }) {
  const [source, setSource] = useState(flow.publishedVersion ? 'published' : 'draft');
  const [prev, setPrev] = useState(null);
  const [active, setActive] = useState(null);
  const [variant, setVariant] = useState('base');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const load = async (src = source) => {
    try { setPrev(await api.fsJourneyPreview(flowId, src)); m.clear(); } catch (e) { setPrev(null); m.fail(e); }
  };
  const loadActive = async () => { try { setActive(await api.fsJourney(flowId)); } catch (e) { m.fail(e); } };
  useEffect(() => { load(flow.publishedVersion ? 'published' : 'draft'); loadActive(); }, [flowId]); // eslint-disable-line react-hooks/exhaustive-deps
  const activate = async () => {
    setBusy(true);
    try {
      const r = await gate.run(() => api.fsJourneyActivate(flowId, prev.token, note));
      if (r) { await load('published'); await loadActive(); await onFlowChanged(); m.say(`Journey activated from version ${r.version}`); }
    } catch (e) { m.fail(e); } finally { setBusy(false); }
  };
  const testRun = async () => {
    try { const r = await api.fsJourneyTestRun(flowId); m.say(`Test journey started at gate ${r.currentStage}`); await loadActive(); } catch (e) { m.fail(e); }
  };
  const pathOf = prev?.path?.find((p) => p.key === variant) || prev?.path?.[0];
  return (
    <div className="fs-card" aria-label="Journey" data-testid="fs-journey"><h3>Journey</h3>
      <p className="fs-muted">A published flow version becomes a journey the platform runs: its gates, the steps each gate asks for, who acts, what each step renders as. Preview it here, then activate it with one approval.</p>
      {dirty ? <p className="fs-muted">You have unsaved changes. The preview uses the saved version.</p> : null}
      <div className="fs-row">
        <button type="button" className="fs-btn2" aria-pressed={source === 'published'} onClick={() => { setSource('published'); load('published'); }}>Preview published version</button>
        <button type="button" className="fs-btn2" aria-pressed={source === 'draft'} onClick={() => { setSource('draft'); load('draft'); }}>Preview saved draft</button>
      </div>
      {prev ? (
        <div data-testid="fs-journey-preview">
          <p className="fs-sub">Preview of {prev.source === 'draft' ? `saved draft version ${prev.version}` : `published version ${prev.version}`}. <span className={`fs-pill ${prev.errors.length ? 'error' : prev.warnings.length ? 'warning' : 'ok'}`} data-testid="fs-journey-count">{prev.errors.length ? `${prev.errors.length} problem(s) block activation` : prev.warnings.length ? `${prev.warnings.length} warning(s)` : 'no problems'}</span></p>
          {prev.errors.length || prev.warnings.length ? <ul className="fs-find" data-testid="fs-journey-findings">{[...prev.errors.map((x) => ({ ...x, severity: 'error' })), ...prev.warnings.map((x) => ({ ...x, severity: 'warning' }))].map((x, i) => <li key={i}><span className={`fs-pill ${x.severity}`}>{x.severity}</span> {x.message}</li>)}</ul> : null}
          <div className="fs-row"><label className="fs-label">Variant
            <select className="fs-input" aria-label="Journey variant" value={pathOf?.key || 'base'} onChange={(e) => setVariant(e.target.value)}>{prev.path.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label></div>
          <h4 style={{ margin: '.4rem 0' }}>Generated user journey</h4>
          {pathOf?.steps.length ? (
            <ol data-testid="fs-journey-path" style={{ paddingLeft: '1.2rem' }}>
              {pathOf.steps.map((s) => (
                <li key={s.nodeId} style={{ marginBottom: '.35rem' }}><strong>{s.label}</strong> <span className="fs-pill">{s.kind}</span>{s.lane ? ` · ${s.lane}` : ''}{s.actors.length ? ` · actors: ${s.actors.join(', ')}` : ''}{s.experience.length ? <div className="fs-muted">{s.experience.join(' · ')}</div> : null}</li>
              ))}
            </ol>
          ) : <p className="fs-muted">No steps in this variant.</p>}
          <h4 style={{ margin: '.4rem 0' }}>Gates</h4>
          {prev.gates.length === 0 ? <p className="fs-muted">No gates.</p> : (
            <ul data-testid="fs-journey-gates" style={{ paddingLeft: '1.2rem' }}>
              {prev.gates.map((g) => (
                <li key={g.stageKey} style={{ marginBottom: '.4rem' }}><strong>{g.label}</strong> {g.implicit ? '(closing stage)' : <>(key <code>{g.gateKey}</code>)</>} asks for {g.requiredMolecules.length} step(s){g.requiredActorRoles.length ? `, roles: ${g.requiredActorRoles.join(', ')}` : ''}
                  <ul>{g.branches.map((b, i) => <li key={i} className="fs-muted">→ {b.to}{b.label ? ` (${b.label})` : ''}: {b.condition ? b.condition.text : 'otherwise (no condition)'}</li>)}</ul></li>
              ))}
            </ul>
          )}
          <h4 style={{ margin: '.4rem 0' }}>Experience map</h4>
          <p className="fs-muted" data-testid="fs-journey-experience-summary">{prev.experience.mapped} value(s) render · {prev.experience.notSet} not set · {prev.experience.notMapped} not mapped · {prev.experience.invalid} invalid</p>
          <div className="fs-scroll"><table className="fs-table" data-testid="fs-journey-experience"><thead><tr><th>Step</th>{prev.steps[0]?.experience.map((x) => <th key={x.channelKey}>{x.label}</th>)}</tr></thead>
            <tbody>{prev.steps.filter((s) => s.kind !== 'terminal').map((s) => (
              <tr key={s.nodeId}><td>{s.label}</td>{s.experience.map((x) => <td key={x.channelKey}><span className={`fs-pill ${statusColor[x.status] || ''}`}>{x.status === 'ok' ? 'mapped' : x.status}</span>{x.status === 'ok' || x.status === 'invalid' ? <div>{x.display}</div> : null}</td>)}</tr>
            ))}</tbody></table></div>
          <div className="fs-card" role="group" aria-label="Impact of activating" data-testid="fs-journey-impact" style={{ marginTop: '.8rem' }}>
            <h3>Impact of activating</h3>
            <ul>{prev.impact.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            {prev.source !== 'published' ? <p className="fs-muted">Only a published version can be activated. Publish the flow, then preview the published version.</p> : null}
            {prev.source === 'published' && !flow.canActivateJourney ? <p className="fs-muted" data-testid="fs-journey-noperm">Your role cannot activate journeys. An administrator can allow it in the studio Settings, or activate it for you.</p> : null}
            <label className="fs-label">Note (optional)<input className="fs-input" aria-label="Activation note" value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <div className="fs-row" style={{ marginTop: '.4rem' }}>
              <button type="button" className="fs-btn" disabled={!prev.canActivate || busy} onClick={activate}>Approve and activate</button>
            </div>
          </div>
        </div>
      ) : null}
      <h4 style={{ margin: '.8rem 0 .4rem' }}>Active journey</h4>
      {active?.active ? (
        <div data-testid="fs-journey-active">
          <p>Running as <code>{active.scenarioKey}</code> from flow version {active.version}, activated by {active.activatedBy?.label || 'unknown'}. {active.gates.length} gate(s); {active.running.length} journey(s) running.</p>
          <ol style={{ paddingLeft: '1.2rem' }}>{active.gates.map((g) => <li key={g.stageKey}><strong>{g.label}</strong>: asks for {g.requiredMolecules.map((x) => x.label).join(', ') || 'nothing'}{g.requiredActorRoles.length ? `; roles ${g.requiredActorRoles.join(', ')}` : ''}</li>)}</ol>
          <div className="fs-row"><button type="button" className="fs-btn2" onClick={testRun}>Start a test journey</button></div>
          {active.running.filter((r) => r.mine).length ? <p className="fs-muted" data-testid="fs-journey-mine">Your test journeys: {active.running.filter((r) => r.mine).map((r) => `#${r.rodId} at ${r.currentStage}`).join(', ')}</p> : null}
        </div>
      ) : <p className="fs-muted" data-testid="fs-journey-inactive">{active?.message || 'Loading…'}</p>}
    </div>
  );
}

export function ExperienceChannelsCard({ m, canEdit }) {
  const [data, setData] = useState(null);
  const [want, setWant] = useState({});
  const [note, setNote] = useState('');
  const [impact, setImpact] = useState(null);
  const load = async () => { try { const d = await api.fsExperienceChannels(); setData(d); setWant(Object.fromEntries(d.channels.map((c) => [c.key, c.enabled]))); } catch (e) { m.fail(e); } };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (approved) => {
    try {
      const changes = Object.fromEntries(data.channels.filter((c) => want[c.key] !== c.enabled).map((c) => [c.key, want[c.key]]));
      const r = await api.fsSaveExperienceChannels({ channels: changes, note, approved });
      setImpact(null); setNote(''); m.say('Experience channels saved'); setData(r); setWant(Object.fromEntries(r.channels.map((c) => [c.key, c.enabled])));
    } catch (e) { if (e.body?.code === 'impact_approval_required') { setImpact(e.body.impact); m.clear(); } else m.fail(e); }
  };
  if (!data) return <div className="fs-card"><h3>Experience channels</h3><div className="fs-empty">Loading…</div></div>;
  const changed = data.channels.some((c) => want[c.key] !== c.enabled);
  return (
    <div className="fs-card" data-testid="fs-experience-channels"><h3>Experience channels</h3>
      <p className="fs-muted">Which experience channels a step can render through. Each is a render binding from a step field; unmapping one makes it read "not mapped" in every generated journey.</p>
      {data.channels.map((c) => (
        <div className="fs-row" key={c.key} style={{ alignItems: 'center' }}>
          <label className="fs-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem', flex: '1 1 240px' }}>
            <input type="checkbox" style={{ width: 24, height: 24 }} aria-label={`Channel ${c.label} mapped`} checked={!!want[c.key]} disabled={!canEdit} onChange={(e) => setWant({ ...want, [c.key]: e.target.checked })} />{c.label}</label>
          <span className="fs-muted" style={{ flex: '2 1 260px' }}>{c.source ? `Source: ${c.source}` : 'No source field mapped'}</span>
        </div>
      ))}
      <label className="fs-label">Why is it changing?<input className="fs-input" aria-label="Experience channels note" value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="fs-row" style={{ marginTop: '.5rem' }}><button type="button" className="fs-btn" disabled={!canEdit || !changed} onClick={() => save()}>Save experience channels</button></div>
      {impact ? (
        <div className="fs-card" role="group" aria-label="Impact on published flows"><h3>Impact on published flows</h3>
          <ul>{impact.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          <div className="fs-row"><button type="button" className="fs-btn" onClick={() => save(impact.token)}>Approve and apply</button><button type="button" className="fs-btn2" onClick={() => setImpact(null)}>Cancel</button></div>
        </div>
      ) : null}
    </div>
  );
}

const LIST_TITLES = { actors: 'Actor options', licences: 'Licence options', interactions: 'Interaction options' };
export function OptionListsCard({ d, upd }) {
  const lists = d.lists || {};
  return (
    <div className="fs-card" data-testid="fs-option-lists"><h3>Option lists for structured bindings</h3>
      <p className="fs-muted">What the pickers offer for actors, licences and interactions. Capabilities, permissions, data ports, World Shell layers, crystal variants and data fields are read live from the platform.</p>
      {Object.keys(LIST_TITLES).map((name) => (
        <div key={name} style={{ marginBottom: '.6rem' }}>
          <strong>{LIST_TITLES[name]}</strong>
          <div className="fs-scroll"><table className="fs-table"><thead><tr><th>Key</th><th>Label</th><th /></tr></thead>
            <tbody>{(lists[name] || []).map((it, i) => (
              <tr key={i}>
                <td><input className="fs-input" aria-label={`${LIST_TITLES[name]} ${i + 1} key`} value={it.key} onChange={(e) => upd(0, (n) => { n.lists[name][i].key = e.target.value; })} /></td>
                <td><input className="fs-input" aria-label={`${LIST_TITLES[name]} ${i + 1} label`} value={it.label} onChange={(e) => upd(0, (n) => { n.lists[name][i].label = e.target.value; })} /></td>
                <td><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.lists[name].splice(i, 1); })}>Remove</button></td>
              </tr>))}</tbody></table></div>
          <div className="fs-row" style={{ marginTop: '.4rem' }}><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.lists = n.lists || {}; n.lists[name] = n.lists[name] || []; n.lists[name].push({ key: `option${n.lists[name].length + 1}`, label: 'New option' }); })}>Add {LIST_TITLES[name].toLowerCase().replace(' options', '')} option</button></div>
        </div>
      ))}
    </div>
  );
}

export { clone };
