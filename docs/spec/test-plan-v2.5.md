# 测试计划 v2.5 delta — 打印 / 导出 HTML

> **基线：** 共识 v2.5 AC-v25-1~6 + ADR-021。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.5 | 2026-06-12 | 导出 × 打印 2 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v25-1 | print 媒体下 chrome 全隐 + preview 可见 + 浅色 | e2e（emulateMedia print）|
| AC-v25-2/6 | 下载触发 + 文件名 + 自包含结构 | unit + e2e（download 事件）|
| AC-v25-3 | mermaid SVG 保真（DOM 源）| unit（构造含 svg 的 body）|
| AC-v25-4 | **二次 sanitize**：script/onerror/foreignObject 剥离 + data-source-line 剥离 | unit |
| AC-v25-5 | 既有导出零回归 | 既有 ac3/ac7 |

## 家族

- **导出族**：`DOM 源（含 svg 保真） × 降级源（getPreviewHtml null → render） × sanitize（script/onerror/foreignObject/data-source-line） × katex link 条件（含 katex class 有 / 无则无） × 文件名 .html`
- **打印族**：`print 媒体 × header/sidebar/editor/status 全 display:none × preview 可见 × dark 主题下仍浅色变量`

## 入口

- unit：`tests/unit/m4-export/export-html.test.ts`
- e2e：`tests/e2e/ac18-print-export.spec.ts`（双引擎）
