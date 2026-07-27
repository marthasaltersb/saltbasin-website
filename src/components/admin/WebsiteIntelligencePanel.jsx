import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { createWebsitePageInventory, summarizeInventory } from '../../lib/websiteIntelligence.js';

const card = { padding: '1rem', border: '1px solid rgba(148,163,184,.28)', borderRadius: 12, background: 'rgba(15,23,42,.55)' };

export default function WebsiteIntelligencePanel() {
  const [site, setSite] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getPublishedSite().then(setSite).catch((err) => setError(err.message)); }, []);
  const inventory = useMemo(() => site ? createWebsitePageInventory(site) : [], [site]);
  const summary = useMemo(() => summarizeInventory(inventory), [inventory]);

  return <div style={{ padding: '1.5rem', color: 'var(--sb-cream)', overflow: 'auto', height: '100%' }}>
    <p style={{ color: 'var(--sb-gold)', letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 12 }}>Website Intelligence</p>
    <h1 style={{ marginTop: 4 }}>Public site inventory</h1>
    <p style={{ maxWidth: 760, color: 'var(--sb-sage)' }}>Observed from the published site configuration. This workspace is read-only: recommendations will become reviewable draft changesets, never silent production edits.</p>
    {error && <div style={{ ...card, borderColor: '#ef4444' }}>{error}</div>}
    {!site && !error && <p>Reading published configuration…</p>}
    {site && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, margin: '1.25rem 0' }}>
        {[['Pages', summary.pages], ['Sections', summary.sections], ['Live sections', summary.liveSections], ['Missing page SEO', summary.pagesWithoutSeo], ['No detected CTA', summary.pagesWithoutCtas]].map(([label, value]) =>
          <div key={label} style={card}><div style={{ fontSize: 28, color: 'var(--sb-gold)' }}>{value}</div><div style={{ color: 'var(--sb-sage)' }}>{label}</div></div>)}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {inventory.map((page) => <details key={page.page_id} style={card}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{page.page_title} <span style={{ color: 'var(--sb-sage)', fontWeight: 400 }}>— {page.source_url} · {page.content_blocks.length} sections</span></summary>
          <div style={{ marginTop: 12, display: 'grid', gap: 6, color: 'var(--sb-sage)' }}>
            <div><strong>Purpose signal:</strong> {page.inferred_page_purpose}</div>
            <div><strong>Observed content:</strong> {page.content_depth} words · {page.ctas.length} CTA fields · {page.media_assets.length} media fields</div>
            <div><strong>SEO:</strong> {page.seo_metadata ? 'Configured' : 'No page-level metadata observed'}</div>
            <div><strong>Blocks:</strong> {page.content_blocks.map((block) => `${block.section_type} (${block.status})`).join(', ') || 'None'}</div>
          </div>
        </details>)}
      </div>
    </>}
  </div>;
}
