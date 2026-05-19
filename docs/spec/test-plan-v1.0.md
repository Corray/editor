# 测试计划 v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (TBD-T1~T4 全部采纳 AI 倾向) |
| **版本** | v1.0 |
| **最近评审** | 2026-05-19 (v0.1 → v1.0) |
| **基线** | PRD v1.0 + 共识 v1.0 + 模块 v1.0 + 架构 v1.0 + API v1.0 + 数据模型 v1.0 |
| **首版日期** | 2026-05-19 |
| **owner** | FE (Corray) |
| **执行工具** | Vitest 单测 + 组件测 / Playwright E2E |
| **下游** | → 代码（实现 + 测试同步推进）|

---

## 0. 定位

按 spec-to-code-flow §5——测试计划**从约束推导**（"这条约束牵涉哪些组合必须测"），不从代码反推（"测我刚改的这段"）。本计划在编码前完成 / 用例直接可执行 / 家族维度在此处枚举完，不留到 bug 复现时再补。

**质量原则：** 由验收条件 + 硬约束决定测什么，不由开发者注意力决定。

---

## 1. 版本史

| 版本 | 日期 | 摘要 |
|------|------|------|
| v0.1 | 2026-05-19 | AI 起草，含 AC 矩阵 6 条 + 家族维度 6 类 + 用例 ~50 条 + TBD-T1~T4 |
| v1.0 | 2026-05-19 | Corray 全盘接受 TBD-T1~T4；进入代码实现阶段 |

---

## 2. 测试策略总览

### 2.1 测试金字塔

```
                       /\
                      /E2E\                ← Playwright，AC-1~6 全覆盖
                     /─────\
                    /  组件测  \             ← Vitest + @solidjs/testing-library
                   /───────────\
                  /    单测     \             ← Vitest，纯函数 / 状态机 / 工具
                 /─────────────\
```

### 2.2 各层职责

| 层 | 工具 | 覆盖什么 | 跑得多快 |
|----|------|---------|---------|
| 单测 | Vitest | 纯函数 (render pipeline / debounce / 文件名生成 / t() / sanitize 输出) | < 5s |
| 组件测 | Vitest + testing-library | M1-M7 各组件 API 调用与渲染（不挂载浏览器）| < 30s |
| E2E | Playwright (Chromium + Webkit + Firefox) | AC-1~6 全集 + 跨浏览器 + 移动模拟 | < 3min |

### 2.3 不做（MVP 明确）

- 性能基准自动化（Lighthouse CI 留 v1.1+）
- 视觉回归（Percy / Chromatic 留 v1.1+）
- 模糊测试（fuzz Markdown 输入）
- 跨真实设备测试（仅 Playwright 模拟）

---

## 3. 验收条件矩阵（PRD AC-1~6）

| AC | 描述 | 涉及模块 | 测试类型 | 用例编号 |
|----|------|---------|---------|---------|
| AC-1 | 编辑+预览闭环（输入 → 50ms 内预览更新 / 复杂 Markdown 全渲染）| M1 + M2 | 组件 + E2E | UT-PV-* / E2E-AC1-* |
| AC-2 | 持久化往返（关闭重开内容仍在 / 清空生效）| M1 + M3 | 单测 + E2E | UT-PR-* / E2E-AC2-* |
| AC-3 | 导出 .md + 复制 HTML | M1 + M2 + M4 | 单测 + E2E | UT-EX-* / E2E-AC3-* |
| AC-4 | 移动端可用（tab 切 / 320px 无横滚 / 30fps）| M1 + M2 + M5 | E2E | E2E-AC4-* |
| AC-5 | 性能（Lighthouse ≥ 90 / 1000 行输入 < 50ms）| M1 + M2 | 手动 + E2E perf | MANUAL-PERF-* |
| AC-6 | 主题切换（切深色全部跟随 / 刷新保持）| M5 + M6 | 组件 + E2E | UT-TH-* / E2E-AC6-* |

> **追溯链强约束：** 每条 AC 至少 1 个 E2E 测试覆盖；E2E 通过 = AC 通过 = 可发版。

---

## 4. 家族维度枚举（关键）

> 按 fix-pattern-scan §扩展规则，每个家族维度组合必须在计划阶段枚举，不等 bug 复现反推。

### 4.1 family-A: viewport × 操作

| viewport | edit | preview | save | export | theme-toggle |
|----------|------|---------|------|--------|-------------|
| desktop ≥ 768px | F-A1 双栏并存 | F-A2 双栏并存 | F-A3 | F-A4 | F-A5 |
| mobile < 768px | F-A6 tab=edit | F-A7 tab=preview | F-A8 任意 tab | F-A9 任意 tab | F-A10 任意 tab |
| **断点附近** (760/770px) | F-A11 切换 | F-A12 切换 | — | — | — |

