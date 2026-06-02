# Performance Baseline — v0.1.0

> **定位：** BHV-003 一次性 perf bench 基线，给后续版本对照退化。
> 对应 test-plan §7.5 MANUAL-PERF-001~003 / PRD §性能 / I7。
>
> **首次测量：** 2026-06-02（commit 见 findings-registry BHV-003 行）
> **测量机器：** 本地 macOS（Darwin 24.5.0）/ 生产 build（`vite preview`）

---

## 预算 vs 实测

| # | 指标 | 预算 | 实测 (v0.1.0) | 结果 |
|---|------|------|--------------|------|
| MANUAL-PERF-001 | Lighthouse Performance | ≥ 90 | **92** | ✅ |
| MANUAL-PERF-002 | 输入→预览更新（1000 行内）| < 50ms | **34.1ms**（chromium）/ < 300ms（webkit）| ✅ |
| MANUAL-PERF-003 | bundle gzip 总体积 | < 150 KB | **64.26 KB** | ✅ |

---

## 1. Lighthouse（MANUAL-PERF-001）

- **工具：** `lighthouse` 12.8.2（npx），Chrome headless，默认 lab throttling（4× CPU + slow-4G 模拟）
- **命令：** `npx lighthouse http://localhost:4173/editor/ --only-categories=performance --chrome-flags="--headless=new"`
- **Performance score：** **92**（预算 ≥ 90）

| 指标 | 值 |
|------|----|
| First Contentful Paint | 1.3 s |
| Largest Contentful Paint | 1.7 s |
| Total Blocking Time | 330 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 1.4 s |

> **注（诚实标注）：** FCP/LCP 的秒数是 Lighthouse **lab throttling** 下的模拟值，
> 不等于真实快网首屏。PRD「首屏 < 1s」在无 throttling 真机上才有意义；
> 这里的**验收闸是 score ≥ 90**（PRD I7 / MANUAL-PERF-001），score 92 通过。
> LCP 1.7s（throttled）作为基线记录，后续大改若 score 掉到 90 以下需排查。

## 2. 输入→预览延迟（MANUAL-PERF-002）

- **方法：** 1000 行 `# Line N` 文档已加载后，追加一行并 dispatch input，
  用 `performance.now()` + `MutationObserver` 测到 `.preview-content` DOM 变更的耗时
- **自动化：** `tests/e2e/ac5-perf.spec.ts` → `E2E-AC5-002`（chromium + webkit）
- **实测：** chromium **34.1ms**（< 50ms 预算 ✅）；webkit 较慢，测试断言 < 300ms 通过
- **口径：** 测的是 input → 预览 DOM mutation（含 markdown-it render + DOMPurify +
  innerHTML swap），**不含**浏览器最终 paint；是 MANUAL-PERF-002 的最接近诚实代理

## 3. Bundle 体积（MANUAL-PERF-003）

- **工具：** `scripts/check-bundle-size.mjs`（`pnpm size`，zlib gzip dist 全部 JS/CSS/HTML）
- **CI 闸：** `deploy.yml` Build 后跑 `pnpm size`，超 150 KB 直接 fail（**这是本次新增的防退化闸**）

| 资产 | gzip |
|------|------|
| `index-*.js` | 62.50 KB |
| `style-*.css` | 1.41 KB |
| `index.html` | 0.35 KB |
| **TOTAL** | **64.26 KB**（预算 150 KB）|

---

## CI 自动化范围（与 TBD-T1 的关系）

- ✅ **已加：** bundle-size gzip 闸（`pnpm size` in deploy.yml）—— 轻量、确定性、防体积退化
- ✅ **已加：** 输入延迟自动化（E2E-AC5-002，宽松 bound + 本文件记真实值）
- ⏸ **仍 deferred 到 v1.1+：** 完整 Lighthouse CI（LCP/TBT/score 阈值闸）—— 按
  **TBD-T1 决策**（「MVP 不上 Lighthouse CI」）不动；Lighthouse 分数在 CI 噪声大
  （±5~10）易假失败，故只做一次性手工基线 + 本文件记录。

## 复测方法（下次版本对照）

```bash
pnpm build && pnpm size                              # MANUAL-PERF-003
npx playwright test tests/e2e/ac5-perf.spec.ts       # MANUAL-PERF-002
pnpm preview --port 4173 &                            # MANUAL-PERF-001
npx lighthouse http://localhost:4173/editor/ --only-categories=performance --chrome-flags="--headless=new"
```
