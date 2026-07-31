// Organization Documents panel (2026-07-27) — gated view of the
// 'customer_document_delivery' Tributary's satellite table
// (org_document_projections): a proposal plus any product-resource
// documents delivered to this customer organization. Only meaningful in
// org scope (orgId present) — a personal member profile has no org
// document context, so it gets an honest empty state rather than an error,
// matching the Career Channel Rod's "no fabricated numbers" pattern.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const card = { border: '1px solid rgba(196,132,58,.24)', borderRadius: 12, padding: '1.25rem', background: 'rgba(255,255,255,.72)' };
const TYPE_LABEL = { proposal: 'Proposal', product_resource: 'Product Resource' };

function DocumentDetail({ orgId, docId, onBack }) {
  const [doc, setDoc] = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    setDoc(undefined);
    api.getOrgDocument(orgId, docId).then(setDoc).catch((e) => setError(e.message));
  }, [orgId, docId]);

  if (error) return <div style={card}><div style={{ color: '#B0413E', fontSize: '.85rem' }}>{error}</div></div>;
  if (doc === undefined) return <div style={{ color: 'rgba(20,35,58,.5)', fontSize: '.85rem' }}>Loading…</div>;

  const sections = Array.isArray(doc.content?.sections) ? doc.content.sections : [];
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4A7C8E', fontSize: '.8rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
        ← Back to Documents
      </button>
      <div style={{ fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#C4843A', fontWeight: 700, marginBottom: '.25rem' }}>
        {TYPE_LABEL[doc.document_type] || doc.document_type}
      </div>
      <h2 style={{ margin: '0 0 .5rem', fontSize: '1.4rem', color: '#14233A' }}>{doc.title}</h2>
      {doc.summary && <p style={{ color: 'rgba(20,35,58,.7)', fontSize: '.9rem', marginBottom: '1.5rem' }}>{doc.summary}</p>}
      {sections.map((section, i) => (
        <div key={i} style={{ ...card, marginBottom: '1rem' }}>
          {section.heading && <h3 style={{ margin: '0 0 .5rem', fontSize: '1.05rem', color: '#14233A' }}>{section.heading}</h3>}
          {section.body && <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.65, color: 'rgba(20,35,58,.82)', whiteSpace: 'pre-wrap' }}>{section.body}</p>}
          {Array.isArray(section.items) && (
            <ul style={{ margin: '.5rem 0 0', paddingLeft: '1.2rem', fontSize: '.85rem', color: 'rgba(20,35,58,.8)' }}>
              {section.items.map((item, j) => <li key={j} style={{ marginBottom: '.3rem' }}>{item}</li>)}
            </ul>
          )}
          {section.link && (
            <a href={section.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '.75rem', fontSize: '.82rem', color: '#4A7C8E', fontWeight: 600 }}>
              {section.linkLabel || 'View full resource →'}
            </a>
          )}
        </div>
      ))}
      {!sections.length && <div style={{ color: 'rgba(20,35,58,.5)', fontSize: '.85rem' }}>This document has no content yet.</div>}
    </div>
  );
}

export default function OrgDocumentsPanel({ orgId }) {
  const [docs, setDocs] = useState(undefined);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    api.getOrgDocuments(orgId).then((d) => setDocs(d.documents || [])).catch((e) => {
      setError(e.status === 403 ? '' : e.message);
      setDocs([]);
    });
  }, [orgId]);

  if (!orgId) {
    return (
      <div style={card}>
        <div style={{ fontSize: '.85rem', color: 'rgba(20,35,58,.6)' }}>
          Documents are delivered per organization. Once you're recognized as belonging to a customer
          organization (verifying a work email does this automatically), any proposal or product resources
          shared with that organization will appear here.
        </div>
      </div>
    );
  }

  if (openId) return <DocumentDetail orgId={orgId} docId={openId} onBack={() => setOpenId(null)} />;

  if (docs === undefined) return <div style={{ color: 'rgba(20,35,58,.5)', fontSize: '.85rem' }}>Loading…</div>;

  if (error) {
    return <div style={card}><div style={{ color: '#B0413E', fontSize: '.85rem' }}>{error}</div></div>;
  }

  if (!docs.length) {
    return (
      <div style={card}>
        <div style={{ fontSize: '.85rem', color: 'rgba(20,35,58,.6)' }}>
          No documents have been shared with this organization yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '.75rem' }}>
      {docs.map((doc) => (
        <div key={doc.id} style={{ ...card, cursor: 'pointer' }} onClick={() => setOpenId(doc.id)}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#C4843A', fontWeight: 700 }}>
            {TYPE_LABEL[doc.document_type] || doc.document_type}
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#14233A', margin: '.25rem 0' }}>{doc.title}</div>
          {doc.summary && <div style={{ fontSize: '.82rem', color: 'rgba(20,35,58,.65)' }}>{doc.summary}</div>}
        </div>
      ))}
    </div>
  );
}