### 4.2 family-B: theme × 初始化来源

| 初始来源 | light | dark |
|---------|-------|------|
| localStorage 命中 | F-B1 | F-B2 |
| 系统 prefers-color-scheme | F-B3 | F-B4 |
| fallback 默认 | F-B5 (默认浅色) | — |

### 4.3 family-C: M3 状态 × 触发事件

| from \ event | M1 input | timer fires | setItem ok | setItem QuotaExc | M3.clear | 5s idle |
|--------------|----------|-------------|------------|-----------------|----------|---------|
| IDLE | F-C1 → DIRTY | — | — | — | F-C2 → IDLE | — |
| DIRTY | F-C3 → DIRTY (reset timer) | F-C4 → SAVING | — | — | F-C5 → IDLE | — |
| SAVING | F-C6 enqueue | — | F-C7 → IDLE | F-C8 → ERROR | F-C9 → IDLE | — |
| ERROR | F-C10 → DIRTY | — | — | — | F-C11 → IDLE | F-C12 → IDLE |

### 4.4 family-D: 内容长度 × 操作

| 长度 | edit | preview render | save | export .md | copy html | 1MB toast |
|------|------|---------------|------|-----------|-----------|-----------|
| 空 (0) | F-D1 | F-D2 (placeholder) | F-D3 (no-op?) | F-D4 (空 .md) | F-D5 (empty html) | — |
| 单行 | F-D6 | F-D7 | F-D8 | F-D9 | F-D10 | — |
| 1000 行 | F-D11 | F-D12 (< 50ms) | F-D13 | F-D14 | F-D15 | — |
| 1MB+ | F-D16 | F-D17 (degrade?) | F-D18 | F-D19 | F-D20 | **F-D21 一次性** |
| 5MB+ | F-D22 | F-D23 | F-D24 QuotaExc | F-D25 | F-D26 | F-D27 不重弹 |

### 4.5 family-E: Markdown 特性 × sanitize

每个特性都要 sanitize 后输出验证（DOMPurify 不破坏合法 / 拦截非法）：

