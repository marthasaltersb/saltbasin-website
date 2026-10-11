#!/usr/bin/env python3
"""Graphify data model map: the Python half of scripts/graphify-data-model.mjs.

LOCAL ONLY, NO LLM, NO EXTERNAL API:
  1. code mode: graphify.extract.extract() (tree-sitter AST) over server/ and src/;
  2. graphify.pg_introspect.introspect_postgres() against a FRESH local database (schema + fictional seed rows);
  3. a read-only information_schema query for the column detail graphify's graph does not carry;
  4. a deterministic SQL-text scan of server/ to say which files use which table.
It writes <out>/catalog.json and <out>/graph.json and prints one JSON summary line. Run it with `python -I`.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from importlib import metadata
from pathlib import Path

CODE_EXT = {'.js', '.jsx', '.mjs'}


def rel(p, root):
    return str(Path(p).resolve().relative_to(root)).replace('\\', '/')


def read_mounts(root):
    """server/index.js: import xRouter from './routes/x.js'  +  app.use('/api/x', xRouter)."""
    text = (root / 'server' / 'index.js').read_text(encoding='utf-8', errors='replace')
    imports = dict((m.group(1), m.group(2)) for m in re.finditer(r"import\s+(\w+)\s+from\s+'\./routes/([\w./-]+)'", text))
    mounts = {}
    for m in re.finditer(r"app\.use\(\s*'(/[^']*)'\s*,(?:[^;]*?,)?\s*(\w+)\s*\)", text):
        var = m.group(2)
        if var in imports:
            mounts['server/routes/' + imports[var]] = m.group(1)
    return mounts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', required=True)
    ap.add_argument('--dsn', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--commit', default='unknown')
    ap.add_argument('--domains', required=True)
    a = ap.parse_args()
    root = Path(a.root).resolve()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    import psycopg
    from graphify.extract import extract
    from graphify.pg_introspect import introspect_postgres

    version = metadata.version('graphifyy')

    # ── 1. Postgres: graphify's own introspection + column detail ──────────────────────────────
    pg = introspect_postgres(a.dsn)
    graphify_ref_pairs = set()
    label_of = {n['id']: n['label'] for n in pg['nodes']}
    for e in pg['edges']:
        if e.get('relation') == 'references':
            s = label_of.get(e['source'], '').split('"."')[-1].strip('"')
            t = label_of.get(e['target'], '').split('"."')[-1].strip('"')
            if s and t:
                graphify_ref_pairs.add((s, t))

    conn = psycopg.connect(a.dsn)
    try:
        conn.execute('SET TRANSACTION READ ONLY')
        cur = conn.cursor()
        cur.execute("""SELECT table_name, table_type FROM information_schema.tables
                       WHERE table_schema = 'public' ORDER BY table_name""")
        kinds = {r[0]: ('view' if r[1] == 'VIEW' else 'table') for r in cur.fetchall()}
        cur.execute("""SELECT table_name, column_name, data_type, is_nullable, column_default, ordinal_position
                       FROM information_schema.columns WHERE table_schema = 'public'
                       ORDER BY table_name, ordinal_position""")
        cols = defaultdict(list)
        for t, c, d, n, df, _ in cur.fetchall():
            cols[t].append({'name': c, 'type': d, 'nullable': n == 'YES', 'hasDefault': df is not None})
        cur.execute("""SELECT rel.relname, con.contype, con.conname,
                         (SELECT array_agg(att.attname ORDER BY k.ord) FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum),
                         frel.relname,
                         (SELECT array_agg(att.attname ORDER BY k.ord) FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
                            JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = k.attnum)
                       FROM pg_constraint con
                       JOIN pg_class rel ON rel.oid = con.conrelid
                       JOIN pg_namespace ns ON ns.oid = rel.relnamespace
                       LEFT JOIN pg_class frel ON frel.oid = con.confrelid
                       WHERE ns.nspname = 'public' AND con.contype IN ('p', 'f')
                       ORDER BY rel.relname, con.conname""")
        pks, fks = defaultdict(list), []
        for rname, ctype, cname, ccols, frname, fcols in cur.fetchall():
            if ctype == 'p':
                pks[rname] = list(ccols or [])
            else:
                fks.append({'from': rname, 'columns': list(ccols or []), 'to': frname, 'toColumns': list(fcols or [])})
    finally:
        conn.close()

    fk_pairs = {(f['from'], f['to']) for f in fks}
    cross_check = {
        'graphifyReferenceEdges': len(graphify_ref_pairs),
        'foreignKeyTablePairs': len(fk_pairs),
        'agree': graphify_ref_pairs == fk_pairs,
        'onlyInGraphify': sorted('%s -> %s' % p for p in graphify_ref_pairs - fk_pairs),
        'onlyInCatalog': sorted('%s -> %s' % p for p in fk_pairs - graphify_ref_pairs),
    }

    # ── 2. Code mode: tree-sitter AST, no LLM ──────────────────────────────────────────────────
    files = sorted(
        p for d in ('server', 'src') for p in (root / d).rglob('*')
        if p.suffix in CODE_EXT and 'node_modules' not in p.parts and p.is_file()
    )
    code = extract(files, root=root)
    sym_count = defaultdict(int)
    for n in code['nodes']:
        sym_count[n.get('source_file')] += 1
    node_file = {n['id']: n.get('source_file') for n in code['nodes']}
    import_edges = set()
    for e in code['edges']:
        if e.get('relation') != 'imports_from':
            continue
        sf, tf = node_file.get(e['source']), node_file.get(e['target'])
        if sf and tf and sf != tf and sf.startswith(('server/', 'src/')) and tf.startswith(('server/', 'src/')):
            import_edges.add((sf, tf))

    # ── 3. Which files use which table (deterministic SQL-text scan of server/) ────────────────
    names = sorted(kinds)
    alt = '|'.join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    sql_re = re.compile(r'\b(?:FROM|JOIN|INTO|UPDATE|TABLE(?:\s+IF\s+NOT\s+EXISTS)?|REFERENCES|DELETE\s+FROM|ONLY)\s+"?(?:public\.)?(' + alt + r')\b(?!_)', re.I)
    json_re = re.compile(r'\b(?:getJSON|setJSON)\(\s*[\'"](' + alt + r')[\'"]')
    uses = defaultdict(set)
    for f in files:
        rf = rel(f, root)
        if not rf.startswith('server/') or rf == 'server/db.js' or rf.endswith('.test.js'):
            continue
        text = f.read_text(encoding='utf-8', errors='replace')
        for m in sql_re.finditer(text):
            uses[m.group(1).lower()].add(rf)
        for m in json_re.finditer(text):
            uses[m.group(1)].add(rf)

    mounts = read_mounts(root)
    importers = defaultdict(set)
    for s, t in import_edges:
        importers[t].add(s)

    def routes_for(files_using):
        direct, via = set(), set()
        for f in files_using:
            if f in mounts:
                direct.add(f)
        frontier = {f for f in files_using if f not in mounts}
        seen = set(frontier)
        for _ in range(1):
            nxt = set()
            for f in frontier:
                for imp in importers.get(f, ()):
                    if imp in mounts:
                        via.add(imp)
                    elif imp not in seen:
                        seen.add(imp)
                        nxt.add(imp)
            frontier = nxt
        return sorted(direct), sorted(via - direct)

    tables = []
    ref_by = defaultdict(list)
    for f in fks:
        ref_by[f['to']].append({'table': f['from'], 'columns': f['columns']})
    for name in names:
        fk_by_col = {}
        for f in fks:
            if f['from'] == name:
                for c, tc in zip(f['columns'], f['toColumns']):
                    fk_by_col[c] = {'table': f['to'], 'column': tc}
        columns = [dict(c, primaryKey=c['name'] in pks.get(name, []), references=fk_by_col.get(c['name'])) for c in cols[name]]
        direct, via = routes_for(uses.get(name, set()))
        used = sorted(uses.get(name, set()))
        tables.append({
            'name': name,
            'kind': kinds[name],
            'columns': columns,
            'primaryKey': pks.get(name, []),
            'references': sorted(({'table': f['to'], 'columns': f['columns'], 'toColumns': f['toColumns']} for f in fks if f['from'] == name), key=lambda r: (r['table'], r['columns'])),
            'referencedBy': sorted(ref_by.get(name, []), key=lambda r: (r['table'], r['columns'])),
            'usedBy': {
                'routes': [{'file': r, 'mount': mounts[r]} for r in direct],
                'routesViaModules': [{'file': r, 'mount': mounts[r]} for r in via],
                'modules': [u for u in used if u not in mounts],
            },
        })

    # ── 4. Condensed graph (committed): tables + files + edges, clustered by graphify ──────────
    import networkx as nx
    from graphify.cluster import cluster
    nodes, edges = [], []
    for t in tables:
        nodes.append({'id': 'table:' + t['name'], 'kind': t['kind'], 'label': t['name'], 'columns': len(t['columns'])})
    used_files = {f for u in uses.values() for f in u}
    keep_files = sorted(used_files | {s for s, _ in import_edges if s in used_files} | {t for _, t in import_edges if t in used_files})
    for f in sorted(set(keep_files) | set(mounts)):
        area = 'route' if f in mounts else ('lib' if f.startswith('server/lib/') else ('client' if f.startswith('src/') else 'server'))
        nodes.append({'id': 'file:' + f, 'kind': 'file', 'area': area, 'label': f, 'symbols': sym_count.get(f, 0)})
    file_ids = {n['id'] for n in nodes}
    for f in fks:
        edges.append({'source': 'table:' + f['from'], 'target': 'table:' + f['to'], 'relation': 'references', 'confidence': 'EXTRACTED', 'via': 'pg_introspect'})
    for s, t in sorted(import_edges):
        if 'file:' + s in file_ids and 'file:' + t in file_ids:
            edges.append({'source': 'file:' + s, 'target': 'file:' + t, 'relation': 'imports', 'confidence': 'EXTRACTED', 'via': 'ast'})
    for name in names:
        for f in sorted(uses.get(name, ())):
            edges.append({'source': 'file:' + f, 'target': 'table:' + name, 'relation': 'uses_table', 'confidence': 'EXTRACTED', 'via': 'sql-text-scan'})
    G = nx.Graph()
    for n in nodes:
        G.add_node(n['id'])
    for e in edges:
        if G.has_node(e['source']) and G.has_node(e['target']):
            G.add_edge(e['source'], e['target'])
    comms = cluster(G)
    comm_of = {}
    for cid, members in comms.items():
        for m in members:
            comm_of[m] = int(cid)
    for n in nodes:
        n['community'] = comm_of.get(n['id'])

    graph = {
        'schemaVersion': 1,
        'note': 'Condensed graph: tables, the server files that use them, and import edges. The full symbol-level AST graph is regenerated locally into graphify-out/ (git-ignored).',
        'nodes': nodes, 'edges': edges,
    }
    counts = {
        'tables': sum(1 for t in tables if t['kind'] == 'table'), 'views': sum(1 for t in tables if t['kind'] == 'view'),
        'columns': sum(len(t['columns']) for t in tables), 'foreignKeys': len(fks),
        'codeFilesScanned': len(files), 'codeSymbols': len(code['nodes']), 'codeEdges': len(code['edges']),
        'graphNodes': len(nodes), 'graphEdges': len(edges), 'communities': len(comms),
        'tablesWithNoCodeUse': sum(1 for t in tables if not t['usedBy']['modules'] and not t['usedBy']['routes']),
    }
    catalog = {
        'schemaVersion': 1,
        'graphify': {'package': 'graphifyy', 'version': version, 'modes': ['code (tree-sitter AST, no LLM)', 'postgres introspection (graphify.pg_introspect)'], 'llmPass': False, 'externalApis': False},
        'generatedFromCommit': a.commit,
        'source': 'fresh local database booted from server/db.js bootstrap + seed (schema and fictional seed rows only)',
        'counts': counts,
        'crossCheck': cross_check,
        'failedCodeSources': code.get('failed_sources') or [],
        'domainsDefault': json.loads(Path(a.domains).read_text(encoding='utf-8')),
        'tables': tables,
    }
    (out / 'catalog.json').write_text(json.dumps(catalog, indent=1, sort_keys=False) + '\n', encoding='utf-8')
    (out / 'graph.json').write_text(json.dumps(graph, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({'graphifyVersion': version, 'counts': counts, 'crossCheckAgrees': cross_check['agree']}))


if __name__ == '__main__':
    sys.exit(main())
