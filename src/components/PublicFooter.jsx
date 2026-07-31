import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter({ config }) {
  const site = config?.site || {};
  const social = Object.values(config?.social || {}).filter((s) => s.on && s.url);

  return (
    <footer className="sb-public-footer">
      <div className="sb-public-footer-inner">
        <div className="sb-public-footer-brand">
          <div className="sb-public-footer-name">
            <span>Salt Basin</span>
            <span className="sb-public-footer-network">Net Works</span>
          </div>
          {site.domain && <div className="sb-public-footer-domain">{site.domain}</div>}
        </div>

        {social.length > 0 && (
          <div className="sb-public-footer-social">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="sb-public-footer-social-link"
                style={{ '--social-color': s.color }}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        <div className="sb-public-footer-meta">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/privacy" className="sb-public-footer-notice">
              Privacy Policy
            </Link>
            <Link to="/terms" className="sb-public-footer-notice">
              Terms of Service
            </Link>
            <Link to="/data-notice" className="sb-public-footer-notice">
              Data & Security Notice
            </Link>
          </div>
          <div className="sb-public-footer-copy">
            {site.copyrightLine || `© ${new Date().getFullYear()} Martha Elizabeth Salter - The Salter Influence LLC All Rights Reserved.`}
          </div>
          <div className="sb-public-footer-trademark">
            SaltTide™, RLMM™, and The Salter Momentum™* are trademarks claimed by Salt Basin Holdings. Salt Basin MRS and the HOS™ methodology are Salt Basin Holdings marks pending confirmation.
          </div>
        </div>
      </div>
    </footer>
  );
}
