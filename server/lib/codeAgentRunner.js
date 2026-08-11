import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { db } from '../db.js';
import { compileSessionContext } from './codeAgentContext.js';

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();
const MAX_EVENT_CHARS = 12_000;

async function gitFiles() {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain=v1'], { cwd: REPO_ROOT, timeout: 15_000 });
    return stdout.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean).sort();
  } catch { return []; }
}

async function event(runId, eventType, message, payload = {}, stream = null) {
  await db.prepare(`INSERT INTO agent_code_run_events (run_id,event_type,stream,message,payload,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6)`)
    .run(runId, eventType, stream, String(message || '').slice(0, MAX_EVENT_CHARS), payload, Date.now());
}

function commandFor(provider, prompt) {
  if (provider === 'openai') {
    return {
      command: process.env.CODEX_CLI_BIN || (process.platform === 'win32' ? 'codex.exe' : 'codex'),
      args: ['exec', '--json', '--sandbox', 'workspace-write', '--cd', REPO_ROOT, prompt],
    };
  }
  return {
    command: process.env.CLAUDE_CODE_BIN || (process.platform === 'win32' ? 'claude.exe' : 'claude'),
    args: ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read,Edit,Write,Glob,Grep', prompt],
  };
}

function streamLines(stream, callback) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) if (line.trim()) callback(line);
  });
  stream.on('end', () => { if (buffer.trim()) callback(buffer); });
}

export async function executeApprovedCodeRun(runId) {
  const run = await db.prepare(`SELECT r.*,t.context_profile_id FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE r.id=$1`).get(runId);
  if (!run || run.status !== 'approved' || run.approval_status !== 'approved') return;
  const active = await db.prepare(`SELECT id FROM agent_code_runs WHERE status='running' LIMIT 1`).get();
  if (active) {
    await db.prepare(`UPDATE agent_code_runs SET status='queued',updated_at=$1 WHERE id=$2`).run(Date.now(), runId);
    await event(runId, 'queued', `Waiting for run ${active.id} to finish.`);
    setTimeout(async () => {
      await db.prepare(`UPDATE agent_code_runs SET status='approved',updated_at=$1 WHERE id=$2 AND status='queued'`).run(Date.now(), runId);
      executeApprovedCodeRun(runId).catch(() => {});
    }, 5000).unref();
    return;
  }

  const preexisting = await gitFiles();
  const context = await compileSessionContext({ profileId: run.context_profile_id, backlogItemId: run.backlog_item_id });
  const prompt = `APPROVED SALT BASIN CODE WORK ORDER\nObjective: ${run.objective}\nAcceptance criteria: ${run.acceptance_criteria || 'Use the linked backlog acceptance criteria.'}\n\n${context.system}\n\nEXECUTION BOUNDARIES\n- Work only inside ${REPO_ROOT}.\n- Do not commit, push, deploy, install dependencies, access secrets, or use the network.\n- Preserve pre-existing changes and do not rewrite unrelated files.\n- Implement the smallest coherent slice.\n- Report changed files, checks performed, unresolved risks, and any acceptance criterion not met.`;
  const spec = commandFor(run.provider, prompt);
  await db.prepare(`UPDATE agent_code_runs SET status='running',started_at=$1,preexisting_files=$2::jsonb,updated_at=$1 WHERE id=$3`).run(Date.now(), preexisting, runId);
  await event(runId, 'started', `${run.provider} execution started.`, { command: spec.command, repository: REPO_ROOT });

  let stderr = '';
  try {
    const child = spawn(spec.command, spec.args, { cwd: REPO_ROOT, windowsHide: true, shell: false, env: { ...process.env, CI: '1' } });
    streamLines(child.stdout, (line) => event(runId, 'output', line, {}, 'stdout').catch(() => {}));
    streamLines(child.stderr, (line) => { stderr = `${stderr}\n${line}`.slice(-MAX_EVENT_CHARS); event(runId, 'output', line, {}, 'stderr').catch(() => {}); });
    child.on('error', async (error) => {
      await db.prepare(`UPDATE agent_code_runs SET status='failed',error=$1,finished_at=$2,updated_at=$2 WHERE id=$3`).run(error.message, Date.now(), runId);
      await event(runId, 'failed', error.message);
    });
    child.on('close', async (code) => {
      const after = await gitFiles();
      const changed = after.filter((file) => !preexisting.includes(file));
      const verification = [];
      if (code === 0) {
        try {
          const build = await execFileAsync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', '--emptyOutDir=false'], { cwd: REPO_ROOT, timeout: 180_000, maxBuffer: 2_000_000 });
          verification.push({ command: 'npm run build', status: 'passed', output: build.stdout.slice(-2000) });
        } catch (error) {
          verification.push({ command: 'npm run build', status: 'failed', output: String(error.stdout || error.stderr || error.message).slice(-4000) });
        }
      }
      const finalStatus = code === 0 && verification.every((v) => v.status === 'passed') ? 'completed' : 'failed';
      await db.prepare(`UPDATE agent_code_runs SET status=$1,exit_code=$2,changed_files=$3::jsonb,verification=$4::jsonb,error=$5,finished_at=$6,updated_at=$6 WHERE id=$7`)
        .run(finalStatus, code, changed, verification, finalStatus === 'failed' ? (stderr || verification.find((v) => v.status === 'failed')?.output || `exit ${code}`) : null, Date.now(), runId);
      await event(runId, finalStatus, `Run ${finalStatus}.`, { exitCode: code, changedFiles: changed, preexistingFiles: preexisting, verification });
      if (run.backlog_item_id) {
        await db.prepare(`INSERT INTO agent_work_stage_events (thread_id,backlog_item_id,stage,event_type,summary,evidence,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`)
          .run(run.thread_id, run.backlog_item_id, finalStatus === 'completed' ? 'verification' : 'implementation', finalStatus === 'completed' ? 'completed' : 'blocked', `Code run #${runId} ${finalStatus}`, { runId, changedFiles: changed, verification }, run.created_by, Date.now());
      }
    });
  } catch (error) {
    await db.prepare(`UPDATE agent_code_runs SET status='failed',error=$1,finished_at=$2,updated_at=$2 WHERE id=$3`).run(error.message, Date.now(), runId);
    await event(runId, 'failed', error.message);
  }
}
