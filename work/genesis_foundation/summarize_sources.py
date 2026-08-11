import json
from pathlib import Path


ROOT = Path(__file__).parent / "extracted"
for path in sorted(ROOT.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    print(f"\n## {data['file']}")
    if "sheets" in data:
        for sheet in data["sheets"]:
            print(f"SHEET {sheet['name']} ({sheet['max_row']}x{sheet['max_column']})")
            for row in sheet["rows"][:6]:
                print("  ", row)
    else:
        print(f"Paragraphs: {len(data['paragraphs'])}; tables: {len(data['tables'])}")
        for p in data["paragraphs"]:
            style = p.get("style") or ""
            if style.startswith("Heading") or style in {"Title", "Subtitle"}:
                print(f"  {style}: {p['text']}")
        for index, table in enumerate(data["tables"]):
            print(f"TABLE {index + 1}: {len(table)} rows; first rows: {table[:3]}")
