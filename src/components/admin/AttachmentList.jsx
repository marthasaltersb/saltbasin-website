import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

// Reusable attachment upload/list widget for any Content Entry Journey
// record — pass entityType/entityId (e.g. 'herq_research_input', row.id).
// Backed by /api/content-attachments (server/routes/contentAttachments.js).
export default function AttachmentList({ entityType, entityId, compact = false }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content-attachments?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`, { credentials: 'include' });
      const data = await res.json();
      setAttachments(data.attachments || []);
    } catch (e) {
      toast.error('Failed to load attachments');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [entityType, entityId]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('entity_type', entityType);
      form.append('entity_id', entityId);
      const res = await fetch('/api/content-attachments', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      toast.success('Attachment uploaded');
      load();
    } catch (e) {
      toast.error('Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleDownload(id) {
    try {
      const res = await fetch(`/api/content-attachments/${id}/download`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to open file'); return; }
      window.open(data.url, '_blank', 'noopener');
    } catch (e) {
      toast.error('Failed to open file');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this attachment?')) return;
    await fetch(`/api/content-attachments/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Attachment deleted');
    load();
  }

  if (!entityId) return null;

  return (
    <div style={{ marginTop: compact ? '0.4rem' : '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)' }}>
          Source Attachments {attachments.length > 0 ? `(${attachments.length})` : ''}
        </span>
        <label style={{ fontSize: '0.68rem', color: 'var(--herq-accent, #E8407A)', cursor: uploading ? 'default' : 'pointer', fontFamily: 'var(--sb-font-label)' }}>
          {uploading ? 'Uploading…' : '+ Attach file'}
          <input type="file" onChange={handleFile} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>
      {!loading && attachments.length === 0 && (
        <div style={{ fontSize: '0.7rem', color: '#999' }}>No source files attached yet.</div>
      )}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {attachments.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.72rem', background: 'rgba(0,0,0,0.03)', borderRadius: 3, padding: '0.3rem 0.55rem' }}>
              <span onClick={() => handleDownload(a.id)} style={{ cursor: 'pointer', color: '#1A1A1A', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.original_filename}
              </span>
              {a.retention_expires_at && (
                <span style={{ fontSize: '0.62rem', color: '#C4843A', flexShrink: 0 }} title="Non-admin uploads are auto-deleted 30 days after upload">
                  expires {new Date(Number(a.retention_expires_at)).toLocaleDateString()}
                </span>
              )}
              <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#C44A4A', cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
