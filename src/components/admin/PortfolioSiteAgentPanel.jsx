// Portfolio-First Site Agent (2026-10-01) — Website Intelligence view.
//
// A five-step, human-in-the-loop agent that turns the public homepage into a
// portfolio-first career foundation profile read from Career Master:
//   1 Review     — what the current homepage leads with, and how much of it
//                  reads Career Master (each metric answers one question).
//   2 Foundation — what Career Master can actually support right now.
//   3 Narrative  — edit the copy; optionally let Claude draft it from
//                  Career Master (claims it can't trace are rejected).
//   4 Compose    — choose sections, which pages stay in the nav, theme.
//   5 Preview    — the real blocks rendered with the proposed config, a
//                  diff, then "Stage as draft". Publishing stays a separate,
//                  explicit click (the shell's existing publish()).
// Server: server/routes/portfolioSiteAgent.js.
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';
import { RenderSection } from '../blocks/index.jsx';

const STEPS = [
  { id: 'review', label: 'Review' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'narrative', label: 'Narrative' },
  { id: 'compose', label: 'Compose' },
  { id: 'preview', label: 'Preview & stage' },
];

const LEAD_COPY = {
  person: 'You, the person',
  product: 'A product pitch',
  other: 'Something other than you or a product',
  empty: 'Nothing (no live sections)',
};

