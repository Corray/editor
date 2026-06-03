# FB-005 — Playwright mobile device emulation + Vite dev server 不稳定

| 字段 | 值 |
|------|----|
| **date** | 2026-05-20 |
| **status** | candidate |
| **severity** | low |
| **occurrences** | 1 |
| **category** | meta |
| **skills** | install (playwright template) |
| **modules** | (all) |

---

## 现象

Playwright `devices['iPhone 14 Pro']` mobile emulation project 配合 Vite **dev** server（`vite dev`）作为 `webServer.command`，`page.goto` 稳定超时 30s（webkit engine + mobile UA 组合触发的 navigation 卡顿）。同一 webServer 下 chromium / webkit Desktop project 全部 pass，只有 mobile-safari project 100% 超时。

standard install 模板（如果未来出 playwright preset）若 default 启用 mobile-safari project + 用 `vite dev` 作 webServer，新项目首次跑 E2E 会立刻撞墙 → 浪费排查时间得出"暂禁 mobile-safari"结论。

## 实证

- **项目**: `/Users/chat/Desktop/test/editor` (github / business / FE / node-ts)
- **复现路径** (Issue #10, commit `f03e170`):
  - `playwright.config.ts` 原配 3 projects: chromium / webkit / mobile-safari (`devices['iPhone 14 Pro']`)
  - webServer: `pnpm dev --port 5174 --strictPort`（即 `vite dev`）
  - 执行: `pnpm exec playwright test`
  - 结果: chromium 21 pass / webkit 21 pass / **mobile-safari 全部 30s 超时**（page.goto 在初始 navigation 卡死）
- **当前处置**（`playwright.config.ts` L25-32 注释）:
  ```ts
  // mobile-safari 在本地 Vite dev server + iPhone 14 Pro emulation 下
  // page.goto 稳定超时（webkit engine + mobile UA 触发的 navigation 卡顿）。
  // 移动端 viewport 已在 AC-4 用 iPhone SE context 单独覆盖。
  // TODO(follow-up): 启用 mobile-safari 需调研 webServer 兼容性或换成
  //   Vite preview build（更接近生产）。
  // {
  //   name: 'mobile-safari',
  //   use: { ...devices['iPhone 14 Pro'] },
  // },
  ```
- **替代覆盖**: 移动端 viewport 在 `tests/e2e/ac4-mobile.spec.ts` 用 chromium project + `test.use({ viewport: { width: 375, height: 667 } })`（iPhone SE 等价 context）单独跑通 AC-4 全套
- **registry 状态**: findings-registry BHV-004 = `deferred (backlog)` LOW，关联 backlog Issue #15

## 根因（推断）

两个独立假设，未做对照实验排除：

1. **webkit engine + mobile UA navigation 实现差异**: Vite dev server HMR client 在 mobile UA 下可能有 polyfill / event listener 注册路径不同，触发渲染线程阻塞
2. **Vite dev server SSR / pre-bundling 时序**: mobile 模拟的首次 navigation 比 Desktop 慢，dev server 还在 pre-bundle 依赖时 navigation 已发起 → race condition 导致 hang
3. **Playwright 自身 mobile-safari emulation 在 webkit 1.x 版本的已知问题**: 未查 Playwright issue tracker 确认

**未验证假设**: 换成 `vite preview`（serve build 产物，无 HMR client / pre-bundling）是否解决。Issue #10 closure 时间压力下未做对照实验。

## Remediation 建议

### 1. standard playwright preset / install 模板（推荐，预防类）

如果 standard 未来出 playwright 配置 preset，default 建议：

```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  // mobile-safari 默认注释，启用前先验证 webServer 兼容性
  // {
  //   name: 'mobile-safari',
  //   use: { ...devices['iPhone 14 Pro'] },
  // },
],
webServer: {
  // 推荐 vite preview（serve build，无 HMR / pre-bundling 干扰）
  // 而非 vite dev——后者与 mobile UA emulation 有已知超时问题
  command: process.env.CI ? 'pnpm preview --port 5174' : 'pnpm dev --port 5174 --strictPort',
  port: 5174,
  reuseExistingServer: false,
  timeout: 30_000,
},
```

要点：
- mobile-safari project default 注释 + 启用前 checklist
- webServer 在 CI 用 `vite preview`，本地 dev 仍用 `vite dev`（快速反馈）

### 2. 项目内 follow-up（本项目）

留 backlog Issue #15 deferred-feature umbrella；触发条件 = AC-4 真实 iPhone Safari 出现 chromium 模拟未覆盖的兼容性问题。届时做对照实验：
- (a) 切换到 `vite preview` 验证是否解决
- (b) 若仍超时，换用更轻的 `devices['iPhone SE']` 或自定义 viewport context（不依赖 device emulation）

### 3. Playwright 上游 issue 关注（监控类）

未查 Playwright 自身 issue tracker。Remediation 候选: 等 Playwright 升级 + webkit engine 升级后定期重试，看是否上游已修。

## scan_when

- 新项目 playwright 配置初始化时（手动 grep webServer 是否用 `vite dev` + projects 是否含 mobile device emulation）
- standard playwright preset / install 模板更新 PR 时
- Playwright / Vite 主版本升级时，定期重试 mobile-safari 是否仍超时

## related

- **PP-003** (`docs/problems/project-patterns.md`) #4 — 项目内 tendency 视角"测试基础设施陷阱集"的第 4 类
- **BHV-004** (`docs/audit/findings-registry.md`) — audit phase 产出条目，deferred backlog
- **backlog Issue #15** — deferred-feature umbrella，BHV-004 触发条件归集
- **Issue #10** — E2E 跑通 commit `f03e170`，首例发现

## 根因重定性（2026-06-03 / commit `b840aeb` / 重要更正）

**原 FB-005 三个假设（dev-server HMR / pre-bundling / webkit-mobile-UA）方向错了。** 补跑 v0.1.1 release 数字时，同一个 `page.goto 30s 超时` 在 **Desktop webkit + Desktop chromium**（非 mobile）上复现，且：

1. **换 `vite preview`（FB-005 原"未验证假设"）并未解决** —— preview webServer 下 full 并行 suite 仍 2 failed（page.goto 30s + 延迟膨胀）。证伪"dev-server 编译/HMR 是根因"。
2. **真正根因 = 并行 worker CPU 竞争**：8 核机器 default `workers`（≈全核）并行跑 webkit+chromium 重导航 + 1000 行渲染 → CPU 饱和 → 导航超时 + `input→preview` 延迟从 idle 34ms 膨胀到 225ms。
3. **CI 一直稳，正因 `workers: 1`（串行无竞争）** —— 这条之前被忽略的事实是关键反证。
4. **fix（已验证 3× 连跑确定性 31 pass/1 skip）**：`workers: CI?1:2` + `use.navigationTimeout: 60s` + 放宽负载敏感的 perf bound。preview 改动**已回退**（commit `19226c6`）—— 它非 flake fix，且 dev webServer 无 per-run build 更快（dev+workers 3× 跑 48s/49s/33s vs preview+build 1.9m/1.3m/55s）。

**对 BHV-004 的回溯影响**：之前判"mobile-safari 超时随 Playwright 1.60 升级消失"可能被 confounded —— 当时验证 BHV-004 是小批量/隔离跑（低竞争）才过，未必是版本修复。更可能 mobile-safari 原超时也含竞争成分。未做隔离对照，标 `[推断]`。

**教训**：page.goto 30s 超时优先怀疑**并发竞争**（先看 workers / 机器负载），不要先归因 server 类型 / engine / 版本。FB-005 原假设全部跳过了"测自身并发度"这个最廉价的对照。

## 升级路径

- **当前**: candidate；occurrences = 1，单项目实证（根因已于 2026-06-03 重定性为 worker 竞争）
- **observing 阈值**: 第 2 个 Vite + Playwright + mobile-safari 项目复现 → `occurrences = 2`
- **applied**: standard playwright preset / install 模板补默认配置 + scan_when 检查项 → 标 `applied`
- **verified**: applied 后新项目首次 playwright init 即避开此坑（不需手动排查）→ 标 `verified`
- **dismissed 触发**: Playwright / Vite 上游修复且本项目重试 `vite dev` 通过 → 整条 dismissed，remediation 内容归档
