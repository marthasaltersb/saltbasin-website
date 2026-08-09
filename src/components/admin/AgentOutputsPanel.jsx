import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const STATUS_COLORS = {
  completed: 'var(--sb-admin-success)',
  running: 'var(--sb-admin-gold)',
  queued: 'var(--sb-admin-text-soft)',
  failed: 'var(--sb-admin-danger)',
};

const SEVERITY_COLORS = { high: 'var(--sb-admin-danger)', medium: 'var(--sb-admin-gold)', low: 'var(--sb-admin-text-soft)' };

function StatusDot({ status }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] || 'var(--sb-admin-text-soft)', marginRight: '.4rem' }} />;
}

export default function AgentOutputsPanel() {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  function load() {
    api.getAgentHubRuns()
      .then((data) => setRuns(data.runs))
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  // Deep link from NotificationBell: /admin?tab=agent-hub-outputs&run=123
  useEffect(() => {
    const runParam = new URLSearchParams(window.location.search).get('run');
    if (runParam) setSelected(Number(runParam));
  }, []);

  useEffect(() => {
    if (selected == null) { setDetail(null); return; }
    api.getAgentHubRun(selected).then(setDetail).catch((e) => toast.error(e.message));
  }, [selected]);

  async function setFindingStatus(finding, status) {
    try {
      await api.updateAgentHubFinding(finding.id, status);
      setDetail((prev) => ({ ...prev, findings: prev.findings.map((f) => (f.id === finding.id ? { ...f, status } : f)) }));
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (error) return <div style={{ padding: '2rem', color: 'var(--sb-admin-danger)' }}>Agent Outputs could not be loaded: {error}</div>;
  if (!runs) return <div style={{ padding: '2rem', color: 'var(--sb-admin-text-soft)' }}>Loading run history…</div>;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ width: 340, flexShrink: 0, borderRight: '0.5px solid var(--sb-admin-border)', overflowY: 'auto', padding: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Runs ({runs.length})</h2>
        {runs.length === 0 && <div style={{ color: 'var(--sb-admin-text-soft)', fontSize: '.85rem' }}>No agent runs yet — trigger one from the Agents tab.</div>}
        {runs.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelected(r.id)}
            className="sb-card"
            style={{
              padding: '.75rem 1rem', marginBottom: '.6rem', cursor: 'pointer',
              border: selected === r.id ? '1px solid var(--sb-admin-gold)' : undefined,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '.88rem' }}><StatusDot status={r.status} />{r.definitionLabel}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--sb-admin-text-soft)', marginTop: '.25rem' }}>
              {new Date(r.createdAt).toLocaleString()} · {r.trigger}
            </div>
            {r.stats?.findingsCount != null && (
              <div style={{ fontSize: '.72rem', color: 'var(--sb-admin-text-soft)', marginTop: '.15rem' }}>
                {r.stats.findingsCount} finding(s) · {r.stats.testsAdded || 0} test(s) proposed
                {r.stats.coveragePct != null ? ` · ${r.stats.coveragePct.toFixed(1)}% coverage` : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {!detail && <div style={{ color: 'var(--sb-admin-text-soft)' }}>Select a run to view its report.</div>}
        {detail && (
          <>
            <h1 style={{ marginTop: 0 }}><StatusDot status={detail.run.status} />{detail.run.definitionLabel}</h1>
            <div style={{ color: 'var(--sb-admin-text-soft)', marginBottom: '1rem' }}>
              {new Date(detail.run.createdAt).toLocaleString()} · triggered {detail.run.trigger}
              {detail.run.branchName && <> · branch <code>{detail.run.branchName}</code></>}
              {detail.run.prUrl && <> · <a href={detail.run.prUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sb-admin-gold-warm)' }}>Pull Request</a></>}
            </div>

            {detail.run.error && (
              <section className="sb-card" style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--sb-admin-danger)' }}>
                <strong style={{ color: 'var(--sb-admin-danger)' }}>Run failed</strong>
                <div style={{ marginTop: '.4rem', fontSize: '.85rem' }}>{detail.run.error}</div>
              </section>
            )}

            {detail.run.stats && (
              <section style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  ['Files scanned', detail.run.stats.filesScanned],
                  ['Files changed', detail.run.stats.filesChanged],
                  ['Tests proposed', detail.run.stats.testsAdded],
                  ['Findings', detail.run.stats.findingsCount],
                  ['Coverage', detail.run.stats.coveragePct != null ? `${detail.run.stats.coveragePct.toFixed(1)}%` : '—'],
                  ['API called', detail.run.stats.apiCalled ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="sb-card" style={{ padding: '.75rem 1rem', minWidth: 110 }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{value ?? '—'}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--sb-admin-text-soft)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                  </div>
                ))}
              </section>
            )}

            <section style={{ marginBottom: '1.5rem' }}>
              <h2>Findings ({detail.findings.length})</h2>
              {detail.findings.length === 0 && <div style={{ color: 'var(--sb-admin-text-soft)' }}>No findings this run.</div>}
              {detail.findings.map((f) => (
                <div key={f.id} className="sb-card" style={{ padding: '.85rem 1rem', marginBottom: '.6rem', opacity: f.status === 'dismissed' ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ color: SEVERITY_COLORS[f.severity], fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', marginRight: '.5rem' }}>{f.severity}</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--sb-admin-text-soft)' }}>{f.category.replace('_', ' ')}</span>
                      <div style={{ fontWeight: 600, marginTop: '.25rem' }}>{f.title}</div>
                      {f.filePath && <div style={{ fontSize: '.78rem', color: 'var(--sb-admin-text-soft)' }}><code>{f.filePath}{f.line ? `:${f.line}` : ''}</code></div>}
                      {f.detail && <div style={{ fontSize: '.85rem', marginTop: '.4rem' }}>{f.detail}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                      {f.status !== 'addressed' && <button className="sb-btn-outline" onClick={() => setFindingStatus(f, 'addressed')}>Mark addressed</button>}
                      {f.status !== 'dismissed' && <button className="sb-btn-outline" onClick={() => setFindingStatus(f, 'dismissed')}>Dismiss</button>}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {detail.run.summary && (
              <section>
                <h2>Full report</h2>
                <pre className="sb-card" style={{ padding: '1rem', whiteSpace: 'pre-wrap', fontSize: '.85rem', lineHeight: 1.6 }}>{detail.run.summary}</pre>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
