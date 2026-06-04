# editor — 项目质量模式（tendency）

按 standard `problem-handling-pattern.md` §「项目级质量模式记忆」格式。补在「跨项目规则级 FB」与「项目级 problem-registry 具体问题」之间——记**这个项目特别容易犯哪几类错**。

**启动日期：** 2026-05-20
**维护者：** PM (Corray) + 执行层（提原材料）

---

## 已知 tendency

### PP-001 — 一人多角色项目 raised → fe-reviewed 中间态合理跳过

- **首次出现**：IPR-001（multiphase audit 2026-05-20）
- **模式描述**：项目实际只有一名开发者同时扮演 PM / FE / QA 多个角色，且上游 spec 已 accepted；每个新 Issue 创建时直接打 `pm-reviewed` label，跳过 standard issue-process 状态机定义的 `raised → fe-reviewed → pm-reviewed` 中间态
- **危害**：严格按 audit 维度 1.2 检查会判违规（跳过中间态）；但实际场景合理（一个人不需要 self-review 走 ceremony）
- **remediation**：本项目所有 Issue body 必须含「状态机说明」段，显式声明跳过中间态的理由（"spec 上游 accepted + 一人多角色"）；audit 时本 PP 作为豁免依据
- **实例**：
  - #1-#11 全部 11 个 Issue body 都显式 justified
  - audit 报告 §4 IPR-001 列出确认合规
- **跨项目升级路径**：本 tendency 在所有"一人/小团队 + spec-first" 项目复现 → 升级为 FB-004 候选

### PP-002 — Issue closing comment commit hash 必须 `$(git rev-parse)` 动态注入

- **首次出现**：IPR-T-001（Issue #8 自纠 + multiphase audit 2026-05-20）
- **模式描述**：写 Issue closing comment 时，commit hash 是 commit 后才知道的（chicken-and-egg）；如果在 commit 前预写草稿放占位 hash 或猜的 hash，commit 完成后忘记替换 → comment 含错误 hash 永久落库
- **危害**：commit hash grep self-check（issue-process skill 内置）只验证格式不验证 hash 真实性 → 错误 hash 永久 drift；下游 audit / /release 反查"哪个 commit 实现了 #N" 时拿到无效 hash
- **remediation**（v2 / 2026-06-02 二次复发后升级 — 加机械闸，不再只靠纪律）：
  - **机械根治（首选）**：`pnpm check:hashes`（`scripts/check-doc-hashes.mjs`）扫所有
    `docs/**.md` + `CLAUDE.md` 里 `commit \`<hash>\`` 引用，逐个 `git rev-parse --verify`
    验证 commit 真实存在 → 占位 / 猜错 / amend 失效 / typo 全部 fail。已接入
    `deploy.yml`（CI，checkout `fetch-depth: 0`）+ 可本地跑
  - 写 closing comment 仍用 bash 动态：`ACTUAL=$(git rev-parse --short HEAD)` 注入
  - **禁止**预写占位 `commit: \`a1b2c3d\``；**禁止** amend 一个其 hash 已被文档引用的 commit
  - **顺序铁律**：work commit 先落地拿真实 hash → 文档在**独立后续 commit** 回填
    （绝不让文档引用"包含该文档改动的同一个 commit"的 hash — 会被 amend/rebase 改号）
- **实例**：
  - #8 2026-05-19：预写 `7d4abd5`，实际 commit `3becbc9` → 自捕获 → 删错 comment 重发（占位变体）
  - **2026-06-02 二次复发（amend 自引用变体）**：findings-registry 预写 `8b87f29`，
    `git commit --amend` 把本 commit 改号成 `6bc2977` → 引用失效 → follow-up `dc0320b` 修。
    此变体证明"动态注入"纪律防不住 amend → 触发机械闸根治
  - #10 / #11：使用 `$(git rev-parse)` 模式，无错误
  - 5d7b82c / 25a5557：hash backfill 用 follow-up commit（不 amend）
- **跨项目升级路径**：二次复发达 FB-002 形式化阈值 → FB-002 candidate → applied（本项目机械闸为
  本地 remediation；standard issue skill 的 comment 模板 + CI gate 增补走 FB-002 upstream）

