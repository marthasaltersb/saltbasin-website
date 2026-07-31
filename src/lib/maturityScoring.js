// Computes real, weighted content-density scores instead of hand-picked
// maturity numbers. Every place the 3D crystal experience colors, sizes, or
// orders something by "how defined is this" should get that number from
// here — never hardcode one.
//
// The model is deliberately generic: give it a bag of captured fields and a
// weight per field, and it returns how much of that weight is actually
// present (0-1). The same function scores a homepage section's CMS
// completeness today and a business-definition workshop's captured metadata
// atoms later — only the field/weight schema differs (see
// crystalExperienceConfig.js `dataDensity`), not the math.

function isFieldPresent(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim().length > 0;
}

// weights: { fieldKey: weight }. Optional per-field confidence (0-1) can be
// supplied via `confidence[fieldKey]` — omitted fields are treated as fully
// confident once present, since not every schema tracks confidence yet.
export function scoreFieldDensity(fields = {}, weights = {}, confidence = {}) {
  const entries = Object.entries(weights);
  if (!entries.length) return 0;
  let totalWeight = 0;
  let earnedWeight = 0;
  entries.forEach(([key, weight]) => {
    totalWeight += weight;
    if (isFieldPresent(fields[key])) {
      const fieldConfidence = confidence[key] ?? 1;
      earnedWeight += weight * Math.max(0, Math.min(1, fieldConfidence));
    }
  });
  return totalWeight > 0 ? earnedWeight / totalWeight : 0;
}

// Scores one dimension (a named subset of the full field-weight map) so the
// same captured fields can drive several independent 0-1 scores at once —
// this is what powers the six HOS metadata-dimension nodes in the New World
// reveal, each scored from a different slice of the same real content.
function scoreDimension(fields, dimensionKeys, weights, confidence) {
  const subWeights = {};
  dimensionKeys.forEach((key) => { subWeights[key] = weights[key] ?? 1; });
  return scoreFieldDensity(fields, subWeights, confidence);
}

// destination: { rawSection: { fields } } (the shape ProductHeroBlock builds).
// densityConfig: config.dataDensity (fieldWeights + dimensionFieldMap).
// Returns { overall, dimensions: [{ id, maturity }] }.
export function scoreDestinationMaturity(destination, densityConfig, confidence = {}) {
  const fields = destination?.rawSection?.fields || destination?.rawSection || {};
  const overall = scoreFieldDensity(fields, densityConfig.fieldWeights, confidence);
  const dimensions = Object.entries(densityConfig.dimensionFieldMap).map(([id, keys]) => ({
    id,
    maturity: scoreDimension(fields, keys, densityConfig.fieldWeights, confidence),
  }));
  return { overall, dimensions };
}

// Looks up which named maturity band (Unresolved/Observed/.../Trusted) a 0-1
// score falls into, using the same bands the color spectrum legend shows.
// Bands are half-open [min, max) so a score sitting exactly on a boundary
// belongs to the band it opens, not the one it closes. With inclusive-both-ends
// matching, 0.6 satisfied both [0.4, 0.6] and [0.6, 0.8] and the earlier band
// won — so a fully Reconciled (level 3) chain rendered as Reproducible (level
// 2). The top band stays closed at 1 so a perfect score has a home.
export function maturityBandFor(score, bands = []) {
  if (!bands.length) return null;
  const last = bands[bands.length - 1];
  return bands.find((band) => score >= band.min && (score < band.max || (band === last && score <= band.max))) || last;
}
