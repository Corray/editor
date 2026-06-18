import { describe, it, expect } from 'vitest';
import { render } from '@/modules/m2-preview/pipeline';

// 测试计划 v3.3 §家族（AC-v33-1~6）
describe('M2 frontmatter — CT-FM', () => {
  it('CT-FM-1: doc 头 frontmatter → metadata 框，无 hr', () => {
    const html = render('---\ntitle: My Note\ntags: a\n---\n\nbody');
    expect(html).toContain('class="frontmatter"');
    expect(html).toContain('<dt>title</dt>');
    expect(html).toContain('<dd>My Note</dd>');
    expect(html).not.toContain('<hr'); // 首行 --- 不渲染为 hr
    expect(html).toContain('body'); // 正文正常
  });

  it('CT-FM-2: 文中（非首行）`---` 仍渲染 hr', () => {
    const html = render('text above\n\n---\n\ntext below');
    expect(html).toContain('<hr');
    expect(html).not.toContain('frontmatter');
  });

  it('CT-FM-3: 无闭合 `---` → 不识别（首行 --- 走 hr 逻辑）', () => {
    const html = render('---\ntitle: x\nno closing');
    expect(html).not.toContain('class="frontmatter"');
  });

  it('CT-FM-4: 嵌套/数组行原样显示（不引 YAML）', () => {
    const html = render('---\nlist:\n  - a\n  - b\n---\n');
    expect(html).toContain('<dt>list</dt>');
    expect(html).toContain('frontmatter__raw'); // 缩进数组行原样
  });

  it('CT-FM-5: value 含 `:` 不二次切（仅首个冒号分隔）', () => {
    const html = render('---\nurl: https://example.com\n---\n');
    expect(html).toContain('<dt>url</dt>');
    expect(html).toContain('https://example.com');
  });

  it('CT-FM-6: 空 frontmatter（--- 紧接 ---）不崩', () => {
    const html = render('---\n---\nbody');
    expect(html).toContain('class="frontmatter"');
    expect(html).toContain('body');
  });

  it('CT-FM-7: XSS — frontmatter 值含恶意内容经 sanitize 剥离（AC-v33-5）', () => {
    const html = render('---\ntitle: <script>alert(1)</script>\nx: <img src=y onerror=alert(1)>\n---\n');
    expect(html).toContain('frontmatter');
    expect(html).not.toContain('<script>');
    expect(html).not.toMatch(/<img[^>]+onerror/);
  });
});
