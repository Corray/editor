import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyFormat,
  continueList,
  indentSelection,
  toggleLinePrefix,
  wrapCodeBlock,
} from '@/modules/m1-editor/commands';

// jsdom 无 document.execCommand → replaceRange 走 fallback（setRangeText+input 事件），
// 顺带覆盖 ADR-017 D1 降级路径；真 execCommand+undo 链路在 e2e ac14 验（AC-v21-7）。
function makeTA(value: string, selStart: number, selEnd = selStart) {
  const ta = document.createElement('textarea');
  document.body.appendChild(ta);
  ta.value = value;
  ta.setSelectionRange(selStart, selEnd);
  return ta;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

// 测试计划 v2.1 §2 快捷键族
describe('M1 applyFormat — CT-FMT (AC-v21-3/4)', () => {
  it('CT-FMT-1: B 有选区 → 包裹 ** 且选区保持内文', () => {
    const ta = makeTA('hello world', 0, 5);
    applyFormat(ta, 'bold');
    expect(ta.value).toBe('**hello** world');
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([2, 7]);
  });

  it('CT-FMT-2: B 选区自带 ** → 解包（toggle）', () => {
    const ta = makeTA('**hello** world', 0, 9);
    applyFormat(ta, 'bold');
    expect(ta.value).toBe('hello world');
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([0, 5]);
  });

  it('CT-FMT-3: B marker 紧贴选区外侧 → 扩选解包', () => {
    const ta = makeTA('**hello** world', 2, 7); // 选中 hello
    applyFormat(ta, 'bold');
    expect(ta.value).toBe('hello world');
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([0, 5]);
  });

  it('CT-FMT-4: B 无选区 → 空包裹光标置中', () => {
    const ta = makeTA('ab', 1);
    applyFormat(ta, 'bold');
    expect(ta.value).toBe('a****b');
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([3, 3]);
  });

  it('CT-FMT-5: I 包裹单 *', () => {
    const ta = makeTA('hello', 0, 5);
    applyFormat(ta, 'italic');
    expect(ta.value).toBe('*hello*');
  });

  it('CT-FMT-6: I 不误吞 B 的 **（bold 内文选中按 I → 包 * 成 ***）', () => {
    const ta = makeTA('**hello**', 2, 7); // 选中 bold 的内文
    applyFormat(ta, 'italic');
    expect(ta.value).toBe('***hello***'); // 加 italic 层，不拆 bold
  });

  it('CT-FMT-7: I 选区自带 ***（bold+italic）→ 解一层 italic', () => {
    const ta = makeTA('***hello***', 0, 11);
    applyFormat(ta, 'italic');
    expect(ta.value).toBe('**hello**');
  });

  it('CT-FMT-8: K 选区 → [sel](url) 且选中 url 占位', () => {
    const ta = makeTA('click here', 0, 5);
    applyFormat(ta, 'link');
    expect(ta.value).toBe('[click](url) here');
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe('url');
  });

  it('CT-FMT-9: K 无选区 → no-op', () => {
    const ta = makeTA('hello', 2);
    applyFormat(ta, 'link');
    expect(ta.value).toBe('hello');
  });
});

// 测试计划 v2.1 §2 列表族
describe('M1 continueList — CT-LIST (AC-v21-5)', () => {
  it('CT-LIST-1: `- ` 行回车 → 续前缀', () => {
    const ta = makeTA('- item', 6);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('- item\n- ');
    expect(ta.selectionStart).toBe(9);
  });

  it('CT-LIST-2: `* ` 行 → 续 * 前缀', () => {
    const ta = makeTA('* item', 6);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('* item\n* ');
  });

  it('CT-LIST-3: `1. ` 行 → 数字递增', () => {
    const ta = makeTA('1. first', 8);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('1. first\n2. ');
  });

  it('CT-LIST-4: `- [x] ` 行 → 新行重置 `- [ ] `', () => {
    const ta = makeTA('- [x] done', 10);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('- [x] done\n- [ ] ');
  });

  it('CT-LIST-5: 缩进保留', () => {
    const ta = makeTA('  - nested', 10);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('  - nested\n  - ');
  });

  it('CT-LIST-6: 裸前缀空项 → 删前缀退出（不换行）', () => {
    const ta = makeTA('- item\n- ', 9);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('- item\n');
    expect(ta.selectionStart).toBe(7);
  });

  it('CT-LIST-7: 非列表行 → 返回 false 不处理', () => {
    const ta = makeTA('plain text', 10);
    expect(continueList(ta)).toBe(false);
    expect(ta.value).toBe('plain text');
  });

  it('CT-LIST-8: 有选区 → 返回 false（默认 Enter 替换选区）', () => {
    const ta = makeTA('- item', 2, 6);
    expect(continueList(ta)).toBe(false);
  });

  it('CT-LIST-9: 光标在行中 → 在光标处断行并续前缀', () => {
    const ta = makeTA('- ab', 3); // 光标在 a 后
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('- a\n- b');
  });

  it('CT-LIST-10: 数字多位递增（9 → 10）', () => {
    const ta = makeTA('9. nine', 7);
    expect(continueList(ta)).toBe(true);
    expect(ta.value).toBe('9. nine\n10. ');
  });
});

// 测试计划 v2.4 §家族 缩进族
describe('M1 indentSelection — CT-IND (AC-v24-1/2)', () => {
  it('CT-IND-1: 单光标 Tab → 光标处插 2 空格', () => {
    const ta = makeTA('ab', 1);
    indentSelection(ta, false);
    expect(ta.value).toBe('a  b');
    expect(ta.selectionStart).toBe(3);
  });

  it('CT-IND-2: 单光标 Shift+Tab → 当前行行首删 2 空格（光标随移）', () => {
    const ta = makeTA('  ab', 4);
    indentSelection(ta, true);
    expect(ta.value).toBe('ab');
    expect(ta.selectionStart).toBe(2);
  });

  it('CT-IND-3: dedent 只有 1 空格 → 删尽 1', () => {
    const ta = makeTA(' ab', 3);
    indentSelection(ta, true);
    expect(ta.value).toBe('ab');
  });

  it('CT-IND-4: dedent 无缩进 → no-op（不污染 undo 栈）', () => {
    const ta = makeTA('ab', 2);
    indentSelection(ta, true);
    expect(ta.value).toBe('ab');
  });

  it('CT-IND-5: 多行选区 Tab → 每行 +2 空格，选区保持覆盖', () => {
    const ta = makeTA('aa\nbb\ncc', 0, 8);
    indentSelection(ta, false);
    expect(ta.value).toBe('  aa\n  bb\n  cc');
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toContain('cc');
    expect(ta.selectionStart).toBe(2); // 首行内容起点
    expect(ta.selectionEnd).toBe(14);
  });

  it('CT-IND-6: 多行选区 Shift+Tab → 每行 −2，混合缩进各删其有', () => {
    const ta = makeTA('  aa\n bb\ncc', 0, 11);
    indentSelection(ta, true);
    expect(ta.value).toBe('aa\nbb\ncc');
  });

  it('CT-IND-7: 选区跨部分行（中间起点/终点）→ 仍按整行处理', () => {
    const ta = makeTA('aa\nbb\ncc', 4, 7); // b 中间到 c 中间
    indentSelection(ta, false);
    expect(ta.value).toBe('aa\n  bb\n  cc');
  });
});

// 测试计划 v2.7 §家族 包裹族（行内代码 / AC-v27-1）
describe('M1 applyFormat code — CT-CODE (AC-v27-1)', () => {
  it('CT-CODE-1: 选区包裹 `', () => {
    const ta = makeTA('let x', 0, 5);
    applyFormat(ta, 'code');
    expect(ta.value).toBe('`let x`');
  });
  it('CT-CODE-2: 选区自带 ` → 解包（toggle）', () => {
    const ta = makeTA('`code`', 0, 6);
    applyFormat(ta, 'code');
    expect(ta.value).toBe('code');
  });
  it('CT-CODE-3: 无选区 → 空包裹光标置中', () => {
    const ta = makeTA('ab', 1);
    applyFormat(ta, 'code');
    expect(ta.value).toBe('a``b');
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([2, 2]);
  });
});

// 测试计划 v2.7 §家族 行前缀族（AC-v27-3/4）
describe('M1 toggleLinePrefix — CT-LP (AC-v27-3/4)', () => {
  it('CT-LP-1: 单行加引用前缀', () => {
    const ta = makeTA('hello', 0);
    toggleLinePrefix(ta, 'quote');
    expect(ta.value).toBe('> hello');
  });
  it('CT-LP-2: 多行整体加无序前缀', () => {
    const ta = makeTA('a\nb\nc', 0, 5);
    toggleLinePrefix(ta, 'ul');
    expect(ta.value).toBe('- a\n- b\n- c');
  });
  it('CT-LP-3: 有序列表逐行递增', () => {
    const ta = makeTA('a\nb\nc', 0, 5);
    toggleLinePrefix(ta, 'ol');
    expect(ta.value).toBe('1. a\n2. b\n3. c');
  });
  it('CT-LP-4: toggle — 选中行全带引用前缀 → 去除', () => {
    const ta = makeTA('> a\n> b', 0, 7);
    toggleLinePrefix(ta, 'quote');
    expect(ta.value).toBe('a\nb');
  });
  it('CT-LP-5: 部分带前缀 → 补齐为加（不双重前缀）', () => {
    const ta = makeTA('- a\nb', 0, 5);
    toggleLinePrefix(ta, 'ul');
    expect(ta.value).toBe('- a\n- b'); // 已带的不变 `- - a`
  });
  it('CT-LP-6: ol toggle 去除（任意数字前缀）', () => {
    const ta = makeTA('1. a\n2. b', 0, 8);
    toggleLinePrefix(ta, 'ol');
    expect(ta.value).toBe('a\nb');
  });
});

// 测试计划 v2.7 §家族 围栏族（AC-v27-5）
describe('M1 wrapCodeBlock — CT-CB (AC-v27-5)', () => {
  it('CT-CB-1: 选区包进 ``` 围栏', () => {
    const ta = makeTA('const x = 1;', 0, 12);
    wrapCodeBlock(ta);
    expect(ta.value).toBe('```\nconst x = 1;\n```');
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe('const x = 1;');
  });
  it('CT-CB-2: 无选区 → 空围栏光标置内空行', () => {
    const ta = makeTA('', 0);
    wrapCodeBlock(ta);
    expect(ta.value).toBe('```\n\n```');
    expect(ta.selectionStart).toBe(4); // ```\n 之后
  });
});
