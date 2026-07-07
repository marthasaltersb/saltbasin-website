// Persists the 2026-07-07 retroactive JSONL session analysis as a queryable
// record, via config_state (not the `sessions` table — that table name
// collides with the auth-cookie sessions table; see contributionMethodology.js
// RETROACTIVE_SESSION_ANALYSIS.knownGaps for detail).
import 'dotenv/config';
import { setJSON } from '../server/db.js';
import { RETROACTIVE_SESSION_ANALYSIS } from '../server/data/contributionMethodology.js';

await setJSON('config_state', 'contribution_session_analysis', RETROACTIVE_SESSION_ANALYSIS);
console.log('[store-session-analysis] Stored under config_state / contribution_session_analysis');
process.exit(0);
