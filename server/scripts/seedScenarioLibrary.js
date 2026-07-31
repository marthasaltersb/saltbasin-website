// Applies the `scenario-library` Config Envelope into journey_scenarios and
// journey_gate_definitions. Safe to rerun — scenarios upsert on scenario_key,
// gates on (scenario_id, stage_key), so a second run reports the same counts
// and changes nothing.
//
// Reads the ENVELOPE, not the file directly, so a saved admin override is what
// gets applied — running this after editing the library in the admin UI does
// what you'd expect.
//
// Usage:
//   node server/scripts/seedScenarioLibrary.js            # apply
//   node server/scripts/seedScenarioLibrary.js --dry-run  # check references only
import 'dotenv/config';
import { resolveConfigEnvelope } from '../lib/configEnvelope.js';
import { applyScenarioLibrary } from '../lib/scenarioLibraryApply.js';
import '../lib/methodologyEnvelopes.js'; // side effect: registers the envelopes

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const { value, source } = await resolveConfigEnvelope('scenario-library');
  console.log(`[seed-scenario-library] using ${source === 'stored' ? 'the saved admin override' : 'the shipped default'} (${value.scenarios.length} scenario(s))`);

  const result = await applyScenarioLibrary(value, { dryRun });
  if (!result.ok) {
    console.error('[seed-scenario-library] refused to apply — unresolved references:');
    result.errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }

  const { scenarios, gates, deactivatedGates } = result.applied;
  console.log(`[seed-scenario-library] ${dryRun ? 'would apply' : 'applied'}: ${scenarios} scenario(s), ${gates} gate(s)${deactivatedGates ? `, deactivated ${deactivatedGates} removed gate(s)` : ''}.`);
  if (dryRun) console.log('[seed-scenario-library] dry run — nothing was written.');
  process.exit(0);
}

main().catch((e) => { console.error('[seed-scenario-library] failed:', e); process.exit(1); });
