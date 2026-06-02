# editor — Project Context

> **本文件 = 项目级 agent 上下文。** 会话启动时与 `~/.claude/CLAUDE.md`（全局）同时加载，给 agent 提供项目特定信息。
>
> **维护方：** PM（项目元数据 + 当前阶段 + 业务定位）/ EL（项目特定 rules，如有）
>
> **跨机器约定（重要）：**
> 本文件 commit 到 docs 仓库（schema 共享），但 §Standard 路径 段是**用户本地化字段**——clone 项目后必须按本机 standard 仓库绝对路径调整。建议本地化变更**不入 commit**（`git update-index --skip-worktree CLAUDE.md` 或保持 working tree 修改不 stage）。

---

## §Standard 路径（用户本地化字段，PM init 时填）

```yaml
standard_path: /Users/chat/backend-ai-workflow/agent-dev-standard
# 已验证: HEAD=c90a477 (2026-05-18)
```

**作用：**
- 项目级 standard 引用源
- 全局 `~/.claude/CLAUDE.md` 已 `@import` 9 条核心 rules（个人 default 体验）
- 本字段允许项目级**扩展引用** standard 文档——如 `init-flow.md` / `project-env-spec.md` / `concepts/*` 等非全局加载的内容
- 不同用户机器 standard 路径不同（团队默认版 / 个人 fork / 实验分支），所以本字段必须本地化

**用法：** 引用 standard 文档时使用绝对路径 `<standard_path>/docs/concepts/<doc>.md`（agent 读到本字段后展开）。

---

## 项目元数据

| 字段 | 值 |
|------|----|
| **名称** | `editor` |
| **类型** | `business` |
| **流派** | `github` |
| **代码仓库（本地目录名）** | `editor`（self；当前项目根即代码根，待业务代码 init） |
| **共享文档仓库（本地目录名）** | `editor`（self；不外接独立 docs 仓库，文档放本项目 `docs/`） |
| **env.yaml 路径** | `docs/env.yaml` |

---

## Issue 配置

> `/issue` skill 读取本段。占位 `[TBD]` 表示待用户后续回填，回填前对应能力不可用。

| 字段 | 值 | 状态 / 说明 |
|------|----|------------|
| `issue_repo` | `Corray/editor` | ✓ remote: `git@github.com:Corray/editor.git`（2026-05-18 回填）|
| `doc_repo` | `.` | self — 用本项目自身 `docs/`，不外接独立 docs 仓库 |
| `adr_path` | `docs/adr/` | standard convention（目录待创建，首个 ADR 写入时建）|
| `code_path` | `.` | 项目根（业务代码待 init）|
| `compile_cmd` | `pnpm typecheck` | ✓ `tsc --noEmit`，TS strict 类型检查作为编译门禁 |
| `role` | `FE` | 当前会话默认角色（前端开发）|

### 待回填清单（历史，全部完成）

| # | 动作 | 状态 |
|---|------|---------|
| 1 | `git remote add origin git@github.com:Corray/editor.git` | ✓ 2026-05-18 |
| 2 | `pnpm init` + tsconfig + Vite 脚手架 | ✓ 2026-05-19，`compile_cmd = pnpm typecheck` |
| 3 | `docs/adr/` + ADR-001~004 | ✓ 2026-05-19 |

---

## Standard 引用（基础规则）

本项目采用 **agent-dev-standard** 工作规范（ADR-004 决策 1：standard 是规范源，不 install 到本项目）。

**全局已加载（无需重复引用）：** `~/.claude/CLAUDE.md` 已 `@import` 9+ 条核心 rules（spec-to-code-flow / problem-handling-pattern / artifact-based-handoff / task-lifecycle / fix-pattern-scan / research-first / architecture-constraints / security-review / tech-debt / 等）。

**项目级扩展（按需）：**
- handoff 协议: 详见 `<standard_path>/docs/concepts/project-init-flow.md` + standard rule `artifact-based-handoff.md`
- env.yaml 规范: 详见 `<standard_path>/docs/concepts/project-env-spec.md`
- 流派差异: 同上 §一 末"流派项目背景差异"对比表

---

## Flow 工作模式

### 通用（不分流派）

- **agent 启动加载顺序：** `~/.claude/CLAUDE.md`（全局）→ 本文件（项目级）→ `docs/env.yaml`（运行时按需读）
- **commit + push 硬门禁：** handoff 收尾未 push = 未完成（Obs-7 教训）
- **角色独立性：** PM / BE 角色边界清晰，参数（ticket id 等）通过 TAPD / GitHub Issue 原生载体流转，不通过 handoff 文件硬塞

