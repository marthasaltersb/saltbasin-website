import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAdmin, createSession, setAdminCookie } from '../auth.js';
import { sendLeadConfirmation, sendLeadEmailVerification, sendNewLeadAlert, sendContactFormToMember, dispatchRaw } from '../lib/email.js';
import { defaultMemberProfile } from '../data/defaultMemberProfile.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';
import { ensureLeadRevenueRod, ensureMemberJourneyRods, upsertAccountRecord } from '../lib/journeyRods.js';
import { provisionDefaultModulesForNewMember } from '../lib/memberProvisioning.js';
import { classifyEmailDomain, emailDomainOf } from '../lib/emailDomain.js';
import { recordConsent } from '../lib/consentRegistry.js';
import { ensureCareerFoundationTrial } from '../lib/memberAccess.js';
import { mergedGateDefinitions, emailGateFor, evaluateLeadConversion } from '../lib/bestyStaffGateDefinitions.js';

const router = Router();

const LEAD_COOKIE = 'sb_lead';
const ACTOR_COOKIE = 'sb_actor_context';
const VISIT_COOKIE = 'sb_actor_visit';
const LEAD_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';

// ── Validation + normalization ──

// RFC 5322 simplified — good enough to reject obvious junk without being so
// strict that we lock out edge cases. Real verification happens via email link.
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function isValidEmail(s) {
  return typeof s === 'string' && s.length >= 5 && s.length <= 254 && EMAIL_RE.test(s);
}
function normalizeEmail(s) {
  return s.trim().toLowerCase();
}

// Phone normalization: keep digits only. North America bias for now (10 or
// 11 digits). Reject obviously malformed input but don't refuse international.
function normalizePhone(s) {
  if (!s) return null;
  const digits = String(s).replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function isValidSource(s) {
  return typeof s === 'string' && s.length > 0 && s.length <= 64 && /^[A-Za-z0-9_-]+$/.test(s);
}

const STAGE_GATE_KEYS = new Set(['contactEmail', 'interestArea', 'kind', 'emailDomainKind', 'emailFormatValid', 'primaryEmailVerified', 'captchaPassed', 'workEmailManualValidation', 'isBuyer', 'decisionRole', 'engagementType', 'pledgeInterest', 'earlyRegistration', 'contractOutputReady']);

function memorySignalsFor(role, message, questionKey) {
  const content = String(message || '').trim().slice(0, 4000);
  if (!content) return {};
  const at = Date.now();
  const result = {};
  if (role === 'user') {
    result.quotes = [{ at, text: content, classification: 'private', source: 'bestystaff_chat' }];
    if (/\?\s*$/.test(content)) result.openQuestions = [{ at, text: content, classification: 'private' }];
    const signalTypes = [];
    if (/\b(hire|consult|project|contract|proposal|scope)\b/i.test(content)) signalTypes.push('commercial_interest');
    if (/\b(portfolio|resume|career|job|role|interview)\b/i.test(content)) signalTypes.push('career_interest');
    if (/\b(urgent|immediately|this week|this month|deadline)\b/i.test(content)) signalTypes.push('urgency');
    if (/\b(pledge|deposit|early registration|early member)\b/i.test(content)) signalTypes.push('registration_commitment');
    if (signalTypes.length) result.customerSignals = signalTypes.map((type) => ({ at, type, evidence: content, classification: 'private' }));
  }
  if (questionKey) result.lastFieldCapture = { at, key: questionKey, classification: STAGE_GATE_KEYS.has(questionKey) ? 'stage_gate' : 'context' };
  return result;
}

function mergeAgentMemory(current, additions) {
  const next = current && typeof current === 'object' ? { ...current } : {};
  for (const key of ['quotes', 'openQuestions', 'customerSignals']) {
    if (additions[key]) next[key] = [...(Array.isArray(next[key]) ? next[key] : []), ...additions[key]].slice(-100);
  }
  if (additions.lastFieldCapture) next.lastFieldCapture = additions.lastFieldCapture;
  next.updatedAt = Date.now();
  next.governance = { defaultClassification: 'private', enforcement: 'server_policy' };
  return next;
}

// ── ID + password generators ──
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function newPublicId() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let id = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
    const exists = await db.prepare('SELECT 1 FROM leads WHERE public_id = $1').get(id);
    if (!exists) return id;
  }
}

function newAccessPassword() {
  // 16 chars from a 32-char alphabet = ~80 bits of entropy. Resistant to
  // offline brute force even if the hashed value leaked.
  const bytes = crypto.randomBytes(16);
  let pw = '';
  for (let i = 0; i < 16; i++) pw += ALPHABET[bytes[i] % ALPHABET.length];
  return pw;
}

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function issueLeadEmailVerification({ leadId, email, name = null }) {
  const rawToken = newToken();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await db.prepare(`UPDATE lead_email_verifications SET expires_at=$1 WHERE lead_id=$2 AND LOWER(email)=LOWER($3) AND verified_at IS NULL`).run(Date.now(), leadId, email);
  await db.prepare(`INSERT INTO lead_email_verifications (lead_id,email,token_hash,expires_at) VALUES ($1,$2,$3,$4)`).run(leadId, email, tokenHash, Date.now() + EMAIL_VERIFY_TTL_MS);
  await sendLeadEmailVerification({ leadId, toEmail: email, toName: name, verificationUrl: `${PUBLIC_BASE_URL}/api/leads/verify-email?token=${rawToken}` });
}

// ── Rate limit ──
const recent = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (recent.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > 5;
}

// ── Cookie helpers ──
function leadCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: LEAD_SESSION_TTL_MS,
    path: '/',
  };
}

// ── Match-and-merge ──
// When a new submission arrives, find leads that share the same email or
// phone (excluding already-merged ones). If we find any, the new submission
// becomes the primary; the older matches get archived into prior_notes and
// flagged with merged_into_id.
async function findActiveMatches({ email, phone, actorKey }) {
  const params = [];
  const where = [];
  if (email) {
    params.push(email);
    where.push(`LOWER(email) = $${params.length}`);
  }
  if (phone) {
    params.push(phone);
    where.push(`phone = $${params.length}`);
  }
  if (actorKey) {
    params.push(actorKey);
    where.push(`actor_key = $${params.length}`);
  }
  if (!where.length) return [];
  const sqlText = `
    SELECT id, source, email, phone, name, message, public_id, access_token, password_hash,
           actor_key, provisional, answers, prior_notes, merged_from_ids,
           created_at, updated_at
    FROM leads
    WHERE merged_into_id IS NULL AND (${where.join(' OR ')})
    ORDER BY updated_at DESC
  `;
  return await db.prepare(sqlText).all(...params);
}

function mergePriorNotes(existingJson, additions) {
  const existing = existingJson ? JSON.parse(existingJson) : [];
  return JSON.stringify([...existing, ...additions]);
}

async function fetchActivity(leadId) {
  return await db
    .prepare(
      'SELECT id, source, cta_location, message, created_at FROM lead_activity WHERE lead_id = $1 ORDER BY created_at ASC'
    )
    .all(leadId);
}

function actorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: LEAD_SESSION_TTL_MS,
    path: '/',
  };
}

