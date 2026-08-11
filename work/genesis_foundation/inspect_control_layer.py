import json
from pathlib import Path


path = Path(__file__).parent / "extracted" / "Salt_Basin_Scientific_to_Enterprise_Mapping_Control_Layer_v0.2.json"
data = json.loads(path.read_text(encoding="utf-8"))
for sheet in data["sheets"]:
    if sheet["name"][:2].isdigit() and int(sheet["name"][:2]) >= 40:
        print(f"\n## {sheet['name']} ({sheet['max_row']}x{sheet['max_column']})")
        for row in sheet["rows"]:
            print(" | ".join("" if value is None else str(value) for value in row))
