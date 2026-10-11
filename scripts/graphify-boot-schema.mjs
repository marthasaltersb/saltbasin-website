// Boots a FRESH local database (schema + fictional seed rows only) for scripts/graphify-data-model.mjs.
// Imports server/db.js (its bootstrap creates every platform table), runs the platform seed, then asks each
// lazily-created schema module to create its tables (they are never created in bootstrap). Never run this
// against a real database: the caller refuses any DATABASE_URL that is not local.
import 'dotenv/config';

const steps = [
  ['seed', async () => (await import('../server/data/seed.js')).ensureSeeded()],
  ['release intelligence', async () => (await import('../server/lib/releaseIntelligenceSchema.js')).ensureReleaseIntelligenceSchema()],
  ['release loop', async () => (await import('../server/lib/releaseLoopPlatform.js')).ensureReleaseLoopSchema()],
  ['agent runner', async () => (await import('../server/lib/agentRunner.js')).ensureAgentRunnerSchema()],
  ['session mapping', async () => (await import('../server/lib/sessionMappingSchema.js')).ensureSessionMappingSchema()],
  ['backlog intelligence', async () => (await import('../server/lib/backlogIntelligenceSchema.js')).ensureBacklogIntelligenceSchema()],
  ['render bindings', async () => (await import('../server/lib/renderBindings.js')).ensureSeeded()],
];
let failed = 0;
for (const [name, fn] of steps) {
  try { await fn(); console.log(`[graphify-boot] ${name}: ok`); }
  catch (e) { failed += 1; console.error(`[graphify-boot] ${name}: FAILED - ${e.message}`); }
}
process.exit(failed ? 3 : 0);
