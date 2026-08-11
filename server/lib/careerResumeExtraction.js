// Career Resume Extraction (2026-07-27, Phase 1) — the actual missing piece
// behind "Queue N Analysis Passes": that button previously only created a
// career_intake_runs row that stayed 'queued' forever (see
// docs/salt-basin-master-build-progress.md's 2026-07-16 Loop 17 entry). This
// module does the real extraction: pull text out of an uploaded resume
// (mammoth for .docx, pdf-parse for .pdf, plain read for .txt), then ask
// Claude to propose structured Career Atom-mappable facts via forced tool
// use — modeled on server/routes/bestyStaff.js's tool-calling pattern, but a
// single one-shot extraction call rather than a multi-turn conversation.
// Nothing here persists anything — see server/routes/careerMaster.js's
// POST /resume-analysis (returns the proposal for the preview screen) vs.
// POST /mappings/commit (the only route that writes to journey_rod_evidence).
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { bondLabelsToCareerAtoms } from './careerBondingEngine.js';

const MODEL = 'claude-opus-4-8';
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function extractResumeText(buffer, mimeType, originalName = '') {
  const ext = (String(originalName).split('.').pop() || '').toLowerCase();
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (mimeType === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8');
  }
  throw new Error('Unsupported resume file type — upload a PDF, DOCX, or plain text file.');
}

// Every group's items carry two additive fields beyond their domain data:
// `sourceExcerpt` (the verbatim sentence/phrase from the source text that
// supports this fact) and `reasoning` (why this value/interpretation was
// chosen, especially when inferred rather than stated directly — e.g. a
// title normalized from an abbreviation, or a date range inferred from
// surrounding context). Both feed the review-queue's "ambiguous mapping"
// surfacing (careerReconciliation.js) so a member sees exactly what the AI
// read and why, not just the output. Optional on every item — a clearly
// stated fact with an obvious 1:1 quote may leave `reasoning` empty.
const SOURCE_CONTEXT_FIELDS = {
  sourceExcerpt: { type: 'string', description: 'The exact verbatim sentence or phrase from the source text that supports this fact.' },
  reasoning: { type: 'string', description: "Brief explanation of why this value or interpretation was chosen, especially if it required inference rather than a direct quote. Leave empty if the fact was stated plainly with no interpretation needed." },
  reasoningPatternKey: { type: 'string', description: 'When reasoning was required, a short lowercase snake_case rule slug describing the reusable reasoning pattern without member-specific facts.' },
};

const PROPOSE_TOOL = {
  name: 'propose_career_mappings',
  description: "Submit every Career Atom-mappable fact found in this source document, grouped by Career Molecule (entry type: jobs, skills, tools, engagements/case studies, certifications). Only include facts actually present in the text — never invent employers, dates, or metrics. Omit fields you can't find rather than guessing. For every item, include sourceExcerpt (the exact text you're reading from) and, when the value required any inference or judgment call rather than a direct quote, reasoning explaining that judgment call.",
  input_schema: {
    type: 'object',
    properties: {
      jobs: {
        type: 'array',
        description: 'One entry per distinct role/employer.',
        items: {
          type: 'object',
          properties: {
            company: { type: 'string' }, title: { type: 'string' }, startDate: { type: 'string' },
            endDate: { type: 'string' }, duration: { type: 'string' }, jobFunction: { type: 'string' },
            industry: { type: 'string' }, keyMetrics: { type: 'string' },
            confidence: { type: 'number', description: '0-1, confidence this was correctly extracted' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      skills: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill: { type: 'string' }, category: { type: 'string' }, tier: { type: 'string' },
            yearsExp: { type: 'number' }, resumeLanguage: { type: 'string' },
            confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      tools: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nameUsed: { type: 'string' }, category: { type: 'string' }, tier: { type: 'string' },
            confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      engagements: {
        type: 'array',
        description: 'Named projects, case studies, or initiatives with a described outcome — not just a job title.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }, employer: { type: 'string' }, industry: { type: 'string' },
            period: { type: 'string' }, context: { type: 'string' }, actions: { type: 'string' },
            outcomes: { type: 'string' },
            confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      certifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }, issuer: { type: 'string' }, firstEarned: { type: 'string' },
            confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      domains: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            groupType: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
            items: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
      deals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dealName: { type: 'string' }, portfolioCompany: { type: 'string' }, employerAtTime: { type: 'string' },
            dealRole: { type: 'string' }, investmentType: { type: 'string' }, dealSize: { type: 'string' },
            entryDate: { type: 'string' }, exitDate: { type: 'string' }, outcomeStatus: { type: 'string' },
            notes: { type: 'string' }, confidence: { type: 'number' },
            ...SOURCE_CONTEXT_FIELDS,
          },
        },
      },
    },
    required: [],
  },
};

export async function proposeCareerMappingsFromText(resumeText) {
  if (!anthropic) return { offline: true, jobs: [], skills: [], tools: [], engagements: [], certifications: [] };
  const trimmed = String(resumeText || '').trim();
  if (!trimmed) return { jobs: [], skills: [], tools: [], engagements: [], certifications: [] };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [PROPOSE_TOOL],
    tool_choice: { type: 'tool', name: 'propose_career_mappings' },
    system: "You extract structured career facts from resumes for Salt Basin's governed Career Atom model. Only extract what is actually written in the resume text — never invent employers, dates, metrics, or skills not present in it.",
    messages: [{ role: 'user', content: `Extract every Career Atom-mappable fact from this resume text:\n\n${trimmed.slice(0, 40000)}` }],
  });
  const toolUse = (response.content || []).find((b) => b.type === 'tool_use');
  if (!toolUse) return { jobs: [], skills: [], tools: [], engagements: [], certifications: [] };
  return toolUse.input || {};
}

