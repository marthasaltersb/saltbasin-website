// Lead-to-Revenue Diagnostic panel (2026-08-09, Definition Studio Phase 2)
// — the real admin tab surfacing server/lib/l2rDiagnosticEngagement.js.
// Admin-scoped, same reasoning as CommercialOpportunityPanel.jsx. No 3D
// scene here — a diagnostic landscape is a data-review surface (domains,
// observations, findings, control coverage), not an agent/opportunity orbit.
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';

const S = {
  wrap: { background: '#0d1417', color: '#f5f0e8', minHeight: '100%', padding: '1.5rem' },
  header: { marginBottom: '1rem' },
  eyebrow: { fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', marginBottom: '0.3rem' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500 },
  sub: { fontSize: '0.8rem', color: '#a9a49a', marginTop: '0.4rem', maxWidth: 640, lineHeight: 1.5 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(220px,0.9fr) minmax(0,2fr)', gap: '1rem', marginTop: '1.25rem', alignItems: 'start' },
  panel: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', fontSize: '0.82rem' },
  panelTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem', marginBottom: '0.5rem' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '0.35rem 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' },
  listItem: (active) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.6rem', marginBottom: '0.35rem',
    background: active ? 'rgba(196,132,58,0.12)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${active ? 'rgba(196,132,58,0.4)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem',
  }),
  btn: (tone) => ({
    padding: '0.5rem 0.85rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 500,
    background: tone === 'gold' ? '#c4843a' : 'transparent', color: tone === 'gold' ? '#1c1410' : '#f5f0e8',
    borderColor: tone === 'ghost' ? 'rgba(255,255,255,0.2)' : 'transparent', borderWidth: tone === 'ghost' ? '0.5px' : 0, borderStyle: 'solid',
  }),
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.5rem 0.6rem', color: '#f5f0e8', fontSize: '0.8rem' },
  field: { marginBottom: '0.7rem' },
  fieldLabel: { display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', marginBottom: '0.3rem' },
  domainRow: (active) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.7rem', marginBottom: '0.3rem',
    background: active ? 'rgba(196,132,58,0.14)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${active ? 'rgba(196,132,58,0.45)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 8, cursor: 'pointer', fontSize: '0.74rem',
  }),
  chip: (color) => ({ fontSize: '0.62rem', letterSpacing: '0.04em', border: `0.5px solid ${color}88`, color, borderRadius: 10, padding: '0.08rem 0.5rem' }),
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.6rem' },
  cardTitle: { fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.25rem' },
  cardMeta: { fontSize: '0.68rem', color: '#8b877c', marginBottom: '0.4rem' },
  cardBody: { fontSize: '0.76rem', color: '#cfc9bd', lineHeight: 1.5 },
};

const RISK_COLOR = { critical: '#d98ca0', high: '#c4843a', medium: '#e0c789', low: '#8fbf98' };
function money(n) { return typeof n === 'number' ? `$${n.toLocaleString()}` : '—'; }
function coverageLabel(c) {
  if (!c) return 'No control data yet';
  return `${Math.round(c.density * 100)}% control coverage (${c.settlementClass}, n=${c.sampleSize})`;
}

