const LAYOUT_URLS = {
  classic: '/output/resume',
  modern: '/output/resume?layout=modern',
  corporate: '/output/resume?layout=corporate',
  minimal: '/output/resume?layout=modern',
  executive: '/output/resume?layout=corporate',
};

export function resumeUrlFromPreset(preset, { includePresetId = false } = {}) {
  const base = LAYOUT_URLS[preset?.layout] || LAYOUT_URLS.classic;
  const params = [];
  if (includePresetId && preset?.id) params.push(`preset=${encodeURIComponent(preset.id)}`);
  if (preset?.showExecSummary === false) params.push('execSummary=0');
  if (preset?.showCapabilityMeters === false) params.push('capabilityMeters=0');
  if (preset?.showIndustryBars === false) params.push('industryBars=0');
  if (preset?.showToolBars === false) params.push('toolBars=0');
  if (preset?.showClientVoice === false) params.push('clientVoice=0');
  if (!params.length) return base;
  return base + (base.includes('?') ? '&' : '?') + params.join('&');
}

export function primaryResumeUrl(presets = []) {
  const primary = presets.find((p) => p.primaryResume) || presets[0] || null;
  return resumeUrlFromPreset(primary);
}