### TAPD 流派专属（流派 = tapd 时启用）

- **BE 任务收尾 4+1 件套：** commit / push / comment / status 流转 / **工时**（缺一不算闭环）
- **完整 ID 格式：** TAPD API 接受 `<workspace_id>001<short_id>`，UI 短 ID 不能直接调 API
- **群消息：** curl webhook 直发（MCP `send_qiwei_message` 当前有缺口）

### GitHub 流派专属（流派 = github 时启用）

- **BE 任务收尾 3 件套：** commit / push / Issue comment
- **工时管理：** 弱约束，daily worklog 周度 / 月度汇总即可

---

## 项目特定 context（PM 维护）

> PM 按项目实际情况填以下段，可标 TBD 后续补。

### 业务定位

> 来源：
> - PRD: `docs/prd/PRD-v1.0-mvp.md` (v1.0 accepted, 2026-05-18)
> - 共识文档: `docs/spec/consensus-v1.0.md` (v1.0 accepted, 2026-05-18 Corray 全盘接受 TBD-1~10)
> - 业务模块清单: `docs/spec/module-list-v1.0.md` (v1.0 accepted, 2026-05-19 Corray 全盘接受 TBD-M1~M4)
> - 架构设计: `docs/spec/architecture-v1.0.md` (v1.0 accepted, 2026-05-19; A4 部署推迟)
> - ADR: 001/002/003 accepted；**004 deferred**（部署到 release 前重启）
> - 接口设计: `docs/spec/api-spec-v1.0.md` (v1.0 accepted, 2026-05-19 全盘接受 TBD-I1~I4)
> - 数据模型: `docs/spec/data-model-v1.0.md` (v1.0 accepted, 2026-05-19 全盘接受 TBD-D1~D3)
> - 测试计划: `docs/spec/test-plan-v1.0.md` (v1.0 accepted, 2026-05-19 全盘接受 TBD-T1~T4)

- **产品形态：** Web 轻量 Markdown 编辑器（纯前端 SPA）
- **核心使用场景：** 临时草稿 / 移动端速记 / Markdown 渲染校验
- **MVP 范围：** 编辑+实时预览 / localStorage 持久化 / 下载 .md / 复制 HTML / 移动端单栏 tab / 浅深色主题
- **明确非目标：** 多用户协作 / 后端账号 / WYSIWYG / 插件市场 / 多文档管理

### 关键决策点

- **Markdown 渲染库** markdown-it v14（ADR-001 accepted）
- **HTML sanitize** DOMPurify v3（ADR-002 accepted）
- **框架** Solid.js 1.8+（ADR-003 accepted）
- **部署目标** 🕒 推迟（ADR-004 deferred；MVP 实现期不出 deploy.yml；release 前重启，待 PUBLIC / Pro / Vercel 三选一）
- **构建工具** Vite，**状态管理** Solid Signals 原生，**CSS** Variables + BEM，**测试** Vitest + Playwright
- **持久化策略** localStorage（MVP）→ IndexedDB（v1.1+）

### 反哺记录（spec-to-code-flow 实现层反馈到 spec 层）

- **2026-05-19 / #7**：M3 `init()` chicken-and-egg → 加 `readStoredDocument()` 静态导出；`init()` 兼容保留。api-spec §3.3 同步增补。
- **2026-05-19 / #8**：M2 集成实现追溯回填——api-spec §3.2 PreviewArea 行；module-list M2 status → in-dev/done。属"实现追溯"类（spec 契约不变，状态同步）。
- **2026-05-20 / #9**：M4 export 依赖契约调整——api-spec §3.4 把 `ExportAPI` 依赖从 ~~`M2.getRootElement()?.innerHTML`~~ 改为直接调 `pipeline.render(text)`（解耦 M2 DOM 挂载状态）；`getRootElement` 标 deferred → GAP-002（backlog #14）。**契约层反哺**，不是状态同步。
- **2026-05-20 / #12**：M5 LayoutAPI 实现追溯表——api-spec §3.5 加 `createLayout` / `AppShell viewport 分支` / `MobilePanes` 三行；module-list M5 status → done。属"实现追溯"类（API-M5-001 resolved）。
- **2026-05-20 / #13**：ADR-004 deploy 重启 → architecture §7 部署章节更新（URL / GH Pages source / vite base / HTTPS / workflow 引用）。属"ADR 决策落地到架构图"类。

