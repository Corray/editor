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
