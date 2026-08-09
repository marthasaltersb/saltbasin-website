// CareerMappingPreview (2026-07-27, Phase 1) — shared preview/edit screen
// for both the Excel semantic-import path and the AI resume-analysis path.
// Both server routes (POST /api/career/semantic-import,
// POST /api/career/resume-analysis) return the same proposal shape —
// { [entryType]: [{ entryType, fieldBonds: { atomKey: { value, header,
// matchType, affinity, label } }, unresolvedHeaders }] } — precisely so one
// component can render either source. Nothing is saved to the Career Master
// until "Confirm & Save" calls POST /api/career/mappings/commit; every
// checkbox here only controls what that one commit call will include.
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const ENTRY_TYPE_LABELS = {
  career_job_entry: 'Job',
  career_skill_entry: 'Skill',
  career_tool_entry: 'Tool',
  career_engagement_entry: 'Engagement / Case Study',
  career_domain_entry: 'Domain',
  career_certification_entry: 'Certification',
  career_deal_entry: 'Deal',
};

const S = {
  wrap: { maxWidth: 900, margin: '1rem auto 2rem', padding: '0 1.5rem' },
  banner: { background: 'rgba(196,132,58,0.08)', border: '0.5px solid rgba(196,132,58,0.3)', borderRadius: 10, padding: '0.9rem 1.1rem', fontSize: '0.8rem', color: '#7a5320', marginBottom: '1.25rem', lineHeight: 1.5 },
  groupTitle: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', margin: '1.25rem 0 0.6rem' },
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.75rem' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600, color: '#444' },
  field: { display: 'grid', gridTemplateColumns: '18px 1fr 1.4fr', gap: '0.6rem', alignItems: 'center', padding: '0.3rem 0', fontSize: '0.78rem' },
  fieldLabel: { color: '#666' },
  affinity: { fontSize: '0.65rem', color: '#999', marginLeft: '0.4rem' },
  input: { width: '100%', padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.78rem', fontFamily: 'inherit' },
  unresolved: { fontSize: '0.72rem', color: '#a35', background: 'rgba(170,51,85,0.06)', borderRadius: 6, padding: '0.3rem 0.5rem', marginTop: '0.3rem' },
  empty: { padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.08)' },
  btn: (enabled, primary) => ({
    padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '0.82rem', fontFamily: 'var(--sb-font-label)',
    background: !enabled ? 'rgba(0,0,0,0.1)' : primary ? 'var(--sb-gold, #c4843a)' : 'transparent',
    color: !enabled ? '#999' : primary ? 'white' : 'var(--sb-teal-deep, #02a1a6)',
  }),
};

function buildInitialEntries(proposal) {
  const out = [];
  let seq = 0;
  for (const [entryType, entries] of Object.entries(proposal || {})) {
    for (const entry of entries) {
      out.push({
        key: `entry-${seq++}`,
        entryType,
        included: true,
        source: entry.sourceSheet || 'ai_resume_extraction',
        fields: Object.entries(entry.fieldBonds || {}).map(([atomKey, bond]) => ({
          atomKey, included: true, value: bond.value, originalValue: bond.value, label: bond.label || atomKey, header: bond.header, matchType: bond.matchType, affinity: bond.affinity, sourceLocation: bond.sourceLocation, documentId: bond.documentId || entry.documentId, sourceFilename: bond.sourceFilename || entry.sourceFilename,
        })),
        unresolvedHeaders: entry.unresolvedHeaders || [],
      });
    }
  }
  return out;
}

export default function CareerMappingPreview({ proposal, source, sheetWarnings = [], missingSheets = [], onCommitted, onCancel, embedded = false }) {
  const [entries, setEntries] = useState(() => buildInitialEntries(proposal));
  const [saving, setSaving] = useState(false);
  const [classifications, setClassifications] = useState([]);

  function commitPayload() {
    return entries.filter((e) => e.included).map((e) => ({
      entryType: e.entryType,
      values: Object.fromEntries(e.fields.filter((f) => f.included).map((f) => [f.atomKey, f.value])),
      mappings: e.fields.filter((f) => f.included).map((f) => ({ atomKey: f.atomKey, originalValue: f.originalValue, committedValue: f.value, sourceLocation: f.sourceLocation, sourceLabel: f.header, matchType: f.matchType, affinity: f.affinity, documentId: f.documentId, sourceFilename: f.sourceFilename })),
    })).filter((e) => Object.keys(e.values).length > 0);
  }

  useEffect(() => {
    const payload = commitPayload();
    if (!payload.length) return;
    api.classifyCareerMappings(payload).then((result) => setClassifications(result.classifications || [])).catch(() => setClassifications([]));
  }, []);

  const groups = useMemo(() => {
    const byType = {};
    entries.forEach((e, idx) => {
      if (!byType[e.entryType]) byType[e.entryType] = [];
      byType[e.entryType].push({ ...e, idx });
    });
    return byType;
  }, [entries]);

  const includedCount = entries.reduce((sum, e) => sum + (e.included ? e.fields.filter((f) => f.included).length : 0), 0);

  function toggleEntry(idx) {
    setEntries((cur) => cur.map((e, i) => (i === idx ? { ...e, included: !e.included } : e)));
  }
  function toggleField(idx, atomKey) {
    setEntries((cur) => cur.map((e, i) => (i !== idx ? e : { ...e, fields: e.fields.map((f) => (f.atomKey === atomKey ? { ...f, included: !f.included } : f)) })));
  }
  function editField(idx, atomKey, value) {
    setEntries((cur) => cur.map((e, i) => (i !== idx ? e : { ...e, fields: e.fields.map((f) => (f.atomKey === atomKey ? { ...f, value } : f)) })));
  }

  async function confirmSave() {
    const payload = commitPayload();
    if (!payload.length) return toast.error('Nothing selected to save');
    setSaving(true);
    try {
      const result = await api.commitCareerMappings(payload, source);
      toast.success(`Saved ${result.created?.length || 0} Career Master entr${(result.created?.length || 0) === 1 ? 'y' : 'ies'}`);
      if (result.updated?.length) toast.success(`Applied ${result.updated.length} reviewed update${result.updated.length === 1 ? '' : 's'} to existing Career Master records`);
      if (result.skipped?.length) toast.success(`Protected ${result.skipped.length} existing record${result.skipped.length === 1 ? '' : 's'} from duplicate creation`);
      if (result.errors?.length) toast.error(`${result.errors.length} entr${result.errors.length === 1 ? 'y' : 'ies'} could not be saved — see console`);
      if (result.errors?.length) console.warn('[CareerMappingPreview] commit errors:', result.errors);
      onCommitted?.(result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!entries.length) {
    return (
      <div className={embedded ? 'career-mapping-preview embedded' : 'career-mapping-preview'} style={S.wrap}>
        <div style={S.empty}>No mappable Career Atom facts were found. Try a different file, or check the reference sheets in the semantic template for the expected format.</div>
        <div style={S.actions}><button style={S.btn(true, false)} onClick={onCancel}>← Back</button></div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'career-mapping-preview embedded' : 'career-mapping-preview'} style={S.wrap}>
      <div style={S.banner}>
        Nothing has been saved yet. Review each proposed entry below — uncheck anything you don't want, edit any value, then click "Confirm &amp; Save" to write only what's checked to your Career Master.
        {missingSheets?.length > 0 && ` (${missingSheets.length} entry-type sheet${missingSheets.length === 1 ? '' : 's'} not present in this workbook — skipped, not an error.)`}
      </div>
      {sheetWarnings.map((w) => (
        <div key={w.sheetName} style={S.unresolved}>
          "{w.sheetName}": {w.unresolvedHeaderCount} column header{w.unresolvedHeaderCount === 1 ? '' : 's'} didn't match a known Career Atom and will be skipped: {w.unresolvedHeaders.join(', ')}
        </div>
      ))}

      {Object.entries(groups).map(([entryType, group]) => (
        <div key={entryType}>
          <div style={S.groupTitle}>{ENTRY_TYPE_LABELS[entryType] || entryType} ({group.length})</div>
          {group.map((entry) => (
            <div key={entry.key} style={S.card}>
              <label style={S.cardHead}>
                <input type="checkbox" checked={entry.included} onChange={() => toggleEntry(entry.idx)} />
                {entry.included ? 'Include this entry' : 'Skipped'}
                {classifications[entry.idx]?.status && <span style={{ marginLeft: 'auto', color: classifications[entry.idx].status === 'new' ? '#287a54' : classifications[entry.idx].status === 'exact_duplicate' ? '#777' : '#a56b18', fontSize: '.68rem', textTransform: 'uppercase' }}>{classifications[entry.idx].status.replaceAll('_', ' ')}</span>}
              </label>
              {entry.fields.map((f) => (
                <div key={f.atomKey} style={S.field}>
                  <input type="checkbox" checked={f.included} disabled={!entry.included} onChange={() => toggleField(entry.idx, f.atomKey)} />
                  <span style={S.fieldLabel}>
                    {f.label}
                    {f.matchType === 'fuzzy' && <span style={S.affinity}>(matched from "{f.header}", {Math.round((f.affinity || 0) * 100)}%)</span>}
                    <span style={{ display: 'block', color: '#8a7356', fontSize: '.66rem', marginTop: '.15rem' }}>Found in: {f.sourceLocation || f.header || 'uploaded source'}</span>
                  </span>
                  <input
                    style={S.input}
                    disabled={!entry.included || !f.included}
                    value={f.value ?? ''}
                    onChange={(e) => editField(entry.idx, f.atomKey, e.target.value)}
                  />
                </div>
              ))}
              {entry.unresolvedHeaders.length > 0 && (
                <div style={S.unresolved}>
                  Not mapped, will be skipped: {entry.unresolvedHeaders.map((u) => `${u.header} = "${u.value}"`).join('; ')}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={S.actions}>
        <button style={S.btn(!saving, false)} disabled={saving} onClick={onCancel}>Cancel</button>
        <button style={S.btn(includedCount > 0 && !saving, true)} disabled={includedCount === 0 || saving} onClick={confirmSave}>
          {saving ? 'Saving…' : `Confirm & Save (${includedCount} field${includedCount === 1 ? '' : 's'})`}
        </button>
      </div>
    </div>
  );
}
