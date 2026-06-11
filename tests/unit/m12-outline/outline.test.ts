import { describe, it, expect } from 'vitest';
import { parseOutline } from '@/modules/m12-outline/outline';

// 测试计划 v2.2 §2 解析族
describe('M12 parseOutline — CT-OL (AC-v22-1/2/5)', () => {
  it('CT-OL-1: h1~h6 全层级 + 顺序 + line/offset 正确', () => {
    const text = '# A\n\n## B\n### C\n#### D\n##### E\n###### F';
    const items = parseOutline(text);
    expect(items.map((i) => [i.level, i.text, i.line])).toEqual([
      [1, 'A', 0],
      [2, 'B', 2],
      [3, 'C', 3],
      [4, 'D', 4],
      [5, 'E', 5],
      [6, 'F', 6],
    ]);
    expect(items[0]?.offset).toBe(0);
    expect(items[1]?.offset).toBe(5); // '# A\n\n' 之后
  });

  it('CT-OL-2: fenced ``` 内伪标题排除', () => {
    const text = '# real\n```\n# fake\n```\n## real2';
    expect(parseOutline(text).map((i) => i.text)).toEqual(['real', 'real2']);
  });

  it('CT-OL-3: ~~~ 围栏同样排除；``` 块内的 ~~~ 行不闭合该块', () => {
    const text = '~~~\n# fake1\n~~~\n```\n~~~\n# fake2\n```\n# real';
    expect(parseOutline(text).map((i) => i.text)).toEqual(['real']);
  });

  it('CT-OL-4: 未闭合 fence 到文末 → 其后标题全排除', () => {
    const text = '# real\n```\n# fake\n# fake2';
    expect(parseOutline(text).map((i) => i.text)).toEqual(['real']);
  });

  it('CT-OL-5: 前导空格 0~3 收，≥4（缩进代码）不收', () => {
    const text = '   # ok\n    # indented-code';
    const items = parseOutline(text);
    expect(items.map((i) => i.text)).toEqual(['ok']);
  });

  it('CT-OL-6: 尾随闭合 # 剥离；# 后无内容不收；####### (7) 不是标题', () => {
    const text = '## title ##\n#\n# \n####### seven';
    const items = parseOutline(text);
    expect(items.map((i) => [i.level, i.text])).toEqual([[2, 'title']]);
  });

  it('CT-OL-7: 空文档 / 无标题 → 空数组', () => {
    expect(parseOutline('')).toEqual([]);
    expect(parseOutline('plain text\nno headings')).toEqual([]);
  });

  it('CT-OL-8: CRLF 容错（\\r 不进标题文本）', () => {
    const text = '# A\r\n## B\r\n';
    const items = parseOutline(text);
    expect(items.map((i) => i.text)).toEqual(['A', 'B']);
    expect(items[1]?.line).toBe(1);
  });

  it('CT-OL-9: inline `#` 行不误判（# 不在行首语法位）', () => {
    const text = 'text # not heading\n`# code`';
    expect(parseOutline(text)).toEqual([]);
  });

  it('CT-OL-10: offset 可用于光标定位（指向行首）', () => {
    const text = 'abc\n# H';
    const items = parseOutline(text);
    expect(items[0]?.offset).toBe(4);
    expect(text.slice(items[0]!.offset, items[0]!.offset + 3)).toBe('# H');
  });
});
