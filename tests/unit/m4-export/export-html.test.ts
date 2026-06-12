import { describe, it, expect } from 'vitest';
import { buildHtmlDocument } from '@/modules/m4-export/ExportHtml';

// 测试计划 v2.5 §家族 导出族（AC-v25-2/3/4/6）
describe('M4 buildHtmlDocument — CT-XH', () => {
  it('CT-XH-1: 自包含结构（doctype + charset + 内联 style + body 内容）', () => {
    const doc = buildHtmlDocument('<h1>标题</h1><p>内容</p>');
    expect(doc).toContain('<!doctype html>');
    expect(doc).toContain('<meta charset="utf-8">');
    expect(doc).toContain('<style>');
    expect(doc).toContain('<h1>标题</h1>');
  });

  it('CT-XH-2: 二次 sanitize — script/onerror/foreignObject 剥离（AC-v25-4）', () => {
    const doc = buildHtmlDocument(
      '<p>x</p><script>alert(1)</script><img src=x onerror=alert(1)><svg><foreignObject><div>y</div></foreignObject></svg>',
    );
    expect(doc).not.toContain('<script>');
    expect(doc).not.toMatch(/<img[^>]+onerror/);
    expect(doc).not.toContain('foreignObject');
  });

  it('CT-XH-3: data-source-line 剥离（内部属性不出门）', () => {
    const doc = buildHtmlDocument('<p data-source-line="3">x</p>');
    expect(doc).not.toContain('data-source-line');
    expect(doc).toContain('<p>x</p>');
  });

  it('CT-XH-4: mermaid SVG 保真（svg 元素保留）（AC-v25-3）', () => {
    const doc = buildHtmlDocument('<svg viewBox="0 0 10 10"><g><text>A</text></g></svg>');
    expect(doc).toContain('<svg');
    expect(doc).toContain('<text>A</text>');
  });

  it('CT-XH-5: katex link 条件注入 — 含 katex class 有 / 无则无', () => {
    const withK = buildHtmlDocument('<span class="katex">x</span>');
    expect(withK).toContain('katex.min.css');
    expect(withK).toContain('integrity="sha384-');
    const without = buildHtmlDocument('<p>plain</p>');
    expect(without).not.toContain('katex.min.css');
  });

  it('CT-XH-6: 高亮 token 样式内联（hljs-keyword 字面色）', () => {
    const doc = buildHtmlDocument('<pre><code><span class="hljs-keyword">const</span></code></pre>');
    expect(doc).toContain('.hljs-keyword');
    expect(doc).toContain('#cf222e');
  });
});
