import { describe, it, expect, beforeAll } from 'vitest';
import {
  render,
  hasExtension,
  ensureExtensions,
} from '@/modules/m2-preview/pipeline';

// 测试计划 v3.6 §家族（AC-v36-1~6）。
describe('M2 mark/ins — CT-MARK', () => {
  it('CT-MARK-0: hasExtension 识别 ==/++', () => {
    expect(hasExtension('==hi==')).toBe(true);
    expect(hasExtension('++hi++')).toBe(true);
    expect(hasExtension('a = b')).toBe(false);
    expect(hasExtension('1 + 2')).toBe(false);
  });

  describe('加载后渲染', () => {
    beforeAll(async () => {
      await ensureExtensions();
    });

    it('CT-MARK-1: ==text== → <mark>（AC-v36-1）', () => {
      expect(render('==highlight==')).toContain('<mark>highlight</mark>');
    });

    it('CT-MARK-2: ++text++ → <ins>（AC-v36-2）', () => {
      expect(render('++inserted++')).toContain('<ins>inserted</ins>');
    });

    it('CT-MARK-3: XSS — ==<script>== 经 sanitize 剥离（AC-v36-5）', () => {
      const html = render('==<script>alert(1)</script>==');
      expect(html).not.toContain('<script>');
    });

    it('CT-MARK-4: 删除线 ~~ 仍核心 <s>（零回归 / AC-v36-6）', () => {
      expect(render('~~struck~~')).toContain('<s>struck</s>');
    });
  });
});
