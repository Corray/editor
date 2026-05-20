# Audit Report — MVP Multi-phase

| 字段 | 值 |
|------|----|
| **日期** | 2026-05-20 |
| **Phases** | spec / api / behavior / issue-process |
| **范围** | 全项目（7 模块 + shared/toast + 9 Issues #1-#9） |
| **审计方法** | 手动跑（audit skill `disable-model-invocation: true`，AI 不能直接调；按 audit 协议 5 维 + 各 phase 检查项产出） |
| **基线** | commit `c38d408`（Issue #9 后；本地 11 commits ahead 远端，未 push）|
| **Findings** | 11 条（4 SPEC + 2 API + 3 BHV + 2 IPR）|
| **Severity 分布** | HIGH 2 / MEDIUM 5 / LOW 4 |

> **本报告 immutable**（artifact-based-handoff.md "immutable artifact" 类）— 修订走勘误新建。

---

## 1. Spec Phase

### 输入

- PRD v1.0 `docs/prd/PRD-v1.0-mvp.md`
- 共识 v1.0 `docs/spec/consensus-v1.0.md`
- 模块清单 v1.0 `docs/spec/module-list-v1.0.md`

### 检查项 + 结果

| 检查 | 结果 |
|------|------|
| PRD 状态 / 推断点 I1-I7 决议 | ✓ accepted / 全部确认 |
| 共识 §9 TBD-1~10 决议 | ✓ 全部 ✓ |
| 模块清单 §7 TBD-M1~M4 决议 | ✓ 全部 ✓ |
| 业务模块清单完整覆盖共识 §3 | ✓ M1-M7 + cross-cutting toast |
| PRD F → 模块映射 | ✓ §5.1 矩阵显示 F1~F6 + §5 i18n 全覆盖 |
| AC → 模块映射 | ✓ §5.2 矩阵 |
| 反哺记录（CLAUDE.md / spec）| ✓ #7 readStoredDocument 已记录 |
| 模块状态 vs 实际实现 | ⚠ M5 status 表为 accepted（应为 partial-impl）|

### 发现

#### GAP-001 — M5 LayoutAPI 整个未实现，但 CSS 响应式叠列已工作

- **严重度**: MEDIUM
- **现象**: 模块清单 M5 status = `accepted`（未升 `in-dev`）；api-spec §3.5 定义 `LayoutAPI { viewport, mobileTab, setMobileTab }` 但代码中无 `src/modules/m5-layout/` 目录。`src/styles/main.css` 临时实现 `@media (max-width:767px) { .panes { flex-direction:column } }` 替代
- **影响**: AC-4 移动端的 tab 切换路径（F5.1）不存在；用户只能滚动看双栏叠列
- **建议**: 单独 Issue 「M5 布局抽离」实现 createLayout 工厂 + AppShell tab UI

#### GAP-002 — M2 PreviewAPI.getRootElement 接口未实现

- **严重度**: LOW
- **现象**: api-spec §3.2 定义 `getRootElement(): HTMLElement | null`；当前 M2 只导出 `render` 纯函数，无 `createPreviewAPI` 工厂；`PreviewArea.tsx` 不暴露 ref
- **影响**: 实际 M4 已通过 `pipeline.render(text)` 绕过该接口；功能不缺，spec 契约未兑现
- **建议**: 要么实现 ref 转发 + createPreviewAPI 工厂；要么把 getRootElement 从 spec 删除（反哺）

#### GAP-003 — F1.2 行号 / F1.3 字号控件未实现，无 Issue 跟踪

- **严重度**: LOW
- **现象**: PRD §4 F1.2「行号显示（可选，默认开）」/ F1.3「字号 / 行高可调」spec 列了；实现层 `EditorArea.tsx` 仅 textarea；m1-editor 目录无 `GutterLineNumbers.tsx` / `FontControls.tsx`（架构 §8 代码结构映射列了，未实现）
- **影响**: PRD 标"可选"/"默认值即可"，MVP 不阻塞；但 spec 与实现 drift 未显式记录
- **建议**: 建 Issue 「F1.2/F1.3 行号 + 字号控件」明确占位（或反哺 PRD 标 MVP-defer）

#### GAP-004 — 清空按钮 + confirm 流程未实现，但 dict 已有 `clear.confirm`