| 特性 | 合法用例 | XSS 用例 |
|------|---------|---------|
| heading | F-E1 `# H1` | — |
| list | F-E2 `- a` | — |
| table | F-E3 pipe table | — |
| code block | F-E4 ` ```js ` | F-E5 `<script>` in code-block（应保留为字面）|
| link | F-E6 `[a](https://...)` | F-E7 `javascript:alert(1)` |
| image | F-E8 `![](url)` | F-E9 `<img onerror=alert(1)>` |
| inline HTML | — | F-E10 `<script>alert(1)</script>` |
| inline HTML attr | — | F-E11 `<a onclick=alert(1)>x</a>` |
| svg | — | F-E12 `<svg><script>alert(1)</script></svg>` |

### 4.6 family-F: clipboard × env

| Clipboard API | 用户允许 | 用户拒绝 |
|--------------|---------|---------|
| 可用 (HTTPS) | F-F1 复制成功 | F-F2 prompt 拒绝 → toast warn |
| 不可用 (HTTP / 旧浏览器) | F-F3 toast 引导手动复制 | — |

---

## 5. 单测用例清单（Vitest）

### 5.1 M2 渲染管线 (`modules/m2-preview/pipeline.test.ts`)

| ID | 场景 | 输入 | 预期 |
|----|------|------|------|
| UT-PV-001 | 基础 CommonMark | `# Hello` | `<h1>Hello</h1>` |
| UT-PV-002 | 列表 | `- a\n- b` | `<ul><li>a</li><li>b</li></ul>` |
| UT-PV-003 | 代码块 | ` ```js\n1\n``` ` | `<pre><code class="language-js">1\n</code></pre>` |
| UT-PV-004 | 链接 | `[a](https://x)` | `<a href="https://x">a</a>` |
| UT-PV-005 | javascript: 协议拦截 | `[a](javascript:alert(1))` | `<a>a</a>`（href 被 sanitize 移除） |
| UT-PV-006 | script tag | `<script>x</script>` | `` 空 / 无 script 输出 |
| UT-PV-007 | img onerror | `<img src=x onerror=alert(1)>` | `<img src="x">`（onerror 移除）|
| UT-PV-008 | 空输入 | `""` | `""` |
| UT-PV-009 | 大文档 | 1MB markdown | render 完成（无超时），可断言不抛 |

### 5.2 M3 状态机 (`modules/m3-persistence/store.test.ts`)

针对 family-C 全集枚举（F-C1 ~ F-C12 各 1 个用例）+ 不变量：

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| UT-PR-001 | F-C1 IDLE + input → DIRTY | init IDLE / 触发 M1.text() change | status === 'DIRTY' / timer 存在 |
| UT-PR-002 | F-C3 DIRTY + input → DIRTY (timer reset) | 已 DIRTY / 再次 input | timer 重置（用 fake timer 校验）|
| UT-PR-003 | F-C4 DIRTY + 500ms → SAVING → IDLE | 触发 / 推进 500ms | setItem 被调用 / status === 'IDLE' |
| UT-PR-004 | F-C8 SAVING + QuotaExc → ERROR + toast | mock setItem 抛 QuotaExceededError | status === 'ERROR' / toast.show 被调用 |
| UT-PR-005 | F-C12 ERROR + 5s idle → IDLE | 进入 ERROR / 推进 5s | status === 'IDLE' |
| UT-PR-006 | F-C5 DIRTY + clear → IDLE + removeItem | DIRTY 中 / call clear() | localStorage.removeItem 被调用 / status === 'IDLE' |
| UT-PR-007 | 不变量：localStorage 写入仅发生在 DIRTY→SAVING | 跑 100 次随机事件序列 | setItem 调用次数 === DIRTY→SAVING 转换次数 |
| UT-PR-008 | init 回填 | localStorage 预置 "hello" / call init() | 返回 "hello" |
| UT-PR-009 | init 缺失 fallback | localStorage 空 / call init() | 返回 "" |
| UT-PR-010 | F-D21 1MB toast 一次性 | 输入 >1MB / notice key 未设 | toast 被调用 1 次 + notice key 设为 "1" |
| UT-PR-011 | F-D21 重复输入不重弹 | notice 已设为 "1" / 再次输入 >1MB | toast 未被调用 |

### 5.3 M4 导出 (`modules/m4-export/*.test.ts`)

| ID | 场景 | 预期 |
|----|------|------|
| UT-EX-001 | 文件名格式（本地时区） | match `editor-\d{8}-\d{6}\.md` |
| UT-EX-002 | .md 内容等于源文 | Blob 内容 === 源文 |
| UT-EX-003 | URL.revokeObjectURL 被调用 | spy 校验 |
| UT-EX-004 | F-F1 copyHtml 成功 | clipboard.writeText 调用 + 返回 true |
| UT-EX-005 | F-F3 copyHtml 不可用 | mock clipboard undefined / 返回 false / toast.warn |
| UT-EX-006 | innerHTML 不含 outer wrapper | html 字符串 startsWith 不是 `<html` |

### 5.4 M6 主题 (`modules/m6-theme/theme.test.ts`)

| ID | 场景 | 预期 |
|----|------|------|
| UT-TH-001 | F-B1 localStorage light | init 返回 'light' |
| UT-TH-002 | F-B2 localStorage dark | init 返回 'dark' |
| UT-TH-003 | F-B3 系统 light fallback | localStorage 空 / matchMedia 不 match dark | 返回 'light' |
| UT-TH-004 | F-B4 系统 dark | localStorage 空 / matchMedia match dark | 返回 'dark' |
| UT-TH-005 | toggle 双向 | 'light' → 'dark' → 'light' |
| UT-TH-006 | setTheme 持久化 | localStorage.setItem 被调用 |

### 5.5 M7 i18n (`modules/m7-i18n/i18n.test.ts`)

| ID | 场景 | 预期 |
|----|------|------|
| UT-I18N-001 | 命中 key | `t('clear.confirm')` !== `'clear.confirm'` |
| UT-I18N-002 | 未命中 key fallback | `t('unknown')` === `'unknown'` |
| UT-I18N-003 | 所有 chrome key 都有翻译 | dict 全集覆盖 chrome 引用 |

---

## 6. 组件测用例清单（Vitest + testing-library）

### 6.1 EditorArea (M1)

| ID | 场景 | 预期 |
|----|------|------|
| CT-M1-001 | textarea 渲染 | DOM 有 textarea |
| CT-M1-002 | input 事件触发 text signal 更新 | mock onChange 被调用 |
| CT-M1-003 | setTextFromStorage 还原 | textarea.value 等于传入值 |
| CT-M1-004 | clear() 清空 | textarea.value === '' |

### 6.2 PreviewArea (M2)

| ID | 场景 | 预期 |
|----|------|------|
| CT-M2-001 | 订阅 M1 → 输出 HTML | M1 setText / preview innerHTML 含对应渲染 |
| CT-M2-002 | 空输入显示 placeholder | preview 显示 `t('preview.placeholder')` |
| CT-M2-003 | XSS 被拦截 | 输入 `<script>alert(1)</script>` / DOM 不含 script |

### 6.3 AppShell (M5)

| ID | 场景 | 预期 |
|----|------|------|
| CT-M5-001 | F-A1 desktop 双栏 | DOM 同时有 edit + preview 容器 |
| CT-M5-002 | F-A6 mobile tab=edit | 仅 edit 容器可见 |
| CT-M5-003 | F-A11 断点切换 | resize → viewport state 切换 |
| CT-M5-004 | F-A7 mobile tab 切 preview | setMobileTab('preview') / preview 可见 |

---

## 7. E2E 用例清单（Playwright）

### 7.1 AC-1 编辑+预览闭环 (`e2e/ac1-edit-preview.spec.ts`)

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-AC1-001 | H1 渲染 | 输入 `# Hello` | 500ms 内右侧出现 H1 |
| E2E-AC1-002 | 复杂 Markdown | 粘贴 包含 table/code/link 的样本 | 全部正确渲染 |
| E2E-AC1-003 | XSS 拦截 | 输入 `<script>` payload | 预览区不执行 script |

### 7.2 AC-2 持久化 (`e2e/ac2-persistence.spec.ts`)

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-AC2-001 | 关闭重开内容仍在 | 输入 / 关闭页 / 重开 | textarea.value === 输入 |
| E2E-AC2-002 | 清空生效 | 输入 / 点清空 / 确认 / 刷新 | textarea.value === '' |

### 7.3 AC-3 导出 (`e2e/ac3-export.spec.ts`)

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-AC3-001 | 下载 .md | 输入 / 点下载 | 触发文件下载 / 文件名 match 正则 / 内容等于源文 |
| E2E-AC3-002 | 复制 HTML | 输入 / 点复制 | clipboard 含 HTML |

### 7.4 AC-4 移动端 (`e2e/ac4-mobile.spec.ts`)

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-AC4-001 | 320px 无横滚 | viewport=iPhone SE / 输入大量内容 | document.scrollWidth === innerWidth |
| E2E-AC4-002 | tab 切换 | viewport=iPhone 14 / 点 preview tab | preview 可见 / edit 隐藏 |
| E2E-AC4-003 | 完整流程 | iPhone 14 Safari 模拟 / 输入 / 切预览 / 切回 / 下载 | 全部成功 |

### 7.5 AC-5 性能（半自动）

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| MANUAL-PERF-001 | Lighthouse Performance ≥ 90 | 本地 `pnpm build && lighthouse ...` | Performance score ≥ 90 |
| MANUAL-PERF-002 | 1000 行输入 < 50ms | DevTools Performance / 录制输入 → 渲染 | 单次 input → repaint < 50ms |
| MANUAL-PERF-003 | bundle 体积 | `pnpm build` / gzip dist | < 150 KB total |

> MVP 不上 Lighthouse CI（架构 §3.4 / TBD-T1 待定）。

### 7.6 AC-6 主题 (`e2e/ac6-theme.spec.ts`)

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-AC6-001 | 切深色全跟随 | 默认 light / 点 toggle | `html[data-theme="dark"]` / 背景色变化 |
| E2E-AC6-002 | 刷新保持 | 切 dark / 刷新 | 仍是 dark |
| E2E-AC6-003 | F-B4 跟随系统 dark | 首次访问 / system dark | 默认 dark |

---

## 8. 覆盖率门槛

| 项 | 门槛 | 工具 |
|---|------|------|
| 单测行覆盖率 | ≥ 70% | Vitest coverage |
| 单测分支覆盖率 | ≥ 60% | Vitest coverage |
| E2E AC 覆盖 | AC-1~6 全部 ≥ 1 用例 | 手工核 |
| 性能指标 | Lighthouse Perf ≥ 90 / input < 50ms / bundle < 150KB | 手工，每发版前跑 |

**CI 行为：**
- 每个 PR：单测 + 组件测 + 覆盖率门槛
- main 分支 push：以上 + E2E（Chromium + Webkit）
- release 前：手工 Lighthouse + bundle 体积验证

---

## 9. 决议汇总（原 TBD-T1~T4）

| # | 议题 | 决议（v1.0）|
|---|------|-----------|
| TBD-T1 | Lighthouse CI 自动化 | ✓ MVP 不上，手工跑（v1.1+ 再加 Lighthouse CI）|
| TBD-T2 | E2E 浏览器矩阵 | ✓ Chromium + Webkit（PRD 必测移动 Safari；Firefox 留 v1.1+）|
| TBD-T3 | E2E 触发时机 | ✓ 仅 main push（PR 仅单测+组件测，省 CI 时间）|
| TBD-T4 | fixtures 位置 | ✓ `tests/fixtures/`（统一目录，单测 / E2E 共享）|

> 4 项已转为正式决议。

---

## 10. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-19 | Corray | v0.1 → v1.0，全盘接受 TBD-T1~T4 | AI 倾向方案全部采纳 |

**下一步：** 进入下一节点 = **代码实现**（按本计划执行测试，不等代码完成再补）。Spec-to-code-flow 上游全部 accepted。