export async function resetLeadCredentialsByEmail(email) {
  if (!isValidEmail(email)) return { ok: true };
  const lead = await db.prepare(`SELECT id, public_id, email, name, source FROM leads WHERE LOWER(email) = $1 AND merged_into_id IS NULL ORDER BY updated_at DESC LIMIT 1`).get(normalizeEmail(email));
  if (!lead) return { ok: true };
  const password = newAccessPassword();
  const hash = await bcrypt.hash(password, 10);
  await db.prepare(`UPDATE leads SET password_hash = $1, updated_at = $2 WHERE id = $3`).run(hash, Date.now(), Number(lead.id));
  await db.prepare(`DELETE FROM lead_sessions WHERE lead_id = $1`).run(Number(lead.id));
  await sendLeadConfirmation({
    leadId: Number(lead.id), toEmail: lead.email, toName: lead.name,
    leadUrl: `/lead/${lead.public_id}`, password, source: lead.source || 'bestystaff',
  });
  return { ok: true, leadUrl: `/lead/${lead.public_id}` };
}

router.post('/credential-reset', async (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'slow down a moment' });
  await resetLeadCredentialsByEmail(req.body?.email);
  res.json({ ok: true, message: 'If that email is linked to a lead, refreshed credentials are on the way.' });
});

function visitCookieOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
}

router.get('/actor-context', async (req, res) => {
  let actorKey = req.cookies?.[ACTOR_COOKIE];
  let visitKey = req.cookies?.[VISIT_COOKIE];
  if (!actorKey) {
    actorKey = newToken();
    res.cookie(ACTOR_COOKIE, actorKey, actorCookieOptions());
  }
  if (!visitKey) {
    visitKey = newToken();
    res.cookie(VISIT_COOKIE, visitKey, visitCookieOptions());
  }
  const lead = await db.prepare(`SELECT id, public_id, email, name, answers, visit_count FROM leads WHERE actor_key = $1 AND merged_into_id IS NULL`).get(actorKey);
  if (!lead) return res.json({ returning: false, visitKey });
  let answers = {};
  try { answers = lead.answers ? JSON.parse(lead.answers) : {}; } catch { answers = {}; }
  const domain = emailDomainOf(lead.email);
  res.json({
    returning: true,
    publicId: lead.public_id,
    visitCount: Number(lead.visit_count || 0),
    hasEmail: !!lead.email,
    emailDomain: domain,
    emailKind: classifyEmailDomain(lead.email),
    hasName: !!lead.name,
    answered: Object.fromEntries(Object.entries(answers).filter(([k]) => ['consentGiven','knowsBetsy','knowsBetsyDetail','topQuestions','interestArea','marketingConsent','contactName'].includes(k))),
  });
});

// First-answer tracking: one provisional canonical lead per browser actor.
// Final contact submission upgrades this row through the normal lead flow.
router.post('/touch', async (req, res) => {
  try {
    const { source = 'bestystaff', message, questionKey, answerValue, ctaLocation, attribution, metadataClass, role = 'user' } = req.body || {};
    if (!isValidSource(source)) return res.status(400).json({ error: 'invalid source' });
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'an answered question is required' });
    if (!['user', 'assistant', 'system'].includes(role)) return res.status(400).json({ error: 'invalid message role' });

    let actorKey = req.cookies?.[ACTOR_COOKIE];
    let visitKey = req.cookies?.[VISIT_COOKIE];
    if (!actorKey) {
      actorKey = newToken();
      res.cookie(ACTOR_COOKIE, actorKey, actorCookieOptions());
    }
    if (!visitKey) {
      visitKey = newToken();
      res.cookie(VISIT_COOKIE, visitKey, visitCookieOptions());
    }

    let lead = await db.prepare(`SELECT id, public_id FROM leads WHERE actor_key = $1 AND merged_into_id IS NULL`).get(actorKey);
    if (!lead) {
      const publicId = await newPublicId();
      const result = await db.prepare(`
        INSERT INTO leads (source, email, message, public_id, access_token, actor_key, provisional, answers)
        VALUES ($1, NULL, $2, $3, $4, $5, true, $6) RETURNING id
      `).run(source, message.slice(0, 2000), publicId, newToken(), actorKey, JSON.stringify({ attribution: attribution || null }));
      lead = { id: Number(result.lastInsertRowid), public_id: publicId };
      await ensureLeadRevenueRod(Number(lead.id), { source, actorKey, firstInteraction: message.slice(0, 500) });
    }

    if (questionKey) {
      const current = await db.prepare(`SELECT answers FROM leads WHERE id = $1`).get(Number(lead.id));
      let answers = {};
      try { answers = current?.answers ? JSON.parse(current.answers) : {}; } catch { answers = {}; }
      answers[String(questionKey).slice(0, 80)] = answerValue;
      await db.prepare(`UPDATE leads SET answers = $1, updated_at = $2 WHERE id = $3`).run(JSON.stringify(answers), Date.now(), Number(lead.id));
      const resolvedMetadataClass = metadataClass || (STAGE_GATE_KEYS.has(String(questionKey)) ? 'stage_gate' : 'context');
      const metadataColumn = resolvedMetadataClass === 'stage_gate' ? 'stage_gate_metadata' : 'context_metadata';
      await db.prepare(`UPDATE leads SET ${metadataColumn}=COALESCE(${metadataColumn},'{}'::jsonb) || $1::jsonb WHERE id=$2`)
        .run(JSON.stringify({ [String(questionKey).slice(0, 80)]: answerValue }), Number(lead.id));
    }

    const visitInsert = await db.prepare(`
      INSERT INTO lead_visits (lead_id, visit_key, entry_path, first_message, created_at)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (lead_id, visit_key) DO NOTHING
    `).run(Number(lead.id), visitKey, String(ctaLocation || '').slice(0, 500) || null, message.slice(0, 2000), Date.now());
    if (visitInsert.changes > 0) {
      await db.prepare(`UPDATE leads SET visit_count = visit_count + 1, last_visit_at = $1 WHERE id = $2`).run(Date.now(), Number(lead.id));
    }

    await db.prepare(`INSERT INTO lead_activity (lead_id, source, cta_location, message) VALUES ($1,$2,$3,$4)`)
      .run(Number(lead.id), source, String(ctaLocation || '').slice(0, 200) || null, message.slice(0, 2000));
    await db.prepare(`INSERT INTO lead_messages (lead_id,role,content) VALUES ($1,$2,$3)`).run(Number(lead.id), role, message.slice(0, 8000));
    const memoryRow = await db.prepare(`SELECT agent_memory FROM leads WHERE id=$1`).get(Number(lead.id));
    const currentMemory = memoryRow?.agent_memory || {};
    await db.prepare(`UPDATE leads SET agent_memory=$1::jsonb,updated_at=$2 WHERE id=$3`).run(JSON.stringify(mergeAgentMemory(currentMemory, memorySignalsFor(role, message, questionKey))), Date.now(), Number(lead.id));
    const tracked = await db.prepare(`SELECT visit_count FROM leads WHERE id = $1`).get(Number(lead.id));
    res.json({ ok: true, leadId: Number(lead.id), publicId: lead.public_id, provisional: true, visitCount: Number(tracked?.visit_count || 0) });
  } catch (e) {
    console.error('[leads] actor touch failed:', e.message);
    res.status(500).json({ error: 'failed to track actor context' });
  }
});

