const stage = (stageId, name, coordinateStart, coordinateEnd, definitionStatus = 'established') =>
  ({ stageId, name, coordinateStart, coordinateEnd, definitionStatus });

export const JOURNEY_DEFINITIONS = [
  { journeyDefinitionId: 'revenue-lifecycle', name: 'Revenue Lifecycle', stages: [
    'Lead','Opportunity','Proposal','Quote','Contract','Order','Subscription','Bill','Invoice','Collect','Recognize','Renew / Expand','Adjust',
  ].map((name, i, a) => stage(`revenue-${i + 1}`, name, i / a.length, (i + 1) / a.length)) },
  { journeyDefinitionId: 'customer-journey', name: 'Customer Journey', stages: [
    'Prospect','Lead Ingestion','Qualification','Proposal Negotiation','Signature','Onboarding','Active Customer','Payment','Service Request','Change Request','Renewal / Expansion / Churn Risk',
  ].map((name, i, a) => stage(`customer-${i + 1}`, name, i / a.length, (i + 1) / a.length)) },
  { journeyDefinitionId: 'member-journey', name: 'Member Journey', stages: [
    'Identified','Invited','Provisioned','Activated','Authenticated','Entitled','Active','Engaged','Support','Changed','Renewed','Suspended','Deactivated',
  ].map((name, i, a) => stage(`member-${i + 1}`, name, i / a.length, (i + 1) / a.length, 'proposed_seed')) },
];

export const TRIBUTARY_RULES = [{
  tributaryRuleId: 'existing-customer-change', parentJourneyDefinitionId: 'customer-journey',
  formationRule: { signal: 'existing_customer_change' }, boundedScenarioType: 'expansion_or_change',
  inheritancePolicy: 'snapshot_parent_coordinate_and_active_compositions',
  confluenceRuleId: 'existing-customer-change-confluence',
}];

export const CONFLUENCE_RULES = [{
  confluenceRuleId: 'existing-customer-change-confluence',
  acceptancePolicy: 'recompute_parent_from_accepted_contributions',
  preserveRejectedContributions: true, historicalLineageAgentRequired: true,
}];
