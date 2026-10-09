#!/usr/bin/env node
// Minimal MCP client for the Salt Basin platform MCP server (official @modelcontextprotocol/sdk, Streamable HTTP).
//
//   node scripts/mcp-call.mjs --url http://localhost:3001/mcp --token sbpat_... list
//   node scripts/mcp-call.mjs --url http://localhost:3001/mcp --token sbpat_... call <tool> '<json arguments>'
//
// list  prints one tool name per line (in server order), then "<n> tools".
// call  prints "isError: true|false", then the result as indented JSON (structuredContent), then exits 0 even
//       when the tool answered with an error, so a caller can read the error. It exits 1 only when the
//       connection or the token itself is refused ("CONNECT FAILED: ..." with the HTTP status) or the call
//       cannot be made at all.
// The token can also come from the SALT_BASIN_MCP_TOKEN environment variable. Used by the platform-mcp training
// spec as the "MCP client"; also a working example for connecting any other MCP client.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const url = opt('--url') || process.env.SALT_BASIN_MCP_URL;
const token = opt('--token') || process.env.SALT_BASIN_MCP_TOKEN || '';
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--url', '--token'].includes(argv[i - 1]));
const [command, tool, json] = positional;

if (!url || !['list', 'call'].includes(command) || (command === 'call' && !tool)) {
  console.error('Usage: node scripts/mcp-call.mjs --url <https://host/mcp> --token <sbpat_...> list | call <tool> [jsonArguments]');
  process.exit(2);
}

let args = {};
if (json) {
  try { args = JSON.parse(json); } catch (e) { console.error(`The arguments are not valid JSON: ${e.message}`); process.exit(2); }
}

const client = new Client({ name: 'salt-basin-mcp-call', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: token ? { Authorization: `Bearer ${token}` } : {} } });
try {
  await client.connect(transport);
} catch (e) {
  console.log(`CONNECT FAILED: ${e.message}`);
  process.exit(1);
}
try {
  if (command === 'list') {
    const { tools } = await client.listTools();
    for (const t of tools) console.log(t.name);
    console.log(`${tools.length} tools`);
  } else {
    const result = await client.callTool({ name: tool, arguments: args });
    console.log(`isError: ${result.isError ? 'true' : 'false'}`);
    console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
  }
} catch (e) {
  console.log(`CALL FAILED: ${e.message}`);
  process.exitCode = 1;
}
await client.close().catch(() => {});
