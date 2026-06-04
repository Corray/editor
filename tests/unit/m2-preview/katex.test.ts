import { describe, it, expect, beforeAll } from 'vitest';
import {
  render,
  hasMath,
  ensureKatex,
  katexReady,
} from '@/modules/m2-preview/pipeline';

describe('M2 KaTeX — hasMath 探测（UT-LAZY-002 / UT-KATEX-005）', () => {
  it('detects inline $…$ and block $$…$$', () => {
    expect(hasMath('$x^2$')).toBe(true);
    expect(hasMath('$$\\int_0^1 x\\,dx$$')).toBe(true);
    expect(hasMath('混合 文本 $a+b$ 尾')).toBe(true);
  });

  it('plain text / lone $ (price) → not math', () => {
    expect(hasMath('纯文本无公式')).toBe(false);
    expect(hasMath('价格 $5 和 $10 元')).toBe(false);
    expect(hasMath('')).toBe(false);
  });
});

describe('M2 KaTeX — render + security（插件已载）', () => {
  beforeAll(async () => {
    await ensureKatex();
  });

  it('katexReady() true after ensureKatex()', () => {
    expect(katexReady()).toBe(true);
  });

  it('UT-KATEX-001: 公式渲染 → .katex span 存活于默认 DOMPurify（无需放宽 allowlist）', () => {
    const html = render('公式 $x^2$ 结束');
    expect(html).toContain('katex'); // styled span 过默认 sanitize
    expect(html).toContain('结束'); // 普通文本仍在
  });

  it('UT-KATEX-block: $$…$$ 块级公式渲染', () => {
    const html = render('$$E=mc^2$$');
    expect(html).toContain('katex');
  });

  // —— 安全：AC-v13-3 发布门槛 ——
  // DOM 级断言（非字符串）：katex throwOnError:false 会把恶意输入回显进 error
  // 的 title 属性（惰性）/ 转义进文本，字符串匹配会误报；只查真实可执行元素/属性。
  const parse = (html: string): Document =>
    new DOMParser().parseFromString(html, 'text/html');
  const assertNoXss = (html: string): void => {
    const doc = parse(html);
    expect(doc.querySelector('script, iframe, object, embed')).toBeNull();
    for (const el of doc.querySelectorAll('*'))
      for (const attr of el.attributes)
        expect(attr.name.toLowerCase()).not.toMatch(/^on/); // 无事件属性
    for (const el of doc.querySelectorAll('[href], [src]')) {
      expect((el.getAttribute('href') ?? '').trim()).not.toMatch(/^javascript:/i);
      expect((el.getAttribute('src') ?? '').trim()).not.toMatch(/^javascript:/i);
    }
  };

  it('UT-XSS-003: 恶意 \\href{javascript:} → 无 a[href=js]/无 script（trust:false + DOMPurify）', () => {
    assertNoXss(render('$\\href{javascript:alert(1)}{click}$'));
  });

  it('UT-XSS-003b: 公式旁的 HTML 注入（onerror img / script）被 sanitize', () => {
    assertNoXss(
      render('$x$ <img src=x onerror=alert(1)> <script>alert(2)</script>'),
    );
  });

  it('UT-XSS-003c: 试图经公式注入危险标签 → 无 iframe/object/embed 元素', () => {
    assertNoXss(render('$$\\text{x}$$ <iframe src=evil></iframe>'));
  });

  it('非法 LaTeX → throwOnError:false 显错不崩', () => {
    expect(() => render('$\\frac{1}$')).not.toThrow();
    expect(render('$\\frac{1}$')).toContain('katex-error');
  });

  it('"$5 和 $10" 等非公式 $ → 不误渲染为公式', () => {
    const html = render('价格 $5 和 $10 元');
    expect(html).not.toContain('class="katex"');
    expect(html).toContain('价格');
  });
});
