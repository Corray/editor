#!/usr/bin/env node
/**
 * FB upstream_issue 可验证性闸（机制化 IPR-T-002 remediation）。
 *
 * 背景：上一会话伪造 FB-001~004 的"已上报"状态——写了 github.com/chatlabs-ai
 * 的 issue URL，但真标准库在 bitbucket chatly-biz-tool，URL 全 404。
 *
 * 规则（确定性、无网络）：fb-index 每条 `upstream_issue:` 值——
 *   - 若**以 URL 开头**（= 声称已 file 到某 issue）→ 该 URL **必须**指向规范标准库
 *     （CANONICAL）；指向别处 = 不可信/伪造 → fail
 *   - 若以非-URL 状态词开头（未实际上报 / local-only / declined / 待… 等诚实状态）
 *     → 放行（即便 prose 里引用了被 debunk 的旧 URL 作说明）
 *
 * 局限（按设计）：不验证 canonical URL 真实可达（CI 无网络 + 私有 repo 404 noise）；
 * 只保证"声称已 file"的 URL 指向正确的库。配合纪律：没真 file 就别用 URL 开头。
 */
import { readFileSync } from 'node:fs';

const FB_INDEX = 'docs/problems/fb-index.md';
// 规范标准库（CLAUDE.md standard_path 的 remote：bitbucket chatly-biz-tool/agent-dev-standard）
const CANONICAL = 'https://bitbucket.org/chatly-biz-tool/agent-dev-standard/';

const lines = readFileSync(FB_INDEX, 'utf8').split('\n');
const problems = [];
let urlClaims = 0;
let honestStatuses = 0;

lines.forEach((line, i) => {
  const m = line.match(/^\s*-\s*\*\*upstream_issue\*\*\s*:\s*(.+)$/);
  if (!m) return;
  const value = m[1].trim();
  if (!/^https?:\/\//i.test(value)) {
    honestStatuses++;
    return; // 诚实状态词开头 → OK
  }
  // 以 URL 开头 = 声称已 file → 必须是规范标准库
  urlClaims++;
  const url = value.split(/\s/)[0];
  if (!url.startsWith(CANONICAL)) {
    problems.push(
      `${FB_INDEX}:${i + 1}  upstream_issue 以 URL 开头（声称已上报）但非规范标准库\n` +
        `      期望前缀: ${CANONICAL}\n` +
        `      实际:     ${url}`,
    );
  }
});

if (problems.length > 0) {
  console.error(`✗ FB upstream_issue 校验：${problems.length} 条不可信引用\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\n机制化 IPR-T-002：upstream_issue 若以 URL 开头即视为"已上报"声明，' +
      '\n该 URL 必须指向规范标准库。没真 file 就用诚实状态词开头（未实际上报 / declined / local-only…）。',
  );
  process.exit(1);
}
console.log(
  `✓ FB upstream_issue 校验：${urlClaims} 条已上报 URL 全指向规范标准库，` +
    `${honestStatuses} 条诚实状态`,
);
