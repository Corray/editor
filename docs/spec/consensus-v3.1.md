# 共识文档 v3.1 — 预览任务清单交互（可点 checkbox 回写源文）

> v1.0 共识增量 delta（2026-06-17 第三批 scope 第一项）。
>
> **状态：** `accepted`（2026-06-17；TBD-v31-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-027 → api/test-plan delta → 实现
> **命名：** semver tag **v1.11.0-rc.1**。L2（扩 M2 渲染 + PreviewArea 点击编排，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.1-draft | 2026-06-17 | GFM `- [ ]` 渲染成可点 checkbox + 点击回写源文 [ ]↔[x]；3 TBD |
| v3.1 | 2026-06-17 | TBD-v31-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

速记/todo 是核心使用场景，但 `- [ ]` 目前只渲染为纯文本 `[ ]`。本版渲染成可点 checkbox，点击回写源文 → 真正的交互式任务清单。

**安全前提已验**（DOMPurify 探针）：`<input type=checkbox checked disabled>` 默认放行、`data-source-line` 经既有 ADD_ATTR 保留、`onclick` 被剥离——**不需放宽 sanitize**（ADR-002 红线不动）。

**范围（仅）：** task list 渲染 + 点击回写源文。
**不在本次：** 嵌套任务进度统计 / 拖拽重排 / 任务清单专属视图。

---

## 2. 张力

### 张力 A — 点击如何映射回源行
checkbox 需知道自己对应源文哪一行才能回写。复用 v1.7 `data-source-line`（installSourceLine 已给块级 token 标行号）——在 task list 渲染时把行号标到 checkbox 上，点击委托读取 → 定位源行 → 翻转 `[ ]`↔`[x]`。

### 张力 B — disabled checkbox 不接收 click
`disabled` 的 input 多数浏览器不触发 click。方案：checkbox **非 disabled**，PreviewArea 委托拦截 click → `preventDefault`（撤销原生切换）→ 改源文 → 重渲染驱动真值（单一数据源 = 源文，不靠 DOM 态）。

---

## 3. 待确认项（TBD-v31-x）

### TBD-v31-1 — 渲染方式
- **(a) 自定义 markdown-it core rule**（无新依赖，与 installMermaidFence/installSourceLine 一致范式；checkbox 标 data-source-line）〔AI 倾向：项目一贯最小依赖 + 自定义规则〕
- (b) markdown-it-task-lists 插件（加依赖，省自写但行号标注仍需定制）

### TBD-v31-2 — 交互
- **(a) 点击回写源文**（读写：preventDefault + 翻转源行 [ ]↔[x] + setText → 重渲染；持久化经 M3）〔AI 倾向：核心价值〕
- (b) 只读展示（仅渲染 checkbox 不可点，价值减半）

### TBD-v31-3 — 平台
- **(a) 桌面 + 移动都支持**（预览 tab 点击 / tap，纯 DOM 事件同理）〔AI 倾向〕
- (b) 仅桌面

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+task list 渲染 + 点击回写）| §M2 |
| **ADR-027** | 自定义 task list 渲染规则（checkbox + data-source-line）+ PreviewArea 委托点击 → 源行翻转 + 不放宽 sanitize（探针已验）| L2 |
| api-spec delta | pipeline task list 渲染规则；PreviewArea 点击编排（toggleTaskAtLine 纯函数）| 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`渲染([ ]→空 checkbox / [x]→勾选 / 大小写 X) × 点击翻转([ ]→[x] / [x]→[ ] / 回写源行正确) × 多任务定位准 × 非任务列表不误渲 × XSS(恶意内容不逃逸) × 持久化` | 覆盖 |

---

## 5. 验收条件（AC-v31-x）

- AC-v31-1：`- [ ]` 渲染为未勾 checkbox，`- [x]`/`- [X]` 渲染为已勾
- AC-v31-2：点击 checkbox → 源文对应行 `[ ]`↔`[x]` 翻转 + 编辑器内容同步更新
- AC-v31-3：多个任务项点击各自定位准确（不串行）
- AC-v31-4：翻转后持久化（M3 防抖保存，刷新保留）
- AC-v31-5：**XSS 门槛**：任务项含恶意内容（`<script>`/`onerror`）经 sanitize 剥离无 alert（双引擎 e2e，sanitize 不放宽）
- AC-v31-6：非任务列表（普通 `- item`）不误渲为 checkbox
- AC-v31-7：移动端预览 tab 可点
- AC-v31-8：既有零回归（渲染/滚动同步/防抖/列表延续）

> 安全面：checkbox 经 render() 既有 DOMPurify（探针验默认放行 input/type/checked、剥 onclick）；不放宽 allowlist（ADR-002 红线）。点击回写走 state.setText（纯文本写入，不 innerHTML）。
