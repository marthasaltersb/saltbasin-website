// BestyStaff intake chat — rendered under the public teaser views of the
// Career Master Database, Case Study Portfolio, and Strategic Operator
// outputs.
//
// Architecture: a cache-defined layer + an API-defined layer.
//   - Cache layer (src/lib/bestyStaffScript.js): the opening script (consent
//     → "do you know Betsy" → top-5-questions), the flow pick, the closing
//     question, and a bank of guardrail-sensitive safe answers all run
//     client-side with zero network calls — deterministic wording straight
//     from docs/salt-basin-specific-agent-playbook.md.
//   - API layer (server/routes/bestyStaff.js, Claude-backed): only invoked
//     once the visitor has picked a flow, and only for turns the safe-answer
//     bank doesn't cover — open-ended reasoning, coverage matching, JD
//     parsing, and the final submit_portfolio_request tool call.
//
// Sample-document attachments ride the paperclip, behind a data disclaimer,
// into the temporary attachment context space (auto-deleted after 24 hours).
// When the agent is offline (no ANTHROPIC_API_KEY), the chat falls back to
// the static intake forms below — same fields, same endpoint.

import React, { useEffect, useRef, useState, useMemo } from 'react';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import {
  CONSENT_LINE, KNOWS_BETSY_QUESTION, TOP_QUESTIONS_QUESTION, CLOSING_QUESTION,
  FLOW_QUICK_REPLIES, matchSafeAnswer,
  readLeadMemory, writeLeadMemory, welcomeBackLine, welcomeBackMemberLine,
} from '../lib/bestyStaffScript.js';
import { readBestyAttribution, recordBestyTouch } from '../lib/bestyStaffAttribution.js';

const C = {
  navy: 'var(--sb-navy, #3D4452)',
  midnight: 'var(--sb-navy-deep, #0F1B2D)',
  gold: 'var(--sb-teal, #4A7C8E)',
  cream: 'var(--sbh-cream, #F7F2E8)',
  mist: 'var(--sbh-mist, #EEF2F6)',
  slate: 'var(--sbh-ink-soft, #536173)',
  fog: 'var(--sb-dusty, #6D7785)',
};

const S = {
  eyebrow: { fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, fontFamily: 'var(--sb-font-label)', fontWeight: 700, marginBottom: '0.4rem' },
  h2: { fontSize: '1.35rem', margin: '0 0 0.5rem', lineHeight: 1.25, fontFamily: 'var(--sb-font-display)', color: C.navy },
  p: { fontSize: '0.85rem', color: C.slate, lineHeight: 1.65, margin: '0 0 1rem' },
  label: { display: 'block', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.slate, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.3rem' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(23,42,69,0.25)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', minHeight: 90, padding: '0.6rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(23,42,69,0.25)', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  field: { marginBottom: '0.9rem' },
  btnGold: { padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gold, color: 'white', fontSize: '0.78rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', fontWeight: 700 },
  btnNavy: { padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.navy, color: 'white', fontSize: '0.78rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', fontWeight: 700 },
  btnOutline: { padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.navy, border: '1px solid rgba(23,42,69,0.3)', fontSize: '0.78rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em' },
  chip: (on) => ({
    padding: '0.3rem 0.7rem', borderRadius: 14, cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'sans-serif',
    border: `1px solid ${on ? C.gold : 'rgba(23,42,69,0.25)'}`, background: on ? 'rgba(196,132,58,0.12)' : 'white',
    color: on ? C.navy : C.slate, fontWeight: on ? 700 : 400, userSelect: 'none',
  }),
  radioRow: { display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.82rem' },
};

// ── Attachment strip + data disclaimer (shared by chat and fallback forms) ──
const DISCLAIMER_TEXT = (
  <>
    <strong style={{ color: C.navy }}>Data disclaimer:</strong> attachments are stored in a private, temporary
    context space and are <strong style={{ color: C.navy }}>automatically deleted 24 hours after upload</strong>.
    They're used only to tailor the requested portfolio. Don't upload anything you wouldn't share in a
    LinkedIn DM — see the <a href="/data-notice" target="_blank" rel="noreferrer" style={{ color: C.gold }}>data notice</a>.
  </>
);

function AttachmentsField({ files, setFiles, disclaimerAck, setDisclaimerAck }) {
  const inputRef = useRef(null);
  return (
    <div style={{ ...S.field, background: C.mist, borderRadius: 8, padding: '0.85rem 1rem' }}>
      <label style={S.label}>Sample documents for context (optional — up to 5, 10MB each)</label>
      <input
        ref={inputRef} type="file" multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.rtf,.jpg,.jpeg,.png,.webp"
        style={{ fontSize: '0.78rem', fontFamily: 'sans-serif' }}
        onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
      />
      {files.length > 0 && (
        <>
          <div style={{ marginTop: '0.5rem' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: C.slate, padding: '0.15rem 0', fontFamily: 'sans-serif' }}>
                <span>{f.name} · {(f.size / 1024 / 1024).toFixed(1)}MB</span>
                <span style={{ cursor: 'pointer', color: '#a33' }} onClick={() => {
                  const next = files.filter((_, j) => j !== i);
                  setFiles(next);
                  if (next.length === 0 && inputRef.current) inputRef.current.value = '';
                }}>remove</span>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.6rem', fontSize: '0.72rem', color: C.slate, lineHeight: 1.55, cursor: 'pointer' }}>
            <input type="checkbox" checked={disclaimerAck} onChange={(e) => setDisclaimerAck(e.target.checked)} style={{ accentColor: C.gold, marginTop: 2 }} />
            <span>{DISCLAIMER_TEXT}</span>
          </label>
        </>
      )}
    </div>
  );
}

function RadioPair({ name, value, onChange }) {
  return (
    <div style={S.radioRow}>
      {[['true', 'Yes'], ['false', 'No']].map(([v, label]) => (
        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} style={{ accentColor: C.gold }} />
          {label}
        </label>
      ))}
    </div>
  );
}

function ChipGroup({ title, options, selected, onToggle }) {
  if (!options.length) return null;
  return (
    <div style={{ marginBottom: '0.7rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fog, fontFamily: 'sans-serif', marginBottom: '0.35rem' }}>{title}</div>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {options.map((o) => (
          <span key={o} style={S.chip(selected.includes(o))} onClick={() => onToggle(o)}>{o}</span>
        ))}
      </div>
    </div>
  );
}

