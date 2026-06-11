import { describe, it, expect, beforeEach } from 'vitest';
import { applyFormat, continueList } from '@/modules/m1-editor/commands';

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
