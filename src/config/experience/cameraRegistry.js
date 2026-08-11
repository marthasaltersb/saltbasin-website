export const CAMERA_REGISTRY = Object.freeze({
  orbit: { behavior: 'ORBIT', purpose: 'orient around context', interruptible: true, reducedMotionFallback: 'static-overview' },
  inspect: { behavior: 'INSPECT', purpose: 'frame one governed object', interruptible: true, reducedMotionFallback: 'jump-to-object' },
  follow: { behavior: 'FOLLOW', purpose: 'maintain relationship to progression', interruptible: true, reducedMotionFallback: 'step-focus' },
  reveal: { behavior: 'REVEAL', purpose: 'expose a relationship or new object', interruptible: true, reducedMotionFallback: 'static-highlight' },
  zoom_to_relationship: { behavior: 'ZOOM_TO_RELATIONSHIP', purpose: 'frame connected objects', interruptible: true, reducedMotionFallback: 'frame-both' },
  timeline_travel: { behavior: 'TIMELINE_TRAVEL', purpose: 'inspect historical lineage', interruptible: true, reducedMotionFallback: 'discrete-history-step' },
  macro_to_micro: { behavior: 'MACRO_TO_MICRO', purpose: 'descend world to evidence', interruptible: true, reducedMotionFallback: 'hierarchy-jump' },
  micro_to_macro: { behavior: 'MICRO_TO_MACRO', purpose: 'restore world context', interruptible: true, reducedMotionFallback: 'overview-jump' },
});

