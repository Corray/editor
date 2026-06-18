import { describe, it, expect } from 'vitest';
import { computeStats, countWords } from '@/modules/m1-editor/wordcount';

// 测试计划 v3.2 §家族（AC-v32-2~6）
describe('M1 computeStats — CT-STATS', () => {
  it('CT-STATS-1: 字符含/不含空格', () => {
    const s = computeStats('a b\tc\n');
    expect(s.charsWithSpaces).toBe(6); // 'a b\tc\n'
    expect(s.charsNoSpaces).toBe(3); // a b c → abc
  });

  it('CT-STATS-2: words/cjk/minutes 与 countWords 完全一致（同输入）', () => {
    const inputs = ['', '你好 world', 'hello world foo', '字'.repeat(800)];
    for (const txt of inputs) {
      const s = computeStats(txt);
      const w = countWords(txt);
      expect([s.words, s.cjk, s.minutes], `input=${txt.slice(0, 10)}`).toEqual([
        w.words,
        w.cjk,
        w.minutes,
      ]);
    }
  });

  it('CT-STATS-3: 标题数（# ~ ######）', () => {
    const s = computeStats('# h1\ntext\n## h2\n### h3\n####### not');
    expect(s.headings).toBe(3); // ####### 7 个井号非标题
  });

  it('CT-STATS-4: 段落数（空行分隔的非空块）', () => {
    expect(computeStats('p1 line1\np1 line2\n\np2\n\n\np3').paragraphs).toBe(3);
    expect(computeStats('single').paragraphs).toBe(1);
    expect(computeStats('\n\n  \n').paragraphs).toBe(0); // 全空白行
  });

  it('CT-STATS-5: 空文档全零', () => {
    expect(computeStats('')).toEqual({
      charsWithSpaces: 0,
      charsNoSpaces: 0,
      words: 0,
      cjk: 0,
      headings: 0,
      paragraphs: 0,
      minutes: 0,
    });
  });

  it('CT-STATS-6: 混排综合', () => {
    const s = computeStats('# 标题\n\n正文 hello world');
    expect(s.headings).toBe(1);
    expect(s.paragraphs).toBe(2);
    expect(s.cjk).toBe(4); // 标题 + 正文 = 标/题/正/文
    expect(s.words).toBe(2); // hello world
  });
});