- **严重度**: MEDIUM
- **现象**: 共识 §4.6 引用 `t('clear.confirm')`；i18n dict `clear.button` + `clear.confirm` keys 都已在 `zh-CN.dict.ts`；`EditorAPI.clear` / `PersistenceAPI.clear` 工厂都已实现；UI 没有「清空」按钮入口
- **影响**: 用户需要手动 `localStorage.clear()` 才能清空；MVP 体验缺关键操作
- **建议**: 建 Issue 「清空按钮 + window.confirm」（5-10 行代码即可）

---

## 2. API Phase

### 输入

- 接口设计 v1.0 `docs/spec/api-spec-v1.0.md`
- 数据模型 v1.0 `docs/spec/data-model-v1.0.md`
- 各模块 `src/modules/m{1,2,3,4,6,7}-*/api.ts` + `src/shared/toast.ts`

### 检查项 + 结果

| 模块 API | spec | 实现 | 一致 |
|---------|------|------|------|
| M1 EditorAPI | §3.1 | api.ts ✓ | ✓ |
| M2 PreviewAPI.render | §3.2 | pipeline.ts ✓ | ✓ |
| M2 PreviewAPI.getRootElement | §3.2 | 缺 | ✗ → GAP-002 |
| M3 PersistenceAPI | §3.3 | store.ts/api.ts ✓ | ✓ + 反哺加 readStoredDocument |
| M4 ExportAPI | §3.4 | api.ts ✓ | ✓（依赖 pipeline.render 路径，§3.4 已反哺）|
| M5 LayoutAPI | §3.5 | **缺整个模块** | ✗ → GAP-001 / API-M5-001 |
| M6 ThemeAPI | §3.6 | theme.ts ✓ | ✓ |
| M7 I18nAPI | §3.7 | i18n.ts ✓ + setLang | ✓ |
| ToastAPI | §4.1 | toast.ts ⚠ stub | ✓ 接口 / ⚠ 实现 |

### 发现

#### API-M5-001 — M5 模块整个 API surface 缺

- **严重度**: MEDIUM（同 GAP-001，互相引用；登记两条便于跨 phase 追溯）
- **现象**: api-spec §3.5 `ViewportMode` / `MobileTab` / `LayoutAPI`；代码无 `src/modules/m5-layout/`
- **建议**: 同 GAP-001

#### API-T-001 — shared/toast 是 MVP stub（按计划，但跟踪 Issue 未建）

- **严重度**: LOW
- **现象**: `src/shared/toast.ts` 顶部 `TODO(post-mvp): full DOM toast UI`；Issue #2 / #3 / #4 都引用该 follow-up；但**「完整 toast UI Issue」未建**
- **建议**: 建 Issue 「shared/toast full DOM UI」追溯本债

---

## 3. Behavior Phase

### 输入

- AC: PRD §6 / 测试计划 §3 矩阵
- 状态机: data-model §5（M3）/ §4 各 State / api-spec §3.6 ThemeMode 切换
- 业务代码 + 测试: `src/modules/**` + `tests/unit/**`

### AC 覆盖矩阵 — 当前实际

| AC | 单测/组件测覆盖 | E2E 覆盖 | 综合 |
|----|----------------|---------|------|
| AC-1 编辑+预览闭环 | ✓ CT-M1-002 + PreviewArea 9 用例（含 family-E XSS）| **未跑**（Playwright 浏览器未装）| ⚠ 单测充分 / E2E 缺 |
| AC-2 持久化 | ✓ M3 state machine 13 + readStoredDocument 4 | **未跑** | ⚠ |
| AC-3 导出 | ✓ M4 16 用例（filename / blob / clipboard / outer wrapper）| **未跑** | ⚠ |
| AC-4 移动端 | ⚠ 只有 CSS @media，无 tab 切换组件测 | **未跑** | ✗ 缺 M5 + E2E |
| AC-5 性能 | ✓ pipeline 1MB 不抛错；bundle gzipped 64KB < 150KB | 手工 Lighthouse **未跑** | ⚠ |
| AC-6 主题 | ✓ M6 9 用例 family-B 全集 | **未跑** | ⚠ |

### 发现

