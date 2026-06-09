// Trajectory — calculus layer for the molecular model
//
// Extends bonds from binary (open/closed) to continuous (0.0 → 1.0)
// and adds time-aware properties derived from bond history:
//
//   position     — current bond state (0.0 = open, 1.0 = closed)
//   velocity     — rate of change (positive = closing, negative = opening/decaying)
//   acceleration — is velocity increasing or decreasing (momentum)
//   limit        — projected final state if current trajectory holds
//   eta          — estimated time to stability (null if diverging or stalled)
//
// Bond history shape:
//   [{ state: 0.0–1.0, timestamp: ms }, ...]   ordered oldest → newest
//
// A bond with only one history entry has position but no velocity.
// A bond with two entries has velocity but no acceleration.
// A bond with three or more entries has the full picture.

// ── position ──────────────────────────────────────────────────────────────────

export function position(bond) {
  if (!bond.history?.length) return bond.state === 'closed' ? 1.0 : 0.0;
  return bond.history[bond.history.length - 1].state;
}

// ── velocity ──────────────────────────────────────────────────────────────────
//
// Instantaneous rate of change — slope between the two most recent history points.
// Units: state-units per millisecond (multiply by 1000 for per-second)
//
// Positive = moving toward closed (good)
// Negative = decaying or being reopened
// Zero     = stalled

export function velocity(bond) {
  const h = bond.history;
  if (!h || h.length < 2) return 0;

  const prev = h[h.length - 2];
  const curr = h[h.length - 1];
  const dt   = curr.timestamp - prev.timestamp;

  if (dt === 0) return 0;
  return (curr.state - prev.state) / dt;
}

// ── acceleration ──────────────────────────────────────────────────────────────
//
// Rate of change of velocity — second derivative.
// Positive = gaining momentum (closing faster and faster)
// Negative = losing momentum (slowing down, may stall)
// Zero     = constant velocity

export function acceleration(bond) {
  const h = bond.history;
  if (!h || h.length < 3) return 0;

  const v1 = velocityBetween(h[h.length - 3], h[h.length - 2]);
  const v2 = velocityBetween(h[h.length - 2], h[h.length - 1]);
  const dt  = h[h.length - 1].timestamp - h[h.length - 2].timestamp;

  if (dt === 0) return 0;
  return (v2 - v1) / dt;
}

function velocityBetween(a, b) {
  const dt = b.timestamp - a.timestamp;
  return dt === 0 ? 0 : (b.state - a.state) / dt;
}

// ── limit ─────────────────────────────────────────────────────────────────────
//
// Projects the bond's final state if current trajectory holds.
// Uses a simple linear extrapolation — enough to classify convergence.
//
// Returns a value in [0.0, 1.0]:
//   ~1.0  = converging to closed
//   ~0.0  = converging to open / decaying
//   ~0.5  = stalled in the middle
//
// For a more accurate limit, use exponential decay modeling
// (bonds often close exponentially, not linearly).

export function limit(bond, horizonMs = 30 * 24 * 60 * 60 * 1000) {
  const v = velocity(bond);
  const p = position(bond);

  if (Math.abs(v) < 1e-10) return p;  // stalled — limit is current position

  const projected = p + v * horizonMs;
  return Math.max(0.0, Math.min(1.0, projected));  // clamp to [0, 1]
}

// ── eta ───────────────────────────────────────────────────────────────────────
//
// Estimated time (ms from now) until bond reaches stability threshold.
// Returns null if the bond is diverging, stalled, or already stable.
//
// threshold: what counts as "closed enough" — default 0.95

export function eta(bond, threshold = 0.95) {
  const v = velocity(bond);
  const p = position(bond);

  if (p >= threshold)         return 0;        // already stable
  if (v <= 0)                 return null;      // not moving toward closed
  if (limit(bond) < threshold) return null;     // won't reach threshold

  return (threshold - p) / v;  // ms until threshold
}

// ── trajectory ────────────────────────────────────────────────────────────────
//
// Full trajectory summary for a single bond.
// Classification:
//   converging   — moving toward closed, will get there
//   stalled      — not moving, not closed
//   diverging    — moving away from closed
//   stable       — already effectively closed (>= threshold)

export function trajectory(bond, threshold = 0.95) {
  const p   = position(bond);
  const v   = velocity(bond);
  const a   = acceleration(bond);
  const lim = limit(bond);
  const e   = eta(bond, threshold);

  let classification;
  if (p >= threshold)       classification = 'stable';
  else if (v > 0 && lim >= threshold) classification = 'converging';
  else if (Math.abs(v) < 1e-10)      classification = 'stalled';
  else                               classification = 'diverging';

  return { position: p, velocity: v, acceleration: a, limit: lim, eta: e, classification };
}

// ── moleculeTrajectory ────────────────────────────────────────────────────────
//
// Full trajectory summary for all bonds in a molecule.
// Returns the overall molecule health — the weakest bond determines stability.

export function moleculeTrajectory(molecule, threshold = 0.95) {
  const bonds = {};
  let overallClassification = 'stable';

  const priority = ['diverging', 'stalled', 'converging', 'stable'];

  for (const [name, bond] of Object.entries(molecule.bonds)) {
    const t = trajectory(bond, threshold);
    bonds[name] = t;

    // Overall = worst classification across all required bonds
    if (bond.required) {
      if (priority.indexOf(t.classification) < priority.indexOf(overallClassification)) {
        overallClassification = t.classification;
      }
    }
  }

  // Molecule-level ETA = slowest required converging bond
  const requiredETAs = Object.entries(bonds)
    .filter(([name]) => molecule.bonds[name].required)
    .map(([, t]) => t.eta)
    .filter(e => e !== null);

  const moleculeEta = requiredETAs.length > 0 ? Math.max(...requiredETAs) : 0;

  return {
    bonds,
    classification: overallClassification,
    eta: moleculeEta,
    stable: overallClassification === 'stable',
  };
}

// ── recordBondState ───────────────────────────────────────────────────────────
//
// Utility to append a new state observation to a bond's history.
// Call this whenever a bond changes — it's the data collection
// that makes all trajectory calculations possible.
//
// Keeps history to maxHistory entries to bound memory.

export function recordBondState(bond, newState, timestamp = Date.now(), maxHistory = 20) {
  if (!bond.history) bond.history = [];

  bond.history.push({ state: newState, timestamp });
  bond.state = newState >= 0.95 ? 'closed' : 'open';

  if (bond.history.length > maxHistory) {
    bond.history = bond.history.slice(-maxHistory);
  }

  return bond;
}

// ── trajectoryVector ──────────────────────────────────────────────────────────
//
// Extends the unified molecule vector with trajectory dimensions.
// Appended after the existing variable bond dims.
//
// Format per bond: [position, velocity_normalized, limit]
// velocity is normalized to [-1, 1] using a sigmoid so extreme velocities
// don't dominate the vector space.

export function trajectoryVector(molecule) {
  const dims = [];

  for (const bond of Object.values(molecule.bonds)) {
    const p = position(bond);
    const v = normalizeVelocity(velocity(bond));
    const l = limit(bond);
    dims.push(p, v, l);
  }

  return new Float32Array(dims);
}

function normalizeVelocity(v) {
  // Sigmoid normalization — maps any velocity to (-1, 1)
  return 2 / (1 + Math.exp(-v * 1e6)) - 1;
}