export default function L2rDiagnosticPanel() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [landscape, setLandscape] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ companyName: '', arr: '', industry: '' });
  const [saving, setSaving] = useState(false);

  const loadDiagnostics = useCallback(async () => {
    const { diagnostics: rows } = await api.listL2rDiagnostics();
    setDiagnostics(rows);
    if (!selectedId && rows.length) setSelectedId(rows[0].id);
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    loadDiagnostics().finally(() => setLoading(false));
  }, [loadDiagnostics]);

  const loadLandscape = useCallback(async (id) => {
    if (!id) { setLandscape(null); return; }
    const data = await api.getL2rLandscape(id);
    setLandscape(data);
    setSelectedDomain((prev) => (data.domains.find((d) => d.domainKey === prev) ? prev : data.domains[0]?.domainKey || null));
  }, []);

  useEffect(() => { loadLandscape(selectedId); }, [selectedId, loadLandscape]);

  async function handleAddDiagnostic(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createL2rDiagnostic({ companyName: addForm.companyName, arr: addForm.arr ? Number(addForm.arr) : null, industry: addForm.industry || null });
      setShowAddForm(false);
      setAddForm({ companyName: '', arr: '', industry: '' });
      await loadDiagnostics();
      setSelectedId(created.id);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ ...S.wrap, textAlign: 'center', paddingTop: '4rem', color: '#a9a49a' }}>Loading Lead-to-Revenue Diagnostics…</div>;
  }

  const activeDomain = landscape?.domains.find((d) => d.domainKey === selectedDomain) || null;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.eyebrow}>Definition Studio · Current-State Diagnostic</div>
        <div style={S.title}>Lead-to-Revenue Diagnostic</div>
        <div style={S.sub}>
          Current-state observations and agent findings, triaged against the seeded Lead-to-Revenue capability
          hierarchy and QTR scenario library. A domain with no recorded observations shows no coverage score, not a
          guess.
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={S.panelTitle}>Engagements ({diagnostics.length})</div>
            <button style={S.btn('gold')} onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? 'Cancel' : '+ New'}</button>
          </div>
          {showAddForm && (
            <form onSubmit={handleAddDiagnostic} style={{ marginBottom: '1rem' }}>
              <div style={S.field}>
                <label style={S.fieldLabel}>Company</label>
                <input style={S.input} value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} placeholder="Client company name" required />
              </div>
              <div style={S.field}>
                <label style={S.fieldLabel}>ARR (USD)</label>
                <input style={S.input} type="number" value={addForm.arr} onChange={(e) => setAddForm({ ...addForm, arr: e.target.value })} />
              </div>
              <div style={S.field}>
                <label style={S.fieldLabel}>Industry</label>
                <input style={S.input} value={addForm.industry} onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} />
              </div>
              <button type="submit" style={S.btn('gold')} disabled={saving}>{saving ? 'Creating…' : 'Create Engagement'}</button>
            </form>
          )}
          {!diagnostics.length && !showAddForm && (
            <div style={{ color: '#8b877c', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>No diagnostic engagements yet.</div>
          )}
          {diagnostics.map((d) => (
            <div key={d.id} style={S.listItem(selectedId === d.id)} onClick={() => setSelectedId(d.id)}>
              <span>{d.metadata?.companyName || `Engagement ${d.id}`}</span>
            </div>
          ))}
        </div>

        <div>
          {!landscape && <div style={S.panel}>Select an engagement to view its current-state landscape.</div>}
          {landscape && (
            <>
              <div style={{ ...S.panel, marginBottom: '1rem' }}>
                <div style={S.panelTitle}>{landscape.rod.metadata?.companyName}</div>
                <div style={S.metaRow}><span>Observations</span><span>{landscape.totals.observationCount}</span></div>
                <div style={S.metaRow}><span>Findings</span><span>{landscape.totals.findingCount}</span></div>
                <div style={S.metaRow}><span>Total Estimated Annual Recovery</span><span style={{ color: '#c4843a', fontWeight: 600 }}>{money(landscape.totals.totalEstimatedRecovery)}</span></div>
                {landscape.rod.metadata?.notes && <p style={{ ...S.cardBody, marginTop: '0.6rem' }}>{landscape.rod.metadata.notes}</p>}
              </div>

              <div style={S.layout}>
                <div style={S.panel}>
                  <div style={S.panelTitle}>Domains ({landscape.domains.length})</div>
                  {landscape.domains.map((d) => (
                    <div key={d.domainKey} style={S.domainRow(selectedDomain === d.domainKey)} onClick={() => setSelectedDomain(d.domainKey)}>
                      <span>{d.domainKey.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#8b877c' }}>{d.observations.length + d.findings.length}</span>
                    </div>
                  ))}
                </div>

                <div style={S.panel}>
                  {!activeDomain && <div style={{ color: '#8b877c' }}>No domain selected.</div>}
                  {activeDomain && (
                    <>
                      <div style={S.panelTitle}>{activeDomain.domainKey.replace(/_/g, ' ')}</div>
                      <div style={{ ...S.cardMeta, marginBottom: '0.8rem' }}>{coverageLabel(activeDomain.controlCoverage)}</div>

                      {activeDomain.findings.length > 0 && (
                        <>
                          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', marginBottom: '0.4rem' }}>Findings</div>
                          {activeDomain.findings.map((f, i) => (
                            <div key={i} style={S.card}>
                              <div style={S.cardTitle}>{f.value.title}</div>
                              <div style={S.cardMeta}>
                                <span style={S.chip(RISK_COLOR[f.value.priority] || '#8b877c')}>{f.value.priority}</span>{' '}
                                <span style={S.chip('#8b877c')}>{f.value.findingType}</span>{' '}
                                {f.value.estimatedAnnualRecovery > 0 && <span style={{ color: '#c4843a' }}>{money(f.value.estimatedAnnualRecovery)}/yr</span>}
                                {f.linkedScenarioKey && <span style={{ marginLeft: '0.4rem', color: '#8fbf98' }}>· {f.linkedScenarioKey}</span>}
                              </div>
                              <div style={S.cardBody}>{f.value.description}</div>
                              {f.value.recommendation && <div style={{ ...S.cardBody, marginTop: '0.4rem', color: '#8fbf98' }}>→ {f.value.recommendation}</div>}
                            </div>
                          ))}
                        </>
                      )}

                      {activeDomain.observations.length > 0 && (
                        <>
                          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', margin: '0.8rem 0 0.4rem' }}>Observations</div>
                          {activeDomain.observations.map((o, i) => (
                            <div key={i} style={S.card}>
                              <div style={S.cardTitle}>{o.value.title}</div>
                              <div style={S.cardMeta}>
                                {o.value.riskLevel && <span style={S.chip(RISK_COLOR[o.value.riskLevel] || '#8b877c')}>{o.value.riskLevel} risk</span>}{' '}
                                {o.value.hasControls && <span style={S.chip('#8b877c')}>controls: {o.value.hasControls}</span>}{' '}
                                {o.actorKey && <span style={{ color: '#8b877c' }}>· {o.actorKey}</span>}
                                {o.linkedScenarioKey && <span style={{ marginLeft: '0.4rem', color: '#8fbf98' }}>· {o.linkedScenarioKey}</span>}
                              </div>
                              <div style={S.cardBody}>{o.value.description}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {!activeDomain.findings.length && !activeDomain.observations.length && (
                        <div style={{ color: '#8b877c', fontSize: '0.78rem' }}>No observations captured for this domain yet.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
