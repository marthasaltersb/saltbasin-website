// Adapter between an application-package draft's content (document_blocks v1,
// server/lib/applicationPackages.js) and the shared block editor's config
// ({ pageMargin, blocks }, HerqOutputConfigurator.jsx). The editor stays the
// one editor; this only translates in and out.
//
// Lossless by construction: every editor block keeps the document block it
// came from in `docSource`, so style-only fields, emphasis and unknown extras
// survive a save; tables and figures are carried as read-only
// 'document-preserved' blocks and written back untouched.

export const DOCUMENT_EDITOR_ALLOWED_TYPES = ['heading', 'body', 'bullet-list', 'role-line'];

let counter = 0;
const id = () => `d-${Date.now().toString(36)}-${(counter += 1)}`;

function tableSummary(rows = []) {
  return rows.map((cells) => (cells || []).map((c) => (Array.isArray(c) ? c.join(' / ') : String(c ?? ''))).join('  |  ')).join('\n');
}

export function documentToEditorConfig(content) {
  const blocks = [];
  let order = 1;
  const push = (b) => blocks.push({ id: id(), visible: true, order: order++, style: {}, ...b });
  const h = content?.header || {};
  if (h.name || h.headline) {
    push({ type: 'page-header', props: { eyebrow: '', title: h.name || '', subtitle: h.headline || '' }, docRole: 'header', docSource: { header: h } });
  }
  if (h.contact) push({ type: 'contact-line', props: { items: Array.isArray(h.contact) ? h.contact.filter(Boolean) : [h.contact] }, docRole: 'contact' });
  for (const b of content?.blocks || []) {
    if (b.type === 'heading') push({ type: 'heading', props: { text: b.text || '', level: 1 }, docSource: b });
    else if (b.type === 'paragraph') push({ type: 'body', props: { text: b.text || '' }, docSource: b });
    else if (b.type === 'bullet') push({ type: 'bullet-list', props: { items: [b.text || ''] }, docSource: b });
    else if (b.type === 'role') push({ type: 'role-line', props: { title: b.title || '', dates: b.dates || '' }, docSource: b });
    else if (b.type === 'table') push({ type: 'document-preserved', props: { kind: 'Table', summary: tableSummary(b.rows) }, docSource: b });
    else push({ type: 'document-preserved', props: { kind: String(b.type || 'content'), summary: '' }, docSource: b });
  }
  return { pageMargin: '0.5in', blocks, originalHeader: h };
}

/** Editor config -> document_blocks v1. Hidden blocks are left out of the saved document. */
export function editorConfigToDocument(config) {
  const sorted = [...(config?.blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const original = config?.originalHeader || {};
  const header = { ...original };
  const blocks = [];
  for (const b of sorted) {
    if (b.visible === false) {
      if (b.docRole === 'header' || b.docRole === 'contact') throw new Error('The document header cannot be hidden. Edit it instead.');
      continue;
    }
    const src = b.docSource || {};
    switch (b.type) {
      case 'page-header':
        header.name = b.props?.title ?? '';
        header.headline = b.props?.subtitle ?? '';
        break;
      case 'contact-line':
        header.contact = (b.props?.items || []).filter((x) => String(x).trim()).join(' · ');
        break;
      case 'heading':
        blocks.push({ ...src, type: 'heading', text: b.props?.text ?? '' });
        break;
      case 'body':
        blocks.push({ ...src, type: 'paragraph', text: b.props?.text ?? '' });
        break;
      case 'bullet-list':
        for (const item of b.props?.items || []) if (String(item).trim()) blocks.push({ ...src, type: 'bullet', text: item });
        break;
      case 'role-line':
        blocks.push({ ...src, type: 'role', title: b.props?.title ?? '', dates: b.props?.dates ?? '' });
        break;
      case 'document-preserved':
        if (!b.docSource) throw new Error('A preserved block lost its source and cannot be saved.');
        blocks.push(b.docSource);
        break;
      default:
        throw new Error(`A "${b.type}" block cannot be saved into a document.`);
    }
  }
  return { format: 'document_blocks', version: 1, header, blocks };
}
