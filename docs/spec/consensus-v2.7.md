# 共识文档 v2.7 — Markdown 格式工具栏

> v1.0 共识增量 delta（2026-06-16 四项打磨 scope 第一项）。
>
> **状态：** `accepted`（2026-06-17；TBD-v27-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M1 delta → ADR-023 → api/test-plan delta → 实现
> **命名：** semver tag **v1.7.0-rc.1**。L2（扩 M1 编辑 chrome + commands，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.7-draft | 2026-06-16 | 编辑区格式工具栏（按钮 → applyFormat/行前缀/围栏）；移动端格式入口；3 TBD |
| v2.7 | 2026-06-17 | TBD-v27-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

v2.1 的 Cmd+B/I/K 快捷键**移动端无从触发**（无修饰键）——工具栏是移动端唯一可视格式入口，桌面也降低记忆成本。

**范围（仅）：** 编辑面板格式工具栏 + 配套 commands 扩展（行内代码、引用/列表行前缀、代码块围栏）。
**不在本次：** WYSIWYG / 工具栏自定义排序 / 字号字色等富文本（Markdown 无此语义）。

---

## 2. 张力

### 张力 A — 包裹类 vs 行前缀类 vs 围栏类
- 包裹（B/I/链接/行内代码）：复用 v2.1 `applyFormat` toggle（选区两侧加/解 marker）
- 行前缀（引用 `> `/无序 `- `/有序 `1. `）：选中多行整体加前缀，需新 `toggleLinePrefix`（再点去除）
- 围栏（代码块 ```）：选区包进 ``` 块，新 `wrapCodeBlock`

### 张力 B — 工具栏占位
header 已 13 按钮（flex-wrap）。工具栏是**编辑区专属**（作用于 textarea），不进 header；放编辑面板顶部（FindBar 同区）。移动端横向滚动条容纳。

---

## 3. 待确认项（TBD-v27-x）

### TBD-v27-1 — 按钮集〔需你拍板：范围〕
- **(a) 8 个**：加粗 / 斜体 / 行内代码 / 链接 / 引用 / 无序列表 / 有序列表 / 代码块〔AI 倾向：覆盖日常 Markdown 高频，移动端一栏（可横滚）〕
- (b) 精简 5 个：加粗 / 斜体 / 链接 / 列表 / 引用（砍行内代码/有序/代码块）
- (c) 扩展 + 标题（H1/H2 下拉）：标题下拉增 UI 复杂度

### TBD-v27-2 — 工具栏显示
- **(a) 编辑面板顶部常驻（桌面 + 移动）**，FindBar 之下、textarea 之上〔AI 倾向：一致可见，移动端尤其需要〕
- (b) 仅移动端显示（桌面靠快捷键）
- (c) 可折叠（默认收起）

### TBD-v27-3 — 行前缀 toggle 语义
- **(a) toggle：选中行已全部带该前缀 → 去除；否则加**（有序列表加时逐行递增）〔AI 倾向：与 B/I toggle 一致直觉〕
- (b) 只加不去（简单但反直觉）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M1 delta（+格式工具栏）| §M1 |
| **ADR-023** | commands 扩展（FormatKind +code / toggleLinePrefix / wrapCodeBlock，均经 replaceRange 保 undo）+ FormatToolbar 组件 + 移动端布局 | L2 |
| api-spec delta | applyFormat +'code'；+toggleLinePrefix(kind) / wrapCodeBlock；FormatToolbar | 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`包裹(B/I/code/link toggle) × 行前缀(引用/无序/有序 × 单行/多行/toggle 去除/有序递增) × 围栏 × undo × 移动端可见` | 覆盖 |

---

## 5. 验收条件（AC-v27-x）

- AC-v27-1：点工具栏 加粗/斜体/行内代码 → 选区两侧加 marker；再点已包裹选区 → 解除（toggle，复用 v2.1）
- AC-v27-2：链接 → `[选区](url)` 且选中 url 占位
- AC-v27-3：引用/无序列表 → 选中行整体加 `> `/`- ` 前缀；有序列表逐行 `1.``2.` 递增
- AC-v27-4：行前缀 toggle —— 选中行已全带前缀 → 再点去除
- AC-v27-5：代码块 → 选区包进 ``` 围栏（占位语言提示）
- AC-v27-6：所有工具栏操作 Cmd+Z 可撤销（复用 replaceRange / AC-v21-7 同约束）
- AC-v27-7：移动端工具栏可见可点（无快捷键场景下唯一格式入口）
- AC-v27-8：既有零回归（快捷键/查找/列表延续/缩进/字数/大纲）

> 无安全面：插入文本只进 textarea value（纯文本），渲染走既有 DOMPurify 管线；不动 sanitize。
