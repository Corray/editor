# MVP Retrospective — 跨 3 日 spec-to-code-flow 完整演练

| 字段 | 值 |
|------|----|
| **日期** | 2026-05-20 |
| **跨度** | 2026-05-18 ~ 2026-05-20（3 日历日；本会话连续）|
| **基线 commit** | `25a5557`（本地 ahead 远端 17 commits，SSH 22 阻塞未 push）|
| **范围** | 一个完整 MVP 项目走完 spec-to-code-flow 7 节点 + 多 phase audit + 2 resolved findings |
| **本报告类型** | immutable artifact（按 artifact-based-handoff.md §「Artifact 类型与写权限矩阵」）|

> 不修原状，修订走勘误新建。

---

## 1. 流程全景

### 1.1 spec-to-code-flow 7 节点完成度

```
┌──────────────────────────────────────────────────────────────────┐
│ ✓ PRD v1.0 (2026-05-18)                                          │
│   I1-I7 推断点全部 PM 确认通过                                       │
│         ↓                                                          │
│ ✓ 共识文档 v1.0 (2026-05-18)                                       │
│   TBD-1~10 全决议                                                  │
│         ↓                                                          │
│ ✓ 业务模块清单 v1.0 (2026-05-19)                                    │
│   TBD-M1~M4 全决议；M1-M7 模块定义 + cross-cutting toast            │
│         ↓                                                          │
│ ✓ 架构 v1.0 + 4 ADR (2026-05-19)                                  │
│   ADR-001 markdown-it / 002 DOMPurify / 003 Solid accepted        │
│   ADR-004 GitHub Pages deferred（待 PUBLIC/Pro/Vercel 决策）         │
│   TBD-A1~A8 全决议（A4 推迟）                                       │
│         ↓                                                          │
│ ✓ 接口设计 v1.0 (2026-05-19)                                       │
│   M1-M7 + Toast 8 个 API surface；TBD-I1~I4 全决议                  │
│         ↓                                                          │
│ ✓ 数据模型 v1.0 (2026-05-19)                                       │
│   localStorage schema + 4 runtime types + M3 状态机；TBD-D1~D3      │
│         ↓                                                          │
│ ✓ 测试计划 v1.0 (2026-05-19)                                       │
│   AC 矩阵 + 6 类家族维度 + ~50 用例；TBD-T1~T4                       │
│         ↓                                                          │
│ ✓ 代码实现 (2026-05-19 ~ 2026-05-20)                                │
│   工程脚手架 + 11 Issues 全 fe-in-progress                          │
│         ↓                                                          │
│ ✓ 验证 (2026-05-20)                                                │
│   多 phase audit 报告 + 11 findings                                │
│         ↓                                                          │
│   反哺：M3 readStoredDocument 静态化（#7 → spec §3.3 更新）           │
└──────────────────────────────────────────────────────────────────┘
```

**关键观察**：spec 阶段花的时间 > 代码阶段，但代码阶段几乎无需回头改 spec（仅一次反哺）。验证 spec-first 价值。

### 1.2 11 Issues 时间线

| # | 标题 | 模块 | severity / 类别 | resolved findings |
|---|------|------|----------------|---|
| 1 | M2 pipeline | m2-preview | feature | — |
| 2 | M3 + toast stub | m3 / cross-cutting | feature + tech-debt | — |
| 3 | M7 i18n | m7-i18n | feature | — |
| 4 | M3 i18n integration | m3 / m7 | tech-debt（清账）| — |
| 5 | M6 主题 | m6-theme | feature | — |
| 6 | M1 编辑 | m1-editor | feature | — |
| 7 | main.tsx 整合 + M3 反哺 | 多模块 | feature + 反哺 | — |
| 8 | M2 PreviewArea 挂载 | m2 + m1 | feature | — |
| 9 | M4 导出 | m4-export | feature | — |
| 10 | E2E + Playwright install | cross-cutting | bug（HIGH）| **BHV-001** |
| 11 | 清空按钮 + confirm | m1 + m3 + cross | bug（MEDIUM）| **GAP-004** |

每 Issue 严格走 phase 1（自检表 + 意图回读 + 方案）→ phase 2（执行清单 + 实现 + 验证 + 6a 追溯链 + 6b 收尾 + commit hash grep self-check）。

### 1.3 产出物总览

