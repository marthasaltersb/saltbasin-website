import React from 'react';
import { styles } from './adminStyles.js';
import PublicNav from '../PublicNav.jsx';
import PublicFooter from '../PublicFooter.jsx';
import { RenderSection } from '../blocks/index.jsx';

// Renders the current draft page in-process (not via iframe). Status='draft'
// sections show with a banner; soon sections show the real content too so the
// editor can iterate without flipping status back and forth.
export default function PreviewPane({ site, config, currentPageKey }) {
  const pages = site?.pages || {};
  const page = pages[currentPageKey];
  return (
    <div style={styles.previewPane}>
      <div style={styles.previewHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-teal-deep)' }}>
            Live Preview · Draft
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)', marginTop: 2 }}>
            {(config?.site?.domain || 'saltbasin.net') + '/' + (page?.slug || '')}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {page ? (
          <>
            <PublicNav site={config?.site || {}} />
            {(page.sections || []).map((sec) => (
              <RenderSection key={sec.id} section={sec} config={config} mode="preview" />
            ))}
            <PublicFooter config={config} />
          </>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--sb-teal-deep)' }}>
            Select a page to preview.
          </div>
        )}
      </div>
    </div>
  );
}
