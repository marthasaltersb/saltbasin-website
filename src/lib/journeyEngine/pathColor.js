// Deterministic permanent path-color identity (see spec: same semantic path
// -> same color across journeys/rods/users/sessions, never derived from
// array order or object identity).
//
// The three named rod types get pinned brand colors (so "revenue" always
// reads terracotta, never a hash coincidence). Everything else — molecule
// ids, branch ids, master-data-rod ids — resolves through a stable hash into
// a small brand-safe fallback palette, so a new molecule type still gets a
// consistent, repeatable identity without anyone hand-assigning it a color.

export const PINNED_PATH_COLORS = {
  revenue: 0xC4843A, // terracotta / --sb-gold
  customer: 0x4A7C8E, // steel teal / --sb-teal
  member: 0x8C6B7A, // dusty mauve / --sbh-mauve
};

export const FALLBACK_PATH_PALETTE = [0x8A8072, 0xE8DCC4, 0xC4843A, 0x4A7C8E, 0x8C6B7A, 0xDDAA66];

// Reserved override: conflicts/risk always render this color regardless of
// which rod/molecule they belong to.
export const RISK_COLOR = 0xB23A2E;

function stableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

export function resolvePathColor(pathId, { pinned = PINNED_PATH_COLORS, palette = FALLBACK_PATH_PALETTE } = {}) {
  if (pinned[pathId] != null) return pinned[pathId];
  const hash = stableHash(String(pathId));
  return palette[hash % palette.length];
}
