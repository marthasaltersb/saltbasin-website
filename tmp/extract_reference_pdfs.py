from pathlib import Path

import pdfplumber


FILES = [
    (
        r"C:\Users\mbets\Downloads\Salt_Basin_Visual_Design_System_v1.pdf",
        "tmp/salt_basin_visual_design_system.txt",
    ),
    (
        r"C:\Users\mbets\Downloads\Betsy_Salter_Visual_Metadata_Iconography_Canva_Companion.pdf",
        "tmp/betsy_visual_metadata_iconography.txt",
    ),
    (
        r"C:\Users\mbets\Downloads\The_Strategic_Operator.pdf",
        "tmp/the_strategic_operator.txt",
    ),
]


for source, output in FILES:
    pages = []
    with pdfplumber.open(source) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            pages.append(f"\n--- PAGE {index} ---\n{text}")
    body = "\n".join(pages)
    Path(output).write_text(body, encoding="utf-8")
    print(f"{output}: {len(body)} chars")