#### BHV-001 — E2E 全集未跑（Playwright 浏览器未装）

- **严重度**: HIGH
- **现象**: 测试计划 §7 列 13 个 E2E 用例（AC-1~6 各 1-3）；`playwright.config.ts` 已配 3 projects (chromium / webkit / mobile-safari)；但 `pnpm exec playwright install` 未跑 → 浏览器二进制不在 → `pnpm e2e` 无法执行
- **影响**: AC-1~6 的端到端验收**全部依赖手工浏览器测试**；release 前必须跑通
- **建议**: release v0.1.0 前置任务：单独 Issue「E2E 跑通 + Playwright install」

#### BHV-002 — AC-4 移动端 tab 切换路径不存在

- **严重度**: MEDIUM（同 GAP-001）
- **现象**: PRD F5.1「< 768px 单栏切换（tab 切编辑 / 预览）」；当前实现仅 CSS column 列叠，用户在移动尺寸看到的是「上半 textarea + 下半 preview」整页滚动，**无 tab 切换 UI**
- **影响**: AC-4 验收无法直接通过 PRD 字面意图（"tab 切")；功能可用但偏离 spec
- **建议**: 同 GAP-001（M5 LayoutAPI 实现）

#### BHV-003 — AC-5 Lighthouse / 真实 perf bench 未跑

- **严重度**: LOW（按 TBD-T1 决议 MVP 不上 Lighthouse CI；手工跑留 release 前）
- **现象**: 当前 bundle 64KB gzipped < 150KB ✓；但 PRD §5「首屏 < 1s」/「输入到预览 < 50ms」需 Lighthouse / DevTools 实测验证
- **建议**: release v0.1.0 前置任务

---

## 4. Issue-process Phase

### 范围

| Issue | 标题 | 状态 label | 收尾 comment | 维度合规 |
|-------|------|-----------|------------|---------|
| #1 | M2 pipeline | pm-reviewed + fe-in-progress + module/m2-preview + feature | ✓ | ✓ |
| #2 | M3 + toast stub | + module/m3-persist + cross-cutting + tech-debt | ✓ (1 次 EOF 阻塞后补) | ✓ |
| #3 | M7 i18n | + module/m7-i18n | ✓ | ✓ |
| #4 | M3 i18n integration | + tech-debt + m7 | ✓ | ✓ |
| #5 | M6 主题 | + module/m6-theme | ✓ | ✓ |
| #6 | M1 编辑 | + module/m1-editor | ✓ | ✓ |
| #7 | main.tsx 整合 + 反哺 | + 多 module | ✓ | ✓ |
| #8 | M2 集成 | + m2 + m1 | ✓（hash 写错 1 次后补）| ⚠ commit hash 自纠 |
| #9 | M4 导出 | + module/m4-export | ✓ + grep self-check 3 命中 | ✓ |

### 5 维度检查

| 维度 | 结果 |
|------|------|
| **1 Label 状态机合规** | ⚠ 9 个 Issue 全部跳过 `raised → fe-reviewed` 中间态，body 含理由（一人多角色 + spec accepted）。**项目级 deviation**，应入 project-patterns |
| **2 收尾 comment 完整性** | ✓ 9/9 有 commit hash 格式 + 三选一 + "FE 工作完成"；维度 5c（反向漏切）N/A — fe-confirmed 全部待 /release |
| **3 Step 触发完整性** | ✓ 9/9 贴 Step 0 自检表 + 执行清单；Phase 1 硬停均有；文档先行多数无需（spec accepted）|
| **4 跨规则交叉验证** | ✓ `fe-confirmed` 都未切 — by design（/release 未跑，ADR-004 deferred） |
| **5 数据漂移检测** | ⚠ `#8` 收尾 comment hash 预写错（自捕获并补） |

### 发现

#### IPR-001 — Issue 状态机跳过 raised → fe-reviewed → pm-reviewed 中间态 ×9

- **严重度**: LOW（项目级合理 deviation，但应记录）
- **现象**: 全部 9 个 Issue body 直接打 `pm-reviewed`，跳过 `raised → fe-reviewed`；Issue body 均含解释段「一人多角色 + spec 上游 accepted」
- **影响**: audit 维度 1.2 严格说违规；本项目场景合理
- **建议**: 入 `docs/problems/project-patterns.md` 作为 PP（project tendency）；未来跨项目 audit 时该项目类型可豁免

