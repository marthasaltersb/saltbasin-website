#!/bin/bash
# One tracker sync for the current session: snapshot → tracker documents, history, exported state, and a
# push of whatever the release loop has committed. Run it on a loop while workflows run (every 3 minutes).
#
#   scripts/release-tracker-session-sync.sh
#
# Session setup (once, at the start of a new session — see the salt-basin-release-loop skill):
#   mkdir -p /var/tmp/sbpg/tracker
#   cp docs/release-log/tracker-carry.json /var/tmp/sbpg/tracker/carry-in.json   # earlier sessions' agents/rounds
#   one workflow run directory per line in /var/tmp/sbpg/tracker/run_dir
#   COMMIT_TRAILER in /var/tmp/sbpg/tracker/trailer.txt (this session's attribution lines)
#   this session's id in /var/tmp/sbpg/tracker/session.txt, after recording its estimate with
#   scripts/session-plan.mjs estimate (each sync then records new validated rounds against it)
# The bug ledger (docs/release-log/bug-ledger.json) and the carry file are committed, so the next session
# starts from everything this one knew. The carry-in copy is fixed for the session so nothing counts twice.
set -u
cd "$(dirname "$0")/.."
T=/var/tmp/sbpg/tracker
BRANCH=$(node -e 'console.log(require("./docs/release-log/active-release.features.json").integrationBranch)')
FEATURES=$(node -e 'console.log(require("./docs/release-log/active-release.features.json").features.map(f=>f.key).concat("whole-app-sweep").join(","))')
RUNS=(); while read -r d; do [ -n "$d" ] && RUNS+=(--run "$d"); done < "$T/run_dir"
CARRY=(); [ -f "$T/carry-in.json" ] && CARRY=(--carry "$T/carry-in.json")
node scripts/release-tracker-sync.mjs "${RUNS[@]}" "${CARRY[@]}" \
  --ledger docs/release-log/bug-ledger.json --carry-out docs/release-log/tracker-carry.json \
  --repo-url "$(node -e 'console.log(require("./docs/release-log/active-release.features.json").repoUrl)')" \
  --features "$FEATURES" --out "$T/snapshot.json" || exit 1
# Tracker documents: tracker/current (everything but bugs), tracker/bugs, tracker/history — field "json".
python3 -c "
import json;o=json.load(open('$T/snapshot.json'));b=o.pop('bugs',[]);o['bugsSeparate']=True
json.dump({'json':json.dumps(o,separators=(',',':'))},open('$T/doc.json','w'));"
python3 scripts/tracker_split_bugs.py $T/snapshot.json $T/bugs-doc
node scripts/release-history.mjs --current "$T/snapshot.json" >/dev/null && python3 -c "
import json;s=open('docs/release-log/history.json').read();json.dump({'json':s},open('$T/history-doc.json','w'))"
# Commit and push only under the shared merge lock and never during a merge.
if mkdir /var/tmp/sbpg/integrate.lockdir 2>/dev/null; then
  if [ ! -f .git/MERGE_HEAD ]; then
    # This session's estimate (scripts/session-plan.mjs): record each merge's test results against it.
    [ -s "$T/session.txt" ] && node scripts/session-plan.mjs merge --session "$(cat "$T/session.txt")" --if-new >/dev/null
    node scripts/release-loop-resume.mjs --export "$T/snapshot.json" >/dev/null
    node scripts/release-tracker-markdown.mjs "$T/snapshot.json" --out docs/release-log/release-tracker.md
    git add docs/release-log docs/test-results docs/triage docs/spec-amendments docs/training/baselines 2>/dev/null
    git diff --cached --quiet || git commit -q -F - <<MSG
Release loop state: bugs, fixes and verification as of $(date -u +%Y-%m-%dT%H:%MZ)

$(cat "$T/trailer.txt" 2>/dev/null)
MSG
    [ -n "$(git log --oneline @{u}..HEAD 2>/dev/null)" ] && git push -q origin "$BRANCH" 2>&1 | tail -1 && echo "pushed $(git rev-parse --short HEAD)"
  fi
  rmdir /var/tmp/sbpg/integrate.lockdir
fi
