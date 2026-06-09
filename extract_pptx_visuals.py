"""Extract embedded thumbnails and slide XML from PPTX files."""
import zipfile, os, shutil, re

DOWNLOADS = r'C:\Users\mbets\Downloads'
OUT = r'C:\Users\mbets\saltbasin-website\pptx_analysis'
os.makedirs(OUT, exist_ok=True)

files = [
    'go-to-market-strategy-mckinsey.pptx',
    'mckinsey-consulting-report.pptx',
    'data-strategy-roadmap.pptx',
    'project-status-report-heat-map.pptx',
    'data-infographic.pptx',
    'professional-monthly-scoreboard.pptx',
    'startup-executive-summary.pptx',
    'my-personal-dashboard.pptx',
    'infographics.pptx',
    'phone-app.pptx',
    'employee-scorecard.pptx',
    'minimal-annual-company-review.pptx',
    'floral-decision-matrix.pptx',
    'work-decision-tree.pptx',
    'aesthetic-consumer-decision-tree.pptx',
    'pastel-fishbone-problem-solving.pptx',
    'interactive-choice-board.pptx',
    'colby.pptx',
]

for fname in files:
    path = os.path.join(DOWNLOADS, fname)
    if not os.path.exists(path):
        print(f'SKIP (not found): {fname}')
        continue

    slug = fname.replace('.pptx', '')
    slide_dir = os.path.join(OUT, slug)
    os.makedirs(slide_dir, exist_ok=True)

    with zipfile.ZipFile(path, 'r') as z:
        names = z.namelist()

        # Extract embedded thumbnail
        thumb_candidates = [n for n in names if 'thumbnail' in n.lower() or n.endswith('.jpeg') or n.endswith('.jpg')]
        for t in thumb_candidates[:1]:
            ext = t.rsplit('.', 1)[-1]
            dest = os.path.join(slide_dir, f'thumbnail.{ext}')
            with z.open(t) as src, open(dest, 'wb') as dst:
                dst.write(src.read())
            print(f'  thumbnail: {dest}')

        # Extract slide 1 and 2 XML for color/layout analysis
        slides = sorted([n for n in names if re.match(r'ppt/slides/slide\d+\.xml', n)])
        for s in slides[:3]:
            snum = re.search(r'slide(\d+)', s).group(1)
            dest = os.path.join(slide_dir, f'slide{snum}.xml')
            with z.open(s) as src, open(dest, 'w', encoding='utf-8') as dst:
                content = src.read().decode('utf-8', errors='replace')
                dst.write(content)

        # Grab theme colors
        themes = [n for n in names if 'theme' in n.lower() and n.endswith('.xml')]
        for t in themes[:1]:
            dest = os.path.join(slide_dir, 'theme.xml')
            with z.open(t) as src, open(dest, 'w', encoding='utf-8') as dst:
                dst.write(src.read().decode('utf-8', errors='replace'))

        print(f'{slug}: {len(slides)} slides, {len(themes)} themes | files: {[n for n in names if n.startswith("ppt/media/")][:3]}')

print('Done extracting.')
