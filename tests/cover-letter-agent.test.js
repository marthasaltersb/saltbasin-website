// Pure unit checks for the cover-letter agent's search, rules and edit operations
// (no database, no network). Run: node --test tests/cover-letter-agent.test.js
// Fictional data only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { unitsFromContent, searchUnits } from '../server/lib/packageSearch.js';
import { resolveRequest } from '../server/lib/coverLetterRules.js';
import { validateOps, resultBlocks, buildDiff, assertTargetedEditSet, EditSetError } from '../server/lib/coverLetterEdits.js';

const settings = {
  template: { mentionSentence: 'Relevant to this role: {evidence}' },
  tonePresets: [
    { key: 'formal', label: 'Formal', contractions: 'expand', replacements: [{ from: 'a lot of', to: 'substantial' }] },
    { key: 'warm', label: 'Warm', contractions: 'contract', replacements: [] },
  ],
};
const letter = {
  format: 'document_blocks', version: 1, header: {},
  blocks: [
    { type: 'paragraph', role: 'date', text: 'October 2, 2026' },
    { type: 'paragraph', role: 'salutation', text: 'Dear Northwind Freight hiring team,' },
    { type: 'paragraph', role: 'body', text: "I'm writing to apply for the Principal Value Architect role at Northwind Freight. I really believe that my background lines up with your needs. I have a lot of experience in pricing. I enjoy lunch." },
    { type: 'paragraph', role: 'body', text: 'At Harbor Logistics as Value Architect (2019 – present), I led a pricing redesign that raised margin by 4 points.' },
    { type: 'paragraph', role: 'body', text: 'I would welcome a conversation. Thank you for your consideration.' },
    { type: 'paragraph', role: 'signoff', text: 'Sincerely,' },
  ],
};
const resume = {
  format: 'document_blocks', version: 1, header: {},
  blocks: [
    { type: 'heading', text: 'SKILLS' },
    { type: 'bullet', text: 'Kubernetes cost governance across 40 clusters, reducing spend by 18 percent.' },
    { type: 'bullet', text: 'Contract renewal forecasting for freight accounts.' },
  ],
};
const jobRec = 'Principal Value Architect at Northwind Freight. Own pricing strategy and renewal forecasting.';
const units = [
  ...unitsFromContent(letter, { key: 'cover_letter', label: 'Cover letter' }),
  ...unitsFromContent(resume, { key: 'resume:1', label: 'Resume: Variant A' }),
  ...unitsFromContent({ rawText: jobRec }, { key: 'job_rec', label: 'Job rec text' }),
];
const run = (request) => resolveRequest({ request, blocks: letter.blocks, search: searchUnits(units, request), units, settings, jobRec });

test('BM25 search ranks the matching block first and reports missing terms', () => {
  const r = searchUnits(units, 'kubernetes cost governance');
  assert.equal(r.hits[0].source, 'resume:1');
  assert.deepEqual(searchUnits(units, 'quarterly revenue').missingTerms.sort(), ['quarterly', 'revenue']);
});

test('replace "X" with "Y" is satisfied by rules with exact edits', () => {
  const d = run('replace "pricing redesign" with "packaging redesign"');
  assert.equal(d.kind, 'edits');
  assert.equal(d.ops[0].paragraph, 4);
  assert.match(d.ops[0].text, /packaging redesign/);
});

test('replace of text that is not in the letter changes nothing and says so', () => {
  const d = run('replace "quantum" with "classical"');
  assert.equal(d.kind, 'unsatisfied');
});

test('shorten paragraph 3 removes filler and the least related sentence', () => {
  const d = run('shorten paragraph 3');
  assert.equal(d.kind, 'edits');
  assert.doesNotMatch(d.ops[0].text, /really/);
  assert.equal(d.ops[0].text.split(/(?<=[.!?])\s+/).length, 3, 'one of the four sentences is dropped');
  assert.match(d.ops[0].text, /pricing/);
});

test('mention <thing in the package> inserts quoted package text; unknown things are refused', () => {
  const ok = run('mention Kubernetes cost governance');
  assert.equal(ok.kind, 'edits');
  assert.equal(ok.ops[0].op, 'insert_after');
  assert.match(ok.ops[0].text, /Kubernetes cost governance/);
  const no = run('mention my blockchain consulting');
  assert.equal(no.kind, 'refused');
  assert.equal(no.reason, 'not_in_package');
});

test('tone preset, reorder and delete are rule-based', () => {
  assert.equal(run('make it more formal').kind, 'edits');
  const mv = run('swap paragraphs 4 and 5');
  assert.equal(mv.kind, 'edits');
  const after = resultBlocks(letter.blocks, validateOps(mv.ops, 6)).map((b) => b.text.slice(0, 8));
  assert.deepEqual(after.slice(2, 5), ["I'm writ", 'I would ', 'At Harbo']);
  assert.equal(run('delete paragraph 4').ops[0].op, 'delete');
});

test('out-of-scope requests are refused: resume edits, web look-ups, facts not in the package', () => {
  assert.equal(run('rewrite my resume summary').reason, 'cover_letter_only');
  assert.equal(run('search the web for Northwind Freight revenue').reason, 'outside_package');
  assert.equal(run("What is Northwind Freight's annual revenue?").reason, 'not_in_package');
  assert.equal(run('where do I mention pricing?').kind, 'info');
});

test('an open-ended request needs the LLM and names only the affected paragraphs', () => {
  const d = run('make the opening sound more confident about pricing');
  assert.equal(d.kind, 'needs_llm');
  assert.ok(d.affected.length >= 1 && d.affected.length <= 2);
});

test('edit-set validation rejects regenerated letters, out-of-context paragraphs and oversize text', () => {
  const blocks = letter.blocks;
  assert.throws(() => assertTargetedEditSet([{ op: 'replace', paragraph: 5, text: 'x' }], blocks, new Set([3])), EditSetError);
  assert.throws(() => assertTargetedEditSet(blocks.map((_, i) => ({ op: 'replace', paragraph: i + 1, text: 'new' })), blocks, new Set([1, 2, 3, 4, 5, 6])), EditSetError);
  assert.throws(() => validateOps([{ op: 'replace', paragraph: 3, text: 'y'.repeat(2000) }], 6), EditSetError);
  const diff = buildDiff(blocks, validateOps([{ op: 'delete', paragraph: 4 }, { op: 'insert_after', paragraph: 3, text: 'New line.' }], 6));
  assert.deepEqual(diff.map((r) => r.status), ['same', 'same', 'same', 'inserted', 'deleted', 'same', 'same']);
});
