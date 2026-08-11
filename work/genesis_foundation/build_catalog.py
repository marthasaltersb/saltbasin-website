import json
from pathlib import Path


ROOT = Path(__file__).parent / "extracted"
OUT = Path(__file__).parents[2] / "server" / "data" / "genesisCatalog.json"


def workbook(stem):
    return json.loads((ROOT / f"{stem}.json").read_text(encoding="utf-8"))


def normalized_sheet(book, name):
    sheet = next(item for item in book["sheets"] if item["name"] == name)
    rows = sheet["rows"]
    header_index = 2
    headers = [str(value) for value in rows[header_index]]
    records = []
    for row in rows[header_index + 1:]:
        if not row or row[0] is None:
            continue
        records.append({headers[i]: value for i, value in enumerate(row) if i < len(headers) and value is not None})
    return {"name": name, "description": rows[1][0] if len(rows) > 1 and rows[1] else "", "records": records}


science = workbook("Universal_Scientific_Repository_Fully_Normalized_v3.0")
enterprise = workbook("Enterprise_Operating_System_Scientific_Equivalent_Repository_v0.1")
control = workbook("Salt_Basin_Scientific_to_Enterprise_Mapping_Control_Layer_v0.2")

science_names = ["04_LEVELS", "05_CLASSIFICATIONS", "07_PROPERTIES", "08_VARIABLES", "09_UNITS", "11_EQUATIONS", "12_LAWS", "13_RELATION_TYPES", "23_EQUATION_VARIABLE", "30_TRANSFORMATIONS"]
enterprise_names = ["04_LEVELS", "05_CLASSIFICATIONS", "06_OBJECTS", "07_PROPERTIES", "08_VARIABLES", "09_UNITS", "11_EQUATIONS", "12_LAWS", "13_RELATION_TYPES", "23_EQUATION_VARIABLE", "25_LAW_APPLICABILITY", "30_TRANSFORMATIONS", "35_LINEAGE_EVENTS"]
control_names = [f"{i:02d}_" for i in range(40, 51)]
control_actual = [sheet["name"] for sheet in control["sheets"] if any(sheet["name"].startswith(prefix) for prefix in control_names)]

catalog = {
    "meta": {
        "program": "Salt Basin Genesis",
        "version": "1.0",
        "sourceVersions": {"scientific": "3.0", "enterprise": "0.1", "mapping": "0.2"},
        "recordLifecycle": ["proposed", "researched", "reviewed", "approved", "implemented", "validated", "superseded", "retired"],
        "authorityBoundary": "Scientific mechanisms inform mappings; enterprise and organization authority govern execution.",
    },
    "scientific": {"repositoryId": "R1", "label": "Scientific Foundation", "tables": [normalized_sheet(science, name) for name in science_names]},
    "enterprise": {"repositoryId": "R2", "label": "Enterprise Foundation", "tables": [normalized_sheet(enterprise, name) for name in enterprise_names]},
    "translation": {"repositoryId": "R3", "label": "Translation Compiler", "tables": [normalized_sheet(control, name) for name in control_actual]},
}
OUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
