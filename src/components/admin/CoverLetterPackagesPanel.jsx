// Cover letters and application packages (2026-10-02) — one row per tracked job opportunity:
// its cover letter (auto-drafted when the opportunity was added; "Generate for this opportunity"
// files or refreshes one on demand), and the combined application package with a table of
// contents. Mounted in MyResumePanel above the Resume Output History.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import CoverLetterSettings from './CoverLetterSettings.jsx';

const INK = '#1b2a3b';
const btn = (tone) => ({ padding: '0.35rem 0.7rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.74rem', border: tone === 'gold' ? 'none' : '1px solid rgba(27,42,59,0.25)', background: tone === 'gold' ? '#c4843a' : '#fff', color: tone === 'gold' ? '#fff' : INK });

// Job rec text = the posting. It feeds the template draft (which of your jobs to cite) and is part of
// the package content the cover-letter agent may search.
function JobRecEditor({ opportunity, onSaved }) {
  const [text, setText] = useState(opportunity.jobRecText || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  async function save() {
    setSaving(true); setErr(null);
    try {
      await api.saveOpportunityJobRec(opportunity.id, text);
      toast.success('Job rec text saved. Use “Regenerate from template” to apply it to the cover letter.');
      await onSaved?.();
    } catch (e) { setErr(e.message); toast.error(e.message); } finally { setSaving(false); }
  }
  return (
    <details style={{ marginTop: '0.3rem' }}>
      <summary style={{ fontSize: '0.74rem', cursor: 'pointer' }}>Job rec text</summary>
      <label htmlFor={`jobrec-${opportunity.id}`} style={{ display: 'block', fontSize: '0.7rem', margin: '0.3rem 0 0.15rem' }}>Paste the job posting</label>
      <textarea id={`jobrec-${opportunity.id}`} rows={5} value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem', border: '1px solid rgba(27,42,59,0.25)', borderRadius: 6, fontSize: '0.8rem', fontFamily: 'inherit' }} />
      {err && <div role="alert" style={{ color: '#a5531f', fontSize: '0.74rem' }}>{err}</div>}
      <button type="button" style={{ ...btn(), marginTop: '0.3rem' }} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save job rec text'}</button>
    </details>
  );
}

export default function CoverLetterPackagesPanel({ onOpenLetter, onOutputsChanged, reloadKey = 0 }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // `${id}:action`
  const [showSettings, setShowSettings] = useState(false);
  const fileInput = useRef(null);
  const importTarget = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = await api.listCoverLetterOpportunities();
      setRows(d.opportunities); setError(null);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);

  async function act(id, action, fn, okMessage) {
    setBusy(`${id}:${action}`);
    try {
      const r = await fn();
      toast.success(typeof okMessage === 'function' ? okMessage(r) : okMessage);
      await load();
      onOutputsChanged?.();
    } catch (e) { toast.error(e.message); setError(e.message); } finally { setBusy(null); }
  }

  // Adds a resume (TXT / DOCX / PDF) to an opportunity's package through the existing import endpoint.
  async function importResume(file) {
    const id = importTarget.current;
    if (!file || id == null) return;
    setBusy(`${id}:import`);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('outputType', 'resume');
      await api.importOutputForOpportunity(id, form);
      toast.success(`Added “${file.name}” to this package as a resume.`);
      await load();
      onOutputsChanged?.();
    } catch (e) { toast.error(`Import failed: ${e.message}`); setError(`Import failed: ${e.message}`); } finally { setBusy(null); }
  }

  return (
    <section aria-label="Cover letters and application packages" style={{ marginBottom: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '0.9rem 1rem', color: INK }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cover letters and application packages</div>
          <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5 }}>Every tracked job opportunity gets a cover letter. The application package combines it with your resumes behind a numbered table of contents.</div>
        </div>
        <button type="button" style={btn()} onClick={() => setShowSettings((v) => !v)}>{showSettings ? 'Hide settings' : 'Cover-letter settings'}</button>
      </div>

      {showSettings && <div style={{ marginTop: '0.8rem' }}><CoverLetterSettings /></div>}
      {error && <div role="alert" style={{ color: '#a5531f', fontSize: '0.78rem', marginTop: '0.6rem' }}>{error}</div>}
      {rows === null && !error && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.6rem' }}>Loading opportunities…</div>}
      {rows && rows.length === 0 && (
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.7rem' }}>
          No tracked job opportunities yet. Add one under Career Placement Agents → “Add opportunity”; its cover letter appears here and in the history below.
        </div>
      )}
      <input ref={fileInput} type="file" accept=".txt,.docx,.pdf" aria-label="Resume file to add to the package" style={{ display: 'none' }} onChange={(e) => { importResume(e.target.files?.[0]); e.target.value = ''; }} />
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.7rem' }}>
        {(rows || []).map((o) => (
          <div key={o.id} data-testid="opportunity-row" style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{o.jobTitle || 'Untitled role'}{o.company ? ` — ${o.company}` : ''} <span style={{ fontWeight: 400, color: '#8b877c', fontSize: '0.7rem' }}>· {o.stage}</span></div>
            <JobRecEditor opportunity={o} onSaved={load} />
            <div style={{ fontSize: '0.7rem', color: '#8b877c' }}>{o.hasJobRecText ? `Job rec text attached (${o.jobRecText.length} characters).` : 'No job rec text on this opportunity — the draft uses only the title, company and location.'}</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.4rem' }}>
              {o.letter ? (
                <>
                  <span style={{ fontSize: '0.76rem' }}>Cover letter: <strong style={{ textTransform: 'capitalize' }}>{o.letter.status}</strong> (#{o.letter.id})</span>
                  <button type="button" style={btn('gold')} onClick={() => onOpenLetter?.(o.letter.id)}>Edit with cover-letter agent</button>
                  <button type="button" style={btn()} disabled={busy === `${o.id}:regen`} onClick={() => act(o.id, 'regen', () => api.generateOpportunityCoverLetter(o.id, true), 'Regenerated from the template as a new draft version.')}>Regenerate from template</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.76rem' }}>Cover letter: none yet</span>
                  <button type="button" style={btn('gold')} disabled={busy === `${o.id}:gen`} onClick={() => act(o.id, 'gen', () => api.generateOpportunityCoverLetter(o.id), 'Cover letter drafted.')}>Generate for this opportunity</button>
                </>
              )}
            </div>
            {o.autoDraftError && <div role="alert" style={{ fontSize: '0.74rem', color: '#a5531f', marginTop: '0.3rem' }}>The automatic cover-letter draft failed ({new Date(o.autoDraftError.at).toLocaleString()}): {o.autoDraftError.message}</div>}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem' }}>
                Package: {o.combined ? <><strong style={{ textTransform: 'capitalize' }}>{o.combined.status}</strong> (#{o.combined.id}){o.combinedCurrent === false ? <span style={{ color: '#a5531f' }}> — out of date</span> : ''}</> : 'not built'}
                {' '}· includes the cover letter{o.resumes.length ? ` + ${o.resumes.length} resume output${o.resumes.length === 1 ? '' : 's'}` : ''}
              </span>
              <button type="button" style={btn()} disabled={busy === `${o.id}:pkg`} onClick={() => act(o.id, 'pkg', () => api.assembleOpportunityPackage(o.id), (r) => (r.status === 'unchanged' ? 'Package is already up to date.' : 'Package built with a table of contents.'))}>
                {o.combined ? 'Rebuild package' : 'Build package with contents'}
              </button>
              <button type="button" style={btn()} disabled={busy === `${o.id}:import`} onClick={() => { importTarget.current = o.id; fileInput.current?.click(); }}>Add a resume to this package</button>
              {o.combined && <a href={api.downloadResumeOutputUrl(o.combined.id)} style={{ ...btn(), textDecoration: 'none' }}>Download package PDF</a>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
