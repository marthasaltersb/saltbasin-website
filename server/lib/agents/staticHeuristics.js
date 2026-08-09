// Zero-API static analysis for the code_review agent. Runs on every scan,
// always, regardless of ANTHROPIC_API_KEY. Its job is twofold:
//   1. Produce findings that don't need judgment (test-gap detection).
//   2. Flag *candidates* worth escalating to Claude for real classification —
//      the agent only calls the API on runs where this layer found something,
//      and only sends the flagged files, not the full scanned set. A file
//      with nothing suspicious never touches the API.
// These heuristics can only say "this looks like it might be worth a look" —
// they cannot classify SHOULD BECOME CONFIGURATION vs INTENTIONAL PLATFORM
// CONSTANT (that requires understanding intent, which is exactly what the
// API escalation is for). Every finding from this file is labeled as such so
// nobody mistakes a regex match for a config-audit-skill judgment.

// Files that live in an established config/data directory ARE the
// configuration layer and are expected to hold the literals other files
// shouldn't — scanning them for "magic numbers" would just flag the config
// system itself. Test-gap detection still applies to these paths; only the
// hardcoded-value heuristics skip them.
//
// Deliberately NOT keyed on filename (e.g. a blanket "*Registry.js" skip) —
// a file named *Registry.js outside src/config or src/data or server/data is
// exactly the shape of thing this agent should catch: a registry that isn't
// actually data-driven yet. server/lib/agentContextRegistry.js is a real
// example this heuristic used to wrongly exempt, caught by end-to-end
// testing 2026-08-06 (see agent_hub_feature memory) — its own filename
// looked like "the config layer" but the config-audit skill explicitly
// calls it out as a primary audit target, not a solved surface.
const CONFIG_LAYER_PATTERN = /(^|\/)(config|data)\//;

const HEX_COLOR_RE = /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/g;
const TIMING_CONST_RE = /\b([A-Z][A-Z0-9_]*(?:_MS|_TTL|_TIMEOUT|_LIMIT|_MAX|_MIN|_INTERVAL|_DELAY))\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*[,;]/g;
const VOCAB_CONST_RE = /\bconst\s+([A-Z][A-Z0-9_]*(?:_POLICIES|_STATES|_RULES|_TYPES|_OPTIONS|_CONFIG))\s*=\s*(\[|\{|Object\.freeze)/g;
const SWITCH_CASE_RE = /\bcase\s+['"`]/g;
const EXPORTED_FUNCTION_RE = /\bexport\s+(default\s+)?(async\s+)?function\s+\w+|\bexport\s+const\s+\w+\s*=\s*(async\s*)?\(/g;

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

// Returns test-gap findings — files in scope with no sibling *.test.js.
export function detectTestGaps(excerpts) {
  return excerpts
    .filter((f) => !f.hasTest)
    .map((f) => ({ filePath: f.path, title: 'No sibling *.test.js file found' }));
}

// Returns { filePath, line, pattern, snippet } candidates for hardcoded /
// non-configurable values — unclassified, heuristic-only.
export function detectHardcodedCandidates(excerpts) {
  const candidates = [];
  for (const f of excerpts) {
    if (CONFIG_LAYER_PATTERN.test(f.path)) continue;

    let match;
    HEX_COLOR_RE.lastIndex = 0;
    const hexHits = [];
    while ((match = HEX_COLOR_RE.exec(f.content))) hexHits.push(match);
    if (hexHits.length) {
      candidates.push({
        filePath: f.path, line: lineOf(f.content, hexHits[0].index), pattern: 'inline-hex-color',
        snippet: `${hexHits.length} inline hex color literal(s), e.g. "${hexHits[0][0]}"`,
      });
    }

    TIMING_CONST_RE.lastIndex = 0;
    while ((match = TIMING_CONST_RE.exec(f.content))) {
      candidates.push({
        filePath: f.path, line: lineOf(f.content, match.index), pattern: 'magic-timing-constant',
        snippet: `${match[1]} = ${match[2]}`,
      });
    }

    VOCAB_CONST_RE.lastIndex = 0;
    while ((match = VOCAB_CONST_RE.exec(f.content))) {
      candidates.push({
        filePath: f.path, line: lineOf(f.content, match.index), pattern: 'domain-vocabulary-literal',
        snippet: `const ${match[1]} = ${match[2]}...`,
      });
    }

    SWITCH_CASE_RE.lastIndex = 0;
    const caseCount = (f.content.match(SWITCH_CASE_RE) || []).length;
    if (caseCount >= 4) {
      candidates.push({
        filePath: f.path, line: null, pattern: 'switch-chain-on-literal',
        snippet: `${caseCount} case branches keyed on string literals in this file`,
      });
    }
  }
  return candidates;
}

// Picks the best test-gap files to propose Jest tests for: has no test, and
// exports at least one function-shaped value worth exercising. Sorted by
// export count so the richest file (most likely to be worth testing) wins.
export function pickTestCandidates(excerpts, { max = 2 } = {}) {
  return excerpts
    .filter((f) => !f.hasTest)
    .map((f) => ({ file: f, exportCount: (f.content.match(EXPORTED_FUNCTION_RE) || []).length }))
    .filter((x) => x.exportCount > 0)
    .sort((a, b) => b.exportCount - a.exportCount)
    .slice(0, max)
    .map((x) => x.file);
}
