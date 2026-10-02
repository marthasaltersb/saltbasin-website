// Renders a "document_blocks" generated_content (tailored application
// packages — see server/lib/applicationPackages.js) for both the owner's
// read-only view (MyResumePanel) and the QR-gated public page
// (SharedOutputPage). The PDF twin of this layout is
// server/lib/outputRendering.js's renderDocumentBlocks — keep them aligned.
import React from 'react';

const INK = '#1B2A3B';
const GOLD = '#C4843A';
const TEAL = '#4A7C8E';
const MUTED = '#5F6B78';

const EMPHASIS_STYLE = {
  bold: { fontWeight: 700 },
  italic: { fontStyle: 'italic' },
  'bold-italic': { fontWeight: 700, fontStyle: 'italic' },
};

function formatDate(ms) {
  return ms ? new Date(Number(ms)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
}

/** Same wording as outputRendering.js's metadataLine(), for the screen. */
export function formatMetadataLine(metadata) {
  if (!metadata) return '';
  return [
    metadata.authors?.length ? `Authors: ${metadata.authors.join('; ')}` : '',
    metadata.createdAt ? `Created ${formatDate(metadata.createdAt)}` : '',
    metadata.modifiedAt ? `Modified ${formatDate(metadata.modifiedAt)}` : '',
    metadata.approvedBy ? `Approved by ${metadata.approvedBy}${metadata.approvedAt ? ` on ${formatDate(metadata.approvedAt)}` : ''}` : 'Not yet approved',
  ].filter(Boolean).join('  ·  ');
}

export function isDocumentBlocks(content) {
  return content?.format === 'document_blocks';
}

function TableBlock({ rows }) {
  if (!rows?.length) return null;
  if (rows.length === 1) {
    // Single-row tables are the metric / highlight tiles.
    const cells = rows[0];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: '0.5rem', margin: '0.35rem 0 0.75rem' }}>
        {cells.map((lines, i) => (
          <div key={i} style={{ background: '#F7F1E8', borderTop: `2px solid ${GOLD}`, padding: '0.55rem 0.65rem' }}>
            <div style={{ fontWeight: 700, color: GOLD, fontSize: '0.95rem', lineHeight: 1.25 }}>{lines[0]}</div>
            {lines.slice(1).map((line, j) => (
              <div key={j} style={{ fontSize: '0.74rem', color: MUTED, lineHeight: 1.45, marginTop: 2 }}>{line}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto', margin: '0.35rem 0 0.75rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} style={{ borderBottom: '1px solid #E3D8C9' }}>
              {cells.map((lines, c) => {
                const Cell = r === 0 ? 'th' : 'td';
                return (
                  <Cell key={c} style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: INK, fontWeight: r === 0 ? 700 : 400, verticalAlign: 'top' }}>
                    {lines.join(' ')}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Owner-side marker for wording that exists in this output only (career-bound
// outputs). Never rendered on the public QR page or in the PDF.
function OutputOnlyBadge() {
  return (
    <span title="This wording applies to this output only; Career Master is unchanged" style={{ marginLeft: 6, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8a5a12', background: '#FBEBD0', border: '1px solid #E8C98F', borderRadius: 999, padding: '0 6px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>output-only</span>
  );
}

export default function DocumentBlocksView({ content, qrSvg = null, qrHref = null, qrCaption = 'Scan or click for current version', showOutputOnly = false }) {
  const header = content?.header || {};
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: INK, lineHeight: 1.5 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: `2px solid ${GOLD}`, paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.15 }}>{header.name}</div>
          {header.headline && <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', color: TEAL, marginTop: '0.25rem' }}>{header.headline}</div>}
          {header.contact && <div style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.2rem' }}>{header.contact}</div>}
        </div>
        {qrSvg && (
          <figure style={{ margin: 0, width: 84, flexShrink: 0, textAlign: 'center' }}>
            {qrHref ? (
              <a href={qrHref} aria-label="Open the current version of this document" style={{ display: 'block', width: 84, height: 84 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            ) : (
              <div style={{ width: 84, height: 84 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            )}
            <figcaption style={{ fontSize: '0.55rem', color: MUTED, lineHeight: 1.2 }}>{qrCaption}</figcaption>
          </figure>
        )}
      </header>
      {(content?.blocks || []).map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h2 key={i} style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: GOLD, fontWeight: 700, margin: '1rem 0 0.4rem', paddingBottom: '0.2rem', borderBottom: '1px solid #E3D3BE', breakAfter: 'avoid' }}>
              {block.text}
            </h2>
          );
        }
        if (block.type === 'paragraph') {
          return <p key={i} style={{ fontSize: '0.84rem', margin: '0 0 0.45rem', ...(EMPHASIS_STYLE[block.emphasis] || {}) }}>{block.text}{showOutputOnly && block.outputOnly && <OutputOnlyBadge />}</p>;
        }
        if (block.type === 'bullet') {
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.84rem', margin: '0 0 0.25rem 0.5rem' }}>
              <span aria-hidden="true" style={{ color: GOLD }}>•</span><span>{block.text}{showOutputOnly && block.outputOnly && <OutputOnlyBadge />}</span>
            </div>
          );
        }
        if (block.type === 'role') {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', margin: '0.6rem 0 0.2rem', breakAfter: 'avoid' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{block.title}{showOutputOnly && block.outputOnly && <OutputOnlyBadge />}</span>
              <span style={{ color: TEAL, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{block.dates}</span>
            </div>
          );
        }
        if (block.type === 'table') return <TableBlock key={i} rows={block.rows} />;
        return null; // 'figure' — images aren't carried over; their alt text is a paragraph
      })}
    </div>
  );
}
