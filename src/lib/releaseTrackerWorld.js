// Release tracker -> world graph adapter + its render bindings.
//
// Engine contract (src/lib/worldEngine/graphWorld.js, reusable for any dataset):
//   { root: { label, sub },
//     nodes: [{ id, label, sub, status, statusLabel, colorVar, weight 0..1, progress 0..1|null,
//               active, href, satellites: [{ id, label, catLabel, colorVar, pending, href }] }],
//     unmapped: [channel ids with no binding] }
// The engine knows nothing about releases. A new world (opportunities, Career
// Master, outputs) only needs its own adapter and binding set.
import { createBindingSet, isMapped } from './renderBindings.js';
import {
  BACKLOG, PERSON, PENDING, BUG_SERIES, statusText, pendingFor, fmtT,
} from './releaseTrackerModel.js';

const PORT = 'release-tracker';
const statusToneVar = (st) => (['passed', 'passed_with_backlog', 'verified'].includes(st) ? '--rt-good'
  : ['failing', 'done_unreconciled', 'not_passed_after_max_rounds'].includes(st) ? '--rt-bad'
    : PERSON.includes(st) ? '--rt-human'
      : ['queued', 'stopped', 'idle_or_done', 'failed'].includes(st) || !st ? '--rt-muted'
        : ['awaiting_retest', 'between_stages'].includes(st) ? '--rt-gold' : '--rt-teal');
const bugCat = (st) => (st === 'verified' ? 2 : BACKLOG.includes(st) ? 3 : PERSON.includes(st) ? 4 : 1);

export const TRACKER_BINDINGS = [
  {
    id: 'crystal.colour', mark: 'Crystal', channel: 'Colour', source: { portKey: PORT, objectKey: 'features', fieldKey: 'status' },
    transform: 'status → tone', legend: 'Feature status', changePolicy: 'live',
    value: (f, c) => statusToneVar(c.status ?? f.status), read: (f, c) => statusText(c.status ?? f.status),
  },
  {
    id: 'crystal.size', mark: 'Crystal', channel: 'Size', source: { portKey: PORT, objectKey: 'features', fieldKey: 'lastResult.stepsTotal' },
    transform: '÷ largest suite → 0.35–1', legend: 'Test steps in the suite', changePolicy: 'live',
    value: (f, c) => (c.total ? 0.35 + 0.65 * (c.total / c.maxSteps) : 0.3), read: (f, c) => (c.total ? `${c.total} steps` : 'not tested'),
  },
  {
    id: 'crystal.ring', mark: 'Crystal', channel: 'Gold ring', source: { portKey: PORT, objectKey: 'features', fieldKey: 'lastResult.stepsPassed ÷ stepsTotal' },
    transform: 'calculation → arc 0–1', legend: 'Share of steps passing', changePolicy: 'requires_approval', approver: 'a browser test round',
    value: (f, c) => (c.total ? c.passed / c.total : null), read: (f, c) => (c.total ? `${c.passed}/${c.total} (${Math.round((c.passed / c.total) * 100)}%)` : 'not tested'),
  },
  {
    id: 'crystal.river', mark: 'Crystal', channel: 'Bubble stream', source: { portKey: PORT, objectKey: 'agents', fieldKey: 'status = running (feature)' },
    transform: 'any → on/off', legend: 'An agent is working on it', changePolicy: 'live',
    value: (f, c) => !c.historic && (c.snap.agents || []).some((a) => a.feature === f.key && a.status === 'running'),
    read: (f, c) => ((c.snap.agents || []).some((a) => a.feature === f.key && a.status === 'running') ? 'yes' : 'no'),
  },
  {
    id: 'satellite.colour', mark: 'Satellite', channel: 'Colour', source: { portKey: PORT, objectKey: 'bugs', fieldKey: 'status' },
    transform: 'status → series', legend: 'Bug state', changePolicy: 'requires_approval', approver: 'the next browser re-test',
    value: (b) => `--rt-s${bugCat(b.status)}`, read: (f, c) => `${(c.snap.bugs || []).filter((x) => x.feature === f.key && x.status !== 'seen_in_test').length} bugs`,
  },
  {
    id: 'satellite.ghost', mark: 'Satellite', channel: 'Ghost (translucent)', source: { portKey: PORT, objectKey: 'bugs', fieldKey: 'status ∈ fixed_awaiting_retest, retesting' },
    transform: 'pending → translucent', legend: 'Fix proposed, awaiting re-test', changePolicy: 'requires_approval', approver: 'the next browser re-test',
    value: (b) => PENDING.includes(b.status), read: (f, c) => `${pendingFor(c.snap, f.key).length} pending`,
  },
];
export const trackerBindings = createBindingSet('release-world', TRACKER_BINDINGS);

/** Data-map rows for one feature crystal (or, with no feature, the channel catalogue). */
export function dataMapFor(snap, feature) {
  const ctx = feature ? contextFor(snap, feature, null) : { snap };
  return trackerBindings.dataMap(feature, ctx);
}

