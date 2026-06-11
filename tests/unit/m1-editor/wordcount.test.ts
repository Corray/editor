import { describe, it, expect } from 'vitest';
import { countWords, formatWordCount } from '@/modules/m1-editor/wordcount';

const t = (key: string): string =>
  key === 'wordcount.empty' ? '0 字' : '{n} 字 · 约 {m} 分钟';

// 测试计划 v2.1 §2 字数族：空 × 纯 CJK × 纯英文 × 混排 × 仅空白/标点 × <1 分钟
describe('M1 wordcount — CT-WC (AC-v21-6)', () => {
  it('CT-WC-1: 空文档 → 全零 + "0 字"', () => {
    const wc = countWords('');
    expect(wc).toEqual({ cjk: 0, words: 0, minutes: 0 });
    expect(formatWordCount(wc, t)).toBe('0 字');
  });

  it('CT-WC-2: 纯 CJK 逐字计数（不含中文标点）', () => {
    const wc = countWords('你好，世界。');
    expect(wc.cjk).toBe(4); // ，。不计
    expect(wc.words).toBe(0);
  });

  it('CT-WC-3: 纯英文按空白分词（纯标点 token 不计）', () => {
    const wc = countWords('hello world - foo_bar 123 ...');
    expect(wc.cjk).toBe(0);
    expect(wc.words).toBe(4); // hello/world/foo_bar/123；'-' '...' 不计
  });

  it('CT-WC-4: 混排 = CJK 逐字 + 英文分词（紧贴不混）', () => {
    const wc = countWords('用React写hello world组件');
    expect(wc.cjk).toBe(4); // 用/写/组/件
    expect(wc.words).toBe(3); // React / hello / world
  });

  it('CT-WC-5: 仅空白/标点 → 0', () => {
    const wc = countWords('  \n\t ... !!! ');
    expect(wc.cjk + wc.words).toBe(0);
    expect(wc.minutes).toBe(0);
  });

  it('CT-WC-6: 少量内容 → minutes=-1（<1 分钟）且格式化为 "<1"', () => {
    const wc = countWords('你好 world');
    expect(wc.minutes).toBe(-1);
    expect(formatWordCount(wc, t)).toBe('3 字 · 约 <1 分钟');
  });

  it('CT-WC-7: 大量内容 → 分钟四舍五入（800 CJK = 2 分钟）', () => {
    const wc = countWords('字'.repeat(800));
    expect(wc.cjk).toBe(800);
    expect(wc.minutes).toBe(2);
  });

  it('CT-WC-8: 日文假名 / 谚文计入 CJK', () => {
    const wc = countWords('ひらがな한국어');
    expect(wc.cjk).toBe(7);
  });
});
