import { describe, it, expect, beforeAll } from 'vitest';
import {
  render,
  hasExtension,
  ensureExtensions,
} from '@/modules/m2-preview/pipeline';
import { i18n } from '@/modules/m7-i18n/i18n';

// 测试计划 v3.5 §家族（AC-v35-1~6）。模块级 md 单例 → ensureExtensions 后常驻。
describe('M2 callout — CT-CALLOUT', () => {
  it('CT-CALLOUT-0: hasExtension 识别 :::', () => {
    expect(hasExtension(':::note\nx\n:::')).toBe(true);
    expect(hasExtension('plain ::: text')).toBe(false); // 非行首
  });

  describe('加载后渲染', () => {
    beforeAll(async () => {
      await ensureExtensions();
    });

    it('CT-CALLOUT-1: 4 类型 → callout--{type}（AC-v35-1）', () => {
      for (const type of ['note', 'tip', 'warning', 'danger']) {
        const html = render(`:::${type}\ncontent\n:::`);
        expect(html, type).toContain(`callout--${type}`);
      }
    });

    it('CT-CALLOUT-2: 自定义标题 → 框顶显该标题（AC-v35-2）', () => {
      const html = render(':::note 注意事项\nbody\n:::');
      expect(html).toContain('注意事项');
    });

    it('CT-CALLOUT-3: 无标题 → 默认类型名（i18n）', () => {
      // jsdom navigator 默认 en-US（PP-006 同源）→ 显式置 zh 验证 i18n 标签
      i18n.setLang('zh-CN');
      expect(render(':::warning\nbody\n:::')).toContain('警告');
      i18n.setLang('en-US');
      expect(render(':::warning\nbody\n:::')).toContain('Warning');
      i18n.setLang('zh-CN'); // 复位
    });

    it('CT-CALLOUT-4: 内部 markdown 正常渲染（AC-v35-3）', () => {
      const html = render(':::tip\n**bold** text\n:::');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('CT-CALLOUT-5: 未知类型 :::foo → 不渲染为 callout（AC-v35-4）', () => {
      const html = render(':::foo\nbody\n:::');
      expect(html).not.toContain('class="callout');
    });

    it('CT-CALLOUT-6: XSS — 标题/内容含恶意经 sanitize 剥离（AC-v35-6）', () => {
      const html = render(':::note <script>alert(1)</script>\n<img src=x onerror=alert(1)>\n:::');
      expect(html).toContain('callout--note');
      expect(html).not.toContain('<script>');
      expect(html).not.toMatch(/<img[^>]+onerror/);
    });
  });
});
