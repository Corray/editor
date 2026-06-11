import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createDocumentState } from '@/modules/m1-editor/state';
import type { DocumentState } from '@/modules/m1-editor/state';
import { createFindController } from '@/modules/m1-editor/find';
import type { FindControllerAPI } from '@/modules/m1-editor/find';

interface Ctx {
  state: DocumentState;
  find: FindControllerAPI;
  ta: HTMLTextAreaElement;
  dispose: () => void;
}

function setup(initial: string): Ctx {
  const ta = document.createElement('textarea');
  document.body.appendChild(ta);
  ta.value = initial;
  // jsdom 同步：textarea 值跟随 state（生产中由 EditorArea 双向绑定承担）
  let state!: DocumentState;
  let find!: FindControllerAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    state = createDocumentState(initial);
    find = createFindController(state, () => ta);
  });
  // fallback 路径派发 input 后写回 state（模拟 EditorArea onInput）
  ta.addEventListener('input', () => state.setText(ta.value));
  return { state, find, ta, dispose };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

// 测试计划 v2.1 §2 查找族 + 替换族
describe('M1 FindController — CT-FIND (AC-v21-1/2)', () => {
  it('CT-FIND-1: 大小写不敏感字面量扫描，不重叠', () => {
    const { find, dispose } = setup('Foo foo FOO fofo');
    find.setQuery('foo');
    expect(find.matches()).toEqual([0, 4, 8]);
    dispose();
  });

  it('CT-FIND-2: 空 query / 无果 → matches 空 + activeIndex=-1', () => {
    const { find, dispose } = setup('hello');
    expect(find.matches()).toEqual([]);
    expect(find.activeIndex()).toBe(-1);
    find.setQuery('zzz');
    expect(find.matches()).toEqual([]);
    expect(find.activeIndex()).toBe(-1);
    dispose();
  });

  it('CT-FIND-3: 有命中 → activeIndex 自动落 0；next/prev 环回', () => {
    const { find, ta, dispose } = setup('a b a b a');
    find.setQuery('a');
    expect(find.activeIndex()).toBe(0);
    find.next();
    expect(find.activeIndex()).toBe(1);
    expect([ta.selectionStart, ta.selectionEnd]).toEqual([4, 5]);
    find.next(); // → 2
    find.next(); // 环回 → 0
    expect(find.activeIndex()).toBe(0);
    find.prev(); // 环回 → 2（尾）
    expect(find.activeIndex()).toBe(2);
    dispose();
  });

  it('CT-FIND-4: 文本变更 → matches 重算 + activeIndex 钳位', () => {
    const { state, find, dispose } = setup('x x x');
    find.setQuery('x');
    find.next();
    find.next();
    expect(find.activeIndex()).toBe(2);
    state.setText('x'); // 3 命中 → 1 命中
    expect(find.matches()).toEqual([0]);
    expect(find.activeIndex()).toBe(0);
    dispose();
  });

  it('CT-FIND-5: replaceCurrent → 替换当前命中并停在下一个', () => {
    const { state, find, dispose } = setup('cat cat cat');
    find.setQuery('cat');
    find.setReplaceText('dog');
    find.replaceCurrent();
    expect(state.text()).toBe('dog cat cat');
    expect(find.matches()).toEqual([4, 8]);
    expect(find.activeIndex()).toBe(0); // 原 index 0 现在指向"下一个"
    dispose();
  });

  it('CT-FIND-6: replaceAll → 全替换一次完成（含大小写混合命中）', () => {
    const { state, find, dispose } = setup('Cat cAt CAT');
    find.setQuery('cat');
    find.setReplaceText('dog');
    find.replaceAll();
    expect(state.text()).toBe('dog dog dog');
    expect(find.matches()).toEqual([]);
    dispose();
  });

  it('CT-FIND-7: 替换词含查找词 → 单次调用不死循环（偏移正确）', () => {
    const { state, find, dispose } = setup('a-a');
    find.setQuery('a');
    find.setReplaceText('aa');
    find.replaceAll();
    expect(state.text()).toBe('aa-aa');
    dispose();
  });

  it('CT-FIND-8: 空替换词 = 删除语义', () => {
    const { state, find, dispose } = setup('foo bar foo');
    find.setQuery('foo');
    find.setReplaceText('');
    find.replaceAll();
    expect(state.text()).toBe(' bar ');
    dispose();
  });

  it('CT-FIND-9: show/hide 状态 + hide 回焦 textarea', () => {
    const { find, ta, dispose } = setup('x');
    expect(find.open()).toBe(false);
    find.show();
    expect(find.open()).toBe(true);
    find.hide();
    expect(find.open()).toBe(false);
    expect(document.activeElement).toBe(ta);
    dispose();
  });
});
