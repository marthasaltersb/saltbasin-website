// UploadDataScreen (2026-07-16, wired to real endpoints 2026-07-27) —
// reached from Choose Your Path. Three real paths: download the semantic
// Excel template (maps to real Career Atoms/Molecules via bonding rules),
// upload a filled-in template back in for parsing, or upload an existing
// resume for AI extraction — both upload paths land on the shared
// CareerMappingPreview.jsx so nothing is saved until the member confirms.
import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import CareerMappingPreview from './CareerMappingPreview.jsx';

const S = {
  wrap: { maxWidth: 780, margin: '1rem auto 2rem', padding: '0 1.5rem' },
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' },
  title: { fontSize: '1.05rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.4rem' },
  desc: { fontSize: '0.82rem', color: '#777', lineHeight: 1.5, marginBottom: '1rem' },
  uploadNotice: { fontSize: '0.76rem', fontWeight: 700, color: 'var(--sb-gold, #c4843a)', marginBottom: '0.55rem' },
  btn: { padding: '0.55rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sb-font-label)', background: 'var(--sb-gold, #c4843a)', color: 'white' },
  linkBtn: { fontSize: '0.78rem', color: 'var(--sb-teal-deep, #02a1a6)', cursor: 'pointer', marginTop: '1rem', display: 'inline-block' },
};

export default function UploadDataScreen({ onOpenClassicEditor, onCommitted, embedded = false, onWorkflowChange }) {
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null); // { proposal, source, sheetWarnings, missingSheets }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const blob = await api.downloadCareerSemanticTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'salt-basin-career-semantic-template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.status === 404 ? "Template download isn't available right now." : 'Download failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function importWorkbook(file) {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.importCareerSemanticWorkbook(form);
      setPreview(result);
      onWorkflowChange?.({ phase: 'review', result });
    } catch (e) {
      toast.error('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  }

  async function analyzeResume(file) {
    if (!file) return;
    setAnalyzing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.analyzeCareerResume(form);
      setPreview(result);
      onWorkflowChange?.({ phase: 'review', result });
    } catch (e) {
      toast.error(e.status === 503 ? 'Resume analysis is not configured on this server yet.' : 'Analysis failed: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (preview) {
    return (
      <CareerMappingPreview
        proposal={preview.proposal}
        source={preview.source}
        sheetWarnings={preview.sheetWarnings}
        missingSheets={preview.missingSheets}
        onCancel={() => setPreview(null)}
        onCommitted={(result) => { setPreview(null); onCommitted?.(result); }}
        embedded={embedded}
      />
    );
  }

  return (
    <div className={embedded ? 'career-upload-screen embedded' : 'career-upload-screen'} style={S.wrap}>
      <div style={S.card}>
        <div style={S.title}>Download Semantic Template</div>
        <div style={S.desc}>Get an Excel workbook with instructions and fill-in sheets mapped directly to your Career Atoms, Molecules, and bonding rules — fill it out and upload it back below.</div>
        <button style={S.btn} disabled={downloading} onClick={downloadTemplate}>{downloading ? 'Preparing…' : 'Download Template'}</button>
      </div>
      <div style={S.card}>
        <div style={S.title}>Upload a Filled-In Template</div>
        <div style={S.desc}>Upload your completed semantic template — you'll see a preview of exactly what will be created before anything is saved.</div>
        <div style={S.uploadNotice}>Please check required terms before upload.</div>
        <input type="file" accept=".xlsx,.xls" disabled={importing} onChange={(e) => importWorkbook(e.target.files?.[0])} />
      </div>
      <div style={S.card}>
        <div style={S.title}>Upload an Existing Resume</div>
        <div style={S.desc}>Upload a resume for AI-assisted extraction — you'll see a preview of the suggested Atom/Molecule mappings and can make changes before anything is saved.</div>
        <div style={S.uploadNotice}>Please check required terms before upload.</div>
        <input type="file" accept=".pdf,.docx,.txt" disabled={analyzing} onChange={(e) => analyzeResume(e.target.files?.[0])} />
        {analyzing && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>Analyzing resume…</div>}
      </div>
      <div style={S.linkBtn} onClick={onOpenClassicEditor}>Or configure Career Master fields directly →</div>
    </div>
  );
}
