"""Convert tailored application-package .docx files into the structured
"document blocks" shape stored in resume_output_projections.generated_content
(see server/lib/applicationPackages.js for the shape and renderers).

Usage:
  pip install python-docx
  python scripts/extract-application-package.py <package-key> <out.json> \
      --company "Acme" --created 2026-09-30T13:00:01Z \
      --authors "Charles Phillipe; Betsy Salter" \
      resume_salt_basin=path/to/Resume_Salt_Basin.docx \
      resume_ats=path/to/Resume_ATS.docx \
      cover_letter=path/to/Cover_Letter.docx \
      application_package=path/to/Application_Package.docx

Each `<variant>=<path>` pair becomes one output in the package. The docx
core properties' created/modified dates are NOT trusted (python-docx stamps
a fixed 2013-12-23 placeholder on every file it generates) — pass the real
creation date with --created.
"""
import argparse
import json
import re
import sys

import docx
from docx.oxml.ns import qn

VARIANTS = {
    'resume_salt_basin': ('resume', 'Resume · Salt Basin Format'),
    'resume_ats': ('resume', 'Resume · ATS Format'),
    'cover_letter': ('cover_letter', 'Cover Letter'),
    'application_package': ('application_package', 'Application Package'),
}


def clean(text):
    return re.sub(r'[  ]{2,}', ' ', (text or '').replace('​', '')).strip()


def is_bullet(p):
    if p.style is not None and 'List' in (p.style.name or ''):
        return True
    ppr = p._p.pPr
    return ppr is not None and ppr.numPr is not None


def run_emphasis(p):
    runs = [r for r in p.runs if r.text.strip()]
    if not runs:
        return None
    bold = all(r.bold for r in runs)
    italic = all(r.italic for r in runs)
    if bold and italic:
        return 'bold-italic'
    if bold:
        return 'bold'
    if italic:
        return 'italic'
    return None


def looks_like_heading(text):
    letters = re.sub(r'[^A-Za-z]', '', text)
    return 3 <= len(text) <= 70 and letters and letters.upper() == letters and '|' not in text


def iter_body(document):
    body = document.element.body
    for child in body.iterchildren():
        if child.tag == qn('w:p'):
            yield 'p', docx.text.paragraph.Paragraph(child, document)
        elif child.tag == qn('w:tbl'):
            yield 't', docx.table.Table(child, document)


def extract(path):
    document = docx.Document(path)
    blocks = []
    header_lines = []
    in_header = True
    for kind, item in iter_body(document):
        if kind == 't':
            in_header = False
            rows = []
            for row in item.rows:
                cells = []
                seen = set()
                for cell in row.cells:
                    # merged cells repeat — keep each underlying cell once
                    if id(cell._tc) in seen:
                        continue
                    seen.add(id(cell._tc))
                    lines = [clean(p.text) for p in cell.paragraphs if clean(p.text)]
                    cells.append(lines)
                rows.append(cells)
            blocks.append({'type': 'table', 'rows': rows})
            continue
        p = item
        text = clean(p.text)
        has_drawing = bool(p._p.xpath('.//w:drawing'))
        if not text:
            if has_drawing:
                blocks.append({'type': 'figure'})
            continue
        if in_header and len(header_lines) < 3 and not is_bullet(p):
            header_lines.append(text)
            continue
        in_header = False
        if is_bullet(p):
            blocks.append({'type': 'bullet', 'text': text})
        elif '\t' in p.text and not looks_like_heading(text):
            left, _, right = p.text.partition('\t')
            blocks.append({'type': 'role', 'title': clean(left), 'dates': clean(right)})
        elif looks_like_heading(text):
            blocks.append({'type': 'heading', 'text': text})
        else:
            block = {'type': 'paragraph', 'text': text}
            emphasis = run_emphasis(p)
            if emphasis:
                block['emphasis'] = emphasis
            blocks.append(block)
    # Line order varies by template (the ATS resume puts contact before the
    # headline) — identify the contact line by its email/phone, not position.
    rest = header_lines[1:]
    contact = next((line for line in rest if '@' in line or re.search(r'\d{3}-\d{3}-\d{4}', line)), '')
    headline = next((line for line in rest if line != contact), '')
    header = {
        'name': header_lines[0] if header_lines else '',
        'headline': headline,
        'contact': contact,
    }
    leftover = [line for line in rest if line not in (contact, headline)]
    blocks = [{'type': 'paragraph', 'text': line} for line in leftover] + blocks
    return document.core_properties.title or '', header, blocks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('package_key')
    ap.add_argument('out')
    ap.add_argument('--company', required=True)
    ap.add_argument('--role', default=None, help='Role title being applied for (lets the importer create a placeholder opportunity)')
    ap.add_argument('--created', required=True, help='ISO-8601 creation timestamp of the package')
    ap.add_argument('--authors', required=True, help='Semicolon-separated author names')
    ap.add_argument('outputs', nargs='+', help='<variant>=<docx path>')
    args = ap.parse_args()

    package = {
        'packageKey': args.package_key,
        'company': args.company,
        'createdAt': args.created,
        **({'role': args.role} if args.role else {}),
        'authors': [a.strip() for a in args.authors.split(';') if a.strip()],
        'outputs': [],
    }
    for pair in args.outputs:
        variant, _, path = pair.partition('=')
        if variant not in VARIANTS:
            sys.exit(f'Unknown variant {variant!r}; expected one of {sorted(VARIANTS)}')
        output_type, label = VARIANTS[variant]
        title, header, blocks = extract(path)
        package['outputs'].append({
            'variant': variant,
            'outputType': output_type,
            'name': f'{args.company} — {label}',
            'documentTitle': title,
            'content': {'format': 'document_blocks', 'version': 1, 'header': header, 'blocks': blocks},
        })
    with open(args.out, 'w', encoding='utf-8') as fh:
        json.dump(package, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    print(f'wrote {args.out}: {len(package["outputs"])} outputs')


if __name__ == '__main__':
    main()