const ui = {
  wrap: { height: '100%', overflow: 'auto', background: 'var(--sb-admin-bg)', color: 'var(--sb-admin-text)' },
  inner: { maxWidth: 1080, margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' },
  eyebrow: { fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-admin-gold-warm)', margin: 0 },
  h1: { fontFamily: 'var(--sb-font-display)', fontWeight: 400, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', margin: '0.25rem 0 0.5rem' },
  soft: { color: 'var(--sb-admin-text-soft)', lineHeight: 1.55 },
  stepper: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '1.25rem 0 1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' },
  stat: { ...styles.card, marginBottom: 0 },
  statValue: { fontFamily: 'var(--sb-font-display)', fontSize: '2rem', lineHeight: 1, color: 'var(--sb-admin-text)', fontVariantNumeric: 'tabular-nums' },
  chip: (tone) => ({
    display: 'inline-block', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999,
    background: tone === 'ok' ? 'var(--sb-admin-teal-tint)' : tone === 'warn' ? 'var(--sb-admin-gold-tint)' : 'var(--sb-admin-surface)',
    color: tone === 'ok' ? 'var(--sb-admin-teal-deep)' : tone === 'warn' ? 'var(--sb-admin-gold-warm)' : 'var(--sb-admin-text-soft)',
  }),
  row: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' },
  input: { width: '100%', boxSizing: 'border-box' },
  footer: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' },
};

function StepButton({ step, index, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
      style={{
        minHeight: 40, padding: '0.45rem 0.9rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem',
        border: `1px solid ${active ? 'var(--sb-admin-gold)' : 'var(--sb-admin-border-strong)'}`,
        background: active ? 'var(--sb-admin-gold-tint)' : 'transparent', color: 'var(--sb-admin-text)',
      }}
    >
      {index + 1} · {step.label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ ...styles.fieldGroup, display: 'block' }}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, multiline, rows = 3, placeholder }) {
  return multiline
    ? <textarea className="sb-input" rows={rows} style={ui.input} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    : <input className="sb-input" style={ui.input} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export default function PortfolioSiteAgentPanel({ hasUnsavedEdits = false, onDraftStaged, onOpenEditor, onPublish }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('review');
  const [narrative, setNarrative] = useState(null);
  const [proofStatus, setProofStatus] = useState([]);
  const [enabled, setEnabled] = useState([]);
  const [navKeep, setNavKeep] = useState([]);
  const [theme, setTheme] = useState('');
  const [brief, setBrief] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [agentDraft, setAgentDraft] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [staging, setStaging] = useState(false);
  const [staged, setStaged] = useState(null);

  useEffect(() => {
    api.getSiteAgentState()
      .then((s) => {
        setState(s);
        setNarrative(s.narrative);
        setProofStatus(s.proofs);
        setEnabled(s.enabledSectionIds);
        setNavKeep(s.navKeepPageKeys);
      })
      .catch((e) => setError(e.message));
  }, []);

  const otherNavPages = useMemo(
    () => (state?.review?.navPages || []).filter((p) => p.key !== state?.review?.homeKey),
    [state]
  );

  // Any edit invalidates the composed preview and the "staged" confirmation.
  function touch() { setPreview(null); setStaged(null); }

  function patchNarrative(path, value) {
    setNarrative((n) => {
      const next = JSON.parse(JSON.stringify(n));
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
    touch();
  }

  async function verifyProofs(proofs = narrative.proofs) {
    try {
      const r = await api.verifySiteAgentProofs(proofs);
      setProofStatus(r.proofs);
    } catch (e) { toast('Could not verify proofs: ' + e.message); }
  }

  async function runDraft() {
    setDrafting(true);
    setAgentDraft(null);
    try {
      setAgentDraft(await api.draftSiteAgentNarrative({ narrative, brief }));
    } catch (e) {
      toast(e.message);
    } finally {
      setDrafting(false);
    }
  }

  function applyAgentDraft() {
    const next = JSON.parse(JSON.stringify(narrative));
    next.hero.heading = agentDraft.hero.heading || next.hero.heading;
    next.hero.lede = agentDraft.hero.lede || next.hero.lede;
    if (agentDraft.proofs.length) {
      next.proofs = agentDraft.proofs.map(({ value, label, context, evidenceEmployer, evidenceTerms }) => ({ value, label, context, evidenceEmployer, evidenceTerms }));
    }
    setNarrative(next);
    setAgentDraft(null);
    touch();
    verifyProofs(next.proofs);
    toast('Agent draft applied. Review it before staging.');
  }

  function inputs() {
    return { narrative, enabledSectionIds: enabled, navKeepPageKeys: navKeep, theme: theme || null };
  }

  async function runPreview() {
    setPreviewing(true);
    try {
      setPreview(await api.previewSiteAgent(inputs()));
    } catch (e) {
      toast('Preview failed: ' + e.message);
    } finally {
      setPreviewing(false);
    }
  }

  async function stage() {
    if (hasUnsavedEdits && !confirm('You have unsaved edits in the content editor. Staging replaces the server draft, and those edits will be discarded. Continue?')) return;
    setStaging(true);
    try {
      const r = await api.stageSiteAgent(inputs());
      setStaged(r);
      toast('Staged as draft. Nothing is public until you publish.');
      // The draft is already saved; a failed editor refresh must not read as
      // a failed stage.
      await Promise.resolve(onDraftStaged?.()).catch(() => toast('Staged. Reload the page before editing in the content editor.'));
    } catch (e) {
      toast('Stage failed: ' + e.message);
    } finally {
      setStaging(false);
    }
  }

  if (error) return <div style={ui.wrap}><div style={ui.inner}><div style={{ ...styles.card, borderColor: 'var(--sb-admin-danger)' }}>Could not load the site agent: {error}</div></div></div>;
  if (!state || !narrative) return <div style={ui.wrap}><div style={ui.inner}><p style={ui.soft}>Reading your site and Career Master…</p></div></div>;

  const { review, foundation, catalog } = state;
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const next = STEPS[stepIndex + 1];
  const prev = STEPS[stepIndex - 1];

  return (
    <div style={ui.wrap}>
      <div style={ui.inner}>
        <p style={ui.eyebrow}>Website Intelligence · Agent</p>
        <h1 style={ui.h1}>Portfolio-First Site Agent</h1>
        <p style={{ ...ui.soft, maxWidth: 720, margin: 0 }}>
          Rebuilds your homepage around you and your Career Master. It stages a draft only. Your current homepage is archived, not deleted, and nothing goes public until you publish.
        </p>
        {state.lastStagedAt && <p style={{ ...ui.soft, fontSize: '0.8rem', marginTop: '0.5rem' }}>Last staged {new Date(state.lastStagedAt).toLocaleString()}.</p>}

        <nav aria-label="Agent steps" style={ui.stepper}>
          {STEPS.map((s, i) => <StepButton key={s.id} step={s} index={i} active={s.id === step} onClick={() => setStep(s.id)} />)}
        </nav>

        {step === 'review' && (
          <section>
            <div style={ui.grid}>
              <div style={ui.stat} title={review.questions.leadKind}>
                <div style={styles.fieldLabel}>Homepage leads with</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{LEAD_COPY[review.leadKind]}</div>
              </div>
              <div style={ui.stat} title={review.questions.careerShare}>
                <div style={styles.fieldLabel}>Sections reading Career Master</div>
                <div style={ui.statValue}>{review.careerShare.careerDriven}<span style={{ fontSize: '1rem', color: 'var(--sb-admin-text-soft)' }}> of {review.careerShare.live}</span></div>
              </div>
              <div style={ui.stat} title={review.questions.proofBeforeProduct}>
                <div style={styles.fieldLabel}>Proof before product pitch</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{review.proofBeforeProduct == null ? 'No product pitch' : review.proofBeforeProduct ? 'Yes' : 'No'}</div>
              </div>
              <div style={ui.stat} title={review.questions.navPages}>
                <div style={styles.fieldLabel}>Pages in navigation</div>
                <div style={ui.statValue}>{review.navPages.length}</div>
              </div>
            </div>

            <div style={{ ...styles.card, marginTop: '1rem' }}>
              <div style={styles.cardTitle}>Findings</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.6 }}>
                {review.findings.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Current homepage, top to bottom</div>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.35rem' }}>
                {review.homeSections.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span> <span style={{ ...ui.soft, fontSize: '0.8rem' }}>({s.type})</span>{' '}
                    {s.careerDriven && <span style={ui.chip('ok')}>Reads Career Master</span>}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {step === 'foundation' && (
          <section>
            <div style={ui.grid}>
              {[
                ['Years', foundation.yearsSpan ?? '—', foundation.firstYear ? `since ${foundation.firstYear}` : ''],
                ['Employers', foundation.counts.employers],
                ['Roles', foundation.counts.jobs],
                ['Published case studies', foundation.counts.engagements],
                ['Skills', foundation.counts.skills],
                ['Industries', foundation.counts.industries],
              ].map(([label, value, sub]) => (
                <div key={label} style={ui.stat}>
                  <div style={styles.fieldLabel}>{label}</div>
                  <div style={ui.statValue}>{value}</div>
                  {sub && <div style={{ ...ui.soft, fontSize: '0.75rem' }}>{sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ ...styles.card, marginTop: '1rem' }}>
              <div style={styles.cardTitle}>Employers on file</div>
              <div style={ui.row}>{foundation.employers.map((e) => <span key={e} style={ui.chip()}>{e}</span>)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>What the new homepage will read</div>
              {foundation.gaps.length === 0
                ? <p style={{ margin: 0 }}>Your Career Master can support every Career-Master section. The timeline, case studies, and capabilities update on their own whenever you edit Career Master.</p>
                : <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.6 }}>{foundation.gaps.map((g) => <li key={g}>{g}</li>)}</ul>}
            </div>
          </section>
        )}

        {step === 'narrative' && (
          <section>
            <p style={{ ...ui.soft, fontSize: '0.82rem', marginTop: 0 }}>Starting from: {state.narrativeSource.label}</p>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Draft with the agent</div>
              <p style={{ ...ui.soft, marginTop: 0 }}>
                Claude reads your Career Master and proposes a hero and proof claims. Any claim whose figure isn't in a Career Master record is rejected, and you'll see why.
              </p>
              <Field label="Brief (optional)">
                <TextInput multiline rows={2} value={brief} onChange={setBrief} placeholder="e.g. Emphasize private equity value creation and revenue data trust." />
              </Field>
              <button type="button" className="sb-btn sb-btn-gold" disabled={drafting} onClick={runDraft}>{drafting ? 'Drafting…' : 'Draft with agent'}</button>
              {agentDraft && (
                <div style={{ marginTop: '1rem', borderTop: '0.5px solid var(--sb-admin-border)', paddingTop: '1rem' }}>
                  <div style={styles.fieldLabel}>Proposed hero</div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{agentDraft.hero.heading}</p>
                  <p style={{ ...ui.soft, marginTop: 0 }}>{agentDraft.hero.lede}</p>
                  <div style={styles.fieldLabel}>Accepted proofs ({agentDraft.proofs.length})</div>
                  <ul style={{ marginTop: 0 }}>{agentDraft.proofs.map((p, i) => <li key={i}><strong>{p.value}</strong> {p.label} <span style={ui.chip('ok')}>{p.evidenceCount} record{p.evidenceCount === 1 ? '' : 's'}</span></li>)}</ul>
                  {agentDraft.rejected.length > 0 && <>
                    <div style={styles.fieldLabel}>Rejected ({agentDraft.rejected.length})</div>
                    <ul style={{ marginTop: 0 }}>{agentDraft.rejected.map((p, i) => <li key={i}><strong>{p.value}</strong> {p.label}: <span style={ui.soft}>{p.reason}</span></li>)}</ul>
                  </>}
                  {agentDraft.rationale && <p style={{ ...ui.soft, fontSize: '0.82rem' }}>{agentDraft.rationale}</p>}
                  <div style={ui.row}>
                    <button type="button" className="sb-btn sb-btn-gold" onClick={applyAgentDraft}>Use this draft</button>
                    <button type="button" className="sb-btn sb-btn-outline" onClick={() => setAgentDraft(null)}>Discard</button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Hero</div>
              <Field label="Eyebrow"><TextInput value={narrative.hero.eyebrow} onChange={(v) => patchNarrative(['hero', 'eyebrow'], v)} /></Field>
              <Field label="Headline"><TextInput multiline rows={2} value={narrative.hero.heading} onChange={(v) => patchNarrative(['hero', 'heading'], v)} /></Field>
              <Field label="Lede"><TextInput multiline rows={3} value={narrative.hero.lede} onChange={(v) => patchNarrative(['hero', 'lede'], v)} /></Field>
            </div>

            <div style={styles.card}>
              <div style={{ ...styles.cardTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span>Proof ledger</span>
                <button type="button" className="sb-btn sb-btn-outline" style={{ padding: '0.35rem 0.8rem' }} onClick={() => verifyProofs()}>Check against Career Master</button>
              </div>
              {narrative.proofs.map((p, i) => {
                const status = proofStatus[i];
                const statusMatches = status && status.value === p.value && status.evidenceEmployer === p.evidenceEmployer;
                return (
                  <div key={i} style={{ borderBottom: '0.5px solid var(--sb-admin-border)', padding: '0.75rem 0' }}>
                    <div style={{ ...ui.row, justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={styles.fieldLabel}>Proof {i + 1}</span>
                      <span style={ui.row}>
                        {statusMatches
                          ? <span style={ui.chip(status.verified ? 'ok' : 'warn')}>{status.verified ? `${status.evidenceCount} Career Master record${status.evidenceCount === 1 ? '' : 's'}` : 'Not linked to a record'}</span>
                          : <span style={ui.chip()}>Unchecked</span>}
                        <button type="button" className="sb-btn sb-btn-outline" style={{ padding: '0.25rem 0.6rem' }} aria-label={`Remove proof ${i + 1}`}
                          onClick={() => { patchNarrative(['proofs'], narrative.proofs.filter((_, j) => j !== i)); setProofStatus((s) => s.filter((_, j) => j !== i)); }}>Remove</button>
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0 0.75rem' }}>
                      <Field label="Figure"><TextInput value={p.value} onChange={(v) => patchNarrative(['proofs', i, 'value'], v)} /></Field>
                      <Field label="Label"><TextInput value={p.label} onChange={(v) => patchNarrative(['proofs', i, 'label'], v)} /></Field>
                      <Field label="Evidence employer"><TextInput value={p.evidenceEmployer} onChange={(v) => patchNarrative(['proofs', i, 'evidenceEmployer'], v)} /></Field>
                      <Field label="Evidence terms (comma-separated)">
                        <TextInput value={(p.evidenceTerms || []).join(', ')} onChange={(v) => patchNarrative(['proofs', i, 'evidenceTerms'], v.split(',').map((t) => t.trim()).filter(Boolean))} />
                      </Field>
                    </div>
                    <Field label="Context and scope"><TextInput multiline rows={2} value={p.context} onChange={(v) => patchNarrative(['proofs', i, 'context'], v)} /></Field>
                  </div>
                );
              })}
              <button type="button" className="sb-btn sb-btn-outline" style={{ marginTop: '0.75rem' }}
                onClick={() => patchNarrative(['proofs'], [...narrative.proofs, { value: '', label: '', context: '', evidenceEmployer: '', evidenceTerms: [] }])}>Add proof</button>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Owner-first builds</div>
              {narrative.builds.products.map((p, i) => (
                <div key={p.id || i} style={{ borderBottom: '0.5px solid var(--sb-admin-border)', padding: '0.5rem 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0 0.75rem' }}>
                    <Field label="Product"><TextInput value={p.tagline} onChange={(v) => patchNarrative(['builds', 'products', i, 'tagline'], v)} /></Field>
                    <Field label="Title"><TextInput value={p.name} onChange={(v) => patchNarrative(['builds', 'products', i, 'name'], v)} /></Field>
                    <Field label="Build status"><TextInput value={p.status} onChange={(v) => patchNarrative(['builds', 'products', i, 'status'], v)} /></Field>
                  </div>
                  <Field label="Description"><TextInput multiline rows={2} value={p.desc} onChange={(v) => patchNarrative(['builds', 'products', i, 'desc'], v)} /></Field>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>How I operate</div>
              {narrative.lenses.tabs.map((t, i) => (
                <div key={i} style={{ borderBottom: '0.5px solid var(--sb-admin-border)', padding: '0.5rem 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0 0.75rem' }}>
                    <Field label="Tab"><TextInput value={t.tabLabel} onChange={(v) => patchNarrative(['lenses', 'tabs', i, 'tabLabel'], v)} /></Field>
                    <Field label="Title"><TextInput value={t.title} onChange={(v) => patchNarrative(['lenses', 'tabs', i, 'title'], v)} /></Field>
                  </div>
                  <Field label="Copy"><TextInput multiline rows={4} value={t.copy} onChange={(v) => patchNarrative(['lenses', 'tabs', i, 'copy'], v)} /></Field>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 'compose' && (
          <section>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Homepage sections, in order</div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {catalog.map((b) => (
                  <label key={b.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', opacity: b.supported ? 1 : 0.55, cursor: b.supported ? 'pointer' : 'not-allowed', minHeight: 44 }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 4 }}
                      disabled={!b.supported}
                      checked={b.supported && enabled.includes(b.id)}
                      onChange={(e) => { setEnabled((cur) => (e.target.checked ? [...cur, b.id] : cur.filter((id) => id !== b.id))); touch(); }}
                    />
                    <span>
                      <strong>{b.name}</strong> {b.readsCareerMaster && <span style={ui.chip('ok')}>Reads Career Master</span>}
                      <span style={{ ...ui.soft, display: 'block', fontSize: '0.84rem' }}>{b.supported ? b.purpose : b.unsupportedReason}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Other pages in the navigation</div>
              <p style={{ ...ui.soft, marginTop: 0 }}>Unchecked pages are hidden from the menu but stay online at their address. Nothing is deleted.</p>
              {otherNavPages.length === 0 ? <p style={{ margin: 0 }}>No other pages are in the navigation.</p> : (
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  {otherNavPages.map((p) => (
                    <label key={p.key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minHeight: 40, cursor: 'pointer' }}>
                      <input type="checkbox" checked={navKeep.includes(p.key)} onChange={(e) => { setNavKeep((cur) => (e.target.checked ? [...cur, p.key] : cur.filter((k) => k !== p.key))); touch(); }} />
                      <span>{p.name} <span style={{ ...ui.soft, fontSize: '0.8rem' }}>/{p.slug}</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Site theme</div>
              <Field label={`Currently: ${state.currentTheme}`}>
                <select className="sb-input" style={ui.input} value={theme} onChange={(e) => { setTheme(e.target.value); touch(); }}>
                  <option value="">Keep current theme</option>
                  {state.themes.map((t) => <option key={t} value={t}>{t}{t === 'prospect' ? ' (light cream, portfolio)' : ''}</option>)}
                </select>
              </Field>
            </div>
          </section>
        )}

        {step === 'preview' && (
          <section>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Proposed change</div>
              {!preview ? (
                <button type="button" className="sb-btn sb-btn-gold" disabled={previewing} onClick={runPreview}>{previewing ? 'Composing…' : 'Compose preview'}</button>
              ) : (
                <div style={{ display: 'grid', gap: '0.6rem', lineHeight: 1.55 }}>
                  <div><strong>New homepage:</strong> {preview.home.sections.length} sections ({preview.home.sections.map((s) => s.name).join(' → ')}).</div>
                  <div><strong>Current homepage:</strong> {preview.diff.sectionsReplaced.length} live sections {preview.diff.archivedPage ? <>preserved as a hidden draft page at <code>/{preview.diff.archivedPage.slug}</code>.</> : 'replaced (it was already composed by this agent, so it is not archived again).'}</div>
                  <div><strong>Hidden from navigation:</strong> {preview.diff.pagesHiddenFromNav.length ? preview.diff.pagesHiddenFromNav.map((p) => p.name).join(', ') : 'none'}.</div>
                  <div><strong>Kept in navigation:</strong> {preview.diff.pagesKeptInNav.length ? preview.diff.pagesKeptInNav.map((p) => p.name).join(', ') : 'none'}.</div>
                  {preview.theme && <div><strong>Theme:</strong> {state.currentTheme} → {preview.theme}.</div>}
                  <div style={{ ...ui.row, marginTop: '0.5rem' }}>
                    {!staged && <button type="button" className="sb-btn sb-btn-gold" disabled={staging} onClick={stage}>{staging ? 'Staging…' : 'Stage as draft'}</button>}
                    <button type="button" className="sb-btn sb-btn-outline" onClick={runPreview} disabled={previewing}>Recompose</button>
                  </div>
                  {staged && (
                    <div style={{ marginTop: '0.5rem', padding: '0.9rem 1rem', background: 'var(--sb-admin-teal-tint)', borderRadius: 4 }}>
                      <strong>Staged as your draft.</strong> Your public site hasn't changed. Review it in the editor, then publish.
                      <div style={{ ...ui.row, marginTop: '0.75rem' }}>
                        {onOpenEditor && <button type="button" className="sb-btn sb-btn-outline" onClick={onOpenEditor}>Open in editor</button>}
                        {onPublish && <button type="button" className="sb-btn sb-btn-gold" onClick={onPublish}>Publish…</button>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {preview && (
              <div style={{ border: '0.5px solid var(--sb-admin-border-strong)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ ...styles.fieldLabel, margin: 0, padding: '0.6rem 1rem', background: 'var(--sb-admin-surface)' }}>Live preview, rendered with your real blocks and Career Master</div>
                <div className="sb-public-site-root" data-theme={preview.theme || state.currentTheme} style={{ background: 'var(--sb-ivory)' }}>
                  <Suspense fallback={<p style={{ padding: '2rem' }}>Loading blocks…</p>}>
                    {preview.home.sections.map((s) => <RenderSection key={s.id} section={s} config={{}} mode="public" />)}
                  </Suspense>
                </div>
              </div>
            )}
          </section>
        )}

        <div style={ui.footer}>
          {prev ? <button type="button" className="sb-btn sb-btn-outline" onClick={() => setStep(prev.id)}>← {prev.label}</button> : <span />}
          {next && <button type="button" className="sb-btn sb-btn-gold" onClick={() => setStep(next.id)}>{next.label} →</button>}
        </div>
      </div>
    </div>
  );
}
