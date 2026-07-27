import fs from 'node:fs';
import { ScenarioRegistry } from '../src/scenarios/scenarioRegistry.js';
const path = process.argv[2] || 'generated/scenarios/scenario-registry.json';
const registry = ScenarioRegistry.fromFile(path); const ids = new Set(registry.scenarios.map(s => s.scenarioId));
const errors = [];
if (registry.scenarios.length !== 2400) errors.push(`Expected 2400 scenarios, found ${registry.scenarios.length}`);
if (ids.size !== registry.scenarios.length) errors.push('Scenario IDs are not unique');
for (let i=1;i<=2400;i++) { const id = `SB-SCN-${String(i).padStart(4,'0')}`; if (!ids.has(id)) errors.push(`Missing ${id}`); }
console.log(JSON.stringify({ valid: !errors.length, scenarioCount: registry.scenarios.length, uniqueScenarioIds: ids.size, uniqueSignatures: registry.bySignature.size, errors }, null, 2));
if (errors.length) process.exitCode = 1;
