// Snapshot comparison for QR-shared documents (2026-10-02). A shared
// document's chart data has an approved (printed) state, an append-only
// history of later Career Master states, and a live state. This module
// decides what counts as a change between any two of them — used by the
// server (to record history only when something actually changed) and by
// the QR page (to call out every difference from the printed version).
// Pure; safe on server and client.

function rowKey(chartKind, row) {
  // Company + start year identifies a role, so a retitled role reads as
  // "changed" (not removed + added) and two roles at one employer stay apart.
  if (chartKind === 'timeline') return `${row.label}|${row.start || ''}`;
  return row.label;
}

function rowValue(chartKind, row, currentYear) {
  if (chartKind === 'timeline') return `${row.sublabel ? `${row.sublabel}, ` : ''}${row.start}–${row.end || 'present'}${row.category ? ` · ${row.category}` : ''}`;
  if (chartKind === 'trend') return String(row.value);
  if (chartKind === 'proficiency') return `${row.levelLabel || row.ordinal}${row.userDefined ? ' (user-defined)' : ''}`;
  return JSON.stringify(row);
}

function rowsOf(chart) {
  if (!chart) return [];
  if (chart.kind === 'trend') return chart.series || [];
  return chart.rows || [];
}

/** Stable fingerprint of a snapshot's chart data (order-insensitive per chart). */
export function snapshotFingerprint(snapshot) {
  const charts = (snapshot?.charts || []).map((c) => ({
    key: c.key,
    rows: rowsOf(c).map((r) => `${rowKey(c.kind, r)}=${rowValue(c.kind, r)}`).sort(),
    footnote: c.footnote || null,
  })).sort((a, b) => a.key.localeCompare(b.key));
  return JSON.stringify(charts);
}

/**
 * Every difference between `base` (normally the approved/printed snapshot)
 * and `target`. Returns [{ chartKey, chartTitle, change: 'added'|'removed'|'changed', label, from, to }].
 */
export function diffSnapshots(base, target) {
  const out = [];
  const baseCharts = new Map((base?.charts || []).map((c) => [c.key, c]));
  const targetCharts = new Map((target?.charts || []).map((c) => [c.key, c]));
  const keys = [...new Set([...baseCharts.keys(), ...targetCharts.keys()])];
  for (const key of keys) {
    const a = baseCharts.get(key);
    const b = targetCharts.get(key);
    const title = (b || a).title;
    const kind = (b || a).kind;
    if (!a) { out.push({ chartKey: key, chartTitle: title, change: 'added', label: 'Whole chart', from: null, to: 'now shown' }); continue; }
    if (!b) { out.push({ chartKey: key, chartTitle: title, change: 'removed', label: 'Whole chart', from: 'was shown', to: null }); continue; }
    if (kind === 'trend') {
      // A series reads as one change, not one line per point: latest value
      // printed → now, plus how many points moved.
      const aPts = new Map(rowsOf(a).map((r) => [r.label, r]));
      const bPts = rowsOf(b);
      const moved = bPts.filter((r) => !aPts.has(r.label) || String(aPts.get(r.label).value) !== String(r.value)).length
        + rowsOf(a).filter((r) => !bPts.some((x) => x.label === r.label)).length;
      if (moved) {
        const lastA = rowsOf(a)[rowsOf(a).length - 1];
        const lastB = bPts[bPts.length - 1];
        out.push({
          chartKey: key, chartTitle: title, change: 'changed',
          label: `Latest (${lastB?.label ?? lastA?.label})`,
          from: lastA ? `${lastA.value}${a.unit || ''}` : null,
          to: lastB ? `${lastB.value}${b.unit || ''}` : null,
          note: `${moved} of ${Math.max(bPts.length, rowsOf(a).length)} points differ`,
        });
      }
      continue;
    }
    const aRows = new Map(rowsOf(a).map((r) => [rowKey(kind, r), r]));
    const bRows = new Map(rowsOf(b).map((r) => [rowKey(kind, r), r]));
    for (const [k, r] of bRows) {
      if (!aRows.has(k)) out.push({ chartKey: key, chartTitle: title, change: 'added', label: r.label, from: null, to: rowValue(kind, r) });
      else {
        const from = rowValue(kind, aRows.get(k));
        const to = rowValue(kind, r);
        if (from !== to) out.push({ chartKey: key, chartTitle: title, change: 'changed', label: r.label, from, to });
      }
    }
    for (const [k, r] of aRows) {
      if (!bRows.has(k)) out.push({ chartKey: key, chartTitle: title, change: 'removed', label: r.label, from: rowValue(kind, r), to: null });
    }
  }
  return out;
}