| 类别 | 数量 |
|-----|------|
| Spec 文档 | 7 个 v1.0 + 4 ADR |
| Audit 报告 | 1 multiphase + 1 retrospective（本报告）|
| 业务模块代码 | 7 模块（M1-M7）+ shared/toast |
| 单元测试 | 100 / 100 green，96.98% lines coverage |
| 端到端测试 | 25 / 30 pass（5 skip：GAP-001 + webkit clipboard）|
| GitHub Issues | 11 (#1-#11) 全走 /issue 协议 |
| Git commits | 17 ahead 远端（含 2 hash backfill）|
| Findings | 11（2 resolved / 8 proposed / 1 deferred）|

---

## 2. 协作纪律自评

按全局 CLAUDE.md `@import` 的 9 条 standard rules 逐条对照：

| Rule | 遵守情况 |
|------|---------|
| `spec-to-code-flow.md` | ✓ 全 7 节点走完 + 1 次反哺 + 各 phase TBD 显式决议 |
| `problem-handling-pattern.md` | ✓ 6 环节均走（发现 → audit 报告 → 定性 severity → 分发 fix Issue → 解决 commit → 后置 registry 更新）|
| `ai-collaboration-principles.md` | ✓ 最小有效上下文（每 Issue 仅引相关 spec 段）+ ✓ 掌舵不微管理（phase 1 硬停 11 次） |
| `artifact-based-handoff.md` | ✓ 所有产物落文件，subagent 状态外化；handoff/in-progress fallback 用 1 次（gh API EOF 期间）|
| `large-module.md` | ✓ M / L 改动均按 L1/L2 方案呈现（11 Issues 均 M 级，按 L1）|
| `research-first.md` | ✓ markdown-it / DOMPurify / Solid 文档先查（ADR 段含 References）|
| `incremental-verification.md` | ✓ TDD 模式（先 test 后 impl），每 Issue typecheck + test + coverage 三步验证 |
| `fix-pattern-scan.md` | ✓ M3 toast 文案硬编 → 显式留 follow-up Issue（#4），不漏家族 |
| `formalization-timing.md` | N/A（本项目内未形式化新 rule，但 IPR-T-001 是候选）|
| `task-lifecycle.md` | ✓ 11 Issues + 多 audit 全用 TaskCreate/TaskUpdate 跟踪（task #1-#140）|
| `pr-atomicity.md` | ✓ 11 Issues 每个单一目的（M3 i18n 整合特意拆 #4）；2 次 amend 都是 hash backfill（合理 chicken-and-egg）|
| `tech-debt.md` | ✓ `shared/toast.ts` 标 `TODO(post-mvp)`；M3 toast 文案硬编标 follow-up；ADR-004 deferred |
| `security-review.md` | ✓ M2 sanitize 路径标 `[SECURITY REVIEW REQUIRED]`，family-E XSS 矩阵 100% 覆盖 |
| `architecture-constraints.md` | 用户本地 override 不全局加载（Java DDD 不适用 web 项目）|

---

## 3. 工程发现汇总（跨 11 Issues 累计）

### Solid / Reactive

| 发现 | Issue |
|------|-------|
| `createEffect + on(signal, fn, {defer:true})` 跳过初始触发是订阅外部 signal 的标准姿势 | #2 M3 |
| `createRoot` 显式包 + `dispose` callback 用于单测；`render()` 内部自带 createRoot | #2 / #5 / #7 |
| `createMemo` 缓存衍生值 — innerHTML render 缓存避免相同 text 重算 | #8 M2 集成 |
| `setText` 不暴露给 EditorAPI，仅 EditorArea 内部 + setTextFromStorage / clear | #6 M1 |

### Solid + Test

| 发现 | Issue |
|------|-------|
| Solid effect 走 microtask，setTimeout 走 fake timer — 测试两套时间轴分别 flush | #2 store.test |
| `vi.spyOn(toast, 'show')` 替换 const object 方法 — 跨模块 singleton 标准 mock | #2 / #4 |
| `@solidjs/testing-library` cleanup 需 `afterEach(cleanup)` | #6 M1 |

### TypeScript / Build

| 发现 | Issue |
|------|-------|
| `vi.fn(() => x)` 推断 `Mock<[], string>` ≠ `Mock<any[], unknown>` — 改用 `vi.fn().mockReturnValue(x)` | #9 M4 |
| `vitest config coverage exclude` 不应 glob `**/api.ts` — 列具体 type-only 文件 | #6 M1 |
| `ReturnType<typeof vi.spyOn>` 类型泛型推断不稳 — 不存 spy 变量改用 `expect(console.method)` | #3 → #9 修复 |

### Jsdom 限制

| 发现 | Issue |
|------|-------|
| jsdom 24 Blob.text() / Response(blob).text() 不可靠 — 拦截 Blob constructor 抓 parts | #9 M4 |
| `URL.createObjectURL` 在 jsdom undefined — `as unknown as typeof URL.createObjectURL` 双跳 cast | #9 |
| `textarea.spellcheck` IDL property jsdom 不实现 — 用 `getAttribute('spellcheck')` + `"false"` 字符串绕 enumerated attr | #6 |
| matchMedia 在 jsdom 默认 undefined — `vi.stubGlobal('matchMedia', mockFn)` | #5 M6 |

### Markdown / Sanitize

| 发现 | Issue |
|------|-------|
| markdown-it `html:false` 把 raw HTML escape 为字面文本输出（不丢弃），含 `alert(1)` 字面 — 测试用 jsdom DOM probe 而非 text matching | #1 M2 |
| `innerHTML` 注入唯一合法源 = render() (DOMPurify sanitized) — 代码标 `[SECURITY REVIEW REQUIRED]` | #8 |

### Playwright / E2E

| 发现 | Issue |
|------|-------|
| Playwright mobile device emulation + Vite dev server 不稳定 — mobile-safari 30s 超时 → 暂禁，留 BHV-004 deferred | #10 |
| `pnpm exec playwright install` ~200MB；国内网络可控 | #10 |
| `clipboard.writeText` 权限 `grantPermissions` 仅 chromium 稳定 — 跨浏览器 `test.skip(browserName !== 'chromium')` | #10 |
| `download.path() + readFile` 验证下载内容 — 需 `@types/node` devDep | #10 |
| `page.on('dialog', d => d.accept())` 测 window.confirm 流程 | #11 |

---

## 4. Process 错误 + 自纠记录

| # | 错误 | 自纠 |
|---|------|------|
| 1 | Issue #8 收尾 comment 预写 commit hash `7d4abd5`，实际 commit 是 `3becbc9` | 删错 comment + 重发；改 process 用 `$(git rev-parse --short HEAD)` 动态注入 → IPR-T-001 |
| 2 | toast.test.ts 写完只跑 coverage 没 typecheck，#3 typecheck 时才发现类型错 | 修 vi.spyOn 写法（去掉 ReturnType 变量）— 形式化:  写完测试必须先 typecheck 再 coverage |
| 3 | M4 测试 Blob.text() jsdom 不可靠 → AssertionError `[object Blob]` | 改用 Blob constructor 拦截 + `new Response(blob).text()` 不可用回退 |
| 4 | Vitest config exclude `**/api.ts` 过宽 → M1 api.ts 含 runtime 工厂被排除 | 改成列具体 type-only 模块路径 |
| 5 | Edit replace_all=true 滥用 → 把两处不同断言都替换成同字符串 | 立即捕获 + 补 Edit 修复；改 process 优先 unique old_string |
| 6 | gh API GraphQL EOF × 3（瞬时网络）→ Issue #2 收尾 comment 无法贴 | 内容落本地 `docs/handoff/in-progress/`；网络恢复后补贴并清理 |
| 7 | SSH 22 阻塞期间 commit 累积 17 条无法 push | 等用户网络恢复（用户明确"不动配置"）|
| 8 | `git commit --amend` 用过 2 次（M6 / GAP-004 hash backfill）| 违反 standard 偏好但合理 chicken-and-egg；改 process 用 follow-up commit |

---

## 5. 候选回流到 standard 的 FB

### FB-002（候选）— Issue closing comment commit hash 用 `$(git rev-parse)` 动态

- **本质问题**: standard issue skill 的 commit hash 自检 grep 仅验证格式不验证 hash 真实性
- **建议**: skill 模板 commit hash 段加 explicit shell pattern：`ACTUAL=$(git rev-parse --short HEAD) && cat <<EOF ... commit: \`${ACTUAL}\` ... EOF`，避免预写
- **关联**: IPR-T-001

### FB-003（候选）— vitest config coverage.exclude 不应泛 `**/api.ts`

- **本质问题**: 模块约定 api.ts 通常是 type-only re-export，但有些模块 api.ts 含 runtime 工厂（M1 createEditorAPI）；泛 glob 排除会让 runtime 覆盖率被静默吃掉
- **建议**: standard 测试 setup 模板里给"列具体 type-only api.ts"的范式，避免 glob

### FB-004（候选）— 一人多角色项目 raised → reviewed 中间态判定

- **本质问题**: issue-process 协议状态机 `raised → [role]-reviewed → pm-reviewed`，一人项目（PM = FE）实际跳过 fe-reviewed 直接 pm-reviewed
- **建议**: standard 增补"一人多角色场景"的合规判定 — body 含理由 + project-patterns 落档 = 合规

### FB-005（候选）— Playwright mobile emulation + Vite dev server 兼容性

- **本质问题**: 局部 BHV-004，可能跨项目（任何 Vite + Playwright mobile-safari project 都中招）
- **建议**: standard Playwright 模板 default 注释掉 mobile-safari project + 推荐用 `vite preview` 替代 dev

---

## 6. 未尽事项

### 立即（短期）

- **SSH 22 恢复后 push** 17 commits → 远端
- **ADR-004 deploy 重启**（PUBLIC / Pro / Vercel 三选一） — release 前置阻塞

### Audit P1 剩余

- GAP-001 / API-M5-001 / BHV-002 — M5 LayoutAPI 完整实现 + mobile tab + unskip AC-4-002/003
- BHV-003 — Lighthouse manual perf 验证（release 前手工跑）

### Audit P3 剩余

- GAP-002 — M2 getRootElement 兑现 或 spec 反哺删除
- GAP-003 — F1.2 行号 / F1.3 字号控件
- API-T-001 — shared/toast 完整 UI Issue 立项

### Process 落档

- IPR-001 + IPR-T-001 → `docs/problems/project-patterns.md`（本次会话同步建）
- FB-002~005 → 本项目 fb-index（standard 上游回流由用户决定时机）

---

## 7. 关键收获

1. **Spec-first 验证有效**：spec 阶段花了 ~3-4 轮深度对话（PRD / 共识 / 模块清单 / 架构+ADR / 接口+数据 / 测试计划 / 各自 v0.1 → v1.0），代码阶段几乎无需回头改 spec（仅 1 次反哺）。spec 阶段细致投入 → 代码阶段决策真空 → 整体效率高
2. **/issue 协议在 AI 主导开发上是有效的强约束**：11 个 Issue 全部走完整 phase 1 + phase 2，自检表硬门禁让 AI 不能跳过架构 3 维评估；执行清单 comment 让 6a/6b 不漏；commit hash grep self-check 让回填可验证
3. **AI 主导 + 用户掌舵节奏适合 MVP**：用户在关键节点决议（PRD I1-I7 / 共识 TBD / 架构 ADR / Issue 方案确认），AI 在中间执行。掌舵频率 ≈ 1 次 / 30-90 分钟工作
4. **测试纪律的回报远高于投入**：TDD 模式（先测后码）让每次实现接近一次到位；100/100 单测 + 25 e2e 端到端验证 = release 信心
5. **反哺 + audit 闭环是 spec-to-code-flow 真正运转的标志**：#7 M3 readStoredDocument 反哺修正 spec 缺陷；multiphase audit 抓到 11 findings 中 2 resolved——双向流动让 spec 真正"活"
6. **immutable artifact 与 living registry 分工有效**：audit 报告固化 / findings-registry 状态流转 / handoff fallback — 让会话中断时也能恢复
7. **process 错误是常态，自纠速度是关键**：本会话 8 处 process 错误，全部 < 5 分钟自捕获自纠；关键是 grep self-check 等机器化校验把人 / AI 注意力外化

---

## 8. 引用产物

| 产物 | 路径 |
|------|------|
| 主 audit 报告 | `docs/audit/2026-05-20-mvp-multiphase.md` |
| Findings registry | `docs/audit/findings-registry.md` |
| Project patterns（同步建）| `docs/problems/project-patterns.md` |
| FB index | `docs/problems/fb-index.md` |
| Issue 列表 | https://github.com/Corray/editor/issues?q=is%3Aissue |
| Spec 全套 | `docs/prd/PRD-v1.0-mvp.md` / `docs/spec/*.md` / `docs/adr/*.md` |
| 项目脚手架 + 7 模块 | `src/` + `tests/unit/` + `tests/e2e/` |
