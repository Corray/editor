#!/usr/bin/env node
/**
 * Doc commit-hash referential-integrity gate (根治 IPR-T-001 / PP-002).
 *
 * Scans tracked docs (docs/**.md + CLAUDE.md) for inline commit references of
 * the form  commit `<hash>`  and verifies every referenced hash resolves to a
 * real commit in git history. Catches the whole failure family mechanically,
 * not by discipline:
 *   - prewritten placeholder / guessed hash      → does not resolve
 *   - stale hash after `--amend` (self-reference) → old hash orphaned, fails
 *   - typo'd hash                                 → does not resolve
 *   - literal `<pending…>` left un-backfilled     → flagged explicitly
 *
 * Run locally (`pnpm check:hashes`) before pushing/closing, and in CI
 * (needs full history — checkout fetch-depth: 0).
 *
 * Exit 0 = all references resolve; exit 1 = ≥1 broken reference.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Files to scan: tracked *.md under docs/ plus the project CLAUDE.md. */
function targetFiles() {
  const tracked = execSync('git ls-files docs CLAUDE.md', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter((f) => f.endsWith('.md'));
  return tracked;
}

/** True if the given short/long hash resolves to a commit object. */
function commitExists(hash) {
  try {
    execSync(`git rev-parse --verify --quiet "${hash}^{commit}"`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

// Matches  commit `<token>`  — token captured between backticks.
const REF = /commit\s+`([^`]+)`/g;
const HASH = /^[0-9a-f]{7,40}$/;
const RANGE = /^([0-9a-f]{7,40})\.\.([0-9a-f]{7,40})$/;

const problems = [];
let checked = 0;

for (const file of targetFiles()) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    let m;
    REF.lastIndex = 0;
    while ((m = REF.exec(line)) !== null) {
      const token = m[1];
      const at = `${file}:${i + 1}`;

      if (/pending|TODO|xxx|placeholder/i.test(token)) {
        problems.push(`${at}  unresolved placeholder: \`${token}\``);
        continue;
      }
      const range = token.match(RANGE);
      if (range) {
        for (const h of [range[1], range[2]]) {
          checked++;
          if (!commitExists(h)) problems.push(`${at}  no such commit: \`${h}\` (in range \`${token}\`)`);
        }
        continue;
      }
      if (HASH.test(token)) {
        checked++;
        if (!commitExists(token)) problems.push(`${at}  no such commit: \`${token}\``);
        continue;
      }
      // non-hash backtick content after "commit" — ignore (e.g. prose).
    }
  });
}

if (problems.length > 0) {
  console.error(`✗ doc commit-hash check: ${problems.length} broken reference(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\n根治 IPR-T-001：commit 先落地拿到真实 hash，再回填到文档（独立 commit），' +
      '\n不预写占位、不引用会被 amend 改号的自身 commit。',
  );
  process.exit(1);
}
console.log(`✓ doc commit-hash check: ${checked} reference(s) all resolve`);
