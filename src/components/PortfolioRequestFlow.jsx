// Portfolio request lead funnel — rendered under the public teaser views of
// the Career Master Database, Case Study Portfolio, and Strategic Operator
// outputs.
//
// Flow: teaser renders → after a short beat a popup prompts
//   1. "Want to request Betsy's Career Portfolio?"  → tailored-portfolio
//      request intake (knows-Betsy, open-role JD, coverage modules, contact)
//   2. "Want to build a Career Portfolio and Salt Basin Profile for
//      yourself?" → build-your-own intake (role type, stage, goal, showcase)
// Both forms accept sample-document attachments behind a data disclaimer;
// attachments live in a temporary context space auto-deleted after 24 hours
// (server/routes/portfolioRequests.js).

import React, { useEffect, useMemo, useRef, useState } from 'react';

const C = {
  navy: '#172A45',
  gold: '#C4843A',
  cream: '#F7F2E8',
  mist: '#EEF2F6',
  slate: '#536173',
  fog: '#6D7785',
};

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.55)', zIndex: 1200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem',
  },
  modal: {
    background: 'white', borderRadius: 12, borderTop: `3px solid ${C.gold}`, width: 620, maxWidth: '100%',
    maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
    fontFamily: 'Georgia, serif', color: C.navy, position: 'relative',
  },
  eyebrow: { fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.4rem' },
  h2: { fontSize: '1.35rem', margin: '0 0 0.5rem', lineHeight: 1.25 },
  p: { fontSize: '0.85rem', color: C.slate, lineHeight: 1.65, margin: '0 0 1rem' },
  label: { display: 'block', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.slate, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.3rem' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(23,42,69,0.25)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', minHeight: 90, padding: '0.6rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(23,42,69,0.25)', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  field: { marginBottom: '0.9rem' },
  btnGold: { padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gold, color: 'white', fontSize: '0.78rem', fontFamily: 'sans-serif', letterSpacing: '0.06em', fontWeight: 700 },
  btnNavy: { padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.navy, color: 'white', fontSize: '0.78rem', fontFamily: 'sans-serif', letterSpacing: '0.06em', fontWeight: 700 },
  btnOutline: { padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.navy, border: `1px solid rgba(23,42,69,0.3)`, fontSize: '0.78rem', fontFamily: 'sans-serif', letterSpacing: '0.06em' },
  chip: (on) => ({
    padding: '0.3rem 0.7rem', borderRadius: 14, cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'sans-serif',
    border: `1px solid ${on ? C.gold : 'rgba(23,42,69,0.25)'}`, background: on ? 'rgba(196,132,58,0.12)' : 'white',
    color: on ? C.navy : C.slate, fontWeight: on ? 700 : 400, userSelect: 'none',
  }),
  radioRow: { display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.82rem' },
};

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

// Sample-document attachments + the data disclaimer. Files upload with the
// form submit and land in the temporary attachment context space —
// hard-deleted 24 hours after upload, server-enforced.
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
            <span>
              <strong style={{ color: C.navy }}>Data disclaimer:</strong> attachments are stored in a private, temporary
              context space and are <strong style={{ color: C.navy }}>automatically deleted 24 hours after upload</strong>.
              They're used only to tailor the requested portfolio. Don't upload anything you wouldn't share in a
              LinkedIn DM — see the <a href="/data-notice" target="_blank" rel="noreferrer" style={{ color: C.gold }}>data notice</a>.
            </span>
          </label>
        </>
      )}
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

// ── Form 1: request Betsy's tailored portfolio ─────────────────────────────
function RequestBetsyForm({ sourceOutput, master, onDone }) {
  const [form, setForm] = useState({ knowsBetsy: '', knowsBetsyDetail: '', comparingToRole: '', jobDescription: '', coverageNotes: '', contactName: '', contactEmail: '', contactCompany: '', contactTitle: '', contactPhone: '' });
  const [coverage, setCoverage] = useState([]);
  const [files, setFiles] = useState([]);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (o) => setCoverage((c) => (c.includes(o) ? c.filter((x) => x !== o) : [...c, o]));

  // Coverage module options rolled up live from the public Career Master
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

// ── Form 2: build your own portfolio + Salt Basin profile ──────────────────
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
      <p style={S.p}>Answer a few questions and we'll recommend the tailored portfolio format best suited to you — resume-led, case-study-led, or investor-profile-led.</p>

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

// ── The prompt popup + floating reopen pill ────────────────────────────────
export default function PortfolioRequestPrompt({ sourceOutput, master }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('prompt'); // prompt | request_betsy | build_own | done
  const [result, setResult] = useState(null);
  const [doneKind, setDoneKind] = useState(null);

  // Let the teaser land first, then prompt.
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 2200);
    return () => clearTimeout(t);
  }, []);

  const close = () => { setOpen(false); if (view === 'done') setView('prompt'); };
  const finish = (kind) => (res) => { setResult(res); setDoneKind(kind); setView('done'); };

  return (
    <div className="sb-request-flow">
      <style>{`@media print { .sb-request-flow { display: none !important; } }`}</style>

      {/* Floating reopen pill once dismissed */}
      {!open && (
        <button
          onClick={() => { setView('prompt'); setOpen(true); }}
          style={{
            position: 'fixed', right: '1.25rem', bottom: '1.25rem', zIndex: 1100,
            ...S.btnGold, borderRadius: 22, boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
          }}
        >
          ✦ Request Portfolio
        </button>
      )}

      {open && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div style={S.modal} role="dialog" aria-modal="true">
            <button onClick={close} aria-label="Close" style={{ position: 'absolute', top: 12, right: 14, border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', color: C.fog }}>✕</button>

            {view === 'prompt' && (
              <div>
                <div style={S.eyebrow}>Salt Basin Net Works</div>
                <h2 style={S.h2}>Want to request Betsy's Career Portfolio?</h2>
                <p style={S.p}>
                  You're looking at a preview. The full portfolio — career database, case studies, and the Strategic
                  Operator profile — can be tailored to your open role or use case and sent directly to you.
                </p>
                <button style={S.btnGold} onClick={() => setView('request_betsy')}>✦ Request the Tailored Portfolio</button>

                <hr style={{ border: 'none', borderTop: `0.5px solid rgba(23,42,69,0.15)`, margin: '1.4rem 0' }} />

                <h3 style={{ ...S.h2, fontSize: '1.05rem' }}>Want to build a Career Portfolio and Salt Basin Profile for yourself?</h3>
                <p style={{ ...S.p, marginBottom: '0.75rem' }}>
                  Answer a short intake and get a recommendation for the portfolio format best suited to your role type and goals.
                </p>
                <button style={S.btnOutline} onClick={() => setView('build_own')}>Build my own →</button>
              </div>
            )}

            {view === 'request_betsy' && <RequestBetsyForm sourceOutput={sourceOutput} master={master} onDone={finish('request_betsy')} />}
            {view === 'build_own' && <BuildOwnForm sourceOutput={sourceOutput} onDone={finish('build_own')} />}
            {view === 'done' && <SuccessView result={result} kind={doneKind} onClose={close} />}

            {(view === 'request_betsy' || view === 'build_own') && (
              <button onClick={() => setView('prompt')} style={{ ...S.btnOutline, marginTop: '0.9rem', border: 'none', padding: '0.3rem 0', color: C.fog, background: 'none' }}>← Back</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
