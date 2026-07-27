export function generateScenarioFixture(registry, { scenarioId, seedKey } = {}) {
  const scenario = registry.get(scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  const key = seedKey || scenario.fixtureSeedKey;
  return { scenarioId, seedKey: key, sourceEvent: { sourceEventId: scenario.sourceEvent.idPattern.replace('{sequence}', 'fixture-001'), sourceEventType: scenario.sourceEvent.type, eventTime: '2026-01-01T00:00:00.000Z', effectiveTime: '2026-01-01T00:00:00.000Z', generationRuleId: 'scenario-fixture-contract', generationRuleVersion: 1 }, dimensions: scenario.dimensions, atomAssignments: scenario.atoms, expectedEntityTypes: scenario.expectations.generatedEntitiesAndTransactions, expectedControls: scenario.expectations.reconciliationControls, expectedMetrics: scenario.expectations.metricDependencies, propagationTargets: scenario.expectations.propagationTargets, executionPolicy: 'Invoke domain generation services; do not directly insert expected outputs.' };
}

export function compareFixtureOutputs(fixture, actualGeneratedEntityTypes) {
  const expected = new Set(fixture.expectedEntityTypes); const actual = new Set(actualGeneratedEntityTypes);
  return { passed: [...expected].every(x => actual.has(x)) && [...actual].every(x => expected.has(x)), missingExpectedTypes: [...expected].filter(x => !actual.has(x)), unexpectedGeneratedTypes: [...actual].filter(x => !expected.has(x)), sourceEvent: fixture.sourceEvent, scenarioId: fixture.scenarioId };
}
