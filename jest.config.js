// Native-ESM Jest config (invoked via `node --experimental-vm-modules`, see
// package.json "test" script) — no Babel transform needed since the codebase
// is plain modern ESM throughout ("type": "module").
//
// Scoped to server/**/*.test.js for now: pure Node logic. React components
// under src/ need jsdom + @testing-library/react, a separate future addition
// — not added here. The existing tests/*.test.js files use Node's built-in
// `node:test` runner (see package.json "test:scenarios") and are untouched.
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/server/**/*.test.js'],
  transform: {},
  // Other concurrent Claude sessions may have their own worktree checked out
  // under .claude/worktrees/ (each with its own package.json) — exclude it so
  // Jest's haste map doesn't collide with this repo's own package.json.
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  watchPathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
};
