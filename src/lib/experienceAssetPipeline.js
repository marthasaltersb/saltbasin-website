import { findReusableExperienceArtifacts } from '../config/experience/experienceKnowledgeGraph.js';

export const ASSET_PIPELINE_STATES = Object.freeze(['requested', 'matched', 'parameterized', 'procedural', 'candidate_new', 'generated', 'validated', 'candidate', 'approved', 'canonical']);

export function resolveAssetRequest(request) {
  const matches = findReusableExperienceArtifacts(request);
  if (matches.length) return { state: 'matched', strategy: 'reuse', artifact: matches[0].artifact, score: matches[0].score, approvalRequired: false };
  if (request.parameterFamily) return { state: 'parameterized', strategy: 'parameterize', parameterFamily: request.parameterFamily, approvalRequired: false };
  if (request.proceduralRecipe) return { state: 'procedural', strategy: 'generate-deterministically', proceduralRecipe: request.proceduralRecipe, approvalRequired: false };
  return { state: 'candidate_new', strategy: 'create-candidate', assetBriefRequired: true, approvalRequired: true };
}

