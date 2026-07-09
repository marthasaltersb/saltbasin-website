// BestyStaff cache layer — deterministic conversation script + guardrail-safe
// answer bank, transcribed verbatim from docs/salt-basin-specific-agent-playbook.md
// (the canonical BestyStaff standards doc). This runs client-side with zero
// network calls: the opening script (consent → knows-Betsy → top-5-questions),
// the closing question, and any guardrail-sensitive question that matches the
// safe-answer bank are served straight from here. Only free-text reasoning
// that doesn't match a cache entry falls through to the API layer
// (POST /api/agent/bestystaff, server/routes/bestyStaff.js).
//
// Keep this file's wording in sync with the playbook doc — it is the source
// of truth for consent language, the required opening/closing questions, and
// the guardrail rules (no client names, no Vista deal-broker claims, no
// license claims, monetary figures kept approximate/unsourced).

export const CONSENT_LINE =
  "Before we go deeper, is it okay if I capture the context from this chat so Betsy can use it to improve your intake experience and follow up more intelligently? You can say no, and I can still answer general questions.";

export const KNOWS_BETSY_QUESTION = "Do you already know Betsy? If so, what is the connection?";

export const TOP_QUESTIONS_QUESTION =
  "What are the top 5 questions you want to get answered today — if you don't have 5, start with 1.";

export const CLOSING_QUESTION =
  "Did you get all of your questions answered? If not, can you provide any questions before leaving to give Betsy context?";

export const CONTACT_LINE =
  "If you want Betsy to follow up, what is the best email address or phone number to reach you? You can also contact her directly at betsysalter@saltbasin.net or 757-407-9233.";

export const FLOW_QUICK_REPLIES = [
  "Want to request Betsy's Career Portfolio?",
  'Want to build a Career Portfolio and Salt Basin Profile for yourself?',
];

