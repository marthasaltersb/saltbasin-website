// Prompt shown when an output can't be finalized because some technologies
// have no proficiency category (server/lib/finalizationGates.js). The user
// picks "how it was used" for each; saving writes it to the Career Master
// tool record (career_tools.wheel_bucket) and then retries the action they
// started — approve, publish, or approve for QR.
//
// Usage: const gate = useToolCategoryGate();
//        await gate.run(() => api.shareResumeOutput(id));   // retries after the prompt
//        ...{gate.modal}
import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

export function isToolCategoryBlock(e) {
  return e?.status === 409 && e?.body?.code === 'tool_category_required';
}

function GateModal({ tools, categories, suggestions, suggestionsError, onSaved, onCancel }) {
  const [choices, setChoices] = useState(() => Object.fromEntries(tools.map((t) => [t.id, suggestions[t.id] || ''])));
  const [saving, setSaving] = useState(false);
  const complete = tools.every((t) => choices[t.id]);

  async function save() {
    setSaving(true);
    try {
      for (const t of tools) await api.updateCareerTool(t.id, { wheelBucket: choices[t.id] });
      toast.success(`Saved to Career Master: ${tools.length} technolog${tools.length === 1 ? 'y' : 'ies'} categorised`);
      await onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tool-gate-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', width: 'min(620px, 100%)', maxHeight: '85vh', overflowY: 'auto', color: '#1b2a3b' }}>
        <div id="tool-gate-title" style={{ fontSize: '1.05rem', fontWeight: 750 }}>Set how each technology was used</div>
        <p style={{ fontSize: '.8rem', color: '#536173', lineHeight: 1.55, margin: '.4rem 0 1rem' }}>
          Every technology needs a proficiency category before an output can be finalized, so nothing on a final resume is a guess.
          Your choices are saved to Career Master and apply to every output.
          {Object.keys(suggestions).length > 0 && ' Suggestions come from each tool’s current level — check them before saving.'}
        </p>
        {suggestionsError && <div role="alert" style={{ fontSize: '.74rem', color: '#a5531f', marginBottom: '.6rem' }}>Suggestions are unavailable ({suggestionsError}) — choose each category yourself.</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', fontSize: '.7rem', padding: '.4rem', borderBottom: '1px solid #e5ded3' }}>Technology</th>
            <th style={{ textAlign: 'left', fontSize: '.7rem', padding: '.4rem', borderBottom: '1px solid #e5ded3' }}>How it was used</th>
          </tr></thead>
          <tbody>
            {tools.map((t) => (
              <tr key={t.id}>
                <td style={{ padding: '.45rem .4rem', fontSize: '.84rem', borderBottom: '1px solid #f0ebe3' }}><strong>{t.label}</strong></td>
                <td style={{ padding: '.45rem .4rem', borderBottom: '1px solid #f0ebe3' }}>
                  <select aria-label={`How ${t.label} was used`} value={choices[t.id]} onChange={(e) => setChoices({ ...choices, [t.id]: e.target.value })}
                    style={{ width: '100%', padding: '.4rem', borderRadius: 7, border: `1px solid ${choices[t.id] ? 'rgba(27,42,59,.2)' : '#c4843a'}`, fontSize: '.82rem' }}>
                    <option value="">Choose…</option>
                    {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}{suggestions[t.id] === k ? ' (suggested)' : ''}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onCancel} style={{ border: '1px solid rgba(27,42,59,.2)', background: '#fff', borderRadius: 7, padding: '.5rem .9rem', cursor: 'pointer' }}>Cancel</button>
          <button type="button" disabled={!complete || saving} onClick={save} style={{ border: 0, background: complete ? '#1b2a3b' : '#9aa3ad', color: '#fff', borderRadius: 7, padding: '.5rem .9rem', cursor: complete ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Saving…' : 'Save to Career Master and continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Runs a finalize action; if the gate blocks it, prompts, saves, and retries once. */
export function useToolCategoryGate() {
  const [pending, setPending] = useState(null); // { tools, categories, suggestions, retry, resolve, reject }

  async function prompt(e, action) {
    let suggestions = {};
    let suggestionsError = null;
    try {
      const prof = await api.getCareerProficiency();
      for (const p of prof.proficiencies || []) if (p.entityType === 'tool' && p.proficiencyCategory) suggestions[p.entityId] = p.proficiencyCategory;
    } catch (err) {
      suggestions = {};
      suggestionsError = err.message || 'unknown error';
    }
    return new Promise((resolve, reject) => {
      setPending({ tools: e.body.tools || [], categories: e.body.categories || {}, suggestions, suggestionsError, retry: action, resolve, reject });
    });
  }

  async function run(action) {
    try {
      return await action();
    } catch (e) {
      if (!isToolCategoryBlock(e)) throw e;
      return prompt(e, action);
    }
  }

  const modal = pending ? (
    <GateModal
      tools={pending.tools}
      categories={pending.categories}
      suggestions={pending.suggestions}
      suggestionsError={pending.suggestionsError}
      onCancel={() => { const p = pending; setPending(null); p.reject(Object.assign(new Error('Finalization cancelled — technologies still need a proficiency category.'), { cancelled: true })); }}
      onSaved={async () => { const p = pending; setPending(null); try { p.resolve(await p.retry()); } catch (err) { p.reject(err); } }}
    />
  ) : null;

  return { run, modal };
}
