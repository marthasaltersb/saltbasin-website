// Settings screen for the cover-letter agent (2026-10-02): the deterministic template, the
// language-model provider / cheapest-model name, and the tone presets. Everything the agent
// does by rule is editable here — nothing is API-only. Saved per member
// (server/lib/coverLetterTemplate.js, table cover_letter_settings).
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TEMPLATE_FIELDS = [
  ['subject', 'Subject line', 1],
  ['salutation', 'Salutation', 1],
  ['opening', 'Opening paragraph', 3],
  ['jobParagraph', 'Experience paragraph (job has metrics and matches the job rec)', 3],
  ['jobParagraphNoMetrics', 'Experience paragraph (matches the job rec, no metrics)', 3],
  ['jobParagraphMetricsOnly', 'Experience paragraph (job has metrics, no job rec matches)', 2],
  ['jobParagraphPlain', 'Experience paragraph (no matches)', 2],
  ['skillsParagraph', 'Skills paragraph', 2],
  ['closing', 'Closing paragraph', 3],
  ['signOff', 'Sign-off', 1],
  ['mentionSentence', 'Sentence used when you ask the agent to “mention …” something from the package', 2],
];

const S = {
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '1rem', color: '#1b2a3b' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, margin: '0.8rem 0 0.25rem', color: '#1b2a3b' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.45rem 0.55rem', border: '1px solid rgba(27,42,59,0.25)', borderRadius: 6, fontSize: '0.84rem', fontFamily: 'inherit' },
  hint: { fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem', lineHeight: 1.45 },
  btn: (tone) => ({ padding: '0.45rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', border: tone === 'gold' ? 'none' : '1px solid rgba(27,42,59,0.25)', background: tone === 'gold' ? '#c4843a' : '#fff', color: tone === 'gold' ? '#fff' : '#1b2a3b' }),
  h: { fontSize: '0.9rem', fontWeight: 700, margin: '1.2rem 0 0.2rem', color: '#1b2a3b' },
};

const toLines = (replacements) => (replacements || []).map((r) => `${r.from} => ${r.to}`).join('\n');
function fromLines(text) {
  return String(text || '').split('\n').filter((l) => l.trim()).map((line) => {
    const i = line.indexOf('=>');
    if (i < 0) throw new Error(`Replacement line "${line}" needs "=>" between the text to find and its replacement.`);
    return { from: line.slice(0, i).trim(), to: line.slice(i + 2).trim() };
  });
}

export default function CoverLetterSettings({ onSaved }) {
  const [state, setState] = useState(null); // { settings, providers, placeholders, defaults }
  const [form, setForm] = useState(null);
  const [lines, setLines] = useState({}); // preset key -> "from => to" text
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCoverLetterSettings().then((d) => {
      setState(d);
      setForm(d.settings);
      setLines(Object.fromEntries(d.settings.tonePresets.map((p) => [p.key, toLines(p.replacements)])));
    }).catch((e) => setError(`Could not load settings: ${e.message}`));
  }, []);

  if (error && !form) return <div role="alert" style={{ ...S.card, color: '#a5531f' }}>{error}</div>;
  if (!form) return <div style={S.card}>Loading settings…</div>;

  const setTemplate = (k, v) => setForm({ ...form, template: { ...form.template, [k]: v } });
  const setPreset = (i, patch) => setForm({ ...form, tonePresets: form.tonePresets.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  async function save() {
    setSaving(true); setError(null);
    try {
      const tonePresets = form.tonePresets.map((p) => ({ ...p, replacements: fromLines(lines[p.key] ?? toLines(p.replacements)) }));
      const d = await api.saveCoverLetterSettings({ ...form, tonePresets });
      setForm(d.settings);
      setLines(Object.fromEntries(d.settings.tonePresets.map((p) => [p.key, toLines(p.replacements)])));
      toast.success('Cover-letter settings saved.');
      onSaved?.(d.settings);
    } catch (e) {
      setError(e.message); toast.error(e.message);
    } finally { setSaving(false); }
  }

  function resetToDefaults() {
    setForm(state.defaults);
    setLines(Object.fromEntries(state.defaults.tonePresets.map((p) => [p.key, toLines(p.replacements)])));
    toast.success('Defaults loaded — press “Save settings” to keep them.');
  }

  function addPreset() {
    let n = form.tonePresets.length + 1;
    while (form.tonePresets.some((p) => p.key === `preset-${n}`)) n += 1;
    const key = `preset-${n}`;
    setForm({ ...form, tonePresets: [...form.tonePresets, { key, label: `Preset ${n}`, contractions: null, replacements: [] }] });
    setLines({ ...lines, [key]: '' });
  }

  return (
    <div style={S.card} aria-label="Cover-letter settings">
      <div style={{ fontSize: '1rem', fontWeight: 700 }}>Cover-letter settings</div>
      <div style={S.hint}>These apply to your cover letters and to the cover-letter agent. The template is used for the first draft (no language model involved); the model setting is used only when the agent’s search and rules cannot satisfy a request.</div>

      <label style={{ ...S.label, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="checkbox" checked={form.autoDraft} onChange={(e) => setForm({ ...form, autoDraft: e.target.checked })} />
        Automatically draft a cover letter when a job opportunity is added
      </label>

      <div style={S.h}>Language model</div>
      <label htmlFor="cl-provider" style={S.label}>Provider</label>
      <select id="cl-provider" style={S.input} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
        {state.providers.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      <label htmlFor="cl-model" style={S.label}>Model (cheapest available)</label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input id="cl-model" style={{ ...S.input, flex: 1, minWidth: 220 }} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <button type="button" style={S.btn()} onClick={() => setForm({ ...form, model: state.defaults.model })}>Use default</button>
      </div>
      <div style={S.hint}>Default: {state.defaults.model} (the cheapest Claude model at the time of writing). Uses your Anthropic key from the Config panel, or the platform key. Ignored when the provider is the offline test stub.</div>

      <div style={S.h}>Letter template</div>
      <div style={S.hint}>
        Placeholders you can use: {Object.keys(state.placeholders).map((k) => <code key={k} title={state.placeholders[k]} style={{ marginRight: 6 }}>{`{${k}}`}</code>)}
        . A clause whose data is missing is left out — nothing is invented.
      </div>
      {TEMPLATE_FIELDS.map(([key, label, rows]) => (
        <div key={key}>
          <label htmlFor={`cl-t-${key}`} style={S.label}>{label}</label>
          <textarea id={`cl-t-${key}`} rows={rows} style={{ ...S.input, resize: 'vertical' }} value={form.template[key]} onChange={(e) => setTemplate(key, e.target.value)} />
        </div>
      ))}
      <label htmlFor="cl-jobs" style={S.label}>Number of experience paragraphs</label>
      <input id="cl-jobs" type="number" min={0} max={5} style={{ ...S.input, maxWidth: 100 }} value={form.template.bodyJobCount} onChange={(e) => setTemplate('bodyJobCount', e.target.value)} />
      <label style={{ ...S.label, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="checkbox" checked={form.template.includeSkills} onChange={(e) => setTemplate('includeSkills', e.target.checked)} />
        Include a skills paragraph
      </label>

      <div style={S.h}>Tone presets</div>
      <div style={S.hint}>Used when you ask the agent for a tone (for example “make it more formal”). One replacement per line as <code>text to find =&gt; replacement</code>; matching ignores capitals.</div>
      {form.tonePresets.map((p, i) => (
        <fieldset key={i} style={{ border: '1px solid rgba(27,42,59,0.15)', borderRadius: 6, margin: '0.6rem 0', padding: '0.5rem 0.75rem' }}>
          <legend style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.label}</legend>
          <label htmlFor={`cl-p-${i}-label`} style={S.label}>Name</label>
          <input id={`cl-p-${i}-label`} style={S.input} value={p.label} onChange={(e) => setPreset(i, { label: e.target.value })} />
          <label htmlFor={`cl-p-${i}-key`} style={S.label}>Word you say to use it</label>
          <input id={`cl-p-${i}-key`} style={S.input} value={p.key} onChange={(e) => { const nk = e.target.value.toLowerCase(); setLines((l) => { const { [p.key]: cur, ...rest } = l; return { ...rest, [nk]: cur ?? '' }; }); setPreset(i, { key: nk }); }} />
          <label htmlFor={`cl-p-${i}-c`} style={S.label}>Contractions</label>
          <select id={`cl-p-${i}-c`} style={S.input} value={p.contractions || ''} onChange={(e) => setPreset(i, { contractions: e.target.value || null })}>
            <option value="">Leave as written</option>
            <option value="expand">Expand (I’m → I am)</option>
            <option value="contract">Contract (I am → I’m)</option>
          </select>
          <label htmlFor={`cl-p-${i}-r`} style={S.label}>Replacements</label>
          <textarea id={`cl-p-${i}-r`} rows={3} style={{ ...S.input, resize: 'vertical', fontFamily: 'monospace' }} value={lines[p.key] ?? ''} onChange={(e) => setLines({ ...lines, [p.key]: e.target.value })} />
          <button type="button" style={{ ...S.btn(), marginTop: '0.5rem' }} onClick={() => setForm({ ...form, tonePresets: form.tonePresets.filter((_, j) => j !== i) })}>Remove “{p.label}”</button>
        </fieldset>
      ))}
      <button type="button" style={S.btn()} onClick={addPreset}>Add tone preset</button>

      {error && <div role="alert" style={{ color: '#a5531f', fontSize: '0.8rem', marginTop: '0.8rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="button" style={S.btn('gold')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        <button type="button" style={S.btn()} onClick={resetToDefaults}>Reset form to defaults</button>
      </div>
    </div>
  );
}
