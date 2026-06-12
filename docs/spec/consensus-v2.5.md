# 共识文档 v2.5 — 打印 / 导出增强（print CSS + 导出独立 HTML）

> v1.0 共识增量 delta（2026-06-12 四项拍板 scope 第三项，最小版）。
>
> **状态：** `accepted`（2026-06-12；TBD-v25-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → ADR-021（轻）→ api/test-plan delta → 实现
> **命名：** semver tag **v1.5.0-rc.1**。L1~L2（M4 delta + print CSS，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.5-draft | 2026-06-12 | @media print 打印预览 + 导出独立 .html 文件；3 TBD |

---

## 1. 范围

- **print CSS**：Cmd+P/浏览器打印时只出预览内容（隐藏 header/sidebar/编辑器/status bar），浅色配色，可打印成 PDF
- **导出 HTML**：header「导出」动作族新增独立 `.html` 文件下载（内联基础排版 + 高亮样式，自包含可双击打开）

**不在本次：** 服务端 PDF 生成 / 自定义打印页眉页脚 / 导出主题选择。

---

## 2. 张力

### 张力 A — 导出内容源
`pipeline.render()` 纯字符串：mermaid 只有占位 div（源码文本）、KaTeX 仅在已加载时有结构。**预览 DOM 最终态**：含已渲染 mermaid SVG（内联保真），但取 DOM 需预览已挂载（移动端编辑 tab 时预览不在 DOM）。

### 张力 B — KaTeX 样式体积
katex.css + 20 字体 ≈ 数百 KB，内联进导出文件不现实；不引则公式 HTML 结构在但排版乱。

---

## 3. 待确认项（TBD-v25-x）

### TBD-v25-1 — 打印入口
- **(a) 无新按钮**：浏览器原生 Cmd+P（print CSS 生效）；帮助面板加一条说明〔AI 倾向：header 已 10 按钮，打印低频〕
- (b) header 加「打印」按钮（window.print()）

### TBD-v25-2 — 导出 HTML 内容源
- **(a) 预览 DOM 最终态**（`.preview-content` innerHTML，mermaid SVG/KaTeX 结构保真）+ **导出前 DOMPurify 再过一遍**（纵深，与渲染同配置）；移动端预览未挂载时降级 `pipeline.render(text)`〔AI 倾向〕
- (b) 一律 pipeline.render 纯字符串（mermaid 降级为源码块）

### TBD-v25-3 — 导出文件的 KaTeX 样式
- **(a) 含公式时加 KaTeX CDN `<link>`（jsdelivr 带 SRI + crossorigin）**：联网打开公式排版完整，离线打开结构在样式降级；应用本体仍零 CDN（CSP 不变，只影响导出产物）〔AI 倾向〕
- (b) 不引（公式排版乱，文档化）
- (c) 内联 katex.css + 字体（导出文件 +数百 KB）

---

## 4. 验收条件（AC-v25-x）

- AC-v25-1：打印（Cmd+P）→ 仅预览内容、浅色、无 chrome（header/sidebar/编辑器/状态栏全隐藏）
- AC-v25-2：导出 .html → 独立文件含渲染后内容 + 内联基础/高亮样式，双击可读
- AC-v25-3：含 mermaid 图的文档导出 → SVG 内联保真（预览已渲染态）
- AC-v25-4：**导出内容再过 sanitize**（与渲染同配置 + data-source-line 剥离），无可执行内容
- AC-v25-5：既有导出（.md 下载/复制 HTML/分享）零回归
- AC-v25-6：导出文件名与 .md 下载同规则（`editor-YYYYMMDD-HHmmss.html` 时间戳，consensus §4.3/TBD-6 沿用）

> 安全面：导出产物 = 二次 sanitize 后的静态 HTML；CDN link 仅进导出文件（应用 CSP 不变）。
