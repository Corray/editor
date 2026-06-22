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
- **持久化策略** ~~localStorage（MVP）~~ → **IndexedDB（v1.1 已实现，commit `5252add`；旧 localStorage 自动迁移 + 不可用降级）**

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
| 2026-06-02 | #15 BHV-004 推进 + BHV-005 回归修复：① BHV-004 原 page.goto 超时随 Playwright 1.60 消失，移除 AC4-003 chromium-only skip 拿到 webkit-mobile 覆盖 + 清理 dead config → resolved；② 跑 e2e 时捕获 GAP-003 回归（header 7 按钮 320px 横向溢出破 AC-4-001，根因=GAP-003 漏跑 e2e）→ `.header-actions{flex-wrap}` 修复（BHV-005）。full e2e 29 pass/1 skip。#15 仅剩 BHV-003 |
| 2026-06-02 | #15 BHV-003 推进 → **umbrella #15 全 resolved 可关闭**：跑通 perf bench 三项（Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz）落 docs/perf/baseline-v0.1.0.md；新增 `scripts/check-bundle-size.mjs` + deploy.yml `pnpm size` 闸 + E2E-AC5-002。scope=尊重 TBD-T1（Lighthouse CI 仍 v1.1），只加轻量 bundle 闸。full e2e 31 pass/1 skip |
| 2026-06-02 | #16 根治 commit-hash 占位（IPR-T-001 二次复发：amend 自引用变体）→ **umbrella #16 可关闭**：机械闸 `scripts/check-doc-hashes.mjs`（`pnpm check:hashes`）扫文档 `commit \`<hash>\`` 逐个 `git rev-parse --verify`，接入 deploy.yml（fetch-depth:0）；FB-002 candidate→applied / PP-002 remediation v2（加机械闸+顺序铁律）。IPR-001 由 PR-001 永久接受 → dismissed |
| 2026-06-02 | #14 tech-debt → **umbrella #14 可关闭（v0.1.0 audit 三 umbrella 全清）**：GAP-002 删 `getRootElement` 声明（零消费方，消除契约 drift）；API-T-001 toast console stub → 真 DOM UI（lazy-mount + 自动消失 + 动画 + aria-live，无 lib，接口冻结，7 单测）。api-spec §3.2/5.5/§4.1 同步反哺 |
| 2026-06-03 | **v1.1 启动 + 实现**：scope=持久化 localStorage→IndexedDB（解 R2 配额）。走完 spec-to-code-flow：共识 v1.1（TBD-v11-1~5 accept）→ module-list M3 delta → ADR-005（D1=idb+手写 fallback）→ api/data-model/test-plan v1.1 → 实现 commit `5252add`。idb@8.0.3 + fake-indexeddb；异步契约 + 一次性迁移（先写后删幂等）+ 不可用降级 + 启动异步 hydrate（竞争防护）；bundle 66.1KB gz；unit 120 + e2e 33 全绿 |
| 2026-06-04 | v1.1 → tag **v0.2.0** 发布（路线图 v1.1 里程碑，semver 不跳号）+ 增量 audit F-V11-1(MEDIUM)/F-V11-2 tag 前修；线上眼验迁移生效 |
| 2026-06-04 | **v1.2 启动 + 实现**：scope=URL 分享 + 导入 .md（路线图 §153）。走完 flow：共识 v1.2（TBD-v12-1~5 accept）→ module-list M4「导出」→「导入/导出 I/O」→ ADR-006（D1=lz-string）→ api/data-model/test-plan v1.2 → 实现 commit `7e15d00`。lz-string@1.5.0；`#doc=1.<lz>` hash 编码 + 超限拒绝 + 隐私提示 + 打开链接 confirm（取消保留本机）+ 导入 .md；bundle 68.2KB gz；unit 134 + e2e 43 全绿。增量 audit 无 MEDIUM（不受信内容 DOMPurify 兜底）；3 LOW（F-V12-1~3）deferred |
| 2026-06-04 | **v1.3 启动 + 实现**（tag→v0.4.0）：scope=KaTeX 公式（Mermaid 降风险推 v1.4）。flow：共识 v1.3（v13-1=b KaTeX-only）→ module-list M2 delta → ADR-007（D1=@vscode/markdown-it-katex）→ api/test-plan v1.3 → 实现 `1e2af26`。katex 0.17 懒加载（首屏不含）+ output:html+trust:false+不放宽 sanitize（安全降风险）+ load-后-rerender。size 闸修正为首屏（懒加载不计）。首屏 76.66KB；unit 144 + e2e 51 全绿。增量 audit 无 MEDIUM，3 LOW deferred |
| 2026-06-04 | **v1.4 启动 + 实现**（tag→v0.5.0）：scope=Mermaid 图（最高风险版）。flow：共识 v1.4（TBD-v14-1~5 accept）→ module-list M2 delta → ADR-008（D1=DOMPurify svg profile+显式 FORBID foreignObject）→ api/test-plan v1.4 delta → 实现 `a32f43b`。mermaid 11.15.0 懒加载（135KB gz 独立 chunk 不进首屏）+ **三层 SVG sanitize**（securityLevel:strict + htmlLabels:false 砍 foreignObject + DOMPurify profile+FORBID）+ per-block 异步 + 代次令牌防竞态 + 失败降级；占位源文存 textContent（data-* 被 sanitize 剥离）。首屏 77.34KB；unit 149 + e2e 59 全绿。**AC-v14-3 XSS 发布门槛 e2e 双引擎达成**（E2E-v14-003：恶意 mermaid 无 alert/script/foreignObject/onerror）。增量 audit 无 MEDIUM，3 LOW（F-V14-1~3）deferred |
| 2026-06-05 | **CI Node 24 升级**：6 个 GitHub Action 升至 node24 majors（checkout v6 / setup-node v6 / configure-pages v6 / deploy-pages v5 / upload-pages-artifact v5 / pnpm-action-setup v6），一手 release notes 核实；赶 2026-06-16 强制前；CI run 26990084637 success，Node 20 弃用告警清零 |
| 2026-06-05 | **v1.5 启动 + 实现（tag→v0.6.0 待定）**：scope=Service Worker 离线(PWA)。flow：共识 v1.5（TBD-v15-1~4 经方向问答 accept）→ module-list M8 新增 → ADR-009（D1=vite-plugin-pwa 1.3.0 / D2=含懒加载 chunk / D3=prompt 更新 / D4=scope+CSP）→ api/test-plan v1.5 delta → 实现 `296294e`。vite-plugin-pwa generateSW（Workbox runtime 内联自托管，CSP script-src 'self' 不放宽）+ globPatterns 含 chunk（离线渲染公式/图）+ registerType:prompt→toast action 提示刷新 + manifest/自绘 PNG 图标 + CSP 加 manifest-src/worker-src。首屏 78.18KB（workbox-window +0.84KB）；unit 155 + e2e 63/1skip（pwa project build+preview 真 SW，含离线 mermaid/katex 渲染 + console 干净）。增量 audit 1 MEDIUM F-V15-1（precache 3.7MB / accept D2 放大后果）**→ tag 前修 `551c28d`**：mermaid 重 chunk 按名路由 assets/mmd/ + globIgnores + runtimeCaching(cache-on-use)，**precache 3.7MB→1.18MB（−68%）**，app+katex 仍 precache（离线公式始终可用），F-V15-1/2 resolved（F-V11-1 先例）。4 LOW（F-V15-3~5）deferred |
| 2026-06-05 | **v1.6 启动 + 实现（tag→v0.7.0）**：scope=多文档（文件列表，**迄今最大 L3**）。flow：共识 v1.6（TBD-v16-1~4 倾向 + 5/6/7 拍板：自动标题/抽屉/import 新建）→ module-list M9 新增 + M3 改造 → ADR-010（documents store + D_uuid + 先写后删第三次迁移 + M3-M9 分解 + 涟漪改 v1.2 语义）→ data-model/api/test-plan v1.6 → 实现 `f2986e2`。M9 文档管理（documents store DB v1→2 + activeId + CRUD + 标题派生 + D_uuid）；第三次迁移 ls→kv→documents（先写后删 + v1.0 直跳兜底路）；M3 单写者委托 saveActiveText；import/open-shared→新建（退役 2 overwrite confirm）；DocList 桌面 sidebar + DocDrawer 移动抽屉；async bootstrap + **修 FOUC**（applyInitialTheme 同步先于 await）。首屏 80.01KB；unit 159（M9 13）+ e2e 65/1skip（ac10 多文档 + ac2/ac7 v1.6 语义双引擎）。**增量 audit 最大版无 MEDIUM**（迁移数据安全经复用 v1.1 范式 + 单写者控住；v1.0 直跳盖空 case 被实现期 e2e 捕获补强）；5 LOW（F-V16-1~5）deferred |
| 2026-06-05 | **v1.7 启动 + 实现（tag→v0.8.0）**：scope=滚动同步（编辑↔预览，最后一个 FE-only roadmap 功能）。flow：共识 v1.7（TBD-v17-1~3 倾向 + 4/5 拍板：双向 + 常开）→ module-list M10 新增 + M2 source-line → ADR-011（source-line 映射 + data-source-line 过 sanitize ADD_ATTR + 反馈环防护 + 双向桌面 only + M10）→ api/test-plan v1.7 → 实现 `7c4d7ad`。M2 source_line core rule 标 data-source-line + render ADD_ATTR 放行；M10 createScrollSync 双向（映射 + syncing/rAF 反馈环防护）；EditorArea/PreviewArea 暴露 scroll ref + AppShell createEffect 桌面挂载（fontSize 变重建）；copyHtml 剥离 data-source-line；**修潜伏布局**（#root min-height→height:100vh+overflow:hidden，面板内部滚动而非整页滚，否则 sync 无可滚区间，live MCP 探针定位）。首屏 80.51KB；unit 162 + e2e 79（ac11 双向滚动+XSS+移动 双引擎）。**AC-v17-5 XSS 发布门槛达成**（ADD_ATTR data-source-line 后 script/onerror/javascript: 仍剥离，双引擎）。增量 audit 无 MEDIUM，4 LOW（F-V17-1~4）deferred |
| 2026-06-05 | **v1.8 启动 + 实现（tag→v0.9.0）**：scope=多文档增强（重命名+搜索，解 F-V16-2；FE 功能井近干的拐点版）。flow：共识 v1.8（TBD-v18-2/4 倾向 + 1/3 拍板：内联编辑 + 标题+内容搜索）→ module-list M9 delta → ADR-012（titleManual 标题锁 + 内联双击重命名 + title/text 搜索过滤）→ data-model/api/test-plan v1.8 → 实现 `c66c21e`。DocRecord +titleManual?（无 DB 升级 / schemaless / 旧记录兼容）；M9 rename（非空锁 / 空回退自动）+ saveActiveText titleManual 旁路（解 F-V16-2）+ query/setQuery（docs() 按 title\|text 过滤，records 含 text 无额外 IO）；DocList 搜索框 + 内联双击重命名（Enter 提交 / Esc 取消 / editingId 守 blur 防 Esc 误提交）。首屏 81.04KB；unit 166（M9 +rename-lock/empty/search/legacy）+ e2e 87（ac12 rename/锁/Esc/搜索 双引擎）。增量 audit 无 MEDIUM，**F-V16-2 resolved**，实现期 2 bug（query TDZ / Esc-unmount-blur）测试捕获，4 LOW（F-V18-1~4）deferred |
| 2026-06-08 | **v0.9.1 清债 consolidation（PATCH，非功能版）**：FE 功能井近干 → 拐点决策选"清债"。挑高价值子集清 4 条（不做全清）：**F-V11-3**（旗舰/F-V11-1 家族漏网，静默吞错经 v1.6 重构迁到 M9 用户操作 fire-and-forget store 写 → 加 guardStore log+toast + family scan 复核）、**F-V12-2**（导入 looksBinary 检测二进制 → 拒绝 + toast）、**F-V11-5**（死 key storage.unavailable 复用为 guardStore 通用错误提示）、**BHV-010**（补 ac13 e2e：行号/字号档位/复制 toast 双引擎）→ 实现 `a0efd2c`。明确 defer 多 tab/race/perf/SVG单测/UX（理由见 `docs/audit/2026-06-08-v0.9.1-consolidation.md`）。unit 171 + e2e 92/1 已知 flake；首屏 81.20KB。剩 30 条 findings 多为 info/边缘/perf-待压测 |
| 2026-06-08 | **v2.0 启动 + 实现（tag→v1.0.0-rc.1，非 v1.0.0）**：scope=账号+云同步（**破纯 FE / 架构跳变 / 安全核心**）。拐点决策选 v2.0。flow：共识 v2.0 新章节 accepted（Supabase BaaS + 紧 MVP + magic link + local-first 叠加云 + per-doc LWW + 首登并集 + 软删 tombstone + RLS 隔离）→ 4 ADR(013 Supabase/014 magic link/015 sync/016 安全 RLS) → module-list M11 + data-model/api/test-plan v2.0 → 实现 `935d3ae`（mock 后端）。M11 同步网关（唯一碰 supabase-js / Gateway / 懒加载：env-less tree-shaken，with-env 204KB lazy chunk 非首屏）+ M9 集成（sync hooks + mergeRemote LWW/并集/tombstone，**匿名无 env→ 行为不变**）+ 登录 UI（magic link，仅 enabled 显示）。激活休眠 rule：arch-constraints §7 Gateway/§4 identity 隔离、security-review 全程。unit 178（+M11 7）+ e2e 93/1skip（匿名零回归实证）；首屏 81.20KB(env-less)。**增量 audit 2 MEDIUM（F-V20-1 真impl 未验 / F-V20-2 RLS 真隔离未达）= AC-v20-6 安全发布门槛 PENDING-provision → 打 v1.0.0-rc.1 不打 v1.0.0**。真云全路径待用户 provision 后验（最大盲点，诚实标）。5 LOW（F-V20-3~7）|
| 2026-06-09 | provisioning 三件套（rc 配套，不动版本）：`supabase/schema.sql`（建表+RLS 幂等）+ `.env.example` + deploy.yml 接 Secrets（空→env-less 安全降级）+ `docs/setup/cloud-sync-provisioning.md`（升 v1.0.0 可执行步骤 + AC-v20-x 验证清单）。CI 实证 env-less 仍绿 |
| 2026-06-09 | **清债 consolidation 第二轮（tag→v1.0.0-rc.2）**：rc 线打磨清 4 条 LOW。**BHV-006**（字号 13/17 边界→A−/A+ disabled + canIncrease/canDecreaseFontSize）、**BHV-009**（toast error/warn→role=alert+aria-live=assertive）、**F-V12-1**（空 share payload→readSharedDocument 返 null 不建空文档）、**F-V18-3**（doc-list 加常显 ✎ 重命名入口，mobile 友好）→ `5975561`。**F-V14-3 重评估仍 defer**（修触 mermaid 异步+XSS 门槛路径，风险>价值）。unit 181 + e2e 93；首屏 82.54KB。剩 open 多为 info/perf-未压测/F-V20 真云-pending |
| 2026-06-11 | **RLS 静态人工审**（推 v1.0.0 准备，用户选「先 provision 再升」后云验挂起）：AC-v20-6 门槛②完成（报告 `2026-06-11-rls-schema-review.md`，11 项全过 + 2 info F-V20-8/9）；门槛①两用户线上验仍 pending provision |
| 2026-06-11 | **v2.1 启动 + 实现（tag→v1.1.0-rc.1）**：scope=编辑增强包（查找/替换 + Cmd+B/I/K toggle + 列表自动延续 + 字数统计；PM 新拍 scope，路线图已耗尽后首版）。flow：共识 v2.1（TBD-v21-0~5 全拍：0=a 1.1.0-rc.1 / 1~5=a 全盘倾向）→ module-list M1 delta → ADR-017（execCommand('insertText') 保 undo + setRangeText fallback / FindController 选区跳转 / toggle 包裹 / Enter 列表编排含 isComposing IME 守卫 / 字数 CJK+词复合计数）→ api/test-plan v2.1 → 实现 `989fcc7`。实现期「测量优先」自查暴露 wordcount 27.6ms/374KB/键阻塞（BHV-008' 家族）→ tag 前修 `74eac69`（单遍 charCode 扫描 4.4ms + createDeferred 出输入路径）。**AC-v21-7 undo 门槛 chromium 实证**（Playwright WebKit undo 全合并 = 测试环境引擎特性，探针实证后 skip → F-V21-1）。首屏 84.63KB；unit 220 + e2e 108/2skip。增量 audit 无 MEDIUM，4 LOW（F-V21-1~4）。**版本策略：rc 后缀延续「云同步未验」标记**（TBD-v21-0a），云验后一次性出 1.1.x 正式 |
| 2026-06-11 | **v2.2 启动 + 实现（tag→v1.2.0-rc.1）**：scope=大纲/TOC 面板（2026-06-11 三项拍板 scope 的第三项收尾）。flow：共识 v2.2（TBD-v22-1~4 全拍：sidebar 下半分区桌面 only / 源文 ATX regex 跳 fenced / 跳转复用 M10 联动 / 全层级无高亮）→ module-list M12 新增 → ADR-018 → api/test-plan v2.2 → 实现 `7626be0`。M12 纯派生态薄模块（parseOutline 单遍 + OutlinePanel），app 层组合进 DocList children slot（M12 不依赖 M9）；跳转 = 光标行首 + scrollTop 估算居中 → scroll 事件自然驱动 M10 预览联动（零新协议）；deferred 出输入路径（v2.1 wordcount 范式）。首屏 85.93KB；unit 230 + e2e 116/2skip。增量 audit 无 MEDIUM，2 LOW info（F-V22-1~2）|
| 2026-06-12 | **v2.3 启动 + 实现（tag→v1.3.0-rc.1）**：scope=预览代码块语法高亮（2026-06-12 四项拍板 scope 第一项；后续队列 v2.4 编辑打磨包 / v2.5 打印导出 / v2.6 版本快照）。flow：共识 v2.3（TBD-v23-1~4 全拍）→ module-list M2 delta → ADR-019（highlight.js 11.11.1 lib/common 懒加载 / markdown-it highlight 闭包零重建 / class 输出过默认 sanitize **零放宽** / 自绘 --hl-* CSS 变量主题零重渲染）→ api/test-plan v2.3 → 实现 `f966af3`。hasCode 启发式（katex hasMath 范式）；降级路径全枚举；hljs chunk 162KB raw 进 precache（离线高亮，katex 同策略）。首屏 86.47KB；unit 238 + e2e 122/2skip。**AC-v23-4 XSS 门槛 unit+e2e 双引擎达成**。增量 audit 无 MEDIUM，2 LOW info（F-V23-1~2）|
| 2026-06-12 | **v2.4 启动 + 实现（tag→v1.4.0-rc.1）**：scope=编辑细节打磨包（四项 scope 第二项）。flow：共识 v2.4（TBD-v24-1~3 全拍：2 空格缩进+Esc 放行 a11y / header ⌨+Cmd+/ / 视口顶部 section 高亮）→ ADR-020 → api/test-plan v2.4 → 实现 `f780847`。indentSelection（多行单次 replaceRange 一步 undo）+ HelpDialog（8 快捷键）+ activeOutlineIndex（scroll rAF 节流，解 TBD-v22-4 defer）。实现期捕获 **webkit 点按钮不转移焦点** → 全局快捷键改 window 级监听（范式落 audit）；负载超时假阴性定性（空载复跑全过）。首屏 87.61KB；unit 249 + e2e 131/3skip。增量 audit 无 MEDIUM，2 LOW info（F-V24-1~2）|
| 2026-06-12 | **v2.5 启动 + 实现（tag→v1.5.0-rc.1）**：scope=打印/导出增强（四项 scope 第三项）。flow：共识 v2.5（TBD-v25-1~3 全拍：无打印按钮 Cmd+P / 导出取预览 DOM 最终态+二次 sanitize / KaTeX CDN link 带 SRI 仅入导出产物）→ ADR-021 → api/test-plan v2.5 → 实现 `c270057`。@media print（chrome 全隐+强制浅色+解除 v1.7 滚动容器链）+ ExportHtml（双重 sanitize + 剥内部属性 + SRI 本地 katex@0.17.0 文件计算，应用 CSP 零变化）。附带 **F-V22-1 二次复发加固**（ac15-2 webkit poll 10s）。首屏 88.77KB；unit 255 + e2e 134/3skip。增量 audit 无 MEDIUM，3 LOW info（F-V25-1~3）|
| 2026-06-15 | **v2.6 启动 + 实现（tag→v1.6.0-rc.1）**：scope=文档版本快照（四项 scope 压轴，**L3 动持久化根基**）。flow：共识 v2.6（TBD-v26-1~4 全拍：saveActiveText piggyback 自动快照无定时器 / 每文档 30 FIFO+cascade / ⏱ 历史弹层+恢复存 restore 保护快照 / 纯本地 M11 零变化）→ module-list M9 delta → ADR-022 → data-model/api/test-plan v2.6 → 实现 `4f3afb0`。snapshots store DB v2→3 **additive**（零旧数据迁移，比 v1.6 单→多低一档风险）；自动快照挂单写者入口（间隔 5min+内容去重+基线，lastSnap 缓存 seed 重启去重）；恢复保护快照防误恢复；cascade 删快照无孤儿。**实现期 DB 版本 bump 引入 e2e helper 回归**（_storage open v2→VersionError 静默→测试串扰）→ 修 helper 升 v3 + **PP-005 落档**（bump DB 须全仓 grep 版本号 / fix-pattern-scan 实例）。首屏 90.52KB；unit 263 + e2e 138/3skip。增量 audit **L3 无 MEDIUM**（additive 升级零损 unit 实证 + 单写者纪律 + 恢复保护全枚举）。4 LOW info（F-V26-1~4）。**2026-06-12 四项拍板 scope 全交付**|
| 2026-06-17 | **v2.7 启动 + 实现（tag→v1.7.0-rc.1）**：scope=Markdown 格式工具栏（第二批打磨 scope 第一项；后续队列 v2.8 表格 / v2.9 设置面板 M13 / v3.0 国际化）。flow：共识 v2.7（TBD-v27-1~3 全拍：8 按钮 / 编辑区顶部常驻桌面+移动 / 行前缀 toggle）→ module-list M1 delta → ADR-023 → api/test-plan v2.7 → 实现 `c3139d8`。**高复用**：4/8 按钮走既有 applyFormat（v2.1），新代码仅 toggleLinePrefix（行前缀 toggle+ol 递增，复用 indentSelection 范式）+ wrapCodeBlock + FormatToolbar 组件；mousedown preventDefault 防夺焦丢选区；全经 replaceRange undo 保持。首屏 91.19KB；unit 274 + e2e 148/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V27-1~2）|
| 2026-06-17 | **v2.8 启动 + 实现（tag→v1.8.0-rc.1）**：scope=表格编辑辅助（打磨批第二项）。flow：共识 v2.8（TBD-v28-1~3 全拍：工具栏第 9 按钮插 2 列模板 / 表格行内 Tab 单元格导航 / `\|` 起头判定）→ module-list M1 delta → ADR-024 → api/test-plan v2.8 → 实现 `13a409c`。insertTable 模板 + tableCellNav（`\|` 位置切分 cells + 末行新增 + Shift+Tab 反向）；**Tab 三级分流**（allowTabOnce a11y → tableCellNav 表格行 → indentSelection v2.4 缺省）互斥清晰；全经 replaceRange undo。首屏 91.52KB；unit 283 + e2e 156/4skip。增量 audit 无 MEDIUM，3 LOW info（F-V28-1~3：无列宽对齐/非\|起头变体/trim 边界）|
| 2026-06-17 | **v2.9 启动 + 实现（tag→v1.9.0-rc.1）**：scope=设置面板 M13（打磨批第三项，收口散落常量）。flow：共识 v2.9（TBD-v29-1~4 全拍：收口 2 项快照间隔/上限 / header ⚙ / localStorage 持久化默认零行为变化 / 语言只读占位）→ module-list M13 新增 → ADR-025 → data-model/api/test-plan v2.9 → 实现 `61da777`。**架构价值**：快照间隔(5min)/上限(30) 从散落硬编码收口 M13 单一来源；**解耦守纪律**——纯 IDB store.ts 不 import M13（收 maxPerDoc 数值参数）/ manager 读 settings accessor；createDocManager settings 缺省回原常量（向后兼容零行为变化，既有 CT-SNAP 无需注入全过）。SettingsDialog（开关+间隔/上限档+语言占位）。实现期 tsc 抓测试 afterEach 表达式返回错（vitest 漏过→提交前 build）+ Esc 漏加（ac22 捕获）。首屏 92.66KB；unit 292 + e2e 162/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V29-1~2）|
| 2026-06-17 | **v3.0 启动 + 实现（tag→v1.10.0-rc.1）**：scope=国际化 en-US + 语言切换（打磨批第四项/压轴，补完 M7 已铺框架）。flow：共识 v3.0（TBD-v30-1~3 全拍：navigator 首访检测 / en 全量翻译 / M13 语言段接切换）→ module-list M7 delta → ADR-026 → api/test-plan v3.0 → 实现 `3168c99`。en-US.dict.ts 全量 104 key（**`Record<DictKey,string>` 编译期强制全覆盖**，漏译=tsc 报错）；Lang 扩 + setLang localStorage 持久化 + detectInitialLang（navigator.language en*→en-US）；M13 语言 select 接 i18n.setLang（Solid t() 响应式即时重渲染）。**v3.0 引入两处测试回归**：① navigator 检测 × Playwright en-US locale → 既有中文 e2e 全失败 → resetStorage seed zh-CN systemic 修复 + **PP-006 落档**（环境相关默认须给 e2e 确定性基线）；② 加语言 select 破坏 ac22 `.last()` 位置 → select 全加 aria-label getByLabel 定位。首屏 93.80KB；unit 297 + e2e 166/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V30-1~2）。**第二批打磨 scope（v2.7~v3.0）全交付**|
| 2026-06-17 | **v3.1 启动 + 实现（tag→v1.11.0-rc.1）**：scope=预览任务清单交互（第三批 scope 第一项）。flow：共识 v3.1（TBD-v31-1~3 全拍：自定义 core rule / 点击回写源文 / 桌面+移动）→ module-list M2 delta → ADR-027 → api/test-plan v3.1 → 实现 `01b801d`。自定义 markdown-it core rule 渲染 GFM `- [ ]` 为可点 checkbox（带 data-source-line，复用 v1.7 映射）；PreviewArea 委托点击 → preventDefault → toggleTaskAtLine 翻转源行 → setText（单一数据源，重渲染驱动真值，持久化经 M3）。**安全红线零放宽**（DOMPurify 探针前置验 input 默认放行 + onclick 剥离；unit+e2e 双引擎三重验 XSS）。首屏 94.37KB；unit 309 + e2e 176/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V31-1~2）|
| 2026-06-18 | **v3.2 启动 + 实现（tag→v1.12.0-rc.1）**：scope=文档统计面板（第三批 scope 第二项）。flow：共识 v3.2（TBD-v32-1~3 全拍：点 status bar 展开 / 7 项 / 新 computeStats 复用 + deferred）→ module-list M1 delta → ADR-028 → api/test-plan v3.2 → 实现 `b1de3b1`。computeStats 单遍 charCode + 行扫描（复用 countWords 的 isCJK/isWordChar + minutes 公式 → words/cjk/minutes 与 status bar **保证一致**，CT-STATS-2 防分叉）；status bar 改 button 点击展开 StatsPanel（7 项）+ deferred 出输入路径。首屏 95.35KB；unit 315 + e2e 180/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V32-1~2）|
| 2026-06-18 | **v3.3 启动 + 实现（tag→v1.13.0-rc.1）**：scope=frontmatter (YAML) 支持（第三批 scope 第三项）。flow：共识 v3.3（TBD-v33-1~3 全拍：自定义 block rule / metadata 框常显 / 轻量 key:value 不引 js-yaml）→ module-list M2 delta → ADR-029 → api/test-plan v3.3 → 实现 `a3468a9`。自定义 block.ruler.before('hr')：仅 startLine 0 + 首行 `---` + 闭合校验 → 消费渲染 metadata 框（文中 `---`/无闭合落 hr 不误吞）；轻量 key:value 行解析（嵌套/数组原样 raw）；值 escapeHtml + 默认 DOMPurify **不放宽**（XSS unit+e2e 双引擎验）；无新依赖。首屏 95.77KB；unit 322 + e2e 186/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V33-1~2）|
| 2026-06-18 | **v3.4 启动 + 实现（tag→v1.14.0-rc.1）**：scope=markdown 扩展包 emoji/脚注/上下标（第三批 scope 压轴）。flow：共识 v3.4（TBD-v34-1~3 全拍：叠齐三项 / markdown-it-emoji 全量 / 懒加载）→ module-list M2 delta → ADR-030 → api/test-plan v3.4 → 实现 `586b66a`。emoji@3.0.0(full)/footnote@4.0.0/sub@2.0.0/sup@2.0.0 懒加载（hasExtension 触发，katex 范式，首屏不含保 size 闸）；**applyExtensions 双实例同步**（baseMd+katexMd 每实例一次，对称协同无双注册）；默认 sanitize 放行 sub/sup/footnote 标准标签 **不放宽**（XSS 双引擎验）；4 插件本地 ambient 类型声明。首屏 96.00KB（emoji data lazy）；precache 1570→1654KB；unit 330 + e2e 190/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V34-1~2）。**第三批 scope（v3.1~v3.4）全交付**|
| 2026-06-22 | **v3.5 启动 + 实现（tag→v1.15.0-rc.1）**：scope=callout 容器块（第四批 scope 第一项）。flow：共识 v3.5（TBD-v35-1~3 全拍：note/tip/warning/danger 4 类 / 并入 ensureExtensions / 自定义标题）→ module-list M2 delta → ADR-031 → api/test-plan v3.5 → 实现 `adbf5e5`。markdown-it-container@4.0.0 × 4 类自定义 render（`<div class=callout--{type}>` + 标题 escapeHtml + t 默认类型名）并入 v3.4 懒加载链（hasExtension +`:::`，首屏不含）；默认 sanitize 放行 div/class **不放宽**（XSS 双引擎验）；CT-CALLOUT-3 jsdom navigator en-US（PP-006 同源）→ 测试显式 setLang 双验。首屏 96.35KB；unit 337 + e2e 194/4skip。增量 audit 无 MEDIUM，2 LOW info（F-V35-1~2）|
| 2026-06-22 | **v3.6 启动 + 实现（tag→v1.16.0-rc.1）**：scope=文本高亮/标记 mark/ins（第四批 scope 第二项）。flow：共识 v3.6（TBD-v36-1~2 全拍：mark+ins 都做 / 并入扩展链）→ module-list M2 delta → ADR-032 → api/test-plan v3.6 → 实现 `6a3a889`。markdown-it-mark@4.0.0(`==高亮==`→`<mark>`)/ins@4.0.0(`++插入++`→`<ins>`) 并入 v3.4 懒加载链（hasExtension +`==`/`++`，首屏不含）；标准标签默认放行 **不放宽**（XSS 双引擎验）；删除线 `~~` 核心不受影响。首屏 96.40KB；unit 342 + e2e 197/4skip。增量 audit **无 MEDIUM / 无新 finding**。ac5-perf 负载 flake（隔离过）|
| 2026-06-22 | **v3.7 启动 + 实现（tag→v1.17.0-rc.1）**：scope=主题增强 强调色（第四批 scope 收尾）。flow：共识 v3.7（TBD-v37-1~3 全拍：5 档预设 / 不加整套主题诚实砍 / 并入 settings）→ module-list M13 delta → ADR-033 → api/test-plan v3.7 → 实现 `02003c5`。M13 settings +accentColor（blue/green/purple/orange/rose，anti-poisoning）+ createEffect 应用 `data-accent`（正交 M6 data-theme）；variables.css 4×2 强调色规则（浅深双值保对比度）；blue 默认删 data-accent **零变化**；SettingsDialog 5 色块。首屏 97.01KB；unit 347 + e2e 202/4skip。增量 audit **无 MEDIUM / 无新 finding**。**第四批 scope（v3.5~v3.7）全交付**|
