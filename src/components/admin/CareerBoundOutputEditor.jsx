// Editor for a career-bound output (2026-10-02, release career-bound-outputs).
//
// The output stores only a SELECTION over Career Master (which jobs, which
// library bullets in what order, which skills/tools/certifications) plus any
// wording the member changed for THIS output only. Everything else is read
// from Career Master each time it renders. A field that differs from Career
// Master is marked "Overridden for this output" and can be reverted to the
// Career Master value per field. This screen never approves or publishes:
// that stays in My Resume -> Resume Output History, which runs the
// finalization gate (assertReadyToFinalize / useToolCategoryGate().run).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import DocumentBlocksView from '../DocumentBlocksView.jsx';
import OutputVersionHistory from './OutputVersionHistory.jsx';

const INK = '#1b2a3b';
const S = {
  // Two columns on desktop; stacks to one column when the dialog is narrower than ~740px (phones).
  wrap: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem', alignItems: 'start' },
  col: { minWidth: 0 },
  card: { background: 'white', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '0.8rem 0.95rem', marginBottom: '0.8rem' },
  h: { fontSize: '0.9rem', fontWeight: 700, color: INK, margin: '0 0 0.4rem' },
  sub: { fontSize: '0.72rem', color: '#6a6a6a', lineHeight: 1.5 },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.8rem', fontFamily: 'inherit' },
  btn: (tone = 'outline') => ({
    padding: '4px 10px', fontSize: '0.72rem', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
    border: tone === 'outline' ? '1px solid rgba(0,0,0,0.25)' : 'none',
    background: tone === 'gold' ? '#c4843a' : tone === 'navy' ? INK : 'white',
    color: tone === 'gold' || tone === 'navy' ? 'white' : '#333',
  }),
  badge: { display: 'inline-block', marginLeft: 6, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8a5a12', background: '#FBEBD0', border: '1px solid #E8C98F', borderRadius: 999, padding: '0 6px', verticalAlign: 'middle' },
  warn: { background: '#FBEBD0', border: '1px solid #E8C98F', color: '#5C3B08', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '0.76rem', marginBottom: '0.7rem', lineHeight: 1.5 },
  err: { background: '#FBEAEA', border: '1px solid #E3B4B4', color: '#7A2323', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '0.76rem', marginBottom: '0.7rem' },
  row: { display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.35rem' },
};

const clone = (v) => JSON.parse(JSON.stringify(v));

function Overridden() { return <span style={S.badge}>Overridden for this output</span>; }
function OutputOnly() { return <span style={S.badge}>output-only</span>; }

export default function CareerBoundOutputEditor({ projectionId, onSaved, onOpenReviewQueue, hideQueueLink = false }) {
  const [state, setState] = useState(null);
  const [content, setContent] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newBullet, setNewBullet] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async (id) => {
    try {
      const s = await api.getCareerBoundOutput(id);
      setState(s); setContent(clone(s.content)); setName(s.name || ''); setError(null); setDirty(false);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    }
  }, []);
  useEffect(() => { setState(null); load(projectionId); }, [projectionId, load]);

  // Live preview: while there are unsaved edits, resolve the in-progress content against
  // Career Master (debounced, writes nothing). Saved state shows state.resolved.
  const [live, setLive] = useState(null);
  const [liveError, setLiveError] = useState(null);
  useEffect(() => {
    if (!dirty || !content) { setLive(null); setLiveError(null); return undefined; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await api.previewCareerBoundOutput(projectionId, { content });
        if (!cancelled) { setLive(r); setLiveError(null); }
      } catch (e) {
        if (!cancelled) setLiveError(e.message);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [content, dirty, projectionId]);

  const jobsById = useMemo(() => new Map((state?.jobs || []).map((j) => [j.id, j])), [state]);

  const edit = (fn) => { setContent((c) => { const next = clone(c); fn(next); return next; }); setDirty(true); };
  const cfgOf = (draft, jobId) => draft.jobs.find((j) => Number(j.jobId) === Number(jobId));

  async function save() {
    setSaving(true); setError(null);
    try {
      const r = await api.saveCareerBoundOutput(projectionId, { name, content });
      setState(r.state); setContent(clone(r.state.content)); setName(r.state.name || name); setDirty(false);
      if (r.newVersion) toast.success('Saved as a new draft version. The approved version and its QR link are unchanged until you approve this one.');
      else toast.success('Saved');
      onSaved?.({ id: r.id, newVersion: !!r.newVersion });
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addToLibrary(jobId) {
    const text = (newBullet[jobId] || '').trim();
    if (!text) return;
    try {
      const r = await api.addCareerBullet(jobId, text);
      if (r.syncError) toast.error(`Saved to Career Master, but the Career Atom sync failed: ${r.syncError}`);
      else toast.success('Added to Career Master');
      setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, bullets: j.bullets.some((b) => b.id === r.bullet.id) ? j.bullets : [...j.bullets, r.bullet] } : j)) }));
      edit((d) => { const c = cfgOf(d, jobId); if (c && !c.bulletIds.includes(r.bullet.id)) c.bulletIds.push(r.bullet.id); });
      setNewBullet((n) => ({ ...n, [jobId]: '' }));
    } catch (e) { toast.error(e.message); }
  }

  function addExtra(jobId) {
    const text = (newBullet[jobId] || '').trim();
    if (!text) return;
    edit((d) => {
      const c = cfgOf(d, jobId);
      c.extraBullets = c.extraBullets || [];
      let n = c.extraBullets.length + 1;
      while (c.extraBullets.some((x) => x.id === `x_${n}`)) n += 1;
      c.extraBullets.push({ id: `x_${n}`, text });
      c.bulletIds.push(`x_${n}`);
    });
    setNewBullet((n) => ({ ...n, [jobId]: '' }));
  }

  if (error && !state) return <div role="alert" style={S.err}>Could not load this output: {error}</div>;
  if (!state || !content) return <div style={S.sub}>Loading...</div>;

  const jobSections = content.sections.filter((s) => s.type === 'job');
  const usedJobIds = new Set(jobSections.map((s) => Number(s.jobId)));
  const listSections = content.sections.map((s, idx) => ({ s, idx })).filter((x) => x.s.type === 'master_list');
  const missingEntities = ['skills', 'tools', 'certifications'].filter((e) => !listSections.some((x) => x.s.entity === e));
  const LABEL = { skills: 'Skills', tools: 'Tools & technologies', certifications: 'Certifications' };

  return (
    <div data-testid="career-bound-editor">
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 700 }} htmlFor="cb-name">Output name</label>
        <input id="cb-name" style={{ ...S.input, width: 280 }} value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
        <span style={S.sub}>Status: <strong style={{ textTransform: 'capitalize' }}>{state.outputStatus}</strong></span>
        <button type="button" style={S.btn('gold')} disabled={saving || !dirty} onClick={save}>{saving ? 'Saving...' : 'Save changes'}</button>
        <button type="button" style={S.btn('outline')} onClick={() => setShowHistory((v) => !v)}>{showHistory ? 'Hide version history' : 'Version history'}</button>
        {!hideQueueLink && (
          <button type="button" style={S.btn('outline')} onClick={() => { onOpenReviewQueue ? onOpenReviewQueue() : window.dispatchEvent(new CustomEvent('sb-admin-switch-tab', { detail: { tab: 'careerReconciliation' } })); }}>
            Career Sources to Review ({state.openReviewTasks} open)
          </button>
        )}
      </div>
      {showHistory && (
        <div style={{ ...S.card, background: '#FBF8F3' }}><OutputVersionHistory projectionId={projectionId} onClose={() => setShowHistory(false)} /></div>
      )}
      {state.outputStatus !== 'draft' && (
        <div role="status" style={S.warn}>This version is {state.outputStatus}. Saving will not change it - your edits become a new draft version, and any QR link keeps showing the approved version until you approve the new one.</div>
      )}
      <div style={{ ...S.sub, marginBottom: '0.7rem' }}>
        This output reads its roles, bullets, skills, tools and certifications from Career Master. Anything you reword here applies to this output only and is marked <Overridden />; use <strong>Revert to Career Master</strong> on a field to go back to the Career Master wording. To approve or share, go to My Resume, Resume Output History (missing technology categories are asked for there).
      </div>
      {error && <div role="alert" style={S.err}>{error}</div>}
      {(state.warnings || []).map((w, i) => <div key={i} role="status" style={S.warn}>{w.message}</div>)}

      <div style={S.wrap}>
        <div style={S.col}>
          <div style={S.h}>Experience from Career Master</div>
          {jobSections.map((sec) => {
            const job = jobsById.get(Number(sec.jobId));
            const cfg = cfgOf(content, sec.jobId);
            if (!job || !cfg) return <div key={sec.jobId} style={S.warn}>Career Master job #{sec.jobId} no longer exists; it is left out of this output.</div>;
            const lib = new Map(job.bullets.map((b) => [b.id, b]));
            const extras = new Map((cfg.extraBullets || []).map((x) => [x.id, x]));
            const unselected = job.bullets.filter((b) => !cfg.bulletIds.includes(b.id));
            const titleOver = cfg.titleOverride != null && cfg.titleOverride !== job.title;
            const datesMaster = [job.startDate, job.endDate].filter(Boolean).join(' – ');
            const datesOver = cfg.datesOverride != null && cfg.datesOverride !== datesMaster;
            return (
              <div key={sec.jobId} style={S.card} data-testid={`cb-job-${job.id}`}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: INK }}>{job.company}</div>
                <div style={{ ...S.row, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <label style={S.sub}>Title {titleOver && <Overridden />}</label>
                    <input style={S.input} aria-label={`Title for ${job.company}`} value={cfg.titleOverride ?? job.title ?? ''} onChange={(e) => edit((d) => { cfgOf(d, job.id).titleOverride = e.target.value; })} />
                    {titleOver && <button type="button" style={{ ...S.btn(), marginTop: 4 }} onClick={() => edit((d) => { delete cfgOf(d, job.id).titleOverride; })}>Revert to Career Master</button>}
                    {titleOver && <div style={S.sub}>Career Master: {job.title}</div>}
                  </div>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <label style={S.sub}>Dates {datesOver && <Overridden />}</label>
                    <input style={S.input} aria-label={`Dates for ${job.company}`} value={cfg.datesOverride ?? datesMaster} onChange={(e) => edit((d) => { cfgOf(d, job.id).datesOverride = e.target.value; })} />
                    {datesOver && <button type="button" style={{ ...S.btn(), marginTop: 4 }} onClick={() => edit((d) => { delete cfgOf(d, job.id).datesOverride; })}>Revert to Career Master</button>}
                    {datesOver && <div style={S.sub}>Career Master: {datesMaster}</div>}
                  </div>
                </div>

                {job.keyMetrics && (
                  <div style={{ margin: '0.3rem 0' }}>
                    <label style={{ fontSize: '0.76rem' }}>
                      <input type="checkbox" checked={!!cfg.showKeyMetrics} onChange={(e) => edit((d) => { cfgOf(d, job.id).showKeyMetrics = e.target.checked; })} /> Show Career Master key metrics for {job.company}
                    </label>
                    {cfg.showKeyMetrics && (
                      <>
                        <textarea style={{ ...S.input, marginTop: 4 }} rows={2} aria-label={`Key metrics for ${job.company}`} value={cfg.keyMetricsOverride ?? job.keyMetrics} onChange={(e) => edit((d) => { cfgOf(d, job.id).keyMetricsOverride = e.target.value; })} />
                        {cfg.keyMetricsOverride != null && cfg.keyMetricsOverride !== job.keyMetrics && (
                          <div><Overridden /> <button type="button" style={S.btn()} onClick={() => edit((d) => { delete cfgOf(d, job.id).keyMetricsOverride; })}>Revert to Career Master</button></div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div style={{ ...S.sub, fontWeight: 700, marginTop: 6 }}>Bullets in this output</div>
                {cfg.bulletIds.length === 0 && <div style={S.sub}>No bullets selected.</div>}
                {cfg.bulletIds.map((bid, bi) => {
                  const libB = lib.get(bid);
                  const ext = extras.get(bid);
                  if (!libB && !ext) return <div key={bid} style={S.warn}>A selected bullet ({bid}) was removed from Career Master.{' '}<button type="button" style={S.btn()} onClick={() => edit((d) => { const c = cfgOf(d, job.id); c.bulletIds = c.bulletIds.filter((x) => x !== bid); })}>Remove from this output</button></div>;
                  const override = cfg.overrides?.[bid];
                  const shown = typeof override === 'string' ? override : (libB ? libB.text : ext.text);
                  const overridden = !!libB && typeof override === 'string' && override.trim() !== '' && override !== libB.text;
                  return (
                    <div key={bid} style={S.row} data-testid="cb-bullet">
                      <div style={{ flex: 1 }}>
                        <textarea style={S.input} rows={2} aria-label={`Bullet ${bi + 1} for ${job.company}`} value={shown}
                          onChange={(e) => edit((d) => {
                            const c = cfgOf(d, job.id);
                            if (ext) c.extraBullets.find((x) => x.id === bid).text = e.target.value;
                            else { c.overrides = c.overrides || {}; c.overrides[bid] = e.target.value; }
                          })} />
                        <div>
                          {ext && <OutputOnly />}
                          {overridden && <Overridden />}
                          {overridden && <button type="button" style={{ ...S.btn(), marginLeft: 6 }} onClick={() => edit((d) => { delete cfgOf(d, job.id).overrides[bid]; })}>Revert to Career Master</button>}
                          {overridden && <div style={S.sub}>Career Master: {libB.text}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 2 }}>
                        <button type="button" style={S.btn()} aria-label="Move bullet up" disabled={bi === 0} onClick={() => edit((d) => { const a = cfgOf(d, job.id).bulletIds; [a[bi - 1], a[bi]] = [a[bi], a[bi - 1]]; })}>↑</button>
                        <button type="button" style={S.btn()} aria-label="Move bullet down" disabled={bi === cfg.bulletIds.length - 1} onClick={() => edit((d) => { const a = cfgOf(d, job.id).bulletIds; [a[bi + 1], a[bi]] = [a[bi], a[bi + 1]]; })}>↓</button>
                        <button type="button" style={S.btn()} onClick={() => edit((d) => { const c = cfgOf(d, job.id); c.bulletIds = c.bulletIds.filter((x) => x !== bid); if (ext) c.extraBullets = c.extraBullets.filter((x) => x.id !== bid); })}>Remove</button>
                      </div>
                    </div>
                  );
                })}

                {unselected.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ ...S.sub, fontWeight: 700 }}>Career Master library, not in this output</div>
                    {unselected.map((b) => (
                      <div key={b.id} style={S.row}>
                        <div style={{ flex: 1, fontSize: '0.78rem' }}>{b.text}</div>
                        <button type="button" style={S.btn()} onClick={() => edit((d) => { cfgOf(d, job.id).bulletIds.push(b.id); })}>Add to this output</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <textarea style={S.input} rows={2} placeholder="Write a new bullet" aria-label={`New bullet for ${job.company}`} value={newBullet[job.id] || ''} onChange={(e) => setNewBullet((n) => ({ ...n, [job.id]: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <button type="button" style={S.btn()} onClick={() => addExtra(job.id)} disabled={!(newBullet[job.id] || '').trim()}>Add to this output only</button>
                    <button type="button" style={S.btn('navy')} onClick={() => addToLibrary(job.id)} disabled={!(newBullet[job.id] || '').trim()}>Add to Career Master and this output</button>
                  </div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <button type="button" style={S.btn()} onClick={() => edit((d) => { d.sections = d.sections.filter((x) => !(x.type === 'job' && Number(x.jobId) === job.id)); })}>Remove this job from the output</button>
                </div>
              </div>
            );
          })}
          {(state.jobs || []).filter((j) => !usedJobIds.has(j.id)).length > 0 && (
            <div style={S.card}>
              <div style={S.h}>Career Master jobs not in this output</div>
              {state.jobs.filter((j) => !usedJobIds.has(j.id)).map((j) => (
                <div key={j.id} style={S.row}>
                  <div style={{ flex: 1, fontSize: '0.78rem' }}>{j.company} - {j.title}</div>
                  <button type="button" style={S.btn()} onClick={() => edit((d) => {
                    d.sections.push({ type: 'job', jobId: j.id });
                    if (!cfgOf(d, j.id)) d.jobs.push({ jobId: j.id, bulletIds: j.bullets.map((b) => b.id) });
                  })}>Add {j.company}</button>
                </div>
              ))}
            </div>
          )}

          {listSections.map(({ s, idx }) => {
            const rows = state.lists[s.entity] || [];
            const picked = new Set(s.ids.map(Number));
            return (
              <div key={idx} style={S.card} data-testid={`cb-list-${s.entity}`}>
                <div style={S.h}>{LABEL[s.entity]} from Career Master</div>
                <label style={S.sub}>Heading on the output</label>
                <input style={S.input} aria-label={`${LABEL[s.entity]} heading`} value={s.title ?? ''} placeholder={s.entity.toUpperCase()} onChange={(e) => edit((d) => { d.sections[idx].title = e.target.value; })} />
                {rows.length === 0 && <div style={S.sub}>Career Master has none yet.</div>}
                {rows.map((r) => {
                  const on = picked.has(r.id);
                  const o = s.overrides?.[r.id];
                  const overridden = on && typeof o === 'string' && o.trim() !== '' && o !== r.label;
                  return (
                    <div key={r.id} style={{ ...S.row, alignItems: 'center' }}>
                      <input type="checkbox" aria-label={`Include ${r.label}`} checked={on} onChange={(e) => edit((d) => { const sec = d.sections[idx]; sec.ids = e.target.checked ? [...sec.ids, r.id] : sec.ids.filter((x) => Number(x) !== r.id); })} />
                      {on ? (
                        <input style={{ ...S.input, flex: 1 }} aria-label={`Wording for ${r.label}`} value={typeof o === 'string' ? o : r.label} onChange={(e) => edit((d) => { const sec = d.sections[idx]; sec.overrides = sec.overrides || {}; sec.overrides[r.id] = e.target.value; })} />
                      ) : <span style={{ fontSize: '0.78rem', flex: 1 }}>{r.label}</span>}
                      {overridden && <Overridden />}
                      {overridden && <button type="button" style={S.btn()} onClick={() => edit((d) => { delete d.sections[idx].overrides[r.id]; })}>Revert to Career Master</button>}
                    </div>
                  );
                })}
                {(s.extras || []).map((x) => (
                  <div key={x.id} style={{ ...S.row, alignItems: 'center' }}>
                    <OutputOnly />
                    <input style={{ ...S.input, flex: 1 }} aria-label={`Output-only entry ${x.id}`} value={x.text} onChange={(e) => edit((d) => { d.sections[idx].extras.find((y) => y.id === x.id).text = e.target.value; })} />
                    <button type="button" style={S.btn()} onClick={() => edit((d) => { d.sections[idx].extras = d.sections[idx].extras.filter((y) => y.id !== x.id); })}>Remove</button>
                  </div>
                ))}
                <button type="button" style={S.btn()} onClick={() => edit((d) => { const sec = d.sections[idx]; sec.extras = sec.extras || []; let n = sec.extras.length + 1; while (sec.extras.some((y) => y.id === `x_${n}`)) n += 1; sec.extras.push({ id: `x_${n}`, text: '' }); })}>Add an output-only entry</button>
                <button type="button" style={{ ...S.btn(), marginLeft: 6 }} onClick={() => edit((d) => { d.sections = d.sections.filter((_, i) => i !== idx); })}>Remove this section</button>
              </div>
            );
          })}
          {missingEntities.length > 0 && (
            <div style={S.card}>
              <div style={S.h}>Add a section from Career Master</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {missingEntities.map((e) => (
                  <button key={e} type="button" style={S.btn()} onClick={() => edit((d) => { d.sections.push({ type: 'master_list', entity: e, ids: (state.lists[e] || []).map((r) => r.id), overrides: {}, extras: [] }); })}>Add {LABEL[e]}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={S.col}>
          <div style={S.h}>Preview {dirty ? (liveError ? '(could not refresh; showing last saved)' : '(live, not saved yet)') : '(as saved)'}</div>
          {dirty && liveError && <div role="alert" style={S.err}>Live preview failed: {liveError}</div>}
          <div style={{ ...S.card, padding: '1rem' }} data-testid="cb-preview">
            <DocumentBlocksView content={dirty && live?.resolved ? live.resolved : state.resolved} showOutputOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