export function contextFor(snap, f, h, maxSteps) {
  const total = h ? h[3] : f.lastResult?.stepsTotal;
  const passed = h ? h[2] : f.lastResult?.stepsPassed;
  return { snap, status: h ? h[0] : f.status, total, passed, maxSteps: maxSteps || Math.max(1, total || 1), historic: !!h };
}

/**
 * Adapter: tracker -> world graph. Live uses the snapshot (individual bugs, running agents); an earlier
 * slider point uses the recorded history (counts per category), where no individual bug exists.
 */
export function trackerGraph({ snap, hist, pointIdx, href }) {
  const live = !hist || pointIdx == null || pointIdx >= hist.points.length - 1;
  const pt = hist && !live ? hist.points[pointIdx] : null;
  const feats = snap.features.filter((f) => f.key !== 'whole-app-sweep');
  const maxSteps = Math.max(1, ...feats.map((f) => f.lastResult?.stepsTotal || 0), ...(pt ? Object.values(pt.f).map((v) => v[3] || 0) : []));
  const unmapped = new Set();
  const pick = (id, entity, ctx, fallback) => {
    const v = trackerBindings.resolve(id, entity, ctx);
    if (isMapped(v)) return v;
    unmapped.add(id); return fallback;
  };
  const nodes = feats.map((f) => {
    const h = pt?.f[f.key];
    const ctx = contextFor(snap, f, h, maxSteps);
    let satellites;
    if (h) {
      satellites = [];
      BUG_SERIES.forEach((s, ci) => {
        const n = s.idx === 4 ? h[4] - h[7] : h[s.idx];
        for (let i = 0; i < Math.min(n, 14); i += 1) satellites.push({ id: `${f.key}-${ci + 1}-${i}`, label: s.label, catLabel: s.label, colorVar: `--rt-s${ci + 1}`, pending: false, href: href('feature', f.key) });
      });
    } else {
      satellites = (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test').map((b) => ({
        id: b.id, label: `${b.id}: ${b.step || ''}`, catLabel: BUG_SERIES[bugCat(b.status) - 1].label,
        colorVar: pick('satellite.colour', b, ctx, '--rt-muted'), pending: !!pick('satellite.ghost', b, ctx, false), href: href('bug', b.id),
      }));
    }
    return {
      id: f.key, label: f.key, status: ctx.status, statusLabel: statusText(ctx.status),
      sub: ctx.total ? `${ctx.passed}/${ctx.total} steps` : 'not tested yet',
      colorVar: pick('crystal.colour', f, ctx, '--rt-muted'),
      weight: pick('crystal.size', f, ctx, 0.3),
      progress: pick('crystal.ring', f, ctx, null),
      active: !!pick('crystal.river', f, ctx, false),
      href: href('feature', f.key), satellites,
    };
  });
  return {
    root: { label: snap.release?.version ? `Release ${snap.release.version}` : 'Release', sub: pt ? `as of ${fmtT(pt.t)} UTC` : 'live' },
    nodes, unmapped: [...unmapped],
  };
}

/** What changes, everywhere, when a pending change is approved (computed from the bindings, not stored). */
export function impactOf(snap, bug) {
  const f = snap.features.find((x) => x.key === bug.feature);
  return [
    `Satellite ${bug.id}: colour ${BUG_SERIES[0].label} → ${BUG_SERIES[1].label}; no longer translucent`,
    'Tiles and trend lines: Open (this work) −1, Verified fixed +1',
    `Crystal ${bug.feature}: gold ring and size update from the re-test result (now ${f?.lastResult ? `${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal}` : 'not tested'})`,
    `Board: bug layer, feature layer, ${f ? statusText(f.status) : ''} → new status after the round; history keeps both states`,
  ];
}

/** Feature key whose crystal the current path focuses (feature, round, bug or agent layer), or null. */
export function worldFocusId(path, snap, splitTok) {
  for (const t of [...path].reverse()) {
    const [type, a] = splitTok(t);
    if (type === 'feature' || type === 'round') return a;
    if (type === 'bug') return (snap.bugs || []).find((b) => b.id === a)?.feature || null;
    if (type === 'agent') return (snap.agents || []).find((x) => x.id === a)?.feature || null;
  }
  return null;
}

/**
 * Resolver the shared world engine (src/lib/trackerWorld/trackerWorldEngine.js) calls for every mapped channel:
 * the value when the channel is bound, undefined for "not mapped" (the engine then draws the neutral fallback).
 */
export function makeTrackerBind(snap) {
  return (id, entity, hctx) => {
    const f = snap.features.find((x) => x.key === (entity.key ?? entity.feature));
    if (!f) return undefined;
    const v = trackerBindings.resolve(id, entity, contextFor(snap, f, hctx.hist, hctx.maxSteps));
    return isMapped(v) ? v : undefined;
  };
}
