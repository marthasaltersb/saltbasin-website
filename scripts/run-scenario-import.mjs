import { spawnSync } from 'node:child_process';

const candidates = process.platform === 'win32' ? [['python', []], ['py', ['-3']]] : [['python3', []], ['python', []]];
for (const [command, prefix] of candidates) {
  const result = spawnSync(command, [...prefix, 'scripts/import-salt-basin-scenarios.py', ...process.argv.slice(2)], { stdio: 'inherit' });
  if (!result.error) process.exit(result.status ?? 1);
  if (result.error.code !== 'ENOENT') throw result.error;
}
console.error('Python 3 was not found. Run the importer with an explicit Python 3 executable.');
process.exit(1);
