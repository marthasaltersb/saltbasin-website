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
    consentVersion: '2026-08-10.1',
    effectiveAt: 1786334400000,
    label: 'Career Portfolio Terms & Data Conditions',
    summary: 'These terms govern Career Portfolio information, agent-assisted processing, publication controls, member responsibilities, and permission-aware use of personal and organization-linked data.',
    sections: [
      { key: 'data_you_provide', title: 'Data you provide', text: 'You control the career history, files, profile information, organization links, instructions, and corrections you submit. Provide only information you are authorized to use, and redact confidential or restricted material before upload.' },
      { key: 'agent_processing', title: 'Agent-assisted processing', text: 'BestyStaff and other provisioned agents may classify, summarize, transform, and connect your submitted information to create Career Portfolio records and outputs. Agent memory remains subject to record, module, organization, and user permissions.' },
      { key: 'accuracy', title: 'Accuracy and review', text: 'Generated classifications and outputs may be incomplete or incorrect. You are responsible for reviewing factual claims, dates, metrics, client references, permissions, and publication settings before relying on or sharing an output.' },
      { key: 'privacy', title: 'Private and public information', text: 'Private inputs are not made public merely because they are stored. You must deliberately publish an approved output. You are responsible for ensuring public outputs do not reveal confidential client, employer, or third-party information.' },
      { key: 'organization_data', title: 'Organization-linked data', text: 'Information linked to an organization may also be governed by organization permissions, licenses, identity providers, and data policies. Access to that information can change when your organization relationship or permissions change.' },
      { key: 'retention', title: 'Retention and corrections', text: 'Career Portfolio records and consent history are retained to operate the service, preserve provenance, and document governing terms. You may request corrections or deletion subject to legal, security, audit, and contractual retention requirements.' },
      { key: 'acceptable_use', title: 'Acceptable use', text: 'Do not upload unlawful, malicious, deceptive, infringing, credential, or unauthorized personal data. Do not use generated outputs to impersonate another person or misrepresent qualifications.' },
      { key: 'changes', title: 'Changes to these terms', text: 'A materially updated Career Portfolio terms version requires a new affirmative agreement. Until accepted, access to authenticated member platform functions is suspended.' },
    ],
    acknowledgements: [
      {
        key: 'careerTermsAck',
        text: 'I have reviewed and agree to the current Career Portfolio Terms & Data Conditions.',
      },
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
  `).run(userId, consentType, granted ? 'granted' : 'revoked', def.consentVersion, context, ip || null, userAgent || null, now);
  if (consentType === 'career_portfolio') {
    await db.prepare(`UPDATE users SET career_terms_version=$1,career_terms_agreed_at=$2 WHERE id=$3`).run(granted ? def.consentVersion : null, granted ? now : null, userId);
  }
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
  const latest = await db.prepare(`SELECT action,consent_version,created_at,context FROM consent_actions WHERE user_id=$1 AND consent_type=$2 ORDER BY created_at DESC,id DESC LIMIT 1`).get(userId, consentType);
  const lastGranted = await db.prepare(`SELECT consent_version,created_at FROM consent_actions WHERE user_id=$1 AND consent_type=$2 AND action='granted' ORDER BY created_at DESC,id DESC LIMIT 1`).get(userId, consentType);
  const granted = !!latest && latest.action === 'granted' && latest.consent_version === def.consentVersion;
  return { consentType, consentVersion: def.consentVersion, effectiveAt: def.effectiveAt || null, label: def.label, summary: def.summary || null, sections: def.sections || [], granted, stale: !!lastGranted && !granted, lastActionAt: latest ? Number(latest.created_at) : null, lastAgreedAt: lastGranted ? Number(lastGranted.created_at) : null, lastAgreedVersion: lastGranted?.consent_version || null, acknowledgements: def.acknowledgements };
}
