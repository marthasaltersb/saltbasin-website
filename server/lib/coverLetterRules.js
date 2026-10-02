// Deterministic request resolver for the cover-letter agent (2026-10-02).
//
// Runs AFTER the package search and BEFORE any LLM call. It either (a) satisfies the request
// with edit operations built by rules, (b) answers from the search evidence alone, (c) refuses
// because the request leaves the cover letter / the package, or (d) says it needs a language
// model — and only then does the caller invoke one. Pure: no database, no network.
import { tokenize, searchUnits } from './packageSearch.js';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMMAND_STEMS = new Set(tokenize('mention include add find look search show tell check line sentence about regarding paragraph letter please highlight emphasize emphasise reference work give list does mine my'));
const FILLERS = [[/\bin order to\b/gi, 'to'], [/\bI (?:believe|think|feel) that\b/gi, ''], [/\b(?:very|really|quite|just|truly|extremely)\s+/gi, ''], [/\bAdditionally,\s*/gi, ''], [/\bFurthermore,\s*/gi, '']];
const EXPAND = [[/\bI'd\b/g, 'I would'], [/\bI'm\b/g, 'I am'], [/\bI've\b/g, 'I have'], [/\bI'll\b/g, 'I will'], [/\bdon't\b/gi, 'do not'], [/\bcan't\b/gi, 'cannot'], [/\bwon't\b/gi, 'will not'], [/\bit's\b/gi, 'it is'], [/\bthat's\b/gi, 'that is'], [/\bdidn't\b/gi, 'did not'], [/\bwe're\b/gi, 'we are']];
const CONTRACT = [[/\bI would\b/g, "I'd"], [/\bI am\b/g, "I'm"], [/\bI have\b/g, "I've"], [/\bI will\b/g, "I'll"], [/\bdo not\b/gi, "don't"], [/\bcannot\b/gi, "can't"], [/\bwill not\b/gi, "won't"], [/\bit is\b/gi, "it's"], [/\bdid not\b/gi, "didn't"]];

function tidy(text) {
  return text.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/^[\s,;:]+/, '').replace(/\(\s*\)/g, '').trim()
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}
const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const isBody = (b) => b.type === 'paragraph' && (!b.role || b.role === 'body');

function paragraphNumbers(request) {
  return [...request.matchAll(/(?:paragraphs?|paras?|¶)\s*(\d+)(?:\s*(?:,|and|&)\s*(\d+))?/gi)].flatMap((m) => [m[1], m[2]]).filter(Boolean).map(Number);
}

function replaceAllCI(text, from, to) {
  const re = new RegExp(escapeRe(from), 'gi');
  return re.test(text) ? tidy(text.replace(new RegExp(escapeRe(from), 'gi'), to)) : null;
}

export function applyTonePreset(text, preset) {
  let out = text;
  for (const r of preset.replacements || []) {
    const re = new RegExp(escapeRe(r.from), 'gi');
    out = out.replace(re, r.to);
  }
  if (preset.contractions === 'expand') for (const [re, to] of EXPAND) out = out.replace(re, to);
  if (preset.contractions === 'contract') for (const [re, to] of CONTRACT) out = out.replace(re, to);
  return tidy(out);
}

/** Filler removal, then drop the sentence least related to the job rec (never the first, never below two sentences). */
export function shortenText(text, relevanceTerms) {
  let out = text;
  for (const [re, to] of FILLERS) out = out.replace(re, to);
  out = tidy(out);
  const sents = sentences(out);
  if (sents.length > 2) {
    const want = new Set(relevanceTerms);
    let worst = -1; let worstScore = Infinity;
    sents.forEach((s, i) => {
      if (i === 0) return;
      const overlap = tokenize(s).filter((t) => want.has(t)).length;
      const score = overlap + (i === sents.length - 1 ? 0.5 : 0); // the closing sentence of a paragraph is slightly protected
      if (score < worstScore) { worstScore = score; worst = i; }
    });
    sents.splice(worst, 1);
    out = sents.join(' ');
  }
  return out;
}

function firstSentenceish(text, max = 240) {
  const cleaned = text.replace(/^[•\-\s]+/, '').trim();
  const first = sentences(cleaned)[0] || cleaned;
  return (first.length > max ? `${first.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : first).replace(/[.\s]+$/, '');
}

function fillMention(template, evidence) {
  return tidy(String(template || 'Relevant to this role: {evidence}').replace(/\{evidence\}/g, evidence)).replace(/([^.!?])$/, '$1.');
}

const refused = (reason, message, extra = {}) => ({ kind: 'refused', reason, message, ...extra });

/**
 * @param {object} p
 * @param {string} p.request
 * @param {object[]} p.blocks         the cover letter's blocks
 * @param {object}   p.search         { hits, queryTerms, missingTerms } over the WHOLE package library
 * @param {object[]} p.units          every library unit (for source checks)
 * @param {object}   p.settings       cover-letter settings (tone presets, mention sentence)
 * @param {string}   p.jobRec         job-rec text attached to the package ('' when none)
 */
export function resolveRequest({ request, blocks, search, units, settings, jobRec = '' }) {
  const text = String(request || '').trim();
  const count = blocks.length;
  const nums = paragraphNumbers(text);
  const relevance = new Set(tokenize(`${jobRec} ${text}`));
  const sig = (q) => tokenize(q).filter((t) => !COMMAND_STEMS.has(t));

  // 1. Scope — the cover letter only, the package only.
  if (/\b(google|web ?search|search the (web|internet)|on the (web|internet)|online|linkedin|glassdoor|wikipedia|latest news|news about|competitors?|other (members?|users?|candidates?|people'?s?))\b/i.test(text)) {
    return refused('outside_package', 'I can only search the content inside this application package (the cover letter, the package’s resumes and the job rec text). I can’t look anything up on the web, on other sites, or in other people’s data.');
  }
  if (/\b(edit|change|update|rewrite|fix|modify|shorten|reformat|improve|tweak|delete|remove|replace|reword)\b[^.?!]*\b(my |the |your )?(resume|résumé|cv|career master|job (rec|description|posting)|linkedin|profile)\b/i.test(text)
    && !/\bfrom (my|the) (resume|résumé|cv|career master|package|job)/i.test(text)) {
    return refused('cover_letter_only', 'I can only change this cover letter. I can read the package’s resumes and job rec text as evidence, but I can’t edit them. Open the resume to change it.');
  }

  // 2. Tone presets.
  const presets = settings.tonePresets || [];
  const tonePreset = presets.find((p) => new RegExp(`\\b(${escapeRe(p.key)}|${escapeRe(p.label)})\\b`, 'i').test(text));
  if (tonePreset && (/\btone\b/i.test(text) || /\b(make|sound|more|less|use|apply|turn)\b/i.test(text)) && !/\b(replace|change)\b\s+["“]/i.test(text)) {
    const ops = [];
    blocks.forEach((b, i) => {
      if (!isBody(b) || (nums.length && !nums.includes(i + 1))) return;
      const next = applyTonePreset(b.text, tonePreset);
      if (next !== b.text) ops.push({ op: 'replace', paragraph: i + 1, text: next });
    });
    if (!ops.length) return { kind: 'info', message: `The "${tonePreset.label}" tone preset found nothing to change${nums.length ? ` in paragraph ${nums.join(', ')}` : ' in the letter'}. Presets and their wording rules are editable under Settings.` };
    return { kind: 'edits', ops, summary: `Applied the "${tonePreset.label}" tone preset (rule-based).` };
  }

  // 3. Replace "X" with "Y".
  const quoted = text.match(/\b(?:replace|change|swap|substitute|reword)\s+(?:the\s+(?:word|phrase|text)\s+)?(["“'`])(.+?)\1\s+(?:with|to|by|for|into)\s+(["“'`])(.+?)\3/i);
  let from; let to;
  if (quoted) { from = quoted[2]; to = quoted[4]; } else {
    const plain = text.match(/\b(?:replace|change)\s+(.+?)\s+(?:with|to)\s+(.+?)(?:\s+in\s+(?:paragraph|¶)\s*\d+)?\s*[.!]?$/i);
    if (plain && !/^(the\s+)?(paragraph|para|¶|opening|closing|letter|tone|salutation|greeting|ending|intro)/i.test(plain[1])) { from = plain[1]; to = plain[2]; }
  }
  if (from != null) {
    const ops = [];
    blocks.forEach((b, i) => {
      if (nums.length && !nums.includes(i + 1)) return;
      if (!['paragraph', 'heading', 'bullet'].includes(b.type)) return;
      const next = replaceAllCI(b.text, from, to);
      if (next != null && next !== b.text) ops.push({ op: 'replace', paragraph: i + 1, text: next });
    });
    if (ops.length) return { kind: 'edits', ops, summary: `Replaced "${from}" with "${to}" in ${ops.length} paragraph${ops.length === 1 ? '' : 's'} (exact text match).` };
    const elsewhere = units.filter((u) => u.source !== 'cover_letter' && u.text.toLowerCase().includes(from.toLowerCase()));
    return { kind: 'unsatisfied', message: `I couldn’t find "${from}" in the cover letter${nums.length ? ` (paragraph ${nums.join(', ')})` : ''}, so nothing changed.${elsewhere.length ? ` It does appear in the package (${elsewhere[0].sourceLabel}), but I can only change the cover letter.` : ''}` };
  }

  // 4. Delete a paragraph / remove a quoted phrase.
  const del = text.match(/\b(?:delete|remove|drop|cut)\s+(?:the\s+)?(?:paragraph|para|¶)\s*(\d+)/i);
  if (del) {
    const n = Number(del[1]);
    if (n < 1 || n > count) return { kind: 'unsatisfied', message: `The letter has ${count} paragraphs; there is no paragraph ${n}.` };
    return { kind: 'edits', ops: [{ op: 'delete', paragraph: n }], summary: `Deleted paragraph ${n}.` };
  }
  const rm = text.match(/\b(?:remove|delete|drop|cut)\s+(?:the\s+(?:word|phrase|sentence|text)\s+)?(["“'`])(.+?)\1/i);
  if (rm) {
    const ops = [];
    blocks.forEach((b, i) => {
      if (nums.length && !nums.includes(i + 1)) return;
      if (!['paragraph', 'heading', 'bullet'].includes(b.type)) return;
      const next = replaceAllCI(b.text, rm[2], '');
      if (next == null || next === b.text) return;
      ops.push(next ? { op: 'replace', paragraph: i + 1, text: next } : { op: 'delete', paragraph: i + 1 });
    });
    if (!ops.length) return { kind: 'unsatisfied', message: `I couldn’t find "${rm[2]}" in the cover letter, so nothing changed.` };
    return { kind: 'edits', ops, summary: `Removed "${rm[2]}" from ${ops.length} paragraph${ops.length === 1 ? '' : 's'}.` };
  }

  // 5. Reorder.
  const swap = text.match(/\bswap\s+(?:paragraphs?\s*|¶\s*)?(\d+)\s+(?:and|with|&)\s+(?:paragraph\s*|¶\s*)?(\d+)/i);
  if (swap) {
    const [a, b] = [Number(swap[1]), Number(swap[2])].sort((x, y) => x - y);
    if (a === b || a < 1 || b > count) return { kind: 'unsatisfied', message: `Paragraphs ${swap[1]} and ${swap[2]} can’t be swapped (the letter has ${count} paragraphs).` };
    const ops = [{ op: 'move', paragraph: a, after: b }];
    if (b - a > 1) ops.push({ op: 'move', paragraph: b, after: a - 1 });
    return { kind: 'edits', ops, summary: `Swapped paragraphs ${a} and ${b}.` };
  }
  const mv = text.match(/\b(?:move|put|place)\s+(?:paragraph|para|¶)\s*(\d+)\s+(before|after|to the (?:top|start|beginning|end))\s*(?:paragraph\s*|¶\s*)?(\d+)?/i);
  if (mv) {
    const n = Number(mv[1]); const dir = mv[2].toLowerCase(); const m = mv[3] ? Number(mv[3]) : null;
    let after;
    if (/top|start|beginning/.test(dir)) after = 0;
    else if (/end/.test(dir)) after = count;
    else if (m == null || m < 1 || m > count) return { kind: 'unsatisfied', message: `Say which paragraph to move it ${dir} (for example "move paragraph 3 before paragraph 2").` };
    else after = dir === 'before' ? m - 1 : m;
    if (n < 1 || n > count) return { kind: 'unsatisfied', message: `The letter has ${count} paragraphs; there is no paragraph ${n}.` };
    if (after === n || after === n - 1) return { kind: 'info', message: `Paragraph ${n} is already there; nothing to move.` };
    return { kind: 'edits', ops: [{ op: 'move', paragraph: n, after }], summary: `Moved paragraph ${n}.` };
  }

  // 6. Shorten.
  if (/\b(shorten|shorter|trim|tighten|condense|cut down|more concise|more succinct)\b/i.test(text)) {
    let targets = nums.filter((n) => n >= 1 && n <= count);
    let note = '';
    if (!targets.length) {
      if (/\b(letter|everything|whole|overall|all)\b/i.test(text)) targets = blocks.map((b, i) => (isBody(b) ? i + 1 : 0)).filter(Boolean);
      else {
        const longest = blocks.map((b, i) => [isBody(b) ? b.text.length : 0, i + 1]).sort((a, b) => b[0] - a[0])[0];
        targets = longest && longest[0] ? [longest[1]] : [];
        note = ` No paragraph was named, so I used the longest one (¶${targets[0]}).`;
      }
    }
    const ops = [];
    for (const n of targets) {
      const next = shortenText(blocks[n - 1].text, relevance);
      if (next && next !== blocks[n - 1].text) ops.push({ op: 'replace', paragraph: n, text: next });
    }
    if (!ops.length) return { kind: 'info', message: `Paragraph${targets.length === 1 ? '' : 's'} ${targets.join(', ') || '—'} already ${targets.length === 1 ? 'has' : 'have'} no filler words and no sentence the rules would drop, so I proposed no change.${note} Ask for something more specific (for example "replace X with Y") if you want it shorter.` };
    return { kind: 'edits', ops, summary: `Shortened paragraph${ops.length === 1 ? '' : 's'} ${ops.map((o) => o.paragraph).join(', ')} by removing filler words and the sentence least related to the job rec.${note}` };
  }

  // 7. Mention something found in the package.
  const mention = text.match(/^\s*(?:please[, ]+)?(?:(?:can|could|would) you\s+)?(?:also\s+)?(?:mention|include|add|work in|highlight|emphasi[sz]e|reference|bring up)\b\s+(?:a line |a sentence |a paragraph |something |text )?(?:about |on |regarding |that )?(.+?)(?:\s+in\s+(?:paragraph|¶)\s*\d+)?\s*[.!?]?$/i);
  if (mention) {
    const phrase = mention[1].replace(/\s+(?:from|in|using)\s+(?:my|the)\s+(?:resume|résumé|cv|package|job rec|job description|posting).*$/i, '').trim();
    const terms = sig(phrase);
    if (terms.length) {
      // Evidence for a claim about the member must come from the member's own documents — the job rec says what the employer wants, not what the member did.
      const external = units.filter((u) => u.source !== 'cover_letter' && u.source !== 'job_rec');
      const ext = searchUnits(external, phrase, { limit: 3 });
      const need = Math.max(1, Math.ceil(terms.length * 0.6));
      const best = ext.hits.find((h) => h.matchedTerms.filter((t) => terms.includes(t)).length >= need);
      if (!best) {
        const inLetter = searchUnits(units.filter((u) => u.source === 'cover_letter'), phrase, { limit: 1 }).hits[0];
        if (inLetter && inLetter.matchedTerms.filter((t) => terms.includes(t)).length >= need) {
          return { kind: 'info', message: `The cover letter already mentions this (¶${inLetter.index}), and nothing else in the package adds more detail, so I proposed no change.` };
        }
        const inRec = searchUnits(units.filter((u) => u.source === 'job_rec'), phrase, { limit: 1 }).hits[0];
        if (inRec && inRec.matchedTerms.filter((t) => terms.includes(t)).length >= need) {
          return refused('not_in_your_documents', `"${phrase}" appears in the job rec text (what the employer asks for) but not in the cover letter or any resume in this package. I don’t add claims about you that your own documents don’t support. Add it to your resume first, or ask me to reword something that is already in the letter.`, { missingTerms: [] });
        }
        return refused('not_in_package', `Nothing in this package mentions "${phrase}". I can only work from the cover letter, the package’s resumes and the job rec text, and I don’t add facts that aren’t in them. Add it to the package first, or ask me to reword something that is there.`, { missingTerms: ext.missingTerms });
      }
      const evidence = firstSentenceish(best.text);
      const sentence = fillMention(settings.template?.mentionSentence, evidence);
      let after = nums.length ? nums[0] : 0;
      if (!after) {
        const lastBody = blocks.map((b, i) => (isBody(b) ? i + 1 : 0)).filter(Boolean);
        after = lastBody.length > 1 ? lastBody[lastBody.length - 2] : lastBody[0] || count;
      }
      if (after > count) return { kind: 'unsatisfied', message: `The letter has ${count} paragraphs; there is no paragraph ${after}.` };
      return {
        kind: 'edits',
        ops: [{ op: 'insert_after', paragraph: after, text: sentence, evidence: `${best.sourceLabel} ¶${best.index}` }],
        summary: `Added a paragraph after ¶${after} quoting what the package says ("${evidence.slice(0, 80)}${evidence.length > 80 ? '…' : ''}") from ${best.sourceLabel}.`,
      };
    }
  }

  // 8. Questions / look-ups answered from the search evidence only.
  if (/^\s*(find|search|where|look ?up|show|what|which|does|do|is|are|how|when|who|tell me|check|list)\b/i.test(text) || /\?\s*$/.test(text)) {
    const terms = sig(text);
    const missing = terms.filter((t) => search.missingTerms.includes(t));
    if (missing.length || !search.hits.length) {
      return refused('not_in_package', `That isn’t in this package${missing.length ? ` — no text contains: ${missing.join(', ')}` : ''}. I can only search the cover letter, the package’s resumes and the job rec text, so I can’t look it up anywhere else.`, { missingTerms: missing });
    }
    return { kind: 'info', message: `Here is what the package says (${search.hits.length} match${search.hits.length === 1 ? '' : 'es'}, best first). I proposed no change to the letter.` };
  }

  // 9. Needs a language model: pick the paragraphs it may touch.
  let affected = nums.filter((n) => n >= 1 && n <= count);
  const bodyNums = blocks.map((b, i) => (isBody(b) ? i + 1 : 0)).filter(Boolean);
  if (!affected.length && bodyNums.length) {
    // Positional words in the request point at a specific paragraph.
    if (/\b(opening|intro(?:duction)?|first paragraph|beginning)\b/i.test(text)) affected = [bodyNums[0]];
    else if (/\b(closing|ending|last paragraph|final paragraph|conclusion)\b/i.test(text)) affected = [bodyNums[bodyNums.length - 1]];
  }
  if (!affected.length) {
    affected = search.hits.filter((h) => h.source === 'cover_letter').slice(0, 2).map((h) => h.index);
  }
  if (!affected.length) affected = blocks.map((b, i) => (isBody(b) ? i + 1 : 0)).filter(Boolean).slice(0, 2);
  if (!affected.length) affected = [1];
  return { kind: 'needs_llm', affected: [...new Set(affected)].sort((a, b) => a - b), why: 'No deterministic rule matched this request.' };
}
