export const MOTION_REGISTRY = Object.freeze({
  pulse: { semanticEvent: 'signal_observed', durationRange: [180, 600], easing: 'ease-out', cameraResponse: 'none', interruptible: true, reducedMotionBehavior: 'static-highlight' },
  emerge: { semanticEvent: 'governed_object_created', durationRange: [350, 900], easing: 'ease-out', cameraResponse: 'reveal', interruptible: true, reducedMotionBehavior: 'immediate-insert' },
  bond: { semanticEvent: 'relationship_validated', durationRange: [300, 800], easing: 'ease-in-out', cameraResponse: 'zoom-to-relationship', interruptible: true, reducedMotionBehavior: 'static-connection' },
  crystallize: { semanticEvent: 'definition_validated', durationRange: [450, 1200], easing: 'ease-out', cameraResponse: 'inspect', interruptible: false, reducedMotionBehavior: 'immediate-material-state' },
  fracture: { semanticEvent: 'conflict_detected', durationRange: [250, 700], easing: 'ease-out', cameraResponse: 'none', interruptible: true, reducedMotionBehavior: 'persistent-conflict-marker' },
  branch: { semanticEvent: 'journey_branch_created', durationRange: [600, 1400], easing: 'ease-in-out', cameraResponse: 'zoom-to-relationship', interruptible: true, reducedMotionBehavior: 'immediate-branch' },
  merge: { semanticEvent: 'confluence_approved', durationRange: [600, 1400], easing: 'ease-in-out', cameraResponse: 'track', interruptible: false, reducedMotionBehavior: 'resolved-connection' },
  rewind: { semanticEvent: 'history_requested', durationRange: [400, 1200], easing: 'linear', cameraResponse: 'timeline-travel', interruptible: true, reducedMotionBehavior: 'discrete-history-step' },
  flow: { semanticEvent: 'journey_progressed', durationRange: [400, 1000], easing: 'linear', cameraResponse: 'follow', interruptible: true, reducedMotionBehavior: 'directional-emphasis' },
});

