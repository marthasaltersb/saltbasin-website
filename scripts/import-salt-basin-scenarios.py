#!/usr/bin/env python3
"""Deterministically normalize the governed Salt Basin scenario workbook.

Uses only the Python standard library so CI does not need Excel-specific packages.
"""
import argparse, hashlib, json, re, zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
REL_NS = {'p': 'http://schemas.openxmlformats.org/package/2006/relationships'}
REQUIRED = {'Scenario Repository', 'Dimension Dictionary', 'Source Event Map', 'Atom-Molecule Map', 'Metric Registry 150', 'Reconciliation Map'}

def col_index(ref):
    letters = re.match(r'[A-Z]+', ref).group(0)
    n = 0
    for ch in letters: n = n * 26 + ord(ch) - 64
    return n - 1

def read_workbook(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared = [''.join(t.text or '' for t in si.findall('.//m:t', NS)) for si in root.findall('m:si', NS)]
        book = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        targets = {r.attrib['Id']: r.attrib['Target'] for r in rels.findall('p:Relationship', REL_NS)}
        sheets = {}
        for node in book.findall('m:sheets/m:sheet', NS):
            name = node.attrib['name']; target = targets[node.attrib['{'+NS['r']+'}id']].lstrip('/')
            if not target.startswith('xl/'): target = 'xl/' + target
            root = ET.fromstring(z.read(target)); rows = []
            for row in root.findall('.//m:sheetData/m:row', NS):
                values = {}
                for c in row.findall('m:c', NS):
                    idx = col_index(c.attrib['r']); kind = c.attrib.get('t'); v = c.find('m:v', NS)
                    if kind == 'inlineStr': value = ''.join(t.text or '' for t in c.findall('.//m:t', NS))
                    elif v is None: value = None
                    elif kind == 's': value = shared[int(v.text)]
                    elif kind == 'b': value = v.text == '1'
                    else:
                        raw = v.text
                        try: value = int(raw) if '.' not in raw else float(raw)
                        except ValueError: value = raw
                    values[idx] = value
                if values: rows.append([values.get(i) for i in range(max(values)+1)])
            sheets[name] = rows
        return sheets

def records(rows):
    header = rows[0]
    return [{str(k): (row[i] if i < len(row) else None) for i, k in enumerate(header) if k} for row in rows[1:] if any(v is not None for v in row)]

def split(value, delimiter=' | '): return [x.strip() for x in str(value or '').split(delimiter) if x.strip()]
def pairs(value, delimiter=' | '):
    out = []
    for item in split(value, delimiter):
        key, sep, val = item.partition('=')
        if sep: out.append({'path': key.strip(), 'value': val.strip()})
    return out
def policy(value):
    return {k.strip(): split(v.strip(), '+') if k.strip() == 'transform' else split(v.strip(), '|') if k.strip() == 'actions' else v.strip() for item in str(value or '').split(';') if (p := item.partition('='))[1] for k,v in [(p[0],p[2])]}
def stable_hash(value): return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
def signature(atoms):
    canonical = '|'.join(f"{a['path'].strip().lower()}={a['value'].strip()}" for a in sorted(atoms, key=lambda x: x['path'].strip().lower()))
    return {'id': 'SBSIG-' + hashlib.sha256(canonical.encode()).hexdigest(), 'canonical': canonical}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--workbook', default='data/scenarios/Salt_Basin_2400_Scenario_Repository.xlsx'); ap.add_argument('--output', default='generated/scenarios'); ap.add_argument('--validated-at'); ap.add_argument('--prior-registry'); args = ap.parse_args()
    source = Path(args.workbook); output = Path(args.output); output.mkdir(parents=True, exist_ok=True)
    raw = source.read_bytes(); workbook_hash = hashlib.sha256(raw).hexdigest(); sheets = read_workbook(source)
    missing = sorted(REQUIRED - set(sheets));
    if missing: raise SystemExit('Missing required sheets: ' + ', '.join(missing))
    dimensions = records(sheets['Dimension Dictionary']); atoms = records(sheets['Atom-Molecule Map']); metrics = records(sheets['Metric Registry 150']); controls = records(sheets['Reconciliation Map']); events = records(sheets['Source Event Map'])
    dim_by = {(d['Dimension'], str(d['Value'])): d for d in dimensions}; atom_by_path = {a['Atom_Path']: a for a in atoms}; atom_paths = set(atom_by_path); metric_by_name = {m['Metric_Name']: m['Metric_ID'] for m in metrics}; control_by_name = {c['Control_Name']: c['Control_ID'] for c in controls}; event_types = {e['Source_Event_Type'] for e in events}
    unresolved = []; normalized = []
    for row in records(sheets['Scenario Repository']):
        assignments = []
        for key, value in row.items():
            d = dim_by.get((key, str(value)))
            if d: assignments.append({'dimension': d['Dimension'], 'dimensionCode': d['Dimension_Code'], 'value': str(value), 'valueCode': d['Value_Code'], 'atomPath': d['Salt_Basin_Atom_Path'], 'molecule': d['Molecule']})
        expected_dimensions = {d['Dimension'] for d in dimensions}
        assigned_dimensions = {d['dimension'] for d in assignments}
        for name in sorted(expected_dimensions - assigned_dimensions): unresolved.append({'scenarioId': row['Scenario_ID'], 'type': 'dimension', 'value': name})
        atom_assignments = pairs(row['Atom_Metadata_Values']); sig = signature(atom_assignments)
        metric_refs = [{'metricId': metric_by_name.get(n), 'name': n} for n in split(row['Metric_Dependencies'])]
        control_refs = [{'controlId': control_by_name.get(n), 'name': n} for n in split(row['Reconciliation_Controls'])]
        sid = row['Scenario_ID']
        for a in atom_assignments:
            if a['path'] not in atom_paths: unresolved.append({'scenarioId': sid, 'type': 'atom', 'value': a['path']})
        molecules = split(row['Molecule_Groupings'])
        for molecule in molecules:
            members = [a for a in atoms if a.get('Molecule_Rollup') == molecule]
            if not members: unresolved.append({'scenarioId': sid, 'type': 'emptyMolecule', 'value': molecule})
        for d in assignments:
            mapped = atom_by_path.get(d['atomPath'])
            if mapped and mapped.get('Molecule_Rollup') != d['molecule']: unresolved.append({'scenarioId': sid, 'type': 'conflictingMolecule', 'value': d['atomPath']})
        for m in metric_refs:
            if not m['metricId']: unresolved.append({'scenarioId': sid, 'type': 'metric', 'value': m['name']})
        for c in control_refs:
            if not c['controlId']: unresolved.append({'scenarioId': sid, 'type': 'control', 'value': c['name']})
        if row['Source_Event_Type'] not in event_types: unresolved.append({'scenarioId': sid, 'type': 'sourceEvent', 'value': row['Source_Event_Type']})
        definition = {'scenarioId': sid, 'family': row['Scenario_Family'], 'title': row['Scenario_Title'], 'coverageTier': row['Coverage_Tier'], 'dimensions': assignments, 'sourceEvent': {'type': row['Source_Event_Type'], 'idPattern': row['Source_Event_ID_Pattern']}, 'journey': {'l1Journey': row['L1_Journey'], 'l2Dimensions': pairs(row['L2_Scenario_Dimensions'], '; '), 'l3Path': row['L3_End_to_End_Path']}, 'rodsOrChannels': split(row['Data_Rods_or_Channels']), 'atoms': atom_assignments, 'molecules': molecules, 'expectations': {'generatedEntitiesAndTransactions': split(row['Generated_Entities_and_Transactions']), 'reconciliationControls': control_refs, 'metricDependencies': metric_refs, 'propagationTargets': split(row['Dependency_Propagation_Targets'])}, 'temporalPolicy': {'requiredFields': split(row['Temporal_Metadata_Requirements'], ';')}, 'agentSecurityPolicy': policy(row['Agent_Security_Policy']), 'expectedStateTransition': row['Expected_State_Transition'], 'expectedVarianceBehavior': row['Expected_Exception_or_Variance'], 'fixtureSeedKey': row['Fixture_Seed_Key'], 'implementationStatus': row['Implementation_Status'], 'signature': sig}
        definition_hash = stable_hash(definition)
        normalized.append({**definition, 'version': 1, 'active': True, 'effectiveFrom': None, 'effectiveTo': None, 'sourceMetadata': {'workbookVersion': workbook_hash[:12], 'workbookHash': workbook_hash, 'definitionHash': definition_hash}})
    ids = [s['scenarioId'] for s in normalized]; duplicates = sorted({x for x in ids if ids.count(x) > 1}); sig_groups = {}
    for s in normalized: sig_groups.setdefault(s['signature']['id'], []).append(s['scenarioId'])
    duplicate_signatures = [{'signature': k, 'scenarioIds': v} for k,v in sig_groups.items() if len(v)>1]
    definition_changes = []
    if args.prior_registry:
        prior = json.loads(Path(args.prior_registry).read_text(encoding='utf-8'))
        prior_by_id = {s['scenarioId']: s for s in prior.get('scenarios', [])}
        for scenario in normalized:
            old = prior_by_id.get(scenario['scenarioId'])
            if old and old.get('sourceMetadata', {}).get('definitionHash') != scenario['sourceMetadata']['definitionHash']:
                definition_changes.append({'scenarioId': scenario['scenarioId'], 'priorDefinitionHash': old.get('sourceMetadata', {}).get('definitionHash'), 'newDefinitionHash': scenario['sourceMetadata']['definitionHash'], 'reviewStatus': 'review_required'})
    validation = {'valid': not duplicates and not unresolved and not definition_changes and len(normalized)==2400, 'scenarioCount': len(normalized), 'uniqueScenarioIds': len(set(ids)), 'uniqueSignatures': len(sig_groups), 'duplicateScenarioIds': duplicates, 'duplicateSignatures': duplicate_signatures, 'unresolvedMappings': unresolved, 'definitionChanges': definition_changes, 'workbookHash': workbook_hash, 'validatedAt': args.validated_at or datetime.now(timezone.utc).isoformat()}
    payloads = {'scenario-registry.json': {'schemaVersion': 1, 'sourceWorkbook': source.name, 'workbookHash': workbook_hash, 'scenarios': normalized}, 'scenario-dimensions.json': {'dimensions': dimensions, 'atomMoleculeMap': atoms}, 'scenario-mappings.json': {'sourceEvents': events, 'metrics': metrics, 'reconciliationControls': controls}, 'scenario-validation.json': validation}
    for name, payload in payloads.items(): (output/name).write_text(json.dumps(payload, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps(validation, indent=2))
    if not validation['valid']: raise SystemExit(1)

if __name__ == '__main__': main()
