#!/bin/bash
# Sync the tracker snapshot, export the resumable state, and push new merges/fixes so they are trackable on GitHub.
cd /home/user/saltbasin-website
B=/root/.claude/projects/-home-user-saltbasin-website/77895240-407e-5497-987d-efb7f6a2377f/subagents/workflows
RUNS=(); while read -r d; do [ -n "$d" ] && RUNS+=(--run "$d"); done < /var/tmp/sbpg/tracker/run_dir
node scripts/release-tracker-sync.mjs --archive $B/wf_110212af-7fb --archive $B/wf_79c26463-6ac --archive $B/wf_daae2dd0-210 --archive $B/wf_dc3e1576-f25 --archive $B/wf_ef25c788-71f --archive $B/wf_6dcde88f-bf2 --archive $B/wf_d0ea50d0-427 --archive $B/wf_2ddc8d47-e6b --archive $B/wf_8e50e2ff-069 --archive $B/wf_96f700c0-027 --archive $B/wf_89d04565-a4d --archive $B/wf_a6ec3adb-0f3 --archive $B/wf_c01ca291-6d9 --archive $B/wf_f909e643-405 --archive $B/wf_bff678e7-c9d --archive $B/wf_a8e220b8-495 --archive $B/wf_5cdde0a9-e39 --archive $B/wf_631d307f-4da --archive $B/wf_efc75c82-f7f --archive $B/wf_89e4eff7-ded --archive $B/wf_c9338193-60d --archive $B/wf_473405f5-ac6 --archive $B/wf_3f46c031-628 "${RUNS[@]}" \
  --ledger /var/tmp/sbpg/tracker/bug-ledger.json --repo-url https://github.com/marthasaltersb/saltbasin-website \
  --features world-shell-navigation,career-bound-outputs,resume-rollups,chart-gallery,proficiency-live-qr,output-version-history,release-intelligence,in-app-release-loop,session-mapping,cover-letter-agent,qr-gated-outputs,no-silent-failures,release-loop-tooling,world-shell-layers,whole-app-sweep \
  --out /var/tmp/sbpg/tracker/snapshot.json || exit 1
python3 -c "
import json;s=open('/var/tmp/sbpg/tracker/snapshot.json').read();json.dump({'json':s},open('/var/tmp/sbpg/tracker/doc.json','w'))"
node scripts/release-history.mjs --current /var/tmp/sbpg/tracker/snapshot.json >/dev/null && python3 -c "
import json;s=open('/home/user/saltbasin-website/docs/release-log/history.json').read();json.dump({'json':s},open('/var/tmp/sbpg/tracker/history-doc.json','w'))"
# Push whatever the merge agents have committed, only when no merge is in progress.
if mkdir /var/tmp/sbpg/integrate.lockdir 2>/dev/null; then
  if [ ! -f .git/MERGE_HEAD ]; then
    node scripts/release-loop-resume.mjs --export /var/tmp/sbpg/tracker/snapshot.json >/dev/null
    node scripts/release-tracker-markdown.mjs /var/tmp/sbpg/tracker/snapshot.json --out docs/release-log/release-tracker.md
    git add docs/release-log/active-release.state.json docs/release-log/release-tracker.md docs/release-log/history.json docs/release-log/updates.json docs/release-log/updates.md docs/test-results docs/triage 2>/dev/null
    git diff --cached --quiet || git commit -q -m "Release loop state: bugs, fixes and verification as of $(date -u +%Y-%m-%dT%H:%MZ)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018Ys1sYcQEbja5JzWmjTPPM"
    [ -n "$(git log --oneline @{u}..HEAD 2>/dev/null)" ] && git push -q origin claude/zealous-meitner-5tuft5 2>&1 | tail -1 && echo "pushed $(git rev-parse --short HEAD)"
  fi
  rmdir /var/tmp/sbpg/integrate.lockdir
fi