### PP-003 — 测试基础设施陷阱集

- **首次出现**：累计 #6 / #9 / #10
- **模式描述**：在 jsdom + Vitest + Playwright + Solid 组合下，测试代码反复踩到平台 API 不完整 / 类型推断不稳 / 时序异步等陷阱。常见 4 类：
  1. **jsdom 平台 API 缺**：URL.createObjectURL / Blob.text() / textarea.spellcheck IDL / matchMedia 等 → 必须 stub 或绕路
  2. **Solid effect microtask + setTimeout fake timer 双时间轴**：单独 flush 才能让状态机推进
  3. **vi.fn() 类型推断窄于 ReturnType<typeof vi.fn>**：变量类型用 `Mock<any[], unknown>` 但 init 写法导致 narrow 推断 → 改 `.mockReturnValue()` 模式
  4. **Playwright full 并行 suite page.goto 30s 超时 / 延迟膨胀**：根因 = **并行 worker CPU 竞争**（8 核 default workers 饱和），非 dev-server / webkit-mobile-UA（2026-06-03 重定性，commit `b840aeb`；换 vite preview 未解决，限 `workers:CI?1:2` + `navigationTimeout:60s` 才稳）。CI 稳因 workers:1。先前归因 mobile-safari / dev-server / Playwright 版本均被 confounded
  5. **hash-routing 功能验证必须冷加载（同文档 hash 变更不触发 startup）**：app 在启动时读 `location.hash`（如 v1.2 分享 `#doc=`）的功能，只在**整页加载**时执行 startup。从已加载页 `goto('/editor/#doc=')` / 地址栏改 hash = **同文档导航**（仅 hashchange，无 reload）→ startup 不重跑 → 功能"看起来坏了"，**实为验证方式错**。**二次复发**（2026-06-04 同会话）：① e2e `page.goto(hashUrl)` 从 beforeEach 的 `/editor/` 过去 = 同文档 → 加 `page.reload()` 修；② 线上 MCP `browser_navigate(hashUrl)` 从 base 页过去 = 同文档 → 误判 prod bug，实需 `about:blank` → hashUrl 冷加载才对
- **危害**：testing/验证 阶段反复中断节奏 + **误报 prod bug**（#5 差点把正常功能判成线上故障）；实际不影响业务正确性 — 是 infrastructure / 验证认知 noise
- **remediation**：
  - 新模块单测开始前先 quick check：测试目标 API 是否依赖 jsdom 不实现的接口？
  - 平台 API stub 时用 `as unknown as typeof X` 双跳 cast 而非 `as any`
  - Solid 测试 setup helper 标准化：`setup() { createRoot(...); return { dispose }; }`
  - Playwright 跨浏览器：`test.skip(browserName !== 'chromium', '...')` 适用任何 chromium-specific 权限
  - **Playwright 本地并发**：`workers: CI?1:2` + `navigationTimeout:60s` —— page.goto 超时先怀疑 worker 竞争（CPU 饱和），别先归因 server/engine。（preview webServer 试过又回退 `19226c6` —— 非 flake fix，dev 无 per-run build 更快）
  - **hash-routing 验证铁律（冷加载）**：测/验任何"启动读 location.hash"的功能，必须保证**整页加载**带着 hash —— e2e 用 `goto(hashUrl)` 后补 `page.reload()`（或从空白页进）；线上眼验从 `about:blank` → hashUrl（新标签/冷导航），**绝不**从已开页改 hash。看到"hash 功能不生效"先排除同文档导航，再怀疑功能本身