#### IPR-T-001 — Issue 收尾 comment 中预写 commit hash 占位错误（trend pattern）

- **严重度**: LOW
- **现象**: Issue #8 收尾 comment 草稿预写 hash `7d4abd5`，实际 commit `3becbc9`；自捕获后删错 comment 重发
- **根因**: 我在 commit 前写 comment 草稿，没用 `$(git rev-parse --short HEAD)` 动态注入；issue-process skill 的 commit hash 自检 grep 只验证格式不验证 hash 真实性
- **建议**: 改 process — Issue closing comment 一律走 `ACTUAL=$(git rev-parse --short HEAD) && cat > tmp <<EOF ... commit: \`${ACTUAL}\` ... EOF` 模式；记入 `project-patterns.md` 或回流 standard FB

---

## 5. 汇总

### 严重度分布

| Severity | 数量 | 编号 |
|----------|-----|------|
| HIGH | 1 | BHV-001 |
| MEDIUM | 4 | GAP-001 / GAP-004 / API-M5-001 / BHV-002 |
| LOW | 6 | GAP-002 / GAP-003 / API-T-001 / BHV-003 / IPR-001 / IPR-T-001 |

> **按 artifact-based-handoff.md §「Handoff vs Registry 通道分工」**：HIGH 条目应**单独 handoff**（不沉底 registry）。本项目场景 PM = FE = Corray 一人，不强制走 handoff 流，但 BHV-001 在 release 前必须处理。

### Spec ↔ 实现核心对账

| 块 | spec | 实现 | gap |
|---|------|------|-----|
| M1 编辑（核心 + UI 控件）| 完整 | 仅核心 textarea + state + EditorAPI | F1.2 + F1.3 控件未实现 |
| M2 渲染 + 挂载 | 完整 | 完整（pipeline + PreviewArea）| getRootElement 接口未兑现 |
| M3 持久化 | 完整 | 完整 + 反哺 readStoredDocument | — |
| M4 导出 | 完整 | 完整 | — |
| M5 布局 | 完整（API + tab 切换）| 仅 CSS @media 叠列 | **整个 module API 缺** |
| M6 主题 | 完整 | 完整 | — |
| M7 i18n | 完整 | 完整 | — |
| shared/toast | 接口完整 | **MVP stub**（按计划）| full UI follow-up Issue 未建 |
| 清空操作（UI）| 共识 §4.6 引用 | EditorAPI.clear 工厂存在 | **按钮 UI 未实现** |
| E2E 自动化 | 测试计划 §7 列 13 用例 | playwright 已配，浏览器未装 | **未跑** |

---

## 6. 推荐下一步（按 release v0.1.0 优先级排序）

| 优先级 | 动作 | 关联 finding |
|--------|------|------------|
| **P0（release 前必做）** | E2E Playwright install + AC-1~6 跑通 | BHV-001 |
| **P1（release 前应做）** | M5 LayoutAPI + mobile tab 切换 | GAP-001 / API-M5-001 / BHV-002 |
| **P1** | 清空按钮 + confirm 流程 | GAP-004 |
| **P1** | ADR-004 deploy 决策重启 | ADR-004 deferred 状态 |
| **P2（release 前可选）** | 手工 Lighthouse perf 验证 | BHV-003 |
| **P2** | 项目 patterns 落档（IPR-001 + IPR-T-001）| docs/problems/project-patterns.md |
| **P3（release 后）** | M2 getRootElement 兑现 or spec 反哺删除 | GAP-002 |
| **P3** | F1.2 + F1.3 行号/字号控件 | GAP-003 |
| **P3** | shared/toast full UI Issue 立 | API-T-001 |

---

## 7. 审查方法说明

- audit skill 标记 `disable-model-invocation: true`（AI 不能直接调）；本次为**手动跑等价分析**，遵循 audit 协议 5 维 + spec/api/behavior/issue-process 4 phase 的检查项清单
- Findings 写入 `docs/audit/findings-registry.md`，编号 GAP-/API-/BHV-/IPR- 各自连续递增
- 本报告 commit + push 后状态固化（immutable artifact）
