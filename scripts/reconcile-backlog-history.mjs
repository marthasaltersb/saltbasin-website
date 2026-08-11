import 'dotenv/config';
import { reconcileBacklogHistory } from '../server/lib/backlogHistoryReconciler.js';

const providerArg = process.argv.find((arg) => arg.startsWith('--provider='));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const provider = providerArg?.split('=')[1] === 'openai' ? 'openai' : 'anthropic';
const limit = Math.max(0, Number(limitArg?.split('=')[1] || 0));

console.log(`[backlog:reconcile] Starting ${provider} reconciliation${limit ? ` for ${limit} session(s)` : ' for all sessions'}...`);
const stats = await reconcileBacklogHistory({ provider, limit });
console.log(JSON.stringify(stats, null, 2));
if (stats.failures.length) process.exitCode = 2;

