/**
 * MyResumePanel
 * Member admin app for managing resume presets and AI-tailored output generation.
 *
 * Features:
 *  1. Resume preset builder — pick which pages / sections to include
 *  2. Primary preset — publicly downloadable link on member's profile
 *  3. Resume interpreter agent — paste a job description and get a tailored output
 */
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const S = {
  wrap: { padding: '1.5rem', maxWidth: 880, margin: '0 auto', fontFamily: 'var(--sb-font-body)' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.25rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: (active) => ({
    border: `2px solid ${active ? 'var(--sb-gold, #c4843a)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10,
    padding: '1rem 1.25rem',
    background: active ? 'rgba(196,132,58,0.06)' : 'white',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative',
  }),
  cardTitle: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  cardSub: { fontSize: '0.72rem', color: '#888' },
  primaryBadge: { position: 'absolute', top: 8, right: 8, background: 'var(--sb-gold, #c4843a)', color: 'white', borderRadius: 6, fontSize: '0.6rem', padding: '2px 7px', letterSpacing: '0.08em', fontFamily: 'var(--sb-font-label)' },
  sectionRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontSize: '0.8rem', color: '#444' },
  btn: (style) => ({
    padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' ? 'white' : '#333',
  }),
  textarea: { width: '100%', minHeight: 160, padding: '0.75rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  output: { background: 'var(--sb-ivory, #faf8f4)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1.25rem', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: '1rem', maxHeight: 480, overflowY: 'auto' },
  divider: { border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.1)', margin: '2rem 0' },
  sectionLabel: { fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' },
};

// ── helpers ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#444' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--sb-gold, #c4843a)', width: 15, height: 15 }} />
      {label}
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyResumePanel() {
  const [site, setSite] = useState(null);
  const [presets, setPresets] = useState([]); // [{ id, name, primaryResume, includedSections: [sectionId] }]
  const [editingPreset, setEditingPreset] = useState(null); // preset being configured
  const [saving, setSaving] = useState(false);

  // Agent state
  const [jobDesc, setJobDesc] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);

  // Load published member site + saved resume config
  useEffect(() => {
    api.getMemberDraftSite().then(s => setSite(s)).catch(() => {});
    loadPresets();
  }, []);

  function loadPresets() {
    fetch('/api/members/me/resume-presets', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { presets: [] })
      .then(d => setPresets(d.presets || []))
      .catch(() => {});
  }

  async function savePresets(next) {
    setSaving(true);
    try {
      const r = await fetch('/api/members/me/resume-presets', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets: next }),
      });
      if (!r.ok) throw new Error(await r.text());
      setPresets(next);
      toast('Resume presets saved');
    } catch (e) {
      toast('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  function addPreset() {
    const preset = { id: `preset-${Date.now()}`, name: 'My Resume', primaryResume: presets.length === 0, includedSections: [] };
    setEditingPreset({ ...preset });
  }

  function saveEditingPreset() {
    if (!editingPreset) return;
    const next = presets.some(p => p.id === editingPreset.id)
      ? presets.map(p => p.id === editingPreset.id ? editingPreset : p)
      : [...presets, editingPreset];
    savePresets(next);
    setEditingPreset(null);
  }

  function setPrimary(id) {
    const next = presets.map(p => ({ ...p, primaryResume: p.id === id }));
    savePresets(next);
  }

  function deletePreset(id) {
    if (!confirm('Delete this resume preset?')) return;
    savePresets(presets.filter(p => p.id !== id));
  }

  async function runAgent() {
    if (!jobDesc.trim()) { toast('Paste a job description first'); return; }
    setAgentRunning(true);
    setAgentOutput('');
    const preset = presets.find(p => p.id === selectedPresetId) || presets[0];
    try {
      const r = await fetch('/api/members/me/agent', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a professional resume writer helping a candidate tailor their resume. Below is their resume content and a job description. Rewrite the professional summary and key bullet points to best match the job requirements. Keep it truthful and specific — don't invent skills or experience.

JOB DESCRIPTION:
${jobDesc}

RESUME PRESET: ${preset?.name || 'Primary Resume'}
INCLUDED SECTIONS: ${preset?.includedSections?.join(', ') || 'all sections'}

Please return:
1. A tailored professional summary (3-4 sentences)
2. Top 5 skills to highlight for this role
3. Suggested bullet-point rewrites for the most relevant experiences
4. Any gaps to be aware of when applying`,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setAgentOutput(d.response || d.content || JSON.stringify(d, null, 2));
    } catch (e) {
      toast('Agent failed: ' + e.message);
      setAgentOutput('Error: ' + e.message);
    } finally {
      setAgentRunning(false);
    }
  }

  // Flatten all sections from the site for the preset builder
  const allSections = [];
  if (site?.pages) {
    for (const [pageKey, page] of Object.entries(site.pages)) {
      (page.sections || []).forEach(sec => {
        allSections.push({ pageKey, pageName: page.name, sectionId: sec.id, sectionName: sec.name || sec.type });
      });
    }
  }

  const primaryPreset = presets.find(p => p.primaryResume);
  const publicResumeUrl = primaryPreset ? `/output/resume?presetId=${primaryPreset.id}` : '/output/resume';

  return (
    <div style={S.wrap}>
      <div style={S.h1}>My Resume</div>
      <div style={S.sub}>Configure resume presets and generate tailored outputs for job applications.</div>

      {/* ── Preset list ───────────────────────────────────────────────────── */}
      <div style={S.sectionLabel}>Resume Presets</div>
      <div style={S.grid}>
        {presets.map(preset => (
          <div key={preset.id} style={S.card(editingPreset?.id === preset.id)} onClick={() => setEditingPreset({ ...preset })}>
            {preset.primaryResume && <div style={S.primaryBadge}>PRIMARY</div>}
            <div style={S.cardTitle}>{preset.name}</div>
            <div style={S.cardSub}>{preset.includedSections.length} section{preset.includedSections.length !== 1 ? 's' : ''} included</div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {!preset.primaryResume && (
                <button style={S.btn('outline')} onClick={e => { e.stopPropagation(); setPrimary(preset.id); }}>Set Primary</button>
              )}
              <button style={S.btn('outline')} onClick={e => { e.stopPropagation(); deletePreset(preset.id); }}>Delete</button>
            </div>
          </div>
        ))}
        <div style={{ ...S.card(false), display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, color: 'var(--sb-gold, #c4843a)', fontWeight: 700, fontSize: '0.9rem', border: '2px dashed rgba(196,132,58,0.4)' }} onClick={addPreset}>
          + New Preset
        </div>
      </div>

      {/* Public download link */}
      {primaryPreset && (
        <div style={{ background: 'rgba(2,161,166,0.06)', border: '0.5px solid rgba(2,161,166,0.3)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          <strong>Public resume link:</strong>{' '}
          <a href={publicResumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sb-teal-deep, #02a1a6)' }}>{publicResumeUrl}</a>
          <span style={{ marginLeft: 8, color: '#888', fontSize: '0.72rem' }}>— this is what visitors see when they click "Download Resume" on your profile</span>
        </div>
      )}

      {/* ── Preset editor ─────────────────────────────────────────────────── */}
      {editingPreset && (
        <div style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              value={editingPreset.name}
              onChange={e => setEditingPreset(p => ({ ...p, name: e.target.value }))}
              placeholder="Preset name (e.g. 'ERP Consultant Resume')"
              style={{ flex: 1, padding: '0.5rem 0.85rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.88rem', fontFamily: 'inherit' }}
            />
            <Checkbox checked={editingPreset.primaryResume} onChange={v => setEditingPreset(p => ({ ...p, primaryResume: v }))} label="Primary (public)" />
          </div>

          <div style={S.sectionLabel}>Include sections</div>
          <div style={{ columns: 2, gap: '1rem', marginBottom: '1rem' }}>
            {allSections.map(({ pageKey, pageName, sectionId, sectionName }) => {
              const included = editingPreset.includedSections.includes(sectionId);
              return (
                <div key={sectionId} style={{ breakInside: 'avoid', marginBottom: '0.4rem' }}>
                  <Checkbox
                    checked={included}
                    onChange={v => setEditingPreset(p => ({
                      ...p,
                      includedSections: v ? [...p.includedSections, sectionId] : p.includedSections.filter(id => id !== sectionId),
                    }))}
                    label={<span>{sectionName} <span style={{ color: '#aaa', fontSize: '0.7rem' }}>({pageName})</span></span>}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={S.btn('navy')} onClick={saveEditingPreset} disabled={saving}>{saving ? 'Saving…' : 'Save Preset'}</button>
            <button style={S.btn('outline')} onClick={() => setEditingPreset(null)}>Cancel</button>
          </div>
        </div>
      )}

      <hr style={S.divider} />

      {/* ── Resume interpreter agent ───────────────────────────────────────── */}
      <div style={S.sectionLabel}>Resume Interpreter Agent</div>
      <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '1rem', lineHeight: 1.55 }}>
        Paste a job description below. The agent will analyze it against your resume and return a tailored professional summary, key skills to highlight, and suggested rewriting of your experience bullets.
      </p>

      {presets.length > 1 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.3rem' }}>Use resume preset:</label>
          <select value={selectedPresetId} onChange={e => setSelectedPresetId(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
            <option value="">Primary resume</option>
            {presets.map(p => <option key={p.id} value={p.id}>{p.name}{p.primaryResume ? ' (primary)' : ''}</option>)}
          </select>
        </div>
      )}

      <textarea
        style={S.textarea}
        placeholder="Paste the job description here…"
        value={jobDesc}
        onChange={e => setJobDesc(e.target.value)}
      />

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button style={S.btn('gold')} onClick={runAgent} disabled={agentRunning || !jobDesc.trim()}>
          {agentRunning ? '⏳ Interpreting…' : '✦ Tailor My Resume'}
        </button>
        {agentOutput && <button style={S.btn('outline')} onClick={() => setAgentOutput('')}>Clear Output</button>}
      </div>

      {agentOutput && (
        <>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginTop: '1.5rem', marginBottom: '0.4rem' }}>Agent Output</div>
          <div style={S.output}>{agentOutput}</div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button style={S.btn('navy')} onClick={() => { navigator.clipboard.writeText(agentOutput); toast('Copied to clipboard'); }}>Copy to Clipboard</button>
            <a href="/output/resume" target="_blank" rel="noreferrer" style={{ ...S.btn('outline'), textDecoration: 'none', display: 'inline-block' }}>Open Resume Output ↗</a>
          </div>
        </>
      )}
    </div>
  );
}
