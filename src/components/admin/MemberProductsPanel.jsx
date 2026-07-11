// Member-facing product docs, 5-question sample onboarding journey, and
// self-service commerce for SMB deliverable packages. Mounted as the
// 'products' tab in AdminShell for scope='member'.
//
// Server side: server/routes/commerce.js (/api/commerce/*).

import React from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';

const SAMPLE_QUESTIONS = [
  'What best describes your organization? (SMB, mid-market, enterprise, or individual)',
  "What's the primary business problem you're hoping this could help with?",
  'Which systems are most relevant today? (CRM, billing, ERP, spreadsheets, etc.)',
  'How soon are you hoping to act on this?',
  'What would make this a clear win for you?',
];

function fmtPrice(cents) {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtExpiry(ts) {
  if (!ts) return 'No expiration';
  const days = Math.ceil((Number(ts) - Date.now()) / 86400000);
  if (days <= 0) return 'Expired';
  return `Expires in ${days} day${days === 1 ? '' : 's'}`;
}

const label = {
  fontFamily: 'var(--sb-font-label)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--sb-dusty)',
};

export default function MemberProductsPanel() {
  const [products, setProducts] = React.useState(null);
  const [access, setAccess] = React.useState(null);
  const [wizardFor, setWizardFor] = React.useState(null); // productId
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    api.getCommerceProducts().then((d) => setProducts(d.packages || [])).catch((e) => setError(e.message));
    api.getMyCommerceAccess().then((d) => setAccess(d.access || [])).catch(() => setAccess([]));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function messageBetsy() {
    try {
      await api.startMessageBetsy();
      toast.success('Connected — open Messages to chat with Betsy directly.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function purchase(pkg, purchaseKind) {
    try {
      const res = await api.commerceCheckout(pkg.id, purchaseKind);
      if (res.stub) {
        toast.success(res.message || 'Access granted.');
        load();
        return;
      }
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
    } catch (e) {
      if (e.body?.requiresCustomScoping) {
        const notes = window.prompt('Tell us a bit about your organization and what you need — Betsy will follow up with custom scoping and pricing.');
        if (notes !== null) {
          api.requestCustomScoping(pkg.id, notes)
            .then(() => toast.success('Request sent — Betsy will follow up.'))
            .catch((err) => toast.error(err.message));
        }
        return;
      }
      toast.error(e.message);
    }
  }

  const grouped = React.useMemo(() => {
    const byProduct = new Map();
    for (const p of products || []) {
      if (!byProduct.has(p.product_id)) byProduct.set(p.product_id, []);
      byProduct.get(p.product_id).push(p);
    }
    return byProduct;
  }, [products]);

  return (
    <div style={{ ...styles.editorPane, overflowY: 'auto' }}>
      <div style={styles.editorHeader}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
          Products
        </div>
        <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={messageBetsy}>
          Message Betsy
        </button>
      </div>

      <div style={styles.editorBody}>
        {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        {/* My access */}
        {access && access.length > 0 && (
          <div style={styles.card}>
            <div style={{ ...label, marginBottom: '0.75rem' }}>My Deliverables</div>
            {access.map((a) => (
              <div key={a.license_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '0.5px solid rgba(196,132,58,0.12)' }}>
                <div>
                  <div style={{ color: 'var(--sb-cream)', fontSize: '0.88rem' }}>{a.title}</div>
                  <div style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem', marginTop: 2 }}>
                    {fmtExpiry(a.expires_at)} · {a.allowExport ? 'Download enabled' : 'View only — no download or export'}
                  </div>
                </div>
                <DeliverableViewerLink access={a} />
              </div>
            ))}
          </div>
        )}

        {/* Catalog */}
        {products === null && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}
        {products && products.length === 0 && (
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>No products published yet.</div>
        )}

        {[...grouped.entries()].map(([productId, pkgs]) => (
          <div key={productId} style={styles.card}>
            <div style={{ ...label, marginBottom: '0.5rem' }}>{productId.toUpperCase()}</div>
            {pkgs.map((pkg) => (
              <div key={pkg.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid rgba(196,132,58,0.12)' }}>
                <div style={{ color: 'var(--sb-cream)', fontSize: '1rem', fontFamily: 'var(--sb-font-display)', marginBottom: '0.25rem' }}>{pkg.title}</div>
                <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{pkg.description}</div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }}
                    onClick={() => setWizardFor(wizardFor === pkg.id ? null : pkg.id)}>
                    {wizardFor === pkg.id ? 'Close sample' : 'Try a sample experience'}
                  </button>
                  {pkg.view_price_cents != null && (
                    <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }}
                      onClick={() => purchase(pkg, 'self_service_view')}>
                      View access — {fmtPrice(pkg.view_price_cents)} / {pkg.view_period_days} days
                    </button>
                  )}
                  {pkg.flat_fee_price_cents != null && (
                    <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }}
                      onClick={() => purchase(pkg, 'self_service_download')}>
                      Downloadable output — {fmtPrice(pkg.flat_fee_price_cents)} one-time
                    </button>
                  )}
                  {pkg.annual_price_cents != null && (
                    <button className="sb-btn sb-btn-gold" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }}
                      onClick={() => purchase(pkg, 'annual_entitlement')}>
                      Annual entitlement — {fmtPrice(pkg.annual_price_cents)}/yr
                    </button>
                  )}
                </div>

                <div style={{ color: 'var(--sb-dusty)', fontSize: '0.68rem', marginTop: '0.5rem' }}>
                  Self-service checkout is available for small and medium businesses. Mid-market and enterprise get custom scoping and pricing — checkout will offer to request that automatically if needed.
                </div>

                {wizardFor === pkg.id && (
                  <SampleWizard productId={pkg.product_id} onDone={() => setWizardFor(null)} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliverableViewerLink({ access }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="sb-btn sb-btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.68rem' }} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : 'View'}
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setOpen(false)}>
          <div style={{ width: '90vw', height: '85vh', background: 'var(--sb-navy-deep)', borderRadius: 'var(--sb-radius)', border: '0.5px solid rgba(196,132,58,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--sb-cream)', fontSize: '0.9rem' }}>{access.title}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {access.allowExport && access.html_storage_key && (
                  <a href={access.html_storage_key} download className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }}>Download</a>
                )}
                <button className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {access.html_storage_key ? (
                <iframe title={access.title} src={access.html_storage_key} sandbox="allow-scripts" style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <div style={{ padding: '2rem', color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>
                  This deliverable hasn't been published yet — Betsy will upload the rendered package here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SampleWizard({ productId, onDone }) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState(Array(SAMPLE_QUESTIONS.length).fill(''));
  const [submitting, setSubmitting] = React.useState(false);

  function update(v) {
    setAnswers((a) => { const next = [...a]; next[step] = v; return next; });
  }

  async function finish() {
    setSubmitting(true);
    try {
      await api.submitOnboardingRun(productId, SAMPLE_QUESTIONS.map((question, i) => ({ question, answer: answers[i] })));
      toast.success('Saved — thanks for trying it. Betsy will have this context for any future work.');
      onDone();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const atEnd = step === SAMPLE_QUESTIONS.length - 1;

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(196,132,58,0.06)', borderRadius: 'var(--sb-radius)', border: '0.5px solid rgba(196,132,58,0.18)' }}>
      <div style={{ ...label, marginBottom: '0.5rem' }}>Sample question {step + 1} of {SAMPLE_QUESTIONS.length}</div>
      <div style={{ color: 'var(--sb-cream)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{SAMPLE_QUESTIONS[step]}</div>
      <textarea
        value={answers[step]}
        onChange={(e) => update(e.target.value)}
        rows={3}
        style={{ width: '100%', background: 'var(--sb-navy-deep)', color: 'var(--sb-cream)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', padding: '0.6rem', fontSize: '0.85rem', resize: 'vertical' }}
        placeholder="Your answer…"
      />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        {step > 0 && (
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }} onClick={() => setStep((s) => s - 1)}>Back</button>
        )}
        {!atEnd && (
          <button className="sb-btn sb-btn-gold" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }} onClick={() => setStep((s) => s + 1)}>Next</button>
        )}
        {atEnd && (
          <button className="sb-btn sb-btn-gold" style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }} disabled={submitting} onClick={finish}>
            {submitting ? 'Saving…' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  );
}
