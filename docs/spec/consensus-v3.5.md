# 共识文档 v3.5 — 告警/容器块 callout

> v1.0 共识增量 delta（2026-06-22 第四批 scope 第一项）。
>
> **状态：** `accepted`（2026-06-22；TBD-v35-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-031 → api/test-plan delta → 实现
> **命名：** semver tag **v1.15.0-rc.1**。L2（扩 M2 扩展链，markdown-it-container 叠加）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.5-draft | 2026-06-22 | `:::note/:::warning` 等 callout 样式框（懒加载，并入 v3.4 扩展链）；3 TBD |
| v3.5 | 2026-06-22 | TBD-v35-1~3 全部拍板（全 a）→ accepted；markdown-it-container 4.0.0 |

---

## 1. 动机与范围

笔记常需 note/warning/tip 框突出重点。markdown-it-container 把 `:::type` 块渲染成样式框。

**范围（仅）：** callout 容器块渲染 + 样式 + 懒加载。
**不在本次：** 嵌套容器 / 自定义容器类型（用户定义）/ 折叠容器。

---

## 2. 张力

### 张力 A — 并入扩展链
v3.4 已建 `ensureExtensions` 懒加载链（emoji/footnote/sub/sup）。callout 是同类 markdown-it 插件，**并入同一链**（applyExtensions 加 container 配置）+ `hasExtension` 加 `:::` 检测——一致 + 首屏不含。

### 张力 B — 安全
container 渲染 `<div class="callout callout--type">` + 内部正常 markdown（经 render() sanitize）。div+class 默认放行；不放宽。

---

## 3. 待确认项（TBD-v35-x）

### TBD-v35-1 — 容器类型集
- **(a) note / tip / warning / danger 4 类**（颜色区分明显，覆盖常见）〔AI 倾向〕
- (b) +info / success（6 类，颜色趋同冗余）
- (c) 仅 note / warning 2 类

### TBD-v35-2 — 加载
- **(a) 并入 v3.4 ensureExtensions 懒加载链**（hasExtension 加 `:::` 检测；首屏不含）〔AI 倾向：一致〕
- (b) 独立懒加载器（重复范式）

### TBD-v35-3 — 自定义标题
- **(a) 支持可选标题 `:::note 注意事项`**（框顶显标题；无标题显类型名 i18n）〔AI 倾向：灵活〕
- (b) 固定类型名标题（不支持自定义）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+callout 容器块）| §M2 |
| **ADR-031** | markdown-it-container（note/tip/warning/danger）并入 ensureExtensions + hasExtension 加 `:::` + 标题渲染（escapeHtml）+ 不放宽 sanitize | L2 |
| api-spec delta | pipeline ensureExtensions 扩展（+container 配置）；hasExtension `:::` | 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`4 类型渲染（class 正确）× 自定义标题 / 类型名默认 × 内部 markdown 正常 × 未知类型不渲染 × XSS（标题/内容不逃逸）× 首屏不含` | 覆盖 |

---

## 5. 验收条件（AC-v35-x）

- AC-v35-1：`:::note`...`:::` → `<div class="callout callout--note">` 样式框（4 类各自颜色）
- AC-v35-2：`:::note 自定义标题` → 框顶显该标题；无标题 → 显类型名（i18n）
- AC-v35-3：callout 内部 markdown（**bold**/列表等）正常渲染
- AC-v35-4：未知类型 `:::foo` → 不渲染为 callout（原样/段落，不报错）
- AC-v35-5：lazy chunk 首屏不增（并入扩展链，size 闸守）
- AC-v35-6：**XSS 门槛**：callout 标题/内容含恶意经 sanitize 剥离（双引擎）
- AC-v35-7：既有零回归（v3.4 扩展 / katex / mermaid / task / frontmatter）

> 安全面：div+class + 标题 escapeHtml，经 render() 既有 DOMPurify；不放宽（ADR-002）。
