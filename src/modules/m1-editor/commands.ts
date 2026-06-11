/**
 * 格式快捷键（ADR-017 D3）+ 列表自动延续（D4）。所有写入经 replaceRange（undo 保持）。
 */
import { replaceRange } from './edit-text';

export type FormatKind = 'bold' | 'italic' | 'link';

/**
 * toggle 包裹：①选区自带 marker → 解包；②marker 紧贴选区外侧 → 扩选解包；
 * ③否则包裹。无选区：插入空包裹光标置中。
 * italic（单 `*`）需防误吞 bold 的 `**`：边界恰为 `**`（非 `***`）时不按 italic 解。
 */
function toggleWrap(ta: HTMLTextAreaElement, marker: string): void {
  const value = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const m = marker.length;
  const sel = value.slice(s, e);

  // 防误吞守卫：marker='*' 时，边界若是 bold 的 '**'（而非 italic+bold 的 '***'）则不解
  const boldPairAt = (str: string, isStart: boolean): boolean => {
    if (marker !== '*') return false;
    const two = isStart ? str.startsWith('**') : str.endsWith('**');
    const three = isStart ? str.startsWith('***') : str.endsWith('***');
    return two && !three;
  };

  // ① 选区自带 marker（如选中 `**x**`）
  if (
    sel.length >= 2 * m &&
    sel.startsWith(marker) &&
    sel.endsWith(marker) &&
    !boldPairAt(sel, true) &&
    !boldPairAt(sel, false)
  ) {
    replaceRange(ta, s, e, sel.slice(m, sel.length - m), {
      start: s,
      end: e - 2 * m,
    });
    return;
  }

  // ② marker 紧贴选区外侧（光标在 `**|x|**` 内）
  const left = value.slice(Math.max(0, s - m), s);
  const right = value.slice(e, e + m);
  if (left === marker && right === marker) {
    // italic 守卫：外侧再贴一个 '*'（即实际是 '**' 边界）时不解 —— 除非是 '***'
    const outerLeft = value.slice(Math.max(0, s - m - 1), s - m);
    const outerRight = value.slice(e + m, e + m + 1);
    const isBoldBoundary =
      marker === '*' &&
      (outerLeft === '*' || outerRight === '*') &&
      !(outerLeft === '*' && value.slice(Math.max(0, s - 3), s) === '***');
    if (!isBoldBoundary) {
      replaceRange(ta, s - m, e + m, sel, {
        start: s - m,
        end: e - m,
      });
      return;
    }
  }

  // ③ 包裹；无选区 → 空包裹光标置中
  if (s === e) {
    replaceRange(ta, s, e, marker + marker, { start: s + m, end: s + m });
  } else {
    replaceRange(ta, s, e, marker + sel + marker, {
      start: s + m,
      end: e + m,
    });
  }
}

/** Cmd/Ctrl+K：选区 → `[选区](url)` 且选中 `url` 占位；无选区 no-op（共识 TBD-v21-3a）。 */
function wrapLink(ta: HTMLTextAreaElement): void {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  if (s === e) return;
  const sel = ta.value.slice(s, e);
  const text = `[${sel}](url)`;
  const urlStart = s + sel.length + 3; // [sel]( 之后
  replaceRange(ta, s, e, text, { start: urlStart, end: urlStart + 3 });
}

export function applyFormat(ta: HTMLTextAreaElement, kind: FormatKind): void {
  if (kind === 'bold') toggleWrap(ta, '**');
  else if (kind === 'italic') toggleWrap(ta, '*');
  else wrapLink(ta);
}

/** 列表前缀：`- ` / `* ` / `- [ ] ` / `- [x] ` / `1. `（缩进保留）。 */
const LIST_PREFIX_RE = /^(\s*)(?:([-*]) (?:\[([ x])\] )?|(\d+)\. )/;

/**
 * Enter keydown 编排（ADR-017 D4）：列表行 → 续前缀（数字递增 / checkbox 重置）；
 * 裸前缀空项 → 删前缀退出（不换行）。返回 true = 已处理（调用方 preventDefault）。
 * 调用方必须守 e.isComposing（IME 确认候选词的 Enter 不得拦截）。
 */
export function continueList(ta: HTMLTextAreaElement): boolean {
  const s = ta.selectionStart;
  if (s !== ta.selectionEnd) return false; // 有选区 → 默认 Enter 行为
  const value = ta.value;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const line = value.slice(lineStart, s);
  const m = LIST_PREFIX_RE.exec(line);
  if (!m) return false;

  const [full, indent, bullet, checkbox, num] = m;
  const content = line.slice(full.length);
  const lineEndIdx = value.indexOf('\n', s);
  const restOfLine = value.slice(s, lineEndIdx === -1 ? value.length : lineEndIdx);

  // 裸前缀空项（光标前后均无内容）→ 删前缀退出列表
  if (content.trim() === '' && restOfLine.trim() === '') {
    replaceRange(ta, lineStart, lineStart + full.length, '', {
      start: lineStart,
      end: lineStart,
    });
    return true;
  }

  let prefix: string;
  if (num !== undefined) prefix = `${Number(num) + 1}. `;
  else if (checkbox !== undefined) prefix = `${bullet} [ ] `; // 新行重置未勾
  else prefix = `${bullet} `;

  const inserted = `\n${indent}${prefix}`;
  replaceRange(ta, s, s, inserted, {
    start: s + inserted.length,
    end: s + inserted.length,
  });
  return true;
}
