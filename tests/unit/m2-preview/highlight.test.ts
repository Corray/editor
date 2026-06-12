import { describe, it, expect } from 'vitest';
import {
  render,
  hasCode,
  ensureHighlight,
  highlightReady,
} from '@/modules/m2-preview/pipeline';

// 测试计划 v2.3 §2 hasCode 启发式族 + 高亮/降级/XSS 族。
// 注意：本文件 ensureHighlight 后模块级 hljs 常驻 —— hasCode/降级用例放加载前语义
// 不受影响（hasCode 纯函数；降级 = 未知语言/无标注，与加载态无关）。
describe('M2 highlight — CT-HL (AC-v23-1/2/3/4)', () => {
  it('CT-HL-1: hasCode 启发式：带语言 fence true / mermaid-only false / 无标注 false / inline code false', () => {
    expect(hasCode('```js\nx\n```')).toBe(true);
    expect(hasCode('~~~python\nx\n~~~')).toBe(true);
    expect(hasCode('```mermaid\ngraph TD\n```')).toBe(false);
    expect(hasCode('```\nplain\n```')).toBe(false);
    expect(hasCode('text `inline` code')).toBe(false);
    expect(hasCode('plain text')).toBe(false);
  });

  it('CT-HL-2: 未加载期间 render 降级（escapeHtml，无 hljs span）', () => {
    // 本用例须在 ensureHighlight 之前跑：vitest 文件内顺序执行保证
    if (!highlightReady()) {
      const html = render('```js\nconst x = 1;\n```');
      expect(html).toContain('language-js');
      expect(html).not.toContain('hljs-');
    }
  });

  it('CT-HL-3: 加载后常用语言着色（hljs-keyword span 出现）', async () => {
    await ensureHighlight();
    expect(highlightReady()).toBe(true);
    const html = render('```js\nconst x = 1;\n```');
    expect(html).toContain('hljs-keyword'); // const
    expect(html).toContain('language-js');
  });

  it('CT-HL-4: 未知语言降级无色（escapeHtml，不报错）', async () => {
    await ensureHighlight();
    const html = render('```zzznotalang\nconst x = 1;\n```');
    expect(html).toContain('language-zzznotalang');
    expect(html).not.toContain('hljs-');
  });

  it('CT-HL-5: 无标注 fence 降级无色', async () => {
    await ensureHighlight();
    const html = render('```\nconst x = 1;\n```');
    expect(html).not.toContain('hljs-');
  });

  it('CT-HL-6: mermaid fence 不被高亮拦截（仍走占位 div 路径）', async () => {
    await ensureHighlight();
    const html = render('```mermaid\ngraph TD;A-->B;\n```');
    expect(html).toContain('mermaid-pending');
    expect(html).not.toContain('hljs-');
  });

  it('CT-HL-7: XSS — 恶意代码内容 escaped，无可执行 script/事件（AC-v23-4 unit 层）', async () => {
    await ensureHighlight();
    const html = render(
      '```html\n<script>alert(1)</script><img src=x onerror=alert(1)>\n```',
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toMatch(/<img[^>]+onerror/);
    // 内容以转义文本形式存在
    expect(html).toContain('&lt;');
  });

  it('CT-HL-8: 非法语法不抛错（ignoreIllegals）', async () => {
    await ensureHighlight();
    expect(() => render('```js\n}}}{{{ %%% def class\n```')).not.toThrow();
  });
});
