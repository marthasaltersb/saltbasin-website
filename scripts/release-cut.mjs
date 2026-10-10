#!/usr/bin/env node
// Close a release and open the next one.
//
//   node scripts/release-cut.mjs --next-version 0.3.0 --next-release <name> --next-title "<title>" \
//        [--add docs/release-log/next-features.json] [--snapshot /var/tmp/sbpg/tracker/snapshot.json]
//
// 1. FREEZE: copies every release-log file of the open release into docs/release-log/releases/<version>/
//    and writes summary.json there (planned / delivered / carried features, bug counts, rounds, sessions with
//    their estimates and merge results). A frozen folder is never rewritten: the script refuses if it exists.
// 2. INDEX: appends the release to docs/release-log/releases/index.json (one row per release, so the tracker
//    can chart how many features each release actually delivered).
// 3. OPEN: rewrites active-release.features.json for the next version. Unfinished features are carried with
//    their definitions (kind "carried"); delivered features that still have open bugs are carried as
//    kind "carried_backlog" (bugs never disappear, but they are not re-validated unless a bug needs it);
//    --add appends new feature definitions (kind "new"). updates.json/md start empty for the new release.
//    The bug ledger and tracker-carry.json stay continuous across releases.
// Fictional data only (public repo).
import fs from 'node:fs';
import path from 'node:path';

import * as rc from '../server/lib/releaseCut.js';

// --root <dir> = SB_RELEASE_ROOT: use another folder that holds docs/ (the training spec's fixture).
{ const i = process.argv.indexOf('--root'); if (i >= 0 && process.argv[i + 1]) process.env.SB_RELEASE_ROOT = path.resolve(process.argv[i + 1]); }

// SB_RELEASE_ROOT=<dir> points the cut at another folder that holds docs/ (the training spec's fixture uses it).
const root = rc.releaseRoot();
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const LOG = path.join(root, 'docs/release-log');
const rd = (p, d = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const nextVersion = opt('--next-version');
if (!nextVersion) { console.error('--next-version is required'); process.exit(2); }
const defs = rd(path.join(LOG, 'active-release.features.json'));
const state = rd(path.join(LOG, 'active-release.state.json'), { features: {}, bugs: [] });
const version = defs.version;
const dir = path.join(LOG, 'releases', version);
if (fs.existsSync(dir)) { console.error(`releases/${version} already exists; a frozen release is never rewritten.`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });

const FILES = ['active-release.features.json', 'active-release.state.json', 'bug-ledger.json', 'tracker-carry.json',
  'history.json', 'release-tracker.md', 'updates.json', 'updates.md'];
for (const f of FILES) if (fs.existsSync(path.join(LOG, f))) fs.copyFileSync(path.join(LOG, f), path.join(dir, f));
for (const f of fs.readdirSync(LOG)) if (/^\d{4}-\d{2}-\d{2}-.*\.md$/.test(f)) fs.copyFileSync(path.join(LOG, f), path.join(dir, f));
const snapPath = opt('--snapshot');
if (snapPath && fs.existsSync(snapPath)) fs.copyFileSync(snapPath, path.join(dir, 'tracker-snapshot.json'));

const features = rc.featureRows(defs, state);
const sessions = fs.existsSync(path.join(LOG, 'session-plans'))
  ? fs.readdirSync(path.join(LOG, 'session-plans')).filter((f) => f.endsWith('.json')).map((f) => rd(path.join(LOG, 'session-plans', f))).filter((p) => p && p.release === version)
  : [];
const sum = (k) => features.reduce((n, f) => n + f.bugs[k], 0);
const frozenCommit = rc.gitHead() || 'unknown';
const summary = {
  version, release: defs.release, title: defs.title, frozenAt: new Date().toISOString(), frozenCommit,
  startedAtCommit: defs.startedAtCommit || null,
  counts: {
    planned: features.length,
    delivered: features.filter((f) => f.delivered).length,
    carried: features.filter((f) => !f.delivered).length,
    newDelivered: features.filter((f) => f.delivered && f.kind === 'new').length,
    rounds: features.reduce((n, f) => n + (f.lastRound || 0), 0),
  },
  bugs: { verified: sum('verified'), open: sum('open'), backlog: sum('backlog'), needsPerson: sum('needsPerson') },
  features,
  sessions: sessions.map((p) => ({ session: p.session, intent: p.intent, estimate: p.estimate, merges: p.merges, closedAt: p.closedAt || null })),
  note: 'Frozen at the release cut. Scores are the last validated round against the pinned baseline; "delivered" means passed or passed_with_backlog. Fictional data only.',
};
fs.writeFileSync(path.join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const indexPath = path.join(LOG, 'releases/index.json');
const index = rd(indexPath, { releases: [] });
index.releases = index.releases.filter((r) => r.version !== version && r.version !== nextVersion);
index.releases.push({ version, release: defs.release, title: defs.title, state: 'frozen', frozenAt: summary.frozenAt, frozenCommit,
  planned: summary.counts.planned, delivered: summary.counts.delivered, carried: summary.counts.carried, newDelivered: summary.counts.newDelivered,
  bugsVerified: summary.bugs.verified, bugsOpen: summary.bugs.open, sessions: sessions.length, summary: `docs/release-log/releases/${version}/summary.json` });
index.releases.push({ version: nextVersion, release: opt('--next-release') || nextVersion, title: opt('--next-title') || null, state: 'open', startedAt: summary.frozenAt, startedAtCommit: frozenCommit });
index.updatedAt = summary.frozenAt;
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

const carried = defs.features.flatMap((f) => {
  const s = features.find((x) => x.key === f.key);
  if (!s.delivered) return [{ ...f, kind: 'carried', carriedFrom: version, build: `Carried from ${version} (last ${s.lastScore || 'not validated'} on baseline v${s.baseline ?? '?'}). ${f.build || ''}`.trim() }];
  if (s.bugs.open + s.bugs.needsPerson > 0) return [{ ...f, kind: 'carried_backlog', carriedFrom: version, build: `Delivered in ${version}. Only its open bugs are carried; re-validate only when a fix touches a frozen step.` }];
  return [];
});
const added = (rd(opt('--add') || '', { features: [] }).features || []).map((f) => ({ ...f, kind: 'new' }));
const next = { ...defs, release: opt('--next-release') || nextVersion, version: nextVersion, title: opt('--next-title') || defs.title,
  startedAtCommit: frozenCommit, previousRelease: version, features: [...carried, ...added] };
fs.writeFileSync(path.join(LOG, 'active-release.features.json'), `${JSON.stringify(next, null, 2)}\n`);
fs.writeFileSync(path.join(LOG, 'updates.json'), '[]\n');
fs.writeFileSync(path.join(LOG, 'updates.md'), `# Release ${nextVersion} updates\n\nNone yet. Release ${version} is frozen in docs/release-log/releases/${version}/.\n`);
console.log(`Froze ${version} at ${frozenCommit}: ${summary.counts.delivered}/${summary.counts.planned} delivered, ${summary.counts.carried} carried. Opened ${nextVersion} with ${next.features.length} features (${carried.length} carried, ${added.length} new).`);
