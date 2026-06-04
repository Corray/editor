import { describe, it, expect } from 'vitest';
import { render, hasMermaid } from '@/modules/m2-preview/pipeline';

describe('M2 Mermaid — hasMermaid 探测 + 占位（同步，jsdom 安全）', () => {
  it('UT-MMD-lazy: 探测 ```mermaid 代码块', () => {
    expect(hasMermaid('```mermaid\ngraph TD;A-->B\n```')).toBe(true);
    expect(hasMermaid('前文\n\n```mermaid\nflowchart LR\n```\n后文')).toBe(true);
  });

  it('UT-MMD-lazy-neg: 纯文本/普通代码块 → 不触发', () => {
    expect(hasMermaid('纯文本')).toBe(false);
    expect(hasMermaid('```js\nconst x=1\n```')).toBe(false);
    expect(hasMermaid('行内提到 mermaid 词不算')).toBe(false);
  });

  it('UT-MMD-placeholder: render ```mermaid → 占位 div，源文存文本内容（同步，不依赖 mermaid 库）', () => {
    const html = render('```mermaid\ngraph TD;A-->B\n```');
    expect(html).toContain('mermaid-pending');
    // 源文作占位文本内容存活（DOMParser 读 textContent 还原）
    const el = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('.mermaid-pending');
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('graph TD;A-->B');
    expect(html).not.toContain('<script');
  });

  it('UT-MMD-placeholder-escape: 含 HTML 特殊字符的图源 escape 为文本，不形成标签', () => {
    const html = render('```mermaid\ngraph TD;A["<b>x</b>"]-->B\n```');
    expect(html).toContain('mermaid-pending');
    // <b> 不形成真元素（escape 为文本）
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('.mermaid-pending b')).toBeNull();
    expect(doc.querySelector('.mermaid-pending')?.textContent).toContain('<b>x</b>');
  });

  it('普通 markdown 仍正常渲染（mermaid fence 不影响其它）', () => {
    const html = render('# 标题\n\n```js\nconst x=1\n```');
    expect(html).toContain('<h1');
    expect(html).toContain('const x');
  });
});
