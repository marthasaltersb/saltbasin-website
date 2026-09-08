// BestyStaff — deterministic request_betsy intake engine.
//
// No Anthropic tool calls anywhere in this file. The old design let Claude
// decide, via tool_use, when to fetch coverage options, submit the intake,
// or gather each field — genuinely nondeterministic control flow for things
// that don't need to be. This engine inverts that: a plain JS step table
// drives which question is being asked and when the intake is complete
// enough to submit (see runRequestBetsyTurn's step walk and the required-
// field check before createPortfolioRequest is called); Claude is called
// once per turn as a plain, tool-less completion whose only job is the
// genuinely probabilistic part — reading the visitor's free text against
// the CURRENT step's question and extracting the value(s), plus drafting
// the next reply line in Betsy's voice. The route's own code decides what
// happens next; Claude never triggers a side effect directly.
//
// build_own is not converted yet (see server/routes/bestyStaff.js) — it
// still runs the old tool-calling loop until it gets the same treatment.

import { z } from 'zod';
import { db } from '../db.js';
import { createPortfolioRequest } from '../routes/portfolioRequests.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Deterministic reads (never model-invoked) ───────────────────────────────
// A pure DB read with no judgment involved — always fetched directly by code
// right before the coverage step is asked, never something Claude "decides"
// to call.
export async function getCoverageOptions() {
  try {
    const [engRows, skillRows, toolRows] = await Promise.all([
      db.prepare(`SELECT scenarios FROM career_engagements WHERE publish_case_study = true`).all(),
      db.prepare(`SELECT DISTINCT category FROM career_skills WHERE category IS NOT NULL ORDER BY category`).all(),
      db.prepare(`SELECT name_used, current_name FROM career_tools WHERE tier IN ('Expert','Advanced') ORDER BY order_index, id`).all(),
    ]);
    const scenarios = [...new Set(engRows.flatMap((r) => {
      try { return typeof r.scenarios === 'string' ? JSON.parse(r.scenarios) : (r.scenarios || []); } catch { return []; }
    }))].slice(0, 15);
    const skillAreas = skillRows.map((r) => r.category).slice(0, 12);
    const technologyModules = [...new Set(toolRows.map((r) => (r.current_name && !/sunset/i.test(r.current_name) ? r.current_name : r.name_used)))].slice(0, 14);
    return { scenarios, skillAreas, technologyModules };
  } catch (e) {
    return { scenarios: [], skillAreas: [], technologyModules: [], error: `Failed to load coverage options: ${e.message}` };
  }
}

// ── Step table (mirrors FLOW 1 in the old system prompt) ────────────────────
// 'contact' and 'earlyRegistration' are handled with dedicated logic below
// (multi-field / fixed-wording), not the generic single-field extractor.
const STEPS = ['knowsBetsy', 'comparingToRole', 'awaitingJobDescription', 'coverage', 'contact', 'earlyRegistration', 'done'];

function nextStep(current) {
  const idx = STEPS.indexOf(current);
  return STEPS[Math.min(idx + 1, STEPS.length - 1)];
}

function extractJson(text) {
  const stripped = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(stripped);
}

