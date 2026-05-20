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
- **remediation**：
  - 写 closing comment 必须用 bash 动态：`ACTUAL=$(git rev-parse --short HEAD) && cat > tmp <<EOF ... commit: \`${ACTUAL}\` ... EOF`
  - **禁止**在 comment 草稿里预写形如 `commit: \`a1b2c3d\`` 的占位 — 占位忘改 = 错误落库
  - amend 回填 hash 也算一种处理（同一逻辑单元 + 未 push），但 standard 偏好新 commit
- **实例**：
  - #8 2026-05-19：预写 `7d4abd5`，实际 commit `3becbc9` → 自捕获 → 删错 comment 重发
  - #10 / #11：使用 `$(git rev-parse)` 模式，无错误
  - 5d7b82c / 25a5557：hash backfill 用 follow-up commit（不 amend）
- **跨项目升级路径**：升级为 standard issue-process skill 的 comment 模板示例 → FB-002 候选

### PP-003 — 测试基础设施陷阱集

- **首次出现**：累计 #6 / #9 / #10
- **模式描述**：在 jsdom + Vitest + Playwright + Solid 组合下，测试代码反复踩到平台 API 不完整 / 类型推断不稳 / 时序异步等陷阱。常见 4 类：
  1. **jsdom 平台 API 缺**：URL.createObjectURL / Blob.text() / textarea.spellcheck IDL / matchMedia 等 → 必须 stub 或绕路
  2. **Solid effect microtask + setTimeout fake timer 双时间轴**：单独 flush 才能让状态机推进
  3. **vi.fn() 类型推断窄于 ReturnType<typeof vi.fn>**：变量类型用 `Mock<any[], unknown>` 但 init 写法导致 narrow 推断 → 改 `.mockReturnValue()` 模式
  4. **Playwright mobile device emulation 在 Vite dev server 不稳定**：mobile-safari project page.goto 30s 超时 → 暂禁
- **危害**：testing 阶段反复中断节奏，但实际不影响业务正确性 — 是 infrastructure noise
- **remediation**：
  - 新模块单测开始前先 quick check：测试目标 API 是否依赖 jsdom 不实现的接口？
  - 平台 API stub 时用 `as unknown as typeof X` 双跳 cast 而非 `as any`
  - Solid 测试 setup helper 标准化：`setup() { createRoot(...); return { dispose }; }`
  - Playwright 跨浏览器：`test.skip(browserName !== 'chromium', '...')` 适用任何 chromium-specific 权限
- **实例**：
  - #6 spellcheck enumerated 不是 boolean → 用 `"false"` 字符串 + `getAttribute`
  - #9 Blob.text() 不可用 → 拦截 Blob constructor
  - #10 mobile-safari 30s 超时 → 注释 + TODO follow-up
  - #2 / #5 fake timers + flushMicrotasks
- **跨项目升级路径**：升级为 standard testing setup template（vitest + playwright + jsdom）的"已知陷阱"段 → FB 候选

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