// ── Safe-answer bank ────────────────────────────────────────────────────────
// Recommended Safe Answers, transcribed verbatim. Matched by keyword/regex
// before any message is sent to the API layer, so guardrail-sensitive
// questions get the exact same compliant wording every time — not a
// probabilistic LLM rephrase.
export const SAFE_ANSWER_BANK = [
  {
    id: 'what-does-salt-basin-do',
    triggers: /\b(what does salt basin do|what do you do|what does betsy do|what is salt basin)\b/i,
    reply:
      "Salt Basin helps translate messy operating complexity into clearer revenue, systems, data, and workflow decisions. Betsy's background is strongest in Quote-to-Revenue, CPQ/CLM, billing, RevOps, PE value creation, process design, and AI-native operating tools.\n\nIf you tell me what kind of problem you are looking at, I can point you toward the right Salt Basin path.",
  },
  {
    id: 'example-deliverable',
    triggers: /\b(example|preview|sample|show me|see (a|an|some) (deliverable|example|work))\b/i,
    reply:
      "Yes. I can show a safe, anonymized preview of the type of deliverable Betsy might create, such as a Q2R leakage heatmap, process discovery pack, pricing architecture outline, or executive decision brief.\n\nI cannot show proprietary client work, employer-owned project materials, confidential contracts, or real client names. Would you like a visual preview using fictional/anonymized data?",
  },
  {
    id: 'who-has-betsy-worked-with',
    triggers: /\b(who has betsy worked with|which clients|client names|who (are|were) (her|the) clients)\b/i,
    reply:
      "Betsy's public career materials describe work across enterprise software, private equity portfolio operations, healthcare technology, manufacturing, education, GovTech, AdTech, consumer goods, financial services, and real estate advisory contexts.\n\nFor confidentiality, I do not share client names from past employer projects in chat. If you want to discuss relevant experience, Betsy can speak at the appropriate level directly.",
  },
  {
    id: 'vista-broker',
    triggers: /\b(broker|deal broker|operating principal|fund manager|transaction owner)\b.*\bvista\b|\bvista\b.*\b(broker|operating principal|fund manager|transaction owner)\b/i,
    reply:
      "No. Betsy's Vista-related experience should be understood as portfolio operations support focused on Lead-to-Cash, CPQ/CLM, process design, data models, and operational readiness. She should not be described as a deal broker, fund manager, transaction owner, or operating principal.",
  },
  {
    id: 'prove-dollar-figures',
    triggers: /\b(prove|source|citation|documentation|proof|evidence)\b.*\b(dollar|figure|number|arr|revenue|\$)\b|\b(dollar|figure|number)\b.*\b(prove|source|citation|proof)\b/i,
    reply:
      "I can speak only at the resume-level positioning used in Betsy's career materials, and the figures should be treated as approximate. I cannot provide proprietary source documents, employer-owned materials, or client project files. Betsy can discuss the appropriate public context directly if useful.",
  },
  {
    id: 'has-licenses',
    triggers: /\b(license|licensed|certification|certified)\b.*\b(does betsy have|active|current)\b|\bdoes betsy have\b.*\b(license|certif)/i,
    reply:
      "I should not claim active licenses unless Betsy has explicitly published them. Her resume materials describe experience with Salesforce, CPQ, CLM, Revenue Cloud, ERP integrations, RevOps, and related certifications/training where applicable.",
  },
  {
    id: 'cpq-billing-help',
    triggers: /\b(help|assist).*(salesforce|cpq|billing)\b.*(problem|issue)\b/i,
    reply:
      "Probably, depending on where the problem sits. Betsy's strongest fit is when quoting, pricing, contracting, billing, renewals, reporting, or system handoffs are creating operational drag or revenue leakage.\n\nWhere does the problem show up first: quote creation, approvals, contracting, order handoff, billing, invoice accuracy, renewals, or reporting?",
  },
  {
    id: 'not-ready-to-talk',
    triggers: /\b(not ready|don'?t want to talk|not looking for a call|just browsing|just looking)\b/i,
    reply:
      "That is fine. I can help you narrow the problem first. We can keep this general, and you do not need to share confidential details. What is the symptom you are trying to understand?",
  },
];

export function matchSafeAnswer(text) {
  const t = String(text || '');
  for (const entry of SAFE_ANSWER_BANK) {
    if (entry.triggers.test(t)) return entry;
  }
  return null;
}

// ── Returning-visitor memory (anonymous path) ──────────────────────────────
// A logged-in member is already "known" via their session — no local state
// needed. An anonymous visitor isn't, so after a successful submission we
// persist a lightweight { id, token } pointer in localStorage. The token
// (server-generated, server/routes/portfolioRequests.js) is the actual
// access control on a later visit's lookup call — id alone would let anyone
// enumerate other visitors' leads.
export const LEAD_MEMORY_KEY = 'sb_besty_lead';

export function readLeadMemory() {
  try {
    const raw = localStorage.getItem(LEAD_MEMORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.token) return null;
    return parsed;
  } catch {
    return null; // private browsing / storage disabled — just means no memory
  }
}

export function writeLeadMemory({ id, token }) {
  try {
    if (!id || !token) return;
    localStorage.setItem(LEAD_MEMORY_KEY, JSON.stringify({ id, token, savedAt: Date.now() }));
  } catch {
    /* storage full or disabled — memory just won't persist, not fatal */
  }
}

// Shared phrasing for both "welcome back" paths (known member / returning
// anonymous visitor with a matched lead record) — references prior context
// when we have it, without re-asking the opening script.
export function welcomeBackLine({ name, kind, topQuestions, roleType, goal } = {}) {
  const who = name ? `, ${String(name).split(' ')[0]}` : '';
  const priorFlow = kind === 'build_own' ? 'building your own Career Portfolio' : "requesting Betsy's Career Portfolio";
  const detail = topQuestions
    ? ` Last time you mentioned: "${topQuestions}"`
    : (roleType || goal ? ` I have you down as ${[roleType, goal].filter(Boolean).join(' · ')}.` : '');
  return `Welcome back${who} — good to see you again. Last time we were ${priorFlow}.${detail} Want to continue where we left off, or start something new?`;
}

// A logged-in member with no prior portfolio-request record yet — still
// skip the opening script (they're already known/trusted), just without a
// specific "last time" to reference.
export function welcomeBackMemberLine(displayName) {
  const first = String(displayName || '').split(' ')[0];
  return `Welcome back${first ? `, ${first}` : ''} — good to see you again. Since you're already signed in, I'll skip the intro questions.`;
}

// Tags for the "Product Learning Tags" list in the playbook — used to bucket
// a conversation's topics for the FAQ-gap / product-maturity backlog.
export const PRODUCT_LEARNING_TAGS = [
  'q2r-leakage', 'cpq-pricing', 'billing-architecture', 'usage-based-pricing',
  'pe-value-creation', 'revops-diagnostic', 'o2c-discovery', 'data-migration',
  'integration-risk', 'arr-reporting', 'executive-alignment', 'ai-workflow',
  'deliverable-preview-request', 'contact-requested', 'high-urgency',
  'confidentiality-sensitive', 'unsupported-claim-request', 'faq-gap',
];
