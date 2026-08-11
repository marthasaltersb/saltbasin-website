export const USER_CHARACTER_PROFILES = Object.freeze({
  operator: { embodimentMode: 'operator', cameraRelationship: 'elevated', movementStyle: 'orbit-and-focus', interactionReach: 'world', animationProfile: 'none' },
  orbital_presence: { embodimentMode: 'orbital_presence', cameraRelationship: 'follow-point', movementStyle: 'bounded-orbit', interactionReach: 'nearby', animationProfile: 'presence-pulse' },
  first_person: { embodimentMode: 'first_person', cameraRelationship: 'embodied', movementStyle: 'walk-and-inspect', interactionReach: 'proximity', animationProfile: 'camera-presence' },
  hybrid: { embodimentMode: 'hybrid', cameraRelationship: 'adaptive', movementStyle: 'operator-orbit-inspect', interactionReach: 'contextual', animationProfile: 'mode-transition' },
});

export const AGENT_CHARACTER_PROFILES = Object.freeze({
  guide: { agentClass: 'guide', visualFamily: 'faceted-agent', movementProfile: 'companion-follow', autonomyLevel: 1 },
  validator: { agentClass: 'validator', visualFamily: 'faceted-agent', movementProfile: 'object-orbit', autonomyLevel: 2 },
  builder: { agentClass: 'builder', visualFamily: 'faceted-agent', movementProfile: 'retrieve-and-assemble', autonomyLevel: 3 },
  reconciler: { agentClass: 'reconciler', visualFamily: 'faceted-agent', movementProfile: 'relationship-traverse', autonomyLevel: 3 },
  historian: { agentClass: 'historian', visualFamily: 'faceted-agent', movementProfile: 'timeline-track', autonomyLevel: 1 },
});

