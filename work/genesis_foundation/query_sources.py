import json
import sys
from pathlib import Path


ROOT = Path(__file__).parent / "extracted"
term = " ".join(sys.argv[1:]).casefold()
for path in sorted(ROOT.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    if "sheets" in data:
        for sheet in data["sheets"]:
            for i, row in enumerate(sheet["rows"], 1):
                text = " | ".join("" if value is None else str(value) for value in row)
                if term in text.casefold():
                    print(f"{data['file']} :: {sheet['name']} :: row {i} :: {text}")
    else:
        paragraphs = data["paragraphs"]
        for i, paragraph in enumerate(paragraphs):
            if term in paragraph["text"].casefold():
                lo, hi = max(0, i - 2), min(len(paragraphs), i + 5)
                print(f"\n{data['file']} :: paragraph {i + 1}")
                for context in paragraphs[lo:hi]:
                    print(f"  [{context.get('style')}] {context['text']}")
        for table_i, table in enumerate(data["tables"], 1):
            for row_i, row in enumerate(table, 1):
                text = " | ".join(row)
                if term in text.casefold():
                    print(f"{data['file']} :: table {table_i} :: row {row_i} :: {text}")
