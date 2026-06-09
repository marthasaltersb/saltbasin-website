// Molecular vectorizer — converts a molecule into a unified vector
// that encodes semantic meaning AND structural bond state simultaneously.
//
// Vector layout:
//   [0..1535]  semantic dimensions  — what the content means (Anthropic embeddings)
//   [1536]     security.owner       — 1.0 = has owner, 0.0 = public/ownerless
//   [1537]     security.public      — 1.0 = publicly readable
//   [1538]     security.ownerOnly   — 1.0 = owner-only readable
//   [1539]     security.adminOnly   — 1.0 = admin-only readable
//   [1540]     compliance.audited   — 1.0 = audit bond closed
//   [1541]     compliance.complete  — 1.0 = all required bonds closed
//   [1542..N]  variable dims        — 1.0 = bond closed, 0.0 = bond open
//
// Storage: float array in Postgres (upgradeable to pgvector with no schema change)
// Retrieval: cosine similarity across all dimensions simultaneously

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Embed ─────────────────────────────────────────────────────────────────────
//
// Calls Anthropic to get a 1536-dim semantic embedding for a text string.
// Used internally by vectorize().

async function embed(text) {
  // Anthropic doesn't yet expose a dedicated embeddings endpoint —
  // we use a short Claude call to produce a deterministic semantic fingerprint.
  // When Anthropic releases embeddings, swap this for the direct API call.
  //
  // For now: hash the text into a stable pseudo-embedding using a seeded
  // float expansion. This is a placeholder that preserves the vector shape
  // and lets the rest of the system work end-to-end today.
  // Replace embed() body with a real embedding API call when available.
  return pseudoEmbed(text, 1536);
}

// Stable deterministic pseudo-embedding — same input always produces same vector.
// Not semantically meaningful, but structurally correct for integration testing.
function pseudoEmbed(text, dims) {
  const vec = new Array(dims);
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  for (let i = 0; i < dims; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    vec[i] = (seed / 0xffffffff) * 2 - 1;  // normalize to [-1, 1]
  }
  // L2-normalize so cosine similarity works correctly
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map(v => v / norm);
}

// ── Encode bond axes ──────────────────────────────────────────────────────────

function encodeSecurity(bonds, owner) {
  const hasOwner   = owner != null ? 1.0 : 0.0;
  const isPublic   = Object.values(bonds).some(b => b.visibility === 'public') ? 1.0 : 0.0;
  const ownerOnly  = Object.values(bonds).some(b => b.visibility === 'owner-only') ? 1.0 : 0.0;
  const adminOnly  = Object.values(bonds).some(b => b.visibility === 'admin-only') ? 1.0 : 0.0;
  return [hasOwner, isPublic, ownerOnly, adminOnly];
}

function encodeCompliance(bonds) {
  const audited  = bonds.audit_trail?.state === 'closed' ? 1.0 : 0.0;
  const allReqClosed = Object.values(bonds)
    .filter(b => b.required)
    .every(b => b.state === 'closed') ? 1.0 : 0.0;
  return [audited, allReqClosed];
}

function encodeVariables(bonds) {
  return Object.values(bonds).map(b => b.state === 'closed' ? 1.0 : 0.0);
}

// ── vectorize ─────────────────────────────────────────────────────────────────
//
// Converts a molecule into a unified float vector.
//
// molecule shape:
//   {
//     owner:   user_id | null,
//     content: string | object  (what gets semantically embedded)
//     bonds: {
//       [name]: { state: 'open'|'closed', value: any, visibility: string, required?: bool }
//     }
//   }
//
// Returns: Float32Array — ready to store in Postgres or a vector DB

export async function vectorize(molecule) {
  const contentText = typeof molecule.content === 'string'
    ? molecule.content
    : JSON.stringify(molecule.content);

  const semantic   = await embed(contentText);
  const security   = encodeSecurity(molecule.bonds, molecule.owner);
  const compliance = encodeCompliance(molecule.bonds);
  const variables  = encodeVariables(molecule.bonds);

  return new Float32Array([...semantic, ...security, ...compliance, ...variables]);
}

// ── queryVector ───────────────────────────────────────────────────────────────
//
// Builds a query vector from a reader's context and a semantic intent string.
// The query vector encodes what the reader is looking for AND who they are,
// so similarity search finds molecules that are both semantically relevant
// AND structurally compatible with this reader.
//
// reader shape:
//   { id: user_id, role: 'member'|'admin'|'public' }
//
// intent: plain text — what the reader is looking for
// options.requireComplete: true = only return fully-closed molecules
// options.requireAudited:  true = only return compliance-cleared molecules

export async function queryVector(intent, reader, options = {}) {
  const semantic = await embed(intent);

  // Security dims — encode what the reader can see
  const hasOwner  = reader?.id != null ? 1.0 : 0.0;
  const isPublic  = reader?.role === 'public'  ? 1.0 : 0.5;
  const ownerOnly = reader?.id   != null        ? 1.0 : 0.0;
  const adminOnly = reader?.role === 'admin'    ? 1.0 : 0.0;

  // Compliance dims — what the reader requires
  const audited   = options.requireAudited  ? 1.0 : 0.5;
  const complete  = options.requireComplete ? 1.0 : 0.5;

  // Variable dims — reader doesn't constrain variables, use 0.5 (neutral)
  // A 0.5 across variable dims means "don't care about completeness"
  // Set to 1.0 via requireComplete to pull toward fully-closed molecules
  const variableDims = new Array(20).fill(options.requireComplete ? 1.0 : 0.5);

  return new Float32Array([
    ...semantic,
    hasOwner, isPublic, ownerOnly, adminOnly,
    audited, complete,
    ...variableDims,
  ]);
}

// ── cosineSimilarity ──────────────────────────────────────────────────────────
//
// Standard cosine similarity between two vectors.
// 1.0 = identical, 0.0 = orthogonal, -1.0 = opposite.
// Used for in-memory search against small molecule sets.

export function cosineSimilarity(a, b) {
  const len = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── search ────────────────────────────────────────────────────────────────────
//
// In-memory nearest-neighbor search across a set of vectorized molecules.
// For production: swap this for a pgvector ORDER BY <-> query or Pinecone call.
//
// molecules: array of { molecule, vector: Float32Array }
// queryVec:  Float32Array from queryVector()
// topK:      how many results to return

export function search(molecules, queryVec, topK = 10) {
  return molecules
    .map(({ molecule, vector }) => ({
      molecule,
      score: cosineSimilarity(vector, queryVec),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
