import DOMPurify from 'dompurify';
import { getFileName } from './ExportMd';

/**
 * 导出独立 .html（v2.5 / ADR-021 D2~D4）。
 *
 * [SECURITY REVIEW REQUIRED] 导出产物二次 sanitize：内容源（预览 DOM innerHTML 或
 * pipeline.render 输出）虽已 sanitize，导出前再过 DOMPurify（FORBID foreignObject/script，
 * 与 mermaid 渲染同款纵深）+ 剥 data-source-line（内部属性不出门，copyHtml 同规则）。
 */

/** KaTeX CDN 样式（仅入导出产物；版本/SRI 与本地 node_modules katex 同源计算 / ADR-021 D4）。 */
const KATEX_CDN_LINK =
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css" ' +
  'integrity="sha384-vlBdW0r3AcZO/HboRPznQNowvexd3fY8qHOWkBi5q7KGgqJ+F48+DceybYmrVbmB" crossorigin="anonymous">';

/** 内联浅色样式（独立文件不依赖应用 CSS 变量；排版 + 代码块 + 高亮 token 字面值）。 */
const EXPORT_CSS = `
  body { max-width: 48rem; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a;
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; }
  pre { background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 6px; overflow-x: auto; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
  :not(pre) > code { background: #f3f4f6; padding: 0.125em 0.375em; border-radius: 4px; }
  blockquote { border-left: 3px solid #e5e7eb; margin-left: 0; padding-left: 1rem; color: #6b7280; }
  table { border-collapse: collapse; } th, td { border: 1px solid #e5e7eb; padding: 0.375rem 0.75rem; }
  img, svg { max-width: 100%; }
  a { color: #2563eb; }
  .hljs-keyword, .hljs-literal, .hljs-built_in, .hljs-selector-tag { color: #cf222e; }
  .hljs-string, .hljs-regexp, .hljs-selector-attr, .hljs-selector-pseudo { color: #0a3069; }
  .hljs-number, .hljs-symbol { color: #0550ae; }
  .hljs-comment, .hljs-quote { color: #6e7781; font-style: italic; }
  .hljs-title, .hljs-section { color: #8250df; }
  .hljs-attr, .hljs-attribute, .hljs-variable, .hljs-template-variable, .hljs-selector-id, .hljs-selector-class { color: #953800; }
  .hljs-type, .hljs-params { color: #0550ae; }
  .hljs-meta, .hljs-doctag { color: #8250df; }
  .hljs-tag, .hljs-name, .hljs-addition { color: #116329; }
  .hljs-deletion { color: #cf222e; }
`;

/** 渲染态 HTML → 自包含 .html 文档字符串。 */
export function buildHtmlDocument(bodyHtml: string): string {
  const safe = DOMPurify.sanitize(bodyHtml, {
    FORBID_TAGS: ['foreignObject', 'script'],
  }).replace(/ data-source-line="\d+"/g, '');
  const katexLink = safe.includes('class="katex') ? `\n  ${KATEX_CDN_LINK}` : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>editor export</title>${katexLink}
  <style>${EXPORT_CSS}</style>
</head>
<body>
${safe}
</body>
</html>
`;
}

/** 触发 .html 下载（`editor-YYYYMMDD-HHmmss.html`，时间戳规则同 .md）。 */
export function downloadHtml(docHtml: string, now?: Date): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getFileName(now).replace(/\.md$/, '.html');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