router.patch('/:id/stage-gates', requireAdmin, async (req, res) => {
  const { confirmedEarlyRegistrant, contractOutputReady, workEmailManualValidation } = req.body || {};
  const lead = await db.prepare(`SELECT id FROM leads WHERE id=$1 AND merged_into_id IS NULL`).get(Number(req.params.id));
  if (!lead) return res.status(404).json({ error: 'lead not found' });
  await db.prepare(`UPDATE leads SET confirmed_early_registrant=COALESCE($1,confirmed_early_registrant),contract_output_ready=COALESCE($2,contract_output_ready),work_email_manual_validation=COALESCE($3,work_email_manual_validation),stage_gate_metadata=COALESCE(stage_gate_metadata,'{}'::jsonb)||$4::jsonb,updated_at=$5 WHERE id=$6`).run(
    typeof confirmedEarlyRegistrant === 'boolean' ? confirmedEarlyRegistrant : null,
    typeof contractOutputReady === 'boolean' ? contractOutputReady : null,
    typeof workEmailManualValidation === 'boolean' ? workEmailManualValidation : null,
    JSON.stringify({ confirmedEarlyRegistrant: confirmedEarlyRegistrant ?? null, contractOutputReady: contractOutputReady ?? null, workEmailManualValidation: workEmailManualValidation ?? null }),
    Date.now(), Number(lead.id)
  );
  res.json({ ok: true });
});

// Creates/upgrades the actor's lead immediately after the mandatory email +
// CAPTCHA checkpoint and starts primary-email verification.
router.post('/intake-email', async (req, res) => {
  const { email, recaptchaToken, knowsBetsy, knowsBetsyDetail, sourceOutput } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const captcha = await verifyRecaptcha(recaptchaToken, 'bestystaff_lead_intake');
  if (!captcha.ok) return res.status(400).json({ error: captcha.error || 'CAPTCHA verification failed' });
  const norm = normalizeEmail(email);
  let actorKey = req.cookies?.[ACTOR_COOKIE];
  if (!actorKey) { actorKey = newToken(); res.cookie(ACTOR_COOKIE, actorKey, actorCookieOptions()); }
  let lead = await db.prepare(`SELECT id, public_id, verified_email FROM leads WHERE actor_key=$1 AND merged_into_id IS NULL`).get(actorKey);
  if (!lead) {
    const publicId = await newPublicId();
    const result = await db.prepare(`INSERT INTO leads (source,email,message,public_id,access_token,actor_key,provisional,answers) VALUES ('bestystaff',$1,$2,$3,$4,$5,true,$6) RETURNING id`).run(norm, 'Email collected; intake in progress', publicId, newToken(), actorKey, JSON.stringify({ knowsBetsy: !!knowsBetsy, knowsBetsyDetail: knowsBetsyDetail || '', sourceOutput: sourceOutput || null }));
    lead = { id: Number(result.lastInsertRowid), public_id: publicId, verified_email: false };
    await ensureLeadRevenueRod(Number(lead.id), { source: 'bestystaff', actorKey });
  } else {
    await db.prepare(`UPDATE leads SET email=$1, updated_at=$2 WHERE id=$3`).run(norm, Date.now(), Number(lead.id));
  }
  await db.prepare(`INSERT INTO lead_email_addresses (lead_id,email,email_type,is_primary,subscribed,verified) VALUES ($1,$2,'unknown',true,true,$3) ON CONFLICT (lead_id,email) DO UPDATE SET is_primary=true`).run(Number(lead.id), norm, !!lead.verified_email);
  await issueLeadEmailVerification({ leadId: Number(lead.id), email: norm });
  res.json({ ok: true, leadId: Number(lead.id), publicId: lead.public_id, emailDomainKind: classifyEmailDomain(norm), verificationPending: !lead.verified_email });
});

router.get('/verify-email', async (req, res) => {
  const hash = crypto.createHash('sha256').update(String(req.query.token || '')).digest('hex');
  const row = await db.prepare(`SELECT id,lead_id,email,expires_at,verified_at FROM lead_email_verifications WHERE token_hash=$1`).get(hash);
  if (!row || row.verified_at || Number(row.expires_at) < Date.now()) return res.status(400).send('This verification link is invalid or expired.');
  const now = Date.now();
  await db.prepare(`UPDATE lead_email_verifications SET verified_at=$1 WHERE id=$2`).run(now, Number(row.id));
  await db.prepare(`UPDATE lead_email_addresses SET verified=true,verified_at=$1 WHERE lead_id=$2 AND LOWER(email)=LOWER($3)`).run(now, Number(row.lead_id), row.email);
  const lead = await db.prepare(`SELECT email,public_id FROM leads WHERE id=$1`).get(Number(row.lead_id));
  if (lead && normalizeEmail(lead.email) === normalizeEmail(row.email)) await db.prepare(`UPDATE leads SET verified_email=true,updated_at=$1 WHERE id=$2`).run(now, Number(row.lead_id));
  res.redirect(`/lead/${lead?.public_id || ''}?emailVerified=1`);
});

