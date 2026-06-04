#!/usr/bin/env node
/**
 * First-screen bundle-size budget gate (MANUAL-PERF-003 / PRD §性能: gzip < 150KB).
 *
 * 测**首屏**负载——index.html 直接引用的 entry JS + CSS + modulepreload chunk + html
 * 本身的 gzip 和。**懒加载 chunk（动态 import，如 v1.3 KaTeX）不计**——它们不在
 * index.html 里，只在用到时才下载。
 *
 * （v1.3 修正：原版 sum 整个 dist/，把 KaTeX lazy chunk 也算进去 → 误判超限。
 *  代码分割后 dist 总量 ≠ 首屏负载，必须按 index.html 引用集算首屏。）
 *
 * 非 Lighthouse CI（TBD-T1）。基线 docs/perf/baseline-v0.1.0.md。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BUDGET_KB = 150;
const BUDGET = BUDGET_KB * 1024;

const indexPath = join(DIST, 'index.html');
if (!existsSync(indexPath)) {
  console.error(`✗ ${indexPath} 不存在 — 先 build?`);
  process.exit(1);
}
const html = readFileSync(indexPath, 'utf8');

// index.html 里直接引用的首屏资源：script[src] / link[href]（stylesheet + modulepreload）
const refs = new Set();
for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
  let ref = m[1];
  if (!/\.(js|css)$/.test(ref)) continue;
  ref = ref.replace(/^\.?\//, '').replace(/^[^/]*\/(?=assets\/)/, ''); // 去 base 前缀 /editor/
  refs.add(ref);
}

const rows = [{ f: 'index.html', gz: gzipSync(Buffer.from(html)).length }];
for (const ref of refs) {
  // ref 可能是 assets/xxx 或带 base；在 dist 下定位
  const candidates = [join(DIST, ref), join(DIST, ref.replace(/^.*?(assets\/)/, '$1'))];
  const path = candidates.find((p) => existsSync(p));
  if (!path) {
    console.error(`✗ 首屏引用的资源在 dist 下找不到：${ref}`);
    process.exit(1);
  }
  rows.push({ f: path, gz: gzipSync(readFileSync(path)).length });
}

let total = 0;
rows.sort((a, b) => b.gz - a.gz);
for (const { f, gz } of rows) {
  total += gz;
  console.log(`  ${(gz / 1024).toFixed(2).padStart(7)} KB gz  ${f}`);
}
const totalKb = (total / 1024).toFixed(2);
console.log(`  ${'-'.repeat(44)}`);
console.log(`  ${totalKb.padStart(7)} KB gz  首屏 TOTAL (budget ${BUDGET_KB} KB；懒加载 chunk 不计)`);

if (total > BUDGET) {
  console.error(
    `\n✗ 首屏 gzip ${totalKb} KB 超预算 ${BUDGET_KB} KB — see docs/perf/baseline-v0.1.0.md`,
  );
  process.exit(1);
}
console.log(`\n✓ 首屏 within budget (${totalKb} / ${BUDGET_KB} KB gz)`);
