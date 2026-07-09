import React from 'react';

// Shared image-upload control — extracted from EditorPane.jsx so other admin
// editors (e.g. FlexColumnsEditor.jsx) can reuse it without a circular import
// between the two files. A field is treated as an image upload elsewhere by
// key-name convention (see isImageField in EditorPane.jsx); this component
// itself is just the upload/preview UI for one image URL.
export default function ImageUploadField({ value, onChange }) {
  const inputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      onChange(body.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          padding: '0.75rem',
          background: 'var(--sb-navy)',
          border: '0.5px solid rgba(196,132,58,0.25)',
          borderRadius: 'var(--sb-radius)',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 80,
            height: 100,
            background: 'var(--sb-navy-deep)',
            border: '0.5px solid var(--sb-taupe)',
            borderRadius: 'var(--sb-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sb-teal-deep)',
            fontSize: '0.7rem',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {value ? (
            <img
              src={value}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>No image</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="sb-btn sb-btn-gold"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.7rem' }}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
            </button>
            {value && (
              <button
                type="button"
                className="sb-btn sb-btn-outline"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.7rem' }}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            )}
          </div>
          <input
            className="sb-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… or paste a URL"
            style={{ fontSize: '0.78rem' }}
          />
          {error && (
            <div style={{ fontSize: '0.75rem', color: 'var(--sb-risk-critical)' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
