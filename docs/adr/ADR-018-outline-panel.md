# ADR-018 — 大纲/TOC 面板：源文 ATX 解析 + sidebar 分区 + 复用滚动同步跳转

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-11：D1=源文 ATX regex / D2=跳转复用 M10 / D3=app 层组合进 sidebar / D4=deferred 出输入路径）|
| **Date** | 2026-06-11 |
| **Decider** | FE (Corray，共识 v2.2 TBD 全拍) |
| **Context** | 共识 v2.2（accepted）/ M10 滚动同步（v1.7 source-line 链路）/ M9 sidebar（v1.6）|
| **Supersedes** | — |

## D1 — 数据源：源文 ATX regex 单遍解析（TBD-v22-2a）

`m12-outline/outline.ts` 纯函数 `parseOutline(text)` 逐行扫描：

- 标题：`^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$`（CommonMark ≤3 前导空格；尾随闭合 `#` 剥离；`#` 后无内容不收）
- fenced 跳过：行匹配 `^ {0,3}(`{3,}|~{3,})` 切换 fence 态，fence 内不识别标题（伪标题排除，AC-v22-2）
- **不支持 setext**（`===`/`---` 下划线式，文档化限制——速记场景 ATX 占绝对主流）
- 产出 `{ level, text, line, offset }[]`（line/offset 供跳转；text 仅作 textContent 渲染，无 XSS 面）

## D2 — 跳转：编辑器定位 + M10 自然联动（TBD-v22-3a）

点击大纲项 → `jumpToLine(item)`：textarea `focus` + `setSelectionRange(offset, offset)`（光标置行首）+ `scrollTop = line×lineHeight − clientHeight/2`（行号估算居中，软换行偏差同 F-V17-3 接受）。

- 程序化 scrollTop 触发原生 scroll 事件 → **M10 既有 editor→preview 同步自动联动预览**，零新协议
- 跳转编排在 AppShell（持 editorEl signal + prefs 行高），M12 只发 `onJump(item)` 回调

## D3 — 布局：sidebar 上下分区，app 层组合（TBD-v22-1a）

- `DocList` 加 `children` slot（渲染于列表之后）；AppShell 把 `<OutlinePanel>` 作为 children 传入 —— **M12 不 import M9**，组合发生在应用装配层
- `.doc-sidebar` 改 flex column：DocList 上半（flex:1 自滚）+ 大纲下半（flex:1 自滚 + border-top）
- 移动端 v2.2 不做（桌面 only，M10 先例；DocDrawer 不传 children 行为不变）

## D4 — 性能：deferred 出输入路径

大纲解析消费 `createDeferred(text)`（同 v2.1 wordcount 范式）：单遍 O(n) 行扫描，空闲时段更新，不进每键同步路径（BHV-008' 家族预防）。

---

## Consequences

- **module-list**：M12 新增（纯派生态，无持久化）
- **api-spec delta**：`parseOutline` + `OutlineItem` + `OutlinePanel({ items, onJump })` + DocList `children?`
- **data-model**：无
- i18n：`outline.title` / `outline.empty`
- test-plan delta：`标题层级 × fenced 排除 × 空态 × 跳转定位 × 文档切换刷新` 家族
- 无安全面：标题文本 textContent 渲染，不 innerHTML；不动 sanitize
- 已知限制：setext 标题不进大纲；跳转行定位为估算（软换行偏差，F-V17-3 同限）
