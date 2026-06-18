# 共识文档 v3.3 — frontmatter (YAML) 支持

> v1.0 共识增量 delta（2026-06-17 第三批 scope 第三项）。
>
> **状态：** `accepted`（2026-06-18；TBD-v33-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-029 → api/test-plan delta → 实现
> **命名：** semver tag **v1.13.0-rc.1**。L2（扩 M2 渲染管线，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.3-draft | 2026-06-17 | 文档头 YAML frontmatter 识别 + 预览 metadata 框（不渲染为 hr+乱内容）；3 TBD |
| v3.3 | 2026-06-18 | TBD-v33-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

笔记常在文档头写 YAML frontmatter（`---\ntitle: x\n---`）。目前 markdown-it 把首行 `---` 渲染成 `<hr>`、YAML 行当普通段落——预览乱。本版识别 frontmatter 块，渲染成独立 metadata 框。

**范围（仅）：** 文档头 frontmatter 识别 + 预览展示（不进正常 markdown 渲染）。
**不在本次：** frontmatter 驱动行为（如 title 改文档名）/ 完整 YAML 语义（嵌套/数组/锚点）/ 编辑器侧折叠。

---

## 2. 张力

### 张力 A — YAML 解析深度 vs 依赖/安全
完整 YAML 需 js-yaml（加依赖 + 解析复杂类型）。笔记 frontmatter 95% 是 `key: value` 平铺。取舍：**轻量 `key: value` 行解析**（无新依赖），嵌套/数组行原样显示——避免引 YAML lib 的体积 + 解析面。

### 张力 B — 识别边界
仅**文档最开头**（第 1 行 `---`）才算 frontmatter；文中的 `---` 仍是 `<hr>`（GFM 语义）。闭合 `---` 前无内容则不识别（避免误吞）。

---

## 3. 待确认项（TBD-v33-x）

### TBD-v33-1 — 实现方式
- **(a) 自定义 markdown-it block rule**（无新依赖，与 installMermaidFence/installTaskList 一致；消费 frontmatter 块 → 渲染 metadata 框，不产 hr）〔AI 倾向：项目一贯最小依赖〕
- (b) markdown-it-front-matter 插件（加依赖）

### TBD-v33-2 — 预览展示
- **(a) 独立 metadata 框（key:value 行列表，常显，弱样式区分正文）**〔AI 倾向：用户能看到自己的元数据，不藏〕
- (b) 完全隐藏（预览不显 frontmatter）
- (c) 可折叠（默认展开）

### TBD-v33-3 — 解析深度
- **(a) 轻量 `key: value` 行解析**（首个 `:` 分隔；嵌套/数组/多行行原样整行显示；不引 YAML lib）〔AI 倾向：无依赖 + 覆盖平铺 95%〕
- (b) 引 js-yaml 完整解析（依赖 + 复杂类型）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+frontmatter 识别 + metadata 框）| §M2 |
| **ADR-029** | 自定义 block rule（仅 doc 开头识别 + 轻量 key:value 解析 + metadata 框 renderer，值 escapeHtml）+ 不放宽 sanitize | L2 |
| api-spec delta | pipeline installFrontmatter（block rule + renderer）| 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`识别(doc 头 --- / 闭合) × 不误识别(文中 --- 仍 hr / 无闭合不吞) × key:value 解析 × 嵌套行原样 × XSS(值含恶意不逃逸) × 空 frontmatter` | 覆盖 |

---

## 5. 验收条件（AC-v33-x）

- AC-v33-1：文档头 `---\nkey: value\n---` → 渲染 metadata 框（key/value 行），**不产 `<hr>`**
- AC-v33-2：文中（非首行）`---` 仍渲染为 `<hr>`（GFM 不变）
- AC-v33-3：无闭合 `---` → 不识别为 frontmatter（首行 `---` 走原 hr 逻辑）
- AC-v33-4：`key: value` 解析正确；嵌套/数组行原样整行显示
- AC-v33-5：**XSS 门槛**：frontmatter 值含 `<script>`/`onerror` 经 sanitize 剥离（值 escapeHtml + render DOMPurify，不放宽）
- AC-v33-6：frontmatter 后正文正常渲染
- AC-v33-7：既有零回归（hr / 渲染 / 滚动同步）

> 安全面：metadata 框值经 md.utils.escapeHtml + render() 既有 DOMPurify；不放宽 allowlist（ADR-002）。