// ── Public: create or merge a lead ──
router.post('/', async (req, res) => {
  // TODO(reCAPTCHA): wire verifyRecaptcha here once every lead-capture form
  // block (Join the Network, For Companies, contact, assessments) sends a
  // recaptchaToken. Keeping it off for now so this endpoint doesn't break when
  // RECAPTCHA_SECRET_KEY gets set — see scripts/add-tonight-defect-items.mjs
  // and task #28 in the session log for the rollout plan.
  const { source, email, phone, name, message, answers, ctaLocation, memberSlug, agentDefinitionId } = req.body || {};

  if (!isValidSource(source)) return res.status(400).json({ error: 'invalid source' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'a valid email is required' });

  const normPhone = normalizePhone(phone);
  if (phone && !normPhone) {
    return res.status(400).json({ error: 'phone number format looks off — 7 to 15 digits' });
  }

  const integrationRequest = process.env.LEAD_INTEGRATION_API_KEY
    && req.get('x-saltbasin-integration-key') === process.env.LEAD_INTEGRATION_API_KEY;
  if (!integrationRequest && rateLimited(req.ip)) return res.status(429).json({ error: 'slow down a moment' });

  const normEmail = normalizeEmail(email);
  const trimmedName = name?.slice(0, 200) || null;
  const messageLimit = source === 'bestystaff' ? 50_000 : 2_000;
  const trimmedMsg = message?.slice(0, messageLimit) || null;
  const structuredAnswers = answers && typeof answers === 'object' && !Array.isArray(answers)
    ? answers
    : null;
  const ctaLoc = typeof ctaLocation === 'string' ? ctaLocation.slice(0, 200) : null;
  const scopedAgent = agentDefinitionId
    ? await db.prepare(`SELECT id, scope_type, scope_id, config FROM agent_hub_definitions WHERE id=$1 AND enabled=true AND execution_mode='interactive'`).get(agentDefinitionId)
    : null;
  const scopedOrgId = scopedAgent?.scope_type === 'organization' ? Number(scopedAgent.scope_id) : null;
  const scopedMemberId = scopedAgent?.scope_type === 'member' ? Number(scopedAgent.scope_id) : null;
  const intentValue = String(structuredAnswers?.interestArea || structuredAnswers?.kind || '').toLowerCase();
  const gateDefinitions = mergedGateDefinitions(scopedAgent?.config ? (typeof scopedAgent.config === 'string' ? JSON.parse(scopedAgent.config) : scopedAgent.config) : {});
  const emailGate = emailGateFor(intentValue, normEmail, gateDefinitions);
  const workEmailManualValidation = emailGate.manualValidation;

  // Find any matching active leads (by email OR phone).
  const actorKey = req.cookies?.[ACTOR_COOKIE] || null;
  const matches = await findActiveMatches({ email: normEmail, phone: normPhone, actorKey });

  let leadId;
  let publicId;
  let accessToken;
  let accessPassword;
  let passwordHash;
  let isExisting;
  let mergedFromIds = [];

  if (matches.length > 0) {
    // MERGE PATH — keep the most-recently-updated match as the primary record,
    // pull older matches into its prior_notes, then update primary with the
    // new submission.
    const primary = matches[0];
    leadId = Number(primary.id);
    publicId = primary.public_id;
    accessToken = primary.access_token || newToken();

    // Build prior_notes additions from any other matched rows being archived.
    const additionalNotes = [];
    for (const m of matches.slice(1)) {
      additionalNotes.push({
        archivedFrom: Number(m.id),
        publicId: m.public_id,
        source: m.source,
        name: m.name,
        message: m.message,
        answers: m.answers ? JSON.parse(m.answers) : {},
        at: Number(m.created_at),
      });
      mergedFromIds.push(Number(m.id));
      await db
        .prepare(
          'UPDATE leads SET merged_into_id = $1, updated_at = $2 WHERE id = $3'
        )
        .run(leadId, Date.now(), Number(m.id));
    }

    if (additionalNotes.length) {
      const merged = mergePriorNotes(primary.prior_notes, additionalNotes);
      const existingFromIds = primary.merged_from_ids ? JSON.parse(primary.merged_from_ids) : [];
      const allFromIds = JSON.stringify([...existingFromIds, ...mergedFromIds]);
      await db
        .prepare(
          'UPDATE leads SET prior_notes = $1, merged_from_ids = $2, updated_at = $3 WHERE id = $4'
        )
        .run(merged, allFromIds, Date.now(), leadId);
    }

    // Fill in phone if we didn't have one before; fill in name only if blank.
    const updates = ['updated_at = $1'];
    const params = [Date.now()];
    let p = 2;
    if (normPhone && !primary.phone) {
      updates.push(`phone = $${p++}`);
      params.push(normPhone);
    }
    if (trimmedName && !primary.name) {
      updates.push(`name = $${p++}`);
      params.push(trimmedName);
    }
    if (!primary.email) {
      updates.push(`email = $${p++}`);
      params.push(normEmail);
    }
    if (primary.provisional) updates.push('provisional = false');
    if (structuredAnswers) {
      let priorAnswers = {};
      try { priorAnswers = primary.answers ? JSON.parse(primary.answers) : {}; } catch { priorAnswers = {}; }
      updates.push(`answers = $${p++}`);
      params.push(JSON.stringify({ ...priorAnswers, ...structuredAnswers }));
    }
    updates.push(`lead_intent = $${p++}`); params.push(intentValue || null);
    updates.push(`work_email_manual_validation = $${p++}`); params.push(workEmailManualValidation);
    if (structuredAnswers?.earlyRegistration === true) updates.push('confirmed_early_registrant = true');
    if (scopedAgent) { updates.push(`agent_definition_id = $${p++}`); params.push(Number(scopedAgent.id)); }
    if (scopedOrgId) { updates.push(`org_id = $${p++}`); params.push(scopedOrgId); }
    if (scopedMemberId) { updates.push(`originating_member_user_id = $${p++}`); params.push(scopedMemberId); }
    params.push(leadId);
    await db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = $${p}`).run(...params);
    await db.prepare(`UPDATE leads SET stage_gate_metadata=COALESCE(stage_gate_metadata,'{}'::jsonb)||$1::jsonb,context_metadata=COALESCE(context_metadata,'{}'::jsonb)||$2::jsonb WHERE id=$3`).run(JSON.stringify({ definitions: gateDefinitions, interestArea: structuredAnswers?.interestArea || null, intentClass: emailGate.intentClass, emailDomainKind: emailGate.domainKind, emailFormatValid: true, workEmailManualValidation, pledgeInterest: structuredAnswers?.pledgeInterest ?? null, earlyRegistration: structuredAnswers?.earlyRegistration ?? null }), JSON.stringify(structuredAnswers || {}), leadId);

    // If the submitted email differs from the existing primary email, capture
    // it in lead_email_addresses so it's not lost.
    if (primary.email && normEmail !== primary.email.toLowerCase()) {
      await db.prepare(`
        INSERT INTO lead_email_addresses (lead_id, email, email_type, is_primary, subscribed)
        VALUES ($1, $2, 'personal', false, true)
        ON CONFLICT (lead_id, email) DO NOTHING
      `).run(leadId, normEmail);
    }

    isExisting = true;

    // If the primary doesn't have a password yet (pre-password-era lead),
    // generate one now so the new submitter sees credentials.
    if (!primary.password_hash) {
      accessPassword = newAccessPassword();
      passwordHash = await bcrypt.hash(accessPassword, 10);
      await db
        .prepare('UPDATE leads SET password_hash = $1, access_token = $2 WHERE id = $3')
        .run(passwordHash, accessToken, leadId);
    } else {
      // We can't recover an existing password; explain to the lead they
      // should use the original credentials they got the first time.
      accessPassword = null;
    }
  } else {
    // NEW LEAD PATH
    publicId = await newPublicId();
    accessToken = newToken();
    accessPassword = newAccessPassword();
    passwordHash = await bcrypt.hash(accessPassword, 10);
    const result = await db
      .prepare(
        `INSERT INTO leads (source, email, phone, name, message, answers, public_id, access_token, password_hash, actor_key, provisional, agent_definition_id, org_id, originating_member_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11,$12,$13) RETURNING id`
      )
      .run(source, normEmail, normPhone, trimmedName, trimmedMsg, structuredAnswers ? JSON.stringify(structuredAnswers) : null, publicId, accessToken, passwordHash, actorKey, scopedAgent ? Number(scopedAgent.id) : null, scopedOrgId, scopedMemberId);
    leadId = Number(result.lastInsertRowid);
    isExisting = false;
    await db.prepare(`UPDATE leads SET lead_intent=$1,work_email_manual_validation=$2,confirmed_early_registrant=$3,stage_gate_metadata=$4::jsonb,context_metadata=$5::jsonb WHERE id=$6`).run(intentValue || null, workEmailManualValidation, structuredAnswers?.earlyRegistration === true, JSON.stringify({ definitions: gateDefinitions, interestArea: structuredAnswers?.interestArea || null, intentClass: emailGate.intentClass, emailDomainKind: emailGate.domainKind, emailFormatValid: true, workEmailManualValidation, pledgeInterest: structuredAnswers?.pledgeInterest ?? null, earlyRegistration: structuredAnswers?.earlyRegistration ?? null }), JSON.stringify(structuredAnswers || {}), leadId);
  }

  await ensureLeadRevenueRod(leadId, { source, actorKey, ctaLocation: ctaLoc });

  // Always log activity — first submission, merge, or repeat CTA.
  await db
    .prepare(
      'INSERT INTO lead_activity (lead_id, source, cta_location, message) VALUES ($1, $2, $3, $4)'
    )
    .run(leadId, source, ctaLoc, trimmedMsg);

  // Send confirmation email to the lead (Resend if configured; console stub otherwise).
  const leadUrl = `/lead/${publicId}`;
  if (accessPassword) {
    sendLeadConfirmation({
      leadId,
      toEmail: normEmail,
      toName: trimmedName,
      leadUrl,
      password: accessPassword,
      source,
    }).catch((e) => console.error('[email] confirmation failed:', e.message));
  }

  // If submitted on a member's profile, notify that member's verified emails.
  if (memberSlug && typeof memberSlug === 'string') {
    db.prepare(
      `SELECT ue.email, u.display_name
         FROM member_profiles mp
         JOIN users u ON u.id = mp.user_id
         JOIN user_emails ue ON ue.user_id = mp.user_id
        WHERE mp.slug = $1 AND ue.verified = true`
    ).all(memberSlug).then((rows) => {
      for (const r of rows) {
        sendContactFormToMember({
          toEmail: r.email,
          memberName: r.display_name || null,
          fromName: trimmedName,
          fromEmail: normEmail,
          fromPhone: normPhone,
          message: trimmedMsg,
        }).catch((e) => console.error('[email] member contact notify failed:', e.message));
      }
    }).catch((e) => console.error('[email] member lookup failed:', e.message));
  }

  // Route agent-created leads to the owning scope. Platform leads retain the
  // Salt Basin admin alert; organization/member leads do not leak upstream.
  if (scopedOrgId || scopedMemberId) {
    const recipients = scopedOrgId
      ? await db.prepare(`SELECT DISTINCT u.email, u.display_name FROM org_memberships om JOIN users u ON u.id=om.user_id WHERE om.org_id=$1 AND om.role IN ('admin','owner')`).all(scopedOrgId)
      : await db.prepare(`SELECT email, display_name FROM users WHERE id=$1`).all(scopedMemberId);
    for (const recipient of recipients) sendContactFormToMember({
      toEmail: recipient.email, memberName: recipient.display_name, fromName: trimmedName,
      fromEmail: normEmail, fromPhone: normPhone, message: trimmedMsg,
    }).catch((e) => console.error('[email] scoped lead notify failed:', e.message));
  } else sendNewLeadAlert({
    leadId,
    source,
    leadEmail: normEmail,
    leadName: trimmedName,
    leadPhone: normPhone,
    leadMessage: trimmedMsg,
    leadUrl,
    isExisting,
    ctaLocation: ctaLoc,
  }).catch((e) => console.error('[email] alert failed:', e.message));

  // Load contact emails for this lead (returned so modal can show them)
  const contactEmails = await db.prepare(
    `SELECT id, email, email_type, org_name, is_primary, subscribed FROM lead_email_addresses WHERE lead_id = $1 ORDER BY is_primary DESC, id ASC`
  ).all(leadId);

  res.json({
    ok: true,
    leadId,
    publicId,
    leadUrl,
    password: accessPassword, // only returned on creation or first-merge; never re-fetched
    existing: isExisting,
    merged: mergedFromIds.length,
    // When an existing lead is matched with a different submitted email
    existingEmail: isExisting ? (matches[0]?.email || null) : null,
    alternateEmail: (isExisting && matches[0]?.email && normEmail !== matches[0].email.toLowerCase()) ? normEmail : null,
    contactEmails,
    // Legacy: callers can still pass `?t=token` for direct-link auth.
    token: accessToken,
  });
});

// ── Public: unlock a lead via password ──
router.post('/public/:publicId/unlock', async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'password required' });
  const lead = await db
    .prepare(
      'SELECT id, password_hash, merged_into_id FROM leads WHERE public_id = $1'
    )
    .get(req.params.publicId);
  if (!lead) return res.status(404).json({ error: 'not found' });
  if (lead.merged_into_id) {
    return res.status(410).json({ error: 'this lead has been merged into a newer record' });
  }
  if (!lead.password_hash) {
    return res.status(409).json({ error: 'this lead predates password access — use the original ?t= link' });
  }
  const ok = await bcrypt.compare(password, lead.password_hash);
  if (!ok) return res.status(401).json({ error: 'incorrect password' });

  const token = newToken();
  const expires = Date.now() + LEAD_SESSION_TTL_MS;
  await db
    .prepare('INSERT INTO lead_sessions (token, lead_id, expires_at) VALUES ($1, $2, $3)')
    .run(token, Number(lead.id), expires);
  res.cookie(LEAD_COOKIE, token, leadCookieOptions());
  res.json({ ok: true });
});

router.post('/public/:publicId/logout', async (req, res) => {
  const token = req.cookies?.[LEAD_COOKIE];
  if (token) await db.prepare('DELETE FROM lead_sessions WHERE token = $1').run(token);
  res.clearCookie(LEAD_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ── Pledge interest — member site coming soon ──
// Stamps pledged_at on the lead so Betsy can see who wants to be converted
// when the member site goes live. Lead must be authed (cookie present).
router.post('/public/:publicId/pledge', async (req, res) => {
  const lead = await requireLeadAuth(req, res);
  if (!lead) return;
  const squarePaymentUrl = process.env.SQUARE_PLEDGE_PAYMENT_URL || null;
  if (lead.pledged_at) return res.json({ ok: true, alreadyPledged: true, paymentOptional: true, paymentUrl: squarePaymentUrl });
  const now = Date.now();
  await db.prepare(`UPDATE leads SET pledged_at = $1, updated_at = $2 WHERE id = $3`)
    .run(now, now, lead.id);
  res.json({ ok: true, pledgedAt: now, paymentOptional: true, paymentUrl: squarePaymentUrl });
});

// ── Convert lead → member ──
//
// Called from the authed lead view. The lead must:
//   (a) have a current valid lead_session cookie (or be acting via admin),
//   (b) re-enter their lead password as confirmation (so a borrowed open
//       tab can't elevate someone else's lead to a paying member account).
//
// On success we create a `users` row using the lead's existing password_hash
// directly — same password as the lead, no re-hash. The lead row persists
// (only `converted_user_id` is set) so all prior context (messages, emails,
// activity, prior_notes from any merged-in leads) stays accessible.
//
// member_sites is auto-seeded on first dashboard hit via memberSite.js
// ensureDraft(), so we only need to create the user + member_profiles +
// the link back to the lead here.
router.post('/public/:publicId/convert', async (req, res) => {
  const { password, recaptchaToken, loginEmail, agreedToTerms } = req.body || {};
  if (!password) return res.status(400).json({ error: 'password required' });
  if (agreedToTerms !== true) {
    return res.status(400).json({ error: 'You must agree to the Terms of Service and Privacy Policy.' });
  }
  if (loginEmail !== undefined && loginEmail !== null && !isValidEmail(loginEmail)) {
    return res.status(400).json({ error: 'loginEmail is not a valid email address' });
  }

  const captcha = await verifyRecaptcha(recaptchaToken, 'convert_to_member');
  if (!captcha.ok) return res.status(400).json({ error: captcha.error || 'captcha verification failed' });

  const lead = await db
    .prepare(`SELECT id, public_id, email, name, password_hash, converted_user_id, merged_into_id, verified_email, pledged_at, confirmed_early_registrant, contract_output_ready, lead_intent, work_email_manual_validation FROM leads WHERE public_id = $1`)
    .get(req.params.publicId);
  if (!lead) return res.status(404).json({ error: 'lead not found' });
  if (lead.merged_into_id) return res.status(410).json({ error: 'this lead has been merged into a newer record' });
  if (!lead.email) return res.status(400).json({ error: 'lead has no email — cannot become a member' });
  const anyVerifiedEmail = lead.verified_email || !!(await db.prepare(`SELECT 1 FROM lead_email_addresses WHERE lead_id=$1 AND verified=true LIMIT 1`).get(Number(lead.id)));
  if (!anyVerifiedEmail) return res.status(409).json({ error: 'Verify at least one email address before becoming a member.' });
  const pendingEmailRows = await db.prepare(`SELECT email FROM lead_email_addresses WHERE lead_id=$1 AND verified=false`).all(Number(lead.id));
  for (const pending of pendingEmailRows) issueLeadEmailVerification({ leadId: Number(lead.id), email: pending.email, name: lead.name || null }).catch((error) => console.error('[leads] pending verification restart failed:', error.message));
  if (lead.work_email_manual_validation) return res.status(409).json({ error: 'Your work email still needs manual validation before member conversion.' });
  const storedGateRow = await db.prepare(`SELECT stage_gate_metadata FROM leads WHERE id=$1`).get(Number(lead.id));
  const storedGateMetadata = storedGateRow?.stage_gate_metadata || {};
  lead.any_verified_email = anyVerifiedEmail;
  const conversion = evaluateLeadConversion(lead, storedGateMetadata.definitions || undefined);
  if (!conversion.eligible) return res.status(409).json({ error: conversion.intentClass === 'b2b' ? 'This B2B lead becomes conversion-eligible when Salt Basin marks a contract or binding output ready and its work email passes validation.' : conversion.intentClass === 'career' ? 'Confirm early registration or a pledge and verify an email before member conversion.' : 'This lead is not yet eligible for member conversion.' });
  if (lead.converted_user_id) {
    return res.status(409).json({ error: 'already converted', userId: Number(lead.converted_user_id) });
  }
  if (!lead.password_hash) {
    return res.status(409).json({ error: 'lead has no password set — cannot confirm conversion' });
  }

  // (a) Authorization: lead_session matches this lead, OR caller is an admin.
  const leadCookie = req.cookies?.[LEAD_COOKIE];
  const adminCookie = req.cookies?.sb_admin;
  let authorized = false;
  if (adminCookie) {
    const session = await db
      .prepare(`SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > $2`)
      .get(adminCookie, Date.now());
    if (session?.role === 'admin') authorized = true;
  }
  if (!authorized && leadCookie) {
    const ls = await db
      .prepare(`SELECT lead_id, expires_at FROM lead_sessions WHERE token = $1`)
      .get(leadCookie);
    if (ls && Number(ls.expires_at) > Date.now() && Number(ls.lead_id) === Number(lead.id)) {
      authorized = true;
    }
  }
  if (!authorized) return res.status(401).json({ error: 'session required — open this URL from your lead view' });

  // (b) Password re-entry confirmation.
  const ok = await bcrypt.compare(password, lead.password_hash);
  if (!ok) return res.status(401).json({ error: 'incorrect password' });

  // Email collision check — check both primary users.email and verified
  // secondary user_emails entries, since a lead conversion can otherwise
  // create a duplicate when the email is already a secondary address on an
  // existing account (e.g. admin added their org email to their admin account,
  // then later submitted a lead with that same org email).
  // A custom-domain lead email may not be the right login — BestyStaff asks
  // whether conversion is for personal membership and, if so, captures a
  // separate personal email (see the convert_lead_to_member tool in
  // bestyStaff.js). loginEmail overrides which email becomes users.email;
  // the lead's original email and all its history stay attached to the lead
  // row either way.
  const lowerEmail = normalizeEmail(loginEmail || lead.email);
  const existingPrimary = await db.prepare(`SELECT id FROM users WHERE email = $1`).get(lowerEmail);
  if (existingPrimary) {
    return res.status(409).json({
      error: 'an account with this email already exists — sign in instead',
      userId: Number(existingPrimary.id),
    });
  }
  const existingSecondary = await db.prepare(
    `SELECT u.id, u.email AS primaryEmail FROM user_emails ue JOIN users u ON u.id = ue.user_id WHERE ue.email = $1 AND ue.verified = true`
  ).get(lowerEmail);
  if (existingSecondary) {
    return res.status(409).json({
      error: `this email is already linked to an account — sign in with ${existingSecondary.primaryEmail}`,
      userId: Number(existingSecondary.id),
      primaryEmail: existingSecondary.primaryEmail,
    });
  }

  // Create user with the SAME password_hash (no re-hash — same password). The
  // lead's already-bcrypted hash satisfies users.password_hash directly.
  const userInsert = await db
    .prepare(`INSERT INTO users (email, password_hash, role, must_change_password) VALUES ($1, $2, 'member', true) RETURNING id`)
    .run(lowerEmail, lead.password_hash);
  const newUserId = Number(userInsert.lastInsertRowid);
  await recordConsent(newUserId, 'platform_terms', true, { ip: req.ip, userAgent: req.get('user-agent') });
  await ensureCareerFoundationTrial(newUserId).catch((e) =>
    console.error('[leads] Career Foundation trial provisioning failed:', e.message)
  );

  // Member profile (separate from member_sites — both exist; profile holds
  // the slug + the simpler "about you" structure; sites holds the multi-page
  // CMS data which is lazily seeded on first dashboard access).
  const displayName = lead.name || lowerEmail.split('@')[0];
  const slug = await uniqueSlugForConvert(displayName);
  const profile = defaultMemberProfile({ displayName, email: lowerEmail });
  await db
    .prepare(`INSERT INTO member_profiles (user_id, slug, draft, published) VALUES ($1, $2, $3, NULL)`)
    .run(newUserId, slug, JSON.stringify(profile));

  // Link the lead → new user.
  await db
    .prepare(`UPDATE leads SET converted_user_id = $1, updated_at = $2 WHERE id = $3`)
    .run(newUserId, Date.now(), Number(lead.id));
  const memberRod = await ensureMemberJourneyRods(newUserId, Number(lead.id));
  await upsertAccountRecord({ accountType: 'member', userId: newUserId, leadId: Number(lead.id), displayName: lead.name || null });
  // Member Entitlement Provisioning (DTC path): give the new member both
  // default modules — Personal Brand Website + Resume Output Creator — as
  // part of this same onboarding action. Never let a provisioning hiccup
  // block the conversion itself (the account/session above is already
  // real); log and continue.
  provisionDefaultModulesForNewMember(memberRod, newUserId).catch((e) =>
    console.error('[leads] provisionDefaultModulesForNewMember failed:', e.message)
  );

  // Register the primary email in user_emails so it's visible in the email
  // manager and so secondary-email lookups in login() find it correctly.
  await db.prepare(
    `INSERT INTO user_emails (user_id, email, type, verified) VALUES ($1, $2, 'primary', $3) ON CONFLICT (email) DO NOTHING`
  ).run(newUserId, lowerEmail, lowerEmail === normalizeEmail(lead.email) ? !!lead.verified_email : false);

  // Auto-login as the new member. Issues a session and sets the same admin
  // cookie used elsewhere (the cookie is role-agnostic; AdminShell decides
  // what to render based on user.role).
  const { token } = await createSession(newUserId);
  setAdminCookie(res, token);

  // Drop the now-redundant lead_session (the lead and the member are the
  // same person; one auth cookie is enough).
  if (leadCookie) {
    await db.prepare(`DELETE FROM lead_sessions WHERE token = $1`).run(leadCookie);
    res.clearCookie(LEAD_COOKIE, { path: '/' });
  }

  res.json({
    ok: true,
    slug,
    user: { id: newUserId, email: lowerEmail, role: 'member' },
    redirectTo: '/member',
  });
});

// Local slug generator — kept self-contained so leads.js doesn't have to
// import the slugify helpers from members.js (different module, same logic).
async function uniqueSlugForConvert(base) {
  const slug = (base || 'operator').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'operator';
  let candidate = slug;
  let n = 0;
  while (true) {
    const exists = await db.prepare(`SELECT 1 FROM member_profiles WHERE slug = $1`).get(candidate);
    if (!exists) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

// ── Authorization for read/update ──
async function getLeadByPublic(req) {
  const publicId = req.params.publicId;
  const queryToken = req.query.t;
  const leadCookie = req.cookies?.[LEAD_COOKIE];

  const row = await db
    .prepare(
      `SELECT id, source, email, phone, name, message, public_id, access_token, answers,
              prior_notes, merged_from_ids, merged_into_id, password_hash,
              created_at, updated_at, converted_user_id, visit_count, last_visit_at,
              pledged_at, verified_email, lead_intent, work_email_manual_validation,
              confirmed_early_registrant, contract_output_ready,
              stage_gate_metadata, context_metadata, agent_memory
       FROM leads WHERE public_id = $1`
    )
    .get(publicId);
  if (!row) return { error: 'not found', status: 404 };
  if (row.merged_into_id) {
    return { error: 'merged into newer record', status: 410 };
  }

  // 1. Admin bypass
  const adminCookie = req.cookies?.sb_admin;
  if (adminCookie) {
    const session = await db
      .prepare(
        `SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > $2`
      )
      .get(adminCookie, Date.now());
    if (session?.role === 'admin') return { lead: row };
  }

  // 2. Lead session cookie
  if (leadCookie) {
    const ls = await db
      .prepare('SELECT lead_id, expires_at FROM lead_sessions WHERE token = $1')
      .get(leadCookie);
    if (ls && Number(ls.expires_at) > Date.now() && Number(ls.lead_id) === Number(row.id)) {
      return { lead: row };
    }
  }

  // 3. Legacy URL token (?t=...)
  if (queryToken && queryToken === row.access_token) {
    return { lead: row };
  }

  // 4. No valid auth — signal that the password prompt should show.
  return { error: 'password required', status: 401, needsPassword: true };
}

router.get('/public/:publicId', async (req, res) => {
  const { lead, error, status, needsPassword } = await getLeadByPublic(req);
  if (error) {
    return res.status(status).json({ error, needsPassword });
  }
  const activity = await fetchActivity(Number(lead.id));
  const emails = await db
    .prepare(
      `SELECT id, to_email, from_email, subject, body_text, provider, status, sent_at
       FROM lead_emails WHERE lead_id = $1 ORDER BY sent_at DESC LIMIT 50`
    )
    .all(Number(lead.id));
  const contactEmails = await db
    .prepare(
      `SELECT id, email, email_type, org_name, is_primary, subscribed, verified, verified_at, created_at
       FROM lead_email_addresses WHERE lead_id = $1 ORDER BY is_primary DESC, id ASC`
    )
    .all(Number(lead.id));
  const chatMessages = await db.prepare(`SELECT id,role,content,created_at FROM lead_messages WHERE lead_id=$1 ORDER BY created_at ASC,id ASC LIMIT 250`).all(Number(lead.id));
  const anyVerifiedEmail = !!lead.verified_email || contactEmails.some((email) => email.verified);
  const conversionEvaluation = evaluateLeadConversion({ ...lead, any_verified_email: anyVerifiedEmail }, lead.stage_gate_metadata?.definitions || undefined);
  res.json({
    publicId: lead.public_id,
    source: lead.source,
    email: lead.email,
    phone: lead.phone,
    name: lead.name,
    message: lead.message,
    answers: lead.answers ? JSON.parse(lead.answers) : {},
    priorNotes: lead.prior_notes ? JSON.parse(lead.prior_notes) : [],
    mergedFromCount: lead.merged_from_ids ? JSON.parse(lead.merged_from_ids).length : 0,
    activity,
    emails: emails.map((e) => ({
      id: Number(e.id),
      to: e.to_email,
      from: e.from_email,
      subject: e.subject,
      body: e.body_text,
      provider: e.provider,
      status: e.status,
      sentAt: Number(e.sent_at),
    })),
    contactEmails: contactEmails.map((e) => ({
      id: Number(e.id),
      email: e.email,
      emailType: e.email_type,
      orgName: e.org_name,
      isPrimary: e.is_primary,
      subscribed: e.subscribed,
      verified: !!e.verified,
      verifiedAt: e.verified_at ? Number(e.verified_at) : null,
      createdAt: Number(e.created_at),
    })),
    chatMessages: chatMessages.map((item) => ({ id: Number(item.id), role: item.role, content: item.content, createdAt: Number(item.created_at) })),
    primaryEmailVerified: !!lead.verified_email,
    anyVerifiedEmail,
    leadIntent: lead.lead_intent,
    workEmailManualValidation: !!lead.work_email_manual_validation,
    confirmedEarlyRegistrant: !!lead.confirmed_early_registrant,
    contractOutputReady: !!lead.contract_output_ready,
    conversionEligibility: conversionEvaluation,
    stageGateMetadata: lead.stage_gate_metadata || {},
    contextMetadata: lead.context_metadata || {},
    agentMemory: lead.agent_memory || {},
    createdAt: Number(lead.created_at),
    updatedAt: Number(lead.updated_at),
    convertedUserId: lead.converted_user_id ? Number(lead.converted_user_id) : null,
    pledgedAt: lead.pledged_at ? Number(lead.pledged_at) : null,
    visitCount: Number(lead.visit_count || 0),
    lastVisitAt: lead.last_visit_at ? Number(lead.last_visit_at) : null,
  });
});

// ── Lead contact-email management ──

// POST /api/leads/public/:publicId/contact-emails — add an email address
router.post('/public/:publicId/contact-emails', async (req, res) => {
  const { lead, error, status, needsPassword } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error, needsPassword });
  const { email, emailType = 'personal', orgName } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'valid email required' });
  const norm = normalizeEmail(email);
  try {
  const row = await db.prepare(`
      INSERT INTO lead_email_addresses (lead_id, email, email_type, org_name, is_primary, subscribed)
      VALUES ($1, $2, $3, $4, false, true)
      ON CONFLICT (lead_id, email) DO UPDATE SET email_type = EXCLUDED.email_type, org_name = EXCLUDED.org_name
      RETURNING id, email, email_type, org_name, is_primary, subscribed, verified, verified_at, created_at
    `).get(Number(lead.id), norm, emailType, orgName || null);
    await issueLeadEmailVerification({ leadId: Number(lead.id), email: norm, name: lead.name || null });
    res.json({ ok: true, verificationSent: true, contactEmail: { id: Number(row.id), email: row.email, emailType: row.email_type, orgName: row.org_name, isPrimary: row.is_primary, subscribed: row.subscribed, verified: !!row.verified, verifiedAt: row.verified_at ? Number(row.verified_at) : null, createdAt: Number(row.created_at) } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/public/:publicId/contact-emails/:id/resend-verification', async (req, res) => {
  const { lead, error, status } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  const email = await db.prepare(`SELECT email,verified FROM lead_email_addresses WHERE id=$1 AND lead_id=$2`).get(Number(req.params.id), Number(lead.id));
  if (!email) return res.status(404).json({ error: 'email address not found' });
  if (email.verified) return res.json({ ok: true, alreadyVerified: true });
  await issueLeadEmailVerification({ leadId: Number(lead.id), email: email.email, name: lead.name || null });
  res.json({ ok: true });
});

// PATCH /api/leads/public/:publicId/contact-emails/:id — update type, primary, subscribed, orgName
router.patch('/public/:publicId/contact-emails/:id', async (req, res) => {
  const { lead, error, status, needsPassword } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error, needsPassword });
  const emailId = Number(req.params.id);
  const { emailType, orgName, isPrimary, subscribed } = req.body || {};

  const existing = await db.prepare(`SELECT id FROM lead_email_addresses WHERE id = $1 AND lead_id = $2`).get(emailId, Number(lead.id));
  if (!existing) return res.status(404).json({ error: 'email not found' });

  const set = [];
  const params = [];
  let p = 1;
  if (emailType !== undefined) { set.push(`email_type = $${p++}`); params.push(emailType); }
  if (orgName !== undefined) { set.push(`org_name = $${p++}`); params.push(orgName || null); }
  if (subscribed !== undefined) { set.push(`subscribed = $${p++}`); params.push(!!subscribed); }
  if (isPrimary === true) {
    await db.prepare(`UPDATE lead_email_addresses SET is_primary = false WHERE lead_id = $1`).run(Number(lead.id));
    set.push(`is_primary = true`);
  }

  if (set.length === 0) return res.json({ ok: true });
  params.push(emailId);
  await db.prepare(`UPDATE lead_email_addresses SET ${set.join(', ')} WHERE id = $${p}`).run(...params);
  res.json({ ok: true });
});

router.patch('/public/:publicId', async (req, res) => {
  const { lead, error, status, needsPassword } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error, needsPassword });
  const { name, phone, answers } = req.body || {};
  const nextName = typeof name === 'string' ? name.slice(0, 200) : lead.name;
  const nextPhone = phone !== undefined ? normalizePhone(phone) : lead.phone;
  if (phone && !nextPhone) {
    return res.status(400).json({ error: 'phone number format looks off' });
  }
  const nextAnswers = answers && typeof answers === 'object'
    ? JSON.stringify({ ...(lead.answers ? JSON.parse(lead.answers) : {}), ...answers })
    : lead.answers;
  await db
    .prepare(
      `UPDATE leads SET name = $1, phone = $2, answers = $3, updated_at = $4 WHERE id = $5`
    )
    .run(nextName, nextPhone, nextAnswers, Date.now(), Number(lead.id));
  res.json({ ok: true });
});

router.post('/public/:publicId/chat', async (req, res) => {
  const { error, status } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  res.status(501).json({
    error: 'BestyStaff agent comes online in Phase 5 / when ANTHROPIC_API_KEY is set.',
  });
});

// ── Admin ──
router.get('/', requireAdmin, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT id, source, email, phone, name, message, public_id, answers, prior_notes,
              merged_into_id, merged_from_ids, created_at, updated_at, converted_user_id,
              lead_type, job_description, job_url, company, hiring_manager, job_status,
              verified_email, lead_intent, work_email_manual_validation,
              confirmed_early_registrant, contract_output_ready, pledged_at,
              stage_gate_metadata, context_metadata, agent_memory
       FROM leads WHERE merged_into_id IS NULL ORDER BY id DESC LIMIT 500`
    )
    .all();
  res.json({
    leads: rows.map((r) => ({
      ...r,
      id: Number(r.id),
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at),
      answers: r.answers ? JSON.parse(r.answers) : null,
      priorNotes: r.prior_notes ? JSON.parse(r.prior_notes) : [],
      mergedFromCount: r.merged_from_ids ? JSON.parse(r.merged_from_ids).length : 0,
    })),
  });
});

