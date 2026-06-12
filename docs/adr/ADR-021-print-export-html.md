# ADR-021 — 打印 print CSS + 导出独立 HTML

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-12：D1=@media print 纯 CSS / D2=预览 DOM 源 + 二次 sanitize / D3=KaTeX CDN link 带 SRI 仅入导出产物 / D4=本地 katex 文件算 SRI）|
| **Date** | 2026-06-12 |
| **Decider** | FE (Corray，共识 v2.5 TBD 全拍) |
| **Context** | 共识 v2.5 / M4 导出族（ADR-006）/ ADR-002 sanitize 红线 |

## D1 — 打印：纯 @media print（TBD-v25-1a）

- 隐藏全部 chrome（header/sidebar/编辑器/status/find/toast/抽屉/帮助层），preview 全宽
- **强制浅色**：print 块内覆盖 `[data-theme='dark']` 变量为浅色值（打印深色费墨且对比差）
- **解除滚动容器**：覆盖 v1.7 的 `#root{height:100vh;overflow:hidden}`（否则只打印首屏）——`height:auto; overflow:visible` 链路（#root/.app-shell/.workspace/.panes/.preview-pane）
- 无新按钮；帮助面板加 Cmd+P 条目（条目 8→9，ac17 断言同步）

## D2 — 导出 HTML：预览 DOM 最终态 + 二次 sanitize（TBD-v25-2a）

`m4-export/ExportHtml.ts`：

- 内容源 = `.preview-content` innerHTML（mermaid SVG / KaTeX 结构保真）；预览未挂载（移动编辑 tab）→ 降级 `pipeline.render(text)`。源由 app 层以 accessor 注入（M4 不直查 M2 DOM，依赖方向同 createExportAPI 既有范式）
- **二次 sanitize**：`DOMPurify.sanitize(body, {FORBID_TAGS:['foreignObject','script']})`（与 mermaid 渲染同款纵深）+ 剥 `data-source-line`（copyHtml 同规则）
- 模板：`<!doctype html>` + `<meta charset>` + 内联基础排版/代码/高亮 token CSS（浅色字面值，独立文件不依赖应用变量）+ body
- 文件名 `editor-YYYYMMDD-HHmmss.html`（getFileName 同源参数化扩展名）

## D3/D4 — KaTeX 样式：CDN link 带 SRI（TBD-v25-3a）

- body 含 `class="katex` 时注入 `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@<本地版本>/dist/katex.min.css" integrity="sha384-…" crossorigin="anonymous">`
- **SRI 从本地 node_modules 同版本文件计算**（构建期常量，与 CDN 同内容同 hash）——不引入构建期网络依赖
- 仅进导出产物；应用本体 CSP/自托管策略零变化。离线打开 = 公式结构在、排版降级（文档化）

## Consequences

- api-spec delta：ExportAPI +`downloadHtml()`；createExportAPI +`getPreviewHtml?` 注入；i18n exportHtml.button / help.k.print
- test-plan delta：`导出(DOM 源/降级源/二次 sanitize/文件名/katex link 条件) × 打印(chrome 隐藏/浅色/全文展开)`
- 安全面：导出产物双重 sanitize；CDN 引用仅在用户主动导出的本地文件中
