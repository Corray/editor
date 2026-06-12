# 接口设计 v2.5 delta — 打印 / 导出 HTML

> **基线：** 共识 v2.5（accepted）+ ADR-021。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.5 | 2026-06-12 | ExportAPI +downloadHtml；ExportHtml.ts；@media print；i18n exportHtml.*/help.k.print |

## 1. 接口

```ts
// m4-export/ExportHtml.ts
/** 渲染态 HTML → 自包含 .html 文档字符串（二次 sanitize + 剥 data-source-line + 内联浅色样式 + 条件 KaTeX CDN link） */
export function buildHtmlDocument(bodyHtml: string): string;
/** 触发 .html 下载（editor-YYYYMMDD-HHmmss.html） */
export function downloadHtml(docHtml: string, now?: Date): void;

// m4-export/api.ts
export interface ExportAPI {
  downloadMarkdown(): void;
  copyHtml(): Promise<boolean>;
  downloadHtml(): void; // 新增：预览 DOM 优先，未挂载降级 render(text)
}
export function createExportAPI(
  text: Accessor<string>,
  getPreviewHtml?: () => string | null, // 新增：app 层注入（M4 不直查 M2 DOM）
): ExportAPI;
```

## 2. 装配

- AppShell：`createExportAPI(state.text, () => document.querySelector('.preview-content')?.innerHTML ?? null)`；header +「导出 HTML」按钮
- HelpDialog +Cmd+P 条目（8→9）
- main.css `@media print` 块（chrome 全隐 + 强制浅色 + 滚动容器解除）
- i18n：`exportHtml.button` / `help.k.print`

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| ExportHtml.ts（模板/二次 sanitize/SRI 常量——本地 katex@0.17.0 文件 openssl 计算）| ✓ | `c270057` |
| ExportAPI.downloadHtml + AppShell 注入 + header 按钮 | ✓ | `c270057` |
| @media print 块（chrome 全隐/强制浅色/滚动容器解除）| ✓ | `c270057` |
| i18n + HelpDialog 条目（8→9，ac17 断言同步）| ✓ | `c270057` |

> 测试：unit +6（CT-XH）→ 255；e2e +2 用例双引擎（ac18：下载内容断言 + emulateMedia print）→ 134 + 3 skip。首屏 88.77KB。附带：ac15-2 webkit poll 加固（F-V22-1 二次复发 → 10s）。
