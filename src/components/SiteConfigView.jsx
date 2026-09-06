// Extracted from WorldShell.jsx (2026-09-06) so PlanetAtmosphereView.jsx can
// reuse it for the "Site Configuration" moon without a circular import
// between the two files (WorldShell renders PlanetAtmosphereView; keeping
// this shared piece here instead of in WorldShell.jsx avoids either file
// needing to import back from the other). Styles are copied verbatim from
// WorldShell.jsx's `S.embedShell`/`embedHeader`/`embedTitle`/`embedBody`/
// `backBtn`/`ghostSmall`/`railEmpty` — same visual output, own copy so this
// file has no dependency on WorldShell.jsx's much larger style object.
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import ConfigPanel from './admin/ConfigPanel.jsx';

// Design & Config Setup Journey (server/data/scenarioLibrary.js) — evidence
// posted here is what makes the journey's constellation stars real rather
// than structural placeholders (every gate requires one of these Atoms; see
// db.js's config_* molecule seed). 'config_integrations_connected' is
// deliberately absent: whether an integration is connected lives in
// oauth_connections / server/lib/oauthProviders.js, not this config JSON
// blob, and checking it honestly needs its own API call this pass doesn't
// add — better to leave that gate un-evidenced than fabricate a value.
function evidenceFromConfig(config) {
  const hasBrand = Object.values(config?.brand || {}).some((v) => String(v || '').trim());
  const hasSocial = !!(config?.site?.ownerName || config?.site?.domain || config?.site?.tagline);
  const hasResumePresets = Array.isArray(config?.resumePresets) && config.resumePresets.length > 0;
  return [
    ['config_theme_and_brand_set', !!config?.theme || hasBrand],
    ['config_social_and_contact_set', hasSocial],
    ['config_resume_presets_set', hasResumePresets],
  ];
}

export default function SiteConfigView({ scope, onClear }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [journeyRodId, setJourneyRodId] = useState(null);

  useEffect(() => {
    const load = scope === 'admin' ? api.getDraftConfig : api.getMemberDraftConfig;
    load().then(setConfig).catch((e) => toast('Failed to load site configuration: ' + e.message));
  }, [scope]);

  // Find-or-create this user's Design & Config Setup Journey rod so the
  // journey's constellation always has a real rod to read/write against —
  // "prepopulated automated site records," not something the user has to
  // explicitly start first.
  useEffect(() => {
    let cancelled = false;
    api.getMyJourneyRods()
      .then(async ({ rods }) => {
        if (cancelled) return;
        const existing = rods.find((r) => r.metadata?.scenarioKey === 'design_config_setup_journey');
        if (existing) { setJourneyRodId(existing.id); return; }
        const created = await api.createJourneyRod('design_config_setup_journey', 'Site Configuration');
        if (!cancelled) setJourneyRodId(created.id);
      })
      .catch(() => {}); // Non-fatal — the journey view degrades to "not started" if this fails.
    return () => { cancelled = true; };
  }, []);

  async function postConfigEvidence(extraTrue = []) {
    if (!journeyRodId || !config) return;
    const entries = [...evidenceFromConfig(config), ...extraTrue.map((key) => [key, true])];
    await Promise.all(
      entries
        .filter(([, value]) => value)
        .map(([moleculeKey]) => api.postJourneyEvidence(journeyRodId, moleculeKey, true, { sourceType: 'interaction', sourceReference: 'site-config-save' }).catch(() => {}))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await (scope === 'admin' ? api.saveDraftConfig(config) : api.saveMemberDraftConfig(config));
      await postConfigEvidence();
      toast('Saved.');
    } catch (e) {
      toast('Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await (scope === 'admin' ? api.saveDraftConfig(config).then(api.publish) : api.saveMemberDraftConfig(config).then(api.publishMemberConfig));
      await postConfigEvidence(['config_published']);
      toast('Published.');
    } catch (e) {
      toast('Could not publish: ' + e.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={S.embedShell}>
      <div style={S.embedHeader}>
        <button style={S.backBtn} onClick={onClear}>← Back to World</button>
        <div style={S.embedTitle}>Site Configuration</div>
        <div style={{ flex: 1 }} />
        <button style={S.ghostSmall} onClick={handleSave} disabled={saving || !config}>{saving ? 'Saving…' : 'Save Draft'}</button>
        <button style={{ ...S.ghostSmall, marginLeft: '0.5rem', background: '#c4843a', color: '#1c1410', border: 'none' }} onClick={handlePublish} disabled={publishing || !config}>{publishing ? 'Publishing…' : 'Publish'}</button>
      </div>
      <div style={S.embedBody}>
        {!config ? <div style={S.railEmpty}>Loading…</div> : <ConfigPanel config={config} onChange={setConfig} scope={scope} site={null} />}
      </div>
    </div>
  );
}

const S = {
  embedShell: { position: 'fixed', inset: 0, background: '#0d1417', color: '#f5f0e8', zIndex: 10, display: 'flex', flexDirection: 'column' },
  embedHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  embedTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem' },
  embedBody: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
  railEmpty: { color: '#8b877c', fontSize: '0.75rem', padding: '0.5rem 0' },
  backBtn: { background: 'transparent', border: 'none', color: '#8fadb6', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginBottom: '0.7rem' },
  ghostSmall: { padding: '0.3rem 0.6rem', borderRadius: 6, border: '0.5px solid rgba(196,132,58,0.4)', background: 'transparent', color: '#c4843a', fontSize: '0.68rem', cursor: 'pointer' },
};
