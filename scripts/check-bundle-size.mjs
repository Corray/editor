#!/usr/bin/env node
/**
 * Bundle-size budget gate (MANUAL-PERF-003 / PRD §性能: gzip < 150KB).
 *
 * Lightweight CI guard against bundle bloat — NOT Lighthouse CI (full
 * Lighthouse CI remains deferred to v1.1+ per test-plan TBD-T1). Run after
 * `pnpm build`; sums the gzipped size of every dist/ JS + CSS + HTML asset
 * and fails the build if the total exceeds the budget.
 *
 * Baseline recorded in docs/perf/baseline-v0.1.0.md.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BUDGET_KB = 150;
const BUDGET = BUDGET_KB * 1024;

/** Recursively collect asset files that ship to the browser. */
function collect(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collect(full));
    } else if (/\.(js|css|html)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const files = collect(DIST);
if (files.length === 0) {
  console.error(`✗ no JS/CSS/HTML assets found under ${DIST}/ — did build run?`);
  process.exit(1);
}

let total = 0;
const rows = files.map((f) => {
  const gz = gzipSync(readFileSync(f)).length;
  total += gz;
  return { f, gz };
});

rows.sort((a, b) => b.gz - a.gz);
for (const { f, gz } of rows) {
  console.log(`  ${(gz / 1024).toFixed(2).padStart(7)} KB gz  ${f}`);
}
const totalKb = (total / 1024).toFixed(2);
console.log(`  ${'-'.repeat(40)}`);
console.log(`  ${totalKb.padStart(7)} KB gz  TOTAL (budget ${BUDGET_KB} KB)`);

if (total > BUDGET) {
  console.error(
    `\n✗ bundle gzip ${totalKb} KB exceeds budget ${BUDGET_KB} KB — see docs/perf/baseline-v0.1.0.md`,
  );
  process.exit(1);
}
console.log(`\n✓ bundle within budget (${totalKb} / ${BUDGET_KB} KB gz)`);
