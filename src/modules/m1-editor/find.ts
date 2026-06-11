/**
 * 查找/替换控制器（ADR-017 D2 / TBD-v21-1a/2a）。
 *
 * 匹配 = 字面量 + 大小写不敏感（无开关），对 state.text() 小写化 indexOf 扫描（不重叠）。
 * 跳转 = setSelectionRange + 行号估算 scrollTop 居中（软换行下视觉行≠逻辑行的偏差
 * 与 F-V17-3 同限，接受）。注：textarea 失焦时浏览器不渲染选区高亮 —— 导航期间反馈
 * 靠 n/m 计数 + 滚动；Esc 关闭回焦 textarea 后选区可见。
 * 替换走 replaceRange（undo 保持）；replaceAll 单次全文替换（一步 undo）。
 */
import { createSignal, createMemo, createEffect, type Accessor } from 'solid-js';
import type { DocumentState } from './state';
import { replaceRange } from './edit-text';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';

export interface FindControllerAPI {
  readonly open: Accessor<boolean>;
  readonly query: Accessor<string>;
  readonly replaceText: Accessor<string>;
  /** 命中起点偏移（升序，不重叠） */
  readonly matches: Accessor<number[]>;
  /** 0-based；matches 空时 -1 */
  readonly activeIndex: Accessor<number>;
  show(): void;
  hide(): void;
  setQuery(q: string): void;
  setReplaceText(r: string): void;
  next(): void;
  prev(): void;
  replaceCurrent(): void;
  replaceAll(): void;
}

export function createFindController(
  state: DocumentState,
  ta: () => HTMLTextAreaElement | undefined,
): FindControllerAPI {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal('');
  const [replaceText, setReplaceText] = createSignal('');
  const [activeIndex, setActiveIndex] = createSignal(-1);

  const matches = createMemo<number[]>(() => {
    const q = query().toLowerCase();
    if (!q) return [];
    const text = state.text().toLowerCase();
    const out: number[] = [];
    let i = text.indexOf(q);
    while (i !== -1) {
      out.push(i);
      i = text.indexOf(q, i + q.length); // 不重叠
    }
    return out;
  });

  // 文本/查询变化 → activeIndex 钳位（空=-1；越界回 0..len-1）
  createEffect(() => {
    const len = matches().length;
    setActiveIndex((cur) =>
      len === 0 ? -1 : cur < 0 ? 0 : Math.min(cur, len - 1),
    );
  });

  const jumpTo = (idx: number): void => {
    const el = ta();
    const start = matches()[idx];
    if (!el || start === undefined) return;
    el.setSelectionRange(start, start + query().length);
    // 行号估算滚动居中（逻辑行；软换行偏差接受，同 F-V17-3）
    let line = 0;
    const text = state.text();
    for (let i = text.indexOf('\n'); i !== -1 && i < start; i = text.indexOf('\n', i + 1)) {
      line += 1;
    }
    const cs = getComputedStyle(el);
    let lh = parseFloat(cs.lineHeight);
    if (!Number.isFinite(lh)) lh = (parseFloat(cs.fontSize) || 15) * 1.6;
    el.scrollTop = Math.max(0, line * lh - el.clientHeight / 2);
  };

  const move = (delta: 1 | -1): void => {
    const len = matches().length;
    if (len === 0) return;
    const nextIdx = (activeIndex() + delta + len) % len; // 环回
    setActiveIndex(nextIdx);
    jumpTo(nextIdx);
  };

  return {
    open,
    query,
    replaceText,
    matches,
    activeIndex,
    show: () => setOpen(true),
    hide: () => {
      setOpen(false);
      const el = ta();
      if (el) el.focus(); // 回焦后当前选区可见
    },
    setQuery: (q) => setQuery(q),
    setReplaceText: (r) => setReplaceText(r),
    next: () => move(1),
    prev: () => move(-1),
    replaceCurrent: () => {
      const el = ta();
      const idx = activeIndex();
      const start = matches()[idx];
      if (!el || start === undefined) return;
      const r = replaceText();
      replaceRange(el, start, start + query().length, r, {
        start: start + r.length,
        end: start + r.length,
      });
      // matches 已随文本重算；同 index 即"下一个"（钳位 effect 兜底越界）
      jumpTo(Math.min(idx, matches().length - 1));
    },
    replaceAll: () => {
      const el = ta();
      const list = matches();
      if (!el || list.length === 0) return;
      const text = state.text();
      const qLen = query().length;
      const r = replaceText();
      let out = '';
      let pos = 0;
      for (const start of list) {
        out += text.slice(pos, start) + r;
        pos = start + qLen;
      }
      out += text.slice(pos);
      // 单次全文替换 = 一步 undo
      replaceRange(el, 0, text.length, out, { start: 0, end: 0 });
      toast.show(t('find.replaced').replace('{n}', String(list.length)), 'info');
    },
  };
}