async function callClaude(anthropic, { model, maxTokens, system, message }) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: message }],
  });
  return (response.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

const BoolStepSchema = z.object({
  answered: z.boolean(),
  value: z.boolean().nullable(),
  detail: z.string().nullable(),
  reply: z.string(),
});

const CoverageSchema = z.object({
  matchedOptions: z.array(z.string()),
  coverageNotes: z.string().nullable(),
  reply: z.string(),
});

const ContactSchema = z.object({
  answered: z.boolean(), // true only once a valid-looking email was extracted
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactCompany: z.string().nullable(),
  contactTitle: z.string().nullable(),
  contactPhone: z.string().nullable(),
  reply: z.string(),
});

const EarlyRegSchema = z.object({
  answered: z.boolean(),
  earlyRegistration: z.boolean().nullable(),
  pledgeInterest: z.boolean().nullable(),
  reply: z.string(),
});

const VOICE = `You are BestyStaff — Betsy Salter's AI proxy agent at Salt Basin Net Works. Style: Strategic Operator voice — direct, warm, no fluff, no corporate filler. Keep replies short (1-3 sentences). Never invent facts, pricing, or commitments.`;

async function step_knowsBetsy(anthropic, model, maxTokens, message) {
  const system = `${VOICE}

Your only job this turn: read the visitor's message and determine whether they've answered "Do you already know Betsy? If so, what's the connection?" Extract a boolean (do they know her) and, if yes, the connection detail as free text.

Respond with ONLY a JSON object (no prose, no code fence):
{
  "answered": boolean,        // true only if the message clearly answers yes/no
  "value": boolean | null,    // true = knows Betsy, false = doesn't, null if unanswered
  "detail": string | null,    // the connection, if they said yes and described it
  "reply": string             // if answered: a brief acknowledgment, then ask "Are you comparing Betsy to an open role? If so, paste the job description (or a link to it) right into the chat." — if not answered: a brief clarifying nudge
}`;
  const text = await callClaude(anthropic, { model, maxTokens, system, message });
  return BoolStepSchema.parse(extractJson(text));
}

async function step_comparingToRole(anthropic, model, maxTokens, message) {
  const system = `${VOICE}

Your only job this turn: read the visitor's message and determine whether they've answered "Are you comparing Betsy to an open role?" If they pasted a job description or a link in the same message, capture it verbatim as detail — don't summarize or alter it.

Respond with ONLY a JSON object (no prose, no code fence):
{
  "answered": boolean,
  "value": boolean | null,    // true = comparing to a role, false = not, null if unanswered
  "detail": string | null,    // the job description/link, verbatim, if given in this message
  "reply": string             // if answered=true and value=true but detail is null: ask them to paste the job description (or a link) right into the chat. If answered=true and (value=false or detail present): brief acknowledgment, then say you'll ask what the tailored outputs should cover. If not answered: a brief clarifying nudge.
}`;
  const text = await callClaude(anthropic, { model, maxTokens, system, message });
  return BoolStepSchema.parse(extractJson(text));
}

async function step_coverage(anthropic, model, maxTokens, message, options) {
  const system = `${VOICE}

The visitor is answering what the tailored outputs should cover, given these REAL known options (only match against these — never invent an option):
Scenarios: ${JSON.stringify(options.scenarios)}
Skill areas: ${JSON.stringify(options.skillAreas)}
Technology modules: ${JSON.stringify(options.technologyModules)}

Match their free-text answer against these known option strings (exact or close paraphrase), and capture anything that doesn't match a known option as free-text coverageNotes instead of inventing a match.

Respond with ONLY a JSON object (no prose, no code fence):
{
  "matchedOptions": string[],      // real option strings from the lists above that this answer matches, [] if none
  "coverageNotes": string | null,  // any free-text coverage detail that didn't match a known option
  "reply": string                  // brief acknowledgment, then move on to asking where the Tailored Resume Portfolio should be sent (name and email required, company/title/phone optional)
}`;
  const text = await callClaude(anthropic, { model, maxTokens, system, message });
  return CoverageSchema.parse(extractJson(text));
}

async function step_contact(anthropic, model, maxTokens, message) {
  const system = `${VOICE}

Your only job this turn: extract contact details from the visitor's message — name, email, company, title, phone. Email is required to proceed; the rest are optional. Only set answered=true if a plausible email address is present in the message (you don't need to validate its format precisely — the calling code does that).

Respond with ONLY a JSON object (no prose, no code fence):
{
  "answered": boolean,
  "contactName": string | null,
  "contactEmail": string | null,
  "contactCompany": string | null,
  "contactTitle": string | null,
  "contactPhone": string | null,
  "reply": string   // if answered: a one-or-two-line summary of what's been collected so far this conversation, then ask exactly: "Are you confirming that you are interested in early member registration and pledging a small deposit amount for the support of this product?" (make clear early registration does not require payment). If not answered: ask again for an email address.
}`;
  const text = await callClaude(anthropic, { model, maxTokens, system, message });
  return ContactSchema.parse(extractJson(text));
}

async function step_earlyRegistration(anthropic, model, maxTokens, message) {
  const system = `${VOICE}

The visitor is answering: "Are you confirming that you are interested in early member registration and pledging a small deposit amount for the support of this product?" Early registration and pledge interest are two separate yes/no facts — a visitor can be interested in early registration without pledging, or vice versa. If they said no to registering at all, both should be false, not null.

Respond with ONLY a JSON object (no prose, no code fence):
{
  "answered": boolean,
  "earlyRegistration": boolean | null,
  "pledgeInterest": boolean | null,
  "reply": string   // if answered: a brief warm acknowledgment that the request is being submitted. If not answered: a brief clarifying nudge repeating the question.
}`;
  const text = await callClaude(anthropic, { model, maxTokens, system, message });
  return EarlyRegSchema.parse(extractJson(text));
}

// A generic plain-chat reply for turns after the intake is already complete
// (or before any step-specific handling applies) — still zero tools, just no
// structured extraction since there's nothing left to collect deterministically.
async function plainReply(anthropic, model, maxTokens, message, extraContext = '') {
  const system = `${VOICE} The visitor has already completed their intake for this conversation. Answer warmly and briefly; if they ask to change something already submitted, tell them Betsy will follow up directly since changes aren't handled in this chat. ${extraContext}`;
  return callClaude(anthropic, { model, maxTokens, system, message });
}

// ── Turn runner ──────────────────────────────────────────────────────────
// `state` is the object the client round-trips each turn (mirrors how
// leadMemory already works): { step, answers }. Starts fresh when absent.
export async function runRequestBetsyTurn({
  anthropic, model, maxTokens, message, state, sourceOutput, attribution,
  agentDefinition, agentConfig, notificationEmails,
}) {
  const current = state && typeof state === 'object' ? state : { step: 'knowsBetsy', answers: {} };
  const answers = { ...(current.answers || {}) };
  const step = current.step || 'knowsBetsy';

  if (step === 'done') {
    const reply = await plainReply(anthropic, model, maxTokens, message);
    return { reply, state: current, submitted: null };
  }

  if (step === 'knowsBetsy') {
    const r = await step_knowsBetsy(anthropic, model, maxTokens, message);
    if (!r.answered) return { reply: r.reply, state: current, submitted: null };
    answers.knowsBetsy = r.value;
    if (r.detail) answers.knowsBetsyDetail = r.detail;
    return { reply: r.reply, state: { step: 'comparingToRole', answers }, submitted: null };
  }

  if (step === 'comparingToRole') {
    const r = await step_comparingToRole(anthropic, model, maxTokens, message);
    if (!r.answered) return { reply: r.reply, state: current, submitted: null };
    answers.comparingToRole = r.value;
    if (r.value && !r.detail) {
      // They said yes but haven't pasted the JD yet — the NEXT raw message
      // *is* the job description; store it verbatim, no LLM involved, so a
      // long pasted JD is never summarized/mangled by an extraction call.
      return { reply: r.reply, state: { step: 'awaitingJobDescription', answers }, submitted: null };
    }
    if (r.detail) answers.jobDescription = r.detail;
    const options = await getCoverageOptions();
    return { reply: r.reply, state: { step: 'coverage', answers, coverageOptions: options }, submitted: null };
  }

  if (step === 'awaitingJobDescription') {
    answers.jobDescription = String(message || '').slice(0, 20000);
    const options = await getCoverageOptions();
    return {
      reply: "Got it, thanks for sharing that. Now — what should the tailored outputs cover? I can offer a few real options once you're ready, or you're welcome to describe it in your own words.",
      state: { step: 'coverage', answers, coverageOptions: options },
      submitted: null,
    };
  }

  if (step === 'coverage') {
    const options = current.coverageOptions || await getCoverageOptions();
    const r = await step_coverage(anthropic, model, maxTokens, message, options);
    answers.coverage = [...new Set([...(answers.coverage || []), ...r.matchedOptions])];
    if (r.coverageNotes) answers.coverageNotes = [answers.coverageNotes, r.coverageNotes].filter(Boolean).join(' ');
    return { reply: r.reply, state: { step: 'contact', answers }, submitted: null };
  }

  if (step === 'contact') {
    const r = await step_contact(anthropic, model, maxTokens, message);
    const email = r.contactEmail ? String(r.contactEmail).trim() : null;
    if (!r.answered || !email || !EMAIL_RE.test(email)) {
      return { reply: r.answered ? "That email doesn't look quite right — mind double-checking it?" : r.reply, state: current, submitted: null };
    }
    answers.contactEmail = email;
    if (r.contactName) answers.contactName = r.contactName;
    if (r.contactCompany) answers.contactCompany = r.contactCompany;
    if (r.contactTitle) answers.contactTitle = r.contactTitle;
    if (r.contactPhone) answers.contactPhone = r.contactPhone;
    return { reply: r.reply, state: { step: 'earlyRegistration', answers }, submitted: null };
  }

  if (step === 'earlyRegistration') {
    const r = await step_earlyRegistration(anthropic, model, maxTokens, message);
    if (!r.answered) return { reply: r.reply, state: current, submitted: null };
    answers.earlyRegistration = r.earlyRegistration;
    answers.pledgeInterest = r.pledgeInterest;

    // Deterministic gate — this code decides submission happens, not Claude.
    if (agentConfig?.actions?.createRequest === false) {
      return { reply: "Thanks — I've got everything, but this agent isn't configured to submit requests right now. Betsy will follow up.", state: { step: 'done', answers }, submitted: null };
    }
    const created = await createPortfolioRequest({
      ...answers,
      kind: 'request_betsy',
      coverage: answers.coverage || [],
      sourceOutput,
      via: 'bestystaff',
      agentDefinitionId: agentDefinition?.id || null,
      orgId: agentDefinition?.scope_type === 'organization' ? agentDefinition.scope_id : null,
      memberUserId: agentDefinition?.scope_type === 'member' ? agentDefinition.scope_id : null,
      notificationEmails,
      emailPolicy: agentConfig?.emailPolicy,
    });
    const submitted = {
      id: created.id,
      recommendedPortfolio: created.recommendedPortfolio || null,
      publicToken: created.publicToken || null,
      leadCapture: {
        contactName: answers.contactName || null,
        contactEmail: answers.contactEmail,
        contactPhone: answers.contactPhone || null,
        answers: { ...answers, attribution },
        agentDefinitionId: agentDefinition?.id || null,
        orgId: agentDefinition?.scope_type === 'organization' ? Number(agentDefinition.scope_id) : null,
        memberUserId: agentDefinition?.scope_type === 'member' ? Number(agentDefinition.scope_id) : null,
      },
    };
    return { reply: r.reply, state: { step: 'done', answers }, submitted };
  }

  // Unknown step value (shouldn't happen) — restart cleanly rather than throw.
  return { reply: "Let's pick this back up — do you already know Betsy? If so, what's the connection?", state: { step: 'knowsBetsy', answers: {} }, submitted: null };
}
