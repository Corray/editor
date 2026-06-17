# ADR-023 — Markdown 格式工具栏：commands 扩展 + FormatToolbar 组件

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-17：D1=applyFormat +code / D2=toggleLinePrefix 行前缀 / D3=wrapCodeBlock 围栏 / D4=FormatToolbar 编辑区顶部常驻）|
| **Date** | 2026-06-17 |
| **Decider** | FE (Corray，共识 v2.7 TBD 全拍) |
| **Context** | 共识 v2.7 / ADR-017（applyFormat/replaceRange undo）|

## D1 — 行内代码并入 applyFormat（TBD-v27-1a）

`FormatKind` += `'code'`（`` ` `` 单 marker toggle）。复用 v2.1 toggleWrap 路径——`` ` `` 无 bold/italic 的 `**`/`***` 误吞问题，直接走通用包裹分支（marker 长度 1，无守卫）。

## D2 — 行前缀 toggle（TBD-v27-3a）

`toggleLinePrefix(ta, kind: 'quote'|'ul'|'ol')`：

- 覆盖行区间（同 indentSelection 算法）→ 每行处理
- **toggle 判定**：选中行**全部**已带该前缀 → 去除；否则加（部分带 → 补齐为加，直觉一致）
- 前缀：quote `> ` / ul `- ` / ol `N. `（加时逐行递增 1,2,3…；去除时剥 `\d+\. `）
- 单次 replaceRange（一步 undo），选区重算保持覆盖（同 indentSelection 范式）

## D3 — 代码块围栏（TBD-v27-1a）

`wrapCodeBlock(ta)`：选区前后包 ```` ``` ````（独立行）；无选区 → 插入空围栏光标置内。经 replaceRange 保 undo。

## D4 — FormatToolbar 组件（TBD-v27-2a）

- `m1-editor/FormatToolbar.tsx`：8 按钮（粗/斜/码/链/引/无序/有序/块），点击对当前 textarea 应用对应命令
- 渲染于 EditorArea 内，FindBar 之下、`.editor-with-gutter` 之上（编辑 chrome 列）
- 移动端：`overflow-x:auto` 横滚容纳；桌面常驻
- 每个按钮需操作 textarea selection —— EditorArea 持 taRef，工具栏按钮回调 `applyCmd(fn)` 包装 `if (taRef) { fn(taRef); }`

## Consequences

- api-spec delta：applyFormat +'code'；+toggleLinePrefix / wrapCodeBlock；FormatToolbar
- i18n：`fmt.bold/italic/code/link/quote/ul/ol/codeblock`（aria-label）
- test-plan delta：包裹 × 行前缀(单/多行/toggle 去除/有序递增) × 围栏 × undo × 移动可见
- 无 data-model / 无安全面
- 复用率高：4/8 按钮直接走既有 applyFormat；新代码仅 toggleLinePrefix + wrapCodeBlock + 组件
