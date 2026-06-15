/**
 * MyResumePanel — member admin for resume presets + AI tailoring.
 *
 * UX flows:
 *  1. Primary preset shown prominently — click to edit inline
 *  2. + New Preset → name prompt → section/layout editor
 *  3. Agent Tailor → uses primary as baseline → structured diff preview
 *     → Accept saves as new preset; Discard discards
 *  4. Inline PDF preview + print
 */
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

// ── Layout templates ──────────────────────────────────────────────────────────
const LAYOUTS = [
  {
    id: 'classic',
    name: 'Classic SB',
    description: 'Gold accents, serif body, industry grid',
    preview: (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
        <rect width="120" height="80" fill="#faf8f4" />
        <rect x="8" y="8" width="60" height="6" rx="1" fill="#1b2a3b" />
        <rect x="8" y="16" width="30" height="2" rx="1" fill="#c4843a" />
        <rect x="8" y="22" width="104" height="0.5" fill="#c4843a" />
        <rect x="8" y="27" width="104" height="2.5" rx="1" fill="#ddd" />
        <rect x="8" y="31" width="80" height="2.5" rx="1" fill="#ddd" />
        <rect x="8" y="39" width="40" height="2" rx="1" fill="#c4843a" opacity="0.7" />
        <rect x="8" y="44" width="50" height="2" rx="1" fill="#eee" />
        <rect x="64" y="44" width="48" height="2" rx="1" fill="#eee" />
        <rect x="8" y="48" width="50" height="2" rx="1" fill="#eee" />
        <rect x="64" y="48" width="48" height="2" rx="1" fill="#eee" />
        <rect x="8" y="58" width="40" height="2" rx="1" fill="#c4843a" opacity="0.7" />
        <rect x="8" y="63" width="104" height="2" rx="1" fill="#eee" />
        <rect x="8" y="67" width="85" height="2" rx="1" fill="#eee" />
      </svg>
    ),
    url: '/output/resume',
  },
  {
    id: 'modern',
    name: 'Modern SB',
    description: 'Multi-column, domain cards, warm sections',
    preview: (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
        <rect width="120" height="80" fill="#faf8f4" />
        <rect x="8" y="8" width="50" height="7" rx="1" fill="#1b2a3b" />
        <rect x="8" y="17" width="25" height="2" rx="1" fill="#c4843a" />
        <rect x="70" y="8" width="42" height="2" rx="1" fill="#888" />
        <rect x="70" y="12" width="35" height="2" rx="1" fill="#888" />
        <rect x="8" y="22" width="104" height="0.5" fill="#c4843a" />
        <rect x="8" y="27" width="48" height="2" rx="1" fill="#ddd" />
        <rect x="62" y="27" width="50" height="2" rx="1" fill="#ddd" />
        <rect x="8" y="32" width="48" height="2" rx="1" fill="#ddd" />
        <rect x="62" y="32" width="50" height="2" rx="1" fill="#ddd" />
        <rect x="8" y="40" width="30" height="2" rx="1" fill="#c4843a" opacity="0.7" />
        <rect x="8" y="45" width="30" height="10" rx="1" fill="#f0f0ec" />
        <rect x="44" y="45" width="30" height="10" rx="1" fill="#f0f0ec" />
        <rect x="80" y="45" width="32" height="10" rx="1" fill="#f0f0ec" />
        <rect x="8" y="60" width="104" height="2" rx="1" fill="#eee" />
        <rect x="8" y="64" width="80" height="2" rx="1" fill="#eee" />
      </svg>
    ),
    url: '/output/resume?layout=modern',
  },
  {
    id: 'corporate',
    name: 'Corporate SB',
    description: 'Navy header, sidebar domains, bold structure',
    preview: (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
        <rect width="120" height="80" fill="white" />
        <rect x="0" y="0" width="120" height="18" fill="#1b2a3b" />
        <rect x="8" y="5" width="45" height="5" rx="1" fill="white" />
        <rect x="8" y="12" width="25" height="2" rx="1" fill="#c4843a" />
        <rect x="82" y="7" width="30" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="8" y="22" width="72" height="2" rx="1" fill="#ddd" />
        <rect x="8" y="26" width="72" height="2" rx="1" fill="#ddd" />
        <rect x="8" y="34" width="72" height="2" rx="1" fill="#1b2a3b" opacity="0.4" />
        <rect x="8" y="39" width="72" height="2" rx="1" fill="#eee" />
        <rect x="8" y="43" width="72" height="2" rx="1" fill="#eee" />
        <rect x="86" y="22" width="26" height="30" rx="1" fill="#1b2a3b" />
        <rect x="90" y="26" width="18" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
        <rect x="90" y="30" width="14" height="1.5" rx="1" fill="rgba(255,255,255,0.2)" />
        <rect x="90" y="33" width="14" height="1.5" rx="1" fill="rgba(255,255,255,0.2)" />
        <rect x="90" y="38" width="18" height="2" rx="1" fill="rgba(196,132,58,0.8)" />
        <rect x="90" y="42" width="14" height="1.5" rx="1" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    url: '/output/resume?layout=corporate',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Boho-style hero, 2-col actions/impact, navy quote',
    preview: (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
        <rect width="120" height="80" fill="#faf8f4" />
        <rect x="8" y="8" width="80" height="14" rx="1" fill="#faf8f4" stroke="#c4843a" strokeWidth="0.5" />
        <rect x="12" y="11" width="30" height="4" rx="1" fill="#1b2a3b" />
        <rect x="12" y="17" width="20" height="2" rx="1" fill="#02a1a6" />
        <rect x="96" y="8" width="16" height="14" rx="1" fill="#1b2a3b" />
        <rect x="99" y="13" width="10" height="2" rx="1" fill="rgba(196,132,58,0.7)" />
        <rect x="8" y="26" width="48" height="12" rx="1" fill="#fff" stroke="#e8ddd0" strokeWidth="0.5" />
        <rect x="62" y="26" width="50" height="12" rx="1" fill="#fff" stroke="#e8ddd0" strokeWidth="0.5" />
        <rect x="11" y="29" width="18" height="1.5" rx="1" fill="#c4843a" opacity="0.6" />
        <rect x="11" y="33" width="40" height="1.5" rx="1" fill="#ddd" />
        <rect x="65" y="29" width="18" height="1.5" rx="1" fill="#c4843a" opacity="0.6" />
        <rect x="65" y="33" width="40" height="1.5" rx="1" fill="#ddd" />
        <rect x="8" y="43" width="104" height="10" rx="1" fill="#1b2a3b" />
        <rect x="12" y="46" width="25" height="1.5" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="12" y="50" width="60" height="1.5" rx="1" fill="rgba(255,255,255,0.25)" />
        <rect x="8" y="58" width="104" height="2" rx="1" fill="#eee" />
        <rect x="8" y="62" width="70" height="2" rx="1" fill="#eee" />
      </svg>
    ),
    url: '/output/case-study/healthcare-nasdaq-relisting',
  },
  {
    id: 'domains',
    name: 'Domains & Niche',
    description: 'Card grid, niche solutions, technology map',
    preview: (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
        <rect width="120" height="80" fill="#faf8f4" />
        <rect x="8" y="8" width="40" height="5" rx="1" fill="#1b2a3b" />
        <rect x="8" y="15" width="20" height="2" rx="1" fill="#c4843a" />
        <rect x="8" y="20" width="104" height="0.5" fill="#c4843a" />
        <rect x="8" y="25" width="30" height="14" rx="1" fill="#faf8f4" stroke="#c4843a" strokeWidth="0.5" />
        <rect x="42" y="25" width="30" height="14" rx="1" fill="#faf8f4" stroke="#c4843a" strokeWidth="0.5" />
        <rect x="76" y="25" width="36" height="14" rx="1" fill="#faf8f4" stroke="#c4843a" strokeWidth="0.5" />
        <rect x="8" y="43" width="30" height="14" rx="1" fill="#1b2a3b" />
        <rect x="42" y="43" width="30" height="14" rx="1" fill="#1b2a3b" />
        <rect x="76" y="43" width="36" height="14" rx="1" fill="#1b2a3b" />
        <rect x="11" y="46" width="20" height="1.5" rx="1" fill="rgba(2,161,166,0.8)" />
        <rect x="11" y="49" width="15" height="1.5" rx="1" fill="rgba(255,255,255,0.3)" />
        <rect x="8" y="62" width="104" height="2" rx="1" fill="#eee" />
      </svg>
    ),
    url: '/output/domains',
  },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  wrap: { padding: '1.5rem', maxWidth: 920, margin: '0 auto', fontFamily: 'var(--sb-font-body)' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '2rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' },
  divider: { border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.1)', margin: '2rem 0' },
  btn: (style) => ({
    padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : style === 'teal' ? 'var(--sb-teal-deep, #02a1a6)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' || style === 'teal' ? 'white' : '#333',
  }),
  input: { padding: '0.5rem 0.85rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 150, padding: '0.75rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  dragRow: (dragging, over) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', borderRadius: 7, marginBottom: 4,
    border: over ? '1.5px solid var(--sb-gold, #c4843a)' : '1px solid rgba(0,0,0,0.08)',
    background: dragging ? 'rgba(196,132,58,0.06)' : 'white',
    cursor: 'grab', fontSize: '0.82rem', color: '#333', userSelect: 'none', opacity: dragging ? 0.5 : 1,
  }),
  badge: { minWidth: 20, height: 20, borderRadius: '50%', background: 'var(--sb-gold, #c4843a)', color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  toggleBtn: (on) => ({
    marginLeft: 'auto', padding: '2px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.7rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em',
    background: on ? 'var(--sb-teal-deep, #02a1a6)' : 'rgba(0,0,0,0.07)',
    color: on ? 'white' : '#555',
  }),
};

// ── Section drag-picker ───────────────────────────────────────────────────────
function SectionPicker({ allSections, includedSections, onChange }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const included = includedSections.map(id => allSections.find(s => s.sectionId === id)).filter(Boolean);
  const excluded = allSections.filter(s => !includedSections.includes(s.sectionId));
  const ordered = [...included, ...excluded];

  function handleDrop(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const reordered = [...ordered];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered.filter(s => includedSections.includes(s.sectionId)).map(s => s.sectionId));
    setDragIdx(null); setOverIdx(null);
  }

  function toggle(id) {
    onChange(includedSections.includes(id) ? includedSections.filter(x => x !== id) : [...includedSections, id]);
  }

  return (
    <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
      {ordered.map((sec, idx) => {
        const on = includedSections.includes(sec.sectionId);
        return (
          <div key={sec.sectionId} draggable
            onDragStart={e => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={S.dragRow(dragIdx === idx, overIdx === idx)}
          >
            <span style={{ color: '#bbb', fontSize: '0.75rem' }}>⠿</span>
            {on && <div style={S.badge}>{includedSections.indexOf(sec.sectionId) + 1}</div>}
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: on ? 600 : 400 }}>{sec.sectionName}</span>
              <span style={{ color: '#aaa', fontSize: '0.7rem', marginLeft: 6 }}>({sec.pageName})</span>
            </div>
            <button style={S.toggleBtn(on)} onClick={() => toggle(sec.sectionId)}>
              {on ? 'Included' : '+ Include'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Layout picker ─────────────────────────────────────────────────────────────
function LayoutPicker({ selected, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
      {LAYOUTS.map(layout => (
        <div key={layout.id} onClick={() => onChange(layout.id)}
          style={{ border: `2px solid ${selected === layout.id ? 'var(--sb-gold, #c4843a)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 8, padding: '0.75rem', cursor: 'pointer', background: selected === layout.id ? 'rgba(196,132,58,0.04)' : 'white', transition: 'all 0.15s' }}>
          <div style={{ marginBottom: '0.5rem', borderRadius: 4, overflow: 'hidden', background: '#fafafa', border: '0.5px solid rgba(0,0,0,0.07)' }}>
            {layout.preview}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--sb-navy, #1b2a3b)' }}>{layout.name}</div>
          <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 2, lineHeight: 1.4 }}>{layout.description}</div>
        </div>
      ))}
    </div>
  );
}

// ── Extract profile content from site sections ────────────────────────────────
function extractProfileContext(site, sectionIds) {
  if (!site?.pages) return '';
  const parts = [];
  for (const [, page] of Object.entries(site.pages)) {
    for (const sec of page.sections || []) {
      if (!sectionIds.includes(sec.id)) continue;
      const fields = sec.fields || sec.content || {};
      const lines = [];
      for (const [k, v] of Object.entries(fields)) {
        if (!v) continue;
        if (typeof v === 'string' && v.length > 0) lines.push(`  ${k}: ${v.slice(0, 500)}`);
        if (Array.isArray(v)) {
          lines.push(`  ${k}:`);
          v.slice(0, 20).forEach((item, i) => {
            const str = typeof item === 'string' ? item : JSON.stringify(item).slice(0, 300);
            lines.push(`    ${i + 1}. ${str}`);
          });
        }
      }
      if (lines.length > 0) parts.push(`[${sec.name || sec.type} — ${page.name}]\n${lines.join('\n')}`);
    }
  }
  return parts.join('\n\n');
}

// ── Name prompt modal ─────────────────────────────────────────────────────────
function NameModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: '1.75rem', width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.5rem' }}>Name this preset</div>
        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>Give it a descriptive name — e.g. "ERP Consultant Resume" or "PE Board Deck".</div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); if (e.key === 'Escape') onCancel(); }}
          placeholder="Preset name…"
          style={{ ...S.input, marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button style={S.btn('outline')} onClick={onCancel}>Cancel</button>
          <button style={S.btn('navy')} onClick={() => { if (name.trim()) onConfirm(name.trim()); }} disabled={!name.trim()}>Create Preset →</button>
        </div>
      </div>
    </div>
  );
}

// ── Agent diff view ───────────────────────────────────────────────────────────
function DiffView({ diff, onAccept, onDiscard, accepting }) {
  if (!diff) return null;
  const { presetName, summary, changes = [], recommendations } = diff;
  return (
    <div style={{ marginTop: '1.5rem', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: 'var(--sb-navy, #1b2a3b)', color: 'white', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold, #c4843a)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.15rem' }}>Agent Tailored Preview</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{presetName || 'Tailored Resume'}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={S.btn('outline')} onClick={onDiscard}>Discard</button>
          <button style={S.btn('gold')} onClick={onAccept} disabled={accepting}>{accepting ? 'Saving…' : '✓ Accept & Save Preset'}</button>
        </div>
      </div>
      <div style={{ padding: '1.25rem', background: '#fafafa', maxHeight: 520, overflowY: 'auto' }}>
        {summary && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(2,161,166,0.06)', border: '1px solid rgba(2,161,166,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#02a1a6', fontFamily: 'var(--sb-font-label)', marginBottom: '0.35rem' }}>Tailored Summary</div>
            <div style={{ fontSize: '0.84rem', lineHeight: 1.7, color: '#333' }}>{summary}</div>
          </div>
        )}
        {changes.map((c, i) => (
          <div key={i} style={{ marginBottom: '0.75rem', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: c.action === 'updated' ? 'rgba(196,132,58,0.08)' : c.action === 'added' ? 'rgba(2,161,166,0.08)' : 'rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.action === 'updated' ? '#c4843a' : c.action === 'added' ? '#02a1a6' : '#888' }}>
                {c.action === 'updated' ? '✎ UPDATED' : c.action === 'added' ? '+ ADDED' : '— UNCHANGED'}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1b2a3b' }}>{c.section}</span>
              {c.why && <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: 'auto', fontStyle: 'italic' }}>{c.why}</span>}
            </div>
            {(c.original || c.tailored) && (
              <div style={{ display: 'grid', gridTemplateColumns: c.original ? '1fr 1fr' : '1fr', gap: 0 }}>
                {c.original && (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(200,0,0,0.03)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c44', marginBottom: '0.2rem' }}>Original</div>
                    <div style={{ fontSize: '0.78rem', color: '#5a5a5a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.original}</div>
                  </div>
                )}
                {c.tailored && (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(0,150,0,0.03)' }}>
                    <div style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2a8a2a', marginBottom: '0.2rem' }}>Tailored</div>
                    <div style={{ fontSize: '0.78rem', color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.tailored}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {recommendations && (
          <div style={{ padding: '0.75rem', background: 'rgba(196,132,58,0.06)', border: '1px solid rgba(196,132,58,0.2)', borderRadius: 8, marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'var(--sb-font-label)', marginBottom: '0.35rem' }}>Recommendations</div>
            <div style={{ fontSize: '0.82rem', lineHeight: 1.65, color: '#444', whiteSpace: 'pre-wrap' }}>{recommendations}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyResumePanel() {
  const [site, setSite] = useState(null);
  const [presets, setPresets] = useState([]);
  const [editingPreset, setEditingPreset] = useState(null); // preset currently in the editor
  const [showNameModal, setShowNameModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Agent state
  const [jobDesc, setJobDesc] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentDiff, setAgentDiff] = useState(null); // structured diff from agent
  const [acceptingDiff, setAcceptingDiff] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/output/resume');
  const iframeRef = useRef(null);

  useEffect(() => {
    // Try member draft site; fall back to admin site if member has no pages
    // (admin users keep their content in the admin site, not member-site)
    api.getMemberDraftSite()
      .then(s => {
        if (s?.pages && Object.keys(s.pages).length > 0) { setSite(s); return null; }
        return api.getDraftSite();
      })
      .then(s => { if (s) setSite(s); })
      .catch(() => api.getDraftSite().then(s => setSite(s)).catch(() => {}));
    loadPresets();
  }, []);

  function loadPresets() {
    fetch('/api/members/me/resume-presets', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { presets: [] })
      .then(d => {
        const loaded = d.presets || [];
        if (loaded.length === 0) {
          // Seed a default primary preset so the panel is never blank on first open
          setPresets([{ id: 'preset-default', name: 'Primary Resume', primaryResume: true, includedSections: [], layout: 'classic' }]);
        } else {
          setPresets(loaded);
        }
      })
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
      if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
      const data = await r.json();
      setPresets(data.presets || next);
      toast.success('Preset saved');
      return true;
    } catch (e) {
      toast.error('Save failed: ' + e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openNewPreset(name) {
    setShowNameModal(false);
    const preset = {
      id: `preset-${Date.now()}`,
      name,
      primaryResume: presets.length === 0,
      includedSections: [],
      layout: 'classic',
    };
    setEditingPreset({ ...preset });
  }

  async function saveEditingPreset() {
    if (!editingPreset) return;
    if (!editingPreset.name.trim()) { toast.error('Preset needs a name'); return; }
    const next = presets.some(p => p.id === editingPreset.id)
      ? presets.map(p => p.id === editingPreset.id ? editingPreset : p)
      : [...presets, editingPreset];
    const ok = await savePresets(next);
    if (ok) setEditingPreset(null);
  }

  function setPrimary(id) {
    savePresets(presets.map(p => ({ ...p, primaryResume: p.id === id })));
  }

  function deletePreset(id) {
    if (!confirm('Delete this preset?')) return;
    savePresets(presets.filter(p => p.id !== id));
  }

  // ── Agent ──
  async function runAgent() {
    if (!jobDesc.trim()) { toast.error('Paste a job description first'); return; }
    setAgentRunning(true);
    setAgentDiff(null);

    const preset = presets.find(p => p.id === selectedPresetId) || presets.find(p => p.primaryResume) || presets[0];
    const sectionIds = preset?.includedSections || [];
    const profileContext = extractProfileContext(site, sectionIds);

    try {
      const r = await fetch('/api/members/me/agent', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a professional resume writer. You have been given the candidate's actual profile content and a job description. Tailor the resume to best match the role — truthfully, using only the content provided.

${profileContext ? `CANDIDATE PROFILE:\n${profileContext}\n\n` : '(No profile sections selected — limited context available.)\n\n'}BASELINE PRESET: ${preset?.name || 'Primary Resume'}
JOB DESCRIPTION:\n${jobDesc}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "presetName": "Tailored for [Company] — [Role]",
  "summary": "3-4 sentence tailored professional summary",
  "changes": [
    {
      "section": "Section Name",
      "action": "updated|added|unchanged",
      "original": "original text from profile (for updated sections)",
      "tailored": "rewritten/tailored text",
      "why": "one sentence explaining the change"
    }
  ],
  "recommendations": "2-3 sentences on gaps or preparation tips for this specific role"
}`,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      const raw = d.response || d.content || '';
      // Try to parse JSON from the response
      let diff = null;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) diff = JSON.parse(jsonMatch[0]);
        else diff = JSON.parse(raw);
      } catch {
        diff = { presetName: 'Tailored Resume', summary: raw, changes: [], recommendations: '' };
      }
      setAgentDiff(diff);
    } catch (e) {
      toast.error('Agent failed: ' + e.message);
    } finally {
      setAgentRunning(false);
    }
  }

  async function acceptDiff() {
    if (!agentDiff) return;
    setAcceptingDiff(true);
    const basePreset = presets.find(p => p.id === selectedPresetId) || presets.find(p => p.primaryResume) || presets[0];
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: agentDiff.presetName || 'Tailored Resume',
      primaryResume: false,
      includedSections: basePreset?.includedSections || [],
      layout: basePreset?.layout || 'classic',
      agentSummary: agentDiff.summary,
      agentChanges: agentDiff.changes,
      tailoredFrom: basePreset?.id,
    };
    const next = [...presets, newPreset];
    const ok = await savePresets(next);
    if (ok) {
      setAgentDiff(null);
      toast.success('Tailored preset saved — find it in your presets above');
    }
    setAcceptingDiff(false);
  }

  // Flatten all sections from the draft site
  const allSections = [];
  if (site?.pages) {
    for (const [pageKey, page] of Object.entries(site.pages)) {
      (page.sections || []).forEach(sec => {
        allSections.push({ pageKey, pageName: page.name || pageKey, sectionId: sec.id, sectionName: sec.name || sec.type });
      });
    }
  }

  const primaryPreset = presets.find(p => p.primaryResume);
  const otherPresets = presets.filter(p => !p.primaryResume);
  const activeLayout = LAYOUTS.find(l => l.id === (editingPreset?.layout || 'classic')) || LAYOUTS[0];

  return (
    <div style={S.wrap}>
      <div style={S.h1}>My Resume</div>
      <div style={S.sub}>Configure resume presets, generate tailored outputs, and preview or print directly from here.</div>

      {/* ── Primary preset hero ────────────────────────────────────────── */}
      {primaryPreset && editingPreset?.id !== primaryPreset.id && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={S.label}>Primary Resume</div>
          <div style={{ background: 'white', border: '2px solid var(--sb-gold, #c4843a)', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(196,132,58,0.08)', borderRadius: 8, padding: '0.6rem 1rem', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold, #c4843a)', fontFamily: 'var(--sb-font-label)' }}>Primary</div>
              <div style={{ fontSize: '1.5rem', marginTop: 2 }}>◈</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.15rem' }}>{primaryPreset.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#888' }}>
                {primaryPreset.includedSections.length} sections · {LAYOUTS.find(l => l.id === primaryPreset.layout)?.name || 'Classic SB'} layout
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep, #02a1a6)', marginTop: '0.25rem' }}>
                Public link: <a href={activeLayout.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>/output/resume</a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button style={S.btn('outline')} onClick={() => setEditingPreset({ ...primaryPreset })}>Edit Preset</button>
              <button style={S.btn('navy')} onClick={() => { setPreviewUrl(LAYOUTS.find(l => l.id === primaryPreset.layout)?.url || '/output/resume'); setShowPreview(v => !v); }}>
                {showPreview ? 'Hide Preview' : 'Preview PDF'}
              </button>
              {showPreview && (
                <button style={S.btn('gold')} onClick={() => iframeRef.current?.contentWindow?.print()}>Print / Save PDF</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline PDF preview */}
      {showPreview && (
        <div style={{ marginBottom: '1.5rem', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>Resume Preview · {LAYOUTS.find(l => l.url === previewUrl)?.name || 'Resume'}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {LAYOUTS.filter(l => l.url !== '/output/domains').map(l => (
                <button key={l.id} style={{ ...S.btn(previewUrl === l.url ? 'navy' : 'outline'), padding: '2px 8px', fontSize: '0.68rem' }} onClick={() => setPreviewUrl(l.url)}>{l.name}</button>
              ))}
              <a href={previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep, #02a1a6)', textDecoration: 'none', marginLeft: 4 }}>↗ full tab</a>
            </div>
          </div>
          <iframe ref={iframeRef} src={previewUrl} style={{ width: '100%', height: 680, border: 'none', display: 'block' }} title="Resume Preview" />
        </div>
      )}

      {/* ── Other presets grid ─────────────────────────────────────────── */}
      {otherPresets.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={S.label}>Other Presets</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {otherPresets.map(preset => (
              <div key={preset.id}
                style={{ border: `1.5px solid ${editingPreset?.id === preset.id ? 'var(--sb-gold, #c4843a)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, padding: '0.9rem 1rem', background: 'white', cursor: 'pointer' }}
                onClick={() => setEditingPreset({ ...preset })}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' }}>{preset.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>{preset.includedSections.length} sections · {LAYOUTS.find(l => l.id === preset.layout)?.name || 'Classic SB'}</div>
                {preset.tailoredFrom && <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep, #02a1a6)', marginTop: 3 }}>✦ AI tailored</div>}
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button style={{ ...S.btn('outline'), padding: '2px 8px', fontSize: '0.68rem' }} onClick={e => { e.stopPropagation(); setPrimary(preset.id); }}>Set Primary</button>
                  <button style={{ ...S.btn('outline'), padding: '2px 8px', fontSize: '0.68rem' }} onClick={e => { e.stopPropagation(); deletePreset(preset.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── New preset button ──────────────────────────────────────────── */}
      {!editingPreset && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button style={{ ...S.btn('outline'), border: '2px dashed rgba(196,132,58,0.4)', color: 'var(--sb-gold, #c4843a)', fontWeight: 700, padding: '0.65rem 1.5rem' }} onClick={() => setShowNameModal(true)}>
            + New Preset
          </button>
        </div>
      )}

      {/* ── Preset editor ─────────────────────────────────────────────── */}
      {editingPreset && (
        <div style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input value={editingPreset.name} onChange={e => setEditingPreset(p => ({ ...p, name: e.target.value }))}
              placeholder="Preset name" style={{ ...S.input, flex: 1, minWidth: 180 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: '#444', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={editingPreset.primaryResume} onChange={e => setEditingPreset(p => ({ ...p, primaryResume: e.target.checked }))}
                style={{ accentColor: 'var(--sb-gold, #c4843a)', width: 15, height: 15 }} />
              Primary (public)
            </label>
          </div>

          <div style={S.label}>Layout Template</div>
          <LayoutPicker selected={editingPreset.layout || 'classic'} onChange={id => setEditingPreset(p => ({ ...p, layout: id }))} />

          <div style={S.label}>Include Sections — drag to reorder</div>
          {allSections.length > 0
            ? <SectionPicker allSections={allSections} includedSections={editingPreset.includedSections} onChange={ids => setEditingPreset(p => ({ ...p, includedSections: ids }))} />
            : <div style={{ fontSize: '0.8rem', color: '#aaa', padding: '0.75rem 0' }}>Loading profile sections…</div>
          }

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button style={S.btn('navy')} onClick={saveEditingPreset} disabled={saving}>{saving ? 'Saving…' : 'Save Preset'}</button>
            <button style={S.btn('outline')} onClick={() => setEditingPreset(null)}>Cancel</button>
            {editingPreset.id && !presets.some(p => p.id === editingPreset.id) ? null : (
              <a href={(LAYOUTS.find(l => l.id === editingPreset.layout) || LAYOUTS[0]).url} target="_blank" rel="noreferrer"
                style={{ ...S.btn('outline'), textDecoration: 'none', display: 'inline-block' }}>Preview ↗</a>
            )}
          </div>
        </div>
      )}

      <hr style={S.divider} />

      {/* ── Resume interpreter agent ───────────────────────────────────── */}
      <div style={S.label}>Resume Interpreter Agent</div>
      <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '1rem', lineHeight: 1.55 }}>
        Paste a job description. The agent reads your actual profile content from the selected preset and returns a tailored resume with section-by-section changes highlighted. Accept to save as a new preset.
      </p>

      {presets.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.3rem' }}>Starting from preset:</label>
          <select value={selectedPresetId} onChange={e => setSelectedPresetId(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
            {presets.map(p => <option key={p.id} value={p.id}>{p.name}{p.primaryResume ? ' (primary)' : ''}</option>)}
          </select>
          {(() => {
            const sel = presets.find(p => p.id === selectedPresetId) || presets.find(p => p.primaryResume) || presets[0];
            return sel?.includedSections?.length === 0
              ? <div style={{ fontSize: '0.72rem', color: '#e06d2b', marginTop: 4 }}>This preset has no sections selected — edit the preset above to add profile sections for better agent context.</div>
              : null;
          })()}
        </div>
      )}

      <textarea style={S.textarea} placeholder="Paste the job description here…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={S.btn('gold')} onClick={runAgent} disabled={agentRunning || !jobDesc.trim()}>
          {agentRunning ? '⏳ Analyzing…' : '✦ Tailor My Resume'}
        </button>
        {agentDiff && <button style={S.btn('outline')} onClick={() => setAgentDiff(null)}>Clear</button>}
      </div>

      <DiffView diff={agentDiff} onAccept={acceptDiff} onDiscard={() => setAgentDiff(null)} accepting={acceptingDiff} />

      {/* Name modal */}
      {showNameModal && <NameModal onConfirm={openNewPreset} onCancel={() => setShowNameModal(false)} />}
    </div>
  );
}