const ENTRY_TYPE_BY_GROUP = {
  jobs: 'career_job_entry',
  skills: 'career_skill_entry',
  tools: 'career_tool_entry',
  engagements: 'career_engagement_entry',
  certifications: 'career_certification_entry',
  domains: 'career_domain_entry',
  deals: 'career_deal_entry',
};

// Bonds each proposed field (keyed by the AI's own field name, e.g.
// 'company', 'title') to the governed Career Atom label space for its entry
// type, and re-keys the result by resolved atomKey — the same
// { [entryType]: [{ entryType, fieldBonds: { atomKey: { value, header,
// matchType, affinity, label } }, unresolvedHeaders }] } shape
// careerSemanticImport.js's parseCareerSemanticWorkbook() produces, so both
// the Excel-import and AI-resume-extraction paths feed one preview UI
// (CareerMappingPreview.jsx) and one commit route. A field with no atom
// match above the bonding floor lands in unresolvedHeaders, not dropped
// silently, so the member can see and reject it.
export function bondProposedMappings(proposal) {
  const result = {};
  for (const [group, entryType] of Object.entries(ENTRY_TYPE_BY_GROUP)) {
    const items = Array.isArray(proposal[group]) ? proposal[group] : [];
    const entries = items.map((item) => {
      const fieldBonds = {};
      const unresolvedHeaders = [];
      const sourceLocation = item.sourceExcerpt
        ? `"${item.sourceExcerpt}"`
        : `Resume text identified as within this ${entryType.replaceAll('_', ' ')}`;
      for (const [fieldKey, value] of Object.entries(item)) {
        if (fieldKey === 'confidence' || fieldKey === 'sourceExcerpt' || fieldKey === 'reasoning' || fieldKey === 'reasoningPatternKey' || value === null || value === undefined || value === '') continue;
        const candidates = bondLabelsToCareerAtoms([fieldKey], { entryType })[0].candidates;
        const match = candidates[0] || null;
        if (match) {
          fieldBonds[match.atomKey] = { value, header: fieldKey, matchType: 'ai_extracted', affinity: match.affinity, label: match.label, sourceLocation, sourceExcerpt: item.sourceExcerpt || null, reasoning: item.reasoning || null, reasoningPatternKey: item.reasoningPatternKey || null };
        } else {
          unresolvedHeaders.push({ header: fieldKey, value, sourceLocation, sourceExcerpt: item.sourceExcerpt || null, reasoning: item.reasoning || null, reasoningPatternKey: item.reasoningPatternKey || null });
        }
      }
      return { entryType, sourceSheet: 'ai_resume_extraction', sourceRow: null, confidence: item.confidence ?? null, sourceExcerpt: item.sourceExcerpt || null, reasoning: item.reasoning || null, fieldBonds, unresolvedHeaders };
    });
    if (entries.length) result[entryType] = entries;
  }
  return result;
}