// ── Admin: manually create a lead (skip email optional) ──
router.post('/admin-create', requireAdmin, async (req, res) => {
  const {
    email, name, phone, message, source = 'manual',
    skipEmail = false,
    leadType = 'network',
    jobDescription, jobUrl, company, hiringManager, jobStatus = 'new',
  } = req.body || {};

  if (!isValidEmail(email)) return res.status(400).json({ error: 'valid email required' });
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePhone(phone);
  const publicId = await newPublicId();
  const accessToken = newToken();
  const accessPassword = newAccessPassword();
  const passwordHash = await bcrypt.hash(accessPassword, 10);

  const result = await db.prepare(
    `INSERT INTO leads
       (source, email, phone, name, message, public_id, access_token, password_hash,
        lead_type, job_description, job_url, company, hiring_manager, job_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`
  ).run(
    source, normEmail, normPhone || null, name?.slice(0, 200) || null, message?.slice(0, 2000) || null,
    publicId, accessToken, passwordHash,
    leadType,
    jobDescription?.slice(0, 5000) || null,
    jobUrl?.slice(0, 500) || null,
    company?.slice(0, 200) || null,
    hiringManager?.slice(0, 200) || null,
    jobStatus,
  );
  const leadId = Number(result.lastInsertRowid);

  if (!skipEmail && leadType === 'network') {
    sendLeadConfirmation({
      leadId, toEmail: normEmail, toName: name || null,
      leadUrl: `/lead/${publicId}`, password: accessPassword, source,
    }).catch((e) => console.error('[email] admin-create confirm failed:', e.message));
  }

  res.json({ ok: true, leadId, publicId, leadUrl: `/lead/${publicId}`, password: accessPassword });
});

// ── Admin: update lead job fields / status ──
router.patch('/:id/job', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { jobStatus, company, hiringManager, jobUrl, jobDescription, leadType } = req.body || {};
  const updates = ['updated_at = $1'];
  const params = [Date.now()];
  let p = 2;
  if (jobStatus !== undefined) { updates.push(`job_status = $${p++}`); params.push(jobStatus); }
  if (company !== undefined) { updates.push(`company = $${p++}`); params.push(company); }
  if (hiringManager !== undefined) { updates.push(`hiring_manager = $${p++}`); params.push(hiringManager); }
  if (jobUrl !== undefined) { updates.push(`job_url = $${p++}`); params.push(jobUrl); }
  if (jobDescription !== undefined) { updates.push(`job_description = $${p++}`); params.push(jobDescription); }
  if (leadType !== undefined) { updates.push(`lead_type = $${p++}`); params.push(leadType); }
  params.push(id);
  await db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = $${p}`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  await db.prepare('DELETE FROM leads WHERE id = $1').run(id);
  res.json({ ok: true });
});

export default router;
