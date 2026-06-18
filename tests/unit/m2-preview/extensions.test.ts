import { describe, it, expect, beforeAll } from 'vitest';
import {
  render,
  hasExtension,
  ensureExtensions,
  extensionsReady,
} from '@/modules/m2-preview/pipeline';

// 测试计划 v3.4 §家族（AC-v34-1~6）。模块级 md 单例 → ensureExtensions 后常驻。
describe('M2 extensions — CT-EXT', () => {
  it('CT-EXT-0a: hasExtension 启发式', () => {
    expect(hasExtension(':smile:')).toBe(true);
    expect(hasExtension('text [^1] ref')).toBe(true);
    expect(hasExtension('H~2~O')).toBe(true);
    expect(hasExtension('x^2^')).toBe(true);
    expect(hasExtension('plain text')).toBe(false);
  });

  it('CT-EXT-0b: 未加载期间含扩展语法 → 降级 raw 不报错（AC-v34-5）', () => {
    if (!extensionsReady()) {
      const html = render('~sub~');
      expect(() => html).not.toThrow();
      expect(html).not.toContain('<sub>'); // 未载 → 不渲染 sub
    }
  });

  describe('加载后渲染', () => {
    beforeAll(async () => {
      await ensureExtensions();
    });

    it('CT-EXT-1: emoji :smile: → emoji 字符（AC-v34-1）', () => {
      const html = render(':smile:');
      expect(html).not.toContain(':smile:'); // 已替换
      expect(html).toContain('😄');
    });

    it('CT-EXT-2: 未知 emoji shortcode → 原样', () => {
      expect(render(':notarealemoji:')).toContain(':notarealemoji:');
    });

    it('CT-EXT-3: 脚注 [^1] + 定义 → ref + footnotes section（AC-v34-2）', () => {
      const html = render('text[^1]\n\n[^1]: the note');
      expect(html).toContain('footnote-ref');
      expect(html).toContain('footnotes');
      expect(html).toContain('the note');
    });

    it('CT-EXT-4: ~sub~ → <sub> / ^sup^ → <sup>（AC-v34-3）', () => {
      expect(render('H~2~O')).toContain('<sub>2</sub>');
      expect(render('x^2^')).toContain('<sup>2</sup>');
    });

    it('CT-EXT-5: XSS — 扩展语法承载恶意内容经 sanitize 剥离（AC-v34-6）', () => {
      const html = render('~<script>alert(1)</script>~');
      expect(html).not.toContain('<script>');
    });

    it('CT-EXT-6: 既有渲染零回归（普通 markdown）', () => {
      expect(render('# Title\n\n**bold**')).toContain('<h1');
      expect(render('**bold**')).toContain('<strong>');
    });
  });
});