- **实例**：
  - #6 spellcheck enumerated 不是 boolean → 用 `"false"` 字符串 + `getAttribute`
  - #9 Blob.text() 不可用 → 拦截 Blob constructor
  - #10 mobile-safari 30s 超时 → 注释（后 2026-06-03 重定性为 worker 竞争，commit `b840aeb`）
  - 2026-06-03 release 补跑：full 并行 suite flaky（page.goto 30s + 延迟 225ms）→ 限 workers 后 3× 连跑确定性 31/1（preview webServer 试过非 fix 已回退 `19226c6`）
  - #2 / #5 fake timers + flushMicrotasks
  - 2026-06-04 v1.2 分享：e2e 打开 `#doc=` 链接漏 reload → editor 空（同文档导航）→ 加 `page.reload()`；线上眼验同坑差点误判 prod bug → `about:blank` 冷加载才对（hash-routing #5）
- **跨项目升级路径**：升级为 standard testing setup template（vitest + playwright + jsdom）的"已知陷阱"段 → FB 候选（trap #4 worker 竞争 + #5 hash-routing 冷加载 跨项目通用，优先上报）

---

### PP-004 — problem-registry + handoff 通道由等价载体承担（一人多角色家族延伸）

- **首次出现**：2026-05-22（fb-scan 自查 / FB-004 scope 扩展）
- **家族 first instance**：PP-001（issue-process 状态机豁免）—— 同根因（PM=EL=QA 同体）的不同通道延伸
- **模式描述**：standard `problem-handling-pattern.md` 期望 `docs/problems/problem-registry.md` 作为问题全景账本（六环节"记录"环节的固定载体）；`artifact-based-handoff.md` 期望 `docs/handoff/` 作为 PM → EL 推送动作的载体（HIGH 强制 handoff）。一人多角色项目中两个载体退化为"自己写给自己看"，实际由：
  - `findings-registry.md`（audit 产出 → 22 条 / v0.1.0 周期）
  - `fb-index.md`（规则级反馈 → 5 条 FB candidate）
  - `project-patterns.md`（项目 tendency → 本文件）
  - GitHub Issue（PM → EL 推送 → 13 closed + 3 backlog open）
  四个等价载体承担。`problem-registry.md` 留 schema 骨架不强制实条目；`docs/handoff/` 三目录留协议 README 不强制实文件
- **危害**：严格按 standard 形式判定 problem-registry 0 条 = "记录优先于处理"违反；handoff 三目录空 = "HIGH 必须独立 handoff"违反。但等价载体实际承担职责，强行补两份空账本是 ceremony 大于价值（formalization-timing.md §"过早形式化"反面警告）
- **remediation**：
  - CLAUDE.md §项目特定 rules PR-001 段显式声明三通道豁免 + 等价载体清单 + audit 引用方式
  - audit 检查通道时先验证"通道空 + 等价载体实际有内容"双条件，满足则改判 `dismissed` + reason 引 PR-001
  - 团队加入第二人时立刻删除 PR-001 段 + 真启用 problem-registry + handoff 两通道（违反前提即失效）
- **实例**：
  - SP-B: `wc -l docs/problems/problem-registry.md` = 46 行（全为 schema 文档 + 模板占位），但同期 findings-registry 22 条 + fb-index 5 条 + project-patterns 4 条 = 等价载体 31 实条目
  - SP-C: BHV-001 HIGH（E2E 全集未跑）resolution path = audit → Issue #10 → commit `f03e170`，无 handoff 文件；audit 报告本身已含完整 finding → fix path 链路
- **跨项目升级路径**：本 PP + PP-001 共享 FB-004 出口（已扩 scope 含三 sub-pattern）；第 2 个单人项目复现任一 sub-pattern → FB-004 升 `observing` → standard 三 rule 文件考虑增补豁免段

---

## 维护节奏

- 每完成一个大型阶段（multiphase audit / release）时 PM 检查是否有新模式抽象
- 单个 finding 复发 ≥ 2 次 → 抽 PP；PP 在多个项目复现 → 升 FB

---

## 与 problem-registry 的区别

| 文件 | 内容 |
|------|------|
| `project-patterns.md`（本文件）| **模式 / tendency**：抽象的、可远观的项目质量倾向 |
| `problem-registry.md` | **具体问题实例**：单次发现 + 状态 + 处置 |
| `findings-registry.md` | **审查发现**：audit phase 产出的结构化条目 |
| `fb-index.md` | **跨项目反馈**：可上升到 standard 的规则级反馈 |
