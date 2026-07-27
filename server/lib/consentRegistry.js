// Consent Registry (2026-07-16) — the required-consent set a member must
// grant before any career configuration, upload, or Career Orbit entry.
// Config-driven (like every other registry this session) so the required
// set/wording is versioned in one place, not scattered across UI checkboxes.
// consent_actions (server/db.js) is the authoritative timestamped record;
// this module is the read/write API in front of it.
import { db } from '../db.js';

// Bump consentVersion whenever wording changes meaningfully — a member's
// past consent under an old version is preserved (never edited), and
// hasCurrentConsent() only counts a grant recorded against the CURRENT
// version, so a wording change re-requires consent rather than silently
// carrying forward agreement to different text.
export const CONSENT_TYPES = Object.freeze({
  platform_terms: {
    consentVersion: '2026-07-27.1',
    label: 'Terms of Service & Privacy Policy',
    acknowledgements: [
      {
        key: 'termsAndPrivacyAck',
        text: 'I have read and agree to the Terms of Service and Privacy Policy.',
      },
    ],
  },
  organization_data_scope: {
    consentVersion: '2026-07-27.1',
    label: 'Organization Data Scope',
    acknowledgements: [
      {
        key: 'orgDataScopeAck',
        text: 'I confirm the organization-scoped data I add or view here is tied to my verified organization email, and understand it may be visible to other verified members of this organization — separate from my personal profile and personal email.',
      },
    ],
  },
  career_portfolio: {
    consentVersion: '2026-07-16.1',
    label: 'Career Portfolio Data Handling',
    acknowledgements: [
      {
        key: 'redactionAck',
        // Future tense — consent now precedes upload, not follows it.
        text: 'I will upload redacted information where needed and understand the upload may be used as agent context.',
      },
      {
        key: 'publicOutputValidationAck',
        text: 'I am responsible for validating that private client names do not appear in public-facing objects or outputs.',
      },
      {
        key: 'noPrivateNamePersistenceAck',
        text: 'I will not type private client names into metadata or notes; private names to remove should not be persisted in Salt Basin.',
      },
    ],
  },
});

export function consentDefinition(consentType) {
  return CONSENT_TYPES[consentType] || null;
}

/**
 * Records one consent action (grant or revoke). Never updates a prior row —
 * every action is its own timestamped record.
 */
export async function recordConsent(userId, consentType, granted, { ip, userAgent, context = {} } = {}) {
  const def = consentDefinition(consentType);
  if (!def) throw new Error(`Unknown consent type: ${consentType}`);
  const now = Date.now();
  await db.prepare(`
    INSERT INTO consent_actions (user_id, consent_type, action, consent_version, context, ip, user_agent, created_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)
  `).run(userId, consentType, granted ? 'granted' : 'revoked', def.consentVersion, JSON.stringify(context), ip || null, userAgent || null, now);
  return { consentType, granted, consentVersion: def.consentVersion, recordedAt: now };
}

/**
 * True only if the LATEST action for this user+type is a 'granted' row
 * against the current consentVersion — a stale-version grant or a later
 * revoke both correctly report false.
 */
export async function hasCurrentConsent(userId, consentType) {
  const def = consentDefinition(consentType);
  if (!def) return false;
  const latest = await db.prepare(`
    SELECT action, consent_version FROM consent_actions
    WHERE user_id=$1 AND consent_type=$2
    ORDER BY created_at DESC, id DESC LIMIT 1
  `).get(userId, consentType);
  return !!latest && latest.action === 'granted' && latest.consent_version === def.consentVersion;
}

export async function getConsentStatus(userId, consentType) {
  const def = consentDefinition(consentType);
  if (!def) throw new Error(`Unknown consent type: ${consentType}`);
  const granted = await hasCurrentConsent(userId, consentType);
  return { consentType, consentVersion: def.consentVersion, granted, acknowledgements: def.acknowledgements };
}