- **2026-06-02 / #15 GAP-003**：F1.2 行号 + F1.3 字号控件落地 → api-spec §3.1 新增 `EditorPrefsAPI` 接口块（chrome-only，不进跨模块契约）+ 实现追溯行 ⏳→✓。新增 `m1-editor/prefs.ts`（signal + createEffect 镜像 CSS var + localStorage 持久化，照 M6 范式）；行号 gutter 关软换行精确对齐（决策 Q1）；字号 A-/A+ 三档 13/15/17（Q2）；行高跟随字号 1.6 倍不单独调（Q3）。属"契约层反哺"（新增 API surface）。

> 备注：#10（E2E）/ #11（clear button）/ 仅更新 `audit/findings-registry.md` 状态字段，未触及 spec 文件，不计入反哺。

---

## Audit 输入映射

### spec
- PRD: `docs/prd/PRD-v1.0-mvp.md`
- 共识文档: `docs/spec/consensus-v1.0.md`
- 模块清单: `docs/spec/module-list-v1.0.md`

### architecture
- 共识文档: `docs/spec/consensus-v1.0.md`
- 架构: `docs/spec/architecture-v1.0.md`
- ADR: `docs/adr/`
- 第三方约束: markdown-it / DOMPurify / Solid（ADR-001/002/003）

### api
- 接口设计: `docs/spec/api-spec-v1.0.md`
- 数据模型: `docs/spec/data-model-v1.0.md`
- 实现: `src/modules/m{1,2,3,4,6,7}-*/api.ts` + `src/shared/toast.ts`

### behavior
- AC: PRD §6 / 测试计划 §3 矩阵
- 状态机: data-model §5 (M3) / api-spec §3.6 状态转换
- 业务代码: `src/modules/**/*.ts(x)`
- 测试: `tests/unit/**`

### issue-process
- Issue 仓库: `Corray/editor`
- 默认窗口: `30d`（all 9 issues）
- 共享文档仓库: `.` (self)

### Findings registry: `docs/audit/findings-registry.md`

### 当前 active 阶段
- 参见 `docs/env.yaml`（TAPD 流派 `active_stories` / GitHub 流派 `active_milestones`）

### 项目特殊约束（如有）
- TBD

---

## 项目特定 rules（非必填）

> 本段仅当项目有 standard 未覆盖的特殊约束时填，**不重复定义 standard rules 已有内容**。

### PR-001 — 一人多角色场景下三通道豁免

**前提声明：** 本项目 Corray 一人同时承担 PM + FE + QA，CLAUDE.md `role: FE` 是会话默认角色，不是组织事实。

standard 三通道默认假设多角色协作；本项目按下表豁免，audit 时引本段 + 对应 PP 作合规依据。**违反前提（团队加入第二人）即失效**，必须移除本豁免段。

| 通道 | standard 默认载体 | 本项目等价载体 | 豁免依据 |
|------|----------------|--------------|---------|
| issue-process 状态机 | `raised → fe-reviewed → pm-reviewed` 完整流转 | 新 Issue 直接打 `pm-reviewed` label，body 含「状态机说明」段显式跳过 fe-reviewed | PP-001 / IPR-001 / FB-004 SP-A |
| problem-registry | `docs/problems/problem-registry.md` 独立账本 | `docs/audit/findings-registry.md`（audit 产出）+ `docs/problems/fb-index.md`（规则级反馈）+ `docs/problems/project-patterns.md`（项目 tendency）三 registry 分工承担；`problem-registry.md` 保留 schema 文档但不强制实条目 | PP-004 / FB-004 SP-B |
| handoff | `docs/handoff/{pending,in-progress,completed}/` 三态文件流 | GitHub Issue（含 label + comment）承担 PM → EL 推送动作；HIGH findings 直接转 Issue，不另起 handoff 文件 | PP-004 / FB-004 SP-C |

**audit 引用方式：** 任一 phase 检查到本豁免段覆盖的"通道空但等价载体有内容"时，改判"豁免合规"而非"违规"，报告对应 finding 直接标 `dismissed` + reason 引本段。

