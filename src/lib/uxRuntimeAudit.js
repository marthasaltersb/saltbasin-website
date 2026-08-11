// Deterministic, read-only experiential audit. Unlike registry validation,
// these checks measure the rendered experience in the current viewport.
import { getUxRepairRecipe } from '../config/ux/uxRepairRegistry.js';
const WEIGHTS = Object.freeze({ critical: 20, high: 10, medium: 5, low: 2 });

function finding(ruleId, severity, title, evidence, repairRecipe = null) {
  return { ruleId, severity, title, evidence, repairRecipe, repair: repairRecipe ? getUxRepairRecipe(repairRecipe) : null };
}

function accessibleName(element) {
  return (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || element.value || '').trim();
}

function visible(element) {
  const rect = element.getBoundingClientRect();
  const style = element.ownerDocument.defaultView.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
}

export function scoreUxFindings(findings) {
  const byRule = new Map();
  for (const item of findings) byRule.set(item.ruleId, Math.min(25, (byRule.get(item.ruleId) || 0) + (WEIGHTS[item.severity] || 0)));
  const penalty = [...byRule.values()].reduce((sum, value) => sum + value, 0);
  return Math.max(0, 100 - penalty);
}

export function auditRenderedExperience(doc = document, sceneSnapshots = globalThis.__SB_SCENE_MANIFESTS__ || {}) {
  const findings = [];
  const viewport = { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
  const controls = [...doc.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[tabindex]')].filter(visible);

  for (const element of controls.slice(0, 250)) {
    const rect = element.getBoundingClientRect();
    const name = accessibleName(element);
    if (!name) findings.push(finding('UX-A11Y-NAME-001', 'high', 'Interactive control has no accessible name', { tag: element.tagName, selector: element.id ? `#${element.id}` : element.className }, 'add-accessible-name'));
    if ((rect.width < 44 || rect.height < 44) && !element.closest('[data-ux-compact-controls="true"]')) {
      findings.push(finding('UX-TARGET-001', 'medium', 'Interactive target is smaller than 44×44px', { name, width: Math.round(rect.width), height: Math.round(rect.height) }, 'ensure-minimum-tap-target'));
    }
  }

  if (doc.documentElement.scrollWidth > doc.documentElement.clientWidth + 2) {
    findings.push(finding('UX-RESPONSIVE-001', 'high', 'Page has horizontal overflow', { scrollWidth: doc.documentElement.scrollWidth, viewportWidth: viewport.width }, 'repair-horizontal-overflow'));
  }

  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
  let priorLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (priorLevel && level > priorLevel + 1) findings.push(finding('UX-HEADING-001', 'medium', 'Heading hierarchy skips a level', { heading: heading.textContent.trim(), from: priorLevel, to: level }, 'normalize-heading-order'));
    priorLevel = level;
  }

  if (!doc.querySelector('main,[role="main"]')) findings.push(finding('UX-LANDMARK-001', 'medium', 'Page has no main landmark', {}, 'add-main-landmark'));

  const aboveFoldControls = controls.filter((element) => element.getBoundingClientRect().top < viewport.height).length;
  if (aboveFoldControls > 10) findings.push(finding('UX-PRIORITY-001', 'medium', 'Too many competing actions appear in the first viewport', { aboveFoldControls, recommendedMaximum: 10 }, 'clarify-primary-actions'));

  const visibleText = [...doc.querySelectorAll('h1,h2,h3,p,li')].filter(visible);
  if (visibleText.length > 80) findings.push(finding('UX-DENSITY-001', 'high', 'The page presents excessive information in one continuous experience', { visibleTextBlocks: visibleText.length, recommendedMaximum: 80 }, 'progressive-disclosure'));
  const journeyLength = doc.documentElement.scrollHeight / Math.max(viewport.height, 1);
  if (journeyLength > 12) findings.push(finding('UX-JOURNEY-001', 'high', 'The page requires an unusually long uninterrupted journey', { viewportLengths: Math.round(journeyLength * 10) / 10, recommendedMaximum: 12 }, 'split-experience-into-goal-based-paths'));
  const sectionHeadings = [...doc.querySelectorAll('h2')].filter(visible).length;
  if (sectionHeadings > 10) findings.push(finding('UX-IA-001', 'medium', 'Too many primary sections compete in one route', { sectionHeadings, recommendedMaximum: 10 }, 'restructure-information-architecture'));

  for (const canvas of [...doc.querySelectorAll('canvas')].filter(visible)) {
    const host = canvas.closest('[data-ux-3d-alternative]');
    if (!host) findings.push(finding('UX-3D-ALT-001', 'high', '3D canvas has no declared keyboard or non-visual equivalent', { className: canvas.className, ariaHidden: canvas.getAttribute('aria-hidden') }, 'add-3d-navigation-alternative'));
  }

  for (const [sceneId, snapshot] of Object.entries(sceneSnapshots)) {
    for (const issue of snapshot.findings || []) findings.push(finding('UX-3D-LINEAGE-001', 'high', 'Rendered 3D object is missing governed lineage', { sceneId, ...issue }, 'register-scene-manifest'));
    const interactive = (snapshot.entries || []).filter((entry) => entry.interaction?.events?.length);
    const withoutState = interactive.filter((entry) => !entry.interaction.stateTarget);
    if (withoutState.length) findings.push(finding('UX-3D-STATE-001', 'high', 'Interactive 3D elements do not declare their resulting UI state', { sceneId, count: withoutState.length }, 'bind-3d-event-state'));
  }

  const counts = findings.reduce((acc, item) => ({ ...acc, [item.severity]: (acc[item.severity] || 0) + 1 }), {});
  return { capturedAt: Date.now(), path: doc.defaultView.location.pathname, viewport, score: scoreUxFindings(findings), counts, findings };
}

export function publishUxRuntimeAudit(doc = document) {
  const report = auditRenderedExperience(doc, globalThis.__SB_SCENE_MANIFESTS__ || {});
  globalThis.__SB_UX_AUDIT__ = report;
  return report;
}
