// Shared resume-preset resolution for public resume links. One source of
// truth for layout→URL mapping and the single-primary invariant, used by
// site.js (site owner), members.js (own presets), and memberSite.js (by slug).
import { db } from '../db.js';

const LAYOUT_URLS = {
  classic: '/output/resume',
  modern: '/output/resume?layout=modern',
  corporate: '/output/resume?layout=corporate',
  minimal: '/output/resume?layout=modern',
  executive: '/output/resume?layout=corporate',
};

export function resumeUrlFromPreset(preset) {
  const base = LAYOUT_URLS[preset?.layout] || LAYOUT_URLS.classic;
  const params = [];
  if (preset?.showExecSummary === false) params.push('execSummary=0');
  if (preset?.showCapabilityMeters === false) params.push('capabilityMeters=0');
  if (preset?.showIndustryBars === false) params.push('industryBars=0');
  if (preset?.showToolBars === false) params.push('toolBars=0');
  if (preset?.showClientVoice === false) params.push('clientVoice=0');
  if (!params.length) return base;
  return base + (base.includes('?') ? '&' : '?') + params.join('&');
}

export function pickPrimaryPreset(presets) {
  const list = Array.isArray(presets) ? presets : [];
  return list.find((p) => p && p.primaryResume) || list[0] || null;
}

// Exactly one primary whenever any presets exist: the first flagged preset
// wins; if none is flagged, the first preset is promoted.
export function normalizePrimaryFlags(presets) {
  const list = Array.isArray(presets) ? presets : [];
  if (!list.length) return list;
  const primary = list.find((p) => p && p.primaryResume) || list[0];
  return list.map((p) => ({ ...p, primaryResume: p === primary }));
}

// Display-safe subset of a preset for unauthenticated responses — everything
// here is content the owner authored for public resume rendering.
export function publicPresetView(preset) {
  if (!preset) return null;
  const {
    id, name, layout, includedSections,
    showExecSummary, showCapabilityMeters, showIndustryBars, showToolBars, showClientVoice,
    agentSummary, prioritizedExperience,
  } = preset;
  return {
    id, name, layout, includedSections,
    showExecSummary, showCapabilityMeters, showIndustryBars, showToolBars, showClientVoice,
    agentSummary, prioritizedExperience,
  };
}

export async function loadResumePresets(userId) {
  const row = await db
    .prepare(`SELECT data FROM member_json_store WHERE user_id = $1 AND key = 'resume_presets'`)
    .get(userId);
  const data = row ? JSON.parse(row.data) : { presets: [] };
  return Array.isArray(data.presets) ? data.presets : [];
}

export async function siteOwnerUserId() {
  const row = await db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`).get();
  return row ? row.id : null;
}
