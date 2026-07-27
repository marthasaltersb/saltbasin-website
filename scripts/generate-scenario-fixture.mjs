import { ScenarioRegistry } from '../src/scenarios/scenarioRegistry.js';
import { generateScenarioFixture } from '../src/scenarios/fixtureGenerator.js';
console.log(JSON.stringify(generateScenarioFixture(ScenarioRegistry.fromFile(), { scenarioId: process.argv[2] || 'SB-SCN-0001' }), null, 2));
