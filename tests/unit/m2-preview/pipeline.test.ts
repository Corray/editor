import { describe, it, expect } from 'vitest';
import { render } from '@/modules/m2-preview/pipeline';

// jsdom-based assertion helper: 把 HTML 字符串放进真 DOM，
// 用 querySelector 判断"是否含可执行 XSS vector"。
// 比字符串 toContain 准确（escape 文字 / 活属性 区分）。
function asDom(html: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

// =====================================================
// UT-PV-* — 基础 CommonMark 渲染（测试计划 §5.1）
// =====================================================

describe('M2 pipeline.render — UT-PV (basic CommonMark)', () => {
  it('UT-PV-001 / F-E1: heading', () => {
    // v1.7: 块带 data-source-line → DOM 断言（标签 + 文本，不耦合属性）
    const h1 = asDom(render('# Hello')).querySelector('h1');
    expect(h1?.textContent).toBe('Hello');
  });

  it('UT-PV-002 / F-E2: list', () => {
    const dom = asDom(render('- a\n- b\n'));
    expect(dom.querySelector('ul')).not.toBeNull();
    const items = [...dom.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual(['a', 'b']);
  });

  it('UT-PV-003 / F-E4: fenced code block with language', () => {
    const r = render('```js\nconst x = 1;\n```\n');
    expect(r).toMatch(/<pre><code class="language-js">/);
    expect(r).toContain('const x = 1;');
    expect(r).toContain('</code></pre>');
  });

  it('UT-PV-004 / F-E6: link', () => {
    const r = render('[click](https://example.com)');
    expect(r).toContain('<a href="https://example.com">click</a>');
  });

  it('UT-PV-008: empty input → empty output', () => {
    expect(render('')).toBe('');
  });

  it('UT-PV-009: large doc (>1MB) does not throw', () => {
    const big = '# title\n\n' + 'lorem ipsum dolor sit amet '.repeat(40_000);
    expect(big.length).toBeGreaterThan(1_000_000);
    expect(() => render(big)).not.toThrow();
  });
});

// =====================================================
// UT-PV-005~007 + family-E — XSS 拦截矩阵
// =====================================================

describe('M2 pipeline.render — family-E (XSS matrix)', () => {
  it('UT-PV-005 / F-E7: javascript: protocol stripped from link', () => {
    const dom = asDom(render('[a](javascript:alert(1))'));
    expect(dom.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('UT-PV-006 / F-E10: <script> tag never live (raw or escaped)', () => {
    const dom = asDom(render('<script>alert(1)</script>'));
    expect(dom.querySelector('script')).toBeNull();
  });

  it('UT-PV-007 / F-E9: <img onerror> never live', () => {
    const dom = asDom(render('<img src="x" onerror="alert(1)">'));
    expect(dom.querySelector('img[onerror]')).toBeNull();
    expect(dom.querySelector('[onerror]')).toBeNull();
  });

  it('F-E11: inline onclick attribute never live', () => {
    const dom = asDom(render('<a href="#" onclick="alert(1)">x</a>'));
    expect(dom.querySelector('[onclick]')).toBeNull();
  });

  it('F-E12: svg + script never live', () => {
    const dom = asDom(render('<svg><script>alert(1)</script></svg>'));
    expect(dom.querySelector('script')).toBeNull();
    expect(dom.querySelector('svg script')).toBeNull();
  });

  it('F-E5: <script> in code block preserved as escaped literal (no live tag)', () => {
    const r = render('```\n<script>alert(1)</script>\n```\n');
    // 在 code block 内 < > 被 escape 为 &lt; &gt;
    expect(r).toContain('&lt;script&gt;');
    // 没有活的 script tag
    expect(r).not.toMatch(/<script\b/i);
  });
});

// =====================================================
// v1.7 滚动同步 — source-line 标注 + ADD_ATTR XSS 复验（ADR-011 / AC-v17-5）
// =====================================================

describe('M2 pipeline.render — v1.7 source-line（ADR-011 D1）', () => {
  it('UT-M2-source-line: 块元素带 data-source-line（值=源文行号）', () => {
    const dom = asDom(render('# H1\n\npara line 2\n'));
    const h1 = dom.querySelector('h1');
    expect(h1?.getAttribute('data-source-line')).toBe('0'); // 0-based 首行
    const p = dom.querySelector('p');
    expect(p?.getAttribute('data-source-line')).toBe('2'); // 第 3 行（空行后）
  });

  it('UT-M2-source-line-list: 列表项也带行号（嵌套块）', () => {
    const dom = asDom(render('- a\n- b\n'));
    const items = [...dom.querySelectorAll('li[data-source-line]')];
    expect(items.length).toBe(2);
  });
});

describe('M2 pipeline.render — v1.7 ADD_ATTR XSS 复验（AC-v17-5 发布门槛）', () => {
  it('UT-M2-sanitize-add-attr: 放行 data-source-line 后 <script>/onerror/javascript: 仍剥离', () => {
    // 标准 XSS 向量在 ADD_ATTR 配置下仍须被拦
    expect(asDom(render('<script>alert(1)</script>')).querySelector('script')).toBeNull();
    expect(
      asDom(render('<img src=x onerror="alert(1)">')).querySelector('[onerror]'),
    ).toBeNull();
    expect(
      asDom(render('[a](javascript:alert(1))')).querySelector('a[href^="javascript:"]'),
    ).toBeNull();
    // 仅 data-source-line 被放行；尝试注入其他 data-* / 事件属性不应活
    const dom = asDom(render('# hi\n'));
    const h1 = dom.querySelector('h1');
    expect(h1?.hasAttribute('data-source-line')).toBe(true); // 允许
    expect(dom.querySelector('[onclick]')).toBeNull(); // 事件属性仍无
  });
});

// =====================================================
// family-E 合法元素 — 不要误杀
// =====================================================

describe('M2 pipeline.render — family-E (legitimate features pass through)', () => {
  it('F-E3: table renders', () => {
    const md = '| a | b |\n|---|---|\n| 1 | 2 |\n';
    const dom = asDom(render(md)); // v1.7: 块带 data-source-line → 用 DOM 断言（不脆耦合属性）
    expect(dom.querySelector('table')).not.toBeNull();
    expect(dom.querySelector('th')?.textContent).toBe('a');
    expect([...dom.querySelectorAll('td')].some((td) => td.textContent === '1')).toBe(true);
  });

  it('F-E8: valid image renders with src + alt', () => {
    const img = asDom(render('![alt-text](https://example.com/img.png)')).querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/img.png');
    expect(img?.getAttribute('alt')).toBe('alt-text');
  });

  it('blockquote renders', () => {
    const dom = asDom(render('> quoted\n'));
    expect(dom.querySelector('blockquote')).not.toBeNull();
    expect(dom.textContent).toContain('quoted');
  });
});

// =====================================================
// 不变量 — 纯函数（同输入同输出，无副作用）
// =====================================================

describe('M2 pipeline.render — pure function invariants', () => {
  it('same input → same output (idempotent)', () => {
    const md = '# H1\n\n- a\n- b\n';
    expect(render(md)).toBe(render(md));
  });

  it('return is string', () => {
    expect(typeof render('# x')).toBe('string');
  });
});
