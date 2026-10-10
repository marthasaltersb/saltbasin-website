# Split the tracker bug list into tracker/bugs and tracker/bugs-2 (each under the artifact per-document limit).

import json
def split_bugs(b, base):
    # Two documents, each under the 256 KB per-document limit (field "json").
    lim=240000; a=[]; size=2
    for i,x in enumerate(b):
        n=len(json.dumps(json.dumps(x,separators=(',',':'))))-1  # size once escaped inside the "json" string field
        if size+n>lim: break
        a.append(x); size+=n
    rest=b[len(a):]
    json.dump({'json':json.dumps(a,separators=(',',':'))},open(base+'.json','w'))
    json.dump({'json':json.dumps(rest,separators=(',',':'))},open(base+'-2.json','w'))

if __name__ == '__main__':
    import sys
    src, base = sys.argv[1], sys.argv[2]
    o = json.load(open(src)); b = o if isinstance(o, list) else json.loads(o['json']) if 'json' in o else o.get('bugs', [])
    split_bugs(b, base)
