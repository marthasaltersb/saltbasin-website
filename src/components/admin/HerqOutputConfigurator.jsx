import React, { useState, useEffect, useRef } from 'react';
import { BLOCK_DEFS, DEFAULT_TEMPLATES, renderTemplateToHtml, newBlock } from '../../lib/outputBlocks.js';
import { fieldsByNamespace, NAMESPACE_LABELS } from '../../lib/mergeFieldRegistry.js';

const S = {
  root: { display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--sb-navy-deep)' },
  left: { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '0.5px solid rgba(196,132,58,0.2)', overflow: 'hidden' },
  leftHead: { padding: '0.85rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  blockList: { flex: 1, overflowY: 'auto', padding: '0.5rem 0' },
  right: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHead: { padding: '0.5rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  previewArea: { flex: 1, overflow: 'hidden', background: '#e8e8e8' },
  label: { fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' },
  btnGold: { padding: '0.3rem 0.75rem', background: 'var(--sb-gold)', color: 'var(--sb-ivory)', border: 'none', borderRadius: 2, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.07em' },
  btnGhost: { padding: '0.3rem 0.6rem', background: 'none', color: 'var(--sb-dusty)', border: '0.5px solid rgba(139,155,174,0.3)', borderRadius: 2, fontSize: '0.7rem', cursor: 'pointer' },
  input: { width: '100%', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 72, outline: 'none' },
  select: { width: '100%', padding: '0.35rem 0.6rem', background: 'rgba(20,30,42,0.9)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none' },
  fieldLabel: { fontSize: '0.62rem', color: 'var(--sb-dusty)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.25rem', marginTop: '0.65rem' },
};

function getAt(obj, path) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function setAt(obj, path, value) {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj));
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

// ── Merge field picker ────────────────────────────────────────────────────────

function FieldPicker({ outputType, onInsert, onClose }) {
  const ns = fieldsByNamespace(outputType || 'resume');
  const [openNs, setOpenNs] = useState(Object.keys(ns)[0] || '');
  return (
    <div style={{ position: 'absolute', zIndex: 200, right: 0, top: '100%', width: 300, background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.4)', borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: 380, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.45rem 0.75rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={S.label}>Insert Merge Field</span>
        <button onClick={onClose} style={{ ...S.btnGhost, padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {Object.entries(ns).map(([namespace, fields]) => (
          <div key={namespace}>
            <div onClick={() => setOpenNs(openNs === namespace ? '' : namespace)}
              style={{ padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(196,132,58,0.07)', borderBottom: '0.5px solid rgba(196,132,58,0.08)' }}>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>
                {NAMESPACE_LABELS[namespace] || namespace}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--sb-dusty)' }}>{openNs === namespace ? '▲' : '▼'}</span>
            </div>
            {openNs === namespace && fields.map(f => (
              <div key={f.path} onClick={() => { onInsert(`{{${f.path}}}`); onClose(); }}
                style={{ padding: '0.35rem 0.75rem 0.35rem 1.1rem', cursor: 'pointer', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,132,58,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sb-cream)' }}>{f.label}</span>
                  <code style={{ fontSize: '0.58rem', color: 'var(--sb-gold)', fontFamily: 'monospace', opacity: 0.8, whiteSpace: 'nowrap' }}>{`{{${f.path}}}`}</code>
                </div>
                {f.description && <div style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)', marginTop: '0.1rem' }}>{f.description}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Per-block field editor ────────────────────────────────────────────────────

function FieldEditor({ block, onChange, outputType }) {
  const def = BLOCK_DEFS[block.type];
  const [pickerKey, setPickerKey] = useState(null); // field.key for which picker is open
  if (!def) return null;

  function update(path, value) { onChange(setAt(block, path, value)); }

  function insertMergeField(fieldKey, token) {
    const current = getAt(block, fieldKey) ?? '';
    update(fieldKey, current + token);
    setPickerKey(null);
  }

  function MergeBtn({ fieldKey }) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setPickerKey(pickerKey === fieldKey ? null : fieldKey)}
          title="Insert merge field"
          style={{ ...S.btnGhost, padding: '0.25rem 0.5rem', fontSize: '0.62rem', color: 'var(--sb-gold)', borderColor: 'rgba(196,132,58,0.3)' }}>
          {'</>'}
        </button>
        {pickerKey === fieldKey && (
          <FieldPicker
            outputType={outputType}
            onInsert={token => insertMergeField(fieldKey, token)}
            onClose={() => setPickerKey(null)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0.75rem 1rem', background: 'rgba(196,132,58,0.05)', borderTop: '0.5px solid rgba(196,132,58,0.15)' }}>
      <div style={{ ...S.label, marginBottom: '0.5rem' }}>{def.label} · Properties</div>
      {(def.fields || []).map(field => {
        const val = getAt(block, field.key) ?? '';

        if (field.type === 'text') return (
          <div key={field.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={S.fieldLabel}>{field.label}</span>
              <MergeBtn fieldKey={field.key} />
            </div>
            <input style={S.input} value={val} onChange={e => update(field.key, e.target.value)} />
          </div>
        );

        if (field.type === 'textarea') return (
          <div key={field.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={S.fieldLabel}>{field.label}</span>
              <MergeBtn fieldKey={field.key} />
            </div>
            <textarea style={S.textarea} value={val} onChange={e => update(field.key, e.target.value)} />
          </div>
        );

        if (field.type === 'color') return (
          <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
            <input type="color"
              value={/^#[0-9a-f]{6}/i.test(val) ? val : '#C4843A'}
              onChange={e => update(field.key, e.target.value)}
              style={{ width: 28, height: 28, border: 'none', borderRadius: 2, cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={S.fieldLabel}>{field.label}</span>
              <input style={S.input} value={val} onChange={e => update(field.key, e.target.value)} placeholder="e.g. #C4843A or rgba(…)" />
            </div>
          </div>
        );

        if (field.type === 'select') return (
          <div key={field.key}>
            <span style={S.fieldLabel}>{field.label}</span>
            <select style={S.select} value={val}
              onChange={e => update(field.key, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}>
              {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );

        if (field.type === 'items') {
          const arr = Array.isArray(val) ? val : [];
          return (
            <div key={field.key}>
              <span style={S.fieldLabel}>{field.label}</span>
              <textarea style={S.textarea} value={arr.join('\n')}
                onChange={e => update(field.key, e.target.value.split('\n'))}
                placeholder="One item per line" />
            </div>
          );
        }

        if (field.type === 'pairs') {
          const pairs = Array.isArray(val) ? val : [];
          return (
            <div key={field.key}>
              <span style={S.fieldLabel}>{field.label}</span>
              {pairs.map((pair, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                  <input style={{ ...S.input, flex: 1 }} placeholder="Key" value={pair.key || ''}
                    onChange={e => { const n = [...pairs]; n[i] = { ...n[i], key: e.target.value }; update(field.key, n); }} />
                  <input style={{ ...S.input, flex: 2 }} placeholder="Value" value={pair.value || ''}
                    onChange={e => { const n = [...pairs]; n[i] = { ...n[i], value: e.target.value }; update(field.key, n); }} />
                  <button onClick={() => update(field.key, pairs.filter((_, j) => j !== i))}
                    style={{ ...S.btnGhost, padding: '0.3rem 0.4rem', color: '#c44', fontSize: '0.75rem' }}>×</button>
                </div>
              ))}
              <button onClick={() => update(field.key, [...pairs, { key: '', value: '' }])}
                style={{ ...S.btnGhost, marginTop: '0.25rem', fontSize: '0.68rem' }}>+ Add pair</button>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ── Block list row ────────────────────────────────────────────────────────────

function BlockRow({ block, index, total, selected, onSelect, onChange, onMove, onDelete, outputType }) {
  const def = BLOCK_DEFS[block.type];
  const isSelected = selected === block.id;
  const preview = block.props?.text || block.props?.title || block.props?.question || '';

  return (
    <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
      <div onClick={() => onSelect(isSelected ? null : block.id)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', background: isSelected ? 'rgba(196,132,58,0.1)' : 'transparent', opacity: block.visible === false ? 0.45 : 1 }}>
        {/* Visibility toggle */}
        <button onClick={e => { e.stopPropagation(); onChange({ ...block, visible: !block.visible }); }}
          title={block.visible === false ? 'Show' : 'Hide'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: block.visible === false ? '#555' : 'var(--sb-dusty)', padding: '0 0.15rem', flexShrink: 0 }}>
          {block.visible === false ? '○' : '●'}
        </button>
        {/* Type icon */}
        <span style={{ fontSize: '0.72rem', color: 'var(--sb-gold)', fontFamily: 'monospace', minWidth: 18, flexShrink: 0 }}>{def?.icon || '?'}</span>
        {/* Label + preview */}
        <span style={{ fontSize: '0.78rem', color: 'var(--sb-cream)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {def?.label || block.type}
          {preview && <span style={{ color: 'var(--sb-dusty)', marginLeft: '0.4rem', fontSize: '0.68rem' }}>
            — {String(preview).slice(0, 30)}{String(preview).length > 30 ? '…' : ''}
          </span>}
        </span>
        {/* Reorder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(index, -1)} disabled={index === 0}
            style={{ ...S.btnGhost, padding: '0 0.3rem', fontSize: '0.55rem', opacity: index === 0 ? 0.25 : 1 }}>▲</button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
            style={{ ...S.btnGhost, padding: '0 0.3rem', fontSize: '0.55rem', opacity: index === total - 1 ? 0.25 : 1 }}>▼</button>
        </div>
        {/* Delete */}
        <button onClick={e => { e.stopPropagation(); onDelete(block.id); }}
          style={{ ...S.btnGhost, padding: '0.15rem 0.4rem', color: '#c44', fontSize: '0.72rem', flexShrink: 0 }}>×</button>
      </div>
      {isSelected && <FieldEditor block={block} onChange={onChange} outputType={outputType} />}
    </div>
  );
}

// ── Add block palette ─────────────────────────────────────────────────────────

function BlockPalette({ onAdd, onClose }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderTop: '0.5px solid rgba(196,132,58,0.2)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
      <div style={{ ...S.label, marginBottom: '0.6rem' }}>Add Block</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {Object.entries(BLOCK_DEFS).map(([type, def]) => (
          <button key={type} onClick={() => { onAdd(type); onClose(); }}
            style={{ padding: '0.25rem 0.6rem', background: 'rgba(196,132,58,0.1)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.7rem', cursor: 'pointer' }}>
            {def.icon} {def.label}
          </button>
        ))}
      </div>
      <button onClick={onClose} style={{ ...S.btnGhost, marginTop: '0.5rem', fontSize: '0.68rem' }}>Cancel</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HerqOutputConfigurator({ outputs, onRefresh }) {
  const [selectedId, setSelectedId] = useState(null);
  const [config, setConfig] = useState(null); // { name, outputType, pageMargin, blocks }
  const [outputName, setOutputName] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const iframeRef = useRef(null);

  const selectedOutput = (outputs || []).find(o => o.id === selectedId);

  useEffect(() => {
    if (!selectedOutput) { setConfig(null); setOutputName(''); return; }
    setOutputName(selectedOutput.title || '');
    let parsed = null;
    try { parsed = selectedOutput.template_config ? JSON.parse(selectedOutput.template_config) : null; } catch {}
    if (!parsed) {
      const t = selectedOutput.output_type || 'HERQFramework';
      parsed = DEFAULT_TEMPLATES[t] || DEFAULT_TEMPLATES.HERQFramework;
    }
    setConfig({ ...parsed });
    setSelectedBlockId(null);
  }, [selectedId]);

  // Push HTML into iframe whenever config changes
  useEffect(() => {
    if (!iframeRef.current || !config) return;
    const html = renderTemplateToHtml(config.blocks || [], {}, { pageMargin: config.pageMargin });
    iframeRef.current.srcdoc = html;
  }, [config]);

  const blocks = (config?.blocks || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  function updateBlock(updated) {
    setConfig(c => ({ ...c, blocks: c.blocks.map(b => b.id === updated.id ? updated : b) }));
  }

  function moveBlock(idx, dir) {
    const next = [...blocks];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    next.forEach((b, i) => { b.order = i + 1; });
    setConfig(c => ({ ...c, blocks: next }));
  }

  function deleteBlock(id) {
    setConfig(c => ({ ...c, blocks: c.blocks.filter(b => b.id !== id) }));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  function addBlock(type) {
    const b = newBlock(type);
    b.order = blocks.length + 1;
    setConfig(c => ({ ...c, blocks: [...(c.blocks || []), b] }));
  }

  async function save() {
    if (!selectedOutput || !config) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/herq/outputs/${selectedOutput.id}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_config: JSON.stringify(config), title: outputName }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('Saved ✓');
      onRefresh?.();
    } catch {
      setSaveMsg('Error saving');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  }

  async function publish() {
    if (!selectedOutput) return;
    await save();
    await fetch(`/api/herq/outputs/${selectedOutput.id}`, {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ export_status: 'published' }),
    });
    setSaveMsg('Published ✓');
    onRefresh?.();
  }

  // ── Output picker ──
  if (!selectedId) {
    return (
      <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={S.label}>HERQ · Output Configurator</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, margin: '0.3rem 0' }}>Select an Output to Configure</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', lineHeight: 1.65, maxWidth: 560 }}>
            Every visual element in each output is a configurable block — fonts, colors, spacing, and content all flow from machine-readable JSON stored in the database. Select an output to open its block editor.
          </div>
        </div>
        {(!outputs || outputs.length === 0) ? (
          <div style={{ padding: '1.5rem', border: '0.5px dashed rgba(196,132,58,0.3)', borderRadius: 2, color: 'var(--sb-dusty)', fontSize: '0.85rem', lineHeight: 1.65 }}>
            No outputs yet. Create one in the Outputs tab, then return here to configure its visual template.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {outputs.map(o => (
              <div key={o.id} onClick={() => setSelectedId(o.id)}
                style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(196,132,58,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(196,132,58,0.18)'}>
                <div style={{ ...S.label, marginBottom: '0.35rem' }}>{o.output_type || 'Output'}</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--sb-cream)', marginBottom: '0.5rem' }}>{o.title || '(untitled)'}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 2, background: o.export_status === 'published' ? 'rgba(100,200,100,0.15)' : 'rgba(196,132,58,0.1)', color: o.export_status === 'published' ? '#6dcc6d' : 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em' }}>
                    {o.export_status || 'draft'}
                  </span>
                  {o.template_config && <span style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>✓ configured</span>}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--sb-gold)' }}>Open block editor →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Block editor ──
  return (
    <div style={S.root}>
      {/* Left panel: block list */}
      <div style={S.left}>
        <div style={S.leftHead}>
          <button onClick={() => setSelectedId(null)} style={S.btnGhost}>← Back</button>
          <input value={outputName} onChange={e => setOutputName(e.target.value)} placeholder="Output name"
            style={{ ...S.input, flex: 1, minWidth: 0 }} />
          <button onClick={save} disabled={saving} style={S.btnGold}>{saving ? '…' : 'Save'}</button>
        </div>

        {saveMsg && (
          <div style={{ padding: '0.3rem 1rem', fontSize: '0.72rem', color: saveMsg.includes('Error') ? '#f88' : '#8f8', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
            {saveMsg}
          </div>
        )}

        {/* Page-level settings */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.12)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <span style={S.label}>Margin</span>
          <input value={config?.pageMargin || '0.75in'} onChange={e => setConfig(c => ({ ...c, pageMargin: e.target.value }))}
            style={{ ...S.input, width: 76 }} placeholder="0.75in" />
          <span style={{ ...S.label, marginLeft: 'auto' }}>{blocks.length} blocks</span>
        </div>

        {/* Blocks */}
        <div style={S.blockList}>
          {blocks.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--sb-dusty)', fontSize: '0.8rem' }}>
              No blocks yet — add one below.
            </div>
          )}
          {blocks.map((block, i) => (
            <BlockRow key={block.id} block={block} index={i} total={blocks.length}
              selected={selectedBlockId} onSelect={setSelectedBlockId}
              onChange={updateBlock} onMove={moveBlock} onDelete={deleteBlock}
              outputType={selectedOutput?.output_type} />
          ))}
        </div>

        {/* Footer: add / publish */}
        {showPalette
          ? <BlockPalette onAdd={addBlock} onClose={() => setShowPalette(false)} />
          : (
            <div style={{ padding: '0.6rem 1rem', borderTop: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={() => setShowPalette(true)} style={{ ...S.btnGhost, flex: 1, fontSize: '0.72rem' }}>+ Add Block</button>
              <button onClick={publish} style={{ ...S.btnGhost, fontSize: '0.72rem', color: '#6dcc6d', borderColor: 'rgba(109,204,109,0.3)' }}>↑ Publish</button>
            </div>
          )
        }
      </div>

      {/* Right panel: live preview */}
      <div style={S.right}>
        <div style={S.previewHead}>
          <span style={{ ...S.label, flex: 1 }}>Live Preview — updates on every edit</span>
          <button onClick={() => iframeRef.current?.contentWindow?.print()} style={S.btnGold}>↓ Print / Save PDF</button>
          <span style={{ fontSize: '0.68rem', color: selectedOutput?.export_status === 'published' ? '#6dcc6d' : 'var(--sb-dusty)' }}>
            {selectedOutput?.export_status === 'published' ? '✓ Published' : '· Draft'}
          </span>
        </div>
        <div style={S.previewArea}>
          <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }}
            title="Output Preview" sandbox="allow-same-origin" />
        </div>
      </div>
    </div>
  );
}
