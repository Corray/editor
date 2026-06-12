# ADR-020 — 编辑打磨包：Tab 缩进 + 快捷键帮助 + TOC 当前位置高亮

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-12：D1=2 空格缩进 + Esc 放行一次 / D2=AppShell 持帮助态 + Cmd+/ 冒泡捕获 / D3=视口顶部 section + rAF 节流）|
| **Date** | 2026-06-12 |
| **Decider** | FE (Corray，共识 v2.4 TBD 全拍) |
| **Context** | 共识 v2.4 / ADR-017（replaceRange undo）/ ADR-018（OutlinePanel）|

## D1 — Tab 缩进（TBD-v24-1a）

`m1-editor/commands.ts` +`indentSelection(ta, dedent)`：

- 单光标 + Tab：光标处插 2 空格；单光标 + Shift+Tab：当前行行首删 ≤2 空格
- 有选区：覆盖行整体加/减 2 空格，**单次 replaceRange**（一步 undo），选区重算保持覆盖（首行 delta 调 start，总 delta 调 end）
- **a11y 逃逸**：EditorArea 持 `allowTabOnce` 标志——Esc（查找栏未开时）置位，下一个 Tab 不拦截（原生焦点移动）；任意其他键复位

## D2 — 帮助面板（TBD-v24-2a）

- AppShell 持 `helpOpen` 信号；header「⌨」按钮 + `Cmd/Ctrl+/`（keydown 从 textarea 冒泡到 `<main>` 捕获）唤起
- `HelpDialog`（m1-editor）：role=dialog 浮层，列 8 条快捷键（i18n `help.k.*`），Esc / 点击遮罩关闭
- 静态 i18n 文案 textContent 渲染，无安全面

## D3 — TOC 当前位置高亮（TBD-v24-3a / 解 TBD-v22-4 defer）

- `m12-outline/outline.ts` +纯函数 `activeOutlineIndex(items, topLine)`：≤ topLine 的最后一个标题 index（无则 -1）
- AppShell：editorEl scroll 监听（rAF 节流，M10 同范式）→ `topLine = floor(scrollTop / lineHeight)` → memo 出 activeIdx → OutlinePanel `activeIndex` prop → `.outline-item--active`
- 桌面 only（大纲本就桌面 only）；行高估算偏差同 F-V17-3 接受

## Consequences

- api-spec delta：commands +indentSelection；outline +activeOutlineIndex；OutlinePanel +activeIndex?；i18n help.*
- test-plan delta：`缩进(单光标/多行/dedent 不足/undo/Esc 放行) × 帮助(按钮/快捷键/Esc 关) × 高亮(滚动跟随/无标题/顶部前无 section)`
- 无 data-model / 无安全面
