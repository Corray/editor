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
| `compile_cmd` | `echo "compile_cmd TBD (no package.json yet)"` | ⚠ 临时占位。`package.json` + `tsconfig.json` 就绪后换成 `pnpm tsc --noEmit`（或 `pnpm build`，按实际命名）|
| `role` | `FE` | 当前会话默认角色（前端开发）|

### 待回填清单（按优先级）

| # | 动作 | 解锁能力 |
|---|------|---------|
| 1 | `git remote add origin <github-url>` + 在 GitHub 建仓 | `/issue list` / `gh issue *` 全部命令 |
| 2 | `pnpm init` + `pnpm add -D typescript` + 写 `tsconfig.json` | `compile_cmd` 切真值，编译门禁生效 |
| 3 | `mkdir docs/adr` + 首个 ADR | architecture 决策可落档 |

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

### 当前 active 阶段
- 参见 `docs/env.yaml`（TAPD 流派 `active_stories` / GitHub 流派 `active_milestones`）

### 项目特殊约束（如有）
- TBD

---

## 项目特定 rules（非必填）

> 本段仅当项目有 standard 未覆盖的特殊约束时填，**不重复定义 standard rules 已有内容**。

- 无（简单项目通常无项目特定 rules）

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