function ContactFields({ form, set, heading }) {
  return (
    <>
      <div style={{ ...S.eyebrow, marginTop: '1.1rem' }}>{heading}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div style={S.field}><label style={S.label}>Name</label><input style={S.input} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Email *</label><input style={S.input} type="email" required value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Company</label><input style={S.input} value={form.contactCompany} onChange={(e) => set('contactCompany', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Role / Title</label><input style={S.input} value={form.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} /></div>
      </div>
    </>
  );
}

async function submitRequest({ kind, sourceOutput, form, coverage, showcase, files, disclaimerAck }) {
  const fd = new FormData();
  fd.append('kind', kind);
  fd.append('sourceOutput', sourceOutput || '');
  Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
  if (coverage) fd.append('coverage', JSON.stringify(coverage));
  if (showcase) fd.append('showcase', JSON.stringify(showcase));
  fd.append('disclaimerAck', String(disclaimerAck));
  files.forEach((f) => fd.append('files', f, f.name));
  const res = await fetch('/api/portfolio-requests', { method: 'POST', body: fd, credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Submission failed — please try again');
  return data;
}

// ── Fallback form 1: request Betsy's tailored portfolio ────────────────────
function RequestBetsyForm({ sourceOutput, master, onDone }) {
  const [form, setForm] = useState({ knowsBetsy: '', knowsBetsyDetail: '', comparingToRole: '', jobDescription: '', coverageNotes: '', contactName: '', contactEmail: '', contactCompany: '', contactTitle: '', contactPhone: '' });
  const [coverage, setCoverage] = useState([]);
  const [files, setFiles] = useState([]);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (o) => setCoverage((c) => (c.includes(o) ? c.filter((x) => x !== o) : [...c, o]));

  const modules = useMemo(() => {
    const scenarios = [...new Set((master?.engagements || []).flatMap((e) => e.scenarios || []))].slice(0, 12);
    const skillCats = [...new Set((master?.skills || []).map((s) => s.category).filter(Boolean))].slice(0, 10);
    const tools = (master?.tools || []).filter((t) => t.tier === 'Expert' || t.tier === 'Advanced')
      .map((t) => (t.currentName && !/sunset/i.test(t.currentName) ? t.currentName : t.nameUsed)).slice(0, 12);
    return { scenarios, skillCats, tools };
  }, [master]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length > 0 && !disclaimerAck) { setError('Please acknowledge the attachment data disclaimer.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await submitRequest({ kind: 'request_betsy', sourceOutput, form, coverage, files, disclaimerAck });
      onDone(result);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.eyebrow}>Tailored Portfolio Request</div>
      <h2 style={S.h2}>Request Betsy's Career Portfolio</h2>
      <p style={S.p}>A Tailored Resume Portfolio is generated from the Career Master database and sent to your contact details below.</p>

      <div style={S.field}>
        <label style={S.label}>Do you already know Betsy?</label>
        <RadioPair name="knowsBetsy" value={form.knowsBetsy} onChange={(v) => set('knowsBetsy', v)} />
        {form.knowsBetsy === 'true' && (
          <input style={{ ...S.input, marginTop: '0.45rem' }} placeholder="How do you two know each other?" value={form.knowsBetsyDetail} onChange={(e) => set('knowsBetsyDetail', e.target.value)} />
        )}
      </div>

      <div style={S.field}>
        <label style={S.label}>Are you comparing Betsy to an open role?</label>
        <RadioPair name="comparingToRole" value={form.comparingToRole} onChange={(v) => set('comparingToRole', v)} />
        {form.comparingToRole === 'true' && (
          <textarea style={{ ...S.textarea, marginTop: '0.45rem' }} placeholder="Paste the job description (or a link to it) here" value={form.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} />
        )}
      </div>

      <div style={S.field}>
        <label style={S.label}>What should the outputs cover?</label>
        <ChipGroup title="Scenarios" options={modules.scenarios} selected={coverage} onToggle={toggle} />
        <ChipGroup title="Skill areas" options={modules.skillCats} selected={coverage} onToggle={toggle} />
        <ChipGroup title="Technology modules" options={modules.tools} selected={coverage} onToggle={toggle} />
        <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder="Anything else the outputs should cover?" value={form.coverageNotes} onChange={(e) => set('coverageNotes', e.target.value)} />
      </div>

      <ContactFields form={form} set={set} heading="Where should the Tailored Resume Portfolio be sent?" />
      <div style={S.field}><label style={S.label}>Phone (optional)</label><input style={S.input} value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>

      <AttachmentsField files={files} setFiles={setFiles} disclaimerAck={disclaimerAck} setDisclaimerAck={setDisclaimerAck} />

      {error && <div style={{ color: '#a33', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{error}</div>}
      <button type="submit" style={{ ...S.btnGold, opacity: busy ? 0.6 : 1 }} disabled={busy}>{busy ? 'Sending…' : '✦ Request the Tailored Portfolio'}</button>
    </form>
  );
}

// ── Fallback form 2: build your own ────────────────────────────────────────
const ROLE_TYPES = ['Operating Partner / PE PortOps', 'Investment Partner (GP / LP)', 'RevOps / GTM Leader', 'Finance Executive', 'Consultant / Advisor', 'Fractional Executive', 'Founder', 'Technologist / Architect', 'Other'];
const CAREER_STAGES = ['Early career', 'Mid career', 'Senior / Lead', 'Executive', 'Independent / Fractional'];
const GOALS = ['Land an open role', 'Build a consulting / fractional pipeline', 'Stand up an investor profile', 'Grow my personal brand', 'Not sure yet'];
const SHOWCASE_OPTIONS = ['Skills proficiency dashboard', 'Deal & transaction history', 'Case studies', 'Certifications & renewals', 'Tool proficiency graphics', 'Client testimonials', 'Industry experience bars'];

function BuildOwnForm({ sourceOutput, onDone }) {
  const [form, setForm] = useState({ roleType: '', careerStage: '', goal: '', notes: '', contactName: '', contactEmail: '', contactCompany: '', contactTitle: '' });
  const [showcase, setShowcase] = useState([]);
  const [files, setFiles] = useState([]);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (o) => setShowcase((c) => (c.includes(o) ? c.filter((x) => x !== o) : [...c, o]));

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length > 0 && !disclaimerAck) { setError('Please acknowledge the attachment data disclaimer.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await submitRequest({ kind: 'build_own', sourceOutput, form, showcase, files, disclaimerAck });
      onDone(result);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const selectStyle = { ...S.input, fontFamily: 'sans-serif', fontSize: '0.8rem' };
  return (
    <form onSubmit={handleSubmit}>
      <div style={S.eyebrow}>Build Your Own</div>
      <h2 style={S.h2}>Build a Career Portfolio &amp; Salt Basin Profile for yourself</h2>
      <p style={S.p}>Answer a few questions and we'll recommend the tailored portfolio format best suited to you.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div style={S.field}>
          <label style={S.label}>What kind of role are you in?</label>
          <select style={selectStyle} value={form.roleType} onChange={(e) => set('roleType', e.target.value)}>
            <option value="">Select…</option>
            {ROLE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={S.field}>
          <label style={S.label}>Career stage</label>
          <select style={selectStyle} value={form.careerStage} onChange={(e) => set('careerStage', e.target.value)}>
            <option value="">Select…</option>
            {CAREER_STAGES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>What's the portfolio for?</label>
        <select style={selectStyle} value={form.goal} onChange={(e) => set('goal', e.target.value)}>
          <option value="">Select…</option>
          {GOALS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={S.field}>
        <label style={S.label}>What do you want to showcase?</label>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {SHOWCASE_OPTIONS.map((o) => <span key={o} style={S.chip(showcase.includes(o))} onClick={() => toggle(o)}>{o}</span>)}
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Anything else about your background or audience?</label>
        <textarea style={{ ...S.textarea, minHeight: 70 }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <ContactFields form={form} set={set} heading="Where should we follow up?" />
      <AttachmentsField files={files} setFiles={setFiles} disclaimerAck={disclaimerAck} setDisclaimerAck={setDisclaimerAck} />

      {error && <div style={{ color: '#a33', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{error}</div>}
      <button type="submit" style={{ ...S.btnNavy, opacity: busy ? 0.6 : 1 }} disabled={busy}>{busy ? 'Sending…' : '✦ Get my recommended portfolio'}</button>
    </form>
  );
}

function SuccessView({ result, kind, onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
      <div style={{ fontSize: '2.2rem', color: C.gold, marginBottom: '0.5rem' }}>✦</div>
      <h2 style={S.h2}>{kind === 'build_own' ? 'Intake received' : 'Request received'}</h2>
      {kind === 'build_own' && result.recommendedPortfolio && (
        <div style={{ background: C.mist, borderRadius: 8, padding: '0.9rem 1.1rem', margin: '0.75rem 0', fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'left' }}>
          <strong>Recommended for you:</strong> {result.recommendedPortfolio}
        </div>
      )}
      <p style={S.p}>
        {kind === 'build_own'
          ? "We'll follow up at the email you provided to stand up your Career Portfolio and Salt Basin Profile."
          : 'Betsy has been notified — the Tailored Resume Portfolio will be sent to the contact details you provided.'}
        {result.attachmentsStored > 0 && (
          <> Your {result.attachmentsStored} attachment{result.attachmentsStored === 1 ? '' : 's'} will be automatically
          deleted from the temporary context space within 24 hours.</>
        )}
      </p>
      <button style={S.btnOutline} onClick={onClose}>Close</button>
    </div>
  );
}

// ── BestyStaff chat window — cache layer + API layer ───────────────────────

const GREETING = "Hi — I'm BestyStaff, Betsy Salter's AI proxy here at Salt Basin Net Works. You're looking at a preview of Betsy's career portfolio.";
const FLOW_PICK_INTRO = 'Got it — which of these sounds like what you need?';

function ChatBubble({ msg }) {
  if (msg.role === 'notice') {
    return (
      <div style={{ textAlign: 'center', fontSize: '0.68rem', color: C.fog, fontFamily: 'sans-serif', padding: '0.2rem 0.75rem', lineHeight: 1.5 }}>
        {msg.text}
      </div>
    );
  }
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '0.55rem 0.8rem', borderRadius: 12,
        borderBottomRightRadius: isUser ? 3 : 12, borderBottomLeftRadius: isUser ? 12 : 3,
        background: isUser ? C.navy : C.mist, color: isUser ? 'white' : C.navy,
        fontSize: '0.82rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif',
      }}>
        {msg.text}
      </div>
    </div>
  );
}

function QuickReplies({ options, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
      {options.map((q) => (
        <button key={q} onClick={() => onPick(q)} style={{
          textAlign: 'left', padding: '0.55rem 0.8rem', borderRadius: 10, cursor: 'pointer',
          border: `1px solid ${C.gold}`, background: 'rgba(196,132,58,0.08)', color: C.navy,
          fontSize: '0.78rem', fontFamily: 'Georgia, serif', lineHeight: 1.4,
        }}>
          {q}
        </button>
      ))}
    </div>
  );
}

export default function PortfolioRequestPrompt({ sourceOutput, master, user, autoOpen = true, openOnHash = null, intakeConfig = null, onConversionIntent = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: intakeConfig?.greeting || GREETING },
    { role: 'assistant', text: intakeConfig?.consentPrompt || CONSENT_LINE },
  ]);
  // Cache-layer phases run with zero network calls: consent → knowsBetsy →
  // (knowsBetsyDetail) → topQuestions → flowPick. 'chatting' hands off to the
  // API layer; 'awaitingClosing' is the required closing question.
  const [phase, setPhase] = useState('consent');
  const [cacheCtx, setCacheCtx] = useState({ consentGiven: null, knowsBetsy: null, knowsBetsyDetail: '', topQuestions: '' });
  const [closingAsked, setClosingAsked] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState([]);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [offline, setOffline] = useState(false);
  const [fallbackView, setFallbackView] = useState('prompt'); // prompt | request_betsy | build_own | done
  const [fallbackResult, setFallbackResult] = useState(null);
  const [fallbackKind, setFallbackKind] = useState(null);
  const [actorContext, setActorContext] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get('intakeSource');
    if (source) recordBestyTouch(source, { action: 'arrived-at-intake' });
  }, []);

  useEffect(() => {
    if (!open) return;
    recordBestyTouch('bestystaff-chat', { action: 'chat-opened', sourceOutput });
    // Opening BestyStaff is itself a meaningful interaction. Create or update
    // an anonymous provisional lead immediately so abandoned chats remain
    // visible to the lead owner without implying contact or marketing consent.
    fetch('/api/leads/touch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: 'bestystaff',
        message: 'BestyStaff chat opened — conversation unfinished',
        questionKey: 'conversationStatus',
        answerValue: 'provisional_unfinished',
        ctaLocation: `${window.location.pathname}${window.location.search}#bestystaff`,
        attribution: readBestyAttribution(),
      }),
    }).catch(() => {});
  }, [open, sourceOutput]);

  // Teaser pages open automatically. Data-driven contact sections can opt
  // into hash-triggered opening instead.
  useEffect(() => {
    const openForHash = () => {
      if (openOnHash && window.location.hash === openOnHash) setOpen(true);
    };
    openForHash();
    window.addEventListener('hashchange', openForHash);
    window.addEventListener('bestystaff:open', openForHash);
    const t = autoOpen ? setTimeout(() => setOpen(true), 2200) : null;
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener('hashchange', openForHash);
      window.removeEventListener('bestystaff:open', openForHash);
    };
  }, [autoOpen, openOnHash]);

  // Returning-visitor recognition — resolves once on mount, well before the
  // 2200ms open-delay above, so there's no visible flash of the wrong
  // script. A known member (session already resolved by the parent Output
  // page before this component even mounts) skips straight to the flow pick
  // with a personalized welcome; an anonymous visitor with a matched
  // localStorage lead token does the same via the token-gated lookup
  // endpoint. Anyone else keeps the full opening script untouched.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) {
        let prior = null;
        try {
          const res = await fetch('/api/portfolio-requests/my-history', { credentials: 'include' });
          if (res.ok) prior = (await res.json()).item;
        } catch { /* no prior history — still a valid welcome-back */ }
        if (cancelled) return;
        setMessages([
          { role: 'assistant', text: GREETING },
          { role: 'assistant', text: prior ? welcomeBackLine({ name: user.displayName, ...prior }) : welcomeBackMemberLine(user.displayName) },
        ]);
        setCacheCtx((c) => ({ ...c, consentGiven: true, knowsBetsy: true, topQuestions: prior?.topQuestions || '' }));
        setPhase('flowPick');
        return;
      }

      try {
        const actorRes = await fetch('/api/leads/actor-context', { credentials: 'include' });
        const actor = actorRes.ok ? await actorRes.json() : null;
        if (!cancelled && actor?.returning) {
          const welcome = 'Welcome back! Thanks for returning, what can I help you with this visit?';
          setActorContext(actor);
          setMessages([{ role: 'assistant', text: welcome }]);
          setCacheCtx((c) => ({
            ...c,
            consentGiven: actor.answered?.consentGiven ?? c.consentGiven,
            knowsBetsy: actor.answered?.knowsBetsy ?? c.knowsBetsy,
            knowsBetsyDetail: actor.answered?.knowsBetsyDetail || c.knowsBetsyDetail,
            topQuestions: actor.answered?.topQuestions || c.topQuestions,
          }));
          setPhase('returningWelcome');
          fetch('/api/leads/touch', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ source: 'bestystaff', message: welcome, questionKey: 'returningWelcome', answerValue: true, ctaLocation: window.location.pathname }),
          }).catch(() => {});
          return;
        }
      } catch { /* fresh visitor fallback */ }

      const mem = readLeadMemory();
      if (!mem) return; // fresh visitor — default opening script stands
      try {
        const res = await fetch(`/api/portfolio-requests/lookup?id=${encodeURIComponent(mem.id)}&token=${encodeURIComponent(mem.token)}`, { credentials: 'include' });
        if (!res.ok) return; // token stale/invalid — fall back to the default script
        const item = (await res.json()).item;
        if (cancelled || !item) return;
        setMessages([
          { role: 'assistant', text: GREETING },
          { role: 'assistant', text: welcomeBackLine({ name: item.contactName, ...item }) },
        ]);
        setCacheCtx((c) => ({ ...c, consentGiven: true, knowsBetsy: item.knowsBetsy === true, knowsBetsyDetail: item.knowsBetsyDetail || '', topQuestions: item.topQuestions || '' }));
        setPhase('flowPick');
      } catch { /* lookup failed — default opening script stands */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, open]);

  function respondAssistant(text) { setMessages((m) => [...m, { role: 'assistant', text }]); }
  function respondUser(text, questionKey = 'conversation', answerValue = text) {
    setMessages((m) => [...m, { role: 'user', text }]);
    fetch('/api/leads/touch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: 'bestystaff', message: text, questionKey, answerValue,
        ctaLocation: `${window.location.pathname}${window.location.search}#bestystaff`,
        attribution: readBestyAttribution(),
      }),
    }).catch(() => {});
  }

  async function uploadAttachments(requestId) {
    if (!files.length) return null;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    fd.append('disclaimerAck', String(disclaimerAck));
    const res = await fetch(`/api/portfolio-requests/${requestId}/attachments`, { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'attachment upload failed');
    return data;
  }

  // API layer — only reached once a flow is picked, and only for turns the
  // safe-answer cache bank doesn't cover. `payloadMessage` may carry an
  // appended cache-layer context block the visitor never sees; `history`
  // is the message list snapshot taken BEFORE the current turn was added.
  async function createLeadFromTranscript(leadCapture, transcriptMessages) {
    if (!leadCapture?.contactEmail) return null;
    const transcript = transcriptMessages
      .filter((m) => m?.content)
      .map((m) => `${m.role === 'assistant' ? 'BestyStaff' : 'Visitor'}: ${m.content}`)
      .join('\n\n');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: 'bestystaff',
        email: leadCapture.contactEmail,
        phone: leadCapture.contactPhone || null,
        name: leadCapture.contactName || null,
        message: transcript,
        answers: { ...(leadCapture.answers || {}), conversationStatus: 'completed', attribution: readBestyAttribution() },
        ctaLocation: `${window.location.pathname}#bestystaff`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'lead record creation failed');
    return data;
  }

  async function sendToApi(payloadMessage, history, visibleMessage = payloadMessage) {
    setSending(true);
    try {
      const res = await fetch('/api/agent/bestystaff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: payloadMessage,
          history,
          sourceOutput,
          attachmentCount: files.length,
          leadMemory: readLeadMemory(),
          attribution: readBestyAttribution(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.offline) { setOffline(true); return; }
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'notice', text: data.error || 'BestyStaff hit an error — please try again.' }]);
        return;
      }
      if (data.reply) respondAssistant(data.reply);
      // convert_lead_to_member only captures the visitor's choice (personal
      // vs. other, optional alternate login email) — it never handles a
      // password. The actual conversion happens in a secure UI step the
      // host page provides (see LeadView.jsx), not in this chat transcript.
      if (data.conversionIntent && onConversionIntent) onConversionIntent(data.conversionIntent);
      if (data.submitted?.id) {
        const transcriptMessages = [
          ...history,
          { role: 'user', content: visibleMessage },
          ...(data.reply ? [{ role: 'assistant', content: data.reply }] : []),
        ];
        try {
          data.submitted.lead = await createLeadFromTranscript(data.submitted.leadCapture, transcriptMessages);
          if (data.submitted.lead?.leadId && data.submitted.publicToken) {
            await fetch(`/api/portfolio-requests/${data.submitted.id}/lead`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                token: data.submitted.publicToken,
                leadId: data.submitted.lead.leadId,
              }),
            });
          }
        } catch (e) {
          setMessages((m) => [...m, { role: 'notice', text: `Your intake was saved, but the CRM lead record needs a retry (${e.message}).` }]);
        }
        setSubmitted(data.submitted);
        if (data.submitted.publicToken) writeLeadMemory({ id: data.submitted.id, token: data.submitted.publicToken });
        if (files.length > 0) {
          try {
            const up = await uploadAttachments(data.submitted.id);
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setMessages((m) => [...m, { role: 'notice', text: `✦ ${up.attachmentsStored} attachment${up.attachmentsStored === 1 ? '' : 's'} uploaded to the temporary context space — automatically deleted within 24 hours.` }]);
          } catch (e) {
            setMessages((m) => [...m, { role: 'notice', text: `Attachment upload failed (${e.message}) — the request itself was submitted.` }]);
          }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: 'notice', text: 'Connection hiccup — please try that again.' }]);
    } finally {
      setSending(false);
    }
  }

  function historySnapshot() {
    return messages.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({ role: m.role, content: m.text }));
  }

  // Quick-reply handlers — pure cache layer, no network.
  function pickConsent(label) {
    const yes = label === 'Yes';
    respondUser(label, 'consentGiven', yes);
    setCacheCtx((c) => ({ ...c, consentGiven: yes }));
    setPhase('knowsBetsy');
    respondAssistant(KNOWS_BETSY_QUESTION);
  }

  function pickKnowsBetsy(label) {
    const yes = label === 'Yes';
    respondUser(label, 'knowsBetsy', yes);
    setCacheCtx((c) => ({ ...c, knowsBetsy: yes }));
    if (yes) {
      setPhase('knowsBetsyDetail');
      respondAssistant("Great — what's the connection?");
    } else {
      setPhase('topQuestions');
      respondAssistant(TOP_QUESTIONS_QUESTION);
    }
  }

  function pickFlow(label) {
    respondUser(label, 'interestArea', label);
    setPhase('chatting');
    const context = `[cache-layer context already collected — do not re-ask: consent to capture chat context = ${cacheCtx.consentGiven ? 'yes' : 'no'}; knows Betsy = ${cacheCtx.knowsBetsy ? `yes (${cacheCtx.knowsBetsyDetail || 'connection not specified'})` : 'no'}; visitor's top questions for today: "${cacheCtx.topQuestions}"]`;
    sendToApi(`${label}\n\n${context}`, historySnapshot(), label);
  }

  // Free-text entry point — routes by phase. The opening-script phases
  // (consent/knowsBetsy/flowPick) are quick-reply only and disable the input,
  // so this only ever runs for knowsBetsyDetail, topQuestions, chatting, and
  // the closing-question phase.
  async function handleSend(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || sending) return;
    if (files.length > 0 && !disclaimerAck) {
      setMessages((m) => [...m, { role: 'notice', text: 'Please acknowledge the attachment data disclaimer below before sending.' }]);
      return;
    }
    setInput('');

    if (phase === 'knowsBetsyDetail') {
      respondUser(trimmed, 'knowsBetsyDetail', trimmed);
      setCacheCtx((c) => ({ ...c, knowsBetsyDetail: trimmed }));
      setPhase('topQuestions');
      respondAssistant(TOP_QUESTIONS_QUESTION);
      return;
    }
    if (phase === 'topQuestions') {
      respondUser(trimmed, 'topQuestions', trimmed);
      setCacheCtx((c) => ({ ...c, topQuestions: trimmed }));
      setPhase('flowPick');
      respondAssistant(FLOW_PICK_INTRO);
      return;
    }
    if (phase === 'awaitingClosing') {
      respondUser(trimmed, 'closingResponse', trimmed);
      const noMore = /^(no|nope|nothing|all good|that'?s all|none|i'?m good)\b/i.test(trimmed);
      if (!noMore) {
        if (submitted?.id) {
          fetch(`/api/portfolio-requests/${submitted.id}/notes`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ note: trimmed }),
          }).catch(() => {});
        }
        respondAssistant("Got it — I'll flag that for Betsy so she has the context.");
      }
      respondAssistant('Thanks for chatting — you can always reach Betsy directly at betsysalter@saltbasin.net.');
      setPhase('chatting');
      return;
    }
    if (phase === 'returningWelcome') {
      const history = historySnapshot();
      respondUser(trimmed, 'returnVisitNeed', trimmed);
      setPhase('chatting');
      await sendToApi(`${trimmed}\n\n[returning actor: before addressing the request, ask for missing name/contact information, marketing consent, and explain contact privacy; has email=${actorContext?.hasEmail ? 'yes' : 'no'}; has name=${actorContext?.hasName ? 'yes' : 'no'}]`, history, trimmed);
      return;
    }

    // phase === 'chatting': cache-layer safe-answer bank first, then the API layer.
    const history = historySnapshot();
    respondUser(trimmed, phase === 'returningWelcome' ? 'returnVisitNeed' : 'conversation', trimmed);
    const safe = matchSafeAnswer(trimmed);
    if (safe) {
      respondAssistant(safe.reply);
      return;
    }
    await sendToApi(trimmed, history, trimmed);
  }

  function handleMinimizeClick() {
    const hasRealConversation = phase === 'chatting' && messages.some((m) => m.role === 'user');
    if (!closingAsked && hasRealConversation) {
      setClosingAsked(true);
      setPhase('awaitingClosing');
      respondAssistant(CLOSING_QUESTION);
      return;
    }
    setOpen(false);
  }

  const inputEnabled = phase === 'knowsBetsyDetail' || phase === 'topQuestions' || phase === 'chatting' || phase === 'awaitingClosing' || phase === 'returningWelcome';
  const placeholder = phase === 'knowsBetsyDetail' ? 'e.g. former colleague, referral, LinkedIn…'
    : phase === 'topQuestions' ? 'Type your top questions (1-5)…'
    : !inputEnabled ? 'Please choose an option above'
    : phase === 'returningWelcome' ? 'What can I help you with this visit?'
    : submitted ? 'Anything else I can pass along?' : 'Type a reply… (paste a job description right in)';

  return (
    <div className="sb-request-flow">
      <style>{`
        @media print { .sb-request-flow { display: none !important; } }
        @keyframes sb-besty-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>

      {/* Reopen pill when the chat is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="sbh-chat-launcher"
          aria-label="Open BestyStaff intake"
        >
          <SaltBasinCrystal variant="signature" size="launcher" interactive pulseActive={sending} />
          <span>BestyStaff Intake</span>
        </button>
      )}

      {open && (
        <div
          role="dialog" aria-label="BestyStaff chat"
          style={{
            position: 'fixed', right: '1.25rem', bottom: '1.25rem', zIndex: 1200,
            width: 'min(400px, calc(100vw - 2rem))', height: 'min(620px, calc(100vh - 4rem))',
            background: 'white', borderRadius: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `3px solid ${C.gold}`,
          }}
        >
          {/* Header */}
          <div style={{ background: C.navy, color: C.cream, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.gold, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Georgia, serif' }}>BestyStaff</div>
              <div style={{ fontSize: '0.56rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, fontFamily: 'sans-serif' }}>
                Betsy's AI Proxy · Salt Basin Net Works
              </div>
            </div>
            <button onClick={handleMinimizeClick} aria-label="Minimize chat" style={{ border: 'none', background: 'none', color: 'rgba(247,242,232,0.8)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.2rem' }}>—</button>
          </div>

          {/* Offline fallback: static intake forms inside the panel */}
          {offline ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem' }}>
              {fallbackView === 'prompt' && (
                <div>
                  <p style={{ ...S.p, marginTop: '0.25rem' }}>
                    BestyStaff is offline right now — but both intakes still work as quick forms.
                  </p>
                  <h2 style={{ ...S.h2, fontSize: '1.05rem' }}>Want to request Betsy's Career Portfolio?</h2>
                  <button style={{ ...S.btnGold, marginBottom: '1.2rem' }} onClick={() => setFallbackView('request_betsy')}>✦ Request the Tailored Portfolio</button>
                  <h2 style={{ ...S.h2, fontSize: '1.05rem' }}>Want to build a Career Portfolio and Salt Basin Profile for yourself?</h2>
                  <button style={S.btnOutline} onClick={() => setFallbackView('build_own')}>Build my own →</button>
                </div>
              )}
              {fallbackView === 'request_betsy' && <RequestBetsyForm sourceOutput={sourceOutput} master={master} onDone={(r) => { if (r.publicToken) writeLeadMemory({ id: r.id, token: r.publicToken }); setFallbackResult(r); setFallbackKind('request_betsy'); setFallbackView('done'); }} />}
              {fallbackView === 'build_own' && <BuildOwnForm sourceOutput={sourceOutput} onDone={(r) => { if (r.publicToken) writeLeadMemory({ id: r.id, token: r.publicToken }); setFallbackResult(r); setFallbackKind('build_own'); setFallbackView('done'); }} />}
              {fallbackView === 'done' && <SuccessView result={fallbackResult} kind={fallbackKind} onClose={() => setOpen(false)} />}
              {(fallbackView === 'request_betsy' || fallbackView === 'build_own') && (
                <button onClick={() => setFallbackView('prompt')} style={{ border: 'none', background: 'none', color: C.fog, fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.75rem', fontFamily: 'sans-serif' }}>← Back</button>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', background: '#fbfaf7' }}>
                {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}

                {!sending && phase === 'consent' && <QuickReplies options={['Yes', 'No']} onPick={pickConsent} />}
                {!sending && phase === 'knowsBetsy' && <QuickReplies options={['Yes', 'No']} onPick={pickKnowsBetsy} />}
                {!sending && phase === 'flowPick' && (
                  <QuickReplies options={intakeConfig?.flowOptions || FLOW_QUICK_REPLIES} onPick={pickFlow} />
                )}

                {sending && (
                  <div style={{ display: 'flex', gap: 4, padding: '0.4rem 0.6rem' }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, animation: `sb-besty-pulse 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Attached files strip + disclaimer */}
              {files.length > 0 && (
                <div style={{ padding: '0.5rem 0.9rem', background: C.mist, borderTop: '0.5px solid rgba(23,42,69,0.1)', flexShrink: 0 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: C.slate, fontFamily: 'sans-serif', padding: '0.1rem 0' }}>
                      <span>📎 {f.name} · {(f.size / 1024 / 1024).toFixed(1)}MB</span>
                      <span style={{ cursor: 'pointer', color: '#a33' }} onClick={() => {
                        const next = files.filter((_, j) => j !== i);
                        setFiles(next);
                        if (next.length === 0 && fileInputRef.current) fileInputRef.current.value = '';
                      }}>remove</span>
                    </div>
                  ))}
                  <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', marginTop: '0.35rem', fontSize: '0.64rem', color: C.slate, lineHeight: 1.5, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    <input type="checkbox" checked={disclaimerAck} onChange={(e) => setDisclaimerAck(e.target.checked)} style={{ accentColor: C.gold, marginTop: 1 }} />
                    <span>{DISCLAIMER_TEXT}</span>
                  </label>
                </div>
              )}

              {/* Input row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', padding: '0.6rem 0.7rem', borderTop: '0.5px solid rgba(23,42,69,0.12)', flexShrink: 0, background: 'white' }}>
                <label aria-label="Attach sample documents" title="Attach sample documents (auto-deleted after 24 hours)" style={{ cursor: 'pointer', fontSize: '1.05rem', padding: '0.35rem 0.3rem', color: C.slate }}>
                  📎
                  <input
                    ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.rtf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
                  />
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
                  }}
                  disabled={!inputEnabled}
                  placeholder={placeholder}
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', border: '0.5px solid rgba(23,42,69,0.2)', borderRadius: 10,
                    padding: '0.5rem 0.7rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
                    maxHeight: 110, overflowY: 'auto', opacity: inputEnabled ? 1 : 0.55,
                  }}
                />
                <button
                  onClick={() => handleSend(input)} disabled={sending || !input.trim() || !inputEnabled}
                  style={{ ...S.btnGold, padding: '0.5rem 0.9rem', opacity: sending || !input.trim() || !inputEnabled ? 0.5 : 1 }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
