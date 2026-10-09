/**
 * GtmDeliverablesPanel — shell for the GTM Deliverable & Benchmark Research
 * Agent admin surface (native platform build, 2026-08-02, replaces the
 * standalone agents/gtm-deliverable-agent/ Python CLI). Owns its own
 * internal tab bar, same pattern as EidosOperatingModelPanel /
 * CareerMasterPanel — registered under a single 'gtmDeliverables'
 * componentId in AdminShell's TAB_COMPONENTS.
 */
import React, { useState } from 'react';
import GtmScenarioLibraryPanel from './GtmScenarioLibraryPanel.jsx';
import GtmSchedulePanel from './GtmSchedulePanel.jsx';
import GtmEngagementIntakePanel from './GtmEngagementIntakePanel.jsx';
import GtmDeliverablesQueuePanel from './GtmDeliverablesQueuePanel.jsx';

const TABS = [
  { id: 'queue', label: 'Deliverables Queue' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'engagement', label: 'New Engagement' },
  { id: 'scenarios', label: 'Scenario Library' },
];

const S = {
  wrap: { padding: '1.5rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--sb-font-body)' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '1.25rem' },
  tabBar: { display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  tabBtn: (active) => ({
    padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.04em',
    background: active ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.06)',
    color: active ? 'white' : '#333', fontWeight: active ? 700 : 500,
  }),
};

export default function GtmDeliverablesPanel() {
  const [tab, setTab] = useState('queue');

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>GTM Deliverables</h1>
      <p style={S.sub}>
        Benchmark research and client-engagement deliverables — generated server-side with the platform's own
        Anthropic key, never a personal one. Everything lands in Draft for review here before anything goes near
        a client.
      </p>
      <div style={S.tabBar}>
        {TABS.map((t) => (
          <button key={t.id} style={S.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'queue' && <GtmDeliverablesQueuePanel />}
      {tab === 'schedule' && <GtmSchedulePanel />}
      {tab === 'engagement' && <GtmEngagementIntakePanel />}
      {tab === 'scenarios' && <GtmScenarioLibraryPanel />}
    </div>
  );
}
