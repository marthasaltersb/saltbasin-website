// Minimal 5-field cron matcher (minute hour day-of-month month day-of-week).
// node-cron's public API is built around `cron.schedule(expr, fn)` for a
// single fixed job, not "does this arbitrary stored cron string match right
// now" — which is what Agent Hub needs (schedules are per-definition and
// change at runtime via the admin UI). node-cron is still used for its
// `validate()` helper and to drive the scheduler's own once-a-minute tick;
// this file does the per-definition due-check. Day-of-month and day-of-week
// are ANDed rather than the traditional cron OR-when-both-restricted rule —
// an acceptable simplification for an internal admin scheduler where nearly
// every real schedule leaves at least one of those two fields as '*'.
function rangeArray(lo, hi, step) {
  const out = [];
  for (let v = lo; v <= hi; v += step) out.push(v);
  return out;
}

function expand(part, min, max) {
  if (part === '*') return rangeArray(min, max, 1);
  const stepMatch = part.match(/^(\*|\d+-\d+|\d+)\/(\d+)$/);
  if (stepMatch) {
    const [, base, stepStr] = stepMatch;
    const step = Number(stepStr);
    if (base === '*') return rangeArray(min, max, step);
    const [lo, hi] = base.split('-').map(Number);
    return rangeArray(lo, hi, step);
  }
  const rangeMatch = part.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) return rangeArray(Number(rangeMatch[1]), Number(rangeMatch[2]), 1);
  if (/^\d+$/.test(part)) return [Number(part)];
  throw new Error(`Unrecognized cron field segment "${part}"`);
}

function parseField(field, min, max) {
  const set = new Set();
  for (const part of field.split(',')) {
    for (const v of expand(part.trim(), min, max)) {
      if (v < min || v > max) throw new Error(`Cron field value ${v} out of range [${min},${max}]`);
      set.add(v);
    }
  }
  return set;
}

export function isValidCron(cronExpr) {
  if (typeof cronExpr !== 'string') return false;
  const fields = cronExpr.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  try {
    const [minute, hour, dom, month, dow] = fields;
    parseField(minute, 0, 59); parseField(hour, 0, 23);
    parseField(dom, 1, 31); parseField(month, 1, 12); parseField(dow, 0, 6);
    return true;
  } catch {
    return false;
  }
}

export function isCronDue(cronExpr, date = new Date()) {
  if (!isValidCron(cronExpr)) return false;
  const [minute, hour, dom, month, dow] = cronExpr.trim().split(/\s+/);
  return parseField(minute, 0, 59).has(date.getMinutes())
    && parseField(hour, 0, 23).has(date.getHours())
    && parseField(dom, 1, 31).has(date.getDate())
    && parseField(month, 1, 12).has(date.getMonth() + 1)
    && parseField(dow, 0, 6).has(date.getDay());
}