**升级触发：** standard `problem-handling-pattern.md` / `artifact-based-handoff.md` 任一新增"单人多角色豁免段"后，本段标 `applied → standard`，可缩减为单行引用。

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-18 | install Step 2 交互式配置：填项目元数据 + standard_path + Issue 配置段；issue_repo / compile_cmd 标 [TBD] 待回填 |
| 2026-05-18 | 接入 git remote (`Corray/editor`)，回填 issue_repo；首次 commit + push (master) |
| 2026-05-18 | PRD v0.1 draft 起草 → v1.0 评审通过（Corray 全盘接受 I1-I7），业务定位 / 关键决策点段落升级 |
| 2026-05-18 | 共识文档 v0.1 draft 落档（docs/spec/consensus-v0.1.md），含 TBD-1~10 待 PM-FE 对齐 |
| 2026-05-18 | 共识文档 v0.1 → v1.0 评审通过（Corray 全盘接受 TBD-1~10），进入 spec-to-code-flow 主路径，下一站 = 业务模块清单 |
| 2026-05-18 | 业务模块清单 v0.1 draft 落档（docs/spec/module-list-v0.1.md），7 模块 M1-M7 + TBD-M1~M4 待评审 |
| 2026-05-19 | 业务模块清单 v0.1 → v1.0 评审通过（Corray 全盘接受 TBD-M1~M4），M1-M7 状态 accepted，进入架构设计阶段 |
| 2026-05-19 | 架构设计 v0.1 draft 落档（docs/spec/architecture-v0.1.md）+ 4 份 ADR（001 markdown-it / 002 DOMPurify / 003 Solid / 004 GitHub Pages），TBD-A1~A8 待评审 |
| 2026-05-19 | 架构 v0.1 → v1.0 评审通过；TBD-A1~A3/A5~A8 接受，**TBD-A4 部署推迟**；ADR-001/002/003 accepted；ADR-004 deferred；MVP 实现期不出 deploy.yml |
| 2026-05-19 | 接口设计 v0.1 draft（7 模块 TS API + 5 时序图）+ 数据模型 v0.1 draft（localStorage schema + M3 状态机详细）落档，TBD-I1~I4 / TBD-D1~D3 待评审 |
| 2026-05-19 | 接口设计 + 数据模型 v0.1 → v1.0 评审通过（Corray 全盘接受 TBD-I1~I4 / TBD-D1~D3），进入测试计划阶段 |
| 2026-05-19 | 测试计划 v0.1 draft 落档（docs/spec/test-plan-v0.1.md），AC 矩阵 6 条 + 6 类家族维度（family-A~F）+ ~50 用例，TBD-T1~T4 待评审 |
| 2026-05-19 | 测试计划 v0.1 → v1.0 评审通过（Corray 全盘接受 TBD-T1~T4）；**spec-to-code-flow 上游全部 accepted**，进入代码实现阶段 |
| 2026-05-19 | 工程脚手架：package.json + tsconfig + Vite + Vitest + Playwright + index.html + src/main.tsx + reset/variables.css；compile_cmd 升级为 `pnpm typecheck`；`pnpm install` 待用户执行 |
| 2026-05-19 | 代码实现期：#1 M2 渲染管线 / #2 M3 持久化 / #3 M7 i18n / #4 M3 i18n integration (tech-debt) / #5 M6 主题 / #6 M1 editor / #7 main 整合 + 反哺 M3.readStoredDocument / #8 M2 集成 — 8 commit 落档 |
| 2026-05-20 | v0.1.0 release：#9 M4 export 落档 → multiphase audit（spec/api/behavior/issue-process）11 findings → /fix 三轮 resolve 5 条（#10 E2E HIGH / #11 clear MEDIUM / #12 M5 MEDIUM×3，对应 BHV-001/GAP-004/GAP-001/API-M5-001/BHV-002）→ retrospective 落档 → ADR-004 重启（A1 PUBLIC + GH Pages workflow + arch §7 同步 / #13）→ tag `v0.1.0` 发布，部署 https://corray.github.io/editor/ |
| 2026-05-21 | v0.1.0 收尾：Issue #1–#12 批量 `fe-confirmed` + release comment + close；findings-registry 变更记录追加（resolved 关联 Issue 全部关闭；残余 6 条 LOW —— GAP-002/003 / API-T-001 / BHV-003/004 / IPR-001/IPR-T-001 —— 留 v0.1.x / v0.2 处理）|
| 2026-06-02 | #15 GAP-003 推进：F1.2 行号 gutter + F1.3 字号 A-/A+ 三档实现（新增 `m1-editor/prefs.ts` + `EditorPrefsAPI`）；19 新单测 + typecheck + build + Playwright 视觉验证全绿；api-spec §3.1 / findings-registry GAP-003→resolved 同步反哺。#15 残余 BHV-003/004 仍 backlog |
