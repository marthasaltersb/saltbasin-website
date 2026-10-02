// /r/:token — the page a QR code on a tailored resume / cover letter opens.
// Unlisted and slug-gated (server/lib/applicationPackages.js): the token is
// the only key, the API answers a plain 404 for anything not approved and
// still published, and the page asks search engines not to index it.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import DocumentBlocksView, { formatMetadataLine, isDocumentBlocks } from './DocumentBlocksView.jsx';
import SharedLiveStates from './SharedLiveStates.jsx';

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

export default function SharedOutputPage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, doc: null, error: null });
  const [qrSvg, setQrSvg] = useState(null);
  useNoIndex();

  useEffect(() => {
    let cancelled = false;
    api.getSharedOutput(token)
      .then((doc) => { if (!cancelled) setState({ loading: false, doc, error: null }); })
      .catch(() => { if (!cancelled) setState({ loading: false, doc: null, error: 'not_found' }); });
    return () => { cancelled = true; };
  }, [token]);

  // The printed copy carries its own QR, same as the PDF download.
  useEffect(() => {
    if (!state.doc) return;
    import('qrcode')
      .then((QRCode) => QRCode.toString(window.location.href.split('?')[0], { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }))
      .then(setQrSvg)
      .catch(() => setQrSvg(null));
  }, [state.doc]);

  useEffect(() => {
    if (state.doc?.title) document.title = state.doc.title;
  }, [state.doc]);

  const shell = { minHeight: '100vh', background: '#F3EEE6', padding: '1.5rem 1rem', boxSizing: 'border-box' };

  if (state.loading) return <div style={{ ...shell, textAlign: 'center', color: '#1B2A3B', fontFamily: 'Georgia, serif' }}>Loading…</div>;
  if (!state.doc) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center', fontFamily: 'Georgia, serif', color: '#1B2A3B' }}>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>This link isn't available</h1>
          <p style={{ fontSize: '0.9rem', color: '#5F6B78', lineHeight: 1.6 }}>
            The document behind this QR code has been withdrawn or replaced. Contact the sender for a current copy.
          </p>
        </div>
      </div>
    );
  }

  const { doc } = state;
  return (
    <div style={shell} className="sb-shared-output">
      <style>{`
        @media print {
          .sb-shared-output { background: white !important; padding: 0 !important; }
          .sb-shared-output-toolbar, .sb-chart-views-switch, .sb-state-slider input, .sb-state-slider button { display: none !important; }
          .sb-shared-output-page { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: none !important; }
        }
        @page { size: letter; margin: 0.5in 0.6in; }
      `}</style>
      <div className="sb-shared-output-toolbar" style={{ maxWidth: 820, margin: '0 auto 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Georgia, serif', color: '#1B2A3B', fontSize: '0.95rem' }}>
          Salt Basin <span style={{ color: '#C4843A' }}>Net Works</span>
          <span style={{ fontSize: '0.7rem', color: '#5F6B78', marginLeft: '0.5rem' }}>Private link · {doc.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a className="sb-btn" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem', textDecoration: 'none', background: 'white', color: '#1B2A3B', border: '1px solid #1B2A3B' }} href={`/api/shared-outputs/${encodeURIComponent(token)}/download.pdf`} rel="noreferrer">
            Download PDF
          </a>
          <button className="sb-btn sb-btn-gold" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
      <article className="sb-shared-output-page" style={{ maxWidth: 820, margin: '0 auto', background: 'white', border: '1px solid #E3D8C9', borderTop: '4px solid #C4843A', padding: 'clamp(1.25rem, 4vw, 2.5rem)', boxSizing: 'border-box', boxShadow: '0 24px 70px -52px rgba(43,42,40,0.42)' }}>
        {isDocumentBlocks(doc.content) ? (
          <DocumentBlocksView content={doc.content} qrSvg={qrSvg} qrHref={window.location.href.split('?')[0]} />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.6 }}>{doc.content?.rawText || ''}</div>
        )}
        {/* Always rendered when states exist: SharedLiveStates itself states a
            missing baseline or a failed live load — never hidden. */}
        {doc.states && <SharedLiveStates states={doc.states} />}
        <footer style={{ marginTop: '1.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E3D8C9', fontSize: '0.66rem', color: '#5F6B78' }}>
          {formatMetadataLine(doc.metadata)}
        </footer>
      </article>
    </div>
  );
}
