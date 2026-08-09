import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TARGETS = ['job', 'skill', 'tool', 'engagement', 'domain', 'certification', 'deal', 'resumePreset'];

export default function BoundedCareerAgentPanel() {
  const [targetType, setTargetType] = useState('skill');
  const [targetId, setTargetId] = useState('');
  const [changes, setChanges] = useState('{\n  "tier": "Advanced"\n}');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function apply() {
    let parsed;
    try { parsed = JSON.parse(changes); } catch { return toast.error('Changes must be valid JSON'); }
    setBusy(true);
    try {
      const next = await api.runBoundedCareerAction({ targetType, targetId: targetType === 'resumePreset' ? targetId : Number(targetId), changes: parsed });
      setResult(next);
      toast.success(`BestyStaff updated ${next.updatedFields.length} field${next.updatedFields.length === 1 ? '' : 's'}`);
    } catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  }

  return <div style={{ maxWidth: 760, margin: '1.5rem auto', padding: '1.25rem', background: '#fff', borderRadius: 12, color: '#1b2a3b' }}>
    <h2 style={{ marginTop: 0 }}>Career World BestyStaff</h2>
    <p style={{ color: '#66727c', lineHeight: 1.55 }}>This bounded assistant makes only explicit, schema-valid changes to records you own. It does not call Anthropic, OpenAI, or another model. Client-name fields are outside its authority.</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
      <label>Record type<select className="sb-input" value={targetType} onChange={(e) => setTargetType(e.target.value)}>{TARGETS.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Record ID<input className="sb-input" inputMode="numeric" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Example: 12" /></label>
    </div>
    <label style={{ display: 'block', marginTop: '.9rem' }}>Configuration changes<textarea className="sb-input sb-textarea" rows={7} value={changes} onChange={(e) => setChanges(e.target.value)} /></label>
    <button className="sb-btn sb-btn-gold" disabled={busy || !targetId} onClick={apply}>{busy ? 'Applying…' : 'Validate & Apply'}</button>
    {result && <pre style={{ marginTop: '1rem', padding: '.75rem', background: '#eef4f2', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>}
  </div>;
}
