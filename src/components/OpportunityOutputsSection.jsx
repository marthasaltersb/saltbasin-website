// World Shell: the application outputs linked to one tracked career
// opportunity (2026-10-02). Shows each linked output with its provenance
// (where it came from, when, authors, version/lineage, and the Career Master
// data it draws on), lets the member link/unlink existing outputs, open a
// draft in the shared block editor (HerqOutputConfigurator via the
// document-blocks adapter - no second editor), save it as a new draft
// version, and Approve for QR through the finalization gate
// (useToolCategoryGate().run + server assertReadyToFinalize).
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { useToolCategoryGate } from './admin/ToolCategoryGate.jsx';
import { OutputVersionHistoryModal } from './admin/OutputVersionHistory.jsx';
import { documentToEditorConfig, editorConfigToDocument, DOCUMENT_EDITOR_ALLOWED_TYPES } from '../lib/documentBlocksEditor.js';

const HerqOutputConfigurator = lazy(() => import('./admin/HerqOutputConfigurator.jsx'));

const C = { gold: '#c4843a', text: '#f5f0e8', muted: '#8b877c', line: 'rgba(255,255,255,0.08)', ok: '#8fbf98', warn: '#d98ca0' };
const S = {
  title: { fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: C.gold, margin: '1rem 0 0.4rem' },
  card: { border: `0.5px solid ${C.line}`, borderRadius: 8, padding: '0.6rem', marginBottom: '0.6rem', background: 'rgba(255,255,255,0.03)' },
  cardTitle: { fontSize: '0.84rem', fontWeight: 600, color: C.text, overflowWrap: 'anywhere' },
  badge: (tone) => ({ display: 'inline-block', fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 10, padding: '0.1rem 0.5rem', marginLeft: '0.4rem', border: `0.5px solid ${tone === 'ok' ? 'rgba(143,191,152,0.6)' : 'rgba(196,132,58,0.6)'}`, color: tone === 'ok' ? C.ok : C.gold }),
  dl: { display: 'grid', gridTemplateColumns: 'minmax(80px, 34%) 1fr', gap: '0.2rem 0.5rem', fontSize: '0.72rem', margin: '0.5rem 0', color: '#cfc9bd' },
  dt: { color: C.muted },
  dd: { margin: 0, overflowWrap: 'anywhere' },
  btn: { padding: '0.4rem 0.6rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: C.text, fontSize: '0.72rem', cursor: 'pointer', marginRight: '0.35rem', marginTop: '0.35rem' },
  btnGold: { padding: '0.4rem 0.6rem', borderRadius: 6, border: 'none', background: C.gold, color: '#1c1410', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', marginRight: '0.35rem', marginTop: '0.35rem' },
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.4rem 0.5rem', color: C.text, fontSize: '0.76rem', marginTop: '0.3rem' },
  alert: { border: '0.5px solid rgba(217,140,160,0.7)', background: 'rgba(217,140,160,0.1)', color: '#f0c4d0', borderRadius: 6, padding: '0.4rem 0.5rem', fontSize: '0.72rem', margin: '0.4rem 0' },
  muted: { color: C.muted, fontSize: '0.74rem' },
  editorShell: { position: 'fixed', inset: 0, zIndex: 60, background: '#0d1417', display: 'flex', flexDirection: 'column' },
  editorBar: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderBottom: `0.5px solid ${C.line}`, color: C.text, fontSize: '0.8rem', flexShrink: 0, flexWrap: 'wrap' },
};

const fmtDate = (ms) => (ms ? new Date(Number(ms)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'not recorded');
const statusText = (o) => (o.status === 'published' ? 'Approved - QR live' : o.status === 'approved' ? 'Approved' : o.status === 'archived' ? 'Archived' : 'Draft');

export default function OpportunityOutputsSection({ opportunity, onOpenCareerMaster, onOpportunityChanged, refreshSignal = '' }) {
  const gate = useToolCategoryGate();
  const [data, setData] = useState(null); // { outputs, careerMaster, memberSiteSlug }
  const [unlinked, setUnlinked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkChoice, setLinkChoice] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null); // { id, title, status, content, versionNumber }
  const [details, setDetails] = useState({ url: '', location: '', notes: '' });
  const [historyOpen, setHistoryOpen] = useState(false); // version history opened from inside the editor

  const oppId = opportunity.id;

  const load = useCallback(async () => {
    setError('');
    try {
      const [out, un] = await Promise.all([api.getOpportunityOutputs(oppId), api.listUnlinkedOutputs()]);
      setData(out);
      setUnlinked(un.outputs || []);
    } catch (e) {
      setError(`Could not load this opportunity's outputs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [oppId]);

  useEffect(() => { setLoading(true); setData(null); setEditor(null); setConfirmingId(null); setLinkChoice(''); load(); }, [load]);

  // The panel's other actions (import a document, approve a generated resume or
  // cover letter) add outputs to this opportunity; reload when one finishes.
  const lastSignal = React.useRef(refreshSignal);
  useEffect(() => {
    if (lastSignal.current !== refreshSignal) { lastSignal.current = refreshSignal; load(); }
  }, [refreshSignal, load]);

  async function act(fn, okMsg) {
    setBusy(true);
    setError('');
    try {
      const result = await fn();
      if (okMsg) toast.success(typeof okMsg === 'function' ? okMsg(result) : okMsg);
      await load();
      return result;
    } catch (e) {
      if (e?.cancelled) { setError(e.message); } else { setError(e.message); toast.error(e.message); }
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function openEditor(output) {
    setBusy(true);
    setError('');
    try {
      const doc = await api.getOutputContent(output.id);
      setEditor({ id: output.id, title: doc.title, status: output.status, content: doc.content, versionNumber: output.provenance.versionNumber });
    } catch (e) {
      setError(`Could not open the draft: ${e.message}`);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const adapter = useMemo(() => (editor ? {
    toConfig: () => documentToEditorConfig(editor.content),
    allowedTypes: DOCUMENT_EDITOR_ALLOWED_TYPES,
    statusText: `Editing version ${editor.versionNumber} - Save creates version ${editor.versionNumber + 1} (draft)`,
    onBack: () => setEditor(null),
    onSave: async (config, name) => {
      const content = editorConfigToDocument(config);
      try {
        const saved = await api.saveOutputVersion(editor.id, { content, name: name && name !== editor.title ? name : undefined });
        toast.success('Saved as a new draft version');
        setEditor(null);
        await load();
        return saved;
      } catch (e) {
        toast.error(e.message);
        throw e;
      }
    },
  } : null), [editor, load]);

  async function approve(output) {
    setConfirmingId(null);
    const shared = await act(() => gate.run(() => api.shareResumeOutput(output.id)), 'Approved - private QR link created');
    if (shared?.warnings?.length) for (const w of shared.warnings) toast.error(w);
  }

  // The World Shell rail uses backdrop-filter, which makes it the containing
  // block for position:fixed descendants - so full-screen layers (the editor,
  // the finalization gate prompt) are portalled to <body> or they clip to the rail.
  const gateLayer = gate.modal ? createPortal(gate.modal, document.body) : null;

  if (editor) {
    return createPortal(
      <div style={S.editorShell} role="dialog" aria-label="Draft editor">
        <div style={S.editorBar}>
          <strong>{editor.title}</strong>
          <span style={S.muted}>Version {editor.versionNumber} - shared block editor</span>
          <button style={S.btn} onClick={() => setHistoryOpen(true)}>Version history</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={<div style={{ ...S.muted, padding: '1rem' }}>Loading editor...</div>}>
            <HerqOutputConfigurator
              outputs={[{ id: editor.id, title: editor.title, output_type: 'resume' }]}
              initialSelectedId={editor.id}
              adapter={adapter}
            />
          </Suspense>
        </div>
        {gate.modal}
        {historyOpen && <OutputVersionHistoryModal projectionId={editor.id} onClose={() => setHistoryOpen(false)} />}
      </div>,
      document.body,
    );
  }

  const placeholder = opportunity.metadata?.placeholder === true;

  return (
    <div>
      <div style={S.title}>Application Outputs</div>

      {placeholder && (
        <div style={S.card} data-testid="placeholder-card">
          <div style={{ ...S.cardTitle, fontSize: '0.78rem' }}>Placeholder opportunity <span style={S.badge('warn')}>details to be filled later</span></div>
          <div style={S.muted}>Only the company and role are known so far. Add what you learn:</div>
          <input aria-label="Posting URL" placeholder="Posting URL" style={S.input} value={details.url} onChange={(e) => setDetails({ ...details, url: e.target.value })} />
          <input aria-label="Location" placeholder="Location" style={S.input} value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} />
          <input aria-label="Notes" placeholder="Notes" style={S.input} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
          <button
            style={S.btnGold} disabled={busy || !(details.url || details.location || details.notes)}
            onClick={async () => {
              const updated = await act(() => api.updateCareerOpportunity(oppId, { url: details.url || undefined, location: details.location || undefined, notes: details.notes || undefined }), 'Opportunity details saved');
              if (updated) { setDetails({ url: '', location: '', notes: '' }); onOpportunityChanged?.(); }
            }}
          >Save details</button>
        </div>
      )}

      {error && <div role="alert" style={S.alert}>{error}</div>}
      {loading && <div style={S.muted}>Loading outputs...</div>}

      {data && data.outputs.length === 0 && !loading && (
        <div style={S.muted}>No outputs linked to this opportunity yet. Link an existing output below, or import an application package.</div>
      )}

      {data?.outputs.map((o) => {
        const p = o.provenance;
        const cm = p.careerState;
        return (
          <div key={o.id} style={S.card} data-testid="linked-output">
            <div style={S.cardTitle}>
              {o.title}
              <span style={S.badge(o.status === 'published' ? 'ok' : 'warn')}>{statusText(o)}</span>
            </div>
            <div style={S.muted}>{o.outputType.replace('_', ' ')} - version {p.versionNumber} of {p.versionCount}</div>

            <div style={{ ...S.title, margin: '0.6rem 0 0.2rem' }}>Provenance</div>
            <dl style={S.dl} aria-label={`Provenance of ${o.title}`}>
              <dt style={S.dt}>Source</dt><dd style={S.dd}>{p.sourceLabel}</dd>
              <dt style={S.dt}>{p.source === 'imported' ? 'Imported' : 'Generated'}</dt><dd style={S.dd}>{fmtDate(p.importedOrGeneratedAt)}</dd>
              <dt style={S.dt}>Document created</dt><dd style={S.dd}>{fmtDate(p.documentCreatedAt)}</dd>
              <dt style={S.dt}>Last changed</dt><dd style={S.dd}>{fmtDate(p.lastChangedAt)}</dd>
              <dt style={S.dt}>Authors</dt><dd style={S.dd}>{p.authors.length ? p.authors.join(', ') : 'none recorded'}</dd>
              <dt style={S.dt}>Version</dt><dd style={S.dd}>Version {p.versionNumber} of {p.versionCount}{p.parentVersionId ? ` (edited from version ${p.lineage.find((l) => l.id === p.parentVersionId)?.version ?? '?'})` : ''}</dd>
              <dt style={S.dt}>Lineage</dt>
              <dd style={S.dd}>{p.lineage.map((l) => `v${l.version} ${statusText({ status: l.status })}${l.isQrVersion ? ' (QR)' : ''}`).join(' > ')}</dd>
              <dt style={S.dt}>Career Master</dt>
              <dd style={S.dd}>
                {cm.filedAgainstFingerprint
                  ? `Filed against ${cm.filedAtomCount} Career Master data points (state ${cm.filedAgainstFingerprint}).`
                  : 'Filed before any Career Master data existed.'}{' '}
                {cm.filedAgainstFingerprint ? (cm.unchangedSinceFiled ? 'Unchanged since.' : `Career Master now has ${cm.currentAtomCount} data points - it has changed since.`) : `Career Master now has ${cm.currentAtomCount} data points.`}
              </dd>
              <dt style={S.dt}>Draws on</dt>
              <dd style={S.dd}>Your Career Master - Jobs {data.careerMaster.jobs}, Skills {data.careerMaster.skills}, Tools {data.careerMaster.tools}, Certifications {data.careerMaster.certifications}, Engagements {data.careerMaster.engagements}</dd>
              <dt style={S.dt}>Salt Basin site</dt>
              <dd style={S.dd}>{data.memberSite?.published ? 'Published - your site is live.' : 'Not published yet.'}</dd>
              {p.approvedAt && (<><dt style={S.dt}>Approved</dt><dd style={S.dd}>{fmtDate(p.approvedAt)} by {p.approvedBy || 'you'}</dd></>)}
            </dl>
            <div>
              <button style={S.btn} onClick={onOpenCareerMaster}>Open my Career Master</button>
              {data.memberSite?.published && data.memberSite.slug && <a href={`/u/${data.memberSite.slug}`} target="_blank" rel="noreferrer" style={{ ...S.btn, display: 'inline-block', textDecoration: 'none' }}>View my Salt Basin site</a>}
            </div>

            {o.share && (
              <div style={{ ...S.muted, marginTop: '0.4rem' }}>
                QR link {o.share.live ? 'is live' : 'is not live'} on version {o.share.versionNumber}{o.share.isShownVersion ? '' : ' (a newer draft exists)'}:{' '}
                <a href={`/r/${o.share.token}`} target="_blank" rel="noreferrer" style={{ color: C.gold }}>/r/{o.share.token.slice(0, 6)}...</a>
              </div>
            )}

            {confirmingId === o.id ? (
              <div style={{ ...S.card, marginTop: '0.5rem' }} role="group" aria-label="Confirm approval">
                <div style={{ fontSize: '0.74rem', color: C.text }}>
                  Approve "{o.title}" (version {p.versionNumber}) as the final version for its QR code? You will be recorded as the approver. If an earlier version already has a QR code, that same code will open this version.
                </div>
                <button style={S.btnGold} disabled={busy} onClick={() => approve(o)}>Confirm approval</button>
                <button style={S.btn} onClick={() => setConfirmingId(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                {o.editable
                  ? <button style={S.btnGold} disabled={busy} onClick={() => openEditor(o)}>Edit draft</button>
                  : <span style={{ ...S.muted, display: 'block', marginTop: '0.4rem' }}>{o.notEditableReason}</span>}
                <button style={S.btn} disabled={busy || (o.status === 'published' && o.share?.isShownVersion)} onClick={() => setConfirmingId(o.id)}>Approve for QR</button>
                <button style={S.btn} disabled={busy} onClick={() => act(() => api.unlinkOutputFromOpportunity(oppId, o.id), 'Output unlinked from this opportunity')}>Unlink</button>
              </div>
            )}
          </div>
        );
      })}

      <div style={S.title}>Link an Existing Output</div>
      {unlinked.length === 0 ? (
        <div style={S.muted}>Every output you have is already linked, or you have none yet.</div>
      ) : (
        <>
          <select aria-label="Output to link" style={S.input} value={linkChoice} onChange={(e) => setLinkChoice(e.target.value)}>
            <option value="">Choose an output...</option>
            {unlinked.map((u) => <option key={u.id} value={u.id}>{u.title} ({u.outputType.replace('_', ' ')}, {statusText(u)})</option>)}
          </select>
          <button style={S.btnGold} disabled={!linkChoice || busy} onClick={() => act(() => api.linkOutputToOpportunity(oppId, Number(linkChoice)), 'Output linked to this opportunity')}>Link output</button>
        </>
      )}
      {gateLayer}
    </div>
  );
}
