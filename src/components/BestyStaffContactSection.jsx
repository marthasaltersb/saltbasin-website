import React from 'react';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import PortfolioRequestPrompt from './PortfolioRequestFlow.jsx';
import { recordBestyTouch } from '../lib/bestyStaffAttribution.js';

export default function BestyStaffContactSection({ config }) {
  const bestystaff = config?.bestystaff || {};
  const copy = bestystaff.homepage || {};
  if (bestystaff.enabled === false) return null;

  function openChat() {
    recordBestyTouch('homepage-crystal', { action: 'crystal-open' });
    if (window.location.hash !== '#bestystaff') window.location.hash = 'bestystaff';
    else window.dispatchEvent(new Event('bestystaff:open'));
  }

  return (
    <section className="sbh-band sbh-besty-section" id="bestystaff">
      <div className="sbh-besty-section-inner">
        <button type="button" className="sbh-besty-crystal-trigger" aria-label="Open BestyStaff chat" onClick={openChat}>
          <SaltBasinCrystal variant="signature" size="hero" interactive />
          <span className="sbh-besty-crystal-caption" aria-hidden="true">Click to chat</span>
        </button>
        <div>
          <p className="sbh-eyebrow">{copy.eyebrow || 'Get in touch'}</p>
          <h2>{copy.heading || 'Start with BestyStaff.'}</h2>
          <p>{copy.description || 'Share what brought you here. BestyStaff will gather the useful context for Betsy, answer what it can, and create a lead record so the conversation can continue.'}</p>
          <button type="button" className="sbh-besty-launch-callout" onClick={openChat}>
            Click the BestyStaff crystal in the bottom-right corner to begin.
          </button>
        </div>
      </div>
      <PortfolioRequestPrompt sourceOutput="homepage-contact" autoOpen={false} openOnHash="#bestystaff" intakeConfig={bestystaff.intake} />
    </section>
  );
}
